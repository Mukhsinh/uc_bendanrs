# 📋 MODUL TEKNIS - PETUNJUK TEKNIS PENGGUNAAN

## 🎯 OVERVIEW

Dokumentasi ini berisi panduan lengkap penggunaan setiap menu dalam Aplikasi Unit Cost RS, dilengkapi dengan flowchart proses bisnis dan langkah-langkah operasional yang detail.

---

## 📊 WORKFLOW UTAMA APLIKASI

### **Master Workflow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    APLIKASI UNIT COST RS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   LOGIN     │───▶│ DASHBOARD   │───▶│ DATA MASTER │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   LOGOUT    │    │ NAVIGATION  │    │   KALKULASI │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SECURITY  │    │   ROUTING   │    │  REPORTING  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏠 DASHBOARD

### **Flowchart Dashboard**

```
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD ACCESS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Login ✅ ────────────┐                               │
│                            │                               │
│                            ▼                               │
│  ┌─────────────────────────────────────┐                   │
│  │           DASHBOARD                 │                   │
│  ├─────────────────────────────────────┤                   │
│  │  📊 Quick Stats                     │                   │
│  │  ├── Total Unit Cost                │                   │
│  │  ├── Active Users                   │                   │
│  │  ├── Data Entries                   │                   │
│  │  └── System Status                  │                   │
│  │                                     │                   │
│  │  🚀 Quick Actions                   │                   │
│  │  ├── Add New Data                   │                   │
│  │  ├── Generate Report                │                   │
│  │  ├── View Analytics                 │                   │
│  │  └── System Settings                │                   │
│  │                                     │                   │
│  │  📈 Recent Activities               │                   │
│  │  └── Last Data Updates              │                   │
│  └─────────────────────────────────────┘                   │
│                            │                               │
│                            ▼                               │
│  Navigate to Specific Menu ────────────▶ Continue to Menu  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Langkah-langkah Dashboard**

1. **Login ke Aplikasi**
   - Buka browser dan akses URL aplikasi
   - Masukkan username dan password
   - Klik tombol "Login"

2. **Akses Dashboard**
   - Setelah login berhasil, otomatis masuk ke Dashboard
   - Dashboard menampilkan overview sistem
   - Quick stats: Total unit cost, active users, data entries

3. **Quick Actions**
   - **Add New Data**: Langsung ke form input data
   - **Generate Report**: Akses menu reporting
   - **View Analytics**: Lihat grafik dan statistik
   - **System Settings**: Konfigurasi sistem

4. **Navigation**
   - Gunakan sidebar untuk navigasi ke menu lain
   - Breadcrumb menunjukkan posisi saat ini
   - Search box untuk pencarian cepat

---

## 📊 DATA MASTER

### **1. Unit Kerja**

#### **Flowchart Unit Kerja**

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIT KERJA MANAGEMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   VIEW      │───▶│    ADD      │───▶│    EDIT     │     │
│  │   LIST      │    │   NEW UNIT  │    │   EXISTING  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SEARCH    │    │   VALIDATE  │    │    SAVE     │     │
│  │   FILTER    │    │   INPUT     │    │   CHANGES   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   DELETE    │    │   EXPORT    │    │   IMPORT    │     │
│  │   UNIT      │    │   TO CSV    │    │ FROM CSV    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Unit Kerja**

**A. Melihat Daftar Unit Kerja**
1. Klik menu "Data Master" → "Data Unit Kerja"
2. Tabel akan menampilkan semua unit kerja
3. Gunakan search box untuk pencarian
4. Gunakan filter untuk menyaring data

**B. Menambah Unit Kerja Baru**
1. Klik tombol "Tambah Unit Kerja"
2. Isi form dengan data:
   - Nama Unit Kerja (required)
   - Kode Unit Kerja (required, unique)
   - Deskripsi (optional)
   - Status Aktif (default: Aktif)
3. Klik "Simpan"
4. Konfirmasi sukses akan muncul

**C. Mengedit Unit Kerja**
1. Klik icon edit (✏️) pada baris unit kerja
2. Ubah data yang diperlukan
3. Klik "Update"
4. Konfirmasi perubahan

**D. Menghapus Unit Kerja**
1. Klik icon delete (🗑️) pada baris unit kerja
2. Konfirmasi penghapusan
3. Data akan dihapus (soft delete)

**E. Import/Export Data**
1. **Export**: Klik "Export CSV" untuk download data
2. **Import**: Klik "Import Data" → Pilih file CSV → Upload

---

### **2. Barang Farmasi**

#### **Flowchart Barang Farmasi**

```
┌─────────────────────────────────────────────────────────────┐
│                  BARANG FARMASI MANAGEMENT                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   VIEW      │───▶│    ADD      │───▶│    EDIT     │     │
│  │   CATALOG   │    │   NEW ITEM  │    │   EXISTING  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SEARCH    │    │   VALIDATE  │    │    SAVE     │     │
│  │  BY CODE/   │    │   DRUG      │    │   CHANGES   │     │
│  │   NAME      │    │   DATA      │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   PRICE     │    │   STOCK     │    │   CATEGORY  │     │
│  │ MANAGEMENT  │    │ MANAGEMENT  │    │ MANAGEMENT  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Barang Farmasi**

