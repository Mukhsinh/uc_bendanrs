-- Script untuk memperbarui struktur tabel Supabase
-- Jalankan script ini di Supabase SQL Editor

-- 1. Perbarui tabel Data_Kegiatan untuk menambahkan field yang hilang
ALTER TABLE "Data_Kegiatan" 
ADD COLUMN IF NOT EXISTS tahun INTEGER,
ADD COLUMN IF NOT EXISTS unit_kerja_id UUID;

-- 2. Perbarui tabel unit_kerja untuk konsistensi
-- Hapus user_id dari unit_kerja karena seharusnya shared
ALTER TABLE unit_kerja 
DROP COLUMN IF EXISTS user_id;

-- 3. Buat foreign key constraint untuk Data_Kegiatan
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

-- 4. Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_tahun ON "Data_Kegiatan"(tahun);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_unit_kerja_id ON "Data_Kegiatan"(unit_kerja_id);

-- 5. Update RLS policies untuk unit_kerja (shared table)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON unit_kerja;
CREATE POLICY "Allow all operations for authenticated users" ON unit_kerja
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Verifikasi struktur tabel
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('Data_Kegiatan', 'unit_kerja', 'barang', 'biaya')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
