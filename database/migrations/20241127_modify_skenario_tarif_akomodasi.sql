-- =====================================================
-- Migration: Modifikasi Skenario Tarif Akomodasi
-- Deskripsi: Mengubah struktur tabel untuk mengambil data dari kalkulasi_biaya_kelas_akomodasi
--            dan menambahkan kolom profit yang bisa diedit manual
-- Tanggal: 2024-11-27
-- =====================================================

-- 1. Drop kolom rata_rata_uc yang lama (akan diganti dengan data dari kalkulasi)
ALTER TABLE skenario_tarif_akomodasi
DROP COLUMN IF EXISTS rata_rata_uc_vvip,
DROP COLUMN IF EXISTS rata_rata_uc_vip,
DROP COLUMN IF EXISTS rata_rata_uc_i,
DROP COLUMN IF EXISTS rata_rata_uc_ii,
DROP COLUMN IF EXISTS rata_rata_uc_iii;

-- 2. Tambahkan kolom untuk menyimpan data dari kalkulasi_biaya_kelas_akomodasi
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS kode_unit_kerja TEXT,
ADD COLUMN IF NOT EXISTS nama_unit_kerja TEXT,
ADD COLUMN IF NOT EXISTS unit_cost_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost_vip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost_i NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost_ii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost_iii NUMERIC DEFAULT 0;

-- 3. Pastikan kolom profit sudah ada (dari migration sebelumnya)
-- Kolom ini bisa diedit manual oleh user
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS profit_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_vip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_i NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_ii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_iii NUMERIC DEFAULT 0;

-- 4. Tambahkan kolom untuk average profit (calculated)
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS average_unit_cost_vvip NUMERIC,
ADD COLUMN IF NOT EXISTS average_unit_cost_vip NUMERIC,
ADD COLUMN IF NOT EXISTS average_unit_cost_i NUMERIC,
ADD COLUMN IF NOT EXISTS average_unit_cost_ii NUMERIC,
ADD COLUMN IF NOT EXISTS average_unit_cost_iii NUMERIC,
ADD COLUMN IF NOT EXISTS average_profit_vvip NUMERIC,
ADD COLUMN IF NOT EXISTS average_profit_vip NUMERIC,
ADD COLUMN IF NOT EXISTS average_profit_i NUMERIC,
ADD COLUMN IF NOT EXISTS average_profit_ii NUMERIC,
ADD COLUMN IF NOT EXISTS average_profit_iii NUMERIC;

