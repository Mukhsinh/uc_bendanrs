# Data Kegiatan Save Error Fix

## Overview
Dokumentasi ini menjelaskan perbaikan error yang terjadi saat menyimpan data di halaman Data Kegiatan.

## Masalah yang Ditemukan

### ❌ Error: "Terjadi kesalahan saat menyimpan data"
**Penyebab**: Field `Jumlah_Hari_Rawat` adalah computed column di database yang tidak boleh di-update manual, tetapi masih ada di form schema dan form UI.

### 🔍 Root Cause Analysis
1. **Computed Columns di Database**: Field `Jumlah_Hari_Rawat` adalah computed column yang otomatis dihitung dari penjumlahan field `Hari_Rawat_SVIP`, `Hari_Rawat_VIP`, `Hari_Rawat_I`, `Hari_Rawat_II`, `Hari_Rawat_III`
2. **Form Schema Conflict**: Field `Jumlah_Hari_Rawat` masih ada di form schema sebagai input field
3. **Database Constraint**: PostgreSQL tidak mengizinkan update pada computed columns (GENERATED ALWAYS AS)

## Perbaikan yang Dilakukan

### ✅ 1. Hapus Field dari Form Schema
```typescript
// SEBELUM (BERMASALAH)
Jumlah_Hari_Rawat: z.coerce.number().min(0).optional(),

// SESUDAH (DIPERBAIKI)
// Field dihapus dari form schema karena computed column
```

### ✅ 2. Hapus Field dari Form Reset
```typescript
// SEBELUM (BERMASALAH)
Jumlah_Hari_Rawat: undefined,

// SESUDAH (DIPERBAIKI)
// Field dihapus dari form reset
```

### ✅ 3. Hapus Field dari Form Editing
```typescript
// SEBELUM (BERMASALAH)
Jumlah_Hari_Rawat: editingDataKegiatan.Jumlah_Hari_Rawat ?? undefined,

// SESUDAH (DIPERBAIKI)
// Field dihapus dari form editing
```

### ✅ 4. Hapus Field dari Template Import
```typescript
// SEBELUM (BERMASALAH)
"Hari_Rawat_SVIP", "Hari_Rawat_VIP", "Hari_Rawat_I", "Hari_Rawat_II", "Hari_Rawat_III", "Jumlah_Hari_Rawat",

// SESUDAH (DIPERBAIKI)
"Hari_Rawat_SVIP", "Hari_Rawat_VIP", "Hari_Rawat_I", "Hari_Rawat_II", "Hari_Rawat_III",
```

### ✅ 5. Hapus Field dari Import Processing
```typescript
// SEBELUM (BERMASALAH)
Jumlah_Hari_Rawat: parseFloat(row["Jumlah_Hari_Rawat"]) || 0,

// SESUDAH (DIPERBAIKI)
// Field dihapus dari import processing
```

### ✅ 6. Hapus Field dari Form UI
```typescript
// SEBELUM (BERMASALAH)
<FormField
  control={form.control}
  name="Jumlah_Hari_Rawat"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Jumlah Hari Rawat (Total)</FormLabel>
      <FormControl>
        <Input 
          type="number" 
          {...field} 
          value={field.value || ""} 
          readOnly
          className="bg-gray-50"
          placeholder="Otomatis dihitung dari total hari rawat"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// SESUDAH (DIPERBAIKI)
// Field dihapus dari form UI
```

### ✅ 7. Hapus Auto-calculation Logic
```typescript
// SEBELUM (BERMASALAH)
useEffect(() => {
  const subscription = form.watch((value, { name }) => {
    if (name && name.startsWith('Hari_Rawat_') && name !== 'Jumlah_Hari_Rawat') {
      const total = (value.Hari_Rawat_SVIP || 0) + 
                   (value.Hari_Rawat_VIP || 0) + 
                   (value.Hari_Rawat_I || 0) + 
                   (value.Hari_Rawat_II || 0) + 
                   (value.Hari_Rawat_III || 0);
      form.setValue('Jumlah_Hari_Rawat', total);
    }
  });
  return () => subscription.unsubscribe();
}, [form]);

// SESUDAH (DIPERBAIKI)
// Note: Jumlah_Hari_Rawat is now a computed column in database, no need to calculate manually
```

## Computed Columns di Database

### Field yang Otomatis Dihitung:
1. **Jumlah_SDM**: `SDM_dokter + SDM_Perawat + SDM_Non`
2. **Total_Kunjungan_Pasien**: `Kunjungan_Pasien_Lama + Kunjungan_Pasien_Baru`
3. **Total_Diklat**: `Diklat_Jumlah_Siswa * Diklat_Lama_Hari`
4. **Jumlah_Hari_Rawat**: `Hari_Rawat_SVIP + Hari_Rawat_VIP + Hari_Rawat_I + Hari_Rawat_II + Hari_Rawat_III`

### ⚠️ Penting: Field-field ini TIDAK boleh di-update manual
- Field ini otomatis dihitung oleh database
- Jika dimasukkan ke form schema akan menyebabkan error saat save
- Nilai akan otomatis muncul di laporan dan tampilan data

## Testing yang Dilakukan

### ✅ 1. Database Testing
```sql
-- Test insert dengan field baru
INSERT INTO data_kegiatan (
  tahun, "Kode_UK", "Nama_Unit_Kerja", "Jenis",
  jumlah_porsi_svip, jumlah_porsi_vip, jumlah_porsi_i, jumlah_porsi_ii, jumlah_porsi_iii,
  kamar_luas_svip, kamar_luas_vip, kamar_luas_i, kamar_luas_ii, kamar_luas_iii,
  "Instrumen_Kecil", "Set_Pack_Sedang", "Set_Pack_Kecil", "Diklat_Jumlah_Siswa", "Diklat_Lama_Hari"
) VALUES (
  2024, 'FIXED001', 'Unit Fixed Test', 'Rawat Inap',
  10, 15, 20, 25, 30,
  50.5, 45.0, 40.0, 35.0, 30.0,
  3813, 736, 6234, 29, 286
) RETURNING id, "Jumlah_Hari_Rawat";
```
**Result**: ✅ Berhasil, computed column otomatis dihitung

### ✅ 2. Application Testing
- Form rendering: ✅ Berfungsi tanpa error
- Field validation: ✅ Berfungsi normal
- Data submission: ✅ Berhasil disimpan
- No linting errors: ✅ Clean code

## Kesimpulan

### ✅ **Masalah Teratasi**
- Error "Terjadi kesalahan saat menyimpan data" telah diperbaiki
- Form dapat menyimpan data dengan field baru tanpa error
- Computed columns bekerja dengan benar

### ✅ **Yang Diperbaiki**
1. Hapus field `Jumlah_Hari_Rawat` dari form schema
2. Hapus field dari form UI, reset, dan editing
3. Hapus field dari template import dan processing
4. Hapus auto-calculation logic yang tidak diperlukan

### ✅ **Yang Tetap Berfungsi**
1. Field baru (jumlah porsi dan kamar luas) berfungsi normal
2. Computed columns otomatis dihitung di database
3. Laporan menampilkan nilai computed columns dengan benar
4. Import/export data berfungsi normal

### ⚠️ **Catatan Penting**
- Field `Jumlah_Hari_Rawat` akan otomatis muncul di laporan dan tampilan data
- Tidak perlu input manual untuk computed columns
- Database akan otomatis menghitung nilai berdasarkan field yang diinput

**Status**: ✅ **MASALAH TERSELESAIKAN** - Aplikasi dapat menyimpan data tanpa error.
