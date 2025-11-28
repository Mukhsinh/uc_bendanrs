# Design Document

## Overview

Dokumen ini menjelaskan desain teknis untuk perbaikan beberapa fitur UI dan fungsionalitas pada aplikasi Unit Cost Rumah Sakit. Perbaikan mencakup:

1. Sinkronisasi kartu total budgeting BHP dengan data rincian
2. Penambahan kolom manual input pada Skenario Tarif Visit
3. Perbaikan fungsi update data pada Skenario Tarif Akomodasi
4. Penambahan kolom komponen tarif pada Skenario Tarif Akomodasi
5. Perbaikan tampilan daftar user di Manajemen Akses
6. Pemindahan tenant selector ke halaman Manajemen Akses
7. Penghapusan tenant selector dari header
8. Penguatan keamanan RLS untuk isolasi data multi-tenant

## Architecture

### Component Structure

```
src/
├── pages/
│   ├── BudgetingBHPRincian.tsx (update)
│   ├── SkenarioTarif.tsx (update)
│   ├── SkenarioTarifAkomodasi.tsx (update)
│   └── ManajemenAkses.tsx (update)
├── components/
│   ├── ManajemenAkses/
│   │   ├── TenantSelector.tsx (new)
│   │   ├── TenantManagementTab.tsx (update)
│   │   └── UserManagementTab.tsx (update)
│   └── Layout.tsx (update - remove tenant selector)
├── contexts/
│   └── TenantContext.tsx (update)
└── utils/
    └── calculations.ts (new - shared calculation functions)
```

### Data Flow

1. **Budgeting BHP Total Calculation**
   - Component reads raw data from `rincian_budgeting_bhp_public`
   - Calculates total from `total_rupiah` field
   - Applies filter if unit kerja selected
   - Updates card display reactively

2. **Skenario Tarif Manual Input**
   - User edits jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis
   - Frontend calculates derived values (jasa_pelayanan, tarif, percentages)
   - Saves all calculated values to database
   - No database triggers for calculation (manual control)

3. **Tenant Management**
   - Super Admin selects tenant from dropdown in Manajemen Akses
   - Tenant selection updates TenantContext
   - All components react to context change
   - RLS ensures data isolation


## Components and Interfaces

### 1. BudgetingBHPRincian Component Updates

**Purpose**: Display accurate total budgeting synchronized with rincian data

**Key Changes**:
- Calculate `totalBudgeting` from raw data before aggregation
- Apply filter to raw data before summing
- Use `total_rupiah` field for calculation
- Format display with `formatCurrency` utility

**Interface**:
```typescript
interface RincianData {
  id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  total_rupiah: number;
  // ... other fields
}

// Calculation function
const calculateTotalBudgeting = (
  rawData: RincianData[],
  selectedUnit: string
): number => {
  const filteredData = selectedUnit === "all" 
    ? rawData 
    : rawData.filter(item => item.nama_unit_kerja === selectedUnit);
  
  return filteredData.reduce((sum, item) => sum + (Number(item.total_rupiah) || 0), 0);
};
```

### 2. SkenarioTarif Component Updates

**Purpose**: Enable manual input for tariff components with automatic calculation

**Key Changes**:
- Add editable columns: jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis
- Implement frontend calculation for derived values
- Update mutation to save all calculated fields
- Remove dependency on database triggers

