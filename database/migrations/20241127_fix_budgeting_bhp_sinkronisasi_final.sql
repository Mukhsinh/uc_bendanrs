-- =====================================================
-- Fix Budgeting BHP Sinkronisasi Final
-- =====================================================
-- Tanggal: 27 November 2024
-- Deskripsi: Perbaikan sinkronisasi data BHP
--            1. Pastikan total budgeting sinkron dengan database
--            2. Pastikan kode_barang dan satuan tampil
--            3. Pastikan kartu statistik sinkron dengan tabel sumber
--            4. Filter berdasarkan tenant_id dan tahun (tanpa user_id)
-- =====================================================

-- =====================================================
-- 1. Update View budgeting_bhp_farmasi_public
-- =====================================================
-- Drop dan recreate view untuk mengubah kolom
DROP VIEW IF EXISTS budgeting_bhp_farmasi_public CASCADE;

CREATE VIEW budgeting_bhp_farmasi_public AS
SELECT 
  b.id,
  b.tenant_id,
  b.tahun,
  b.kode_jenis,
  b.kode_unit_kerja,
  b.nama_unit_kerja,
  b.kode_operator,
  b.nama_operator,
  b.kode_tindakan,
  b.nama_tindakan,
  b.biaya_bahan,
  b.unit_cost_per_tindakan,
  b.jumlah_tindakan,
  b.rincian_bahan,
  b.total_budgeting_bhp,
  b.total_budgeting_rincian,
  b.pendapatan,
  b.rasio_bhp_pendapatan,
  b.sumber_tabel,
  b.created_at,
  b.updated_at
FROM budgeting_bhp_farmasi b
WHERE b.tenant_id IN (
  SELECT tenant_id 
  FROM user_profiles 
  WHERE id = auth.uid()
  UNION
  SELECT id FROM tenants LIMIT 1  -- Fallback ke tenant pertama
);

-- =====================================================
-- 2. Update View rincian_budgeting_bhp_public
-- =====================================================
-- Drop dan recreate view untuk mengubah kolom
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
  SELECT tenant_id 
  FROM user_profiles 
  WHERE id = auth.uid()
  UNION
  SELECT id FROM tenants LIMIT 1  -- Fallback ke tenant pertama
);

-- =====================================================
-- 3. Fix populate_rincian_budgeting_bhp_optimized
-- =====================================================
-- Pastikan kode_barang dan satuan selalu terisi
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
    AND NULLIF(TRIM(item->>'nama'), '') IS NOT NULL;  -- Pastikan nama barang tidak kosong

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
-- 4. Create Function untuk Statistik Tenant-Aware
-- =====================================================
-- Fungsi untuk mendapatkan statistik budgeting BHP
CREATE OR REPLACE FUNCTION get_budgeting_bhp_statistics(p_tahun integer)
RETURNS TABLE (
  total_items bigint,
  total_budgeting numeric,
  total_tindakan bigint,
  total_unit_kerja bigint,
  total_pendapatan numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get tenant_id from current user
  SELECT tenant_id INTO v_tenant_id
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Fallback ke default tenant
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id
    FROM tenants
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_items,
    COALESCE(SUM(b.total_budgeting_bhp), 0)::numeric as total_budgeting,
    COALESCE(SUM(b.jumlah_tindakan), 0)::bigint as total_tindakan,
    COUNT(DISTINCT b.kode_unit_kerja)::bigint as total_unit_kerja,
    COALESCE(MAX(b.pendapatan), 0)::numeric as total_pendapatan
  FROM budgeting_bhp_farmasi b
  WHERE b.tenant_id = v_tenant_id
    AND b.tahun = p_tahun;
END;
$$;

-- =====================================================
-- 5. Create Function untuk Statistik Rincian
-- =====================================================
CREATE OR REPLACE FUNCTION get_rincian_bhp_statistics(p_tahun integer)
RETURNS TABLE (
  total_items bigint,
  total_budgeting numeric,
  unique_barang bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get tenant_id from current user
  SELECT tenant_id INTO v_tenant_id
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Fallback ke default tenant
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id
    FROM tenants
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_items,
    COALESCE(SUM(r.total_rupiah), 0)::numeric as total_budgeting,
    COUNT(DISTINCT r.kode_barang)::bigint as unique_barang
  FROM rincian_budgeting_bhp r
  WHERE r.tenant_id = v_tenant_id
    AND r.tahun = p_tahun;
END;
$$;

-- =====================================================
-- SELESAI
-- =====================================================
