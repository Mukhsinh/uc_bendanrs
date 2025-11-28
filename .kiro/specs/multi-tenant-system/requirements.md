# Requirements Document - Sistem Multi-Tenant untuk Aplikasi Unit Cost RS

## Introduction

Aplikasi Unit Cost RS saat ini menggunakan sistem single-tenant di mana setiap user memiliki data terpisah. Untuk memungkinkan banyak rumah sakit menggunakan aplikasi yang sama tanpa saling mengganggu data, diperlukan transformasi menjadi sistem multi-tenant. Sistem ini akan memungkinkan:

- Banyak rumah sakit (tenant) menggunakan satu instance aplikasi
- Setiap rumah sakit memiliki data yang terisolasi sepenuhnya
- User dalam satu rumah sakit dapat berbagi dan berkolaborasi pada data yang sama
- Administrasi tenant yang mudah dan aman
- Skalabilitas untuk menambah rumah sakit baru tanpa perubahan infrastruktur

## Glossary

- **Tenant**: Entitas rumah sakit yang menggunakan aplikasi. Setiap tenant memiliki data yang terisolasi dari tenant lain.
- **Hospital**: Sinonim untuk Tenant, merujuk pada rumah sakit sebagai organisasi.
- **User**: Pengguna aplikasi yang terikat ke satu tenant/rumah sakit tertentu.
- **Tenant Admin**: User dengan role khusus yang dapat mengelola user dan konfigurasi dalam tenant mereka.
- **Super Admin**: User dengan akses ke semua tenant untuk keperluan administrasi sistem.
- **Tenant ID**: Identifier unik untuk setiap tenant (UUID).
- **Data Isolation**: Pemisahan data antar tenant menggunakan Row Level Security (RLS).
- **Tenant Context**: Konteks tenant yang aktif untuk user yang sedang login.
- **Tenant Onboarding**: Proses pendaftaran dan setup tenant baru.
- **Cross-Tenant Access**: Akses data antar tenant (tidak diizinkan kecuali untuk Super Admin).

## Requirements

### Requirement 1

**User Story:** Sebagai administrator sistem, saya ingin mendaftarkan rumah sakit baru sebagai tenant, sehingga rumah sakit tersebut dapat mulai menggunakan aplikasi dengan data yang terisolasi.

#### Acceptance Criteria

1. WHEN administrator sistem membuat tenant baru THEN sistem SHALL menyimpan informasi tenant dengan tenant_id unik, nama rumah sakit, dan metadata tenant
2. WHEN tenant baru dibuat THEN sistem SHALL membuat user admin pertama untuk tenant tersebut dengan kredensial yang aman
3. WHEN tenant baru dibuat THEN sistem SHALL menginisialisasi data master default untuk tenant (unit kerja standar, konfigurasi default)
4. WHEN tenant baru dibuat THEN sistem SHALL mengaktifkan RLS policies untuk memastikan isolasi data tenant
5. WHEN proses onboarding tenant gagal THEN sistem SHALL melakukan rollback semua perubahan dan memberikan pesan error yang jelas

### Requirement 2

**User Story:** Sebagai user rumah sakit, saya ingin login ke aplikasi dan hanya melihat data rumah sakit saya, sehingga data rumah sakit lain tidak tercampur dengan data kami.

#### Acceptance Criteria

1. WHEN user melakukan login THEN sistem SHALL memverifikasi tenant_id user dan menetapkan tenant context untuk session
2. WHEN user mengakses data apapun THEN sistem SHALL memfilter data berdasarkan tenant_id user melalui RLS policies
3. WHEN user mencoba mengakses data tenant lain THEN sistem SHALL menolak akses dan mengembalikan error permission denied
4. WHEN user logout THEN sistem SHALL menghapus tenant context dari session
5. WHEN user dengan tenant_id NULL mencoba login THEN sistem SHALL menolak akses dan meminta assignment tenant

### Requirement 3

**User Story:** Sebagai tenant admin, saya ingin mengelola user dalam rumah sakit saya, sehingga saya dapat menambah, mengubah, atau menonaktifkan user sesuai kebutuhan organisasi.

#### Acceptance Criteria

1. WHEN tenant admin membuat user baru THEN sistem SHALL memastikan user tersebut terikat ke tenant yang sama dengan admin
2. WHEN tenant admin melihat daftar user THEN sistem SHALL hanya menampilkan user dalam tenant yang sama
3. WHEN tenant admin mengubah role user THEN sistem SHALL memvalidasi bahwa role tersebut valid dan user masih dalam tenant yang sama
4. WHEN tenant admin menonaktifkan user THEN sistem SHALL mencegah user tersebut login tanpa menghapus data historis
5. WHEN tenant admin mencoba mengelola user dari tenant lain THEN sistem SHALL menolak operasi tersebut

### Requirement 4

**User Story:** Sebagai developer, saya ingin semua tabel database memiliki kolom tenant_id, sehingga data dapat diisolasi dengan benar di level database.

