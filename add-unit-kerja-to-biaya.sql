-- Script untuk menambahkan field unit_kerja_id ke tabel biaya
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tambahkan kolom unit_kerja_id ke tabel biaya
ALTER TABLE biaya 
ADD COLUMN IF NOT EXISTS unit_kerja_id UUID;

-- 2. Buat foreign key constraint ke tabel unit_kerja
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'unit_kerja'
  ) THEN
    ALTER TABLE biaya
    ADD CONSTRAINT IF NOT EXISTS fk_biaya_unit_kerja
    FOREIGN KEY (unit_kerja_id)
    REFERENCES unit_kerja(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_biaya_unit_kerja_id ON biaya(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_biaya_tahun_unit_kerja ON biaya(tahun, unit_kerja_id);

-- 4. Update RLS policy untuk biaya (jika diperlukan)
-- Pastikan policy sudah ada untuk tabel biaya
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'biaya' 
    AND policyname = 'Allow all operations for authenticated users'
  ) THEN
    ALTER TABLE biaya ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow all operations for authenticated users" ON biaya
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 5. Verifikasi perubahan
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'biaya' 
  AND table_schema = 'public'
  AND column_name IN ('unit_kerja_id', 'tahun', 'user_id')
ORDER BY ordinal_position;

-- 6. Cek foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'biaya';
