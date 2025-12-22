-- ============================================
-- Migration: Fix Kalkulasi Biaya Kelas Akomodasi - Dasar Alokasi (REVISED)
-- Date: 2024-12-10 (Updated)
-- 
-- Perbaikan rumus kalkulasi biaya kelas akomodasi dengan 3 jenis dasar alokasi:
-- 1. dasar_alokasi_hari_rawat - untuk 17 kolom biaya
-- 2. dasar_alokasi_tempat_tidur - untuk 5 kolom biaya
-- 3. dasar_alokasi_luas_kamar - untuk 2 kolom biaya
--
-- PERUBAHAN dari versi sebelumnya:
-- - biaya_listrik: tempat_tidur → hari_rawat
-- - biaya_penyusutan_alat_medis: tempat_tidur → hari_rawat
-- - biaya_penyusutan_gedung: luas_kamar → hari_rawat
-- - biaya_tidak_langsung_terdistribusi: luas_kamar → hari_rawat
-- ============================================

-- Pertama, pastikan kolom dasar_alokasi_tempat_tidur dan dasar_alokasi_luas_kamar ada di tabel
DO $$ 
BEGIN
    -- Check dan tambahkan dasar_alokasi_tempat_tidur jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kalkulasi_biaya_kelas_akomodasi' 
        AND column_name = 'dasar_alokasi_tempat_tidur'
    ) THEN
        ALTER TABLE public.kalkulasi_biaya_kelas_akomodasi 
        ADD COLUMN dasar_alokasi_tempat_tidur NUMERIC(10, 6) DEFAULT 0;
        
        RAISE NOTICE 'Kolom dasar_alokasi_tempat_tidur berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom dasar_alokasi_tempat_tidur sudah ada';
    END IF;

    -- Check dan tambahkan dasar_alokasi_luas_kamar jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kalkulasi_biaya_kelas_akomodasi' 
        AND column_name = 'dasar_alokasi_luas_kamar'
    ) THEN
        ALTER TABLE public.kalkulasi_biaya_kelas_akomodasi 
        ADD COLUMN dasar_alokasi_luas_kamar NUMERIC(10, 6) DEFAULT 0;
        
        RAISE NOTICE 'Kolom dasar_alokasi_luas_kamar berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom dasar_alokasi_luas_kamar sudah ada';
    END IF;
END $$;

