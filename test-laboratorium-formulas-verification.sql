-- Test script untuk memverifikasi rumus kalkulasi biaya laboratorium
-- Memastikan rumus diterapkan sesuai permintaan

-- 1. Cek data sebelum perbaikan
SELECT 
  'BEFORE CORRECTION - Current State' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN jumlah = 0 THEN 1 END) as zero_quantity_records,
  ROUND(AVG(hasil_kali), 2) as avg_hasil_kali,
  ROUND(AVG(hasil_kali_waktu), 2) as avg_hasil_kali_waktu,
  ROUND(AVG(dasar_alokasi_hasil_kali), 6) as avg_dasar_alokasi_hasil_kali,
  ROUND(AVG(dasar_alokasi_waktu), 6) as avg_dasar_alokasi_waktu
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 AND kode_unit_kerja = 'UK038';

-- 2. Tampilkan beberapa contoh data untuk verifikasi rumus
SELECT 
  'Sample Records for Formula Verification' as info,
  id,
  nama_pemeriksaan,
  jumlah,
  waktu_pemeriksaan,
  profesionalisme,
  tingkat_kesulitan,
  hasil_kali,
  hasil_kali_waktu,
  dasar_alokasi_hasil_kali,
  dasar_alokasi_waktu
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah > 0
LIMIT 5;

-- 3. Verifikasi rumus hasil_kali = jumlah × waktu_pemeriksaan
SELECT 
  'Verification - hasil_kali formula' as check,
  COUNT(*) as total_records,
  COUNT(CASE WHEN hasil_kali = (jumlah * waktu_pemeriksaan) THEN 1 END) as correct_formula,
  COUNT(CASE WHEN hasil_kali != (jumlah * waktu_pemeriksaan) THEN 1 END) as incorrect_formula,
  CASE 
    WHEN COUNT(CASE WHEN hasil_kali != (jumlah * waktu_pemeriksaan) THEN 1 END) = 0 
    THEN '✅ PASS - All hasil_kali calculations are correct'
    ELSE '❌ FAIL - Some hasil_kali calculations are incorrect'
  END as result
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah > 0;

-- 4. Verifikasi rumus hasil_kali_waktu = jumlah × waktu × profesionalisme × kesulitan
SELECT 
  'Verification - hasil_kali_waktu formula' as check,
  COUNT(*) as total_records,
  COUNT(CASE WHEN hasil_kali_waktu = (jumlah * waktu_pemeriksaan * profesionalisme * tingkat_kesulitan) THEN 1 END) as correct_formula,
  COUNT(CASE WHEN hasil_kali_waktu != (jumlah * waktu_pemeriksaan * profesionalisme * tingkat_kesulitan) THEN 1 END) as incorrect_formula,
  CASE 
    WHEN COUNT(CASE WHEN hasil_kali_waktu != (jumlah * waktu_pemeriksaan * profesionalisme * tingkat_kesulitan) THEN 1 END) = 0 
    THEN '✅ PASS - All hasil_kali_waktu calculations are correct'
    ELSE '❌ FAIL - Some hasil_kali_waktu calculations are incorrect'
  END as result
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah > 0;

-- 5. Hitung total untuk verifikasi dasar alokasi
WITH totals AS (
  SELECT 
    SUM(hasil_kali) as total_hasil_kali,
    SUM(hasil_kali_waktu) as total_hasil_kali_waktu
  FROM kalkulasi_biaya_laboratorium 
  WHERE tahun = 2025 
    AND kode_unit_kerja = 'UK038' 
    AND jumlah > 0
)
SELECT 
  'Total Calculations for Dasar Alokasi' as info,
  total_hasil_kali,
  total_hasil_kali_waktu
FROM totals;

-- 6. Verifikasi rumus dasar_alokasi_hasil_kali = hasil_kali ÷ total_hasil_kali (6 desimal)
WITH totals AS (
  SELECT 
    SUM(hasil_kali) as total_hasil_kali
  FROM kalkulasi_biaya_laboratorium 
  WHERE tahun = 2025 
    AND kode_unit_kerja = 'UK038' 
    AND jumlah > 0
)
SELECT 
  'Verification - dasar_alokasi_hasil_kali formula' as check,
  COUNT(*) as total_records,
  COUNT(CASE WHEN ABS(dasar_alokasi_hasil_kali - ROUND((hasil_kali::numeric / t.total_hasil_kali)::numeric, 6)) < 0.000001 THEN 1 END) as correct_formula,
  COUNT(CASE WHEN ABS(dasar_alokasi_hasil_kali - ROUND((hasil_kali::numeric / t.total_hasil_kali)::numeric, 6)) >= 0.000001 THEN 1 END) as incorrect_formula,
  CASE 
    WHEN COUNT(CASE WHEN ABS(dasar_alokasi_hasil_kali - ROUND((hasil_kali::numeric / t.total_hasil_kali)::numeric, 6)) >= 0.000001 THEN 1 END) = 0 
    THEN '✅ PASS - All dasar_alokasi_hasil_kali calculations are correct'
    ELSE '❌ FAIL - Some dasar_alokasi_hasil_kali calculations are incorrect'
  END as result
