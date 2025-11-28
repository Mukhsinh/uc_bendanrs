# Requirements Document - Rincian Role Akses

## Introduction

Aplikasi Unit Cost RS memiliki sistem role-based access control (RBAC) yang kompleks dengan 5 role utama (Super Admin, Admin, Manager, User, Guest) dan 100+ operasi yang dapat dikontrol. Saat ini, tidak ada interface yang menampilkan secara jelas hak akses masing-masing role untuk setiap halaman menu/submenu.

Fitur ini akan menambahkan tab "Rincian Role Akses" pada halaman Manajemen Akses yang menampilkan matriks akses lengkap, memudahkan administrator dalam:
- Memahami hak akses setiap role secara visual
- Membandingkan perbedaan akses antar role
- Mendokumentasikan struktur permission sistem
- Membantu troubleshooting masalah akses user

## Glossary

- **Role**: Peran user dalam sistem (Super Admin, Admin, Manager, User, Guest)
- **Menu**: Halaman utama dalam aplikasi (contoh: Data Biaya, Kalkulasi Biaya)
- **Submenu**: Sub-halaman atau fitur dalam menu (contoh: Tambah Data, Edit Data, Hapus Data)
- **Permission**: Hak akses untuk melakukan operasi tertentu
- **Access Matrix**: Tabel yang menampilkan role vs menu/submenu dengan indikator akses
- **Manajemen Akses**: Halaman utama untuk mengelola tenant, user, dan melihat rincian role
- **RLS Policy**: Row Level Security policy di database yang mengontrol akses data
- **Operation**: Aksi yang dapat dilakukan user (view, create, update, delete, export, import)

## Requirements

### Requirement 1

**User Story:** Sebagai administrator, saya ingin melihat tab "Rincian Role Akses" di halaman Manajemen Akses, sehingga saya dapat memahami struktur permission sistem.

#### Acceptance Criteria

1. WHEN administrator mengakses halaman Manajemen Akses THEN sistem SHALL menampilkan tab "Rincian Role Akses" sebagai tab ketiga
2. WHEN administrator mengklik tab "Rincian Role Akses" THEN sistem SHALL menampilkan matriks akses role
3. WHEN halaman dimuat pertama kali THEN sistem SHALL memuat data role dan menu dari database
4. WHEN data sedang dimuat THEN sistem SHALL menampilkan loading indicator
5. WHEN terjadi error saat memuat data THEN sistem SHALL menampilkan error message yang jelas

### Requirement 2

**User Story:** Sebagai administrator, saya ingin melihat daftar semua role yang ada dalam sistem, sehingga saya dapat memahami hierarki role.

#### Acceptance Criteria

1. WHEN administrator melihat tab Rincian Role Akses THEN sistem SHALL menampilkan daftar role sebagai kolom header tabel
2. WHEN sistem menampilkan role THEN sistem SHALL menampilkan role dalam urutan: Super Admin, Admin, Manager, User, Guest
3. WHEN sistem menampilkan role THEN sistem SHALL menggunakan badge dengan warna berbeda untuk setiap role
4. WHEN sistem menampilkan role THEN sistem SHALL menampilkan deskripsi singkat setiap role
5. WHEN user hover pada role badge THEN sistem SHALL menampilkan tooltip dengan deskripsi lengkap role

### Requirement 3

**User Story:** Sebagai administrator, saya ingin melihat daftar semua menu dan submenu dalam aplikasi, sehingga saya dapat memahami struktur navigasi.

#### Acceptance Criteria

1. WHEN administrator melihat tab Rincian Role Akses THEN sistem SHALL menampilkan daftar menu sebagai baris tabel
2. WHEN sistem menampilkan menu THEN sistem SHALL mengelompokkan submenu di bawah menu utama
3. WHEN sistem menampilkan menu THEN sistem SHALL menggunakan indentasi untuk menunjukkan hierarki
4. WHEN sistem menampilkan menu THEN sistem SHALL menampilkan icon menu jika tersedia
5. WHEN menu memiliki submenu THEN sistem SHALL menampilkan expand/collapse button

### Requirement 4

**User Story:** Sebagai administrator, saya ingin melihat matriks akses yang menunjukkan role mana yang dapat mengakses menu/submenu tertentu, sehingga saya dapat memahami permission dengan cepat.

#### Acceptance Criteria

