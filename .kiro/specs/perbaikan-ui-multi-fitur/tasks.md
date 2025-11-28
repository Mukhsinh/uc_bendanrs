# Implementation Plan

- [x] 1. Setup shared utilities dan database schema
- [x] 1.1 Buat file `src/utils/calculations.ts` dengan fungsi kalkulasi tarif yang dapat digunakan kembali
  - Implementasi `calculateTariff` function dengan semua formula
  - Implementasi `roundToTwoDecimals` helper
  - Implementasi `calculateTotalBudgeting` helper
  - Export TypeScript interfaces untuk input/output
  - _Requirements: 2.3, 2.4, 2.6, 2.7, 4.3_

- [x] 1.2 Write property test untuk calculation utilities
  - **Property 4: Jasa pelayanan calculation**
  - **Property 5: Tarif calculation**
  - **Property 6: Prosentase jasa pelayanan formula**
  - **Property 7: Prosentase profit formula**
  - **Validates: Requirements 2.3, 2.4, 2.6, 2.7**

- [x] 1.3 Buat migration untuk menambah kolom di `skenario_tarif_akomodasi`
  - Tambah kolom jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis untuk setiap kelas
  - Tambah kolom jasa_pelayanan dan prosentase_jasa_pelayanan untuk setiap kelas
  - Set default values ke 0
  - _Requirements: 4.1_

- [x] 2. Perbaiki BudgetingBHPRincian - Total Budgeting Sync
- [x] 2.1 Update perhitungan total budgeting untuk menggunakan raw data
  - Modifikasi logic untuk menghitung dari `rawData` sebelum agregasi
  - Implementasi filtering berdasarkan `selectedUnit`
  - Gunakan field `total_rupiah` untuk penjumlahan
  - Menggunakan shared utility `calculateTotalBudgeting`
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2.2 Pastikan reaktivitas total budgeting saat data berubah
  - Verifikasi `useMemo` dependencies correct
  - Sudah menggunakan useMemo dengan dependencies [rawData, selectedUnit]
  - _Requirements: 1.2_

- [x] 2.3 Verifikasi format currency konsisten
  - Sudah menggunakan `formatCurrency` utility untuk semua nilai
  - Menggunakan Intl.NumberFormat dengan locale id-ID
  - _Requirements: 1.5_

- [x] 3. Update SkenarioTarif - Manual Input Columns
- [x] 3.1 Tambahkan state untuk edit mode dengan 3 kolom
  - Sudah ada `editValues` state dengan jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis
  - Sudah ada `handleEditRow` untuk set initial values
  - _Requirements: 2.1, 2.2_

- [x] 3.2 Implementasi UI untuk editable columns
  - Sudah ada Input fields untuk ketiga kolom (perlu verifikasi di UI)
  - Sudah ada edit/save buttons
  - Sudah ada cancel edit handler
  - _Requirements: 2.1, 2.2_

- [x] 3.3 Implementasi frontend calculation saat edit
  - Sudah menggunakan `recalculateRow` function untuk kalkulasi
  - Calculate derived values saat user mengubah input
  - _Requirements: 2.3, 2.4_

- [x] 3.4 Update mutation untuk save semua calculated fields
  - Sudah menghitung semua derived values sebelum save
  - Update database dengan semua fields yang diperlukan
  - Sudah invalidate query setelah success
  - _Requirements: 2.5_

- [x] 4. Update SkenarioTarifAkomodasi - Fix Update Data & Add Columns

- [x] 4.1 Perbaiki fungsi populate_skenario_tarif_akomodasi
  - RPC call sudah menggunakan parameter yang benar (p_user_id, p_tahun)
  - Sudah ada error handling dengan pesan yang jelas
  - _Requirements: 3.1, 3.5_

- [x] 4.2 Update interface dan state untuk kolom baru


  - Tambah fields untuk jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis per kelas
  - Update `editValues` state untuk support multiple fields per kelas
  - _Requirements: 4.1_

- [x] 4.3 Implementasi UI untuk kolom tambahan


  - Tambah table columns untuk komponen tarif (jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis)
  - Implementasi edit mode untuk 3 kolom input per kelas
  - Tampilkan calculated values (jasa_pelayanan, %, profit)
  - _Requirements: 4.1, 4.2_

- [x] 4.4 Implementasi calculation logic menggunakan shared utility

  - Import `calculateTariff` dari utils
  - Calculate untuk setiap kelas saat edit
  - Update profit_rupiah = tarif - rata_rata_uc
  - _Requirements: 4.3_

- [x] 4.5 Update mutation untuk save calculated values

  - Save semua fields termasuk calculated values untuk setiap kelas
  - Invalidate query setelah success
  - Show success/error toast
  - _Requirements: 4.4_


