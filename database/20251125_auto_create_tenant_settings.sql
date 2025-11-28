-- Migration: Auto-create tenant_settings when tenant is created
-- Date: 2025-11-25
-- Requirements: 1.1

-- Create function to automatically create tenant_settings when a tenant is created
CREATE OR REPLACE FUNCTION auto_create_tenant_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default tenant_settings record for the new tenant
  INSERT INTO public.tenant_settings (tenant_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to execute the function after tenant creation
DROP TRIGGER IF EXISTS trigger_auto_create_tenant_settings ON public.tenants;

CREATE TRIGGER trigger_auto_create_tenant_settings
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_settings();

-- Add comment for documentation
COMMENT ON FUNCTION auto_create_tenant_settings IS 'Function to automatically create tenant_settings record when a new tenant is created';
COMMENT ON TRIGGER trigger_auto_create_tenant_settings ON public.tenants IS 'Trigger to automatically create tenant_settings record when a new tenant is created';