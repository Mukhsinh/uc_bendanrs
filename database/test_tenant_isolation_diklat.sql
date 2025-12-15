-- Script Testing Isolasi Tenant untuk Tabel Diklat
-- Jalankan script ini untuk memverifikasi isolasi tenant bekerja dengan benar

-- =====================================================
-- 1. TEST: Verifikasi tidak ada data dengan tenant_id NULL
-- =====================================================
SELECT 
  'kalkulasi_diklat' as table_name,
  COUNT(*) as total_rows,
  COUNT(tenant_id) as rows_with_tenant_id,
  COUNT(*) - COUNT(tenant_id) as rows_with_null_tenant_id
FROM kalkulasi_diklat
UNION ALL
SELECT 
  'data_diklat' as table_name,
  COUNT(*) as total_rows,
  COUNT(tenant_id) as rows_with_tenant_id,
  COUNT(*) - COUNT(tenant_id) as rows_with_null_tenant_id
FROM data_diklat;

-- Expected: rows_with_null_tenant_id = 0 untuk kedua tabel

-- =====================================================
-- 2. TEST: Verifikasi semua tenant_id valid (ada di tabel tenants)
-- =====================================================
SELECT 
  'kalkulasi_diklat' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN t.id IS NOT NULL THEN 1 END) as rows_with_valid_tenant,
  COUNT(CASE WHEN t.id IS NULL THEN 1 END) as rows_with_invalid_tenant
FROM kalkulasi_diklat kd
LEFT JOIN tenants t ON kd.tenant_id = t.id
UNION ALL
SELECT 
  'data_diklat' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN t.id IS NOT NULL THEN 1 END) as rows_with_valid_tenant,
  COUNT(CASE WHEN t.id IS NULL THEN 1 END) as rows_with_invalid_tenant
FROM data_diklat dd
LEFT JOIN tenants t ON dd.tenant_id = t.id;

-- Expected: rows_with_invalid_tenant = 0 untuk kedua tabel

-- =====================================================
-- 3. TEST: Verifikasi query join hanya menampilkan data dengan tenant_id yang sama
-- =====================================================
SELECT 
  dd.id,
  dd.kode_materi,
  dd.nama_materi,
  dd.tenant_id as data_diklat_tenant_id,
  kd.tenant_id as kalkulasi_tenant_id,
  CASE 
    WHEN dd.tenant_id = kd.tenant_id THEN 'SAME TENANT' 
    ELSE 'DIFFERENT TENANT - ERROR!'
  END as tenant_match
FROM data_diklat dd
LEFT JOIN kalkulasi_diklat kd ON dd.kalkulasi_diklat_id = kd.id
ORDER BY dd.created_at DESC;

-- Expected: Semua baris memiliki tenant_match = 'SAME TENANT'

-- =====================================================
-- 4. TEST: Distribusi data per tenant
-- =====================================================
SELECT 
  tenant_id,
  COUNT(*) as count,
  'kalkulasi_diklat' as table_name
FROM kalkulasi_diklat
GROUP BY tenant_id
UNION ALL
SELECT 
  tenant_id,
  COUNT(*) as count,
  'data_diklat' as table_name
FROM data_diklat
GROUP BY tenant_id
ORDER BY table_name, tenant_id;

-- Expected: Data terdistribusi dengan jelas per tenant

-- =====================================================
-- 5. TEST: Verifikasi RLS Policies Aktif
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  permissive
FROM pg_policies 
WHERE tablename IN ('kalkulasi_diklat', 'data_diklat')
  AND policyname LIKE '%tenant%'
ORDER BY tablename, cmd;

-- Expected: Policies untuk tenant isolation ada untuk kedua tabel

-- =====================================================
-- 6. TEST: Verifikasi Trigger Auto-Set Tenant ID
-- =====================================================
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid IN (
  'public.kalkulasi_diklat'::regclass,
  'public.data_diklat'::regclass
)
AND tgname LIKE '%tenant%'
AND tgisinternal = false;

-- Expected: Trigger auto_set_tenant_id ada untuk kedua tabel

-- =====================================================
-- 7. TEST: Verifikasi Foreign Key Constraint Tenant ID
-- =====================================================
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
  AND tc.table_name IN ('kalkulasi_diklat', 'data_diklat')
  AND kcu.column_name = 'tenant_id';

-- Expected: Foreign key constraint dari tenant_id ke tenants.id ada

-- =====================================================
-- KESIMPULAN TESTING
-- =====================================================
-- Jika semua test di atas menghasilkan hasil yang diharapkan, maka:
-- ✅ Isolasi tenant sudah bekerja dengan sempurna
-- ✅ Tidak ada data dengan tenant_id NULL
-- ✅ Semua tenant_id valid
-- ✅ Query join hanya menampilkan data dengan tenant yang sama
-- ✅ RLS policies sudah aktif
-- ✅ Trigger auto-set tenant_id sudah aktif
-- ✅ Foreign key constraint sudah ada








