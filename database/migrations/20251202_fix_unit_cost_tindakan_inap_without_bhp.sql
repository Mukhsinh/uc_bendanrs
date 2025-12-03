-- Migration: Memperbaiki kolom unit_cost_tindakan_inap agar tidak mereferensikan kolom biaya_bhp
-- Tanggal: 2025-12-02
-- Deskripsi:
--   - Di beberapa lingkungan, tabel kalkulasi_tindakan_inap tidak memiliki kolom biaya_bhp
--   - Namun generated column unit_cost_tindakan_inap sebelumnya menggunakan biaya_bhp dalam formulanya
--   - Hal ini menyebabkan error Postgres: `record "new" has no field "biaya_bhp"` ketika fungsi rekalkulasi dijalankan
--   - Migration ini menjatuhkan kolom generated lama (jika ada) dan menambahkannya kembali
--     dengan formula yang tidak lagi menggunakan biaya_bhp.

-- Drop kolom generated lama jika sudah ada
ALTER TABLE kalkulasi_tindakan_inap
DROP COLUMN IF EXISTS unit_cost_tindakan_inap;

-- Tambahkan kembali kolom unit_cost_tindakan_inap tanpa referensi ke biaya_bhp
ALTER TABLE kalkulasi_tindakan_inap
ADD COLUMN unit_cost_tindakan_inap BIGINT GENERATED ALWAYS AS (
  COALESCE(biaya_gaji_tunjangan, 0::bigint) +
  COALESCE(biaya_makan_karyawan, 0::bigint) +
  COALESCE(biaya_rumah_tangga, 0::bigint) +
  COALESCE(biaya_cetak, 0::bigint) +
  COALESCE(biaya_atk, 0::bigint) +
  COALESCE(biaya_listrik, 0::bigint) +
  COALESCE(biaya_air, 0::bigint) +
  COALESCE(biaya_telp, 0::bigint) +
  COALESCE(biaya_pemeliharaan_bangunan, 0::bigint) +
  COALESCE(biaya_pemeliharaan_alat_medis, 0::bigint) +
  COALESCE(biaya_pemeliharaan_alat_non_medis, 0::bigint) +
  COALESCE(biaya_operasional_lainnya, 0::bigint) +
  COALESCE(biaya_penyusutan_gedung, 0::bigint) +
  COALESCE(biaya_penyusutan_jaringan, 0::bigint) +
  COALESCE(biaya_penyusutan_alat_medis, 0::bigint) +
  COALESCE(biaya_penyusutan_alat_non_medis, 0::bigint) +
  COALESCE(biaya_pendidikan_pelatihan, 0::bigint) +
  COALESCE(biaya_laundry, 0::bigint) +
  COALESCE(biaya_sterilisasi, 0::bigint) +
  COALESCE(biaya_tidak_langsung_terdistribusi, 0::bigint)
) STORED;

-- Update comment dokumentasi agar konsisten dengan formula baru
COMMENT ON COLUMN kalkulasi_tindakan_inap.unit_cost_tindakan_inap IS 
'Generated column: Total unit cost tindakan inap (20 komponen biaya, tanpa biaya_bhp).
Formula: SUM(biaya_gaji_tunjangan + biaya_makan_karyawan + biaya_rumah_tangga +
biaya_cetak + biaya_atk + biaya_listrik + biaya_air + biaya_telp +
biaya_pemeliharaan_bangunan + biaya_pemeliharaan_alat_medis +
biaya_pemeliharaan_alat_non_medis + biaya_operasional_lainnya +
biaya_penyusutan_gedung + biaya_penyusutan_jaringan +
biaya_penyusutan_alat_medis + biaya_penyusutan_alat_non_medis +
biaya_pendidikan_pelatihan + biaya_laundry + biaya_sterilisasi +
biaya_tidak_langsung_terdistribusi).
CATATAN: Tidak termasuk biaya_bahan_tindakan (kolom terpisah).';

-- Verifikasi perubahan struktur kolom di database
SELECT 
    column_name,
    data_type,
    is_generated,
    LEFT(generation_expression, 120) AS formula_preview
FROM information_schema.columns
WHERE table_name = 'kalkulasi_tindakan_inap'
  AND column_name = 'unit_cost_tindakan_inap';


