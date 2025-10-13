# Implementasi Sistem Distribusi Biaya

## 🎯 Overview
Sistem distribusi biaya telah berhasil diimplementasikan dengan fitur lengkap untuk mengelola dasar alokasi dan menghitung distribusi biaya berdasarkan unit kerja.

## 📋 Fitur yang Telah Dibuat

### 1. Database Schema
- **Tabel `Dasar_Alokasi`**: Menyimpan konfigurasi dasar alokasi untuk setiap unit kerja
- **Tabel `Distribusi_Biaya`**: Menyimpan hasil perhitungan distribusi biaya
- **Function `generate_dasar_alokasi_otomatis`**: Generate dasar alokasi otomatis berdasarkan unit kerja
- **Function `hitung_distribusi_biaya`**: Menghitung distribusi biaya berdasarkan rumus yang ditentukan

### 2. Dasar Alokasi Mapping
Sistem secara otomatis menentukan dasar alokasi berdasarkan nama unit kerja:

| Unit Kerja | Dasar Alokasi |
|------------|---------------|
| Direktur | Jumlah_SDM |
| Komite PPI | Jumlah_SDM |
| Komite PMKP | Jumlah_SDM |
| Komite Medik | Total_Kunjungan_Pasien |
| Akreditasi | Jumlah_SDM |
| Dewan Pengawas | Jumlah_SDM |
| Bid Pengembangan | Total_Kunjungan_Pasien |
| Seksi penunjang | Total_Kunjungan_Pasien |
| IPSRS | Luas_Ruangan |
| Bid Keperawatan | Total_Kunjungan_Pasien |
| Seksi asuhan perawatan | Total_Kunjungan_Pasien |
| Seksi pengembangan | Total_Kunjungan_Pasien |
| Bid Pelayanan Medis | Total_Kunjungan_Pasien |
| Seksi pelayanan | Total_Kunjungan_Pasien |
| TPPRJ | Total_Kunjungan_Pasien |
| TPPRI | Total_Kunjungan_Pasien |
| Bag Tata Usaha | Jumlah_SDM |
| Subag Keuangan | Jumlah_SDM |
| Unit Perbendaharaan | Jumlah_SDM |
| Unit Pendapatan | Jumlah_SDM |
| Unit Akuntansi dan Verifikasi | Jumlah_SDM |
| Unit Akuntansi Manajemen | Total_Kunjungan_Pasien |
| Analis Biaya dan tarif | Total_Kunjungan_Pasien |
| Subag umpeg | Jumlah_SDM |
| Staf Umum dan kerjasama | Jumlah_SDM |
| Unit IT | Komputer_simrs_user |
| Rumah Tangga | Jumlah_SDM |
| Cleaning service | Luas_Ruangan |
| Security | Luas_Ruangan |
| Unit Aset | Total_Kunjungan_Pasien |
| Instalasi Humas | Total_Kunjungan_Pasien |
| Subag renval | Jumlah_SDM |
| Staf Renval | Jumlah_SDM |
| Rekam Medik | Jumlah_SDM |

### 3. Rumus Distribusi Biaya
```
Persentase Alokasi = (Nilai Dasar Alokasi Unit Kerja) / (Total Dasar Alokasi untuk Field yang Sama)
Biaya Dialokasikan = Total Biaya × Persentase Alokasi
```

### 4. Halaman Aplikasi

#### A. Halaman Dasar Alokasi (`/dasar-alokasi`)
- **Generate Dasar Alokasi Otomatis**: Membuat dasar alokasi berdasarkan data unit kerja dan data kegiatan
- **Input Total Biaya**: Untuk menghitung distribusi biaya
- **Hitung Distribusi Biaya**: Menjalankan perhitungan distribusi
- **Tabel Dasar Alokasi**: Menampilkan data dasar alokasi dengan preview perhitungan

#### B. Halaman Distribusi Biaya (`/distribusi-biaya`)
- **Laporan Distribusi Biaya**: Menampilkan hasil perhitungan distribusi biaya
- **Summary Berdasarkan Dasar Alokasi**: Ringkasan distribusi berdasarkan jenis dasar alokasi
- **Summary Berdasarkan Kategori**: Ringkasan distribusi berdasarkan kategori unit kerja
- **Detail Distribusi**: Tabel detail distribusi untuk setiap unit kerja
- **Export CSV**: Fitur ekspor data ke format CSV

