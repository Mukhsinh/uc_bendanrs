-- Migration: Fix get_tenant_id() Function to be More Robust
-- Date: 2025-01-27
-- Description: Update get_tenant_id() to always return a valid tenant_id or raise error
--              This ensures RLS policies always have a valid tenant_id to work with

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_tenant_id() CASCADE;

-- Create improved get_tenant_id() function that is more robust
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- If no user, return NULL (for anonymous access, RLS will handle)
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if user is super admin first
  -- Super admin can have NULL tenant_id (they can access all tenants)
  BEGIN
    v_is_super_admin := public.is_super_admin();
  EXCEPTION WHEN OTHERS THEN
    v_is_super_admin := FALSE;
  END;
  
  -- If super admin, allow NULL tenant_id (they can access all data)
  IF v_is_super_admin THEN
    RETURN NULL; -- NULL means "all tenants" for super admin
  END IF;
  
  -- First, try to get tenant_id from JWT app_metadata
  BEGIN
    SELECT ((auth.jwt()->>'app_metadata')::jsonb->>'tenant_id')::uuid INTO v_tenant_id;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;
  
  -- If found in JWT, return it
  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;
  
  -- Fallback: get tenant_id from user_profiles table
  BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM public.user_profiles
    WHERE user_id = v_user_id
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;
  
  -- If found in user_profiles, return it
  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;
  
  -- Fallback 2: Get tenant_id from profiles table (if user_profiles is not yet populated)
  BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM public.profiles
    WHERE id = v_user_id
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;
  
  -- If still not found, this is a critical error
  -- For non-super-admin users, tenant_id is REQUIRED
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant context not found for user %. Please ensure user_profiles.tenant_id is set.', v_user_id
      USING HINT = 'User must be assigned to a tenant or be a super admin';
  END IF;
  
  RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_id() IS 
'Get tenant_id for current user. Returns tenant_id from JWT app_metadata, user_profiles, or profiles table. '
'Returns NULL for super admin (allows access to all tenants). '
'Raises error if tenant_id not found for non-super-admin users.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_id() TO anon;

-- ============================================================================
-- Create helper function to check if tenant_id is valid
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_valid_tenant_id()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if super admin
  IF public.is_super_admin() THEN
    RETURN TRUE; -- Super admin always has valid context
  END IF;
  
  -- Try to get tenant_id
  BEGIN
    v_tenant_id := public.get_tenant_id();
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  RETURN v_tenant_id IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.has_valid_tenant_id() IS 'Check if current user has a valid tenant_id context';

GRANT EXECUTE ON FUNCTION public.has_valid_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_valid_tenant_id() TO anon;

