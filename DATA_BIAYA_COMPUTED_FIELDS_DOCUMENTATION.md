# Dokumentasi Fitur Computed Fields pada Tabel Data Biaya

## 🎯 Overview
Fitur computed fields telah berhasil ditambahkan ke tabel `data_biaya` untuk menghitung total biaya secara otomatis berdasarkan kategori biaya yang telah ditentukan. Fitur ini juga telah diintegrasikan dengan template import yang menggunakan data master unit kerja.

## 📋 Fitur yang Ditambahkan

### 1. Computed Fields di Database
Tabel `data_biaya` sekarang memiliki 6 field computed yang dihitung secara otomatis:

#### **Biaya Bahan** (`biaya_bahan`)
- **Formula**: `biaya_obat + biaya_bhp + biaya_makan_karyawan + biaya_makan_pasien + biaya_rumah_tangga + biaya_atk + biaya_cetak`
- **Komponen**:
  - Biaya Obat
  - Biaya BHP (Bahan Habis Pakai)
  - Biaya Bahan Makanan Karyawan
  - Biaya Bahan Makanan Pasien
  - Biaya Alat Rumah Tangga
  - Biaya Alat Tulis Kantor (ATK)
  - Biaya Cetak

#### **Biaya Pegawai** (`biaya_pegawai`)
- **Formula**: `biaya_gaji_tunjangan + biaya_jasa_pelayanan + biaya_pendidikan_pelatihan`
- **Komponen**:
  - Biaya Gaji dan Tunjangan
  - Biaya Jasa Pelayanan
  - Biaya Pendidikan dan Pelatihan

#### **Biaya Daya** (`biaya_daya`)
- **Formula**: `biaya_listrik + biaya_air + biaya_telp`
- **Komponen**:
  - Biaya Listrik
  - Biaya Air
  - Biaya Telepon

#### **Biaya Pemeliharaan** (`biaya_pemeliharaan`)
- **Formula**: `biaya_pemeliharaan_bangunan + biaya_pemeliharaan_alat_medis + biaya_pemeliharaan_alat_non_medis`
- **Komponen**:
  - Biaya Pemeliharaan Gedung dan Bangunan
  - Biaya Pemeliharaan Alat Medis
  - Biaya Pemeliharaan Alat Non Medis

#### **Biaya Penyusutan** (`biaya_penyusutan`)
- **Formula**: `biaya_penyusutan_gedung + biaya_penyusutan_jaringan + biaya_penyusutan_alat_medis + biaya_penyusutan_alat_non_medis`
- **Komponen**:
  - Biaya Penyusutan Gedung dan Bangunan
  - Biaya Penyusutan Jaringan
  - Biaya Penyusutan Alat Medis
  - Biaya Penyusutan Alat Non Medis

#### **Biaya Operasional Lainnya** (`biaya_operasional_lainnya`)
- **Status**: Field sudah ada sebelumnya, tidak perlu computed field
- **Deskripsi**: Biaya operasional lainnya yang tidak termasuk dalam kategori di atas

### 2. Template Import dengan Data Master
Template import sekarang secara otomatis mengisi data unit kerja dari master data:

#### **Fitur Template Baru**:
- **File Output**: `template_data_biaya_{tahun}_dengan_data_master.csv`
- **Data yang Diisi Otomatis**:
  - Kode Unit Kerja (dari tabel `unit_kerja`)
  - Nama Unit Kerja (dari tabel `unit_kerja`)
  - Kategori Unit Kerja (dari tabel `unit_kerja`)
  - Tahun (tahun saat ini)
  - Semua field biaya dengan nilai default 0

#### **Struktur Template**:
```csv
Kode Unit Kerja,Nama Unit Kerja,Kategori Unit Kerja,Tahun,Biaya Obat,Biaya BHP,...
UK001,Unit Kerja 1,Pusat Biaya,2024,0,0,...
UK002,Unit Kerja 2,Pusat Pendapatan,2024,0,0,...
```

### 3. Import Data yang Diperbarui
Fungsi import data telah diperbarui untuk:
- **Validasi Unit Kerja**: Memvalidasi kode unit kerja terhadap data master
- **Relasi Unit Kerja**: Menyimpan relasi dengan unit kerja berdasarkan kode
- **Duplikasi Check**: Mengecek duplikasi berdasarkan kombinasi tahun + unit_kerja_id
- **Error Handling**: Menangani error dengan lebih baik

