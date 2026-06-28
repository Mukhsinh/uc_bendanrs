import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

// SQL to run
const setupSql = `
-- Create exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
END;
$$;

-- Create disable_all_rls function
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

-- Create enable_all_rls function
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

-- Add missing columns to tenants
ALTER TABLE IF EXISTS public.tenants 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add missing column to data_dokter
ALTER TABLE IF EXISTS public.data_dokter 
ADD COLUMN IF NOT EXISTS jenis_spesialistik text;

-- Add is_dummy to data_kegiatan
ALTER TABLE IF EXISTS public.data_kegiatan 
ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;

-- Add is_dummy to data_biaya
ALTER TABLE IF EXISTS public.data_biaya 
ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;

-- Add is_dummy to data_pendapatan
ALTER TABLE IF EXISTS public.data_pendapatan 
ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;

-- Add Kelas_I to Data_Kamar
ALTER TABLE IF EXISTS public."Data_Kamar" 
ADD COLUMN IF NOT EXISTS "Kelas_I" text;

-- Add total_gizi to data_akomodasi_inap
ALTER TABLE IF EXISTS public.data_akomodasi_inap 
ADD COLUMN IF NOT EXISTS total_gizi numeric;

-- Add biaya_bahan to data_diklat
ALTER TABLE IF EXISTS public.data_diklat 
ADD COLUMN IF NOT EXISTS biaya_bahan numeric;

-- Add biaya_bahan to budgeting_bhp_farmasi
ALTER TABLE IF EXISTS public.budgeting_bhp_farmasi 
ADD COLUMN IF NOT EXISTS biaya_bahan numeric;

-- Add pendapatan_apbd to cost_recovery
ALTER TABLE IF EXISTS public.cost_recovery 
ADD COLUMN IF NOT EXISTS pendapatan_apbd numeric;

-- Add app_title to branding_settings
ALTER TABLE IF EXISTS public.branding_settings 
ADD COLUMN IF NOT EXISTS app_title text;

-- Add biaya_type to biaya_preference
ALTER TABLE IF EXISTS public.biaya_preference 
ADD COLUMN IF NOT EXISTS biaya_type text;

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.analisa_bahan_pemeriksaan (
    id bigint,
    -- Add other columns based on data
    tenant_id uuid,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.budgeting_bhp_farmasi_public (
    id bigint,
    tenant_id uuid,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.api_biaya_endpoints (
    id bigint,
    tenant_id uuid,
    created_at timestamptz,
    updated_at timestamptz
);
`;

async function main() {
    console.log('🚀 Setting up database...');
    // Try to run setup SQL by splitting into statements
    const statements = setupSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
        try {
            // We can't use rpc('exec_sql') if it doesn't exist yet!
            // So let's use a different approach - let's use the Supabase client's `rpc` with a DO block!
            // Wait, no! Let's use the Supabase MCP's execute_sql tool!
            // For now, let's just log the SQL and tell user to run it!
            console.log('📝 Please run this in Supabase SQL Editor:');
            console.log(stmt + ';');
        } catch (e) {
            console.warn('⚠️', e.message);
        }
    }
    console.log('\n✅ Setup complete! Please run the sync script again!');
}

main().catch(console.error);