- [ ] 5. Update ManajemenAkses - Reorganize Tenant Management
- [x] 5.1 Update ManajemenAkses page layout
  - Sudah ada TenantSelector di bagian atas (conditional untuk Super Admin)
  - Sudah set default tab berdasarkan role (tenant untuk Super Admin, user untuk lainnya)
  - _Requirements: 5.1, 6.1, 6.2_

- [x] 5.2 Verifikasi UserManagementTab menampilkan daftar user
  - Query sudah menggunakan tenant dari context
  - Filter users berdasarkan tenant_id
  - Sudah ada error handling
  - _Requirements: 5.2, 5.5_

- [x] 5.3 Verifikasi fungsi tambah user assign tenant_id
  - Tenant_id diambil dari context
  - Pass tenant_id saat create user
  - Sudah ada validasi tenant_id
  - _Requirements: 5.3, 5.4_

- [x] 5.4 Verifikasi TenantManagementTab untuk Super Admin
  - Tampilkan semua tenants (tidak difilter)
  - CRUD operations sudah ada
  - _Requirements: 6.3_


- [ ] 6. Remove Tenant Selector dari Header
- [x] 6.1 Update Layout component untuk remove tenant selector



  - Hapus TenantSelector dari header/navigation
  - Verifikasi tidak ada reference ke tenant selector di Layout
  - _Requirements: 7.1_

- [x] 6.2 Verifikasi tenant context masih berfungsi di halaman lain
  - Queries sudah menggunakan tenant dari context
  - RLS policies sudah enforce tenant isolation
  - _Requirements: 7.2, 7.5_

- [x] 6.3 Verifikasi auto-assignment tenant untuk non-Super Admin
  - Tenant sudah di-set dari user profile saat login
  - Tenant selection untuk Super Admin sudah persist

  - _Requirements: 7.3, 7.4_

- [ ] 7. Strengthen RLS Security
- [x] 7.1 Verifikasi RLS policies aktif untuk semua tabel
  - RLS policies sudah aktif untuk skenario_tarif
  - RLS policies sudah aktif untuk skenario_tarif_akomodasi
  - RLS policies sudah aktif untuk rincian_budgeting_bhp_public
  - _Requirements: 8.1_

- [x] 7.2 Verifikasi auto-population tenant_id dengan triggers
  - Triggers sudah ada untuk auto-set tenant_id
  - Sudah ada migration untuk tenant_id triggers
  - _Requirements: 8.2_

- [x] 7.3 Verifikasi stored procedures accept tenant_id parameter
  - `populate_skenario_tarif_akomodasi` sudah accept user_id
  - RPC calls sudah pass tenant_id/user_id
  - _Requirements: 8.5_

- [x] 7.4 Verifikasi error handling untuk RLS violations
  - Sudah ada error handling untuk RLS errors

  - Display user-friendly messages
  - _Requirements: 8.4_

- [ ] 8. Testing dan Validasi
- [ ]* 8.1 Write property test untuk total budgeting calculation
  - **Property 1: Total budgeting calculation accuracy**
  - **Validates: Requirements 1.1, 1.3, 1.4**

- [ ]* 8.2 Write property test untuk total budgeting reactivity
  - **Property 2: Total budgeting reactivity**
  - **Validates: Requirements 1.2**

- [ ]* 8.3 Write property test untuk currency formatting
  - **Property 3: Currency formatting consistency**
  - **Validates: Requirements 1.5, 4.5**

- [ ]* 8.4 Write property test untuk tariff persistence
  - **Property 8: Tariff calculation persistence**
  - **Validates: Requirements 2.5, 4.4**

- [ ]* 8.5 Write property test untuk akomodasi tariff calculation
  - Reuse property tests dari SkenarioTarif
  - Verify consistency across both modules
  - **Validates: Requirements 4.3, 4.4**

- [ ]* 8.6 Write property test untuk user list filtering
  - **Property 9: User list tenant filtering**
  - **Validates: Requirements 5.2, 6.4**

- [ ]* 8.7 Write property test untuk user tenant assignment
  - **Property 10: New user tenant assignment**
  - **Validates: Requirements 5.4**

- [ ]* 8.8 Write property test untuk tenant context propagation
  - **Property 11: Tenant context propagation**
  - **Validates: Requirements 7.2, 7.5**

- [ ]* 8.9 Write property test untuk RLS tenant isolation
  - **Property 12: RLS tenant isolation**
  - **Validates: Requirements 8.1, 8.3**

- [ ]* 8.10 Write property test untuk automatic tenant_id population
  - **Property 13: Automatic tenant_id population**
  - **Validates: Requirements 8.2**




- [ ]* 8.11 Write property test untuk stored procedure parameters
  - **Property 14: Stored procedure parameter passing**
  - **Validates: Requirements 8.5**

- [x] 9. Final Checkpoint - Integration Testing


  - Ensure all tests pass, ask the user if questions arise.
  - Test semua fitur end-to-end
  - Verifikasi multi-tenant isolation
  - Test dengan berbagai roles (Super Admin, Admin, User)
