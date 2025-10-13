-- Script untuk membuat tabel manajemen user dan role-based access control
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat tabel roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat tabel user_profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat tabel permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL, -- e.g., 'data-master', 'kalkulasi', 'distribusi'
  action VARCHAR(50) NOT NULL,    -- e.g., 'read', 'write', 'delete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Buat tabel role_permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 5. Buat tabel menu_items untuk konfigurasi menu
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  href VARCHAR(200),
  icon VARCHAR(50),
  parent_id UUID REFERENCES menu_items(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Buat tabel role_menu_items (many-to-many)
CREATE TABLE IF NOT EXISTS role_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, menu_item_id)
);

-- 7. Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_items_role_id ON role_menu_items(role_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_items_menu_item_id ON role_menu_items(menu_item_id);

-- 8. Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_menu_items ENABLE ROW LEVEL SECURITY;

-- 9. Buat policies untuk RLS
-- Roles - semua user authenticated bisa read, hanya admin bisa write
CREATE POLICY "Roles are viewable by authenticated users" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Roles are editable by admin" ON roles
  FOR ALL USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM user_profiles up 
           JOIN roles r ON up.role_id = r.id 
           WHERE up.id = auth.uid() AND r.name = 'admin'));

-- User profiles - user bisa lihat dan edit profil sendiri, admin bisa semua
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can manage all profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM user_profiles up 
           JOIN roles r ON up.role_id = r.id 
           WHERE up.id = auth.uid() AND r.name = 'admin'));

-- Permissions - hanya admin bisa manage
CREATE POLICY "Permissions are viewable by authenticated users" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permissions are editable by admin" ON permissions
  FOR ALL USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM user_profiles up 
           JOIN roles r ON up.role_id = r.id 
           WHERE up.id = auth.uid() AND r.name = 'admin'));

-- Role permissions - hanya admin bisa manage
CREATE POLICY "Role permissions are viewable by authenticated users" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Role permissions are editable by admin" ON role_permissions
  FOR ALL USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM user_profiles up 
           JOIN roles r ON up.role_id = r.id 
           WHERE up.id = auth.uid() AND r.name = 'admin'));

-- Menu items - semua user authenticated bisa read
CREATE POLICY "Menu items are viewable by authenticated users" ON menu_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Menu items are editable by admin" ON menu_items
  FOR ALL USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM user_profiles up 
           JOIN roles r ON up.role_id = r.id 
           WHERE up.id = auth.uid() AND r.name = 'admin'));

-- Role menu items - semua user authenticated bisa read, admin bisa manage
CREATE POLICY "Role menu items are viewable by authenticated users" ON role_menu_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Role menu items are editable by admin" ON role_menu_items
  FOR ALL USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM user_profiles up 
           JOIN roles r ON up.role_id = r.id 
           WHERE up.id = auth.uid() AND r.name = 'admin'));

