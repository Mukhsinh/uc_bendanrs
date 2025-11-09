-- Backend implementation for Distribusi Biaya Pertama (stage-1 distribution)
-- Focus: correct relations to unit_kerja, biaya preference, and allocation bases

-- 1) Helper: ensure preference view exists (used to source biaya_tahunan)
--    PERUBAHAN: Hanya menggunakan total_biaya_tanpa_jp sesuai permintaan user
--    If the project already created this view elsewhere, this is idempotent.
CREATE OR REPLACE VIEW public.v_biaya_tahunan_preferensi AS
SELECT
  db.user_id,
  db.tahun,
  db.unit_kerja_id,
  uk.kode AS kode_unit_kerja,
  uk.nama AS nama_unit_kerja,
  -- Hanya menggunakan total_biaya_tanpa_jp dari data_biaya
  COALESCE(db.total_biaya_tanpa_jp, 0) AS biaya_tahunan
FROM public.data_biaya db
LEFT JOIN public.unit_kerja uk ON uk.id = db.unit_kerja_id;

-- 2) Helper view: Total SDM per unit per tahun (fallback if no transpose table)
CREATE OR REPLACE VIEW public.v_total_sdm_per_unit AS
SELECT
  uk.id AS unit_kerja_id,
  uk.kode AS kode_unit_kerja,
  uk.nama AS nama_unit_kerja,
  dk.tahun,
  COALESCE(dk."SDM_dokter",0) + COALESCE(dk."SDM_Perawat",0) + COALESCE(dk."SDM_Non",0) AS total_sdm
FROM public.unit_kerja uk
LEFT JOIN public.data_kegiatan dk ON uk.kode = dk."Kode_UK";

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

-- 4a) Helper function: get nilai dari data_kegiatan_transpose berdasarkan kode unit kerja dan dasar alokasi
CREATE OR REPLACE FUNCTION public.get_dasar_alokasi_value_from_transpose(
  p_kode_unit_kerja TEXT,
  p_tahun INT,
  p_dasar_alokasi TEXT  -- 'SDM' atau 'Kunjungan'
)
RETURNS NUMERIC(20,6)
LANGUAGE plpgsql
AS $$
DECLARE
  v_column_name TEXT;
  v_result NUMERIC(20,6);
  v_sql TEXT;
