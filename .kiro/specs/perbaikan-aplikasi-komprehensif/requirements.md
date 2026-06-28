# Requirements Document

## Pendahuluan

Dokumen ini mencakup kebutuhan perbaikan komprehensif untuk aplikasi PINTAR UC (Aplikasi Unit Cost Rumah Sakit). Perbaikan meliputi: fix akses halaman Pengaturan Umum untuk Super Admin, penghapusan ReportHeader/TenantBranding dari konten halaman, dashboard eksekutif baru di `/dashboard`, perbaikan overflow layout, validasi import data, dan refactoring kode.

## Glossary

- **System**: Aplikasi PINTAR UC secara keseluruhan
- **YearContext**: Context React yang menyimpan tahun yang dipilih secara global (`selectedYear`, `setSelectedYear`, `availableYears`)
- **RoleProtectedRoute**: Komponen guard yang memproteksi halaman berdasarkan role user
- **Super Admin**: Role tertinggi dengan akses penuh ke semua fitur
- **Admin**: Role kedua dengan akses ke pengaturan umum
- **ReportHeader**: Komponen banner instansi (nama + tanggal) yang saat ini ditampilkan di atas konten setiap halaman melalui Layout.tsx — harus dihapus
- **TenantBranding**: Komponen nama/logo tenant di header navigasi — tetap dipertahankan di header
- **Filter Tahun**: Komponen pemilih tahun untuk memfilter data; sudah ada di header navigasi (YearContext)
- **Dashboard**: Halaman baru eksekutif dengan kartu skor dan grafik untuk pengambilan keputusan
- **Import Data**: Fitur impor data massal dari file CSV/Excel ke database dengan `tenant_id` dan `tahun`

---

## Requirements

### Requirement 1: Perbaikan Akses Halaman Pengaturan Umum

**User Story:** Sebagai Super Admin, saya ingin dapat mengakses halaman Pengaturan Umum, sehingga saya dapat mengelola konfigurasi aplikasi tanpa hambatan.

#### Acceptance Criteria

1. WHEN seorang user dengan role Super Admin mengakses `/pengaturan-umum`, THE System SHALL menampilkan konten halaman tanpa pesan "Hanya Super Admin dan Admin yang dapat mengakses halaman Pengaturan Umum."
2. WHEN `RoleProtectedRoute` memeriksa akses, THE System SHALL memprioritaskan hasil `isSuperAdmin()` — jika `true`, akses langsung diberikan tanpa pengecekan `allowedRoles.includes()` lebih lanjut.
3. IF `isSuperAdmin()` mengembalikan `true` dan `allowedRoles` mengandung `"Super Admin"`, THEN THE `RoleProtectedRoute` SHALL menetapkan `hasAccess = true`.
4. WHEN terjadi error saat query `user_roles` di database, THE System SHALL fallback ke pengecekan role dari `app_metadata` JWT token.
5. THE `RoleProtectedRoute` SHALL menampilkan spinner loading selama proses verifikasi role berlangsung.

---

### Requirement 2: Filter Tahun dan Penghapusan Banner Duplikat

**User Story:** Sebagai pengguna, saya ingin memilih tahun data dari header saja tanpa ada banner/header duplikat, sehingga tampilan halaman bersih dan tidak overflow.

#### Acceptance Criteria

1. THE System SHALL menghapus `ReportHeader` dari render di `Layout.tsx` sehingga banner instansi (nama "RSUD BENDAN", tanggal, dll.) tidak lagi muncul di atas konten setiap halaman.
2. THE Filter Tahun di header navigasi (sudah ada) SHALL tetap berfungsi dan tersinkron via `YearContext`.
3. THE System SHALL memastikan seluruh query Supabase yang bergantung pada tahun menggunakan `selectedYear` dari `useYear()` hook.
4. WHEN user mengubah tahun di header navigasi, THE System SHALL memperbarui data di halaman yang sedang aktif melalui React Query `queryKey` yang menyertakan `selectedYear`.
5. WHEN halaman pertama kali dimuat, THE System SHALL menggunakan `selectedYear` yang tersimpan di localStorage sebagai nilai default filter.

---

### Requirement 3: Dashboard Eksekutif di `/dashboard`

**User Story:** Sebagai Direktur/Manajemen, saya ingin melihat ringkasan data penting di dashboard, sehingga saya dapat mengambil keputusan berbasis data yang akurat.

#### Acceptance Criteria