-- 5. Tambahkan index untuk performa
CREATE INDEX IF NOT EXISTS idx_skenario_tarif_akomodasi_kode_unit 
ON skenario_tarif_akomodasi(kode_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_skenario_tarif_akomodasi_tenant_tahun 
ON skenario_tarif_akomodasi(tenant_id, tahun);

-- 6. Buat function untuk populate data dari kalkulasi_biaya_kelas_akomodasi
CREATE OR REPLACE FUNCTION populate_skenario_tarif_akomodasi(
    p_tenant_id UUID,
    p_tahun INTEGER
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    rows_affected INTEGER
) AS $$
DECLARE
    v_rows_affected INTEGER := 0;
    v_current_tenant_id UUID;
BEGIN
    -- Get current tenant_id from context
    v_current_tenant_id := COALESCE(
        p_tenant_id,
        current_setting('app.current_tenant_id', true)::UUID,
        (SELECT id FROM tenants WHERE is_default = true LIMIT 1)
    );

    -- Delete existing data untuk tahun ini
    DELETE FROM skenario_tarif_akomodasi
    WHERE tenant_id = v_current_tenant_id
    AND tahun = p_tahun;

    -- Insert data dari kalkulasi_biaya_kelas_akomodasi
    -- Setiap unit kerja akan menjadi 1 row
    INSERT INTO skenario_tarif_akomodasi (
        tenant_id,
        tahun,
        kode_unit_kerja,
        nama_unit_kerja,
        unit_cost_vvip,
        unit_cost_vip,
        unit_cost_i,
        unit_cost_ii,
        unit_cost_iii,
        profit_vvip,
        profit_vip,
        profit_i,
        profit_ii,
        profit_iii,
        tarif_vvip,
        tarif_vip,
        tarif_i,
        tarif_ii,
        tarif_iii
    )
    SELECT 
        v_current_tenant_id,
        p_tahun,
        kode_unit_kerja,
        nama_unit_kerja,
        -- Unit cost per kelas dari kalkulasi
        MAX(CASE WHEN kelas = 'VVIP' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as unit_cost_vvip,
        MAX(CASE WHEN kelas = 'VIP' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as unit_cost_vip,
        MAX(CASE WHEN kelas = 'I' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as unit_cost_i,
        MAX(CASE WHEN kelas = 'II' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as unit_cost_ii,
        MAX(CASE WHEN kelas = 'III' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as unit_cost_iii,
        -- Profit default 0 (akan diisi manual oleh user)
        0 as profit_vvip,
        0 as profit_vip,
        0 as profit_i,
        0 as profit_ii,
        0 as profit_iii,
        -- Tarif = unit_cost + profit (awalnya sama dengan unit_cost)
        MAX(CASE WHEN kelas = 'VVIP' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as tarif_vvip,
        MAX(CASE WHEN kelas = 'VIP' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as tarif_vip,
        MAX(CASE WHEN kelas = 'I' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as tarif_i,
        MAX(CASE WHEN kelas = 'II' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as tarif_ii,
        MAX(CASE WHEN kelas = 'III' THEN COALESCE(unit_cost_per_kelas, 0) ELSE 0 END) as tarif_iii
    FROM kalkulasi_biaya_kelas_akomodasi
    WHERE tenant_id = v_current_tenant_id
    AND tahun = p_tahun
    GROUP BY kode_unit_kerja, nama_unit_kerja;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    -- Hitung average untuk setiap kelas
    UPDATE skenario_tarif_akomodasi sta
    SET 
        average_unit_cost_vvip = (SELECT AVG(unit_cost_vvip) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND unit_cost_vvip > 0),
        average_unit_cost_vip = (SELECT AVG(unit_cost_vip) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND unit_cost_vip > 0),
        average_unit_cost_i = (SELECT AVG(unit_cost_i) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND unit_cost_i > 0),
        average_unit_cost_ii = (SELECT AVG(unit_cost_ii) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND unit_cost_ii > 0),
        average_unit_cost_iii = (SELECT AVG(unit_cost_iii) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND unit_cost_iii > 0),
        average_profit_vvip = (SELECT AVG(profit_vvip) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND profit_vvip > 0),
        average_profit_vip = (SELECT AVG(profit_vip) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND profit_vip > 0),
        average_profit_i = (SELECT AVG(profit_i) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND profit_i > 0),
        average_profit_ii = (SELECT AVG(profit_ii) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND profit_ii > 0),
        average_profit_iii = (SELECT AVG(profit_iii) FROM skenario_tarif_akomodasi WHERE tenant_id = v_current_tenant_id AND tahun = p_tahun AND profit_iii > 0)
    WHERE tenant_id = v_current_tenant_id
    AND tahun = p_tahun;

    RETURN QUERY SELECT true, 'Data berhasil dipopulate: ' || v_rows_affected || ' rows', v_rows_affected;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error: ' || SQLERRM, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Buat trigger untuk auto-update tarif ketika profit diubah
CREATE OR REPLACE FUNCTION auto_update_tarif_akomodasi()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tarif = unit_cost + profit
    NEW.tarif_vvip := COALESCE(NEW.unit_cost_vvip, 0) + COALESCE(NEW.profit_vvip, 0);
    NEW.tarif_vip := COALESCE(NEW.unit_cost_vip, 0) + COALESCE(NEW.profit_vip, 0);
    NEW.tarif_i := COALESCE(NEW.unit_cost_i, 0) + COALESCE(NEW.profit_i, 0);
    NEW.tarif_ii := COALESCE(NEW.unit_cost_ii, 0) + COALESCE(NEW.profit_ii, 0);
    NEW.tarif_iii := COALESCE(NEW.unit_cost_iii, 0) + COALESCE(NEW.profit_iii, 0);
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_tarif_akomodasi ON skenario_tarif_akomodasi;
CREATE TRIGGER trigger_auto_update_tarif_akomodasi
    BEFORE INSERT OR UPDATE ON skenario_tarif_akomodasi
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_tarif_akomodasi();

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION populate_skenario_tarif_akomodasi TO authenticated;

-- 9. Update RLS policies
DROP POLICY IF EXISTS "Users can view skenario_tarif_akomodasi for their tenant" ON skenario_tarif_akomodasi;
CREATE POLICY "Users can view skenario_tarif_akomodasi for their tenant"
    ON skenario_tarif_akomodasi FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert skenario_tarif_akomodasi for their tenant" ON skenario_tarif_akomodasi;
CREATE POLICY "Users can insert skenario_tarif_akomodasi for their tenant"
    ON skenario_tarif_akomodasi FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update skenario_tarif_akomodasi for their tenant" ON skenario_tarif_akomodasi;
CREATE POLICY "Users can update skenario_tarif_akomodasi for their tenant"
    ON skenario_tarif_akomodasi FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete skenario_tarif_akomodasi for their tenant" ON skenario_tarif_akomodasi;
CREATE POLICY "Users can delete skenario_tarif_akomodasi for their tenant"
    ON skenario_tarif_akomodasi FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

COMMENT ON FUNCTION populate_skenario_tarif_akomodasi IS 'Populate skenario tarif akomodasi dari data kalkulasi biaya kelas akomodasi';
COMMENT ON COLUMN skenario_tarif_akomodasi.unit_cost_vvip IS 'Unit cost VVIP dari kalkulasi (read-only)';
COMMENT ON COLUMN skenario_tarif_akomodasi.profit_vvip IS 'Profit VVIP yang bisa diedit manual';
COMMENT ON COLUMN skenario_tarif_akomodasi.tarif_vvip IS 'Tarif VVIP = unit_cost + profit (auto-calculated)';
