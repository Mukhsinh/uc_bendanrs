-- =====================================================
-- FINAL SCHEMA FIX FOR LOGIN AND BRANDING
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Ensure user_id column exists in user_profiles (expected by current app code)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='id') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='user_id') THEN
        ALTER TABLE user_profiles RENAME COLUMN id TO user_id;
    END IF;
END $$;

-- 2. Add role_id to user_profiles and map it (to support roles join)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role_id UUID;

-- Populate role_id from user_roles if it exists
UPDATE user_profiles up
SET role_id = ur.role_id
FROM user_roles ur
WHERE up.user_id = ur.user_id AND up.role_id IS NULL;

-- 3. Create 'roles' view for legacy support (the app expects roles table with 'name' column)
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

-- 4. Fix branding_settings missing user_id
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS user_id UUID;

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
