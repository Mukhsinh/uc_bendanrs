# Implementation Plan: Perbaikan Aplikasi Komprehensif PINTAR UC

## Overview

Implementasi perbaikan komprehensif mencakup: fix akses Super Admin, hapus ReportHeader, dashboard eksekutif baru, perbaikan overflow, fix import data, dan refactoring. Semua rumus kalkulasi dan tampilan yang ada tidak diubah.

## Tasks

- [x] 1. Fix RoleProtectedRoute untuk Super Admin
  - [x] 1.1 Perbaiki logika `hasAccess` di `src/components/RoleProtectedRoute.tsx`
    - Ubah baris `setHasAccess(allowedRoles.includes('Super Admin'))` menjadi `setHasAccess(true)` pada blok `if (isResolvedSuperAdmin)`
    - Pastikan Super Admin yang terverifikasi selalu mendapat akses tanpa pengecekan `allowedRoles.includes()` tambahan
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.2 Tulis property test untuk akses Super Admin
    - **Property 1: Super Admin Selalu Mendapat Akses**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Buat file `src/test/roleAccess.test.ts` dengan fungsi `computeAccess()` yang ditest menggunakan fast-check
    - _Requirements: 1.1, 1.2_

- [x] 2. Hapus ReportHeader dari Layout dan perbaiki overflow
  - [x] 2.1 Hapus `ReportHeader` dari render di `src/components/Layout.tsx`
    - Hapus blok `{reportMeta && (<ReportHeader title={...} subtitle={...} />)}` dari dalam `<main>`
    - Hapus variabel `reportMeta` dan `useMemo` yang menghasilkannya (tidak dipakai lagi)
    - Hapus import `ReportHeader` dan `ReportToolbar` dari Layout.tsx jika tidak dipakai
    - Ubah `gap-6` menjadi `gap-4` dan tambahkan `overflow-hidden` pada `<main>`
    - _Requirements: 2.1, 4.1, 4.2_

  - [x] 2.2 Checkpoint: Verifikasi header bersih
    - Pastikan tidak ada banner instansi di atas konten halaman
    - Pastikan filter tahun di header navigasi masih berfungsi
    - _Requirements: 2.1, 2.2_

- [x] 3. Tambah route `/dashboard` dan redirect dari `/`
  - [x] 3.1 Update routing di `src/App.tsx`
    - Tambah import: `const Dashboard = lazy(() => import("./pages/Dashboard"))`
    - Tambah route: `<Route path="/dashboard" element={<SessionGuard><Dashboard /></SessionGuard>} />`
    - Ubah route index dari `<Index />` menjadi `<Navigate to="/dashboard" replace />`
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Update href Dashboard di `src/components/SidebarNav.tsx`
    - Ubah `href: "/"` pada item Dashboard menjadi `href: "/dashboard"`
    - _Requirements: 3.2_

  - [x] 3.3 Update redirect di `src/pages/Login.tsx`
    - Ubah `navigate('/')` setelah login berhasil menjadi `navigate('/dashboard')`
    - Ubah `useEffect` redirect dari `navigate('/')` ke `navigate('/dashboard')` saat session sudah ada
    - _Requirements: 3.2, 6.3_

- [x] 4. Buat komponen Dashboard eksekutif
  - [x] 4.1 Buat file `src/pages/Dashboard.tsx` — struktur dasar dan kartu skor
    - Import Recharts, Shadcn/ui Card, useYear, useTenant, supabase
    - Buat 4 kartu skor: Total Pendapatan, Total Biaya, Cost Recovery %, Jumlah Unit Kerja
    - Query `data_pendapatan` dan `data_biaya` dengan filter `tahun = selectedYear` dan `tenant_id`
    - Hitung `costRecovery = (totalPendapatan / totalBiaya) * 100`
    - Tampilkan angka dalam format Rupiah menggunakan `Intl.NumberFormat`
    - _Requirements: 3.3, 3.6, 3.7_

  - [x] 4.2 Tambahkan grafik tren ke Dashboard
    - Tambah `LineChart` dari Recharts: sumbu X = unit kerja atau kategori, sumbu Y = nilai (Rp)
    - Dua garis: Pendapatan (warna teal) dan Biaya (warna orange/merah)
    - Tambahkan `Tooltip` dan `Legend` pada chart
    - _Requirements: 3.4_

  - [x] 4.3 Tambahkan grafik distribusi biaya Top 10 unit kerja
    - Tambah `BarChart` dari Recharts: sumbu X = nama unit kerja, sumbu Y = total biaya
    - Ambil 10 unit kerja dengan biaya terbesar
    - Tambahkan filter unit kerja opsional menggunakan Select
    - _Requirements: 3.5, 3.6_

  - [ ]* 4.4 Tulis property test untuk kalkulasi dashboard
    - **Property 4: Dashboard Metrics Konsisten dengan Data**
    - **Validates: Requirements 3.3, 3.6**
    - Buat file `src/test/dashboard.test.ts` dengan fungsi `calculateCostRecovery(pendapatan, biaya)` yang ditest menggunakan fast-check
    - _Requirements: 3.3_

