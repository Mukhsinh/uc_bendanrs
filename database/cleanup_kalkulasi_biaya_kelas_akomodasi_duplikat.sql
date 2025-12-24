-- =====================================================
-- CLEANUP DUPLIKAT DATA - KALKULASI BIAYA KELAS AKOMODASI
-- Tanggal: 10 Desember 2024
-- 
-- MASALAH:
-- Ada 17 duplikat baris dengan user_id berbeda untuk unit_kerja & kelas yang sama
-- Total: 22 baris asli, 17 baris duplikat perlu dihapus, sisakan 5 baris unik
--
-- STRATEGI:
-- Simpan hanya baris TERBARU berdasarkan created_at untuk setiap kombinasi:
-- (kode_unit_kerja, kelas, tahun)
-- =====================================================

-- BACKUP TERLEBIH DAHULU (JIKA DIPERLUKAN)
-- CREATE TABLE kalkulasi_biaya_kelas_akomodasi_backup_20241210 AS
-- SELECT * FROM kalkulasi_biaya_kelas_akomodasi WHERE tahun = 2025;

-- STEP 1: ANALISA DATA YANG AKAN DIHAPUS
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  kelas,
  user_id,
  unit_cost_per_kelas,
  created_at,
  ROW_NUMBER() OVER (
    PARTITION BY kode_unit_kerja, kelas, tahun 
    ORDER BY created_at DESC
  ) as row_num,
  CASE 
    WHEN ROW_NUMBER() OVER (
      PARTITION BY kode_unit_kerja, kelas, tahun 
      ORDER BY created_at DESC
    ) = 1 THEN 'KEEP ✓'
    ELSE 'DELETE ✗'
  END as action
FROM kalkulasi_biaya_kelas_akomodasi
WHERE tahun = 2025
ORDER BY kode_unit_kerja, kelas, row_num;

-- STEP 2: HITUNG STATISTIK SEBELUM CLEANUP
SELECT 
  'BEFORE CLEANUP' as status,
  COUNT(*) as total_baris,
  COUNT(DISTINCT kode_unit_kerja) as unique_unit_kerja,
  COUNT(DISTINCT CONCAT(kode_unit_kerja, '-', kelas)) as unique_kombinasi,
  COUNT(DISTINCT user_id) as unique_users
FROM kalkulasi_biaya_kelas_akomodasi
WHERE tahun = 2025;

-- STEP 3: DELETE DUPLIKAT (SIMPAN YANG TERBARU)
-- HATI-HATI: Pastikan backup sudah dibuat sebelum menjalankan query ini!
-- 
-- DELETE FROM kalkulasi_biaya_kelas_akomodasi
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT 
--       id,
--       ROW_NUMBER() OVER (
--         PARTITION BY kode_unit_kerja, kelas, tahun 
--         ORDER BY created_at DESC
--       ) as rn
--     FROM kalkulasi_biaya_kelas_akomodasi
--     WHERE tahun = 2025
--   ) sub
--   WHERE rn > 1
-- );

-- STEP 4: VERIFIKASI SETELAH CLEANUP
-- SELECT 
--   'AFTER CLEANUP' as status,
--   COUNT(*) as total_baris,
--   COUNT(DISTINCT kode_unit_kerja) as unique_unit_kerja,
--   COUNT(DISTINCT CONCAT(kode_unit_kerja, '-', kelas)) as unique_kombinasi,
--   COUNT(DISTINCT user_id) as unique_users
-- FROM kalkulasi_biaya_kelas_akomodasi
-- WHERE tahun = 2025;

-- STEP 5: CEK APAKAH MASIH ADA DUPLIKAT
-- SELECT 
--   kode_unit_kerja,
--   nama_unit_kerja,
--   kelas,
--   COUNT(*) as jumlah_baris
-- FROM kalkulasi_biaya_kelas_akomodasi
-- WHERE tahun = 2025
-- GROUP BY kode_unit_kerja, nama_unit_kerja, kelas, tahun
-- HAVING COUNT(*) > 1;

-- EXPECTED RESULT: 0 rows (tidak ada duplikat lagi)

-- =====================================================
-- ROLLBACK PLAN (JIKA TERJADI KESALAHAN)
-- =====================================================
-- INSERT INTO kalkulasi_biaya_kelas_akomodasi
-- SELECT * FROM kalkulasi_biaya_kelas_akomodasi_backup_20241210;

-- =====================================================
-- ALTERNATIVE SOLUTION: UPDATE UI FILTER
-- =====================================================
-- Jika tidak ingin menghapus data, bisa filter di UI dengan:
-- 1. Ambil user_id dari session
-- 2. Query: WHERE user_id = current_user_id
-- 3. Atau: WHERE user_id = (SELECT MAX(user_id) FROM ... GROUP BY ...)

-- =====================================================
-- CATATAN PENTING
-- =====================================================
-- 1. RUMUS KALKULASI SUDAH BENAR DAN KONSISTEN ✓
-- 2. TIDAK PERLU MENGUBAH RUMUS APAPUN ✓
-- 3. MASALAH HANYA PADA DUPLIKAT DATA ⚠️
-- 4. BACKUP SEBELUM DELETE ‼️
-- 5. TEST DI DEVELOPMENT ENVIRONMENT DULU ‼️







