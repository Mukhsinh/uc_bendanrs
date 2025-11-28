-- Migration: Create tenant_audit_log table for audit trail
-- Date: 2025-11-24
-- Requirements: 7.4, 8.4

-- Create tenant_audit_log table
CREATE TABLE IF NOT EXISTS public.tenant_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  
  -- Data changes
  old_data JSONB,
  new_data JSONB,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT tenant_audit_log_action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- Create indexes untuk query performance
CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON public.tenant_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.tenant_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.tenant_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table_name ON public.tenant_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.tenant_audit_log(action);

-- Composite index untuk query yang sering digunakan
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created 
  ON public.tenant_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_user 
  ON public.tenant_audit_log(tenant_id, user_id, created_at DESC);

-- Add comments untuk dokumentasi
COMMENT ON TABLE public.tenant_audit_log IS 'Tabel untuk menyimpan audit trail semua perubahan data tenant';
COMMENT ON COLUMN public.tenant_audit_log.id IS 'ID unik untuk setiap log entry';
COMMENT ON COLUMN public.tenant_audit_log.tenant_id IS 'Foreign key ke tenant yang melakukan action';
COMMENT ON COLUMN public.tenant_audit_log.user_id IS 'Foreign key ke user yang melakukan action';
COMMENT ON COLUMN public.tenant_audit_log.action IS 'Jenis action (CREATE, UPDATE, DELETE, LOGIN, etc)';
COMMENT ON COLUMN public.tenant_audit_log.table_name IS 'Nama tabel yang dimodifikasi';
COMMENT ON COLUMN public.tenant_audit_log.record_id IS 'ID record yang dimodifikasi';
COMMENT ON COLUMN public.tenant_audit_log.old_data IS 'Data sebelum perubahan dalam format JSON';
COMMENT ON COLUMN public.tenant_audit_log.new_data IS 'Data setelah perubahan dalam format JSON';
COMMENT ON COLUMN public.tenant_audit_log.ip_address IS 'IP address user yang melakukan action';
COMMENT ON COLUMN public.tenant_audit_log.user_agent IS 'User agent browser/client';
COMMENT ON COLUMN public.tenant_audit_log.created_at IS 'Timestamp ketika action dilakukan';

-- Create function untuk log audit trail
CREATE OR REPLACE FUNCTION log_tenant_audit(
  p_tenant_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO public.tenant_audit_log (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_tenant_audit IS 'Helper function untuk mencatat audit trail';
