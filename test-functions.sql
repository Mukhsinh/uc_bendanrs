-- Script untuk test fungsi-fungsi yang sudah dibuat
-- Jalankan script ini di Supabase SQL Editor setelah membuat tabel dan fungsi

-- 1. Test function generate_dasar_alokasi_otomatis
-- Pastikan ada data di unit_kerja dan Data_Kegiatan terlebih dahulu
SELECT 'Testing generate_dasar_alokasi_otomatis function...' as status;

-- Jalankan fungsi untuk tahun 2024
SELECT generate_dasar_alokasi_otomatis(2024);

-- Cek hasil
SELECT 
    "Kode_UK",
    "Nama_Unit_Kerja",
    "Dasar_Alokasi_Field",
    "Dasar_Alokasi_Value",
    "Tahun"
FROM "Dasar_Alokasi"
WHERE "Tahun" = 2024
ORDER BY "Kode_UK"
LIMIT 10;

-- 2. Test function hitung_distribusi_biaya
SELECT 'Testing hitung_distribusi_biaya function...' as status;

-- Jalankan fungsi dengan total biaya 1000000
SELECT hitung_distribusi_biaya(2024, 1000000);

-- Cek hasil
SELECT 
    "Kode_UK",
    "Nama_Unit_Kerja",
    "Dasar_Alokasi_Field",
    "Dasar_Alokasi_Value",
    "Total_Dasar_Alokasi",
    "Persentase_Alokasi",
    "Biaya_Dialokasikan",
    "Tahun"
FROM "Distribusi_Biaya"
WHERE "Tahun" = 2024
ORDER BY "Biaya_Dialokasikan" DESC
LIMIT 10;

-- 3. Verifikasi total biaya yang dialokasikan
SELECT 
    SUM("Biaya_Dialokasikan") as total_biaya_dialokasikan,
    COUNT(*) as jumlah_unit_kerja
FROM "Distribusi_Biaya"
WHERE "Tahun" = 2024;

-- 4. Cek distribusi berdasarkan field
SELECT 
    "Dasar_Alokasi_Field",
    COUNT(*) as jumlah_unit,
    SUM("Dasar_Alokasi_Value") as total_dasar_alokasi,
    SUM("Biaya_Dialokasikan") as total_biaya_dialokasikan
FROM "Distribusi_Biaya"
WHERE "Tahun" = 2024
GROUP BY "Dasar_Alokasi_Field"
ORDER BY total_biaya_dialokasikan DESC;
