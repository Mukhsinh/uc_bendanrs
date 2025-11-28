-- Add tenant_id to Critical Tables - Batch 1
-- Task 2.1: Add tenant_id column to existing tables
-- Requirements: 4.1

-- ============================================================================
-- BATCH 1: CRITICAL MASTER TABLES
-- ============================================================================

-- Table: data_biaya (Cost data - CRITICAL)
ALTER TABLE data_biaya 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE data_biaya
ADD CONSTRAINT fk_data_biaya_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_data_biaya_tenant_id ON data_biaya(tenant_id);

-- Table: data_pendapatan (Revenue data - CRITICAL)
ALTER TABLE data_pendapatan 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE data_pendapatan
ADD CONSTRAINT fk_data_pendapatan_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_data_pendapatan_tenant_id ON data_pendapatan(tenant_id);

-- Table: data_kegiatan (Activity data - CRITICAL)
ALTER TABLE data_kegiatan 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE data_kegiatan
ADD CONSTRAINT fk_data_kegiatan_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_data_kegiatan_tenant_id ON data_kegiatan(tenant_id);

-- Table: daftar_tindakan (Action list - CRITICAL)
ALTER TABLE daftar_tindakan 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE daftar_tindakan
ADD CONSTRAINT fk_daftar_tindakan_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_daftar_tindakan_tenant_id ON daftar_tindakan(tenant_id);

-- Table: distribusi_biaya_pertama (Cost distribution - CRITICAL)
ALTER TABLE distribusi_biaya_pertama 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE distribusi_biaya_pertama
ADD CONSTRAINT fk_distribusi_biaya_pertama_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_pertama_tenant_id 
ON distribusi_biaya_pertama(tenant_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns added
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
  AND table_name IN (
    'data_biaya',
    'data_pendapatan', 
    'data_kegiatan',
    'daftar_tindakan',
    'distribusi_biaya_pertama'
  )
ORDER BY table_name;
