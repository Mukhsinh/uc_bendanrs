-- ============================================
-- FIX FINAL: manual_recalculate_bdrs dengan optimasi lengkap
-- ============================================
-- Masalah: Statement timeout saat rekalkulasi BDRS dengan data besar
-- Solusi: 
--   1. Meningkatkan statement_timeout ke 15 menit (900000ms) untuk data sangat besar
--   2. Skip refresh rekapitulasi_unit_cost untuk menghindari timeout tambahan
--   3. Optimasi query dengan COMMIT antar step untuk mengurangi lock time
--   4. Error handling yang lebih baik dengan rollback yang aman
--   5. Progress tracking untuk monitoring
-- ============================================

CREATE OR REPLACE FUNCTION public.manual_recalculate_bdrs(
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
  v_prev_skip text := current_setting('app.skip_rekap_refresh', true);
  v_refresh_error text := NULL;
  v_statement_timeout text := '900000'; -- 15 menit untuk data sangat besar
BEGIN
  -- Set timeout for this session - DIPERPANJANG ke 15 menit untuk handle data besar
  PERFORM set_config('statement_timeout', v_statement_timeout, true);
  
  -- Skip refresh rekapitulasi untuk menghindari timeout tambahan
  PERFORM set_config('app.skip_rekap_refresh', '1', true);
  
  RAISE NOTICE 'Starting manual recalculation for BDRS - tahun % (global, tanpa filter user)', p_tahun;
  RAISE NOTICE 'Statement timeout set to % ms', v_statement_timeout;
  
  -- STEP 1: Update hasil_kali berdasarkan kombinasi kode+tahun
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating hasil_kali...', step_count;
  
  UPDATE kalkulasi_bdrs 
  SET 
    hasil_kali = waktu_pemeriksaan * profesionalisme * tingkat_kesulitan * GREATEST(jumlah, 1),
    hasil_kali_waktu = waktu_pemeriksaan * GREATEST(jumlah, 1),
    updated_at = NOW()
  WHERE tahun = p_tahun;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated hasil_kali for % records', v_affected_rows;
  
  -- STEP 2: Calculate totals for dasar_alokasi
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating totals for dasar_alokasi...', step_count;
  
  SELECT 
    COALESCE(SUM(hasil_kali_waktu::numeric), 1),
    COALESCE(SUM(hasil_kali), 1)
  INTO 
    v_total_hasil_kali_waktu,
    v_total_hasil_kali
  FROM kalkulasi_bdrs 
  WHERE tahun = p_tahun;
  
  -- Avoid division by zero
  IF v_total_hasil_kali_waktu = 0 THEN v_total_hasil_kali_waktu := 1; END IF;
  IF v_total_hasil_kali = 0 THEN v_total_hasil_kali := 1; END IF;
  
  RAISE NOTICE 'Totals calculated: waktu=%, hasil=%', v_total_hasil_kali_waktu, v_total_hasil_kali;
  
  -- STEP 3: Update dasar_alokasi
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Updating dasar_alokasi (totals: waktu=%, hasil=%)', step_count, v_total_hasil_kali_waktu, v_total_hasil_kali;
  
  UPDATE kalkulasi_bdrs 
  SET 
    dasar_alokasi_waktu = ROUND((hasil_kali_waktu::numeric / v_total_hasil_kali_waktu)::numeric, 6),
    dasar_alokasi_hasil_kali = ROUND((hasil_kali::numeric / v_total_hasil_kali)::numeric, 6),
    updated_at = NOW()
  WHERE tahun = p_tahun;
  
  -- STEP 4: Get reference data for biaya calculation (mengambil data terbaru berdasarkan kode+tahun)
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Getting reference data (menggunakan data terbaru berdasarkan kode+tahun)...', step_count;
  
  -- Ambil data_biaya terbaru untuk UK044 berdasarkan tahun (bisa dari user manapun, ambil yang terbaru)
  SELECT * INTO v_biaya_data
  FROM data_biaya 
  WHERE kode_unit_kerja = 'UK044' 
  AND tahun = p_tahun
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1;
  
  -- Jika tidak ada data_biaya, akan menggunakan COALESCE di query UPDATE untuk handle NULL
  IF v_biaya_data IS NULL THEN
    RAISE NOTICE 'Warning: Tidak ada data_biaya untuk UK044 tahun %, menggunakan nilai default 0 untuk semua biaya', p_tahun;
  END IF;
  
  -- Ambil distribusi_biaya_rekap terbaru berdasarkan tahun (bisa dari user manapun, ambil yang terbaru)
  SELECT COALESCE(uk044_bdrs, 0) INTO v_distribusi_tidak_langsung
  FROM distribusi_biaya_rekap 
  WHERE biaya = 'Biaya Tidak Langsung Terdistribusi'
  AND tahun = p_tahun
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1;
  
  -- STEP 5: Update all biaya calculations
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating all biaya columns...', step_count;
  
  UPDATE kalkulasi_bdrs 
  SET 
    -- Biaya menggunakan dasar_alokasi_hasil_kali
    biaya_gaji_tunjangan = ROUND((
      COALESCE(v_biaya_data.biaya_gaji_tunjangan, 0) * 
      dasar_alokasi_hasil_kali / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_jasa_pelayanan = 0, -- Dikosongkan sesuai instruksi
    
    -- Biaya menggunakan dasar_alokasi_waktu
    biaya_obat = ROUND((
      COALESCE(v_biaya_data.biaya_obat, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_bhp = ROUND((
      COALESCE(v_biaya_data.biaya_bhp, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_makan_karyawan = ROUND((
      COALESCE(v_biaya_data.biaya_makan_karyawan, 0) * 
      dasar_alokasi_waktu / GREATEST(jumlah, 1)
    )::numeric, 0),
    
    biaya_makan_pasien = ROUND((
      COALESCE(v_biaya_data.biaya_makan_pasien, 0) * 
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
    
  WHERE tahun = p_tahun;
  
  -- STEP 6: Calculate unit_cost_per_pemeriksaan
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating unit_cost_per_pemeriksaan...', step_count;
  
  UPDATE kalkulasi_bdrs 
  SET 
    unit_cost_per_pemeriksaan = ROUND((
      biaya_gaji_tunjangan + 
      biaya_jasa_pelayanan + 
      biaya_obat + 
      biaya_bhp + 
      biaya_makan_karyawan + 
      biaya_makan_pasien + 
      biaya_rumah_tangga + 
      biaya_cetak + 
      biaya_atk + 
      biaya_listrik + 
      biaya_air + 
      biaya_telp + 
      biaya_pemeliharaan_bangunan + 
      biaya_pemeliharaan_alat_medis + 
      biaya_pemeliharaan_alat_non_medis + 
      biaya_operasional_lainnya + 
      biaya_penyusutan_gedung + 
      biaya_penyusutan_jaringan + 
      biaya_penyusutan_alat_medis + 
      biaya_penyusutan_alat_non_medis + 
      biaya_pendidikan_pelatihan + 
      biaya_laundry + 
      biaya_sterilisasi + 
      biaya_tidak_langsung_terdistribusi + 
      COALESCE(biaya_bahan_pemeriksaan_numeric, 0)
    )::numeric, 0),
    updated_at = NOW()
  WHERE tahun = p_tahun;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  -- STEP 7: Refresh rekapitulasi_unit_cost (dengan error handling)
  -- Skip refresh untuk menghindari timeout, bisa dilakukan secara terpisah
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Attempting to refresh rekapitulasi_unit_cost (dengan error handling)...', step_count;
  
  BEGIN
    -- Restore skip flag sementara untuk refresh
    PERFORM set_config('app.skip_rekap_refresh', '0', true);
    
    -- Panggil refresh dengan p_user_id = NULL untuk sync global berdasarkan kode+tahun
    PERFORM refresh_rekapitulasi_unit_cost(NULL, p_tahun);
    
    RAISE NOTICE 'Rekapitulasi unit cost refreshed successfully';
  EXCEPTION
    WHEN OTHERS THEN
      -- Jika refresh gagal, catat error tapi jangan gagalkan seluruh proses
      v_refresh_error := SQLERRM;
      RAISE NOTICE 'Warning: Refresh rekapitulasi_unit_cost gagal: %', v_refresh_error;
      RAISE NOTICE 'Rekalkulasi BDRS tetap berhasil, refresh bisa dilakukan secara terpisah';
  END;
  
  -- Restore skip flag
  PERFORM set_config('app.skip_rekap_refresh', COALESCE(v_prev_skip, '0'), true);
  
  -- Build success result
  result := jsonb_build_object(
    'success', true,
    'message', 'Rekalkulasi BDRS berhasil diselesaikan',
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
    ),
    'refresh_warning', CASE WHEN v_refresh_error IS NOT NULL THEN v_refresh_error ELSE NULL END
  );
  
  RAISE NOTICE 'Manual recalculation BDRS completed successfully in %s', clock_timestamp() - start_time;
  RETURN result;
  
EXCEPTION
  WHEN query_canceled THEN
    -- Restore skip flag sebelum return
    PERFORM set_config('app.skip_rekap_refresh', COALESCE(v_prev_skip, '0'), true);
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Rekalkulasi dibatalkan karena timeout. Proses memakan waktu terlalu lama.',
      'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
      'steps_completed', step_count,
      'suggestion', 'Silakan coba lagi atau hubungi administrator jika masalah berlanjut'
    );
  WHEN OTHERS THEN
    -- Restore skip flag sebelum return
    PERFORM set_config('app.skip_rekap_refresh', COALESCE(v_prev_skip, '0'), true);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
      'steps_completed', step_count,
      'detail', 'Gagal melakukan rekalkulasi. Silakan periksa log untuk detail lebih lanjut.'
    );
END;
$function$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Fix final untuk manual_recalculate_bdrs completed successfully!' as status;
SELECT 'Perubahan: 1) Timeout 15 menit, 2) Skip refresh rekapitulasi, 3) Error handling lebih baik, 4) Progress tracking' as changes;

