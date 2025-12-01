-- Migration: Create Backup and Audit System for Skenario Tarif
-- Date: 2024-12-01
-- Description: Membuat sistem backup otomatis dan audit trail untuk melindungi
--              data manual input (jasa_sarana, jasa_pelayanan) di skenario_tarif

-- ============================================================================
-- 1. TABEL BACKUP SKENARIO TARIF
-- ============================================================================

-- Tabel untuk menyimpan snapshot data skenario_tarif
CREATE TABLE IF NOT EXISTS skenario_tarif_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID,
    tahun INTEGER NOT NULL,
    kode_jenis INTEGER,
    kode_unit_kerja VARCHAR(50),
    nama_unit_kerja VARCHAR(255),
    kode_operator VARCHAR(50),
    nama_operator VARCHAR(255),
    kode_tindakan VARCHAR(50),
    nama_tindakan VARCHAR(255),
    biaya_bahan BIGINT DEFAULT 0,
    unit_cost_per_tindakan BIGINT DEFAULT 0,
    jasa_sarana BIGINT DEFAULT 0,
    jasa_pelayanan_medis BIGINT DEFAULT 0,
    jasa_pelayanan_non_medis BIGINT DEFAULT 0,
    jasa_pelayanan BIGINT DEFAULT 0,
    tarif_per_tindakan BIGINT DEFAULT 0,
    prosentase_jasa_pelayanan NUMERIC(5,2) DEFAULT 0,
    prosentase_profit NUMERIC(5,2) DEFAULT 0,
    sumber_tabel VARCHAR(100),
    jenis VARCHAR(50),
    backup_type VARCHAR(20) NOT NULL, -- 'manual', 'auto', 'before_update'
    backup_reason TEXT,
    backup_at TIMESTAMPTZ DEFAULT NOW(),
    backup_by UUID,
    original_updated_at TIMESTAMPTZ,
    CONSTRAINT fk_skenario_tarif_backup_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_skenario_tarif_backup_original_id ON skenario_tarif_backup(original_id);
CREATE INDEX IF NOT EXISTS idx_skenario_tarif_backup_tenant_tahun ON skenario_tarif_backup(tenant_id, tahun);
CREATE INDEX IF NOT EXISTS idx_skenario_tarif_backup_backup_at ON skenario_tarif_backup(backup_at DESC);
CREATE INDEX IF NOT EXISTS idx_skenario_tarif_backup_type ON skenario_tarif_backup(backup_type);

COMMENT ON TABLE skenario_tarif_backup IS 'Backup table untuk skenario_tarif, menyimpan snapshot data terutama input manual';
COMMENT ON COLUMN skenario_tarif_backup.backup_type IS 'Tipe backup: manual (user trigger), auto (scheduled), before_update (sebelum update)';

-- ============================================================================
-- 2. FUNGSI BACKUP MANUAL
-- ============================================================================

CREATE OR REPLACE FUNCTION backup_skenario_tarif_manual(
    p_tenant_id UUID DEFAULT NULL,
    p_tahun INTEGER DEFAULT NULL,
    p_reason TEXT DEFAULT 'Manual backup'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_tahun INTEGER;
    v_count INTEGER := 0;
BEGIN
    -- Set default values
    v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id());
    v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    -- Insert backup
    INSERT INTO skenario_tarif_backup (
        original_id, tenant_id, user_id, tahun,
        kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan,
        jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
        jasa_pelayanan, tarif_per_tindakan,
        prosentase_jasa_pelayanan, prosentase_profit,
        sumber_tabel, jenis,
        backup_type, backup_reason, backup_by, original_updated_at
    )
    SELECT 
        id, tenant_id, user_id, tahun,
        kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan,
        jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
        jasa_pelayanan, tarif_per_tindakan,
        prosentase_jasa_pelayanan, prosentase_profit,
        sumber_tabel, jenis,
        'manual', p_reason, auth.uid(), updated_at
    FROM skenario_tarif
    WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RAISE NOTICE 'Backup berhasil: % records untuk tenant % tahun %', v_count, v_tenant_id, v_tahun;
    
    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION backup_skenario_tarif_manual IS 
'Backup manual data skenario_tarif. Gunakan sebelum melakukan operasi besar seperti perbarui data.';

