-- Add coded 'jenis' column to unit_kerja with allowed codes
-- Mapping: 1 = rawat jalan, 2 = rawat inap, 3 = operatif

ALTER TABLE IF EXISTS unit_kerja
ADD COLUMN IF NOT EXISTS jenis smallint
  CHECK (jenis IN (1, 2, 3))
  NOT NULL
  DEFAULT 1;

COMMENT ON COLUMN unit_kerja.jenis IS '1: rawat jalan, 2: rawat inap, 3: operatif';

-- Optionally, you can remove the default after backfilling existing rows:
-- ALTER TABLE unit_kerja ALTER COLUMN jenis DROP DEFAULT;

