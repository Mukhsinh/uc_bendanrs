# Dokumentasi Update Kolom Data Kegiatan

## Overview
Dokumentasi ini menjelaskan penambahan 10 kolom baru ke tabel `data_kegiatan` dan penyesuaian aplikasi untuk mendukung kolom-kolom tersebut.

## Kolom Baru yang Ditambahkan

### 1. Kelompok 'Aktifitas Pendukung' - Jumlah Porsi
- `jumlah_porsi_svip` (INTEGER, default: 0)
- `jumlah_porsi_vip` (INTEGER, default: 0)
- `jumlah_porsi_i` (INTEGER, default: 0)
- `jumlah_porsi_ii` (INTEGER, default: 0)
- `jumlah_porsi_iii` (INTEGER, default: 0)

### 2. Kelompok 'Fasilitas dan Infrastruktur' - Kamar Luas
- `kamar_luas_svip` (DOUBLE PRECISION, default: 0)
- `kamar_luas_vip` (DOUBLE PRECISION, default: 0)
- `kamar_luas_i` (DOUBLE PRECISION, default: 0)
- `kamar_luas_ii` (DOUBLE PRECISION, default: 0)
- `kamar_luas_iii` (DOUBLE PRECISION, default: 0)

## Perubahan Database

### Migration yang Diterapkan
```sql
-- Menambahkan kolom-kolom baru ke tabel data_kegiatan
ALTER TABLE data_kegiatan 
ADD COLUMN IF NOT EXISTS jumlah_porsi_SVIP INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jumlah_porsi_VIP INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jumlah_porsi_I INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jumlah_porsi_II INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jumlah_porsi_III INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kamar_luas_SVIP DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS kamar_luas_VIP DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS kamar_luas_I DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS kamar_luas_II DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS kamar_luas_III DOUBLE PRECISION DEFAULT 0;
```

### Verifikasi Kolom
Semua kolom berhasil ditambahkan dengan tipe data dan default value yang sesuai.

## Perubahan Aplikasi

### 1. Interface DataKegiatan
Menambahkan field-field baru ke interface TypeScript:
```typescript
// 10. Aktifitas Pendukung - Jumlah Porsi
jumlah_porsi_svip?: number | null;
jumlah_porsi_vip?: number | null;
jumlah_porsi_i?: number | null;
jumlah_porsi_ii?: number | null;
jumlah_porsi_iii?: number | null;
// 11. Fasilitas dan Infrastruktur - Kamar Luas
kamar_luas_svip?: number | null;
kamar_luas_vip?: number | null;
kamar_luas_i?: number | null;
kamar_luas_ii?: number | null;
kamar_luas_iii?: number | null;
```

### 2. Form Schema Validation
Menambahkan validasi untuk field-field baru menggunakan Zod:
```typescript
// Aktifitas Pendukung - Jumlah Porsi
jumlah_porsi_svip: z.coerce.number().min(0).optional(),
jumlah_porsi_vip: z.coerce.number().min(0).optional(),
jumlah_porsi_i: z.coerce.number().min(0).optional(),
jumlah_porsi_ii: z.coerce.number().min(0).optional(),
jumlah_porsi_iii: z.coerce.number().min(0).optional(),
// Fasilitas dan Infrastruktur - Kamar Luas
kamar_luas_svip: z.coerce.number().min(0).optional(),
kamar_luas_vip: z.coerce.number().min(0).optional(),
kamar_luas_i: z.coerce.number().min(0).optional(),
kamar_luas_ii: z.coerce.number().min(0).optional(),
kamar_luas_iii: z.coerce.number().min(0).optional(),
```

### 3. Form UI Components
Menambahkan form fields untuk input manual:

#### Jumlah Porsi Section
- FormField untuk `jumlah_porsi_svip`
- FormField untuk `jumlah_porsi_vip`
- FormField untuk `jumlah_porsi_i`
- FormField untuk `jumlah_porsi_ii`
- FormField untuk `jumlah_porsi_iii`

#### Kamar Luas Section
- FormField untuk `kamar_luas_svip` (dengan step="0.01" untuk decimal)
- FormField untuk `kamar_luas_vip` (dengan step="0.01" untuk decimal)
- FormField untuk `kamar_luas_i` (dengan step="0.01" untuk decimal)
- FormField untuk `kamar_luas_ii` (dengan step="0.01" untuk decimal)
- FormField untuk `kamar_luas_iii` (dengan step="0.01" untuk decimal)

### 4. Template Import Data

#### Template dengan Data Master
Menambahkan kolom-kolom baru ke template CSV yang diunduh dengan data master:
```typescript
jumlah_porsi_svip: "",
jumlah_porsi_vip: "",
jumlah_porsi_i: "",
jumlah_porsi_ii: "",
jumlah_porsi_iii: "",
kamar_luas_svip: "",
kamar_luas_vip: "",
kamar_luas_i: "",
kamar_luas_ii: "",
kamar_luas_iii: "",
```

