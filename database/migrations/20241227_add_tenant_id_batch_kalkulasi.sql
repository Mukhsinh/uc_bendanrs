-- ============================================================================
-- BATCH 3: KALKULASI - Penambahan tenant_id ke Tabel Kalkulasi
-- ============================================================================
-- Tanggal: 2024-12-27
-- Deskripsi: Menambahkan kolom tenant_id ke tabel-tabel kalkulasi biaya
-- Prioritas: TINGGI
-- ============================================================================

BEGIN;

-- 1. kalkulasi_biaya_laboratorium
ALTER TABLE kalkulasi_biaya_laboratorium 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_biaya_laboratorium_tenant_id 
ON kalkulasi_biaya_laboratorium(tenant_id);

UPDATE kalkulasi_biaya_laboratorium 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_biaya_laboratorium 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_biaya_laboratorium ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_biaya_laboratorium 
ON kalkulasi_biaya_laboratorium;
CREATE POLICY tenant_isolation_kalkulasi_biaya_laboratorium 
ON kalkulasi_biaya_laboratorium
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 2. kalkulasi_biaya_radiologi
ALTER TABLE kalkulasi_biaya_radiologi 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_biaya_radiologi_tenant_id 
ON kalkulasi_biaya_radiologi(tenant_id);

UPDATE kalkulasi_biaya_radiologi 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_biaya_radiologi 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_biaya_radiologi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_biaya_radiologi 
ON kalkulasi_biaya_radiologi;
CREATE POLICY tenant_isolation_kalkulasi_biaya_radiologi 
ON kalkulasi_biaya_radiologi
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 3. kalkulasi_biaya_operatif
ALTER TABLE kalkulasi_biaya_operatif 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_biaya_operatif_tenant_id 
ON kalkulasi_biaya_operatif(tenant_id);

UPDATE kalkulasi_biaya_operatif 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_biaya_operatif 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_biaya_operatif ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_biaya_operatif 
ON kalkulasi_biaya_operatif;
CREATE POLICY tenant_isolation_kalkulasi_biaya_operatif 
ON kalkulasi_biaya_operatif
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 4. kalkulasi_biaya_cathlab
ALTER TABLE kalkulasi_biaya_cathlab 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_biaya_cathlab_tenant_id 
ON kalkulasi_biaya_cathlab(tenant_id);

UPDATE kalkulasi_biaya_cathlab 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_biaya_cathlab 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_biaya_cathlab ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_biaya_cathlab 
ON kalkulasi_biaya_cathlab;
CREATE POLICY tenant_isolation_kalkulasi_biaya_cathlab 
ON kalkulasi_biaya_cathlab
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 5. kalkulasi_bdrs
ALTER TABLE kalkulasi_bdrs 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_bdrs_tenant_id 
ON kalkulasi_bdrs(tenant_id);

UPDATE kalkulasi_bdrs 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_bdrs 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_bdrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_bdrs 
ON kalkulasi_bdrs;
CREATE POLICY tenant_isolation_kalkulasi_bdrs 
ON kalkulasi_bdrs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 6. kalkulasi_biaya_gizi
ALTER TABLE kalkulasi_biaya_gizi 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_biaya_gizi_tenant_id 
ON kalkulasi_biaya_gizi(tenant_id);

UPDATE kalkulasi_biaya_gizi 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_biaya_gizi 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_biaya_gizi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_biaya_gizi 
ON kalkulasi_biaya_gizi;
CREATE POLICY tenant_isolation_kalkulasi_biaya_gizi 
ON kalkulasi_biaya_gizi
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 7. kalkulasi_diklat
ALTER TABLE kalkulasi_diklat 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_tenant_id 
ON kalkulasi_diklat(tenant_id);

UPDATE kalkulasi_diklat 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_diklat 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_diklat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_diklat 
ON kalkulasi_diklat;
CREATE POLICY tenant_isolation_kalkulasi_diklat 
ON kalkulasi_diklat
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 8. kalkulasi_daftar_dan_resep
ALTER TABLE kalkulasi_daftar_dan_resep 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_daftar_dan_resep_tenant_id 
ON kalkulasi_daftar_dan_resep(tenant_id);

UPDATE kalkulasi_daftar_dan_resep 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE kalkulasi_daftar_dan_resep 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE kalkulasi_daftar_dan_resep ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_kalkulasi_daftar_dan_resep 
ON kalkulasi_daftar_dan_resep;
CREATE POLICY tenant_isolation_kalkulasi_daftar_dan_resep 
ON kalkulasi_daftar_dan_resep
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

COMMIT;

-- Verifikasi
SELECT 
    'kalkulasi_biaya_laboratorium' as table_name,
    COUNT(*) as total_rows,
    COUNT(tenant_id) as rows_with_tenant_id
FROM kalkulasi_biaya_laboratorium
UNION ALL
SELECT 'kalkulasi_biaya_radiologi', COUNT(*), COUNT(tenant_id) 
FROM kalkulasi_biaya_radiologi
UNION ALL
SELECT 'kalkulasi_biaya_operatif', COUNT(*), COUNT(tenant_id) 
FROM kalkulasi_biaya_operatif
UNION ALL
SELECT 'kalkulasi_biaya_cathlab', COUNT(*), COUNT(tenant_id) 
FROM kalkulasi_biaya_cathlab
UNION ALL
SELECT 'kalkulasi_bdrs', COUNT(*), COUNT(tenant_id) FROM kalkulasi_bdrs
UNION ALL
SELECT 'kalkulasi_biaya_gizi', COUNT(*), COUNT(tenant_id) FROM kalkulasi_biaya_gizi
UNION ALL
SELECT 'kalkulasi_diklat', COUNT(*), COUNT(tenant_id) FROM kalkulasi_diklat
UNION ALL
SELECT 'kalkulasi_daftar_dan_resep', COUNT(*), COUNT(tenant_id) 
FROM kalkulasi_daftar_dan_resep;
