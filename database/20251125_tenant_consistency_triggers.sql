-- Migration: Create database triggers for tenant consistency
-- Date: 2025-11-25
-- Requirements: 9.2

-- Create trigger function to auto-populate and validate tenant_id
-- This function ensures tenant_id consistency in INSERT/UPDATE operations

-- Function 5.1: trigger_set_tenant_id() - Auto-populate tenant_id and validate consistency
CREATE OR REPLACE FUNCTION public.trigger_set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate tenant_id if it's NULL
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_tenant_id();
  END IF;
  
  -- Validate tenant_id matches current user's tenant (unless super admin)
  IF NEW.tenant_id != public.get_tenant_id() AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Cannot set tenant_id to different tenant. Current user tenant_id: %, Provided tenant_id: %', 
      public.get_tenant_id(), NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.trigger_set_tenant_id IS 'Trigger function to auto-populate and validate tenant_id consistency';

-- Apply trigger to tables that need tenant consistency enforcement
-- Note: We're applying this to the main tenant tables and a few sample existing tables

-- Apply to tenants table
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.tenants;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Apply to tenant_settings table
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.tenant_settings;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Apply to tenant_audit_log table
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.tenant_audit_log;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.tenant_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Apply to user_profiles table
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.user_profiles;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Apply to existing tables with tenant_id
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON role_akses_aplikasi;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON role_akses_aplikasi
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_trigger ON menu_items;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_trigger ON role_menu_items;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON role_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_trigger ON user_roles;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_trigger ON unit_kerja;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON unit_kerja
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_trigger ON "Data_Kegiatan";
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON "Data_Kegiatan"
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Apply to kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    DROP TRIGGER IF EXISTS set_tenant_id_trigger ON kalkulasi_diklat;
    CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT OR UPDATE ON kalkulasi_diklat
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_tenant_id();
  END IF;
END $$;

-- Create additional trigger for updated_at columns to maintain consistency
-- This ensures updated_at is always set to current timestamp

CREATE OR REPLACE FUNCTION public.update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tenant tables
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

DROP TRIGGER IF EXISTS update_tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

-- Apply updated_at triggers to existing tables
DROP TRIGGER IF EXISTS update_role_akses_aplikasi_updated_at ON role_akses_aplikasi;
CREATE TRIGGER update_role_akses_aplikasi_updated_at
  BEFORE UPDATE ON role_akses_aplikasi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

DROP TRIGGER IF EXISTS update_role_menu_items_updated_at ON role_menu_items;
CREATE TRIGGER update_role_menu_items_updated_at
  BEFORE UPDATE ON role_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

DROP TRIGGER IF EXISTS update_unit_kerja_updated_at ON unit_kerja;
CREATE TRIGGER update_unit_kerja_updated_at
  BEFORE UPDATE ON unit_kerja
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

DROP TRIGGER IF EXISTS update_data_kegiatan_updated_at ON "Data_Kegiatan";
CREATE TRIGGER update_data_kegiatan_updated_at
  BEFORE UPDATE ON "Data_Kegiatan"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

-- Apply updated_at trigger to kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    DROP TRIGGER IF EXISTS update_kalkulasi_diklat_updated_at ON kalkulasi_diklat;
    CREATE TRIGGER update_kalkulasi_diklat_updated_at
      BEFORE UPDATE ON kalkulasi_diklat
      FOR EACH ROW
      EXECUTE FUNCTION public.update_tenant_updated_at();
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TRIGGER set_tenant_id_trigger ON public.tenants IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON public.tenant_settings IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON public.tenant_audit_log IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON public.user_profiles IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON role_akses_aplikasi IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON menu_items IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON role_menu_items IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON user_roles IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON unit_kerja IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON "Data_Kegiatan" IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';

-- Comments for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    COMMENT ON TRIGGER set_tenant_id_trigger ON kalkulasi_diklat IS 'Trigger to auto-populate and validate tenant_id on INSERT/UPDATE';
  END IF;
END $$;

COMMENT ON TRIGGER update_tenants_updated_at ON public.tenants IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_tenant_settings_updated_at ON public.tenant_settings IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_user_profiles_updated_at ON public.user_profiles IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_role_akses_aplikasi_updated_at ON role_akses_aplikasi IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_menu_items_updated_at ON menu_items IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_role_menu_items_updated_at ON role_menu_items IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_user_roles_updated_at ON user_roles IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_unit_kerja_updated_at ON unit_kerja IS 'Trigger to update updated_at timestamp';
COMMENT ON TRIGGER update_data_kegiatan_updated_at ON "Data_Kegiatan" IS 'Trigger to update updated_at timestamp';

-- Comments for kalkulasi_diklat if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    COMMENT ON TRIGGER update_kalkulasi_diklat_updated_at ON kalkulasi_diklat IS 'Trigger to update updated_at timestamp';
  END IF;
END $$;

-- Test the trigger function
-- Note: This would require a valid JWT context to work properly
-- Example of what the trigger does:
-- 1. If tenant_id is NULL, it auto-populates with the current user's tenant_id
-- 2. If tenant_id is provided, it validates it matches the current user's tenant_id (unless super admin)
-- 3. If validation fails, it raises an exception

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_set_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_updated_at() TO authenticated;