-- Update function populate_kalkulasi_biaya_kelas_akomodasi dengan rumus yang diperbaiki
CREATE OR REPLACE FUNCTION public.populate_kalkulasi_biaya_kelas_akomodasi(
  p_user_id uuid,
  p_tahun integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Delete existing data for the user and year
    DELETE FROM kalkulasi_biaya_kelas_akomodasi
    WHERE user_id = p_user_id AND tahun = p_tahun;

    -- Insert new data with corrected formulas
    -- CTE untuk mengambil data dari data_akomodasi_inap dengan prioritas: user_id = p_user_id, lalu master (user_id IS NULL)
    WITH all_unit_kerja AS (
        -- Ambil semua unit kerja yang ada di data_akomodasi_inap untuk tahun tersebut
        SELECT DISTINCT kode_unit_kerja, tahun
        FROM data_akomodasi_inap
        WHERE tahun = p_tahun
          AND (user_id = p_user_id OR user_id IS NULL)
    ),
    data_with_priority AS (
        -- Ambil data dengan prioritas: user_id = p_user_id dulu, lalu master
        SELECT 
            dai.*,
            CASE WHEN dai.user_id = p_user_id THEN 1 ELSE 2 END AS priority
        FROM data_akomodasi_inap dai
        WHERE dai.tahun = p_tahun
          AND (dai.user_id = p_user_id OR dai.user_id IS NULL)
    ),
    selected_data AS (
        -- Ambil data dengan prioritas tertinggi untuk setiap unit kerja
        SELECT DISTINCT ON (dai.kode_unit_kerja, dai.tahun)
            dai.user_id,
            dai.tahun,
            dai.kode_unit_kerja,
            dai.nama_unit_kerja,
            dai.hari_rawat_vvip,
            dai.hari_rawat_vip,
            dai.hari_rawat_i,
            dai.hari_rawat_ii,
            dai.hari_rawat_iii,
            dai.tempat_tidur_svip,
            dai.tempat_tidur_vip,
            dai.tempat_tidur_i,
            dai.tempat_tidur_ii,
            dai.tempat_tidur_iii,
            dai.kamar_luas_svip,
            dai.kamar_luas_vip,
            dai.kamar_luas_i,
            dai.kamar_luas_ii,
            dai.kamar_luas_iii,
            dai.jumlah_kali_porsi_vvip,
            dai.jumlah_kali_porsi_vip,
            dai.jumlah_kali_porsi_i,
            dai.jumlah_kali_porsi_ii,
            dai.jumlah_kali_porsi_iii
        FROM data_with_priority dai
        ORDER BY dai.kode_unit_kerja, dai.tahun, priority
    ),
    kelas_data AS (
        -- VVIP/SVIP
        SELECT
            p_user_id AS user_id,
            sd.tahun,
            sd.kode_unit_kerja,
            sd.nama_unit_kerja,
            'VVIP' AS kelas,
            sd.hari_rawat_vvip AS hari_rawat_kelas,
            sd.tempat_tidur_svip AS tempat_tidur_kelas,
            sd.kamar_luas_svip::NUMERIC AS kamar_luas_kelas,
            sd.jumlah_kali_porsi_vvip AS jumlah_kali_porsi_kelas,
            (sd.hari_rawat_vvip + sd.hari_rawat_vip + sd.hari_rawat_i + sd.hari_rawat_ii + sd.hari_rawat_iii) AS total_hari_rawat_unit,
            (sd.tempat_tidur_svip + sd.tempat_tidur_vip + sd.tempat_tidur_i + sd.tempat_tidur_ii + sd.tempat_tidur_iii) AS total_tempat_tidur_unit,
            (sd.kamar_luas_svip + sd.kamar_luas_vip + sd.kamar_luas_i + sd.kamar_luas_ii + sd.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit
        FROM selected_data sd
        WHERE sd.hari_rawat_vvip > 0

        UNION ALL

        -- VIP
        SELECT
            p_user_id AS user_id,
            sd.tahun,
            sd.kode_unit_kerja,
            sd.nama_unit_kerja,
            'VIP' AS kelas,
            sd.hari_rawat_vip AS hari_rawat_kelas,
            sd.tempat_tidur_vip AS tempat_tidur_kelas,
            sd.kamar_luas_vip::NUMERIC AS kamar_luas_kelas,
            sd.jumlah_kali_porsi_vip AS jumlah_kali_porsi_kelas,
            (sd.hari_rawat_vvip + sd.hari_rawat_vip + sd.hari_rawat_i + sd.hari_rawat_ii + sd.hari_rawat_iii) AS total_hari_rawat_unit,
            (sd.tempat_tidur_svip + sd.tempat_tidur_vip + sd.tempat_tidur_i + sd.tempat_tidur_ii + sd.tempat_tidur_iii) AS total_tempat_tidur_unit,
            (sd.kamar_luas_svip + sd.kamar_luas_vip + sd.kamar_luas_i + sd.kamar_luas_ii + sd.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit
        FROM selected_data sd
        WHERE sd.hari_rawat_vip > 0

        UNION ALL

        -- I
        SELECT
            p_user_id AS user_id,
            sd.tahun,
            sd.kode_unit_kerja,
            sd.nama_unit_kerja,
            'I' AS kelas,
            sd.hari_rawat_i AS hari_rawat_kelas,
            sd.tempat_tidur_i AS tempat_tidur_kelas,
            sd.kamar_luas_i::NUMERIC AS kamar_luas_kelas,
            sd.jumlah_kali_porsi_i AS jumlah_kali_porsi_kelas,
            (sd.hari_rawat_vvip + sd.hari_rawat_vip + sd.hari_rawat_i + sd.hari_rawat_ii + sd.hari_rawat_iii) AS total_hari_rawat_unit,
            (sd.tempat_tidur_svip + sd.tempat_tidur_vip + sd.tempat_tidur_i + sd.tempat_tidur_ii + sd.tempat_tidur_iii) AS total_tempat_tidur_unit,
            (sd.kamar_luas_svip + sd.kamar_luas_vip + sd.kamar_luas_i + sd.kamar_luas_ii + sd.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit
        FROM selected_data sd
        WHERE sd.hari_rawat_i > 0

        UNION ALL

        -- II
        SELECT
            p_user_id AS user_id,
            sd.tahun,
            sd.kode_unit_kerja,
            sd.nama_unit_kerja,
            'II' AS kelas,
            sd.hari_rawat_ii AS hari_rawat_kelas,
            sd.tempat_tidur_ii AS tempat_tidur_kelas,
            sd.kamar_luas_ii::NUMERIC AS kamar_luas_kelas,
            sd.jumlah_kali_porsi_ii AS jumlah_kali_porsi_kelas,
            (sd.hari_rawat_vvip + sd.hari_rawat_vip + sd.hari_rawat_i + sd.hari_rawat_ii + sd.hari_rawat_iii) AS total_hari_rawat_unit,
            (sd.tempat_tidur_svip + sd.tempat_tidur_vip + sd.tempat_tidur_i + sd.tempat_tidur_ii + sd.tempat_tidur_iii) AS total_tempat_tidur_unit,
            (sd.kamar_luas_svip + sd.kamar_luas_vip + sd.kamar_luas_i + sd.kamar_luas_ii + sd.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit
        FROM selected_data sd
        WHERE sd.hari_rawat_ii > 0

        UNION ALL

        -- III
        SELECT
            p_user_id AS user_id,
            sd.tahun,
            sd.kode_unit_kerja,
            sd.nama_unit_kerja,
            'III' AS kelas,
            sd.hari_rawat_iii AS hari_rawat_kelas,
            sd.tempat_tidur_iii AS tempat_tidur_kelas,
            sd.kamar_luas_iii::NUMERIC AS kamar_luas_kelas,
            sd.jumlah_kali_porsi_iii AS jumlah_kali_porsi_kelas,
            (sd.hari_rawat_vvip + sd.hari_rawat_vip + sd.hari_rawat_i + sd.hari_rawat_ii + sd.hari_rawat_iii) AS total_hari_rawat_unit,
            (sd.tempat_tidur_svip + sd.tempat_tidur_vip + sd.tempat_tidur_i + sd.tempat_tidur_ii + sd.tempat_tidur_iii) AS total_tempat_tidur_unit,
            (sd.kamar_luas_svip + sd.kamar_luas_vip + sd.kamar_luas_i + sd.kamar_luas_ii + sd.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit
        FROM selected_data sd
        WHERE sd.hari_rawat_iii > 0
    )
    INSERT INTO kalkulasi_biaya_kelas_akomodasi (
        user_id,
        tahun,
        kode_unit_kerja,
        nama_unit_kerja,
        kelas,
        dasar_alokasi_hari_rawat,
        dasar_alokasi_tempat_tidur,
        dasar_alokasi_luas_kamar,
        biaya_gaji_tunjangan,
        biaya_jasa_pelayanan,
        biaya_obat,
        biaya_bhp,
        biaya_makan_karyawan,
        biaya_makan_pasien,
        biaya_rumah_tangga,
        biaya_cetak,
        biaya_atk,
        biaya_listrik,
        biaya_air,
        biaya_telp,
        biaya_pemeliharaan_bangunan,
        biaya_pemeliharaan_alat_medis,
        biaya_pemeliharaan_alat_non_medis,
        biaya_operasional_lainnya,
        biaya_penyusutan_gedung,
        biaya_penyusutan_jaringan,
        biaya_penyusutan_alat_medis,
        biaya_penyusutan_alat_non_medis,
        biaya_pendidikan_pelatihan,
        biaya_laundry,
        biaya_sterilisasi,
        biaya_tidak_langsung_terdistribusi,
        alokasi_biaya_gizi,
        unit_cost_per_kelas
    )
    SELECT
        kd.user_id,
        kd.tahun,
        kd.kode_unit_kerja,
        kd.nama_unit_kerja,
        kd.kelas,
        -- Dasar alokasi hari rawat: (hari_rawat_kelas / total_hari_rawat_unit)
        CASE 
            WHEN kd.total_hari_rawat_unit > 0 
            THEN ROUND((kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)::NUMERIC, 6)
            ELSE 0 
        END AS dasar_alokasi_hari_rawat,
        -- Dasar alokasi tempat tidur: (tempat_tidur_kelas / total_tempat_tidur_unit)
        CASE 
            WHEN kd.total_tempat_tidur_unit > 0 
            THEN ROUND((kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)::NUMERIC, 6)
            ELSE 0 
        END AS dasar_alokasi_tempat_tidur,
        -- Dasar alokasi luas kamar: (kamar_luas_kelas / total_kamar_luas_unit)
        CASE 
            WHEN kd.total_kamar_luas_unit > 0 
            THEN ROUND((kd.kamar_luas_kelas::NUMERIC / kd.total_kamar_luas_unit::NUMERIC)::NUMERIC, 6)
            ELSE 0 
        END AS dasar_alokasi_luas_kamar,
        -- ====================================================================
        -- KATEGORI 1: Biaya dengan dasar_alokasi_hari_rawat (17 kolom)
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_gaji_tunjangan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_gaji_tunjangan,
        ROUND(COALESCE(kba.biaya_jasa_pelayanan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_jasa_pelayanan,
        ROUND(COALESCE(kba.biaya_obat, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_obat,
        ROUND(COALESCE(kba.biaya_bhp, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_bhp,
        ROUND(COALESCE(kba.biaya_makan_karyawan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_makan_karyawan,
        ROUND(COALESCE(kba.biaya_makan_pasien, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_makan_pasien,
        ROUND(COALESCE(kba.biaya_rumah_tangga, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_rumah_tangga,
        ROUND(COALESCE(kba.biaya_cetak, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_cetak,
        ROUND(COALESCE(kba.biaya_atk, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_atk,
        -- biaya_listrik MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_listrik, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_listrik,
        -- ====================================================================
        -- KATEGORI 2: Biaya dengan dasar_alokasi_tempat_tidur (5 kolom)
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_air, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_air,
        ROUND(COALESCE(kba.biaya_telp, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_telp,
        -- ====================================================================
        -- KATEGORI 3: Biaya dengan dasar_alokasi_luas_kamar (2 kolom)
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_pemeliharaan_bangunan, 0) * 
              CASE WHEN kd.total_kamar_luas_unit > 0 
                   THEN (kd.kamar_luas_kelas::NUMERIC / kd.total_kamar_luas_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pemeliharaan_bangunan,
        -- ====================================================================
        -- Back to KATEGORI 2: dasar_alokasi_tempat_tidur
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_pemeliharaan_alat_medis, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pemeliharaan_alat_medis,
        ROUND(COALESCE(kba.biaya_pemeliharaan_alat_non_medis, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pemeliharaan_alat_non_medis,
        -- ====================================================================
        -- Back to KATEGORI 1: dasar_alokasi_hari_rawat
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_operasional_lainnya, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_operasional_lainnya,
        -- biaya_penyusutan_gedung MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_penyusutan_gedung, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_gedung,
        -- ====================================================================
        -- KATEGORI 3: dasar_alokasi_luas_kamar
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_penyusutan_jaringan, 0) * 
              CASE WHEN kd.total_kamar_luas_unit > 0 
                   THEN (kd.kamar_luas_kelas::NUMERIC / kd.total_kamar_luas_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_jaringan,
        -- ====================================================================
        -- Back to KATEGORI 1: dasar_alokasi_hari_rawat
        -- ====================================================================
        -- biaya_penyusutan_alat_medis MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_penyusutan_alat_medis, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_alat_medis,
        -- ====================================================================
        -- KATEGORI 2: dasar_alokasi_tempat_tidur
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_penyusutan_alat_non_medis, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_alat_non_medis,
        -- ====================================================================
        -- Back to KATEGORI 1: dasar_alokasi_hari_rawat
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_pendidikan_pelatihan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pendidikan_pelatihan,
        ROUND(COALESCE(kba.biaya_laundry, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_laundry,
        ROUND(COALESCE(kba.biaya_sterilisasi, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_sterilisasi,
        -- biaya_tidak_langsung_terdistribusi MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_tidak_langsung_terdistribusi, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_tidak_langsung_terdistribusi,
        -- FIX: Alokasi biaya gizi dengan rumus: jumlah_kali_porsi / hari_rawat
        CASE 
            WHEN kd.hari_rawat_kelas > 0 AND kd.jumlah_kali_porsi_kelas > 0
            THEN ROUND((kd.jumlah_kali_porsi_kelas::NUMERIC / NULLIF(kd.hari_rawat_kelas::NUMERIC, 0)))::BIGINT
            ELSE 0
        END AS alokasi_biaya_gizi,
        -- Unit cost per kelas (akan dihitung nanti atau dihitung dari total biaya / hari_rawat)
        0::BIGINT AS unit_cost_per_kelas
    FROM kelas_data kd
    -- Join dengan kalkulasi_biaya_akomodasi untuk mendapatkan biaya per unit kerja
    LEFT JOIN kalkulasi_biaya_akomodasi kba
        ON kba.tahun = kd.tahun
        AND kba.kode_unit_kerja = kd.kode_unit_kerja;

    -- Update alokasi_biaya_gizi untuk memastikan semua data menggunakan rumus yang benar
    PERFORM public.update_alokasi_biaya_gizi_kelas_akomodasi(p_user_id, p_tahun);
END;
$function$;

-- Update comment untuk function
COMMENT ON FUNCTION public.populate_kalkulasi_biaya_kelas_akomodasi(uuid, integer)
IS 'Populate kalkulasi_biaya_kelas_akomodasi dengan 3 jenis dasar alokasi (REVISED):
1. dasar_alokasi_hari_rawat: untuk biaya_gaji_tunjangan, biaya_jasa_pelayanan, biaya_obat, biaya_bhp, biaya_makan_karyawan, biaya_makan_pasien, biaya_rumah_tangga, biaya_cetak, biaya_atk, biaya_listrik, biaya_operasional_lainnya, biaya_penyusutan_gedung, biaya_penyusutan_alat_medis, biaya_pendidikan_pelatihan, biaya_laundry, biaya_sterilisasi, biaya_tidak_langsung_terdistribusi (17 kolom)
2. dasar_alokasi_tempat_tidur: untuk biaya_air, biaya_telp, biaya_pemeliharaan_alat_medis, biaya_pemeliharaan_alat_non_medis, biaya_penyusutan_alat_non_medis (5 kolom)
3. dasar_alokasi_luas_kamar: untuk biaya_pemeliharaan_bangunan, biaya_penyusutan_jaringan (2 kolom)
Rumus alokasi_biaya_gizi: jumlah_kali_porsi_[kelas] / hari_rawat_[kelas]. Prioritas: data user, lalu data master (user_id IS NULL)';

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration REVISED completed successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PERUBAHAN dari versi sebelumnya:';
    RAISE NOTICE '- biaya_listrik: tempat_tidur → hari_rawat';
    RAISE NOTICE '- biaya_penyusutan_alat_medis: tempat_tidur → hari_rawat';
    RAISE NOTICE '- biaya_penyusutan_gedung: luas_kamar → hari_rawat';
    RAISE NOTICE '- biaya_tidak_langsung_terdistribusi: luas_kamar → hari_rawat';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DISTRIBUSI AKHIR:';
    RAISE NOTICE '- Kategori A (hari_rawat): 17 kolom';
    RAISE NOTICE '- Kategori B (tempat_tidur): 5 kolom';
    RAISE NOTICE '- Kategori C (luas_kamar): 2 kolom';
    RAISE NOTICE '========================================';
END $$;