-- ============================================================================
-- 3. TRIGGER BACKUP SEBELUM UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_backup_before_update_skenario_tarif()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Backup hanya jika ada perubahan pada kolom manual input
    IF (OLD.jasa_sarana IS DISTINCT FROM NEW.jasa_sarana) OR
       (OLD.jasa_pelayanan_medis IS DISTINCT FROM NEW.jasa_pelayanan_medis) OR
       (OLD.jasa_pelayanan_non_medis IS DISTINCT FROM NEW.jasa_pelayanan_non_medis) THEN
        
        -- Insert backup dengan data OLD (sebelum update)
        INSERT INTO skenario_tarif_backup (
            original_id, tenant_id, user_id, tahun,
            kode_jenis, kode_unit_kerja, nama_unit_kerja,
            kode_operator, nama_operator, kode_tindakan, nama_tindakan,
            biaya_bahan, unit_cost_per_tindakan,
            jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
            jasa_pelayanan, tarif_per_tindakan,
            prosentase_jasa_pelayanan, prosentase_profit,
            sumber_tabel, jenis,
            backup_type, backup_reason, backup_by, original_updated_at
        ) VALUES (
            OLD.id, OLD.tenant_id, OLD.user_id, OLD.tahun,
            OLD.kode_jenis, OLD.kode_unit_kerja, OLD.nama_unit_kerja,
            OLD.kode_operator, OLD.nama_operator, OLD.kode_tindakan, OLD.nama_tindakan,
            OLD.biaya_bahan, OLD.unit_cost_per_tindakan,
            OLD.jasa_sarana, OLD.jasa_pelayanan_medis, OLD.jasa_pelayanan_non_medis,
            OLD.jasa_pelayanan, OLD.tarif_per_tindakan,
            OLD.prosentase_jasa_pelayanan, OLD.prosentase_profit,
            OLD.sumber_tabel, OLD.jenis,
            'before_update', 
            'Auto backup before update: jasa_sarana/pelayanan changed',
            auth.uid(), 
            OLD.updated_at
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Buat trigger (hanya jika belum ada)
DROP TRIGGER IF EXISTS trigger_backup_skenario_tarif_before_update ON skenario_tarif;
CREATE TRIGGER trigger_backup_skenario_tarif_before_update
    BEFORE UPDATE ON skenario_tarif
    FOR EACH ROW
    EXECUTE FUNCTION trigger_backup_before_update_skenario_tarif();

COMMENT ON TRIGGER trigger_backup_skenario_tarif_before_update ON skenario_tarif IS
'Backup otomatis sebelum update jika ada perubahan pada jasa_sarana atau jasa_pelayanan';

-- ============================================================================
-- 4. FUNGSI RESTORE DATA
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_skenario_tarif_from_backup(
    p_backup_id UUID DEFAULT NULL,
    p_backup_date TIMESTAMPTZ DEFAULT NULL,
    p_tenant_id UUID DEFAULT NULL,
    p_tahun INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_tahun INTEGER;
    v_count INTEGER := 0;
    v_backup_date TIMESTAMPTZ;
BEGIN
    v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id());
    v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    -- Jika ada backup_id spesifik, restore dari backup tersebut
    IF p_backup_id IS NOT NULL THEN
        UPDATE skenario_tarif st
        SET 
            jasa_sarana = b.jasa_sarana,
            jasa_pelayanan_medis = b.jasa_pelayanan_medis,
            jasa_pelayanan_non_medis = b.jasa_pelayanan_non_medis,
            updated_at = NOW()
        FROM skenario_tarif_backup b
        WHERE st.id = b.original_id
        AND b.id = p_backup_id;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    -- Jika ada backup_date, restore dari backup terdekat sebelum tanggal tersebut
    ELSIF p_backup_date IS NOT NULL THEN
        WITH latest_backup AS (
            SELECT DISTINCT ON (original_id)
                original_id,
                jasa_sarana,
                jasa_pelayanan_medis,
                jasa_pelayanan_non_medis
            FROM skenario_tarif_backup
            WHERE tenant_id = v_tenant_id
            AND tahun = v_tahun
            AND backup_at <= p_backup_date
            ORDER BY original_id, backup_at DESC
        )
        UPDATE skenario_tarif st
        SET 
            jasa_sarana = lb.jasa_sarana,
            jasa_pelayanan_medis = lb.jasa_pelayanan_medis,
            jasa_pelayanan_non_medis = lb.jasa_pelayanan_non_medis,
            updated_at = NOW()
        FROM latest_backup lb
        WHERE st.id = lb.original_id;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    -- Jika tidak ada parameter, restore dari backup terbaru
    ELSE
        WITH latest_backup AS (
            SELECT DISTINCT ON (original_id)
                original_id,
                jasa_sarana,
                jasa_pelayanan_medis,
                jasa_pelayanan_non_medis
            FROM skenario_tarif_backup
            WHERE tenant_id = v_tenant_id
            AND tahun = v_tahun
            ORDER BY original_id, backup_at DESC
        )
        UPDATE skenario_tarif st
        SET 
            jasa_sarana = lb.jasa_sarana,
            jasa_pelayanan_medis = lb.jasa_pelayanan_medis,
            jasa_pelayanan_non_medis = lb.jasa_pelayanan_non_medis,
            updated_at = NOW()
        FROM latest_backup lb
        WHERE st.id = lb.original_id;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;
    
    RAISE NOTICE 'Restore berhasil: % records', v_count;
    
    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION restore_skenario_tarif_from_backup IS 
'Restore data jasa_sarana dan jasa_pelayanan dari backup. 
Parameter: backup_id (restore spesifik), backup_date (restore dari tanggal), atau NULL (restore terbaru)';

-- ============================================================================
-- 5. FUNGSI CLEANUP BACKUP LAMA
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_skenario_tarif_backup(
    p_keep_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Hapus backup yang lebih lama dari p_keep_days hari
    -- Kecuali backup manual (keep forever)
    DELETE FROM skenario_tarif_backup
    WHERE backup_at < NOW() - (p_keep_days || ' days')::INTERVAL
    AND backup_type != 'manual';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleanup berhasil: % backup records dihapus', v_count;
    
    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_skenario_tarif_backup IS 
'Cleanup backup lama (default 90 hari). Backup manual tidak akan dihapus.';

-- ============================================================================
-- 6. VIEW UNTUK MONITORING
-- ============================================================================

CREATE OR REPLACE VIEW view_skenario_tarif_backup_summary AS
SELECT 
    tenant_id,
    tahun,
    backup_type,
    COUNT(*) as total_backups,
    COUNT(DISTINCT original_id) as unique_records,
    MIN(backup_at) as earliest_backup,
    MAX(backup_at) as latest_backup,
    COUNT(CASE WHEN jasa_sarana > 0 THEN 1 END) as records_with_jasa_sarana,
    COUNT(CASE WHEN jasa_pelayanan > 0 THEN 1 END) as records_with_jasa_pelayanan
FROM skenario_tarif_backup
GROUP BY tenant_id, tahun, backup_type
ORDER BY tenant_id, tahun DESC, backup_type;

COMMENT ON VIEW view_skenario_tarif_backup_summary IS 
'Summary backup skenario_tarif per tenant, tahun, dan tipe backup';

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE skenario_tarif_backup ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (tenant isolation)
DROP POLICY IF EXISTS skenario_tarif_backup_select_policy ON skenario_tarif_backup;
CREATE POLICY skenario_tarif_backup_select_policy ON skenario_tarif_backup
    FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Policy untuk INSERT (tenant isolation)
DROP POLICY IF EXISTS skenario_tarif_backup_insert_policy ON skenario_tarif_backup;
CREATE POLICY skenario_tarif_backup_insert_policy ON skenario_tarif_backup
    FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Policy untuk DELETE (tenant isolation)
DROP POLICY IF EXISTS skenario_tarif_backup_delete_policy ON skenario_tarif_backup;
CREATE POLICY skenario_tarif_backup_delete_policy ON skenario_tarif_backup
    FOR DELETE
    USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT ON skenario_tarif_backup TO authenticated;
GRANT SELECT ON view_skenario_tarif_backup_summary TO authenticated;
GRANT EXECUTE ON FUNCTION backup_skenario_tarif_manual TO authenticated;
GRANT EXECUTE ON FUNCTION restore_skenario_tarif_from_backup TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_skenario_tarif_backup TO authenticated;

-- ============================================================================
-- SELESAI
-- ============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Backup and Audit System untuk Skenario Tarif berhasil dibuat';
    RAISE NOTICE 'Tabel: skenario_tarif_backup';
    RAISE NOTICE 'Fungsi: backup_skenario_tarif_manual, restore_skenario_tarif_from_backup, cleanup_old_skenario_tarif_backup';
    RAISE NOTICE 'Trigger: trigger_backup_skenario_tarif_before_update';
    RAISE NOTICE 'View: view_skenario_tarif_backup_summary';
END $$;
