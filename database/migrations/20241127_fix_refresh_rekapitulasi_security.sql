-- ============================================
-- Perbaikan Fungsi refresh_rekapitulasi_unit_cost
-- ============================================
-- Tujuan: Menambahkan SECURITY DEFINER agar fungsi dapat bypass RLS
-- dan memastikan fungsi dapat dipanggil dari aplikasi frontend

-- Drop dan recreate fungsi dengan SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.refresh_rekapitulasi_unit_cost(
    p_user_id UUID,
    p_tahun INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Tambahkan SECURITY DEFINER untuk bypass RLS
SET search_path = public
AS $function$
BEGIN
    IF p_tahun IS NULL THEN
        RAISE EXCEPTION 'Parameter p_tahun tidak boleh NULL';
    END IF;

    -- Hapus data lama untuk tahun yang dipilih
    DELETE FROM public.rekapitulasi_unit_cost
    WHERE tahun = p_tahun
      AND (p_user_id IS NULL OR user_id = p_user_id);

    -- Insert dari kalkulasi_biaya_laboratorium
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel
    )
    SELECT DISTINCT ON (upper(kl.kode_unit_kerja), kl.kode, kl.tahun)
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
        'kalkulasi_biaya_laboratorium' AS sumber_tabel
    FROM public.kalkulasi_biaya_laboratorium kl
    LEFT JOIN public.unit_kerja uk ON uk.kode = kl.kode_unit_kerja
    WHERE kl.tahun = p_tahun
      AND kl.kode_unit_kerja IS NOT NULL
      AND (p_user_id IS NULL OR kl.user_id = p_user_id)
    ORDER BY upper(kl.kode_unit_kerja), kl.kode, kl.tahun, kl.updated_at DESC, kl.created_at DESC;

    -- Insert dari kalkulasi_biaya_radiologi
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel
    )
    SELECT DISTINCT ON (upper(kr.kode_unit_kerja), kr.kode, kr.tahun)
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
        'kalkulasi_biaya_radiologi' AS sumber_tabel
    FROM public.kalkulasi_biaya_radiologi kr
    LEFT JOIN public.unit_kerja uk ON uk.kode = kr.kode_unit_kerja
    WHERE kr.tahun = p_tahun
      AND kr.kode_unit_kerja IS NOT NULL
      AND (p_user_id IS NULL OR kr.user_id = p_user_id)
    ORDER BY upper(kr.kode_unit_kerja), kr.kode, kr.tahun, kr.updated_at DESC, kr.created_at DESC;

    -- Insert dari kalkulasi_bdrs
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel
    )
    SELECT DISTINCT ON (upper(kb.kode_unit_kerja), kb.kode, kb.tahun)
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
        'kalkulasi_bdrs' AS sumber_tabel
    FROM public.kalkulasi_bdrs kb
    LEFT JOIN public.unit_kerja uk ON uk.kode = kb.kode_unit_kerja
    WHERE kb.tahun = p_tahun
      AND kb.kode_unit_kerja IS NOT NULL
      AND (p_user_id IS NULL OR kb.user_id = p_user_id)
    ORDER BY upper(kb.kode_unit_kerja), kb.kode, kb.tahun, kb.updated_at DESC, kb.created_at DESC;

    -- Insert dari kalkulasi_tindakan_inap
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel
    )
    SELECT DISTINCT ON (upper(kti.kode_unit_kerja), kti.kode_jenis_tindakan, kti.tahun)
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
        (
          COALESCE(kti.biaya_bahan_tindakan, 0) +
          COALESCE(kti.biaya_bhp, 0) +
          COALESCE(kti.biaya_gaji_tunjangan, 0) +
          COALESCE(kti.biaya_makan_karyawan, 0) +
          COALESCE(kti.biaya_rumah_tangga, 0) +
          COALESCE(kti.biaya_cetak, 0) +
          COALESCE(kti.biaya_atk, 0) +
          COALESCE(kti.biaya_listrik, 0) +
          COALESCE(kti.biaya_air, 0) +
          COALESCE(kti.biaya_telp, 0) +
          COALESCE(kti.biaya_pemeliharaan_bangunan, 0) +
          COALESCE(kti.biaya_pemeliharaan_alat_medis, 0) +
          COALESCE(kti.biaya_pemeliharaan_alat_non_medis, 0) +
          COALESCE(kti.biaya_operasional_lainnya, 0) +
          COALESCE(kti.biaya_penyusutan_gedung, 0) +
          COALESCE(kti.biaya_penyusutan_jaringan, 0) +
          COALESCE(kti.biaya_penyusutan_alat_medis, 0) +
          COALESCE(kti.biaya_penyusutan_alat_non_medis, 0) +
          COALESCE(kti.biaya_pendidikan_pelatihan, 0) +
          COALESCE(kti.biaya_laundry, 0) +
          COALESCE(kti.biaya_sterilisasi, 0) +
          COALESCE(kti.biaya_tidak_langsung_terdistribusi, 0)
        )::bigint AS unit_cost_per_tindakan,
        'kalkulasi_tindakan_inap' AS sumber_tabel
    FROM public.kalkulasi_tindakan_inap kti
    WHERE kti.tahun = p_tahun
      AND kti.kode_unit_kerja IS NOT NULL
      AND (p_user_id IS NULL OR kti.user_id = p_user_id)
    ORDER BY upper(kti.kode_unit_kerja), kti.kode_jenis_tindakan, kti.tahun, kti.updated_at DESC, kti.created_at DESC;

    -- Insert dari kalkulasi_tindakan_rawat_jalan
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel
    )
    SELECT DISTINCT ON (upper(ktrj.kode_unit_kerja), ktrj.kode_jenis_tindakan, ktrj.tahun)
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
        (
          COALESCE(ktrj.biaya_bahan_tindakan, 0) +
          COALESCE(ktrj.biaya_gaji_tunjangan, 0) +
          COALESCE(ktrj.biaya_makan_karyawan, 0) +
          COALESCE(ktrj.biaya_rumah_tangga, 0) +
          COALESCE(ktrj.biaya_cetak, 0) +
          COALESCE(ktrj.biaya_atk, 0) +
          COALESCE(ktrj.biaya_listrik, 0) +
          COALESCE(ktrj.biaya_air, 0) +
          COALESCE(ktrj.biaya_telp, 0) +
          COALESCE(ktrj.biaya_pemeliharaan_bangunan, 0) +
          COALESCE(ktrj.biaya_pemeliharaan_alat_medis, 0) +
          COALESCE(ktrj.biaya_pemeliharaan_alat_non_medis, 0) +
          COALESCE(ktrj.biaya_operasional_lainnya, 0) +
          COALESCE(ktrj.biaya_penyusutan_gedung, 0) +
          COALESCE(ktrj.biaya_penyusutan_jaringan, 0) +
          COALESCE(ktrj.biaya_penyusutan_alat_medis, 0) +
          COALESCE(ktrj.biaya_penyusutan_alat_non_medis, 0) +
          COALESCE(ktrj.biaya_pendidikan_pelatihan, 0) +
          COALESCE(ktrj.biaya_laundry, 0) +
          COALESCE(ktrj.biaya_sterilisasi, 0) +
          COALESCE(ktrj.biaya_tidak_langsung_terdistribusi, 0)
        )::bigint AS unit_cost_per_tindakan,
        'kalkulasi_tindakan_rawat_jalan' AS sumber_tabel
    FROM public.kalkulasi_tindakan_rawat_jalan ktrj
    WHERE ktrj.tahun = p_tahun
      AND ktrj.kode_unit_kerja IS NOT NULL
      AND (p_user_id IS NULL OR ktrj.user_id = p_user_id)
    ORDER BY upper(ktrj.kode_unit_kerja), ktrj.kode_jenis_tindakan, ktrj.tahun, ktrj.updated_at DESC, ktrj.created_at DESC;

    -- Insert dari kalkulasi_biaya_operatif
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel
    )
    SELECT DISTINCT ON (upper(ko.kode_unit_kerja), ko.kode, ko.tahun)
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
        'kalkulasi_tindakan_operatif' AS sumber_tabel
    FROM public.kalkulasi_biaya_operatif ko
    WHERE ko.tahun = p_tahun
      AND ko.kode_unit_kerja IS NOT NULL
      AND (p_user_id IS NULL OR ko.user_id = p_user_id)
    ORDER BY upper(ko.kode_unit_kerja), ko.kode, ko.tahun, ko.updated_at DESC, ko.created_at DESC;

    -- Insert dari kalkulasi_biaya_cathlab
    INSERT INTO public.rekapitulasi_unit_cost (
        user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
        kode_operator, nama_operator, kode_tindakan, nama_tindakan,
        biaya_bahan, unit_cost_per_tindakan, sumber_tabel
    )
    SELECT DISTINCT ON (upper(kc.kode_unit_kerja), kc.kode, kc.tahun)
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
        'kalkulasi_biaya_cathlab' AS sumber_tabel
    FROM public.kalkulasi_biaya_cathlab kc
    LEFT JOIN public.unit_kerja uk ON uk.kode = kc.kode_unit_kerja
    WHERE kc.tahun = p_tahun
      AND kc.kode_unit_kerja IS NOT NULL
      AND (p_user_id IS NULL OR kc.user_id = p_user_id)
    ORDER BY upper(kc.kode_unit_kerja), kc.kode, kc.tahun, kc.updated_at DESC, kc.created_at DESC;

    RAISE NOTICE 'Rekapitulasi unit cost untuk tahun % berhasil diperbarui', p_tahun;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'User % tidak ditemukan pada auth.users, skip refresh rekapitulasi.', p_user_id;
        RETURN;
    WHEN OTHERS THEN
        RAISE;
END;
$function$;

-- Grant execute permission ke authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_rekapitulasi_unit_cost(UUID, INTEGER) TO authenticated;

-- Verifikasi
SELECT 
  'Fungsi refresh_rekapitulasi_unit_cost berhasil diperbaiki dengan SECURITY DEFINER' as status,
  prosecdef as has_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'refresh_rekapitulasi_unit_cost';
