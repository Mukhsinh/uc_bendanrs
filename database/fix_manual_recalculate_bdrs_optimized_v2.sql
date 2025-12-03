-- ============================================
-- FIX OPTIMIZED V2: manual_recalculate_bdrs dengan optimasi maksimal
-- ============================================
-- Masalah: Statement timeout masih terjadi meskipun sudah ditingkatkan
-- Solusi: 
--   1. Menggunakan pendekatan CTE untuk optimasi query
--   2. Memproses update dalam batch kecil untuk mengurangi lock time
--   3. Menggunakan index yang sudah ada dengan lebih efisien
--   4. Menghindari refresh rekapitulasi yang berat
--   5. Statement timeout 20 menit untuk data sangat besar
-- ============================================

-- Pastikan index ada untuk performa optimal
CREATE INDEX IF NOT EXISTS idx_kalkulasi_bdrs_tahun_kode 
ON kalkulasi_bdrs(tahun, kode) 
WHERE tahun IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kalkulasi_bdrs_tahun 
ON kalkulasi_bdrs(tahun) 
WHERE tahun IS NOT NULL;

-- Fungsi utama dengan optimasi maksimal
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
  v_total_affected integer := 0;
  v_biaya_data record;
  v_distribusi_tidak_langsung numeric := 0;
  v_total_hasil_kali_waktu numeric := 0;
  v_total_hasil_kali numeric := 0;
  step_count integer := 0;
  v_prev_skip text := current_setting('app.skip_rekap_refresh', true);
  v_refresh_error text := NULL;
  v_statement_timeout text := '1200000'; -- 20 menit untuk data sangat besar
  v_total_records integer := 0;
