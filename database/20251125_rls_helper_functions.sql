-- Migration: Create RLS helper functions for multi-tenant system
-- Date: 2025-11-25
-- Requirements: 5.1, 5.3

-- Create helper functions for Row Level Security policies

-- Function 3.1: get_tenant_id() - Extract tenant_id from JWT app_metadata
-- This function extracts the tenant_id from the JWT token for the current user
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id'
  )::uuid;
$$;

COMMENT ON FUNCTION public.get_tenant_id IS 'Extract tenant_id from JWT app_metadata for current user';

-- Function 3.2: is_super_admin() - Check if current user is super admin
-- This function checks if the current user has super admin role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'super_admin',
    false
  );
$$;

COMMENT ON FUNCTION public.is_super_admin IS 'Check if current user has super admin role';

-- Function 3.3: has_tenant_access() - Validate tenant access for given tenant_id
-- This function validates if the current user has access to a specific tenant
CREATE OR REPLACE FUNCTION public.has_tenant_access(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.get_tenant_id() = check_tenant_id
    OR public.is_super_admin()
  );
$$;

COMMENT ON FUNCTION public.has_tenant_access IS 'Validate if current user has access to specified tenant (supports super admin bypass)';

-- Test the functions to ensure they're working correctly
-- Note: These tests would require a valid JWT context to work properly

-- Example usage of the functions:
-- SELECT public.get_tenant_id(); -- Returns UUID or NULL
-- SELECT public.is_super_admin(); -- Returns boolean
-- SELECT public.has_tenant_access('some-uuid-here'); -- Returns boolean

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_access(UUID) TO authenticated;