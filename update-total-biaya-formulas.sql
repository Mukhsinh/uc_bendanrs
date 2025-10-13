-- Perbarui rumus penjumlahan kolom total pada tabel data_biaya
-- 1) total_biaya = jumlah seluruh kolom biaya individual (kecuali yang hasil hitungan otomatis)
-- 2) total_biaya_tanpa_jp = (jumlah seluruh kolom biaya individual non-otomatis) - biaya_jasa_pelayanan

-- Catatan: Kolom hasil hitung otomatis (computed) yang TIDAK boleh dijumlahkan:
--   biaya_bahan, biaya_pegawai, biaya_daya, biaya_pemeliharaan, biaya_penyusutan

DO $$
BEGIN
  -- Pastikan kolom dibuat ulang sebagai generated always agar rumus konsisten
  BEGIN
    ALTER TABLE public.data_biaya DROP COLUMN IF EXISTS total_biaya;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.data_biaya DROP COLUMN IF EXISTS total_biaya_tanpa_jp;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- Buat kembali kolom total_biaya dengan ekspresi yang benar
  ALTER TABLE public.data_biaya
  ADD COLUMN total_biaya numeric GENERATED ALWAYS AS (
    COALESCE(biaya_gaji_tunjangan, 0) +
    COALESCE(biaya_jasa_pelayanan, 0) +
    COALESCE(biaya_obat, 0) +
    COALESCE(biaya_bhp, 0) +
    COALESCE(biaya_makan_karyawan, 0) +
    COALESCE(biaya_makan_pasien, 0) +
    COALESCE(biaya_rumah_tangga, 0) +
    COALESCE(biaya_cetak, 0) +
    COALESCE(biaya_atk, 0) +
    COALESCE(biaya_listrik, 0) +
    COALESCE(biaya_air, 0) +
    COALESCE(biaya_telp, 0) +
    COALESCE(biaya_pemeliharaan_bangunan, 0) +
    COALESCE(biaya_pemeliharaan_alat_medis, 0) +
    COALESCE(biaya_pemeliharaan_alat_non_medis, 0) +
    COALESCE(biaya_operasional_lainnya, 0) +
    COALESCE(biaya_penyusutan_gedung, 0) +
    COALESCE(biaya_penyusutan_jaringan, 0) +
    COALESCE(biaya_penyusutan_alat_medis, 0) +
    COALESCE(biaya_penyusutan_alat_non_medis, 0) +
    COALESCE(biaya_pendidikan_pelatihan, 0)
  ) STORED;

  COMMENT ON COLUMN public.data_biaya.total_biaya IS 'Jumlah seluruh kolom biaya individual non-computed';

  -- Buat kembali kolom total_biaya_tanpa_jp sesuai aturan (kurangi JP)
  ALTER TABLE public.data_biaya
  ADD COLUMN total_biaya_tanpa_jp numeric GENERATED ALWAYS AS (
    (
      COALESCE(biaya_gaji_tunjangan, 0) +
      COALESCE(biaya_jasa_pelayanan, 0) +
      COALESCE(biaya_obat, 0) +
      COALESCE(biaya_bhp, 0) +
      COALESCE(biaya_makan_karyawan, 0) +
      COALESCE(biaya_makan_pasien, 0) +
      COALESCE(biaya_rumah_tangga, 0) +
      COALESCE(biaya_cetak, 0) +
      COALESCE(biaya_atk, 0) +
      COALESCE(biaya_listrik, 0) +
      COALESCE(biaya_air, 0) +
      COALESCE(biaya_telp, 0) +
      COALESCE(biaya_pemeliharaan_bangunan, 0) +
      COALESCE(biaya_pemeliharaan_alat_medis, 0) +
      COALESCE(biaya_pemeliharaan_alat_non_medis, 0) +
      COALESCE(biaya_operasional_lainnya, 0) +
      COALESCE(biaya_penyusutan_gedung, 0) +
      COALESCE(biaya_penyusutan_jaringan, 0) +
      COALESCE(biaya_penyusutan_alat_medis, 0) +
      COALESCE(biaya_penyusutan_alat_non_medis, 0) +
      COALESCE(biaya_pendidikan_pelatihan, 0)
    ) - COALESCE(biaya_jasa_pelayanan, 0)
  ) STORED;

  COMMENT ON COLUMN public.data_biaya.total_biaya_tanpa_jp IS 'Jumlah seluruh kolom biaya individual non-computed dikurangi biaya_jasa_pelayanan (JP)';
END $$;

-- Verifikasi struktur kolom dan ekspresi
SELECT column_name, generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'data_biaya'
  AND column_name IN ('total_biaya','total_biaya_tanpa_jp');

-- Sampel validasi nilai
SELECT
  id,
  tahun,
  unit_kerja_id,
  total_biaya,
  total_biaya_tanpa_jp,
  (total_biaya - COALESCE(biaya_jasa_pelayanan,0)) AS cek_manual_tanpa_jp
FROM public.data_biaya
LIMIT 10;