**A. Melihat Katalog Farmasi**
1. Klik menu "Data Master" → "Barang Farmasi"
2. Tabel menampilkan: Kode Barang, Nama Barang, Satuan, Harga
3. Gunakan search untuk pencarian cepat
4. Filter berdasarkan kategori obat

**B. Menambah Barang Farmasi Baru**
1. Klik tombol "Tambah Barang"
2. Isi form dengan data:
   - Kode Barang (required, unique)
   - Nama Barang (required)
   - Satuan (tablet, vial, botol, dll)
   - Harga Satuan (required)
   - Kategori (antibiotik, analgetik, dll)
   - Stok Minimum
3. Klik "Simpan"

**C. Mengelola Harga**
1. Klik icon edit pada baris barang
2. Update harga satuan
3. Tentukan periode efektif harga
4. Simpan perubahan

**D. Manajemen Stok**
1. Lihat stok saat ini di tabel
2. Update stok via form edit
3. Set alert untuk stok minimum

---

### **3. Data Kegiatan**

#### **Flowchart Data Kegiatan**

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA KEGIATAN WORKFLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│   INPUT     │───▶│   VALIDATE  │     │
│  │   UNIT      │    │ ACTIVITIES  │    │    DATA     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   ENTER     │    │    SAVE     │     │
│  │   PERIOD    │    │   DETAILS   │    │ ACTIVITIES  │     │
│  │  (MONTH)    │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   REVIEW    │    │   EXPORT    │    │   IMPORT    │     │
│  │ ACTIVITIES  │    │   TO CSV    │    │ FROM CSV    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Data Kegiatan**

**A. Mengakses Data Kegiatan**
1. Klik menu "Data Operasional" → "Data Kegiatan"
2. Pilih tahun dan bulan
3. Pilih unit kerja dari dropdown
4. Klik "Load Data"

**B. Input Data Kegiatan**
1. Form akan menampilkan input fields:
   - Jenis Kegiatan
   - Jumlah Kegiatan
   - Satuan
   - Keterangan
2. Isi data sesuai aktivitas unit
3. Klik "Simpan" untuk setiap kegiatan

**C. Validasi Data**
1. Sistem akan validasi:
   - Data tidak boleh kosong
   - Format angka harus benar
   - Periode tidak boleh duplikat
2. Error message akan muncul jika ada kesalahan

**D. Review dan Export**
1. Review data yang sudah diinput
2. Klik "Export CSV" untuk backup
3. Data bisa di-import ulang jika diperlukan

---

## 🏢 UNIT PENUNJANG

### **1. Kalkulasi Biaya Gizi**

#### **Flowchart Kalkulasi Gizi**

