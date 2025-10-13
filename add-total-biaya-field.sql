-- Script untuk menambahkan field total_biaya ke tabel data_biaya
-- Field ini akan menghitung total dari semua field biaya individual (TIDAK termasuk computed fields)

-- 1. Hapus kolom total_biaya yang lama jika ada
ALTER TABLE data_biaya DROP COLUMN IF EXISTS total_biaya;

-- 2. Tambahkan kolom total_biaya yang baru
-- Hanya menghitung field biaya individual, TIDAK termasuk computed fields seperti:
-- biaya_bahan, biaya_pegawai, biaya_daya, biaya_pemeliharaan, biaya_penyusutan
ALTER TABLE data_biaya 
ADD COLUMN total_biaya DECIMAL(15,2) GENERATED ALWAYS AS (
  COALESCE(biaya_gaji_tunjangan, 0) +
  COALESCE(biaya_jasa_pelayanan, 0) +
  COALESCE(biaya_obat, 0) +
  COALESCE(biaya_bhp, 0) +
  COALESCE(biaya_makan_karyawan, 0) +
  COALESCE(biaya_makan_pasien, 0) +
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
  COALESCE(biaya_pendidikan_pelatihan, 0)
) STORED;

-- 2. Verifikasi bahwa kolom telah ditambahkan
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  generation_expression
FROM information_schema.columns 
WHERE table_name = 'data_biaya' 
  AND table_schema = 'public'
  AND column_name = 'total_biaya';

-- 3. Test query untuk memverifikasi perhitungan total_biaya
SELECT 
  id,
  tahun,
  unit_kerja_id,
  biaya_gaji_tunjangan,
  biaya_jasa_pelayanan,
  biaya_obat,
  biaya_bhp,
  biaya_makan_karyawan,
  biaya_makan_pasien,
  biaya_rumah_tangga,
  biaya_cetak,
  biaya_atk,
  biaya_listrik,
  biaya_air,
  biaya_telp,
  biaya_pemeliharaan_bangunan,
  biaya_pemeliharaan_alat_medis,
  biaya_pemeliharaan_alat_non_medis,
  biaya_operasional_lainnya,
  biaya_penyusutan_gedung,
  biaya_penyusutan_jaringan,
  biaya_penyusutan_alat_medis,
  biaya_penyusutan_alat_non_medis,
  biaya_pendidikan_pelatihan,
  total_biaya
FROM data_biaya 
LIMIT 5;

-- 4. Update komentar untuk dokumentasi
COMMENT ON COLUMN data_biaya.total_biaya IS 'Total biaya yang dihitung dari penjumlahan semua field biaya individual (tidak termasuk computed fields seperti biaya_bahan, biaya_pegawai, dll)';
