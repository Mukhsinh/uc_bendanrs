-- Migration: Create Functions for Tenant Isolation Verification
-- Date: 2025-01-27
-- Description: Create functions to verify that tenant isolation is working correctly

-- ============================================================================
-- Function 1: Test if user can access data from another tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_tenant_isolation(
  p_test_tenant_id UUID
)
RETURNS TABLE(
  table_name TEXT,
  can_access BOOLEAN,
  row_count BIGINT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_rec RECORD;
  current_tenant_id UUID;
  test_count BIGINT;
  test_error TEXT;
BEGIN
  -- Get current user's tenant_id
  current_tenant_id := public.get_tenant_id();
  
  -- If current user is super admin, they can access all tenants (expected)
  IF public.is_super_admin() THEN
    RETURN QUERY
    SELECT 
      'SUPER_ADMIN'::TEXT,
      true::BOOLEAN,
      0::BIGINT,
      'Super admin can access all tenants (expected behavior)'::TEXT;
    RETURN;
  END IF;
  
  -- If no tenant_id, return error
  IF current_tenant_id IS NULL THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      false::BOOLEAN,
      0::BIGINT,
      'Current user has no tenant_id'::TEXT;
    RETURN;
  END IF;
  
  -- If testing same tenant, should be able to access (expected)
  IF current_tenant_id = p_test_tenant_id THEN
    RETURN QUERY
    SELECT 
      'SAME_TENANT'::TEXT,
      true::BOOLEAN,
      0::BIGINT,
      'Testing same tenant (expected to have access)'::TEXT;
    RETURN;
  END IF;
  
  -- Test each table with tenant_id
  FOR table_rec IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT LIKE '_%'
    ORDER BY c.table_name
    LIMIT 10  -- Limit to 10 tables for performance
  LOOP
    BEGIN
      -- Try to count rows from different tenant
      EXECUTE format(
        'SELECT COUNT(*) FROM %I WHERE tenant_id = $1',
        table_rec.table_name
      ) INTO test_count USING p_test_tenant_id;
      
      -- If count > 0, user can access data from another tenant (SECURITY ISSUE!)
      RETURN QUERY
      SELECT 
        table_rec.table_name::TEXT,
        (test_count > 0)::BOOLEAN,
        test_count,
        CASE 
          WHEN test_count > 0 THEN 'SECURITY ISSUE: Can access data from another tenant!'
          ELSE 'OK: Cannot access data from another tenant'
        END::TEXT;
      
    EXCEPTION WHEN OTHERS THEN
      test_error := SQLERRM;
      RETURN QUERY
      SELECT 
        table_rec.table_name::TEXT,
        false::BOOLEAN,
        0::BIGINT,
        test_error::TEXT;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.test_tenant_isolation(UUID) IS 
'Test if current user can access data from another tenant. '
'Returns table_name, can_access (true = security issue), row_count, and error_message. '
'Only super admin should be able to access data from other tenants.';

GRANT EXECUTE ON FUNCTION public.test_tenant_isolation(UUID) TO authenticated;

-- ============================================================================
-- Function 2: Verify RLS is enabled on all tables with tenant_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_rls_enabled()
RETURNS TABLE(
  table_name TEXT,
  has_tenant_id BOOLEAN,
  rls_enabled BOOLEAN,
  policy_count INTEGER,
  has_tenant_policies BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.table_name::TEXT,
    true::BOOLEAN as has_tenant_id,
    COALESCE(cl.relrowsecurity, false)::BOOLEAN as rls_enabled,
    COALESCE(p.policy_count, 0)::INTEGER as policy_count,
    COALESCE(tp.has_tenant_policies, false)::BOOLEAN as has_tenant_policies
  FROM information_schema.columns c
  LEFT JOIN pg_class cl ON cl.relname = c.table_name
  LEFT JOIN pg_namespace n ON cl.relnamespace = n.oid AND n.nspname = 'public'
  LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) p ON p.tablename = c.table_name
  LEFT JOIN (
    SELECT tablename, COUNT(*) > 0 as has_tenant_policies
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname LIKE '%tenant_isolation%'
        OR (policyname LIKE '%tenant%' AND qual LIKE '%get_tenant_id%')
      )
    GROUP BY tablename
  ) tp ON tp.tablename = c.table_name
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND c.table_name NOT LIKE 'pg_%'
    AND c.table_name NOT LIKE '_%'
  ORDER BY c.table_name;
END;
$$;

COMMENT ON FUNCTION public.verify_rls_enabled() IS 
'Verify that all tables with tenant_id have RLS enabled and tenant isolation policies';

