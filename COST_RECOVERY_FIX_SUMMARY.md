# Cost Recovery Fix Summary

## 🔧 Perbaikan yang Dilakukan

### ❌ **Masalah Sebelumnya**
- Data total biaya Cost Recovery diambil dari view `v_cost_recovery_auto` yang tidak sesuai
- Sumber data tidak konsisten dengan struktur database yang benar
- Implementasi tidak mencerminkan alur data yang sebenarnya

### ✅ **Solusi yang Diterapkan**

#### 1. **Perbaikan Sumber Data Total Biaya**
```typescript
// SEBELUM (SALAH):
const { data: viewRows } = await supabase
  .from("v_cost_recovery_auto")
  .select("unit_kerja_id, kode_unit_kerja, nama_unit_kerja, tahun, total_biaya, total_pendapatan, user_id")

// SESUDAH (BENAR):
const { data: distribusiRows } = await supabase
  .from("distribusi_biaya_rekap")
  .select("*")
  .eq("biaya", "Total Biaya")
  .eq("tahun", tahun);
```

#### 2. **Mapping Kolom yang Benar**
```typescript
const ukColumnMapping: { [key: string]: string } = {
  'UK037': 'uk037_ambulance',
  'UK038': 'uk038_laboratorium_pk_pa',
  'UK039': 'uk039_radiologi',
  'UK040': 'uk040_farmasi',
  // ... dst untuk semua unit kerja UK037-UK077
};
```

#### 3. **Alur Data yang Benar**
1. **Unit Kerja**: Dari tabel `unit_kerja` dengan kategori "Pusat Pendapatan"
2. **Total Biaya**: Dari tabel `distribusi_biaya_rekap` baris "Total Biaya"
3. **Pendapatan**: Dari tabel `cost_recovery` (pendapatan_umum + pendapatan_bpjs)
4. **Proyeksi JP**: Dihitung 40% dari total pendapatan
5. **Total Biaya dengan JP**: Total biaya + proyeksi JP

### 📊 **Struktur Data Cost Recovery**

| **Kolom** | **Sumber Data** | **Keterangan** |
|-----------|----------------|----------------|
| `unit_kerja_id` | `unit_kerja.id` | ID unit kerja |
| `kode_unit_kerja` | `unit_kerja.kode` | Kode unit kerja (UK037-UK077) |
| `nama_unit_kerja` | `unit_kerja.nama` | Nama unit kerja |
| `tahun` | Parameter input | Tahun yang dipilih |
| `total_biaya` | **`distribusi_biaya_rekap.biaya = 'Total Biaya'`** | **✅ SUMBER DATA YANG BENAR** |
| `total_pendapatan` | `cost_recovery.pendapatan_umum + pendapatan_bpjs` | Total pendapatan |
| `pendapatan_umum` | `cost_recovery.pendapatan_umum` | Pendapatan dari pasien umum |
| `pendapatan_bpjs` | `cost_recovery.pendapatan_bpjs` | Pendapatan dari BPJS |
| `"Proyeksi JP"` | **Dihitung** | 40% dari total pendapatan |
| `"total biaya dengan JP"` | **Dihitung** | Total biaya + proyeksi JP |

### 🎯 **Fitur yang Diperbaiki**

#### 1. **Grafik Perbandingan**
- Menampilkan pendapatan umum dan BPJS secara terpisah ketika filter "total" dipilih
- Total biaya diambil dari distribusi_biaya_rekap yang sudah termasuk hasil distribusi biaya

#### 2. **Grafik Detail**
- Breakdown total biaya dengan JP yang akurat
- Garis pendapatan umum dan BPJS terpisah untuk analisis yang lebih detail

#### 3. **Deskripsi yang Akurat**
- Menjelaskan bahwa total biaya diambil dari tabel distribusi_biaya_rekap
- Informasi yang lebih jelas tentang sumber data

### 🔄 **Flow Data yang Benar**

```
Unit Kerja (Pusat Pendapatan)
    ↓
distribusi_biaya_rekap (baris "Total Biaya")
    ↓
Mapping kolom UK037-UK077
    ↓
cost_recovery (pendapatan_umum + pendapatan_bpjs)
    ↓
Gabungkan data
    ↓
Hitung Proyeksi JP (40% pendapatan)
    ↓
Hitung Total Biaya dengan JP
    ↓
Tampilkan di Cost Recovery
```

### ✅ **Verifikasi**

1. **Sumber Data**: ✅ Menggunakan `distribusi_biaya_rekap` baris "Total Biaya"
2. **Mapping Kolom**: ✅ Mapping yang benar untuk UK037-UK077
3. **Perhitungan**: ✅ Proyeksi JP dan total biaya dengan JP
4. **Grafik**: ✅ Menampilkan pendapatan umum dan BPJS terpisah
5. **Dokumentasi**: ✅ Deskripsi yang akurat tentang sumber data

### 📝 **Catatan Penting**

- Data total biaya sekarang diambil dari tabel `distribusi_biaya_rekap` yang merupakan hasil akhir dari proses distribusi biaya
- Ini memastikan bahwa Cost Recovery menggunakan data yang sudah melalui tahapan distribusi biaya yang lengkap
- Perhitungan proyeksi JP tetap 40% dari total pendapatan seperti sebelumnya
- Implementasi ini konsisten dengan struktur database dan alur bisnis yang benar

## 🚀 **Status**: ✅ **SELESAI DAN SIAP DIGUNAKAN**
