# Tenant ID Population Strategy

## Task 7.3: Implement tenant_id population script
**Requirements:** 10.3

## Prerequisites Check

### ⚠️ IMPORTANT: Phase 2 Must Be Completed First

Before running this migration, ensure Phase 2 is complete:
- ✅ Task 2.1: Add tenant_id column to all tables
- ✅ Task 2.2: Add foreign key constraints
- ✅ Task 2.3: Create indexes on tenant_id

**Current Status:** Phase 2 needs to be completed before Task 7.3 can proceed.

## Migration Strategy

### Approach: Batch Update by Table Dependency

We will update tables in dependency order to maintain referential integrity:

1. **Level 1:** Parent tables (no foreign keys)
2. **Level 2:** Tables with single dependencies
3. **Level 3:** Tables with multiple dependencies
4. **Level 4:** Complex junction tables

### Default Tenant ID

All existing records will be assigned to the default tenant:
- **Tenant Name:** Default Hospital
- **Tenant Slug:** default-hospital
- **Tenant ID:** Retrieved via `get_default_tenant_id()` function

## Implementation Plan

### Step 1: Create Migration Log Table

```sql
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
```

### Step 2: Create Population Function

```sql
CREATE OR REPLACE FUNCTION populate_tenant_id_for_table(
  p_table_name TEXT
)
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
BEGIN
  -- Get default tenant ID
  v_default_tenant_id := get_default_tenant_id();
  
  -- Count records before
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', p_table_name)
  INTO v_records_before;
  
  -- Update records
  v_sql := format(
    'UPDATE %I SET tenant_id = $1 WHERE tenant_id IS NULL',
    p_table_name
  );
  EXECUTE v_sql USING v_default_tenant_id;
  
  GET DIAGNOSTICS v_records_updated = ROW_COUNT;
  
  -- Count records after
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', p_table_name)
  INTO v_records_after;
  
  -- Log result
  INSERT INTO migration_log (
    table_name,
    records_before,
    records_updated,
    records_after,
    status,
    started_at,
    completed_at
  ) VALUES (
    p_table_name,
    v_records_before,
    v_records_updated,
    v_records_after,
    'completed',
    NOW(),
    NOW()
  );
  
  -- Return result
  v_result := jsonb_build_object(
    'table_name', p_table_name,
    'records_before', v_records_before,
    'records_updated', v_records_updated,
    'records_after', v_records_after,
    'success', v_records_after = 0
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO migration_log (
      table_name,
      records_before,
      status,
      error_message,
      started_at,
      completed_at
    ) VALUES (
      p_table_name,
      v_records_before,
      'failed',
      SQLERRM,
      NOW(),
      NOW()
    );
    
    RAISE;
END;
$$;
```

### Step 3: Execute Population in Order

```sql
-- Level 1: Parent tables
SELECT populate_tenant_id_for_table('unit_kerja');
SELECT populate_tenant_id_for_table('dasar_alokasi');

-- Level 2: Single dependencies
SELECT populate_tenant_id_for_table('data_biaya');
SELECT populate_tenant_id_for_table('data_pendapatan');

-- Level 3: Multiple dependencies
SELECT populate_tenant_id_for_table('kalkulasi_biaya_gizi');
SELECT populate_tenant_id_for_table('distribusi_biaya_pertama');

-- Continue for all tables...
```

### Step 4: Validation

```sql
-- Check for any remaining NULL tenant_id values
SELECT 
  table_name,
  COUNT(*) as null_count
FROM (
  SELECT 'unit_kerja' as table_name, COUNT(*) as count
  FROM unit_kerja WHERE tenant_id IS NULL
  UNION ALL
  SELECT 'data_biaya', COUNT(*)
  FROM data_biaya WHERE tenant_id IS NULL
  -- Add all tables...
) subquery
WHERE count > 0;
```

## Table Update Order

### Priority 1: Master Data Tables
1. `unit_kerja` - Work units
2. `dasar_alokasi` - Allocation basis
3. `jenis_tindakan` - Action types
4. `menu_gizi` - Nutrition menu

### Priority 2: Transaction Tables
1. `data_biaya` - Cost data
2. `data_pendapatan` - Revenue data
3. `data_kegiatan` - Activity data

### Priority 3: Calculation Tables
1. `kalkulasi_biaya_*` - Cost calculations
2. `distribusi_biaya_*` - Cost distributions
3. `rekapitulasi_*` - Recapitulations

### Priority 4: Supporting Tables
1. Audit tables
2. Log tables
3. Junction tables

## Rollback Plan

If migration fails:

```sql
-- Rollback: Clear tenant_id values
UPDATE table_name SET tenant_id = NULL 
WHERE tenant_id = get_default_tenant_id();

-- Or restore from backup
```

## Validation Queries

### Check Migration Progress

```sql
SELECT 
  table_name,
  records_before,
  records_updated,
  records_after,
  status,
  completed_at - started_at as duration
FROM migration_log
ORDER BY completed_at DESC;
```

### Verify All Records Have Tenant ID

```sql
-- This should return 0 for all tables
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM tablename WHERE tenant_id IS NULL) as null_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE column_name = 'tenant_id'
  );
```

## Performance Considerations

### Batch Size
- Update in batches of 10,000 records
- Commit after each batch
- Monitor memory usage

### Timing
- Run during low-traffic period
- Estimated time: 1-3 hours depending on data volume
- Monitor progress via migration_log table

## Success Criteria

✅ All records have tenant_id assigned
✅ No NULL tenant_id values remain
✅ Referential integrity maintained
✅ Migration log shows all tables completed
✅ Validation queries pass
✅ Application functions normally

## Next Steps After Completion

1. Run Task 7.4: Verify data integrity
2. Run Task 7.5: Set NOT NULL constraints
3. Test RLS policies
4. Monitor application performance