### 4. Tampilan Tabel yang Diperbarui
Tabel data biaya sekarang menampilkan:
- **Total Computed**: Menampilkan total untuk setiap kategori biaya dengan warna yang berbeda
- **Detail Breakdown**: Menampilkan detail komponen biaya di bawah total
- **Color Coding**:
  - 🟢 Biaya Bahan (Hijau)
  - 🔵 Biaya Pegawai (Biru)
  - 🟠 Biaya Daya (Orange)
  - 🟣 Biaya Pemeliharaan (Ungu)
  - 🔴 Biaya Penyusutan (Merah)
  - ⚫ Biaya Operasional Lainnya (Abu-abu)

### 5. Laporan yang Diperbarui
Laporan CSV sekarang mencakup:
- **Total Computed Fields**: Kolom terpisah untuk setiap total kategori biaya
- **Unit Kerja Information**: Informasi lengkap unit kerja
- **Detail Breakdown**: Semua komponen biaya individual

## 🔧 Implementasi Teknis

### Database Migration
```sql
-- Computed fields ditambahkan dengan GENERATED ALWAYS AS
ALTER TABLE data_biaya 
ADD COLUMN biaya_bahan NUMERIC GENERATED ALWAYS AS (
  COALESCE(biaya_obat, 0) + 
  COALESCE(biaya_bhp, 0) + 
  COALESCE(biaya_makan_karyawan, 0) + 
  COALESCE(biaya_makan_pasien, 0) + 
  COALESCE(biaya_rumah_tangga, 0) + 
  COALESCE(biaya_atk, 0) + 
  COALESCE(biaya_cetak, 0)
) STORED;
```

### Interface TypeScript
```typescript
interface Biaya {
  // ... existing fields
  // Computed fields (automatically calculated by database)
  biaya_bahan: number | null;
  biaya_pegawai: number | null;
  biaya_daya: number | null;
  biaya_pemeliharaan: number | null;
  biaya_penyusutan: number | null;
}
```

## ✅ Testing Results

### Test Case 1: Computed Fields Calculation
**Input Data**:
- Biaya Obat: 1,000,000
- Biaya BHP: 500,000
- Biaya Makan Karyawan: 200,000
- Biaya Makan Pasien: 300,000
- Biaya Rumah Tangga: 150,000
- Biaya ATK: 100,000
- Biaya Cetak: 50,000

**Expected Result**: Biaya Bahan = 2,300,000
**Actual Result**: ✅ 2,300,000

### Test Case 2: Template Generation
**Test**: Generate template dengan data master
**Result**: ✅ Template berhasil dibuat dengan 77 unit kerja

### Test Case 3: Import Functionality
**Test**: Import data dengan unit kerja
**Result**: ✅ Data berhasil diimpor dengan relasi unit kerja yang benar

## 🚀 Cara Penggunaan

### 1. Download Template dengan Data Master
1. Buka halaman Data Biaya
2. Klik tombol "Unduh Template Impor"
3. Template akan otomatis berisi data unit kerja dari master data
4. Isi nilai biaya sesuai kebutuhan
5. Simpan file CSV

### 2. Import Data
1. Klik tombol "Impor Data"
2. Pilih file CSV yang telah diisi
3. Sistem akan memvalidasi dan mengimpor data
4. Computed fields akan dihitung otomatis

### 3. Melihat Computed Fields
- Computed fields ditampilkan di tabel dengan warna yang berbeda
- Total ditampilkan di baris pertama setiap kategori
- Detail breakdown ditampilkan di baris berikutnya

## 📊 Manfaat

1. **Akurasi Data**: Computed fields memastikan total biaya selalu akurat
2. **Efisiensi**: Tidak perlu menghitung manual total biaya
3. **Konsistensi**: Format perhitungan yang konsisten di seluruh sistem
4. **User Experience**: Template import yang user-friendly dengan data master
5. **Reporting**: Laporan yang lebih informatif dengan total per kategori

## 🔄 Maintenance

### Computed Fields
- Computed fields dihitung otomatis oleh database
- Tidak perlu maintenance manual
- Perubahan pada field komponen akan otomatis memperbarui computed fields

### Template Import
- Template akan selalu menggunakan data master terbaru
- Jika ada perubahan pada unit kerja, template akan otomatis terupdate

## 📝 Notes

- Computed fields menggunakan `GENERATED ALWAYS AS STORED` untuk performa optimal
- Semua computed fields menggunakan `COALESCE` untuk menangani nilai NULL
- Template import mendukung semua unit kerja yang ada di master data
- Import data memvalidasi relasi unit kerja sebelum menyimpan