**Interface**:
```typescript
interface SkenarioTarifData {
  id: string;
  jasa_sarana: number;
  jasa_pelayanan_medis: number;
  jasa_pelayanan_non_medis: number;
  jasa_pelayanan: number; // calculated
  tarif_per_tindakan: number; // calculated
  prosentase_jasa_pelayanan: number; // calculated
  prosentase_profit: number; // calculated
  unit_cost_per_tindakan: number;
  // ... other fields
}

// Calculation function
const recalculateTariff = (
  jasaSarana: number,
  jasaPelayananMedis: number,
  jasaPelayananNonMedis: number,
  unitCost: number
): {
  jasaPelayanan: number;
  tarif: number;
  prosentaseJasaPelayanan: number;
  prosentaseProfit: number;
} => {
  const jasaPelayanan = jasaPelayananMedis + jasaPelayananNonMedis;
  const tarif = jasaSarana + jasaPelayanan;
  const prosentaseJasaPelayanan = tarif > 0 
    ? ((jasaPelayanan / tarif) * 100) 
    : 0;
  const prosentaseProfit = unitCost > 0 
    ? (((jasaSarana - unitCost) / unitCost) * 100) 
    : 0;
  
  return {
    jasaPelayanan,
    tarif,
    prosentaseJasaPelayanan: Math.round(prosentaseJasaPelayanan * 100) / 100,
    prosentaseProfit: Math.round(prosentaseProfit * 100) / 100,
  };
};
```


### 3. SkenarioTarifAkomodasi Component Updates

**Purpose**: Fix update data function and add tariff component columns

**Key Changes**:
- Fix `populate_skenario_tarif_akomodasi` RPC call
- Add columns for tariff components (matching SkenarioTarif structure)
- Implement same calculation logic as SkenarioTarif
- Enable editing for jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis

**Database Schema Addition**:
```sql
-- Add new columns to skenario_tarif_akomodasi table
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS jasa_sarana_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_vvip NUMERIC DEFAULT 0,
-- ... repeat for VIP, I, II, III classes
```

**Interface**:
```typescript
interface SkenarioTarifAkomodasiData {
  id: string;
  tahun: number;
  // For each class (VVIP, VIP, I, II, III):
  rata_rata_uc_vvip: number;
  jasa_sarana_vvip: number;
  jasa_pelayanan_medis_vvip: number;
  jasa_pelayanan_non_medis_vvip: number;
  jasa_pelayanan_vvip: number; // calculated
  tarif_vvip: number; // calculated
  prosentase_jasa_pelayanan_vvip: number; // calculated
  profit_rupiah_vvip: number; // calculated
  profit_persen_vvip: number; // calculated
  // ... repeat for other classes
}
```

### 4. ManajemenAkses Component Updates

**Purpose**: Reorganize tenant management and fix user list display

**Key Changes**:
- Add TenantSelector component at top of page (Super Admin only)
- Move tenant selection from header to Manajemen Akses page
- Fix user list query to use tenant context
- Set default tab based on user role
- Ensure tenant_id is passed when creating users

**Component Structure**:
```typescript
// ManajemenAkses.tsx
const ManajemenAkses = () => {
  const { user } = useAuth();
  const { tenant, setTenant, availableTenants } = useTenant();
  const isSuperAdmin = user?.email === 'mukhsin9@gmail.com';
  
  const [activeTab, setActiveTab] = useState(
    isSuperAdmin ? 'tenant' : 'user'
  );
  
  return (
    <div>
      {/* Tenant Selector - Only for Super Admin */}
      {isSuperAdmin && (
        <TenantSelector 
          value={tenant?.id}
          onChange={setTenant}
          tenants={availableTenants}
        />
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {isSuperAdmin && (
          <TabsTrigger value="tenant">Kelola Tenant</TabsTrigger>
        )}
        <TabsTrigger value="user">Kelola User</TabsTrigger>
        <TabsTrigger value="role-access">Rincian Role Akses</TabsTrigger>
      </Tabs>
    </div>
  );
};
```

### 5. TenantSelector Component (New)

**Purpose**: Provide tenant selection UI for Super Admin

**Interface**:
```typescript
interface TenantSelectorProps {
  value: string | undefined;
  onChange: (tenantId: string) => void;
  tenants: Array<{
    id: string;
    name: string;
    is_active: boolean;
  }>;
}

const TenantSelector: React.FC<TenantSelectorProps> = ({
  value,
  onChange,
  tenants
}) => {
  return (
    <div className="w-80">
      <Label>Pilih Tenant</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih tenant..." />
        </SelectTrigger>
        <SelectContent>
          {tenants.map(t => (
            <SelectItem key={t.id} value={t.id}>
              {t.name} {!t.is_active && '(Nonaktif)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
```


