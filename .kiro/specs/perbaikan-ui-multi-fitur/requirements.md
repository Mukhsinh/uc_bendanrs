# Requirements Document

## Introduction

Dokumen ini menjelaskan kebutuhan untuk perbaikan beberapa fitur UI dan fungsionalitas pada aplikasi Unit Cost Rumah Sakit, meliputi sinkronisasi kartu budgeting BHP, penambahan kolom manual input pada skenario tarif, perbaikan fungsi update data pada skenario tarif akomodasi, dan reorganisasi manajemen akses dengan pemindahan tenant selector.

## Glossary

- **Budgeting BHP**: Modul untuk mengelola budgeting Bahan Habis Pakai (BHP) dengan tampilan kartu statistik dan rincian
- **Skenario Tarif**: Modul untuk mengelola tarif tindakan medis dengan input manual jasa sarana dan jasa pelayanan
- **Skenario Tarif Akomodasi**: Modul untuk mengelola tarif akomodasi per kelas dengan perhitungan profit otomatis
- **Manajemen Akses**: Modul untuk mengelola user, tenant, dan role access
- **Tenant**: Instansi kesehatan yang menggunakan sistem (multi-tenant)
- **Kartu Total Budgeting**: Card/widget yang menampilkan total nilai budgeting BHP
- **Jasa Sarana**: Komponen tarif yang mencakup biaya operasional fasilitas
- **Jasa Pelayanan Medis**: Komponen tarif untuk layanan medis
- **Jasa Pelayanan Non Medis**: Komponen tarif untuk layanan non medis
- **RLS (Row Level Security)**: Mekanisme keamanan database untuk isolasi data per tenant

## Requirements

### Requirement 1

**User Story:** Sebagai pengguna modul Budgeting BHP, saya ingin melihat nilai total budgeting yang akurat dan tersinkronisasi, sehingga saya dapat memantau total anggaran BHP dengan benar.

#### Acceptance Criteria

1. WHEN pengguna membuka halaman Budgeting BHP Rincian THEN sistem SHALL menampilkan kartu "Total Budgeting" dengan nilai yang sesuai dengan total dari semua item rincian
2. WHEN data rincian BHP berubah (ditambah, diubah, atau dihapus) THEN sistem SHALL memperbarui nilai kartu "Total Budgeting" secara otomatis
3. WHEN pengguna memfilter data berdasarkan unit kerja THEN sistem SHALL menampilkan total budgeting yang sesuai dengan filter yang dipilih
4. WHEN sistem menghitung total budgeting THEN sistem SHALL menjumlahkan field `total_rupiah` dari semua record yang sesuai dengan filter
5. WHEN nilai total budgeting ditampilkan THEN sistem SHALL memformat nilai dalam format mata uang Rupiah (IDR) dengan pemisah ribuan

### Requirement 2

**User Story:** Sebagai pengguna modul Skenario Tarif Visit, saya ingin dapat mengisi jasa sarana, jasa pelayanan medis, dan jasa pelayanan non medis secara manual, sehingga saya dapat menentukan komponen tarif dengan fleksibel.

#### Acceptance Criteria

1. WHEN pengguna melihat tabel Skenario Tarif Visit THEN sistem SHALL menampilkan kolom "Jasa Sarana", "Jasa Pelayanan Medis", dan "Jasa Pelayanan Non Medis" yang dapat diedit
2. WHEN pengguna mengklik tombol edit pada baris data THEN sistem SHALL mengaktifkan mode edit untuk ketiga kolom tersebut dengan input field numerik
3. WHEN pengguna mengubah nilai jasa sarana, jasa pelayanan medis, atau jasa pelayanan non medis THEN sistem SHALL menghitung ulang jasa pelayanan total sebagai penjumlahan jasa pelayanan medis dan non medis
4. WHEN pengguna mengubah nilai jasa sarana, jasa pelayanan medis, atau jasa pelayanan non medis THEN sistem SHALL menghitung ulang tarif sebagai penjumlahan jasa sarana dan jasa pelayanan total
5. WHEN pengguna menyimpan perubahan THEN sistem SHALL menyimpan nilai jasa sarana, jasa pelayanan medis, jasa pelayanan non medis, jasa pelayanan total, tarif, prosentase jasa pelayanan, dan prosentase profit ke database
6. WHEN sistem menghitung prosentase jasa pelayanan THEN sistem SHALL menggunakan rumus: (jasa_pelayanan / tarif) * 100
7. WHEN sistem menghitung prosentase profit THEN sistem SHALL menggunakan rumus: ((jasa_sarana - unit_cost) / unit_cost) * 100

### Requirement 3

**User Story:** Sebagai pengguna modul Skenario Tarif Akomodasi, saya ingin dapat menggunakan fungsi "Update Data" dengan sukses, sehingga saya dapat memperbarui data tarif akomodasi dari kalkulasi terbaru.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol "Update Data" pada halaman Skenario Tarif Akomodasi THEN sistem SHALL memanggil fungsi database `populate_skenario_tarif_akomodasi` dengan parameter tahun yang dipilih
2. WHEN fungsi populate berhasil dijalankan THEN sistem SHALL menampilkan notifikasi sukses kepada pengguna
3. WHEN fungsi populate berhasil dijalankan THEN sistem SHALL memperbarui tampilan data tanpa perlu refresh manual
4. WHEN fungsi populate gagal dijalankan THEN sistem SHALL menampilkan pesan error yang informatif kepada pengguna
5. WHEN sistem memanggil fungsi populate THEN sistem SHALL memastikan user_id dan tenant_id yang sesuai dikirimkan sebagai parameter

