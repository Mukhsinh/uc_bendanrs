-- ============================================================================
-- SQL Setup for Data Import
-- Run this in your Supabase SQL Editor FIRST!
-- ============================================================================

-- 1. Create exec_sql function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
END;
$$;

-- 2. Function to disable RLS on all tables
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

-- 3. Function to enable RLS on all tables
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

-- 4. Disable RLS now
SELECT public.disable_all_rls();

-- 5. Add missing columns to existing tables (based on data files)
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

ALTER TABLE IF EXISTS public.budgeting_bhp_farmasi 
ADD COLUMN IF NOT EXISTS biaya_bahan numeric;

ALTER TABLE IF EXISTS public.cost_recovery 
ADD COLUMN IF NOT EXISTS pendapatan_apbd numeric;

ALTER TABLE IF EXISTS public.branding_settings 
ADD COLUMN IF NOT EXISTS app_title text;