## Data Models

### Database Tables

#### skenario_tarif (existing - no schema changes needed)
- Already has columns: jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis
- Already has calculated columns: jasa_pelayanan, tarif_per_tindakan, prosentase_jasa_pelayanan, prosentase_profit
- Update strategy: Remove auto-calculation triggers, calculate in frontend

#### skenario_tarif_akomodasi (schema update required)
```sql
-- Current columns (per class):
- rata_rata_uc_{class}
- tarif_{class}
- profit_rupiah_{class}
- profit_persen_{class}

-- New columns to add (per class):
- jasa_sarana_{class}
- jasa_pelayanan_medis_{class}
- jasa_pelayanan_non_medis_{class}
- jasa_pelayanan_{class}
- prosentase_jasa_pelayanan_{class}
```

#### rincian_budgeting_bhp_public (no changes)
- Used for total budgeting calculation
- Key field: total_rupiah

### Calculation Formulas

All tariff calculations follow these formulas:

1. **Jasa Pelayanan Total**:
   ```
   jasa_pelayanan = jasa_pelayanan_medis + jasa_pelayanan_non_medis
   ```

2. **Tarif**:
   ```
   tarif = jasa_sarana + jasa_pelayanan
   ```

3. **Prosentase Jasa Pelayanan**:
   ```
   prosentase_jasa_pelayanan = (jasa_pelayanan / tarif) * 100
   // if tarif = 0, then prosentase_jasa_pelayanan = 0
   ```

4. **Prosentase Profit**:
   ```
   prosentase_profit = ((jasa_sarana - unit_cost) / unit_cost) * 100
   // if unit_cost = 0, then prosentase_profit = 0
   ```

5. **Profit Rupiah** (for Akomodasi):
   ```
   profit_rupiah = tarif - rata_rata_uc
   ```

### Shared Calculation Utility

