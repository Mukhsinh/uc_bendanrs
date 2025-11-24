-- ============================================
-- Fix Rumus Alokasi Biaya Gizi untuk Kalkulasi Biaya Kelas Akomodasi
-- 
-- Rumus yang Benar:
-- alokasi_biaya_gizi = jumlah_kali_porsi_[kelas] / hari_rawat_[kelas]
-- 
-- Relasi: kode_unit_kerja, tahun, user_id (atau master jika user_id IS NULL)
-- ============================================

-- Update function update_alokasi_biaya_gizi_kelas_akomodasi
CREATE OR REPLACE FUNCTION public.update_alokasi_biaya_gizi_kelas_akomodasi(
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
    -- Update alokasi_biaya_gizi dengan rumus: jumlah_kali_porsi / hari_rawat
    -- Relasi berdasarkan: kode_unit_kerja, tahun, dan kelas
    -- Prioritas: data dengan user_id yang sama, lalu data master (user_id IS NULL) untuk unit kerja yang sama
    UPDATE kalkulasi_biaya_kelas_akomodasi k
    SET 
        alokasi_biaya_gizi = (
            SELECT 
                CASE k.kelas
                    WHEN 'VVIP' THEN 
                        COALESCE(
                            -- Prioritas 1: Data dengan user_id yang sama untuk kode_unit_kerja dan tahun yang sama
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_user.jumlah_kali_porsi_vvip::numeric)
                                    / NULLIF(dai_user.hari_rawat_vvip::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_user
                                WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_user.tahun = k.tahun
                                  AND dai_user.user_id = k.user_id
                                  AND dai_user.hari_rawat_vvip > 0
                                  AND dai_user.jumlah_kali_porsi_vvip > 0
                                LIMIT 1
                            ),
                            -- Prioritas 2: Data master (user_id IS NULL) untuk kode_unit_kerja dan tahun yang sama
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_master.jumlah_kali_porsi_vvip::numeric)
                                    / NULLIF(dai_master.hari_rawat_vvip::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_master
                                WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_master.tahun = k.tahun
                                  AND dai_master.user_id IS NULL
                                  AND dai_master.hari_rawat_vvip > 0
                                  AND dai_master.jumlah_kali_porsi_vvip > 0
                                LIMIT 1
                            ),
                            0
                        )
                    WHEN 'VIP' THEN 
                        COALESCE(
                            -- Prioritas 1: Data dengan user_id yang sama
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_user.jumlah_kali_porsi_vip::numeric)
                                    / NULLIF(dai_user.hari_rawat_vip::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_user
                                WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_user.tahun = k.tahun
                                  AND dai_user.user_id = k.user_id
                                  AND dai_user.hari_rawat_vip > 0
                                  AND dai_user.jumlah_kali_porsi_vip > 0
                                LIMIT 1
                            ),
                            -- Prioritas 2: Data master (user_id IS NULL)
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_master.jumlah_kali_porsi_vip::numeric)
                                    / NULLIF(dai_master.hari_rawat_vip::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_master
                                WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_master.tahun = k.tahun
                                  AND dai_master.user_id IS NULL
                                  AND dai_master.hari_rawat_vip > 0
                                  AND dai_master.jumlah_kali_porsi_vip > 0
                                LIMIT 1
                            ),
                            0
                        )
                    WHEN 'I' THEN 
                        COALESCE(
                            -- Prioritas 1: Data dengan user_id yang sama
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_user.jumlah_kali_porsi_i::numeric)
                                    / NULLIF(dai_user.hari_rawat_i::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_user
                                WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_user.tahun = k.tahun
                                  AND dai_user.user_id = k.user_id
                                  AND dai_user.hari_rawat_i > 0
                                  AND dai_user.jumlah_kali_porsi_i > 0
                                LIMIT 1
                            ),
                            -- Prioritas 2: Data master (user_id IS NULL)
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_master.jumlah_kali_porsi_i::numeric)
                                    / NULLIF(dai_master.hari_rawat_i::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_master
                                WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_master.tahun = k.tahun
                                  AND dai_master.user_id IS NULL
                                  AND dai_master.hari_rawat_i > 0
                                  AND dai_master.jumlah_kali_porsi_i > 0
                                LIMIT 1
                            ),
                            0
                        )
                    WHEN 'II' THEN 
                        COALESCE(
                            -- Prioritas 1: Data dengan user_id yang sama
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_user.jumlah_kali_porsi_ii::numeric)
                                    / NULLIF(dai_user.hari_rawat_ii::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_user
                                WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_user.tahun = k.tahun
                                  AND dai_user.user_id = k.user_id
                                  AND dai_user.hari_rawat_ii > 0
                                  AND dai_user.jumlah_kali_porsi_ii > 0
                                LIMIT 1
                            ),
                            -- Prioritas 2: Data master (user_id IS NULL)
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_master.jumlah_kali_porsi_ii::numeric)
                                    / NULLIF(dai_master.hari_rawat_ii::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_master
                                WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_master.tahun = k.tahun
                                  AND dai_master.user_id IS NULL
                                  AND dai_master.hari_rawat_ii > 0
                                  AND dai_master.jumlah_kali_porsi_ii > 0
                                LIMIT 1
                            ),
                            0
                        )
                    WHEN 'III' THEN 
                        COALESCE(
                            -- Prioritas 1: Data dengan user_id yang sama
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_user.jumlah_kali_porsi_iii::numeric)
                                    / NULLIF(dai_user.hari_rawat_iii::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_user
                                WHERE dai_user.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_user.tahun = k.tahun
                                  AND dai_user.user_id = k.user_id
                                  AND dai_user.hari_rawat_iii > 0
                                  AND dai_user.jumlah_kali_porsi_iii > 0
                                LIMIT 1
                            ),
                            -- Prioritas 2: Data master (user_id IS NULL)
                            -- Rumus: jumlah_kali_porsi / hari_rawat
                            (
                                SELECT ROUND(
                                    (dai_master.jumlah_kali_porsi_iii::numeric)
                                    / NULLIF(dai_master.hari_rawat_iii::numeric, 0)
                                )::bigint
                                FROM data_akomodasi_inap dai_master
                                WHERE dai_master.kode_unit_kerja = k.kode_unit_kerja
                                  AND dai_master.tahun = k.tahun
                                  AND dai_master.user_id IS NULL
                                  AND dai_master.hari_rawat_iii > 0
                                  AND dai_master.jumlah_kali_porsi_iii > 0
                                LIMIT 1
                            ),
                            0
                        )
                    ELSE 0
                END
        ),
        updated_at = NOW()
    WHERE (p_user_id IS NULL OR k.user_id = p_user_id)
      AND (p_tahun IS NULL OR k.tahun = p_tahun);
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Alokasi biaya gizi berhasil diperbarui dengan rumus: jumlah_kali_porsi / hari_rawat',
        'updated_count', v_updated_count
    );
END;
$function$;

COMMENT ON FUNCTION public.update_alokasi_biaya_gizi_kelas_akomodasi(uuid, integer)
IS 'Update alokasi_biaya_gizi dengan rumus: jumlah_kali_porsi_[kelas] / hari_rawat_[kelas] dari data_akomodasi_inap berdasarkan kode_unit_kerja, tahun, dan kelas';

GRANT EXECUTE ON FUNCTION public.update_alokasi_biaya_gizi_kelas_akomodasi(uuid, integer) TO authenticated;

