/**
 * Shared calculation utilities for tariff calculations
 * Used across SkenarioTarif and SkenarioTarifAkomodasi modules
 */

export interface TariffCalculationInput {
  jasaSarana: number;
  jasaPelayananMedis: number;
  jasaPelayananNonMedis: number;
  unitCost: number;
}

export interface TariffCalculationResult {
  jasaPelayanan: number;
  tarif: number;
  prosentaseJasaPelayanan: number;
  prosentaseProfit: number;
}

/**
 * Calculate tariff components based on input values
 * 
 * Formulas:
 * - jasa_pelayanan = jasa_pelayanan_medis + jasa_pelayanan_non_medis
 * - tarif = jasa_sarana + jasa_pelayanan
 * - prosentase_jasa_pelayanan = (jasa_pelayanan / tarif) * 100
 * - prosentase_profit = ((jasa_sarana - unit_cost) / unit_cost) * 100
 */
export const calculateTariff = (
  input: TariffCalculationInput
): TariffCalculationResult => {
  const jasaPelayanan = input.jasaPelayananMedis + input.jasaPelayananNonMedis;
  const tarif = input.jasaSarana + jasaPelayanan;
  
  const prosentaseJasaPelayanan = tarif > 0 
    ? (jasaPelayanan / tarif) * 100 
    : 0;
  
  const prosentaseProfit = input.unitCost > 0 
    ? ((input.jasaSarana - input.unitCost) / input.unitCost) * 100 
    : 0;
  
  return {
    jasaPelayanan,
    tarif,
    prosentaseJasaPelayanan: roundToTwoDecimals(prosentaseJasaPelayanan),
    prosentaseProfit: roundToTwoDecimals(prosentaseProfit),
  };
};

/**
 * Round a number to 2 decimal places
 */
export const roundToTwoDecimals = (value: number): number => 
  Math.round(value * 100) / 100;

/**
 * Calculate total budgeting from rincian data with optional filtering
 */
export const calculateTotalBudgeting = (
  rawData: Array<{ total_rupiah: number; nama_unit_kerja?: string }>,
  selectedUnit: string = "all"
): number => {
  const filteredData = selectedUnit === "all" 
    ? rawData 
    : rawData.filter(item => item.nama_unit_kerja === selectedUnit);
  
  return filteredData.reduce((sum, item) => sum + (Number(item.total_rupiah) || 0), 0);
};
