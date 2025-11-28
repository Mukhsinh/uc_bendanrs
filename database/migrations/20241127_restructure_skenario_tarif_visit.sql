-- =====================================================
-- RESTRUCTURE SKENARIO TARIF VISIT
-- Tanggal: 27 November 2024
-- Deskripsi: Menambahkan kolom jasa sarana, jasa pelayanan medis/non medis, dan tarif otomatis
-- =====================================================

-- Drop tabel lama jika ada (backup dulu jika perlu)
-- CREATE TABLE skenario_tarif_visit_backup AS SELECT * FROM skenario_tarif_visit;

-- Drop dan recreate tabel dengan struktur baru
DROP TABLE IF EXISTS skenario_tarif_visit CASCADE;

CREATE TABLE skenario_tarif_visit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tahun INTEGER NOT NULL DEFAULT 2025,
  user_id UUID REFERENCES auth.users(id),
  
  -- Kolom tindakan (nama jenis visit/konsultasi)
  tindakan TEXT NOT NULL,
  
  -- Kolom yang dapat diedit manual
  jasa_sarana NUMERIC(15,2) DEFAULT 0,
  jasa_pelayanan_medis NUMERIC(15,2) DEFAULT 0,
  jasa_pelayanan_non_medis NUMERIC(15,2) DEFAULT 0,
  
  -- Kolom tarif (auto-calculated)
  tarif NUMERIC(15,2) GENERATED ALWAYS AS (
    COALESCE(jasa_sarana, 0) + 
    COALESCE(jasa_pelayanan_medis, 0) + 
    COALESCE(jasa_pelayanan_non_medis, 0)
  ) STORED,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint
  UNIQUE(tenant_id, tahun, tindakan)
);

-- Create indexes
CREATE INDEX idx_skenario_tarif_visit_tenant_tahun ON skenario_tarif_visit(tenant_id, tahun);
CREATE INDEX idx_skenario_tarif_visit_tindakan ON skenario_tarif_visit(tindakan);

-- Enable RLS
ALTER TABLE skenario_tarif_visit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant's skenario tarif visit"
ON skenario_tarif_visit FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert their tenant's skenario tarif visit"
ON skenario_tarif_visit FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update their tenant's skenario tarif visit"
ON skenario_tarif_visit FOR UPDATE
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete their tenant's skenario tarif visit"
ON skenario_tarif_visit FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_update_skenario_tarif_visit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_skenario_tarif_visit_timestamp
  BEFORE UPDATE ON skenario_tarif_visit
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_skenario_tarif_visit_timestamp();

-- Fungsi untuk populate data dari produk_layanan
CREATE OR REPLACE FUNCTION populate_skenario_tarif_visit(
  p_tenant_id UUID DEFAULT NULL,
  p_tahun INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_tahun INTEGER;
BEGIN
  -- Tentukan tenant_id
  v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id());
  
  -- Tentukan tahun
  v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  -- Hapus data lama untuk tahun dan tenant ini
  DELETE FROM skenario_tarif_visit 
  WHERE tenant_id = v_tenant_id 
    AND tahun = v_tahun;
  
  -- Insert data untuk Visit Dokter Umum
  INSERT INTO skenario_tarif_visit (
    tenant_id, tahun, tindakan, 
    jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
    user_id
  )
  SELECT 
    v_tenant_id,
    v_tahun,
    'Visit Dokter Umum',
    COALESCE(AVG((visite->>'jasa_sarana')::numeric), 0),
    COALESCE(AVG((visite->>'jasa_pel_medis')::numeric), 0),
    COALESCE(AVG((visite->>'jasa_pel_non_medis')::numeric), 0),
    auth.uid()
  FROM produk_layanan
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun
    AND visite IS NOT NULL
    AND visite->>'jenis' = 'Dokter Umum'
  HAVING COUNT(*) > 0;
  
  -- Insert data untuk Visit Dokter Spesialis
  INSERT INTO skenario_tarif_visit (
    tenant_id, tahun, tindakan,
    jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
    user_id
  )
  SELECT 
    v_tenant_id,
    v_tahun,
    'Visit Dokter Spesialis',
    COALESCE(AVG((visite->>'jasa_sarana')::numeric), 0),
    COALESCE(AVG((visite->>'jasa_pel_medis')::numeric), 0),
    COALESCE(AVG((visite->>'jasa_pel_non_medis')::numeric), 0),
    auth.uid()
  FROM produk_layanan
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun
    AND visite IS NOT NULL
    AND visite->>'jenis' = 'Dokter Spesialis'
  HAVING COUNT(*) > 0;
  
  -- Insert data untuk Visit Dokter Subspesialis
  INSERT INTO skenario_tarif_visit (
    tenant_id, tahun, tindakan,
    jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
    user_id
  )
  SELECT 
    v_tenant_id,
    v_tahun,
    'Visit Dokter Subspesialis',
    COALESCE(AVG((visite->>'jasa_sarana')::numeric), 0),
    COALESCE(AVG((visite->>'jasa_pel_medis')::numeric), 0),
    COALESCE(AVG((visite->>'jasa_pel_non_medis')::numeric), 0),
    auth.uid()
  FROM produk_layanan
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun
    AND visite IS NOT NULL
    AND visite->>'jenis' = 'Dokter Subspesialis'
  HAVING COUNT(*) > 0;
  
  -- Insert data untuk Konsultasi Dokter Spesialis
  INSERT INTO skenario_tarif_visit (
    tenant_id, tahun, tindakan,
    jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
    user_id
  )
  SELECT 
    v_tenant_id,
    v_tahun,
    'Konsultasi Dokter Spesialis',
    COALESCE(AVG((konsultasi->>'jasa_sarana')::numeric), 0),
    COALESCE(AVG((konsultasi->>'jasa_pel_medis')::numeric), 0),
    COALESCE(AVG((konsultasi->>'jasa_pel_non_medis')::numeric), 0),
    auth.uid()
  FROM produk_layanan
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun
    AND konsultasi IS NOT NULL
    AND konsultasi->>'jenis' = 'Dokter Spesialis'
  HAVING COUNT(*) > 0;
  
  -- Insert data untuk Konsultasi Dokter Subspesialis
  INSERT INTO skenario_tarif_visit (
    tenant_id, tahun, tindakan,
    jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
    user_id
  )
  SELECT 
    v_tenant_id,
    v_tahun,
    'Konsultasi Dokter Subspesialis',
    COALESCE(AVG((konsultasi->>'jasa_sarana')::numeric), 0),
    COALESCE(AVG((konsultasi->>'jasa_pel_medis')::numeric), 0),
    COALESCE(AVG((konsultasi->>'jasa_pel_non_medis')::numeric), 0),
    auth.uid()
  FROM produk_layanan
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun
    AND konsultasi IS NOT NULL
    AND konsultasi->>'jenis' = 'Dokter Subspesialis'
  HAVING COUNT(*) > 0;
  
  RAISE NOTICE 'Berhasil populate skenario tarif visit untuk tenant % tahun %', v_tenant_id, v_tahun;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION populate_skenario_tarif_visit(UUID, INTEGER) TO authenticated;

-- Insert default data jika belum ada
-- SELECT populate_skenario_tarif_visit(NULL, 2025);
