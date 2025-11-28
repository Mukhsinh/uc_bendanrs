-- Migration: Create user_profiles table for extended user information
-- Date: 2025-11-24
-- Requirements: 3.4

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Extended user information
  full_name TEXT,
  phone TEXT,
  
  -- User status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_profiles_phone_format 
    CHECK (phone IS NULL OR phone ~ '^[0-9+\-\s()]+$')
);

-- Create indexes untuk query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_active 
  ON public.user_profiles(tenant_id, is_active);

-- Add comments untuk dokumentasi
COMMENT ON TABLE public.user_profiles IS 'Tabel untuk menyimpan informasi extended user dan link ke tenant';
COMMENT ON COLUMN public.user_profiles.user_id IS 'Foreign key ke auth.users';
COMMENT ON COLUMN public.user_profiles.tenant_id IS 'Foreign key ke tenant yang dimiliki user';
COMMENT ON COLUMN public.user_profiles.full_name IS 'Nama lengkap user';
COMMENT ON COLUMN public.user_profiles.phone IS 'Nomor telepon user';
COMMENT ON COLUMN public.user_profiles.is_active IS 'Status aktif user, false = user dinonaktifkan';
COMMENT ON COLUMN public.user_profiles.created_at IS 'Timestamp ketika profile dibuat';
COMMENT ON COLUMN public.user_profiles.updated_at IS 'Timestamp ketika profile terakhir diupdate';

-- Create trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create view untuk kemudahan akses user dengan tenant info
CREATE OR REPLACE VIEW public.user_tenants AS
SELECT 
  u.id as user_id,
  u.email,
  u.raw_app_meta_data->>'tenant_id' as tenant_id_from_metadata,
  u.raw_app_meta_data->>'role' as role,
  up.tenant_id,
  up.full_name,
  up.phone,
  up.is_active,
  t.name as tenant_name,
  t.slug as tenant_slug,
  t.is_active as tenant_is_active
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.tenants t ON up.tenant_id = t.id;

COMMENT ON VIEW public.user_tenants IS 'View untuk melihat user dengan informasi tenant mereka';
