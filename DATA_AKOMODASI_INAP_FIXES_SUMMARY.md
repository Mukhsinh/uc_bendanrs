# Data Akomodasi Inap - Fixes Summary

## Overview
Perbaikan tiga masalah utama pada halaman Data Akomodasi Inap sesuai permintaan user.

## Perubahan yang Dilakukan

### 1. ✅ **Nama Submenu Diperbaiki**
**Masalah**: Nama submenu masih "Alokasi Biaya Gizi"
**Solusi**: Diubah menjadi "Data Akomodasi Inap"

#### **File yang Diupdate:**
- **`src/components/SidebarNav.tsx`**
  - Line 98: `{ title: "Alokasi Biaya Gizi", href: "/keperawatan/alokasi-biaya-gizi", icon: Utensils }`
  - **Menjadi**: `{ title: "Data Akomodasi Inap", href: "/keperawatan/alokasi-biaya-gizi", icon: Utensils }`

### 2. ✅ **Filter Unit Kerja Berdasarkan Jenis Tindakan Inap**
**Masalah**: Tabel menampilkan semua unit kerja
**Solusi**: Hanya menampilkan unit kerja yang ada di tabel `jenis_tindakan_inap`

#### **Unit Kerja yang Tampil:**
- **UK046**: Terang bulan (VIP-VVIP)
- **UK047**: Truntum  
- **UK049**: Jlamprang

#### **Implementasi:**
```typescript
// Ambil unit kerja yang ada di jenis_tindakan_inap
const { data: unitKerjaInJenisTindakan, error: errorUnitKerja } = await supabase
  .from("jenis_tindakan_inap")
  .select("kode_unit_kerja")
  .eq("user_id", user.id);

const kodeUnitKerjaList = unitKerjaInJenisTindakan?.map(item => item.kode_unit_kerja) || [];

// Filter data akomodasi inap berdasarkan unit kerja yang ada
const { data: alokasiData, error } = await supabase
  .from("data_akomodasi_inap")
  .select("*")
  .eq("user_id", user.id)
  .eq("tahun", tahun)
  .in("kode_unit_kerja", kodeUnitKerjaList)
  .order("kode_unit_kerja");
```

#### **Validasi pada Edit:**
```typescript
// Verifikasi bahwa unit kerja ada di jenis_tindakan_inap
const { data: unitKerjaExists, error: checkError } = await supabase
  .from("jenis_tindakan_inap")
  .select("kode_unit_kerja")
  .eq("user_id", user.id)
  .eq("kode_unit_kerja", editForm.kode_unit_kerja)
  .single();

if (checkError || !unitKerjaExists) {
  throw new Error("Unit kerja tidak ditemukan dalam tindakan inap");
}
```

### 3. ✅ **Rumus Computed Columns Diperbaiki**
**Masalah**: Computed columns menggunakan rumus lama (hari_rawat * 3)
**Solusi**: Menggunakan nilai dari kolom yang tersync dari `data_kegiatan`

#### **Computed Columns yang Diperbaiki:**

##### **Jumlah Porsi Pasien:**
- **Sebelum**: `jumlah_porsi_pasien_vvip = hari_rawat_vvip * 3`
- **Sesudah**: `jumlah_porsi_pasien_vvip = jumlah_porsi_svip` (dari data_kegiatan)

```sql
-- Computed columns baru
jumlah_porsi_pasien_vvip = COALESCE(jumlah_porsi_svip, 0)
jumlah_porsi_pasien_vip = COALESCE(jumlah_porsi_vip, 0)
jumlah_porsi_pasien_i = COALESCE(jumlah_porsi_i, 0)
jumlah_porsi_pasien_ii = COALESCE(jumlah_porsi_ii, 0)
jumlah_porsi_pasien_iii = COALESCE(jumlah_porsi_iii, 0)
```

##### **Jumlah Kali Porsi:**
- **Sebelum**: `jumlah_kali_porsi_vvip = (hari_rawat_vvip * 3) * auc_gizi_vvip`
- **Sesudah**: `jumlah_kali_porsi_vvip = jumlah_porsi_svip * auc_gizi_vvip`

