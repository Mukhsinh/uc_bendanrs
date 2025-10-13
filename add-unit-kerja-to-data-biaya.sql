-- Alter table public.data_biaya to add Unit Kerja relation and cached fields
-- Run this in Supabase SQL Editor

-- 1) Add columns
ALTER TABLE public.data_biaya
  ADD COLUMN IF NOT EXISTS unit_kerja_id UUID,
  ADD COLUMN IF NOT EXISTS kode_unit_kerja TEXT,
  ADD COLUMN IF NOT EXISTS nama_unit_kerja TEXT;

-- 2) Ensure referenced table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'unit_kerja'
  ) THEN
    RAISE EXCEPTION 'Tabel public.unit_kerja tidak ditemukan';
  END IF;
END $$;

-- 3) Add / ensure FK constraint
ALTER TABLE public.data_biaya
  ADD CONSTRAINT IF NOT EXISTS fk_data_biaya_unit_kerja
  FOREIGN KEY (unit_kerja_id)
  REFERENCES public.unit_kerja(id)
  ON DELETE SET NULL;

-- 4) Optional: replace unique constraint to include unit_kerja_id
--    Old: unique (user_id, tahun)
--    New: unique (user_id, tahun, unit_kerja_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'data_biaya'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'unique_tahun_per_user'
  ) THEN
    ALTER TABLE public.data_biaya DROP CONSTRAINT unique_tahun_per_user;
  END IF;
END $$;

-- Note: Using a unique index with COALESCE to prevent multiple NULL duplicates
-- Drop old helper index if present
DROP INDEX IF EXISTS ux_data_biaya_user_tahun_unit_kerja;
CREATE UNIQUE INDEX IF NOT EXISTS ux_data_biaya_user_tahun_unit_kerja
  ON public.data_biaya (user_id, tahun, COALESCE(unit_kerja_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 5) Backfill cached fields from unit_kerja for existing rows
UPDATE public.data_biaya db
SET kode_unit_kerja = uk.kode,
    nama_unit_kerja = uk.nama
FROM public.unit_kerja uk
WHERE db.unit_kerja_id = uk.id
  AND (db.kode_unit_kerja IS DISTINCT FROM uk.kode OR db.nama_unit_kerja IS DISTINCT FROM uk.nama);

-- 6) Trigger to keep cached fields in sync when data_biaya changes
CREATE OR REPLACE FUNCTION public.data_biaya_sync_unit_kerja()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unit_kerja_id IS NULL THEN
    NEW.kode_unit_kerja := NULL;
    NEW.nama_unit_kerja := NULL;
  ELSE
    SELECT u.kode, u.nama
      INTO NEW.kode_unit_kerja, NEW.nama_unit_kerja
    FROM public.unit_kerja u
    WHERE u.id = NEW.unit_kerja_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_data_biaya_sync_unit_kerja ON public.data_biaya;
CREATE TRIGGER trg_data_biaya_sync_unit_kerja
  BEFORE INSERT OR UPDATE OF unit_kerja_id
  ON public.data_biaya
  FOR EACH ROW
  EXECUTE FUNCTION public.data_biaya_sync_unit_kerja();

-- 7) Trigger to propagate unit_kerja kode/nama changes to data_biaya
CREATE OR REPLACE FUNCTION public.unit_kerja_propagate_to_data_biaya()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.kode IS DISTINCT FROM OLD.kode) OR (NEW.nama IS DISTINCT FROM OLD.nama) THEN
    UPDATE public.data_biaya db
    SET kode_unit_kerja = NEW.kode,
        nama_unit_kerja = NEW.nama
    WHERE db.unit_kerja_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unit_kerja_propagate_to_data_biaya ON public.unit_kerja;
CREATE TRIGGER trg_unit_kerja_propagate_to_data_biaya
  AFTER UPDATE OF kode, nama
  ON public.unit_kerja
  FOR EACH ROW
  EXECUTE FUNCTION public.unit_kerja_propagate_to_data_biaya();

-- 8) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_data_biaya_unit_kerja_id ON public.data_biaya(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_data_biaya_tahun_unit_kerja ON public.data_biaya(tahun, unit_kerja_id);

-- 9) Quick verification selects
-- List columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'data_biaya'
  AND column_name IN ('unit_kerja_id','kode_unit_kerja','nama_unit_kerja')
ORDER BY column_name;

-- FK check
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' AND tc.table_name = 'data_biaya' AND tc.constraint_type = 'FOREIGN KEY';


