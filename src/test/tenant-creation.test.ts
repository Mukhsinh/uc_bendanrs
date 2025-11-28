import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestClient, createTestTenant } from '@/test/helpers/database';

describe('Property 1: Tenant Creation Completeness', () => {
  // Test that tenant creation generates a record with all required fields
  it('should create tenant with all required fields populated', async () => {
    const client = createTestClient();
    
    // Generate random tenant data
    const tenantData = {
      name: `Test Hospital ${Math.floor(Math.random() * 10000)}`,
      slug: `test-hospital-${Date.now()}`,
      metadata: {
        created_via: 'property_test',
        test_timestamp: new Date().toISOString()
      }
    };

    // Create tenant
    const { data: tenant, error } = await client
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    // Verify no error occurred
    expect(error).toBeNull();
    
    // Verify tenant was created
    expect(tenant).toBeDefined();
    
    // Verify all required fields are populated
    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBe(tenantData.name);
    expect(tenant.slug).toBe(tenantData.slug);
    expect(tenant.metadata).toEqual(tenantData.metadata);
    expect(tenant.is_active).toBe(true);
    expect(tenant.created_at).toBeDefined();
    expect(tenant.updated_at).toBeDefined();
    
    // Cleanup: Delete the test tenant
    await client
      .from('tenants')
      .delete()
      .eq('id', tenant.id);
  });

  it('should automatically create tenant_settings when tenant is created', async () => {
    const client = createTestClient();
    
    // Generate random tenant data
    const tenantData = {
      name: `Test Hospital Settings ${Math.floor(Math.random() * 10000)}`,
      slug: `test-hospital-settings-${Date.now()}`,
    };

    // Create tenant
    const { data: tenant, error: tenantError } = await client
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    expect(tenantError).toBeNull();
    expect(tenant).toBeDefined();

    // Check that tenant_settings was automatically created
    const { data: settings, error: settingsError } = await client
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single();

    expect(settingsError).toBeNull();
    expect(settings).toBeDefined();
    expect(settings.tenant_id).toBe(tenant.id);
    expect(settings.include_jasa_pelayanan).toBe(true);
    expect(settings.default_allocation_method).toBe('double_distribution');
    expect(settings.primary_color).toBe('#6366f1');
    expect(settings.secondary_color).toBe('#8b5cf6');
    
    // Cleanup: Delete the test tenant (cascades to settings)
    await client
      .from('tenants')
      .delete()
      .eq('id', tenant.id);
  });

  it('should enforce tenant slug format constraint', async () => {
    const client = createTestClient();
    
    // Try to create tenant with invalid slug
    const invalidTenantData = {
      name: 'Invalid Slug Test',
      slug: 'Invalid Slug With Spaces',
    };

    const { data, error } = await client
      .from('tenants')
      .insert(invalidTenantData)
      .select();

    // Should get an error due to slug format constraint
    expect(error).toBeDefined();
    expect(error?.message).toContain('violates check constraint "tenants_slug_format"');
    
    // Verify no tenant was created
    expect(data).toBeNull();
  });
});