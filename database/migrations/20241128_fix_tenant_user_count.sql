-- Migration: Fix Tenant User Count Query
-- Date: 2024-11-28
-- Description: Membuat RPC function untuk mendapatkan tenant dengan jumlah user yang benar

-- Drop function jika sudah ada
DROP FUNCTION IF EXISTS get_tenants_with_user_count();

-- Buat function untuk mendapatkan tenant dengan user count
CREATE OR REPLACE FUNCTION get_tenants_with_user_count(
  p_search TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.logo_url,
    t.is_active,
    t.created_at,
    t.updated_at,
    COUNT(DISTINCT up.id) as user_count
  FROM tenants t
  LEFT JOIN user_profiles up ON up.tenant_id = t.id
  WHERE 
    -- Filter berdasarkan search query
    (p_search IS NULL OR p_search = '' OR 
     t.name ILIKE '%' || p_search || '%' OR 
     t.slug ILIKE '%' || p_search || '%')
    -- Filter berdasarkan status
    AND (p_status_filter = 'all' OR 
         (p_status_filter = 'active' AND t.is_active = true) OR
         (p_status_filter = 'inactive' AND t.is_active = false))
  GROUP BY t.id, t.name, t.slug, t.logo_url, t.is_active, t.created_at, t.updated_at
  ORDER BY t.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_tenants_with_user_count(TEXT, TEXT) TO authenticated;

-- Tambahkan comment
COMMENT ON FUNCTION get_tenants_with_user_count IS 
'Mendapatkan daftar tenant dengan jumlah user yang benar. Support search dan filter status.';

-- Test function
SELECT * FROM get_tenants_with_user_count(NULL, 'all');
