# Fix Error Rekalkulasi BDRS - Statement Timeout

## Masalah
Error "statement timeout" terjadi saat melakukan rekalkulasi semua pada halaman Kalkulasi Biaya BDRS. Error ini disebabkan karena:
1. Timeout di level database server terlalu pendek untuk operasi rekalkulasi yang berat
2. Error handling di client-side kurang informatif
3. Timeout di client-side juga perlu ditingkatkan

## Solusi yang Diterapkan

### 1. Database Function (fix_manual_recalculate_bdrs_final.sql)
- ✅ Meningkatkan `statement_timeout` dari 10 menit (600000ms) ke **15 menit (900000ms)**
- ✅ Skip refresh rekapitulasi_unit_cost untuk menghindari timeout tambahan
- ✅ Error handling yang lebih baik dengan pesan error yang informatif
- ✅ Progress tracking untuk monitoring

### 2. Client-Side Improvements

#### database-operations.ts
- ✅ Meningkatkan timeout client dari 10 menit ke **15 menit (900000ms)**
- ✅ Meningkatkan maxRetries dari 1 ke **2** untuk handle transient errors
- ✅ Error handling yang lebih baik untuk berbagai jenis error

#### KalkulasiBiayaBDRS.tsx
- ✅ Progress indicator yang lebih detail (7 steps)
- ✅ Pesan error yang lebih informatif dan user-friendly
- ✅ Menampilkan warning jika refresh rekapitulasi gagal
- ✅ Durasi toast error lebih lama (10 detik) untuk error message yang panjang

## Cara Menerapkan

### Langkah 1: Terapkan File SQL ke Database

Jalankan file SQL berikut di Supabase SQL Editor:

```sql
-- Jalankan file: database/fix_manual_recalculate_bdrs_final.sql
```

Atau copy-paste isi file `database/fix_manual_recalculate_bdrs_final.sql` ke Supabase SQL Editor dan jalankan.

### Langkah 2: Verifikasi Perubahan

Setelah menjalankan SQL, verifikasi dengan:

```sql
-- Cek apakah fungsi sudah terupdate
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_def
FROM pg_proc 
WHERE proname = 'manual_recalculate_bdrs';
```

Pastikan di dalam function definition terdapat:
- `statement_timeout` set ke `900000` (15 menit)
- Error handling yang lengkap

### Langkah 3: Test Rekalkulasi

1. Buka halaman Kalkulasi Biaya BDRS
2. Klik tombol "Rekalkulasi Semua"
3. Perhatikan progress indicator yang menunjukkan 7 steps
4. Pastikan proses selesai tanpa error

## Catatan Penting

1. **Timeout 15 menit** diatur untuk handle data yang sangat besar. Jika masih timeout, pertimbangkan:
   - Mengoptimasi query di database function
   - Membagi proses menjadi batch yang lebih kecil
   - Meningkatkan resources database

2. **Refresh Rekapitulasi** bisa gagal jika data sangat besar, tapi ini tidak akan mengganggu proses rekalkulasi utama. Refresh bisa dilakukan secara terpisah.

3. **Error Messages** sekarang lebih informatif dan memberikan saran untuk mengatasi masalah.

## Troubleshooting

### Jika masih timeout setelah 15 menit:
1. Periksa jumlah data di tabel `kalkulasi_bdrs` untuk tahun tersebut
2. Pertimbangkan untuk melakukan rekalkulasi per batch (jika ada banyak data)
3. Hubungi administrator database untuk mengecek resources

### Jika error "permission denied":
1. Pastikan user memiliki akses SECURITY DEFINER
2. Periksa RLS policies pada tabel terkait

### Jika error "function not found":
1. Pastikan fungsi `manual_recalculate_bdrs` sudah dibuat
2. Cek apakah schema name benar (public)

## File yang Dimodifikasi

1. `database/fix_manual_recalculate_bdrs_final.sql` - Fungsi database baru
2. `src/utils/database-operations.ts` - Timeout dan error handling
3. `src/pages/KalkulasiBiayaBDRS.tsx` - Progress indicator dan error messages

## Status

✅ Semua perbaikan telah diterapkan pada kode
⏳ Perlu menjalankan file SQL di database untuk menerapkan perubahan

