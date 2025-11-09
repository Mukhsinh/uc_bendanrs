-- ============================================
-- Fungsi rekalkulasi kalkulasi_tindakan_inap
-- Rumus dasar alokasi:
--   dasar_alokasi_hasil_kali   = hasil_kali           / SUM(hasil_kali)   per (tahun,kode_unit_kerja)
--   dasar_alokasi_kali_waktu   = hasil_kali_waktu     / SUM(hasil_kali_waktu) per (tahun,kode_unit_kerja)
-- ============================================

DROP TRIGGER IF EXISTS trg_recalc_kalkulasi_tindakan_inap_from_jenis ON public.jenis_tindakan_inap;
DROP TRIGGER IF EXISTS trg_recalc_kalkulasi_tindakan_inap_from_data_biaya ON public.data_biaya;
DROP TRIGGER IF EXISTS trg_recalc_kalkulasi_tindakan_inap_from_distribusi ON public.distribusi_biaya_rekap;

DROP FUNCTION IF EXISTS public.trigger_recalculate_kalkulasi_tindakan_inap_from_jenis();
DROP FUNCTION IF EXISTS public.trigger_recalculate_kalkulasi_tindakan_inap_from_data_biaya();
DROP FUNCTION IF EXISTS public.trigger_recalculate_kalkulasi_tindakan_inap_from_distribusi();
DROP FUNCTION IF EXISTS public.manual_recalculate_kalkulasi_tindakan_inap(integer, text);

