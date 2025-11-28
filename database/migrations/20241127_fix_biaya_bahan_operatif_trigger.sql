-- =====================================================
-- Fix: Tambah Trigger untuk Menghitung biaya_bahan_pemeriksaan_numeric
-- Tabel: kalkulasi_biaya_operatif
-- Tanggal: 27 November 2024
-- =====================================================

-- Masalah: Kolom biaya_bahan_pemeriksaan_numeric bernilai 0 padahal bahan_pemeriksaan (JSONB) ada
-- Penyebab: Trigger BEFORE untuk kalkulasi otomatis tidak ada
-- Solusi: Tambahkan trigger yang sama seperti di tabel kalkulasi lainnya

-- =====================================================
-- STEP 1: Perbaiki Constraint Check di rekapitulasi_unit_cost
-- =====================================================

-- Constraint lama tidak mengizinkan 'kalkulasi_biaya_operatif'
ALTER TABLE rekapitulasi_unit_cost 
DROP CONSTRAINT IF EXISTS rekapitulasi_unit_cost_sumber_tabel_check;

-- Tambahkan 'kalkulasi_biaya_operatif' ke daftar yang diizinkan
ALTER TABLE rekapitulasi_unit_cost 
ADD CONSTRAINT rekapitulasi_unit_cost_sumber_tabel_check 
CHECK (sumber_tabel = ANY (ARRAY[
  'kalkulasi_biaya_laboratorium'::text, 
  'kalkulasi_biaya_radiologi'::text, 
  'kalkulasi_bdrs'::text, 
  'kalkulasi_tindakan_inap'::text, 
  'kalkulasi_tindakan_rawat_jalan'::text, 
  'kalkulasi_tindakan_operatif'::text,
  'kalkulasi_biaya_operatif'::text,  -- DITAMBAHKAN
  'kalkulasi_biaya_cathlab'::text
]));

-- =====================================================
-- STEP 2: Buat Trigger untuk Kalkulasi Otomatis
-- =====================================================

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS trigger_calculate_biaya_bahan_operatif ON kalkulasi_biaya_operatif;

-- Buat trigger BEFORE INSERT dan UPDATE
-- Menggunakan fungsi calculate_biaya_bahan_pemeriksaan() yang sudah ada
CREATE TRIGGER trigger_calculate_biaya_bahan_operatif
  BEFORE INSERT OR UPDATE ON kalkulasi_biaya_operatif
  FOR EACH ROW
  EXECUTE FUNCTION calculate_biaya_bahan_pemeriksaan();

-- Komentar untuk dokumentasi
COMMENT ON TRIGGER trigger_calculate_biaya_bahan_operatif ON kalkulasi_biaya_operatif IS 
'Trigger untuk menghitung otomatis biaya_bahan_pemeriksaan_numeric dari kolom bahan_pemeriksaan (JSONB). Menghitung SUM(harga_total) dari array JSONB.';

-- =====================================================
-- STEP 3: Backfill Data Existing (213 records)
-- =====================================================

-- Nonaktifkan trigger yang berat untuk menghindari timeout
ALTER TABLE kalkulasi_biaya_operatif DISABLE TRIGGER trigger_sync_rekapitulasi_operatif;
ALTER TABLE kalkulasi_biaya_operatif DISABLE TRIGGER refresh_struktur_biaya_from_kalkulasi_operatif;
ALTER TABLE kalkulasi_biaya_operatif DISABLE TRIGGER trigger_sync_biaya_bahan_operatif;
ALTER TABLE kalkulasi_biaya_operatif DISABLE TRIGGER trigger_auto_update_budgeting_bhp_operatif;

-- Update semua record yang memiliki bahan_pemeriksaan tapi biaya_bahan_pemeriksaan_numeric = 0
UPDATE kalkulasi_biaya_operatif ko
SET biaya_bahan_pemeriksaan_numeric = (
  SELECT COALESCE(SUM((elem->>'harga_total')::numeric)::integer, 0)
  FROM jsonb_array_elements(ko.bahan_pemeriksaan) AS elem
)
WHERE ko.bahan_pemeriksaan IS NOT NULL 
  AND jsonb_array_length(ko.bahan_pemeriksaan) > 0
  AND ko.biaya_bahan_pemeriksaan_numeric = 0;

-- Aktifkan kembali trigger
ALTER TABLE kalkulasi_biaya_operatif ENABLE TRIGGER trigger_sync_rekapitulasi_operatif;
ALTER TABLE kalkulasi_biaya_operatif ENABLE TRIGGER refresh_struktur_biaya_from_kalkulasi_operatif;
ALTER TABLE kalkulasi_biaya_operatif ENABLE TRIGGER trigger_sync_biaya_bahan_operatif;
ALTER TABLE kalkulasi_biaya_operatif ENABLE TRIGGER trigger_auto_update_budgeting_bhp_operatif;

-- =====================================================
-- STEP 4: Verifikasi Hasil
-- =====================================================

-- Verifikasi statistik
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN bahan_pemeriksaan IS NOT NULL AND jsonb_array_length(bahan_pemeriksaan) > 0 THEN 1 END) as records_with_bahan,
  COUNT(CASE WHEN biaya_bahan_pemeriksaan_numeric > 0 THEN 1 END) as records_with_biaya_calculated,
  COUNT(CASE WHEN bahan_pemeriksaan IS NOT NULL AND jsonb_array_length(bahan_pemeriksaan) > 0 AND biaya_bahan_pemeriksaan_numeric = 0 THEN 1 END) as still_zero,
  SUM(biaya_bahan_pemeriksaan_numeric) as total_biaya_bahan
FROM kalkulasi_biaya_operatif;

-- Verifikasi beberapa contoh data
SELECT 
  kode,
  jenis_pemeriksaan,
  jsonb_array_length(bahan_pemeriksaan) as jumlah_bahan,
  biaya_bahan_pemeriksaan_numeric,
  (SELECT SUM((elem->>'harga_total')::numeric)::integer
   FROM jsonb_array_elements(bahan_pemeriksaan) AS elem) as calculated_value,
  CASE 
    WHEN biaya_bahan_pemeriksaan_numeric = (SELECT SUM((elem->>'harga_total')::numeric)::integer FROM jsonb_array_elements(bahan_pemeriksaan) AS elem)
    THEN '✓ BENAR'
    ELSE '✗ SALAH'
  END as status
FROM kalkulasi_biaya_operatif
WHERE bahan_pemeriksaan IS NOT NULL 
  AND jsonb_array_length(bahan_pemeriksaan) > 0
ORDER BY biaya_bahan_pemeriksaan_numeric DESC
LIMIT 10;

-- =====================================================
-- Hasil yang Diharapkan:
-- - total_records: 213
-- - records_with_bahan: 213
-- - records_with_biaya_calculated: 213
-- - still_zero: 0
-- - total_biaya_bahan: 136,153,117
-- - Semua status: ✓ BENAR
-- =====================================================
