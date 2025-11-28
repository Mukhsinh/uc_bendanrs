-- ============================================================================
-- PERBAIKAN FUNGSI POPULATE SKENARIO TARIF - FIX USER FILTER
-- ============================================================================
-- Masalah: Fungsi populate_skenario_tarif_from_rekapitulasi mengembalikan 0 data
--          karena filter user_id tidak bekerja dengan benar
-- Solusi: Perbaiki logika filter user_id agar:
--         - Jika p_user_id IS NULL, ambil SEMUA data (tidak filter user_id)
--         - Jika p_user_id IS NOT NULL, ambil hanya data user tersebut
-- ============================================================================

-- Drop function lama
DROP FUNCTION IF EXISTS populate_skenario_tarif_from_rekapitulasi(uuid, integer, numeric, numeric);

-- Buat function baru dengan perbaikan filter user_id
CREATE OR REPLACE FUNCTION populate_skenario_tarif_from_rekapitulasi(
    p_user_id uuid,
    p_tahun integer,
    p_prosentase_jasa_pelayanan numeric DEFAULT 0,
    p_prosentase_profit numeric DEFAULT 0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
    v_target_user uuid := p_user_id;
BEGIN
    -- Hapus data lama untuk user dan tahun yang sama
    IF p_user_id IS NULL THEN
        DELETE FROM skenario_tarif WHERE user_id IS NULL AND tahun = p_tahun;
    ELSE
        DELETE FROM skenario_tarif WHERE user_id = p_user_id AND tahun = p_tahun;
    END IF;

    -- Ambil data terbaru dari view_rekapitulasi_unit_cost
    -- PERBAIKAN: Filter user_id yang benar
    WITH latest_source AS (
        SELECT DISTINCT ON (
            vruc.tahun,
            vruc.kode_unit_kerja,
            COALESCE(vruc.kode_tindakan, CONCAT('KJ-', COALESCE(vruc.kode_jenis::text, '0')))
        )
            vruc.tahun,
            vruc.kode_jenis,
            vruc.kode_unit_kerja,
            vruc.nama_unit_kerja,
            vruc.kode_operator,
            vruc.nama_operator,
            vruc.kode_tindakan,
            vruc.nama_tindakan,
            COALESCE(vruc.biaya_bahan, 0) AS biaya_bahan,
            COALESCE(vruc.unit_cost_per_tindakan, 0) AS unit_cost_per_tindakan,
            vruc.sumber_tabel
        FROM view_rekapitulasi_unit_cost vruc
        WHERE vruc.tahun = p_tahun
          -- PERBAIKAN: Jika p_user_id NULL, ambil semua data (tidak filter user_id)
          AND (p_user_id IS NULL OR vruc.user_id = p_user_id OR vruc.user_id IS NULL)
          AND vruc.sumber_tabel = ANY (ARRAY[
              'kalkulasi_biaya_laboratorium',
              'kalkulasi_biaya_radiologi',
              'kalkulasi_bdrs',
              'kalkulasi_tindakan_inap',
              'kalkulasi_tindakan_rawat_jalan',
              'kalkulasi_tindakan_operatif',
              'kalkulasi_biaya_cathlab'
          ])
        ORDER BY
            vruc.tahun,
            vruc.kode_unit_kerja,
            COALESCE(vruc.kode_tindakan, CONCAT('KJ-', COALESCE(vruc.kode_jenis::text, '0'))),
            -- Prioritaskan data dengan biaya_bahan > 0
            CASE WHEN COALESCE(vruc.biaya_bahan, 0) > 0 THEN 0 ELSE 1 END,
            CASE WHEN COALESCE(vruc.unit_cost_per_tindakan, 0) > 0 THEN 0 ELSE 1 END,
            vruc.updated_at DESC NULLS LAST,
            vruc.created_at DESC NULLS LAST
    )
    INSERT INTO skenario_tarif (
        user_id,
        tahun,
        kode_jenis,
        kode_unit_kerja,
        nama_unit_kerja,
        kode_operator,
        nama_operator,
        kode_tindakan,
        nama_tindakan,
        biaya_bahan,
        unit_cost_per_tindakan,
        jasa_sarana,
        jasa_pelayanan_medis,
        jasa_pelayanan_non_medis,
        prosentase_jasa_pelayanan,
        prosentase_profit,
        sumber_tabel
    )
    SELECT
        v_target_user,
        ls.tahun,
        ls.kode_jenis,
        ls.kode_unit_kerja,
        ls.nama_unit_kerja,
        ls.kode_operator,
        ls.nama_operator,
        ls.kode_tindakan,
        ls.nama_tindakan,
        ls.biaya_bahan,
        ls.unit_cost_per_tindakan,
        ls.unit_cost_per_tindakan,  -- jasa_sarana = unit_cost
        0,  -- jasa_pelayanan_medis
        0,  -- jasa_pelayanan_non_medis
        p_prosentase_jasa_pelayanan,
        p_prosentase_profit,
        ls.sumber_tabel
    FROM latest_source ls;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION populate_skenario_tarif_from_rekapitulasi(uuid, integer, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION populate_skenario_tarif_from_rekapitulasi(uuid, integer, numeric, numeric) TO service_role;

-- ============================================================================
-- TESTING
-- ============================================================================

-- Test 1: Cek jumlah data sebelum populate
SELECT 
    'Sebelum populate' as status,
    COUNT(*) as jumlah_data
FROM skenario_tarif
WHERE tahun = 2025;

-- Test 2: Jalankan fungsi populate
SELECT 
    'Hasil populate' as status,
    populate_skenario_tarif_from_rekapitulasi(
        p_user_id := NULL,
        p_tahun := 2025,
        p_prosentase_jasa_pelayanan := 0,
        p_prosentase_profit := 0
    ) as jumlah_data_diupdate;

-- Test 3: Cek jumlah data setelah populate
SELECT 
    'Setelah populate' as status,
    COUNT(*) as jumlah_data
FROM skenario_tarif
WHERE tahun = 2025;

-- Test 4: Cek distribusi data per sumber tabel
SELECT 
    sumber_tabel,
    COUNT(*) as jumlah_data,
    COUNT(CASE WHEN biaya_bahan > 0 THEN 1 END) as ada_biaya_bahan,
    COUNT(CASE WHEN unit_cost_per_tindakan > 0 THEN 1 END) as ada_unit_cost
FROM skenario_tarif
WHERE tahun = 2025
GROUP BY sumber_tabel
ORDER BY sumber_tabel;

-- ============================================================================
-- SELESAI
-- ============================================================================
