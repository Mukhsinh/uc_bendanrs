/**
 * Property-based tests for calculation utilities
 * Feature: perbaikan-ui-multi-fitur
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateTariff, roundToTwoDecimals, calculateTotalBudgeting } from '@/utils/calculations';

describe('Calculation Utilities - Property Tests', () => {
  /**
   * Feature: perbaikan-ui-multi-fitur, Property 4: Jasa pelayanan calculation
   * For any values of jasa_pelayanan_medis and jasa_pelayanan_non_medis,
   * jasa_pelayanan must equal their sum
   */
  it('Property 4: jasa_pelayanan equals sum of medis and non medis', () => {
    fc.assert(
      fc.property(
        fc.nat(10000000), // jasa_sarana
        fc.nat(10000000), // jasa_pelayanan_medis
        fc.nat(10000000), // jasa_pelayanan_non_medis
        fc.nat(10000000), // unit_cost
        (jasaSarana, jasaPelayananMedis, jasaPelayananNonMedis, unitCost) => {
          const result = calculateTariff({
            jasaSarana,
            jasaPelayananMedis,
            jasaPelayananNonMedis,
            unitCost,
          });
          
          const expectedJasaPelayanan = jasaPelayananMedis + jasaPelayananNonMedis;
          return result.jasaPelayanan === expectedJasaPelayanan;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: perbaikan-ui-multi-fitur, Property 5: Tarif calculation
   * For any values of jasa_sarana and jasa_pelayanan, tarif must equal their sum
   */
  it('Property 5: tarif equals sum of jasa_sarana and jasa_pelayanan', () => {
    fc.assert(
      fc.property(
        fc.nat(10000000),
        fc.nat(10000000),
        fc.nat(10000000),
        fc.nat(10000000),
        (jasaSarana, jasaPelayananMedis, jasaPelayananNonMedis, unitCost) => {
          const result = calculateTariff({
            jasaSarana,
            jasaPelayananMedis,
            jasaPelayananNonMedis,
            unitCost,
          });
          
          const expectedJasaPelayanan = jasaPelayananMedis + jasaPelayananNonMedis;
          const expectedTarif = jasaSarana + expectedJasaPelayanan;
          
          return result.tarif === expectedTarif;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: perbaikan-ui-multi-fitur, Property 6: Prosentase jasa pelayanan formula
   * For any values where tarif > 0, prosentase_jasa_pelayanan must equal
   * (jasa_pelayanan / tarif) * 100, rounded to 2 decimals
   */
  it('Property 6: prosentase_jasa_pelayanan formula is correct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000000 }), // ensure tarif > 0
        fc.nat(10000000),
        fc.nat(10000000),
        fc.nat(10000000),
        (jasaSarana, jasaPelayananMedis, jasaPelayananNonMedis, unitCost) => {
          const result = calculateTariff({
            jasaSarana,
            jasaPelayananMedis,
            jasaPelayananNonMedis,
            unitCost,
          });
          
          const jasaPelayanan = jasaPelayananMedis + jasaPelayananNonMedis;
          const tarif = jasaSarana + jasaPelayanan;
          
          if (tarif === 0) return true; // skip if tarif is 0
          
          const expectedProsentase = roundToTwoDecimals((jasaPelayanan / tarif) * 100);
          return result.prosentaseJasaPelayanan === expectedProsentase;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: perbaikan-ui-multi-fitur, Property 7: Prosentase profit formula
   * For any values where unit_cost > 0, prosentase_profit must equal
   * ((jasa_sarana - unit_cost) / unit_cost) * 100, rounded to 2 decimals
   */
  it('Property 7: prosentase_profit formula is correct', () => {
    fc.assert(
      fc.property(
        fc.nat(10000000),
        fc.nat(10000000),
        fc.nat(10000000),
        fc.integer({ min: 1, max: 10000000 }), // ensure unit_cost > 0
        (jasaSarana, jasaPelayananMedis, jasaPelayananNonMedis, unitCost) => {
          const result = calculateTariff({
            jasaSarana,
            jasaPelayananMedis,
            jasaPelayananNonMedis,
            unitCost,
          });
          
          const expectedProfit = roundToTwoDecimals(
            ((jasaSarana - unitCost) / unitCost) * 100
          );
          
          return result.prosentaseProfit === expectedProfit;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles zero tarif correctly', () => {
    const result = calculateTariff({
      jasaSarana: 0,
      jasaPelayananMedis: 0,
      jasaPelayananNonMedis: 0,
      unitCost: 100000,
    });
    
    expect(result.tarif).toBe(0);
    expect(result.prosentaseJasaPelayanan).toBe(0);
  });

  it('handles zero unit cost correctly', () => {
    const result = calculateTariff({
      jasaSarana: 100000,
      jasaPelayananMedis: 50000,
      jasaPelayananNonMedis: 30000,
      unitCost: 0,
    });
    
    expect(result.prosentaseProfit).toBe(0);
  });

  it('rounds to 2 decimal places correctly', () => {
    expect(roundToTwoDecimals(10.123456)).toBe(10.12);
    expect(roundToTwoDecimals(10.126)).toBe(10.13);
    expect(roundToTwoDecimals(10)).toBe(10);
  });

  it('calculateTotalBudgeting sums all items when no filter', () => {
    const data = [
      { total_rupiah: 1000, nama_unit_kerja: 'Unit A' },
      { total_rupiah: 2000, nama_unit_kerja: 'Unit B' },
      { total_rupiah: 3000, nama_unit_kerja: 'Unit C' },
    ];
    
    const total = calculateTotalBudgeting(data, 'all');
    expect(total).toBe(6000);
  });

  it('calculateTotalBudgeting filters by unit kerja', () => {
    const data = [
      { total_rupiah: 1000, nama_unit_kerja: 'Unit A' },
      { total_rupiah: 2000, nama_unit_kerja: 'Unit B' },
      { total_rupiah: 3000, nama_unit_kerja: 'Unit A' },
    ];
    
    const total = calculateTotalBudgeting(data, 'Unit A');
    expect(total).toBe(4000);
  });
});
