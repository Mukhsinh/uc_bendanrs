-- Script untuk test setelah tabel dibuat
-- Jalankan script ini di Supabase SQL Editor setelah membuat tabel

-- 1. Test insert ke Dasar_Alokasi
INSERT INTO "Dasar_Alokasi" (
    "Kode_UK", 
    "Nama_Unit_Kerja", 
    "Kategori", 
    "Dasar_Alokasi_Field", 
    "Dasar_Alokasi_Value", 
    "Tahun"
) VALUES (
    'TEST001', 
    'Test Unit', 
    'Test Kategori', 
    'Jumlah_SDM', 
    10, 
    2024
);

-- 2. Test select dari Dasar_Alokasi
SELECT * FROM "Dasar_Alokasi" WHERE "Kode_UK" = 'TEST001';

-- 3. Test insert ke Distribusi_Biaya
INSERT INTO "Distribusi_Biaya" (
    "Kode_UK", 
    "Nama_Unit_Kerja", 
    "Kategori", 
    "Dasar_Alokasi_Field", 
    "Dasar_Alokasi_Value", 
    "Total_Dasar_Alokasi",
    "Persentase_Alokasi",
    "Biaya_Dialokasikan",
    "Tahun"
) VALUES (
    'TEST001', 
    'Test Unit', 
    'Test Kategori', 
    'Jumlah_SDM', 
    10,
    100,
    0.1,
    1000,
    2024
);

-- 4. Test select dari Distribusi_Biaya
SELECT * FROM "Distribusi_Biaya" WHERE "Kode_UK" = 'TEST001';

-- 5. Cleanup test data
DELETE FROM "Dasar_Alokasi" WHERE "Kode_UK" = 'TEST001';
DELETE FROM "Distribusi_Biaya" WHERE "Kode_UK" = 'TEST001';

-- 6. Final verification
SELECT 'SUCCESS: All tables working correctly!' as status;
