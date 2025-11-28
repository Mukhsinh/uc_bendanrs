-- =====================================================
-- OPTIMASI PERFORMA BUDGETING BHP
-- =====================================================
-- Tanggal: 27 November 2025
-- Tujuan: Mengatasi timeout error dan memastikan data terupdate
-- =====================================================

-- 1. Tambah index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_budgeting_bhp_farmasi_tahun_user 
ON budgeting_bhp_farmasi(tahun, user_id);

CREATE INDEX IF NOT EXISTS idx_budgeting_bhp_farmasi_sumber 
ON budgeting_bhp_farmasi(sumber_tabel, tahun);

CREATE INDEX IF NOT EXISTS idx_rincian_budgeting_bhp_parent 
ON rincian_budgeting_bhp(budgeting_bhp_farmasi_id);

CREATE INDEX IF NOT EXISTS idx_data_pendapatan_tahun_unit 
ON data_pendapatan(tahun, kode_unit_kerja);

-- Index untuk tabel kalkulasi
CREATE INDEX IF NOT EXISTS idx_kalkulasi_lab_tahun 
ON kalkulasi_biaya_laboratorium(tahun, kode_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_kalkulasi_radiologi_tahun 
ON kalkulasi_biaya_radiologi(tahun, kode_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_kalkulasi_bdrs_tahun 
ON kalkulasi_bdrs(tahun, kode_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_kalkulasi_operatif_tahun 
ON kalkulasi_biaya_operatif(tahun, kode_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_kalkulasi_cathlab_tahun 
ON kalkulasi_biaya_cathlab(tahun, kode_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_kalkulasi_rawat_jalan_tahun 
ON kalkulasi_tindakan_rawat_jalan(tahun, kode_unit_kerja);

CREATE INDEX IF NOT EXISTS idx_kalkulasi_rawat_inap_tahun 
ON kalkulasi_tindakan_inap(tahun, kode_unit_kerja);

-- 2. Optimasi fungsi populate_budgeting_bhp_farmasi dengan batch processing
-- Fungsi ini tidak bergantung pada user_id, tetapi pada tenant_id, kode, dan tahun
CREATE OR REPLACE FUNCTION populate_budgeting_bhp_farmasi_optimized(
  p_tahun integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '300s' -- 5 menit timeout
AS $$
DECLARE
  v_tenant_id uuid;
  v_deleted_count integer;
  v_inserted_count integer;
  v_start_time timestamp;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Get tenant_id from current user
  SELECT tenant_id INTO v_tenant_id
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant ID tidak ditemukan untuk user ini';
  END IF;

  -- Delete existing data for this tenant and year
  DELETE FROM budgeting_bhp_farmasi
  WHERE tahun = p_tahun AND tenant_id = v_tenant_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Insert data dengan optimasi
  WITH pendapatan_unit AS (
    SELECT
      kode_unit_kerja,
      tahun,
      SUM(COALESCE(total_pendapatan, 0) - COALESCE(pendapatan_apbd, 0)) AS pendapatan_netto
    FROM data_pendapatan
    WHERE tahun = p_tahun AND tenant_id = v_tenant_id
    GROUP BY kode_unit_kerja, tahun
  ),
  laboratorium AS (
    SELECT
      1::smallint AS kode_jenis,
      COALESCE(kbl.kode_unit_kerja, 'UK038') AS kode_unit_kerja,
      'Laboratorium (PK-PA)'::text AS nama_unit_kerja,
      NULL::text AS kode_operator,
      NULL::text AS nama_operator,
      kbl.kode AS kode_tindakan,
      kbl.jenis_pemeriksaan AS nama_tindakan,
      COALESCE(kbl.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
      COALESCE(kbl.unit_cost_per_pemeriksaan, 0)::bigint AS unit_cost_per_tindakan,
      COALESCE(kbl.jumlah, 0)::integer AS jumlah_tindakan,
      COALESCE(kbl.bahan_pemeriksaan, '[]'::jsonb) AS rincian_bahan,
      COALESCE(pu.pendapatan_netto, 0)::bigint AS pendapatan,
      'kalkulasi_biaya_laboratorium'::text AS sumber_tabel,
      row_number() OVER (
        PARTITION BY kbl.kode, COALESCE(kbl.kode_unit_kerja, 'UK038')
        ORDER BY kbl.updated_at DESC NULLS LAST, kbl.created_at DESC NULLS LAST, kbl.id DESC
      ) AS rn
    FROM kalkulasi_biaya_laboratorium kbl
    LEFT JOIN pendapatan_unit pu ON pu.kode_unit_kerja = COALESCE(kbl.kode_unit_kerja, 'UK038')
      AND pu.tahun = p_tahun
    WHERE kbl.tahun = p_tahun AND kbl.tenant_id = v_tenant_id
  ),
  radiologi AS (
    SELECT
      1::smallint AS kode_jenis,
      COALESCE(kbr.kode_unit_kerja, 'UK039') AS kode_unit_kerja,
      COALESCE(kbr.nama_unit_kerja, 'Radiologi') AS nama_unit_kerja,
      NULL::text AS kode_operator,
      NULL::text AS nama_operator,
      kbr.kode AS kode_tindakan,
      kbr.jenis_pemeriksaan AS nama_tindakan,
      COALESCE(kbr.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
      COALESCE(kbr.unit_cost_per_pemeriksaan, 0)::bigint AS unit_cost_per_tindakan,
      COALESCE(kbr.jumlah, 0)::integer AS jumlah_tindakan,
      COALESCE(kbr.bahan_pemeriksaan, '[]'::jsonb) AS rincian_bahan,
      COALESCE(pu.pendapatan_netto, 0)::bigint AS pendapatan,
      'kalkulasi_biaya_radiologi'::text AS sumber_tabel,
      row_number() OVER (
        PARTITION BY kbr.kode, COALESCE(kbr.kode_unit_kerja, 'UK039')
        ORDER BY kbr.updated_at DESC NULLS LAST, kbr.created_at DESC NULLS LAST, kbr.id DESC
      ) AS rn
    FROM kalkulasi_biaya_radiologi kbr
    LEFT JOIN pendapatan_unit pu ON pu.kode_unit_kerja = COALESCE(kbr.kode_unit_kerja, 'UK039')
      AND pu.tahun = p_tahun
    WHERE kbr.tahun = p_tahun AND kbr.tenant_id = v_tenant_id
  ),
  bdrs AS (
    SELECT
      1::smallint AS kode_jenis,
      COALESCE(kb.kode_unit_kerja, 'UK044') AS kode_unit_kerja,
      COALESCE(kb.nama_unit_kerja, 'BDRS') AS nama_unit_kerja,
      NULL::text AS kode_operator,
      NULL::text AS nama_operator,
      kb.kode AS kode_tindakan,
      kb.jenis_pemeriksaan AS nama_tindakan,
      COALESCE(kb.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
      COALESCE(kb.unit_cost_per_pemeriksaan, 0)::bigint AS unit_cost_per_tindakan,
      COALESCE(kb.jumlah, 0)::integer AS jumlah_tindakan,
      COALESCE(kb.bahan_pemeriksaan, '[]'::jsonb) AS rincian_bahan,
      COALESCE(pu.pendapatan_netto, 0)::bigint AS pendapatan,
      'kalkulasi_bdrs'::text AS sumber_tabel,
      row_number() OVER (
        PARTITION BY kb.kode, COALESCE(kb.kode_unit_kerja, 'UK044')
        ORDER BY kb.updated_at DESC NULLS LAST, kb.created_at DESC NULLS LAST, kb.id DESC
      ) AS rn
    FROM kalkulasi_bdrs kb
    LEFT JOIN pendapatan_unit pu ON pu.kode_unit_kerja = COALESCE(kb.kode_unit_kerja, 'UK044')
      AND pu.tahun = p_tahun
    WHERE kb.tahun = p_tahun AND kb.tenant_id = v_tenant_id
  ),
  operatif AS (
    SELECT
      COALESCE(kbo.kode_jenis, 3)::smallint AS kode_jenis,
      kbo.kode_unit_kerja,
      kbo.nama_unit_kerja,
      kbo.kode_operator_spesialistik AS kode_operator,
      kbo.nama_operator_spesialistik AS nama_operator,
      kbo.kode AS kode_tindakan,
      kbo.jenis_pemeriksaan AS nama_tindakan,
      COALESCE(kbo.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
      COALESCE(kbo.unit_cost_per_tindakan, 0)::bigint AS unit_cost_per_tindakan,
      COALESCE(kbo.jumlah, 0)::integer AS jumlah_tindakan,
      COALESCE(kbo.bahan_pemeriksaan, '[]'::jsonb) AS rincian_bahan,
      COALESCE(pu.pendapatan_netto, 0)::bigint AS pendapatan,
      'kalkulasi_biaya_operatif'::text AS sumber_tabel,
      row_number() OVER (
        PARTITION BY kbo.kode, kbo.kode_unit_kerja
        ORDER BY kbo.updated_at DESC NULLS LAST, kbo.created_at DESC NULLS LAST, kbo.id DESC
      ) AS rn
    FROM kalkulasi_biaya_operatif kbo
    LEFT JOIN pendapatan_unit pu ON pu.kode_unit_kerja = kbo.kode_unit_kerja
      AND pu.tahun = p_tahun
    WHERE kbo.tahun = p_tahun AND kbo.tenant_id = v_tenant_id
  ),
  cathlab AS (
    SELECT
      1::smallint AS kode_jenis,
      COALESCE(kbc.kode_unit_kerja, 'UK045') AS kode_unit_kerja,
      COALESCE(kbc.nama_unit_kerja, 'Cathlab') AS nama_unit_kerja,
      NULL::text AS kode_operator,
      NULL::text AS nama_operator,
      kbc.kode AS kode_tindakan,
      kbc.jenis_pemeriksaan AS nama_tindakan,
      COALESCE(kbc.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
      COALESCE(kbc.unit_cost_per_tindakan, 0)::bigint AS unit_cost_per_tindakan,
      COALESCE(kbc.jumlah, 0)::integer AS jumlah_tindakan,
      COALESCE(kbc.bahan_pemeriksaan, '[]'::jsonb) AS rincian_bahan,
      COALESCE(pu.pendapatan_netto, 0)::bigint AS pendapatan,
      'kalkulasi_biaya_cathlab'::text AS sumber_tabel,
      row_number() OVER (
        PARTITION BY kbc.kode, COALESCE(kbc.kode_unit_kerja, 'UK045')
        ORDER BY kbc.updated_at DESC NULLS LAST, kbc.created_at DESC NULLS LAST, kbc.id DESC
      ) AS rn
    FROM kalkulasi_biaya_cathlab kbc
    LEFT JOIN pendapatan_unit pu ON pu.kode_unit_kerja = COALESCE(kbc.kode_unit_kerja, 'UK045')
      AND pu.tahun = p_tahun
    WHERE kbc.tahun = p_tahun AND kbc.tenant_id = v_tenant_id
  ),
  rawat_jalan AS (
    SELECT
      2::smallint AS kode_jenis,
      ktrj.kode_unit_kerja,
      ktrj.nama_unit_kerja,
      NULL::text AS kode_operator,
      NULL::text AS nama_operator,
      ktrj.kode_jenis_tindakan AS kode_tindakan,
      ktrj.jenis_tindakan AS nama_tindakan,
      COALESCE(dt.biaya_bahan_tindakan, ktrj.biaya_bahan_tindakan, 0)::bigint AS biaya_bahan,
      COALESCE(ktrj.unit_cost_tindakan, 0)::bigint AS unit_cost_per_tindakan,
      COALESCE(ktrj.jumlah, 0)::integer AS jumlah_tindakan,
      COALESCE(dt.bahan_tindakan, '[]'::jsonb) AS rincian_bahan,
      COALESCE(pu.pendapatan_netto, 0)::bigint AS pendapatan,
      'kalkulasi_tindakan_rawat_jalan'::text AS sumber_tabel,
      row_number() OVER (
        PARTITION BY ktrj.kode_jenis_tindakan, ktrj.kode_unit_kerja
        ORDER BY ktrj.updated_at DESC NULLS LAST, ktrj.created_at DESC NULLS LAST, ktrj.id DESC
      ) AS rn
    FROM kalkulasi_tindakan_rawat_jalan ktrj
    LEFT JOIN daftar_tindakan dt ON dt.kode_tindakan = ktrj.kode_jenis_tindakan AND dt.tenant_id = v_tenant_id
    LEFT JOIN pendapatan_unit pu ON pu.kode_unit_kerja = ktrj.kode_unit_kerja
      AND pu.tahun = p_tahun
    WHERE ktrj.tahun = p_tahun AND ktrj.tenant_id = v_tenant_id
  ),
  rawat_inap AS (
    SELECT
      2::smallint AS kode_jenis,
      kti.kode_unit_kerja,
      kti.nama_unit_kerja,
      NULL::text AS kode_operator,
      NULL::text AS nama_operator,
      kti.kode_jenis_tindakan AS kode_tindakan,
      kti.jenis_tindakan AS nama_tindakan,
      COALESCE(dt.biaya_bahan_tindakan, kti.biaya_bahan_tindakan, 0)::bigint AS biaya_bahan,
      COALESCE(kti.unit_cost_tindakan, 0)::bigint AS unit_cost_per_tindakan,
      COALESCE(kti.jumlah, 0)::integer AS jumlah_tindakan,
      COALESCE(dt.bahan_tindakan, '[]'::jsonb) AS rincian_bahan,
      COALESCE(pu.pendapatan_netto, 0)::bigint AS pendapatan,
      'kalkulasi_tindakan_inap'::text AS sumber_tabel,
      row_number() OVER (
        PARTITION BY kti.kode_jenis_tindakan, kti.kode_unit_kerja
        ORDER BY kti.updated_at DESC NULLS LAST, kti.created_at DESC NULLS LAST, kti.id DESC
      ) AS rn
    FROM kalkulasi_tindakan_inap kti
    LEFT JOIN daftar_tindakan dt ON dt.kode_tindakan = kti.kode_jenis_tindakan AND dt.tenant_id = v_tenant_id
    LEFT JOIN pendapatan_unit pu ON pu.kode_unit_kerja = kti.kode_unit_kerja
      AND pu.tahun = p_tahun
    WHERE kti.tahun = p_tahun AND kti.tenant_id = v_tenant_id
  ),
  sumber AS (
    SELECT * FROM laboratorium WHERE rn = 1
    UNION ALL
    SELECT * FROM radiologi WHERE rn = 1
    UNION ALL
    SELECT * FROM bdrs WHERE rn = 1
    UNION ALL
    SELECT * FROM operatif WHERE rn = 1
    UNION ALL
    SELECT * FROM cathlab WHERE rn = 1
    UNION ALL
    SELECT * FROM rawat_jalan WHERE rn = 1
    UNION ALL
    SELECT * FROM rawat_inap WHERE rn = 1
  )
  INSERT INTO budgeting_bhp_farmasi (
    tenant_id,
    tahun,
    kode_jenis,
    kode_unit_kerja,
    nama_unit_kerja,
    kode_operator,
    nama_operator,
    kode_tindakan,
    nama_tindakan,
    biaya_bahan,
    unit_cost_per_tindakan,
    jumlah_tindakan,
    rincian_bahan,
    pendapatan,
    sumber_tabel
  )
  SELECT
    v_tenant_id,
    p_tahun,
    s.kode_jenis,
    s.kode_unit_kerja,
    s.nama_unit_kerja,
    s.kode_operator,
    s.nama_operator,
    s.kode_tindakan,
    s.nama_tindakan,
    s.biaya_bahan,
    s.unit_cost_per_tindakan,
    s.jumlah_tindakan,
    s.rincian_bahan,
    s.pendapatan,
    s.sumber_tabel
  FROM sumber s
  WHERE s.kode_tindakan IS NOT NULL
    AND s.kode_unit_kerja IS NOT NULL;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  RETURN 'SUCCESS: Deleted ' || COALESCE(v_deleted_count, 0) || ' records and inserted '
         || COALESCE(v_inserted_count, 0) || ' fresh records for tahun ' || p_tahun 
         || ' (tenant: ' || v_tenant_id || ') in ' || EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time))::text || ' seconds';
END;
$$;

-- 3. Optimasi fungsi populate_rincian_budgeting_bhp
CREATE OR REPLACE FUNCTION populate_rincian_budgeting_bhp_optimized(
  p_tahun integer
)
RETURNS text
LANGUAGE plpgsql
SET statement_timeout = '300s' -- 5 menit timeout
AS $$
DECLARE 
  v_tenant_id uuid;
  v_count integer;
  v_start_time timestamp;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Get tenant_id from current user
  SELECT tenant_id INTO v_tenant_id
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant ID tidak ditemukan untuk user ini';
  END IF;
  
  -- Delete existing data for this tenant and year
  DELETE FROM rincian_budgeting_bhp 
  WHERE tenant_id = v_tenant_id AND tahun = p_tahun;

  -- Insert new data with optimized query
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
    dm.tenant_id = v_tenant_id AND (
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

-- 4. Buat fungsi wrapper yang memanggil kedua fungsi secara berurutan
CREATE OR REPLACE FUNCTION refresh_budgeting_bhp_complete(
  p_tahun integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '600s' -- 10 menit total timeout
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

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION populate_budgeting_bhp_farmasi_optimized(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION populate_rincian_budgeting_bhp_optimized(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_budgeting_bhp_complete(integer) TO authenticated;

-- 6. Analyze tables untuk update statistics
ANALYZE budgeting_bhp_farmasi;
ANALYZE rincian_budgeting_bhp;
ANALYZE data_pendapatan;
ANALYZE kalkulasi_biaya_laboratorium;
ANALYZE kalkulasi_biaya_radiologi;
ANALYZE kalkulasi_bdrs;
ANALYZE kalkulasi_biaya_operatif;
ANALYZE kalkulasi_biaya_cathlab;
ANALYZE kalkulasi_tindakan_rawat_jalan;
ANALYZE kalkulasi_tindakan_inap;

COMMENT ON FUNCTION populate_budgeting_bhp_farmasi_optimized IS 'Versi optimized dari populate_budgeting_bhp_farmasi dengan timeout 5 menit, tenant-aware, dan index yang lebih baik';
COMMENT ON FUNCTION populate_rincian_budgeting_bhp_optimized IS 'Versi optimized dari populate_rincian_budgeting_bhp dengan timeout 5 menit dan tenant-aware';
COMMENT ON FUNCTION refresh_budgeting_bhp_complete IS 'Fungsi wrapper untuk refresh complete budgeting BHP (farmasi + rincian) dengan timeout 10 menit, tenant-aware berdasarkan kode, tahun, dan tenant_id';
