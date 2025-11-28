-- ============================================================================
-- Multi-Tenant Monitoring Setup
-- ============================================================================
-- Description: Setup monitoring views, functions, dan alerts untuk
--              multi-tenant system
-- Created: 2024-12-27
-- ============================================================================

-- ============================================================================
-- 1. MONITORING VIEWS
-- ============================================================================

-- View: Tenant Statistics
CREATE OR REPLACE VIEW v_tenant_statistics AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.slug,
  t.is_active,
  t.created_at,
  
  -- User statistics
  COUNT(DISTINCT up.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN up.is_active THEN up.user_id END) as active_users,
  
  -- Data statistics
  COUNT(DISTINCT uk.id) as total_unit_kerja,
  COUNT(DISTINCT db.id) as total_data_biaya,
  COUNT(DISTINCT dp.id) as total_data_pendapatan,
  
  -- Activity statistics
  MAX(tal.created_at) as last_activity,
  COUNT(tal.id) FILTER (WHERE tal.created_at > NOW() - INTERVAL '24 hours') as activities_24h,
  COUNT(tal.id) FILTER (WHERE tal.created_at > NOW() - INTERVAL '7 days') as activities_7d,
  
  -- Size estimation (in MB)
  ROUND(
    (COUNT(DISTINCT uk.id) * 1 + 
     COUNT(DISTINCT db.id) * 2 + 
     COUNT(DISTINCT dp.id) * 2) / 1024.0, 
    2
  ) as estimated_size_mb

FROM tenants t
LEFT JOIN user_profiles up ON up.tenant_id = t.id
LEFT JOIN unit_kerja uk ON uk.tenant_id = t.id
LEFT JOIN data_biaya db ON db.tenant_id = t.id
LEFT JOIN data_pendapatan dp ON dp.tenant_id = t.id
LEFT JOIN tenant_audit_log tal ON tal.tenant_id = t.id
GROUP BY t.id, t.name, t.slug, t.is_active, t.created_at;

COMMENT ON VIEW v_tenant_statistics IS 'Comprehensive statistics for each tenant';

-- View: Tenant Health Check
CREATE OR REPLACE VIEW v_tenant_health AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.is_active,
  
  -- Health indicators
  CASE 
    WHEN NOT t.is_active THEN 'inactive'
    WHEN MAX(tal.created_at) < NOW() - INTERVAL '7 days' THEN 'dormant'
    WHEN MAX(tal.created_at) < NOW() - INTERVAL '24 hours' THEN 'low_activity'
    ELSE 'healthy'
  END as health_status,
  
  -- Last activity
  MAX(tal.created_at) as last_activity,
  NOW() - MAX(tal.created_at) as time_since_last_activity,
  
  -- User count
  COUNT(DISTINCT up.user_id) as user_count,
  
  -- Data completeness
  CASE 
    WHEN COUNT(DISTINCT uk.id) = 0 THEN 'no_data'
    WHEN COUNT(DISTINCT uk.id) < 5 THEN 'minimal_data'
    ELSE 'sufficient_data'
  END as data_status

FROM tenants t
LEFT JOIN user_profiles up ON up.tenant_id = t.id
LEFT JOIN unit_kerja uk ON uk.tenant_id = t.id
LEFT JOIN tenant_audit_log tal ON tal.tenant_id = t.id
GROUP BY t.id, t.name, t.is_active;

COMMENT ON VIEW v_tenant_health IS 'Health status for each tenant';

-- View: RLS Policy Status
CREATE OR REPLACE VIEW v_rls_policy_status AS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  COUNT(pol.policyname) as policy_count
FROM pg_tables pt
LEFT JOIN pg_policies pol ON pol.schemaname = pt.schemaname 
  AND pol.tablename = pt.tablename
WHERE pt.schemaname = 'public'
GROUP BY schemaname, tablename, rowsecurity
ORDER BY tablename;

COMMENT ON VIEW v_rls_policy_status IS 'RLS status for all tables';

-- View: Slow Queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
  query,
  calls,
  ROUND(total_exec_time::numeric, 2) as total_time_ms,
  ROUND(mean_exec_time::numeric, 2) as mean_time_ms,
  ROUND(max_exec_time::numeric, 2) as max_time_ms,
  ROUND(stddev_exec_time::numeric, 2) as stddev_time_ms
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 50;

COMMENT ON VIEW v_slow_queries IS 'Queries with mean execution time > 100ms';

