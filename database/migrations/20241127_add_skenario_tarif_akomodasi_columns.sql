-- Migration: Add tariff component columns to skenario_tarif_akomodasi
-- Date: 2024-11-27
-- Purpose: Add columns for jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
--          jasa_pelayanan, and prosentase_jasa_pelayanan for each class

-- Add columns for VVIP class
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS jasa_sarana_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_vvip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_vvip NUMERIC DEFAULT 0;

-- Add columns for VIP class
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS jasa_sarana_vip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_vip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_vip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_vip NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_vip NUMERIC DEFAULT 0;

-- Add columns for Class I
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS jasa_sarana_i NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_i NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_i NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_i NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_i NUMERIC DEFAULT 0;

-- Add columns for Class II
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS jasa_sarana_ii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_ii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_ii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_ii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_ii NUMERIC DEFAULT 0;

-- Add columns for Class III
ALTER TABLE skenario_tarif_akomodasi
ADD COLUMN IF NOT EXISTS jasa_sarana_iii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_iii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_iii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_iii NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_iii NUMERIC DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN skenario_tarif_akomodasi.jasa_sarana_vvip IS 'Jasa sarana untuk kelas VVIP (dapat diedit manual)';
COMMENT ON COLUMN skenario_tarif_akomodasi.jasa_pelayanan_medis_vvip IS 'Jasa pelayanan medis untuk kelas VVIP (dapat diedit manual)';
COMMENT ON COLUMN skenario_tarif_akomodasi.jasa_pelayanan_non_medis_vvip IS 'Jasa pelayanan non medis untuk kelas VVIP (dapat diedit manual)';
COMMENT ON COLUMN skenario_tarif_akomodasi.jasa_pelayanan_vvip IS 'Total jasa pelayanan untuk kelas VVIP (calculated)';
COMMENT ON COLUMN skenario_tarif_akomodasi.prosentase_jasa_pelayanan_vvip IS 'Prosentase jasa pelayanan untuk kelas VVIP (calculated)';