#### Acceptance Criteria

1. WHEN migrasi database dijalankan THEN sistem SHALL menambahkan kolom tenant_id (UUID) ke semua tabel yang menyimpan data tenant
2. WHEN kolom tenant_id ditambahkan THEN sistem SHALL membuat foreign key constraint ke tabel tenants
3. WHEN kolom tenant_id ditambahkan THEN sistem SHALL membuat index pada kolom tenant_id untuk performa query
4. WHEN data existing dimigrasikan THEN sistem SHALL mengisi tenant_id berdasarkan user_id yang ada dengan mapping yang benar
5. WHEN tabel baru dibuat THEN sistem SHALL memastikan kolom tenant_id included by default dalam schema

### Requirement 5

**User Story:** Sebagai developer, saya ingin RLS policies diupdate untuk menggunakan tenant_id, sehingga isolasi data antar tenant terjamin di level database.

#### Acceptance Criteria

1. WHEN RLS policy dibuat atau diupdate THEN sistem SHALL menggunakan tenant_id sebagai filter utama, bukan user_id
2. WHEN user mengakses data THEN RLS policy SHALL memverifikasi tenant_id user matches tenant_id data
3. WHEN Super Admin mengakses data THEN RLS policy SHALL mengizinkan akses ke semua tenant
4. WHEN query dieksekusi THEN RLS policy SHALL menggunakan index tenant_id untuk performa optimal
5. WHEN RLS policy gagal THEN sistem SHALL mengembalikan empty result set, bukan error yang expose informasi tenant lain

### Requirement 6

**User Story:** Sebagai user, saya ingin melihat nama rumah sakit saya di interface aplikasi, sehingga saya yakin sedang bekerja dengan data rumah sakit yang benar.

#### Acceptance Criteria

1. WHEN user login THEN sistem SHALL menampilkan nama tenant di header atau sidebar aplikasi
2. WHEN user berada di halaman manapun THEN nama tenant SHALL tetap visible sebagai indikator konteks
3. WHEN user adalah Super Admin dengan akses multi-tenant THEN sistem SHALL menampilkan tenant selector untuk switch antar tenant
4. WHEN tenant memiliki logo THEN sistem SHALL menampilkan logo tenant di aplikasi
5. WHEN tenant information berubah THEN sistem SHALL memperbarui tampilan tanpa require logout

### Requirement 7

**User Story:** Sebagai tenant admin, saya ingin mengkonfigurasi pengaturan khusus untuk rumah sakit saya, sehingga aplikasi dapat disesuaikan dengan kebutuhan operasional kami.

#### Acceptance Criteria

1. WHEN tenant admin mengakses pengaturan tenant THEN sistem SHALL menampilkan konfigurasi yang dapat diubah (nama, logo, preferensi biaya, dll)
2. WHEN tenant admin mengubah pengaturan THEN sistem SHALL menyimpan perubahan hanya untuk tenant tersebut
3. WHEN tenant admin mengubah preferensi perhitungan biaya THEN sistem SHALL menerapkan preferensi tersebut ke semua kalkulasi tenant
4. WHEN pengaturan tenant diubah THEN sistem SHALL mencatat audit trail perubahan
5. WHEN pengaturan invalid disubmit THEN sistem SHALL menolak perubahan dan menampilkan validasi error

### Requirement 8

**User Story:** Sebagai Super Admin, saya ingin melihat daftar semua tenant dan statistik penggunaan mereka, sehingga saya dapat memonitor kesehatan sistem dan penggunaan resources.

#### Acceptance Criteria

1. WHEN Super Admin mengakses dashboard admin THEN sistem SHALL menampilkan daftar semua tenant dengan informasi dasar
2. WHEN Super Admin melihat detail tenant THEN sistem SHALL menampilkan statistik penggunaan (jumlah user, data size, aktivitas)
3. WHEN Super Admin perlu troubleshoot THEN sistem SHALL menyediakan akses untuk view data tenant tertentu
4. WHEN Super Admin mengakses data tenant THEN sistem SHALL mencatat audit log untuk compliance
5. WHEN tenant mengalami masalah THEN Super Admin SHALL dapat menonaktifkan atau mengaktifkan tenant

### Requirement 9

**User Story:** Sebagai developer, saya ingin fungsi dan trigger database diupdate untuk tenant-aware, sehingga semua operasi otomatis tetap bekerja dengan benar dalam konteks multi-tenant.

#### Acceptance Criteria

1. WHEN fungsi database dieksekusi THEN fungsi SHALL memfilter data berdasarkan tenant_id dari session atau parameter
2. WHEN trigger dieksekusi THEN trigger SHALL memastikan tenant_id konsisten dalam operasi INSERT/UPDATE
3. WHEN fungsi melakukan kalkulasi THEN fungsi SHALL hanya menggunakan data dari tenant yang sama
4. WHEN fungsi populate atau sync dijalankan THEN fungsi SHALL memproses data per tenant secara isolated
5. WHEN fungsi cross-table dieksekusi THEN fungsi SHALL memvalidasi tenant_id consistency antar tabel

