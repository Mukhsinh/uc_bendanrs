-- Migration: Fix sinkronisasi biaya_bahan_tindakan dari daftar_tindakan ke kalkulasi_tindakan_rawat_jalan
-- Tanggal: 2024-12-02
-- Deskripsi: Membuat trigger auto-sync dan function untuk update manual biaya_bahan_tindakan

-- ============================================================================
-- STEP 1: Function untuk sync biaya bahan dari daftar_tindakan
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_sync_biaya_bahan_rawat_jalan()
RETURNS TRIGGER AS $$
BEGIN
    -- Ambil biaya_bahan_tindakan dari daftar_tindakan berdasarkan kode_tindakan dan tenant_id
    -- TANPA memperhatikan user_id
    SELECT COALESCE(biaya_bahan_tindakan, 0)
    INTO NEW.biaya_bahan_tindakan
    FROM daftar_tindakan
    WHERE kode_tindakan = NEW.kode_jenis_tindakan
        AND tenant_id = NEW.tenant_id
    LIMIT 1;
    
    -- Jika tidak ditemukan di daftar_tindakan, set ke 0
    IF NEW.biaya_bahan_tindakan IS NULL THEN
        NEW.biaya_bahan_tindakan := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_sync_biaya_bahan_rawat_jalan() IS 
'Auto-sync biaya_bahan_tindakan dari tabel daftar_tindakan ke kalkulasi_tindakan_rawat_jalan.
Matching berdasarkan kode_tindakan dan tenant_id, tanpa memperhatikan user_id.';

-- ============================================================================
-- STEP 2: Drop trigger lama jika ada
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_auto_sync_biaya_bahan_rawat_jalan ON kalkulasi_tindakan_rawat_jalan;

-- ============================================================================
-- STEP 3: Buat trigger baru untuk auto-sync saat INSERT atau UPDATE
-- ============================================================================

CREATE TRIGGER trigger_auto_sync_biaya_bahan_rawat_jalan
    BEFORE INSERT OR UPDATE ON kalkulasi_tindakan_rawat_jalan
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_biaya_bahan_rawat_jalan();

COMMENT ON TRIGGER trigger_auto_sync_biaya_bahan_rawat_jalan ON kalkulasi_tindakan_rawat_jalan IS
'Trigger untuk auto-sync biaya_bahan_tindakan dari daftar_tindakan sebelum INSERT atau UPDATE.';

-- ============================================================================
-- STEP 4: Function untuk update manual semua data yang tidak sinkron
-- ============================================================================

CREATE OR REPLACE FUNCTION manual_sync_biaya_bahan_rawat_jalan(
    p_tenant_id UUID DEFAULT NULL,
    p_tahun INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_updated INTEGER,
    total_unchanged INTEGER,
    total_not_found INTEGER
) AS $$
DECLARE
    v_updated INTEGER := 0;
    v_unchanged INTEGER := 0;
    v_not_found INTEGER := 0;
    v_tenant_filter UUID;
    v_tahun_filter INTEGER;
BEGIN
    -- Set filter
    v_tenant_filter := COALESCE(p_tenant_id, (SELECT id FROM tenants LIMIT 1));
    v_tahun_filter := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    -- Update records yang tidak sinkron
    WITH updated_records AS (
        UPDATE kalkulasi_tindakan_rawat_jalan k
        SET biaya_bahan_tindakan = COALESCE(d.biaya_bahan_tindakan, 0),
            updated_at = NOW()
        FROM daftar_tindakan d
        WHERE d.kode_tindakan = k.kode_jenis_tindakan
            AND d.tenant_id = k.tenant_id
            AND k.tenant_id = v_tenant_filter
            AND k.tahun = v_tahun_filter
            AND k.biaya_bahan_tindakan != COALESCE(d.biaya_bahan_tindakan, 0)
        RETURNING k.id
    )
    SELECT COUNT(*) INTO v_updated FROM updated_records;
    
    -- Hitung records yang sudah sinkron (tidak perlu update)
    SELECT COUNT(*) INTO v_unchanged
    FROM kalkulasi_tindakan_rawat_jalan k
    INNER JOIN daftar_tindakan d ON 
        d.kode_tindakan = k.kode_jenis_tindakan 
        AND d.tenant_id = k.tenant_id
    WHERE k.tenant_id = v_tenant_filter
        AND k.tahun = v_tahun_filter
        AND k.biaya_bahan_tindakan = COALESCE(d.biaya_bahan_tindakan, 0);
    
    -- Hitung records yang tidak ada di daftar_tindakan
    SELECT COUNT(*) INTO v_not_found
    FROM kalkulasi_tindakan_rawat_jalan k
    LEFT JOIN daftar_tindakan d ON 
        d.kode_tindakan = k.kode_jenis_tindakan 
        AND d.tenant_id = k.tenant_id
    WHERE k.tenant_id = v_tenant_filter
        AND k.tahun = v_tahun_filter
        AND d.id IS NULL;
    
    RETURN QUERY SELECT v_updated, v_unchanged, v_not_found;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION manual_sync_biaya_bahan_rawat_jalan(UUID, INTEGER) IS
'Function untuk manual sync biaya_bahan_tindakan dari daftar_tindakan ke kalkulasi_tindakan_rawat_jalan.
Parameters:
- p_tenant_id: UUID tenant (optional, default tenant pertama)
- p_tahun: Tahun data (optional, default tahun sekarang)
Returns: total_updated, total_unchanged, total_not_found';

-- ============================================================================
-- STEP 5: Jalankan sync manual untuk data existing
-- ============================================================================

DO $$
DECLARE
    v_result RECORD;
BEGIN
    -- Sync untuk tenant pertama, tahun sekarang
    SELECT * INTO v_result
    FROM manual_sync_biaya_bahan_rawat_jalan(
        (SELECT id FROM tenants LIMIT 1),
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    );
    
    RAISE NOTICE 'Sync completed: % updated, % unchanged, % not found',
        v_result.total_updated, v_result.total_unchanged, v_result.total_not_found;
END $$;

-- ============================================================================
-- STEP 6: Verifikasi hasil
-- ============================================================================

-- Tampilkan statistik sinkronisasi
SELECT 
    COUNT(*) as total_records,
    COUNT(d.id) as total_match_dengan_master,
    COUNT(CASE WHEN k.biaya_bahan_tindakan = COALESCE(d.biaya_bahan_tindakan, 0) THEN 1 END) as total_sinkron,
    COUNT(CASE WHEN k.biaya_bahan_tindakan != COALESCE(d.biaya_bahan_tindakan, 0) THEN 1 END) as total_tidak_sinkron,
    ROUND(
        COUNT(CASE WHEN k.biaya_bahan_tindakan = COALESCE(d.biaya_bahan_tindakan, 0) THEN 1 END)::numeric 
        / NULLIF(COUNT(*), 0)::numeric * 100, 
        2
    ) as persen_sinkron
FROM kalkulasi_tindakan_rawat_jalan k
LEFT JOIN daftar_tindakan d ON 
    d.kode_tindakan = k.kode_jenis_tindakan 
    AND d.tenant_id = k.tenant_id
WHERE k.tenant_id = (SELECT id FROM tenants LIMIT 1)
    AND k.tahun = EXTRACT(YEAR FROM CURRENT_DATE);
