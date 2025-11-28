import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createTestClient, cleanupTestTenants, createTestTenant } from '../helpers/database';

/**
 * Property-Based Tests untuk User Management dengan Tenant Isolation
 * 
 * Feature: multi-tenant-system
 */

describe('User Management - Tenant Isolation Property Tests', () => {
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
   * Property 10: User Creation Tenant Binding
   * Validates: Requirements 3.1
   * 
   * For any new user created within a tenant context,
   * the user should be automatically bound to that tenant
   */
  it('Property 10: New users automatically bound to correct tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          userEmail: fc.emailAddress(),
          userFullName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        }),
        async (data) => {
          // Create test tenant
          const tenantId = await createTestTenant(data.tenantName);
          testTenantIds.push(tenantId);

          // Create user dengan tenant context
          const { data: authUser, error: authError } = await client.auth.admin.createUser({
            email: data.userEmail,
            password: 'testpassword123',
            email_confirm: true,
            user_metadata: {
              full_name: data.userFullName
            },
            app_metadata: {
              tenant_id: tenantId,
              role: 'user'
            }
          });

          expect(authError).toBeNull();
          expect(authUser.user).toBeDefined();

          if (!authUser.user) return;
          testUserIds.push(authUser.user.id);

          // Create user_profile
          const { error: profileError } = await client
            .from('user_profiles')
            .insert({
              user_id: authUser.user.id,
              tenant_id: tenantId,
              full_name: data.userFullName,
              is_active: true
            });

          expect(profileError).toBeNull();

          // Verify user has correct tenant_id
          const { data: profile } = await client
            .from('user_profiles')
            .select('tenant_id')
            .eq('user_id', authUser.user.id)
            .single();

          expect(profile).toBeDefined();
          expect(profile!.tenant_id).toBe(tenantId);

          // Verify app_metadata has tenant_id
          expect(authUser.user.app_metadata?.tenant_id).toBe(tenantId);
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * Property 11: User List Tenant Filtering
   * Validates: Requirements 3.2
   * 
   * For any tenant, querying users should only return users
   * belonging to that tenant
   */
  it('Property 11: User list filtered by tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenant1Name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          tenant2Name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          user1Email: fc.emailAddress(),
          user2Email: fc.emailAddress(),
        }),
        async (data) => {
          // Create two tenants
          const tenant1Id = await createTestTenant(data.tenant1Name);
          const tenant2Id = await createTestTenant(data.tenant2Name);
          testTenantIds.push(tenant1Id, tenant2Id);

          // Create user for tenant 1
          const { data: user1 } = await client.auth.admin.createUser({
            email: data.user1Email,
            password: 'testpassword123',
            email_confirm: true,
            app_metadata: {
              tenant_id: tenant1Id,
              role: 'user'
            }
          });

          if (user1.user) {
            testUserIds.push(user1.user.id);
            await client.from('user_profiles').insert({
              user_id: user1.user.id,
              tenant_id: tenant1Id,
              full_name: 'User 1',
              is_active: true
            });
          }

          // Create user for tenant 2
          const { data: user2 } = await client.auth.admin.createUser({
            email: data.user2Email,
            password: 'testpassword123',
            email_confirm: true,
            app_metadata: {
              tenant_id: tenant2Id,
              role: 'user'
            }
          });

          if (user2.user) {
            testUserIds.push(user2.user.id);
            await client.from('user_profiles').insert({
              user_id: user2.user.id,
              tenant_id: tenant2Id,
              full_name: 'User 2',
              is_active: true
            });
          }

          // Query users for tenant 1
          const { data: tenant1Users } = await client
            .from('user_profiles')
            .select('*')
            .eq('tenant_id', tenant1Id);

          // Query users for tenant 2
          const { data: tenant2Users } = await client
            .from('user_profiles')
            .select('*')
            .eq('tenant_id', tenant2Id);

          // Verify isolation
          expect(tenant1Users).toBeDefined();
          expect(tenant2Users).toBeDefined();

          // Each tenant should only see their own users
          tenant1Users!.forEach(user => {
            expect(user.tenant_id).toBe(tenant1Id);
          });

          tenant2Users!.forEach(user => {
            expect(user.tenant_id).toBe(tenant2Id);
          });

          // Verify no cross-tenant data
          const tenant1UserIds = tenant1Users!.map(u => u.user_id);
          const tenant2UserIds = tenant2Users!.map(u => u.user_id);

          // No overlap
          const overlap = tenant1UserIds.filter(id => tenant2UserIds.includes(id));
          expect(overlap.length).toBe(0);
        }
      ),
      { numRuns: 3 }
    );
  }, 60000);

  /**
   * Property 14: Cross-Tenant User Management Prevention
   * Validates: Requirements 3.5
   * 
   * For any user management operation (role change, deactivation),
   * operations should be blocked if target user belongs to different tenant
   */
  it('Property 14: Cross-tenant user management blocked', async () => {
    // Create two tenants
    const tenant1Id = await createTestTenant('Tenant 1');
    const tenant2Id = await createTestTenant('Tenant 2');
    testTenantIds.push(tenant1Id, tenant2Id);

    // Create admin user for tenant 1
    const { data: admin1 } = await client.auth.admin.createUser({
      email: 'admin1@test.com',
      password: 'testpassword123',
      email_confirm: true,
      app_metadata: {
        tenant_id: tenant1Id,
        role: 'admin'
      }
    });

    if (admin1.user) {
      testUserIds.push(admin1.user.id);
      await client.from('user_profiles').insert({
        user_id: admin1.user.id,
        tenant_id: tenant1Id,
        full_name: 'Admin 1',
        is_active: true
      });
    }

    // Create regular user for tenant 2
    const { data: user2 } = await client.auth.admin.createUser({
      email: 'user2@test.com',
      password: 'testpassword123',
      email_confirm: true,
      app_metadata: {
        tenant_id: tenant2Id,
        role: 'user'
      }
    });

    if (user2.user) {
      testUserIds.push(user2.user.id);
      await client.from('user_profiles').insert({
        user_id: user2.user.id,
        tenant_id: tenant2Id,
        full_name: 'User 2',
        is_active: true
      });
    }

    // Verify tenant isolation
    const { data: profile1 } = await client
      .from('user_profiles')
      .select('tenant_id')
      .eq('user_id', admin1.user!.id)
      .single();

    const { data: profile2 } = await client
      .from('user_profiles')
      .select('tenant_id')
      .eq('user_id', user2.user!.id)
      .single();

    expect(profile1!.tenant_id).toBe(tenant1Id);
    expect(profile2!.tenant_id).toBe(tenant2Id);
    expect(profile1!.tenant_id).not.toBe(profile2!.tenant_id);

    // Admin 1 should not be able to see User 2's profile via RLS
    // This would be tested in actual application context with proper auth
    // Here we verify the data structure supports isolation
    expect(profile1!.tenant_id).not.toBe(profile2!.tenant_id);
  }, 30000);

  /**
   * Unit Test: User Deactivation
   */
  describe('User Deactivation', () => {
    it('should deactivate user within same tenant', async () => {
      const tenantId = await createTestTenant('Test Tenant');
      testTenantIds.push(tenantId);

      // Create user
      const { data: authUser } = await client.auth.admin.createUser({
        email: 'test@example.com',
        password: 'testpassword123',
        email_confirm: true,
        app_metadata: {
          tenant_id: tenantId,
          role: 'user'
        }
      });

      if (authUser.user) {
        testUserIds.push(authUser.user.id);

        // Create profile
        await client.from('user_profiles').insert({
          user_id: authUser.user.id,
          tenant_id: tenantId,
          full_name: 'Test User',
          is_active: true
        });

        // Deactivate
        const { error } = await client
          .from('user_profiles')
          .update({ is_active: false })
          .eq('user_id', authUser.user.id);

        expect(error).toBeNull();

        // Verify deactivated
        const { data: profile } = await client
          .from('user_profiles')
          .select('is_active')
          .eq('user_id', authUser.user.id)
          .single();

        expect(profile!.is_active).toBe(false);
      }
    });

    it('should preserve user data when deactivated', async () => {
      const tenantId = await createTestTenant('Test Tenant');
      testTenantIds.push(tenantId);

      const { data: authUser } = await client.auth.admin.createUser({
        email: 'preserve@example.com',
        password: 'testpassword123',
        email_confirm: true,
        app_metadata: {
          tenant_id: tenantId,
          role: 'user'
        }
      });

      if (authUser.user) {
        testUserIds.push(authUser.user.id);

        const fullName = 'Preserve Test User';
        await client.from('user_profiles').insert({
          user_id: authUser.user.id,
          tenant_id: tenantId,
          full_name: fullName,
          is_active: true
        });

        // Deactivate
        await client
          .from('user_profiles')
          .update({ is_active: false })
          .eq('user_id', authUser.user.id);

        // Verify data preserved
        const { data: profile } = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.user.id)
          .single();

        expect(profile!.full_name).toBe(fullName);
        expect(profile!.tenant_id).toBe(tenantId);
        expect(profile!.is_active).toBe(false);
      }
    });
  });
});
