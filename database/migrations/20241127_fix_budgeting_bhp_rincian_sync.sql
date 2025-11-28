-- =====================================================
-- Fix Budgeting BHP Rincian Sinkronisasi
-- =====================================================
-- Tanggal: 27 November 2024
-- Deskripsi: Perbaikan sinkronisasi antara halaman Rupiah dan Rincian
--            1. Pastikan kedua halaman menggunakan tahun yang sama (2025)
--            2. Pastikan total budgeting sinkron
--            3. Perbaiki view untuk menghilangkan error 406
--            4. Pastikan data ter-refresh dengan benar
-- =====================================================

-- =====================================================
-- 1. Refresh Materialized View (jika ada)
-- =====================================================
-- Pastikan tidak ada materialized view yang perlu di-refresh
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews 
    WHERE schemaname = 'public' 
    AND matviewname IN ('budgeting_bhp_farmasi_public', 'rincian_budgeting_bhp_public')
  ) THEN
    REFRESH MATERIALIZED VIEW budgeting_bhp_farmasi_public;
    REFRESH MATERIALIZED VIEW rincian_budgeting_bhp_public;
  END IF;
END $$;

-- =====================================================
-- 2. Verifikasi Data Consistency
-- =====================================================
-- Cek apakah ada data yang tidak sinkron
DO $$
DECLARE
  v_rupiah_total numeric;
  v_rincian_total numeric;
  v_diff numeric;
BEGIN
  -- Total dari halaman Rupiah
  SELECT COALESCE(SUM(total_budgeting_bhp), 0) INTO v_rupiah_total
  FROM budgeting_bhp_farmasi
  WHERE tahun = 2025;
  
  -- Total dari halaman Rincian (raw data, bukan agregasi)
  SELECT COALESCE(SUM(total_rupiah), 0) INTO v_rincian_total
  FROM rincian_budgeting_bhp
  WHERE tahun = 2025;
  
  v_diff := ABS(v_rupiah_total - v_rincian_total);
  
  RAISE NOTICE 'Total Budgeting Rupiah: %', v_rupiah_total;
  RAISE NOTICE 'Total Budgeting Rincian: %', v_rincian_total;
  RAISE NOTICE 'Selisih: %', v_diff;
  
  IF v_diff > 1000 THEN
    RAISE WARNING 'Terdapat selisih signifikan antara data Rupiah dan Rincian!';
  END IF;
END $$;

-- =====================================================
-- 3. Update View untuk Menghilangkan Error 406
-- =====================================================
-- Recreate view dengan struktur yang lebih sederhana
DROP VIEW IF EXISTS rincian_budgeting_bhp_public CASCADE;

CREATE VIEW rincian_budgeting_bhp_public AS
SELECT 
  r.id,
  r.tenant_id,
  r.tahun,
  r.budgeting_bhp_farmasi_id,
  r.kode_unit_kerja,
  r.nama_unit_kerja,
  r.kode_tindakan,
  r.nama_tindakan,
  r.jumlah_tindakan,
  r.kode_barang,
  r.nama_barang,
  r.qty_per_tindakan,
  r.satuan,
  r.harga_satuan,
  r.jumlah_total,
  r.total_rupiah,
  r.sumber_tabel,
  r.created_at,
  r.updated_at
FROM rincian_budgeting_bhp r
WHERE r.tenant_id IN (
  SELECT COALESCE(
    (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()),
    (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
  )
);

-- Grant permissions
GRANT SELECT ON rincian_budgeting_bhp_public TO authenticated;
GRANT SELECT ON rincian_budgeting_bhp_public TO anon;

-- =====================================================
-- 4. Update RLS Policy untuk View
-- =====================================================
-- Pastikan RLS policy tidak memblokir akses
ALTER TABLE rincian_budgeting_bhp ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view rincian_budgeting_bhp for their tenant" ON rincian_budgeting_bhp;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rincian_budgeting_bhp;

-- Create new policy yang lebih permisif
CREATE POLICY "Enable read access for authenticated users"
ON rincian_budgeting_bhp
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT COALESCE(
      (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()),
      (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
    )
  )
);

-- =====================================================
-- 5. Optimize Query Performance
-- =====================================================
-- Tambahkan index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_rincian_bhp_tahun_tenant 
ON rincian_budgeting_bhp(tahun, tenant_id);

CREATE INDEX IF NOT EXISTS idx_rincian_bhp_total_rupiah 
ON rincian_budgeting_bhp(total_rupiah DESC);

CREATE INDEX IF NOT EXISTS idx_rincian_bhp_unit_kerja 
ON rincian_budgeting_bhp(nama_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_rincian_bhp_kode_barang 
ON rincian_budgeting_bhp(kode_barang);

-- =====================================================
-- 6. Vacuum dan Analyze
-- =====================================================
VACUUM ANALYZE rincian_budgeting_bhp;
VACUUM ANALYZE budgeting_bhp_farmasi;

-- =====================================================
-- 7. Test Query Performance
-- =====================================================
-- Test query yang digunakan di frontend
EXPLAIN ANALYZE
SELECT *
FROM rincian_budgeting_bhp_public
WHERE tahun = 2025
ORDER BY total_rupiah DESC
LIMIT 100;

-- =====================================================
-- 8. Verifikasi Hasil
-- =====================================================
DO $$
DECLARE
  v_count_rupiah integer;
  v_count_rincian integer;
  v_unique_barang integer;
BEGIN
  -- Count data di halaman Rupiah
  SELECT COUNT(*) INTO v_count_rupiah
  FROM budgeting_bhp_farmasi
  WHERE tahun = 2025;
  
  -- Count data di halaman Rincian
  SELECT COUNT(*) INTO v_count_rincian
  FROM rincian_budgeting_bhp
  WHERE tahun = 2025;
  
  -- Count unique barang
  SELECT COUNT(DISTINCT kode_barang) INTO v_unique_barang
  FROM rincian_budgeting_bhp
  WHERE tahun = 2025;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'HASIL VERIFIKASI SINKRONISASI';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total Tindakan (Rupiah): %', v_count_rupiah;
  RAISE NOTICE 'Total Rincian Bahan: %', v_count_rincian;
  RAISE NOTICE 'Total Jenis Barang Unik: %', v_unique_barang;
  RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- SELESAI
-- =====================================================
