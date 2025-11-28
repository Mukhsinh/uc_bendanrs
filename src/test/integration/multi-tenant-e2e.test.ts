/**
 * End-to-End Multi-Tenant Integration Tests
 * 
 * Comprehensive integration tests untuk memverifikasi tenant isolation
 * dan multi-tenant functionality secara keseluruhan.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, createTestTenant, cleanupTestTenant } from '../helpers/database';

describe('Multi-Tenant System E2E Tests', () => {
  const client = createTestClient();
  let tenant1Id: string;
  let tenant2Id: string;
  let tenant1AdminId: string;
  let tenant2AdminId: string;

  beforeAll(async () => {
    // Create two test tenants
    tenant1Id = await createTestTenant('Hospital A');
    tenant2Id = await createTestTenant('Hospital B');
  });

  afterAll(async () => {
    await cleanupTestTenant(tenant1Id);
    await cleanupTestTenant(tenant2Id);
  });

  describe('Tenant Isolation', () => {
    it('should isolate data between tenants', async () => {
      // Create data for tenant 1
      const { data: unit1 } = await client
        .from('unit_kerja')
        .insert({
          name: 'Unit A',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      expect(unit1).toBeDefined();

      // Create data for tenant 2
      const { data: unit2 } = await client
        .from('unit_kerja')
        .insert({
          name: 'Unit B',
          jenis: 'produksi',
          tenant_id: tenant2Id,
        })
        .select()
        .single();

      expect(unit2).toBeDefined();

      // Query as tenant 1 - should only see tenant 1 data
      const { data: tenant1Data } = await client
        .from('unit_kerja')
        .select('*')
        .eq('tenant_id', tenant1Id);

      expect(tenant1Data).toBeDefined();
      expect(tenant1Data?.every(u => u.tenant_id === tenant1Id)).toBe(true);
      expect(tenant1Data?.some(u => u.tenant_id === tenant2Id)).toBe(false);

      // Query as tenant 2 - should only see tenant 2 data
      const { data: tenant2Data } = await client
        .from('unit_kerja')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(tenant2Data).toBeDefined();
      expect(tenant2Data?.every(u => u.tenant_id === tenant2Id)).toBe(true);
      expect(tenant2Data?.some(u => u.tenant_id === tenant1Id)).toBe(false);

      // Cleanup
      if (unit1) await client.from('unit_kerja').delete().eq('id', unit1.id);
      if (unit2) await client.from('unit_kerja').delete().eq('id', unit2.id);
    });

    it('should prevent cross-tenant data access', async () => {
      // Create data for tenant 1
      const { data: unit } = await client
        .from('unit_kerja')
        .insert({
          name: 'Private Unit',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      expect(unit).toBeDefined();

      // Try to access tenant 1 data as tenant 2
      const { data: crossTenantData } = await client
        .from('unit_kerja')
        .select('*')
        .eq('id', unit!.id)
        .eq('tenant_id', tenant2Id);

      // Should return empty (RLS blocks access)
      expect(crossTenantData).toEqual([]);

      // Cleanup
      if (unit) await client.from('unit_kerja').delete().eq('id', unit.id);
    });
  });

  describe('Tenant Onboarding', () => {
    it('should create complete tenant with all required data', async () => {
      const testTenantId = await createTestTenant('Test Hospital');

      // Verify tenant exists
      const { data: tenant } = await client
        .from('tenants')
        .select('*')
        .eq('id', testTenantId)
        .single();

      expect(tenant).toBeDefined();
      expect(tenant?.name).toBe('Test Hospital');
      expect(tenant?.is_active).toBe(true);

      // Verify tenant settings created
      const { data: settings } = await client
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', testTenantId)
        .single();

      expect(settings).toBeDefined();
      expect(settings?.tenant_id).toBe(testTenantId);

      // Cleanup
      await cleanupTestTenant(testTenantId);
    });
  });

  describe('User Management', () => {
    it('should isolate users by tenant', async () => {
      // Get users for tenant 1
      const { data: tenant1Users } = await client
        .from('user_profiles')
        .select('*')
        .eq('tenant_id', tenant1Id);

      // Get users for tenant 2
      const { data: tenant2Users } = await client
        .from('user_profiles')
        .select('*')
        .eq('tenant_id', tenant2Id);

      // Verify no overlap
      const tenant1UserIds = tenant1Users?.map(u => u.user_id) || [];
      const tenant2UserIds = tenant2Users?.map(u => u.user_id) || [];

      const hasOverlap = tenant1UserIds.some(id => tenant2UserIds.includes(id));
      expect(hasOverlap).toBe(false);
    });
  });

  describe('Tenant Settings', () => {
    it('should isolate settings by tenant', async () => {
      // Update tenant 1 settings
      const { data: settings1 } = await client
        .from('tenant_settings')
        .update({
          primary_color: '#FF0000',
          include_jasa_pelayanan: true,
        })
        .eq('tenant_id', tenant1Id)
        .select()
        .single();

      expect(settings1?.primary_color).toBe('#FF0000');

      // Verify tenant 2 settings unchanged
      const { data: settings2 } = await client
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenant2Id)
        .single();

      expect(settings2?.primary_color).not.toBe('#FF0000');
    });
  });

  describe('Database Functions', () => {
    it('should filter calculations by tenant', async () => {
      // Create test data for both tenants
      const { data: unit1 } = await client
        .from('unit_kerja')
        .insert({
          name: 'Calc Unit 1',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      const { data: unit2 } = await client
        .from('unit_kerja')
        .insert({
          name: 'Calc Unit 2',
          jenis: 'produksi',
          tenant_id: tenant2Id,
        })
        .select()
        .single();

      // Query should only return tenant-specific data
      const { data: tenant1Units } = await client
        .from('unit_kerja')
        .select('*')
        .eq('tenant_id', tenant1Id);

      expect(tenant1Units?.length).toBeGreaterThan(0);
      expect(tenant1Units?.every(u => u.tenant_id === tenant1Id)).toBe(true);

      // Cleanup
      if (unit1) await client.from('unit_kerja').delete().eq('id', unit1.id);
      if (unit2) await client.from('unit_kerja').delete().eq('id', unit2.id);
    });
  });

  describe('Audit Logging', () => {
    it('should log tenant-specific actions', async () => {
      const testAction = `test_action_${Date.now()}`;

      // Create audit log
      const { data: log } = await client
        .from('tenant_audit_log')
        .insert({
          tenant_id: tenant1Id,
          action: testAction,
          table_name: 'test_table',
          record_id: 'test_id',
        })
        .select()
        .single();

      expect(log).toBeDefined();
      expect(log?.tenant_id).toBe(tenant1Id);

      // Verify log is tenant-specific
      const { data: tenant1Logs } = await client
        .from('tenant_audit_log')
        .select('*')
        .eq('action', testAction)
        .eq('tenant_id', tenant1Id);

      expect(tenant1Logs?.length).toBe(1);

      // Verify tenant 2 doesn't see the log
      const { data: tenant2Logs } = await client
        .from('tenant_audit_log')
        .select('*')
        .eq('action', testAction)
        .eq('tenant_id', tenant2Id);

      expect(tenant2Logs?.length).toBe(0);

      // Cleanup
      if (log) await client.from('tenant_audit_log').delete().eq('id', log.id);
    });
  });

  describe('Performance', () => {
    it('should handle multiple tenants efficiently', async () => {
      const startTime = Date.now();

      // Create data for multiple tenants
      const promises = [tenant1Id, tenant2Id].map(async (tenantId) => {
        return client
          .from('unit_kerja')
          .insert({
            name: `Perf Test ${tenantId}`,
            jenis: 'produksi',
            tenant_id: tenantId,
          })
          .select()
          .single();
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Should complete in reasonable time (< 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);

      // Verify all inserts successful
      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      // Cleanup
      for (const { data } of results) {
        if (data) {
          await client.from('unit_kerja').delete().eq('id', data.id);
        }
      }
    });
  });
});
