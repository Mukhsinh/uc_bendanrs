# Requirements Document - UI Manajemen Tenant dan User Terpadu

## Introduction

Aplikasi Unit Cost RS sudah memiliki sistem multi-tenant yang lengkap dengan isolasi data dan manajemen user. Namun, interface untuk manajemen tenant dan user masih terpisah dan kurang user-friendly. Diperlukan enhancement pada halaman Manajemen Akses untuk menggabungkan fungsi manajemen tenant dan user dalam satu interface yang intuitif dengan sistem tab.

Fitur ini akan memudahkan administrator dalam:
- Menambahkan tenant baru (rumah sakit baru) dengan mudah
- Mengelola user di bawah setiap tenant
- Melihat struktur organisasi tenant dan user dalam satu tampilan
- Memastikan isolasi data antar tenant tetap terjaga

## Glossary

- **Tenant**: Entitas rumah sakit yang menggunakan aplikasi dengan data terisolasi
- **User**: Pengguna aplikasi yang terikat ke satu tenant tertentu
- **Super Admin**: User dengan email mukhsin9@gmail.com yang dapat mengakses semua tenant
- **Tenant Admin**: User dengan role admin yang dapat mengelola user dalam tenant mereka
- **Tab Interface**: Antarmuka dengan tab untuk memisahkan fungsi kelola tenant dan kelola user
- **Manajemen Akses**: Halaman utama untuk mengelola tenant dan user
- **Tenant Isolation**: Pemisahan data antar tenant menggunakan tenant_id
- **User Profile**: Informasi extended user yang tersimpan di tabel user_profiles

## Requirements

### Requirement 1

**User Story:** Sebagai super admin, saya ingin melihat tab "Kelola Tenant" di halaman Manajemen Akses, sehingga saya dapat mengelola semua tenant yang ada dalam sistem.

#### Acceptance Criteria

1. WHEN super admin mengakses halaman Manajemen Akses THEN sistem SHALL menampilkan tab "Kelola Tenant" dan "Kelola User"
2. WHEN super admin mengklik tab "Kelola Tenant" THEN sistem SHALL menampilkan daftar semua tenant dengan informasi nama, slug, status, dan jumlah user
3. WHEN super admin melihat daftar tenant THEN sistem SHALL menampilkan tombol "Tambah Tenant Baru" di bagian atas
4. WHEN tenant admin atau user biasa mengakses halaman THEN sistem SHALL hanya menampilkan tab "Kelola User" tanpa tab "Kelola Tenant"
5. WHEN halaman dimuat pertama kali THEN sistem SHALL menampilkan tab yang sesuai dengan role user (Kelola Tenant untuk super admin, Kelola User untuk lainnya)

### Requirement 2

**User Story:** Sebagai super admin, saya ingin menambahkan tenant baru melalui form yang mudah digunakan, sehingga rumah sakit baru dapat segera menggunakan aplikasi.

#### Acceptance Criteria

1. WHEN super admin mengklik tombol "Tambah Tenant Baru" THEN sistem SHALL menampilkan dialog form dengan field nama rumah sakit, slug, email admin, password admin, dan nama admin
2. WHEN super admin mengisi form dan submit THEN sistem SHALL membuat tenant baru dengan tenant_id unik
3. WHEN tenant baru dibuat THEN sistem SHALL otomatis membuat user admin pertama untuk tenant tersebut
4. WHEN tenant baru dibuat THEN sistem SHALL menginisialisasi tenant_settings dan data master default
5. WHEN proses pembuatan tenant berhasil THEN sistem SHALL menampilkan notifikasi sukses dan merefresh daftar tenant

### Requirement 3

**User Story:** Sebagai super admin, saya ingin melihat detail setiap tenant termasuk daftar user di dalamnya, sehingga saya dapat memahami struktur organisasi setiap rumah sakit.

#### Acceptance Criteria

1. WHEN super admin mengklik baris tenant di tabel THEN sistem SHALL menampilkan detail tenant dalam expandable row atau panel samping
2. WHEN detail tenant ditampilkan THEN sistem SHALL menampilkan informasi lengkap tenant (nama, slug, tanggal dibuat, status, settings)
3. WHEN detail tenant ditampilkan THEN sistem SHALL menampilkan daftar user yang terikat ke tenant tersebut
4. WHEN super admin melihat daftar user dalam tenant THEN sistem SHALL menampilkan email, role, dan status aktif setiap user
5. WHEN super admin menutup detail tenant THEN sistem SHALL kembali ke tampilan daftar tenant

### Requirement 4

**User Story:** Sebagai super admin, saya ingin mengaktifkan atau menonaktifkan tenant, sehingga saya dapat mengontrol akses rumah sakit ke aplikasi.

#### Acceptance Criteria

