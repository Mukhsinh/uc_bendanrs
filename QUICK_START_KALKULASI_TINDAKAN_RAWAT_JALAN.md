# 🚀 Quick Start: Kalkulasi Tindakan Rawat Jalan

## ⚡ Mulai Menggunakan (5 Langkah)

### 1️⃣ Pastikan Data Master Sudah Ada

Sebelum mulai, pastikan tabel ini sudah ada datanya:

```sql
-- ✅ Cek unit kerja rawat jalan
SELECT kode, nama FROM unit_kerja 
WHERE jenis = 1 
  AND kode NOT IN ('UK037','UK038','UK039','UK040','UK042','UK043','UK044','UK075','UK077')
ORDER BY kode;

-- ✅ Cek daftar tindakan
SELECT kode_tindakan, nama_tindakan FROM daftar_tindakan 
ORDER BY kode_tindakan 
LIMIT 10;

-- ✅ Cek data biaya (untuk tahun 2025)
SELECT kode_unit_kerja, nama_unit_kerja, biaya_gaji_tunjangan 
FROM data_biaya 
WHERE tahun = 2025 AND jenis = 1
LIMIT 5;
```

**Jika belum ada:**
- Input data unit kerja via menu "Data Master > Data Unit Kerja"
- Input daftar tindakan via menu "Data Master > Daftar Tindakan"
- Input data biaya via menu "Data Operasional > Data Biaya"

### 2️⃣ Buka Halaman Manajemen Tindakan Rawat Jalan

**Navigasi:** Unit Pelayanan → **Manajemen Tindakan Rawat Jalan**

Anda akan melihat:
- Daftar unit kerja rawat jalan (UK041, UK055-UK073, UK076)
- Belum ada tindakan (jika baru pertama kali)

### 3️⃣ Tambah Tindakan

**Untuk setiap unit kerja:**

1. Klik tombol **"Tambah Tindakan"**
2. Pilih tindakan dari dropdown (multi-select)
   - Contoh: T.001 (rawat luka), T.002 (injeksi 5 cc)
3. Atur **jumlah** untuk setiap tindakan
   - Contoh: T.001 = 21, T.002 = 585
4. Klik **"Simpan"**

**✨ SISTEM OTOMATIS BEKERJA:**
- Data tersimpan di `jenis_tindakan_rawat_jalan`
- Trigger otomatis: data ter-copy ke `kalkulasi_tindakan_rawat_jalan`
- Dasar alokasi dihitung otomatis
- Biaya didistribusikan otomatis
- Unit cost langsung tersedia!

### 4️⃣ (Opsional) Verifikasi Data

```sql
-- Cek data tersimpan
SELECT 
  kode_unit_kerja,
  kode_jenis_tindakan,
  jenis_tindakan,
  jumlah,
  hasil_kali_waktu,
  hasil_kali
FROM jenis_tindakan_rawat_jalan
WHERE user_id = auth.uid()
ORDER BY kode_unit_kerja, kode_jenis_tindakan;
```

### 5️⃣ Lihat Hasil Kalkulasi

```sql
-- Lihat unit cost per tindakan
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  kode_jenis_tindakan,
  jenis_tindakan,
  jumlah,
  dasar_alokasi_kali_waktu,
  dasar_alokasi_hasil_kali,
  biaya_gaji_tunjangan,
  biaya_listrik,
  biaya_tidak_langsung_terdistribusi,
  unit_cost_tindakan_rawat_jalan,
  biaya_bahan_tindakan,
  (unit_cost_tindakan_rawat_jalan + biaya_bahan_tindakan) as total_unit_cost
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = auth.uid()
  AND tahun = 2025
ORDER BY kode_unit_kerja, kode_jenis_tindakan;
```

## 🎯 Contoh Lengkap

### Input Data

**Unit Kerja:** UK056 - Klinik Kebid. & Kandungan

**Tindakan:**
| Kode | Nama | Jumlah | Waktu | Prof | Tingkat |
|------|------|--------|-------|------|---------|
| T.001 | rawat luka | 21 | 15 | 2 | 3 |
| T.002 | injeksi 5 cc | 585 | 15 | 1 | 1 |

### Hasil Otomatis

**Data di `kalkulasi_tindakan_rawat_jalan`:**

| Field | T.001 | T.002 |
|-------|-------|-------|
| **Data Tindakan** |
| jumlah | 21 | 585 |
| hasil_kali_waktu | 315 | 8,775 |
| hasil_kali | 1,890 | 8,775 |
| **Dasar Alokasi** |
| DA kali waktu | 0.034653 | 0.965347 |
| DA hasil kali | 0.177215 | 0.822785 |
| **Biaya (contoh)** |
| Gaji & Tunjangan | 421,940 | 70,374 |
| Jasa Pelayanan | 253,164 | 42,224 |
| Listrik | 16,501 | 16,502 |
| Tidak Langsung | 33,003 | 33,003 |
| **Unit Cost** |
| Unit Cost | 775,052 | 177,391 |
| Biaya Bahan | 1,569 | 1,790 |
| **Total** | **776,621** | **179,181** |

