
-- Setup script - run this first in SQL Editor!
-- This is small, won't hit size limit

-- Disable RLS temporarily for all tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- Add missing columns
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.data_dokter ADD COLUMN IF NOT EXISTS jenis_spesialistik text;
ALTER TABLE IF EXISTS public.data_kegiatan ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
ALTER TABLE IF EXISTS public.data_biaya ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
ALTER TABLE IF EXISTS public.data_pendapatan ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
ALTER TABLE IF EXISTS public."Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_I" text;
ALTER TABLE IF EXISTS public.data_akomodasi_inap ADD COLUMN IF NOT EXISTS total_gizi numeric;
ALTER TABLE IF EXISTS public.data_diklat ADD COLUMN IF NOT EXISTS biaya_bahan numeric;
ALTER TABLE IF EXISTS public.budgeting_bhp_farmasi ADD COLUMN IF NOT EXISTS biaya_bahan numeric;
ALTER TABLE IF EXISTS public.cost_recovery ADD COLUMN IF NOT EXISTS pendapatan_apbd numeric;
ALTER TABLE IF EXISTS public.branding_settings ADD COLUMN IF NOT EXISTS app_title text;
ALTER TABLE IF EXISTS public.biaya_preference ADD COLUMN IF NOT EXISTS biaya_type text;
