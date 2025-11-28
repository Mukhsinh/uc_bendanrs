-- =====================================================
-- FIX POPULATE SKENARIO TARIF AKOMODASI - FINAL
-- Tanggal: 27 November 2024
-- Deskripsi: Memperbaiki fungsi populate dengan struktur data yang benar
-- =====================================================

CREATE OR REPLACE FUNCTION populate_skenario_tarif_akomodasi(
  p_tenant_id UUID DEFAULT NULL,
  p_tahun INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_tahun INTEGER;
  v_avg_uc_vvip NUMERIC;
  v_avg_uc_vip NUMERIC;
  v_avg_uc_i NUMERIC;
  v_avg_uc_ii NUMERIC;
  v_avg_uc_iii NUMERIC;
  v_avg_profit_vvip NUMERIC;
  v_avg_profit_vip NUMERIC;
  v_avg_profit_i NUMERIC;
  v_avg_profit_ii NUMERIC;
  v_avg_profit_iii NUMERIC;
BEGIN
  -- Tentukan tenant_id
  v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id());
  
  -- Tentukan tahun
  v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  -- Hapus data lama untuk tahun dan tenant ini
  DELETE FROM skenario_tarif_akomodasi 
  WHERE tenant_id = v_tenant_id 
    AND tahun = v_tahun;
  
  -- Hitung average unit cost per kelas dari semua unit kerja
  SELECT 
    COALESCE(AVG(CASE WHEN kelas = 'VVIP' THEN NULLIF(unit_cost_per_kelas, 0) END), 0),
    COALESCE(AVG(CASE WHEN kelas = 'VIP' THEN NULLIF(unit_cost_per_kelas, 0) END), 0),
    COALESCE(AVG(CASE WHEN kelas = 'I' THEN NULLIF(unit_cost_per_kelas, 0) END), 0),
    COALESCE(AVG(CASE WHEN kelas = 'II' THEN NULLIF(unit_cost_per_kelas, 0) END), 0),
    COALESCE(AVG(CASE WHEN kelas = 'III' THEN NULLIF(unit_cost_per_kelas, 0) END), 0)
  INTO 
    v_avg_uc_vvip,
    v_avg_uc_vip,
    v_avg_uc_i,
    v_avg_uc_ii,
    v_avg_uc_iii
  FROM kalkulasi_biaya_kelas_akomodasi
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun;
  
  -- Hitung average profit (10% dari average unit cost)
  v_avg_profit_vvip := v_avg_uc_vvip * 0.1;
  v_avg_profit_vip := v_avg_uc_vip * 0.1;
  v_avg_profit_i := v_avg_uc_i * 0.1;
  v_avg_profit_ii := v_avg_uc_ii * 0.1;
  v_avg_profit_iii := v_avg_uc_iii * 0.1;
  
  -- Insert data baru dengan pivot dari kalkulasi_biaya_kelas_akomodasi
  INSERT INTO skenario_tarif_akomodasi (
    tenant_id,
    tahun,
    kode_unit_kerja,
    nama_unit_kerja,
    unit_cost_vvip,
    unit_cost_vip,
    unit_cost_i,
    unit_cost_ii,
    unit_cost_iii,
    tarif_vvip,
    tarif_vip,
    tarif_i,
    tarif_ii,
    tarif_iii,
    profit_vvip,
    profit_vip,
    profit_i,
    profit_ii,
    profit_iii,
    average_unit_cost_vvip,
    average_unit_cost_vip,
    average_unit_cost_i,
    average_unit_cost_ii,
    average_unit_cost_iii,
    average_profit_vvip,
    average_profit_vip,
    average_profit_i,
    average_profit_ii,
    average_profit_iii,
    created_at,
    updated_at,
    user_id
  )
  SELECT 
    v_tenant_id,
    v_tahun,
    kode_unit_kerja,
    nama_unit_kerja,
    -- Unit Cost per kelas (pivot)
    COALESCE(MAX(CASE WHEN kelas = 'VVIP' THEN unit_cost_per_kelas END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'VIP' THEN unit_cost_per_kelas END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'I' THEN unit_cost_per_kelas END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'II' THEN unit_cost_per_kelas END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'III' THEN unit_cost_per_kelas END), 0),
    -- Tarif default = unit cost + 10%
    COALESCE(MAX(CASE WHEN kelas = 'VVIP' THEN unit_cost_per_kelas * 1.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'VIP' THEN unit_cost_per_kelas * 1.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'I' THEN unit_cost_per_kelas * 1.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'II' THEN unit_cost_per_kelas * 1.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'III' THEN unit_cost_per_kelas * 1.1 END), 0),
    -- Profit default = 10% dari unit cost
    COALESCE(MAX(CASE WHEN kelas = 'VVIP' THEN unit_cost_per_kelas * 0.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'VIP' THEN unit_cost_per_kelas * 0.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'I' THEN unit_cost_per_kelas * 0.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'II' THEN unit_cost_per_kelas * 0.1 END), 0),
    COALESCE(MAX(CASE WHEN kelas = 'III' THEN unit_cost_per_kelas * 0.1 END), 0),
    -- Average unit cost (sama untuk semua row)
    v_avg_uc_vvip,
    v_avg_uc_vip,
    v_avg_uc_i,
    v_avg_uc_ii,
    v_avg_uc_iii,
    -- Average profit
    v_avg_profit_vvip,
    v_avg_profit_vip,
    v_avg_profit_i,
    v_avg_profit_ii,
    v_avg_profit_iii,
    NOW(),
    NOW(),
    auth.uid()
  FROM kalkulasi_biaya_kelas_akomodasi
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun
  GROUP BY kode_unit_kerja, nama_unit_kerja
  ORDER BY kode_unit_kerja;
  
  RAISE NOTICE 'Berhasil populate skenario tarif akomodasi untuk tenant % tahun %', v_tenant_id, v_tahun;
  RAISE NOTICE 'Average UC VVIP: %, Average Profit VVIP: %', v_avg_uc_vvip, v_avg_profit_vvip;
  RAISE NOTICE 'Average UC VIP: %, Average Profit VIP: %', v_avg_uc_vip, v_avg_profit_vip;
  RAISE NOTICE 'Average UC I: %, Average Profit I: %', v_avg_uc_i, v_avg_profit_i;
  RAISE NOTICE 'Average UC II: %, Average Profit II: %', v_avg_uc_ii, v_avg_profit_ii;
  RAISE NOTICE 'Average UC III: %, Average Profit III: %', v_avg_uc_iii, v_avg_profit_iii;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION populate_skenario_tarif_akomodasi(UUID, INTEGER) TO authenticated;
