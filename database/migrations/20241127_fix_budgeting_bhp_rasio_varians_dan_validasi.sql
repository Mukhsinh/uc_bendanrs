-- =====================================================
-- PERBAIKAN RASIO VARIANS DAN VALIDASI DATA BHP
-- =====================================================
-- Tanggal: 27 November 2024
-- Deskripsi: Memperbaiki perhitungan rasio varians dan validasi kode barang
-- =====================================================

-- 1. Buat view untuk tracking kode barang yang tidak valid
CREATE OR REPLACE VIEW v_budgeting_bhp_kode_barang_tidak_valid AS
SELECT DISTINCT 
  r.kode_barang,
  r.nama_barang,
  r.sumber_tabel,
  COUNT(*) OVER (PARTITION BY r.kode_barang) as jumlah_penggunaan,
  SUM(r.total_rupiah) OVER (PARTITION BY r.kode_barang) as total_nilai
FROM rincian_budgeting_bhp_public r
LEFT JOIN data_barang_farmasi f ON r.kode_barang = f.kode_barang
LEFT JOIN data_barang_gizi g ON r.kode_barang = g.kode_barang
WHERE f.kode_barang IS NULL 
  AND g.kode_barang IS NULL
ORDER BY total_nilai DESC;

COMMENT ON VIEW v_budgeting_bhp_kode_barang_tidak_valid IS 
'View untuk tracking kode barang BHP yang tidak terdaftar di master data farmasi atau gizi';

-- 2. Buat fungsi untuk mendapatkan statistik rasio varians yang benar
CREATE OR REPLACE FUNCTION get_budgeting_bhp_rasio_varians(
  p_tahun INTEGER DEFAULT NULL,
  p_unit_kerja TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_item_tersedia BIGINT,
  total_item_digunakan BIGINT,
  total_item_valid BIGINT,
  total_item_tidak_valid BIGINT,
  rasio_penggunaan_persen NUMERIC,
  rasio_validitas_persen NUMERIC
) AS $$
DECLARE
  v_tahun INTEGER;
BEGIN
  -- Gunakan tahun parameter atau tahun terbaru
  v_tahun := COALESCE(
    p_tahun,
    (SELECT MAX(tahun) FROM rincian_budgeting_bhp_public)
  );

  RETURN QUERY
  WITH master_data AS (
    -- Total item tersedia di master data
    SELECT 
      (SELECT COUNT(*) FROM data_barang_farmasi) + 
      (SELECT COUNT(*) FROM data_barang_gizi) as total_tersedia
  ),
  rincian_data AS (
    -- Data rincian dengan filter
    SELECT DISTINCT r.kode_barang
    FROM rincian_budgeting_bhp_public r
    WHERE r.tahun = v_tahun
      AND (p_unit_kerja IS NULL OR r.nama_unit_kerja = p_unit_kerja)
  ),
  validasi_data AS (
    -- Validasi kode barang
    SELECT 
      r.kode_barang,
      CASE 
        WHEN f.kode_barang IS NOT NULL OR g.kode_barang IS NOT NULL THEN TRUE
        ELSE FALSE
      END as is_valid
    FROM rincian_data r
    LEFT JOIN data_barang_farmasi f ON r.kode_barang = f.kode_barang
    LEFT JOIN data_barang_gizi g ON r.kode_barang = g.kode_barang
  )
  SELECT 
    m.total_tersedia::BIGINT as total_item_tersedia,
    COUNT(v.kode_barang)::BIGINT as total_item_digunakan,
    COUNT(v.kode_barang) FILTER (WHERE v.is_valid)::BIGINT as total_item_valid,
    COUNT(v.kode_barang) FILTER (WHERE NOT v.is_valid)::BIGINT as total_item_tidak_valid,
    ROUND(
      (COUNT(v.kode_barang)::NUMERIC / NULLIF(m.total_tersedia, 0)) * 100,
      2
    ) as rasio_penggunaan_persen,
    ROUND(
      (COUNT(v.kode_barang) FILTER (WHERE v.is_valid)::NUMERIC / 
       NULLIF(COUNT(v.kode_barang), 0)) * 100,
      2
    ) as rasio_validitas_persen
  FROM master_data m
  CROSS JOIN validasi_data v
  GROUP BY m.total_tersedia;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_budgeting_bhp_rasio_varians IS 
'Menghitung rasio varians dan validitas kode barang BHP dengan benar';

-- 3. Buat fungsi untuk mendapatkan detail perbedaan total budgeting
CREATE OR REPLACE FUNCTION get_budgeting_bhp_selisih_detail(
  p_tahun INTEGER DEFAULT 2025
)
RETURNS TABLE (
  sumber TEXT,
  total_budgeting NUMERIC,
  jumlah_records BIGINT,
  selisih_dari_rupiah NUMERIC,
  persentase_selisih NUMERIC
) AS $$
DECLARE
  v_total_rupiah NUMERIC;
