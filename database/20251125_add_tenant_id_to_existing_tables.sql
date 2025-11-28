-- Migration: Add tenant_id column to existing tables
-- Date: 2025-11-25
-- Requirements: 4.1

-- This script adds tenant_id column to all existing tables that need multi-tenant support
-- The tenant_id will be added as nullable initially to allow for data migration

-- List of tables that need tenant_id column
-- Based on the database schema, here are all the tables that need tenant_id:

-- 1. Role and access management tables
ALTER TABLE role_akses_aplikasi ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE role_menu_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Unit and operational data tables
ALTER TABLE unit_kerja ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE "Data_Kegiatan" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. Add tenant_id to kalkulasi_diklat table if it exists
-- Note: This table is defined in separate files, so we'll add it conditionally
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    ALTER TABLE kalkulasi_diklat ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance on tenant_id columns
CREATE INDEX IF NOT EXISTS idx_role_akses_aplikasi_tenant_id ON role_akses_aplikasi(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_items_tenant_id ON role_menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_unit_kerja_tenant_id ON unit_kerja(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_tenant_id ON "Data_Kegiatan"(tenant_id);

-- If kalkulasi_diklat exists, create index for it too
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_tenant_id ON kalkulasi_diklat(tenant_id);
  END IF;
END $$;

-- Create composite indexes for foreign key relationships with tenant_id
CREATE INDEX IF NOT EXISTS idx_role_menu_items_tenant_role ON role_menu_items(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_items_tenant_menu ON role_menu_items(tenant_id, menu_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_user ON user_roles(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_role ON user_roles(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_tenant_unit ON "Data_Kegiatan"(tenant_id, unit_kerja_id);

-- Add comments for documentation
COMMENT ON COLUMN role_akses_aplikasi.tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';
COMMENT ON COLUMN menu_items.tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';
COMMENT ON COLUMN role_menu_items.tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';
COMMENT ON COLUMN user_roles.tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';
COMMENT ON COLUMN unit_kerja.tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';
COMMENT ON COLUMN "Data_Kegiatan".tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';

-- If kalkulasi_diklat exists, add comment for it too
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kalkulasi_diklat') THEN
    COMMENT ON COLUMN kalkulasi_diklat.tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';
  END IF;
END $$;