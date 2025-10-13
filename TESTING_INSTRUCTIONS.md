# Instruksi Testing Halaman Biaya

## Masalah: Halaman /data-master/biaya tidak bisa diakses

## Solusi yang Sudah Diterapkan:

### 1. ✅ Environment Variables
- File `.env` sudah dibuat dengan konfigurasi Supabase yang benar
- Fallback values sudah ditambahkan di `client.ts`

### 2. ✅ Error Handling & Debugging
- Logging yang lebih detail sudah ditambahkan
- Loading states sudah diperbaiki
- Error messages sudah ditambahkan

### 3. ✅ Test Tools
- Halaman test Supabase sudah dibuat di `/test-supabase`
- Test functions sudah ditambahkan

## Langkah-langkah Testing:

### Step 1: Pastikan Aplikasi Berjalan
```bash
npm run dev
```
Aplikasi harus berjalan di `http://localhost:5173`

### Step 2: Test Koneksi Supabase
1. Buka browser dan kunjungi: `http://localhost:5173/test-supabase`
2. Periksa hasil test di halaman
3. Buka Developer Tools (F12) dan lihat Console untuk log detail

### Step 3: Test Authentication
1. Dari halaman test, coba klik "Test Login"
2. Jika gagal, buat akun baru melalui halaman login
3. Buka `http://localhost:5173/login` dan buat akun baru

### Step 4: Test Halaman Biaya
1. Setelah login berhasil, kunjungi: `http://localhost:5173/data-master/biaya`
2. Buka Developer Tools (F12) dan lihat Console
3. Periksa apakah ada error atau data tampil

## Debug Information:

### Console Logs yang Harus Muncul:
```
=== BIYA FORM TABLE INITIALIZATION ===
=== TESTING SUPABASE CONNECTION ===
1. Supabase client: [object]
2. Supabase URL: https://koepzicdtovtknsqlnac.supabase.co
3. Supabase Key exists: true
4. Session check result: [session info]
5. Data biaya table test: [table info]
=== END TEST ===
```

### Jika Ada Error:
1. **Environment Variables**: Pastikan file `.env` ada dan benar
2. **Supabase Connection**: Periksa URL dan API key
3. **Authentication**: Pastikan user sudah login
4. **RLS Policies**: Pastikan user memiliki permission

## Troubleshooting:

### Error: "Sesi tidak ditemukan"
- **Solusi**: Login terlebih dahulu di `/login`

### Error: "Gagal memuat data biaya"
- **Solusi**: Periksa Console untuk error detail
- Pastikan user memiliki data biaya

### Error: "Supabase connection failed"
- **Solusi**: Periksa file `.env` dan restart aplikasi

## File yang Telah Dimodifikasi:
- ✅ `src/integrations/supabase/client.ts` - Konfigurasi Supabase
- ✅ `src/components/BiayaFormTable.tsx` - Error handling & debugging
- ✅ `src/App.tsx` - Route untuk test page
- ✅ `src/pages/TestSupabase.tsx` - Halaman test (BARU)
- ✅ `src/test-supabase.ts` - Test functions (BARU)
- ✅ `.env` - Environment variables (BARU)

## Next Steps:
1. Jalankan aplikasi: `npm run dev`
2. Test koneksi: `http://localhost:5173/test-supabase`
3. Login: `http://localhost:5173/login`
4. Test biaya: `http://localhost:5173/data-master/biaya`
5. Periksa Console untuk debugging info

## Kontak Support:
Jika masih ada masalah, berikan informasi:
- Screenshot error message
- Console logs dari Developer Tools
- Langkah yang sudah dicoba
