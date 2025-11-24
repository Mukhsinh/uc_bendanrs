-- ============================================
-- Update Dasar Alokasi Tempat Tidur dan Luas Kamar (Simple Version)
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
                    WHEN total_tempat_tidur > 0 
                         AND total_hari_rawat > 0 
                         AND hari_rawat_kelas > 0
                    THEN ROUND(
                        ((tempat_tidur_kelas::NUMERIC / total_tempat_tidur::NUMERIC) 
                         / (hari_rawat_kelas::NUMERIC / total_hari_rawat::NUMERIC))::NUMERIC, 
                        6
                    )
                    ELSE 0
                END
            FROM (
                SELECT 
                    COALESCE(
                        (SELECT (dai_user.tempat_tidur_svip + dai_user.tempat_tidur_vip + dai_user.tempat_tidur_i + dai_user.tempat_tidur_ii + dai_user.tempat_tidur_iii)
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT (dai_master.tempat_tidur_svip + dai_master.tempat_tidur_vip + dai_master.tempat_tidur_i + dai_master.tempat_tidur_ii + dai_master.tempat_tidur_iii)
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0
                    ) AS total_tempat_tidur,
                    COALESCE(
                        (SELECT (dai_user.hari_rawat_vvip + dai_user.hari_rawat_vip + dai_user.hari_rawat_i + dai_user.hari_rawat_ii + dai_user.hari_rawat_iii)
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT (dai_master.hari_rawat_vvip + dai_master.hari_rawat_vip + dai_master.hari_rawat_i + dai_master.hari_rawat_ii + dai_master.hari_rawat_iii)
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0
                    ) AS total_hari_rawat,
                    COALESCE(
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_user.tempat_tidur_svip
                            WHEN 'VIP' THEN dai_user.tempat_tidur_vip
                            WHEN 'I' THEN dai_user.tempat_tidur_i
                            WHEN 'II' THEN dai_user.tempat_tidur_ii
                            WHEN 'III' THEN dai_user.tempat_tidur_iii
                            ELSE 0
                        END
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_master.tempat_tidur_svip
                            WHEN 'VIP' THEN dai_master.tempat_tidur_vip
                            WHEN 'I' THEN dai_master.tempat_tidur_i
                            WHEN 'II' THEN dai_master.tempat_tidur_ii
                            WHEN 'III' THEN dai_master.tempat_tidur_iii
                            ELSE 0
                        END
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0
                    ) AS tempat_tidur_kelas,
                    COALESCE(
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_user.hari_rawat_vvip
                            WHEN 'VIP' THEN dai_user.hari_rawat_vip
                            WHEN 'I' THEN dai_user.hari_rawat_i
                            WHEN 'II' THEN dai_user.hari_rawat_ii
                            WHEN 'III' THEN dai_user.hari_rawat_iii
                            ELSE 0
                        END
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_master.hari_rawat_vvip
                            WHEN 'VIP' THEN dai_master.hari_rawat_vip
                            WHEN 'I' THEN dai_master.hari_rawat_i
                            WHEN 'II' THEN dai_master.hari_rawat_ii
                            WHEN 'III' THEN dai_master.hari_rawat_iii
                            ELSE 0
                        END
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0
                    ) AS hari_rawat_kelas
            ) dai
        ),
        dasar_alokasi_luas_kamar = (
            SELECT 
                CASE 
                    WHEN total_kamar_luas > 0 
                         AND total_hari_rawat > 0 
                         AND hari_rawat_kelas > 0
                    THEN ROUND(
                        ((kamar_luas_kelas / total_kamar_luas) 
                         / (hari_rawat_kelas::NUMERIC / total_hari_rawat::NUMERIC))::NUMERIC, 
                        6
                    )
                    ELSE 0
                END
            FROM (
                SELECT 
                    COALESCE(
                        (SELECT (dai_user.kamar_luas_svip + dai_user.kamar_luas_vip + dai_user.kamar_luas_i + dai_user.kamar_luas_ii + dai_user.kamar_luas_iii)::NUMERIC
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT (dai_master.kamar_luas_svip + dai_master.kamar_luas_vip + dai_master.kamar_luas_i + dai_master.kamar_luas_ii + dai_master.kamar_luas_iii)::NUMERIC
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0::NUMERIC
                    ) AS total_kamar_luas,
                    COALESCE(
                        (SELECT (dai_user.hari_rawat_vvip + dai_user.hari_rawat_vip + dai_user.hari_rawat_i + dai_user.hari_rawat_ii + dai_user.hari_rawat_iii)
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT (dai_master.hari_rawat_vvip + dai_master.hari_rawat_vip + dai_master.hari_rawat_i + dai_master.hari_rawat_ii + dai_master.hari_rawat_iii)
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0
                    ) AS total_hari_rawat,
                    COALESCE(
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_user.kamar_luas_svip::NUMERIC
                            WHEN 'VIP' THEN dai_user.kamar_luas_vip::NUMERIC
                            WHEN 'I' THEN dai_user.kamar_luas_i::NUMERIC
                            WHEN 'II' THEN dai_user.kamar_luas_ii::NUMERIC
                            WHEN 'III' THEN dai_user.kamar_luas_iii::NUMERIC
                            ELSE 0::NUMERIC
                        END
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_master.kamar_luas_svip::NUMERIC
                            WHEN 'VIP' THEN dai_master.kamar_luas_vip::NUMERIC
                            WHEN 'I' THEN dai_master.kamar_luas_i::NUMERIC
                            WHEN 'II' THEN dai_master.kamar_luas_ii::NUMERIC
                            WHEN 'III' THEN dai_master.kamar_luas_iii::NUMERIC
                            ELSE 0::NUMERIC
                        END
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0::NUMERIC
                    ) AS kamar_luas_kelas,
                    COALESCE(
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_user.hari_rawat_vvip
                            WHEN 'VIP' THEN dai_user.hari_rawat_vip
                            WHEN 'I' THEN dai_user.hari_rawat_i
                            WHEN 'II' THEN dai_user.hari_rawat_ii
                            WHEN 'III' THEN dai_user.hari_rawat_iii
                            ELSE 0
                        END
                         FROM data_akomodasi_inap dai_user
                         WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_user.tahun = k.tahun
                           AND dai_user.user_id = k.user_id
                         LIMIT 1),
                        (SELECT CASE k.kelas
                            WHEN 'VVIP' THEN dai_master.hari_rawat_vvip
                            WHEN 'VIP' THEN dai_master.hari_rawat_vip
                            WHEN 'I' THEN dai_master.hari_rawat_i
                            WHEN 'II' THEN dai_master.hari_rawat_ii
                            WHEN 'III' THEN dai_master.hari_rawat_iii
                            ELSE 0
                        END
                         FROM data_akomodasi_inap dai_master
                         WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                           AND dai_master.tahun = k.tahun
                           AND dai_master.user_id IS NULL
                         LIMIT 1),
                        0
                    ) AS hari_rawat_kelas
            ) dai
        ),
        updated_at = NOW()
    WHERE (p_user_id IS NULL OR k.user_id = p_user_id)
      AND (p_tahun IS NULL OR k.tahun = p_tahun);
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Dasar alokasi tempat tidur dan luas kamar berhasil diperbarui',
        'updated_count', v_updated_count
    );
END;
$function$;

