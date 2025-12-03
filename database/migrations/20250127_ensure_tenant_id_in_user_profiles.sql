-- Migration: Ensure tenant_id Always Exists in user_profiles
-- Date: 2025-01-27
-- Description: Ensure all user_profiles have tenant_id set, and create triggers to auto-set tenant_id

-- ============================================================================
-- STEP 1: Check for user_profiles with NULL tenant_id (except super admin)
-- ============================================================================

DO $$
DECLARE
  null_tenant_count INTEGER;
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Count user_profiles with NULL tenant_id
  SELECT COUNT(*) INTO null_tenant_count
  FROM public.user_profiles
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Found % user_profiles with NULL tenant_id', null_tenant_count;
  
  -- For each user with NULL tenant_id, check if they are super admin
  -- If not super admin, we need to assign them to a tenant or raise warning
  FOR v_user_id IN
    SELECT user_id FROM public.user_profiles WHERE tenant_id IS NULL
  LOOP
    BEGIN
      -- Check if user is super admin
      SELECT public.is_super_admin(v_user_id) INTO v_is_super_admin;
      
      IF NOT v_is_super_admin THEN
        RAISE WARNING 'User % has NULL tenant_id but is not super admin. This user will not be able to access data.', v_user_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error checking super admin status for user %: %', v_user_id, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create or update trigger to auto-set tenant_id on INSERT
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_user_profiles ON public.user_profiles;

-- Create function to auto-set tenant_id from context
CREATE OR REPLACE FUNCTION public.auto_set_tenant_id_user_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- If tenant_id is already set, keep it (unless it's being changed maliciously)
  IF NEW.tenant_id IS NOT NULL THEN
    -- Validate that tenant_id is not being changed to a different tenant
    -- (unless user is super admin doing the update)
    IF TG_OP = 'UPDATE' AND OLD.tenant_id IS NOT NULL AND OLD.tenant_id != NEW.tenant_id THEN
      -- Check if current user is super admin
      BEGIN
        v_is_super_admin := public.is_super_admin();
        IF NOT v_is_super_admin THEN
          RAISE EXCEPTION 'Cannot change tenant_id. User must be super admin to change tenant assignment.';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Cannot change tenant_id. Error checking permissions: %', SQLERRM;
      END;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- If tenant_id is NULL, try to get it from context
  -- For INSERT operations, we try to get tenant_id from:
  -- 1. The user creating the record (if they have tenant_id)
  -- 2. A default tenant (if configured)
  -- 3. Raise error if none found (except for super admin)
  
  BEGIN
    -- Try to get tenant_id from current user context
    v_tenant_id := public.get_tenant_id();
    
    -- If still NULL, check if user is super admin
    IF v_tenant_id IS NULL THEN
      BEGIN
        v_is_super_admin := public.is_super_admin();
        IF v_is_super_admin THEN
          -- Super admin can have NULL tenant_id (they can access all tenants)
          RETURN NEW;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- If we can't check super admin status, continue to error
      END;
      
      -- For non-super-admin users, tenant_id is REQUIRED
      RAISE EXCEPTION 'tenant_id is required for user_profiles. User must be assigned to a tenant or be a super admin.';
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

COMMENT ON FUNCTION public.auto_set_tenant_id_user_profiles() IS 
'Auto-set tenant_id for user_profiles on INSERT/UPDATE. '
'For INSERT: Sets tenant_id from current user context. '
'For UPDATE: Prevents changing tenant_id unless user is super admin.';

-- Create trigger
CREATE TRIGGER trigger_auto_set_tenant_id_user_profiles
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_tenant_id_user_profiles();

COMMENT ON TRIGGER trigger_auto_set_tenant_id_user_profiles ON public.user_profiles IS 
'Automatically sets tenant_id for user_profiles based on current user context';

-- ============================================================================
-- STEP 3: Add constraint to ensure tenant_id is NOT NULL (except for super admin)
-- ============================================================================

-- Note: We can't add a simple NOT NULL constraint because super admin can have NULL tenant_id
-- Instead, we rely on the trigger and application logic to ensure tenant_id is set

-- Add check constraint that validates tenant_id exists in tenants table (if not NULL)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_tenant_id_fkey_check'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_tenant_id_fkey_check
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    
    RAISE NOTICE 'Added foreign key constraint for user_profiles.tenant_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint for user_profiles.tenant_id already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: Create function to assign tenant to existing users without tenant_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_tenant_to_user(
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin BOOLEAN;
BEGIN
  -- Only super admin can assign tenants
  v_is_super_admin := public.is_super_admin();
  
  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Only super admin can assign tenants to users';
  END IF;
  
  -- Validate tenant exists
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant % does not exist', p_tenant_id;
  END IF;
  
  -- Update or insert user_profiles
  INSERT INTO public.user_profiles (user_id, tenant_id, is_active)
  VALUES (p_user_id, p_tenant_id, true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    tenant_id = p_tenant_id,
    updated_at = now();
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

COMMENT ON FUNCTION public.assign_tenant_to_user(UUID, UUID) IS 
'Assign tenant to a user. Only super admin can use this function.';

GRANT EXECUTE ON FUNCTION public.assign_tenant_to_user(UUID, UUID) TO authenticated;

-- ============================================================================
-- STEP 5: Create function to validate all users have tenant_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_all_users_have_tenant()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  has_tenant_id BOOLEAN,
  is_super_admin BOOLEAN,
  tenant_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    COALESCE(au.email::TEXT, 'N/A') as email,
    (up.tenant_id IS NOT NULL) as has_tenant_id,
    COALESCE(public.is_super_admin(up.user_id), false) as is_super_admin,
    up.tenant_id
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.user_id
  ORDER BY up.user_id;
END;
$$;

COMMENT ON FUNCTION public.validate_all_users_have_tenant() IS 
'Validate that all users have tenant_id assigned (except super admin)';

GRANT EXECUTE ON FUNCTION public.validate_all_users_have_tenant() TO authenticated;