Create `src/utils/calculations.ts`:
```typescript
export interface TariffCalculationInput {
  jasaSarana: number;
  jasaPelayananMedis: number;
  jasaPelayananNonMedis: number;
  unitCost: number;
}

export interface TariffCalculationResult {
  jasaPelayanan: number;
  tarif: number;
  prosentaseJasaPelayanan: number;
  prosentaseProfit: number;
}

export const calculateTariff = (
  input: TariffCalculationInput
): TariffCalculationResult => {
  const jasaPelayanan = input.jasaPelayananMedis + input.jasaPelayananNonMedis;
  const tarif = input.jasaSarana + jasaPelayanan;
  
  const prosentaseJasaPelayanan = tarif > 0 
    ? (jasaPelayanan / tarif) * 100 
    : 0;
  
  const prosentaseProfit = input.unitCost > 0 
    ? ((input.jasaSarana - input.unitCost) / input.unitCost) * 100 
    : 0;
  
  return {
    jasaPelayanan,
    tarif,
    prosentaseJasaPelayanan: Math.round(prosentaseJasaPelayanan * 100) / 100,
    prosentaseProfit: Math.round(prosentaseProfit * 100) / 100,
  };
};

export const roundToTwoDecimals = (value: number): number => 
  Math.round(value * 100) / 100;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Total budgeting calculation accuracy
*For any* set of rincian data and any filter selection, the displayed total budgeting must equal the sum of `total_rupiah` from all records matching the filter
**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Total budgeting reactivity
*For any* change to rincian data (add, update, delete), the total budgeting display must update to reflect the new sum
**Validates: Requirements 1.2**

### Property 3: Currency formatting consistency
*For any* numeric value displayed as currency, the output must contain "Rp", use Indonesian locale formatting with thousand separators, and have no decimal places
**Validates: Requirements 1.5, 4.5**

### Property 4: Jasa pelayanan calculation
*For any* values of jasa_pelayanan_medis and jasa_pelayanan_non_medis, jasa_pelayanan must equal their sum
**Validates: Requirements 2.3**

### Property 5: Tarif calculation
*For any* values of jasa_sarana and jasa_pelayanan, tarif must equal their sum
**Validates: Requirements 2.4, 4.3**

### Property 6: Prosentase jasa pelayanan formula
*For any* values of jasa_pelayanan and tarif (where tarif > 0), prosentase_jasa_pelayanan must equal (jasa_pelayanan / tarif) * 100, rounded to 2 decimal places
**Validates: Requirements 2.6**

### Property 7: Prosentase profit formula
*For any* values of jasa_sarana and unit_cost (where unit_cost > 0), prosentase_profit must equal ((jasa_sarana - unit_cost) / unit_cost) * 100, rounded to 2 decimal places
**Validates: Requirements 2.7**

### Property 8: Tariff calculation persistence
*For any* tariff data saved to database, all calculated fields (jasa_pelayanan, tarif, prosentase_jasa_pelayanan, prosentase_profit) must be stored with values matching the calculation formulas
**Validates: Requirements 2.5, 4.4**

### Property 9: User list tenant filtering
*For any* tenant selection, the user list must contain only users where user.tenant_id equals the selected tenant_id
**Validates: Requirements 5.2, 6.4**

### Property 10: New user tenant assignment
*For any* user created through the form, the user.tenant_id must equal the currently active tenant_id from context
**Validates: Requirements 5.4**

### Property 11: Tenant context propagation
*For any* page in the application, database queries must use the tenant_id from TenantContext
**Validates: Requirements 7.2, 7.5**

### Property 12: RLS tenant isolation
*For any* database query, the RLS policy must ensure that only data with tenant_id matching the current user's tenant can be accessed
**Validates: Requirements 8.1, 8.3**

### Property 13: Automatic tenant_id population
*For any* new record inserted into a tenant-aware table, if tenant_id is not provided, it must be automatically populated from the current user's tenant
**Validates: Requirements 8.2**

### Property 14: Stored procedure parameter passing
*For any* call to a stored procedure or function, if the function requires tenant_id or user_id, these parameters must be passed with values from the current context
**Validates: Requirements 8.5**


## Error Handling

### Frontend Error Handling

1. **Calculation Errors**
   - Handle division by zero in percentage calculations
   - Default to 0 when denominator is 0
   - Validate numeric inputs before calculation

2. **Database Errors**
   - Catch and display RLS policy violations
   - Show user-friendly messages for tenant_id errors
   - Handle network timeouts gracefully

3. **UI State Errors**
   - Validate form inputs before submission
   - Show loading states during async operations
   - Disable buttons during mutations to prevent double-submission

### Backend Error Handling

1. **RLS Policy Errors**
   - Return clear error messages when RLS blocks access
   - Log security violations for audit
   - Suggest checking tenant selection

2. **Stored Procedure Errors**
   - Validate parameters before execution
   - Return structured error responses
   - Include error codes for client handling

3. **Data Integrity Errors**
   - Enforce NOT NULL constraints on tenant_id
   - Validate foreign key relationships
   - Handle concurrent update conflicts

### Error Messages

```typescript
const ERROR_MESSAGES = {
  TENANT_NOT_FOUND: 'Tenant tidak ditemukan. Silakan pilih tenant yang valid.',
  TENANT_ID_MISSING: 'Tenant ID tidak ditemukan. Silakan login ulang.',
  RLS_VIOLATION: 'Anda tidak memiliki akses ke data ini.',
  CALCULATION_ERROR: 'Terjadi kesalahan dalam perhitungan. Silakan periksa input Anda.',
  NETWORK_ERROR: 'Koneksi ke server gagal. Silakan coba lagi.',
  PERMISSION_DENIED: 'Anda tidak memiliki izin untuk melakukan operasi ini.',
};
```

## Testing Strategy

### Unit Testing

**Focus Areas**:
- Calculation functions (calculateTariff, calculateTotalBudgeting)
- Currency formatting functions
- Component rendering with different props
- Error handling logic

**Example Unit Tests**:
```typescript
describe('calculateTariff', () => {
  it('should calculate jasa pelayanan as sum of medis and non medis', () => {
    const result = calculateTariff({
      jasaSarana: 100000,
      jasaPelayananMedis: 50000,
      jasaPelayananNonMedis: 30000,
      unitCost: 80000,
    });
    expect(result.jasaPelayanan).toBe(80000);
  });
  
  it('should handle zero unit cost without error', () => {
    const result = calculateTariff({
      jasaSarana: 100000,
      jasaPelayananMedis: 50000,
      jasaPelayananNonMedis: 30000,
      unitCost: 0,
    });
    expect(result.prosentaseProfit).toBe(0);
  });
});
```

### Property-Based Testing

**Testing Framework**: fast-check (for TypeScript/JavaScript)

**Property Tests**:

1. **Tariff Calculation Properties**
   - Generate random positive numbers for all tariff components
   - Verify calculation formulas hold for all inputs
   - Test edge cases (zero values, very large numbers)

2. **Filtering Properties**
   - Generate random datasets with multiple tenants/units
   - Verify filtering always returns correct subset
   - Test that totals match filtered data

3. **RLS Properties**
   - Generate random tenant IDs and user contexts
   - Verify data isolation across tenants
   - Test that cross-tenant access is blocked

**Example Property Test**:
```typescript
import fc from 'fast-check';

