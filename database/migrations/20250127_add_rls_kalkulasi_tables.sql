-- Migration: Add RLS policies for all kalkulasi tables
-- Date: 2025-01-27
-- Description: Add comprehensive RLS policies (SELECT, INSERT, UPDATE, DELETE) 
--              for all kalkulasi tables to ensure tenant isolation

-- ============================================================================
-- STEP 1: Enable RLS on all kalkulasi tables
-- ============================================================================

DO $$
BEGIN
  -- Enable RLS for kalkulasi_biaya_operatif
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_operatif') THEN
    ALTER TABLE kalkulasi_biaya_operatif ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_biaya_ibs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_ibs') THEN
    ALTER TABLE kalkulasi_biaya_ibs ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_biaya_radiologi
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_radiologi') THEN
    ALTER TABLE kalkulasi_biaya_radiologi ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_biaya_bdrs or kalkulasi_bdrs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_bdrs') THEN
    ALTER TABLE kalkulasi_biaya_bdrs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_bdrs') THEN
    ALTER TABLE kalkulasi_bdrs ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_biaya_gizi
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_gizi') THEN
    ALTER TABLE kalkulasi_biaya_gizi ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_biaya_cathlab
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_cathlab') THEN
    ALTER TABLE kalkulasi_biaya_cathlab ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_biaya_laboratorium
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_laboratorium') THEN
    ALTER TABLE kalkulasi_biaya_laboratorium ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_diklat
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    ALTER TABLE kalkulasi_diklat ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_biaya_kelas_akomodasi
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_kelas_akomodasi') THEN
    ALTER TABLE kalkulasi_biaya_kelas_akomodasi ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_tindakan_rawat_jalan
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_tindakan_rawat_jalan') THEN
    ALTER TABLE kalkulasi_tindakan_rawat_jalan ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_tindakan_inap
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_tindakan_inap') THEN
    ALTER TABLE kalkulasi_tindakan_inap ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS for kalkulasi_daftar_dan_resep
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_daftar_dan_resep') THEN
    ALTER TABLE kalkulasi_daftar_dan_resep ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop existing policies if they exist (to recreate them)
-- ============================================================================

DO $$
BEGIN
  -- Drop policies for kalkulasi_biaya_operatif
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_biaya_operatif" ON kalkulasi_biaya_operatif;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_biaya_operatif" ON kalkulasi_biaya_operatif;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_biaya_operatif" ON kalkulasi_biaya_operatif;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_biaya_operatif" ON kalkulasi_biaya_operatif;
  DROP POLICY IF EXISTS "tenant_isolation_kalkulasi_biaya_operatif" ON kalkulasi_biaya_operatif;
  DROP POLICY IF EXISTS "tenant_isolation_kalkulasi_biaya_operatif_v2" ON kalkulasi_biaya_operatif;

  -- Drop policies for kalkulasi_biaya_ibs
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_biaya_ibs" ON kalkulasi_biaya_ibs;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_biaya_ibs" ON kalkulasi_biaya_ibs;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_biaya_ibs" ON kalkulasi_biaya_ibs;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_biaya_ibs" ON kalkulasi_biaya_ibs;

  -- Drop policies for kalkulasi_biaya_radiologi
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_biaya_radiologi" ON kalkulasi_biaya_radiologi;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_biaya_radiologi" ON kalkulasi_biaya_radiologi;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_biaya_radiologi" ON kalkulasi_biaya_radiologi;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_biaya_radiologi" ON kalkulasi_biaya_radiologi;

  -- Drop policies for kalkulasi_bdrs
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_bdrs" ON kalkulasi_bdrs;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_bdrs" ON kalkulasi_bdrs;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_bdrs" ON kalkulasi_bdrs;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_bdrs" ON kalkulasi_bdrs;

  -- Drop policies for kalkulasi_biaya_gizi
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_biaya_gizi" ON kalkulasi_biaya_gizi;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_biaya_gizi" ON kalkulasi_biaya_gizi;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_biaya_gizi" ON kalkulasi_biaya_gizi;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_biaya_gizi" ON kalkulasi_biaya_gizi;

  -- Drop policies for kalkulasi_biaya_cathlab
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_biaya_cathlab" ON kalkulasi_biaya_cathlab;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_biaya_cathlab" ON kalkulasi_biaya_cathlab;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_biaya_cathlab" ON kalkulasi_biaya_cathlab;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_biaya_cathlab" ON kalkulasi_biaya_cathlab;

  -- Drop policies for kalkulasi_biaya_laboratorium
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_biaya_laboratorium" ON kalkulasi_biaya_laboratorium;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_biaya_laboratorium" ON kalkulasi_biaya_laboratorium;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_biaya_laboratorium" ON kalkulasi_biaya_laboratorium;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_biaya_laboratorium" ON kalkulasi_biaya_laboratorium;

  -- Drop policies for kalkulasi_diklat (keep system policies if needed)
  DROP POLICY IF EXISTS "tenant_isolation_select_kalkulasi_diklat" ON kalkulasi_diklat;
  DROP POLICY IF EXISTS "tenant_isolation_insert_kalkulasi_diklat" ON kalkulasi_diklat;
  DROP POLICY IF EXISTS "tenant_isolation_update_kalkulasi_diklat" ON kalkulasi_diklat;
  DROP POLICY IF EXISTS "tenant_isolation_delete_kalkulasi_diklat" ON kalkulasi_diklat;