FROM kalkulasi_biaya_laboratorium k, totals t
WHERE k.tahun = 2025 
  AND k.kode_unit_kerja = 'UK038' 
  AND k.jumlah > 0;

-- 7. Verifikasi rumus dasar_alokasi_waktu = hasil_kali_waktu ÷ total_hasil_kali_waktu (6 desimal)
WITH totals AS (
  SELECT 
    SUM(hasil_kali_waktu) as total_hasil_kali_waktu
  FROM kalkulasi_biaya_laboratorium 
  WHERE tahun = 2025 
    AND kode_unit_kerja = 'UK038' 
    AND jumlah > 0
)
SELECT 
  'Verification - dasar_alokasi_waktu formula' as check,
  COUNT(*) as total_records,
  COUNT(CASE WHEN ABS(dasar_alokasi_waktu - ROUND((hasil_kali_waktu::numeric / t.total_hasil_kali_waktu)::numeric, 6)) < 0.000001 THEN 1 END) as correct_formula,
  COUNT(CASE WHEN ABS(dasar_alokasi_waktu - ROUND((hasil_kali_waktu::numeric / t.total_hasil_kali_waktu)::numeric, 6)) >= 0.000001 THEN 1 END) as incorrect_formula,
  CASE 
    WHEN COUNT(CASE WHEN ABS(dasar_alokasi_waktu - ROUND((hasil_kali_waktu::numeric / t.total_hasil_kali_waktu)::numeric, 6)) >= 0.000001 THEN 1 END) = 0 
    THEN '✅ PASS - All dasar_alokasi_waktu calculations are correct'
    ELSE '❌ FAIL - Some dasar_alokasi_waktu calculations are incorrect'
  END as result
FROM kalkulasi_biaya_laboratorium k, totals t
WHERE k.tahun = 2025 
  AND k.kode_unit_kerja = 'UK038' 
  AND k.jumlah > 0;

-- 8. Cek apakah semua nilai dasar alokasi memiliki 6 desimal
SELECT 
  'Verification - Decimal Places' as check,
  COUNT(*) as total_records,
  COUNT(CASE WHEN LENGTH(SPLIT_PART(dasar_alokasi_hasil_kali::text, '.', 2)) = 6 THEN 1 END) as correct_decimal_hasil_kali,
  COUNT(CASE WHEN LENGTH(SPLIT_PART(dasar_alokasi_waktu::text, '.', 2)) = 6 THEN 1 END) as correct_decimal_waktu,
  CASE 
    WHEN COUNT(CASE WHEN LENGTH(SPLIT_PART(dasar_alokasi_hasil_kali::text, '.', 2)) != 6 THEN 1 END) = 0 
      AND COUNT(CASE WHEN LENGTH(SPLIT_PART(dasar_alokasi_waktu::text, '.', 2)) != 6 THEN 1 END) = 0
    THEN '✅ PASS - All decimal places are correct (6 digits)'
    ELSE '❌ FAIL - Some decimal places are incorrect'
  END as result
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah > 0;

-- 9. Cek penanganan jumlah = 0
SELECT 
  'Verification - Zero Quantity Handling' as check,
  COUNT(*) as zero_quantity_records,
  COUNT(CASE WHEN hasil_kali = 0 THEN 1 END) as zero_hasil_kali,
  COUNT(CASE WHEN hasil_kali_waktu = 0 THEN 1 END) as zero_hasil_kali_waktu,
  COUNT(CASE WHEN dasar_alokasi_hasil_kali = 0 THEN 1 END) as zero_dasar_alokasi_hasil_kali,
  COUNT(CASE WHEN dasar_alokasi_waktu = 0 THEN 1 END) as zero_dasar_alokasi_waktu,
  CASE 
    WHEN COUNT(CASE WHEN hasil_kali != 0 OR hasil_kali_waktu != 0 OR dasar_alokasi_hasil_kali != 0 OR dasar_alokasi_waktu != 0 THEN 1 END) = 0
    THEN '✅ PASS - All zero quantity records have zero values'
    ELSE '❌ FAIL - Some zero quantity records have non-zero values'
  END as result
FROM kalkulasi_biaya_laboratorium 
WHERE tahun = 2025 
  AND kode_unit_kerja = 'UK038' 
  AND jumlah = 0;

