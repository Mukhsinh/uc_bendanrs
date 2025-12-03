-- Migration: Widen kolom intermediate kalkulasi rawat jalan ke BIGINT
-- Tanggal: 2025-12-02
-- Deskripsi:
--   - Mengubah tipe kolom hasil_kali_waktu, hasil_kali, dan kali_bahan menjadi BIGINT
--   - Menjaga rumus perhitungan di fungsi rekalkulasi apa adanya
--   - Mencegah error "integer out of range" saat hasil perkalian sangat besar

DO $$
BEGIN
  -- Pastikan tabel kalkulasi_tindakan_rawat_jalan ada
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'kalkulasi_tindakan_rawat_jalan'
  ) THEN
    ALTER TABLE public.kalkulasi_tindakan_rawat_jalan
      ALTER COLUMN hasil_kali_waktu TYPE BIGINT USING hasil_kali_waktu::BIGINT,
      ALTER COLUMN hasil_kali TYPE BIGINT USING hasil_kali::BIGINT,
      ALTER COLUMN kali_bahan TYPE BIGINT USING kali_bahan::BIGINT;
  END IF;
END;
$$;