#### Template Kosong
Menambahkan header untuk kolom-kolom baru:
```typescript
"jumlah_porsi_svip", "jumlah_porsi_vip", "jumlah_porsi_i", "jumlah_porsi_ii", "jumlah_porsi_iii",
"kamar_luas_svip", "kamar_luas_vip", "kamar_luas_i", "kamar_luas_ii", "kamar_luas_iii",
```

### 5. Import Data Processing
Memperbarui fungsi import untuk memproses kolom-kolom baru:
```typescript
// Aktifitas Pendukung - Jumlah Porsi
jumlah_porsi_svip: parseFloat(row["jumlah_porsi_svip"]) || 0,
jumlah_porsi_vip: parseFloat(row["jumlah_porsi_vip"]) || 0,
jumlah_porsi_i: parseFloat(row["jumlah_porsi_i"]) || 0,
jumlah_porsi_ii: parseFloat(row["jumlah_porsi_ii"]) || 0,
jumlah_porsi_iii: parseFloat(row["jumlah_porsi_iii"]) || 0,
// Fasilitas dan Infrastruktur - Kamar Luas
kamar_luas_svip: parseFloat(row["kamar_luas_svip"]) || 0,
kamar_luas_vip: parseFloat(row["kamar_luas_vip"]) || 0,
kamar_luas_i: parseFloat(row["kamar_luas_i"]) || 0,
kamar_luas_ii: parseFloat(row["kamar_luas_ii"]) || 0,
kamar_luas_iii: parseFloat(row["kamar_luas_iii"]) || 0,
```

### 6. Report Download
Menambahkan kolom-kolom baru ke laporan CSV yang diunduh:
```typescript
"Kamar Luas SVIP": item.kamar_luas_svip || 0,
"Kamar Luas VIP": item.kamar_luas_vip || 0,
"Kamar Luas I": item.kamar_luas_i || 0,
"Kamar Luas II": item.kamar_luas_ii || 0,
"Kamar Luas III": item.kamar_luas_iii || 0,
"Jumlah Porsi SVIP": item.jumlah_porsi_svip || 0,
"Jumlah Porsi VIP": item.jumlah_porsi_vip || 0,
"Jumlah Porsi I": item.jumlah_porsi_i || 0,
"Jumlah Porsi II": item.jumlah_porsi_ii || 0,
"Jumlah Porsi III": item.jumlah_porsi_iii || 0,
```

### 7. Form Reset Functions
Memperbarui fungsi reset form untuk field-field baru:
- Reset form kosong untuk input baru
- Reset form dengan data existing untuk editing

## Testing

### Verifikasi Database
- ✅ Kolom-kolom berhasil ditambahkan ke database
- ✅ Tipe data sesuai dengan spesifikasi
- ✅ Default value diterapkan dengan benar

### Verifikasi Aplikasi
- ✅ Interface TypeScript diperbarui
- ✅ Form validation berfungsi
- ✅ Form UI menampilkan field-field baru
- ✅ Template import diperbarui
- ✅ Import data memproses kolom baru
- ✅ Report download menyertakan kolom baru
- ✅ Tidak ada error linting

## Cara Penggunaan

### 1. Input Manual
1. Buka halaman Data Kegiatan
2. Klik "Tambah Data Kegiatan"
3. Isi form dengan data yang diperlukan
4. Field-field baru tersedia di section:
   - "Jumlah Porsi" (untuk jumlah porsi per kelas kamar)
   - "Kamar Luas (m²)" (untuk luas kamar per kelas)

### 2. Import Data
1. Download template CSV (dengan data master atau kosong)
2. Template sudah menyertakan kolom-kolom baru
3. Isi data untuk kolom-kolom baru sesuai kebutuhan
4. Upload file CSV untuk import data

### 3. Download Laporan
1. Klik tombol "Unduh Laporan"
2. File CSV yang diunduh menyertakan semua kolom baru
3. Data dapat digunakan untuk analisis lebih lanjut

## Catatan Penting

1. **Nama Kolom**: Semua nama kolom menggunakan lowercase untuk konsistensi dengan database
2. **Tipe Data**: 
   - Jumlah porsi menggunakan INTEGER
   - Kamar luas menggunakan DOUBLE PRECISION untuk mendukung nilai desimal
3. **Default Value**: Semua kolom baru memiliki default value 0
4. **Validasi**: Semua field memiliki validasi minimum 0
5. **Backward Compatibility**: Perubahan ini tidak mempengaruhi data existing

## Status Implementasi

- ✅ Database schema updated
- ✅ Interface TypeScript updated
- ✅ Form validation updated
- ✅ Form UI updated
- ✅ Import template updated
- ✅ Import processing updated
- ✅ Report download updated
- ✅ Testing completed
- ✅ No linting errors

Implementasi telah selesai dan siap digunakan.