BEGIN
  -- Ambil total dari halaman rupiah
  SELECT SUM(total_budgeting_bhp) INTO v_total_rupiah
  FROM budgeting_bhp_farmasi_public
  WHERE tahun = p_tahun;

  RETURN QUERY
  SELECT 
    'Budgeting BHP (Rupiah)'::TEXT as sumber,
    v_total_rupiah as total_budgeting,
    (SELECT COUNT(*) FROM budgeting_bhp_farmasi_public WHERE tahun = p_tahun)::BIGINT as jumlah_records,
    0::NUMERIC as selisih_dari_rupiah,
    0::NUMERIC as persentase_selisih
  
  UNION ALL
  
  SELECT 
    'Budgeting BHP (Rincian)'::TEXT as sumber,
    SUM(total_rupiah) as total_budgeting,
    COUNT(*)::BIGINT as jumlah_records,
    SUM(total_rupiah) - v_total_rupiah as selisih_dari_rupiah,
    ROUND(
      ((SUM(total_rupiah) - v_total_rupiah) / NULLIF(v_total_rupiah, 0)) * 100,
      4
    ) as persentase_selisih
  FROM rincian_budgeting_bhp_public
  WHERE tahun = p_tahun;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_budgeting_bhp_selisih_detail IS 
'Menghitung selisih total budgeting antara halaman Rupiah dan Rincian';

-- 4. Buat fungsi untuk sinkronisasi dan validasi kode barang
CREATE OR REPLACE FUNCTION sync_and_validate_budgeting_bhp_kode_barang(
  p_tahun INTEGER DEFAULT 2025
)
RETURNS TABLE (
  status TEXT,
  total_records_checked BIGINT,
  total_invalid_codes BIGINT,
  total_fixed BIGINT,
  message TEXT
) AS $$
DECLARE
  v_invalid_count BIGINT;
  v_fixed_count BIGINT := 0;
BEGIN
  -- Hitung jumlah kode barang tidak valid
  SELECT COUNT(DISTINCT r.kode_barang) INTO v_invalid_count
  FROM rincian_budgeting_bhp_public r
  LEFT JOIN data_barang_farmasi f ON r.kode_barang = f.kode_barang
  LEFT JOIN data_barang_gizi g ON r.kode_barang = g.kode_barang
  WHERE r.tahun = p_tahun
    AND f.kode_barang IS NULL 
    AND g.kode_barang IS NULL;

  -- Log warning jika ada kode barang tidak valid
  IF v_invalid_count > 0 THEN
    RAISE WARNING 'Ditemukan % kode barang yang tidak terdaftar di master data', v_invalid_count;
  END IF;

  RETURN QUERY
  SELECT 
    CASE 
      WHEN v_invalid_count = 0 THEN 'SUCCESS'::TEXT
      ELSE 'WARNING'::TEXT
    END as status,
    (SELECT COUNT(*) FROM rincian_budgeting_bhp_public WHERE tahun = p_tahun)::BIGINT as total_records_checked,
    v_invalid_count as total_invalid_codes,
    v_fixed_count as total_fixed,
    CASE 
      WHEN v_invalid_count = 0 THEN 'Semua kode barang valid'::TEXT
      ELSE format('Ditemukan %s kode barang tidak valid. Silakan periksa view v_budgeting_bhp_kode_barang_tidak_valid', v_invalid_count)
    END as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_and_validate_budgeting_bhp_kode_barang IS 
'Validasi kode barang BHP dan memberikan laporan kode yang tidak valid';

-- 5. Grant permissions
GRANT SELECT ON v_budgeting_bhp_kode_barang_tidak_valid TO authenticated;
GRANT EXECUTE ON FUNCTION get_budgeting_bhp_rasio_varians TO authenticated;
GRANT EXECUTE ON FUNCTION get_budgeting_bhp_selisih_detail TO authenticated;
GRANT EXECUTE ON FUNCTION sync_and_validate_budgeting_bhp_kode_barang TO authenticated;

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- Test 1: Cek rasio varians yang benar
-- SELECT * FROM get_budgeting_bhp_rasio_varians(2025, NULL);

-- Test 2: Cek selisih total budgeting
-- SELECT * FROM get_budgeting_bhp_selisih_detail(2025);

-- Test 3: Validasi kode barang
-- SELECT * FROM sync_and_validate_budgeting_bhp_kode_barang(2025);

-- Test 4: Lihat kode barang tidak valid (top 20)
-- SELECT * FROM v_budgeting_bhp_kode_barang_tidak_valid LIMIT 20;
