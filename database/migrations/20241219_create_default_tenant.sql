-- Create Default Tenant for Existing Data
-- Task 7.2: Buat default tenant untuk existing data
-- Requirements: 10.2

-- ============================================================================
-- STEP 1: CREATE DEFAULT TENANT
-- ============================================================================

-- Insert default tenant
-- This tenant will be used for all existing data
INSERT INTO tenants (
  name,
  slug,
  logo_url,
  metadata,
  status,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Default Hospital',
  'default-hospital',
  NULL,
  jsonb_build_object(
    'description', 'Default tenant for existing data migration',
    'migration_date', NOW(),
    'is_default', true
  ),
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING
RETURNING id, name, slug;

-- Store the tenant ID for later use
-- Note: In actual execution, capture this ID
DO $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  -- Get the default tenant ID
  SELECT id INTO v_default_tenant_id
  FROM tenants
  WHERE slug = 'default-hospital';
  
  IF v_default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create default tenant';
  END IF;
  
  RAISE NOTICE 'Default tenant created with ID: %', v_default_tenant_id;
END $$;

-- ============================================================================
-- STEP 2: CREATE DEFAULT TENANT SETTINGS
-- ============================================================================

-- Insert default tenant settings
INSERT INTO tenant_settings (
  tenant_id,
  primary_color,
  secondary_color,
  include_jasa_pelayanan,
  calculation_method,
  metadata,
  created_at,
  updated_at
)
SELECT 
  id as tenant_id,
  '#1e40af' as primary_color,
  '#3b82f6' as secondary_color,
  true as include_jasa_pelayanan,
  'standard' as calculation_method,
  jsonb_build_object(
    'default_settings', true,
    'created_during_migration', true
  ) as metadata,
  NOW() as created_at,
  NOW() as updated_at
FROM tenants
WHERE slug = 'default-hospital'
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 3: VERIFY DEFAULT TENANT CREATION
-- ============================================================================

-- Verify tenant was created
SELECT 
  id,
  name,
  slug,
  status,
  is_active,
  created_at
FROM tenants
WHERE slug = 'default-hospital';

-- Verify tenant settings were created
SELECT 
  ts.id,
  ts.tenant_id,
  t.name as tenant_name,
  ts.primary_color,
  ts.include_jasa_pelayanan,
  ts.created_at
FROM tenant_settings ts
JOIN tenants t ON ts.tenant_id = t.id
WHERE t.slug = 'default-hospital';

-- ============================================================================
-- STEP 4: CREATE HELPER FUNCTION FOR MIGRATION
-- ============================================================================

-- Function to get default tenant ID
CREATE OR REPLACE FUNCTION get_default_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE slug = 'default-hospital';
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found. Run migration script first.';
  END IF;
  
  RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION get_default_tenant_id() IS 
'Helper function to get default tenant ID for data migration';

-- Test the helper function
SELECT get_default_tenant_id() as default_tenant_id;

-- ============================================================================
-- STEP 5: PREPARE FOR DATA MIGRATION
-- ============================================================================

-- Create a migration log table to track progress
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  records_updated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE migration_log IS 
'Tracks progress of tenant_id migration for each table';

-- ============================================================================
-- STEP 6: VALIDATION
-- ============================================================================

-- Final validation query
SELECT 
  'Default Tenant Setup Complete' as status,
  jsonb_build_object(
    'tenant_id', t.id,
    'tenant_name', t.name,
    'tenant_slug', t.slug,
    'settings_configured', CASE WHEN ts.id IS NOT NULL THEN true ELSE false END,
    'helper_function_exists', EXISTS(
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_default_tenant_id'
    ),
    'migration_log_ready', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'migration_log'
    )
  ) as setup_summary
FROM tenants t
LEFT JOIN tenant_settings ts ON t.id = ts.tenant_id
WHERE t.slug = 'default-hospital';

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script:
-- 1. Creates a default tenant named "Default Hospital"
-- 2. Sets up default tenant settings
-- 3. Creates helper functions for migration
-- 4. Prepares migration log table
-- 5. Validates setup

-- Next steps:
-- - Run Task 7.3 to populate tenant_id for all existing records
-- - Use get_default_tenant_id() function in migration scripts
