-- ============================================================================
-- BATCH 2: ALOKASI & DISTRIBUSI - Penambahan tenant_id
-- ============================================================================
-- Tanggal: 2024-12-27
-- Deskripsi: Menambahkan kolom tenant_id ke tabel alokasi dan distribusi biaya
-- Prioritas: TINGGI
-- ============================================================================

BEGIN;

-- 1. Dasar_Alokasi
ALTER TABLE "Dasar_Alokasi" 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_tenant_id ON "Dasar_Alokasi"(tenant_id);

UPDATE "Dasar_Alokasi" 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE "Dasar_Alokasi" 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE "Dasar_Alokasi" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_dasar_alokasi ON "Dasar_Alokasi";
CREATE POLICY tenant_isolation_dasar_alokasi ON "Dasar_Alokasi"
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 2. mapping_dasar_alokasi
ALTER TABLE mapping_dasar_alokasi 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_mapping_dasar_alokasi_tenant_id ON mapping_dasar_alokasi(tenant_id);

UPDATE mapping_dasar_alokasi 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE mapping_dasar_alokasi 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE mapping_dasar_alokasi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_mapping_dasar_alokasi ON mapping_dasar_alokasi;
CREATE POLICY tenant_isolation_mapping_dasar_alokasi ON mapping_dasar_alokasi
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 3. distribusi_biaya_kedua
ALTER TABLE distribusi_biaya_kedua 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_kedua_tenant_id ON distribusi_biaya_kedua(tenant_id);

UPDATE distribusi_biaya_kedua 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE distribusi_biaya_kedua 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE distribusi_biaya_kedua ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_distribusi_biaya_kedua ON distribusi_biaya_kedua;
CREATE POLICY tenant_isolation_distribusi_biaya_kedua ON distribusi_biaya_kedua
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 4. distribusi_biaya_pertama_dengan_jp
ALTER TABLE distribusi_biaya_pertama_dengan_jp 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_pertama_dengan_jp_tenant_id 
ON distribusi_biaya_pertama_dengan_jp(tenant_id);

UPDATE distribusi_biaya_pertama_dengan_jp 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE distribusi_biaya_pertama_dengan_jp 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE distribusi_biaya_pertama_dengan_jp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_distribusi_biaya_pertama_dengan_jp 
ON distribusi_biaya_pertama_dengan_jp;
CREATE POLICY tenant_isolation_distribusi_biaya_pertama_dengan_jp 
ON distribusi_biaya_pertama_dengan_jp
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 5. distribusi_biaya_pertama_norm
ALTER TABLE distribusi_biaya_pertama_norm 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_pertama_norm_tenant_id 
ON distribusi_biaya_pertama_norm(tenant_id);

UPDATE distribusi_biaya_pertama_norm 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE distribusi_biaya_pertama_norm 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE distribusi_biaya_pertama_norm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_distribusi_biaya_pertama_norm 
ON distribusi_biaya_pertama_norm;
CREATE POLICY tenant_isolation_distribusi_biaya_pertama_norm 
ON distribusi_biaya_pertama_norm
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 6. distribusi_biaya_pertama_norm_dengan_jp
ALTER TABLE distribusi_biaya_pertama_norm_dengan_jp 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_pertama_norm_dengan_jp_tenant_id 
ON distribusi_biaya_pertama_norm_dengan_jp(tenant_id);

UPDATE distribusi_biaya_pertama_norm_dengan_jp 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE distribusi_biaya_pertama_norm_dengan_jp 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE distribusi_biaya_pertama_norm_dengan_jp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_distribusi_biaya_pertama_norm_dengan_jp 
ON distribusi_biaya_pertama_norm_dengan_jp;
CREATE POLICY tenant_isolation_distribusi_biaya_pertama_norm_dengan_jp 
ON distribusi_biaya_pertama_norm_dengan_jp
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- 7. distribusi_biaya_rekap
ALTER TABLE distribusi_biaya_rekap 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_rekap_tenant_id 
ON distribusi_biaya_rekap(tenant_id);

UPDATE distribusi_biaya_rekap 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE distribusi_biaya_rekap 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE distribusi_biaya_rekap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_distribusi_biaya_rekap 
ON distribusi_biaya_rekap;
CREATE POLICY tenant_isolation_distribusi_biaya_rekap 
ON distribusi_biaya_rekap
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

COMMIT;

-- Verifikasi
SELECT 
    'Dasar_Alokasi' as table_name,
    COUNT(*) as total_rows,
    COUNT(tenant_id) as rows_with_tenant_id
FROM "Dasar_Alokasi"
UNION ALL
SELECT 'mapping_dasar_alokasi', COUNT(*), COUNT(tenant_id) FROM mapping_dasar_alokasi
UNION ALL
SELECT 'distribusi_biaya_kedua', COUNT(*), COUNT(tenant_id) FROM distribusi_biaya_kedua
UNION ALL
SELECT 'distribusi_biaya_pertama_dengan_jp', COUNT(*), COUNT(tenant_id) 
FROM distribusi_biaya_pertama_dengan_jp
UNION ALL
SELECT 'distribusi_biaya_pertama_norm', COUNT(*), COUNT(tenant_id) 
FROM distribusi_biaya_pertama_norm
UNION ALL
SELECT 'distribusi_biaya_pertama_norm_dengan_jp', COUNT(*), COUNT(tenant_id) 
FROM distribusi_biaya_pertama_norm_dengan_jp
UNION ALL
SELECT 'distribusi_biaya_rekap', COUNT(*), COUNT(tenant_id) FROM distribusi_biaya_rekap;