-- 10. Insert default data

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator - Full access to all features'),
('manager', 'Manager - Access to management features'),
('analyst', 'Analyst - Access to analysis and reporting'),
('operator', 'Operator - Limited access to data entry'),
('viewer', 'Viewer - Read-only access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES 
-- Data Master permissions
('data_master_read', 'Read data master', 'data-master', 'read'),
('data_master_write', 'Write data master', 'data-master', 'write'),
('data_master_delete', 'Delete data master', 'data-master', 'delete'),

-- Kalkulasi permissions
('kalkulasi_read', 'Read kalkulasi', 'kalkulasi', 'read'),
('kalkulasi_write', 'Write kalkulasi', 'kalkulasi', 'write'),

-- Distribusi permissions
('distribusi_read', 'Read distribusi', 'distribusi', 'read'),
('distribusi_write', 'Write distribusi', 'distribusi', 'write'),

-- Reporting permissions
('reporting_read', 'Read reports', 'reporting', 'read'),
('reporting_export', 'Export reports', 'reporting', 'export'),

-- User management permissions
('user_management_read', 'Read user management', 'user-management', 'read'),
('user_management_write', 'Write user management', 'user-management', 'write'),
('user_management_delete', 'Delete user management', 'user-management', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Insert default menu items
INSERT INTO menu_items (title, href, icon, parent_id, sort_order) VALUES 
-- Main menu items
('Dashboard', '/', 'Home', NULL, 1),
('Data Master', NULL, 'Database', NULL, 2),
('Data Operasional', NULL, 'Settings', NULL, 3),
('Unit Penunjang', NULL, 'Building', NULL, 4),
('Unit Keperawatan', NULL, 'Users', NULL, 5),
('Unit Pelayanan', NULL, 'Activity', NULL, 6),
('Unit Diklat', NULL, 'BookOpen', NULL, 7),
('Rekapitulasi Unit Cost', '/rekapitulasi-unit-cost', 'BarChart3', NULL, 8),
('Skenario Tarif', NULL, 'FileText', NULL, 9),
('Distribusi Biaya', NULL, 'TrendingUp', NULL, 10),
('Cost Recovery', '/cost-recovery', 'PieChart', NULL, 11),
('Manajemen User', '/user-management', 'UserCog', NULL, 12),

-- Data Master submenu
('Data Unit Kerja', '/data-master/unit-kerja', 'Briefcase', (SELECT id FROM menu_items WHERE title = 'Data Master'), 1),
('Barang Farmasi', '/data-master/barang', 'Package', (SELECT id FROM menu_items WHERE title = 'Data Master'), 2),
('Barang Gizi', '/data-master/barang-gizi', 'Utensils', (SELECT id FROM menu_items WHERE title = 'Data Master'), 3),
('Data Kamar', '/data-master/kamar', 'Bed', (SELECT id FROM menu_items WHERE title = 'Data Master'), 4),
('Data Klinik', '/data-master/klinik', 'Stethoscope', (SELECT id FROM menu_items WHERE title = 'Data Master'), 5),
('Menu Gizi', '/data-master/menu-gizi', 'Utensils', (SELECT id FROM menu_items WHERE title = 'Data Master'), 6),
('Data Diklat', '/data-master/diklat', 'GraduationCap', (SELECT id FROM menu_items WHERE title = 'Data Master'), 7),
('Daftar Tindakan', '/data-master/daftar-tindakan', 'Scissors', (SELECT id FROM menu_items WHERE title = 'Data Master'), 8),
('Tindakan Laboratorium', '/data-master/tindakan-lab', 'Microscope', (SELECT id FROM menu_items WHERE title = 'Data Master'), 9),
('Tindakan Radiologi', '/data-master/tindakan-radiologi', 'Scan', (SELECT id FROM menu_items WHERE title = 'Data Master'), 10),
('Tindakan Operatif', '/data-master/tindakan-operatif', 'Scissors', (SELECT id FROM menu_items WHERE title = 'Data Master'), 11),
('Tindakan BDRS', '/data-master/tindakan-bdrs', 'Droplet', (SELECT id FROM menu_items WHERE title = 'Data Master'), 12),
('Tindakan Cathlab', '/data-master/tindakan-cathlab', 'ActivitySquare', (SELECT id FROM menu_items WHERE title = 'Data Master'), 13),

-- Data Operasional submenu
('Data Kegiatan', '/data-master/kegiatan', 'Activity', (SELECT id FROM menu_items WHERE title = 'Data Operasional'), 1),
('Data Pendapatan', '/data-master/pendapatan', 'Wallet', (SELECT id FROM menu_items WHERE title = 'Data Operasional'), 2),
('Data Biaya', '/data-master/biaya', 'Landmark', (SELECT id FROM menu_items WHERE title = 'Data Operasional'), 3),

-- Unit Penunjang submenu
('Kalkulasi Biaya Gizi', '/kalkulasi-biaya-gizi', 'Utensils', (SELECT id FROM menu_items WHERE title = 'Unit Penunjang'), 1),
('Kalkulasi Biaya Laboratorium', '/kalkulasi-biaya-laboratorium', 'Microscope', (SELECT id FROM menu_items WHERE title = 'Unit Penunjang'), 2),
('Kalkulasi Biaya Radiologi', '/kalkulasi-biaya-radiologi', 'Scan', (SELECT id FROM menu_items WHERE title = 'Unit Penunjang'), 3),
('Kalkulasi BDRS', '/kalkulasi-biaya-bdrs', 'Droplet', (SELECT id FROM menu_items WHERE title = 'Unit Penunjang'), 4),

-- Unit Keperawatan submenu
('Manajemen Tindakan Inap', '/keperawatan/manajemen-tindakan-inap', 'Scissors', (SELECT id FROM menu_items WHERE title = 'Unit Keperawatan'), 1),
('Data Akomodasi Inap', '/keperawatan/data-akomodasi-inap', 'Utensils', (SELECT id FROM menu_items WHERE title = 'Unit Keperawatan'), 2),
('Kalkulasi Tindakan Inap', '/keperawatan/kalkulasi-tindakan-inap', 'Calculator', (SELECT id FROM menu_items WHERE title = 'Unit Keperawatan'), 3),
('Kalkulasi Biaya Kelas Akomodasi', '/keperawatan/kalkulasi-biaya-kelas-akomodasi', 'Bed', (SELECT id FROM menu_items WHERE title = 'Unit Keperawatan'), 4),

-- Unit Pelayanan submenu
('Kalkulasi Biaya Rawat Jalan', '/kalkulasi-biaya-rawat-jalan', 'Stethoscope', (SELECT id FROM menu_items WHERE title = 'Unit Pelayanan'), 1),
('Kalkulasi Biaya Operatif', '/kalkulasi-biaya-operatif', 'Scissors', (SELECT id FROM menu_items WHERE title = 'Unit Pelayanan'), 2),
('Kalkulasi Biaya Cathlab', '/kalkulasi-biaya-cathlab', 'Heart', (SELECT id FROM menu_items WHERE title = 'Unit Pelayanan'), 3),

-- Unit Diklat submenu
('Kalkulasi Biaya Diklat', '/kalkulasi-biaya-diklat', 'GraduationCap', (SELECT id FROM menu_items WHERE title = 'Unit Diklat'), 1),

-- Skenario Tarif submenu
('Skenario Tarif Tindakan', '/skenario-tarif-tindakan', 'FileText', (SELECT id FROM menu_items WHERE title = 'Skenario Tarif'), 1),
('Skenario Tarif Akomodasi', '/skenario-tarif-akomodasi', 'Bed', (SELECT id FROM menu_items WHERE title = 'Skenario Tarif'), 2),

-- Distribusi Biaya submenu
('Distribusi Biaya Pertama', '/distribusi-biaya-pertama', 'TrendingUp', (SELECT id FROM menu_items WHERE title = 'Distribusi Biaya'), 1),
('Distribusi Biaya Kedua', '/distribusi-biaya-kedua', 'TrendingUp', (SELECT id FROM menu_items WHERE title = 'Distribusi Biaya'), 2),
('Distribusi Biaya Rekap', '/distribusi-biaya-rekap', 'TrendingUp', (SELECT id FROM menu_items WHERE title = 'Distribusi Biaya'), 3)
ON CONFLICT DO NOTHING;

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Manager gets most permissions except user management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager' AND p.name != 'user_management_write' AND p.name != 'user_management_delete'
ON CONFLICT DO NOTHING;

-- Analyst gets read permissions for most resources
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'analyst' AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Operator gets read and write for data master and kalkulasi
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'operator' 
AND ((p.resource = 'data-master' AND p.action IN ('read', 'write'))
     OR (p.resource = 'kalkulasi' AND p.action IN ('read', 'write')))
ON CONFLICT DO NOTHING;

-- Viewer gets only read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Assign menu items to roles
-- Admin gets all menu items
INSERT INTO role_menu_items (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Manager gets most menu items except user management
INSERT INTO role_menu_items (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'manager' AND m.title != 'Manajemen User'
ON CONFLICT DO NOTHING;

-- Analyst gets dashboard, rekapitulasi, skenario tarif, cost recovery
INSERT INTO role_menu_items (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'analyst' 
AND m.title IN ('Dashboard', 'Rekapitulasi Unit Cost', 'Skenario Tarif', 'Cost Recovery')
ON CONFLICT DO NOTHING;

-- Operator gets dashboard, data master, data operasional, and limited kalkulasi
INSERT INTO role_menu_items (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'operator' 
AND (m.title IN ('Dashboard', 'Data Master', 'Data Operasional', 'Unit Penunjang', 'Unit Keperawatan', 'Unit Pelayanan', 'Unit Diklat')
     OR m.parent_id IN (SELECT id FROM menu_items WHERE title IN ('Data Master', 'Data Operasional', 'Unit Penunjang', 'Unit Keperawatan', 'Unit Pelayanan', 'Unit Diklat')))
ON CONFLICT DO NOTHING;

-- Viewer gets only dashboard and rekapitulasi
INSERT INTO role_menu_items (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'viewer' 
AND m.title IN ('Dashboard', 'Rekapitulasi Unit Cost')
ON CONFLICT DO NOTHING;

-- 11. Create function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role_id)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 
          (SELECT id FROM roles WHERE name = 'viewer' LIMIT 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. Create view for user with role information
CREATE OR REPLACE VIEW user_with_role AS
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  up.full_name,
  up.is_active,
  r.name as role_name,
  r.description as role_description
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id;

-- 14. Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id UUID,
  resource_name TEXT,
  action_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.id = user_id
      AND p.resource = resource_name
      AND p.action = action_name
      AND up.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to get user accessible menu items
CREATE OR REPLACE FUNCTION get_user_menu_items(user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  href TEXT,
  icon TEXT,
  parent_id UUID,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT m.id, m.title, m.href, m.icon, m.parent_id, m.sort_order
  FROM menu_items m
  JOIN role_menu_items rmi ON m.id = rmi.menu_item_id
  JOIN user_profiles up ON rmi.role_id = up.role_id
  WHERE up.id = user_id
    AND up.is_active = true
    AND m.is_active = true
  ORDER BY m.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;