END $$;

-- ============================================================================
-- STEP 3: Create comprehensive RLS policies for each table
-- ============================================================================

-- Helper function to create policies for a table
CREATE OR REPLACE FUNCTION create_tenant_policies_for_table(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- SELECT policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_select_%s" ON %I
      FOR SELECT
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);

  -- INSERT policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_insert_%s" ON %I
      FOR INSERT
      TO authenticated
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);

  -- UPDATE policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_update_%s" ON %I
      FOR UPDATE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )
      WITH CHECK (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);

  -- DELETE policy
  EXECUTE format('
    CREATE POLICY "tenant_isolation_delete_%s" ON %I
      FOR DELETE
      TO authenticated
      USING (
        tenant_id = public.get_tenant_id()
        OR public.is_super_admin()
      )', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Create policies for each kalkulasi table
DO $$
BEGIN
  -- kalkulasi_biaya_operatif
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_operatif') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_operatif');
  END IF;

  -- kalkulasi_biaya_ibs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_ibs') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_ibs');
  END IF;

  -- kalkulasi_biaya_radiologi
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_radiologi') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_radiologi');
  END IF;

  -- kalkulasi_bdrs (or kalkulasi_biaya_bdrs)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_bdrs') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_bdrs');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_bdrs') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_bdrs');
  END IF;

  -- kalkulasi_biaya_gizi
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_gizi') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_gizi');
  END IF;

  -- kalkulasi_biaya_cathlab
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_cathlab') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_cathlab');
  END IF;

  -- kalkulasi_biaya_laboratorium
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_laboratorium') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_laboratorium');
  END IF;

  -- kalkulasi_diklat
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_diklat');
  END IF;

  -- kalkulasi_biaya_kelas_akomodasi
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_biaya_kelas_akomodasi') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_biaya_kelas_akomodasi');
  END IF;

  -- kalkulasi_tindakan_rawat_jalan
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_tindakan_rawat_jalan') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_tindakan_rawat_jalan');
  END IF;

  -- kalkulasi_tindakan_inap
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_tindakan_inap') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_tindakan_inap');
  END IF;

  -- kalkulasi_daftar_dan_resep
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_daftar_dan_resep') THEN
    PERFORM create_tenant_policies_for_table('kalkulasi_daftar_dan_resep');
  END IF;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS create_tenant_policies_for_table(TEXT);

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'tenant_isolation_%kalkulasi%';
  
  RAISE NOTICE 'Total RLS policies created for kalkulasi tables: %', policy_count;
END $$;
