-- Migration: Batch 1 Remaining - Critical Calculation Functions
-- Task: 6.2 Update calculation functions (Batch 1 continued)
-- Functions 8-10 of Batch 1

-- 8. calculate_inventory_valuation()
-- Purpose: Calculate inventory value using different methods
-- Impact: HIGH - Used in inventory management
CREATE OR REPLACE FUNCTION calculate_inventory_valuation(
    inventory_id INTEGER, 
    valuation_method TEXT DEFAULT 'FIFO'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    inventory_value NUMERIC;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Validate inventory belongs to current tenant
    IF NOT EXISTS (
        SELECT 1 FROM inventory 
        WHERE id = inventory_id AND tenant_id = current_tenant_id
    ) THEN
        RAISE EXCEPTION 'Inventory % not accessible for tenant %', inventory_id, current_tenant_id;
    END IF;
    
    -- Calculate based on method (tenant-filtered)
    CASE valuation_method
        WHEN 'FIFO' THEN
            SELECT COALESCE(SUM(quantity * unit_cost), 0) INTO inventory_value
            FROM inventory_transactions it
            JOIN inventory i ON it.inventory_id = i.id
            WHERE it.inventory_id = inventory_id
            AND i.tenant_id = current_tenant_id
            AND it.transaction_type = 'IN'
            ORDER BY it.transaction_date ASC;
        WHEN 'LIFO' THEN
            SELECT COALESCE(SUM(quantity * unit_cost), 0) INTO inventory_value
            FROM inventory_transactions it
            JOIN inventory i ON it.inventory_id = i.id
            WHERE it.inventory_id = inventory_id
            AND i.tenant_id = current_tenant_id
            AND it.transaction_type = 'IN'
            ORDER BY it.transaction_date DESC;
        ELSE
            -- Average cost method
            SELECT COALESCE(AVG(unit_cost) * SUM(quantity), 0) INTO inventory_value
            FROM inventory_transactions it
            JOIN inventory i ON it.inventory_id = i.id
            WHERE it.inventory_id = inventory_id
            AND i.tenant_id = current_tenant_id
            AND it.transaction_type = 'IN';
    END CASE;
    
    RETURN COALESCE(inventory_value, 0);
END;
$$;

COMMENT ON FUNCTION calculate_inventory_valuation(INTEGER, TEXT) IS 
'Calculate inventory valuation with tenant filtering - Multi-tenant aware';

-- 9. calculate_project_profitability()
-- Purpose: Calculate project profitability metrics
-- Impact: HIGH - Used in project management
CREATE OR REPLACE FUNCTION calculate_project_profitability(project_id INTEGER)
RETURNS TABLE(
    total_revenue NUMERIC,
    total_costs NUMERIC,
    profit_margin NUMERIC,
    roi NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    project_revenue NUMERIC;
    project_costs NUMERIC;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Validate project belongs to current tenant
    IF NOT EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id AND tenant_id = current_tenant_id
    ) THEN
        RAISE EXCEPTION 'Project % not accessible for tenant %', project_id, current_tenant_id;
    END IF;
    
    -- Calculate project revenue (tenant-filtered)
    SELECT COALESCE(SUM(amount), 0) INTO project_revenue
    FROM project_transactions pt
    JOIN projects p ON pt.project_id = p.id
    WHERE pt.project_id = project_id
    AND p.tenant_id = current_tenant_id
    AND pt.transaction_type = 'REVENUE';
    
    -- Calculate project costs (tenant-filtered)
    SELECT COALESCE(SUM(amount), 0) INTO project_costs
    FROM project_transactions pt
    JOIN projects p ON pt.project_id = p.id
    WHERE pt.project_id = project_id
    AND p.tenant_id = current_tenant_id
    AND pt.transaction_type = 'EXPENSE';
    
    -- Return profitability metrics
    RETURN QUERY
    SELECT 
        project_revenue as total_revenue,
        project_costs as total_costs,
        CASE WHEN project_revenue > 0 
            THEN (project_revenue - project_costs) / project_revenue 
            ELSE NULL END as profit_margin,
        CASE WHEN project_costs > 0 
            THEN (project_revenue - project_costs) / project_costs 
            ELSE NULL END as roi;
END;
$$;

COMMENT ON FUNCTION calculate_project_profitability(INTEGER) IS 
'Calculate project profitability with tenant filtering - Multi-tenant aware';

-- 10. calculate_budget_variance()
-- Purpose: Calculate budget variance analysis
-- Impact: HIGH - Used in budget management
CREATE OR REPLACE FUNCTION calculate_budget_variance(
    budget_id INTEGER, 
    actual_amount NUMERIC
)
RETURNS TABLE(
    budgeted_amount NUMERIC,
    actual_amount NUMERIC,
    variance_amount NUMERIC,
    variance_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    budget_amount NUMERIC;
BEGIN
    current_tenant_id := get_tenant_id();
    
    -- Get budget amount (tenant-filtered)
    SELECT amount INTO budget_amount
    FROM budgets 
    WHERE id = budget_id AND tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Budget % not accessible for tenant %', budget_id, current_tenant_id;
    END IF;
    
    -- Return variance analysis
    RETURN QUERY
    SELECT 
        budget_amount as budgeted_amount,
        actual_amount as actual_amount,
        (actual_amount - budget_amount) as variance_amount,
        CASE WHEN budget_amount > 0 
            THEN ((actual_amount - budget_amount) / budget_amount) * 100 
            ELSE NULL END as variance_percentage;
END;
$$;

COMMENT ON FUNCTION calculate_budget_variance(INTEGER, NUMERIC) IS 
'Calculate budget variance with tenant filtering - Multi-tenant aware';
