-- ============================================================================
-- SQL INITIALIZATION FOR MULTI-TENANT SYSTEM
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- 3. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  level INTEGER DEFAULT 10
);

-- 4. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  role_id INTEGER REFERENCES public.roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. Insert Initial Data
INSERT INTO public.tenants (name, slug) 
VALUES ('RSUD Bendan', 'rsud-bendan') 
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.roles (name, level, description) 
VALUES 
  ('admin', 0, 'Super Admin with access to all data'),
  ('user', 1, 'Regular User restricted to specific tenant')
ON CONFLICT (name) DO NOTHING;

-- 6. Helper Functions (if needed by application)
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  v_is_super_admin BOOLEAN;
BEGIN
  -- Superadmin is defined as having role 'admin'
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.user_id = p_user_id AND r.name = 'admin'
  ) INTO v_is_super_admin;
  
  RETURN v_is_super_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to see active tenants (for login selection)
DROP POLICY IF EXISTS "Public can view active tenants" ON public.tenants;
CREATE POLICY "Public can view active tenants" ON public.tenants
FOR SELECT USING (is_active = true);

-- Allow users to see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin());

-- 8. Final Message
-- JALANKAN SCRIPT INI DI SQL EDITOR SUPABASE.
-- Setelah menjalankan ini, buat user baru di Auth Supabase (mukhsin9@gmail.com) 
-- dan hubungkan ke role admin di tabel user_profiles menggunakan script di bawah ini:

DO $$
DECLARE
  v_user_id UUID;
  v_admin_role_id INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mukhsin9@gmail.com' LIMIT 1;
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
  
  IF v_user_id IS NOT NULL AND v_admin_role_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (user_id, role_id, is_active)
    VALUES (v_user_id, v_admin_role_id, true)
    ON CONFLICT (user_id) DO UPDATE SET role_id = v_admin_role_id;
  END IF;
END $$;
