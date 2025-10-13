# 🔧 Panduan Membuat Tabel Database

## 🚨 Status Saat Ini
Berdasarkan pemeriksaan database, ditemukan bahwa:
- ✅ **unit_kerja** - Tabel sudah ada dan dapat diakses
- ❌ **Data_Kegiatan** - Tabel tidak ditemukan
- ❌ **Dasar_Alokasi** - Tabel belum dibuat
- ❌ **Distribusi_Biaya** - Tabel belum dibuat

## 📋 Langkah-langkah Membuat Tabel

### 1. Buka Supabase Dashboard
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Login ke akun Anda
3. Pilih project: `koepzicdtovtknsqlnac`
4. Pergi ke **SQL Editor** (di sidebar kiri)

### 2. Jalankan Script Membuat Tabel
1. Copy seluruh isi file `create-tables-simple.sql`
2. Paste di SQL Editor
3. Klik tombol **Run** (atau tekan Ctrl+Enter)
4. Tunggu hingga script selesai dijalankan

### 3. Jalankan Script Membuat Function
1. Copy seluruh isi file `create-functions.sql`
2. Paste di SQL Editor
3. Klik tombol **Run** (atau tekan Ctrl+Enter)
4. Tunggu hingga script selesai dijalankan

### 4. Verifikasi Tabel Dibuat
Jalankan query berikut untuk memverifikasi:

```sql
-- Cek struktur tabel Dasar_Alokasi
SELECT 
  'Dasar_Alokasi' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Dasar_Alokasi' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Cek struktur tabel Distribusi_Biaya
SELECT 
  'Distribusi_Biaya' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Distribusi_Biaya' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Cek function yang dibuat
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_dasar_alokasi_otomatis', 'hitung_distribusi_biaya');
```

### 5. Test Function
Jalankan query berikut untuk test function:

```sql
-- Test generate dasar alokasi (pastikan ada data di unit_kerja dan Data_Kegiatan)
SELECT generate_dasar_alokasi_otomatis(2024);

-- Test hitung distribusi biaya
SELECT hitung_distribusi_biaya(2024, 1000000000);
```

## 🔍 Troubleshooting

### Jika Error "Table already exists"
- Ini normal, script menggunakan `CREATE TABLE IF NOT EXISTS`
- Lanjutkan ke langkah berikutnya

### Jika Error "Permission denied"
- Pastikan Anda login sebagai owner project
- Atau minta owner untuk menjalankan script

### Jika Error "Function already exists"
- Ini normal, script menggunakan `CREATE OR REPLACE FUNCTION`
- Lanjutkan ke langkah berikutnya

### Jika Error "Could not find table Data_Kegiatan"
- Tabel Data_Kegiatan belum dibuat
- Buat tabel Data_Kegiatan terlebih dahulu atau gunakan data yang ada

## 📊 Data yang Diperlukan

### Pastikan Ada Data di Tabel Prasyarat:

```sql
-- Cek data unit_kerja
SELECT COUNT(*) as total_unit_kerja FROM unit_kerja;

-- Cek data Data_Kegiatan (jika ada)
SELECT COUNT(*) as total_data_kegiatan FROM "Data_Kegiatan";

-- Jika tidak ada data, buat sample data
INSERT INTO unit_kerja (kode, nama, kategori, luas_ruangan) VALUES
('UK001', 'Direktur', 'Pusat Biaya', 50.0),
('UK002', 'Komite PPI', 'Pusat Biaya', 30.0),
('UK003', 'Unit IT', 'Pusat Biaya', 40.0),
('UK004', 'IPSRS', 'Pusat Biaya', 100.0),
('UK005', 'Bid Keperawatan', 'Pusat Biaya', 200.0);

-- Sample data Data_Kegiatan (jika tabel ada)
INSERT INTO "Data_Kegiatan" (tahun, "Kode_UK", "Nama_Unit_Kerja", "Jumlah_SDM", "Total_Kunjungan_Pasien", "Komputer_simrs_user") VALUES
(2024, 'UK001', 'Direktur', 5, 0, 2),
(2024, 'UK002', 'Komite PPI', 3, 0, 1),
(2024, 'UK003', 'Unit IT', 4, 0, 10),
(2024, 'UK004', 'IPSRS', 8, 0, 3),
(2024, 'UK005', 'Bid Keperawatan', 15, 1000, 5);
```

## ✅ Verifikasi Akhir

Setelah semua script dijalankan, jalankan script check database:

```bash
node check-database-status.cjs
```

Hasil yang diharapkan:
```
✅ unit_kerja: ✅
✅ Data_Kegiatan: ✅ (jika ada)
✅ Dasar_Alokasi: ✅
✅ Distribusi_Biaya: ✅
```

## 🚀 Test Aplikasi

1. Jalankan aplikasi: `npm run dev`
2. Buka browser: `http://localhost:8089`
3. Login ke aplikasi
4. Test halaman:
   - `http://localhost:8089/test-dasar-alokasi`
   - `http://localhost:8089/dasar-alokasi`
   - `http://localhost:8089/distribusi-biaya`

## 📁 File yang Perlu Dijalankan

1. **create-tables-simple.sql** - Membuat tabel Dasar_Alokasi dan Distribusi_Biaya
2. **create-functions.sql** - Membuat function generate_dasar_alokasi_otomatis dan hitung_distribusi_biaya
3. **check-database-status.cjs** - Script untuk verifikasi

---

**Catatan**: Pastikan untuk menjalankan script dalam urutan yang benar: tabel dulu, kemudian function!
