-- =====================================================
-- Fix: Create User with Role (Tenant-Aware)
-- =====================================================
-- Tanggal: 2024-11-28
-- Deskripsi: Memperbaiki fungsi create_user_with_role agar tenant-aware
--            dan membuat user_profile dengan tenant_id yang benar

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_user_with_role(text, text, text, text);

-- Create improved tenant-aware function
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  email_param TEXT,
  password_param TEXT,
  full_name_param TEXT,
  role_name_param TEXT,
  tenant_id_param UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  target_role_id UUID;
  target_tenant_id UUID;
  existing_user_id UUID;
  current_user_tenant_id UUID;
  result JSON;
BEGIN
  -- Validate inputs
  IF email_param IS NULL OR email_param = '' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email tidak boleh kosong'
    );
  END IF;

  IF password_param IS NULL OR LENGTH(password_param) < 8 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Password minimal 8 karakter'
    );
  END IF;

  -- Get role ID
  SELECT id INTO target_role_id 
  FROM role_akses_aplikasi 
  WHERE role_name = role_name_param AND is_active = true;
  
  IF target_role_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Role tidak ditemukan: ' || role_name_param
    );
  END IF;

  -- Determine tenant_id
  IF tenant_id_param IS NOT NULL THEN
    -- Use provided tenant_id
    target_tenant_id := tenant_id_param;
  ELSE
    -- Get current user's tenant_id
    SELECT tenant_id INTO current_user_tenant_id
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    IF current_user_tenant_id IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Tenant ID tidak ditemukan untuk user saat ini'
      );
    END IF;
    
    target_tenant_id := current_user_tenant_id;
  END IF;

  -- Validate tenant exists
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = target_tenant_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Tenant tidak valid'
    );
  END IF;

  -- Check if user already exists
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = email_param;

  IF existing_user_id IS NOT NULL THEN
    -- User exists, check if in same tenant
    IF EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = existing_user_id 
        AND tenant_id = target_tenant_id
    ) THEN
      -- Update role assignment
      INSERT INTO user_roles (user_id, role_id, is_active, assigned_at, assigned_by)
      VALUES (existing_user_id, target_role_id, true, NOW(), auth.uid())
      ON CONFLICT (user_id, role_id) 
      DO UPDATE SET 
        is_active = true,
        assigned_at = NOW(),
        assigned_by = auth.uid();
      
      RETURN json_build_object(
        'success', true,
        'message', 'User sudah ada di tenant ini, role berhasil diupdate',
        'user_id', existing_user_id
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'message', 'User dengan email ini sudah terdaftar di tenant lain'
      );
    END IF;
  END IF;

  -- Create new user in auth.users
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      email_param,
      crypt(password_param, gen_salt('bf')),
      NOW(), -- Auto-confirm email
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('tenant_id', target_tenant_id),
      jsonb_build_object('full_name', COALESCE(full_name_param, split_part(email_param, '@', 1))),
      false,
      encode(gen_random_bytes(32), 'hex'),
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;

  EXCEPTION
    WHEN unique_violation THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Email sudah terdaftar'
      );
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Gagal membuat user: ' || SQLERRM
      );
  END;

  -- Create user_profile with tenant_id
  BEGIN
    INSERT INTO user_profiles (
      user_id,
      tenant_id,
      full_name,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      target_tenant_id,
      COALESCE(full_name_param, split_part(email_param, '@', 1)),
      true,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback user creation if profile fails
      DELETE FROM auth.users WHERE id = new_user_id;
      RETURN json_build_object(
        'success', false,
        'message', 'Gagal membuat user profile: ' || SQLERRM
      );
  END;

  -- Assign role to user
  BEGIN
    INSERT INTO user_roles (
      user_id,
      role_id,
      is_active,
      assigned_at,
      assigned_by
    ) VALUES (
      new_user_id,
      target_role_id,
      true,
      NOW(),
      auth.uid()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback if role assignment fails
      DELETE FROM user_profiles WHERE user_id = new_user_id;
      DELETE FROM auth.users WHERE id = new_user_id;
      RETURN json_build_object(
        'success', false,
        'message', 'Gagal assign role: ' || SQLERRM
      );
  END;

  -- Success
  RETURN json_build_object(
    'success', true,
    'message', 'User berhasil dibuat dengan role ' || role_name_param,
    'user_id', new_user_id,
    'tenant_id', target_tenant_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Terjadi kesalahan: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_with_role(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_user_with_role(TEXT, TEXT, TEXT, TEXT, UUID) IS 
'Create new user with role assignment (tenant-aware). Automatically uses current user tenant_id if not provided.';
