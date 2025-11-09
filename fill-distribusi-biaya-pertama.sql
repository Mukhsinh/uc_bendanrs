-- Recalculate and fill existing distribusi_biaya_pertama table exactly per rules
-- This does NOT create new tables. It relies on:
--  - distribusi_biaya_pertama (existing, denormalized with many UK columns)
--  - distribusi_biaya_pertama_norm (normalized rows) from recalculate_distribusi_biaya_pertama()
--  - get_dasar_alokasi_field() and v_biaya_tahunan_preferensi or preference logic
-- Helper to recompute distribusi biaya pertama for a given user and year,
-- then rebuild the denormalized pivot table and show UK028 row for verification
DO $$
DECLARE
  v_user UUID := (SELECT user_id FROM data_biaya ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1);
  v_tahun INT := 2025;
BEGIN
  PERFORM public.recalculate_distribusi_biaya_pertama(v_user, v_tahun);
  PERFORM public.rebuild_distribusi_biaya_pertama_table(v_tahun);
END $$;

-- Show UK028 Unit IT row and distribution totals
SELECT *
FROM public.distribusi_biaya_pertama
WHERE tahun = 2025 AND unit_kerja_pusat_biaya ILIKE 'UK028%IT%';

-- Quick summary check of normalized totals vs biaya_tahunan
SELECT * FROM public.v_distribusi_biaya_pertama_summary
WHERE tahun = 2025 AND pusat_kode = 'UK028';
CREATE OR REPLACE FUNCTION public.recalculate_and_fill_distribusi_biaya_pertama(
  p_user_id UUID,
  p_tahun INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Penting: Jalankan dengan hak akses owner fungsi (bypass RLS)
SET search_path = public
AS $$
DECLARE
  v_rows BIGINT := 0;
  v_msg TEXT := 'OK';
  rec_pusat RECORD;
  rec_col RECORD;
  v_cols TEXT := '';
  v_vals TEXT := '';
  v_sql TEXT;
  v_ket TEXT;
  v_basis TEXT;
  v_biaya BIGINT;
  v_total_alokasi BIGINT;
  v_target_prefix TEXT;
  v_norm_count BIGINT := 0;
  v_recalc_result JSON;
  v_user_data_count BIGINT := 0;
BEGIN
  -- Ensure target table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='distribusi_biaya_pertama'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Tabel distribusi_biaya_pertama tidak ditemukan');
  END IF;

  -- PENTING: Tidak mempertimbangkan user_id, hanya tahun
  -- Cek apakah ada data biaya untuk tahun tersebut (siapa pun user_id nya)
  SELECT COUNT(*)
  INTO v_user_data_count
  FROM public.data_biaya db
  WHERE db.tahun = p_tahun
    AND db.total_biaya_tanpa_jp > 0;
  
  IF v_user_data_count = 0 THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Tidak ada data biaya untuk tahun ' || p_tahun || '. Pastikan data biaya sudah diinput untuk unit kerja pusat biaya.',
      'inserted_rows', 0
    );
  END IF;

  -- Step 1: Recalculate normalized rows berdasarkan TAHUN saja (tidak mempertimbangkan user_id)
  -- Fungsi recalculate_distribusi_biaya_pertama akan mengambil data biaya terbaru untuk setiap unit kerja
  -- Tabel distribusi_biaya_pertama_norm hanya digunakan sebagai working table sementara
  SELECT public.recalculate_distribusi_biaya_pertama(p_user_id, p_tahun) INTO v_recalc_result;
  
  -- Check if recalculate was successful
  IF v_recalc_result->>'success' != 'true' THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Gagal menghitung distribusi: ' || COALESCE(v_recalc_result->>'message', 'Unknown error'),
      'inserted_rows', 0
    );
  END IF;

  -- Check if there's data in normalized table after recalculate
  SELECT COUNT(*) INTO v_norm_count
  FROM public.distribusi_biaya_pertama_norm
  WHERE tahun = p_tahun;
  
  IF v_norm_count = 0 THEN
    -- Cek lebih detail kenapa tidak ada data
    SELECT COUNT(*)
    INTO v_user_data_count
    FROM public.data_biaya db
    INNER JOIN public.unit_kerja uk ON uk.id = db.unit_kerja_id
    WHERE db.tahun = p_tahun
      AND uk.kategori = 'Pusat Biaya'
      AND db.total_biaya_tanpa_jp > 0;
    
    IF v_user_data_count = 0 THEN
      RETURN json_build_object(
        'success', false, 
        'message', 'Tidak ada data biaya untuk unit kerja pusat biaya pada tahun ' || p_tahun || '. Pastikan data biaya sudah diinput.',
        'inserted_rows', 0
      );
    ELSE
      RETURN json_build_object(
        'success', false, 
        'message', 'Tidak ada data yang dapat dihitung. Kemungkinan semua unit kerja pusat biaya memiliki biaya = 0 atau denominator alokasi = 0. Data biaya ada: ' || v_user_data_count || ' unit.',
        'inserted_rows', 0
      );
    END IF;
  END IF;

  -- Step 2: Clear existing year rows to be rebuilt (HANYA di tabel distribusi_biaya_pertama)
  -- PENTING: Hapus dulu data di distribusi_biaya_kedua yang mereferensi distribusi_biaya_pertama
  -- untuk menghindari foreign key constraint violation
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='distribusi_biaya_kedua'
  ) THEN
    -- Hapus data di distribusi_biaya_kedua yang mereferensi distribusi_biaya_pertama dengan tahun yang sama
    DELETE FROM public.distribusi_biaya_kedua
    WHERE distribusi_biaya_pertama_id IN (
      SELECT id FROM public.distribusi_biaya_pertama WHERE tahun = p_tahun
    );
  END IF;
  
  -- INI ADALAH SATU-SATUNYA UPDATE LANGSUNG KE TABEL distribusi_biaya_pertama
  EXECUTE 'DELETE FROM public.distribusi_biaya_pertama WHERE tahun = $1' USING p_tahun;

  -- Step 3: Iterate each pusat row and INSERT ke tabel distribusi_biaya_pertama
  -- Hanya membaca dari distribusi_biaya_pertama_norm (tidak mengupdate)
  FOR rec_pusat IN (
    SELECT tahun, pusat_unit_kerja_id, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan
    FROM public.distribusi_biaya_pertama_norm
    WHERE tahun = p_tahun
    GROUP BY tahun, pusat_unit_kerja_id, pusat_kode, pusat_nama, dasar_alokasi, biaya_tahunan
    ORDER BY pusat_kode
  ) LOOP
    v_basis := rec_pusat.dasar_alokasi;
    v_biaya := rec_pusat.biaya_tahunan;
    -- Hitung total alokasi (jumlah distribusi I) dari tabel normalisasi untuk pusat & tahun
    -- Hanya menghitung distribusi ke unit selain unit sumber (unit sumber mendapat 0)
    SELECT COALESCE(SUM(n.alokasi), 0)
    INTO v_total_alokasi
    FROM public.distribusi_biaya_pertama_norm n
    WHERE n.tahun = rec_pusat.tahun
      AND n.pusat_unit_kerja_id = rec_pusat.pusat_unit_kerja_id
      AND n.target_unit_kerja_id != rec_pusat.pusat_unit_kerja_id;  -- Exclude self
    v_ket := CASE v_basis
               WHEN 'Total_SDM' THEN 'Basis: Jumlah SDM Semua UK (kecuali sumber)'
               WHEN 'Total_Kunjungan_Pasien' THEN 'Basis: Total Kunjungan Pasien Semua UK (kecuali sumber)'
               WHEN 'Luas_Ruangan' THEN 'Basis: Luas Ruangan Semua UK (kecuali sumber)'
               WHEN 'Komputer_simrs_user' THEN 'Basis: Komputer SIMRS User Semua UK (kecuali sumber)'
               ELSE 'Basis: ' || COALESCE(v_basis,'-') || ' Semua UK (kecuali sumber)'
             END;

    -- Start common columns that often appear in the table
    v_cols := '';
    v_vals := '';

    -- Helper to conditionally add a column if it exists in the table
    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='unit_kerja_pusat_biaya';
    IF FOUND THEN
      v_cols := v_cols || ', unit_kerja_pusat_biaya';
      v_vals := v_vals || format(', %L', rec_pusat.pusat_kode || ' - ' || rec_pusat.pusat_nama);
    END IF;

    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='kode_unit_kerja';
    IF FOUND THEN
      v_cols := v_cols || ', kode_unit_kerja';
      v_vals := v_vals || format(', %L', rec_pusat.pusat_kode);
    END IF;

    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='nama_unit_kerja';
    IF FOUND THEN
      v_cols := v_cols || ', nama_unit_kerja';
      v_vals := v_vals || format(', %L', rec_pusat.pusat_nama);
    END IF;

    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='user_id';
    IF FOUND THEN
      v_cols := v_cols || ', user_id';
      -- Gunakan user_id yang login (p_user_id) untuk kolom user_id di tabel distribusi_biaya_pertama
      -- meskipun data biaya berasal dari user_id yang berbeda
      v_vals := v_vals || format(', %L', p_user_id::text);
    END IF;

    -- audit_check: OK jika jumlah_biaya_terdistribusi_i = biaya_tahunan (selisih <= 10 untuk toleransi pembulatan)
    PERFORM 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='audit_check';
    IF FOUND THEN
      v_cols := v_cols || ', audit_check';
      v_vals := v_vals || ', ' || quote_literal(
        CASE WHEN ABS(COALESCE(v_total_alokasi, 0) - v_biaya) <= 10 THEN 'OK' ELSE 'CEK' END
      );
    END IF;

    -- Optional: jumlah_biaya_terdistribusi_i diisi dari total alokasi (sum dari norm)
    PERFORM 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='jumlah_biaya_terdistribusi_i';
    IF FOUND THEN
      v_cols := v_cols || ', jumlah_biaya_terdistribusi_i';
      v_vals := v_vals || ', ' || COALESCE(v_total_alokasi, 0)::BIGINT;
    END IF;

    -- mandatory fields
    v_cols := v_cols || ', biaya_tahunan, dasar_alokasi, tahun, keterangan';
    v_vals := v_vals || format(', %s, %L, %s, %L', v_biaya, v_basis, p_tahun, v_ket);

    -- Add all unit columns that exist in the table; set values from normalized table
    FOR rec_col IN (
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='distribusi_biaya_pertama'
        AND column_name LIKE 'uk%'
      ORDER BY column_name
    ) LOOP
      v_target_prefix := split_part(rec_col.column_name, '_', 1);
      v_cols := v_cols || ', ' || quote_ident(rec_col.column_name);
      v_vals := v_vals || format(', COALESCE((
        SELECT SUM(n.alokasi)
        FROM public.distribusi_biaya_pertama_norm n
        WHERE n.tahun = %s
          AND n.pusat_unit_kerja_id = %L
          AND lower(replace(n.target_kode, '' '', ''_'')) = lower(%L)
      ), 0)::BIGINT', rec_pusat.tahun, rec_pusat.pusat_unit_kerja_id, v_target_prefix);
    END LOOP;

    -- Build and execute insert (HANYA insert ke tabel distribusi_biaya_pertama)
    v_sql := 'INSERT INTO public.distribusi_biaya_pertama (' || substring(v_cols from 3) || ') VALUES (' || substring(v_vals from 3) || ')';
    EXECUTE v_sql;
    v_rows := v_rows + 1;
  END LOOP;

  -- Final check: if no rows inserted but we had norm data, something went wrong
  IF v_rows = 0 AND v_norm_count > 0 THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Gagal memasukkan data ke tabel distribusi_biaya_pertama. Ada ' || v_norm_count || ' baris data normalized tetapi tidak ada yang diinsert.',
      'inserted_rows', 0
    );
  END IF;

  RETURN json_build_object(
    'success', true, 
    'inserted_rows', v_rows, 
    'message', v_msg,
    'norm_rows_count', v_norm_count
  );
END;
$$;

COMMENT ON FUNCTION public.recalculate_and_fill_distribusi_biaya_pertama(UUID, INT) IS
'FUNGSI UTAMA UNTUK UPDATE DATA: HANYA MENGUPDATE TABEL distribusi_biaya_pertama berdasarkan TAHUN (tidak mempertimbangkan user_id). Menggunakan SECURITY DEFINER untuk bypass RLS policy. Menggunakan data biaya terakhir diupdate untuk tahun tersebut dari siapa pun user yang menginput. Tabel distribusi_biaya_pertama_norm hanya digunakan sebagai working table sementara untuk kalkulasi. Alur: 1) Ambil data biaya terbaru untuk tahun (tidak peduli user_id), 2) Hitung distribusi ke tabel norm (working table internal), 3) DELETE dan INSERT ke tabel distribusi_biaya_pertama berdasarkan TAHUN (SATU-SATUNYA tabel yang diupdate untuk display).';


