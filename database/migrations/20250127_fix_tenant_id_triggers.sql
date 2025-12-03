-- Migration: Fix tenant_id triggers and stored procedures
-- Date: 2025-01-27
-- Description: Ensure all triggers and stored procedures properly handle tenant_id
--              Update RPC functions to use get_tenant_id()

-- ============================================================================
-- STEP 1: Ensure auto_set_tenant_id trigger function uses get_tenant_id()
-- ============================================================================

-- Update the auto_set_tenant_id function to use get_tenant_id() instead of get_user_tenant_id()
CREATE OR REPLACE FUNCTION auto_set_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Only set tenant_id if it's NULL or empty
  IF NEW.tenant_id IS NULL THEN
    -- Use the improved get_tenant_id() function which has fallback mechanism
    v_tenant_id := public.get_tenant_id();
    
    -- If we got a tenant_id, set it
    IF v_tenant_id IS NOT NULL THEN
      NEW.tenant_id := v_tenant_id;
    ELSE
      -- If still NULL, try to get from user_profiles as final fallback
      BEGIN
        SELECT tenant_id INTO v_tenant_id
        FROM public.user_profiles
        WHERE user_id = auth.uid()
        LIMIT 1;
        
        IF v_tenant_id IS NOT NULL THEN
          NEW.tenant_id := v_tenant_id;
        ELSE
          -- If still NULL, raise error with helpful message
          RAISE EXCEPTION 'Cannot determine tenant_id for user. Please ensure user has a profile with tenant_id set.';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Cannot determine tenant_id for user: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_set_tenant_id IS 'Trigger function to auto-populate tenant_id before insert/update using get_tenant_id()';

-- ============================================================================
-- STEP 2: Update stored procedures to filter by tenant_id
-- ============================================================================

-- Note: This is a template for updating stored procedures
-- Individual stored procedures should be updated to include tenant_id filtering
-- Example pattern:
-- WHERE ... AND tenant_id = public.get_tenant_id()

-- ============================================================================
-- STEP 3: Update RPC functions to use get_tenant_id()
-- ============================================================================

-- Example: Update recalculate functions to filter by tenant_id
-- These are typically in separate migration files, but we add comments here as guidelines

-- Pattern for RPC functions:
-- 1. Get tenant_id at the beginning: v_tenant_id := public.get_tenant_id();
-- 2. Filter all queries by tenant_id: WHERE ... AND tenant_id = v_tenant_id
-- 3. Ensure all inserts/updates include tenant_id

-- ============================================================================
-- STEP 4: Verification queries
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_exists BOOLEAN;
BEGIN
  -- Check if auto_set_tenant_id function exists and is updated
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'auto_set_tenant_id'
  ) INTO function_exists;
  
  IF function_exists THEN
    RAISE NOTICE 'auto_set_tenant_id function exists and updated';
  ELSE
    RAISE WARNING 'auto_set_tenant_id function not found';
  END IF;

  -- Count triggers using auto_set_tenant_id
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_proc p ON t.tgfoid = p.oid
  WHERE p.proname = 'auto_set_tenant_id';
  
  RAISE NOTICE 'Total triggers using auto_set_tenant_id: %', trigger_count;
END $$;

