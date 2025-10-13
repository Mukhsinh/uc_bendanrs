# Cost Recovery Data Synchronization Fix

## 🔧 **Masalah yang Ditemukan**

Berdasarkan screenshot yang diberikan, terlihat bahwa:
- Data pendapatan menunjukkan **Rp 0** untuk semua unit kerja (Pendapatan Umum: Rp 0, Pendapatan BPJS: Rp 0)
- Data total biaya terlihat normal (contoh: Total Biaya dengan JP: Rp 552.758.825)
- Ini menunjukkan **masalah sinkronisasi data pendapatan**

## 🔍 **Root Cause Analysis**

### **Masalah Utama:**
1. **Sumber Data Salah**: Kode sebelumnya menggunakan tabel `cost_recovery` yang tidak ada atau kosong
2. **Data Pendapatan Kosong**: Tidak ada data pendapatan yang terisi di tabel `data_pendapatan`
3. **Mapping Data Tidak Sinkron**: Unit kerja di `distribusi_biaya_rekap` tidak memiliki data pendapatan yang sesuai

### **Sumber Data yang Benar:**
- **Total Biaya**: ✅ Dari `distribusi_biaya_rekap` baris "Total Biaya" (sudah benar)
- **Pendapatan**: ❌ Dari `cost_recovery` (tidak ada) → ✅ **Diperbaiki ke `data_pendapatan`**

## ✅ **Perbaikan yang Dilakukan**

### 1. **Perbaikan Sumber Data Pendapatan**
```typescript
// SEBELUM (SALAH):
const { data: crRows } = await supabase
  .from("cost_recovery")
  .select("unit_kerja_id, kode_unit_kerja, pendapatan_umum, pendapatan_bpjs, tahun")

// SESUDAH (BENAR):
const { data: pendapatanRows } = await supabase
  .from("data_pendapatan")
  .select("unit_kerja_id, kode_unit_kerja, nama_unit_kerja, pendapatan_umum, pendapatan_bpjs, tahun")
```

### 2. **Penambahan Debug Logging**
```typescript
// Debug log untuk memastikan data sinkron
console.log(`Unit ${unit.kode}: Biaya=${totalBiaya}, Pendapatan Umum=${revenue.umum}, Pendapatan BPJS=${revenue.bpjs}`);
console.log(`Cost Recovery data loaded: ${merged.length} units, tahun ${tahun}`);
console.log(`Distribusi biaya rows: ${distribusiRows?.length || 0}`);
console.log(`Pendapatan rows: ${pendapatanRows?.length || 0}`);
```

### 3. **Penambahan Data Status Indicator**
```typescript
// Informasi status data untuk monitoring
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
  <div>Unit Kerja: {rows.length}</div>
  <div>Dengan Data Biaya: {rows.filter(r => r.total_biaya > 0).length}</div>
  <div>Dengan Data Pendapatan: {rows.filter(r => r.total_pendapatan > 0).length}</div>
</div>
```

### 4. **Script SQL untuk Sinkronisasi Data**
- Dibuat script `sync-cost-recovery-data.sql` untuk:
  - Mengecek struktur tabel `data_pendapatan`
  - Mengidentifikasi unit kerja yang belum ada data pendapatan
  - Menyediakan script insert data kosong jika diperlukan

## 📊 **Struktur Data yang Benar**

| **Komponen** | **Sumber Data** | **Status** |
|--------------|----------------|------------|
| Unit Kerja | `unit_kerja` (kategori "Pusat Pendapatan") | ✅ Benar |
| Total Biaya | `distribusi_biaya_rekap` (baris "Total Biaya") | ✅ Benar |
| Pendapatan Umum | `data_pendapatan.pendapatan_umum` | ✅ **Diperbaiki** |
| Pendapatan BPJS | `data_pendapatan.pendapatan_bpjs` | ✅ **Diperbaiki** |
| Total Pendapatan | `pendapatan_umum + pendapatan_bpjs` | ✅ **Diperbaiki** |
| Proyeksi JP | 40% dari total pendapatan | ✅ Benar |
| Total Biaya dengan JP | Total biaya + Proyeksi JP | ✅ Benar |

## 🔄 **Alur Data yang Diperbaiki**

```
1. Ambil Unit Kerja (Pusat Pendapatan)
   ↓
2. Ambil Total Biaya dari distribusi_biaya_rekap (baris "Total Biaya")
   ↓
3. Ambil Pendapatan dari data_pendapatan (UMUM & BPJS)
   ↓
4. Mapping kolom UK037-UK077 ke distribusi_biaya_rekap
   ↓
5. Gabungkan data untuk setiap unit kerja
   ↓
6. Hitung Proyeksi JP (40% pendapatan)
   ↓
7. Hitung Total Biaya dengan JP
   ↓
8. Tampilkan di Cost Recovery dengan status data
```

## 🚀 **Langkah Selanjutnya**

### **Untuk Mengatasi Data Pendapatan Rp 0:**

1. **Jalankan Script SQL**:
   ```sql
   -- Jalankan sync-cost-recovery-data.sql untuk mengecek data
   ```

2. **Periksa Console Log**:
   - Buka Developer Tools (F12)
   - Lihat console log untuk debug informasi
   - Pastikan "Pendapatan rows" > 0

3. **Isi Data Pendapatan**:
   - Gunakan menu "Data Pendapatan" untuk mengisi data
   - Atau jalankan script insert data kosong dari `sync-cost-recovery-data.sql`

4. **Verifikasi Sinkronisasi**:
   - Periksa status indicator di halaman Cost Recovery
   - Pastikan "Dengan Data Pendapatan" > 0

## 📋 **Monitoring & Debug**

### **Console Log yang Akan Muncul:**
```
Unit UK037: Biaya=333511620, Pendapatan Umum=0, Pendapatan BPJS=0
Unit UK038: Biaya=3768779483, Pendapatan Umum=0, Pendapatan BPJS=0
...
Cost Recovery data loaded: 41 units, tahun 2025
Distribusi biaya rows: 1
Pendapatan rows: 0  ← Ini yang perlu diperbaiki
```

### **Status Indicator:**
- 🔵 **Unit Kerja**: Jumlah total unit kerja
- 🟢 **Dengan Data Biaya**: Unit kerja yang punya data biaya > 0
- 🟠 **Dengan Data Pendapatan**: Unit kerja yang punya data pendapatan > 0

## ✅ **Expected Result**

Setelah perbaikan dan pengisian data pendapatan:
- Status indicator menunjukkan "Dengan Data Pendapatan" > 0
- Grafik menampilkan bar pendapatan (biru muda & biru tua)
- Tooltip menunjukkan pendapatan yang benar (bukan Rp 0)
- Cost Recovery ratio dapat dihitung dengan akurat

## 🎯 **Status**: ✅ **IMPLEMENTASI SELESAI - SIAP UNTUK PENGISIAN DATA**