- [x] 5. Checkpoint — Verifikasi dashboard berfungsi
  - Pastikan `/dashboard` dapat diakses dan menampilkan data
  - Pastikan redirect `/` → `/dashboard` berfungsi
  - Pastikan filter tahun di header tersinkron dengan data dashboard
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Fix import data — tambahkan tenant_id dan tahun
  - [x] 6.1 Perbaiki `src/components/BiayaFormTable.tsx` — integrasikan `useTenant()` dan `useYear()`
    - Hapus `const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())` (local state)
    - Tambah import dan gunakan `const { selectedYear } = useYear()` dari `@/contexts/YearContext`
    - Tambah import dan gunakan `const { tenant } = useTenant()` dari `@/contexts/TenantContext`
    - Pada fungsi `handleImportData`, sertakan `tenant_id: tenant?.id` dan `tahun: selectedYear` pada setiap baris di `importedData.push({...})`
    - Pastikan filter tabel juga menggunakan `selectedYear` dari context (bukan local state)
    - _Requirements: 5.1, 5.4, 5.6_

  - [x] 6.2 Perbaiki `src/components/PendapatanFormTable.tsx` — integrasikan `useTenant()` dan `useYear()`
    - Hapus local year state jika ada, gunakan `const { selectedYear } = useYear()` dari `@/contexts/YearContext`
    - Tambah import dan gunakan `const { tenant } = useTenant()` dari `@/contexts/TenantContext`
    - Pada fungsi `handleImportData`, sertakan `tenant_id: tenant?.id` dan `tahun: selectedYear` pada setiap baris di `importedData` sebelum insert ke database
    - Pastikan filter tampilan tabel menggunakan `selectedYear` dari context
    - _Requirements: 5.1, 5.4, 5.5_

  - [ ]* 6.3 Tulis property test untuk enrichment baris import
    - **Property 5: Import Data Selalu Menyertakan tenant_id dan tahun**
    - **Validates: Requirements 5.1, 5.4**
    - Buat file `src/test/importData.test.ts` dengan fungsi murni `enrichImportRows(rows, tenantId, tahun)` yang ditest dengan fast-check (100 iterasi)
    - _Requirements: 5.4_

  - [ ]* 6.4 Tulis property test untuk validasi file import invalid
    - **Property 6: Import File Invalid Menghasilkan Error**
    - **Validates: Requirements 5.3**
    - Test fungsi `validateImportFile(file)` dengan berbagai input tidak valid menggunakan fast-check
    - _Requirements: 5.3_

- [x] 7. Checkpoint — Verifikasi import data berfungsi
  - Pastikan import di Data Biaya dapat menyimpan ke database dengan `tenant_id` dan `tahun` yang benar
  - Pastikan filter tabel Data Biaya tersinkron dengan filter tahun global di header
  - _Requirements: 5.1, 5.4_

- [x] 8. Refactoring halaman Login dan integrasi YearContext
  - [x] 8.1 Periksa dan perbaiki `src/pages/Login.tsx`
    - Pastikan `navigate('/dashboard')` digunakan setelah login berhasil (sudah diperbaiki di task 3.3)
    - Pastikan pesan error ditampilkan dengan jelas saat login gagal
    - _Requirements: 6.3_

  - [ ]* 8.2 Tulis property test untuk validasi login
    - **Property 7: Login Error pada Kredensial Salah**
    - **Validates: Requirements 6.3**
    - Buat file `src/test/loginValidation.test.ts` dengan fungsi `validateLoginInput(email, password)` yang ditest menggunakan fast-check (100 iterasi, input string tanpa karakter `@` harus dianggap invalid)
    - _Requirements: 6.3_

- [x] 9. Checkpoint Final — Verifikasi semua perbaikan
  - Pastikan `/pengaturan-umum` dapat diakses oleh Super Admin tanpa error
  - Pastikan tidak ada banner instansi di atas konten halaman
  - Pastikan `/dashboard` menampilkan data dengan benar
  - Pastikan import Data Biaya menyertakan `tenant_id` dan `tahun`
  - Pastikan semua test lulus
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.3_

## Notes

- Tasks bertanda `*` adalah optional (test) — dapat dilewati untuk MVP lebih cepat
- Jangan ubah rumus kalkulasi atau tampilan visual halaman yang sudah ada
- Semua perubahan harus backward-compatible (tidak menghapus fitur yang ada)
- Fast-check sudah terinstall di project (`package.json` devDependencies)
- Vitest sudah dikonfigurasi di `vitest.config.ts`
- `BiayaFormTable.tsx` saat ini masih menggunakan local state `selectedYear` — belum terintegrasi dengan `YearContext`
- `PendapatanFormTable.tsx` juga belum menggunakan `useYear()` — perlu diverifikasi dan diperbaiki