### Requirement 10

**User Story:** Sebagai developer, saya ingin migrasi data existing ke struktur multi-tenant berjalan aman, sehingga tidak ada data loss atau corruption selama transformasi.

#### Acceptance Criteria

1. WHEN migrasi dimulai THEN sistem SHALL membuat backup lengkap database sebelum perubahan apapun
2. WHEN data user existing dimigrasikan THEN sistem SHALL membuat tenant baru untuk setiap user atau group user yang sesuai
3. WHEN tenant_id diassign ke data existing THEN sistem SHALL memastikan konsistensi tenant_id across all related tables
4. WHEN migrasi selesai THEN sistem SHALL memverifikasi integritas data dengan automated tests
5. WHEN migrasi gagal THEN sistem SHALL menyediakan rollback mechanism untuk restore ke state sebelumnya

### Requirement 11

**User Story:** Sebagai user, saya ingin proses login dan autentikasi tetap sederhana, sehingga pengalaman user tidak terganggu oleh perubahan multi-tenant.

#### Acceptance Criteria

1. WHEN user login dengan email dan password THEN sistem SHALL otomatis mendeteksi tenant dari user profile
2. WHEN user pertama kali login setelah migrasi THEN sistem SHALL seamless transition tanpa require re-registration
3. WHEN user lupa password THEN sistem SHALL mengirim reset link yang tenant-aware
4. WHEN user mengakses aplikasi via URL THEN sistem SHALL otomatis load tenant context dari user session
5. WHEN session expired THEN sistem SHALL redirect ke login dengan tenant context preserved

### Requirement 12

**User Story:** Sebagai developer, saya ingin API dan service layer diupdate untuk tenant-aware, sehingga semua operasi CRUD otomatis memfilter berdasarkan tenant.

#### Acceptance Criteria

1. WHEN API endpoint dipanggil THEN sistem SHALL extract tenant_id dari user session dan inject ke query
2. WHEN service function dieksekusi THEN function SHALL validate tenant_id consistency untuk semua operasi
3. WHEN data dibuat via API THEN sistem SHALL otomatis set tenant_id dari user context
4. WHEN data diupdate via API THEN sistem SHALL memvalidasi bahwa data belongs to user's tenant
5. WHEN API response dikirim THEN sistem SHALL memastikan tidak ada data leak dari tenant lain

### Requirement 13

**User Story:** Sebagai tenant admin, saya ingin dapat export data rumah sakit saya, sehingga kami memiliki backup dan dapat analisis offline.

#### Acceptance Criteria

1. WHEN tenant admin request export THEN sistem SHALL generate export file hanya untuk data tenant tersebut
2. WHEN export diproses THEN sistem SHALL include semua tabel relevan dengan tenant_id filtering
3. WHEN export selesai THEN sistem SHALL menyediakan download link yang secure dan time-limited
4. WHEN export file didownload THEN file SHALL dalam format yang dapat diimport kembali (SQL dump atau JSON)
5. WHEN export gagal THEN sistem SHALL memberikan error message dan tidak leave partial data

### Requirement 14

**User Story:** Sebagai developer, saya ingin testing framework untuk memverifikasi isolasi tenant, sehingga tidak ada bug yang menyebabkan data leak antar tenant.

#### Acceptance Criteria

1. WHEN test suite dijalankan THEN sistem SHALL membuat multiple test tenants dengan data sample
2. WHEN test isolasi dijalankan THEN test SHALL memverifikasi user tenant A tidak dapat akses data tenant B
3. WHEN test RLS dijalankan THEN test SHALL memverifikasi semua queries filtered by tenant_id correctly
4. WHEN test API dijalankan THEN test SHALL memverifikasi semua endpoints respect tenant boundaries
5. WHEN test selesai THEN sistem SHALL cleanup test tenants dan data tanpa affect production data

### Requirement 15

**User Story:** Sebagai product owner, saya ingin dokumentasi lengkap tentang arsitektur multi-tenant, sehingga tim development dapat maintain dan extend sistem dengan benar.

#### Acceptance Criteria

1. WHEN dokumentasi dibuat THEN dokumentasi SHALL menjelaskan tenant model dan data isolation strategy
2. WHEN dokumentasi dibuat THEN dokumentasi SHALL include ERD yang menunjukkan relasi tenant dengan tabel lain
3. WHEN dokumentasi dibuat THEN dokumentasi SHALL menjelaskan RLS policies dan bagaimana mereka bekerja
4. WHEN dokumentasi dibuat THEN dokumentasi SHALL include guide untuk onboarding tenant baru
5. WHEN dokumentasi dibuat THEN dokumentasi SHALL include troubleshooting guide untuk common multi-tenant issues