### 5. TypeScript Types
- `DasarAlokasi`: Interface untuk data dasar alokasi
- `DistribusiBiaya`: Interface untuk data distribusi biaya
- `DASAR_ALOKASI_MAPPING`: Mapping konstan untuk dasar alokasi
- Helper functions untuk menentukan dasar alokasi dan label

## 🚀 Cara Penggunaan

### 1. Setup Database
```sql
-- Jalankan script SQL untuk membuat tabel dan function
\i create-dasar-alokasi-table.sql
```

### 2. Generate Dasar Alokasi
1. Buka halaman **Dasar Alokasi** (`/dasar-alokasi`)
2. Pilih tahun yang diinginkan
3. Klik tombol **"Generate Dasar Alokasi"**
4. Sistem akan otomatis membuat dasar alokasi berdasarkan:
   - Data unit kerja yang ada
   - Data kegiatan untuk tahun tersebut
   - Mapping dasar alokasi yang telah ditentukan

### 3. Hitung Distribusi Biaya
1. Masukkan **Total Biaya** yang akan didistribusikan
2. Klik tombol **"Hitung Distribusi Biaya"**
3. Sistem akan menghitung:
   - Persentase alokasi untuk setiap unit kerja
   - Biaya yang dialokasikan untuk setiap unit kerja

### 4. Lihat Laporan
1. Buka halaman **Distribusi Biaya** (`/distribusi-biaya`)
2. Pilih tahun untuk melihat laporan
3. Laporan menampilkan:
   - Summary berdasarkan dasar alokasi
   - Summary berdasarkan kategori unit kerja
   - Detail distribusi untuk setiap unit kerja
4. Gunakan tombol **"Export CSV"** untuk mengekspor data

## 📊 Struktur Data

### Tabel Dasar_Alokasi
```sql
CREATE TABLE "Dasar_Alokasi" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel Distribusi_Biaya
```sql
CREATE TABLE "Distribusi_Biaya" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Total_Dasar_Alokasi" DECIMAL(15,2) DEFAULT 0,
  "Persentase_Alokasi" DECIMAL(5,4) DEFAULT 0,
  "Biaya_Dialokasikan" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Function Database

### generate_dasar_alokasi_otomatis(tahun_param INTEGER)
- Menghapus data dasar alokasi lama untuk tahun yang sama
- Loop melalui semua unit kerja
- Tentukan dasar alokasi berdasarkan nama unit kerja
- Ambil nilai dari data kegiatan atau unit kerja
- Insert data dasar alokasi

### hitung_distribusi_biaya(tahun_param INTEGER, total_biaya DECIMAL(15,2))
- Menghapus data distribusi biaya lama untuk tahun yang sama
- Hitung total dasar alokasi untuk setiap field
- Hitung persentase alokasi untuk setiap unit kerja
- Hitung biaya yang dialokasikan
- Insert data distribusi biaya

## 📁 File yang Dibuat

1. **`create-dasar-alokasi-table.sql`** - Script SQL untuk membuat tabel dan function
2. **`src/types/dasar-alokasi.ts`** - TypeScript types dan helper functions
3. **`src/components/DasarAlokasiFormTable.tsx`** - Form untuk mengelola dasar alokasi
4. **`src/pages/DasarAlokasi.tsx`** - Halaman dasar alokasi
5. **`src/pages/DistribusiBiaya.tsx`** - Halaman distribusi biaya
6. **`src/App.tsx`** - Updated dengan route baru
7. **`src/components/SidebarNav.tsx`** - Updated dengan menu navigasi baru

## ✅ Status Implementasi

- [x] Analisis struktur database
- [x] Buat tabel dasar alokasi
- [x] Implementasi logika dasar alokasi
- [x] Buat form dasar alokasi
- [x] Implementasi perhitungan distribusi biaya
- [x] Buat halaman distribusi biaya
- [x] Tambahkan navigasi menu
- [x] Buat dokumentasi lengkap

## 🎉 Kesimpulan

Sistem distribusi biaya telah berhasil diimplementasikan dengan fitur lengkap:
- ✅ Generate dasar alokasi otomatis berdasarkan unit kerja
- ✅ Mapping dasar alokasi sesuai dengan spesifikasi
- ✅ Perhitungan distribusi biaya dengan rumus yang benar
- ✅ Interface yang user-friendly
- ✅ Laporan yang komprehensif
- ✅ Fitur ekspor data
- ✅ Dokumentasi lengkap

Sistem siap digunakan untuk mengelola distribusi biaya berdasarkan dasar alokasi yang telah ditentukan.