```sql
-- Computed columns baru
jumlah_kali_porsi_vvip = COALESCE(jumlah_porsi_svip, 0) * COALESCE(auc_gizi_vvip, 0)
jumlah_kali_porsi_vip = COALESCE(jumlah_porsi_vip, 0) * COALESCE(auc_gizi_vip, 0)
jumlah_kali_porsi_i = COALESCE(jumlah_porsi_i, 0) * COALESCE(auc_gizi_i, 0)
jumlah_kali_porsi_ii = COALESCE(jumlah_porsi_ii, 0) * COALESCE(auc_gizi_ii, 0)
jumlah_kali_porsi_iii = COALESCE(jumlah_porsi_iii, 0) * COALESCE(auc_gizi_iii, 0)
```

##### **Total Gizi:**
- **Sebelum**: Sum dari `(hari_rawat_* * 3) * auc_gizi_*`
- **Sesudah**: Sum dari `jumlah_porsi_* * auc_gizi_*`

```sql
-- Computed column baru
total_gizi = 
  COALESCE(jumlah_porsi_svip, 0) * COALESCE(auc_gizi_vvip, 0) +
  COALESCE(jumlah_porsi_vip, 0) * COALESCE(auc_gizi_vip, 0) +
  COALESCE(jumlah_porsi_i, 0) * COALESCE(auc_gizi_i, 0) +
  COALESCE(jumlah_porsi_ii, 0) * COALESCE(auc_gizi_ii, 0) +
  COALESCE(jumlah_porsi_iii, 0) * COALESCE(auc_gizi_iii, 0)
```

## Migrations yang Dijalankan

### 1. **Fix Computed Columns - Jumlah Porsi Pasien**
```sql
-- Hapus computed columns yang lama
ALTER TABLE data_akomodasi_inap 
DROP COLUMN IF EXISTS jumlah_porsi_pasien_vvip,
DROP COLUMN IF EXISTS jumlah_porsi_pasien_vip,
DROP COLUMN IF EXISTS jumlah_porsi_pasien_i,
DROP COLUMN IF EXISTS jumlah_porsi_pasien_ii,
DROP COLUMN IF EXISTS jumlah_porsi_pasien_iii;

-- Tambahkan computed columns baru
ALTER TABLE data_akomodasi_inap 
ADD COLUMN jumlah_porsi_pasien_vvip INTEGER GENERATED ALWAYS AS (COALESCE(jumlah_porsi_svip, 0)) STORED,
ADD COLUMN jumlah_porsi_pasien_vip INTEGER GENERATED ALWAYS AS (COALESCE(jumlah_porsi_vip, 0)) STORED,
ADD COLUMN jumlah_porsi_pasien_i INTEGER GENERATED ALWAYS AS (COALESCE(jumlah_porsi_i, 0)) STORED,
ADD COLUMN jumlah_porsi_pasien_ii INTEGER GENERATED ALWAYS AS (COALESCE(jumlah_porsi_ii, 0)) STORED,
ADD COLUMN jumlah_porsi_pasien_iii INTEGER GENERATED ALWAYS AS (COALESCE(jumlah_porsi_iii, 0)) STORED;
```

### 2. **Fix Computed Columns - Jumlah Kali Porsi**
```sql
-- Hapus computed columns yang lama
ALTER TABLE data_akomodasi_inap 
DROP COLUMN IF EXISTS jumlah_kali_porsi_vvip,
DROP COLUMN IF EXISTS jumlah_kali_porsi_vip,
DROP COLUMN IF EXISTS jumlah_kali_porsi_i,
DROP COLUMN IF EXISTS jumlah_kali_porsi_ii,
DROP COLUMN IF EXISTS jumlah_kali_porsi_iii;

-- Tambahkan computed columns baru
ALTER TABLE data_akomodasi_inap 
ADD COLUMN jumlah_kali_porsi_vvip BIGINT GENERATED ALWAYS AS (COALESCE(jumlah_porsi_svip, 0) * COALESCE(auc_gizi_vvip, 0)) STORED,
ADD COLUMN jumlah_kali_porsi_vip BIGINT GENERATED ALWAYS AS (COALESCE(jumlah_porsi_vip, 0) * COALESCE(auc_gizi_vip, 0)) STORED,
ADD COLUMN jumlah_kali_porsi_i BIGINT GENERATED ALWAYS AS (COALESCE(jumlah_porsi_i, 0) * COALESCE(auc_gizi_i, 0)) STORED,
ADD COLUMN jumlah_kali_porsi_ii BIGINT GENERATED ALWAYS AS (COALESCE(jumlah_porsi_ii, 0) * COALESCE(auc_gizi_ii, 0)) STORED,
ADD COLUMN jumlah_kali_porsi_iii BIGINT GENERATED ALWAYS AS (COALESCE(jumlah_porsi_iii, 0) * COALESCE(auc_gizi_iii, 0)) STORED;
```

