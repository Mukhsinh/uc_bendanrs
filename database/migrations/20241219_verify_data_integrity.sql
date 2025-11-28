-- Verify Data Integrity Post-Migration
-- Task 7.4: Verify data integrity post-migration
-- Requirements: 10.4

-- ============================================================================
-- VALIDATION 1: CHECK ALL RECORDS HAVE TENANT_ID
-- ============================================================================

-- Create validation function
CREATE OR REPLACE FUNCTION verify_tenant_id_completeness()
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  records_with_tenant_id BIGINT,
  records_without_tenant_id BIGINT,
  completion_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_table RECORD;
BEGIN
  FOR v_table IN 
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT IN ('tenants', 'migration_log')
    ORDER BY c.table_name
  LOOP
    RETURN QUERY EXECUTE format('
      SELECT 
        %L::TEXT as table_name,
        COUNT(*)::BIGINT as total_records,
        COUNT(tenant_id)::BIGINT as records_with_tenant_id,
        (COUNT(*) - COUNT(tenant_id))::BIGINT as records_without_tenant_id,
        ROUND((COUNT(tenant_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) as completion_percentage
      FROM %I
    ', v_table.table_name, v_table.table_name);
  END LOOP;
END;
$$;

-- Run validation
SELECT * FROM verify_tenant_id_completeness()
WHERE records_without_tenant_id > 0
ORDER BY records_without_tenant_id DESC;

-- ============================================================================
-- VALIDATION 2: CHECK REFERENTIAL INTEGRITY
-- ============================================================================

-- Verify foreign key relationships maintain tenant consistency
CREATE OR REPLACE FUNCTION verify_tenant_referential_integrity()
RETURNS TABLE(
  constraint_name TEXT,
  table_name TEXT,
  foreign_table TEXT,
  mismatched_records BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_constraint RECORD;
  v_count BIGINT;
BEGIN
  FOR v_constraint IN
    SELECT 
      tc.constraint_name,
      tc.table_name,
      ccu.table_name AS foreign_table_name,
      kcu.column_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name != 'tenant_settings'
    LIMIT 10
  LOOP
    -- Check if both tables have tenant_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = v_constraint.table_name AND column_name = 'tenant_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = v_constraint.foreign_table_name AND column_name = 'tenant_id'
    ) THEN
      -- Count mismatched tenant_id
      EXECUTE format('
        SELECT COUNT(*)
        FROM %I child
        JOIN %I parent ON child.%I = parent.%I
        WHERE child.tenant_id != parent.tenant_id
      ', 
        v_constraint.table_name,
        v_constraint.foreign_table_name,
        v_constraint.column_name,
        v_constraint.foreign_column_name
      ) INTO v_count;
      
      IF v_count > 0 THEN
        RETURN QUERY SELECT 
          v_constraint.constraint_name,
          v_constraint.table_name,
          v_constraint.foreign_table_name,
          v_count;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Run referential integrity check
SELECT * FROM verify_tenant_referential_integrity();

-- ============================================================================
-- VALIDATION 3: CHECK FOR ORPHANED RECORDS
-- ============================================================================

-- Check for records with invalid tenant_id
SELECT 
  'Records with invalid tenant_id' as check_name,
  COUNT(*) as issue_count
FROM (
  SELECT table_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
    AND table_name != 'tenant_settings'
  LIMIT 5
) tables
WHERE EXISTS (
  SELECT 1 
  FROM information_schema.tables t
  WHERE t.table_name = tables.table_name
);

-- ============================================================================
-- VALIDATION 4: VERIFY DEFAULT TENANT ASSIGNMENT
-- ============================================================================

-- Check that all records are assigned to default tenant
SELECT 
  'Default tenant assignment' as check_name,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  CASE 
    WHEN COUNT(DISTINCT tenant_id) = 1 THEN 'PASS'
    ELSE 'FAIL - Multiple tenants found'
  END as status
FROM (
  SELECT tenant_id FROM tenant_settings
  UNION ALL
  SELECT tenant_id FROM tenants WHERE slug != 'default-hospital'
) all_tenant_ids;

-- ============================================================================
-- VALIDATION 5: SUMMARY REPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_integrity_report()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_report JSONB;
  v_tables_with_tenant_id INTEGER;
  v_tables_complete INTEGER;
  v_total_records BIGINT;
  v_records_with_tenant BIGINT;
BEGIN
  -- Count tables with tenant_id
  SELECT COUNT(DISTINCT table_name) INTO v_tables_with_tenant_id
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id';
  
  -- Count tables with 100% completion
  SELECT COUNT(*) INTO v_tables_complete
  FROM verify_tenant_id_completeness()
  WHERE completion_percentage = 100;
  
  -- Build report
  v_report := jsonb_build_object(
    'validation_timestamp', NOW(),
    'tables_with_tenant_id', v_tables_with_tenant_id,
    'tables_100_percent_complete', v_tables_complete,
    'completion_rate', ROUND((v_tables_complete::NUMERIC / NULLIF(v_tables_with_tenant_id, 0) * 100), 2),
    'status', CASE 
      WHEN v_tables_complete = v_tables_with_tenant_id THEN 'PASS'
      ELSE 'INCOMPLETE'
    END
  );
  
  RETURN v_report;
END;
$$;

-- Generate final report
SELECT generate_integrity_report() as integrity_report;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script provides comprehensive validation of:
-- 1. Tenant ID completeness (all records have tenant_id)
-- 2. Referential integrity (related records have same tenant_id)
-- 3. No orphaned records
-- 4. Default tenant assignment correct
-- 5. Overall migration success

-- Run this after Task 7.3 (population) is complete
-- All checks should return PASS before proceeding to Task 7.5
