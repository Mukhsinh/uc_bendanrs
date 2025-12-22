-- ============================================
-- Fix Function Populate Kalkulasi Biaya Kelas Akomodasi - FINAL VERSION
-- 
-- PERBAIKAN KRITIS:
-- Function ini MENJAMIN nilai dasar_alokasi_* yang tersimpan di kolom
-- SAMA PERSIS dengan nilai yang digunakan untuk menghitung biaya.
--
-- Cara kerja:
-- 1. Hitung dasar alokasi SEKALI dalam CTE (dasar_alokasi_calculated)
-- 2. Simpan nilai tersebut ke kolom dasar_alokasi_*
-- 3. Gunakan NILAI YANG SAMA untuk menghitung SEMUA biaya
-- 
-- GARANTISASI KONSISTENSI 100%!
-- ============================================

CREATE OR REPLACE FUNCTION public.populate_kalkulasi_biaya_kelas_akomodasi(
  p_user_id uuid,
  p_tahun integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get tenant_id for current user
    v_tenant_id := public.get_tenant_id();
    
    -- Delete existing data for the user and year, considering tenant_id
    -- Also delete any records that might conflict with the unique constraint (kode_unit_kerja, kelas, tahun, tenant_id)
    DELETE FROM kalkulasi_biaya_kelas_akomodasi
    WHERE (user_id = p_user_id AND tahun = p_tahun)
       OR (tahun = p_tahun AND tenant_id = v_tenant_id AND kode_unit_kerja IN (
           SELECT DISTINCT kode_unit_kerja 
           FROM data_akomodasi_inap 
           WHERE tahun = p_tahun AND (user_id = p_user_id OR user_id IS NULL)
       ));

    -- Insert new data with corrected formulas
    WITH all_unit_kerja AS (
        SELECT DISTINCT kode_unit_kerja, tahun
        FROM data_akomodasi_inap
        WHERE tahun = p_tahun
          AND (user_id = p_user_id OR user_id IS NULL)
    ),
    data_with_priority AS (
        SELECT 
            dai.*,
            CASE WHEN dai.user_id = p_user_id THEN 1 ELSE 2 END AS priority
        FROM data_akomodasi_inap dai
        WHERE dai.tahun = p_tahun
          AND (dai.user_id = p_user_id OR dai.user_id IS NULL)
    ),
    selected_data AS (
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
    ),
    -- ====================================================================
    -- CTE KRITIS: Hitung SEMUA dasar alokasi SEKALI di sini
    -- Nilai dari CTE ini akan digunakan untuk:
    -- 1. Disimpan ke kolom dasar_alokasi_* di tabel
    -- 2. Digunakan untuk menghitung SEMUA biaya
    -- GARANTISASI KONSISTENSI 100%!
    -- ====================================================================
    dasar_alokasi_calculated AS (
        SELECT
            kd.*,
            -- Dasar Alokasi Hari Rawat - HITUNG SEKALI!
            CASE 
                WHEN kd.total_hari_rawat_unit > 0 
                THEN ROUND((kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC), 6)
                ELSE 0 
            END AS da_hari_rawat,
            -- Dasar Alokasi Tempat Tidur - HITUNG SEKALI!
            CASE 
                WHEN kd.total_tempat_tidur_unit > 0 
                THEN ROUND((kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC), 6)
                ELSE 0 
            END AS da_tempat_tidur,
            -- Dasar Alokasi Luas Kamar - HITUNG SEKALI!
            CASE 
                WHEN kd.total_kamar_luas_unit > 0 
                THEN ROUND((kd.kamar_luas_kelas::NUMERIC / kd.total_kamar_luas_unit::NUMERIC), 6)
                ELSE 0 
            END AS da_luas_kamar
        FROM kelas_data kd
    )
    INSERT INTO kalkulasi_biaya_kelas_akomodasi (
        user_id,
        tahun,
        kode_unit_kerja,
        nama_unit_kerja,
        kelas,
        tenant_id,
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
        alokasi_biaya_gizi
    )
    SELECT
        dac.user_id,
        dac.tahun,
        dac.kode_unit_kerja,
        dac.nama_unit_kerja,
        dac.kelas,
        v_tenant_id AS tenant_id,
        -- SIMPAN nilai dasar alokasi ke kolom (dari CTE)
        dac.da_hari_rawat AS dasar_alokasi_hari_rawat,
        dac.da_tempat_tidur AS dasar_alokasi_tempat_tidur,
        dac.da_luas_kamar AS dasar_alokasi_luas_kamar,
        -- ====================================================================
        -- KATEGORI A: Biaya dengan dasar_alokasi_hari_rawat (17 kolom)
        -- GUNAKAN dac.da_hari_rawat (NILAI YANG SAMA dengan kolom!)
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_gaji_tunjangan, 0) * dac.da_hari_rawat)::BIGINT AS biaya_gaji_tunjangan,
        ROUND(COALESCE(kba.biaya_jasa_pelayanan, 0) * dac.da_hari_rawat)::BIGINT AS biaya_jasa_pelayanan,
        ROUND(COALESCE(kba.biaya_obat, 0) * dac.da_hari_rawat)::BIGINT AS biaya_obat,
        ROUND(COALESCE(kba.biaya_bhp, 0) * dac.da_hari_rawat)::BIGINT AS biaya_bhp,
        ROUND(COALESCE(kba.biaya_makan_karyawan, 0) * dac.da_hari_rawat)::BIGINT AS biaya_makan_karyawan,
        ROUND(COALESCE(kba.biaya_makan_pasien, 0) * dac.da_hari_rawat)::BIGINT AS biaya_makan_pasien,
        ROUND(COALESCE(kba.biaya_rumah_tangga, 0) * dac.da_hari_rawat)::BIGINT AS biaya_rumah_tangga,
        ROUND(COALESCE(kba.biaya_cetak, 0) * dac.da_hari_rawat)::BIGINT AS biaya_cetak,
        ROUND(COALESCE(kba.biaya_atk, 0) * dac.da_hari_rawat)::BIGINT AS biaya_atk,
        -- biaya_listrik MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_listrik, 0) * dac.da_hari_rawat)::BIGINT AS biaya_listrik,
        -- ====================================================================
        -- KATEGORI B: Biaya dengan dasar_alokasi_tempat_tidur (5 kolom)
        -- GUNAKAN dac.da_tempat_tidur (NILAI YANG SAMA dengan kolom!)
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_air, 0) * dac.da_tempat_tidur)::BIGINT AS biaya_air,
        ROUND(COALESCE(kba.biaya_telp, 0) * dac.da_tempat_tidur)::BIGINT AS biaya_telp,
        -- ====================================================================
        -- KATEGORI C: Biaya dengan dasar_alokasi_luas_kamar (2 kolom)
        -- GUNAKAN dac.da_luas_kamar (NILAI YANG SAMA dengan kolom!)
        -- ====================================================================
        ROUND(COALESCE(kba.biaya_pemeliharaan_bangunan, 0) * dac.da_luas_kamar)::BIGINT AS biaya_pemeliharaan_bangunan,
        -- Back to KATEGORI B
        ROUND(COALESCE(kba.biaya_pemeliharaan_alat_medis, 0) * dac.da_tempat_tidur)::BIGINT AS biaya_pemeliharaan_alat_medis,
        ROUND(COALESCE(kba.biaya_pemeliharaan_alat_non_medis, 0) * dac.da_tempat_tidur)::BIGINT AS biaya_pemeliharaan_alat_non_medis,
        -- Back to KATEGORI A
        ROUND(COALESCE(kba.biaya_operasional_lainnya, 0) * dac.da_hari_rawat)::BIGINT AS biaya_operasional_lainnya,
        -- biaya_penyusutan_gedung MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_penyusutan_gedung, 0) * dac.da_hari_rawat)::BIGINT AS biaya_penyusutan_gedung,
        -- KATEGORI C
        ROUND(COALESCE(kba.biaya_penyusutan_jaringan, 0) * dac.da_luas_kamar)::BIGINT AS biaya_penyusutan_jaringan,
        -- biaya_penyusutan_alat_medis MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_penyusutan_alat_medis, 0) * dac.da_hari_rawat)::BIGINT AS biaya_penyusutan_alat_medis,
        -- KATEGORI B
        ROUND(COALESCE(kba.biaya_penyusutan_alat_non_medis, 0) * dac.da_tempat_tidur)::BIGINT AS biaya_penyusutan_alat_non_medis,
        -- Back to KATEGORI A
        ROUND(COALESCE(kba.biaya_pendidikan_pelatihan, 0) * dac.da_hari_rawat)::BIGINT AS biaya_pendidikan_pelatihan,
        ROUND(COALESCE(kba.biaya_laundry, 0) * dac.da_hari_rawat)::BIGINT AS biaya_laundry,
        ROUND(COALESCE(kba.biaya_sterilisasi, 0) * dac.da_hari_rawat)::BIGINT AS biaya_sterilisasi,
        -- biaya_tidak_langsung_terdistribusi MENGGUNAKAN hari_rawat (REVISED)
        ROUND(COALESCE(kba.biaya_tidak_langsung_terdistribusi, 0) * dac.da_hari_rawat)::BIGINT AS biaya_tidak_langsung_terdistribusi,
        -- Kolom khusus: alokasi_biaya_gizi
        CASE 
            WHEN dac.hari_rawat_kelas > 0 AND dac.jumlah_kali_porsi_kelas > 0
            THEN ROUND((dac.jumlah_kali_porsi_kelas::NUMERIC / NULLIF(dac.hari_rawat_kelas::NUMERIC, 0)))::BIGINT
            ELSE 0
        END AS alokasi_biaya_gizi
        -- unit_cost_per_kelas adalah GENERATED COLUMN, tidak perlu diisi manual
    FROM dasar_alokasi_calculated dac
    -- Join dengan kalkulasi_biaya_akomodasi untuk mendapatkan biaya per unit kerja
    LEFT JOIN kalkulasi_biaya_akomodasi kba
        ON kba.tahun = dac.tahun
        AND kba.kode_unit_kerja = dac.kode_unit_kerja
    ON CONFLICT (kode_unit_kerja, kelas, tahun, tenant_id) 
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        nama_unit_kerja = EXCLUDED.nama_unit_kerja,
        dasar_alokasi_hari_rawat = EXCLUDED.dasar_alokasi_hari_rawat,
        dasar_alokasi_tempat_tidur = EXCLUDED.dasar_alokasi_tempat_tidur,
        dasar_alokasi_luas_kamar = EXCLUDED.dasar_alokasi_luas_kamar,
        biaya_gaji_tunjangan = EXCLUDED.biaya_gaji_tunjangan,
        biaya_jasa_pelayanan = EXCLUDED.biaya_jasa_pelayanan,
        biaya_obat = EXCLUDED.biaya_obat,
        biaya_bhp = EXCLUDED.biaya_bhp,
        biaya_makan_karyawan = EXCLUDED.biaya_makan_karyawan,
        biaya_makan_pasien = EXCLUDED.biaya_makan_pasien,
        biaya_rumah_tangga = EXCLUDED.biaya_rumah_tangga,
        biaya_cetak = EXCLUDED.biaya_cetak,
        biaya_atk = EXCLUDED.biaya_atk,
        biaya_listrik = EXCLUDED.biaya_listrik,
        biaya_air = EXCLUDED.biaya_air,
        biaya_telp = EXCLUDED.biaya_telp,
        biaya_pemeliharaan_bangunan = EXCLUDED.biaya_pemeliharaan_bangunan,
        biaya_pemeliharaan_alat_medis = EXCLUDED.biaya_pemeliharaan_alat_medis,
        biaya_pemeliharaan_alat_non_medis = EXCLUDED.biaya_pemeliharaan_alat_non_medis,
        biaya_operasional_lainnya = EXCLUDED.biaya_operasional_lainnya,
        biaya_penyusutan_gedung = EXCLUDED.biaya_penyusutan_gedung,
        biaya_penyusutan_jaringan = EXCLUDED.biaya_penyusutan_jaringan,
        biaya_penyusutan_alat_medis = EXCLUDED.biaya_penyusutan_alat_medis,
        biaya_penyusutan_alat_non_medis = EXCLUDED.biaya_penyusutan_alat_non_medis,
        biaya_pendidikan_pelatihan = EXCLUDED.biaya_pendidikan_pelatihan,
        biaya_laundry = EXCLUDED.biaya_laundry,
        biaya_sterilisasi = EXCLUDED.biaya_sterilisasi,
        biaya_tidak_langsung_terdistribusi = EXCLUDED.biaya_tidak_langsung_terdistribusi,
        alokasi_biaya_gizi = EXCLUDED.alokasi_biaya_gizi,
        updated_at = now();
        -- unit_cost_per_kelas adalah GENERATED COLUMN, akan dihitung otomatis

    -- Update alokasi_biaya_gizi untuk memastikan semua data menggunakan rumus yang benar
    PERFORM public.update_alokasi_biaya_gizi_kelas_akomodasi(p_user_id, p_tahun);
END;
$function$;

COMMENT ON FUNCTION public.populate_kalkulasi_biaya_kelas_akomodasi(uuid, integer)
IS 'Populate kalkulasi_biaya_kelas_akomodasi dengan 3 jenis dasar alokasi (REVISED & GUARANTEED CONSISTENT):
1. dasar_alokasi_hari_rawat: untuk 17 kolom biaya (gaji, obat, bhp, makan, rumah tangga, cetak, atk, listrik, operasional, penyusutan gedung, penyusutan alat medis, pendidikan, laundry, sterilisasi, tidak langsung)
2. dasar_alokasi_tempat_tidur: untuk 5 kolom biaya (air, telp, pemeliharaan alat medis, pemeliharaan alat non-medis, penyusutan alat non-medis)
3. dasar_alokasi_luas_kamar: untuk 2 kolom biaya (pemeliharaan bangunan, penyusutan jaringan)
KRITIS: Function ini MENJAMIN nilai dasar_alokasi_* yang tersimpan di kolom SAMA PERSIS dengan nilai yang digunakan untuk menghitung biaya!';

GRANT EXECUTE ON FUNCTION public.populate_kalkulasi_biaya_kelas_akomodasi(uuid, integer) TO authenticated;






