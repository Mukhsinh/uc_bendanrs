-- =====================================================
-- SCRIPT SETUP DATABASE LENGKAP UNTUK APLIKASI UNIT COST RS
-- =====================================================
-- Script ini berisi semua tabel, fungsi, dan data seed
-- yang diperlukan untuk menjalankan aplikasi

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TABEL UTAMA
-- =====================================================

-- Tabel Role Akses Aplikasi
CREATE TABLE IF NOT EXISTS role_akses_aplikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_name VARCHAR(100) NOT NULL,
    menu_url VARCHAR(255) NOT NULL,
    menu_description TEXT,
    menu_icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Role Menu Access
CREATE TABLE IF NOT EXISTS role_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES role_akses_aplikasi(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role_id, menu_id)
);

-- Tabel User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES role_akses_aplikasi(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Tabel Unit Kerja
CREATE TABLE IF NOT EXISTS unit_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_unit_kerja VARCHAR(50) NOT NULL UNIQUE,
    nama_unit_kerja VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Data Kegiatan
CREATE TABLE IF NOT EXISTS "Data_Kegiatan" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_uk VARCHAR(50),
    tahun INTEGER,
    unit_kerja_id UUID REFERENCES unit_kerja(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. FUNGSI HELPER
-- =====================================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function untuk cek superadmin
CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_akses_aplikasi r ON ur.role_id = r.id
        WHERE ur.user_id = check_user_id
          AND r.role_name = 'Super Admin'
          AND ur.is_active = true
          AND r.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function untuk cek admin atau superadmin
CREATE OR REPLACE FUNCTION is_admin_or_superadmin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_akses_aplikasi r ON ur.role_id = r.id
        WHERE ur.user_id = check_user_id
          AND r.role_name IN ('Super Admin', 'Admin')
          AND ur.is_active = true
          AND r.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function untuk assign role ke user
CREATE OR REPLACE FUNCTION assign_role_to_user(
    user_id_param UUID,
    role_name_param TEXT
)
RETURNS JSON AS $$
DECLARE
    role_id_var UUID;
BEGIN
    -- Only superadmin or admin can assign roles
    IF NOT public.is_admin_or_superadmin() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Anda tidak memiliki izin untuk assign role'
        );
    END IF;

    -- Get role ID
    SELECT id INTO role_id_var
    FROM role_akses_aplikasi
    WHERE role_name = role_name_param AND is_active = true;

    IF role_id_var IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Role tidak ditemukan'
        );
    END IF;

    -- Check if user already has this exact role and it's active
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param 
        AND role_id = role_id_var 
        AND is_active = true
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User sudah memiliki role ini'
        );
    END IF;

    -- Deactivate any existing active roles for this user
    UPDATE user_roles
    SET is_active = false
    WHERE user_id = user_id_param AND is_active = true;

    -- Insert new role assignment with proper conflict handling
    INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
    VALUES (user_id_param, role_id_var, auth.uid(), true)
    ON CONFLICT (user_id, role_id) 
    DO UPDATE SET 
        is_active = true,
        assigned_by = auth.uid(),
        assigned_at = now();

    RETURN json_build_object(
        'success', true,
        'message', 'Role berhasil di-assign ke user',
        'user_id', user_id_param,
        'role_name', role_name_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function untuk get all users with roles
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE(
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    role_name TEXT,
    role_description TEXT,
    role_is_active BOOLEAN,
    assigned_at TIMESTAMPTZ,
    assigned_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        ra.role_name,
        ra.description,
        ur.is_active,
        ur.assigned_at,
        assigner.email as assigned_by_email
    FROM auth.users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
    LEFT JOIN role_akses_aplikasi ra ON ur.role_id = ra.id
    LEFT JOIN auth.users assigner ON ur.assigned_by = assigner.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function untuk get all roles menu summary
CREATE OR REPLACE FUNCTION get_all_roles_menu_summary()
RETURNS TABLE(
    role_name TEXT,
    role_description TEXT,
    total_menus BIGINT,
    view_access BIGINT,
    create_access BIGINT,
    edit_access BIGINT,
    delete_access BIGINT,
    menu_list TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ra.role_name,
        ra.description,
        COUNT(rmi.menu_id) as total_menus,
        SUM(CASE WHEN rmi.can_view = true THEN 1 ELSE 0 END) as view_access,
        SUM(CASE WHEN rmi.can_create = true THEN 1 ELSE 0 END) as create_access,
        SUM(CASE WHEN rmi.can_edit = true THEN 1 ELSE 0 END) as edit_access,
        SUM(CASE WHEN rmi.can_delete = true THEN 1 ELSE 0 END) as delete_access,
        STRING_AGG(mi.menu_name, ', ' ORDER BY mi.menu_name) as menu_list
    FROM role_akses_aplikasi ra
    LEFT JOIN role_menu_items rmi ON ra.id = rmi.role_id
    LEFT JOIN menu_items mi ON rmi.menu_id = mi.id
    WHERE ra.is_active = true
    GROUP BY ra.id, ra.role_name, ra.description
    ORDER BY ra.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger untuk update timestamp
DROP TRIGGER IF EXISTS update_role_akses_aplikasi_updated_at ON role_akses_aplikasi;
CREATE TRIGGER update_role_akses_aplikasi_updated_at
    BEFORE UPDATE ON role_akses_aplikasi
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_menu_items_updated_at ON role_menu_items;
CREATE TRIGGER update_role_menu_items_updated_at
    BEFORE UPDATE ON role_menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE role_akses_aplikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Data_Kegiatan" ENABLE ROW LEVEL SECURITY;

-- Policies untuk authenticated users
CREATE POLICY "Allow all operations for authenticated users on role_akses_aplikasi" ON role_akses_aplikasi
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on menu_items" ON menu_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on role_menu_items" ON role_menu_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on user_roles" ON user_roles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on unit_kerja" ON unit_kerja
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on Data_Kegiatan" ON "Data_Kegiatan"
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. INDEXES UNTUK PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_menu_items_role_id ON role_menu_items(role_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_items_menu_id ON role_menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_unit_kerja_kode ON unit_kerja(kode_unit_kerja);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_kode_uk ON "Data_Kegiatan"(kode_uk);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_tahun ON "Data_Kegiatan"(tahun);

-- =====================================================
-- 6. SEED DATA - ROLES
-- =====================================================

INSERT INTO role_akses_aplikasi (role_name, description) VALUES
('Super Admin', 'Akses penuh ke semua fitur sistem'),
('Admin', 'Administrator dengan akses terbatas'),
('Manager', 'Manager dengan akses laporan dan monitoring'),
('Operator', 'Operator dengan akses input data'),
('Viewer', 'Hanya dapat melihat data dan laporan'),
('Operator Penunjang', 'Operator dengan akses terbatas ke menu Unit Penunjang (Gizi, Laboratorium, Radiologi, BDRS)'),
('Operator Keperawatan', 'Operator dengan akses terbatas ke menu Unit Keperawatan'),
('Operator Pelayanan', 'Operator dengan akses terbatas ke menu Unit Pelayanan (Rawat Jalan, Operatif, Cathlab)')
ON CONFLICT (role_name) DO NOTHING;

-- =====================================================
-- 7. SEED DATA - MENU ITEMS
-- =====================================================

INSERT INTO menu_items (menu_name, menu_url, menu_description, menu_icon) VALUES
('Dashboard', '/', 'Halaman utama dashboard', 'Home'),
('Data Master', '/data-master', 'Manajemen data master', 'Database'),
('Data Operasional', '/data-operasional', 'Data operasional sistem', 'Settings'),
('Unit Penunjang', '/unit-penunjang', 'Unit penunjang (Gizi, Lab, Radiologi, BDRS)', 'Building'),
('Unit Keperawatan', '/unit-keperawatan', 'Unit keperawatan dan rawat inap', 'Users'),
('Unit Pelayanan', '/unit-pelayanan', 'Unit pelayanan rawat jalan', 'Activity'),
('Unit Diklat', '/unit-diklat', 'Unit diklat dan pelatihan', 'BookOpen'),
('Rekapitulasi Unit Cost', '/rekapitulasi-unit-cost', 'Rekapitulasi unit cost', 'BarChart3'),
('Skenario Tarif', '/skenario-tarif', 'Skenario tarif tindakan', 'FileText'),
('Distribusi Biaya', '/distribusi-biaya', 'Distribusi biaya sistem', 'TrendingUp'),
('Cost Recovery', '/cost-recovery', 'Cost recovery analysis', 'PieChart'),
('Budgeting BHP', '/budgeting-bhp', 'Budgeting BHP (Barang Habis Pakai)', 'Package'),
('Produk Layanan', '/produk-layanan', 'Produk dan layanan', 'ShoppingCart'),
('Modul Teknis', '/modul-teknis', 'Modul teknis dan dokumentasi', 'BookOpenCheck'),
('Manajemen Akses', '/manajemen-akses', 'Manajemen akses dan user', 'Shield')
ON CONFLICT (menu_name) DO NOTHING;

-- =====================================================
-- 8. SEED DATA - ROLE MENU ACCESS
-- =====================================================

-- Function untuk assign menu access ke role
CREATE OR REPLACE FUNCTION assign_menu_access_to_role(
    role_name_param TEXT,
    menu_name_param TEXT,
    can_view_param BOOLEAN DEFAULT false,
    can_create_param BOOLEAN DEFAULT false,
    can_edit_param BOOLEAN DEFAULT false,
    can_delete_param BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
    role_id_var UUID;
    menu_id_var UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_id_var FROM role_akses_aplikasi WHERE role_name = role_name_param;
    
    -- Get menu ID
    SELECT id INTO menu_id_var FROM menu_items WHERE menu_name = menu_name_param;
    
    -- Insert or update role menu access
    INSERT INTO role_menu_items (role_id, menu_id, can_view, can_create, can_edit, can_delete)
    VALUES (role_id_var, menu_id_var, can_view_param, can_create_param, can_edit_param, can_delete_param)
    ON CONFLICT (role_id, menu_id)
    DO UPDATE SET
        can_view = can_view_param,
        can_create = can_create_param,
        can_edit = can_edit_param,
        can_delete = can_delete_param;
END;
$$ LANGUAGE plpgsql;

-- Assign menu access untuk Super Admin (semua menu, semua permission)
SELECT assign_menu_access_to_role('Super Admin', 'Dashboard', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Data Master', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Data Operasional', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Unit Penunjang', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Unit Keperawatan', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Unit Pelayanan', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Unit Diklat', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Rekapitulasi Unit Cost', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Skenario Tarif', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Distribusi Biaya', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Cost Recovery', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Budgeting BHP', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Produk Layanan', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Modul Teknis', true, true, true, true);
SELECT assign_menu_access_to_role('Super Admin', 'Manajemen Akses', true, true, true, true);

-- Assign menu access untuk Admin (semua kecuali Modul Teknis & Manajemen Akses, tidak ada delete)
SELECT assign_menu_access_to_role('Admin', 'Dashboard', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Data Master', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Data Operasional', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Unit Penunjang', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Unit Keperawatan', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Unit Pelayanan', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Unit Diklat', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Rekapitulasi Unit Cost', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Skenario Tarif', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Distribusi Biaya', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Cost Recovery', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Budgeting BHP', true, true, true, false);
SELECT assign_menu_access_to_role('Admin', 'Produk Layanan', true, true, true, false);

-- Assign menu access untuk Manager (hanya menu laporan, view only)
SELECT assign_menu_access_to_role('Manager', 'Dashboard', true, false, false, false);
SELECT assign_menu_access_to_role('Manager', 'Rekapitulasi Unit Cost', true, false, false, false);
SELECT assign_menu_access_to_role('Manager', 'Skenario Tarif', true, false, false, false);
SELECT assign_menu_access_to_role('Manager', 'Distribusi Biaya', true, false, false, false);
SELECT assign_menu_access_to_role('Manager', 'Cost Recovery', true, false, false, false);
SELECT assign_menu_access_to_role('Manager', 'Budgeting BHP', true, false, false, false);
SELECT assign_menu_access_to_role('Manager', 'Produk Layanan', true, false, false, false);

-- Assign menu access untuk Operator (unit operasional, tidak ada delete)
SELECT assign_menu_access_to_role('Operator', 'Dashboard', true, true, true, false);
SELECT assign_menu_access_to_role('Operator', 'Unit Penunjang', true, true, true, false);
SELECT assign_menu_access_to_role('Operator', 'Unit Keperawatan', true, true, true, false);
SELECT assign_menu_access_to_role('Operator', 'Unit Pelayanan', true, true, true, false);
SELECT assign_menu_access_to_role('Operator', 'Unit Diklat', true, true, true, false);

-- Assign menu access untuk Viewer (hanya menu laporan, view only)
SELECT assign_menu_access_to_role('Viewer', 'Dashboard', true, false, false, false);
SELECT assign_menu_access_to_role('Viewer', 'Rekapitulasi Unit Cost', true, false, false, false);
SELECT assign_menu_access_to_role('Viewer', 'Skenario Tarif', true, false, false, false);
SELECT assign_menu_access_to_role('Viewer', 'Distribusi Biaya', true, false, false, false);
SELECT assign_menu_access_to_role('Viewer', 'Cost Recovery', true, false, false, false);
SELECT assign_menu_access_to_role('Viewer', 'Budgeting BHP', true, false, false, false);
SELECT assign_menu_access_to_role('Viewer', 'Produk Layanan', true, false, false, false);

-- Assign menu access untuk Operator Penunjang (hanya Unit Penunjang)
SELECT assign_menu_access_to_role('Operator Penunjang', 'Dashboard', true, false, false, false);
SELECT assign_menu_access_to_role('Operator Penunjang', 'Unit Penunjang', true, true, true, false);

-- Assign menu access untuk Operator Keperawatan (hanya Unit Keperawatan)
SELECT assign_menu_access_to_role('Operator Keperawatan', 'Dashboard', true, false, false, false);
SELECT assign_menu_access_to_role('Operator Keperawatan', 'Unit Keperawatan', true, true, true, false);

-- Assign menu access untuk Operator Pelayanan (hanya Unit Pelayanan)
SELECT assign_menu_access_to_role('Operator Pelayanan', 'Dashboard', true, false, false, false);
SELECT assign_menu_access_to_role('Operator Pelayanan', 'Unit Pelayanan', true, true, true, false);

-- Drop helper function
DROP FUNCTION assign_menu_access_to_role(TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);

-- =====================================================
-- 9. SEED DATA - UNIT KERJA SAMPLE
-- =====================================================

INSERT INTO unit_kerja (kode_unit_kerja, nama_unit_kerja) VALUES
('UK001', 'Unit Gizi'),
('UK002', 'Unit Laboratorium'),
('UK003', 'Unit Radiologi'),
('UK004', 'Unit Keperawatan'),
('UK005', 'Unit Pelayanan Rawat Jalan'),
('UK006', 'Unit Diklat'),
('UK007', 'Unit BDRS')
ON CONFLICT (kode_unit_kerja) DO NOTHING;

-- =====================================================
-- SELESAI - DATABASE SIAP DIGUNAKAN
-- =====================================================
