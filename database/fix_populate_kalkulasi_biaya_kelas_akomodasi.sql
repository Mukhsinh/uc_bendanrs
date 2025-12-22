-- ============================================
-- Fix Function Populate Kalkulasi Biaya Kelas Akomodasi
-- 
-- Masalah:
-- 1. Function hanya mengambil data dengan user_id = p_user_id, sehingga tidak menemukan data master
-- 2. Relasi harus berdasarkan kode_unit_kerja dan tahun, dengan fallback ke master (user_id IS NULL)
-- 
-- Rumus yang Benar untuk alokasi_biaya_gizi:
-- alokasi_biaya_gizi = jumlah_kali_porsi_[kelas] / hari_rawat_[kelas]
-- 
-- Relasi: kode_unit_kerja, tahun, kelas (dengan prioritas user_id sama, lalu master)
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
            p_user_id AS user_id,  -- Gunakan p_user_id untuk insert, bukan user_id dari data_akomodasi_inap
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
        kd.user_id,
        kd.tahun,
        kd.kode_unit_kerja,
        kd.nama_unit_kerja,
        kd.kelas,
        v_tenant_id AS tenant_id,
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
        -- KATEGORI 1: Biaya dengan dasar_alokasi_hari_rawat
        -- ====================================================================
        -- 1. biaya_gaji_tunjangan (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_gaji_tunjangan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_gaji_tunjangan,
        -- 2. biaya_jasa_pelayanan (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_jasa_pelayanan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_jasa_pelayanan,
        -- 3. biaya_obat (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_obat, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_obat,
        -- 4. biaya_bhp (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_bhp, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_bhp,
        -- 5. biaya_makan_karyawan (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_makan_karyawan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_makan_karyawan,
        -- 6. biaya_makan_pasien (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_makan_pasien, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_makan_pasien,
        -- 7. biaya_rumah_tangga (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_rumah_tangga, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_rumah_tangga,
        -- 8. biaya_cetak (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_cetak, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_cetak,
        -- 9. biaya_atk (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_atk, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_atk,
        -- 10. biaya_listrik (dasar alokasi hari rawat) - DIPINDAH dari kategori tempat tidur
        ROUND(COALESCE(kba.biaya_listrik, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_listrik,
        -- ====================================================================
        -- KATEGORI 2: Biaya dengan dasar_alokasi_tempat_tidur
        -- ====================================================================
        -- 11. biaya_air (dasar alokasi tempat tidur)
        ROUND(COALESCE(kba.biaya_air, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_air,
        -- 12. biaya_telp (dasar alokasi tempat tidur)
        ROUND(COALESCE(kba.biaya_telp, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_telp,
        -- ====================================================================
        -- KATEGORI 3: Biaya dengan dasar_alokasi_luas_kamar
        -- ====================================================================
        -- 13. biaya_pemeliharaan_bangunan (dasar alokasi luas kamar)
        ROUND(COALESCE(kba.biaya_pemeliharaan_bangunan, 0) * 
              CASE WHEN kd.total_kamar_luas_unit > 0 
                   THEN (kd.kamar_luas_kelas::NUMERIC / kd.total_kamar_luas_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pemeliharaan_bangunan,
        -- ====================================================================
        -- KATEGORI 4: Biaya dengan dasar_alokasi_tempat_tidur (lanjutan)
        -- ====================================================================
        -- 14. biaya_pemeliharaan_alat_medis (dasar alokasi tempat tidur)
        ROUND(COALESCE(kba.biaya_pemeliharaan_alat_medis, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pemeliharaan_alat_medis,
        -- 15. biaya_pemeliharaan_alat_non_medis (dasar alokasi tempat tidur)
        ROUND(COALESCE(kba.biaya_pemeliharaan_alat_non_medis, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pemeliharaan_alat_non_medis,
        -- ====================================================================
        -- KATEGORI 5: Biaya dengan dasar_alokasi_hari_rawat (lanjutan)
        -- ====================================================================
        -- 16. biaya_operasional_lainnya (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_operasional_lainnya, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_operasional_lainnya,
        -- 17. biaya_penyusutan_gedung (dasar alokasi hari rawat) - DIPINDAH dari kategori luas kamar
        ROUND(COALESCE(kba.biaya_penyusutan_gedung, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_gedung,
        -- ====================================================================
        -- KATEGORI 6: Biaya dengan dasar_alokasi_luas_kamar (lanjutan)
        -- ====================================================================
        -- 18. biaya_penyusutan_jaringan (dasar alokasi luas kamar)
        ROUND(COALESCE(kba.biaya_penyusutan_jaringan, 0) * 
              CASE WHEN kd.total_kamar_luas_unit > 0 
                   THEN (kd.kamar_luas_kelas::NUMERIC / kd.total_kamar_luas_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_jaringan,
        -- ====================================================================
        -- KATEGORI 7: Biaya dengan dasar_alokasi_tempat_tidur (lanjutan)
        -- ====================================================================
        -- 19. biaya_penyusutan_alat_medis (dasar alokasi hari rawat) - DIPINDAH dari kategori tempat tidur
        ROUND(COALESCE(kba.biaya_penyusutan_alat_medis, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_alat_medis,
        -- 20. biaya_penyusutan_alat_non_medis (dasar alokasi tempat tidur)
        ROUND(COALESCE(kba.biaya_penyusutan_alat_non_medis, 0) * 
              CASE WHEN kd.total_tempat_tidur_unit > 0 
                   THEN (kd.tempat_tidur_kelas::NUMERIC / kd.total_tempat_tidur_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_penyusutan_alat_non_medis,
        -- ====================================================================
        -- KATEGORI 8: Biaya dengan dasar_alokasi_hari_rawat (lanjutan)
        -- ====================================================================
        -- 21. biaya_pendidikan_pelatihan (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_pendidikan_pelatihan, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_pendidikan_pelatihan,
        -- 22. biaya_laundry (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_laundry, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_laundry,
        -- 23. biaya_sterilisasi (dasar alokasi hari rawat)
        ROUND(COALESCE(kba.biaya_sterilisasi, 0) * 
              CASE WHEN kd.total_hari_rawat_unit > 0 
                   THEN (kd.hari_rawat_kelas::NUMERIC / kd.total_hari_rawat_unit::NUMERIC)
                   ELSE 0 
              END)::BIGINT AS biaya_sterilisasi,
        -- ====================================================================
        -- KATEGORI 9: Biaya dengan dasar_alokasi_hari_rawat (lanjutan)
        -- ====================================================================
        -- 24. biaya_tidak_langsung_terdistribusi (dasar alokasi hari rawat) - DIPINDAH dari kategori luas kamar
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
        END AS alokasi_biaya_gizi
        -- unit_cost_per_kelas adalah GENERATED COLUMN, tidak perlu diisi manual
    FROM kelas_data kd
    -- Join dengan kalkulasi_biaya_akomodasi untuk mendapatkan biaya per unit kerja
    -- Tanpa memperhatikan user_id, hanya berdasarkan tahun dan kode_unit_kerja
    LEFT JOIN kalkulasi_biaya_akomodasi kba
        ON kba.tahun = kd.tahun
        AND kba.kode_unit_kerja = kd.kode_unit_kerja
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
        -- unit_cost_per_kelas adalah GENERATED COLUMN, akan dihitung otomatis oleh database

    -- Update alokasi_biaya_gizi untuk memastikan semua data menggunakan rumus yang benar
    PERFORM public.update_alokasi_biaya_gizi_kelas_akomodasi(p_user_id, p_tahun);
END;
$function$;

COMMENT ON FUNCTION public.populate_kalkulasi_biaya_kelas_akomodasi(uuid, integer)
IS 'Populate kalkulasi_biaya_kelas_akomodasi dengan 3 jenis dasar alokasi:
1. dasar_alokasi_hari_rawat: untuk biaya_gaji_tunjangan, biaya_jasa_pelayanan, biaya_obat, biaya_bhp, biaya_makan_karyawan, biaya_makan_pasien, biaya_rumah_tangga, biaya_cetak, biaya_atk, biaya_listrik, biaya_operasional_lainnya, biaya_penyusutan_gedung, biaya_penyusutan_alat_medis, biaya_pendidikan_pelatihan, biaya_laundry, biaya_sterilisasi, biaya_tidak_langsung_terdistribusi (17 kolom)
2. dasar_alokasi_tempat_tidur: untuk biaya_air, biaya_telp, biaya_pemeliharaan_alat_medis, biaya_pemeliharaan_alat_non_medis, biaya_penyusutan_alat_non_medis (5 kolom)
3. dasar_alokasi_luas_kamar: untuk biaya_pemeliharaan_bangunan, biaya_penyusutan_jaringan (2 kolom)
Rumus alokasi_biaya_gizi: jumlah_kali_porsi_[kelas] / hari_rawat_[kelas]. Prioritas: data user, lalu data master (user_id IS NULL)';

GRANT EXECUTE ON FUNCTION public.populate_kalkulasi_biaya_kelas_akomodasi(uuid, integer) TO authenticated;
