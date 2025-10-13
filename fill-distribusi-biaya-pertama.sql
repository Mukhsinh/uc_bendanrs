-- Recalculate and fill existing distribusi_biaya_pertama table exactly per rules
-- This does NOT create new tables. It relies on:
--  - distribusi_biaya_pertama (existing, denormalized with many UK columns)
--  - distribusi_biaya_pertama_norm (normalized rows) from recalculate_distribusi_biaya_pertama()
--  - get_dasar_alokasi_field() and v_biaya_tahunan_preferensi or preference logic
-- Helper to recompute distribusi biaya pertama for a given user and year,
-- then rebuild the denormalized pivot table and show UK028 row for verification
DO $$
DECLARE
  v_user UUID := (SELECT user_id FROM data_biaya ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1);
  v_tahun INT := 2025;
BEGIN
  PERFORM public.recalculate_distribusi_biaya_pertama(v_user, v_tahun);
  PERFORM public.rebuild_distribusi_biaya_pertama_table(v_tahun);
END $$;

-- Show UK028 Unit IT row and distribution totals
SELECT *
FROM public.distribusi_biaya_pertama
WHERE tahun = 2025 AND unit_kerja_pusat_biaya ILIKE 'UK028%IT%';

-- Quick summary check of normalized totals vs biaya_tahunan
SELECT * FROM public.v_distribusi_biaya_pertama_summary
WHERE tahun = 2025 AND pusat_kode = 'UK028';
CREATE OR REPLACE FUNCTION public.recalculate_and_fill_distribusi_biaya_pertama(
  p_user_id UUID,
  p_tahun INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_rows BIGINT := 0;
  v_msg TEXT := 'OK';
  rec_pusat RECORD;
  rec_col RECORD;
  v_cols TEXT := '';
  v_vals TEXT := '';
  v_sql TEXT;
  v_ket TEXT;
  v_basis TEXT;
  v_biaya NUMERIC(15,2);
BEGIN
  -- Ensure target table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='distribusi_biaya_pertama'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Tabel distribusi_biaya_pertama tidak ditemukan');
  END IF;

  -- Recalculate normalized rows using the backend function (ensures preference-applied biaya)
  PERFORM public.recalculate_distribusi_biaya_pertama(p_user_id, p_tahun);

  -- Clear existing year rows to be rebuilt
  EXECUTE 'DELETE FROM public.distribusi_biaya_pertama WHERE tahun = $1' USING p_tahun;

  -- Iterate each pusat row (one row per pusat in normalized table)
  FOR rec_pusat IN (
    SELECT tahun, pusat_unit_kerja_id, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan
    FROM public.distribusi_biaya_pertama_norm
    WHERE tahun = p_tahun
    GROUP BY tahun, pusat_unit_kerja_id, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan
    ORDER BY pusat_kode
  ) LOOP
    v_basis := rec_pusat.dasar_alokasi;
    v_biaya := rec_pusat.biaya_tahunan;
    v_ket := CASE v_basis
               WHEN 'Total_SDM' THEN 'Basis: Jumlah SDM Semua UK (kecuali sumber)'
               WHEN 'Total_Kunjungan_Pasien' THEN 'Basis: Total Kunjungan Pasien Semua UK (kecuali sumber)'
               WHEN 'Luas_Ruangan' THEN 'Basis: Luas Ruangan Semua UK (kecuali sumber)'
               WHEN 'Komputer_simrs_user' THEN 'Basis: Komputer SIMRS User Semua UK (kecuali sumber)'
               ELSE 'Basis: ' || COALESCE(v_basis,'-') || ' Semua UK (kecuali sumber)'
             END;

    -- Start common columns that often appear in the table
    v_cols := '';
    v_vals := '';

    -- Helper to conditionally add a column if it exists in the table
    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='unit_kerja_pusat_biaya';
    IF FOUND THEN
      v_cols := v_cols || ', unit_kerja_pusat_biaya';
      v_vals := v_vals || format(', %L', rec_pusat.pusat_kode || ' - ' || rec_pusat.pusat_nama);
    END IF;

    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='kode_unit_kerja';
    IF FOUND THEN
      v_cols := v_cols || ', kode_unit_kerja';
      v_vals := v_vals || format(', %L', rec_pusat.pusat_kode);
    END IF;

    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='nama_unit_kerja';
    IF FOUND THEN
      v_cols := v_cols || ', nama_unit_kerja';
      v_vals := v_vals || format(', %L', rec_pusat.pusat_nama);
    END IF;

    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='user_id';
    IF FOUND THEN
      v_cols := v_cols || ', user_id';
      v_vals := v_vals || format(', %L', p_user_id::text);
    END IF;

    -- mandatory fields
    v_cols := v_cols || ', biaya_tahunan, dasar_alokasi, tahun, keterangan';
    v_vals := v_vals || format(', %s, %L, %s, %L', to_char(ROUND(v_biaya,2),'FM9999999999990D00'), v_basis, p_tahun, v_ket);

    -- Add all unit columns that exist in the table; set values from normalized table
    FOR rec_col IN (
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='distribusi_biaya_pertama'
        AND column_name LIKE 'uk%'
      ORDER BY column_name
    ) LOOP
      v_cols := v_cols || ', ' || quote_ident(rec_col.column_name);
      v_vals := v_vals || ', COALESCE((
        SELECT ROUND(SUM(n.alokasi)::numeric,2)
        FROM public.distribusi_biaya_pertama_norm n
        WHERE n.tahun = rec_pusat.tahun
          AND n.pusat_unit_kerja_id = rec_pusat.pusat_unit_kerja_id
          AND lower(replace(n.target_kode, '' '', ''_'')) = lower(split_part(rec_col.column_name, ''_'', 1))
      ), 0)';
    END LOOP;

    -- Build and execute insert
    v_sql := 'INSERT INTO public.distribusi_biaya_pertama (' || substring(v_cols from 3) || ') VALUES (' || substring(v_vals from 3) || ')';
    EXECUTE v_sql;
    v_rows := v_rows + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'inserted_rows', v_rows, 'message', v_msg);
END;
$$;

COMMENT ON FUNCTION public.recalculate_and_fill_distribusi_biaya_pertama(UUID, INT) IS
'Recalculates normalized distribution and fills existing distribusi_biaya_pertama table for the year, mapping to existing UK columns and writing keterangan and biaya per user preference.';