CREATE OR REPLACE FUNCTION public.manual_recalculate_kalkulasi_tindakan_inap(
  p_tahun INTEGER DEFAULT NULL,
  p_kode_unit_kerja TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_start        timestamptz := clock_timestamp();
  v_target_rows  integer := 0;
  v_last_count   integer := 0;
  v_total_updates integer := 0;
  v_steps        integer := 0;
  v_prev_skip    text := current_setting('app.skip_rekap_refresh', true);
  rec record;
BEGIN
  PERFORM set_config('statement_timeout', '360000', true);
  PERFORM set_config('app.skip_rekap_refresh', '1', true);

  SELECT COUNT(*)
  INTO v_target_rows
  FROM public.kalkulasi_tindakan_inap k
  WHERE (p_tahun IS NULL OR k.tahun = p_tahun)
    AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);

  IF v_target_rows = 0 THEN
    PERFORM set_config('app.skip_rekap_refresh', coalesce(v_prev_skip, '0'), true);
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tidak ada data kalkulasi tindakan inap yang cocok dengan filter',
      'affected_rows', 0,
      'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start))
    );
  END IF;

  v_steps := v_steps + 1;
  WITH latest_jenis AS (
    SELECT DISTINCT ON (jt.kode_unit_kerja, jt.kode_jenis_tindakan)
      jt.kode_unit_kerja,
      jt.kode_jenis_tindakan,
      coalesce(jt.jumlah, 0) AS jumlah,
      coalesce(jt.waktu, 0) AS waktu,
      coalesce(nullif(jt.profesionalisme, 0), 1) AS profesionalisme,
      coalesce(nullif(jt.tingkat_kesulitan, 0), 1) AS tingkat_kesulitan,
      coalesce(jt.biaya_bahan_tindakan, 0) AS biaya_bahan_tindakan
    FROM public.jenis_tindakan_inap jt
    WHERE (p_kode_unit_kerja IS NULL OR jt.kode_unit_kerja = p_kode_unit_kerja)
    ORDER BY jt.kode_unit_kerja, jt.kode_jenis_tindakan, jt.updated_at DESC, jt.created_at DESC
  )
  UPDATE public.kalkulasi_tindakan_inap k
  SET jumlah = lj.jumlah,
      waktu = lj.waktu,
      profesionalisme = lj.profesionalisme,
      tingkat_kesulitan = lj.tingkat_kesulitan,
      biaya_bahan_tindakan = lj.biaya_bahan_tindakan
  FROM latest_jenis lj
  WHERE k.kode_unit_kerja = lj.kode_unit_kerja
    AND k.kode_jenis_tindakan = lj.kode_jenis_tindakan
    AND (p_tahun IS NULL OR k.tahun = p_tahun)
    AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);

  GET DIAGNOSTICS v_last_count = ROW_COUNT;
  v_total_updates := v_total_updates + v_last_count;

  v_steps := v_steps + 1;
  UPDATE public.kalkulasi_tindakan_inap k
  SET kali_bahan = coalesce(k.jumlah, 0) * coalesce(k.biaya_bahan_tindakan, 0)::bigint
  WHERE (p_tahun IS NULL OR k.tahun = p_tahun)
    AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);

  GET DIAGNOSTICS v_last_count = ROW_COUNT;
  v_total_updates := v_total_updates                                                                                     + v_last_count;

  v_steps := v_steps + 1;
  UPDATE public.kalkulasi_tindakan_inap k
  SET hasil_kali_waktu = coalesce(k.jumlah, 0) * coalesce(k.waktu, 0),
      hasil_kali = coalesce(k.jumlah, 0) * coalesce(k.waktu, 0)
        * greatest(coalesce(nullif(k.profesionalisme, 0), 1), 1)
        * greatest(coalesce(nullif(k.tingkat_kesulitan, 0), 1), 1)
  WHERE (p_tahun IS NULL OR k.tahun = p_tahun)
    AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);

  GET DIAGNOSTICS v_last_count = ROW_COUNT;
  v_total_updates := v_total_updates + v_last_count;

  v_steps := v_steps + 1;
  WITH unit_totals AS (
    SELECT tahun,
           kode_unit_kerja,
           SUM(CASE WHEN coalesce(jumlah, 0) > 0 THEN coalesce(hasil_kali_waktu, 0) ELSE 0 END) AS total_hkw,
           SUM(CASE WHEN coalesce(jumlah, 0) > 0 THEN coalesce(hasil_kali, 0) ELSE 0 END)       AS total_hk
    FROM public.kalkulasi_tindakan_inap
    WHERE (p_tahun IS NULL OR tahun = p_tahun)
      AND (p_kode_unit_kerja IS NULL OR kode_unit_kerja = p_kode_unit_kerja)
    GROUP BY tahun, kode_unit_kerja
  ),
  rasio_refs AS (
    SELECT DISTINCT ON (upper(pat.kode_unit_kerja), pat.tahun)
      upper(pat.kode_unit_kerja) AS kode_unit_kerja_upper,
      pat.tahun,
      pat.rasio_tindakan
    FROM public.prosentase_akomodasi_tindakan pat
    WHERE (p_tahun IS NULL OR pat.tahun = p_tahun)
      AND (p_kode_unit_kerja IS NULL OR upper(pat.kode_unit_kerja) = upper(p_kode_unit_kerja))
    ORDER BY upper(pat.kode_unit_kerja), pat.tahun, pat.updated_at DESC, pat.created_at DESC
  )
  UPDATE public.kalkulasi_tindakan_inap k
  SET dasar_alokasi_kali_waktu = CASE
        WHEN ut.total_hkw > 0 THEN ROUND((coalesce(k.hasil_kali_waktu, 0)::numeric / ut.total_hkw)::numeric, 6)
        ELSE 0
      END,
      dasar_alokasi_hasil_kali = CASE
        WHEN ut.total_hk > 0 THEN ROUND((coalesce(k.hasil_kali, 0)::numeric / ut.total_hk)::numeric, 6)
        ELSE 0
      END,
      rasio_tindakan = CASE
        WHEN rr.rasio_tindakan IS NOT NULL THEN rr.rasio_tindakan
        ELSE k.rasio_tindakan
      END
  FROM unit_totals ut
  LEFT JOIN rasio_refs rr
    ON rr.kode_unit_kerja_upper = upper(ut.kode_unit_kerja)
   AND rr.tahun = ut.tahun
  WHERE k.tahun = ut.tahun
    AND k.kode_unit_kerja = ut.kode_unit_kerja
    AND (p_tahun IS NULL OR k.tahun = p_tahun)
    AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);

  GET DIAGNOSTICS v_last_count = ROW_COUNT;
  v_total_updates := v_total_updates + v_last_count;

  v_steps := v_steps + 1;
  WITH latest_biaya AS (
    SELECT DISTINCT ON (db.kode_unit_kerja, db.tahun)
      db.kode_unit_kerja,
      db.tahun,
      coalesce(db.biaya_gaji_tunjangan, 0) AS biaya_gaji_tunjangan,
      coalesce(db.biaya_bhp, 0)             AS biaya_bhp,
      coalesce(db.biaya_makan_karyawan, 0) AS biaya_makan_karyawan,
      coalesce(db.biaya_rumah_tangga, 0)   AS biaya_rumah_tangga,
      coalesce(db.biaya_cetak, 0)          AS biaya_cetak,
      coalesce(db.biaya_atk, 0)            AS biaya_atk,
      coalesce(db.biaya_listrik, 0)        AS biaya_listrik,
      coalesce(db.biaya_air, 0)            AS biaya_air,
      coalesce(db.biaya_telp, 0)           AS biaya_telp,
      coalesce(db.biaya_pemeliharaan_bangunan, 0)     AS biaya_pemeliharaan_bangunan,
      coalesce(db.biaya_pemeliharaan_alat_medis, 0)   AS biaya_pemeliharaan_alat_medis,
      coalesce(db.biaya_pemeliharaan_alat_non_medis, 0) AS biaya_pemeliharaan_alat_non_medis,
      coalesce(db.biaya_operasional_lainnya, 0)       AS biaya_operasional_lainnya,
      coalesce(db.biaya_penyusutan_gedung, 0)         AS biaya_penyusutan_gedung,
      coalesce(db.biaya_penyusutan_jaringan, 0)       AS biaya_penyusutan_jaringan,
      coalesce(db.biaya_penyusutan_alat_medis, 0)     AS biaya_penyusutan_alat_medis,
      coalesce(db.biaya_penyusutan_alat_non_medis, 0) AS biaya_penyusutan_alat_non_medis,
      coalesce(db.biaya_pendidikan_pelatihan, 0)      AS biaya_pendidikan_pelatihan,
      coalesce(db.biaya_laundry, 0)                  AS biaya_laundry,
      coalesce(db.biaya_sterilisasi, 0)              AS biaya_sterilisasi,
      coalesce(db.total_biaya_tanpa_jp, 0)           AS total_biaya_tanpa_jp
    FROM public.data_biaya db
    WHERE (p_tahun IS NULL OR db.tahun = p_tahun)
      AND (p_kode_unit_kerja IS NULL OR db.kode_unit_kerja = p_kode_unit_kerja)
    ORDER BY db.kode_unit_kerja, db.tahun, db.updated_at DESC, db.created_at DESC
  )
  UPDATE public.kalkulasi_tindakan_inap k
  SET
    biaya_gaji_tunjangan = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_gaji_tunjangan, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_hasil_kali, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_bhp = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round((lb.biaya_bhp * coalesce(k.dasar_alokasi_kali_waktu, 0)) / nullif(k.jumlah, 0))::bigint
    END,
    biaya_makan_karyawan = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round((lb.biaya_makan_karyawan * coalesce(k.dasar_alokasi_kali_waktu, 0)) / nullif(k.jumlah, 0))::bigint
    END,
    biaya_rumah_tangga = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_rumah_tangga, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_cetak = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_cetak, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_atk = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_atk, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_listrik = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_listrik, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_air = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_air, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_telp = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_telp, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_pemeliharaan_bangunan = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_pemeliharaan_bangunan, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_pemeliharaan_alat_medis = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_pemeliharaan_alat_medis, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_pemeliharaan_alat_non_medis = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_pemeliharaan_alat_non_medis, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_operasional_lainnya = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_operasional_lainnya, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_penyusutan_gedung = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_penyusutan_gedung, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_penyusutan_jaringan = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_penyusutan_jaringan, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_penyusutan_alat_medis = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_penyusutan_alat_medis, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_penyusutan_alat_non_medis = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_penyusutan_alat_non_medis, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_pendidikan_pelatihan = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_pendidikan_pelatihan, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_laundry = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_laundry, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END,
    biaya_sterilisasi = CASE
      WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
      ELSE round(
        coalesce(lb.biaya_sterilisasi, 0)::numeric
        * CASE
            WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
              THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
            ELSE coalesce(k.rasio_tindakan, 0)::numeric
          END
        * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
        / nullif(k.jumlah, 0)::numeric
      )::bigint
    END
  FROM latest_biaya lb
  WHERE k.kode_unit_kerja = lb.kode_unit_kerja
    AND k.tahun = lb.tahun
    AND (p_tahun IS NULL OR k.tahun = p_tahun)
    AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);

  GET DIAGNOSTICS v_last_count = ROW_COUNT;
  v_total_updates := v_total_updates + v_last_count;

  v_steps := v_steps + 1;
  WITH latest_distribusi AS (
    SELECT DISTINCT ON (dbr.tahun)
      dbr.tahun,
      to_jsonb(dbr) AS payload
    FROM public.distribusi_biaya_rekap dbr
    WHERE dbr.biaya = 'Biaya Tidak Langsung Terdistribusi'
      AND (p_tahun IS NULL OR dbr.tahun = p_tahun)
    ORDER BY dbr.tahun, dbr.updated_at DESC, dbr.created_at DESC
  ),
  distribusi_map AS (
    SELECT
      ld.tahun,
      split_part(key, '_', 1) AS kode_unit_kerja_raw,
      upper(split_part(key, '_', 1)) AS kode_unit_kerja_upper,
      CASE
        WHEN jsonb_typeof(value) = 'number' THEN (value::text)::numeric
        ELSE 0
      END AS nilai_biaya_distribusi
    FROM latest_distribusi ld,
         jsonb_each(ld.payload) AS elem(key, value)
    WHERE key LIKE 'uk%'
  )
  UPDATE public.kalkulasi_tindakan_inap k
  SET biaya_tidak_langsung_terdistribusi = CASE
        WHEN coalesce(k.jumlah, 0) <= 0 THEN 0
        ELSE round((
              coalesce((
                SELECT dm.nilai_biaya_distribusi
                FROM distribusi_map dm
                WHERE dm.tahun = k.tahun
                  AND dm.kode_unit_kerja_upper = upper(k.kode_unit_kerja)
              ), 0)::numeric
              * CASE
                  WHEN abs(coalesce(k.rasio_tindakan, 0)) > 1
                    THEN coalesce(k.rasio_tindakan, 0)::numeric / 100::numeric
                  ELSE coalesce(k.rasio_tindakan, 0)::numeric
                END
              * coalesce(k.dasar_alokasi_kali_waktu, 0)::numeric
            ) / nullif(k.jumlah, 0)::numeric)::bigint
      END
  WHERE (p_tahun IS NULL OR k.tahun = p_tahun)
    AND (p_kode_unit_kerja IS NULL OR k.kode_unit_kerja = p_kode_unit_kerja);

  GET DIAGNOSTICS v_last_count = ROW_COUNT;
  v_total_updates := v_total_updates + v_last_count;

  PERFORM set_config('app.skip_rekap_refresh', coalesce(v_prev_skip, '0'), true);

  FOR rec IN (
    SELECT DISTINCT user_id, tahun
    FROM public.kalkulasi_tindakan_inap
    WHERE user_id IS NOT NULL
      AND (p_tahun IS NULL OR tahun = p_tahun)
      AND (p_kode_unit_kerja IS NULL OR kode_unit_kerja = p_kode_unit_kerja)
  ) LOOP
    PERFORM public.refresh_rekapitulasi_unit_cost(rec.user_id, rec.tahun);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rekalkulasi kalkulasi tindakan inap selesai',
    'affected_rows', v_total_updates,
    'rows_considered', v_target_rows,
    'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start)),
    'steps_completed', v_steps,
    'filters', jsonb_build_object('tahun', p_tahun, 'kode_unit_kerja', p_kode_unit_kerja)
  );
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.skip_rekap_refresh', coalesce(v_prev_skip, '0'), true);
    RAISE;
