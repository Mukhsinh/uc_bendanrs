-- =====================================================
-- FIX SCHEMA MISMATCHES FOR LOGIN AND BRANDING
-- =====================================================

-- 1. Fix user_profiles column name
-- The application expects 'user_id' instead of 'id' in user_profiles
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='user_id') THEN
            ALTER TABLE user_profiles RENAME COLUMN id TO user_id;
        END IF;
    END IF;
END $$;

-- Enable 'id' as an alias if needed, but 'user_id' is definitely expected by the filters
-- We should also ensure user_id is the primary key and links to auth.users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey CASCADE;
ALTER TABLE user_profiles ADD PRIMARY KEY (user_id);
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create 'roles' table/view to match application expectations
-- The app expects a table called 'roles' with a 'name' column.
-- Our actual table is 'role_akses_aplikasi' with 'role_name'.

-- Let's check if 'roles' table exists. If not, create a view.
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

-- 3. Fix branding_settings missing user_id
-- The app logic seems to filter branding_settings by user_id or at least expects the column
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update branding_settings user_id with a default if it's tenant-wide
-- Usually branding is per tenant, so maybe it's a bug in the app, but we need the column.
-- For now, we can leave it null or map it.

-- 4. Ensure relationship for 'roles(name)' join works
-- PostgREST needs a foreign key to detect relationships.
-- If user_profiles has a role_id, we should link it.
-- Let's check if user_profiles has a role_id.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='role_id') THEN
        ALTER TABLE user_profiles ADD COLUMN role_id UUID REFERENCES role_akses_aplikasi(id);
    END IF;
END $$;

-- Also, the join 'roles(name)' might be through user_roles.
-- If its user_profiles -> user_roles -> roles, the query would be user_profiles?select=user_roles(roles(name)).
-- But the log says user_profiles?select=tenant_id,roles(name).
-- This strongly implies a direct role_id on user_profiles.

-- Let's populate role_id in user_profiles from user_roles if empty
UPDATE user_profiles up
SET role_id = ur.role_id
FROM user_roles ur
WHERE up.user_id = ur.user_id AND up.role_id IS NULL;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
