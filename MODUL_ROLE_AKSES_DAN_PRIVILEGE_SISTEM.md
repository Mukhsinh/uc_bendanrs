# MODUL ROLE AKSES DAN PRIVILEGE SISTEM
## APLIKASI UNIT COST RUMAH SAKIT

---

**Disusun oleh:**  
**MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC**

**Hak Cipta: 000831709**

---

## DAFTAR ISI

1. [PENDAHULUAN](#pendahuluan)
2. [GAMBARAN UMUM](#gambaran-umum)
3. [DASAR TEORITIS DAN REGULASI PENDUKUNG](#dasar-teoritis-dan-regulasi-pendukung)
4. [STRUKTUR ROLE SISTEM](#struktur-role-sistem)
5. [DETAIL ROLE DAN PRIVILEGE](#detail-role-dan-privilege)
6. [MATRIX AKSES MENU](#matrix-akses-menu)
7. [IMPLEMENTASI KEAMANAN](#implementasi-keamanan)
8. [PANDUAN PENGGUNAAN](#panduan-penggunaan)
9. [KESIMPULAN](#kesimpulan)

---

## PENDAHULUAN

Sistem Manajemen Akses pada Aplikasi Unit Cost Rumah Sakit dirancang untuk memberikan kontrol akses yang ketat dan terstruktur terhadap berbagai fitur dan data dalam sistem. Modul ini menjelaskan secara detail tentang struktur role, privilege, dan hak akses yang dapat diberikan kepada setiap pengguna sistem.

### Tujuan Sistem Role Akses:
- Memastikan keamanan data dan informasi
- Memberikan kontrol akses yang granular
- Mencegah akses yang tidak sah
- Memudahkan administrasi user
- Memberikan audit trail yang jelas

---

## GAMBARAN UMUM

Aplikasi Unit Cost Rumah Sakit merupakan sistem informasi terintegrasi yang dirancang untuk menghitung dan mengelola biaya satuan pelayanan di rumah sakit. Sistem ini mengimplementasikan pendekatan Activity-Based Costing (ABC) untuk menghasilkan informasi biaya yang akurat dan transparan.

### **Latar Belakang:**
Dalam era transformasi digital kesehatan, rumah sakit membutuhkan sistem informasi yang mampu memberikan data biaya yang akurat untuk mendukung pengambilan keputusan manajemen. Aplikasi ini dikembangkan untuk memenuhi kebutuhan tersebut dengan fokus pada:

1. **Akurasi Perhitungan Biaya** - Menggunakan metode ABC yang telah teruji
2. **Transparansi Keuangan** - Memberikan visibilitas penuh terhadap struktur biaya
3. **Kepatuhan Regulasi** - Sesuai dengan pedoman Kementerian Kesehatan
4. **Efisiensi Operasional** - Mengotomasi proses perhitungan biaya
5. **Pengambilan Keputusan** - Menyediakan data untuk strategi bisnis

### **Ruang Lingkup Sistem:**
Aplikasi ini mencakup seluruh aspek perhitungan biaya unit pelayanan rumah sakit, meliputi:

- **Unit Pelayanan Medis** - Rawat inap, rawat jalan, gawat darurat
- **Unit Penunjang** - Laboratorium, radiologi, farmasi, gizi
- **Unit Keperawatan** - Berbagai kelas perawatan dan unit khusus
- **Unit Diklat** - Pendidikan dan pelatihan tenaga kesehatan
- **Kalkulasi Biaya** - Perhitungan biaya per unit layanan
- **Distribusi Biaya** - Alokasi biaya overhead ke unit pelayanan
- **Skenario Tarif** - Simulasi dan analisis tarif layanan
- **Rekapitulasi** - Laporan komprehensif biaya unit

### **Manfaat Sistem:**
1. **Untuk Manajemen:**
   - Data biaya yang akurat untuk pengambilan keputusan
   - Identifikasi area yang memerlukan efisiensi
   - Perencanaan anggaran yang lebih tepat
   - Evaluasi kinerja unit-unit pelayanan

2. **Untuk Operasional:**
   - Otomasi perhitungan biaya yang kompleks
   - Standarisasi proses perhitungan
   - Pengurangan kesalahan manual
   - Akses real-time terhadap data biaya

3. **Untuk Kepatuhan:**
   - Sesuai dengan regulasi Kementerian Kesehatan
   - Transparansi dalam pelaporan keuangan
   - Audit trail yang lengkap
   - Dokumentasi proses yang sistematis

---

## DASAR TEORITIS DAN REGULASI PENDUKUNG

### **Dasar Teoritis:**

#### **1. Activity-Based Costing (ABC)**
Activity-Based Costing adalah metode perhitungan biaya yang mengalokasikan biaya berdasarkan aktivitas yang sebenarnya dilakukan untuk menghasilkan produk atau layanan. Dalam konteks rumah sakit, ABC membantu mengidentifikasi biaya sebenarnya untuk setiap jenis pelayanan.

**Prinsip Dasar ABC:**
- **Cost Objects** - Unit layanan yang akan dihitung biayanya
- **Activities** - Aktivitas yang mendukung penyediaan layanan
- **Resources** - Sumber daya yang dikonsumsi oleh aktivitas
- **Cost Drivers** - Faktor yang menyebabkan terjadinya biaya

#### **2. Cost Center Management**
Sistem ini mengimplementasikan manajemen cost center yang memungkinkan pengelompokan biaya berdasarkan unit organisasi dan aktivitas. Setiap cost center memiliki tanggung jawab untuk mengelola biaya yang dialokasikan kepadanya.

#### **3. Responsibility Accounting**
Prinsip akuntansi pertanggungjawaban diterapkan dimana setiap unit atau individu bertanggung jawab terhadap biaya yang dapat mereka kontrol. Ini memungkinkan evaluasi kinerja yang lebih akurat.

### **Regulasi Pendukung:**

#### **1. Keputusan Menteri Kesehatan RI No. HK.01.07/MENKES/346/2025**
**Tentang Pedoman Penghitungan Biaya Satuan Pelayanan di Rumah Sakit**

**Ketentuan Utama:**
- Rumah sakit wajib menghitung biaya satuan pelayanan secara akurat
- Perhitungan biaya harus menggunakan metode yang dapat dipertanggungjawabkan
- Laporan biaya harus transparan dan dapat diaudit
- Sistem informasi harus mendukung proses perhitungan biaya

**Pasal-pasal Relevan:**
- **Pasal 5**: Rumah sakit wajib memiliki sistem informasi yang mendukung perhitungan biaya
- **Pasal 8**: Perhitungan biaya harus mencakup biaya langsung dan tidak langsung
- **Pasal 12**: Sistem harus mampu menghasilkan laporan perhitungan biaya
- **Pasal 15**: Data dan proses perhitungan biaya harus dapat diaudit

#### **2. Peraturan Menteri Kesehatan RI No. 44 Tahun 2016**
**Tentang Standar Teknis Pelayanan Minimal Rumah Sakit**

**Ketentuan Relevan:**
- Rumah sakit harus memiliki sistem informasi manajemen yang terintegrasi
- Sistem harus mendukung perencanaan, pengendalian, dan evaluasi pelayanan
- Data keuangan harus akurat dan dapat dipertanggungjawabkan

#### **3. Undang-Undang No. 36 Tahun 2009**
**Tentang Kesehatan**

**Ketentuan Umum:**
- Setiap penyelenggaraan pelayanan kesehatan harus bermutu dan terjangkau
- Rumah sakit wajib menyelenggarakan pelayanan kesehatan yang bermutu
- Transparansi dalam penyelenggaraan pelayanan kesehatan

#### **4. Standar Akuntansi Keuangan (SAK)**
**PSAK 45: Pelaporan Keuangan Organisasi Nirlaba**

**Ketentuan Relevan:**
- Sistem akuntansi harus mampu mengukur dan melaporkan biaya per program
- Alokasi biaya overhead harus dilakukan secara sistematis
- Laporan keuangan harus memberikan informasi yang berguna bagi pengambilan keputusan

### **Prinsip Implementasi:**

#### **1. Kepatuhan Regulasi**
- Semua proses perhitungan biaya mengacu pada regulasi yang berlaku
- Sistem dirancang untuk memenuhi standar pelaporan yang ditetapkan
- Audit trail lengkap untuk memenuhi persyaratan audit

#### **2. Transparansi dan Akuntabilitas**
- Semua data dan proses dapat diakses dan diverifikasi
- Laporan yang dihasilkan dapat dipertanggungjawabkan
- Sistem mendukung prinsip good governance

#### **3. Efisiensi dan Efektivitas**
- Otomasi proses perhitungan yang kompleks
- Pengurangan waktu dan sumber daya yang dibutuhkan
- Peningkatan akurasi dan konsistensi data

#### **4. Integrasi dan Konsistensi**
- Sistem terintegrasi dengan sistem informasi rumah sakit lainnya
- Konsistensi data antar unit dan periode
- Standardisasi proses dan prosedur

---

## STRUKTUR ROLE SISTEM

Sistem menggunakan **5 level role** dengan hierarki yang jelas:

### 🟣 **SUPER ADMIN** (Level 1)
- **Deskripsi**: Akses penuh ke semua fitur sistem
- **Jumlah Menu**: 15 menus
- **Privilege Level**: Tertinggi

### 🔵 **ADMIN** (Level 2)  
- **Deskripsi**: Administrator dengan akses terbatas
- **Jumlah Menu**: 13 menus
- **Privilege Level**: Tinggi (tanpa delete dan user management)

### 🟢 **MANAGER** (Level 3)
- **Deskripsi**: Manager dengan akses laporan dan monitoring
- **Jumlah Menu**: 7 menus
- **Privilege Level**: Menengah (view only)

### 🟠 **OPERATOR** (Level 4)
- **Deskripsi**: Operator dengan akses input data
- **Jumlah Menu**: 5 menus
- **Privilege Level**: Menengah (create/edit tanpa delete)

### ⚫ **VIEWER** (Level 5)
- **Deskripsi**: Hanya dapat melihat data dan laporan
- **Jumlah Menu**: 7 menus
- **Privilege Level**: Terendah (view only)

---

## DETAIL ROLE DAN PRIVILEGE

### 🟣 **SUPER ADMIN**

#### **Hak Akses:**
- ✅ **Full Access** ke semua menu (15 menus)
- ✅ **View, Create, Edit, Delete** semua data
- ✅ **User Management** - Kelola semua user dan role
- ✅ **System Administration** - Konfigurasi sistem
- ✅ **Audit Access** - Akses log dan audit trail

#### **Menu yang Dapat Diakses:**
1. Dashboard
2. Data Master
3. Data Operasional
4. Unit Penunjang
5. Unit Keperawatan
6. Unit Pelayanan
7. Unit Diklat
8. Rekapitulasi Unit Cost
9. Skenario Tarif
10. Distribusi Biaya
11. Cost Recovery
12. Budgeting BHP
13. Produk Layanan
14. Modul Teknis
15. Manajemen Akses

#### **Kemampuan Khusus:**
- Menghapus user secara permanen
- Assign role ke user lain
- Mengubah permission system
- Akses ke semua data tanpa batasan

---

### 🔵 **ADMIN**

#### **Hak Akses:**
- ✅ **View, Create, Edit** (tidak ada Delete)
- ❌ **Tidak ada akses** ke Manajemen Akses
- ❌ **Tidak ada akses** ke Modul Teknis
- ✅ **Administrative Control** untuk data operasional

#### **Menu yang Dapat Diakses:**
1. Dashboard
2. Data Master
3. Data Operasional
4. Unit Penunjang
5. Unit Keperawatan
6. Unit Pelayanan
7. Unit Diklat
8. Rekapitulasi Unit Cost
9. Skenario Tarif
10. Distribusi Biaya
11. Cost Recovery
12. Budgeting BHP
13. Produk Layanan

#### **Kemampuan:**
- Mengelola data master dan operasional
- Membuat dan mengedit laporan
- Mengatur skenario tarif
- Mengelola unit-unit operasional
- **Tidak bisa menghapus data permanen**
- **Tidak bisa mengelola user**

---

### 🟢 **MANAGER**

#### **Hak Akses:**
- ✅ **View Only** - Hanya dapat melihat data
- ❌ **Tidak ada Create, Edit, Delete**
- ✅ **Monitoring dan Reporting** access

#### **Menu yang Dapat Diakses:**
1. Dashboard
2. Rekapitulasi Unit Cost
3. Skenario Tarif
4. Distribusi Biaya
5. Cost Recovery
6. Budgeting BHP
7. Produk Layanan

#### **Kemampuan:**
- Melihat dashboard dan statistik
- Mengakses laporan keuangan
- Monitor performance unit
- Melihat skenario tarif
- **Tidak bisa mengubah data apapun**

---

### 🟠 **OPERATOR**

#### **Hak Akses:**
- ✅ **View, Create, Edit** (tidak ada Delete)
- ✅ **Data Input Operations** - Input data operasional
- ❌ **Tidak ada akses** ke Data Master dan Data Operasional

#### **Menu yang Dapat Diakses:**
1. Dashboard
2. Unit Penunjang
3. Unit Keperawatan
4. Unit Pelayanan
5. Unit Diklat

#### **Kemampuan:**
- Input data operasional unit
- Mengelola data unit penunjang
- Mengelola data unit keperawatan
- Mengelola data unit pelayanan
- Mengelola data unit diklat
- **Tidak bisa menghapus data**
- **Tidak bisa mengakses data master**

---

### ⚫ **VIEWER**

#### **Hak Akses:**
- ✅ **View Only** - Hanya dapat melihat data
- ❌ **Tidak ada Create, Edit, Delete**
- ✅ **Read-Only Reports** access

#### **Menu yang Dapat Diakses:**
1. Dashboard
2. Rekapitulasi Unit Cost
3. Skenario Tarif
4. Distribusi Biaya
5. Cost Recovery
6. Budgeting BHP
7. Produk Layanan

#### **Kemampuan:**
- Melihat dashboard
- Mengakses laporan keuangan
- Melihat data historis
- Export laporan (jika diizinkan)
- **Tidak bisa mengubah data apapun**

---

## MATRIX AKSES MENU

| Menu | Super Admin | Admin | Manager | Operator | Viewer |
|------|-------------|-------|---------|----------|--------|
| **Dashboard** | ✅ Full | ✅ C/E | ✅ View | ✅ C/E | ✅ View |
| **Data Master** | ✅ Full | ✅ C/E | ❌ No | ❌ No | ❌ No |
| **Data Operasional** | ✅ Full | ✅ C/E | ❌ No | ❌ No | ❌ No |
| **Unit Penunjang** | ✅ Full | ✅ C/E | ❌ No | ✅ C/E | ❌ No |
| **Unit Keperawatan** | ✅ Full | ✅ C/E | ❌ No | ✅ C/E | ❌ No |
| **Unit Pelayanan** | ✅ Full | ✅ C/E | ❌ No | ✅ C/E | ❌ No |
| **Unit Diklat** | ✅ Full | ✅ C/E | ❌ No | ✅ C/E | ❌ No |
| **Rekapitulasi Unit Cost** | ✅ Full | ✅ C/E | ✅ View | ❌ No | ✅ View |
| **Skenario Tarif** | ✅ Full | ✅ C/E | ✅ View | ❌ No | ✅ View |
| **Distribusi Biaya** | ✅ Full | ✅ C/E | ✅ View | ❌ No | ✅ View |
| **Cost Recovery** | ✅ Full | ✅ C/E | ✅ View | ❌ No | ✅ View |
| **Budgeting BHP** | ✅ Full | ✅ C/E | ✅ View | ❌ No | ✅ View |
| **Produk Layanan** | ✅ Full | ✅ C/E | ✅ View | ❌ No | ✅ View |
| **Modul Teknis** | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No |
| **Manajemen Akses** | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No |

**Legenda:**
- ✅ Full = View, Create, Edit, Delete
- ✅ C/E = Create, Edit (No Delete)
- ✅ View = View Only
- ❌ No = No Access

---

## IMPLEMENTASI KEAMANAN

### **1. Row Level Security (RLS)**
- Semua tabel menggunakan RLS untuk kontrol akses
- Policy berdasarkan role user yang aktif
- Otomatis filter data berdasarkan permission

### **2. Function-Based Security**
- Menggunakan SECURITY DEFINER functions
- Centralized permission checking
- Audit trail untuk semua aksi user

### **3. Role Hierarchy**
- Super Admin > Admin > Manager > Operator > Viewer
- Higher role memiliki akses ke semua fitur lower role
- Tidak ada privilege escalation tanpa otorisasi

### **4. Session Management**
- Token-based authentication
- Automatic session timeout
- Multi-device login tracking

---

## PANDUAN PENGGUNAAN

### **Untuk Super Admin:**
1. Login dengan kredensial Super Admin
2. Akses menu "Manajemen Akses"
3. Kelola user dan assign role sesuai kebutuhan
4. Monitor aktivitas user melalui audit log

### **Untuk Admin:**
1. Fokus pada pengelolaan data operasional
2. Tidak bisa mengakses user management
3. Dapat membuat dan mengedit data (tidak bisa delete)
4. Akses ke semua fitur kecuali sistem administration

### **Untuk Manager:**
1. Fokus pada monitoring dan reporting
2. Akses terbatas pada menu laporan
3. Tidak bisa mengubah data apapun
4. Dapat export laporan untuk analisis

### **Untuk Operator:**
1. Input data operasional harian
2. Fokus pada unit-unit operasional
3. Tidak bisa mengakses data master
4. Tidak bisa menghapus data

### **Untuk Viewer:**
1. Hanya dapat melihat laporan
2. Tidak bisa mengubah data apapun
3. Akses terbatas pada menu reporting
4. Dapat export data untuk review

---

## KESIMPULAN

Sistem Role Akses pada Aplikasi Unit Cost Rumah Sakit telah dirancang dengan prinsip:

1. **Security First** - Keamanan data adalah prioritas utama
2. **Principle of Least Privilege** - User hanya mendapat akses yang diperlukan
3. **Audit Trail** - Semua aktivitas dapat di-track dan diaudit
4. **Scalability** - Sistem dapat dikembangkan sesuai kebutuhan
5. **User-Friendly** - Interface yang mudah digunakan

Dengan implementasi sistem ini, organisasi dapat memastikan bahwa setiap pengguna memiliki akses yang sesuai dengan tanggung jawab dan wewenangnya, sekaligus menjaga keamanan dan integritas data sistem.

---

**Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang**