describe('Property: Tariff calculation formulas', () => {
  it('should satisfy tariff = jasa_sarana + jasa_pelayanan for all inputs', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000), // jasa_sarana
        fc.nat(1000000), // jasa_pelayanan_medis
        fc.nat(1000000), // jasa_pelayanan_non_medis
        fc.nat(1000000), // unit_cost
        (jasaSarana, jasaPelayananMedis, jasaPelayananNonMedis, unitCost) => {
          const result = calculateTariff({
            jasaSarana,
            jasaPelayananMedis,
            jasaPelayananNonMedis,
            unitCost,
          });
          
          const expectedJasaPelayanan = jasaPelayananMedis + jasaPelayananNonMedis;
          const expectedTarif = jasaSarana + expectedJasaPelayanan;
          
          return (
            result.jasaPelayanan === expectedJasaPelayanan &&
            result.tarif === expectedTarif
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Focus Areas**:
- Database RLS policies
- Stored procedure calls with tenant context
- Component interaction with backend
- Tenant context propagation

**Test Scenarios**:
1. Create user with tenant_id auto-population
2. Query data with RLS filtering
3. Update tariff and verify all calculated fields
4. Switch tenant and verify data refresh

### Manual Testing Checklist

1. **Budgeting BHP**
   - [ ] Total budgeting matches sum of rincian
   - [ ] Total updates when filter changes
   - [ ] Currency formatting is correct

2. **Skenario Tarif Visit**
   - [ ] Can edit jasa sarana, medis, non medis
   - [ ] Calculations update in real-time
   - [ ] Save persists all calculated values

3. **Skenario Tarif Akomodasi**
   - [ ] Update Data button works
   - [ ] New columns display correctly
   - [ ] Edit and save functions work

4. **Manajemen Akses**
   - [ ] User list displays for non-Super Admin
   - [ ] Tenant selector shows for Super Admin
   - [ ] Add user assigns correct tenant_id
   - [ ] No tenant selector in header

5. **Multi-Tenant Security**
   - [ ] Cannot access other tenant's data
   - [ ] Tenant_id auto-populates on insert
   - [ ] RLS errors show clear messages
