-- Migration: Implement Row Level Security policies for multi-tenant system
-- Date: 2025-11-25
-- Requirements: 1.4, 5.1, 5.2

-- Enable RLS on tables that have tenant_id column
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables with tenant_id
ALTER TABLE role_akses_aplikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Data_Kegiatan" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    ALTER TABLE kalkulasi_diklat ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for SELECT operations
-- Policy for tenants table
CREATE POLICY "tenant_isolation_select" ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_settings table
CREATE POLICY "tenant_isolation_select" ON public.tenant_settings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_audit_log table
CREATE POLICY "tenant_isolation_select" ON public.tenant_audit_log
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for user_profiles table
CREATE POLICY "tenant_isolation_select" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policies for existing tables
CREATE POLICY "tenant_isolation_select" ON role_akses_aplikasi
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_select" ON menu_items
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_select" ON role_menu_items
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_select" ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_select" ON unit_kerja
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_select" ON "Data_Kegiatan"
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    CREATE POLICY "tenant_isolation_select" ON kalkulasi_diklat
      FOR SELECT
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Create RLS policies for INSERT operations
-- Policy for tenants table
CREATE POLICY "tenant_isolation_insert" ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_settings table
CREATE POLICY "tenant_isolation_insert" ON public.tenant_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_audit_log table
CREATE POLICY "tenant_isolation_insert" ON public.tenant_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for user_profiles table
CREATE POLICY "tenant_isolation_insert" ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policies for existing tables
CREATE POLICY "tenant_isolation_insert" ON role_akses_aplikasi
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_insert" ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_insert" ON role_menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_insert" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_insert" ON unit_kerja
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_insert" ON "Data_Kegiatan"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    CREATE POLICY "tenant_isolation_insert" ON kalkulasi_diklat
      FOR INSERT
      TO authenticated
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Create RLS policies for UPDATE operations
-- Policy for tenants table
CREATE POLICY "tenant_isolation_update" ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (
    id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_settings table
CREATE POLICY "tenant_isolation_update" ON public.tenant_settings
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_audit_log table
CREATE POLICY "tenant_isolation_update" ON public.tenant_audit_log
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for user_profiles table
CREATE POLICY "tenant_isolation_update" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policies for existing tables
CREATE POLICY "tenant_isolation_update" ON role_akses_aplikasi
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_update" ON menu_items
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_update" ON role_menu_items
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_update" ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_update" ON unit_kerja
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_update" ON "Data_Kegiatan"
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    CREATE POLICY "tenant_isolation_update" ON kalkulasi_diklat
      FOR UPDATE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Create RLS policies for DELETE operations
-- Policy for tenants table
CREATE POLICY "tenant_isolation_delete" ON public.tenants
  FOR DELETE
  TO authenticated
  USING (
    id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_settings table
CREATE POLICY "tenant_isolation_delete" ON public.tenant_settings
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for tenant_audit_log table
CREATE POLICY "tenant_isolation_delete" ON public.tenant_audit_log
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for user_profiles table
CREATE POLICY "tenant_isolation_delete" ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policies for existing tables
CREATE POLICY "tenant_isolation_delete" ON role_akses_aplikasi
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_delete" ON menu_items
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_delete" ON role_menu_items
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_delete" ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_delete" ON unit_kerja
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tenant_isolation_delete" ON "Data_Kegiatan"
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Policy for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    CREATE POLICY "tenant_isolation_delete" ON kalkulasi_diklat
      FOR DELETE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Create super admin bypass policies
-- These policies allow super admins to access all data regardless of tenant
CREATE POLICY "super_admin_all" ON public.tenants
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON public.tenant_settings
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON public.tenant_audit_log
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

-- Super admin policies for existing tables
CREATE POLICY "super_admin_all" ON role_akses_aplikasi
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON menu_items
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON role_menu_items
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON user_roles
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON unit_kerja
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

CREATE POLICY "super_admin_all" ON "Data_Kegiatan"
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
  );

-- Super admin policy for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    CREATE POLICY "super_admin_all" ON kalkulasi_diklat
      FOR ALL
      TO authenticated
      USING (
        public.is_super_admin()
      );
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON POLICY "tenant_isolation_select" ON public.tenants IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON public.tenants IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON public.tenants IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON public.tenants IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON public.tenants IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON public.tenant_settings IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON public.tenant_settings IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON public.tenant_settings IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON public.tenant_settings IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON public.tenant_settings IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON public.tenant_audit_log IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON public.tenant_audit_log IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON public.tenant_audit_log IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON public.tenant_audit_log IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON public.tenant_audit_log IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON public.user_profiles IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON public.user_profiles IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON public.user_profiles IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON public.user_profiles IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON public.user_profiles IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON role_akses_aplikasi IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON role_akses_aplikasi IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON role_akses_aplikasi IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON role_akses_aplikasi IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON role_akses_aplikasi IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON menu_items IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON menu_items IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON menu_items IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON menu_items IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON menu_items IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON role_menu_items IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON role_menu_items IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON role_menu_items IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON role_menu_items IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON role_menu_items IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON user_roles IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON user_roles IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON user_roles IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON user_roles IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON user_roles IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON unit_kerja IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON unit_kerja IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON unit_kerja IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON unit_kerja IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON unit_kerja IS 'RLS policy to allow super admins to access all tenant data';

COMMENT ON POLICY "tenant_isolation_select" ON "Data_Kegiatan" IS 'RLS policy to isolate tenant data for SELECT operations';
COMMENT ON POLICY "tenant_isolation_insert" ON "Data_Kegiatan" IS 'RLS policy to isolate tenant data for INSERT operations';
COMMENT ON POLICY "tenant_isolation_update" ON "Data_Kegiatan" IS 'RLS policy to isolate tenant data for UPDATE operations';
COMMENT ON POLICY "tenant_isolation_delete" ON "Data_Kegiatan" IS 'RLS policy to isolate tenant data for DELETE operations';
COMMENT ON POLICY "super_admin_all" ON "Data_Kegiatan" IS 'RLS policy to allow super admins to access all tenant data';

-- Comments for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    COMMENT ON POLICY "tenant_isolation_select" ON kalkulasi_diklat IS 'RLS policy to isolate tenant data for SELECT operations';
    COMMENT ON POLICY "tenant_isolation_insert" ON kalkulasi_diklat IS 'RLS policy to isolate tenant data for INSERT operations';
    COMMENT ON POLICY "tenant_isolation_update" ON kalkulasi_diklat IS 'RLS policy to isolate tenant data for UPDATE operations';
    COMMENT ON POLICY "tenant_isolation_delete" ON kalkulasi_diklat IS 'RLS policy to isolate tenant data for DELETE operations';
    COMMENT ON POLICY "super_admin_all" ON kalkulasi_diklat IS 'RLS policy to allow super admins to access all tenant data';
  END IF;
END $$;