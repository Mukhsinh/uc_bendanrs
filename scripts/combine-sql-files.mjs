
import { readFileSync, writeFileSync, readdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../public/data 2025');
const OUTPUT_FILE = join(__dirname, '../database/import-all-data-2025.sql');

const TABLE_ORDER = [
  'tenants',
  'tenant_settings',
  'user_roles',
  'user_profiles',
  'users_with_roles',
  'daftar_tindakan',
  'data_barang_farmasi',
  'data_master_barang_farmasi',
  'data_barang_gizi',
  'data_dokter',
  'data_kegiatan',
  'data_kegiatan_transpose',
  'Dasar_Alokasi',
  'analisa_bahan_pemeriksaan',
  'Data_Kamar',
  'data_akomodasi_inap',
  'data_diklat',
  'data_biaya',
  'data_pendapatan',
  'Alokasibiaya pertama dengan JP',
  'Alokasi biaya kedua dengan JP',
  'Alokasi BTL dengan JP',
  'budgeting_bhp_farmasi',
  'budgeting_bhp_farmasi_public',
  'cost_recovery',
  'branding_settings',
  'biaya_preference',
  'audit_trail',
  'api_biaya_endpoints'
];

// Start with an empty file, overwrite existing
writeFileSync(OUTPUT_FILE, `-- ============================================================================
-- SQL Script to Import All Data from /public/data 2025
-- RUN THIS ENTIRE FILE IN YOUR SUPABASE SQL EDITOR!
-- ============================================================================

-- 1. Create helper functions
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
END;
$$;

CREATE OR REPLACE FUNCTION public.disable_all_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.enable_all_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END;
$$;

-- 2. Disable RLS for import
SELECT public.disable_all_rls();

-- 3. Add missing columns
ALTER TABLE IF EXISTS public.tenants 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.data_dokter 
ADD COLUMN IF NOT EXISTS jenis_spesialistik text;

ALTER TABLE IF EXISTS public.data_kegiatan 
ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;

ALTER TABLE IF EXISTS public.data_biaya 
ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;

ALTER TABLE IF EXISTS public.data_pendapatan 
ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;

ALTER TABLE IF EXISTS public."Data_Kamar" 
ADD COLUMN IF NOT EXISTS "Kelas_I" text;

ALTER TABLE IF EXISTS public.data_akomodasi_inap 
ADD COLUMN IF NOT EXISTS total_gizi numeric;

ALTER TABLE IF EXISTS public.data_diklat 
ADD COLUMN IF NOT EXISTS biaya_bahan numeric;

ALTER TABLE IF EXISTS public.budgeting_bhp_farmasi 
ADD COLUMN IF NOT EXISTS biaya_bahan numeric;

ALTER TABLE IF EXISTS public.cost_recovery 
ADD COLUMN IF NOT EXISTS pendapatan_apbd numeric;

ALTER TABLE IF EXISTS public.branding_settings 
ADD COLUMN IF NOT EXISTS app_title text;

ALTER TABLE IF EXISTS public.biaya_preference 
ADD COLUMN IF NOT EXISTS biaya_type text;

-- ============================================================================
-- IMPORTING DATA TABLES IN ORDER
-- ============================================================================
`);

// Get all SQL files in data 2025
const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));

// Import in table order
for (const targetTable of TABLE_ORDER) {
  const matchingFiles = files.filter(f => {
    const lowerF = f.toLowerCase();
    const normalized = targetTable.toLowerCase().replace(/\s+/g, '_');
    return lowerF.includes(normalized) || lowerF.includes(targetTable.toLowerCase().replace(/\s+/g, ''));
  });

  if (matchingFiles.length > 0) {
    appendFileSync(OUTPUT_FILE, `\n-- ============================================================================
-- TABLE: ${targetTable}
-- ============================================================================
`);
    for (const file of matchingFiles) {
      console.log(`📄 Combining file: ${file}`);
      const content = readFileSync(join(DATA_DIR, file), 'utf8');
      appendFileSync(OUTPUT_FILE, `\n-- File: ${file}\n`);
      appendFileSync(OUTPUT_FILE, content);
    }
  }
}

// Add final step to re-enable RLS
appendFileSync(OUTPUT_FILE, `
-- ============================================================================
-- FINAL STEP: RE-ENABLE RLS
-- ============================================================================
SELECT public.enable_all_rls();
`);

console.log('\n✅ All files combined into database/import-all-data-2025.sql!');
console.log('\n📝 Next steps:');
console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/iryiykkzapmjioazjcwf/sql/new');
console.log('2. Paste the entire content of database/import-all-data-2025.sql');
console.log('3. Click RUN!');
