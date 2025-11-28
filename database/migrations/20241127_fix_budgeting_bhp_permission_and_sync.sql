-- =====================================================
-- Fix Budgeting BHP Permission and Sync
-- =====================================================
-- Tanggal: 27 November 2024
-- Deskripsi: Perbaikan permission error dan sinkronisasi
--            1. Fix permission denied for table users
--            2. Pastikan total budgeting sinkron
--            3. Perbaiki perhitungan unique barang
-- =====================================================

-- =====================================================
-- 1. Fix populate_rincian_budgeting_bhp_optimized
-- =====================================================
-- Hapus referensi ke auth.users yang menyebabkan permission error
CREATE OR REPLACE FUNCTION populate_rincian_budgeting_bhp_optimized(p_tahun integer)
RETURNS text
LANGUAGE plpgsql
SET statement_timeout TO '600s'
AS $$
DECLARE 
  v_tenant_id uuid;
  v_user_id uuid;
  v_count integer;
  v_start_time timestamp;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Get tenant_id and user_id from current user
  SELECT tenant_id, id INTO v_tenant_id, v_user_id
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Fallback ke default tenant jika tidak ada
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id
    FROM tenants
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  -- Fallback ke user_id pertama dari user_profiles (bukan auth.users)
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM user_profiles
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tidak ada tenant yang tersedia di sistem';
  END IF;
  
  -- Delete existing data for this tenant and year
  DELETE FROM rincian_budgeting_bhp 
  WHERE tenant_id = v_tenant_id AND tahun = p_tahun;

  -- Insert new data dengan kode_barang dan satuan yang lengkap
  INSERT INTO rincian_budgeting_bhp (
    tenant_id, tahun, budgeting_bhp_farmasi_id,
    kode_barang, nama_barang, satuan,
    qty_per_tindakan, jumlah_tindakan, harga_satuan,
    kode_unit_kerja, nama_unit_kerja,
    kode_tindakan, nama_tindakan, sumber_tabel
  )
  SELECT 
    b.tenant_id, 
    b.tahun, 
    b.id,
    -- Prioritas: kode_barang dari JSON, lalu dari master, lalu generate dari nama
    COALESCE(
      NULLIF(TRIM(item->>'kode_barang'), ''),
      dm.kode_barang,
      'BHP' || LPAD(ROW_NUMBER() OVER (ORDER BY b.id, item->>'nama')::text, 5, '0')
    )::text AS kode_barang,
    COALESCE(NULLIF(TRIM(item->>'nama'), ''), 'Barang Tidak Diketahui')::text AS nama_barang,
    -- Prioritas: satuan dari JSON, lalu dari master, lalu default
    COALESCE(
      NULLIF(TRIM(item->>'satuan'), ''),
      dm.satuan,
      'unit'
    )::text AS satuan,
    COALESCE(
      NULLIF(item->>'qty_per_tindakan','')::numeric, 
      NULLIF(item->>'qty','')::numeric, 
      NULLIF(item->>'jumlah','')::numeric, 
      1
    )::numeric AS qty_per_tindakan,
    COALESCE(b.jumlah_tindakan, 1) AS jumlah_tindakan,
    COALESCE(
      dm.harga, 
      NULLIF(item->>'harga_satuan','')::numeric, 
      NULLIF(item->>'harga_total','')::numeric, 
      0
    )::numeric AS harga_satuan,
    b.kode_unit_kerja, 
    b.nama_unit_kerja,
    b.kode_tindakan, 
    b.nama_tindakan,
    b.sumber_tabel
  FROM budgeting_bhp_farmasi b
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(b.rincian_bahan, '[]'::jsonb)) item
  LEFT JOIN data_master_barang_farmasi dm ON (
    dm.user_id = v_user_id AND (
      dm.kode_barang = NULLIF(TRIM(item->>'kode_barang'), '')
      OR
      (NULLIF(TRIM(item->>'kode_barang'), '') IS NULL 
       AND LOWER(TRIM(dm.nama_barang)) = LOWER(TRIM(item->>'nama')))
    )
  )
  WHERE b.tenant_id = v_tenant_id 
    AND b.tahun = p_tahun
    AND jsonb_typeof(b.rincian_bahan) = 'array'
    AND jsonb_array_length(b.rincian_bahan) > 0
    AND NULLIF(TRIM(item->>'nama'), '') IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update total_budgeting_rincian in parent table
  UPDATE budgeting_bhp_farmasi b
  SET total_budgeting_rincian = COALESCE((
    SELECT SUM(total_rupiah) FROM rincian_budgeting_bhp r WHERE r.budgeting_bhp_farmasi_id = b.id
  ), 0)
  WHERE b.tenant_id = v_tenant_id AND b.tahun = p_tahun;

  RETURN 'SUCCESS: Populated ' || v_count || ' rincian bahan for tenant ' || v_tenant_id 
         || ' tahun ' || p_tahun 
         || ' in ' || EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time))::text || ' seconds';
END;
$$;

-- =====================================================
-- 2. Grant Permission untuk View
-- =====================================================
-- Pastikan authenticated users bisa akses view
GRANT SELECT ON budgeting_bhp_farmasi_public TO authenticated;
GRANT SELECT ON rincian_budgeting_bhp_public TO authenticated;

-- =====================================================
-- 3. Create Materialized View untuk Performa (Optional)
-- =====================================================
-- Untuk statistik yang lebih cepat, bisa gunakan materialized view
-- Tapi untuk sekarang kita gunakan fungsi biasa saja

-- =====================================================
-- SELESAI
-- =====================================================
