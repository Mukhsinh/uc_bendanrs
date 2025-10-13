-- Final script to create Data_Kegiatan table with all required fields
-- Run this in Supabase SQL Editor

-- Drop table if exists (for testing)
-- DROP TABLE IF EXISTS "Data_Kegiatan";

-- Create Data_Kegiatan table
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
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_created_at ON "Data_Kegiatan"(created_at);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_tahun ON "Data_Kegiatan"(tahun);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_unit_kerja_id ON "Data_Kegiatan"(unit_kerja_id);

-- Enable Row Level Security
ALTER TABLE "Data_Kegiatan" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON "Data_Kegiatan";
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
    ADD CONSTRAINT IF NOT EXISTS fk_data_kegiatan_unit_kerja
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

-- Also ensure computed columns exist on the lowercase table used by the app: public.data_kegiatan
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'data_kegiatan'
  ) THEN
    BEGIN
      ALTER TABLE public.data_kegiatan
        ADD COLUMN IF NOT EXISTS "Jumlah_SDM" integer GENERATED ALWAYS AS (
          COALESCE("SDM_dokter",0) + COALESCE("SDM_Perawat",0) + COALESCE("SDM_Non",0)
        ) STORED,
        ADD COLUMN IF NOT EXISTS "Total_Kunjungan_Pasien" integer GENERATED ALWAYS AS (
          COALESCE("Kunjungan_Pasien_Lama",0) + COALESCE("Kunjungan_Pasien_Baru",0)
        ) STORED,
        ADD COLUMN IF NOT EXISTS "Total_Diklat" integer GENERATED ALWAYS AS (
          COALESCE("Diklat_Jumlah_Siswa",0) * COALESCE("Diklat_Lama_Hari",0)
        ) STORED;
    EXCEPTION WHEN duplicate_column THEN
      NULL;
    END;
  END IF;
END $$;