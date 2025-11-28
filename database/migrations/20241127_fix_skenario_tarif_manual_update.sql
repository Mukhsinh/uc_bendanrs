-- =====================================================
-- PERBAIKAN SKENARIO TARIF - MANUAL UPDATE & SYNC
-- =====================================================
-- Tanggal: 27 November 2024
-- Tujuan: 
-- 1. Fungsi untuk sinkronisasi biaya bahan manual
-- 2. Disable trigger untuk bulk update
-- 3. Perbaikan update manual tanpa auto-calculation
-- =====================================================

-- 1. Fungsi untuk sinkronisasi biaya bahan dari tabel sumber
CREATE OR REPLACE FUNCTION sync_biaya_bahan_skenario_tarif(
  p_tahun INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- Update biaya bahan dari kalkulasi_tindakan_inap
  FOR v_rec IN (
    SELECT 
      st.id,
      COALESCE(kti.biaya_bahan_tindakan, 0) as new_biaya_bahan
    FROM skenario_tarif st
    INNER JOIN kalkulasi_tindakan_inap kti 
      ON st.kode_tindakan = kti.kode_tindakan
      AND st.kode_unit_kerja = kti.kode_unit_kerja
      AND st.tahun = kti.tahun
    WHERE st.tahun = p_tahun
      AND st.sumber_tabel = 'kalkulasi_tindakan_inap'
      AND st.tenant_id = auth.uid()::uuid
      AND COALESCE(st.biaya_bahan, 0) != COALESCE(kti.biaya_bahan_tindakan, 0)
  ) LOOP
    UPDATE skenario_tarif
    SET 
      biaya_bahan = v_rec.new_biaya_bahan,
      updated_at = NOW()
    WHERE id = v_rec.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Update biaya bahan dari kalkulasi_tindakan_rawat_jalan
  FOR v_rec IN (
    SELECT 
      st.id,
      COALESCE(ktrj.biaya_bahan_tindakan, 0) as new_biaya_bahan
    FROM skenario_tarif st
    INNER JOIN kalkulasi_tindakan_rawat_jalan ktrj 
      ON st.kode_tindakan = ktrj.kode_tindakan
      AND st.kode_unit_kerja = ktrj.kode_unit_kerja
      AND st.tahun = ktrj.tahun
    WHERE st.tahun = p_tahun
      AND st.sumber_tabel = 'kalkulasi_tindakan_rawat_jalan'
      AND st.tenant_id = auth.uid()::uuid
      AND COALESCE(st.biaya_bahan, 0) != COALESCE(ktrj.biaya_bahan_tindakan, 0)
  ) LOOP
    UPDATE skenario_tarif
    SET 
      biaya_bahan = v_rec.new_biaya_bahan,
      updated_at = NOW()
    WHERE id = v_rec.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN v_updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_biaya_bahan_skenario_tarif(INTEGER) TO authenticated;

-- 2. Fungsi untuk bulk update tanpa trigger (untuk performa)
CREATE OR REPLACE FUNCTION bulk_update_skenario_tarif_manual(
  p_updates JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_update JSONB;
  v_id UUID;
  v_jasa_sarana BIGINT;
  v_jasa_pelayanan_medis BIGINT;
  v_jasa_pelayanan_non_medis BIGINT;
  v_jasa_pelayanan BIGINT;
  v_tarif_per_tindakan BIGINT;
  v_unit_cost BIGINT;
  v_prosentase_jasa_pelayanan NUMERIC;
  v_prosentase_profit NUMERIC;
BEGIN
  -- Disable trigger temporarily
  ALTER TABLE skenario_tarif DISABLE TRIGGER trigger_calculate_skenario_tarif;
  
  -- Loop through updates
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_id := (v_update->>'id')::UUID;
    v_jasa_sarana := (v_update->>'jasa_sarana')::BIGINT;
    v_jasa_pelayanan_medis := (v_update->>'jasa_pelayanan_medis')::BIGINT;
    v_jasa_pelayanan_non_medis := (v_update->>'jasa_pelayanan_non_medis')::BIGINT;
    
    -- Calculate derived fields
    v_jasa_pelayanan := v_jasa_pelayanan_medis + v_jasa_pelayanan_non_medis;
    v_tarif_per_tindakan := v_jasa_sarana + v_jasa_pelayanan;
    
    -- Get unit cost for profit calculation
    SELECT unit_cost_per_tindakan INTO v_unit_cost
    FROM skenario_tarif
    WHERE id = v_id;
    
    -- Calculate percentages
    IF v_tarif_per_tindakan > 0 THEN
      v_prosentase_jasa_pelayanan := ROUND((v_jasa_pelayanan::NUMERIC / v_tarif_per_tindakan::NUMERIC) * 100, 2);
    ELSE
      v_prosentase_jasa_pelayanan := 0;
    END IF;
    
    IF v_unit_cost > 0 THEN
      v_prosentase_profit := ROUND(((v_jasa_sarana::NUMERIC - v_unit_cost::NUMERIC) / v_unit_cost::NUMERIC) * 100, 2);
    ELSE
      v_prosentase_profit := 0;
    END IF;
    
    -- Update record
    UPDATE skenario_tarif
    SET 
      jasa_sarana = v_jasa_sarana,
      jasa_pelayanan_medis = v_jasa_pelayanan_medis,
      jasa_pelayanan_non_medis = v_jasa_pelayanan_non_medis,
      jasa_pelayanan = v_jasa_pelayanan,
      tarif_per_tindakan = v_tarif_per_tindakan,
      prosentase_jasa_pelayanan = v_prosentase_jasa_pelayanan,
      prosentase_profit = v_prosentase_profit,
      updated_at = NOW()
    WHERE id = v_id
      AND tenant_id = auth.uid()::uuid;
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  -- Re-enable trigger
  ALTER TABLE skenario_tarif ENABLE TRIGGER trigger_calculate_skenario_tarif;
  
  RETURN v_updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION bulk_update_skenario_tarif_manual(JSONB) TO authenticated;

-- 3. Perbaikan fungsi populate untuk include operator data
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

  -- Delete existing data for this year and tenant
  DELETE FROM skenario_tarif 
  WHERE tahun = v_tahun 
    AND tenant_id = v_tenant_id;

  -- Insert from kalkulasi_tindakan_inap with operator info
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
    kti.kode_operator,
    kti.nama_operator,
    kti.kode_tindakan,
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
  WHERE kti.tahun = v_tahun
    AND kti.tenant_id = v_tenant_id;

  v_inserted_count := (SELECT COUNT(*) FROM skenario_tarif WHERE tahun = v_tahun AND sumber_tabel = 'kalkulasi_tindakan_inap' AND tenant_id = v_tenant_id);

  -- Insert from kalkulasi_tindakan_rawat_jalan with operator info
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
    ktrj.kode_operator,
    ktrj.nama_operator,
    ktrj.kode_tindakan,
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
  WHERE ktrj.tahun = v_tahun
    AND ktrj.tenant_id = v_tenant_id;

  v_inserted_count := (SELECT COUNT(*) FROM skenario_tarif WHERE tahun = v_tahun AND tenant_id = v_tenant_id);

  RETURN v_inserted_count;
END;
$$;

-- Comment
COMMENT ON FUNCTION sync_biaya_bahan_skenario_tarif IS 'Sinkronisasi biaya bahan dari tabel sumber (kalkulasi_tindakan_inap/rawat_jalan) ke skenario_tarif';
COMMENT ON FUNCTION bulk_update_skenario_tarif_manual IS 'Bulk update skenario tarif tanpa trigger untuk performa lebih baik';
COMMENT ON FUNCTION populate_skenario_tarif_from_rekapitulasi IS 'Populate skenario tarif dari rekapitulasi dengan data operator';
