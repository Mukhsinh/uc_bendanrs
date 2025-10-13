-- Create Data_Kegiatan table with proper syntax for Supabase
CREATE TABLE IF NOT EXISTS "Data_Kegiatan" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50),
  "Nama_Unit_Kerja" VARCHAR(255),
  tahun INTEGER,
  unit_kerja_id UUID,
  "Jml_jam_Praktek_per_hari" INTEGER,
  "SDM_Dr" INTEGER,
  "SDM_Prwt" INTEGER,
  "SDM_Non" INTEGER,
  "Listrik_kwh" FLOAT,
  "Air_m3" FLOAT,
  "Telepon_Freq_pakai_per_titik" INTEGER,
  "Komputer_SIMRS_jml_User" INTEGER,
  "Tempat_Tidur_SVIP" INTEGER,
  "Tempat_Tidur_VIP" INTEGER,
  "Tempat_Tidur_I" INTEGER,
  "Tempat_Tidur_II" INTEGER,
  "Tempat_Tidur_III" INTEGER,
  "Tempat_Tidur_Khusus" INTEGER,
  "Kunjungan_jml_pasien_Lama" INTEGER,
  "Kunjungan_jml_pasien_Baru" INTEGER,
  "Kunjungan_jml_pasien_Total" INTEGER,
  "Tindakan_Pemeriksaan_jml_Tindakan" INTEGER,
  "Resep_Lembar_Resep" INTEGER,
  "Cucian_kg_Cucian" FLOAT,
  "Instrumen_Besar" INTEGER,
  "Instrumen_Sedang" INTEGER,
  "Instrumen_Kecil" INTEGER,
  "Set_Pack_Besar" INTEGER,
  "Set_Pack_Sedang" INTEGER,
  "Set_Pack_Kecil" INTEGER,
  "Makanan_Karyawan_jml_Porsi" INTEGER,
  "Makanan_Pasien_jml_Porsi" INTEGER,
  "Hari_Rawat_SVIP" INTEGER,
  "Hari_Rawat_VIP" INTEGER,
  "Hari_Rawat_Utama" INTEGER,
  "Hari_Rawat_I" INTEGER,
  "Hari_Rawat_II" INTEGER,
  "Hari_Rawat_III" INTEGER,
  "Hari_Rawat_Khusus" INTEGER,
  "Pelayanan_Pendidikan_Total" INTEGER,
  "Pelayanan_Pendidikan_jml_Siswa" INTEGER,
  "Pelayanan_Pendidikan_Baru" INTEGER,
  "Pelayanan_Pendidikan_Lama" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_kode_uk ON "Data_Kegiatan"("Kode_UK");
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_nama_unit_kerja ON "Data_Kegiatan"("Nama_Unit_Kerja");
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_tahun ON "Data_Kegiatan"(tahun);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_unit_kerja_id ON "Data_Kegiatan"(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_created_at ON "Data_Kegiatan"(created_at);

-- Enable Row Level Security
ALTER TABLE "Data_Kegiatan" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON "Data_Kegiatan"
  FOR ALL USING (auth.role() = 'authenticated');

-- Foreign key to unit_kerja(id) if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'unit_kerja'
  ) THEN
    ALTER TABLE "Data_Kegiatan"
    ADD CONSTRAINT fk_data_kegiatan_unit_kerja
    FOREIGN KEY (unit_kerja_id)
    REFERENCES unit_kerja(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Data_Kegiatan' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
