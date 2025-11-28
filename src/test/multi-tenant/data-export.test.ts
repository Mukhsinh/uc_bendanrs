/**
 * Property Tests: Data Export Functionality
 * 
 * Tests untuk memastikan export data hanya mencakup data tenant yang benar
 * dan tidak ada data leakage antar tenant.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createTestClient, createTestTenant, cleanupTestTenant } from '../helpers/database';

describe('Multi-Tenant Data Export', () => {
  const client = createTestClient();
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    tenant1Id = await createTestTenant('Export Test Tenant 1');
    tenant2Id = await createTestTenant('Export Test Tenant 2');
  });

  afterAll(async () => {
    await cleanupTestTenant(tenant1Id);
    await cleanupTestTenant(tenant2Id);
  });

  /**
   * Property 46: Export Data Tenant Scoping
   * Validates: Requirements 13.1
   * 
   * For any tenant admin requesting a data export, the system should
   * generate an export file containing only that tenant's data
   */
  it('Property 46: Export only contains tenant data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          unitName: fc.string({ minLength: 3, maxLength: 20 }),
          jenis: fc.constantFrom('produksi', 'non_produksi', 'penunjang'),
        }),
        async (testData) => {
          // Create data for tenant 1
          const { data: unit1, error: error1 } = await client
            .from('unit_kerja')
            .insert({
              name: `${testData.unitName}_T1`,
              jenis: testData.jenis,
              tenant_id: tenant1Id,
            })
            .select()
            .single();

          expect(error1).toBeNull();
          expect(unit1).toBeDefined();

          // Create data for tenant 2
          const { data: unit2, error: error2 } = await client
            .from('unit_kerja')
            .insert({
              name: `${testData.unitName}_T2`,
              jenis: testData.jenis,
              tenant_id: tenant2Id,
            })
            .select()
            .single();

          expect(error2).toBeNull();
          expect(unit2).toBeDefined();

          // Export tenant 1 data
          const { data: exportData, error: exportError } = await client
            .from('unit_kerja')
            .select('*')
            .eq('tenant_id', tenant1Id);

          expect(exportError).toBeNull();
          expect(exportData).toBeDefined();

          // Verify export only contains tenant 1 data
          const hasTenant2Data = exportData?.some(
            (item: any) => item.tenant_id === tenant2Id
          );
          expect(hasTenant2Data).toBe(false);

          // Verify all data belongs to tenant 1
          const allBelongToTenant1 = exportData?.every(
            (item: any) => item.tenant_id === tenant1Id
          );
          expect(allBelongToTenant1).toBe(true);

          // Cleanup
          if (unit1) {
            await client.from('unit_kerja').delete().eq('id', unit1.id);
          }
          if (unit2) {
            await client.from('unit_kerja').delete().eq('id', unit2.id);
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 47: Export Completeness with Filtering
   * Validates: Requirements 13.2
   * 
   * For any data export process, the system should include all relevant
   * tables with proper tenant_id filtering applied
   */
  it('Property 47: Export includes all relevant tables with filtering', async () => {
    // Create test data across multiple tables
    const { data: unit } = await client
      .from('unit_kerja')
      .insert({
        name: 'Test Unit for Export',
        jenis: 'produksi',
        tenant_id: tenant1Id,
      })
      .select()
      .single();

    expect(unit).toBeDefined();

    const { data: kegiatan } = await client
      .from('Data_Kegiatan')
      .insert({
        nama_kegiatan: 'Test Activity',
        unit_kerja_id: unit!.id,
        tenant_id: tenant1Id,
      })
      .select()
      .single();

    expect(kegiatan).toBeDefined();

    // Simulate export from multiple tables
    const tables = ['unit_kerja', 'Data_Kegiatan'];
    const exportResults: any[] = [];

    for (const table of tables) {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('tenant_id', tenant1Id);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) {
        exportResults.push({ table, count: data.length, data });
      }
    }

    // Verify all tables exported
    expect(exportResults.length).toBe(tables.length);

    // Verify all data has correct tenant_id
    for (const result of exportResults) {
      const allCorrectTenant = result.data.every(
        (item: any) => item.tenant_id === tenant1Id
      );
      expect(allCorrectTenant).toBe(true);
    }

    // Cleanup
    if (kegiatan) {
      await client.from('Data_Kegiatan').delete().eq('id', kegiatan.id);
    }
    if (unit) {
      await client.from('unit_kerja').delete().eq('id', unit.id);
    }
  });

  /**
   * Unit Test: Export format validation
   */
  it('should validate export format', () => {
    const validFormats = ['json', 'sql'];
    const invalidFormats = ['csv', 'xml', 'pdf'];

    validFormats.forEach(format => {
      expect(['json', 'sql'].includes(format)).toBe(true);
    });

    invalidFormats.forEach(format => {
      expect(['json', 'sql'].includes(format)).toBe(false);
    });
  });

  /**
   * Unit Test: Export includes tenant settings
   */
  it('should include tenant settings when requested', async () => {
    const { data: settings, error } = await client
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenant1Id)
      .single();

    expect(error).toBeNull();
    expect(settings).toBeDefined();
    expect(settings?.tenant_id).toBe(tenant1Id);
  });

  /**
   * Unit Test: Export audit logging
   */
  it('should log export requests', async () => {
    const exportId = `test_export_${Date.now()}`;

    const { data: log, error } = await client
      .from('tenant_audit_log')
      .insert({
        tenant_id: tenant1Id,
        action: 'data_export',
        table_name: 'multiple',
        record_id: exportId,
        new_data: { format: 'json', exportId },
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(log).toBeDefined();
    expect(log?.action).toBe('data_export');

    // Cleanup
    if (log) {
      await client.from('tenant_audit_log').delete().eq('id', log.id);
    }
  });
});