GRANT EXECUTE ON FUNCTION public.verify_rls_enabled() TO authenticated;

-- ============================================================================
-- Function 3: Check if user can see data from their own tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_own_tenant_access()
RETURNS TABLE(
  table_name TEXT,
  can_access BOOLEAN,
  row_count BIGINT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_rec RECORD;
  current_tenant_id UUID;
  test_count BIGINT;
  test_error TEXT;
BEGIN
  -- Get current user's tenant_id
  current_tenant_id := public.get_tenant_id();
  
  -- If no tenant_id and not super admin, return error
  IF current_tenant_id IS NULL AND NOT public.is_super_admin() THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      false::BOOLEAN,
      0::BIGINT,
      'Current user has no tenant_id'::TEXT;
    RETURN;
  END IF;
  
  -- Test each table with tenant_id
  FOR table_rec IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT LIKE '_%'
    ORDER BY c.table_name
    LIMIT 10  -- Limit to 10 tables for performance
  LOOP
    BEGIN
      -- Try to count rows from own tenant
      IF current_tenant_id IS NOT NULL THEN
        EXECUTE format(
          'SELECT COUNT(*) FROM %I WHERE tenant_id = $1',
          table_rec.table_name
        ) INTO test_count USING current_tenant_id;
      ELSE
        -- Super admin - count all rows
        EXECUTE format(
          'SELECT COUNT(*) FROM %I',
          table_rec.table_name
        ) INTO test_count;
      END IF;
      
      RETURN QUERY
      SELECT 
        table_rec.table_name::TEXT,
        true::BOOLEAN,
        test_count,
        'OK: Can access own tenant data'::TEXT;
      
    EXCEPTION WHEN OTHERS THEN
      test_error := SQLERRM;
      RETURN QUERY
      SELECT 
        table_rec.table_name::TEXT,
        false::BOOLEAN,
        0::BIGINT,
        test_error::TEXT;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.test_own_tenant_access() IS 
'Test if current user can access data from their own tenant. Should return true for all tables.';

GRANT EXECUTE ON FUNCTION public.test_own_tenant_access() TO authenticated;

-- ============================================================================
-- Function 4: Get summary of tenant isolation status
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_isolation_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  total_tables INTEGER;
  tables_with_rls INTEGER;
  tables_with_policies INTEGER;
  current_tenant_id UUID;
  is_super_admin_user BOOLEAN;
BEGIN
  -- Get current user info
  current_tenant_id := public.get_tenant_id();
  is_super_admin_user := public.is_super_admin();
  
  -- Count tables
  SELECT COUNT(DISTINCT table_name) INTO total_tables
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id';
  
  -- Count tables with RLS
  SELECT COUNT(DISTINCT c.table_name) INTO tables_with_rls
  FROM information_schema.columns c
  JOIN pg_class cl ON cl.relname = c.table_name
  JOIN pg_namespace n ON cl.relnamespace = n.oid
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND n.nspname = 'public'
    AND cl.relrowsecurity = true;
  
  -- Count tables with tenant policies
  SELECT COUNT(DISTINCT tablename) INTO tables_with_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      policyname LIKE '%tenant_isolation%'
      OR (policyname LIKE '%tenant%' AND qual LIKE '%get_tenant_id%')
    );
  
  -- Build result
  result := jsonb_build_object(
    'total_tables_with_tenant_id', total_tables,
    'tables_with_rls_enabled', tables_with_rls,
    'tables_with_tenant_policies', tables_with_policies,
    'rls_coverage_percentage', CASE 
      WHEN total_tables > 0 THEN ROUND((tables_with_rls::NUMERIC / total_tables::NUMERIC) * 100, 2)
      ELSE 0
    END,
    'policy_coverage_percentage', CASE 
      WHEN total_tables > 0 THEN ROUND((tables_with_policies::NUMERIC / total_tables::NUMERIC) * 100, 2)
      ELSE 0
    END,
    'current_user_tenant_id', current_tenant_id,
    'is_super_admin', is_super_admin_user,
    'isolation_status', CASE
      WHEN tables_with_rls = total_tables AND tables_with_policies = total_tables THEN 'SECURE'
      WHEN tables_with_rls < total_tables THEN 'INCOMPLETE_RLS'
      WHEN tables_with_policies < total_tables THEN 'INCOMPLETE_POLICIES'
      ELSE 'UNKNOWN'
    END
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_isolation_summary() IS 
'Get summary of tenant isolation status including RLS coverage and policy coverage';

GRANT EXECUTE ON FUNCTION public.get_tenant_isolation_summary() TO authenticated;

