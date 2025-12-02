-- Migration: Remove tingkat_kesulitan column from skenario_tarif
-- Date: 2024-12-01
-- Description: Menghapus kolom tingkat_kesulitan yang tidak diperlukan untuk menyederhanakan tampilan

-- Drop kolom tingkat_kesulitan dari tabel skenario_tarif
ALTER TABLE skenario_tarif 
DROP COLUMN IF EXISTS tingkat_kesulitan;

-- Update function populate_skenario_tarif_from_rekapitulasi untuk tidak include tingkat_kesulitan
CREATE OR REPLACE FUNCTION populate_skenario_tarif_from_rekapitulasi(
  p_user_id UUID DEFAULT NULL,
  p_tahun INTEGER DEFAULT NULL,
  p_prosentase_jasa_pelayanan NUMERIC DEFAULT 0,
  p_prosentase_profit NUMERIC DEFAULT 0
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_tahun INTEGER;
BEGIN
  -- Determine tahun
  v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  -- Insert data dari kalkulasi_tindakan_inap
  INSERT INTO skenario_tarif (
    tahun,
    kode_jenis,
    kode_unit_kerja,
    nama_unit_kerja,
    kode_operator,
    nama_operator,
    kode_tindakan,
    nama_tindakan,
    biaya_bahan,
    unit_cost_per_tindakan,
    prosentase_jasa_pelayanan,
    prosentase_profit,
    jasa_sarana,
    jasa_pelayanan_medis,
    jasa_pelayanan_non_medis,
    jasa_pelayanan,
    tarif_per_tindakan,
    sumber_tabel,
    user_id,
    tenant_id
  )
  SELECT 
    v_tahun,
    kti.kode_jenis,
    kti.kode_unit_kerja,
    kti.nama_unit_kerja,
    kti.kode_operator,
    kti.nama_operator,
    COALESCE(kti.kode_tindakan, kti.kode_jenis_tindakan) as kode_tindakan,
    kti.jenis_tindakan as nama_tindakan,
    COALESCE(kti.biaya_bahan_tindakan, 0) as biaya_bahan,
    COALESCE(kti.unit_cost_tindakan_inap, 0) as unit_cost_per_tindakan,
    p_prosentase_jasa_pelayanan,
    p_prosentase_profit,
    0 as jasa_sarana,
    0 as jasa_pelayanan_medis,
    0 as jasa_pelayanan_non_medis,
    0 as jasa_pelayanan,
    0 as tarif_per_tindakan,
    'kalkulasi_tindakan_inap' as sumber_tabel,
    p_user_id,
    kti.tenant_id
  FROM kalkulasi_tindakan_inap kti
  WHERE kti.tahun = v_tahun
    AND (p_user_id IS NULL OR kti.user_id = p_user_id)
    AND NOT EXISTS (
      SELECT 1 FROM skenario_tarif st
      WHERE st.kode_tindakan = COALESCE(kti.kode_tindakan, kti.kode_jenis_tindakan)
        AND st.kode_unit_kerja = kti.kode_unit_kerja
        AND st.tahun = v_tahun
        AND (p_user_id IS NULL OR st.user_id = p_user_id)
    );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Insert data dari kalkulasi_tindakan_rawat_jalan
  INSERT INTO skenario_tarif (
    tahun,
    kode_jenis,
    kode_unit_kerja,
    nama_unit_kerja,
    kode_operator,
    nama_operator,
    kode_tindakan,
    nama_tindakan,
    biaya_bahan,
    unit_cost_per_tindakan,
    prosentase_jasa_pelayanan,
    prosentase_profit,
    jasa_sarana,
    jasa_pelayanan_medis,
    jasa_pelayanan_non_medis,
    jasa_pelayanan,
    tarif_per_tindakan,
    sumber_tabel,
    user_id,
    tenant_id
  )
  SELECT 
    v_tahun,
    ktrj.kode_jenis,
    ktrj.kode_unit_kerja,
    ktrj.nama_unit_kerja,
    ktrj.kode_operator,
    ktrj.nama_operator,
    COALESCE(ktrj.kode_tindakan, ktrj.kode_jenis_tindakan) as kode_tindakan,
    ktrj.jenis_tindakan as nama_tindakan,
    COALESCE(ktrj.biaya_bahan_tindakan, 0) as biaya_bahan,
    COALESCE(ktrj.unit_cost_tindakan_rawat_jalan, 0) as unit_cost_per_tindakan,
    p_prosentase_jasa_pelayanan,
    p_prosentase_profit,
    0 as jasa_sarana,
    0 as jasa_pelayanan_medis,
    0 as jasa_pelayanan_non_medis,
    0 as jasa_pelayanan,
    0 as tarif_per_tindakan,
    'kalkulasi_tindakan_rawat_jalan' as sumber_tabel,
    p_user_id,
    ktrj.tenant_id
  FROM kalkulasi_tindakan_rawat_jalan ktrj
  WHERE ktrj.tahun = v_tahun
    AND (p_user_id IS NULL OR ktrj.user_id = p_user_id)
    AND NOT EXISTS (
      SELECT 1 FROM skenario_tarif st
      WHERE st.kode_tindakan = COALESCE(ktrj.kode_tindakan, ktrj.kode_jenis_tindakan)
        AND st.kode_unit_kerja = ktrj.kode_unit_kerja
        AND st.tahun = v_tahun
        AND (p_user_id IS NULL OR st.user_id = p_user_id)
    );
  
  GET DIAGNOSTICS v_count = v_count + ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION populate_skenario_tarif_from_rekapitulasi IS 'Populate skenario tarif from kalkulasi tables without tingkat_kesulitan';