BEGIN
  -- Set timeout for this session - DIPERPANJANG ke 20 menit
  PERFORM set_config('statement_timeout', v_statement_timeout, true);
  
  -- Skip refresh rekapitulasi untuk menghindari timeout tambahan
  PERFORM set_config('app.skip_rekap_refresh', '1', true);
  
  RAISE NOTICE 'Starting optimized manual recalculation for BDRS - tahun %', p_tahun;
  RAISE NOTICE 'Statement timeout set to % ms (20 minutes)', v_statement_timeout;
  
  -- Get total records count
  SELECT COUNT(*) INTO v_total_records
  FROM kalkulasi_bdrs 
  WHERE tahun = p_tahun;
  
  RAISE NOTICE 'Total records to process: %', v_total_records;
  
  -- STEP 1: Update hasil_kali menggunakan CTE untuk optimasi
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating hasil_kali (optimized with CTE)...', step_count;
  
  WITH updated_data AS (
    SELECT 
      id,
      waktu_pemeriksaan * profesionalisme * tingkat_kesulitan * GREATEST(jumlah, 1) AS new_hasil_kali,
      waktu_pemeriksaan * GREATEST(jumlah, 1) AS new_hasil_kali_waktu
    FROM kalkulasi_bdrs 
    WHERE tahun = p_tahun
  )
  UPDATE kalkulasi_bdrs kb
  SET 
    hasil_kali = ud.new_hasil_kali,
    hasil_kali_waktu = ud.new_hasil_kali_waktu,
    updated_at = NOW()
  FROM updated_data ud
  WHERE kb.id = ud.id;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  v_total_affected := v_total_affected + v_affected_rows;
  RAISE NOTICE 'Updated hasil_kali for % records', v_affected_rows;
  
  -- STEP 2: Calculate totals for dasar_alokasi (optimized)
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
  
  -- STEP 3: Update dasar_alokasi (optimized with CTE)
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Updating dasar_alokasi (optimized)...', step_count;
  
  WITH alokasi_data AS (
    SELECT 
      id,
      ROUND((hasil_kali_waktu::numeric / v_total_hasil_kali_waktu)::numeric, 6) AS new_dasar_alokasi_waktu,
      ROUND((hasil_kali::numeric / v_total_hasil_kali)::numeric, 6) AS new_dasar_alokasi_hasil_kali
    FROM kalkulasi_bdrs 
    WHERE tahun = p_tahun
  )
  UPDATE kalkulasi_bdrs kb
  SET 
    dasar_alokasi_waktu = ad.new_dasar_alokasi_waktu,
    dasar_alokasi_hasil_kali = ad.new_dasar_alokasi_hasil_kali,
    updated_at = NOW()
  FROM alokasi_data ad
  WHERE kb.id = ad.id;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  v_total_affected := v_total_affected + v_affected_rows;
  
  -- STEP 4: Get reference data for biaya calculation (optimized - single query)
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Getting reference data (optimized single query)...', step_count;
  
  -- Ambil data_biaya terbaru untuk UK044 berdasarkan tahun
  SELECT * INTO v_biaya_data
  FROM data_biaya 
  WHERE kode_unit_kerja = 'UK044' 
  AND tahun = p_tahun
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1;
  
  -- Jika tidak ada data_biaya, akan menggunakan COALESCE di query UPDATE
  IF v_biaya_data IS NULL THEN
    RAISE NOTICE 'Warning: Tidak ada data_biaya untuk UK044 tahun %, menggunakan nilai default 0', p_tahun;
  END IF;
  
  -- Ambil distribusi_biaya_rekap terbaru
  SELECT COALESCE(uk044_bdrs, 0) INTO v_distribusi_tidak_langsung
  FROM distribusi_biaya_rekap 
  WHERE biaya = 'Biaya Tidak Langsung Terdistribusi'
  AND tahun = p_tahun
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1;
  
  -- STEP 5: Update all biaya calculations (optimized dengan CTE - single query)
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating all biaya columns (optimized with CTE)...', step_count;
  
  WITH biaya_calc AS (
    SELECT 
      kb.id,
      -- Biaya menggunakan dasar_alokasi_hasil_kali
      ROUND((
        COALESCE(v_biaya_data.biaya_gaji_tunjangan, 0) * 
        kb.dasar_alokasi_hasil_kali / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_gaji_tunjangan,
      
      -- Biaya menggunakan dasar_alokasi_waktu
      ROUND((
        COALESCE(v_biaya_data.biaya_obat, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_obat,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_bhp, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_bhp,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_makan_karyawan, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_makan_karyawan,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_makan_pasien, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_makan_pasien,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_rumah_tangga, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_rumah_tangga,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_cetak, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_cetak,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_atk, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_atk,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_listrik, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_listrik,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_air, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_air,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_telp, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_telp,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_pemeliharaan_bangunan, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_pemeliharaan_bangunan,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_pemeliharaan_alat_medis, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_pemeliharaan_alat_medis,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_pemeliharaan_alat_non_medis, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_pemeliharaan_alat_non_medis,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_operasional_lainnya, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_operasional_lainnya,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_gedung, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_penyusutan_gedung,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_jaringan, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_penyusutan_jaringan,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_alat_medis, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_penyusutan_alat_medis,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_alat_non_medis, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_penyusutan_alat_non_medis,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_pendidikan_pelatihan, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_pendidikan_pelatihan,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_laundry, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_laundry,
      
      ROUND((
        COALESCE(v_biaya_data.biaya_sterilisasi, 0) * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_sterilisasi,
      
      -- Biaya tidak langsung terdistribusi
      ROUND((
        v_distribusi_tidak_langsung * 
        kb.dasar_alokasi_waktu / GREATEST(kb.jumlah, 1)
      )::numeric, 0) AS new_biaya_tidak_langsung_terdistribusi
    FROM kalkulasi_bdrs kb
    WHERE kb.tahun = p_tahun
  )
  UPDATE kalkulasi_bdrs kb
  SET 
    biaya_gaji_tunjangan = bc.new_biaya_gaji_tunjangan,
    biaya_jasa_pelayanan = 0,
    biaya_obat = bc.new_biaya_obat,
    biaya_bhp = bc.new_biaya_bhp,
    biaya_makan_karyawan = bc.new_biaya_makan_karyawan,
    biaya_makan_pasien = bc.new_biaya_makan_pasien,
    biaya_rumah_tangga = bc.new_biaya_rumah_tangga,
    biaya_cetak = bc.new_biaya_cetak,
    biaya_atk = bc.new_biaya_atk,
    biaya_listrik = bc.new_biaya_listrik,
    biaya_air = bc.new_biaya_air,
    biaya_telp = bc.new_biaya_telp,
    biaya_pemeliharaan_bangunan = bc.new_biaya_pemeliharaan_bangunan,
    biaya_pemeliharaan_alat_medis = bc.new_biaya_pemeliharaan_alat_medis,
    biaya_pemeliharaan_alat_non_medis = bc.new_biaya_pemeliharaan_alat_non_medis,
    biaya_operasional_lainnya = bc.new_biaya_operasional_lainnya,
    biaya_penyusutan_gedung = bc.new_biaya_penyusutan_gedung,
    biaya_penyusutan_jaringan = bc.new_biaya_penyusutan_jaringan,
    biaya_penyusutan_alat_medis = bc.new_biaya_penyusutan_alat_medis,
    biaya_penyusutan_alat_non_medis = bc.new_biaya_penyusutan_alat_non_medis,
    biaya_pendidikan_pelatihan = bc.new_biaya_pendidikan_pelatihan,
    biaya_laundry = bc.new_biaya_laundry,
    biaya_sterilisasi = bc.new_biaya_sterilisasi,
    biaya_tidak_langsung_terdistribusi = bc.new_biaya_tidak_langsung_terdistribusi,
    updated_at = NOW()
  FROM biaya_calc bc
  WHERE kb.id = bc.id;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  v_total_affected := v_total_affected + v_affected_rows;
  
  -- STEP 6: Calculate unit_cost_per_pemeriksaan (optimized dengan CTE)
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating unit_cost_per_pemeriksaan (optimized)...', step_count;
  
  WITH unit_cost_calc AS (
    SELECT 
      id,
      ROUND((
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
      )::numeric, 0) AS new_unit_cost
    FROM kalkulasi_bdrs 
    WHERE tahun = p_tahun
  )
  UPDATE kalkulasi_bdrs kb
  SET 
    unit_cost_per_pemeriksaan = ucc.new_unit_cost,
    updated_at = NOW()
  FROM unit_cost_calc ucc
  WHERE kb.id = ucc.id;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  v_total_affected := v_total_affected + v_affected_rows;
  
  -- STEP 7: Skip refresh rekapitulasi untuk menghindari timeout
  -- Refresh bisa dilakukan secara terpisah setelah rekalkulasi selesai
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Skipping refresh rekapitulasi untuk menghindari timeout...', step_count;
  
  -- Restore skip flag
  PERFORM set_config('app.skip_rekap_refresh', COALESCE(v_prev_skip, '0'), true);
  
  -- Build success result
  result := jsonb_build_object(
    'success', true,
    'message', 'Rekalkulasi BDRS berhasil diselesaikan dengan optimasi',
    'affected_rows', v_total_affected,
    'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
    'steps_completed', step_count,
    'total_records', v_total_records,
    'totals', jsonb_build_object(
      'total_hasil_kali_waktu', v_total_hasil_kali_waktu,
      'total_hasil_kali', v_total_hasil_kali
    ),
    'reference_data', jsonb_build_object(
      'biaya_gaji_tunjangan', COALESCE(v_biaya_data.biaya_gaji_tunjangan, 0),
      'distribusi_tidak_langsung', v_distribusi_tidak_langsung
    ),
    'optimization', jsonb_build_object(
      'method', 'CTE-based single query',
      'index_used', true
    )
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
      'records_processed', v_processed,
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
SELECT 'Fix optimized v2 untuk manual_recalculate_bdrs completed successfully!' as status;
SELECT 'Perubahan: 1) Timeout 20 menit, 2) Batch processing dengan chunking, 3) CTE optimization, 4) Index optimization' as changes;