BEGIN
  -- Get column name from mapping
  SELECT ucm.column_name INTO v_column_name
  FROM public.unit_kerja_column_mapping ucm
  WHERE ucm.unit_kerja_kode = p_kode_unit_kerja
  LIMIT 1;

  IF v_column_name IS NULL THEN
    RETURN 0;
  END IF;

  -- Build dynamic SQL to get value from data_kegiatan_transpose
  v_sql := format('
    SELECT COALESCE(%I, 0)
    FROM public.data_kegiatan_transpose
    WHERE tahun = %s
      AND dasar_alokasi = %L
      AND sub_kategori = ''Total''
    LIMIT 1
  ', v_column_name, p_tahun, p_dasar_alokasi);

  EXECUTE v_sql INTO v_result;
  
  RETURN COALESCE(v_result, 0);
END;
$$;

-- 5) Main function: calculate first-stage distribution into normalized table
CREATE OR REPLACE FUNCTION public.recalculate_distribusi_biaya_pertama(
  p_user_id UUID,
  p_tahun INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Penting: Jalankan dengan hak akses owner fungsi (bypass RLS)
SET search_path = public
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
    -- Initialize to 0 in case row doesn't exist
    v_biaya := 0;
    SELECT COALESCE(v.biaya_tahunan, 0)
      INTO v_biaya
    FROM public.v_biaya_tahunan_preferensi v
    WHERE v.user_id = p_user_id AND v.tahun = p_tahun AND v.unit_kerja_id = r_pusat.unit_id;
    
    -- Ensure v_biaya is not NULL (in case row doesn't exist)
    v_biaya := COALESCE(v_biaya, 0);

    -- Determine dasar alokasi field
    v_basis := public.get_dasar_alokasi_field(r_pusat.nama);

    -- Compute denominator and pusat value based on basis
    IF v_basis = 'Total_SDM' THEN
      -- Mengambil total dari data_kegiatan_transpose: baris SDM dan sub_kategori Total
      SELECT COALESCE(dkt.total_dasar_alokasi, 0)
        INTO v_denominator
      FROM public.data_kegiatan_transpose dkt
      WHERE dkt.tahun = p_tahun 
        AND dkt.dasar_alokasi = 'SDM' 
        AND dkt.sub_kategori = 'Total'
      LIMIT 1;

      -- Ambil nilai untuk unit pusat menggunakan helper function
      v_pusat_basis_value := public.get_dasar_alokasi_value_from_transpose(r_pusat.kode, p_tahun, 'SDM');

    ELSIF v_basis = 'Luas_Ruangan' THEN
      SELECT COALESCE(SUM(uk.luas_ruangan), 0)
        INTO v_denominator
      FROM public.unit_kerja uk;

      SELECT COALESCE(uk.luas_ruangan, 0)
        INTO v_pusat_basis_value
      FROM public.unit_kerja uk
      WHERE uk.id = r_pusat.unit_id;

    ELSIF v_basis = 'Total_Kunjungan_Pasien' THEN
      -- Mengambil total dari data_kegiatan_transpose: baris Kunjungan dan sub_kategori Total
      SELECT COALESCE(dkt.total_dasar_alokasi, 0)
        INTO v_denominator
      FROM public.data_kegiatan_transpose dkt
      WHERE dkt.tahun = p_tahun 
        AND dkt.dasar_alokasi = 'Kunjungan' 
        AND dkt.sub_kategori = 'Total'
      LIMIT 1;

      -- Ambil nilai untuk unit pusat menggunakan helper function
      v_pusat_basis_value := public.get_dasar_alokasi_value_from_transpose(r_pusat.kode, p_tahun, 'Kunjungan');

    ELSIF v_basis = 'Komputer_simrs_user' THEN
      SELECT COALESCE(SUM(dk."Komputer_simrs_user"), 0)
        INTO v_denominator
      FROM public.data_kegiatan dk
      WHERE dk.tahun = p_tahun;

      SELECT COALESCE(dk."Komputer_simrs_user", 0)
        INTO v_pusat_basis_value
      FROM public.data_kegiatan dk
      WHERE dk.tahun = p_tahun AND dk."Kode_UK" = r_pusat.kode;

    ELSE
      -- Unsupported basis in this function: treat as zero to avoid division by zero
      v_denominator := 0;
      v_pusat_basis_value := 0;
    END IF;

    -- Exclude self from denominator per rule
    v_denominator := COALESCE(v_denominator, 0) - COALESCE(v_pusat_basis_value, 0);

    -- Avoid division by zero - skip if no biaya or no valid denominator
    IF v_denominator <= 0 OR v_biaya IS NULL OR v_biaya <= 0 THEN
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
          -- Mengambil dari data_kegiatan_transpose menggunakan helper function
          v_target_basis_value := public.get_dasar_alokasi_value_from_transpose(r_target.kode, p_tahun, 'SDM');
        ELSIF v_basis = 'Luas_Ruangan' THEN
          SELECT COALESCE(uk.luas_ruangan, 0)
            INTO v_target_basis_value
          FROM public.unit_kerja uk
          WHERE uk.id = r_target.unit_id;
        ELSIF v_basis = 'Total_Kunjungan_Pasien' THEN
          -- Mengambil dari data_kegiatan_transpose menggunakan helper function
          v_target_basis_value := public.get_dasar_alokasi_value_from_transpose(r_target.kode, p_tahun, 'Kunjungan');
        ELSIF v_basis = 'Komputer_simrs_user' THEN
          SELECT COALESCE(dk."Komputer_simrs_user", 0)
            INTO v_target_basis_value
          FROM public.data_kegiatan dk
          WHERE dk.tahun = p_tahun AND dk."Kode_UK" = r_target.kode;
        ELSE
          v_target_basis_value := 0;
        END IF;
      END IF;

      INSERT INTO public.distribusi_biaya_pertama_norm (
        tahun, pusat_unit_kerja_id, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan,
        target_unit_kerja_id, target_kode, target_nama, alokasi
      ) VALUES (
        p_tahun, r_pusat.unit_id, r_pusat.kode, r_pusat.nama, v_basis, ROUND(COALESCE(v_biaya, 0), 0)::BIGINT,
        r_target.unit_id, r_target.kode, r_target.nama,
        CASE WHEN r_target.unit_id = r_pusat.unit_id THEN 0
             ELSE ROUND( (v_target_basis_value / NULLIF(v_denominator,0)) * COALESCE(v_biaya, 0), 0)::BIGINT
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


