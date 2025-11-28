-- Migration: Menambahkan kolom unit_cost_tindakan_inap sebagai GENERATED COLUMN
-- Date: 2024-11-27
-- Purpose: Menambahkan kolom unit_cost_tindakan_inap untuk kalkulasi otomatis total biaya

-- Step 1: Tambahkan kolom unit_cost_tindakan_inap sebagai GENERATED COLUMN
ALTER TABLE kalkulasi_tindakan_inap
ADD COLUMN IF NOT EXISTS unit_cost_tindakan_inap BIGINT
GENERATED ALWAYS AS (
  COALESCE(biaya_gaji_tunjangan, 0) +
  COALESCE(biaya_makan_karyawan, 0) +
  COALESCE(biaya_rumah_tangga, 0) +
  COALESCE(biaya_cetak, 0) +
  COALESCE(biaya_atk, 0) +
  COALESCE(biaya_listrik, 0) +
  COALESCE(biaya_air, 0) +
  COALESCE(biaya_telp, 0) +
  COALESCE(biaya_pemeliharaan_bangunan, 0) +
  COALESCE(biaya_pemeliharaan_alat_medis, 0) +
  COALESCE(biaya_pemeliharaan_alat_non_medis, 0) +
  COALESCE(biaya_operasional_lainnya, 0) +
  COALESCE(biaya_penyusutan_gedung, 0) +
  COALESCE(biaya_penyusutan_jaringan, 0) +
  COALESCE(biaya_penyusutan_alat_medis, 0) +
  COALESCE(biaya_penyusutan_alat_non_medis, 0) +
  COALESCE(biaya_pendidikan_pelatihan, 0) +
  COALESCE(biaya_laundry, 0) +
  COALESCE(biaya_sterilisasi, 0) +
  COALESCE(biaya_tidak_langsung_terdistribusi, 0) +
  COALESCE(biaya_bhp, 0)
) STORED;

-- Step 2: Tambahkan index untuk performa query
CREATE INDEX IF NOT EXISTS idx_kalkulasi_tindakan_inap_unit_cost 
ON kalkulasi_tindakan_inap(unit_cost_tindakan_inap);

-- Step 3: Tambahkan comment untuk dokumentasi
COMMENT ON COLUMN kalkulasi_tindakan_inap.unit_cost_tindakan_inap IS 
'Generated column: Total unit cost tindakan inap (21 komponen biaya). 
Formula: SUM(biaya_gaji_tunjangan + biaya_makan_karyawan + biaya_rumah_tangga + 
biaya_cetak + biaya_atk + biaya_listrik + biaya_air + biaya_telp + 
biaya_pemeliharaan_bangunan + biaya_pemeliharaan_alat_medis + 
biaya_pemeliharaan_alat_non_medis + biaya_operasional_lainnya + 
biaya_penyusutan_gedung + biaya_penyusutan_jaringan + 
biaya_penyusutan_alat_medis + biaya_penyusutan_alat_non_medis + 
biaya_pendidikan_pelatihan + biaya_laundry + biaya_sterilisasi + 
biaya_tidak_langsung_terdistribusi + biaya_bhp).
CATATAN: Tidak termasuk biaya_bahan_tindakan (kolom terpisah).';