1. WHEN super admin melihat daftar tenant THEN sistem SHALL menampilkan toggle switch atau button untuk status aktif/nonaktif setiap tenant
2. WHEN super admin mengubah status tenant menjadi nonaktif THEN sistem SHALL mencegah semua user dari tenant tersebut untuk login
3. WHEN super admin mengubah status tenant menjadi aktif THEN sistem SHALL mengizinkan user dari tenant tersebut untuk login kembali
4. WHEN status tenant diubah THEN sistem SHALL mencatat perubahan dalam tenant_audit_log
5. WHEN status tenant diubah THEN sistem SHALL menampilkan notifikasi konfirmasi perubahan

### Requirement 5

**User Story:** Sebagai tenant admin, saya ingin melihat tab "Kelola User" yang menampilkan hanya user dalam tenant saya, sehingga saya dapat mengelola user tanpa melihat user dari tenant lain.

#### Acceptance Criteria

1. WHEN tenant admin mengakses halaman Manajemen Akses THEN sistem SHALL hanya menampilkan tab "Kelola User"
2. WHEN tenant admin melihat daftar user THEN sistem SHALL hanya menampilkan user dengan tenant_id yang sama dengan admin
3. WHEN tenant admin menambah user baru THEN sistem SHALL otomatis mengassign tenant_id admin ke user baru
4. WHEN tenant admin mencoba mengakses data user dari tenant lain THEN sistem SHALL menolak akses melalui RLS policies
5. WHEN tenant admin melihat header halaman THEN sistem SHALL menampilkan nama tenant mereka sebagai konteks

### Requirement 6

**User Story:** Sebagai tenant admin, saya ingin menambahkan user baru ke tenant saya dengan mudah, sehingga anggota tim baru dapat segera menggunakan aplikasi.

#### Acceptance Criteria

1. WHEN tenant admin mengklik tombol "Tambah User" THEN sistem SHALL menampilkan dialog form dengan field email, nama lengkap, password, dan role
2. WHEN tenant admin mengisi form dan submit THEN sistem SHALL membuat user baru dengan tenant_id yang sama dengan admin
3. WHEN user baru dibuat THEN sistem SHALL membuat record di auth.users dengan app_metadata berisi tenant_id
4. WHEN user baru dibuat THEN sistem SHALL membuat record di user_profiles dengan tenant_id yang benar
5. WHEN proses pembuatan user berhasil THEN sistem SHALL menampilkan notifikasi sukses dan merefresh daftar user

### Requirement 7

**User Story:** Sebagai tenant admin, saya ingin mengubah role user dalam tenant saya, sehingga saya dapat menyesuaikan hak akses sesuai tanggung jawab mereka.

#### Acceptance Criteria

1. WHEN tenant admin mengklik tombol "Ubah Role" pada user THEN sistem SHALL menampilkan dialog dengan dropdown role yang tersedia
2. WHEN tenant admin memilih role baru dan submit THEN sistem SHALL memperbarui role user di user_roles table
3. WHEN role user diubah THEN sistem SHALL memvalidasi bahwa user masih dalam tenant yang sama
4. WHEN role user diubah THEN sistem SHALL mencatat perubahan dalam audit log
5. WHEN proses perubahan role berhasil THEN sistem SHALL menampilkan notifikasi sukses dan merefresh daftar user

### Requirement 8

**User Story:** Sebagai tenant admin, saya ingin menonaktifkan user yang sudah tidak bekerja, sehingga mereka tidak dapat login tetapi data historis tetap tersimpan.

#### Acceptance Criteria

1. WHEN tenant admin mengklik tombol "Nonaktifkan" pada user THEN sistem SHALL menampilkan dialog konfirmasi
2. WHEN tenant admin mengkonfirmasi nonaktifkan user THEN sistem SHALL mengubah is_active menjadi false di user_roles
3. WHEN user dinonaktifkan THEN sistem SHALL mencegah user tersebut untuk login
4. WHEN user dinonaktifkan THEN sistem SHALL tetap mempertahankan semua data historis yang terkait dengan user
5. WHEN tenant admin mengklik tombol "Aktifkan" pada user nonaktif THEN sistem SHALL mengubah is_active menjadi true dan user dapat login kembali

### Requirement 9

**User Story:** Sebagai super admin dengan email mukhsin9@gmail.com, saya ingin dapat mengakses dan melihat data dari semua tenant, sehingga saya dapat melakukan troubleshooting dan monitoring sistem.

#### Acceptance Criteria

1. WHEN user dengan email mukhsin9@gmail.com login THEN sistem SHALL mengidentifikasi user sebagai super admin
2. WHEN super admin mengakses data apapun THEN RLS policies SHALL mengizinkan akses ke semua tenant
3. WHEN super admin melakukan operasi pada data tenant tertentu THEN sistem SHALL mencatat akses dalam tenant_audit_log
4. WHEN super admin menggunakan tenant selector THEN sistem SHALL dapat switch context ke tenant manapun
5. WHEN super admin logout THEN sistem SHALL menghapus semua tenant context dari session