1. THE System SHALL menambahkan route `/dashboard` di `App.tsx` yang mengarah ke komponen `Dashboard.tsx` baru.
2. WHEN user mengakses URL `/` (root/Index), THE System SHALL me-redirect ke `/dashboard`.
3. THE Dashboard SHALL menampilkan kartu skor untuk: total pendapatan, total biaya, cost recovery ratio, dan jumlah unit kerja.
4. THE Dashboard SHALL menampilkan grafik tren pendapatan vs biaya menggunakan Recharts.
5. THE Dashboard SHALL menampilkan grafik distribusi biaya per unit kerja (top 10) menggunakan Recharts.
6. THE Dashboard SHALL memiliki filter tahun (dari `YearContext`) yang tersinkron dengan header.
7. THE Dashboard SHALL memiliki tampilan profesional, stylish, dan responsif menggunakan Tailwind CSS dan Shadcn/ui.
8. THE Dashboard SHALL menampilkan data dari tabel `data_pendapatan` dan `data_biaya` di Supabase sesuai `selectedYear` dan `tenant_id`.

---

### Requirement 4: Perbaikan Overflow Layout

**User Story:** Sebagai pengguna, saya ingin tampilan halaman tidak overflow atau terpotong, sehingga saya dapat melihat seluruh konten dengan nyaman.

#### Acceptance Criteria

1. THE System SHALL menghapus render `ReportHeader` (banner nama instansi dan tanggal) dari `Layout.tsx` — ini adalah penyebab utama overflow dan ruang terbuang di atas konten.
2. THE Layout `main` container SHALL menggunakan `overflow-hidden` atau `min-h-0` yang tepat agar halaman tidak overflow secara vertikal.
3. THE System SHALL memastikan tabel data yang besar dibungkus `overflow-x-auto` sehingga dapat di-scroll horizontal tanpa memaksa layout melar.
4. THE grid layout `md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]` di Layout SHALL tetap dipertahankan dan tidak berubah.
5. WHEN halaman diakses di resolusi 1366×768, THE System SHALL menampilkan seluruh konten tanpa horizontal overflow.

---

### Requirement 5: Perbaikan Fungsi Import Data

**User Story:** Sebagai operator, saya ingin fitur import data bekerja dengan benar, sehingga saya dapat memasukkan data massal dengan mudah dan tersimpan di aplikasi.

#### Acceptance Criteria

1. WHEN user mengunggah file CSV/Excel yang valid melalui fitur import, THE System SHALL memproses file dan menyimpan data ke database Supabase.
2. WHEN file import berhasil diproses, THE System SHALL menampilkan notifikasi sukses (toast) dengan jumlah baris yang berhasil diimpor.
3. IF file import memiliki format yang tidak sesuai, THEN THE System SHALL menampilkan pesan error yang deskriptif kepada user.
4. WHEN import data dilakukan, THE System SHALL menyertakan `tenant_id` dan `tahun` (`selectedYear`) yang aktif secara otomatis pada setiap baris data yang diimpor.
5. THE System SHALL memverifikasi bahwa fungsi import pada halaman Data Biaya, Data Pendapatan, Data Kegiatan RS, dan Data Unit Kerja dapat menyimpan data ke database dengan benar.
6. WHEN import selesai berhasil, THE System SHALL memanggil `queryClient.invalidateQueries()` untuk me-refresh tampilan tabel data secara otomatis.

---

### Requirement 6: Refactoring Halaman Login dan Halaman Lainnya

**User Story:** Sebagai developer, saya ingin kode aplikasi terstruktur dengan baik, sehingga mudah dimaintain dan tidak ada masalah performa.

#### Acceptance Criteria

1. THE System SHALL mempertahankan semua rumus kalkulasi yang ada tanpa perubahan apapun.
2. THE System SHALL mempertahankan semua tampilan UI yang ada tanpa perubahan visual.
3. THE Login page SHALL memastikan form validasi berfungsi dengan baik dan menampilkan pesan error yang jelas saat kredensial salah.
4. THE System SHALL memastikan semua komponen halaman yang membutuhkan filter tahun sudah menggunakan `useYear()` dari `YearContext` dan menyertakan `selectedYear` di `queryKey` React Query.
5. THE System SHALL memastikan tidak ada console error yang muncul akibat `useYear()` dipanggil di luar `YearProvider`.
6. THE System SHALL memastikan lazy loading (`React.lazy`) diterapkan untuk semua komponen halaman di `App.tsx`.
