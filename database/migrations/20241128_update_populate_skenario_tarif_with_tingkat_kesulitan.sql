-- Migration: Update populate_skenario_tarif_from_rekapitulasi to include tingkat_kesulitan
-- Date: 2024-11-28
-- Description: Menambahkan tingkat_kesulitan dari daftar_tindakan ke function populate

CREATE OR REPLACE FUNCTION public.populate_skenario_tarif_from_rekapitulasi(
    p_user_id uuid, 
    p_tahun integer, 
    p_prosentase_jasa_pelayanan numeric DEFAULT 0, 
    p_prosentase_profit numeric DEFAULT 0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_count INTEGER := 0;
    v_target_user uuid := p_user_id;
BEGIN
    IF p_user_id IS NULL THEN
        DELETE FROM skenario_tarif WHERE user_id IS NULL AND tahun = p_tahun;
    ELSE
        DELETE FROM skenario_tarif WHERE user_id = p_user_id AND tahun = p_tahun;
    END IF;

    WITH latest_source AS (
        SELECT DISTINCT ON (
            vruc.tahun,
            vruc.kode_unit_kerja,
            COALESCE(vruc.kode_tindakan, CONCAT('KJ-', COALESCE(vruc.kode_jenis::text, '0')))
        )
            vruc.tahun,
            vruc.kode_jenis,
            vruc.kode_unit_kerja,
            vruc.nama_unit_kerja,
            vruc.kode_operator,
            vruc.nama_operator,
            vruc.kode_tindakan,
            vruc.nama_tindakan,
            COALESCE(vruc.biaya_bahan, 0) AS biaya_bahan,
            COALESCE(vruc.unit_cost_per_tindakan, 0) AS unit_cost_per_tindakan,
            vruc.sumber_tabel
        FROM view_rekapitulasi_unit_cost vruc
        WHERE vruc.tahun = p_tahun
          AND (p_user_id IS NULL OR vruc.user_id = p_user_id OR vruc.user_id IS NULL)
          AND vruc.sumber_tabel = ANY (ARRAY[
              'kalkulasi_biaya_laboratorium',
              'kalkulasi_biaya_radiologi',
              'kalkulasi_bdrs',
              'kalkulasi_tindakan_inap',
              'kalkulasi_tindakan_rawat_jalan',
              'kalkulasi_tindakan_operatif',
              'kalkulasi_biaya_cathlab'
          ])
        ORDER BY
            vruc.tahun,
            vruc.kode_unit_kerja,
            COALESCE(vruc.kode_tindakan, CONCAT('KJ-', COALESCE(vruc.kode_jenis::text, '0'))),
            CASE WHEN COALESCE(vruc.biaya_bahan, 0) > 0 THEN 0 ELSE 1 END,
            CASE WHEN COALESCE(vruc.unit_cost_per_tindakan, 0) > 0 THEN 0 ELSE 1 END,
            vruc.updated_at DESC NULLS LAST,
            vruc.created_at DESC NULLS LAST
    )
    INSERT INTO skenario_tarif (
        user_id,
        tahun,
        kode_jenis,
        kode_unit_kerja,
        nama_unit_kerja,
        kode_operator,
        nama_operator,
        kode_tindakan,
        nama_tindakan,
        tingkat_kesulitan,
        biaya_bahan,
        unit_cost_per_tindakan,
        jasa_sarana,
        jasa_pelayanan_medis,
        jasa_pelayanan_non_medis,
        prosentase_jasa_pelayanan,
        prosentase_profit,
        sumber_tabel
    )
    SELECT
        v_target_user,
        ls.tahun,
        ls.kode_jenis,
        ls.kode_unit_kerja,
        ls.nama_unit_kerja,
        ls.kode_operator,
        ls.nama_operator,
        ls.kode_tindakan,
        ls.nama_tindakan,
        dt.tingkat_kesulitan,
        ls.biaya_bahan,
        ls.unit_cost_per_tindakan,
        ls.unit_cost_per_tindakan,
        0,
        0,
        p_prosentase_jasa_pelayanan,
        p_prosentase_profit,
        ls.sumber_tabel
    FROM latest_source ls
    LEFT JOIN daftar_tindakan dt ON dt.kode_tindakan = ls.kode_tindakan;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$function$;

COMMENT ON FUNCTION populate_skenario_tarif_from_rekapitulasi IS 'Populate skenario_tarif from rekapitulasi_unit_cost with tingkat_kesulitan from daftar_tindakan';
