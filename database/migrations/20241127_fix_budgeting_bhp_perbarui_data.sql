-- =====================================================
-- Fix Budgeting BHP Perbarui Data Errors
-- =====================================================
-- Tanggal: 27 November 2024
-- Deskripsi: Memperbaiki error pada fungsi perbarui data
--            1. Fix tenant_id reference di data_master_barang_farmasi
--            2. Optimize query untuk menghindari timeout
-- =====================================================

-- =====================================================
-- 1. Fix populate_rincian_budgeting_bhp_optimized
-- =====================================================
-- Ganti tenant_id dengan user_id untuk data_master_barang_farmasi
CREATE OR REPLACE FUNCTION populate_rincian_budgeting_bhp_optimized(p_tahun integer)
RETURNS text
LANGUAGE plpgsql
SET statement_timeout TO '600s'  -- Increase timeout to 10 minutes
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
  
  -- Fallback ke user pertama jika tidak ada user_id
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tidak ada tenant yang tersedia di sistem';
  END IF;
  
  -- Delete existing data for this tenant and year
  DELETE FROM rincian_budgeting_bhp 
  WHERE tenant_id = v_tenant_id AND tahun = p_tahun;

  -- Insert new data with optimized query
  -- Menggunakan user_id untuk data_master_barang_farmasi
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
    COALESCE(
      NULLIF(item->>'kode_barang',''),
      dm.kode_barang
    )::text AS kode_barang,
    (item->>'nama')::text AS nama_barang,
    (item->>'satuan')::text AS satuan,
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
    -- Gunakan user_id bukan tenant_id
    dm.user_id = v_user_id AND (
      dm.kode_barang = NULLIF(item->>'kode_barang','')
      OR
      (NULLIF(item->>'kode_barang','') IS NULL AND LOWER(TRIM(dm.nama_barang)) = LOWER(TRIM(item->>'nama')))
    )
  )
  WHERE b.tenant_id = v_tenant_id 
    AND b.tahun = p_tahun
    AND jsonb_typeof(b.rincian_bahan) = 'array'
    AND jsonb_array_length(b.rincian_bahan) > 0;

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
-- 2. Fix populate_rincian_budgeting_bhp (non-optimized)
-- =====================================================
-- Update fungsi lama untuk konsistensi
CREATE OR REPLACE FUNCTION populate_rincian_budgeting_bhp(p_user_id uuid, p_tahun integer)
RETURNS text
LANGUAGE plpgsql
SET statement_timeout TO '600s'  -- Increase timeout
AS $$
DECLARE 
  v_count integer;
  v_tenant_id uuid;
BEGIN
  -- Get tenant_id from user
  SELECT tenant_id INTO v_tenant_id
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Fallback ke default tenant
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id
    FROM tenants
    ORDER BY created_at
    LIMIT 1;
  END IF;

  -- Delete existing data for this user and year
  DELETE FROM rincian_budgeting_bhp 
  WHERE user_id = p_user_id AND tahun = p_tahun;

  -- Insert new data with sumber_tabel and kode_barang properly populated
  INSERT INTO rincian_budgeting_bhp (
    user_id, tenant_id, tahun, budgeting_bhp_farmasi_id,
    kode_barang, nama_barang, satuan,
    qty_per_tindakan, jumlah_tindakan, harga_satuan,
    kode_unit_kerja, nama_unit_kerja,
    kode_tindakan, nama_tindakan, sumber_tabel
  )
  SELECT 
    b.user_id,
    b.tenant_id,
    b.tahun, 
    b.id,
    COALESCE(
      NULLIF(item->>'kode_barang',''),
      dm.kode_barang
    )::text AS kode_barang,
    (item->>'nama')::text AS nama_barang,
    (item->>'satuan')::text AS satuan,
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
    -- Gunakan user_id bukan tenant_id
    dm.user_id = p_user_id AND (
      dm.kode_barang = NULLIF(item->>'kode_barang','')
      OR
      (NULLIF(item->>'kode_barang','') IS NULL AND LOWER(TRIM(dm.nama_barang)) = LOWER(TRIM(item->>'nama')))
    )
  )
  WHERE b.user_id = p_user_id 
    AND b.tahun = p_tahun
    AND jsonb_typeof(b.rincian_bahan) = 'array'
    AND jsonb_array_length(b.rincian_bahan) > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update total_budgeting_rincian in parent table
  UPDATE budgeting_bhp_farmasi b
  SET total_budgeting_rincian = COALESCE((
    SELECT SUM(total_rupiah) FROM rincian_budgeting_bhp r WHERE r.budgeting_bhp_farmasi_id = b.id
  ), 0)
  WHERE b.user_id = p_user_id AND b.tahun = p_tahun;

  RETURN 'SUCCESS: Populated ' || v_count || ' rincian bahan with kode_barang, sumber_tabel, qty_per_tindakan, and harga_satuan for user ' || p_user_id || ' tahun ' || p_tahun;
END;
$$;

-- =====================================================
-- 3. Update refresh_budgeting_bhp_complete
-- =====================================================
-- Increase timeout untuk fungsi complete
CREATE OR REPLACE FUNCTION refresh_budgeting_bhp_complete(p_tahun integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout TO '900s'  -- 15 minutes total
AS $$
DECLARE
  v_result1 text;
  v_result2 text;
  v_total_time numeric;
  v_start_time timestamp;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Step 1: Populate budgeting_bhp_farmasi
  v_result1 := populate_budgeting_bhp_farmasi_optimized(p_tahun);
  
  -- Step 2: Populate rincian_budgeting_bhp
  v_result2 := populate_rincian_budgeting_bhp_optimized(p_tahun);
  
  v_total_time := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time));
  
  RETURN jsonb_build_object(
    'success', true,
    'step1', v_result1,
    'step2', v_result2,
    'total_time_seconds', v_total_time,
    'message', 'Data budgeting BHP berhasil diperbarui'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Gagal memperbarui data budgeting BHP'
    );
END;
$$;

-- =====================================================
-- 4. Create index untuk optimasi query
-- =====================================================
-- Index untuk mempercepat join dengan data_barang_farmasi (tabel asli)
CREATE INDEX IF NOT EXISTS idx_data_barang_farmasi_user_kode 
ON data_barang_farmasi(user_id, kode_barang);

CREATE INDEX IF NOT EXISTS idx_data_barang_farmasi_user_nama 
ON data_barang_farmasi(user_id, LOWER(TRIM(nama_barang)));

-- Index untuk budgeting_bhp_farmasi
CREATE INDEX IF NOT EXISTS idx_budgeting_bhp_farmasi_tenant_tahun 
ON budgeting_bhp_farmasi(tenant_id, tahun);

-- Index untuk rincian_budgeting_bhp
CREATE INDEX IF NOT EXISTS idx_rincian_budgeting_bhp_tenant_tahun 
ON rincian_budgeting_bhp(tenant_id, tahun);

CREATE INDEX IF NOT EXISTS idx_rincian_budgeting_bhp_farmasi_id 
ON rincian_budgeting_bhp(budgeting_bhp_farmasi_id);

-- =====================================================
-- SELESAI
-- =====================================================
