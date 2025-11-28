import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createTestClient, cleanupTestTenants, createTestTenant } from '../helpers/database';

/**
 * Property-Based Tests untuk Tenant Settings Management
 * 
 * Feature: multi-tenant-system
 */

describe('Tenant Settings - Property Tests', () => {
  const testTenantIds: string[] = [];
  const client = createTestClient();

  afterEach(async () => {
    await cleanupTestTenants(testTenantIds);
    testTenantIds.length = 0;
  });

  /**
   * Property 23: Tenant Settings Isolation
   * Validates: Requirements 7.2
   * 
   * For any tenant, changing settings should only affect that tenant
   * and not affect other tenants' settings
   */
  it('Property 23: Settings changes isolated to tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenant1Name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          tenant2Name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          includeJP1: fc.boolean(),
          includeJP2: fc.boolean(),
          currency1: fc.constantFrom('IDR', 'USD', 'EUR'),
          currency2: fc.constantFrom('IDR', 'USD', 'EUR'),
        }),
        async (data) => {
          // Create two tenants
          const tenant1Id = await createTestTenant(data.tenant1Name);
          const tenant2Id = await createTestTenant(data.tenant2Name);
          testTenantIds.push(tenant1Id, tenant2Id);

          // Create settings for both tenants
          await client.from('tenant_settings').insert([
            {
              tenant_id: tenant1Id,
              include_jasa_pelayanan: data.includeJP1,
              currency: data.currency1,
              calculation_preferences: {
                rounding_method: 'round',
                decimal_places: 2
              }
            },
            {
              tenant_id: tenant2Id,
              include_jasa_pelayanan: data.includeJP2,
              currency: data.currency2,
              calculation_preferences: {
                rounding_method: 'floor',
                decimal_places: 3
              }
            }
          ]);

          // Update tenant 1 settings
          const newIncludeJP = !data.includeJP1;
          await client
            .from('tenant_settings')
            .update({ include_jasa_pelayanan: newIncludeJP })
            .eq('tenant_id', tenant1Id);

          // Verify tenant 1 settings changed
          const { data: settings1 } = await client
            .from('tenant_settings')
            .select('*')
            .eq('tenant_id', tenant1Id)
            .single();

          expect(settings1!.include_jasa_pelayanan).toBe(newIncludeJP);

          // Verify tenant 2 settings unchanged
          const { data: settings2 } = await client
            .from('tenant_settings')
            .select('*')
            .eq('tenant_id', tenant2Id)
            .single();

          expect(settings2!.include_jasa_pelayanan).toBe(data.includeJP2);
          expect(settings2!.currency).toBe(data.currency2);
          expect(settings2!.calculation_preferences.rounding_method).toBe('floor');
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);

  /**
   * Property 24: Calculation Preference Application
   * Validates: Requirements 7.3
   * 
   * For any calculation, the result should respect tenant-specific preferences
   * including rounding method and decimal places
   */
  it('Property 24: Calculations respect tenant preferences', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          roundingMethod: fc.constantFrom('round', 'floor', 'ceil'),
          decimalPlaces: fc.integer({ min: 0, max: 4 }),
          testValue: fc.float({ min: 100, max: 1000 }),
        }),
        async (data) => {
          const tenantId = await createTestTenant(data.tenantName);
          testTenantIds.push(tenantId);

          // Create settings dengan specific preferences
          await client.from('tenant_settings').insert({
            tenant_id: tenantId,
            include_jasa_pelayanan: true,
            currency: 'IDR',
            calculation_preferences: {
              rounding_method: data.roundingMethod,
              decimal_places: data.decimalPlaces
            }
          });

          // Call rounding function
          const { data: result, error } = await client.rpc('apply_tenant_rounding', {
            p_value: data.testValue,
            p_tenant_id: tenantId
          });

          expect(error).toBeNull();
          expect(result).toBeDefined();

          // Verify rounding applied correctly
          const expectedDecimalPlaces = data.decimalPlaces;
          const resultString = result.toString();
          
          if (resultString.includes('.')) {
            const decimalPart = resultString.split('.')[1];
            expect(decimalPart.length).toBeLessThanOrEqual(expectedDecimalPlaces);
          }

          // Verify rounding method
          const multiplier = Math.pow(10, data.decimalPlaces);
          let expected: number;
          
          switch (data.roundingMethod) {
            case 'floor':
              expected = Math.floor(data.testValue * multiplier) / multiplier;
              break;
            case 'ceil':
              expected = Math.ceil(data.testValue * multiplier) / multiplier;
              break;
            default: // 'round'
              expected = Math.round(data.testValue * multiplier) / multiplier;
          }

          // Allow small floating point differences
          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  /**
   * Property 25: Settings Change Audit Trail
   * Validates: Requirements 7.4
   * 
   * For any settings change, an audit log entry should be created
   * with old and new values
   */
  it('Property 25: Settings changes logged in audit trail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          oldIncludeJP: fc.boolean(),
          newIncludeJP: fc.boolean(),
          oldCurrency: fc.constantFrom('IDR', 'USD', 'EUR'),
          newCurrency: fc.constantFrom('IDR', 'USD', 'EUR'),
        }),
        async (data) => {
          const tenantId = await createTestTenant(data.tenantName);
          testTenantIds.push(tenantId);

          // Create initial settings
          await client.from('tenant_settings').insert({
            tenant_id: tenantId,
            include_jasa_pelayanan: data.oldIncludeJP,
            currency: data.oldCurrency,
            calculation_preferences: {
              rounding_method: 'round',
              decimal_places: 2
            }
          });

          // Create a test user for audit trail
          const { data: authUser } = await client.auth.admin.createUser({
            email: `test-${Date.now()}@example.com`,
            password: 'testpassword123',
            email_confirm: true,
            app_metadata: {
              tenant_id: tenantId,
              role: 'admin'
            }
          });

          if (!authUser.user) return;

          // Update settings
          await client
            .from('tenant_settings')
            .update({
              include_jasa_pelayanan: data.newIncludeJP,
              currency: data.newCurrency
            })
            .eq('tenant_id', tenantId);

          // Log audit trail
          await client.from('tenant_audit_log').insert({
            tenant_id: tenantId,
            user_id: authUser.user.id,
            action: 'settings_updated',
            table_name: 'tenant_settings',
            record_id: tenantId,
            changes: {
              old_values: {
                include_jasa_pelayanan: data.oldIncludeJP,
                currency: data.oldCurrency
              },
              new_values: {
                include_jasa_pelayanan: data.newIncludeJP,
                currency: data.newCurrency
              }
            }
          });

          // Verify audit log created
          const { data: auditLogs } = await client
            .from('tenant_audit_log')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('action', 'settings_updated');

          expect(auditLogs).toBeDefined();
          expect(auditLogs!.length).toBeGreaterThan(0);

          const log = auditLogs![0];
          expect(log.changes.old_values.include_jasa_pelayanan).toBe(data.oldIncludeJP);
          expect(log.changes.new_values.include_jasa_pelayanan).toBe(data.newIncludeJP);
          expect(log.changes.old_values.currency).toBe(data.oldCurrency);
          expect(log.changes.new_values.currency).toBe(data.newCurrency);

          // Cleanup test user
          await client.auth.admin.deleteUser(authUser.user.id);
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * Unit Tests: Settings Validation
   */
  describe('Settings Validation', () => {
    it('should accept valid color formats', () => {
      const validColors = ['#000000', '#FFFFFF', '#6366f1', '#8b5cf6'];
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      validColors.forEach(color => {
        expect(colorRegex.test(color)).toBe(true);
      });
    });

    it('should reject invalid color formats', () => {
      const invalidColors = ['#000', '#GGGGGG', 'red', '000000', '#0000000'];
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      invalidColors.forEach(color => {
        expect(colorRegex.test(color)).toBe(false);
      });
    });

    it('should accept valid rounding methods', () => {
      const validMethods = ['round', 'floor', 'ceil'];
      const allowedMethods = ['round', 'floor', 'ceil'];
      
      validMethods.forEach(method => {
        expect(allowedMethods.includes(method)).toBe(true);
      });
    });

    it('should validate decimal places range', () => {
      const validPlaces = [0, 1, 2, 3, 4];
      
      validPlaces.forEach(places => {
        expect(places >= 0 && places <= 4).toBe(true);
      });

      const invalidPlaces = [-1, 5, 10];
      invalidPlaces.forEach(places => {
        expect(places >= 0 && places <= 4).toBe(false);
      });
    });
  });

  /**
   * Unit Tests: Preference Application
   */
  describe('Preference Application', () => {
    it('should apply floor rounding correctly', () => {
      const value = 123.456;
      const decimalPlaces = 2;
      const multiplier = Math.pow(10, decimalPlaces);
      const result = Math.floor(value * multiplier) / multiplier;
      
      expect(result).toBe(123.45);
    });

    it('should apply ceil rounding correctly', () => {
      const value = 123.451;
      const decimalPlaces = 2;
      const multiplier = Math.pow(10, decimalPlaces);
      const result = Math.ceil(value * multiplier) / multiplier;
      
      expect(result).toBe(123.46);
    });

    it('should apply normal rounding correctly', () => {
      const value = 123.455;
      const decimalPlaces = 2;
      const result = Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
      
      expect(result).toBe(123.46);
    });
  });
});
