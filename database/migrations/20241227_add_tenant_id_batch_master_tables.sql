-- ============================================================================
-- BATCH 1: MASTER TABLES - Penambahan tenant_id ke Tabel Master
-- ============================================================================
-- Tanggal: 2024-12-27
-- Deskripsi: Menambahkan kolom tenant_id ke tabel-tabel master utama
-- Prioritas: TINGGI
-- ============================================================================

BEGIN;

-- 1. unit_kerja (Tabel Master Paling Kritis)
ALTER TABLE unit_kerja 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_unit_kerja_tenant_id ON unit_kerja(tenant_id);

-- Populate dengan default tenant
UPDATE unit_kerja 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

-- Set NOT NULL setelah populate
ALTER TABLE unit_kerja 
ALTER COLUMN tenant_id SET NOT NULL;

-- RLS Policy
ALTER TABLE unit_kerja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_unit_kerja ON unit_kerja;
CREATE POLICY tenant_isolation_unit_kerja ON unit_kerja
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 2. klinik
ALTER TABLE klinik 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_klinik_tenant_id ON klinik(tenant_id);

UPDATE klinik 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE klinik 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE klinik ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_klinik ON klinik;
CREATE POLICY tenant_isolation_klinik ON klinik
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 3. data_dokter
ALTER TABLE data_dokter 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_data_dokter_tenant_id ON data_dokter(tenant_id);

UPDATE data_dokter 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE data_dokter 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE data_dokter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_data_dokter ON data_dokter;
CREATE POLICY tenant_isolation_data_dokter ON data_dokter
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 4. Data_Kamar
ALTER TABLE "Data_Kamar" 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_data_kamar_tenant_id ON "Data_Kamar"(tenant_id);

UPDATE "Data_Kamar" 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE "Data_Kamar" 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE "Data_Kamar" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_data_kamar ON "Data_Kamar";
CREATE POLICY tenant_isolation_data_kamar ON "Data_Kamar"
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 5. produk_layanan
ALTER TABLE produk_layanan 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_produk_layanan_tenant_id ON produk_layanan(tenant_id);

UPDATE produk_layanan 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE produk_layanan 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE produk_layanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_produk_layanan ON produk_layanan;
CREATE POLICY tenant_isolation_produk_layanan ON produk_layanan
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

COMMIT;

-- Verifikasi
SELECT 
    'unit_kerja' as table_name,
    COUNT(*) as total_rows,
    COUNT(tenant_id) as rows_with_tenant_id
FROM unit_kerja
UNION ALL
SELECT 'klinik', COUNT(*), COUNT(tenant_id) FROM klinik
UNION ALL
SELECT 'data_dokter', COUNT(*), COUNT(tenant_id) FROM data_dokter
UNION ALL
SELECT 'Data_Kamar', COUNT(*), COUNT(tenant_id) FROM "Data_Kamar"
UNION ALL
SELECT 'produk_layanan', COUNT(*), COUNT(tenant_id) FROM produk_layanan;
