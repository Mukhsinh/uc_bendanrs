-- =====================================================
-- FIX POPULATE SKENARIO TARIF - KEEP OPERATOR DATA
-- =====================================================
-- Tanggal: 27 November 2024
-- Masalah: Data operator tidak ada di tabel sumber (kalkulasi_tindakan_inap/rawat_jalan)
-- Solusi: Preserve data operator yang sudah ada saat populate
-- =====================================================

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
  v_tahun INTEGER;
  v_user_id UUID;
  v_inserted_count INTEGER := 0;
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from auth context
  v_tenant_id := auth.uid()::uuid;
  
  -- Set default values
  v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Backup data operator yang sudah ada
  CREATE TEMP TABLE IF NOT EXISTS temp_operator_backup AS
  SELECT 
    kode_tindakan,
    kode_unit_kerja,
    kode_operator,
    nama_operator
  FROM skenario_tarif
  WHERE tahun = v_tahun 
    AND tenant_id = v_tenant_id
    AND kode_operator IS NOT NULL;

  -- Delete existing data for this year and tenant
  DELETE FROM skenario_tarif 
  WHERE tahun = v_tahun 
    AND tenant_id = v_tenant_id;

  -- Insert from kalkulasi_tindakan_inap
  INSERT INTO skenario_tarif (
    user_id,
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
    tenant_id
  )
  SELECT 
    v_user_id,
    v_tahun,
    kti.kode_jenis,
    kti.kode_unit_kerja,
    kti.nama_unit_kerja,
    tob.kode_operator, -- dari backup
    tob.nama_operator, -- dari backup
    kti.kode_jenis_tindakan as kode_tindakan,
    kti.jenis_tindakan,
    COALESCE(kti.biaya_bahan_tindakan, 0),
    COALESCE(kti.unit_cost_tindakan_inap, 0),
    p_prosentase_jasa_pelayanan,
    p_prosentase_profit,
    0, -- jasa_sarana (will be calculated)
    0, -- jasa_pelayanan_medis
    0, -- jasa_pelayanan_non_medis
    0, -- jasa_pelayanan
    0, -- tarif_per_tindakan
    'kalkulasi_tindakan_inap',
    v_tenant_id
  FROM kalkulasi_tindakan_inap kti
  LEFT JOIN temp_operator_backup tob 
    ON kti.kode_jenis_tindakan = tob.kode_tindakan
    AND kti.kode_unit_kerja = tob.kode_unit_kerja
  WHERE kti.tahun = v_tahun
    AND kti.tenant_id = v_tenant_id;

  v_inserted_count := (SELECT COUNT(*) FROM skenario_tarif WHERE tahun = v_tahun AND sumber_tabel = 'kalkulasi_tindakan_inap' AND tenant_id = v_tenant_id);

  -- Insert from kalkulasi_tindakan_rawat_jalan
  INSERT INTO skenario_tarif (
    user_id,
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
    tenant_id
  )
  SELECT 
    v_user_id,
    v_tahun,
    ktrj.kode_jenis,
    ktrj.kode_unit_kerja,
    ktrj.nama_unit_kerja,
    tob.kode_operator, -- dari backup
    tob.nama_operator, -- dari backup
    ktrj.kode_jenis_tindakan as kode_tindakan,
    ktrj.jenis_tindakan,
    COALESCE(ktrj.biaya_bahan_tindakan, 0),
    COALESCE(ktrj.unit_cost_tindakan_rawat_jalan, 0),
    p_prosentase_jasa_pelayanan,
    p_prosentase_profit,
    0, -- jasa_sarana
    0, -- jasa_pelayanan_medis
    0, -- jasa_pelayanan_non_medis
    0, -- jasa_pelayanan
    0, -- tarif_per_tindakan
    'kalkulasi_tindakan_rawat_jalan',
    v_tenant_id
  FROM kalkulasi_tindakan_rawat_jalan ktrj
  LEFT JOIN temp_operator_backup tob 
    ON ktrj.kode_jenis_tindakan = tob.kode_tindakan
    AND ktrj.kode_unit_kerja = tob.kode_unit_kerja
  WHERE ktrj.tahun = v_tahun
    AND ktrj.tenant_id = v_tenant_id;

  v_inserted_count := (SELECT COUNT(*) FROM skenario_tarif WHERE tahun = v_tahun AND tenant_id = v_tenant_id);

  -- Drop temp table
  DROP TABLE IF EXISTS temp_operator_backup;

  RETURN v_inserted_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION populate_skenario_tarif_from_rekapitulasi(UUID, INTEGER, NUMERIC, NUMERIC) TO authenticated;

-- Comment
COMMENT ON FUNCTION populate_skenario_tarif_from_rekapitulasi IS 'Populate skenario tarif dari rekapitulasi dengan preserve data operator yang sudah ada';
