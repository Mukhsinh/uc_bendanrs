-- Migration: Fix auto_set_tenant_id() to handle tables without user_id column
-- Date: 2025-01-28
-- Description: Fix error "record 'new' has no field 'user_id'" when inserting into tables
--              that don't have user_id column (e.g., tindakan_bdrs)

-- ============================================================================
-- STEP 1: Update auto_set_tenant_id() function to safely check for user_id column
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_has_user_id BOOLEAN := FALSE;
BEGIN
  -- Hanya set tenant_id jika belum ada
  IF NEW.tenant_id IS NULL THEN
    -- Dapatkan user ID dari auth
    v_user_id := auth.uid();
    
    -- Coba cek apakah tabel memiliki kolom user_id dengan exception handling
    -- Jika kolom tidak ada, exception akan ditangkap dan v_has_user_id tetap FALSE
    BEGIN
      -- Coba akses NEW.user_id - jika kolom tidak ada, akan raise exception
      IF NEW.user_id IS NOT NULL THEN
        v_user_id := NEW.user_id;
        v_has_user_id := TRUE;
      END IF;
    EXCEPTION
      WHEN undefined_column THEN
        -- Kolom user_id tidak ada di tabel ini, lanjutkan tanpa menggunakannya
        v_has_user_id := FALSE;
      WHEN OTHERS THEN
        -- Error lain, propagate
        RAISE;
    END;
    
    -- Jika tidak ada user_id dari auth dan tidak ada dari NEW.user_id, return error yang jelas
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine user_id for tenant_id assignment. User must be authenticated.';
    END IF;
    
    -- Cari tenant_id dari user_profiles
    SELECT tenant_id INTO v_tenant_id 
    FROM user_profiles 
    WHERE user_id = v_user_id 
    LIMIT 1;
    
    -- Jika tidak ditemukan tenant_id, coba ambil default tenant
    IF v_tenant_id IS NULL THEN
      SELECT id INTO v_tenant_id 
      FROM tenants 
      WHERE is_active = true 
      ORDER BY created_at ASC 
      LIMIT 1;
    END IF;
    
    -- Jika masih tidak ada tenant_id, return error yang jelas
    IF v_tenant_id IS NULL THEN
      RAISE EXCEPTION 'No tenant found for user_id: %. Please ensure user has a valid tenant assignment.', v_user_id;
    END IF;
    
    -- Set tenant_id
    NEW.tenant_id := v_tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_set_tenant_id() IS 
'Auto-set tenant_id for tables. Safely handles tables with or without user_id column. '
'Uses auth.uid() as primary source, falls back to NEW.user_id if column exists.';

