-- Test script untuk memverifikasi perbaikan masalah jumlah = 0 dan timeout
-- Jalankan script ini untuk melihat perbedaan sebelum dan sesudah perbaikan

-- 1. Cek data sebelum perbaikan
SELECT 
  'BEFORE FIX - Current State' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN jumlah = 0 THEN 1 END) as zero_quantity_records,
  COUNT(CASE WHEN jumlah = 0 AND biaya_gaji_tunjangan = 0 THEN 1 END) as zero_quantity_with_zero_cost,
  COUNT(CASE WHEN jumlah = 0 AND biaya_gaji_tunjangan > 0 THEN 1 END) as zero_quantity_with_non_zero_cost,
  ROUND(AVG(CASE WHEN jumlah = 0 THEN biaya_gaji_tunjangan END), 2) as avg_cost_for_zero_quantity
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 AND kode_unit_kerja = 'UK038';

-- 2. Tampilkan beberapa contoh data dengan jumlah = 0 (sebelum perbaikan)
SELECT 
  'Sample Zero Quantity Records (BEFORE FIX)' as info,
  id,
  nama_pemeriksaan,
  jumlah,
  biaya_gaji_tunjangan,
  biaya_jasa_pelayanan,
  biaya_obat,
  biaya_bhp,
  dasar_alokasi_hasil_kali,
  dasar_alokasi_waktu
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah = 0
LIMIT 5;

-- 3. Cek distribusi nilai jumlah
SELECT 
  'Quantity Distribution' as info,
  jumlah,
  COUNT(*) as count,
  ROUND(AVG(biaya_gaji_tunjangan), 2) as avg_biaya_gaji_tunjangan,
  ROUND(AVG(biaya_obat), 2) as avg_biaya_obat
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 AND kode_unit_kerja = 'UK038'
GROUP BY jumlah
ORDER BY jumlah;

-- 4. Cek apakah ada data yang jumlah = 0 tapi biaya > 0 (masalah yang harus diperbaiki)
SELECT 
  'PROBLEM RECORDS - Zero quantity but non-zero cost' as issue,
  COUNT(*) as problem_count
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah = 0 
  AND (
    biaya_gaji_tunjangan > 0 OR 
    biaya_jasa_pelayanan > 0 OR 
    biaya_obat > 0 OR 
    biaya_bhp > 0
  );

-- 5. Test fungsi yang diperbaiki (jalankan setelah menerapkan perbaikan)
-- Uncomment bagian ini setelah menjalankan fix-laboratorium-timeout-and-zero-division.sql
/*
-- Test rekalkulasi dengan fungsi yang diperbaiki
SELECT manual_recalculate_laboratorium(2025, 'your_user_id_here');

-- 6. Verifikasi setelah perbaikan
SELECT 
  'AFTER FIX - Verification' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN jumlah = 0 THEN 1 END) as zero_quantity_records,
  COUNT(CASE WHEN jumlah = 0 AND biaya_gaji_tunjangan = 0 THEN 1 END) as zero_quantity_with_zero_cost,
  COUNT(CASE WHEN jumlah = 0 AND biaya_gaji_tunjangan > 0 THEN 1 END) as zero_quantity_with_non_zero_cost,
  ROUND(AVG(CASE WHEN jumlah = 0 THEN biaya_gaji_tunjangan END), 2) as avg_cost_for_zero_quantity
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 AND kode_unit_kerja = 'UK038';

-- 7. Verifikasi bahwa semua biaya untuk jumlah = 0 adalah 0
SELECT 
  'VERIFICATION - All zero quantity records should have zero costs' as check,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All zero quantity records have zero costs'
    ELSE '❌ FAIL - Some zero quantity records still have non-zero costs'
  END as result
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah = 0 
  AND (
    biaya_gaji_tunjangan > 0 OR 
    biaya_jasa_pelayanan > 0 OR 
    biaya_obat > 0 OR 
    biaya_bhp > 0 OR
    biaya_makan_karyawan > 0 OR
    biaya_makan_pasien > 0 OR
    biaya_rumah_tangga > 0 OR
    biaya_cetak > 0 OR
    biaya_atk > 0 OR
    biaya_listrik > 0 OR
    biaya_air > 0 OR
    biaya_telp > 0 OR
    biaya_pemeliharaan_bangunan > 0 OR
    biaya_pemeliharaan_alat_medis > 0 OR
    biaya_pemeliharaan_alat_non_medis > 0 OR
    biaya_operasional_lainnya > 0 OR
    biaya_penyusutan_gedung > 0 OR
    biaya_penyusutan_jaringan > 0 OR
    biaya_penyusutan_alat_medis > 0 OR
    biaya_penyusutan_alat_non_medis > 0 OR
    biaya_pendidikan_pelatihan > 0 OR
    biaya_laundry > 0 OR
    biaya_sterilisasi > 0 OR
    biaya_tidak_langsung_terdistribusi > 0
  );

-- 8. Tampilkan contoh data dengan jumlah = 0 (setelah perbaikan)
SELECT 
  'Sample Zero Quantity Records (AFTER FIX)' as info,
  id,
  nama_pemeriksaan,
  jumlah,
  biaya_gaji_tunjangan,
  biaya_jasa_pelayanan,
  biaya_obat,
  biaya_bhp,
  dasar_alokasi_hasil_kali,
  dasar_alokasi_waktu
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah = 0
LIMIT 5;
*/