### Requirement 10

**User Story:** Sebagai developer, saya ingin interface menggunakan komponen UI yang konsisten dengan aplikasi existing, sehingga pengalaman user tetap seamless.

#### Acceptance Criteria

1. WHEN halaman Manajemen Akses dirender THEN sistem SHALL menggunakan komponen dari shadcn/ui library
2. WHEN tab interface diimplementasi THEN sistem SHALL menggunakan Tabs component dari shadcn/ui
3. WHEN form dialog ditampilkan THEN sistem SHALL menggunakan Dialog component dari shadcn/ui
4. WHEN tabel data ditampilkan THEN sistem SHALL menggunakan Table component dari shadcn/ui
5. WHEN notifikasi ditampilkan THEN sistem SHALL menggunakan toast dari sonner library

### Requirement 11

**User Story:** Sebagai user, saya ingin melihat loading state yang jelas saat data sedang dimuat, sehingga saya tahu sistem sedang memproses request saya.

#### Acceptance Criteria

1. WHEN halaman pertama kali dimuat THEN sistem SHALL menampilkan loading spinner di tengah halaman
2. WHEN form sedang disubmit THEN sistem SHALL menampilkan loading state pada tombol submit dengan spinner
3. WHEN data sedang direfresh THEN sistem SHALL menampilkan loading indicator yang tidak mengganggu tampilan existing
4. WHEN operasi gagal THEN sistem SHALL menampilkan error message yang jelas dan actionable
5. WHEN operasi berhasil THEN sistem SHALL menampilkan success notification dan merefresh data otomatis

### Requirement 12

**User Story:** Sebagai user, saya ingin validasi form yang real-time, sehingga saya dapat memperbaiki kesalahan input sebelum submit.

#### Acceptance Criteria

1. WHEN user mengisi field email THEN sistem SHALL memvalidasi format email secara real-time
2. WHEN user mengisi field password THEN sistem SHALL memvalidasi panjang minimal 8 karakter
3. WHEN user mengisi field slug tenant THEN sistem SHALL memvalidasi format kebab-case dan keunikan
4. WHEN user mencoba submit form dengan field kosong THEN sistem SHALL menampilkan error message pada field yang required
5. WHEN semua validasi passed THEN sistem SHALL mengaktifkan tombol submit

### Requirement 13

**User Story:** Sebagai super admin, saya ingin dapat mencari dan memfilter tenant, sehingga saya dapat dengan cepat menemukan tenant tertentu dalam daftar yang panjang.

#### Acceptance Criteria

1. WHEN super admin melihat tab Kelola Tenant THEN sistem SHALL menampilkan search box di atas tabel
2. WHEN super admin mengetik di search box THEN sistem SHALL memfilter daftar tenant berdasarkan nama atau slug
3. WHEN super admin memfilter berdasarkan status THEN sistem SHALL menampilkan dropdown filter untuk status aktif/nonaktif
4. WHEN filter diterapkan THEN sistem SHALL menampilkan jumlah tenant yang sesuai dengan filter
5. WHEN filter dihapus THEN sistem SHALL menampilkan kembali semua tenant

### Requirement 14

**User Story:** Sebagai tenant admin, saya ingin dapat mencari user dalam tenant saya, sehingga saya dapat dengan cepat menemukan user tertentu.

#### Acceptance Criteria

1. WHEN tenant admin melihat tab Kelola User THEN sistem SHALL menampilkan search box di atas tabel
2. WHEN tenant admin mengetik di search box THEN sistem SHALL memfilter daftar user berdasarkan email atau nama
3. WHEN tenant admin memfilter berdasarkan role THEN sistem SHALL menampilkan dropdown filter untuk role
4. WHEN tenant admin memfilter berdasarkan status THEN sistem SHALL menampilkan dropdown filter untuk status aktif/nonaktif
5. WHEN filter diterapkan THEN sistem SHALL menampilkan jumlah user yang sesuai dengan filter

### Requirement 15

**User Story:** Sebagai developer, saya ingin semua operasi tenant dan user menggunakan service layer yang sudah ada, sehingga tidak ada duplikasi kode dan konsistensi terjaga.

#### Acceptance Criteria

1. WHEN operasi tenant dilakukan THEN sistem SHALL menggunakan functions dari tenantOnboarding.ts service
2. WHEN operasi user dilakukan THEN sistem SHALL menggunakan functions dari userManagement.ts service
3. WHEN audit log perlu dicatat THEN sistem SHALL menggunakan utility dari auditTrail.ts
4. WHEN tenant context perlu diakses THEN sistem SHALL menggunakan useTenant hook dari TenantContext
5. WHEN authentication state perlu diakses THEN sistem SHALL menggunakan useAuth hook dari AuthContext