-- View: Tenant Audit Summary
CREATE OR REPLACE VIEW v_tenant_audit_summary AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  tal.action,
  tal.table_name,
  COUNT(*) as action_count,
  MAX(tal.created_at) as last_occurrence,
  COUNT(DISTINCT tal.user_id) as unique_users
FROM tenants t
LEFT JOIN tenant_audit_log tal ON tal.tenant_id = t.id
WHERE tal.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.id, t.name, tal.action, tal.table_name
ORDER BY t.name, action_count DESC;

COMMENT ON VIEW v_tenant_audit_summary IS 'Audit log summary per tenant (last 30 days)';

-- ============================================================================
-- 2. MONITORING FUNCTIONS
-- ============================================================================

-- Function: Check Tenant Isolation
CREATE OR REPLACE FUNCTION check_tenant_isolation()
RETURNS TABLE (
  table_name TEXT,
  total_rows BIGINT,
  rows_with_tenant BIGINT,
  rows_without_tenant BIGINT,
  isolation_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    t.total_rows,
    t.rows_with_tenant,
    t.total_rows - t.rows_with_tenant as rows_without_tenant,
    ROUND((t.rows_with_tenant::NUMERIC / NULLIF(t.total_rows, 0) * 100), 2) as isolation_percentage
  FROM (
    SELECT 
      c.table_name,
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = c.table_name) as total_rows,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = c.table_name AND column_name = 'tenant_id') as rows_with_tenant
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
    GROUP BY c.table_name
  ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_tenant_isolation() IS 'Check tenant_id coverage across tables';

-- Function: Get Tenant Performance Metrics
CREATE OR REPLACE FUNCTION get_tenant_performance_metrics(p_tenant_id UUID)
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_users'::TEXT, COUNT(DISTINCT user_id)::NUMERIC, 'count'::TEXT
  FROM user_profiles WHERE tenant_id = p_tenant_id
  
  UNION ALL
  
  SELECT 'total_data_points'::TEXT, 
    (SELECT COUNT(*) FROM unit_kerja WHERE tenant_id = p_tenant_id)::NUMERIC +
    (SELECT COUNT(*) FROM data_biaya WHERE tenant_id = p_tenant_id)::NUMERIC +
    (SELECT COUNT(*) FROM data_pendapatan WHERE tenant_id = p_tenant_id)::NUMERIC,
    'count'::TEXT
  
  UNION ALL
  
  SELECT 'activities_last_24h'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT
  FROM tenant_audit_log
  WHERE tenant_id = p_tenant_id
    AND created_at > NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 'avg_response_time'::TEXT,
    COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) * 1000), 0)::NUMERIC,
    'ms'::TEXT
  FROM tenant_audit_log
  WHERE tenant_id = p_tenant_id
    AND created_at > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tenant_performance_metrics(UUID) IS 'Get performance metrics for specific tenant';

