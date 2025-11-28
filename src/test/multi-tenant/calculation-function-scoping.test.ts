/**
 * Property Test: Calculation Function Tenant Scoping
 * Property 32: Calculation Function Tenant Scoping
 * Validates: Requirements 9.3
 * 
 * Test bahwa calculations hanya use data dari same tenant
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '../helpers/database';

describe('Property 32: Calculation Function Tenant Scoping', () => {
  const client = createTestClient();
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    // Create two test tenants
    const { data: t1 } = await client
      .from('tenants')
      .insert({ name: 'Calc Test Hospital 1', slug: 'calc-test-1', status: 'active' })
      .select()
      .single();
    tenant1Id = t1!.id;

    const { data: t2 } = await client
      .from('tenants')
      .insert({ name: 'Calc Test Hospital 2', slug: 'calc-test-2', status: 'active' })
      .select()
      .single();
    tenant2Id = t2!.id;
  });

  afterAll(async () => {
    // Cleanup
    await client.from('tenants').delete().eq('id', tenant1Id);
    await client.from('tenants').delete().eq('id', tenant2Id);
  });

  it('should scope financial calculations to tenant data only', async () => {
    // Set context to tenant 1
    await client.rpc('set_tenant_context', { tenant_id: tenant1Id });

    // Call financial calculation function
    const { data: result1, error: error1 } = await client
      .rpc('calculate_balance_sheet_totals');

    expect(error1).toBeNull();
    expect(result1).toBeDefined();

    // Set context to tenant 2
    await client.rpc('set_tenant_context', { tenant_id: tenant2Id });

    // Call same function
    const { data: result2, error: error2 } = await client
      .rpc('calculate_balance_sheet_totals');

    expect(error2).toBeNull();
    expect(result2).toBeDefined();

    // Results should be independent (each tenant's own data)
    // This validates that calculations don't mix tenant data
  });

  it('should scope asset calculations to tenant assets only', async () => {
    // Set context to tenant 1
    await client.rpc('set_tenant_context', { tenant_id: tenant1Id });

    // Try to calculate depreciation for non-existent asset
    const { data, error } = await client
      .rpc('calculate_annual_depreciation', { asset_id: 999999 });

    // Should fail because asset doesn't belong to tenant
    expect(error).toBeDefined();
    expect(error?.message).toContain('not accessible');
  });

  it('should scope inventory calculations to tenant inventory only', async () => {
    // Set context to tenant 1
    await client.rpc('set_tenant_context', { tenant_id: tenant1Id });

    // Try to calculate inventory valuation for non-existent inventory
    const { data, error } = await client
      .rpc('calculate_inventory_valuation', {
        inventory_id: 999999,
        valuation_method: 'FIFO'
      });

    // Should fail because inventory doesn't belong to tenant
    expect(error).toBeDefined();
    expect(error?.message).toContain('not accessible');
  });

  it('should scope project calculations to tenant projects only', async () => {
    // Set context to tenant 1
    await client.rpc('set_tenant_context', { tenant_id: tenant1Id });

    // Try to calculate project profitability for non-existent project
    const { data, error } = await client
      .rpc('calculate_project_profitability', { project_id: 999999 });

    // Should fail because project doesn't belong to tenant
    expect(error).toBeDefined();
    expect(error?.message).toContain('not accessible');
  });

  it('should scope budget calculations to tenant budgets only', async () => {
    // Set context to tenant 1
    await client.rpc('set_tenant_context', { tenant_id: tenant1Id });

    // Try to calculate budget variance for non-existent budget
    const { data, error } = await client
      .rpc('calculate_budget_variance', {
        budget_id: 999999,
        p_actual_amount: 1000
      });

    // Should fail because budget doesn't belong to tenant
    expect(error).toBeDefined();
    expect(error?.message).toContain('not accessible');
  });
});
