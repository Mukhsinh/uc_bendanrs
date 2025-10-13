-- Script untuk menambahkan field total_biaya_tanpa_jp ke tabel data_biaya
-- Field ini akan menghitung total biaya dikurangi biaya jasa pelayanan

-- 1. Tambahkan kolom total_biaya_tanpa_jp ke tabel data_biaya
-- Menggunakan perhitungan langsung karena tidak bisa mereferensi generated column lain
ALTER TABLE data_biaya 
ADD COLUMN total_biaya_tanpa_jp DECIMAL(15,2) GENERATED ALWAYS AS (
  (
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
  ) - COALESCE(biaya_jasa_pelayanan, 0)
) STORED;

-- 2. Update komentar untuk dokumentasi
COMMENT ON COLUMN data_biaya.total_biaya_tanpa_jp IS 'Total biaya dikurangi biaya jasa pelayanan (total_biaya - biaya_jasa_pelayanan)';

-- 3. Verifikasi bahwa kolom telah ditambahkan
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  generation_expression
FROM information_schema.columns 
WHERE table_name = 'data_biaya' 
  AND table_schema = 'public'
  AND column_name = 'total_biaya_tanpa_jp';

-- 4. Test query untuk memverifikasi perhitungan
SELECT 
  id,
  tahun,
  unit_kerja_id,
  biaya_jasa_pelayanan,
  total_biaya,
  total_biaya_tanpa_jp,
  -- Manual verification: total_biaya - biaya_jasa_pelayanan
  (total_biaya - COALESCE(biaya_jasa_pelayanan, 0)) AS manual_calculation
FROM data_biaya 
LIMIT 5;