```
┌─────────────────────────────────────────────────────────────┐
│                KALKULASI BIAYA GIZI WORKFLOW                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│   INPUT     │───▶│ CALCULATE   │     │
│  │   MENU      │    │   QUANTITY  │    │   COST      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   ENTER     │    │   APPLY     │     │
│  │   PERIOD    │    │   RECIPES   │    │ FORMULAS    │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   REVIEW    │    │   SAVE      │    │   EXPORT    │     │
│  │   RESULT    │    │ CALCULATION │    │   REPORT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Kalkulasi Gizi**

**A. Setup Kalkulasi**
1. Klik menu "Unit Penunjang" → "Kalkulasi Biaya Gizi"
2. Pilih tahun dan bulan
3. Pilih unit kerja (biasanya Gizi/Diet)
4. Klik "Mulai Kalkulasi"

**B. Input Menu dan Resep**
1. **Pilih Menu Gizi**:
   - Pilih dari dropdown menu yang tersedia
   - Atau tambahkan menu baru
2. **Input Resep**:
   - Pilih bahan gizi dari master data
   - Input jumlah bahan (gram/kg)
   - Sistem akan hitung harga per bahan

**C. Kalkulasi Biaya**
1. Sistem otomatis menghitung:
   - Harga per bahan × jumlah
   - Total biaya per menu
   - Biaya per porsi
2. Review hasil kalkulasi
3. Adjust jika diperlukan

**D. Simpan dan Export**
1. Klik "Simpan Kalkulasi"
2. Data tersimpan untuk periode tersebut
3. Export report untuk dokumentasi

---

### **2. Kalkulasi Biaya Laboratorium**

#### **Flowchart Kalkulasi Lab**

```
┌─────────────────────────────────────────────────────────────┐
│              KALKULASI BIAYA LABORATORIUM WORKFLOW          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│   INPUT     │───▶│ CALCULATE   │     │
│  │   TESTS     │    │   VOLUME    │    │   COST      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   ENTER     │    │   APPLY     │     │
│  │   PERIOD    │    │   PRICES    │    │ FORMULAS    │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   REVIEW    │    │   SAVE      │    │   EXPORT    │     │
│  │   RESULT    │    │ CALCULATION │    │   REPORT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Kalkulasi Lab**

**A. Setup Kalkulasi**
1. Klik menu "Unit Penunjang" → "Kalkulasi Biaya Laboratorium"
2. Pilih tahun dan bulan
3. Pilih unit kerja (Laboratorium)
4. Klik "Load Data"

**B. Input Data Tes**
1. **Pilih Jenis Tes**:
   - Hematologi, Kimia Klinik, Mikrobiologi, dll
   - Dari master data tindakan lab
2. **Input Volume**:
   - Jumlah tes per bulan
   - Breakdown per jenis tes

**C. Kalkulasi Biaya**
1. **Biaya Langsung**:
   - Reagen per tes
   - Alat habis pakai
   - Tenaga kerja
2. **Biaya Tidak Langsung**:
   - Overhead lab
   - Depresiasi alat
   - Maintenance

**D. Review dan Simpan**
1. Review total biaya per tes
2. Bandingkan dengan periode sebelumnya
3. Simpan kalkulasi
4. Export report

---

## 👥 UNIT KEPERAWATAN

### **1. Manajemen Tindakan Inap**

#### **Flowchart Tindakan Inap**

```
┌─────────────────────────────────────────────────────────────┐
│              MANAJEMEN TINDAKAN INAP WORKFLOW               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│   INPUT     │───▶│   VALIDATE  │     │
│  │   KELAS     │    │   TINDAKAN  │    │    DATA     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   ENTER     │    │ CALCULATE   │     │
│  │   PERIOD    │    │   FREQUENCY │    │   COST      │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   REVIEW    │    │   SAVE      │    │   EXPORT    │     │
│  │   RESULT    │    │   DATA      │    │   REPORT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Tindakan Inap**

**A. Setup Tindakan**
1. Klik menu "Unit Keperawatan" → "Manajemen Tindakan Inap"
2. Pilih tahun dan bulan
3. Pilih kelas kamar (VIP, I, II, III)
4. Klik "Load Data"

**B. Input Tindakan Keperawatan**
1. **Pilih Tindakan**:
   - Tindakan keperawatan dari master data
   - Sesuaikan dengan kelas kamar
2. **Input Frekuensi**:
   - Berapa kali per hari
   - Berapa hari rawat
   - Total frekuensi

**C. Kalkulasi Biaya**
1. Sistem menghitung:
   - Biaya per tindakan
   - Total biaya per pasien
   - Rata-rata biaya per kelas
2. Review hasil perhitungan

**D. Simpan dan Export**
1. Simpan data tindakan
2. Export report untuk analisis
3. Data bisa digunakan untuk produk layanan

---

## 🏥 UNIT PELAYANAN

### **1. Kalkulasi Biaya Rawat Jalan**

#### **Flowchart Rawat Jalan**

```
┌─────────────────────────────────────────────────────────────┐
│               KALKULASI BIAYA RAWAT JALAN WORKFLOW          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│   INPUT     │───▶│ CALCULATE   │     │
│  │ POLIKLINIK  │    │   TINDAKAN  │    │   COST      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   ENTER     │    │   APPLY     │     │
│  │   PERIOD    │    │   VOLUME    │    │ FORMULAS    │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   REVIEW    │    │   SAVE      │    │   EXPORT    │     │
│  │   RESULT    │    │ CALCULATION │    │   REPORT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Rawat Jalan**

