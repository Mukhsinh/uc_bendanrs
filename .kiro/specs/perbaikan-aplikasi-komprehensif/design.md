# Design Document: Perbaikan Aplikasi Komprehensif PINTAR UC

## Overview

Dokumen ini merancang solusi teknis untuk 6 area perbaikan pada aplikasi PINTAR UC:

1. **Bug Fix**: `RoleProtectedRoute` gagal memberikan akses ke Super Admin di `/pengaturan-umum`
2. **UI Cleanup**: Hapus `ReportHeader` dari layout, pertahankan filter tahun di header navigasi
3. **Feature**: Dashboard eksekutif baru di `/dashboard` dengan redirect dari `/`
4. **Bug Fix**: Overflow layout pada berbagai halaman
5. **Bug Fix**: Fungsi import data memastikan `tenant_id` + `tahun` selalu tersertakan
6. **Refactoring**: Login, routing, dan integrasi YearContext

---

## Architecture

### Komponen yang Dimodifikasi

```
src/
├── App.tsx                          ← Tambah /dashboard route, redirect / → /dashboard
├── components/
│   ├── Layout.tsx                   ← Hapus ReportHeader dari render konten
│   └── RoleProtectedRoute.tsx       ← Fix logika hasAccess untuk Super Admin
├── pages/
│   ├── Dashboard.tsx                ← BARU: Dashboard eksekutif
│   └── Index.tsx                    ← Redirect ke /dashboard
└── contexts/
    └── YearContext.tsx              ← Tidak diubah (sudah benar)
```

### Alur Data

```
User Login → Pilih Tahun → Tersimpan di YearContext (localStorage)
                ↓
         Layout (Header)
          ├── Filter Tahun (Select) ← useYear()
          ├── TenantBranding
          └── User Menu
                ↓
         Konten Halaman (tanpa ReportHeader)
          └── Setiap halaman query Supabase dengan:
              .eq('tahun', selectedYear)
              .eq('tenant_id', tenantId)
```

---

## Components and Interfaces

### 1. Fix: RoleProtectedRoute

**Masalah Root Cause:**
Di `checkUserRole()`, setelah `isSuperAdmin()` dikonfirmasi `true`, kode sudah `setHasAccess(allowedRoles.includes('Super Admin'))`. Jika `allowedRoles = ["Super Admin", "Admin"]`, ini seharusnya true. Namun ada kemungkinan bug: `normalizeRoleName` pada metadata bisa mengembalikan `null` jika format tidak tepat, lalu flow berlanjut ke query database yang bisa timeout atau gagal.

**Solusi:**
Tambahkan early return yang lebih eksplisit: jika `isSuperAdmin()` = true, langsung set `hasAccess = true` dan return tanpa menunggu `allowedRoles.includes()`.

```typescript
// Perubahan di RoleProtectedRoute.tsx
const isResolvedSuperAdmin = roleFromMetadata === 'Super Admin' || await isSuperAdmin(userId);
if (isResolvedSuperAdmin) {
  setUserRole('Super Admin');
  // FIX: Jika allowedRoles mengandung 'Super Admin', langsung berikan akses
  // Jangan cek .includes() karena Super Admin selalu dapat akses
  setHasAccess(true); // ← Sebelumnya: allowedRoles.includes('Super Admin')
  setIsLoading(false);
  return;
}
```

**Alasan:** Super Admin yang sudah diverifikasi via `isSuperAdmin()` seharusnya selalu mendapat akses. Jika `allowedRoles` tidak menyertakan 'Super Admin', itu adalah error konfigurasi di App.tsx — bukan alasan menolak akses Super Admin.

### 2. Fix: Layout - Hapus ReportHeader

**Masalah:** `ReportHeader` (banner instansi + tanggal besar) dirender di `<main>` sebelum konten halaman, menyebabkan:
- Ruang terbuang ~120-150px di atas setiap halaman
- Overflow vertikal di layar kecil
- Duplikasi informasi (tenant sudah ada di header navigasi)

**Solusi:** Hapus blok `{reportMeta && <ReportHeader ... />}` dari `Layout.tsx`.

```tsx
// Layout.tsx - SEBELUM:
<main className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6 bg-transparent">
  {reportMeta && (
    <ReportHeader title={reportMeta.title} subtitle={reportMeta.subtitle} />
  )}
  <Suspense ...>
    {children || <Outlet />}
  </Suspense>
</main>

// Layout.tsx - SESUDAH:
<main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-transparent overflow-hidden">
  <Suspense ...>
    {children || <Outlet />}
  </Suspense>
</main>
```

