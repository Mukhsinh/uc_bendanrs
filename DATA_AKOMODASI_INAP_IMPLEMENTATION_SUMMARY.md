# Data Akomodasi Inap - Implementation Summary

## Overview
Implementasi perubahan tabel `alokasi_biaya_gizi` menjadi `data_akomodasi_inap` dengan penambahan 15 kolom baru dan setup relasi otomatis dengan tabel `data_kegiatan`.

## Perubahan Database

### 1. Penambahan Kolom Baru
Ditambahkan 15 kolom baru ke tabel `alokasi_biaya_gizi`:

#### **Tempat Tidur (5 kolom)**
- `tempat_tidur_svip` (INTEGER, default: 0)
- `tempat_tidur_vip` (INTEGER, default: 0)
- `tempat_tidur_i` (INTEGER, default: 0)
- `tempat_tidur_ii` (INTEGER, default: 0)
- `tempat_tidur_iii` (INTEGER, default: 0)

#### **Jumlah Porsi (5 kolom)**
- `jumlah_porsi_svip` (INTEGER, default: 0)
- `jumlah_porsi_vip` (INTEGER, default: 0)
- `jumlah_porsi_i` (INTEGER, default: 0)
- `jumlah_porsi_ii` (INTEGER, default: 0)
- `jumlah_porsi_iii` (INTEGER, default: 0)

#### **Kamar Luas (5 kolom)**
- `kamar_luas_svip` (DOUBLE PRECISION, default: 0)
- `kamar_luas_vip` (DOUBLE PRECISION, default: 0)
- `kamar_luas_i` (DOUBLE PRECISION, default: 0)
- `kamar_luas_ii` (DOUBLE PRECISION, default: 0)
- `kamar_luas_iii` (DOUBLE PRECISION, default: 0)

### 2. Rename Tabel
- **Dari**: `alokasi_biaya_gizi`
- **Menjadi**: `data_akomodasi_inap`

### 3. Auto-Sync dengan Data Kegiatan
Dibuat sistem auto-sync yang akan:
- **Trigger**: Setiap ada INSERT atau UPDATE di tabel `data_kegiatan`
- **Fungsi**: `sync_data_akomodasi_inap_from_data_kegiatan()`
- **Constraint**: Unique constraint pada `(tahun, kode_unit_kerja, user_id)`

#### **Mapping Data dari data_kegiatan ke data_akomodasi_inap**:
```sql
-- Tempat Tidur
tempat_tidur_svip = Tempat_Tidur_SVIP
tempat_tidur_vip = Tempat_Tidur_VIP
tempat_tidur_i = Tempat_Tidur_I
tempat_tidur_ii = Tempat_Tidur_II
tempat_tidur_iii = Tempat_Tidur_III

-- Jumlah Porsi
jumlah_porsi_svip = jumlah_porsi_svip
jumlah_porsi_vip = jumlah_porsi_vip
jumlah_porsi_i = jumlah_porsi_i
jumlah_porsi_ii = jumlah_porsi_ii
jumlah_porsi_iii = jumlah_porsi_iii

-- Kamar Luas
kamar_luas_svip = kamar_luas_svip
kamar_luas_vip = kamar_luas_vip
kamar_luas_i = kamar_luas_i
kamar_luas_ii = kamar_luas_ii
kamar_luas_iii = kamar_luas_iii

-- Hari Rawat
hari_rawat_vvip = Hari_Rawat_SVIP
hari_rawat_vip = Hari_Rawat_VIP
hari_rawat_i = Hari_Rawat_I
hari_rawat_ii = Hari_Rawat_II
hari_rawat_iii = Hari_Rawat_III
```

## Perubahan Aplikasi

### 1. File yang Diupdate
- **`src/pages/AlokasiBiayaGizi.tsx`**

### 2. Perubahan Interface
Ditambahkan kolom baru ke interface `AlokasiBiayaGiziData`:
```typescript
// Kolom baru untuk tempat tidur
tempat_tidur_svip: number;
tempat_tidur_vip: number;
tempat_tidur_i: number;
tempat_tidur_ii: number;
tempat_tidur_iii: number;
// Kolom baru untuk jumlah porsi
jumlah_porsi_svip: number;
jumlah_porsi_vip: number;
jumlah_porsi_i: number;
jumlah_porsi_ii: number;
jumlah_porsi_iii: number;
// Kolom baru untuk kamar luas
kamar_luas_svip: number;
kamar_luas_vip: number;
kamar_luas_i: number;
kamar_luas_ii: number;
kamar_luas_iii: number;
```

### 3. Perubahan Query Database
- **Dari**: `supabase.from("alokasi_biaya_gizi")`
- **Menjadi**: `supabase.from("data_akomodasi_inap")`

### 4. Update UI Tabel
Ditambahkan kolom baru di tabel:
- **Tempat Tidur**: Menampilkan data tempat tidur per kelas (SVIP, VIP, I, II, III)
- **Kamar Luas**: Menampilkan luas kamar per kelas dalam m²
- **Jumlah Porsi**: Menampilkan jumlah porsi per kelas

