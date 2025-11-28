-- =====================================================
-- Fix: Perbaiki sumber_tabel dan Sinkronisasi biaya_bahan
-- Tabel: skenario_tarif
-- Tanggal: 27 November 2024
-- =====================================================

-- Masalah:
-- 1. skenario_tarif memiliki sumber_tabel = 'kalkulasi_tindakan_operatif' (tabel tidak ada)
-- 2. Seharusnya sumber_tabel = 'kalkulasi_biaya_operatif' (tabel yang benar)
-- 3. Akibatnya biaya_bahan tidak tersinkronisasi (214 records = 0)
-- 4. Constraint check tidak mengizinkan nama tabel yang benar

-- =====================================================
-- STEP 0: Perbaiki Constraint Check
-- =====================================================

-- Drop constraint lama yang mengizinkan nama tabel yang salah
ALTER TABLE skenario_tarif 
DROP CONSTRAINT IF EXISTS skenario_tarif_sumber_tabel_check;

-- =====================================================
-- STEP 1: Update sumber_tabel yang Salah
-- =====================================================

-- Update sumber_tabel dari 'kalkulasi_tindakan_operatif' ke 'kalkulasi_biaya_operatif'
UPDATE skenario_tarif
SET sumber_tabel = 'kalkulasi_biaya_operatif'
WHERE sumber_tabel = 'kalkulasi_tindakan_operatif';

-- =====================================================
-- STEP 1.5: Buat Constraint Baru dengan Nama yang Benar
-- =====================================================

-- Buat constraint baru yang mengizinkan nama tabel yang benar
ALTER TABLE skenario_tarif 
ADD CONSTRAINT skenario_tarif_sumber_tabel_check 
CHECK (sumber_tabel = ANY (ARRAY[
  'kalkulasi_biaya_laboratorium'::text, 
  'kalkulasi_biaya_radiologi'::text, 
  'kalkulasi_bdrs'::text, 
  'kalkulasi_tindakan_inap'::text, 
  'kalkulasi_tindakan_rawat_jalan'::text, 
  'kalkulasi_biaya_operatif'::text,  -- DIGANTI dari kalkulasi_tindakan_operatif
  'kalkulasi_biaya_cathlab'::text
]));

-- Verifikasi perubahan
SELECT 
  'Step 1: Update sumber_tabel' as step,
  COUNT(*) as records_updated
FROM skenario_tarif
WHERE sumber_tabel = 'kalkulasi_biaya_operatif';

-- =====================================================
-- STEP 2: Sinkronisasi biaya_bahan dari Tabel Sumber
-- =====================================================

-- Update biaya_bahan dari kalkulasi_biaya_operatif
UPDATE skenario_tarif st
SET 
  biaya_bahan = COALESCE(ko.biaya_bahan_pemeriksaan_numeric, 0),
  unit_cost_per_tindakan = COALESCE(ko.unit_cost_per_tindakan, 0),
  jasa_sarana = COALESCE(ko.unit_cost_per_tindakan, 0),
  nama_operator = COALESCE(ko.nama_operator_spesialistik, st.nama_operator),
  updated_at = NOW()
FROM kalkulasi_biaya_operatif ko
WHERE st.sumber_tabel = 'kalkulasi_biaya_operatif'
  AND st.kode_unit_kerja = ko.kode_unit_kerja
  AND st.kode_tindakan = ko.kode
  AND st.tahun = ko.tahun
  AND (st.user_id = ko.user_id OR (st.user_id IS NULL AND ko.user_id IS NULL))
  AND st.biaya_bahan = 0;  -- Hanya update yang masih 0

-- =====================================================
-- STEP 3: Verifikasi Hasil
-- =====================================================

-- Verifikasi statistik
SELECT 
  'Step 3: Verifikasi Statistik' as step,
  COUNT(*) as total_records,
  COUNT(CASE WHEN sumber_tabel = 'kalkulasi_biaya_operatif' THEN 1 END) as records_operatif,
  COUNT(CASE WHEN sumber_tabel = 'kalkulasi_biaya_operatif' AND biaya_bahan > 0 THEN 1 END) as records_with_biaya,
  COUNT(CASE WHEN sumber_tabel = 'kalkulasi_biaya_operatif' AND biaya_bahan = 0 THEN 1 END) as records_still_zero,
  SUM(CASE WHEN sumber_tabel = 'kalkulasi_biaya_operatif' THEN biaya_bahan ELSE 0 END) as total_biaya_bahan
FROM skenario_tarif;

-- Verifikasi beberapa contoh data
SELECT 
  'Step 3: Verifikasi Sinkronisasi' as step,
  st.kode_unit_kerja,
  st.nama_unit_kerja,
  st.kode_tindakan,
  st.nama_tindakan,
  st.biaya_bahan as biaya_bahan_skenario,
  ko.biaya_bahan_pemeriksaan_numeric as biaya_bahan_sumber,
  CASE 
    WHEN st.biaya_bahan = ko.biaya_bahan_pemeriksaan_numeric THEN '✓ SINKRON'
    ELSE '✗ TIDAK SINKRON'
  END as status_sinkronisasi
FROM skenario_tarif st
JOIN kalkulasi_biaya_operatif ko 
  ON st.kode_unit_kerja = ko.kode_unit_kerja
  AND st.kode_tindakan = ko.kode
  AND st.tahun = ko.tahun
WHERE st.sumber_tabel = 'kalkulasi_biaya_operatif'
ORDER BY st.biaya_bahan DESC
LIMIT 10;

-- Cek record yang masih 0 (jika ada)
SELECT 
  'Step 3: Record yang Masih 0' as step,
  st.kode_unit_kerja,
  st.nama_unit_kerja,
  st.kode_tindakan,
  st.nama_tindakan,
  st.biaya_bahan,
  'Data tidak ada di tabel sumber' as alasan
FROM skenario_tarif st
WHERE st.sumber_tabel = 'kalkulasi_biaya_operatif'
  AND st.biaya_bahan = 0;

-- =====================================================
-- Hasil yang Diharapkan:
-- - records_operatif: 214
-- - records_with_biaya: 213
-- - records_still_zero: 1 (data orphan: 3.01.099 - odontektomi2)
-- - total_biaya_bahan: 136,153,117
-- - Semua status_sinkronisasi: ✓ SINKRON
-- =====================================================
