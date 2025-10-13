-- Script untuk verifikasi lengkap database
-- Jalankan script ini di Supabase SQL Editor untuk memastikan semua sudah benar

-- 1. Cek semua tabel yang ada
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('unit_kerja', 'Data_Kegiatan', 'Dasar_Alokasi', 'Distribusi_Biaya')
ORDER BY table_name;

-- 2. Cek struktur tabel Dasar_Alokasi
SELECT 
    'Dasar_Alokasi' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Dasar_Alokasi' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Cek struktur tabel Distribusi_Biaya
SELECT 
    'Distribusi_Biaya' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Distribusi_Biaya' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Cek indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('Dasar_Alokasi', 'Distribusi_Biaya')
ORDER BY tablename, indexname;

-- 5. Cek RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('Dasar_Alokasi', 'Distribusi_Biaya')
ORDER BY tablename, policyname;

-- 6. Cek triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table IN ('Dasar_Alokasi', 'Distribusi_Biaya')
ORDER BY event_object_table, trigger_name;

-- 7. Cek functions
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('generate_dasar_alokasi_otomatis', 'hitung_distribusi_biaya', 'update_updated_at_column')
ORDER BY routine_name;

-- 8. Cek data count
SELECT 
    'unit_kerja' as table_name,
    COUNT(*) as record_count
FROM unit_kerja
UNION ALL
SELECT 
    'Data_Kegiatan' as table_name,
    COUNT(*) as record_count
FROM "Data_Kegiatan"
UNION ALL
SELECT 
    'Dasar_Alokasi' as table_name,
    COUNT(*) as record_count
FROM "Dasar_Alokasi"
UNION ALL
SELECT 
    'Distribusi_Biaya' as table_name,
    COUNT(*) as record_count
FROM "Distribusi_Biaya";

-- 9. Test insert dan select (opsional)
-- Uncomment untuk test insert
/*
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

SELECT * FROM "Dasar_Alokasi" WHERE "Kode_UK" = 'TEST001';

DELETE FROM "Dasar_Alokasi" WHERE "Kode_UK" = 'TEST001';
*/
