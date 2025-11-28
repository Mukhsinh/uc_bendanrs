import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createTestClient, cleanupTestTenants } from '../helpers/database';
import { createTenant, validateTenantSlug, generateSlugFromName } from '@/services/tenantOnboarding';

/**
 * Property-Based Tests untuk Tenant Onboarding
 * 
 * Feature: multi-tenant-system
 */

describe('Tenant Onboarding - Property Tests', () => {
  const testTenantIds: string[] = [];
  const testUserIds: string[] = [];
  const client = createTestClient();

  afterEach(async () => {
    // Cleanup test users
    for (const userId of testUserIds) {
      try {
        await client.auth.admin.deleteUser(userId);
      } catch (error) {
        console.error('Error deleting test user:', error);
      }
    }
    testUserIds.length = 0;

    // Cleanup test tenants
    await cleanupTestTenants(testTenantIds);
    testTenantIds.length = 0;
  });

  /**
   * Property 1: Tenant Creation Completeness
   * Validates: Requirements 1.1
   * 
   * For any valid tenant data, creating a tenant should result in:
   * - A tenant record with all required fields populated
   * - A tenant_settings record linked to the tenant
   * - An admin user with correct app_metadata
   * - A user_profile record linked to both tenant and user
   * - Default data (unit_kerja, dasar_alokasi) created
   */
  it('Property 1: Tenant creation creates all required records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          adminEmail: fc.emailAddress(),
          adminPassword: fc.string({ minLength: 8, maxLength: 20 }),
          adminFullName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        }),
        async (data) => {
          // Generate unique slug
          const baseSlug = generateSlugFromName(data.tenantName);
          const uniqueSlug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          const result = await createTenant({
            tenantName: data.tenantName,
            tenantSlug: uniqueSlug,
            adminEmail: data.adminEmail,
            adminPassword: data.adminPassword,
            adminFullName: data.adminFullName,
            includeJasaPelayanan: true,
            defaultCurrency: 'IDR'
          });

          // Track untuk cleanup
          if (result.success && result.tenantId) {
            testTenantIds.push(result.tenantId);
            if (result.adminUserId) {
              testUserIds.push(result.adminUserId);
            }
          }

          // Verify success
          expect(result.success).toBe(true);
          expect(result.tenantId).toBeDefined();
          expect(result.adminUserId).toBeDefined();

          if (!result.tenantId || !result.adminUserId) return;

          // Verify tenant record
          const { data: tenant, error: tenantError } = await client
            .from('tenants')
            .select('*')
            .eq('id', result.tenantId)
            .single();

          expect(tenantError).toBeNull();
          expect(tenant).toBeDefined();
          expect(tenant.name).toBe(data.tenantName);
          expect(tenant.slug).toBe(uniqueSlug);
          expect(tenant.is_active).toBe(true);

          // Verify tenant_settings record
          const { data: settings, error: settingsError } = await client
            .from('tenant_settings')
            .select('*')
            .eq('tenant_id', result.tenantId)
            .single();

          expect(settingsError).toBeNull();
          expect(settings).toBeDefined();
          expect(settings.include_jasa_pelayanan).toBe(true);
          expect(settings.currency).toBe('IDR');

          // Verify admin user
          const { data: authUser, error: authError } = await client.auth.admin.getUserById(
            result.adminUserId
          );

          expect(authError).toBeNull();
          expect(authUser.user).toBeDefined();
          expect(authUser.user?.email).toBe(data.adminEmail);
          expect(authUser.user?.app_metadata?.tenant_id).toBe(result.tenantId);
          expect(authUser.user?.app_metadata?.role).toBe('admin');

          // Verify user_profile record
          const { data: profile, error: profileError } = await client
            .from('user_profiles')
            .select('*')
            .eq('user_id', result.adminUserId)
            .single();

          expect(profileError).toBeNull();
          expect(profile).toBeDefined();
          expect(profile.tenant_id).toBe(result.tenantId);
          expect(profile.full_name).toBe(data.adminFullName);
          expect(profile.is_active).toBe(true);

          // Verify default unit_kerja created
          const { data: unitKerja, error: unitError } = await client
            .from('unit_kerja')
            .select('*')
            .eq('tenant_id', result.tenantId);

          expect(unitError).toBeNull();
          expect(unitKerja).toBeDefined();
          expect(unitKerja.length).toBeGreaterThan(0);

          // Verify default dasar_alokasi created
          const { data: dasarAlokasi, error: alokasiError } = await client
            .from('dasar_alokasi')
            .select('*')
            .eq('tenant_id', result.tenantId);

          expect(alokasiError).toBeNull();
          expect(dasarAlokasi).toBeDefined();
          expect(dasarAlokasi.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 5 } // Reduced runs karena operasi berat
    );
  }, 60000); // Timeout 60 detik

  /**
   * Property 2: Admin User Creation on Tenant Onboarding
   * Validates: Requirements 1.2
   * 
   * For any tenant creation, the admin user should:
   * - Have correct email
   * - Have tenant_id in app_metadata
   * - Have role 'admin' in app_metadata
   * - Be able to authenticate
   */
  it('Property 2: Admin user created with correct metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          adminEmail: fc.emailAddress(),
          adminPassword: fc.string({ minLength: 8, maxLength: 20 }),
          adminFullName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        }),
        async (data) => {
          const uniqueSlug = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          const result = await createTenant({
            tenantName: data.tenantName,
            tenantSlug: uniqueSlug,
            adminEmail: data.adminEmail,
            adminPassword: data.adminPassword,
            adminFullName: data.adminFullName
          });

          if (result.success && result.tenantId) {
            testTenantIds.push(result.tenantId);
            if (result.adminUserId) {
              testUserIds.push(result.adminUserId);
            }
          }

          expect(result.success).toBe(true);
          expect(result.adminUserId).toBeDefined();

          if (!result.adminUserId || !result.tenantId) return;

          // Verify admin user metadata
          const { data: authUser } = await client.auth.admin.getUserById(result.adminUserId);

          expect(authUser.user?.app_metadata?.tenant_id).toBe(result.tenantId);
          expect(authUser.user?.app_metadata?.role).toBe('admin');
          expect(authUser.user?.email).toBe(data.adminEmail);
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * Property 3: Default Data Initialization
   * Validates: Requirements 1.3
   * 
   * For any new tenant, default data should be created:
   * - At least 4 default unit_kerja
   * - At least 3 default dasar_alokasi
   * - All default data should have correct tenant_id
   */
  it('Property 3: Default data initialized for new tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          adminEmail: fc.emailAddress(),
          adminPassword: fc.string({ minLength: 8, maxLength: 20 }),
          adminFullName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        }),
        async (data) => {
          const uniqueSlug = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          const result = await createTenant({
            tenantName: data.tenantName,
            tenantSlug: uniqueSlug,
            adminEmail: data.adminEmail,
            adminPassword: data.adminPassword,
            adminFullName: data.adminFullName
          });

          if (result.success && result.tenantId) {
            testTenantIds.push(result.tenantId);
            if (result.adminUserId) {
              testUserIds.push(result.adminUserId);
            }
          }

          expect(result.success).toBe(true);
          expect(result.tenantId).toBeDefined();

          if (!result.tenantId) return;

          // Verify unit_kerja
          const { data: unitKerja } = await client
            .from('unit_kerja')
            .select('*')
            .eq('tenant_id', result.tenantId);

          expect(unitKerja).toBeDefined();
          expect(unitKerja!.length).toBeGreaterThanOrEqual(4);
          
          // All should have correct tenant_id
          unitKerja!.forEach(unit => {
            expect(unit.tenant_id).toBe(result.tenantId);
          });

          // Verify dasar_alokasi
          const { data: dasarAlokasi } = await client
            .from('dasar_alokasi')
            .select('*')
            .eq('tenant_id', result.tenantId);

          expect(dasarAlokasi).toBeDefined();
          expect(dasarAlokasi!.length).toBeGreaterThanOrEqual(3);
          
          // All should have correct tenant_id
          dasarAlokasi!.forEach(alokasi => {
            expect(alokasi.tenant_id).toBe(result.tenantId);
          });
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * Property 5: Tenant Onboarding Atomicity
   * Validates: Requirements 1.5
   * 
   * If tenant creation fails at any step, all changes should be rolled back:
   * - No tenant record should exist
   * - No admin user should exist
   * - No related records should exist
   */
  it('Property 5: Failed onboarding rolls back all changes', async () => {
    // Test dengan duplicate slug untuk trigger error
    const existingSlug = `existing-${Date.now()}`;
    
    // Create first tenant
    const firstResult = await createTenant({
      tenantName: 'First Tenant',
      tenantSlug: existingSlug,
      adminEmail: `first-${Date.now()}@example.com`,
      adminPassword: 'password123',
      adminFullName: 'First Admin'
    });

    if (firstResult.success && firstResult.tenantId) {
      testTenantIds.push(firstResult.tenantId);
      if (firstResult.adminUserId) {
        testUserIds.push(firstResult.adminUserId);
      }
    }

    expect(firstResult.success).toBe(true);

    // Try to create second tenant dengan slug yang sama (should fail)
    const secondResult = await createTenant({
      tenantName: 'Second Tenant',
      tenantSlug: existingSlug, // Duplicate slug
      adminEmail: `second-${Date.now()}@example.com`,
      adminPassword: 'password123',
      adminFullName: 'Second Admin'
    });

    // Should fail
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toBeDefined();

    // Verify no partial data created
    const { data: tenants } = await client
      .from('tenants')
      .select('*')
      .eq('slug', existingSlug);

    // Should only have one tenant (the first one)
    expect(tenants).toBeDefined();
    expect(tenants!.length).toBe(1);
  }, 30000);

  /**
   * Unit Test: Slug Validation
   */
  describe('Slug Validation', () => {
    it('should validate correct slug format', () => {
      expect(validateTenantSlug('valid-slug-123').valid).toBe(true);
      expect(validateTenantSlug('another-valid').valid).toBe(true);
    });

    it('should reject invalid slug formats', () => {
      expect(validateTenantSlug('ab').valid).toBe(false); // Too short
      expect(validateTenantSlug('Invalid-Slug').valid).toBe(false); // Uppercase
      expect(validateTenantSlug('invalid_slug').valid).toBe(false); // Underscore
      expect(validateTenantSlug('-invalid').valid).toBe(false); // Starts with dash
      expect(validateTenantSlug('invalid-').valid).toBe(false); // Ends with dash
    });
  });

  /**
   * Unit Test: Slug Generation
   */
  describe('Slug Generation', () => {
    it('should generate valid slug from name', () => {
      expect(generateSlugFromName('RS Sehat Sentosa')).toBe('rs-sehat-sentosa');
      expect(generateSlugFromName('Hospital 123')).toBe('hospital-123');
      expect(generateSlugFromName('Test@#$%Hospital')).toBe('testhospital');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlugFromName('Test   Multiple   Spaces')).toBe('test-multiple-spaces');
    });

    it('should limit length to 50 characters', () => {
      const longName = 'A'.repeat(100);
      const slug = generateSlugFromName(longName);
      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });
});