1. WHEN administrator melihat matriks akses THEN sistem SHALL menampilkan cell untuk setiap kombinasi role dan menu
2. WHEN role memiliki akses ke menu THEN sistem SHALL menampilkan checkmark icon berwarna hijau
3. WHEN role tidak memiliki akses ke menu THEN sistem SHALL menampilkan X icon berwarna merah atau cell kosong
4. WHEN role memiliki akses partial (read-only) THEN sistem SHALL menampilkan eye icon berwarna biru
5. WHEN user hover pada cell akses THEN sistem SHALL menampilkan tooltip dengan detail permission (view, create, update, delete)

### Requirement 5

**User Story:** Sebagai administrator, saya ingin dapat memfilter matriks akses berdasarkan role tertentu, sehingga saya dapat fokus pada role yang sedang saya analisis.

#### Acceptance Criteria

1. WHEN administrator melihat tab Rincian Role Akses THEN sistem SHALL menampilkan dropdown filter role di atas tabel
2. WHEN administrator memilih role dari filter THEN sistem SHALL hanya menampilkan kolom role yang dipilih
3. WHEN administrator memilih "Semua Role" THEN sistem SHALL menampilkan semua kolom role
4. WHEN filter diterapkan THEN sistem SHALL mempertahankan filter saat user navigate ke tab lain dan kembali
5. WHEN filter diterapkan THEN sistem SHALL menampilkan jumlah menu yang accessible untuk role tersebut

### Requirement 6

**User Story:** Sebagai administrator, saya ingin dapat mencari menu/submenu tertentu, sehingga saya dapat dengan cepat menemukan informasi akses untuk menu tersebut.

#### Acceptance Criteria

1. WHEN administrator melihat tab Rincian Role Akses THEN sistem SHALL menampilkan search box di atas tabel
2. WHEN administrator mengetik di search box THEN sistem SHALL memfilter daftar menu berdasarkan nama menu atau submenu
3. WHEN search query cocok dengan submenu THEN sistem SHALL otomatis expand menu parent
4. WHEN search query dihapus THEN sistem SHALL menampilkan kembali semua menu
5. WHEN search tidak menemukan hasil THEN sistem SHALL menampilkan pesan "Tidak ada menu yang cocok"

### Requirement 7

**User Story:** Sebagai administrator, saya ingin dapat expand/collapse menu untuk melihat atau menyembunyikan submenu, sehingga saya dapat fokus pada menu yang relevan.

#### Acceptance Criteria

1. WHEN menu memiliki submenu THEN sistem SHALL menampilkan chevron icon di sebelah nama menu
2. WHEN administrator mengklik chevron icon THEN sistem SHALL toggle expand/collapse submenu
3. WHEN menu di-expand THEN sistem SHALL menampilkan semua submenu dengan indentasi
4. WHEN menu di-collapse THEN sistem SHALL menyembunyikan semua submenu
5. WHEN administrator mengklik "Expand All" button THEN sistem SHALL expand semua menu sekaligus

### Requirement 8

**User Story:** Sebagai administrator, saya ingin melihat detail permission untuk setiap kombinasi role dan menu, sehingga saya dapat memahami operasi spesifik yang diizinkan.

#### Acceptance Criteria

1. WHEN administrator mengklik cell akses dalam matriks THEN sistem SHALL menampilkan dialog detail permission
2. WHEN dialog detail ditampilkan THEN sistem SHALL menampilkan daftar operasi yang diizinkan (view, create, update, delete, export, import)
3. WHEN dialog detail ditampilkan THEN sistem SHALL menampilkan RLS policy yang terkait jika ada
4. WHEN dialog detail ditampilkan THEN sistem SHALL menampilkan kondisi khusus (contoh: "hanya data tenant sendiri")
5. WHEN administrator menutup dialog THEN sistem SHALL kembali ke tampilan matriks

### Requirement 9

**User Story:** Sebagai administrator, saya ingin dapat export matriks akses ke format yang dapat dibagikan, sehingga saya dapat mendokumentasikan permission sistem.

#### Acceptance Criteria

1. WHEN administrator melihat tab Rincian Role Akses THEN sistem SHALL menampilkan button "Export" di header
2. WHEN administrator mengklik button Export THEN sistem SHALL menampilkan pilihan format (PDF, Excel, CSV)
3. WHEN administrator memilih format PDF THEN sistem SHALL generate PDF dengan matriks akses lengkap
4. WHEN administrator memilih format Excel THEN sistem SHALL generate Excel dengan sheet per role
5. WHEN export berhasil THEN sistem SHALL mendownload file dengan nama "role-access-matrix-[tanggal].pdf/xlsx/csv"

### Requirement 10

**User Story:** Sebagai developer, saya ingin data role dan menu diambil dari sumber yang konsisten, sehingga matriks akses selalu up-to-date dengan konfigurasi sistem.

