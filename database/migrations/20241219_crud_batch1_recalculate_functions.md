# CRUD Batch 1 - Manual Recalculate Functions

## Target Functions (5 functions)
1. `manual_recalculate_bdrs()` - Recalculate BDRS
2. `manual_recalculate_cathlab()` - Recalculate Cathlab
3. `manual_recalculate_laboratorium()` - Recalculate Lab
4. `manual_recalculate_operatif_batch()` - Recalculate Operatif
5. `manual_recalculate_gizi()` - Recalculate Gizi

## Update Pattern
Each function will be updated to:
1. Get current tenant_id using `get_tenant_id()`
2. Add tenant_id filtering to all queries
3. Validate data belongs to current tenant
4. Return results scoped to tenant only

## Status
- ⏳ Starting batch 1
- Target: 5 functions
- Approach: One function at a time
