-- Migration: Widen kolom biaya ke BIGINT untuk mencegah "integer out of range"
-- Tanggal: 2025-12-02
-- Deskripsi:
--   - Fungsi rekalkulasi rawat jalan & inap menggunakan perhitungan berbasis BIGINT
--   - Di beberapa lingkungan, kolom biaya masih bertipe INTEGER sehingga bisa overflow
--   - Migration ini mengubah tipe seluruh kolom biaya utama menjadi BIGINT agar konsisten

DO $$
BEGIN
  -- ================================
  -- 1. TABEL kalkulasi_tindakan_rawat_jalan
  -- ================================
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'kalkulasi_tindakan_rawat_jalan'
      AND column_name = 'biaya_gaji_tunjangan'
  ) THEN
    ALTER TABLE kalkulasi_tindakan_rawat_jalan
      ALTER COLUMN biaya_bahan_tindakan TYPE BIGINT USING biaya_bahan_tindakan::BIGINT,
      ALTER COLUMN biaya_gaji_tunjangan TYPE BIGINT USING biaya_gaji_tunjangan::BIGINT,
      ALTER COLUMN biaya_jasa_pelayanan TYPE BIGINT USING biaya_jasa_pelayanan::BIGINT,
      ALTER COLUMN biaya_obat TYPE BIGINT USING biaya_obat::BIGINT,
      ALTER COLUMN biaya_bhp TYPE BIGINT USING biaya_bhp::BIGINT,
      ALTER COLUMN biaya_makan_karyawan TYPE BIGINT USING biaya_makan_karyawan::BIGINT,
      ALTER COLUMN biaya_makan_pasien TYPE BIGINT USING biaya_makan_pasien::BIGINT,
      ALTER COLUMN biaya_rumah_tangga TYPE BIGINT USING biaya_rumah_tangga::BIGINT,
      ALTER COLUMN biaya_cetak TYPE BIGINT USING biaya_cetak::BIGINT,
      ALTER COLUMN biaya_atk TYPE BIGINT USING biaya_atk::BIGINT,
      ALTER COLUMN biaya_listrik TYPE BIGINT USING biaya_listrik::BIGINT,
      ALTER COLUMN biaya_air TYPE BIGINT USING biaya_air::BIGINT,
      ALTER COLUMN biaya_telp TYPE BIGINT USING biaya_telp::BIGINT,
      ALTER COLUMN biaya_pemeliharaan_bangunan TYPE BIGINT USING biaya_pemeliharaan_bangunan::BIGINT,
      ALTER COLUMN biaya_pemeliharaan_alat_medis TYPE BIGINT USING biaya_pemeliharaan_alat_medis::BIGINT,
      ALTER COLUMN biaya_pemeliharaan_alat_non_medis TYPE BIGINT USING biaya_pemeliharaan_alat_non_medis::BIGINT,
      ALTER COLUMN biaya_operasional_lainnya TYPE BIGINT USING biaya_operasional_lainnya::BIGINT,
      ALTER COLUMN biaya_penyusutan_gedung TYPE BIGINT USING biaya_penyusutan_gedung::BIGINT,
      ALTER COLUMN biaya_penyusutan_jaringan TYPE BIGINT USING biaya_penyusutan_jaringan::BIGINT,
      ALTER COLUMN biaya_penyusutan_alat_medis TYPE BIGINT USING biaya_penyusutan_alat_medis::BIGINT,
      ALTER COLUMN biaya_penyusutan_alat_non_medis TYPE BIGINT USING biaya_penyusutan_alat_non_medis::BIGINT,
      ALTER COLUMN biaya_pendidikan_pelatihan TYPE BIGINT USING biaya_pendidikan_pelatihan::BIGINT,
      ALTER COLUMN biaya_laundry TYPE BIGINT USING biaya_laundry::BIGINT,
      ALTER COLUMN biaya_sterilisasi TYPE BIGINT USING biaya_sterilisasi::BIGINT,
      ALTER COLUMN biaya_tidak_langsung_terdistribusi TYPE BIGINT USING biaya_tidak_langsung_terdistribusi::BIGINT;
  END IF;

  -- ================================
  -- 2. TABEL kalkulasi_tindakan_inap
  -- ================================
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'kalkulasi_tindakan_inap'
      AND column_name = 'biaya_gaji_tunjangan'
  ) THEN
    ALTER TABLE kalkulasi_tindakan_inap
      ALTER COLUMN biaya_bahan_tindakan TYPE BIGINT USING biaya_bahan_tindakan::BIGINT,
      ALTER COLUMN biaya_gaji_tunjangan TYPE BIGINT USING biaya_gaji_tunjangan::BIGINT,
      ALTER COLUMN biaya_makan_karyawan TYPE BIGINT USING biaya_makan_karyawan::BIGINT,
      ALTER COLUMN biaya_rumah_tangga TYPE BIGINT USING biaya_rumah_tangga::BIGINT,
      ALTER COLUMN biaya_cetak TYPE BIGINT USING biaya_cetak::BIGINT,
      ALTER COLUMN biaya_atk TYPE BIGINT USING biaya_atk::BIGINT,
      ALTER COLUMN biaya_listrik TYPE BIGINT USING biaya_listrik::BIGINT,
      ALTER COLUMN biaya_air TYPE BIGINT USING biaya_air::BIGINT,
      ALTER COLUMN biaya_telp TYPE BIGINT USING biaya_telp::BIGINT,
      ALTER COLUMN biaya_pemeliharaan_bangunan TYPE BIGINT USING biaya_pemeliharaan_bangunan::BIGINT,
      ALTER COLUMN biaya_pemeliharaan_alat_medis TYPE BIGINT USING biaya_pemeliharaan_alat_medis::BIGINT,
      ALTER COLUMN biaya_pemeliharaan_alat_non_medis TYPE BIGINT USING biaya_pemeliharaan_alat_non_medis::BIGINT,
      ALTER COLUMN biaya_operasional_lainnya TYPE BIGINT USING biaya_operasional_lainnya::BIGINT,
      ALTER COLUMN biaya_penyusutan_gedung TYPE BIGINT USING biaya_penyusutan_gedung::BIGINT,
      ALTER COLUMN biaya_penyusutan_jaringan TYPE BIGINT USING biaya_penyusutan_jaringan::BIGINT,
      ALTER COLUMN biaya_penyusutan_alat_medis TYPE BIGINT USING biaya_penyusutan_alat_medis::BIGINT,
      ALTER COLUMN biaya_penyusutan_alat_non_medis TYPE BIGINT USING biaya_penyusutan_alat_non_medis::BIGINT,
      ALTER COLUMN biaya_pendidikan_pelatihan TYPE BIGINT USING biaya_pendidikan_pelatihan::BIGINT,
      ALTER COLUMN biaya_laundry TYPE BIGINT USING biaya_laundry::BIGINT,
      ALTER COLUMN biaya_sterilisasi TYPE BIGINT USING biaya_sterilisasi::BIGINT,
      ALTER COLUMN biaya_tidak_langsung_terdistribusi TYPE BIGINT USING biaya_tidak_langsung_terdistribusi::BIGINT;
  END IF;
END;
$$;






