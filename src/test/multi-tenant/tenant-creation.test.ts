/**
 * Property-Based Tests untuk Multi-Tenant System
 * Feature: multi-tenant-system
 * 
 * Test ini menggunakan fast-check untuk property-based testing
 * dengan minimum 100 iterations per property.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createTestClient, cleanupTestTenants } from '../helpers/database';

describe('Multi-Tenant System - Tenant Creation', () => {
  const testTenantIds: string[] = [];

  afterEach(async () => {
    // Cleanup test tenants setelah setiap test
    await cleanupTestTenants(testTenantIds);
    testTenantIds.length = 0;
  });

  /**
   * Feature: multi-tenant-system, Property 1: Tenant Creation Completeness
   * Validates: Requirements 1.1
   * 
   * Property: For any valid tenant creation request, the system should create 
   * a tenant record with a unique tenant_id, name, and all required metadata 
   * fields populated
   */
  it('Property 1: Tenant Creation Completeness - should create tenant with all required fields', async () => {
    const client = createTestClient();

    await fc.assert(
      fc.asyncProperty(
        // Generator untuk tenant data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          slug: fc.string({ minLength: 1, maxLength: 50 })
            .map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-'))
            .filter(s => s.length > 0 && /^[a-z0-9-]+$/.test(s)),
          logo_url: fc.option(fc.webUrl(), { nil: null }),
          metadata: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.oneof(fc.string(), fc.integer(), fc.boolean())
          ),
          is_active: fc.boolean(),
        }),
        async (tenantData) => {
          // Buat tenant dengan data random
          const { data: tenant, error } = await client
            .from('tenants')
            .insert({
              name: tenantData.name,
              slug: `test-${tenantData.slug}-${Date.now()}`, // Ensure unique slug
              logo_url: tenantData.logo_url,
              metadata: tenantData.metadata,
              is_active: tenantData.is_active,
            })
            .select()
            .single();

          // Jika berhasil, simpan ID untuk cleanup
          if (tenant) {
            testTenantIds.push(tenant.id);
          }

          // Assertions - Property: Tenant harus memiliki semua field required
          expect(error).toBeNull();
          expect(tenant).toBeDefined();
          expect(tenant.id).toBeDefined();
          expect(typeof tenant.id).toBe('string');
          expect(tenant.id.length).toBeGreaterThan(0);
          
          // Verify all required fields are populated
          expect(tenant.name).toBe(tenantData.name);
          expect(tenant.slug).toContain(tenantData.slug);
          expect(tenant.is_active).toBe(tenantData.is_active);
          expect(tenant.created_at).toBeDefined();
          expect(tenant.updated_at).toBeDefined();
          
          // Verify metadata is stored correctly
          if (tenantData.metadata && Object.keys(tenantData.metadata).length > 0) {
            expect(tenant.metadata).toBeDefined();
            expect(typeof tenant.metadata).toBe('object');
          }

          // Verify logo_url is stored correctly
          if (tenantData.logo_url) {
            expect(tenant.logo_url).toBe(tenantData.logo_url);
          }

          // Verify tenant can be retrieved
          const { data: retrievedTenant, error: retrieveError } = await client
            .from('tenants')
            .select('*')
            .eq('id', tenant.id)
            .single();

          expect(retrieveError).toBeNull();
          expect(retrievedTenant).toBeDefined();
          expect(retrievedTenant.id).toBe(tenant.id);
          expect(retrievedTenant.name).toBe(tenant.name);
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations sesuai design document
        verbose: true,
      }
    );
  });

  /**
   * Test tambahan: Verify tenant slug uniqueness constraint
   */
  it('should enforce unique slug constraint', async () => {
    const client = createTestClient();
    const slug = `test-unique-${Date.now()}`;

    // Create first tenant
    const { data: tenant1, error: error1 } = await client
      .from('tenants')
      .insert({
        name: 'Test Tenant 1',
        slug: slug,
      })
      .select()
      .single();

    expect(error1).toBeNull();
    expect(tenant1).toBeDefined();
    if (tenant1) testTenantIds.push(tenant1.id);

    // Try to create second tenant with same slug
    const { data: tenant2, error: error2 } = await client
      .from('tenants')
      .insert({
        name: 'Test Tenant 2',
        slug: slug,
      })
      .select()
      .single();

    // Should fail due to unique constraint
    expect(error2).toBeDefined();
    expect(tenant2).toBeNull();
  });

  /**
   * Test tambahan: Verify tenant name validation
   */
  it('should reject empty tenant names', async () => {
    const client = createTestClient();

    const { data: tenant, error } = await client
      .from('tenants')
      .insert({
        name: '   ', // Empty/whitespace name
        slug: `test-empty-${Date.now()}`,
      })
      .select()
      .single();

    // Should fail due to name validation constraint
    expect(error).toBeDefined();
    expect(tenant).toBeNull();
  });

  /**
   * Test tambahan: Verify slug format validation
   */
  it('should reject invalid slug formats', async () => {
    const client = createTestClient();

    const invalidSlugs = [
      'Test With Spaces',
      'test_with_underscore',
      'TEST-UPPERCASE',
      'test@special',
      '',
    ];

    for (const invalidSlug of invalidSlugs) {
      const { data: tenant, error } = await client
        .from('tenants')
        .insert({
          name: 'Test Tenant',
          slug: invalidSlug,
        })
        .select()
        .single();

      // Should fail due to slug format constraint
      expect(error).toBeDefined();
      expect(tenant).toBeNull();
    }
  });
});
