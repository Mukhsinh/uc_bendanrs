-- Migration: Create tenants table for multi-tenant system
-- Date: 2025-11-24
-- Requirements: 1.1, 4.1

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata untuk informasi tambahan tenant
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status tenant
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT tenants_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants(created_at);

-- Add comment untuk dokumentasi
COMMENT ON TABLE public.tenants IS 'Tabel untuk menyimpan informasi tenant/rumah sakit dalam sistem multi-tenant';
COMMENT ON COLUMN public.tenants.id IS 'UUID unik untuk setiap tenant';
COMMENT ON COLUMN public.tenants.name IS 'Nama rumah sakit/tenant';
COMMENT ON COLUMN public.tenants.slug IS 'URL-friendly identifier untuk tenant';
COMMENT ON COLUMN public.tenants.logo_url IS 'URL logo tenant untuk branding';
COMMENT ON COLUMN public.tenants.metadata IS 'Data tambahan tenant dalam format JSON';
COMMENT ON COLUMN public.tenants.is_active IS 'Status aktif tenant, false = tenant dinonaktifkan';

-- Create trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();
