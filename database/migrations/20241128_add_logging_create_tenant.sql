-- Migration: Add Logging to create_tenant_with_admin
-- Date: 2024-11-28
-- Description: Menambahkan logging detail untuk debugging masalah "Gagal membuat tenant"

CREATE OR REPLACE FUNCTION create_tenant_with_admin(
  p_tenant_name TEXT,
  p_tenant_slug TEXT,
  p_admin_email TEXT,
  p_admin_password TEXT,
  p_admin_full_name TEXT,
  p_logo_url TEXT DEFAULT NULL,
  p_primary_color TEXT DEFAULT '#6366f1',
  p_secondary_color TEXT DEFAULT '#8b5cf6',
  p_include_jasa_pelayanan BOOLEAN DEFAULT true,
  p_default_currency TEXT DEFAULT 'IDR'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_result JSON;
  v_viewer_role_id UUID;
  v_admin_role_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Log: Start
  RAISE NOTICE 'create_tenant_with_admin: START - tenant_name=%, slug=%, email=%', 
    p_tenant_name, p_tenant_slug, p_admin_email;

  -- Get current user
  v_current_user_id := auth.uid();
  RAISE NOTICE 'create_tenant_with_admin: Current user ID=%', v_current_user_id;

  -- Validasi: hanya Super Admin yang bisa membuat tenant
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_akses_aplikasi r ON ur.role_id = r.id
    WHERE ur.user_id = v_current_user_id
      AND r.role_name = 'Super Admin'
      AND ur.is_active = true
  ) THEN
    RAISE NOTICE 'create_tenant_with_admin: FAILED - User is not Super Admin';
    RETURN json_build_object(
      'success', false,
      'error', 'Hanya Super Admin yang dapat membuat tenant baru'
    );
  END IF;

  RAISE NOTICE 'create_tenant_with_admin: User is Super Admin - OK';

  -- Validasi slug format
  IF p_tenant_slug !~ '^[a-z0-9-]+$' THEN
    RAISE NOTICE 'create_tenant_with_admin: FAILED - Invalid slug format';
    RETURN json_build_object(
      'success', false,
      'error', 'Slug hanya boleh mengandung huruf kecil, angka, dan dash'
    );
  END IF;

  -- Cek apakah slug sudah digunakan
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_tenant_slug) THEN
    RAISE NOTICE 'create_tenant_with_admin: FAILED - Slug already exists';
    RETURN json_build_object(
      'success', false,
      'error', 'Slug tenant sudah digunakan'
    );
  END IF;

  -- Cek apakah email sudah terdaftar
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_admin_email) THEN
    RAISE NOTICE 'create_tenant_with_admin: FAILED - Email already exists';
    RETURN json_build_object(
      'success', false,
      'error', 'Email admin sudah terdaftar'
    );
  END IF;

  -- Get role IDs
  SELECT id INTO v_viewer_role_id
  FROM role_akses_aplikasi
  WHERE role_name = 'Viewer' AND is_active = true
  LIMIT 1;

  SELECT id INTO v_admin_role_id
  FROM role_akses_aplikasi
  WHERE role_name = 'Admin' AND is_active = true
  LIMIT 1;

  RAISE NOTICE 'create_tenant_with_admin: Role IDs - Viewer=%, Admin=%', 
    v_viewer_role_id, v_admin_role_id;

  IF v_admin_role_id IS NULL THEN
    RAISE NOTICE 'create_tenant_with_admin: FAILED - Admin role not found';
    RETURN json_build_object(
      'success', false,
      'error', 'Role Admin tidak ditemukan'
    );
  END IF;

  -- Step 1: Buat tenant
  RAISE NOTICE 'create_tenant_with_admin: Creating tenant...';
  INSERT INTO tenants (
    name,
    slug,
    logo_url,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_tenant_name,
    p_tenant_slug,
    p_logo_url,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'create_tenant_with_admin: Tenant created - ID=%', v_tenant_id;

  -- Step 2: Buat tenant_settings dengan kolom currency
  RAISE NOTICE 'create_tenant_with_admin: Creating tenant_settings...';
  INSERT INTO tenant_settings (
    tenant_id,
    primary_color,
    secondary_color,
    include_jasa_pelayanan,
    currency,
    created_at,
    updated_at
  ) VALUES (
    v_tenant_id,
    p_primary_color,
    p_secondary_color,
    p_include_jasa_pelayanan,
    p_default_currency,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'create_tenant_with_admin: tenant_settings created - OK';

  -- Step 3: Buat admin user menggunakan fungsi yang sudah ada
  RAISE NOTICE 'create_tenant_with_admin: Creating admin user...';
  v_result := create_user_with_role(
    p_admin_email,
    p_admin_password,
    p_admin_full_name,
    'Admin',
    v_tenant_id
  );

  RAISE NOTICE 'create_tenant_with_admin: create_user_with_role result=%', v_result;

  -- Cek hasil pembuatan user
  IF (v_result->>'success')::boolean = false THEN
    RAISE NOTICE 'create_tenant_with_admin: FAILED - User creation failed: %', v_result->>'message';
    -- Rollback tenant jika gagal buat user
    DELETE FROM tenant_settings WHERE tenant_id = v_tenant_id;
    DELETE FROM tenants WHERE id = v_tenant_id;
    RETURN v_result;
  END IF;

  v_admin_user_id := (v_result->>'user_id')::uuid;
  RAISE NOTICE 'create_tenant_with_admin: Admin user created - ID=%', v_admin_user_id;

  -- Step 4: Initialize default data
  RAISE NOTICE 'create_tenant_with_admin: Creating default data...';
  
  -- Buat unit kerja default
  INSERT INTO unit_kerja (tenant_id, kode, nama, jenis, is_active)
  VALUES
    (v_tenant_id, 'ADM', 'Administrasi', 'non_revenue', true),
    (v_tenant_id, 'KEU', 'Keuangan', 'non_revenue', true),
    (v_tenant_id, 'RJ', 'Rawat Jalan', 'revenue', true),
    (v_tenant_id, 'RI', 'Rawat Inap', 'revenue', true);

  -- Buat dasar alokasi default
  INSERT INTO dasar_alokasi (tenant_id, kode, nama, satuan, is_active)
  VALUES
    (v_tenant_id, 'SDM', 'Jumlah SDM', 'orang', true),
    (v_tenant_id, 'LUAS', 'Luas Ruangan', 'm2', true),
    (v_tenant_id, 'KUNJUNGAN', 'Jumlah Kunjungan', 'kunjungan', true);

  RAISE NOTICE 'create_tenant_with_admin: Default data created - OK';

  -- Step 5: Log audit trail
  INSERT INTO tenant_audit_log (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    changes,
    created_at
  ) VALUES (
    v_tenant_id,
    v_current_user_id,
    'tenant_created',
    'tenants',
    v_tenant_id,
    jsonb_build_object(
      'tenant_name', p_tenant_name,
      'tenant_slug', p_tenant_slug,
      'admin_email', p_admin_email,
      'admin_user_id', v_admin_user_id
    ),
    NOW()
  );

  RAISE NOTICE 'create_tenant_with_admin: SUCCESS - Tenant created successfully';

  -- Return success
  RETURN json_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'admin_user_id', v_admin_user_id,
    'message', 'Tenant berhasil dibuat dengan admin user'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'create_tenant_with_admin: EXCEPTION - %', SQLERRM;
    -- Rollback akan otomatis karena transaction
    RETURN json_build_object(
      'success', false,
      'error', 'Terjadi kesalahan: ' || SQLERRM,
      'details', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_tenant_with_admin TO authenticated;

COMMENT ON FUNCTION create_tenant_with_admin IS 
'Membuat tenant baru dengan admin user dan default data. Hanya Super Admin yang dapat memanggil function ini. Version with detailed logging for debugging.';
