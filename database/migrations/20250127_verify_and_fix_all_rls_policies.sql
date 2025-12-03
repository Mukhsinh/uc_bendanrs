-- Migration: Verify and Fix All RLS Policies
-- Date: 2025-01-27
-- Description: Verify that all tables with tenant_id have RLS enabled and correct policies
--              Create missing policies and fix any incorrect ones

-- ============================================================================
-- STEP 1: Find all tables with tenant_id column
-- ============================================================================

DO $$
DECLARE
  table_rec RECORD;
  tables_with_tenant_id TEXT[] := ARRAY[]::TEXT[];
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
  tables_without_policies TEXT[] := ARRAY[]::TEXT[];
  tables_with_permissive_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Find all tables with tenant_id column
  FOR table_rec IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE '_%'
  LOOP
    tables_with_tenant_id := array_append(tables_with_tenant_id, table_rec.table_name);
    
    -- Check if RLS is enabled
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND c.relname = table_rec.table_name
        AND c.relrowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_rec.table_name);
    END IF;
    
    -- Check if policies exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_rec.table_name
        AND (
          policyname LIKE '%tenant_isolation%'
          OR policyname LIKE '%tenant%'
        )
    ) THEN
      tables_without_policies := array_append(tables_without_policies, table_rec.table_name);
    END IF;
    
    -- Check for permissive policies (without tenant filtering)
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_rec.table_name
        AND (
          qual LIKE '%auth.role()%authenticated%'
          OR with_check LIKE '%auth.role()%authenticated%'
        )
        AND qual NOT LIKE '%tenant_id%'
        AND qual NOT LIKE '%get_tenant_id%'
        AND with_check NOT LIKE '%tenant_id%'
        AND with_check NOT LIKE '%get_tenant_id%'
    ) THEN
      tables_with_permissive_policies := array_append(tables_with_permissive_policies, table_rec.table_name);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Tables with tenant_id: %', array_length(tables_with_tenant_id, 1);
  RAISE NOTICE 'Tables without RLS: %', array_length(tables_without_rls, 1);
  RAISE NOTICE 'Tables without tenant policies: %', array_length(tables_without_policies, 1);
  RAISE NOTICE 'Tables with permissive policies: %', array_length(tables_with_permissive_policies, 1);
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS: %', array_to_string(tables_without_rls, ', ');
  END IF;
  
  IF array_length(tables_without_policies, 1) > 0 THEN
    RAISE WARNING 'Tables without tenant policies: %', array_to_string(tables_without_policies, ', ');
  END IF;
  
  IF array_length(tables_with_permissive_policies, 1) > 0 THEN
    RAISE WARNING 'Tables with permissive policies: %', array_to_string(tables_with_permissive_policies, ', ');
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Enable RLS on all tables with tenant_id that don't have it
-- ============================================================================

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT LIKE '_%'
      AND NOT EXISTS (
        SELECT 1 FROM pg_class cl
        JOIN pg_namespace n ON cl.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND cl.relname = c.table_name
          AND cl.relrowsecurity = true
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
      RAISE NOTICE 'Enabled RLS on table: %', table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to enable RLS on table %: %', table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Create missing tenant isolation policies
-- ============================================================================

-- Helper function to create tenant isolation policies
CREATE OR REPLACE FUNCTION create_tenant_isolation_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policies first
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_select_%s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_insert_%s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_update_%s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_delete_%s" ON %I', table_name, table_name);

  -- SELECT policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_select_%s" ON %I
      FOR SELECT
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);

  -- INSERT policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_insert_%s" ON %I
      FOR INSERT
      TO authenticated
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);

  -- UPDATE policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_update_%s" ON %I
      FOR UPDATE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);

  -- DELETE policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_delete_%s" ON %I
      FOR DELETE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);

  RAISE NOTICE 'Created tenant isolation policies for table: %', table_name;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create policies for table %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create policies for all tables with tenant_id that don't have them
DO $$
DECLARE
  table_name TEXT;
  policies_created INTEGER := 0;
  policies_failed INTEGER := 0;
BEGIN
  FOR table_name IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT LIKE '_%'
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = c.table_name
          AND (
            policyname LIKE '%tenant_isolation%'
            OR (policyname LIKE '%tenant%' AND qual LIKE '%get_tenant_id%')
          )
      )
  LOOP
    BEGIN
      PERFORM create_tenant_isolation_policies(table_name);
      policies_created := policies_created + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create policies for table %: %', table_name, SQLERRM;
      policies_failed := policies_failed + 1;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created policies for % tables, % failed', policies_created, policies_failed;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS create_tenant_isolation_policies(TEXT);

-- ============================================================================
-- STEP 4: Verification - Count policies and tables
-- ============================================================================

DO $$
DECLARE
  total_tables INTEGER;
  tables_with_rls INTEGER;
  total_policies INTEGER;
  tenant_policies INTEGER;
BEGIN
  -- Count tables with tenant_id
  SELECT COUNT(DISTINCT table_name) INTO total_tables
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id';
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  JOIN information_schema.columns col ON col.table_name = c.relname
  WHERE n.nspname = 'public'
    AND c.relrowsecurity = true
    AND col.column_name = 'tenant_id'
    AND col.table_schema = 'public';
  
  -- Count total policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count tenant isolation policies
  SELECT COUNT(*) INTO tenant_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      policyname LIKE '%tenant_isolation%'
      OR (policyname LIKE '%tenant%' AND qual LIKE '%get_tenant_id%')
    );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Verification Summary:';
  RAISE NOTICE 'Total tables with tenant_id: %', total_tables;
  RAISE NOTICE 'Tables with RLS enabled: %', tables_with_rls;
  RAISE NOTICE 'Total policies: %', total_policies;
  RAISE NOTICE 'Tenant isolation policies: %', tenant_policies;
  RAISE NOTICE '========================================';
  
  IF tables_with_rls < total_tables THEN
    RAISE WARNING 'Some tables with tenant_id do not have RLS enabled!';
  END IF;
  
  IF tenant_policies < (total_tables * 4) THEN
    RAISE WARNING 'Some tables are missing tenant isolation policies! Expected at least % policies, found %', total_tables * 4, tenant_policies;
  END IF;
END $$;

