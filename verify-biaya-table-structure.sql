-- Script untuk memverifikasi struktur tabel biaya dan relasi unit_kerja
-- Jalankan script ini di Supabase SQL Editor untuk memastikan semua sudah benar

-- 1. Cek apakah tabel biaya ada
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'biaya';

-- 2. Cek struktur lengkap tabel biaya
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'biaya' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Cek apakah field unit_kerja_id ada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'biaya' 
  AND table_schema = 'public'
  AND column_name = 'unit_kerja_id';

-- 4. Cek foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'biaya';

-- 5. Cek indexes pada tabel biaya
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'biaya'
ORDER BY indexname;

-- 6. Cek RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'biaya';

-- 7. Test query dengan join ke unit_kerja
SELECT 
  b.id,
  b.tahun,
  b.unit_kerja_id,
  uk.kode as unit_kerja_kode,
  uk.nama as unit_kerja_nama,
  uk.kategori as unit_kerja_kategori,
  b.biaya_gaji_tunjangan,
  b.created_at
FROM biaya b
LEFT JOIN unit_kerja uk ON b.unit_kerja_id = uk.id
LIMIT 5;

-- 8. Cek data sample
SELECT COUNT(*) as total_biaya_records FROM biaya;
SELECT COUNT(*) as total_unit_kerja_records FROM unit_kerja;
