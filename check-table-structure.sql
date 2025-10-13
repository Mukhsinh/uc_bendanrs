-- Script untuk mengecek struktur tabel yang ada di Supabase
-- Jalankan script ini untuk memverifikasi struktur tabel

-- 1. Cek apakah tabel-tabel utama ada
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Data_Kegiatan', 'unit_kerja', 'barang', 'biaya')
ORDER BY table_name;

-- 2. Cek struktur tabel Data_Kegiatan
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Data_Kegiatan' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Cek struktur tabel unit_kerja
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'unit_kerja' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Cek struktur tabel barang
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'barang' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Cek struktur tabel biaya
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'biaya' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Cek foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('Data_Kegiatan', 'unit_kerja', 'barang', 'biaya');

-- 7. Cek indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('Data_Kegiatan', 'unit_kerja', 'barang', 'biaya')
ORDER BY tablename, indexname;
