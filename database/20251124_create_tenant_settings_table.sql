-- Migration: Create tenant_settings table for tenant-specific configurations
-- Date: 2025-11-24
-- Requirements: 7.1, 7.2

-- Create tenant_settings table
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Preferensi Biaya
  include_jasa_pelayanan BOOLEAN DEFAULT true,
  default_allocation_method TEXT DEFAULT 'double_distribution',
  
  -- Konfigurasi Kalkulasi
  -- Menyimpan preferensi kalkulasi spesifik tenant dalam format JSON
  calculation_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Branding
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT tenant_settings_allocation_method_valid 
    CHECK (default_allocation_method IN ('single_distribution', 'double_distribution')),
  CONSTRAINT tenant_settings_primary_color_format 
    CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  CONSTRAINT tenant_settings_secondary_color_format 
    CHECK (secondary_color ~ '^#[0-9a-fA-F]{6}$')
);

-- Create index untuk foreign key
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON public.tenant_settings(tenant_id);

-- Add comments untuk dokumentasi
COMMENT ON TABLE public.tenant_settings IS 'Tabel untuk menyimpan konfigurasi dan preferensi spesifik setiap tenant';
COMMENT ON COLUMN public.tenant_settings.tenant_id IS 'Foreign key ke tabel tenants';
COMMENT ON COLUMN public.tenant_settings.include_jasa_pelayanan IS 'Flag untuk include/exclude jasa pelayanan dalam kalkulasi';
COMMENT ON COLUMN public.tenant_settings.default_allocation_method IS 'Metode alokasi biaya default (single_distribution atau double_distribution)';
COMMENT ON COLUMN public.tenant_settings.calculation_preferences IS 'Preferensi kalkulasi tambahan dalam format JSON';
COMMENT ON COLUMN public.tenant_settings.primary_color IS 'Warna primary untuk branding tenant (format hex)';
COMMENT ON COLUMN public.tenant_settings.secondary_color IS 'Warna secondary untuk branding tenant (format hex)';

-- Create trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenant_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_settings_updated_at();
