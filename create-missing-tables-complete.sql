-- Script lengkap untuk membuat tabel Dasar_Alokasi dan Distribusi_Biaya
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat tabel Dasar_Alokasi
CREATE TABLE IF NOT EXISTS "Dasar_Alokasi" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat tabel Distribusi_Biaya
CREATE TABLE IF NOT EXISTS "Distribusi_Biaya" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Total_Dasar_Alokasi" DECIMAL(15,2) DEFAULT 0,
  "Persentase_Alokasi" DECIMAL(5,4) DEFAULT 0,
  "Biaya_Dialokasikan" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_kode_uk ON "Dasar_Alokasi"("Kode_UK");
CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_tahun ON "Dasar_Alokasi"("Tahun");
CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_unit_kerja_id ON "Dasar_Alokasi"("Unit_Kerja_ID");

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_kode_uk ON "Distribusi_Biaya"("Kode_UK");
CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_tahun ON "Distribusi_Biaya"("Tahun");
CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_unit_kerja_id ON "Distribusi_Biaya"("Unit_Kerja_ID");

-- 4. Enable RLS
ALTER TABLE "Dasar_Alokasi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Distribusi_Biaya" ENABLE ROW LEVEL SECURITY;

-- 5. Buat policies
CREATE POLICY "Allow all operations for authenticated users" ON "Dasar_Alokasi"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON "Distribusi_Biaya"
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Buat trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk Dasar_Alokasi
DROP TRIGGER IF EXISTS update_dasar_alokasi_updated_at ON "Dasar_Alokasi";
CREATE TRIGGER update_dasar_alokasi_updated_at
    BEFORE UPDATE ON "Dasar_Alokasi"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk Distribusi_Biaya
DROP TRIGGER IF EXISTS update_distribusi_biaya_updated_at ON "Distribusi_Biaya";
CREATE TRIGGER update_distribusi_biaya_updated_at
    BEFORE UPDATE ON "Distribusi_Biaya"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verifikasi tabel
SELECT 'Dasar_Alokasi' as table_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'Dasar_Alokasi' AND table_schema = 'public';

SELECT 'Distribusi_Biaya' as table_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'Distribusi_Biaya' AND table_schema = 'public';
