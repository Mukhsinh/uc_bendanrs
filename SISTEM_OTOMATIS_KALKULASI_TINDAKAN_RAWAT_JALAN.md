# ⚙️ Sistem Otomatis: Kalkulasi Tindakan Rawat Jalan

## 🚀 Cara Kerja Sistem Otomatis

Sistem kalkulasi tindakan rawat jalan sekarang **BERJALAN OTOMATIS** tanpa perlu intervensi manual!

### Trigger Otomatis

Sistem akan **otomatis** menjalankan kalkulasi ketika:

1. ✅ **Menambah tindakan baru** di `jenis_tindakan_rawat_jalan`
2. ✅ **Mengubah jumlah tindakan** di `jenis_tindakan_rawat_jalan`
3. ✅ **Menghapus tindakan** dari `jenis_tindakan_rawat_jalan`
4. ✅ **Mengubah data tindakan** (waktu, profesionalisme, tingkat_kesulitan)

### Tidak Perlu Lagi:
- ❌ Menjalankan query manual
- ❌ Memanggil function manual
- ❌ Menghitung dasar alokasi manual
- ❌ Mendistribusikan biaya manual

## 📊 Alur Otomatis

```
┌─────────────────────────────────────────────────────────────┐
│  USER melakukan aksi di tabel jenis_tindakan_rawat_jalan   │
│  (Tambah/Edit/Hapus tindakan)                               │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER: trigger_auto_sync_kalkulasi_rj                    │
│  Otomatis terpanggil                                        │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Sync Data                                          │
│  • INSERT/UPDATE/DELETE di kalkulasi_tindakan_rawat_jalan  │
│  • Copy: jumlah, waktu, prof, tingkat, hasil_kali, dll     │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Recalculate Unit Kerja                            │
│  Function: recalculate_unit_kerja_rj()                     │
│  • Hitung total hasil_kali_waktu & hasil_kali unit kerja   │
│  • Update dasar_alokasi_kali_waktu (6 desimal)             │
│  • Update dasar_alokasi_hasil_kali (6 desimal)             │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Distribute Biaya                                   │
│  Function: distribute_biaya_for_unit_rj()                  │
│  • Ambil biaya dari data_biaya (24 kolom)                  │
│  • Ambil biaya tidak langsung dari distribusi_biaya_rekap  │
│  • Distribusi biaya SDM (× dasar_alokasi_hasil_kali)       │
│  • Distribusi biaya operasional (× dasar_alokasi_kali_waktu)│
│  • Distribusi biaya tidak langsung                          │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  HASIL: Unit Cost Otomatis Terhitung                        │
│  • unit_cost_tindakan_rawat_jalan = SUM(24 biaya)          │
│  • Data siap digunakan!                                     │
└─────────────────────────────────────────────────────────────┘
```

## 💡 Contoh Penggunaan

### 1. Tambah Tindakan Baru

**Di halaman Manajemen Tindakan Rawat Jalan:**
```
User klik "Tambah Tindakan" → Pilih T.001 → Set jumlah 21 → Simpan
```

**Yang terjadi otomatis di background:**
```sql
-- 1. Data tersimpan di jenis_tindakan_rawat_jalan
-- 2. TRIGGER otomatis jalan
-- 3. Data ter-copy ke kalkulasi_tindakan_rawat_jalan
-- 4. Dasar alokasi dihitung ulang untuk unit kerja UK056
-- 5. Biaya didistribusikan
-- 6. Unit cost langsung tersedia!
```

### 2. Edit Jumlah Tindakan

**Di halaman Manajemen Tindakan Rawat Jalan:**
```
User klik edit jumlah T.001 dari 21 → 50 → Simpan
```

**Yang terjadi otomatis:**
```sql
-- 1. jumlah diupdate di jenis_tindakan_rawat_jalan
-- 2. hasil_kali_waktu & hasil_kali auto-recalculate
-- 3. TRIGGER otomatis jalan
-- 4. Data diupdate di kalkulasi_tindakan_rawat_jalan
-- 5. Dasar alokasi dihitung ulang (karena hasil_kali berubah)
-- 6. Semua tindakan di UK056 di-recalculate
-- 7. Unit cost baru langsung tersedia!
```

### 3. Hapus Tindakan

**Di halaman Manajemen Tindakan Rawat Jalan:**
```
User klik hapus T.001 → Konfirmasi → Terhapus
```

**Yang terjadi otomatis:**
```sql
-- 1. Data terhapus dari jenis_tindakan_rawat_jalan
-- 2. TRIGGER otomatis jalan
-- 3. Data terhapus dari kalkulasi_tindakan_rawat_jalan
-- 4. Dasar alokasi tindakan lain di-recalculate
-- 5. Biaya tindakan lain didistribusi ulang
```

