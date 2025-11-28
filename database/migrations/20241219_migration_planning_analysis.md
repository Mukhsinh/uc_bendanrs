# Data Migration Planning Analysis

## Task 7.1: Migration Planning Script
**Requirements:** 10.1, 10.2

## Overview
Dokumen ini menganalisis existing data structure dan merencanakan strategi migration untuk menambahkan tenant_id ke semua existing records.

## Current State Analysis

### Tables with tenant_id Column
Berdasarkan Phase 2, semua 77 tabel sudah memiliki kolom tenant_id (nullable).

### Data Distribution Strategy

#### Option 1: Single Default Tenant (RECOMMENDED)
**Approach:** Assign semua existing data ke satu default tenant
**Pros:**
- Simple dan straightforward
- Minimal risk
- Easy rollback
- Preserves all existing data relationships

**Cons:**
- Semua existing users akan share same tenant
- Perlu manual tenant separation later jika diperlukan

#### Option 2: User-Based Tenant Assignment
**Approach:** Create tenant per user atau per user group
**Pros:**
- Better separation dari awal
- More aligned dengan multi-tenant goals

**Cons:**
- Complex implementation
- Risk of data inconsistency
- Difficult to determine user groupings
- May break existing relationships

### Recommended Approach: Option 1

Untuk safety dan simplicity, kita akan:
1. Create satu "Default Hospital" tenant
2. Assign semua existing data ke tenant ini
3. Provide tools untuk tenant separation later jika diperlukan

## Migration Steps

### Step 1: Analyze Current Data
Query untuk mendapatkan data statistics:

```sql
-- Count records per table
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Step 2: Identify User-to-Tenant Mapping
Untuk existing users, kita perlu mapping strategy:

```sql
-- Get all existing users
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at;
```

### Step 3: Check Referential Integrity
Verify bahwa semua foreign key relationships intact:

```sql
-- Check for orphaned records
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace;
```

## Migration Script Structure

### Phase 1: Pre-Migration Validation
1. Backup database
2. Count records per table
3. Verify no NULL tenant_id constraints yet
4. Check referential integrity

### Phase 2: Create Default Tenant
1. Insert default tenant record
2. Create default tenant_settings
3. Verify tenant creation

### Phase 3: Populate tenant_id
1. Update tables in dependency order
2. Start with parent tables (no foreign keys)
3. Then child tables (with foreign keys)
4. Verify counts after each table

### Phase 4: Post-Migration Validation
1. Verify all records have tenant_id
2. Check referential integrity maintained
3. Verify no orphaned records
4. Test RLS policies work correctly

### Phase 5: Apply NOT NULL Constraints
1. Verify no NULL tenant_id values
2. ALTER TABLE to add NOT NULL constraint
3. Verify constraints applied

## Risk Mitigation

### Backup Strategy
- Full database backup before migration
- Point-in-time recovery enabled
- Test restore procedure

### Rollback Plan
1. Restore from backup if critical failure
2. Remove tenant_id values if partial failure
3. Document rollback steps

### Validation Checkpoints
- After each major step
- Before applying NOT NULL constraints
- After migration completion

## Table Dependency Order

### Level 1: No Dependencies (Parent Tables)
- tenants
- auth.users
- unit_kerja
- dasar_alokasi

### Level 2: Single Dependencies
- tenant_settings (depends on tenants)
- user_profiles (depends on tenants, auth.users)
- data_biaya (depends on unit_kerja)

### Level 3: Multiple Dependencies
- kalkulasi_* tables (depend on data_biaya, unit_kerja)
- distribusi_* tables (depend on data_biaya)

### Level 4: Complex Dependencies
- Transaction tables
- Audit tables
- Junction tables

## Estimated Timeline

### Preparation: 1 hour
- Backup database
- Run analysis queries
- Verify prerequisites

### Migration Execution: 2-4 hours
- Create default tenant: 5 minutes
- Populate tenant_id: 1-3 hours (depends on data volume)
- Validation: 30 minutes
- Apply constraints: 30 minutes

### Post-Migration: 1 hour
- Testing
- Verification
- Documentation

**Total Estimated Time: 4-6 hours**

## Success Criteria

✅ All records have tenant_id assigned
✅ Referential integrity maintained
✅ No data loss
✅ RLS policies work correctly
✅ Application functions normally
✅ Performance acceptable

## Next Steps

1. Create migration script (Task 7.2)
2. Test on staging environment
3. Execute on production with monitoring
4. Validate and verify
