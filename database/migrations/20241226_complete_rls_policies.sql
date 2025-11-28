-- Migration: Complete RLS policies with INSERT/UPDATE/DELETE operations
-- Date: 2024-12-26
-- Phase: 4.3, 4.4, 4.5
-- Requirements: 5.1

-- This migration adds INSERT, UPDATE, and DELETE policies for all tables with tenant_id
-- Following the pattern from design.md

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Tenants table (only super admin can insert)
CREATE POLICY "tenant_isolation_insert" ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Tenant settings
CREATE POLICY "tenant_isolation_insert" ON public.tenant_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Tenant audit log
CREATE POLICY "tenant_isolation_insert" ON public.tenant_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- User profiles
CREATE POLICY "tenant_isolation_insert" ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Role akses aplikasi
CREATE POLICY "tenant_isolation_insert" ON role_akses_aplikasi
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Menu items
CREATE POLICY "tenant_isolation_insert" ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Role menu items
CREATE POLICY "tenant_isolation_insert" ON role_menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- User roles
CREATE POLICY "tenant_isolation_insert" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Unit kerja
CREATE POLICY "tenant_isolation_insert" ON unit_kerja
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Data Kegiatan
CREATE POLICY "tenant_isolation_insert" ON "Data_Kegiatan"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Kalkulasi diklat (if exists)
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    EXECUTE 'CREATE POLICY "tenant_isolation_insert" ON kalkulasi_diklat
      FOR INSERT
      TO authenticated
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )';
  END IF;
END $;

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Tenants table
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

-- Tenant settings
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

-- Tenant audit log (typically no updates, but for completeness)
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

-- User profiles
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

-- Role akses aplikasi
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

-- Menu items
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

-- Role menu items
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

-- User roles
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

-- Unit kerja
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

-- Data Kegiatan
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

-- Kalkulasi diklat (if exists)
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    EXECUTE 'CREATE POLICY "tenant_isolation_update" ON kalkulasi_diklat
      FOR UPDATE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )';
  END IF;
END $;

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Tenants table (only super admin can delete)
CREATE POLICY "tenant_isolation_delete" ON public.tenants
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- Tenant settings
CREATE POLICY "tenant_isolation_delete" ON public.tenant_settings
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Tenant audit log (typically no deletes, but for completeness)
CREATE POLICY "tenant_isolation_delete" ON public.tenant_audit_log
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- User profiles
CREATE POLICY "tenant_isolation_delete" ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Role akses aplikasi
CREATE POLICY "tenant_isolation_delete" ON role_akses_aplikasi
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Menu items
CREATE POLICY "tenant_isolation_delete" ON menu_items
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Role menu items
CREATE POLICY "tenant_isolation_delete" ON role_menu_items
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- User roles
CREATE POLICY "tenant_isolation_delete" ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Unit kerja
CREATE POLICY "tenant_isolation_delete" ON unit_kerja
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Data Kegiatan
CREATE POLICY "tenant_isolation_delete" ON "Data_Kegiatan"
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_tenant_id()
    OR public.is_super_admin()
  );

-- Kalkulasi diklat (if exists)
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    EXECUTE 'CREATE POLICY "tenant_isolation_delete" ON kalkulasi_diklat
      FOR DELETE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )';
  END IF;
END $;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants', 'tenant_settings', 'tenant_audit_log', 'user_profiles',
    'role_akses_aplikasi', 'menu_items', 'role_menu_items', 'user_roles',
    'unit_kerja', 'Data_Kegiatan', 'kalkulasi_diklat'
  )
ORDER BY tablename, cmd, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  array_agg(DISTINCT cmd ORDER BY cmd) as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants', 'tenant_settings', 'tenant_audit_log', 'user_profiles',
    'role_akses_aplikasi', 'menu_items', 'role_menu_items', 'user_roles',
    'unit_kerja', 'Data_Kegiatan', 'kalkulasi_diklat'
  )
GROUP BY tablename
ORDER BY tablename;

COMMENT ON POLICY "tenant_isolation_insert" ON public.tenants IS 'Only super admin can create new tenants';
COMMENT ON POLICY "tenant_isolation_update" ON public.tenants IS 'Users can only update their own tenant, super admin can update all';
COMMENT ON POLICY "tenant_isolation_delete" ON public.tenants IS 'Only super admin can delete tenants';
