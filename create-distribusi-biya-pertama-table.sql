-- Create and populate denormalized distribusi_biaya_pertama table from normalized data
-- This script assumes create-distribusi-biya-pertama-backend.sql has been applied,
-- providing: distribusi_biaya_pertama_norm, get_dasar_alokasi_field, v_biaya_tahunan_preferensi,
-- and recalculate_distribusi_biaya_pertama(user_id, tahun)

DO $$ BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'rebuild_distribusi_biaya_pertama_table';
  IF FOUND THEN
    -- keep existing definition, will be replaced below
    NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rebuild_distribusi_biaya_pertama_table(
  p_tahun INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  v_sql TEXT;
  v_cols TEXT := '';
  v_insert_cols TEXT := '';
  v_select_sum_cols TEXT := '';
BEGIN
  -- Drop and recreate denormalized table with dynamic UK columns based on current unit_kerja list
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'distribusi_biaya_pertama'
  ) THEN
    EXECUTE 'DROP TABLE public.distribusi_biaya_pertama';
  END IF;

  -- Build dynamic column list: ukXYZ_slugified_name BIGINT
  FOR rec IN (
    SELECT kode,
           lower(replace(regexp_replace(nama, '[^a-zA-Z0-9]+', '_', 'g'), '__', '_')) AS slug
    FROM public.unit_kerja
    ORDER BY kode
  ) LOOP
    v_cols := v_cols || format(', %I BIGINT DEFAULT 0', lower(rec.kode) || '_' || rec.slug);
    v_insert_cols := v_insert_cols || format(', %I', lower(rec.kode) || '_' || rec.slug);
    v_select_sum_cols := v_select_sum_cols || format(', ROUND(SUM(CASE WHEN target_kode = %L THEN alokasi ELSE 0 END)::numeric, 0)::BIGINT AS %I', rec.kode, lower(rec.kode) || '_' || rec.slug);
  END LOOP;

  v_sql := 'CREATE TABLE public.distribusi_biaya_pertama (
    id BIGSERIAL PRIMARY KEY,
    unit_kerja_pusat_biaya TEXT NOT NULL,
    biaya_tahunan BIGINT NOT NULL DEFAULT 0,
    dasar_alokasi TEXT NOT NULL,
    tahun INT NOT NULL' || v_cols || ',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )';
  EXECUTE v_sql;

  -- Indexes for faster lookups
  EXECUTE 'CREATE INDEX idx_dbp1_tahun ON public.distribusi_biaya_pertama(tahun)';
  EXECUTE 'CREATE INDEX idx_dbp1_uk ON public.distribusi_biaya_pertama(unit_kerja_pusat_biaya)';

  -- Populate by pivoting from normalized table for the requested year
  v_sql := 'INSERT INTO public.distribusi_biaya_pertama (
      unit_kerja_pusat_biaya, biaya_tahunan, dasar_alokasi, tahun' || v_insert_cols || '
    )
    SELECT
      CONCAT(pusat_kode, '' - '', pusat_nama) AS unit_kerja_pusat_biaya,
      ROUND(biaya_tahunan::numeric, 0)::BIGINT AS biaya_tahunan,
      dasar_alokasi,
      tahun' || v_select_sum_cols || '
    FROM public.distribusi_biaya_pertama_norm
    WHERE tahun = ' || p_tahun || '
    GROUP BY tahun, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan
    ORDER BY pusat_kode';

  EXECUTE v_sql;
END;
$$;

COMMENT ON FUNCTION public.rebuild_distribusi_biaya_pertama_table(INT) IS
'Rebuilds the denormalized distribusi_biaya_pertama table with dynamic columns for each unit_kerja, and populates it by pivoting from distribusi_biaya_pertama_norm for the given year.';


