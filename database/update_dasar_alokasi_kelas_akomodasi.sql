-- ============================================
-- Update Dasar Alokasi Tempat Tidur dan Luas Kamar
-- 
-- Memperbaiki kolom dasar_alokasi_tempat_tidur dan dasar_alokasi_luas_kamar
-- yang masih bernilai 0 di tabel kalkulasi_biaya_kelas_akomodasi
-- 
-- Rumus:
-- dasar_alokasi_tempat_tidur = (tempat_tidur_kelas / total_tempat_tidur_unit) / (hari_rawat_kelas / total_hari_rawat_unit)
-- dasar_alokasi_luas_kamar = (kamar_luas_kelas / total_kamar_luas_unit) / (hari_rawat_kelas / total_hari_rawat_unit)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_dasar_alokasi_kelas_akomodasi(
  p_user_id uuid DEFAULT NULL::uuid,
  p_tahun integer DEFAULT NULL::integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_updated_count integer := 0;
BEGIN
    -- Update dasar_alokasi_tempat_tidur dan dasar_alokasi_luas_kamar
    UPDATE kalkulasi_biaya_kelas_akomodasi k
    SET 
        dasar_alokasi_tempat_tidur = (
            SELECT 
                CASE 
                    WHEN dai.total_tempat_tidur_unit > 0 
                         AND dai.total_hari_rawat_unit > 0 
                         AND dai.hari_rawat_kelas > 0
                    THEN ROUND(
                        ((dai.tempat_tidur_kelas::NUMERIC / dai.total_tempat_tidur_unit::NUMERIC) 
                         / (dai.hari_rawat_kelas::NUMERIC / dai.total_hari_rawat_unit::NUMERIC))::NUMERIC, 
                        6
                    )
                    ELSE 0
                END
            FROM (
                SELECT 
                    COALESCE(
                        (SELECT 
                            (dai_user.hari_rawat_vvip + dai_user.hari_rawat_vip + dai_user.hari_rawat_i + dai_user.hari_rawat_ii + dai_user.hari_rawat_iii) AS total_hari_rawat_unit,
                            (dai_user.tempat_tidur_svip + dai_user.tempat_tidur_vip + dai_user.tempat_tidur_i + dai_user.tempat_tidur_ii + dai_user.tempat_tidur_iii) AS total_tempat_tidur_unit,
                            (dai_user.kamar_luas_svip + dai_user.kamar_luas_vip + dai_user.kamar_luas_i + dai_user.kamar_luas_ii + dai_user.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_user.hari_rawat_vvip
                                WHEN 'VIP' THEN dai_user.hari_rawat_vip
                                WHEN 'I' THEN dai_user.hari_rawat_i
                                WHEN 'II' THEN dai_user.hari_rawat_ii
                                WHEN 'III' THEN dai_user.hari_rawat_iii
                                ELSE 0
                            END AS hari_rawat_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_user.tempat_tidur_svip
                                WHEN 'VIP' THEN dai_user.tempat_tidur_vip
                                WHEN 'I' THEN dai_user.tempat_tidur_i
                                WHEN 'II' THEN dai_user.tempat_tidur_ii
                                WHEN 'III' THEN dai_user.tempat_tidur_iii
                                ELSE 0
                            END AS tempat_tidur_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_user.kamar_luas_svip::NUMERIC
                                WHEN 'VIP' THEN dai_user.kamar_luas_vip::NUMERIC
                                WHEN 'I' THEN dai_user.kamar_luas_i::NUMERIC
                                WHEN 'II' THEN dai_user.kamar_luas_ii::NUMERIC
                                WHEN 'III' THEN dai_user.kamar_luas_iii::NUMERIC
                                ELSE 0
                            END AS kamar_luas_kelas
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT 
                            (dai_master.hari_rawat_vvip + dai_master.hari_rawat_vip + dai_master.hari_rawat_i + dai_master.hari_rawat_ii + dai_master.hari_rawat_iii) AS total_hari_rawat_unit,
                            (dai_master.tempat_tidur_svip + dai_master.tempat_tidur_vip + dai_master.tempat_tidur_i + dai_master.tempat_tidur_ii + dai_master.tempat_tidur_iii) AS total_tempat_tidur_unit,
                            (dai_master.kamar_luas_svip + dai_master.kamar_luas_vip + dai_master.kamar_luas_i + dai_master.kamar_luas_ii + dai_master.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_master.hari_rawat_vvip
                                WHEN 'VIP' THEN dai_master.hari_rawat_vip
                                WHEN 'I' THEN dai_master.hari_rawat_i
                                WHEN 'II' THEN dai_master.hari_rawat_ii
                                WHEN 'III' THEN dai_master.hari_rawat_iii
                                ELSE 0
                            END AS hari_rawat_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_master.tempat_tidur_svip
                                WHEN 'VIP' THEN dai_master.tempat_tidur_vip
                                WHEN 'I' THEN dai_master.tempat_tidur_i
                                WHEN 'II' THEN dai_master.tempat_tidur_ii
                                WHEN 'III' THEN dai_master.tempat_tidur_iii
                                ELSE 0
                            END AS tempat_tidur_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_master.kamar_luas_svip::NUMERIC
                                WHEN 'VIP' THEN dai_master.kamar_luas_vip::NUMERIC
                                WHEN 'I' THEN dai_master.kamar_luas_i::NUMERIC
                                WHEN 'II' THEN dai_master.kamar_luas_ii::NUMERIC
                                WHEN 'III' THEN dai_master.kamar_luas_iii::NUMERIC
                                ELSE 0
                            END AS kamar_luas_kelas
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1)
                    ) AS data_info
            ) dai
        ),
        dasar_alokasi_luas_kamar = (
            SELECT 
                CASE 
                    WHEN dai.total_kamar_luas_unit > 0 
                         AND dai.total_hari_rawat_unit > 0 
                         AND dai.hari_rawat_kelas > 0
                    THEN ROUND(
                        ((dai.kamar_luas_kelas / dai.total_kamar_luas_unit) 
                         / (dai.hari_rawat_kelas::NUMERIC / dai.total_hari_rawat_unit::NUMERIC))::NUMERIC, 
                        6
                    )
                    ELSE 0
                END
            FROM (
                SELECT 
                    COALESCE(
                        (SELECT 
                            (dai_user.hari_rawat_vvip + dai_user.hari_rawat_vip + dai_user.hari_rawat_i + dai_user.hari_rawat_ii + dai_user.hari_rawat_iii) AS total_hari_rawat_unit,
                            (dai_user.tempat_tidur_svip + dai_user.tempat_tidur_vip + dai_user.tempat_tidur_i + dai_user.tempat_tidur_ii + dai_user.tempat_tidur_iii) AS total_tempat_tidur_unit,
                            (dai_user.kamar_luas_svip + dai_user.kamar_luas_vip + dai_user.kamar_luas_i + dai_user.kamar_luas_ii + dai_user.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_user.hari_rawat_vvip
                                WHEN 'VIP' THEN dai_user.hari_rawat_vip
                                WHEN 'I' THEN dai_user.hari_rawat_i
                                WHEN 'II' THEN dai_user.hari_rawat_ii
                                WHEN 'III' THEN dai_user.hari_rawat_iii
                                ELSE 0
                            END AS hari_rawat_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_user.tempat_tidur_svip
                                WHEN 'VIP' THEN dai_user.tempat_tidur_vip
                                WHEN 'I' THEN dai_user.tempat_tidur_i
                                WHEN 'II' THEN dai_user.tempat_tidur_ii
                                WHEN 'III' THEN dai_user.tempat_tidur_iii
                                ELSE 0
                            END AS tempat_tidur_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_user.kamar_luas_svip::NUMERIC
                                WHEN 'VIP' THEN dai_user.kamar_luas_vip::NUMERIC
                                WHEN 'I' THEN dai_user.kamar_luas_i::NUMERIC
                                WHEN 'II' THEN dai_user.kamar_luas_ii::NUMERIC
                                WHEN 'III' THEN dai_user.kamar_luas_iii::NUMERIC
                                ELSE 0
                            END AS kamar_luas_kelas
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT 
                            (dai_master.hari_rawat_vvip + dai_master.hari_rawat_vip + dai_master.hari_rawat_i + dai_master.hari_rawat_ii + dai_master.hari_rawat_iii) AS total_hari_rawat_unit,
                            (dai_master.tempat_tidur_svip + dai_master.tempat_tidur_vip + dai_master.tempat_tidur_i + dai_master.tempat_tidur_ii + dai_master.tempat_tidur_iii) AS total_tempat_tidur_unit,
                            (dai_master.kamar_luas_svip + dai_master.kamar_luas_vip + dai_master.kamar_luas_i + dai_master.kamar_luas_ii + dai_master.kamar_luas_iii)::NUMERIC AS total_kamar_luas_unit,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_master.hari_rawat_vvip
                                WHEN 'VIP' THEN dai_master.hari_rawat_vip
                                WHEN 'I' THEN dai_master.hari_rawat_i
                                WHEN 'II' THEN dai_master.hari_rawat_ii
                                WHEN 'III' THEN dai_master.hari_rawat_iii
                                ELSE 0
                            END AS hari_rawat_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_master.tempat_tidur_svip
                                WHEN 'VIP' THEN dai_master.tempat_tidur_vip
                                WHEN 'I' THEN dai_master.tempat_tidur_i
                                WHEN 'II' THEN dai_master.tempat_tidur_ii
                                WHEN 'III' THEN dai_master.tempat_tidur_iii
                                ELSE 0
                            END AS tempat_tidur_kelas,
                            CASE k.kelas
                                WHEN 'VVIP' THEN dai_master.kamar_luas_svip::NUMERIC
                                WHEN 'VIP' THEN dai_master.kamar_luas_vip::NUMERIC
                                WHEN 'I' THEN dai_master.kamar_luas_i::NUMERIC
                                WHEN 'II' THEN dai_master.kamar_luas_ii::NUMERIC
                                WHEN 'III' THEN dai_master.kamar_luas_iii::NUMERIC
                                ELSE 0
                            END AS kamar_luas_kelas
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1)
                    ) AS data_info
            ) dai
        ),
        updated_at = NOW()
    FROM data_akomodasi dai
    WHERE dai.id = k.id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Dasar alokasi tempat tidur dan luas kamar berhasil diperbarui',
        'updated_count', v_updated_count
    );
END;
$function$;

COMMENT ON FUNCTION public.update_dasar_alokasi_kelas_akomodasi(uuid, integer)
IS 'Update dasar_alokasi_tempat_tidur dan dasar_alokasi_luas_kamar di kalkulasi_biaya_kelas_akomodasi berdasarkan rumus yang benar';

GRANT EXECUTE ON FUNCTION public.update_dasar_alokasi_kelas_akomodasi(uuid, integer) TO authenticated;