### Requirement 4

**User Story:** Sebagai pengguna modul Skenario Tarif Akomodasi, saya ingin dapat mengedit tarif per kelas dan melihat kolom tambahan untuk komponen tarif, sehingga saya dapat mengelola tarif akomodasi dengan lebih detail.

#### Acceptance Criteria

1. WHEN pengguna melihat tabel Skenario Tarif Akomodasi THEN sistem SHALL menampilkan kolom "Jasa Sarana", "Jasa Pelayanan Medis", "Jasa Pelayanan Non Medis", "Jasa Pelayanan", "% Jasa Pelayanan", dan "% Profit"
2. WHEN pengguna mengklik tombol edit pada baris kelas THEN sistem SHALL mengaktifkan mode edit untuk kolom jasa sarana, jasa pelayanan medis, dan jasa pelayanan non medis
3. WHEN pengguna mengubah nilai komponen tarif THEN sistem SHALL menghitung ulang tarif menggunakan rumus yang sama dengan Skenario Tarif Visit
4. WHEN pengguna menyimpan perubahan THEN sistem SHALL memperbarui data di database dan menampilkan nilai yang telah dikalkulasi
5. WHEN sistem menampilkan data THEN sistem SHALL memformat semua nilai mata uang dalam format Rupiah (IDR)

### Requirement 5

**User Story:** Sebagai pengguna dengan role selain Super Admin, saya ingin melihat daftar user pada tab Kelola User di halaman Manajemen Akses, sehingga saya dapat mengelola user tanpa harus mengakses tab Kelola Tenant.

#### Acceptance Criteria

1. WHEN pengguna membuka halaman Manajemen Akses THEN sistem SHALL menampilkan tab "Kelola User" sebagai tab default untuk user non-Super Admin
2. WHEN pengguna membuka tab "Kelola User" THEN sistem SHALL menampilkan daftar user yang sesuai dengan tenant aktif pengguna
3. WHEN pengguna mengklik tombol "Tambah User Baru" pada tab "Kelola User" THEN sistem SHALL membuka dialog untuk menambah user baru
4. WHEN pengguna mengisi form tambah user dan menyimpan THEN sistem SHALL membuat user baru dengan tenant_id yang sesuai dengan tenant aktif
5. WHEN terjadi error saat menambah user THEN sistem SHALL menampilkan pesan error yang jelas dan informatif

### Requirement 6

**User Story:** Sebagai Super Admin, saya ingin dapat memilih tenant aktif melalui selector di halaman Manajemen Akses, sehingga saya dapat mengelola data untuk tenant yang berbeda tanpa harus menggunakan header.

#### Acceptance Criteria

1. WHEN Super Admin membuka halaman Manajemen Akses THEN sistem SHALL menampilkan dropdown "Pilih Tenant" di bagian atas halaman
2. WHEN Super Admin memilih tenant dari dropdown THEN sistem SHALL mengubah tenant aktif dan memperbarui semua data yang ditampilkan sesuai tenant yang dipilih
3. WHEN Super Admin membuka tab "Kelola Tenant" THEN sistem SHALL menampilkan daftar semua tenant yang ada di sistem
4. WHEN Super Admin membuka tab "Kelola User" THEN sistem SHALL menampilkan daftar user yang sesuai dengan tenant yang dipilih di dropdown
5. WHEN tenant aktif berubah THEN sistem SHALL memperbarui data di semua tab (Kelola User dan Rincian Role Akses) sesuai tenant yang dipilih

### Requirement 7

**User Story:** Sebagai pengguna sistem, saya ingin tenant selector tidak ditampilkan di header aplikasi, sehingga pemilihan tenant hanya dilakukan di halaman Manajemen Akses yang sesuai.

#### Acceptance Criteria

1. WHEN pengguna membuka aplikasi THEN sistem SHALL NOT menampilkan tenant selector di header/navigation bar
2. WHEN pengguna membuka halaman selain Manajemen Akses THEN sistem SHALL menggunakan tenant aktif yang tersimpan di context
3. WHEN Super Admin mengubah tenant di halaman Manajemen Akses THEN sistem SHALL menyimpan pilihan tenant ke context untuk digunakan di halaman lain
4. WHEN pengguna non-Super Admin mengakses aplikasi THEN sistem SHALL menggunakan tenant yang terkait dengan user tersebut secara otomatis
5. WHEN tenant context berubah THEN sistem SHALL memastikan semua query database menggunakan tenant_id yang sesuai melalui RLS

### Requirement 8

**User Story:** Sebagai developer, saya ingin memastikan semua perubahan data menggunakan mekanisme RLS yang benar, sehingga data antar tenant tetap terisolasi dengan aman.

#### Acceptance Criteria

1. WHEN sistem melakukan query ke database THEN sistem SHALL memastikan RLS policy aktif untuk tabel yang diakses
2. WHEN sistem menyimpan data baru THEN sistem SHALL memastikan tenant_id diisi secara otomatis melalui trigger atau default value
3. WHEN sistem memperbarui data THEN sistem SHALL memastikan hanya data dengan tenant_id yang sesuai yang dapat diubah
4. WHEN terjadi error terkait tenant_id atau RLS THEN sistem SHALL menampilkan pesan error yang informatif kepada pengguna
5. WHEN sistem memanggil stored procedure atau function THEN sistem SHALL memastikan parameter tenant_id atau user_id dikirimkan dengan benar