### 3. Feature: Dashboard Eksekutif (`/dashboard`)

**Komponen Baru:** `src/pages/Dashboard.tsx`

**Data Sources:**
- `data_pendapatan` — total pendapatan per tahun/unit
- `data_biaya` — total biaya per tahun/unit  
- `unit_kerja` — jumlah unit kerja aktif
- Kalkulasi cost recovery = total_pendapatan / total_biaya × 100%

**Layout Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│  Header: "Dashboard Eksekutif" + Filter Tahun           │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Total    │ Total    │ Cost     │ Unit     │ Trend Arrow │
│ Pendptn  │ Biaya    │ Recovery │ Kerja    │             │
│ (card)   │ (card)   │ (card)   │ (card)   │             │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│  Grafik Tren: Line Chart Pendapatan vs Biaya (12 bulan) │
├─────────────────────────────────────────────────────────┤
│  Grafik: Bar Chart Top 10 Unit Kerja (biaya terbesar)   │
└─────────────────────────────────────────────────────────┘
```

**Interface Types:**
```typescript
interface DashboardMetrics {
  totalPendapatan: number;
  totalBiaya: number;
  costRecovery: number;
  jumlahUnitKerja: number;
}

interface TrendData {
  bulan: string;
  pendapatan: number;
  biaya: number;
}

interface UnitBiayaData {
  unit_kerja: string;
  total_biaya: number;
}
```

### 4. Fix: Import Data - tenant_id dan tahun

**Masalah:** Beberapa FormTable component tidak menyertakan `tenant_id` dan `tahun` saat proses import CSV/Excel.

**Solusi Pattern:**
```typescript
// Saat proses baris import, tambahkan metadata:
const rowsToInsert = parsedData.map(row => ({
  ...row,
  tenant_id: tenantId,  // dari useTenant()
  tahun: selectedYear,  // dari useYear()
}));

// Setelah insert berhasil:
await queryClient.invalidateQueries({ queryKey: ['nama-data'] });
```

### 5. Routing Update

**App.tsx changes:**
```tsx
// Tambah import
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Tambah route
<Route path="/dashboard" element={<SessionGuard><Dashboard /></SessionGuard>} />

// Ubah Index redirect  
<Route index element={<Navigate to="/dashboard" replace />} />
```

**SidebarNav.tsx changes:**
```tsx
// Ubah href Dashboard dari "/" ke "/dashboard"
{ title: "Dashboard", icon: Home, href: "/dashboard" }
```

---

## Data Models

### Query Dashboard - Pendapatan
```sql
SELECT 
  SUM(total_pendapatan) as total,
  nama_unit_kerja
FROM data_pendapatan
WHERE tahun = :selectedYear
  AND tenant_id = :tenantId
GROUP BY nama_unit_kerja
ORDER BY total DESC
LIMIT 10;
```

### Query Dashboard - Biaya
```sql
SELECT 
  SUM(total_biaya) as total,
  nama_unit_kerja  
FROM data_biaya
WHERE tahun = :selectedYear
  AND tenant_id = :tenantId
GROUP BY nama_unit_kerja
ORDER BY total DESC
LIMIT 10;
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Super Admin Selalu Mendapat Akses

*Untuk setiap* route yang menyertakan "Super Admin" dalam `allowedRoles`, jika user teridentifikasi sebagai Super Admin (via `isSuperAdmin()` = true), maka `hasAccess` harus selalu `true`.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Filter Tahun Tersinkron

*Untuk setiap* nilai tahun yang dipilih user di header, nilai `selectedYear` yang dibaca dari `useYear()` di komponen manapun harus identik dengan nilai yang dipilih.

**Validates: Requirements 2.2, 2.4**

### Property 3: Persistensi Tahun di localStorage

*Untuk setiap* nilai tahun yang di-set melalui `setSelectedYear(year)`, nilai yang dibaca dari `localStorage.getItem('pintar_uc_selected_year')` harus sama dengan `year.toString()`.

**Validates: Requirements 2.5**

### Property 4: Dashboard Metrics Konsisten dengan Data

*Untuk setiap* kombinasi `tahun` dan `tenantId`, `totalBiaya` yang dihitung di Dashboard harus sama dengan `SUM(total_biaya)` dari query `data_biaya` dengan filter tahun dan tenant yang sama.

**Validates: Requirements 3.3, 3.6**

### Property 5: Import Data Selalu Menyertakan tenant_id dan tahun

*Untuk setiap* baris data yang berhasil diimpor melalui fitur import, baris tersebut harus memiliki `tenant_id` yang tidak null dan `tahun` yang sama dengan `selectedYear` aktif.