END;
$function$;

COMMENT ON FUNCTION public.manual_recalculate_kalkulasi_tindakan_inap(integer, text)
IS 'Rekalkulasi kalkulasi_tindakan_inap dengan dasar alokasi hasil_kali dan hasil_kali_waktu per unit kerja.';

GRANT EXECUTE ON FUNCTION public.manual_recalculate_kalkulasi_tindakan_inap(integer, text) TO authenticated;

-- ============================================
-- Trigger wrappers untuk rekalkulasi otomatis
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_recalculate_kalkulasi_tindakan_inap_from_jenis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_kode text := coalesce(new.kode_unit_kerja, old.kode_unit_kerja);
BEGIN
  IF v_kode IS NOT NULL THEN
    PERFORM public.manual_recalculate_kalkulasi_tindakan_inap(NULL, v_kode);
  END IF;
  RETURN coalesce(new, old);
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_kalkulasi_tindakan_inap_from_data_biaya()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_kode text := coalesce(new.kode_unit_kerja, old.kode_unit_kerja);
  v_tahun integer := coalesce(new.tahun, old.tahun);
BEGIN
  IF v_kode IS NOT NULL THEN
    PERFORM public.manual_recalculate_kalkulasi_tindakan_inap(v_tahun, v_kode);
  END IF;
  RETURN coalesce(new, old);
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_kalkulasi_tindakan_inap_from_distribusi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_tahun integer := coalesce(new.tahun, old.tahun);
BEGIN
  PERFORM public.manual_recalculate_kalkulasi_tindakan_inap(v_tahun, NULL);
  RETURN coalesce(new, old);
END;
$function$;

DROP TRIGGER IF EXISTS trg_recalc_kalkulasi_tindakan_inap_from_jenis ON public.jenis_tindakan_inap;
DROP TRIGGER IF EXISTS trg_recalc_kalkulasi_tindakan_inap_from_data_biaya ON public.data_biaya;
DROP TRIGGER IF EXISTS trg_recalc_kalkulasi_tindakan_inap_from_distribusi ON public.distribusi_biaya_rekap;

CREATE TRIGGER trg_recalc_kalkulasi_tindakan_inap_from_jenis
AFTER INSERT OR UPDATE OR DELETE ON public.jenis_tindakan_inap
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalculate_kalkulasi_tindakan_inap_from_jenis();

CREATE TRIGGER trg_recalc_kalkulasi_tindakan_inap_from_data_biaya
AFTER INSERT OR UPDATE OR DELETE ON public.data_biaya
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalculate_kalkulasi_tindakan_inap_from_data_biaya();

CREATE TRIGGER trg_recalc_kalkulasi_tindakan_inap_from_distribusi
AFTER INSERT OR UPDATE OR DELETE ON public.distribusi_biaya_rekap
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalculate_kalkulasi_tindakan_inap_from_distribusi();
