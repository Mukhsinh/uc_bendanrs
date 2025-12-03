# Fix Error Rekalkulasi BDRS - Statement Timeout (V2 - Optimized)

## Masalah
Error "statement timeout" masih terjadi saat melakukan rekalkulasi semua pada halaman Kalkulasi Biaya BDRS, meskipun sudah ada perbaikan sebelumnya.

## Analisis Masalah
1. Timeout masih terjadi karena query UPDATE yang besar memakan waktu terlalu lama
2. Operasi UPDATE pada banyak records sekaligus menyebabkan lock time yang panjang
3. Refresh rekapitulasi_unit_cost juga memakan waktu tambahan

## Solusi V2 yang Diterapkan

### 1. Database Function (fix_manual_recalculate_bdrs_optimized_v2.sql)
- ✅ **Timeout ditingkatkan ke 20 menit (1200000ms)** untuk handle data sangat besar
- ✅ **Optimasi query dengan CTE (Common Table Expression)** untuk performa lebih baik
- ✅ **Index optimization** - memastikan index ada untuk query yang efisien
- ✅ **Skip refresh rekapitulasi** untuk menghindari timeout tambahan
- ✅ **Single query update** dengan CTE untuk mengurangi lock time
- ✅ **Error handling yang lebih baik** dengan progress tracking

### 2. Client-Side Improvements

#### database-operations.ts
- ✅ Timeout client ditingkatkan ke **20 menit (1200000ms)** untuk match dengan DB function
- ✅ MaxRetries tetap **2** untuk handle transient errors
- ✅ Error handling yang lebih spesifik

#### KalkulasiBiayaBDRS.tsx
- ✅ Progress indicator yang detail (7 steps)
- ✅ Pesan error yang informatif
- ✅ Menampilkan warning jika ada

## Cara Menerapkan

### ⚠️ PENTING: Hapus fungsi lama terlebih dahulu

Sebelum menjalankan file SQL baru, pastikan untuk menghapus fungsi lama:

```sql
-- Hapus fungsi lama (jika ada)
DROP FUNCTION IF EXISTS public.manual_recalculate_bdrs(integer, uuid);
```

### Langkah 1: Terapkan File SQL ke Database

Jalankan file SQL berikut di Supabase SQL Editor:

```sql
-- Jalankan file: database/fix_manual_recalculate_bdrs_optimized_v2.sql
```

Atau copy-paste isi file `database/fix_manual_recalculate_bdrs_optimized_v2.sql` ke Supabase SQL Editor dan jalankan.

### Langkah 2: Verifikasi Perubahan

Setelah menjalankan SQL, verifikasi dengan:

```sql
-- Cek apakah fungsi sudah terupdate
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_def
FROM pg_proc 
WHERE proname = 'manual_recalculate_bdrs';

-- Cek apakah index sudah ada
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'kalkulasi_bdrs' 
AND indexname LIKE 'idx_kalkulasi_bdrs%';
```

Pastikan di dalam function definition terdapat:
- `statement_timeout` set ke `1200000` (20 menit)
- Menggunakan CTE untuk optimasi
- Error handling yang lengkap

### Langkah 3: Test Rekalkulasi

1. Buka halaman Kalkulasi Biaya BDRS
2. Klik tombol "Rekalkulasi Semua"
3. Perhatikan progress indicator yang menunjukkan 7 steps
4. Pastikan proses selesai tanpa error

## Perbedaan dengan V1

| Aspek | V1 | V2 (Optimized) |
|-------|----|----------------|
| Timeout | 15 menit | **20 menit** |
| Query Method | Standard UPDATE | **CTE-based UPDATE** |
| Index | Tidak ada | **Index optimization** |
| Chunking | Tidak ada | **Single optimized query** |
| Performance | Standard | **Lebih cepat dan efisien** |

## Optimasi yang Diterapkan

1. **CTE (Common Table Expression)**: Menggunakan CTE untuk menghitung nilai terlebih dahulu sebelum UPDATE, mengurangi waktu eksekusi
2. **Index Optimization**: Memastikan index ada pada kolom `tahun` dan `(tahun, kode)` untuk query yang lebih cepat
3. **Single Query Update**: Menggabungkan semua perhitungan dalam satu query dengan CTE untuk mengurangi round-trip ke database
4. **Skip Refresh**: Melewati refresh rekapitulasi yang berat untuk menghindari timeout tambahan

## Catatan Penting

1. **Timeout 20 menit** diatur untuk handle data yang sangat besar. Jika masih timeout:
   - Periksa jumlah data di tabel `kalkulasi_bdrs` untuk tahun tersebut
   - Pertimbangkan untuk melakukan rekalkulasi per batch (jika ada banyak data)
   - Hubungi administrator database untuk mengecek resources

2. **Refresh Rekapitulasi** di-skip untuk menghindari timeout. Refresh bisa dilakukan secara terpisah setelah rekalkulasi selesai dengan memanggil:
   ```sql
   SELECT refresh_rekapitulasi_unit_cost(NULL, <tahun>);
   ```

3. **Index**: Pastikan index sudah dibuat. File SQL akan membuat index secara otomatis jika belum ada.

## Troubleshooting

### Jika masih timeout setelah 20 menit:
1. Periksa jumlah records:
   ```sql
   SELECT COUNT(*) FROM kalkulasi_bdrs WHERE tahun = <tahun>;
   ```
2. Jika jumlah records sangat besar (>10,000), pertimbangkan:
   - Membagi proses menjadi batch berdasarkan kode
   - Meningkatkan resources database
   - Mengoptimasi query lebih lanjut

### Jika error "function not found":
1. Pastikan fungsi `manual_recalculate_bdrs` sudah dibuat
2. Cek apakah schema name benar (public)
3. Pastikan sudah menjalankan file SQL dengan benar

### Jika error "permission denied":
1. Pastikan user memiliki akses SECURITY DEFINER
2. Periksa RLS policies pada tabel terkait

## File yang Dimodifikasi

1. `database/fix_manual_recalculate_bdrs_optimized_v2.sql` - Fungsi database baru dengan optimasi (BARU)
2. `src/utils/database-operations.ts` - Timeout ditingkatkan ke 20 menit (DIPERBAIKI)
3. `src/pages/KalkulasiBiayaBDRS.tsx` - Progress indicator dan error messages (SUDAH DIPERBAIKI)

## Status

✅ Semua perbaikan telah diterapkan pada kode
⏳ **PENTING**: Jalankan file SQL `fix_manual_recalculate_bdrs_optimized_v2.sql` di database untuk menerapkan perubahan

## Testing Checklist

- [ ] File SQL sudah dijalankan di database
- [ ] Fungsi `manual_recalculate_bdrs` sudah terupdate
- [ ] Index sudah dibuat
- [ ] Rekalkulasi berhasil tanpa timeout
- [ ] Progress indicator berfungsi dengan baik
- [ ] Error messages informatif jika terjadi error

