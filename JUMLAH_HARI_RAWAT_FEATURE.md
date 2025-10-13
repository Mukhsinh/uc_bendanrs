# Fitur Jumlah Hari Rawat - Dokumentasi

## 🎯 Overview
Fitur ini menambahkan field `Jumlah_Hari_Rawat` pada tabel data kegiatan yang merupakan penjumlahan otomatis dari field hari rawat untuk semua kelas (SVIP, VIP, I, II, III).

## 📋 Perubahan yang Dibuat

### 1. Database Schema
- **Migration**: `add_jumlah_hari_rawat_field`
- **Field Baru**: `Jumlah_Hari_Rawat` dengan tipe `INTEGER GENERATED ALWAYS AS STORED`
- **Rumus**: `COALESCE("Hari_Rawat_SVIP", 0) + COALESCE("Hari_Rawat_VIP", 0) + COALESCE("Hari_Rawat_I", 0) + COALESCE("Hari_Rawat_II", 0) + COALESCE("Hari_Rawat_III", 0)`

### 2. TypeScript Interface
- **File**: `src/types/data-kegiatan.ts`
- **Perubahan**: Menambahkan `Jumlah_Hari_Rawat?: number | null;` ke interface `DataKegiatan`

### 3. Komponen DataKegiatanFormTable
- **File**: `src/components/DataKegiatanFormTable.tsx`
- **Perubahan**:
  - Menambahkan field `Jumlah_Hari_Rawat` ke interface lokal
  - Menambahkan field ke form schema dengan validasi
  - Menambahkan input field yang read-only dengan auto-calculation
  - Menambahkan useEffect untuk auto-calculate ketika field hari rawat berubah
  - Menambahkan field ke breakdown data untuk preview
  - Menambahkan field ke template import/export
  - Menambahkan field ke laporan

### 4. Preview Manajemen Data
- **Lokasi**: Preview expandable rows dalam tabel data kegiatan
- **Fitur**: Menampilkan "Total Hari Rawat" dengan highlight khusus (warna biru, font bold)
- **Pengelompokan**: Field ditampilkan dalam grup "Fasilitas & Infrastruktur" → "Hari Rawat"

## 🔧 Cara Kerja

### Auto-Calculation
1. Field `Jumlah_Hari_Rawat` dihitung otomatis di database level menggunakan generated column
2. Di form, field ini juga dihitung real-time menggunakan useEffect yang watch perubahan field hari rawat
3. Field input dibuat read-only dengan background abu-abu untuk menunjukkan bahwa ini adalah hasil perhitungan

### Preview Display
1. Dalam preview manajemen data, total hari rawat ditampilkan dengan styling khusus
2. Ditampilkan di bawah detail hari rawat per kelas
3. Menggunakan border dan warna yang berbeda untuk menonjolkan hasil perhitungan

### Import/Export
1. Field `Jumlah_Hari_Rawat` disertakan dalam template import
2. Field ini juga disertakan dalam laporan export
3. Nilai akan dihitung otomatis saat data disimpan

## 📊 Contoh Penggunaan

### Input Data
```
Hari Rawat SVIP: 10
Hari Rawat VIP: 15
Hari Rawat I: 25
Hari Rawat II: 30
Hari Rawat III: 20
Jumlah Hari Rawat (Total): 100 (otomatis)
```

### Preview Display
```
Hari Rawat:
SVIP: 10    VIP: 15
I: 25       II: 30
III: 20

Total Hari Rawat: 100
```

## ✅ Status Implementasi
- [x] Database migration
- [x] TypeScript interface update
- [x] Form component update
- [x] Auto-calculation logic
- [x] Preview display
- [x] Import/Export support
- [x] Template update

## 🚀 Testing
Untuk menguji fitur ini:
1. Buka halaman Data Kegiatan
2. Tambah/edit data kegiatan
3. Isi field hari rawat untuk berbagai kelas
4. Perhatikan field "Jumlah Hari Rawat (Total)" terisi otomatis
5. Simpan data dan lihat preview untuk memastikan total ditampilkan dengan benar
6. Test import/export untuk memastikan field disertakan dalam template dan laporan
