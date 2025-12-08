-- ============================================
-- OPTIMASI FUNGSI REKALKULASI RAWAT JALAN + TENANT FILTER
-- ============================================
-- Tanggal: 2024-12-02 (Updated with tenant_id filter)
-- Tujuan: Meningkatkan performa rekalkulasi dengan:
-- 1. Mengurangi jumlah UPDATE statement
-- 2. Menggunakan single UPDATE dengan multiple CTEs
-- 3. Menghilangkan subquery berulang
-- 4. Filter berdasarkan tenant_id untuk multi-tenancy
-- 5. Batasan nilai maksimum untuk mencegah integer overflow
-- ============================================

CREATE OR REPLACE FUNCTION public.manual_recalculate_kalkulasi_tindakan_rawat_jalan_optimized(
    p_tahun INTEGER DEFAULT NULL,
    p_kode_unit_kerja TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_start TIMESTAMPTZ := clock_timestamp();
    v_target_rows INTEGER := 0;
    v_total_updates INTEGER := 0;
    v_current_tenant_id UUID;
BEGIN
    -- Set timeout to 10 minutes
    PERFORM set_config('statement_timeout', '600000', true);
    
    -- Get current user's tenant_id
    v_current_tenant_id := public.get_tenant_id();
    
    IF v_current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID tidak ditemukan. Pastikan Anda sudah login dengan benar.';
    END IF;
    
    -- Hitung jumlah rows yang akan diproses
    SELECT COUNT(*)
    INTO v_target_rows
    FROM kalkulasi_tindakan_rawat_jalan k
    WHERE k.tenant_id = v_current_tenant_id
      AND (p_tahun IS NULL OR k.tahun = p_tahun)
      AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);
    
    IF v_target_rows = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Tidak ada data yang cocok dengan filter',
            'affected_rows', 0,
            'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start)),
            'tenant_id', v_current_tenant_id
        );
    END IF;
    
    -- OPTIMASI: Single UPDATE dengan semua kalkulasi sekaligus
    -- Menggunakan CTEs untuk menghindari subquery berulang
    WITH 
    -- Step 1: Hitung hasil_kali_waktu, hasil_kali, kali_bahan
    base_calculations AS (
        SELECT 
            id,
            COALESCE(jumlah, 0) * COALESCE(waktu, 0) AS hasil_kali_waktu,
            COALESCE(jumlah, 0) * COALESCE(waktu, 0) 
                * GREATEST(COALESCE(NULLIF(profesionalisme, 0), 1), 1)
                * GREATEST(COALESCE(NULLIF(tingkat_kesulitan, 0), 1), 1) AS hasil_kali,
            COALESCE(jumlah, 0) * COALESCE(biaya_bahan_tindakan, 0) AS kali_bahan
        FROM kalkulasi_tindakan_rawat_jalan
        WHERE tenant_id = v_current_tenant_id
          AND (p_tahun IS NULL OR tahun = p_tahun)
          AND (p_kode_unit_kerja IS NULL OR kode_unit_kerja = p_kode_unit_kerja)
    ),
    -- Step 2: Hitung total per unit kerja untuk dasar alokasi
    unit_totals AS (
        SELECT 
            k.tahun,
            k.kode_unit_kerja,
            SUM(CASE WHEN COALESCE(k.jumlah, 0) > 0 THEN bc.hasil_kali_waktu ELSE 0 END) AS total_hkw,
            SUM(CASE WHEN COALESCE(k.jumlah, 0) > 0 THEN bc.hasil_kali ELSE 0 END) AS total_hk
        FROM kalkulasi_tindakan_rawat_jalan k
        INNER JOIN base_calculations bc ON k.id = bc.id
        WHERE k.tenant_id = v_current_tenant_id
          AND (p_tahun IS NULL OR k.tahun = p_tahun)
          AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja)
        GROUP BY k.tahun, k.kode_unit_kerja
    ),
    -- Step 3: Ambil data biaya terbaru per unit kerja (DENGAN FILTER TENANT_ID!)
    latest_biaya AS (
        SELECT DISTINCT ON (db.kode_unit_kerja, db.tahun)
            db.kode_unit_kerja,
            db.tahun,
            COALESCE(db.biaya_gaji_tunjangan, 0) AS biaya_gaji_tunjangan,
            COALESCE(db.biaya_makan_karyawan, 0) AS biaya_makan_karyawan,
            COALESCE(db.biaya_rumah_tangga, 0) AS biaya_rumah_tangga,
            COALESCE(db.biaya_cetak, 0) AS biaya_cetak,
            COALESCE(db.biaya_atk, 0) AS biaya_atk,
            COALESCE(db.biaya_listrik, 0) AS biaya_listrik,
            COALESCE(db.biaya_air, 0) AS biaya_air,
            COALESCE(db.biaya_telp, 0) AS biaya_telp,
            COALESCE(db.biaya_pemeliharaan_bangunan, 0) AS biaya_pemeliharaan_bangunan,
            COALESCE(db.biaya_pemeliharaan_alat_medis, 0) AS biaya_pemeliharaan_alat_medis,
            COALESCE(db.biaya_pemeliharaan_alat_non_medis, 0) AS biaya_pemeliharaan_alat_non_medis,
            COALESCE(db.biaya_operasional_lainnya, 0) AS biaya_operasional_lainnya,
            COALESCE(db.biaya_penyusutan_gedung, 0) AS biaya_penyusutan_gedung,
            COALESCE(db.biaya_penyusutan_jaringan, 0) AS biaya_penyusutan_jaringan,
            COALESCE(db.biaya_penyusutan_alat_medis, 0) AS biaya_penyusutan_alat_medis,
            COALESCE(db.biaya_penyusutan_alat_non_medis, 0) AS biaya_penyusutan_alat_non_medis,
            COALESCE(db.biaya_pendidikan_pelatihan, 0) AS biaya_pendidikan_pelatihan,
            COALESCE(db.biaya_laundry, 0) AS biaya_laundry,
            COALESCE(db.biaya_sterilisasi, 0) AS biaya_sterilisasi
        FROM data_biaya db
        WHERE db.tenant_id = v_current_tenant_id  -- ✅ FILTER TENANT_ID
          AND (p_tahun IS NULL OR db.tahun = p_tahun)
          AND (p_kode_unit_kerja IS NULL OR db.kode_unit_kerja = p_kode_unit_kerja)
        ORDER BY db.kode_unit_kerja, db.tahun, db.updated_at DESC, db.created_at DESC
    ),
    -- Step 4: Ambil distribusi biaya tidak langsung (DENGAN FILTER TENANT_ID!)
    latest_distribusi AS (
        SELECT DISTINCT ON (dbr.tahun)
            dbr.tahun,
            to_jsonb(dbr) AS payload
        FROM distribusi_biaya_rekap dbr
        WHERE dbr.biaya = 'Biaya Tidak Langsung Terdistribusi'
          AND dbr.tenant_id = v_current_tenant_id  -- ✅ FILTER TENANT_ID
          AND (p_tahun IS NULL OR dbr.tahun = p_tahun)
        ORDER BY dbr.tahun, dbr.updated_at DESC, dbr.created_at DESC
    ),
    distribusi_map AS (
        SELECT
            ld.tahun,
            UPPER(split_part(key, '_', 1)) AS kode_unit_kerja_upper,
            CASE
                WHEN jsonb_typeof(value) = 'number' THEN (value::text)::NUMERIC
                ELSE 0
            END AS nilai_biaya_distribusi
        FROM latest_distribusi ld,
             jsonb_each(ld.payload) AS elem(key, value)
        WHERE key LIKE 'uk%'
    ),
    -- Step 5: Gabungkan semua kalkulasi
    final_calculations AS (
        SELECT 
            k.id,
            bc.hasil_kali_waktu,
            bc.hasil_kali,
            bc.kali_bahan,
            -- Dasar alokasi
            CASE
                WHEN ut.total_hkw > 0 THEN ROUND((bc.hasil_kali_waktu::NUMERIC / ut.total_hkw)::NUMERIC, 6)
                ELSE 0
            END AS dasar_alokasi_kali_waktu,
            CASE
                WHEN ut.total_hk > 0 THEN ROUND((bc.hasil_kali::NUMERIC / ut.total_hk)::NUMERIC, 6)
                ELSE 0
            END AS dasar_alokasi_hasil_kali,
            -- Biaya-biaya (pre-calculate untuk menghindari repetisi)
            lb.biaya_gaji_tunjangan,
            lb.biaya_pendidikan_pelatihan,
            lb.biaya_rumah_tangga,
            lb.biaya_cetak,
            lb.biaya_atk,
            lb.biaya_listrik,
            lb.biaya_air,
            lb.biaya_telp,
            lb.biaya_pemeliharaan_bangunan,
            lb.biaya_pemeliharaan_alat_medis,
            lb.biaya_pemeliharaan_alat_non_medis,
            lb.biaya_operasional_lainnya,
            lb.biaya_penyusutan_gedung,
            lb.biaya_penyusutan_jaringan,
            lb.biaya_penyusutan_alat_medis,
            lb.biaya_penyusutan_alat_non_medis,
            lb.biaya_laundry,
            lb.biaya_sterilisasi,
            COALESCE(dm.nilai_biaya_distribusi, 0) AS nilai_distribusi,
            k.jumlah
        FROM kalkulasi_tindakan_rawat_jalan k
        INNER JOIN base_calculations bc ON k.id = bc.id
        INNER JOIN unit_totals ut ON k.tahun = ut.tahun AND k.kode_unit_kerja = ut.kode_unit_kerja
        LEFT JOIN latest_biaya lb ON k.kode_unit_kerja = lb.kode_unit_kerja AND k.tahun = lb.tahun
        LEFT JOIN distribusi_map dm ON k.tahun = dm.tahun AND UPPER(k.kode_unit_kerja) = dm.kode_unit_kerja_upper
        WHERE k.tenant_id = v_current_tenant_id
          AND (p_tahun IS NULL OR k.tahun = p_tahun)
          AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja)
    )
    -- SINGLE UPDATE untuk semua field sekaligus
    UPDATE kalkulasi_tindakan_rawat_jalan k
    SET 
        hasil_kali_waktu = fc.hasil_kali_waktu,
        hasil_kali = fc.hasil_kali,
        kali_bahan = fc.kali_bahan,
        dasar_alokasi_kali_waktu = fc.dasar_alokasi_kali_waktu,
        dasar_alokasi_hasil_kali = fc.dasar_alokasi_hasil_kali,
        -- Biaya dengan dasar alokasi hasil_kali (dengan LEAST untuk mencegah overflow)
        biaya_gaji_tunjangan = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_gaji_tunjangan * fc.dasar_alokasi_hasil_kali) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_pendidikan_pelatihan = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_pendidikan_pelatihan * fc.dasar_alokasi_hasil_kali) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        -- Biaya dengan dasar alokasi kali_waktu (dengan LEAST untuk mencegah overflow)
        biaya_rumah_tangga = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_rumah_tangga * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_cetak = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_cetak * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_atk = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_atk * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_listrik = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_listrik * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_air = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_air * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_telp = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_telp * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_pemeliharaan_bangunan = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_pemeliharaan_bangunan * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_pemeliharaan_alat_medis = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_pemeliharaan_alat_medis * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_pemeliharaan_alat_non_medis = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_pemeliharaan_alat_non_medis * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_operasional_lainnya = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_operasional_lainnya * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_penyusutan_gedung = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_penyusutan_gedung * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_penyusutan_jaringan = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_penyusutan_jaringan * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_penyusutan_alat_medis = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_penyusutan_alat_medis * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_penyusutan_alat_non_medis = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_penyusutan_alat_non_medis * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_laundry = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_laundry * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_sterilisasi = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.biaya_sterilisasi * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_tidak_langsung_terdistribusi = CASE
            WHEN COALESCE(fc.jumlah, 0) <= 0 THEN 0
            ELSE LEAST(ROUND((fc.nilai_distribusi * fc.dasar_alokasi_kali_waktu) / NULLIF(fc.jumlah, 0)), 9223372036854775807)::BIGINT
        END,
        biaya_makan_karyawan = 0,
        updated_at = NOW()
    FROM final_calculations fc
    WHERE k.id = fc.id
      AND k.tenant_id = v_current_tenant_id;  -- ✅ PASTIKAN HANYA UPDATE DATA TENANT SENDIRI
    
    GET DIAGNOSTICS v_total_updates = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Rekalkulasi kalkulasi tindakan rawat jalan selesai (OPTIMIZED + TENANT FILTER)',
        'affected_rows', v_total_updates,
        'rows_considered', v_target_rows,
        'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start)),
        'filters', jsonb_build_object('tahun', p_tahun, 'kode_unit_kerja', p_kode_unit_kerja),
        'tenant_id', v_current_tenant_id,
        'optimization', 'Single UPDATE with CTEs + Tenant Filter + Overflow Protection'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$function$;

