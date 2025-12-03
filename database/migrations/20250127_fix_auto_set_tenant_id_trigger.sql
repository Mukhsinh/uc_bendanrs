-- Migration: Fix Auto-Set tenant_id Trigger
-- Date: 2025-01-27
-- Description: Ensure trigger_set_tenant_id() always sets tenant_id correctly and validates it

-- ============================================================================
-- STEP 1: Update trigger_set_tenant_id() function to be more robust
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_set_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- If tenant_id is already set, validate it
  IF NEW.tenant_id IS NOT NULL THEN
    -- For UPDATE operations, check if tenant_id is being changed
    IF TG_OP = 'UPDATE' AND OLD.tenant_id IS NOT NULL AND OLD.tenant_id != NEW.tenant_id THEN
      -- Only super admin can change tenant_id
      BEGIN
        v_is_super_admin := public.is_super_admin();
        IF NOT v_is_super_admin THEN
          RAISE EXCEPTION 'Cannot change tenant_id. Only super admin can change tenant assignment.';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Cannot change tenant_id. Error checking permissions: %', SQLERRM;
      END;
    END IF;
    
    -- Validate that tenant_id matches current user's tenant (unless super admin)
    BEGIN
      v_tenant_id := public.get_tenant_id();
      v_is_super_admin := public.is_super_admin();
      
      IF NOT v_is_super_admin AND v_tenant_id IS NOT NULL AND NEW.tenant_id != v_tenant_id THEN
        RAISE EXCEPTION 'Cannot set tenant_id to different tenant. Current user tenant_id: %, Provided tenant_id: %', 
          v_tenant_id, NEW.tenant_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If get_tenant_id() raises error, check if it's because user has no tenant
      -- In that case, only super admin can proceed
      BEGIN
        v_is_super_admin := public.is_super_admin();
        IF NOT v_is_super_admin THEN
          RAISE;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE;
      END;
    END;
    
    RETURN NEW;
  END IF;
  
  -- If tenant_id is NULL, try to get it from context
  BEGIN
    v_tenant_id := public.get_tenant_id();
    
    -- If still NULL, check if user is super admin
    IF v_tenant_id IS NULL THEN
      BEGIN
        v_is_super_admin := public.is_super_admin();
        IF v_is_super_admin THEN
          -- Super admin can have NULL tenant_id (they can access all tenants)
          -- But for data consistency, we should still try to set a default tenant if possible
          -- For now, allow NULL for super admin
          RETURN NEW;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- If we can't check super admin status, continue to error
      END;
      
      -- For non-super-admin users, tenant_id is REQUIRED
      RAISE EXCEPTION 'tenant_id is required. User must be assigned to a tenant or be a super admin. '
        'Error getting tenant_id: %', SQLERRM;
    END IF;
    
    -- Set tenant_id
    NEW.tenant_id := v_tenant_id;
    
  EXCEPTION WHEN OTHERS THEN
    -- If get_tenant_id() raises error, propagate it
    RAISE;
  END;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_set_tenant_id() IS 
'Auto-set and validate tenant_id for all tables. '
'For INSERT: Sets tenant_id from current user context. '
'For UPDATE: Prevents changing tenant_id unless user is super admin. '
'Validates that tenant_id matches current user tenant (unless super admin).';

-- ============================================================================
-- STEP 2: Apply trigger to all tables with tenant_id that don't have it
-- ============================================================================

DO $$
DECLARE
  table_name TEXT;
  triggers_created INTEGER := 0;
  triggers_failed INTEGER := 0;
BEGIN
  FOR table_name IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT LIKE '_%'
      AND c.table_name NOT IN ('tenants', 'user_profiles')  -- These have special handling
      AND NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class cl ON t.tgrelid = cl.oid
        JOIN pg_namespace n ON cl.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND cl.relname = c.table_name
          AND t.tgname = 'set_tenant_id_trigger'
      )
  LOOP
    BEGIN
      EXECUTE format('
        DROP TRIGGER IF EXISTS set_tenant_id_trigger ON %I;
        CREATE TRIGGER set_tenant_id_trigger
          BEFORE INSERT OR UPDATE ON %I
          FOR EACH ROW
          EXECUTE FUNCTION public.trigger_set_tenant_id();
      ', table_name, table_name);
      
      triggers_created := triggers_created + 1;
      RAISE NOTICE 'Created trigger for table: %', table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create trigger for table %: %', table_name, SQLERRM;
      triggers_failed := triggers_failed + 1;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created triggers for % tables, % failed', triggers_created, triggers_failed;
END $$;

-- ============================================================================
-- STEP 3: Verify triggers are in place
-- ============================================================================

DO $$
DECLARE
  total_tables INTEGER;
  tables_with_triggers INTEGER;
BEGIN
  -- Count tables with tenant_id
  SELECT COUNT(DISTINCT table_name) INTO total_tables
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE '_%'
    AND table_name NOT IN ('tenants', 'user_profiles');
  
  -- Count tables with trigger
  SELECT COUNT(DISTINCT cl.relname) INTO tables_with_triggers
  FROM pg_trigger t
  JOIN pg_class cl ON t.tgrelid = cl.oid
  JOIN pg_namespace n ON cl.relnamespace = n.oid
  JOIN information_schema.columns c ON c.table_name = cl.relname
  WHERE n.nspname = 'public'
    AND t.tgname = 'set_tenant_id_trigger'
    AND c.column_name = 'tenant_id'
    AND c.table_schema = 'public';
  
  RAISE NOTICE 'Tables with tenant_id: %', total_tables;
  RAISE NOTICE 'Tables with set_tenant_id_trigger: %', tables_with_triggers;
  
  IF tables_with_triggers < total_tables THEN
    RAISE WARNING 'Some tables with tenant_id do not have set_tenant_id_trigger!';
  END IF;
END $$;

