# 🔧 Panduan Memperbaiki Database dan Halaman Aplikasi

## 🚨 Masalah yang Ditemukan

1. **Tabel database belum muncul** - Tabel `Dasar_Alokasi` dan `Distribusi_Biaya` belum dibuat di Supabase
2. **Halaman aplikasi belum tampil** - Kemungkinan ada masalah dengan routing atau komponen

## ✅ Solusi Lengkap

### 1. Setup Database (PRIORITAS UTAMA)

#### Langkah 1: Buka Supabase Dashboard
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Pergi ke **SQL Editor**

#### Langkah 2: Jalankan Script SQL
1. Copy seluruh isi file `create-dasar-alokasi-table-fixed.sql`
2. Paste di SQL Editor
3. Klik **Run** untuk menjalankan script

#### Langkah 3: Verifikasi Tabel Dibuat
Jalankan query berikut untuk memverifikasi:
```sql
-- Cek tabel Dasar_Alokasi
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Dasar_Alokasi' 
ORDER BY ordinal_position;

-- Cek tabel Distribusi_Biaya
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Distribusi_Biaya' 
ORDER BY ordinal_position;
```

### 2. Setup Data Dasar

#### Pastikan Ada Data di Tabel Prasyarat
```sql
-- Cek data unit_kerja
SELECT COUNT(*) as total_unit_kerja FROM unit_kerja;

-- Cek data Data_Kegiatan
SELECT COUNT(*) as total_data_kegiatan FROM "Data_Kegiatan";

-- Jika tidak ada data, buat sample data
INSERT INTO unit_kerja (kode, nama, kategori, luas_ruangan) VALUES
('UK001', 'Direktur', 'Pusat Biaya', 50.0),
('UK002', 'Komite PPI', 'Pusat Biaya', 30.0),
('UK003', 'Unit IT', 'Pusat Biaya', 40.0);

INSERT INTO "Data_Kegiatan" (tahun, "Kode_UK", "Nama_Unit_Kerja", "Jumlah_SDM", "Total_Kunjungan_Pasien", "Komputer_simrs_user") VALUES
(2024, 'UK001', 'Direktur', 5, 0, 2),
(2024, 'UK002', 'Komite PPI', 3, 0, 1),
(2024, 'UK003', 'Unit IT', 4, 0, 10);
```

### 3. Test Halaman Aplikasi

#### Langkah 1: Jalankan Aplikasi
```bash
npm run dev
```

#### Langkah 2: Test Halaman
1. Buka browser ke `http://localhost:5173`
2. Login ke aplikasi
3. Test halaman berikut:
   - `http://localhost:5173/test-dasar-alokasi` - Halaman test sederhana
   - `http://localhost:5173/dasar-alokasi` - Halaman dasar alokasi
   - `http://localhost:5173/distribusi-biaya` - Halaman distribusi biaya

### 4. Troubleshooting

#### Jika Halaman Tidak Tampil:
1. **Cek Console Browser** - Buka Developer Tools (F12) dan lihat error di Console
2. **Cek Network Tab** - Lihat apakah ada request yang gagal
3. **Cek Terminal** - Lihat error di terminal tempat aplikasi berjalan

#### Jika Database Error:
1. **Cek Supabase Connection** - Pastikan URL dan API key benar
2. **Cek RLS Policies** - Pastikan policy sudah dibuat dengan benar
3. **Cek Table Permissions** - Pastikan user memiliki akses ke tabel

### 5. Script Verifikasi

#### Jalankan Script Check Database
```bash
# Buat file check-db.js
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('YOUR_URL', 'YOUR_KEY');

async function check() {
  try {
    const { data, error } = await supabase.from('Dasar_Alokasi').select('*').limit(1);
    if (error) console.log('❌ Dasar_Alokasi error:', error.message);
    else console.log('✅ Dasar_Alokasi OK');
    
    const { data: data2, error: error2 } = await supabase.from('Distribusi_Biaya').select('*').limit(1);
    if (error2) console.log('❌ Distribusi_Biaya error:', error2.message);
    else console.log('✅ Distribusi_Biaya OK');
  } catch (e) {
    console.log('❌ Connection error:', e.message);
  }
}
check();
"
```

### 6. File yang Perlu Diperiksa

#### Database Files:
- ✅ `create-dasar-alokasi-table-fixed.sql` - Script SQL yang diperbaiki
- ✅ `src/scripts/check-database-tables.ts` - Script untuk check database
- ✅ `src/scripts/setup-database-tables.ts` - Script untuk setup database

#### Application Files:
- ✅ `src/pages/TestDasarAlokasi.tsx` - Halaman test sederhana
- ✅ `src/pages/DasarAlokasi.tsx` - Halaman dasar alokasi
- ✅ `src/pages/DistribusiBiaya.tsx` - Halaman distribusi biaya
- ✅ `src/components/DasarAlokasiFormTable.tsx` - Komponen form (diperbaiki)
- ✅ `src/types/dasar-alokasi.ts` - TypeScript types
- ✅ `src/App.tsx` - Routing (sudah ditambahkan)

### 7. Urutan Eksekusi yang Benar

1. **Jalankan Script SQL** di Supabase Dashboard
2. **Verifikasi Tabel** dengan query SQL
3. **Pastikan Ada Data** di tabel unit_kerja dan Data_Kegiatan
4. **Jalankan Aplikasi** dengan `npm run dev`
5. **Test Halaman** mulai dari `/test-dasar-alokasi`
6. **Generate Dasar Alokasi** di halaman `/dasar-alokasi`
7. **Hitung Distribusi Biaya** dengan input total biaya
8. **Lihat Laporan** di halaman `/distribusi-biaya`

### 8. Error Handling yang Sudah Ditambahkan

- ✅ Error handling untuk database connection
- ✅ Error handling untuk missing tables
- ✅ Error handling untuk missing data
- ✅ Retry button untuk reload data
- ✅ Loading states yang proper
- ✅ User-friendly error messages

## 🎯 Hasil yang Diharapkan

Setelah mengikuti panduan ini:

1. ✅ Tabel `Dasar_Alokasi` dan `Distribusi_Biaya` akan muncul di Supabase
2. ✅ Halaman aplikasi akan tampil dengan benar
3. ✅ Fitur generate dasar alokasi akan berfungsi
4. ✅ Fitur hitung distribusi biaya akan berfungsi
5. ✅ Laporan distribusi biaya akan dapat dilihat dan diekspor

## 📞 Jika Masih Ada Masalah

1. **Cek Console Browser** untuk error JavaScript
2. **Cek Supabase Logs** untuk error database
3. **Cek Network Requests** untuk error API
4. **Restart Aplikasi** dengan `Ctrl+C` lalu `npm run dev`
5. **Clear Browser Cache** dan refresh halaman

---

**Catatan**: Pastikan untuk menjalankan script SQL di Supabase terlebih dahulu sebelum menguji halaman aplikasi!