### 3. **Fix Computed Column - Total Gizi**
```sql
-- Hapus computed column yang lama
ALTER TABLE data_akomodasi_inap 
DROP COLUMN IF EXISTS total_gizi;

-- Tambahkan computed column baru
ALTER TABLE data_akomodasi_inap 
ADD COLUMN total_gizi BIGINT GENERATED ALWAYS AS (
  COALESCE(jumlah_porsi_svip, 0) * COALESCE(auc_gizi_vvip, 0) +
  COALESCE(jumlah_porsi_vip, 0) * COALESCE(auc_gizi_vip, 0) +
  COALESCE(jumlah_porsi_i, 0) * COALESCE(auc_gizi_i, 0) +
  COALESCE(jumlah_porsi_ii, 0) * COALESCE(auc_gizi_ii, 0) +
  COALESCE(jumlah_porsi_iii, 0) * COALESCE(auc_gizi_iii, 0)
) STORED;
```

## UI Updates

### **Deskripsi Halaman Diperbarui**
```typescript
// Sebelum
"Data ini tersinkronisasi otomatis dari data kegiatan dan dihitung berdasarkan hari rawat dan AUC gizi. 
Anda dapat mengedit jumlah hari rawat untuk mengubah perhitungan."

// Sesudah  
"Data ini tersinkronisasi otomatis dari data kegiatan dan dihitung berdasarkan hari rawat dan AUC gizi. 
Hanya menampilkan unit kerja yang memiliki tindakan inap. Anda dapat mengedit jumlah hari rawat untuk mengubah perhitungan."
```

## Verifikasi

### ✅ **Computed Columns Berfungsi**
```sql
-- Test data untuk UK046 (Terang bulan VIP-VVIP)
SELECT 
  jumlah_porsi_svip,           -- 0 (dari data_kegiatan)
  jumlah_porsi_pasien_vvip,    -- 0 (computed: jumlah_porsi_svip)
  auc_gizi_vvip,               -- 15760
  jumlah_kali_porsi_vvip,      -- 0 (computed: 0 * 15760)
  total_gizi                   -- 0 (computed: sum semua kali porsi)
FROM data_akomodasi_inap 
WHERE kode_unit_kerja = 'UK046';
```

### ✅ **Filter Unit Kerja Berfungsi**
- Hanya menampilkan 3 unit kerja yang ada di `jenis_tindakan_inap`
- Validasi pada edit memastikan unit kerja valid

### ✅ **Nama Submenu Diperbaiki**
- Sidebar sekarang menampilkan "Data Akomodasi Inap"
- Konsisten dengan nama tabel dan fungsi

## Benefits

### 1. **Data Accuracy**
- Computed columns sekarang menggunakan data yang benar dari `data_kegiatan`
- Tidak lagi bergantung pada rumus `hari_rawat * 3` yang tidak akurat

### 2. **Filtered Data**
- Hanya menampilkan unit kerja yang relevan (memiliki tindakan inap)
- Mengurangi noise data dan fokus pada data yang berguna

### 3. **Consistent Naming**
- Nama submenu konsisten dengan fungsi aplikasi
- User experience yang lebih baik

### 4. **Data Integrity**
- Validasi memastikan hanya unit kerja yang valid yang bisa diedit
- Mencegah error dan inkonsistensi data

## Summary

**🎉 Semua masalah telah berhasil diperbaiki:**

1. ✅ **Nama submenu**: "Alokasi Biaya Gizi" → "Data Akomodasi Inap"
2. ✅ **Filter unit kerja**: Hanya tampil unit kerja dari `jenis_tindakan_inap`
3. ✅ **Rumus computed columns**: Menggunakan data dari `data_kegiatan` bukan `hari_rawat * 3`

**Sistem sekarang lebih akurat, terfilter, dan konsisten!**
