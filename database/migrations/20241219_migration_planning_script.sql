-- Migration Planning Script
-- Task 7.1: Analyze existing data structure
-- Requirements: 10.1, 10.2

-- ============================================================================
-- STEP 1: ANALYZE CURRENT DATA DISTRIBUTION
-- ============================================================================

-- Get record counts per table
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY n_live_tup DESC
LIMIT 50;

-- ============================================================================
-- STEP 2: CHECK TENANT_ID COLUMN STATUS
-- ============================================================================

-- Verify tenant_id column exists in all tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
ORDER BY table_name;

-- ============================================================================
-- STEP 3: COUNT RECORDS WITHOUT TENANT_ID
-- ============================================================================

-- This will help us understand migration scope
-- Note: Run this for each major table

-- Example for data_biaya
SELECT 
  'data_biaya' as table_name,
  COUNT(*) as total_records,
  COUNT(tenant_id) as with_tenant_id,
  COUNT(*) - COUNT(tenant_id) as without_tenant_id
FROM data_biaya;

-- ============================================================================
-- STEP 4: ANALYZE USER DISTRIBUTION
-- ============================================================================

-- Get existing users
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT email) as unique_emails
FROM auth.users;

-- Check user_profiles
SELECT 
  COUNT(*) as total_profiles,
  COUNT(tenant_id) as profiles_with_tenant
FROM user_profiles;

-- ============================================================================
-- STEP 5: CHECK REFERENTIAL INTEGRITY
-- ============================================================================

-- List all foreign key constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- STEP 6: IDENTIFY TABLE DEPENDENCIES
-- ============================================================================

-- Tables with no foreign keys (can be updated first)
SELECT DISTINCT t.table_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc
  ON t.table_name = tc.table_name
  AND tc.constraint_type = 'FOREIGN KEY'
WHERE t.table_schema = 'public'
  AND tc.constraint_name IS NULL
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- ============================================================================
-- STEP 7: ESTIMATE MIGRATION TIME
-- ============================================================================

-- Calculate total records to migrate
SELECT 
  SUM(n_live_tup) as total_records_to_migrate
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- ============================================================================
-- STEP 8: GENERATE MIGRATION PLAN
-- ============================================================================

-- Create a summary report
SELECT 
  'Migration Planning Summary' as report_section,
  jsonb_build_object(
    'total_tables', (
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ),
    'tables_with_tenant_id', (
      SELECT COUNT(DISTINCT table_name)
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
    ),
    'total_records', (
      SELECT SUM(n_live_tup)
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    ),
    'total_users', (
      SELECT COUNT(*) FROM auth.users
    )
  ) as summary;

-- ============================================================================
-- STEP 9: VALIDATION QUERIES
-- ============================================================================

-- Check for potential issues
-- 1. Tables without tenant_id column
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
  )
ORDER BY table_name;

-- 2. Check for NULL values that might cause issues
-- (Run for each table after migration)

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script provides analysis only
-- Actual migration will be done in separate scripts (Task 7.2, 7.3)
-- Review output carefully before proceeding with migration
