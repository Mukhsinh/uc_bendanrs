-- Backend implementation for Distribusi Biaya Pertama (stage-1 distribution)
-- Focus: correct relations to unit_kerja, biaya preference, and allocation bases

-- 1) Helper: ensure preference view exists (used to source biaya_tahunan)
--    If the project already created this view elsewhere, this is idempotent.
CREATE OR REPLACE VIEW public.v_biaya_tahunan_preferensi AS
WITH pref AS (
  SELECT bp.user_id,
         bp.biaya_type,
         ROW_NUMBER() OVER (
           PARTITION BY bp.user_id
           ORDER BY bp.updated_at DESC NULLS LAST, bp.created_at DESC NULLS LAST
         ) AS rn
  FROM public.biaya_preference bp
)
SELECT
  db.user_id,
  db.tahun,
  db.unit_kerja_id,
  uk.kode AS kode_unit_kerja,
  uk.nama AS nama_unit_kerja,
  CASE WHEN COALESCE(p.biaya_type, 'total_biaya') = 'total_biaya'
       THEN COALESCE(db.total_biaya, 0)
       ELSE COALESCE(db.total_biaya_tanpa_jp, 0)
  END AS biaya_tahunan
FROM public.data_biaya db
LEFT JOIN public.unit_kerja uk ON uk.id = db.unit_kerja_id
LEFT JOIN pref p ON p.user_id = db.user_id AND p.rn = 1;

-- 2) Helper view: Total SDM per unit per tahun (fallback if no transpose table)
CREATE OR REPLACE VIEW public.v_total_sdm_per_unit AS
SELECT
  dk.unit_kerja_id,
  uk.kode AS kode_unit_kerja,
  uk.nama AS nama_unit_kerja,
  dk.tahun,
  COALESCE(dk."SDM_Dr",0) + COALESCE(dk."SDM_Prwt",0) + COALESCE(dk."SDM_Non",0) AS total_sdm
FROM public."Data_Kegiatan" dk
LEFT JOIN public.unit_kerja uk ON uk.id = dk.unit_kerja_id;