## 🔄 Function yang Tersedia

### 1. Auto Sync (Trigger - Otomatis)
```sql
-- TIDAK PERLU DIPANGGIL MANUAL
-- Trigger ini otomatis jalan saat ada perubahan di jenis_tindakan_rawat_jalan
```

### 2. Manual Refresh (Opsional)
```sql
-- Jika ingin refresh ulang semua data dari awal
SELECT refresh_all_kalkulasi_tindakan_rj('USER_ID', 2025);
```

**Kapan menggunakan manual refresh?**
- ✅ Setelah import data besar ke `jenis_tindakan_rawat_jalan`
- ✅ Setelah update data di `data_biaya` (perubahan biaya tahunan)
- ✅ Setelah update data di `distribusi_biaya_rekap` (biaya tidak langsung)
- ✅ Untuk reset dan recalculate semua data tahun tertentu

### 3. Recalculate Single Unit (Opsional)
```sql
-- Jika ingin recalculate satu unit kerja saja
SELECT recalculate_unit_kerja_rj('USER_ID', 2025, 'UK056');
```

## 📋 Skenario Lengkap

### Skenario A: User Pertama Kali Menggunakan Sistem

1. **User mengakses halaman "Manajemen Tindakan Rawat Jalan"**
   - Melihat daftar unit kerja rawat jalan
   - Belum ada tindakan

2. **User menambah tindakan untuk UK056:**
   - Klik "Tambah Tindakan"
   - Pilih T.001, T.002
   - Set jumlah: T.001 = 21, T.002 = 585
   - Klik "Simpan"

3. **Sistem otomatis:**
   - ✅ Data tersimpan di `jenis_tindakan_rawat_jalan`
   - ✅ Trigger jalan: data ter-copy ke `kalkulasi_tindakan_rawat_jalan`
   - ✅ Dasar alokasi dihitung
   - ✅ Biaya didistribusikan
   - ✅ Unit cost tersedia!

4. **User bisa langsung melihat hasil di halaman "Kalkulasi Tindakan Rawat Jalan"**
   - Unit cost T.001: Rp 776,621
   - Unit cost T.002: Rp 179,181

### Skenario B: Update Biaya Tahunan

1. **Admin update biaya di tabel `data_biaya`**
   - Contoh: biaya_gaji_tunjangan UK056 naik dari 50jt → 60jt

2. **Admin jalankan refresh:**
   ```sql
   SELECT refresh_all_kalkulasi_tindakan_rj('USER_ID', 2025);
   ```

3. **Sistem otomatis:**
   - ✅ Semua data di-refresh
   - ✅ Dasar alokasi tetap sama (karena hasil_kali tidak berubah)
   - ✅ Distribusi biaya dengan nilai baru
   - ✅ Unit cost baru tersedia

4. **User melihat perubahan:**
   - Unit cost T.001 naik karena biaya gaji naik
   - Perubahan otomatis reflect di semua tindakan

### Skenario C: Data Biaya Tidak Langsung Berubah

1. **Admin update `distribusi_biaya_rekap`**
   - Biaya tidak langsung UK056 berubah

2. **Admin jalankan refresh:**
   ```sql
   SELECT recalculate_unit_kerja_rj('USER_ID', 2025, 'UK056');
   ```

3. **Sistem otomatis:**
   - ✅ Re-distribute biaya dengan nilai baru
   - ✅ Unit cost diupdate

## 🎯 Monitoring & Verifikasi

### 1. Cek Status Trigger
```sql
-- Pastikan trigger aktif
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'jenis_tindakan_rawat_jalan';

-- Expected: trigger_auto_sync_kalkulasi_rj untuk INSERT, UPDATE, DELETE
```

### 2. Cek Dasar Alokasi (Harus Total = 1.0)
```sql
-- Per unit kerja, total dasar alokasi harus = 1.0 (100%)
SELECT 
  kode_unit_kerja,
  ROUND(SUM(dasar_alokasi_kali_waktu)::NUMERIC, 2) as total_da_waktu,
  ROUND(SUM(dasar_alokasi_hasil_kali)::NUMERIC, 2) as total_da_hasil
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = 'USER_ID' AND tahun = 2025
GROUP BY kode_unit_kerja;

-- Expected: total_da_waktu ≈ 1.0, total_da_hasil ≈ 1.0
```

### 3. Cek Sync Status
```sql
-- Pastikan jumlah record match
SELECT 
  'jenis_tindakan_rawat_jalan' as tabel,
  COUNT(*) as jumlah_record
FROM jenis_tindakan_rawat_jalan
WHERE user_id = 'USER_ID' AND jumlah > 0

UNION ALL

SELECT 
  'kalkulasi_tindakan_rawat_jalan' as tabel,
  COUNT(*) as jumlah_record
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = 'USER_ID' AND tahun = 2025;

-- Expected: Jumlah record sama
```

