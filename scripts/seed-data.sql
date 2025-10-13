-- =====================================================
-- SEED DATA UNTUK APLIKASI UNIT COST RS
-- =====================================================
-- Script ini berisi data sample untuk testing dan development

-- =====================================================
-- 1. SEED DATA - UNIT KERJA
-- =====================================================

INSERT INTO unit_kerja (kode_unit_kerja, nama_unit_kerja) VALUES
('UK001', 'Unit Gizi'),
('UK002', 'Unit Laboratorium'),
('UK003', 'Unit Radiologi'),
('UK004', 'Unit Keperawatan'),
('UK005', 'Unit Pelayanan Rawat Jalan'),
('UK006', 'Unit Diklat'),
('UK007', 'Unit BDRS'),
('UK008', 'Unit Farmasi'),
('UK009', 'Unit Rekam Medis'),
('UK010', 'Unit Keuangan')
ON CONFLICT (kode_unit_kerja) DO NOTHING;

-- =====================================================
-- 2. SEED DATA - DATA KEGIATAN SAMPLE
-- =====================================================

-- Insert sample data kegiatan
INSERT INTO "Data_Kegiatan" (kode_uk, tahun, unit_kerja_id) 
SELECT 
    uk.kode_unit_kerja,
    2024,
    uk.id
FROM unit_kerja uk
WHERE uk.kode_unit_kerja IN ('UK001', 'UK002', 'UK003', 'UK004', 'UK005')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. SEED DATA - USER ROLES (jika ada user yang sudah terdaftar)
-- =====================================================

-- Function untuk assign role ke user berdasarkan email
CREATE OR REPLACE FUNCTION seed_user_role_by_email(
    user_email TEXT,
    role_name_param TEXT
)
RETURNS JSON AS $$
DECLARE
    user_id_var UUID;
    role_id_var UUID;
BEGIN
    -- Get user ID from email
    SELECT id INTO user_id_var 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_var IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User dengan email ' || user_email || ' tidak ditemukan'
        );
    END IF;
    
    -- Get role ID
    SELECT id INTO role_id_var 
    FROM role_akses_aplikasi 
    WHERE role_name = role_name_param AND is_active = true;
    
    IF role_id_var IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Role ' || role_name_param || ' tidak ditemukan'
        );
    END IF;
    
    -- Deactivate existing roles
    UPDATE user_roles
    SET is_active = false
    WHERE user_id = user_id_var AND is_active = true;
    
    -- Insert new role assignment
    INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
    VALUES (user_id_var, role_id_var, user_id_var, true)
    ON CONFLICT (user_id, role_id)
    DO UPDATE SET 
        is_active = true,
        assigned_by = user_id_var,
        assigned_at = now();
    
    RETURN json_build_object(
        'success', true,
        'message', 'Role ' || role_name_param || ' berhasil di-assign ke ' || user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Query untuk verifikasi setup database
CREATE OR REPLACE FUNCTION verify_database_setup()
RETURNS TABLE(
    component TEXT,
    count BIGINT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Roles'::TEXT as component,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'MISSING' END as status
    FROM role_akses_aplikasi WHERE is_active = true
    
    UNION ALL
    
    SELECT 
        'Menu Items'::TEXT as component,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 15 THEN 'OK' ELSE 'MISSING' END as status
    FROM menu_items WHERE is_active = true
    
    UNION ALL
    
    SELECT 
        'Role Menu Access'::TEXT as component,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 50 THEN 'OK' ELSE 'MISSING' END as status
    FROM role_menu_items
    
    UNION ALL
    
    SELECT 
        'Unit Kerja'::TEXT as component,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'MISSING' END as status
    FROM unit_kerja
    
    UNION ALL
    
    SELECT 
        'Functions'::TEXT as component,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'MISSING' END as status
    FROM pg_proc 
    WHERE proname IN ('is_superadmin', 'is_admin_or_superadmin', 'assign_role_to_user', 'get_all_users_with_roles', 'get_all_roles_menu_summary');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CLEANUP FUNCTION
-- =====================================================

-- Function untuk reset semua data (hati-hati!)
CREATE OR REPLACE FUNCTION reset_database_data()
RETURNS JSON AS $$
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = replica;
    
    -- Clear data
    DELETE FROM user_roles;
    DELETE FROM role_menu_items;
    DELETE FROM "Data_Kegiatan";
    DELETE FROM unit_kerja;
    
    -- Re-enable triggers
    SET session_replication_role = DEFAULT;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Database data telah di-reset'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- SELESAI - SEED DATA SIAP DIGUNAKAN
-- =====================================================