**Validates: Requirements 5.1, 5.4**

### Property 6: Import File Invalid Menghasilkan Error

*Untuk setiap* file yang diunggah dengan format tidak sesuai (kolom wajib kosong, tipe data salah), sistem harus mengembalikan error message dan tidak menyimpan data apapun ke database.

**Validates: Requirements 5.3**

### Property 7: Login Error pada Kredensial Salah

*Untuk setiap* kombinasi email/password yang tidak terdaftar atau salah, form login harus menampilkan pesan error dan tidak melakukan navigasi ke halaman dalam.

**Validates: Requirements 6.3**

---

## Error Handling

### RoleProtectedRoute
- Jika `supabase.auth.getUser()` gagal → tampilkan fallback message, jangan crash
- Jika query `user_roles` gagal → gunakan role dari `app_metadata` sebagai fallback
- Timeout 10 detik untuk pengecekan role, setelah itu fallback ke deny

### Dashboard Data Fetch
- Jika query gagal → tampilkan skeleton/empty state, bukan crash
- Jika data kosong → tampilkan "Belum ada data untuk tahun {selectedYear}"
- React Query retry: 2x dengan exponential backoff

### Import Data
- Validasi file sebelum upload: cek extension, cek header kolom wajib
- Jika insert gagal di database → rollback (tidak ada partial insert)
- Tampilkan detail baris yang gagal beserta alasan

---

## Testing Strategy

### Unit Tests
- Test `normalizeRoleName()` dengan berbagai format string input
- Test `YearContext` initializer — baca dari localStorage, fallback ke current year
- Test validasi file import (format checker)

### Property-Based Tests

Menggunakan **Vitest** (sudah ada di project via `vitest.config.ts`) dengan library **fast-check** untuk property-based testing.

**Konfigurasi:**
- Minimum 100 iterasi per property test
- Setiap test ditag dengan format: `Feature: perbaikan-aplikasi-komprehensif, Property N: description`

**Property Test 1: Super Admin Access**
```typescript
// Feature: perbaikan-aplikasi-komprehensif, Property 1: Super Admin Selalu Mendapat Akses
it('Super Admin selalu mendapat akses ke route yang mengizinkan Super Admin', () => {
  fc.assert(fc.property(
    fc.array(fc.constantFrom('Super Admin', 'Admin', 'Manager', 'Viewer'), { minLength: 1 }),
    (allowedRoles) => {
      if (allowedRoles.includes('Super Admin')) {
        const result = computeAccess('Super Admin', allowedRoles);
        expect(result).toBe(true);
      }
    }
  ), { numRuns: 100 });
});
```

**Property Test 2: YearContext Round Trip**
```typescript
// Feature: perbaikan-aplikasi-komprehensif, Property 3: Persistensi Tahun di localStorage
it('setSelectedYear selalu tersimpan dan terbaca dari localStorage', () => {
  fc.assert(fc.property(
    fc.integer({ min: 2025, max: 2050 }),
    (year) => {
      setSelectedYear(year);
      const stored = localStorage.getItem('pintar_uc_selected_year');
      expect(stored).toBe(year.toString());
    }
  ), { numRuns: 100 });
});
```

**Property Test 3: Import Data Metadata**
```typescript
// Feature: perbaikan-aplikasi-komprehensif, Property 5: Import Selalu Menyertakan tenant_id dan tahun
it('setiap baris hasil proses import memiliki tenant_id dan tahun', () => {
  fc.assert(fc.property(
    fc.array(fc.record({ nama: fc.string(), nilai: fc.float() }), { minLength: 1, maxLength: 50 }),
    fc.string({ minLength: 1 }), // tenantId
    fc.integer({ min: 2025, max: 2050 }), // tahun
    (rows, tenantId, tahun) => {
      const result = enrichImportRows(rows, tenantId, tahun);
      return result.every(r => r.tenant_id === tenantId && r.tahun === tahun);
    }
  ), { numRuns: 100 });
});
```

**Property Test 4: Login Error untuk Kredensial Invalid**
```typescript
// Feature: perbaikan-aplikasi-komprehensif, Property 7: Login Error pada Kredensial Salah
it('login dengan email invalid selalu menampilkan error', () => {
  fc.assert(fc.property(
    fc.string().filter(s => !s.includes('@')), // bukan email valid
    fc.string({ minLength: 1 }),
    (email, password) => {
      const result = validateLoginInput(email, password);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBeTruthy();
    }
  ), { numRuns: 100 });
});
```
