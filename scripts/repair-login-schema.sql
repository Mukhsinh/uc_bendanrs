-- =====================================================
-- REPAIR LOGIN SCHEMA AND BRANDING
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Restore 'user_id' column in user_profiles
-- The application code specifically filters and joins on 'user_id'
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='id') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='user_id') THEN
        ALTER TABLE user_profiles RENAME COLUMN id TO user_id;
    END IF;
END $$;

-- 2. Add 'role_id' and correct foreign keys to support joining
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role_id UUID;

-- Ensure foreign key for joining works in PostgREST
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_id_fkey;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES role_akses_aplikasi(id);

-- Populate role_id from user_roles if possible
UPDATE user_profiles up
SET role_id = (SELECT role_id FROM user_roles ur WHERE ur.user_id = up.user_id LIMIT 1)
WHERE up.role_id IS NULL;

-- 3. Fix branding_settings missing user_id
-- The hook useBrandingSettings.ts expects this column
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. Create 'roles' view for legacy support (optional but recommended for hidden dependencies)
CREATE OR REPLACE VIEW roles AS 
SELECT 
    id,
    role_name as name,
    description,
    is_active,
    created_at,
    updated_at,
    tenant_id
FROM role_akses_aplikasi;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