**A. Setup Kalkulasi**
1. Klik menu "Unit Pelayanan" → "Kalkulasi Biaya Rawat Jalan"
2. Pilih tahun dan bulan
3. Pilih poliklinik dari dropdown
4. Klik "Load Data"

**B. Input Data Tindakan**
1. **Pilih Tindakan**:
   - Konsultasi dokter
   - Tindakan medis
   - Pemeriksaan penunjang
2. **Input Volume**:
   - Jumlah pasien per bulan
   - Rata-rata tindakan per pasien

**C. Kalkulasi Biaya**
1. **Biaya Langsung**:
   - Honor dokter
   - Bahan medis
   - Tenaga perawat
2. **Biaya Tidak Langsung**:
   - Overhead poliklinik
   - Depresiasi alat
   - Administrasi

**D. Review dan Simpan**
1. Review total biaya per pasien
2. Bandingkan dengan tarif yang berlaku
3. Simpan kalkulasi
4. Export report

---

## 📈 REKAPITULASI UNIT COST

### **Flowchart Rekapitulasi**

```
┌─────────────────────────────────────────────────────────────┐
│                REKAPITULASI UNIT COST WORKFLOW              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│ AGGREGATE   │───▶│   REVIEW    │     │
│  │   PERIOD    │    │    DATA     │    │   RESULT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │ CALCULATE   │    │   ANALYZE   │     │
│  │   UNITS     │    │ TOTALS      │    │   TRENDS    │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   EXPORT    │    │   SAVE      │    │   SHARE     │     │
│  │   REPORT    │    │   REPORT    │    │   REPORT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Rekapitulasi**

**A. Setup Rekapitulasi**
1. Klik menu "Rekapitulasi Unit Cost"
2. Pilih tahun dan bulan
3. Pilih unit kerja yang akan direkap
4. Klik "Generate Report"

**B. Review Data**
1. Sistem akan menampilkan:
   - Total biaya per unit
   - Breakdown biaya detail
   - Perbandingan dengan periode sebelumnya
2. Review akurasi data

**C. Analisis dan Export**
1. Analisis trend biaya
2. Identifikasi unit cost tertinggi/terendah
3. Export report dalam format Excel/PDF
4. Simpan untuk dokumentasi

---

## 🛒 PRODUK LAYANAN

### **Flowchart Produk Layanan**

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUK LAYANAN WORKFLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│   INPUT     │───▶│   CALCULATE │     │
│  │   INA-CBG   │    │   LAYANAN   │    │   TOTAL     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   ADD       │    │   REVIEW    │     │
│  │   JENIS     │    │  MULTIPLE   │    │   RESULT    │     │
│  │ (INAP/JALAN)│    │   ITEMS     │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   ANALYZE   │    │   SAVE      │    │   EXPORT    │     │
│  │   PROFIT    │    │   PRODUCT   │    │   REPORT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Produk Layanan**

**A. Setup Produk**
1. Klik menu "Produk Layanan"
2. Klik "Tambah Produk Layanan"
3. Isi data dasar:
   - Jenis (Rawat Inap/Jalan)
   - INA-CBG code
   - Tarif INA-CBG's
   - Diagnosa dan prosedur

**B. Input Layanan**
1. **Tab Layanan**:
   - **Tindakan** 🔵: Pilih tindakan medis
   - **IBS** 🔴: Tindakan operatif
   - **Laboratorium** 🩵: Tes lab
   - **Radiologi** 🟡: Pemeriksaan radiologi
   - **Farmasi** 🟢: Obat-obatan
   - **Kamar Akomodasi** 🩷: Biaya kamar
   - **Visite** 🔷: Visit dokter
   - **Konsultasi** 🟣: Konsultasi dokter

2. **Multi-item Input**:
   - Search dan pilih item
   - Input quantity
   - Klik [+] untuk menambah
   - Edit inline jika perlu

**C. Review dan Simpan**
1. Review total biaya semua layanan
2. Analisis profit margin:
   - Saldo Distribusi = Tarif - Total Biaya
   - % Saldo = (Saldo / Tarif) × 100%
3. Simpan produk layanan
4. Export report

---

## 📋 SKENARIO TARIF

### **1. Skenario Tarif Tindakan**

#### **Flowchart Tarif Tindakan**

```
┌─────────────────────────────────────────────────────────────┐
│               SKENARIO TARIF TINDAKAN WORKFLOW              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│   INPUT     │───▶│   VALIDATE  │     │
│  │   TINDAKAN  │    │   TARIF     │    │    DATA     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   ENTER     │    │   REVIEW    │     │
│  │   PERIOD    │    │ JASA SARANA │    │   TARIF     │     │
│  │             │    │ BIAYA BAHAN │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SAVE      │    │   EXPORT    │    │   IMPORT    │     │
│  │   TARIF     │    │   TO CSV    │    │ FROM CSV    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Tarif Tindakan**

