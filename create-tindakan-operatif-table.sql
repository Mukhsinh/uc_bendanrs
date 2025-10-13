-- Create table for tindakan operatif
-- Fields requested:
-- 1. kode_jenis: relasi dari unit_kerja.jenis, default 3 (operatif)
-- 2. kode_operator_spesialistik: format "jenis.xx"
-- 3. nama_operator_spesialistik
-- 4. kode_tindakan_operatif: format "kode_operator_spesialistik.xxx"
-- 5. nama_tindakan_operatif

-- Ensure the unit_kerja table has column jenis (1,2,3) as per add-jenis-to-unit-kerja.sql

CREATE TABLE IF NOT EXISTS tindakan_operatif (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kode_jenis SMALLINT NOT NULL DEFAULT 3 CHECK (kode_jenis IN (1,2,3)),
  kode_operator_spesialistik VARCHAR(20) NOT NULL,
  nama_operator_spesialistik VARCHAR(255) NOT NULL,
  kode_tindakan_operatif VARCHAR(30) NOT NULL,
  nama_tindakan_operatif VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_tindakan_operatif_kode UNIQUE (kode_tindakan_operatif)
);

-- Add a FK-like reference to unit_kerja.jenis using a lookup constraint table to avoid referencing non-PK column
-- Because PostgreSQL cannot reference a non-unique column directly, we validate via check and optional trigger.

-- Optional: lightweight validation trigger to enforce formatting conventions
CREATE OR REPLACE FUNCTION validate_tindakan_operatif_codes()
RETURNS TRIGGER AS $$
DECLARE
  expected_prefix text;
BEGIN
  -- Pastikan kode_jenis adalah 1,2,atau 3 (sudah dijaga CHECK) dan default 3
  -- Bentuk kode_operator_spesialistik: jenis.xx (misal 3.01)
  IF NEW.kode_operator_spesialistik !~ '^[0-9]+\.[0-9]{2}$' THEN
    RAISE EXCEPTION 'kode_operator_spesialistik harus dalam format jenis.xx, contoh 3.01';
  END IF;

  -- Prefix harus sesuai dengan kode_jenis
  expected_prefix := NEW.kode_jenis::text || '.';
  IF position(expected_prefix in NEW.kode_operator_spesialistik) <> 1 THEN
    RAISE EXCEPTION 'kode_operator_spesialistik harus diawali dengan %', expected_prefix;
  END IF;

  -- Bentuk kode_tindakan_operatif: kode_operator_spesialistik.xxx (misal 3.01.005)
  IF NEW.kode_tindakan_operatif !~ '^[0-9]+\.[0-9]{2}\.[0-9]{3}$' THEN
    RAISE EXCEPTION 'kode_tindakan_operatif harus dalam format kode_operator_spesialistik.xxx, contoh 3.01.005';
  END IF;

  -- kode_tindakan_operatif harus diawali kode_operator_spesialistik
  IF position(NEW.kode_operator_spesialistik || '.' in NEW.kode_tindakan_operatif) <> 1 THEN
    RAISE EXCEPTION 'kode_tindakan_operatif harus diawali dengan kode_operator_spesialistik dan titik';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_tindakan_operatif ON tindakan_operatif;
CREATE TRIGGER trg_validate_tindakan_operatif
  BEFORE INSERT OR UPDATE ON tindakan_operatif
  FOR EACH ROW EXECUTE FUNCTION validate_tindakan_operatif_codes();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_tindakan_operatif_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tindakan_operatif_updated_at ON tindakan_operatif;
CREATE TRIGGER update_tindakan_operatif_updated_at
  BEFORE UPDATE ON tindakan_operatif
  FOR EACH ROW EXECUTE FUNCTION update_tindakan_operatif_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tind_operatif_kode_jenis ON tindakan_operatif(kode_jenis);
CREATE INDEX IF NOT EXISTS idx_tind_operatif_kode_operator ON tindakan_operatif(kode_operator_spesialistik);
CREATE INDEX IF NOT EXISTS idx_tind_operatif_kode ON tindakan_operatif(kode_tindakan_operatif);

-- Enable RLS and basic policy akin to biaya/unit_kerja
ALTER TABLE tindakan_operatif ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON tindakan_operatif;
CREATE POLICY "Allow all operations for authenticated users" ON tindakan_operatif
  FOR ALL USING (auth.role() = 'authenticated');

-- Simple verification
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='tindakan_operatif' ORDER BY ordinal_position;


