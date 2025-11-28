-- Migration: Create Role Access Tables
-- Description: Create tables for role access matrix feature
-- Date: 2024-11-27
-- Author: System

-- ============================================================================
-- 1. CREATE MENU_ITEMS TABLE
-- ============================================================================
-- Stores the menu structure of the application
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(200),
  icon VARCHAR(50),
  parent_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE menu_items IS 'Stores application menu structure for role access matrix';
COMMENT ON COLUMN menu_items.id IS 'Unique identifier for menu item (kebab-case)';
COMMENT ON COLUMN menu_items.parent_id IS 'Reference to parent menu for hierarchy';
COMMENT ON COLUMN menu_items.order_index IS 'Display order within same level';

-- ============================================================================
-- 2. CREATE ROLE_PERMISSIONS TABLE
-- ============================================================================
-- Stores permissions for each role-menu combination
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  menu_id VARCHAR(50) NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  can_import BOOLEAN DEFAULT FALSE,
  rls_policy TEXT,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, menu_id)
);

-- Add comment
COMMENT ON TABLE role_permissions IS 'Stores granular permissions for each role-menu combination';
COMMENT ON COLUMN role_permissions.rls_policy IS 'Associated RLS policy name if applicable';
COMMENT ON COLUMN role_permissions.conditions IS 'Additional conditions in JSON format';

-- ============================================================================
-- 3. CREATE PERMISSION_CHANGELOG TABLE
-- ============================================================================
-- Stores history of permission changes for audit trail
CREATE TABLE IF NOT EXISTS permission_changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  menu_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE SET NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  old_permissions JSONB,
  new_permissions JSONB,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE permission_changelog IS 'Audit trail for permission changes';
COMMENT ON COLUMN permission_changelog.change_type IS 'Type of change: create, update, or delete';
COMMENT ON COLUMN permission_changelog.old_permissions IS 'Permission state before change';
COMMENT ON COLUMN permission_changelog.new_permissions IS 'Permission state after change';


-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for menu_items
CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(order_index);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);

-- Indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_menu ON role_permissions(menu_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_menu ON role_permissions(role_id, menu_id);

-- Indexes for permission_changelog
CREATE INDEX IF NOT EXISTS idx_permission_changelog_role ON permission_changelog(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_changelog_menu ON permission_changelog(menu_id);
CREATE INDEX IF NOT EXISTS idx_permission_changelog_created ON permission_changelog(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_changelog_changed_by ON permission_changelog(changed_by);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_changelog ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- Policy for menu_items: Allow read access to all authenticated users
DROP POLICY IF EXISTS "Allow read access to menu_items for authenticated users" ON menu_items;
CREATE POLICY "Allow read access to menu_items for authenticated users"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

-- Policy for menu_items: Allow write access to super admin only
DROP POLICY IF EXISTS "Allow write access to menu_items for super admin" ON menu_items;
CREATE POLICY "Allow write access to menu_items for super admin"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'mukhsin9@gmail.com'
  );

-- Policy for role_permissions: Role-based visibility
-- Users can only see permissions for their role level and below
DROP POLICY IF EXISTS "Allow read access to role_permissions based on user role" ON role_permissions;
CREATE POLICY "Allow read access to role_permissions based on user role"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    -- Super admin can see all
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'mukhsin9@gmail.com'
    OR
    -- Others can see their role level and below (higher level number = lower privilege)
    role_id >= (
      SELECT r.id FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      ORDER BY r.level ASC
      LIMIT 1
    )
  );

-- Policy for role_permissions: Allow write access to admin and super admin
DROP POLICY IF EXISTS "Allow write access to role_permissions for admins" ON role_permissions;
CREATE POLICY "Allow write access to role_permissions for admins"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.role_name IN ('Super Admin', 'Admin')
    )
  );

-- Policy for permission_changelog: Allow read access to admins only
DROP POLICY IF EXISTS "Allow read access to permission_changelog for admins" ON permission_changelog;
CREATE POLICY "Allow read access to permission_changelog for admins"
  ON permission_changelog FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.role_name IN ('Super Admin', 'Admin')
    )
  );

-- Policy for permission_changelog: Allow insert for authenticated users (auto-logged)
DROP POLICY IF EXISTS "Allow insert to permission_changelog for authenticated" ON permission_changelog;
CREATE POLICY "Allow insert to permission_changelog for authenticated"
  ON permission_changelog FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 7. CREATE TRIGGER FOR PERMISSION CHANGELOG
-- ============================================================================

-- Function to log permission changes
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_changelog (
      role_id, menu_id, changed_by, change_type, 
      old_permissions, new_permissions
    ) VALUES (
      NEW.role_id, NEW.menu_id, auth.uid(), 'create',
      NULL,
      jsonb_build_object(
        'can_view', NEW.can_view,
        'can_create', NEW.can_create,
        'can_update', NEW.can_update,
        'can_delete', NEW.can_delete,
        'can_export', NEW.can_export,
        'can_import', NEW.can_import
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO permission_changelog (
      role_id, menu_id, changed_by, change_type,
      old_permissions, new_permissions
    ) VALUES (
      NEW.role_id, NEW.menu_id, auth.uid(), 'update',
      jsonb_build_object(
        'can_view', OLD.can_view,
        'can_create', OLD.can_create,
        'can_update', OLD.can_update,
        'can_delete', OLD.can_delete,
        'can_export', OLD.can_export,
        'can_import', OLD.can_import
      ),
      jsonb_build_object(
        'can_view', NEW.can_view,
        'can_create', NEW.can_create,
        'can_update', NEW.can_update,
        'can_delete', NEW.can_delete,
        'can_export', NEW.can_export,
        'can_import', NEW.can_import
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_changelog (
      role_id, menu_id, changed_by, change_type,
      old_permissions, new_permissions
    ) VALUES (
      OLD.role_id, OLD.menu_id, auth.uid(), 'delete',
      jsonb_build_object(
        'can_view', OLD.can_view,
        'can_create', OLD.can_create,
        'can_update', OLD.can_update,
        'can_delete', OLD.can_delete,
        'can_export', OLD.can_export,
        'can_import', OLD.can_import
      ),
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_permission_change ON role_permissions;
CREATE TRIGGER trigger_log_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION log_permission_change();

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get visible roles for current user
CREATE OR REPLACE FUNCTION get_visible_roles()
RETURNS TABLE (
  id INTEGER,
  role_name VARCHAR(50),
  description TEXT,
  level INTEGER
) AS $$
BEGIN
  -- Super admin sees all roles
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) = 'mukhsin9@gmail.com' THEN
    RETURN QUERY
    SELECT r.id, r.role_name, r.description, r.level
    FROM roles r
    ORDER BY r.level ASC;
  ELSE
    -- Others see their role level and below
    RETURN QUERY
    SELECT r.id, r.role_name, r.description, r.level
    FROM roles r
    WHERE r.level >= (
      SELECT r2.level FROM roles r2
      JOIN user_roles ur ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      ORDER BY r2.level ASC
      LIMIT 1
    )
    ORDER BY r.level ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_visible_roles() TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: menu_items, role_permissions, permission_changelog
-- Indexes created: 10 indexes for performance
-- RLS enabled and policies created for all tables
-- Trigger created for automatic changelog logging
-- Helper function created for role visibility
