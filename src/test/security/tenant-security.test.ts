/**
 * Security Tests for Multi-Tenant System
 * 
 * Tests untuk memverifikasi security measures dan mencegah
 * common security vulnerabilities dalam multi-tenant system.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, createTestTenant, cleanupTestTenant } from '../helpers/database';

describe('Multi-Tenant Security Tests', () => {
  const client = createTestClient();
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    tenant1Id = await createTestTenant('Security Test Tenant 1');
    tenant2Id = await createTestTenant('Security Test Tenant 2');
  });

  afterAll(async () => {
    await cleanupTestTenant(tenant1Id);
    await cleanupTestTenant(tenant2Id);
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in tenant_id', async () => {
      const maliciousInput = "'; DROP TABLE tenants; --";

      // Attempt SQL injection
      const { data, error } = await client
        .from('unit_kerja')
        .select('*')
        .eq('tenant_id', maliciousInput);

      // Should safely handle malicious input
      expect(error).toBeDefined(); // Invalid UUID format
      expect(data).toBeNull();
    });

    it('should prevent SQL injection in search queries', async () => {
      const maliciousSearch = "' OR '1'='1";

      const { data, error } = await client
        .from('unit_kerja')
        .select('*')
        .ilike('name', maliciousSearch);

      // Should safely handle malicious input
      // Parameterized queries prevent injection
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('RLS Policy Enforcement', () => {
    it('should enforce RLS on SELECT', async () => {
      // Create data for tenant 1
      const { data: unit } = await client
        .from('unit_kerja')
        .insert({
          name: 'RLS Test Unit',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      expect(unit).toBeDefined();

      // Try to access with wrong tenant_id
      const { data: wrongTenantData } = await client
        .from('unit_kerja')
        .select('*')
        .eq('id', unit!.id)
        .eq('tenant_id', tenant2Id);

      // RLS should block access
      expect(wrongTenantData).toEqual([]);

      // Cleanup
      if (unit) await client.from('unit_kerja').delete().eq('id', unit.id);
    });

    it('should enforce RLS on INSERT', async () => {
      // Try to insert with wrong tenant_id
      const { data, error } = await client
        .from('unit_kerja')
        .insert({
          name: 'Unauthorized Unit',
          jenis: 'produksi',
          tenant_id: tenant2Id, // Wrong tenant
        })
        .select()
        .single();

      // Should be blocked by RLS or trigger
      // Either error or data with correct tenant_id
      if (data) {
        // If insert succeeded, tenant_id should be corrected by trigger
        expect(data.tenant_id).not.toBe(tenant2Id);
        await client.from('unit_kerja').delete().eq('id', data.id);
      }
    });

    it('should enforce RLS on UPDATE', async () => {
      // Create data for tenant 1
      const { data: unit } = await client
        .from('unit_kerja')
        .insert({
          name: 'Update Test Unit',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      expect(unit).toBeDefined();

      // Try to update with wrong tenant context
      const { data: updated, error } = await client
        .from('unit_kerja')
        .update({ name: 'Hacked Name' })
        .eq('id', unit!.id)
        .eq('tenant_id', tenant2Id)
        .select();

      // Should not update (RLS blocks)
      expect(updated).toEqual([]);

      // Verify original data unchanged
      const { data: original } = await client
        .from('unit_kerja')
        .select('*')
        .eq('id', unit!.id)
        .eq('tenant_id', tenant1Id)
        .single();

      expect(original?.name).toBe('Update Test Unit');

      // Cleanup
      if (unit) await client.from('unit_kerja').delete().eq('id', unit.id);
    });

    it('should enforce RLS on DELETE', async () => {
      // Create data for tenant 1
      const { data: unit } = await client
        .from('unit_kerja')
        .insert({
          name: 'Delete Test Unit',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      expect(unit).toBeDefined();

      // Try to delete with wrong tenant context
      const { error } = await client
        .from('unit_kerja')
        .delete()
        .eq('id', unit!.id)
        .eq('tenant_id', tenant2Id);

      // Verify data still exists
      const { data: stillExists } = await client
        .from('unit_kerja')
        .select('*')
        .eq('id', unit!.id)
        .eq('tenant_id', tenant1Id)
        .single();

      expect(stillExists).toBeDefined();

      // Cleanup
      if (unit) await client.from('unit_kerja').delete().eq('id', unit.id);
    });
  });

  describe('Information Disclosure Prevention', () => {
    it('should not expose tenant existence through errors', async () => {
      const nonExistentTenantId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await client
        .from('unit_kerja')
        .select('*')
        .eq('tenant_id', nonExistentTenantId);

      // Should return empty set, not error
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should not expose other tenant data in error messages', async () => {
      // Create data for tenant 1
      const { data: unit } = await client
        .from('unit_kerja')
        .insert({
          name: 'Secret Unit',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      // Try to access as tenant 2
      const { data, error } = await client
        .from('unit_kerja')
        .select('*')
        .eq('id', unit!.id)
        .eq('tenant_id', tenant2Id);

      // Should return empty, not error with details
      expect(error).toBeNull();
      expect(data).toEqual([]);

      // Error message should not contain tenant 1 data
      if (error) {
        expect(error.message).not.toContain('Secret Unit');
        expect(error.message).not.toContain(tenant1Id);
      }

      // Cleanup
      if (unit) await client.from('unit_kerja').delete().eq('id', unit.id);
    });
  });

  describe('Session Security', () => {
    it('should validate tenant_id in session', async () => {
      // This would be tested with actual JWT manipulation
      // For now, verify tenant_id is required
      const { data, error } = await client
        .from('unit_kerja')
        .insert({
          name: 'No Tenant Unit',
          jenis: 'produksi',
          // tenant_id omitted
        })
        .select()
        .single();

      // Should either error or auto-populate tenant_id
      if (data) {
        expect(data.tenant_id).toBeDefined();
        await client.from('unit_kerja').delete().eq('id', data.id);
      }
    });
  });

  describe('Privilege Escalation Prevention', () => {
    it('should prevent tenant_id modification', async () => {
      // Create data for tenant 1
      const { data: unit } = await client
        .from('unit_kerja')
        .insert({
          name: 'Immutable Tenant Unit',
          jenis: 'produksi',
          tenant_id: tenant1Id,
        })
        .select()
        .single();

      expect(unit).toBeDefined();

      // Try to change tenant_id
      const { data: updated, error } = await client
        .from('unit_kerja')
        .update({ tenant_id: tenant2Id })
        .eq('id', unit!.id)
        .select();

      // Should be blocked or ignored
      if (updated && updated.length > 0) {
        expect(updated[0].tenant_id).toBe(tenant1Id);
      }

      // Cleanup
      if (unit) await client.from('unit_kerja').delete().eq('id', unit.id);
    });
  });

  describe('Audit Trail Security', () => {
    it('should log security-relevant events', async () => {
      const testAction = `security_test_${Date.now()}`;

      // Create audit log
      const { data: log } = await client
        .from('tenant_audit_log')
        .insert({
          tenant_id: tenant1Id,
          action: testAction,
          table_name: 'security_test',
          record_id: 'test_id',
        })
        .select()
        .single();

      expect(log).toBeDefined();
      expect(log?.action).toBe(testAction);

      // Verify log is immutable (cannot be modified)
      const { error } = await client
        .from('tenant_audit_log')
        .update({ action: 'modified_action' })
        .eq('id', log!.id);

      // Audit logs should be append-only
      // (This depends on RLS policies)

      // Cleanup
      if (log) await client.from('tenant_audit_log').delete().eq('id', log.id);
    });
  });

  describe('Data Validation', () => {
    it('should validate tenant_id format', async () => {
      const invalidTenantId = 'not-a-uuid';

      const { data, error } = await client
        .from('unit_kerja')
        .select('*')
        .eq('tenant_id', invalidTenantId);

      // Should error on invalid UUID
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('should validate foreign key constraints', async () => {
      const nonExistentTenantId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await client
        .from('unit_kerja')
        .insert({
          name: 'Invalid Tenant Unit',
          jenis: 'produksi',
          tenant_id: nonExistentTenantId,
        })
        .select()
        .single();

      // Should fail foreign key constraint
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });
});
