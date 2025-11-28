-- =====================================================
-- Cleanup: Hapus Data Dummy
-- Tabel: skenario_tarif
-- Tanggal: 27 November 2024
-- =====================================================

-- Masalah:
-- Data dummy "odontektomi2" (kode 3.01.099) tidak memiliki data di tabel sumber
-- Data ini adalah data orphan yang perlu dihapus

-- =====================================================
-- STEP 1: Verifikasi Data Sebelum Dihapus
-- =====================================================

-- Tampilkan data yang akan dihapus
SELECT 
  'Data yang akan dihapus:' as info,
  id,
  kode_unit_kerja,
  nama_unit_kerja,
  kode_tindakan,
  nama_tindakan,
  biaya_bahan,
  unit_cost_per_tindakan,
  sumber_tabel,
  tahun
FROM skenario_tarif
WHERE kode_tindakan = '3.01.099'
  AND LOWER(nama_tindakan) LIKE '%odontektomi2%';

-- =====================================================
-- STEP 2: Hapus Data Dummy
-- =====================================================

-- Hapus data dummy dari skenario_tarif
DELETE FROM skenario_tarif
WHERE kode_tindakan = '3.01.099'
  AND LOWER(nama_tindakan) LIKE '%odontektomi2%';

-- =====================================================
-- STEP 3: Verifikasi Hasil
-- =====================================================

-- Verifikasi data sudah terhapus
SELECT 
  'Verifikasi setelah hapus:' as info,
  COUNT(*) as jumlah_data_tersisa
FROM skenario_tarif
WHERE kode_tindakan = '3.01.099'
  AND LOWER(nama_tindakan) LIKE '%odontektomi2%';

-- Expected: jumlah_data_tersisa = 0

-- Verifikasi statistik keseluruhan
SELECT 
  'Statistik setelah cleanup:' as info,
  COUNT(*) as total_records,
  COUNT(CASE WHEN sumber_tabel = 'kalkulasi_biaya_operatif' THEN 1 END) as records_operatif,
  COUNT(CASE WHEN sumber_tabel = 'kalkulasi_biaya_operatif' AND biaya_bahan > 0 THEN 1 END) as records_with_biaya,
  COUNT(CASE WHEN sumber_tabel = 'kalkulasi_biaya_operatif' AND biaya_bahan = 0 THEN 1 END) as records_still_zero
FROM skenario_tarif;

-- Expected: 
-- - records_operatif: 213 (turun dari 214)
-- - records_with_biaya: 213
-- - records_still_zero: 0 (turun dari 1)

-- =====================================================
-- Hasil yang Diharapkan:
-- - 1 record terhapus (odontektomi2)
-- - Tidak ada lagi data orphan
-- - 100% data tersinkronisasi dengan tabel sumber
-- =====================================================
