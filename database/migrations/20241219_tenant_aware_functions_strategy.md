# Strategi Update Functions untuk Tenant-Aware

## Status Task 6.2: Update Calculation Functions

### Pendekatan Efisien
Untuk menghindari "output terlalu besar", kita akan:
1. Update functions dalam batch kecil (5-10 functions per batch)
2. Fokus pada functions yang paling critical terlebih dahulu
3. Simpan hasil dalam file migration terpisah
4. Test setiap batch sebelum lanjut

### Prioritas Update

#### CRITICAL (Batch 1) - 10 Functions
Functions yang paling sering digunakan dan critical untuk operasi:
1. `get_tenant_id()` - Helper function ✅ DONE
2. `set_tenant_context()` - Helper function ✅ DONE
3. `calculate_balance_sheet_totals()` - Financial reporting
4. `calculate_income_statement_totals()` - Financial reporting
5. `calculate_financial_ratios()` - Financial analysis
6. `calculate_asset_book_value()` - Asset management
7. `calculate_annual_depreciation()` - Asset management
8. `calculate_inventory_valuation()` - Inventory management
9. `calculate_project_profitability()` - Project management
10. `calculate_budget_variance()` - Budget management

#### HIGH PRIORITY (Batch 2) - 15 Functions
Functions untuk operasi bisnis penting:
- Loan calculations (5 functions)
- Tax calculations (3 functions)
- Revenue recognition (2 functions)
- Cost allocation (5 functions)

#### MEDIUM PRIORITY (Batch 3) - 22 Functions
Functions untuk operasi standar:
- Asset lifecycle functions
- Depreciation schedules
- Cash flow functions

### Pattern Update yang Konsisten

Setiap function akan diupdate dengan pattern:
```sql
CREATE OR REPLACE FUNCTION function_name(params)
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    -- other variables
BEGIN
    -- Get tenant context
    current_tenant_id := get_tenant_id();
    
    -- Validate entity belongs to tenant (if applicable)
    IF NOT EXISTS (
        SELECT 1 FROM table_name 
        WHERE id = entity_id 
        AND tenant_id = current_tenant_id
    ) THEN
        RAISE EXCEPTION 'Entity not accessible for tenant';
    END IF;
    
    -- Main logic with tenant filtering
    -- WHERE tenant_id = current_tenant_id
    
    RETURN result;
END;
$$;
```

### Status Tracking
- ✅ Helper functions created
- ⏳ Batch 1 in progress (3/10 done)
- ⏸️ Batch 2 pending
- ⏸️ Batch 3 pending