-- 3) Normalized result table for stage-1 distribution
CREATE TABLE IF NOT EXISTS public.distribusi_biaya_pertama_norm (
  id BIGSERIAL PRIMARY KEY,
  tahun INTEGER NOT NULL,
  pusat_unit_kerja_id UUID NOT NULL,
  pusat_kode TEXT NOT NULL,
  pusat_nama TEXT NOT NULL,
  dasar_alokasi TEXT NOT NULL,
  biaya_tahunan NUMERIC(15,2) NOT NULL DEFAULT 0,
  target_unit_kerja_id UUID NOT NULL,
  target_kode TEXT NOT NULL,
  target_nama TEXT NOT NULL,
  alokasi NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dbp1_norm_tahun ON public.distribusi_biaya_pertama_norm(tahun);
CREATE INDEX IF NOT EXISTS idx_dbp1_norm_pusat ON public.distribusi_biaya_pertama_norm(pusat_unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_dbp1_norm_target ON public.distribusi_biaya_pertama_norm(target_unit_kerja_id);

-- 4) Helper function: return dasar alokasi field for a unit by its name
CREATE OR REPLACE FUNCTION public.get_dasar_alokasi_field(nama_unit TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mapping minimal sesuai dokumentasi yang ada
  IF nama_unit ILIKE '%Direktur%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Komite PPI%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Komite PMKP%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Komite Medik%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Akreditasi%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Dewan Pengawas%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Bid Pengembangan%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Seksi penunjang%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%IPSRS%' THEN RETURN 'Luas_Ruangan'; END IF;
  IF nama_unit ILIKE '%Bid Keperawatan%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Seksi asuhan%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Seksi pengembangan%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Bid Pelayanan Medis%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Seksi pelayanan%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%TPPRJ%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%TPPRI%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Tata Usaha%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Subag Keuangan%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Perbendaharaan%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Pendapatan%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Akuntansi dan Verifikasi%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Akuntansi Manajemen%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Analis Biaya%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%umpeg%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Staf Umum%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Unit IT%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Rumah Tangga%' THEN RETURN 'Total_SDM'; END IF;
  IF nama_unit ILIKE '%Cleaning%' THEN RETURN 'Luas_Ruangan'; END IF;
  IF nama_unit ILIKE '%Security%' THEN RETURN 'Luas_Ruangan'; END IF;
  IF nama_unit ILIKE '%Unit Aset%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Instalasi Humas%' THEN RETURN 'Total_Kunjungan_Pasien'; END IF;
  IF nama_unit ILIKE '%Rekam Medik%' THEN RETURN 'Total_SDM'; END IF;
  -- Default fallback
  RETURN 'Total_SDM';
END;
$$;

-- 5) Main function: calculate first-stage distribution into normalized table
CREATE OR REPLACE FUNCTION public.recalculate_distribusi_biaya_pertama(
  p_user_id UUID,
  p_tahun INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  r_pusat RECORD;
  r_target RECORD;
  v_basis TEXT;
  v_biaya NUMERIC(15,2);
  v_denominator NUMERIC(20,6);
  v_pusat_basis_value NUMERIC(20,6);
  v_target_basis_value NUMERIC(20,6);
  v_inserted BIGINT := 0;
BEGIN
  -- Clear existing rows for year
  DELETE FROM public.distribusi_biaya_pertama_norm WHERE tahun = p_tahun;

  -- Iterate pusat biaya units (kategori Pusat Biaya), ordered by kode
  FOR r_pusat IN
    SELECT uk.id AS unit_id, uk.kode, uk.nama, uk.kategori
    FROM public.unit_kerja uk
    WHERE uk.kategori = 'Pusat Biaya'
    ORDER BY uk.kode
  LOOP
    -- Get biaya tahunan for this pusat according to user preference
    SELECT COALESCE(v.biaya_tahunan, 0)
      INTO v_biaya
    FROM public.v_biaya_tahunan_preferensi v
    WHERE v.user_id = p_user_id AND v.tahun = p_tahun AND v.unit_kerja_id = r_pusat.unit_id;

    -- Determine dasar alokasi field
    v_basis := public.get_dasar_alokasi_field(r_pusat.nama);

    -- Compute denominator and pusat value based on basis
    IF v_basis = 'Total_SDM' THEN
      SELECT COALESCE(SUM(total_sdm), 0)
        INTO v_denominator
      FROM public.v_total_sdm_per_unit
      WHERE tahun = p_tahun;

      SELECT COALESCE(total_sdm, 0)
        INTO v_pusat_basis_value
      FROM public.v_total_sdm_per_unit
      WHERE tahun = p_tahun AND unit_kerja_id = r_pusat.unit_id;

    ELSIF v_basis = 'Luas_Ruangan' THEN
      SELECT COALESCE(SUM(uk.luas_ruangan), 0)
        INTO v_denominator
      FROM public.unit_kerja uk;

      SELECT COALESCE(uk.luas_ruangan, 0)
        INTO v_pusat_basis_value
      FROM public.unit_kerja uk
      WHERE uk.id = r_pusat.unit_id;

    ELSIF v_basis = 'Total_Kunjungan_Pasien' THEN
      SELECT COALESCE(SUM(dk."Kunjungan_jml_pasien_Total"), 0)
        INTO v_denominator
      FROM public."Data_Kegiatan" dk
      WHERE dk.tahun = p_tahun;

      SELECT COALESCE(dk."Kunjungan_jml_pasien_Total", 0)
        INTO v_pusat_basis_value
      FROM public."Data_Kegiatan" dk
      WHERE dk.tahun = p_tahun AND dk.unit_kerja_id = r_pusat.unit_id;

    ELSIF v_basis = 'Komputer_simrs_user' THEN
      SELECT COALESCE(SUM(dk."Komputer_SIMRS_jml_User"), 0)
        INTO v_denominator
      FROM public."Data_Kegiatan" dk
      WHERE dk.tahun = p_tahun;

      SELECT COALESCE(dk."Komputer_SIMRS_jml_User", 0)
        INTO v_pusat_basis_value
      FROM public."Data_Kegiatan" dk
      WHERE dk.tahun = p_tahun AND dk.unit_kerja_id = r_pusat.unit_id;

    ELSE
      -- Unsupported basis in this function: treat as zero to avoid division by zero
      v_denominator := 0;
      v_pusat_basis_value := 0;
    END IF;

    -- Exclude self from denominator per rule
    v_denominator := COALESCE(v_denominator, 0) - COALESCE(v_pusat_basis_value, 0);

    -- Avoid division by zero
    IF v_denominator <= 0 OR v_biaya = 0 THEN
      CONTINUE;
    END IF;

    -- Iterate targets (all units), compute proportional allocation, zero to self
    FOR r_target IN
      SELECT uk.id AS unit_id, uk.kode, uk.nama
      FROM public.unit_kerja uk
      ORDER BY uk.kode
    LOOP
      IF r_target.unit_id = r_pusat.unit_id THEN
        v_target_basis_value := 0; -- self gets zero
      ELSE
        IF v_basis = 'Total_SDM' THEN
          SELECT COALESCE(total_sdm, 0)
            INTO v_target_basis_value
          FROM public.v_total_sdm_per_unit
          WHERE tahun = p_tahun AND unit_kerja_id = r_target.unit_id;
        ELSIF v_basis = 'Luas_Ruangan' THEN
          SELECT COALESCE(uk.luas_ruangan, 0)
            INTO v_target_basis_value
          FROM public.unit_kerja uk
          WHERE uk.id = r_target.unit_id;
        ELSIF v_basis = 'Total_Kunjungan_Pasien' THEN
          SELECT COALESCE(dk."Kunjungan_jml_pasien_Total", 0)
            INTO v_target_basis_value
          FROM public."Data_Kegiatan" dk
          WHERE dk.tahun = p_tahun AND dk.unit_kerja_id = r_target.unit_id;
        ELSIF v_basis = 'Komputer_simrs_user' THEN
          SELECT COALESCE(dk."Komputer_SIMRS_jml_User", 0)
            INTO v_target_basis_value
          FROM public."Data_Kegiatan" dk
          WHERE dk.tahun = p_tahun AND dk.unit_kerja_id = r_target.unit_id;
        ELSE
          v_target_basis_value := 0;
        END IF;
      END IF;

      INSERT INTO public.distribusi_biaya_pertama_norm (
        tahun, pusat_unit_kerja_id, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan,
        target_unit_kerja_id, target_kode, target_nama, alokasi
      ) VALUES (
        p_tahun, r_pusat.unit_id, r_pusat.kode, r_pusat.nama, v_basis, ROUND(v_biaya, 2),
        r_target.unit_id, r_target.kode, r_target.nama,
        CASE WHEN r_target.unit_id = r_pusat.unit_id THEN 0
             ELSE ROUND( (v_target_basis_value / NULLIF(v_denominator,0)) * v_biaya, 2)
        END
      );
      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  RETURN json_build_object('success', true, 'rows', v_inserted);
END;
$$;

-- 6) Convenience view: row summary per pusat to quickly verify totals equal biaya_tahunan
CREATE OR REPLACE VIEW public.v_distribusi_biaya_pertama_summary AS
SELECT
  tahun,
  pusat_unit_kerja_id,
  pusat_kode,
  pusat_nama,
  dasar_alokasi,
  biaya_tahunan,
  SUM(alokasi) AS total_terdistribusi,
  ROUND( (biaya_tahunan - SUM(alokasi))::numeric, 2) AS selisih
FROM public.distribusi_biaya_pertama_norm
GROUP BY tahun, pusat_unit_kerja_id, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan;