### 4. Cek Unit Cost
```sql
-- Pastikan unit cost ter-calculate
SELECT 
  kode_unit_kerja,
  kode_jenis_tindakan,
  jenis_tindakan,
  jumlah,
  unit_cost_tindakan_rawat_jalan,
  CASE 
    WHEN unit_cost_tindakan_rawat_jalan > 0 THEN '✅ OK'
    ELSE '❌ ERROR'
  END as status
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = 'USER_ID' AND tahun = 2025
ORDER BY kode_unit_kerja, kode_jenis_tindakan;
```

## ⚠️ Troubleshooting

### Problem 1: Unit Cost = 0

**Kemungkinan Penyebab:**
- Data `data_biaya` belum ada untuk unit kerja tersebut
- Data `distribusi_biaya_rekap` belum ada
- Dasar alokasi = 0 (hasil_kali = 0)

**Solusi:**
```sql
-- 1. Cek data_biaya
SELECT * FROM data_biaya 
WHERE kode_unit_kerja = 'UK056' AND tahun = 2025;

-- 2. Cek distribusi_biaya_rekap
SELECT biaya, uk056_klinik_kebid_kandungan 
FROM distribusi_biaya_rekap 
WHERE tahun = 2025;

-- 3. Manual refresh
SELECT refresh_all_kalkulasi_tindakan_rj('USER_ID', 2025);
```

### Problem 2: Dasar Alokasi Tidak Total 1.0

**Kemungkinan Penyebab:**
- Ada tindakan dengan jumlah = 0
- Floating point rounding

**Solusi:**
```sql
-- Recalculate unit kerja
SELECT recalculate_unit_kerja_rj('USER_ID', 2025, 'UK056');
```

### Problem 3: Data Tidak Sync

**Kemungkinan Penyebab:**
- Trigger tidak aktif
- Error di function

**Solusi:**
```sql
-- 1. Cek trigger
SELECT * FROM information_schema.triggers
WHERE event_object_table = 'jenis_tindakan_rawat_jalan';

-- 2. Manual refresh
SELECT refresh_all_kalkulasi_tindakan_rj('USER_ID', 2025);
```

## 📝 Best Practices

### 1. Initial Setup (Pertama Kali)
```sql
-- Setelah input semua tindakan, jalankan refresh
SELECT refresh_all_kalkulasi_tindakan_rj('USER_ID', 2025);
```

### 2. Daily Operations
- ✅ Biarkan trigger bekerja otomatis
- ✅ Tidak perlu manual intervention
- ✅ Edit jumlah tindakan langsung via UI

### 3. Monthly/Yearly Updates
```sql
-- Setelah update biaya tahunan di data_biaya
SELECT refresh_all_kalkulasi_tindakan_rj('USER_ID', 2025);
```

### 4. Performance
- ✅ Trigger hanya recalculate 1 unit kerja yang berubah
- ✅ Tidak recalculate semua data
- ✅ Cepat dan efisien

## 🎉 Keuntungan Sistem Otomatis

1. ✅ **Real-time:** Perubahan langsung reflect
2. ✅ **Akurat:** Tidak ada human error
3. ✅ **Efisien:** Tidak perlu manual calculation
4. ✅ **User-friendly:** Tinggal input jumlah, sisanya otomatis
5. ✅ **Consistent:** Semua unit kerja dikalkulasi dengan cara yang sama
6. ✅ **Maintainable:** Logic ada di database, mudah diupdate

## 🔧 Advanced: Customize Tahun

Secara default, sistem menggunakan tahun saat ini atau 2025. Jika ingin customize:

```sql
-- Edit function auto_sync_kalkulasi_tindakan_rj
-- Ganti baris:
v_tahun := COALESCE(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 2025);

-- Menjadi tahun yang diinginkan:
v_tahun := 2024; -- untuk tahun 2024
```

## 📊 Summary

| Fitur | Status | Keterangan |
|-------|--------|------------|
| **Auto Sync** | ✅ Aktif | Data otomatis sync dari jenis_tindakan_rawat_jalan |
| **Auto Calculate** | ✅ Aktif | Dasar alokasi otomatis dihitung |
| **Auto Distribute** | ✅ Aktif | Biaya otomatis didistribusikan |
| **Real-time** | ✅ Aktif | Perubahan langsung reflect |
| **Manual Refresh** | ✅ Available | Function tersedia untuk refresh manual |
| **Performance** | ✅ Optimal | Hanya recalculate yang berubah |

---

**Sistem kalkulasi tindakan rawat jalan sekarang FULLY AUTOMATED! 🚀**



