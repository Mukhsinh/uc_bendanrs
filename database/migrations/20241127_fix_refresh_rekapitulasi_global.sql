-- ============================================
-- File: 20241127_fix_refresh_rekapitulasi_global.sql
-- Tujuan: Perbaiki fungsi refresh_rekapitulasi_unit_cost agar data terupdate
--         berdasarkan kode, tahun, dan tenant_id tanpa memperhatikan user_id
-- ============================================

-- Drop fungsi lama
DROP FUNCTION IF EXISTS public.refresh_rekapitulasi_unit_cost(uuid, integer);

-- Buat fungsi baru yang tidak filter berdasarkan user_id
CREATE OR REPLACE FUNCTION public.refresh_rekapitulasi_unit_cost(
    p_user_id UUID DEFAULT NULL,
    p_tahun INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Validasi parameter tahun
    IF p_tahun IS NULL THEN
        RAISE EXCEPTION 'Parameter p_tahun tidak boleh NULL';
    END IF;

    -- Dapatkan tenant_id dari user yang sedang login
    -- Jika p_user_id NULL, gunakan auth.uid()
    SELECT COALESCE(
        (SELECT tenant_id FROM auth.users WHERE id = COALESCE(p_user_id, auth.uid())),
        (SELECT tenant_id FROM user_profiles WHERE user_id = COALESCE(p_user_id, auth.uid()))
    ) INTO v_tenant_id;

    -- Jika tenant_id tidak ditemukan, gunakan tenant default
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM tenants WHERE is_active = true LIMIT 1;
    END IF;

    RAISE NOTICE 'Refreshing rekapitulasi untuk tahun % dengan tenant_id %', p_tahun, v_tenant_id;

    -- Hapus data lama untuk tahun dan tenant yang dipilih
    -- TIDAK FILTER BERDASARKAN USER_ID - ambil semua data untuk tahun dan tenant tersebut
    DELETE FROM public.rekapitulasi_unit_cost
    WHERE tahun = p_tahun
      AND (v_tenant_id IS NULL OR tenant_id = v_tenant_id);

    RAISE NOTICE 'Data lama dihapus untuk tahun % dan tenant %', p_tahun, v_tenant_id;

    -- Insert dari kalkulasi_biaya_laboratorium
    -- DISTINCT ON berdasarkan kode_unit_kerja, kode, tahun, tenant_id
    -- Ambil data terbaru berdasarkan updated_at
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel, waktu_pemeriksaan, jumlah, tenant_id
    )
    SELECT DISTINCT ON (kl.kode_unit_kerja, kl.kode, kl.tahun, kl.tenant_id)
        kl.user_id,
        kl.tahun,
        uk.jenis AS kode_jenis,
        kl.kode_unit_kerja,
        COALESCE(uk.nama, kl.kode_unit_kerja) AS nama_unit_kerja,
        NULL AS kode_operator,
        NULL AS nama_operator,
        kl.kode AS kode_tindakan,
        kl.jenis_pemeriksaan AS nama_tindakan,
        COALESCE(kl.biaya_bahan_pemeriksaan_numeric, 0) AS biaya_bahan,
        COALESCE(kl.unit_cost_per_pemeriksaan, 0) AS unit_cost_per_tindakan,
        'kalkulasi_biaya_laboratorium' AS sumber_tabel,
        COALESCE(kl.waktu_pemeriksaan, 0) AS waktu_pemeriksaan,
        COALESCE(kl.jumlah, 0) AS jumlah,
        kl.tenant_id
    FROM public.kalkulasi_biaya_laboratorium kl
    LEFT JOIN public.unit_kerja uk ON uk.kode = kl.kode_unit_kerja AND uk.tenant_id = kl.tenant_id
    WHERE kl.tahun = p_tahun
      AND kl.kode_unit_kerja IS NOT NULL
      AND (v_tenant_id IS NULL OR kl.tenant_id = v_tenant_id)
    ORDER BY kl.kode_unit_kerja, kl.kode, kl.tahun, kl.tenant_id, kl.updated_at DESC NULLS LAST, kl.created_at DESC NULLS LAST;

    RAISE NOTICE 'Data laboratorium diinsert';

    -- Insert dari kalkulasi_biaya_radiologi
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel, waktu_pemeriksaan, jumlah, tenant_id
    )
    SELECT DISTINCT ON (kr.kode_unit_kerja, kr.kode, kr.tahun, kr.tenant_id)
        kr.user_id,
        kr.tahun,
        uk.jenis AS kode_jenis,
        kr.kode_unit_kerja,
        COALESCE(uk.nama, kr.kode_unit_kerja) AS nama_unit_kerja,
        NULL AS kode_operator,
        NULL AS nama_operator,
        kr.kode AS kode_tindakan,
        kr.jenis_pemeriksaan AS nama_tindakan,
        COALESCE(kr.biaya_bahan_pemeriksaan_numeric, 0) AS biaya_bahan,
        COALESCE(kr.unit_cost_per_pemeriksaan, 0) AS unit_cost_per_tindakan,
        'kalkulasi_biaya_radiologi' AS sumber_tabel,
        COALESCE(kr.waktu_pemeriksaan, 0) AS waktu_pemeriksaan,
        COALESCE(kr.jumlah, 0) AS jumlah,
        kr.tenant_id
    FROM public.kalkulasi_biaya_radiologi kr
    LEFT JOIN public.unit_kerja uk ON uk.kode = kr.kode_unit_kerja AND uk.tenant_id = kr.tenant_id
    WHERE kr.tahun = p_tahun
      AND kr.kode_unit_kerja IS NOT NULL
      AND (v_tenant_id IS NULL OR kr.tenant_id = v_tenant_id)
    ORDER BY kr.kode_unit_kerja, kr.kode, kr.tahun, kr.tenant_id, kr.updated_at DESC NULLS LAST, kr.created_at DESC NULLS LAST;

    RAISE NOTICE 'Data radiologi diinsert';

    -- Insert dari kalkulasi_bdrs
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel, waktu_pemeriksaan, jumlah, tenant_id
    )
    SELECT DISTINCT ON (kb.kode_unit_kerja, kb.kode, kb.tahun, kb.tenant_id)
        kb.user_id,
        kb.tahun,
        uk.jenis AS kode_jenis,
        kb.kode_unit_kerja,
        COALESCE(uk.nama, kb.kode_unit_kerja) AS nama_unit_kerja,
        NULL AS kode_operator,
        NULL AS nama_operator,
        kb.kode AS kode_tindakan,
        kb.jenis_pemeriksaan AS nama_tindakan,
        COALESCE(kb.biaya_bahan_pemeriksaan_numeric, 0) AS biaya_bahan,
        COALESCE(kb.unit_cost_per_pemeriksaan, 0) AS unit_cost_per_tindakan,
        'kalkulasi_bdrs' AS sumber_tabel,
        COALESCE(kb.waktu_pemeriksaan, 0) AS waktu_pemeriksaan,
        COALESCE(kb.jumlah, 0) AS jumlah,
        kb.tenant_id
    FROM public.kalkulasi_bdrs kb
    LEFT JOIN public.unit_kerja uk ON uk.kode = kb.kode_unit_kerja AND uk.tenant_id = kb.tenant_id
    WHERE kb.tahun = p_tahun
      AND kb.kode_unit_kerja IS NOT NULL
      AND (v_tenant_id IS NULL OR kb.tenant_id = v_tenant_id)
    ORDER BY kb.kode_unit_kerja, kb.kode, kb.tahun, kb.tenant_id, kb.updated_at DESC NULLS LAST, kb.created_at DESC NULLS LAST;

    RAISE NOTICE 'Data BDRS diinsert';

    -- Insert dari kalkulasi_tindakan_inap
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel, waktu_pemeriksaan, jumlah, tenant_id
    )
    SELECT DISTINCT ON (kti.kode_unit_kerja, kti.kode_jenis_tindakan, kti.tahun, kti.tenant_id)
        kti.user_id,
        kti.tahun,
        kti.kode_jenis,
        kti.kode_unit_kerja,
        COALESCE(kti.nama_unit_kerja, kti.kode_unit_kerja) AS nama_unit_kerja,
        NULL AS kode_operator,
        NULL AS nama_operator,
        kti.kode_jenis_tindakan AS kode_tindakan,
        kti.jenis_tindakan AS nama_tindakan,
        COALESCE(kti.biaya_bahan_tindakan, 0) AS biaya_bahan,
        COALESCE(kti.unit_cost_tindakan_inap, 0) AS unit_cost_per_tindakan,
        'kalkulasi_tindakan_inap' AS sumber_tabel,
        COALESCE(kti.waktu, 0) AS waktu_pemeriksaan,
        COALESCE(kti.jumlah, 0) AS jumlah,
        kti.tenant_id
    FROM public.kalkulasi_tindakan_inap kti
    WHERE kti.tahun = p_tahun
      AND kti.kode_unit_kerja IS NOT NULL
      AND (v_tenant_id IS NULL OR kti.tenant_id = v_tenant_id)
    ORDER BY kti.kode_unit_kerja, kti.kode_jenis_tindakan, kti.tahun, kti.tenant_id, kti.updated_at DESC NULLS LAST, kti.created_at DESC NULLS LAST;

    RAISE NOTICE 'Data tindakan inap diinsert';

    -- Insert dari kalkulasi_tindakan_rawat_jalan
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel, waktu_pemeriksaan, jumlah, tenant_id
    )
    SELECT DISTINCT ON (ktrj.kode_unit_kerja, ktrj.kode_jenis_tindakan, ktrj.tahun, ktrj.tenant_id)
        ktrj.user_id,
        ktrj.tahun,
        ktrj.kode_jenis,
        ktrj.kode_unit_kerja,
        COALESCE(ktrj.nama_unit_kerja, ktrj.kode_unit_kerja) AS nama_unit_kerja,
        NULL AS kode_operator,
        NULL AS nama_operator,
        ktrj.kode_jenis_tindakan AS kode_tindakan,
        ktrj.jenis_tindakan AS nama_tindakan,
        COALESCE(ktrj.biaya_bahan_tindakan, 0) AS biaya_bahan,
        COALESCE(ktrj.unit_cost_tindakan_rawat_jalan, 0) AS unit_cost_per_tindakan,
        'kalkulasi_tindakan_rawat_jalan' AS sumber_tabel,
        COALESCE(ktrj.waktu, 0) AS waktu_pemeriksaan,
        COALESCE(ktrj.jumlah, 0) AS jumlah,
        ktrj.tenant_id
    FROM public.kalkulasi_tindakan_rawat_jalan ktrj
    WHERE ktrj.tahun = p_tahun
      AND ktrj.kode_unit_kerja IS NOT NULL
      AND (v_tenant_id IS NULL OR ktrj.tenant_id = v_tenant_id)
    ORDER BY ktrj.kode_unit_kerja, ktrj.kode_jenis_tindakan, ktrj.tahun, ktrj.tenant_id, ktrj.updated_at DESC NULLS LAST, ktrj.created_at DESC NULLS LAST;

    RAISE NOTICE 'Data tindakan rawat jalan diinsert';

    -- Insert dari kalkulasi_biaya_operatif
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel, waktu_pemeriksaan, jumlah, tenant_id
    )
    SELECT DISTINCT ON (ko.kode_unit_kerja, ko.kode, ko.tahun, ko.tenant_id)
        ko.user_id,
        ko.tahun,
        ko.kode_jenis,
        ko.kode_unit_kerja,
        ko.nama_unit_kerja,
        ko.kode_operator_spesialistik AS kode_operator,
        ko.nama_operator_spesialistik AS nama_operator,
        ko.kode AS kode_tindakan,
        ko.jenis_pemeriksaan AS nama_tindakan,
        COALESCE(ko.biaya_bahan_pemeriksaan_numeric, 0) AS biaya_bahan,
        COALESCE(ko.unit_cost_per_tindakan, 0) AS unit_cost_per_tindakan,
        'kalkulasi_biaya_operatif' AS sumber_tabel,
        COALESCE(ko.waktu_pemeriksaan, 0) AS waktu_pemeriksaan,
        COALESCE(ko.jumlah, 0) AS jumlah,
        ko.tenant_id
    FROM public.kalkulasi_biaya_operatif ko
    WHERE ko.tahun = p_tahun
      AND ko.kode_unit_kerja IS NOT NULL
      AND (v_tenant_id IS NULL OR ko.tenant_id = v_tenant_id)
    ORDER BY ko.kode_unit_kerja, ko.kode, ko.tahun, ko.tenant_id, ko.updated_at DESC NULLS LAST, ko.created_at DESC NULLS LAST;

    RAISE NOTICE 'Data operatif diinsert';

    -- Insert dari kalkulasi_biaya_cathlab
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel, waktu_pemeriksaan, jumlah, tenant_id
    )
    SELECT DISTINCT ON (kc.kode_unit_kerja, kc.kode, kc.tahun, kc.tenant_id)
        kc.user_id,
        kc.tahun,
        uk.jenis AS kode_jenis,
        kc.kode_unit_kerja,
        COALESCE(uk.nama, kc.kode_unit_kerja) AS nama_unit_kerja,
        NULL AS kode_operator,
        NULL AS nama_operator,
        kc.kode AS kode_tindakan,
        kc.jenis_pemeriksaan AS nama_tindakan,
        COALESCE(kc.biaya_bahan_pemeriksaan_numeric, 0) AS biaya_bahan,
        COALESCE(kc.unit_cost_per_tindakan, 0) AS unit_cost_per_tindakan,
        'kalkulasi_biaya_cathlab' AS sumber_tabel,
        COALESCE(kc.waktu_pemeriksaan, 0) AS waktu_pemeriksaan,
        COALESCE(kc.jumlah, 0) AS jumlah,
        kc.tenant_id
    FROM public.kalkulasi_biaya_cathlab kc
    LEFT JOIN public.unit_kerja uk ON uk.kode = kc.kode_unit_kerja AND uk.tenant_id = kc.tenant_id
    WHERE kc.tahun = p_tahun
      AND kc.kode_unit_kerja IS NOT NULL
      AND (v_tenant_id IS NULL OR kc.tenant_id = v_tenant_id)
    ORDER BY kc.kode_unit_kerja, kc.kode, kc.tahun, kc.tenant_id, kc.updated_at DESC NULLS LAST, kc.created_at DESC NULLS LAST;

    RAISE NOTICE 'Data cathlab diinsert';
    RAISE NOTICE 'Rekapitulasi unit cost untuk tahun % berhasil diperbarui (global - tidak filter user_id)', p_tahun;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key violation, skip refresh rekapitulasi.';
        RETURN;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.refresh_rekapitulasi_unit_cost(UUID, INTEGER) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Fungsi refresh_rekapitulasi_unit_cost berhasil diperbaiki!' as status;
SELECT 'Fungsi sekarang mengambil data terbaru berdasarkan kode, tahun, dan tenant_id' as info;
SELECT 'Tidak lagi filter berdasarkan user_id yang melakukan input' as perbaikan;
