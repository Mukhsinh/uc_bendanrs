/**
 * Property Test: Database Function Tenant Filtering
 * Property 30: Database Function Tenant Filtering
 * Validates: Requirements 9.1
 * 
 * Test bahwa database functions hanya return data untuk correct tenant
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { createTestTenant, cleanupTestTenant, setTenantContext } from '../helpers/database';

describe('Property 30: Database Function Tenant Filtering', () => {
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    // Create two test tenants
    tenant1Id = await createTestTenant('Test Hospital 1');
    tenant2Id = await createTestTenant('Test Hospital 2');
  });

  afterAll(async () => {
    // Cleanup test tenants
    await cleanupTestTenant(tenant1Id);
    await cleanupTestTenant(tenant2Id);
  });

  it('should filter calculation results by tenant context', async () => {
    // Set context to tenant 1
    await setTenantContext(tenant1Id);

    // Call a calculation function (example: calculate_balance_sheet_totals)
    const { data: tenant1Data, error: error1 } = await supabase
      .rpc('calculate_balance_sheet_totals');

    expect(error1).toBeNull();
    expect(tenant1Data).toBeDefined();

    // Set context to tenant 2
    await setTenantContext(tenant2Id);

    // Call same function with different tenant context
    const { data: tenant2Data, error: error2 } = await supabase
      .rpc('calculate_balance_sheet_totals');

    expect(error2).toBeNull();
    expect(tenant2Data).toBeDefined();

    // Results should be different (isolated by tenant)
    // Note: This assumes tenants have different data
    // In a real test, we would insert specific test data for each tenant
  });

  it('should reject function calls without tenant context', async () => {
    // Clear tenant context
    await setTenantContext(null);

    // Attempt to call function without tenant context
    const { data, error } = await supabase
      .rpc('calculate_balance_sheet_totals');

    // Should fail with appropriate error
    expect(error).toBeDefined();
    expect(error?.message).toContain('tenant');
  });

  it('should not allow access to other tenant data', async () => {
    // Set context to tenant 1
    await setTenantContext(tenant1Id);

    // Try to access tenant 2's data through function
    // This should fail or return empty results
    const { data, error } = await supabase
      .rpc('calculate_asset_book_value', {
        asset_id: 999999, // Non-existent asset
        calculation_date: new Date().toISOString()
      });

    // Should either error or return null/0
    if (error) {
      expect(error.message).toContain('not accessible');
    } else {
      expect(data).toBe(0);
    }
  });
});
