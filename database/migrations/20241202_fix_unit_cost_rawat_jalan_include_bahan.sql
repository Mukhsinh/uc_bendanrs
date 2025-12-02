-- Migration: Memperbaiki kolom unit_cost_tindakan_rawat_jalan agar include biaya_bahan_tindakan
-- Tanggal: 2024-12-02
-- Deskripsi: Mengubah formula generated column unit_cost_tindakan_rawat_jalan 
--            agar menyertakan biaya_bahan_tindakan dalam perhitungan total unit cost

-- Drop kolom lama
ALTER TABLE kalkulasi_tindakan_rawat_jalan
DROP COLUMN IF EXISTS unit_cost_tindakan_rawat_jalan;

-- Tambahkan kembali dengan formula yang sudah include biaya_bahan_tindakan
ALTER TABLE kalkulasi_tindakan_rawat_jalan
ADD COLUMN unit_cost_tindakan_rawat_jalan BIGINT GENERATED ALWAYS AS (
  COALESCE(biaya_bahan_tindakan, 0::bigint) +
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

-- Update comment untuk dokumentasi
COMMENT ON COLUMN kalkulasi_tindakan_rawat_jalan.unit_cost_tindakan_rawat_jalan IS 
'Generated column: Total unit cost tindakan rawat jalan (21 komponen biaya termasuk biaya bahan). 
Formula: biaya_bahan_tindakan + SUM(biaya_gaji_tunjangan + biaya_makan_karyawan + biaya_rumah_tangga + 
biaya_cetak + biaya_atk + biaya_listrik + biaya_air + biaya_telp + biaya_pemeliharaan_bangunan + 
biaya_pemeliharaan_alat_medis + biaya_pemeliharaan_alat_non_medis + biaya_operasional_lainnya + 
biaya_penyusutan_gedung + biaya_penyusutan_jaringan + biaya_penyusutan_alat_medis + 
biaya_penyusutan_alat_non_medis + biaya_pendidikan_pelatihan + biaya_laundry + 
biaya_sterilisasi + biaya_tidak_langsung_terdistribusi).
Digunakan untuk proses "Perbarui Data" di halaman Skenario Tarif.';

-- Verifikasi perubahan
SELECT 
    column_name,
    data_type,
    is_generated,
    LEFT(generation_expression, 100) as formula_preview
FROM information_schema.columns
WHERE table_name = 'kalkulasi_tindakan_rawat_jalan'
  AND column_name = 'unit_cost_tindakan_rawat_jalan';