-- Function: Detect Cross-Tenant Access Attempts
CREATE OR REPLACE FUNCTION detect_cross_tenant_access()
RETURNS TABLE (
  detected_at TIMESTAMPTZ,
  user_id UUID,
  attempted_tenant_id UUID,
  actual_tenant_id UUID,
  table_name TEXT,
  action TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tal.created_at as detected_at,
    tal.user_id,
    (tal.new_data->>'attempted_tenant_id')::UUID as attempted_tenant_id,
    tal.tenant_id as actual_tenant_id,
    tal.table_name,
    tal.action
  FROM tenant_audit_log tal
  WHERE tal.action LIKE '%cross_tenant%'
    OR tal.action LIKE '%unauthorized%'
  ORDER BY tal.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_cross_tenant_access() IS 'Detect potential cross-tenant access attempts';

-- Function: Generate Health Report
CREATE OR REPLACE FUNCTION generate_health_report()
RETURNS TABLE (
  category TEXT,
  status TEXT,
  details JSONB
) AS $$
BEGIN
  -- RLS Status
  RETURN QUERY
  SELECT 
    'rls_policies'::TEXT,
    CASE 
      WHEN COUNT(*) FILTER (WHERE NOT rowsecurity) > 0 THEN 'warning'
      ELSE 'healthy'
    END::TEXT,
    jsonb_build_object(
      'total_tables', COUNT(*),
      'rls_enabled', COUNT(*) FILTER (WHERE rowsecurity),
      'rls_disabled', COUNT(*) FILTER (WHERE NOT rowsecurity)
    )
  FROM pg_tables
  WHERE schemaname = 'public';
  
  -- Tenant Health
  RETURN QUERY
  SELECT 
    'tenant_health'::TEXT,
    CASE 
      WHEN COUNT(*) FILTER (WHERE NOT is_active) > COUNT(*) * 0.2 THEN 'warning'
      ELSE 'healthy'
    END::TEXT,
    jsonb_build_object(
      'total_tenants', COUNT(*),
      'active_tenants', COUNT(*) FILTER (WHERE is_active),
      'inactive_tenants', COUNT(*) FILTER (WHERE NOT is_active)
    )
  FROM tenants;
  
  -- Performance
  RETURN QUERY
  SELECT 
    'performance'::TEXT,
    CASE 
      WHEN AVG(mean_exec_time) > 500 THEN 'critical'
      WHEN AVG(mean_exec_time) > 200 THEN 'warning'
      ELSE 'healthy'
    END::TEXT,
    jsonb_build_object(
      'avg_query_time_ms', ROUND(AVG(mean_exec_time)::numeric, 2),
      'slow_queries', COUNT(*) FILTER (WHERE mean_exec_time > 100)
    )
  FROM pg_stat_statements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_health_report() IS 'Generate comprehensive health report';

-- ============================================================================
-- 3. ALERT FUNCTIONS
-- ============================================================================

-- Function: Check for Alerts
CREATE OR REPLACE FUNCTION check_system_alerts()
RETURNS TABLE (
  alert_level TEXT,
  alert_type TEXT,
  alert_message TEXT,
  alert_data JSONB
) AS $$
BEGIN
  -- Check for disabled RLS
  RETURN QUERY
  SELECT 
    'critical'::TEXT,
    'rls_disabled'::TEXT,
    format('RLS disabled on %s tables', COUNT(*))::TEXT,
    jsonb_agg(tablename)
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = false
  HAVING COUNT(*) > 0;
  
  -- Check for cross-tenant access
  RETURN QUERY
  SELECT 
    'critical'::TEXT,
    'cross_tenant_access'::TEXT,
    format('%s cross-tenant access attempts detected', COUNT(*))::TEXT,
    jsonb_build_object('count', COUNT(*), 'last_attempt', MAX(created_at))
  FROM tenant_audit_log
  WHERE action LIKE '%cross_tenant%'
    AND created_at > NOW() - INTERVAL '1 hour'
  HAVING COUNT(*) > 0;
  
  -- Check for slow queries
  RETURN QUERY
  SELECT 
    'warning'::TEXT,
    'slow_queries'::TEXT,
    format('%s queries with mean time > 1000ms', COUNT(*))::TEXT,
    jsonb_build_object('count', COUNT(*), 'slowest_ms', MAX(mean_exec_time))
  FROM pg_stat_statements
  WHERE mean_exec_time > 1000
  HAVING COUNT(*) > 0;
  
  -- Check for inactive tenants
  RETURN QUERY
  SELECT 
    'info'::TEXT,
    'inactive_tenants'::TEXT,
    format('%s tenants inactive', COUNT(*))::TEXT,
    jsonb_agg(name)
  FROM tenants
  WHERE NOT is_active
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_system_alerts() IS 'Check for system alerts and issues';

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to monitoring views
GRANT SELECT ON v_tenant_statistics TO authenticated;
GRANT SELECT ON v_tenant_health TO authenticated;
GRANT SELECT ON v_rls_policy_status TO authenticated;
GRANT SELECT ON v_tenant_audit_summary TO authenticated;

-- Grant execute on monitoring functions
GRANT EXECUTE ON FUNCTION check_tenant_isolation() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_performance_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_health_report() TO authenticated;

-- Super admin only
GRANT SELECT ON v_slow_queries TO authenticated;
GRANT EXECUTE ON FUNCTION detect_cross_tenant_access() TO authenticated;
GRANT EXECUTE ON FUNCTION check_system_alerts() TO authenticated;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Test monitoring views
SELECT 'Tenant Statistics' as test, COUNT(*) as count FROM v_tenant_statistics;
SELECT 'Tenant Health' as test, COUNT(*) as count FROM v_tenant_health;
SELECT 'RLS Policy Status' as test, COUNT(*) as count FROM v_rls_policy_status;

-- Test monitoring functions
SELECT 'Tenant Isolation Check' as test, * FROM check_tenant_isolation() LIMIT 5;
SELECT 'Health Report' as test, * FROM generate_health_report();
SELECT 'System Alerts' as test, * FROM check_system_alerts();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Multi-Tenant Monitoring Setup Complete' as status,
       NOW() as completed_at;
