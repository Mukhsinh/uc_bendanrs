-- Migration: Fix get_tenant_id() function to be more robust
-- Date: 2025-01-27
-- Description: Update get_tenant_id() to read from user_profiles.tenant_id as fallback
--              if tenant_id is not in JWT app_metadata

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_tenant_id() CASCADE;

-- Create improved get_tenant_id() function with fallback mechanism
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
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- If no user, return NULL
  IF v_user_id IS NULL THEN
    RETURN NULL;
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
  
  -- Return tenant_id from user_profiles or NULL
  RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_id IS 'Extract tenant_id from JWT app_metadata or fallback to user_profiles.tenant_id for current user';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_id() TO anon;

-- Test function (commented out - uncomment to test manually)
-- SELECT public.get_tenant_id();
