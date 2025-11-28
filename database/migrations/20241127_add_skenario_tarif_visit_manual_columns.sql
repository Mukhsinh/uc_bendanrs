-- Migration: Add manual input columns to skenario_tarif_visit
-- Date: 2024-11-27
-- Description: Menambahkan kolom untuk input manual (jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis)
--              dan kolom calculated (jasa_pelayanan, prosentase_jasa_pelayanan) untuk setiap jenis visit/konsultasi

-- Visit Dokter Umum
ALTER TABLE skenario_tarif_visit
ADD COLUMN IF NOT EXISTS jasa_sarana_visit_umum NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_visit_umum NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_visit_umum NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_visit_umum NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_visit_umum NUMERIC(5,2) DEFAULT 0;

-- Visit Dokter Spesialis
ALTER TABLE skenario_tarif_visit
ADD COLUMN IF NOT EXISTS jasa_sarana_visit_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_visit_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_visit_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_visit_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_visit_spesialis NUMERIC(5,2) DEFAULT 0;

-- Visit Dokter Subspesialis
ALTER TABLE skenario_tarif_visit
ADD COLUMN IF NOT EXISTS jasa_sarana_visit_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_visit_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_visit_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_visit_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_visit_subspesialis NUMERIC(5,2) DEFAULT 0;

-- Konsultasi Dokter Spesialis
ALTER TABLE skenario_tarif_visit
ADD COLUMN IF NOT EXISTS jasa_sarana_konsultasi_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_konsultasi_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_konsultasi_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_konsultasi_spesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_konsultasi_spesialis NUMERIC(5,2) DEFAULT 0;

-- Konsultasi Dokter Subspesialis
ALTER TABLE skenario_tarif_visit
ADD COLUMN IF NOT EXISTS jasa_sarana_konsultasi_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_medis_konsultasi_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_non_medis_konsultasi_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jasa_pelayanan_konsultasi_subspesialis NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prosentase_jasa_pelayanan_konsultasi_subspesialis NUMERIC(5,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN skenario_tarif_visit.jasa_sarana_visit_umum IS 'Input manual: Jasa Sarana untuk Visit Dokter Umum';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_medis_visit_umum IS 'Input manual: Jasa Pelayanan Medis untuk Visit Dokter Umum';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_non_medis_visit_umum IS 'Input manual: Jasa Pelayanan Non Medis untuk Visit Dokter Umum';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_visit_umum IS 'Calculated: Total Jasa Pelayanan (Medis + Non Medis)';
COMMENT ON COLUMN skenario_tarif_visit.prosentase_jasa_pelayanan_visit_umum IS 'Calculated: Persentase Jasa Pelayanan terhadap Tarif';

COMMENT ON COLUMN skenario_tarif_visit.jasa_sarana_visit_spesialis IS 'Input manual: Jasa Sarana untuk Visit Dokter Spesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_medis_visit_spesialis IS 'Input manual: Jasa Pelayanan Medis untuk Visit Dokter Spesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_non_medis_visit_spesialis IS 'Input manual: Jasa Pelayanan Non Medis untuk Visit Dokter Spesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_visit_spesialis IS 'Calculated: Total Jasa Pelayanan (Medis + Non Medis)';
COMMENT ON COLUMN skenario_tarif_visit.prosentase_jasa_pelayanan_visit_spesialis IS 'Calculated: Persentase Jasa Pelayanan terhadap Tarif';

COMMENT ON COLUMN skenario_tarif_visit.jasa_sarana_visit_subspesialis IS 'Input manual: Jasa Sarana untuk Visit Dokter Subspesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_medis_visit_subspesialis IS 'Input manual: Jasa Pelayanan Medis untuk Visit Dokter Subspesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_non_medis_visit_subspesialis IS 'Input manual: Jasa Pelayanan Non Medis untuk Visit Dokter Subspesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_visit_subspesialis IS 'Calculated: Total Jasa Pelayanan (Medis + Non Medis)';
COMMENT ON COLUMN skenario_tarif_visit.prosentase_jasa_pelayanan_visit_subspesialis IS 'Calculated: Persentase Jasa Pelayanan terhadap Tarif';

COMMENT ON COLUMN skenario_tarif_visit.jasa_sarana_konsultasi_spesialis IS 'Input manual: Jasa Sarana untuk Konsultasi Dokter Spesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_medis_konsultasi_spesialis IS 'Input manual: Jasa Pelayanan Medis untuk Konsultasi Dokter Spesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_non_medis_konsultasi_spesialis IS 'Input manual: Jasa Pelayanan Non Medis untuk Konsultasi Dokter Spesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_konsultasi_spesialis IS 'Calculated: Total Jasa Pelayanan (Medis + Non Medis)';
COMMENT ON COLUMN skenario_tarif_visit.prosentase_jasa_pelayanan_konsultasi_spesialis IS 'Calculated: Persentase Jasa Pelayanan terhadap Tarif';

COMMENT ON COLUMN skenario_tarif_visit.jasa_sarana_konsultasi_subspesialis IS 'Input manual: Jasa Sarana untuk Konsultasi Dokter Subspesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_medis_konsultasi_subspesialis IS 'Input manual: Jasa Pelayanan Medis untuk Konsultasi Dokter Subspesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_non_medis_konsultasi_subspesialis IS 'Input manual: Jasa Pelayanan Non Medis untuk Konsultasi Dokter Subspesialis';
COMMENT ON COLUMN skenario_tarif_visit.jasa_pelayanan_konsultasi_subspesialis IS 'Calculated: Total Jasa Pelayanan (Medis + Non Medis)';
COMMENT ON COLUMN skenario_tarif_visit.prosentase_jasa_pelayanan_konsultasi_subspesialis IS 'Calculated: Persentase Jasa Pelayanan terhadap Tarif';
