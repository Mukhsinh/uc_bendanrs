-- ================================
-- URGENT FIX: Disable RLS for data_kegiatan
-- Run this in Supabase SQL Editor
-- ================================

-- Step 1: Disable RLS completely for data_kegiatan
ALTER TABLE data_kegiatan DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "data_kegiatan_select" ON data_kegiatan;
DROP POLICY IF EXISTS "data_kegiatan_insert" ON data_kegiatan;
DROP POLICY IF EXISTS "data_kegiatan_update" ON data_kegiatan;
DROP POLICY IF EXISTS "data_kegiatan_delete" ON data_kegiatan;
DROP POLICY IF EXISTS "Allow all operations on data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can delete own data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can insert own data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can update own data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can view data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can view own data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users with permission can manage data_kegiatan" ON data_kegiatan;

-- Step 3: Also disable RLS for data_akomodasi_inap
ALTER TABLE data_akomodasi_inap DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing policies for data_akomodasi_inap
DROP POLICY IF EXISTS "Users can view own data_akomodasi_inap" ON data_akomodasi_inap;
DROP POLICY IF EXISTS "Users can insert own data_akomodasi_inap" ON data_akomodasi_inap;
DROP POLICY IF EXISTS "Users can update own data_akomodasi_inap" ON data_akomodasi_inap;
DROP POLICY IF EXISTS "Users can delete own data_akomodasi_inap" ON data_akomodasi_inap;
DROP POLICY IF EXISTS "data_akomodasi_inap_select" ON data_akomodasi_inap;
DROP POLICY IF EXISTS "data_akomodasi_inap_insert" ON data_akomodasi_inap;
DROP POLICY IF EXISTS "data_akomodasi_inap_update" ON data_akomodasi_inap;
DROP POLICY IF EXISTS "data_akomodasi_inap_delete" ON data_akomodasi_inap;

-- Verification
SELECT 
    'data_kegiatan' as table_name,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'data_kegiatan') as rls_enabled
UNION ALL
SELECT 
    'data_akomodasi_inap' as table_name,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'data_akomodasi_inap') as rls_enabled;

SELECT 'RLS has been DISABLED for data_kegiatan and data_akomodasi_inap tables. Operations should now work without restrictions.' as status;
