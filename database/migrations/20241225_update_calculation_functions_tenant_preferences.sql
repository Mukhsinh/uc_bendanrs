-- Migration: Update Calculation Functions to Use Tenant Preferences
-- Date: 2024-12-25
-- Description: Update calculation functions untuk membaca dan menggunakan tenant preferences

-- Helper function untuk get tenant preferences
CREATE OR REPLACE FUNCTION get_tenant_preferences(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences JSONB;
BEGIN
  SELECT jsonb_build_object(
    'include_jasa_pelayanan', include_jasa_pelayanan,
    'currency', currency,
    'rounding_method', calculation_preferences->>'rounding_method',
    'decimal_places', (calculation_preferences->>'decimal_places')::INTEGER
  )
  INTO v_preferences
  FROM tenant_settings
  WHERE tenant_id = p_tenant_id;
  
  -- Return default jika tidak ada settings
  IF v_preferences IS NULL THEN
    v_preferences := jsonb_build_object(
      'include_jasa_pelayanan', true,
      'currency', 'IDR',
      'rounding_method', 'round',
      'decimal_places', 2
    );
  END IF;
  
  RETURN v_preferences;
END;
$$;

-- Helper function untuk apply rounding based on tenant preferences
CREATE OR REPLACE FUNCTION apply_tenant_rounding(
  p_value NUMERIC,
  p_tenant_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences JSONB;
  v_rounding_method TEXT;
  v_decimal_places INTEGER;
  v_result NUMERIC;
BEGIN
  -- Get tenant preferences
  v_preferences := get_tenant_preferences(p_tenant_id);
  v_rounding_method := v_preferences->>'rounding_method';
  v_decimal_places := (v_preferences->>'decimal_places')::INTEGER;
  
  -- Apply rounding based on method
  CASE v_rounding_method
    WHEN 'floor' THEN
      v_result := FLOOR(p_value * POWER(10, v_decimal_places)) / POWER(10, v_decimal_places);
    WHEN 'ceil' THEN
      v_result := CEIL(p_value * POWER(10, v_decimal_places)) / POWER(10, v_decimal_places);
    ELSE -- 'round' is default
      v_result := ROUND(p_value, v_decimal_places);
  END CASE;
  
  RETURN v_result;
END;
$$;

-- Example: Update sample calculation function to use tenant preferences
-- This is a template - actual functions will need to be updated based on their specific logic

CREATE OR REPLACE FUNCTION calculate_unit_cost_with_preferences(
  p_unit_kerja_id UUID,
  p_tenant_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences JSONB;
  v_include_jp BOOLEAN;
  v_total_cost NUMERIC := 0;
  v_jasa_pelayanan NUMERIC := 0;
  v_result NUMERIC;
BEGIN
  -- Get tenant preferences
  v_preferences := get_tenant_preferences(p_tenant_id);
  v_include_jp := (v_preferences->>'include_jasa_pelayanan')::BOOLEAN;
  
  -- Calculate base cost (example logic)
  SELECT COALESCE(SUM(total_biaya), 0)
  INTO v_total_cost
  FROM data_biaya
  WHERE unit_kerja_id = p_unit_kerja_id
    AND tenant_id = p_tenant_id;
  
  -- Add jasa pelayanan if enabled in preferences
  IF v_include_jp THEN
    SELECT COALESCE(SUM(jasa_pelayanan), 0)
    INTO v_jasa_pelayanan
    FROM data_biaya
    WHERE unit_kerja_id = p_unit_kerja_id
      AND tenant_id = p_tenant_id;
    
    v_total_cost := v_total_cost + v_jasa_pelayanan;
  END IF;
  
  -- Apply tenant-specific rounding
  v_result := apply_tenant_rounding(v_total_cost, p_tenant_id);
  
  RETURN v_result;
END;
$$;

-- Add comment untuk documentation
COMMENT ON FUNCTION get_tenant_preferences(UUID) IS 
'Retrieves tenant-specific calculation preferences including rounding method, decimal places, and jasa pelayanan inclusion';

COMMENT ON FUNCTION apply_tenant_rounding(NUMERIC, UUID) IS 
'Applies tenant-specific rounding rules to a numeric value based on tenant preferences';

COMMENT ON FUNCTION calculate_unit_cost_with_preferences(UUID, UUID) IS 
'Example calculation function that uses tenant preferences. Template for updating other calculation functions';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tenant_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_tenant_rounding(NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_unit_cost_with_preferences(UUID, UUID) TO authenticated;

-- Migration notes:
-- 1. This migration provides helper functions for tenant preferences
-- 2. Existing calculation functions should be updated to use these helpers
-- 3. The calculate_unit_cost_with_preferences function is an example template
-- 4. Each calculation function (laboratorium, radiologi, operatif, etc.) should be updated similarly
-- 5. Key changes needed in each function:
--    - Call get_tenant_preferences() to get settings
--    - Check include_jasa_pelayanan preference before adding JP
--    - Call apply_tenant_rounding() before returning final values
