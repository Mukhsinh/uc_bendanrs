-- ============================================
-- Perbaikan function manual_recalculate_cathlab
-- Menghapus filter user_id agar rekalkulasi berjalan untuk semua data berdasarkan kode dan tahun
-- Sesuai dengan desain data saat ini setelah penghapusan duplikat
-- ============================================

CREATE OR REPLACE FUNCTION public.manual_recalculate_cathlab(
  p_tahun INTEGER,
  p_user_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result jsonb;
  start_time timestamptz := clock_timestamp();
  v_affected_rows integer := 0;
  v_biaya_data record;
  v_distribusi_tidak_langsung numeric := 0;
  v_total_hasil_kali_waktu numeric := 0;
  v_total_hasil_kali numeric := 0;
  step_count integer := 0;
BEGIN
  -- Set timeout for this session
  PERFORM set_config('statement_timeout', '120000', true); -- 2 minutes
  
  RAISE NOTICE 'Starting manual recalculation for Cathlab - tahun %', p_tahun;
  
  -- STEP 1: Update hasil_kali berdasarkan input user
  -- HAPUS filter user_id, gunakan kode_unit_kerja = 'UK045' saja
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating hasil_kali...', step_count;
  
  UPDATE kalkulasi_biaya_cathlab 
  SET 
    hasil_kali = waktu_pemeriksaan * profesionalisme * tingkat_kesulitan * GREATEST(jumlah, 1),
    hasil_kali_waktu = waktu_pemeriksaan * GREATEST(jumlah, 1),
    updated_at = NOW()
  WHERE tahun = p_tahun 
    AND kode_unit_kerja = 'UK045';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated hasil_kali for % records', v_affected_rows;
  
  -- STEP 2: Calculate totals for dasar_alokasi
  -- HAPUS filter user_id, gunakan kode_unit_kerja = 'UK045' saja
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating totals for dasar_alokasi...', step_count;
  
  SELECT 
    COALESCE(SUM(hasil_kali_waktu::numeric), 1),
    COALESCE(SUM(hasil_kali), 1)
  INTO 
    v_total_hasil_kali_waktu,
    v_total_hasil_kali
  FROM kalkulasi_biaya_cathlab 
  WHERE tahun = p_tahun 
    AND kode_unit_kerja = 'UK045';
  
  -- Avoid division by zero
  IF v_total_hasil_kali_waktu = 0 THEN v_total_hasil_kali_waktu := 1; END IF;
  IF v_total_hasil_kali = 0 THEN v_total_hasil_kali := 1; END IF;
  
  -- STEP 3: Update dasar_alokasi
  -- HAPUS filter user_id, gunakan kode_unit_kerja = 'UK045' saja
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Updating dasar_alokasi (totals: waktu=%, hasil=%)', step_count, v_total_hasil_kali_waktu, v_total_hasil_kali;
  
  UPDATE kalkulasi_biaya_cathlab 
  SET 
    dasar_alokasi_waktu = ROUND((hasil_kali_waktu::numeric / v_total_hasil_kali_waktu)::numeric, 6),
    dasar_alokasi_hasil_kali = ROUND((hasil_kali::numeric / v_total_hasil_kali)::numeric, 6),
    updated_at = NOW()
  WHERE tahun = p_tahun 
    AND kode_unit_kerja = 'UK045';
  
  -- STEP 4: Get reference data for biaya calculation
  -- HAPUS filter user_id, gunakan data terbaru berdasarkan kode_unit_kerja dan tahun
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Getting reference data...', step_count;
  
  -- Ambil data_biaya terbaru berdasarkan kode_unit_kerja dan tahun (tanpa filter user_id)
  SELECT * INTO v_biaya_data
  FROM data_biaya 
  WHERE kode_unit_kerja = 'UK045' 
    AND tahun = p_tahun
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1;
  
  -- Ambil distribusi_biaya_rekap terbaru berdasarkan tahun (tanpa filter user_id)
  SELECT COALESCE(uk045_cathlab, 0) INTO v_distribusi_tidak_langsung
  FROM distribusi_biaya_rekap 
  WHERE biaya = 'Biaya Tidak Langsung Terdistribusi'
    AND tahun = p_tahun
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1;
  
  -- STEP 5: Update all biaya calculations (ONLY columns that exist in cathlab table)
  -- HAPUS filter user_id, gunakan kode_unit_kerja = 'UK045' saja
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating all biaya columns...', step_count;
  
  UPDATE kalkulasi_biaya_cathlab 
  SET 
    -- Biaya menggunakan dasar_alokasi_hasil_kali
    biaya_gaji_tunjangan = ROUND((
      COALESCE(v_biaya_data.biaya_gaji_tunjangan, 0) * 
      dasar_alokasi_hasil_kali / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    -- Biaya menggunakan dasar_alokasi_waktu (only existing columns)
    biaya_makan_karyawan = ROUND((
      COALESCE(v_biaya_data.biaya_makan_karyawan, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_rumah_tangga = ROUND((
      COALESCE(v_biaya_data.biaya_rumah_tangga, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_cetak = ROUND((
      COALESCE(v_biaya_data.biaya_cetak, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_atk = ROUND((
      COALESCE(v_biaya_data.biaya_atk, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_listrik = ROUND((
      COALESCE(v_biaya_data.biaya_listrik, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_air = ROUND((
      COALESCE(v_biaya_data.biaya_air, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_telp = ROUND((
      COALESCE(v_biaya_data.biaya_telp, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_pemeliharaan_bangunan = ROUND((
      COALESCE(v_biaya_data.biaya_pemeliharaan_bangunan, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_pemeliharaan_alat_medis = ROUND((
      COALESCE(v_biaya_data.biaya_pemeliharaan_alat_medis, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_pemeliharaan_alat_non_medis = ROUND((
      COALESCE(v_biaya_data.biaya_pemeliharaan_alat_non_medis, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_operasional_lainnya = ROUND((
      COALESCE(v_biaya_data.biaya_operasional_lainnya, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_penyusutan_gedung = ROUND((
      COALESCE(v_biaya_data.biaya_penyusutan_gedung, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_penyusutan_jaringan = ROUND((
      COALESCE(v_biaya_data.biaya_penyusutan_jaringan, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_penyusutan_alat_medis = ROUND((
      COALESCE(v_biaya_data.biaya_penyusutan_alat_medis, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_penyusutan_alat_non_medis = ROUND((
      COALESCE(v_biaya_data.biaya_penyusutan_alat_non_medis, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_pendidikan_pelatihan = ROUND((
      COALESCE(v_biaya_data.biaya_pendidikan_pelatihan, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_laundry = ROUND((
      COALESCE(v_biaya_data.biaya_laundry, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_sterilisasi = ROUND((
      COALESCE(v_biaya_data.biaya_sterilisasi, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    -- Biaya tidak langsung terdistribusi
    biaya_tidak_langsung_terdistribusi = ROUND((
      v_distribusi_tidak_langsung * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    updated_at = NOW()
    
  WHERE tahun = p_tahun 
    AND kode_unit_kerja = 'UK045';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  -- Build success result
  result := jsonb_build_object(
    'success', true,
    'message', 'Rekalkulasi Cathlab berhasil diselesaikan',
    'affected_rows', v_affected_rows,
    'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
    'steps_completed', step_count,
    'totals', jsonb_build_object(
      'total_hasil_kali_waktu', v_total_hasil_kali_waktu,
      'total_hasil_kali', v_total_hasil_kali
    ),
    'reference_data', jsonb_build_object(
      'biaya_gaji_tunjangan', COALESCE(v_biaya_data.biaya_gaji_tunjangan, 0),
      'distribusi_tidak_langsung', v_distribusi_tidak_langsung
    )
  );
  
  RAISE NOTICE 'Manual recalculation Cathlab completed successfully in %s', clock_timestamp() - start_time;
  RETURN result;
  
EXCEPTION
  WHEN query_canceled THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Rekalkulasi dibatalkan karena timeout',
      'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
      'steps_completed', step_count
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
      'steps_completed', step_count
    );
END;
$function$;

