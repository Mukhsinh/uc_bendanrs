# Strategi Update CRUD Functions untuk Tenant-Aware

## Task 6.3: Update CRUD Functions

### Overview
CRUD functions (auto_* dan manual_* prefix) perlu diupdate untuk:
1. Validate tenant_id pada INSERT operations
2. Filter by tenant_id pada SELECT operations
3. Validate tenant ownership pada UPDATE/DELETE operations

### Prioritas CRUD Functions

#### CRITICAL PRIORITY (Batch 1) - 10 Functions
Functions yang paling sering digunakan:
1. `auto_create_journal_entry()` - Accounting entries
2. `auto_update_asset_status()` - Asset status updates
3. `auto_calculate_depreciation()` - Depreciation automation
4. `manual_adjust_inventory()` - Inventory adjustments
5. `auto_sync_account_balance()` - Account balance sync
6. `manual_create_budget()` - Budget creation
7. `auto_update_project_status()` - Project status updates
8. `manual_adjust_transaction()` - Transaction adjustments
9. `auto_create_audit_log()` - Audit logging
10. `manual_override_calculation()` - Manual overrides

#### HIGH PRIORITY (Batch 2) - 15 Functions
Functions untuk operasi bisnis penting:
- User management functions (5)
- Data import/export functions (5)
- Batch processing functions (5)

#### MEDIUM PRIORITY (Batch 3) - Remaining Functions
Functions yang less frequently used

### Pattern Update untuk CRUD Functions

#### INSERT Operations
```sql
CREATE OR REPLACE FUNCTION auto_create_entity(params)
RETURNS entity_type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    new_entity entity_type;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Insert with tenant_id
    INSERT INTO entities (tenant_id, other_columns)
    VALUES (current_tenant_id, other_values)
    RETURNING * INTO new_entity;
    
    RETURN new_entity;
END;
$$;
```

#### UPDATE Operations
```sql
CREATE OR REPLACE FUNCTION auto_update_entity(entity_id INTEGER, params)
RETURNS entity_type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    updated_entity entity_type;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Validate ownership
    IF NOT EXISTS (
        SELECT 1 FROM entities 
        WHERE id = entity_id AND tenant_id = current_tenant_id
    ) THEN
        RAISE EXCEPTION 'Entity not accessible';
    END IF;
    
    -- Update with tenant validation
    UPDATE entities 
    SET column = value
    WHERE id = entity_id AND tenant_id = current_tenant_id
    RETURNING * INTO updated_entity;
    
    RETURN updated_entity;
END;
$$;
```

#### DELETE Operations
```sql
CREATE OR REPLACE FUNCTION auto_delete_entity(entity_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Delete with tenant validation
    DELETE FROM entities 
    WHERE id = entity_id AND tenant_id = current_tenant_id;
    
    RETURN FOUND;
END;
$$;
```

### Status Tracking
- ✅ Strategy defined
- ⏳ Batch 1 starting (0/10 done)
- ⏸️ Batch 2 pending
- ⏸️ Batch 3 pending
