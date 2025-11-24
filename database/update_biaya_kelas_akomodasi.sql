-- ============================================
-- Update semua kolom biaya di kalkulasi_biaya_kelas_akomodasi
-- 
-- Memperbarui semua kolom biaya yang masih bernilai 0 dengan mengambil data
-- dari kalkulasi_biaya_akomodasi dan mengalikannya dengan dasar_alokasi_hari_rawat
-- 
-- Rumus: biaya_[nama_biaya] = biaya_[nama_biaya]_dari_kalkulasi_biaya_akomodasi × dasar_alokasi_hari_rawat
-- ============================================

CREATE OR REPLACE FUNCTION public.update_biaya_kelas_akomodasi(
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
    -- Update semua kolom biaya dari kalkulasi_biaya_akomodasi
    -- Tanpa memperhatikan user_id, hanya berdasarkan tahun dan kode_unit_kerja
    UPDATE kalkulasi_biaya_kelas_akomodasi k
    SET 
        biaya_gaji_tunjangan = ROUND(COALESCE(kba.biaya_gaji_tunjangan, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_jasa_pelayanan = ROUND(COALESCE(kba.biaya_jasa_pelayanan, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_obat = ROUND(COALESCE(kba.biaya_obat, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_bhp = ROUND(COALESCE(kba.biaya_bhp, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_makan_karyawan = ROUND(COALESCE(kba.biaya_makan_karyawan, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_makan_pasien = ROUND(COALESCE(kba.biaya_makan_pasien, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_rumah_tangga = ROUND(COALESCE(kba.biaya_rumah_tangga, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_cetak = ROUND(COALESCE(kba.biaya_cetak, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_atk = ROUND(COALESCE(kba.biaya_atk, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_listrik = ROUND(COALESCE(kba.biaya_listrik, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_air = ROUND(COALESCE(kba.biaya_air, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_telp = ROUND(COALESCE(kba.biaya_telp, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_pemeliharaan_bangunan = ROUND(COALESCE(kba.biaya_pemeliharaan_bangunan, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_pemeliharaan_alat_medis = ROUND(COALESCE(kba.biaya_pemeliharaan_alat_medis, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_pemeliharaan_alat_non_medis = ROUND(COALESCE(kba.biaya_pemeliharaan_alat_non_medis, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_operasional_lainnya = ROUND(COALESCE(kba.biaya_operasional_lainnya, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_penyusutan_gedung = ROUND(COALESCE(kba.biaya_penyusutan_gedung, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_penyusutan_jaringan = ROUND(COALESCE(kba.biaya_penyusutan_jaringan, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_penyusutan_alat_medis = ROUND(COALESCE(kba.biaya_penyusutan_alat_medis, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_penyusutan_alat_non_medis = ROUND(COALESCE(kba.biaya_penyusutan_alat_non_medis, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_pendidikan_pelatihan = ROUND(COALESCE(kba.biaya_pendidikan_pelatihan, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_laundry = ROUND(COALESCE(kba.biaya_laundry, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_sterilisasi = ROUND(COALESCE(kba.biaya_sterilisasi, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        biaya_tidak_langsung_terdistribusi = ROUND(COALESCE(kba.biaya_tidak_langsung_terdistribusi, 0) * k.dasar_alokasi_hari_rawat)::BIGINT,
        updated_at = NOW()
    FROM kalkulasi_biaya_akomodasi kba
    WHERE kba.tahun = k.tahun
      AND kba.kode_unit_kerja = k.kode_unit_kerja
      AND (p_user_id IS NULL OR k.user_id = p_user_id)
      AND (p_tahun IS NULL OR k.tahun = p_tahun);
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Semua kolom biaya berhasil diperbarui',
        'updated_count', v_updated_count
    );
END;
$function$;

COMMENT ON FUNCTION public.update_biaya_kelas_akomodasi(uuid, integer)
IS 'Update semua kolom biaya di kalkulasi_biaya_kelas_akomodasi dengan rumus: biaya_[nama] = biaya_[nama]_dari_kalkulasi_biaya_akomodasi × dasar_alokasi_hari_rawat. Tanpa memperhatikan user_id, hanya berdasarkan tahun dan kode_unit_kerja';

GRANT EXECUTE ON FUNCTION public.update_biaya_kelas_akomodasi(uuid, integer) TO authenticated;