### 5. Update Export Excel
Ditambahkan kolom baru di export Excel:
```typescript
// Data tempat tidur
"Tempat Tidur SVIP": row.tempat_tidur_svip,
"Tempat Tidur VIP": row.tempat_tidur_vip,
"Tempat Tidur I": row.tempat_tidur_i,
"Tempat Tidur II": row.tempat_tidur_ii,
"Tempat Tidur III": row.tempat_tidur_iii,
// Data jumlah porsi
"Jumlah Porsi SVIP": row.jumlah_porsi_svip,
"Jumlah Porsi VIP": row.jumlah_porsi_vip,
"Jumlah Porsi I": row.jumlah_porsi_i,
"Jumlah Porsi II": row.jumlah_porsi_ii,
"Jumlah Porsi III": row.jumlah_porsi_iii,
// Data kamar luas
"Kamar Luas SVIP": row.kamar_luas_svip,
"Kamar Luas VIP": row.kamar_luas_vip,
"Kamar Luas I": row.kamar_luas_i,
"Kamar Luas II": row.kamar_luas_ii,
"Kamar Luas III": row.kamar_luas_iii,
```

### 6. Update Nama dan Deskripsi
- **Judul Halaman**: "Alokasi Biaya Gizi" → "Data Akomodasi Inap"
- **Deskripsi**: "Kelola alokasi biaya gizi per unit kerja rawat inap" → "Kelola data akomodasi inap per unit kerja rawat inap"
- **Nama File Export**: `alokasi_biaya_gizi_YYYY-MM-DD.xlsx` → `data_akomodasi_inap_YYYY-MM-DD.xlsx`

## Fitur Auto-Sync

### 1. Trigger Function
```sql
CREATE TRIGGER trigger_sync_data_akomodasi_inap
  AFTER INSERT OR UPDATE ON data_kegiatan
  FOR EACH ROW
  EXECUTE FUNCTION sync_data_akomodasi_inap_from_data_kegiatan();
```

### 2. Sync Function
- **Input**: Data dari tabel `data_kegiatan`
- **Output**: Insert/Update data di tabel `data_akomodasi_inap`
- **Logic**: 
  - Jika data belum ada → INSERT
  - Jika data sudah ada → UPDATE
  - Menggunakan ON CONFLICT untuk handling duplicate

### 3. Computed Columns
Tabel `data_akomodasi_inap` memiliki beberapa computed columns yang tidak diupdate oleh sync:
- `jumlah_porsi_pasien_vvip` (GENERATED ALWAYS AS)
- `jumlah_porsi_pasien_vip` (GENERATED ALWAYS AS)
- `jumlah_porsi_pasien_i` (GENERATED ALWAYS AS)
- `jumlah_porsi_pasien_ii` (GENERATED ALWAYS AS)
- `jumlah_porsi_pasien_iii` (GENERATED ALWAYS AS)
- `jumlah_kali_porsi_*` (GENERATED ALWAYS AS)
- `total_gizi` (GENERATED ALWAYS AS)

## Data Verification

### 1. Data Sync Status
Data telah berhasil tersync dari `data_kegiatan` ke `data_akomodasi_inap`:
- ✅ Data tempat tidur tersync
- ✅ Data jumlah porsi tersync
- ✅ Data kamar luas tersync
- ✅ Data hari rawat tersync

### 2. Sample Data
Contoh data yang tersync:
```sql
-- Unit: Jlamprang (UK049)
tempat_tidur_i: 8, tempat_tidur_ii: 8, tempat_tidur_iii: 24
jumlah_porsi_i: 3780, jumlah_porsi_ii: 4511, jumlah_porsi_iii: 26939
kamar_luas_i: 133.92, kamar_luas_ii: 133.92, kamar_luas_iii: 178.56

-- Unit: Perinatologi (UK051)
tempat_tidur_i: 2, tempat_tidur_ii: 10
kamar_luas_ii: 32.47
```

## Benefits

### 1. **Data Consistency**
- Data otomatis tersinkronisasi antara `data_kegiatan` dan `data_akomodasi_inap`
- Tidak ada data yang terlewat atau tidak konsisten

### 2. **Real-time Updates**
- Setiap perubahan di `data_kegiatan` langsung terupdate di `data_akomodasi_inap`
- Tidak perlu manual sync atau refresh

### 3. **Comprehensive Data**
- Data akomodasi inap sekarang mencakup semua informasi yang diperlukan
- Tempat tidur, jumlah porsi, dan luas kamar tersedia dalam satu tabel

### 4. **Better Naming**
- Nama tabel `data_akomodasi_inap` lebih deskriptif
- Mencerminkan fungsi tabel yang sebenarnya

## Migration Summary

### ✅ Completed Tasks:
1. **Database Schema Updates**
   - ✅ Added 15 new columns to table
   - ✅ Renamed table from `alokasi_biaya_gizi` to `data_akomodasi_inap`
   - ✅ Created auto-sync function
   - ✅ Created trigger for auto-sync
   - ✅ Added unique constraint
   - ✅ Synced existing data

2. **Application Updates**
   - ✅ Updated interface definitions
   - ✅ Updated database queries
   - ✅ Updated UI table display
   - ✅ Updated export functionality
   - ✅ Updated page titles and descriptions

3. **Data Verification**
   - ✅ Verified data sync is working
   - ✅ Confirmed new columns are populated
   - ✅ Tested auto-sync functionality

### 🎯 **Implementation Status: COMPLETE**

Semua perubahan telah berhasil diimplementasikan dan data akomodasi inap sekarang tersinkronisasi otomatis dengan data kegiatan!