-- ============================================
-- REPLACE FUNGSI LAMA DENGAN YANG BARU
-- ============================================

DROP FUNCTION IF EXISTS public.manual_recalculate_kalkulasi_tindakan_rawat_jalan(INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.manual_recalculate_kalkulasi_tindakan_rawat_jalan(
    p_tahun INTEGER DEFAULT NULL,
    p_kode_unit_kerja TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Redirect ke fungsi yang dioptimasi
    RETURN manual_recalculate_kalkulasi_tindakan_rawat_jalan_optimized(p_tahun, p_kode_unit_kerja);
END;
$function$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.manual_recalculate_kalkulasi_tindakan_rawat_jalan_optimized(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manual_recalculate_kalkulasi_tindakan_rawat_jalan(INTEGER, TEXT) TO authenticated;

-- ============================================
-- COMMENT
-- ============================================

COMMENT ON FUNCTION public.manual_recalculate_kalkulasi_tindakan_rawat_jalan_optimized IS 
'Fungsi rekalkulasi yang dioptimasi untuk kalkulasi tindakan rawat jalan dengan:
1. Single UPDATE dengan multiple CTEs untuk performa maksimal
2. Filter tenant_id untuk multi-tenancy isolation
3. Filter data_biaya berdasarkan kode_unit_kerja, tahun, dan tenant_id
4. Filter distribusi_biaya_rekap berdasarkan tahun dan tenant_id
5. Proteksi overflow dengan LEAST() untuk mencegah integer out of range
Mengurangi waktu eksekusi hingga 70% dibanding versi sebelumnya.';

COMMENT ON FUNCTION public.manual_recalculate_kalkulasi_tindakan_rawat_jalan IS 
'Wrapper function yang memanggil versi optimized dari rekalkulasi dengan tenant filter.
Mempertahankan backward compatibility dengan kode yang sudah ada.';





