-- Migration: Drop All Permissive RLS Policies
-- Date: 2025-01-27
-- Description: Drop all RLS policies that use auth.role() = 'authenticated' without tenant filtering
--              These policies allow ALL authenticated users to access ALL data, which breaks tenant isolation

-- ============================================================================
-- STEP 1: Drop all permissive policies that don't filter by tenant_id
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  policies_dropped INTEGER := 0;
BEGIN
  -- Find and drop all policies that use auth.role() = 'authenticated' pattern
  -- These are the dangerous policies that allow cross-tenant access
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND (
        -- Policies that explicitly allow all authenticated users
        policyname LIKE '%Allow all operations for authenticated users%'
        OR policyname LIKE '%Allow all%authenticated%'
        OR policyname LIKE '%authenticated users%'
        -- Policies that might be permissive (check definition)
        OR policyname LIKE '%all operations%'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', r.policyname, r.schemaname, r.tablename);
      policies_dropped := policies_dropped + 1;
      RAISE NOTICE 'Dropped policy: %.%', r.tablename, r.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to drop policy %.%: %', r.tablename, r.policyname, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Total permissive policies dropped: %', policies_dropped;
END $$;

-- ============================================================================
-- STEP 2: Drop specific permissive policies from database-setup.sql
-- ============================================================================

-- Drop policies from scripts/database-setup.sql that allow all authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users on role_akses_aplikasi" ON public.role_akses_aplikasi CASCADE;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on menu_items" ON public.menu_items CASCADE;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on role_menu_items" ON public.role_menu_items CASCADE;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on user_roles" ON public.user_roles CASCADE;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on unit_kerja" ON public.unit_kerja CASCADE;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on Data_Kegiatan" ON public."Data_Kegiatan" CASCADE;

-- ============================================================================
-- STEP 3: Drop any other permissive policies that might exist
-- ============================================================================

-- Drop policies that check only auth.role() without tenant filtering
DO $$
DECLARE
  r RECORD;
  policy_def TEXT;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    -- Check if policy uses auth.role() = 'authenticated' without tenant filtering
    policy_def := COALESCE(r.qual, '') || ' ' || COALESCE(r.with_check, '');
    
    IF policy_def LIKE '%auth.role()%authenticated%' 
       AND policy_def NOT LIKE '%tenant_id%'
       AND policy_def NOT LIKE '%get_tenant_id%'
       AND r.policyname NOT LIKE '%tenant_isolation%'
       AND r.policyname NOT LIKE '%super_admin%' THEN
      
      BEGIN
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped permissive policy: %.% (definition: %)', r.tablename, r.policyname, policy_def;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to drop policy %.%: %', r.tablename, r.policyname, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 4: Verification - List remaining policies
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  permissive_count INTEGER;
BEGIN
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count potentially permissive policies (those without tenant_id filtering)
  SELECT COUNT(*) INTO permissive_count
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND (
      SELECT COUNT(*)
      FROM pg_policies p2
      WHERE p2.schemaname = p.schemaname
        AND p2.tablename = p.tablename
        AND (
          p2.qual LIKE '%tenant_id%'
          OR p2.qual LIKE '%get_tenant_id%'
          OR p2.with_check LIKE '%tenant_id%'
          OR p2.with_check LIKE '%get_tenant_id%'
        )
    ) = 0;
  
  RAISE NOTICE 'Total policies remaining: %', policy_count;
  RAISE NOTICE 'Policies without tenant filtering: %', permissive_count;
  
  IF permissive_count > 0 THEN
    RAISE WARNING 'Found % policies without tenant filtering. These should be reviewed.', permissive_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Ensure RLS is still enabled on critical tables
-- ============================================================================

-- Re-enable RLS on tables that might have been affected
ALTER TABLE IF EXISTS public.role_akses_aplikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Data_Kegiatan" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.role_akses_aplikasi IS 'RLS enabled - requires tenant-aware policies';
COMMENT ON TABLE public.menu_items IS 'RLS enabled - requires tenant-aware policies';
COMMENT ON TABLE public.role_menu_items IS 'RLS enabled - requires tenant-aware policies';
COMMENT ON TABLE public.user_roles IS 'RLS enabled - requires tenant-aware policies';
COMMENT ON TABLE public.unit_kerja IS 'RLS enabled - requires tenant-aware policies';
COMMENT ON TABLE public."Data_Kegiatan" IS 'RLS enabled - requires tenant-aware policies';

