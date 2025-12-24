-- Script Testing untuk create_tenant_with_admin
-- Catatan: Script ini harus dijalankan oleh user yang sudah login sebagai Super Admin
-- Date: 2025-01-03

-- ==========================================
-- TESTING: Create Tenant Baru
-- ==========================================
-- Jalankan query berikut untuk testing (pastikan sudah login sebagai Super Admin):
/*
SELECT create_tenant_with_admin(
  'RS Test Migration 2025',
  'rs-test-migration-2025',
  'admin-test-2025@test.com',
  'Test123456',
  'Admin Test Migration',
  NULL,
  '#6366f1',
  '#8b5cf6',
  true,
  'IDR'
) as result;
*/

-- ==========================================
-- CLEANUP: Hapus Data Testing
-- ==========================================
-- Setelah testing selesai, jalankan query berikut untuk menghapus data testing:
/*
-- Hapus tenant test berdasarkan slug
DO $$
DECLARE
  v_test_tenant_id UUID;
  v_test_user_id UUID;
BEGIN
  -- Cari tenant test
  SELECT id INTO v_test_tenant_id
  FROM tenants
  WHERE slug = 'rs-test-migration-2025'
  LIMIT 1;
  
  IF v_test_tenant_id IS NOT NULL THEN
    -- Cari admin user dari tenant test
    SELECT id INTO v_test_user_id
    FROM auth.users
    WHERE email = 'admin-test-2025@test.com'
    LIMIT 1;
    
    -- Hapus audit trail
    DELETE FROM audit_trail WHERE tenant_id = v_test_tenant_id;
    
    -- Hapus tenant settings
    DELETE FROM tenant_settings WHERE tenant_id = v_test_tenant_id;
    
    -- Hapus user (akan cascade ke user_roles, profiles, dll)
    IF v_test_user_id IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = v_test_user_id;
    END IF;
    
    -- Hapus tenant
    DELETE FROM tenants WHERE id = v_test_tenant_id;
    
    RAISE NOTICE 'Test data cleaned up successfully';
  ELSE
    RAISE NOTICE 'Test tenant not found, nothing to clean up';
  END IF;
END $$;
*/