**A. Setup Tarif**
1. Klik menu "Skenario Tarif" → "Skenario Tarif Tindakan"
2. Pilih tahun
3. Pilih unit kerja (jika ada filter)
4. Klik "Load Data"

**B. Input Tarif**
1. **Pilih Tindakan**:
   - Dari master data tindakan
   - Bisa search berdasarkan nama
2. **Input Tarif**:
   - Jasa Sarana (biaya tenaga kerja)
   - Biaya Bahan (BHP, obat, dll)
   - Total tarif (otomatis)

**C. Validasi dan Simpan**
1. Review tarif yang diinput
2. Bandingkan dengan tarif periode sebelumnya
3. Simpan perubahan
4. Export untuk backup

---

## 📊 DISTRIBUSI BIAYA

### **Flowchart Distribusi Biaya**

```
┌─────────────────────────────────────────────────────────────┐
│                 DISTRIBUSI BIAYA WORKFLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SELECT    │───▶│ CALCULATE   │───▶│   REVIEW    │     │
│  │   PERIOD    │    │ DISTRIBUTION│    │   RESULT    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   CHOOSE    │    │   APPLY     │    │   ANALYZE   │     │
│  │   METHOD    │    │ FORMULAS    │    │   IMPACT    │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│         │                        │                         │
│         ▼                        ▼                         ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   SAVE      │    │   EXPORT    │    │   APPROVE   │     │
│  │ DISTRIBUTION│    │   REPORT    │    │ DISTRIBUTION│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Langkah-langkah Distribusi Biaya**

**A. Setup Distribusi**
1. Klik menu "Distribusi Biaya" → "Distribusi Biaya Pertama"
2. Pilih tahun dan bulan
3. Pilih metode distribusi
4. Klik "Generate Distribution"

**B. Review Distribusi**
1. Sistem menampilkan:
   - Biaya yang akan didistribusi
   - Unit penerima distribusi
   - Besaran distribusi per unit
2. Review akurasi perhitungan

**C. Approve dan Export**
1. Approve distribusi jika sudah benar
2. Export report untuk dokumentasi
3. Data bisa digunakan untuk distribusi kedua

---

## 🚨 TROUBLESHOOTING

### **Common Issues & Solutions**

#### **1. Login Issues**
**Problem**: Tidak bisa login
**Solutions**:
- Cek koneksi internet
- Clear browser cache
- Cek username/password
- Hubungi administrator

#### **2. Data Loading Issues**
**Problem**: Data tidak muncul
**Solutions**:
- Refresh halaman
- Cek filter yang dipilih
- Pastikan ada data untuk periode tersebut
- Cek koneksi database

#### **3. Calculation Errors**
**Problem**: Kalkulasi salah
**Solutions**:
- Cek input data
- Pastikan master data sudah lengkap
- Review formula yang digunakan
- Contact technical support

#### **4. Export Issues**
**Problem**: Export gagal
**Solutions**:
- Cek browser popup blocker
- Pastikan ada data untuk diexport
- Coba browser lain
- Cek permission export

---

## 📞 SUPPORT & TRAINING

### **Getting Help**
1. **Documentation**: Lihat Modul Teknis
2. **Training**: Request training session
3. **Technical Support**: Email support team
4. **User Community**: Join user group

### **Best Practices**
1. **Data Backup**: Export data secara berkala
2. **Input Validation**: Double-check data sebelum simpan
3. **Periodic Review**: Review kalkulasi secara berkala
4. **Team Training**: Pastikan semua user terlatih

---

**Dokumentasi ini merupakan bagian dari Modul Teknis Aplikasi Unit Cost RS**

**Versi**: 1.0  
**Tanggal**: Januari 2025  
**Status**: Production Ready
