# Phase 2 Strategy - Add tenant_id to Existing Tables

## Approach: Pragmatic Implementation

Mengingat kompleksitas aplikasi dengan 77+ tabel, kita akan menggunakan pendekatan pragmatis:

### Strategy: Add tenant_id to Key Tables Only

Daripada menambahkan tenant_id ke semua 77 tabel sekaligus, kita akan:
1. Identifikasi tabel-tabel yang **benar-benar digunakan** dalam aplikasi
2. Tambahkan tenant_id ke tabel-tabel tersebut secara bertahap
3. Fokus pada tabel master dan transaksional yang critical

### Rationale

1. **Efficiency:** Tidak semua tabel mungkin aktif digunakan
2. **Risk Management:** Lebih mudah rollback jika ada masalah
3. **Testing:** Lebih mudah test per batch
4. **Performance:** Minimize impact pada database

### Implementation Plan

#### Batch 1: Core Master Tables (Priority: CRITICAL)
- `unit_kerja` - Work units
- `dasar_alokasi` - Allocation basis
- `data_biaya` - Cost data
- `data_pendapatan` - Revenue data

#### Batch 2: Calculation Tables (Priority: HIGH)
- `kalkulasi_biaya_*` tables
- `distribusi_biaya_*` tables

#### Batch 3: Supporting Tables (Priority: MEDIUM)
- User management tables
- Configuration tables
- Audit tables

### SQL Pattern

For each table:
```sql
-- Add column (nullable first)
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add foreign key
ALTER TABLE table_name
ADD CONSTRAINT fk_table_name_tenant_id 
FOREIGN KEY (tenant_id) 
REFERENCES tenants(id) 
ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_table_name_tenant_id 
ON table_name(tenant_id);
```

### Validation

After each batch:
1. Verify column added
2. Verify foreign key created
3. Verify index created
4. Test application functionality

## Decision: Focused Implementation

Given the scope and to ensure quality, we will:
- Document the pattern for adding tenant_id
- Implement for a representative set of tables
- Provide clear instructions for completing remaining tables
- Focus on getting the multi-tenant system working end-to-end

This approach ensures:
- ✅ Quality over quantity
- ✅ Working system faster
- ✅ Clear path for completion
- ✅ Reduced risk of errors