#### Acceptance Criteria

1. WHEN sistem memuat data role THEN sistem SHALL query tabel roles di database
2. WHEN sistem memuat data menu THEN sistem SHALL query tabel menu_items atau menggunakan konfigurasi routing
3. WHEN sistem memuat data permission THEN sistem SHALL query tabel permissions atau role_permissions
4. WHEN data berubah di database THEN sistem SHALL merefresh matriks akses otomatis atau dengan manual refresh
5. WHEN terjadi error query database THEN sistem SHALL menampilkan error message dan fallback ke data cached jika ada

### Requirement 11

**User Story:** Sebagai administrator, saya ingin melihat statistik ringkasan akses per role, sehingga saya dapat dengan cepat membandingkan cakupan akses antar role.

#### Acceptance Criteria

1. WHEN administrator melihat tab Rincian Role Akses THEN sistem SHALL menampilkan card statistik di atas matriks
2. WHEN card statistik ditampilkan THEN sistem SHALL menampilkan jumlah total menu yang accessible per role
3. WHEN card statistik ditampilkan THEN sistem SHALL menampilkan persentase akses per role (accessible menu / total menu)
4. WHEN card statistik ditampilkan THEN sistem SHALL menggunakan progress bar atau chart untuk visualisasi
5. WHEN user hover pada statistik THEN sistem SHALL menampilkan breakdown detail (berapa menu full access, read-only, no access)

### Requirement 12

**User Story:** Sebagai administrator, saya ingin interface menggunakan komponen UI yang konsisten dengan aplikasi existing, sehingga pengalaman user tetap seamless.

#### Acceptance Criteria

1. WHEN tab Rincian Role Akses dirender THEN sistem SHALL menggunakan komponen dari shadcn/ui library
2. WHEN tabel matriks ditampilkan THEN sistem SHALL menggunakan Table component dari shadcn/ui
3. WHEN dialog detail ditampilkan THEN sistem SHALL menggunakan Dialog component dari shadcn/ui
4. WHEN badge role ditampilkan THEN sistem SHALL menggunakan Badge component dari shadcn/ui
5. WHEN button export ditampilkan THEN sistem SHALL menggunakan Button component dari shadcn/ui

### Requirement 13

**User Story:** Sebagai user, saya ingin melihat loading state yang jelas saat data sedang dimuat, sehingga saya tahu sistem sedang memproses request saya.

#### Acceptance Criteria

1. WHEN tab pertama kali dibuka THEN sistem SHALL menampilkan skeleton loader untuk tabel
2. WHEN data sedang direfresh THEN sistem SHALL menampilkan loading indicator yang tidak mengganggu tampilan existing
3. WHEN export sedang diproses THEN sistem SHALL menampilkan loading state pada button export dengan spinner
4. WHEN operasi gagal THEN sistem SHALL menampilkan error message yang jelas dan actionable
5. WHEN operasi berhasil THEN sistem SHALL menampilkan success notification jika applicable

### Requirement 14

**User Story:** Sebagai administrator, saya ingin dapat melihat changelog atau history perubahan permission, sehingga saya dapat tracking perubahan akses dari waktu ke waktu.

#### Acceptance Criteria

1. WHEN administrator mengklik button "History" di header THEN sistem SHALL menampilkan dialog changelog
2. WHEN dialog changelog ditampilkan THEN sistem SHALL menampilkan daftar perubahan permission dengan tanggal dan user yang melakukan perubahan
3. WHEN perubahan permission ditampilkan THEN sistem SHALL menampilkan before/after comparison
4. WHEN tidak ada history THEN sistem SHALL menampilkan pesan "Belum ada perubahan permission"
5. WHEN administrator menutup dialog THEN sistem SHALL kembali ke tampilan matriks

### Requirement 15

**User Story:** Sebagai administrator dengan role tertentu, saya ingin hanya dapat melihat informasi role yang relevan dengan level akses saya, sehingga tidak ada information leakage.

#### Acceptance Criteria

1. WHEN user dengan role Guest mengakses tab THEN sistem SHALL hanya menampilkan informasi role Guest
2. WHEN user dengan role User mengakses tab THEN sistem SHALL menampilkan informasi role User dan Guest
3. WHEN user dengan role Manager mengakses tab THEN sistem SHALL menampilkan informasi role Manager, User, dan Guest
4. WHEN user dengan role Admin mengakses tab THEN sistem SHALL menampilkan informasi semua role kecuali Super Admin
5. WHEN user dengan role Super Admin mengakses tab THEN sistem SHALL menampilkan informasi semua role tanpa batasan
