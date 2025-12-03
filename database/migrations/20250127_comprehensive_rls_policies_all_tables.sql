-- Migration: Comprehensive RLS Policies for All Tables with tenant_id
-- Date: 2025-01-27
-- Description: Drop all permissive policies and create tenant-isolated policies for ALL 68 tables
--              This ensures complete tenant isolation across the entire application

-- ============================================================================
-- STEP 1: Drop all existing permissive policies
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies that use permissive pattern (auth.role() = 'authenticated')
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND (policyname LIKE '%Allow all operations for authenticated users%'
           OR policyname LIKE '%tenant_isolation%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  
  RAISE NOTICE 'Dropped existing permissive policies';
END $$;

-- ============================================================================
-- STEP 2: Enable RLS on all tables with tenant_id
-- ============================================================================

DO $$
DECLARE
  table_rec RECORD;
  table_list TEXT[] := ARRAY[
    'Alokasi BTL dengan JP',
    'Alokasi biaya kedua dengan JP',
    'Alokasibiaya pertama dengan JP',
    'Dasar_Alokasi',
    'Data_Kamar',
    'audit_trail',
    'bahan_porsi',
    'biaya_preference',
    'branding_settings',
    'budgeting_bhp_farmasi',
    'budgeting_bhp_farmasi_public',
    'cost_recovery',
    'daftar_tindakan',
    'data_akomodasi_inap',
    'data_barang_farmasi',
    'data_barang_gizi',
    'data_biaya',
    'data_diklat',
    'data_dokter',
    'data_kegiatan',
    'data_kegiatan_transpose',
    'data_pendapatan',
    'distribusi_biaya_kedua',
    'distribusi_biaya_pertama',
    'distribusi_biaya_pertama_dengan_jp',
    'distribusi_biaya_pertama_norm',
    'distribusi_biaya_pertama_norm_dengan_jp',
    'distribusi_biaya_rekap',
    'general_settings',
    'jenis_tindakan_inap',
    'jenis_tindakan_rawat_jalan',
    'jp_farmasi_config',
    'kalkulasi_bdrs',
    'kalkulasi_biaya_akomodasi',
    'kalkulasi_biaya_cathlab',
    'kalkulasi_biaya_gizi',
    'kalkulasi_biaya_kelas_akomodasi',
    'kalkulasi_biaya_laboratorium',
    'kalkulasi_biaya_operatif',
    'kalkulasi_biaya_radiologi',
    'kalkulasi_daftar_dan_resep',
    'kalkulasi_diklat',
    'kalkulasi_tindakan_inap',
    'kalkulasi_tindakan_rawat_jalan',
    'klinik',
    'mapping_dasar_alokasi',
    'menu_gizi',
    'menu_items',
    'produk_layanan',
    'profiles',
    'prosentase_akomodasi_tindakan',
    'rekapitulasi_unit_cost',
    'rincian_budgeting_bhp',
    'rincian_budgeting_bhp_public',
    'role_akses_aplikasi',
    'role_menu_items',
    'role_permissions',
    'skenario_tarif',
    'skenario_tarif_akomodasi',
    'skenario_tarif_backup',
    'skenario_tarif_visit',
    'struktur_biaya',
    'temp_all_kalkulasi_biaya_gizi',
    'tenant_settings',
    'tindakan_bdrs',
    'tindakan_cathlab',
    'tindakan_laboratorium',
    'tindakan_operatif',
    'tindakan_radiologi',
    'total_alokasi_biaya_pertama',
    'total_alokasi_biaya_pertama_dengan_jp',
    'unit_kerja',
    'unit_kerja_column_mapping',
    'user_details_with_roles',
    'user_list_with_email',
    'user_profiles',
    'user_roles'
  ];
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY table_list
  LOOP
    -- Check if table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      -- Enable RLS
      BEGIN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Enabled RLS on table: %', table_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to enable RLS on table %: %', table_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Create comprehensive RLS policies for all tables
-- ============================================================================

-- Helper function to create tenant isolation policies for a table
CREATE OR REPLACE FUNCTION create_tenant_policies_comprehensive(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policies first
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_select_%s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_insert_%s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_update_%s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_delete_%s" ON %I', table_name, table_name);

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

  RAISE NOTICE 'Created policies for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Create policies for all tables
DO $$
DECLARE
  table_name TEXT;
  table_list TEXT[] := ARRAY[
    'Alokasi BTL dengan JP',
    'Alokasi biaya kedua dengan JP',
    'Alokasibiaya pertama dengan JP',
    'Dasar_Alokasi',
    'Data_Kamar',
    'audit_trail',
    'bahan_porsi',
    'biaya_preference',
    'branding_settings',
    'budgeting_bhp_farmasi',
    'budgeting_bhp_farmasi_public',
    'cost_recovery',
    'daftar_tindakan',
    'data_akomodasi_inap',
    'data_barang_farmasi',
    'data_barang_gizi',
    'data_biaya',
    'data_diklat',
    'data_dokter',
    'data_kegiatan',
    'data_kegiatan_transpose',
    'data_pendapatan',
    'distribusi_biaya_kedua',
    'distribusi_biaya_pertama',
    'distribusi_biaya_pertama_dengan_jp',
    'distribusi_biaya_pertama_norm',
    'distribusi_biaya_pertama_norm_dengan_jp',
    'distribusi_biaya_rekap',
    'general_settings',
    'jenis_tindakan_inap',
    'jenis_tindakan_rawat_jalan',
    'jp_farmasi_config',
    'kalkulasi_bdrs',
    'kalkulasi_biaya_akomodasi',
    'kalkulasi_biaya_cathlab',
    'kalkulasi_biaya_gizi',
    'kalkulasi_biaya_kelas_akomodasi',
    'kalkulasi_biaya_laboratorium',
    'kalkulasi_biaya_operatif',
    'kalkulasi_biaya_radiologi',
    'kalkulasi_daftar_dan_resep',
    'kalkulasi_diklat',
    'kalkulasi_tindakan_inap',
    'kalkulasi_tindakan_rawat_jalan',
    'klinik',
    'mapping_dasar_alokasi',
    'menu_gizi',
    'menu_items',
    'produk_layanan',
    'profiles',
    'prosentase_akomodasi_tindakan',
    'rekapitulasi_unit_cost',
    'rincian_budgeting_bhp',
    'rincian_budgeting_bhp_public',
    'role_akses_aplikasi',
    'role_menu_items',
    'role_permissions',
    'skenario_tarif',
    'skenario_tarif_akomodasi',
    'skenario_tarif_backup',
    'skenario_tarif_visit',
    'struktur_biaya',
    'temp_all_kalkulasi_biaya_gizi',
    'tenant_settings',
    'tindakan_bdrs',
    'tindakan_cathlab',
    'tindakan_laboratorium',
    'tindakan_operatif',
    'tindakan_radiologi',
    'total_alokasi_biaya_pertama',
    'total_alokasi_biaya_pertama_dengan_jp',
    'unit_kerja',
    'unit_kerja_column_mapping',
    'user_details_with_roles',
    'user_list_with_email',
    'user_profiles',
    'user_roles'
  ];
  tables_processed INTEGER := 0;
  tables_failed INTEGER := 0;
BEGIN
  FOREACH table_name IN ARRAY table_list
  LOOP
    -- Check if table exists and has tenant_id column
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_name
      AND column_name = 'tenant_id'
    ) THEN
      BEGIN
        PERFORM create_tenant_policies_comprehensive(table_name);
        tables_processed := tables_processed + 1;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create policies for table %: %', table_name, SQLERRM;
        tables_failed := tables_failed + 1;
      END;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Processed % tables, % failed', tables_processed, tables_failed;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS create_tenant_policies_comprehensive(TEXT);

-- ============================================================================
-- STEP 4: Special handling for tenants table (only super admin can manage)
-- ============================================================================

-- Tenants table - only super admin can see all tenants
DROP POLICY IF EXISTS "super_admin_tenant_access" ON public.tenants;
CREATE POLICY "super_admin_tenant_access" ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    id = public.get_tenant_id()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "super_admin_tenant_insert" ON public.tenants;
CREATE POLICY "super_admin_tenant_insert" ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_tenant_update" ON public.tenants;
CREATE POLICY "super_admin_tenant_update" ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_tenant_delete" ON public.tenants;
CREATE POLICY "super_admin_tenant_delete" ON public.tenants
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count policies created
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'tenant_isolation_%';
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO table_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;
  
  RAISE NOTICE 'Total tenant isolation policies created: %', policy_count;
  RAISE NOTICE 'Total tables with RLS enabled: %', table_count;
END $$;
