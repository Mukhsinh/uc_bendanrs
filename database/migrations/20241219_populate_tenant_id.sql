-- Populate tenant_id for All Existing Records
-- Task 7.3: Implement tenant_id population script
-- Requirements: 10.3
-- 
-- PREREQUISITES:
-- - Phase 2 must be completed (tenant_id column exists in all tables)
-- - Default tenant must be created (Task 7.2)
-- - Backup database before running this script

-- ============================================================================
-- STEP 1: CREATE MIGRATION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  records_before INTEGER,
  records_updated INTEGER,
  records_after INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE POPULATION HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION populate_tenant_id_for_table(p_table_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_default_tenant_id UUID;
  v_records_before INTEGER;
  v_records_updated INTEGER;
  v_records_after INTEGER;
  v_sql TEXT;
  v_result JSONB;
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := clock_timestamp();
  v_default_tenant_id := get_default_tenant_id();
  
  -- Count records before
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', p_table_name)
  INTO v_records_before;
  
  RAISE NOTICE 'Table %: % records to update', p_table_name, v_records_before;
  
  -- Update records
  v_sql := format(
    'UPDATE %I SET tenant_id = $1, updated_at = NOW() WHERE tenant_id IS NULL',
    p_table_name
  );
  EXECUTE v_sql USING v_default_tenant_id;
  
  GET DIAGNOSTICS v_records_updated = ROW_COUNT;
  
  -- Count records after
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', p_table_name)
  INTO v_records_after;
  
  -- Log result
  INSERT INTO migration_log (
    table_name, records_before, records_updated, records_after,
    status, started_at, completed_at
  ) VALUES (
    p_table_name, v_records_before, v_records_updated, v_records_after,
    'completed', v_start_time, clock_timestamp()
  );
  
  v_result := jsonb_build_object(
    'table_name', p_table_name,
    'records_updated', v_records_updated,
    'duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)),
    'success', v_records_after = 0
  );
  
  RAISE NOTICE 'Table % completed: % records updated in %s', 
    p_table_name, v_records_updated, clock_timestamp() - v_start_time;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO migration_log (
      table_name, records_before, status, error_message,
      started_at, completed_at
    ) VALUES (
      p_table_name, v_records_before, 'failed', SQLERRM,
      v_start_time, clock_timestamp()
    );
    RAISE;
END;
$$;

-- ============================================================================
-- STEP 3: EXECUTE POPULATION (COMMENTED - RUN MANUALLY)
-- ============================================================================

-- Uncomment and run these one by one, monitoring progress

-- Priority 1: Master Data Tables
-- SELECT populate_tenant_id_for_table('unit_kerja');
-- SELECT populate_tenant_id_for_table('dasar_alokasi');

-- Priority 2: Transaction Tables  
-- SELECT populate_tenant_id_for_table('data_biaya');
-- SELECT populate_tenant_id_for_table('data_pendapatan');

-- Priority 3: Calculation Tables
-- SELECT populate_tenant_id_for_table('kalkulasi_biaya_gizi');
-- SELECT populate_tenant_id_for_table('distribusi_biaya_pertama');

-- Add more tables as needed...

-- ============================================================================
-- STEP 4: VALIDATION QUERIES
-- ============================================================================

-- Check migration progress
SELECT 
  table_name,
  records_before,
  records_updated,
  records_after,
  status,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds,
  completed_at
FROM migration_log
ORDER BY completed_at DESC;

-- Check for remaining NULL values
-- Run this for each table to verify
-- SELECT COUNT(*) as null_count FROM table_name WHERE tenant_id IS NULL;

-- ============================================================================
-- STEP 5: SUMMARY REPORT
-- ============================================================================

SELECT 
  COUNT(*) as total_tables,
  SUM(records_updated) as total_records_updated,
  SUM(EXTRACT(EPOCH FROM (completed_at - started_at))) as total_duration_seconds,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_tables,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_tables
FROM migration_log;
