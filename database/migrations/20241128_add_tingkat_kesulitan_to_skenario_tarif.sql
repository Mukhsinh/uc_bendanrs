-- Migration: Add tingkat_kesulitan column to skenario_tarif table
-- Date: 2024-11-28
-- Description: Menambahkan kolom tingkat_kesulitan ke tabel skenario_tarif untuk menampilkan tingkat kesulitan tindakan

-- Add tingkat_kesulitan column to skenario_tarif
ALTER TABLE skenario_tarif 
ADD COLUMN IF NOT EXISTS tingkat_kesulitan smallint DEFAULT 1;

-- Add comment to explain the column
COMMENT ON COLUMN skenario_tarif.tingkat_kesulitan IS 'Tingkat kesulitan tindakan dari tabel daftar_tindakan: 1=Sangat Mudah, 2=Mudah, 3=Sedang, 4=Sulit, 5=Sangat Sulit';

-- Update existing records with tingkat_kesulitan from daftar_tindakan
UPDATE skenario_tarif st
SET tingkat_kesulitan = dt.tingkat_kesulitan
FROM daftar_tindakan dt
WHERE st.kode_tindakan = dt.kode_tindakan
  AND st.tingkat_kesulitan IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_skenario_tarif_tingkat_kesulitan 
ON skenario_tarif(tingkat_kesulitan);
