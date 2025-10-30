-- Replace the original manual_recalculate_laboratorium function with the fixed version
-- This fixes the zero division issue where jumlah = 0 should result in unit cost = 0

CREATE OR REPLACE FUNCTION public.manual_recalculate_laboratorium(
  p_tahun INTEGER,
  p_user_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  result jsonb;
  start_time timestamptz := clock_timestamp();
  v_affected_rows integer := 0;
  v_distribusi_tidak_langsung numeric := 0;
  v_total_hasil_kali_waktu numeric := 0;
  step_count integer := 0;
  v_biaya_data record;
BEGIN
  -- Set timeout for this session (6 minutes)
  PERFORM set_config('statement_timeout', '360000', true);
  
  RAISE NOTICE 'Starting FIXED manual recalculation for Laboratorium - user %, tahun %', p_user_id, p_tahun;

  -- STEP 1: Update hasil_kali and dasar_alokasi_waktu dengan penanganan jumlah = 0
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating hasil_kali and dasar_alokasi_waktu with zero handling...', step_count;
  
  UPDATE kalkulasi_biaya_laboratorium
  SET
    -- Untuk jumlah = 0, hasil_kali = 0 (bukan 1)
    hasil_kali = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE waktu_pemeriksaan * jumlah
    END,
    
    -- Untuk jumlah = 0, hasil_kali_waktu = 0 (bukan 1)
    hasil_kali_waktu = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE waktu_pemeriksaan * profesionalisme * tingkat_kesulitan * jumlah
    END,
    
    -- Untuk jumlah = 0, dasar_alokasi_waktu = 0 (bukan 1)
    dasar_alokasi_waktu = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE waktu_pemeriksaan * jumlah
    END
  WHERE tahun = p_tahun;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated hasil_kali and dasar_alokasi_waktu for % records', v_affected_rows;

  -- STEP 2: Calculate total_hasil_kali_waktu for the unit (hanya yang jumlah > 0)
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Calculating totals for the unit (excluding zero quantities)...', step_count;
  
  SELECT
    COALESCE(SUM(hasil_kali_waktu), 1)  -- Gunakan 1 sebagai fallback, bukan 0
  INTO
    v_total_hasil_kali_waktu
  FROM kalkulasi_biaya_laboratorium
  WHERE tahun = p_tahun 
    AND kode_unit_kerja = 'UK038'
    AND jumlah > 0;  -- Hanya hitung yang jumlah > 0

  -- STEP 3: Update dasar_alokasi_hasil_kali dan dasar_alokasi_waktu
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Updating dasar_alokasi_hasil_kali and dasar_alokasi_waktu...', step_count;
  
  UPDATE kalkulasi_biaya_laboratorium
  SET
    -- Untuk jumlah = 0, dasar_alokasi = 0
    dasar_alokasi_hasil_kali = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((hasil_kali::numeric / GREATEST(SUM(hasil_kali) OVER (PARTITION BY tahun, kode_unit_kerja), 1))::numeric, 6)
    END,
    
    dasar_alokasi_waktu = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((hasil_kali_waktu::numeric / v_total_hasil_kali_waktu)::numeric, 6)
    END
  WHERE tahun = p_tahun AND kode_unit_kerja = 'UK038';

  -- STEP 4: Get reference data for biaya calculation for Laboratorium (UK038)
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Getting reference data for biaya calculation...', step_count;
  
  SELECT * INTO v_biaya_data
  FROM data_biaya 
  WHERE kode_unit_kerja = 'UK038' 
  AND tahun = p_tahun
  AND user_id = p_user_id
  LIMIT 1;

  -- Get distribusi tidak langsung for Laboratorium (UK038)
  BEGIN
    SELECT COALESCE(uk038_laboratorium_pk_pa, 0) INTO v_distribusi_tidak_langsung
    FROM distribusi_biaya_rekap
    WHERE biaya = 'Biaya Tidak Langsung Terdistribusi'
    AND tahun = p_tahun AND user_id = p_user_id LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      v_distribusi_tidak_langsung := 0;
  END;

  -- STEP 5: Update all biaya calculations dengan penanganan jumlah = 0
  step_count := step_count + 1;
  RAISE NOTICE 'Step %: Updating all biaya calculations with zero quantity handling...', step_count;
  
  UPDATE kalkulasi_biaya_laboratorium
  SET
    -- Untuk jumlah = 0, semua biaya = 0
    -- Untuk jumlah > 0, gunakan perhitungan normal
    biaya_gaji_tunjangan = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_gaji_tunjangan, 0) * 
        dasar_alokasi_hasil_kali / jumlah
      )::numeric, 0)
    END,
    
    biaya_jasa_pelayanan = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_jasa_pelayanan, 0) * 
        dasar_alokasi_hasil_kali / jumlah
      )::numeric, 0)
    END,
    
    biaya_obat = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_obat, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_bhp = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_bhp, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_makan_karyawan = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_makan_karyawan, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_makan_pasien = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_makan_pasien, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_rumah_tangga = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_rumah_tangga, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_cetak = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_cetak, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_atk = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_atk, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_listrik = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_listrik, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_air = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_air, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_telp = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_telp, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_pemeliharaan_bangunan = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_pemeliharaan_bangunan, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_pemeliharaan_alat_medis = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_pemeliharaan_alat_medis, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_pemeliharaan_alat_non_medis = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_pemeliharaan_alat_non_medis, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_operasional_lainnya = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_operasional_lainnya, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_penyusutan_gedung = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_gedung, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_penyusutan_jaringan = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_jaringan, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_penyusutan_alat_medis = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_alat_medis, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_penyusutan_alat_non_medis = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_penyusutan_alat_non_medis, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_pendidikan_pelatihan = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_pendidikan_pelatihan, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_laundry = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_laundry, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    biaya_sterilisasi = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        COALESCE(v_biaya_data.biaya_sterilisasi, 0) * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    -- Biaya tidak langsung terdistribusi
    biaya_tidak_langsung_terdistribusi = CASE 
      WHEN jumlah = 0 THEN 0
      ELSE ROUND((
        v_distribusi_tidak_langsung * 
        dasar_alokasi_waktu / jumlah
      )::numeric, 0)
    END,
    
    updated_at = NOW()
    
  WHERE tahun = p_tahun AND user_id = p_user_id AND kode_unit_kerja = 'UK038';

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

  result := jsonb_build_object(
    'success', true,
    'message', 'FIXED manual recalculation completed - zero quantities now properly handled',
    'affected_rows', v_affected_rows,
    'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
    'total_hasil_kali_waktu', v_total_hasil_kali_waktu,
    'total_biaya_tidak_langsung', v_distribusi_tidak_langsung,
    'steps_completed', step_count,
    'zero_quantity_handling', 'FIXED - quantities = 0 now result in unit cost = 0',
    'reference_data', jsonb_build_object(
      'biaya_gaji_tunjangan', COALESCE(v_biaya_data.biaya_gaji_tunjangan, 0),
      'biaya_jasa_pelayanan', COALESCE(v_biaya_data.biaya_jasa_pelayanan, 0),
      'biaya_obat', COALESCE(v_biaya_data.biaya_obat, 0),
      'biaya_bhp', COALESCE(v_biaya_data.biaya_bhp, 0),
      'distribusi_tidak_langsung', v_distribusi_tidak_langsung
    )
  );

  RAISE NOTICE 'FIXED manual recalculation Laboratorium completed successfully in %s', clock_timestamp() - start_time;
  RETURN result;

EXCEPTION
  WHEN query_canceled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rekalkulasi dibatalkan karena timeout - cobalah dengan data yang lebih sedikit',
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

-- Verifikasi bahwa fungsi telah diperbaiki
SELECT 
  'FUNCTION UPDATED' as status,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'manual_recalculate_laboratorium';
