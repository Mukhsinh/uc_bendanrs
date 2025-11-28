-- Migration: Create tenant consistency triggers
-- Date: 2024-12-26
-- Phase: 5.1, 5.2
-- Requirements: 9.2

-- This migration creates triggers to auto-populate and validate tenant_id
-- Following the pattern from design.md

-- ============================================================================
-- TRIGGER FUNCTION: trigger_set_tenant_id()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_set_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  current_tenant_id UUID;
BEGIN
  -- Get current tenant_id from session
  current_tenant_id := public.get_tenant_id();
  
  -- Auto-populate tenant_id if NULL
  IF NEW.tenant_id IS NULL THEN
    IF current_tenant_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine tenant_id for current user';
    END IF;
    NEW.tenant_id := current_tenant_id;
  END IF;
  
  -- Validate tenant_id matches current user's tenant (unless super admin)
  IF NEW.tenant_id != current_tenant_id AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Cannot set tenant_id to different tenant. Expected: %, Got: %', 
      current_tenant_id, NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$;

COMMENT ON FUNCTION public.trigger_set_tenant_id IS 
  'Trigger function to auto-populate and validate tenant_id on INSERT/UPDATE operations';

-- ============================================================================
-- APPLY TRIGGERS TO TABLES
-- ============================================================================

-- Tenant settings
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.tenant_settings;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Tenant audit log
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.tenant_audit_log;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.tenant_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- User profiles
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.user_profiles;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Role akses aplikasi
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON role_akses_aplikasi;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON role_akses_aplikasi
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Menu items
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON menu_items;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Role menu items
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON role_menu_items;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON role_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- User roles
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON user_roles;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Unit kerja
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON unit_kerja;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON unit_kerja
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Data Kegiatan
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON "Data_Kegiatan";
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON "Data_Kegiatan"
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_tenant_id();

-- Kalkulasi diklat (if exists)
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_tenant_id_trigger ON kalkulasi_diklat';
    EXECUTE 'CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT OR UPDATE ON kalkulasi_diklat
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_tenant_id()';
  END IF;
END $;

-- ============================================================================
-- ADDITIONAL TABLES (from Phase 2)
-- ============================================================================

-- Data biaya
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_biaya') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_tenant_id_trigger ON data_biaya';
    EXECUTE 'CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT OR UPDATE ON data_biaya
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_tenant_id()';
  END IF;
END $;

-- Data pendapatan
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_pendapatan') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_tenant_id_trigger ON data_pendapatan';
    EXECUTE 'CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT OR UPDATE ON data_pendapatan
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_tenant_id()';
  END IF;
END $;

-- Data kegiatan
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_kegiatan') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_tenant_id_trigger ON data_kegiatan';
    EXECUTE 'CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT OR UPDATE ON data_kegiatan
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_tenant_id()';
  END IF;
END $;

-- Daftar tindakan
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daftar_tindakan') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_tenant_id_trigger ON daftar_tindakan';
    EXECUTE 'CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT OR UPDATE ON daftar_tindakan
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_tenant_id()';
  END IF;
END $;

-- Distribusi biaya pertama
DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'distribusi_biaya_pertama') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_tenant_id_trigger ON distribusi_biaya_pertama';
    EXECUTE 'CREATE TRIGGER set_tenant_id_trigger
      BEFORE INSERT OR UPDATE ON distribusi_biaya_pertama
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_tenant_id()';
  END IF;
END $;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all triggers using trigger_set_tenant_id function
SELECT 
  event_object_schema AS schema_name,
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing
FROM information_schema.triggers
WHERE action_statement LIKE '%trigger_set_tenant_id%'
  AND event_object_schema = 'public'
ORDER BY event_object_table, event_manipulation;

-- Count triggers per table
SELECT 
  event_object_table AS table_name,
  COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE action_statement LIKE '%trigger_set_tenant_id%'
  AND event_object_schema = 'public'
GROUP BY event_object_table
ORDER BY event_object_table;

-- Test trigger function (requires valid JWT context)
-- Example: INSERT INTO unit_kerja (name, jenis) VALUES ('Test Unit', 'produksi');
-- The trigger should auto-populate tenant_id

COMMENT ON TRIGGER set_tenant_id_trigger ON public.tenant_settings IS 
  'Auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON public.user_profiles IS 
  'Auto-populate and validate tenant_id on INSERT/UPDATE';
COMMENT ON TRIGGER set_tenant_id_trigger ON unit_kerja IS 
  'Auto-populate and validate tenant_id on INSERT/UPDATE';