## 🔄 Operasi Harian

### Edit Jumlah Tindakan

1. Di halaman "Manajemen Tindakan Rawat Jalan"
2. Klik icon edit (✏️) pada kolom Jumlah
3. Ubah nilai
4. Klik checkmark (✓) untuk simpan

**✨ Sistem otomatis recalculate!**

### Hapus Tindakan

1. Klik icon trash (🗑️) pada kolom Aksi
2. Konfirmasi penghapusan

**✨ Sistem otomatis recalculate tindakan lain!**

## 🔧 Maintenance

### Refresh Manual (Jika Diperlukan)

**Kapan perlu refresh manual?**
- Setelah update `data_biaya` (perubahan biaya tahunan)
- Setelah update `distribusi_biaya_rekap` (biaya tidak langsung)
- Setelah import data besar

**Cara:**
```sql
-- Refresh semua data untuk tahun 2025
SELECT refresh_all_kalkulasi_tindakan_rj(auth.uid(), 2025);
```

### Cek Status Sistem

```sql
-- 1. Cek trigger aktif
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers
WHERE event_object_table = 'jenis_tindakan_rawat_jalan';

-- 2. Cek jumlah data sync
SELECT 
  'jenis_tindakan_rawat_jalan' as tabel,
  COUNT(*) as records
FROM jenis_tindakan_rawat_jalan
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'kalkulasi_tindakan_rawat_jalan',
  COUNT(*)
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = auth.uid() AND tahun = 2025;
-- Expected: Jumlah sama

-- 3. Cek dasar alokasi valid
SELECT 
  kode_unit_kerja,
  ROUND(SUM(dasar_alokasi_kali_waktu)::NUMERIC, 2) as total_da_waktu,
  ROUND(SUM(dasar_alokasi_hasil_kali)::NUMERIC, 2) as total_da_hasil
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY kode_unit_kerja;
-- Expected: total ≈ 1.0
```

## ⚠️ Troubleshooting

### Problem: Unit Cost = 0

**Penyebab:** Data biaya belum ada

**Solusi:**
1. Input data biaya via "Data Operasional > Data Biaya"
2. Jalankan refresh:
   ```sql
   SELECT refresh_all_kalkulasi_tindakan_rj(auth.uid(), 2025);
   ```

### Problem: Data Tidak Muncul

**Penyebab:** Trigger belum jalan atau jumlah = 0

**Solusi:**
1. Pastikan jumlah tindakan > 0
2. Cek trigger aktif
3. Jalankan refresh manual

### Problem: Dasar Alokasi Tidak Total 1.0

**Penyebab:** Rounding atau data tidak sync

**Solusi:**
```sql
-- Recalculate unit kerja spesifik
SELECT recalculate_unit_kerja_rj(auth.uid(), 2025, 'UK056');
```

## 📊 Summary Alur

```
USER INPUT            SISTEM AUTO         HASIL
   ↓                      ↓                ↓
Tambah Tindakan  →  Trigger Jalan  →  Data Sync
   ↓                      ↓                ↓
Set Jumlah       →  Calculate DA    →  Dasar Alokasi
   ↓                      ↓                ↓
Simpan           →  Distribute $    →  Unit Cost
   ↓                      ↓                ↓
SELESAI          →  OTOMATIS        →  SIAP PAKAI!
```

## ✅ Checklist

Sebelum mulai, pastikan:
- ☑️ Data unit kerja sudah ada (jenis = 1)
- ☑️ Daftar tindakan sudah ada
- ☑️ Data biaya tahun 2025 sudah ada
- ☑️ Distribusi biaya rekap sudah ada
- ☑️ User sudah login

Sudah mulai menggunakan:
- ☑️ Tambah tindakan via UI
- ☑️ Set jumlah tindakan
- ☑️ Sistem otomatis calculate
- ☑️ Lihat hasil kalkulasi

## 🎉 Selesai!

Sistem kalkulasi tindakan rawat jalan sudah siap digunakan dan **BERJALAN OTOMATIS**!

**Tidak perlu:**
- ❌ Jalankan query manual
- ❌ Panggil function manual
- ❌ Hitung manual

**Tinggal:**
- ✅ Input jumlah tindakan
- ✅ Lihat hasil

---

**Dokumentasi Lengkap:**
- `DOKUMENTASI_KALKULASI_TINDAKAN_RAWAT_JALAN.md` - Formula & detail
- `SISTEM_OTOMATIS_KALKULASI_TINDAKAN_RAWAT_JALAN.md` - Cara kerja otomatis
- `CONTOH_PENGISIAN_KALKULASI_TINDAKAN_RAWAT_JALAN.md` - Contoh dengan angka
- `DIAGRAM_ALUR_KALKULASI_TINDAKAN_RAWAT_JALAN.md` - Visual diagram



