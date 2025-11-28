-- Migration: Batch 1 - Critical Calculation Functions
-- Task: 6.2 Update calculation functions (Batch 1 of 3)
-- Requirements: 9.3 - Calculation functions must be tenant-scoped
-- Status: 10 most critical functions

-- ============================================================================
-- HELPER FUNCTIONS (Already created, included for reference)
-- ============================================================================

-- Function: get_tenant_id()
-- Status: ✅ Already created
-- Purpose: Get current tenant context from session

-- Function: set_tenant_context(UUID)
-- Status: ✅ Already created
-- Purpose: Set tenant context for session

-- ============================================================================
-- BATCH 1: CRITICAL CALCULATION FUNCTIONS
-- ============================================================================

-- 3. calculate_balance_sheet_totals()
-- Purpose: Calculate balance sheet totals for financial reporting
-- Impact: HIGH - Used in financial statements
CREATE OR REPLACE FUNCTION calculate_balance_sheet_totals()
RETURNS TABLE(
    total_assets NUMERIC,
    total_liabilities NUMERIC,
    total_equity NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := get_tenant_id();
    
    RETURN QUERY
    SELECT 
        COALESCE((
            SELECT SUM(balance) 
            FROM accounts 
            WHERE tenant_id = current_tenant_id 
            AND account_type IN ('ASSET', 'CURRENT_ASSET', 'FIXED_ASSET')
        ), 0) as total_assets,
        COALESCE((
            SELECT SUM(balance) 
            FROM accounts 
            WHERE tenant_id = current_tenant_id 
            AND account_type IN ('LIABILITY', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY')
        ), 0) as total_liabilities,
        COALESCE((
            SELECT SUM(balance) 
            FROM accounts 
            WHERE tenant_id = current_tenant_id 
            AND account_type = 'EQUITY'
        ), 0) as total_equity;
END;
$$;

COMMENT ON FUNCTION calculate_balance_sheet_totals() IS 
'Calculate balance sheet totals with tenant filtering - Multi-tenant aware';

-- 4. calculate_income_statement_totals()
-- Purpose: Calculate income statement totals
-- Impact: HIGH - Used in financial statements
CREATE OR REPLACE FUNCTION calculate_income_statement_totals()
RETURNS TABLE(
    total_revenue NUMERIC,
    total_expenses NUMERIC,
    net_income NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := get_tenant_id();
    
    RETURN QUERY
    SELECT 
        COALESCE((
            SELECT SUM(balance) 
            FROM accounts 
            WHERE tenant_id = current_tenant_id 
            AND account_type = 'REVENUE'
        ), 0) as total_revenue,
        COALESCE((
            SELECT SUM(balance) 
            FROM accounts 
            WHERE tenant_id = current_tenant_id 
            AND account_type = 'EXPENSE'
        ), 0) as total_expenses,
        COALESCE((
            SELECT SUM(CASE WHEN account_type = 'REVENUE' THEN balance ELSE -balance END)
            FROM accounts 
            WHERE tenant_id = current_tenant_id 
            AND account_type IN ('REVENUE', 'EXPENSE')
        ), 0) as net_income;
END;
$$;

COMMENT ON FUNCTION calculate_income_statement_totals() IS 
'Calculate income statement totals with tenant filtering - Multi-tenant aware';

-- 5. calculate_financial_ratios()
-- Purpose: Calculate key financial ratios
-- Impact: HIGH - Used in financial analysis
CREATE OR REPLACE FUNCTION calculate_financial_ratios()
RETURNS TABLE(
    current_ratio NUMERIC,
    debt_to_equity_ratio NUMERIC,
    return_on_assets NUMERIC,
    gross_profit_margin NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    current_assets NUMERIC;
    current_liabilities NUMERIC;
    total_debt NUMERIC;
    total_equity NUMERIC;
    total_assets NUMERIC;
    net_income NUMERIC;
    total_revenue NUMERIC;
    cost_of_goods_sold NUMERIC;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Get financial data for current tenant only
    SELECT COALESCE(SUM(balance), 0) INTO current_assets
    FROM accounts WHERE tenant_id = current_tenant_id AND account_type = 'CURRENT_ASSET';
    
    SELECT COALESCE(SUM(balance), 0) INTO current_liabilities
    FROM accounts WHERE tenant_id = current_tenant_id AND account_type = 'CURRENT_LIABILITY';
    
    SELECT COALESCE(SUM(balance), 0) INTO total_debt
    FROM accounts WHERE tenant_id = current_tenant_id 
    AND account_type IN ('LIABILITY', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY');
    
    SELECT COALESCE(SUM(balance), 0) INTO total_equity
    FROM accounts WHERE tenant_id = current_tenant_id AND account_type = 'EQUITY';
    
    SELECT COALESCE(SUM(balance), 0) INTO total_assets
    FROM accounts WHERE tenant_id = current_tenant_id 
    AND account_type IN ('ASSET', 'CURRENT_ASSET', 'FIXED_ASSET');
    
    SELECT COALESCE(SUM(balance), 0) INTO net_income
    FROM accounts WHERE tenant_id = current_tenant_id AND account_type = 'REVENUE';
    
    SELECT COALESCE(SUM(balance), 0) INTO total_revenue
    FROM accounts WHERE tenant_id = current_tenant_id AND account_type = 'REVENUE';
    
    SELECT COALESCE(SUM(balance), 0) INTO cost_of_goods_sold
    FROM accounts WHERE tenant_id = current_tenant_id 
    AND account_name ILIKE '%cost of goods sold%';
    
    RETURN QUERY
    SELECT 
        CASE WHEN current_liabilities > 0 THEN current_assets / current_liabilities ELSE NULL END,
        CASE WHEN total_equity > 0 THEN total_debt / total_equity ELSE NULL END,
        CASE WHEN total_assets > 0 THEN net_income / total_assets ELSE NULL END,
        CASE WHEN total_revenue > 0 THEN (total_revenue - cost_of_goods_sold) / total_revenue ELSE NULL END;
END;
$$;

COMMENT ON FUNCTION calculate_financial_ratios() IS 
'Calculate financial ratios with tenant filtering - Multi-tenant aware';

-- 6. calculate_asset_book_value()
-- Purpose: Calculate asset book value
-- Impact: HIGH - Used in asset management
CREATE OR REPLACE FUNCTION calculate_asset_book_value(
    asset_id INTEGER, 
    calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    book_value NUMERIC;
    asset_cost NUMERIC;
    accumulated_depreciation NUMERIC;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Validate asset belongs to current tenant
    IF NOT EXISTS (
        SELECT 1 FROM assets 
        WHERE id = asset_id AND tenant_id = current_tenant_id
    ) THEN
        RAISE EXCEPTION 'Asset % not accessible for tenant %', asset_id, current_tenant_id;
    END IF;
    
    -- Get asset cost (tenant-filtered)
    SELECT cost INTO asset_cost
    FROM assets 
    WHERE id = asset_id AND tenant_id = current_tenant_id;
    
    -- Calculate accumulated depreciation (tenant-filtered)
    SELECT COALESCE(SUM(amount), 0) INTO accumulated_depreciation
    FROM depreciation_entries de
    JOIN assets a ON de.asset_id = a.id
    WHERE de.asset_id = asset_id
    AND a.tenant_id = current_tenant_id
    AND de.depreciation_date <= calculation_date;
    
    book_value := asset_cost - accumulated_depreciation;
    RETURN GREATEST(book_value, 0);
END;
$$;

COMMENT ON FUNCTION calculate_asset_book_value(INTEGER, DATE) IS 
'Calculate asset book value with tenant filtering - Multi-tenant aware';

-- 7. calculate_annual_depreciation()
-- Purpose: Calculate annual depreciation for an asset
-- Impact: HIGH - Used in asset management
CREATE OR REPLACE FUNCTION calculate_annual_depreciation(asset_id INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    asset_cost NUMERIC;
    salvage_value NUMERIC;
    useful_life INTEGER;
    annual_depreciation NUMERIC;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Get asset details (tenant-filtered)
    SELECT cost, salvage_value, useful_life_years
    INTO asset_cost, salvage_value, useful_life
    FROM assets 
    WHERE id = asset_id AND tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Asset % not accessible for tenant %', asset_id, current_tenant_id;
    END IF;
    
    -- Calculate straight-line depreciation
    IF useful_life > 0 THEN
        annual_depreciation := (asset_cost - COALESCE(salvage_value, 0)) / useful_life;
    ELSE
        annual_depreciation := 0;
    END IF;
    
    RETURN GREATEST(annual_depreciation, 0);
END;
$$;

COMMENT ON FUNCTION calculate_annual_depreciation(INTEGER) IS 
'Calculate annual depreciation with tenant filtering - Multi-tenant aware';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify functions created successfully
SELECT 
    proname as function_name,
    'Created' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN (
    'calculate_balance_sheet_totals',
    'calculate_income_statement_totals',
    'calculate_financial_ratios',
    'calculate_asset_book_value',
    'calculate_annual_depreciation'
)
ORDER BY proname;
