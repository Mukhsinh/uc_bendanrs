-- =====================================================
-- FIX AVERAGE PROFIT CALCULATION
-- Tanggal: 27 November 2024
-- Deskripsi: Memperbaiki kalkulasi average profit yang tidak terisi
-- =====================================================

-- Drop fungsi lama jika ada
DROP FUNCTION IF EXISTS populate_skenario_tarif_akomodasi(UUID, INTEGER);

-- Buat fungsi populate yang baru dengan kalkulasi average profit
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
  v_tenant_id := COALESCE(p_tenant_id, auth.uid_tenant_id());
  
  -- Tentukan tahun
  v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  -- Hapus data lama untuk tahun dan tenant ini
  DELETE FROM skenario_tarif_akomodasi 
  WHERE tenant_id = v_tenant_id 
    AND tahun = v_tahun;
  
  -- Hitung average unit cost dari semua unit kerja yang punya data
  SELECT 
    COALESCE(AVG(NULLIF(kbka.unit_cost_vvip, 0)), 0),
    COALESCE(AVG(NULLIF(kbka.unit_cost_vip, 0)), 0),
    COALESCE(AVG(NULLIF(kbka.unit_cost_i, 0)), 0),
    COALESCE(AVG(NULLIF(kbka.unit_cost_ii, 0)), 0),
    COALESCE(AVG(NULLIF(kbka.unit_cost_iii, 0)), 0)
  INTO 
    v_avg_uc_vvip,
    v_avg_uc_vip,
    v_avg_uc_i,
    v_avg_uc_ii,
    v_avg_uc_iii
  FROM kalkulasi_biaya_kelas_akomodasi kbka
  WHERE kbka.tenant_id = v_tenant_id
    AND kbka.tahun = v_tahun;
  
  -- Insert data baru dari kalkulasi_biaya_kelas_akomodasi
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
    kbka.tenant_id,
    kbka.tahun,
    uk.kode_unit_kerja,
    uk.nama_unit_kerja,
    COALESCE(kbka.unit_cost_vvip, 0),
    COALESCE(kbka.unit_cost_vip, 0),
    COALESCE(kbka.unit_cost_i, 0),
    COALESCE(kbka.unit_cost_ii, 0),
    COALESCE(kbka.unit_cost_iii, 0),
    -- Tarif default = unit cost + 10%
    COALESCE(kbka.unit_cost_vvip * 1.1, 0),
    COALESCE(kbka.unit_cost_vip * 1.1, 0),
    COALESCE(kbka.unit_cost_i * 1.1, 0),
    COALESCE(kbka.unit_cost_ii * 1.1, 0),
    COALESCE(kbka.unit_cost_iii * 1.1, 0),
    -- Profit default = 10% dari unit cost
    COALESCE(kbka.unit_cost_vvip * 0.1, 0),
    COALESCE(kbka.unit_cost_vip * 0.1, 0),
    COALESCE(kbka.unit_cost_i * 0.1, 0),
    COALESCE(kbka.unit_cost_ii * 0.1, 0),
    COALESCE(kbka.unit_cost_iii * 0.1, 0),
    -- Average unit cost (sama untuk semua row)
    v_avg_uc_vvip,
    v_avg_uc_vip,
    v_avg_uc_i,
    v_avg_uc_ii,
    v_avg_uc_iii,
    -- Average profit (10% dari average unit cost)
    v_avg_uc_vvip * 0.1,
    v_avg_uc_vip * 0.1,
    v_avg_uc_i * 0.1,
    v_avg_uc_ii * 0.1,
    v_avg_uc_iii * 0.1,
    NOW(),
    NOW(),
    auth.uid()
  FROM kalkulasi_biaya_kelas_akomodasi kbka
  JOIN unit_kerja uk ON kbka.unit_kerja_id = uk.id
  WHERE kbka.tenant_id = v_tenant_id
    AND kbka.tahun = v_tahun
  ORDER BY uk.kode_unit_kerja;
  
  -- Update average profit setelah semua data ter-insert
  -- Hitung average profit dari profit yang sudah ada
  SELECT 
    COALESCE(AVG(NULLIF(profit_vvip, 0)), 0),
    COALESCE(AVG(NULLIF(profit_vip, 0)), 0),
    COALESCE(AVG(NULLIF(profit_i, 0)), 0),
    COALESCE(AVG(NULLIF(profit_ii, 0)), 0),
    COALESCE(AVG(NULLIF(profit_iii, 0)), 0)
  INTO 
    v_avg_profit_vvip,
    v_avg_profit_vip,
    v_avg_profit_i,
    v_avg_profit_ii,
    v_avg_profit_iii
  FROM skenario_tarif_akomodasi
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun;
  
  -- Update semua row dengan average profit yang benar
  UPDATE skenario_tarif_akomodasi
  SET 
    average_profit_vvip = v_avg_profit_vvip,
    average_profit_vip = v_avg_profit_vip,
    average_profit_i = v_avg_profit_i,
    average_profit_ii = v_avg_profit_ii,
    average_profit_iii = v_avg_profit_iii,
    updated_at = NOW()
  WHERE tenant_id = v_tenant_id
    AND tahun = v_tahun;
  
  RAISE NOTICE 'Berhasil populate skenario tarif akomodasi untuk tenant % tahun %', v_tenant_id, v_tahun;
  RAISE NOTICE 'Average UC VVIP: %, Average Profit VVIP: %', v_avg_uc_vvip, v_avg_profit_vvip;
  RAISE NOTICE 'Average UC VIP: %, Average Profit VIP: %', v_avg_uc_vip, v_avg_profit_vip;
END;
$$;

-- Buat trigger untuk update average profit saat ada perubahan tarif
CREATE OR REPLACE FUNCTION trigger_update_average_profit_skenario_tarif_akomodasi()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_profit_vvip NUMERIC;
  v_avg_profit_vip NUMERIC;
  v_avg_profit_i NUMERIC;
  v_avg_profit_ii NUMERIC;
  v_avg_profit_iii NUMERIC;
BEGIN
  -- Hitung ulang profit untuk row yang diupdate
  NEW.profit_vvip := NEW.tarif_vvip - NEW.unit_cost_vvip;
  NEW.profit_vip := NEW.tarif_vip - NEW.unit_cost_vip;
  NEW.profit_i := NEW.tarif_i - NEW.unit_cost_i;
  NEW.profit_ii := NEW.tarif_ii - NEW.unit_cost_ii;
  NEW.profit_iii := NEW.tarif_iii - NEW.unit_cost_iii;
  
  -- Hitung average profit dari semua row di tahun dan tenant yang sama
  SELECT 
    COALESCE(AVG(CASE WHEN id = NEW.id THEN NEW.profit_vvip ELSE NULLIF(profit_vvip, 0) END), 0),
    COALESCE(AVG(CASE WHEN id = NEW.id THEN NEW.profit_vip ELSE NULLIF(profit_vip, 0) END), 0),
    COALESCE(AVG(CASE WHEN id = NEW.id THEN NEW.profit_i ELSE NULLIF(profit_i, 0) END), 0),
    COALESCE(AVG(CASE WHEN id = NEW.id THEN NEW.profit_ii ELSE NULLIF(profit_ii, 0) END), 0),
    COALESCE(AVG(CASE WHEN id = NEW.id THEN NEW.profit_iii ELSE NULLIF(profit_iii, 0) END), 0)
  INTO 
    v_avg_profit_vvip,
    v_avg_profit_vip,
    v_avg_profit_i,
    v_avg_profit_ii,
    v_avg_profit_iii
  FROM skenario_tarif_akomodasi
  WHERE tenant_id = NEW.tenant_id
    AND tahun = NEW.tahun;
  
  -- Set average profit untuk row ini
  NEW.average_profit_vvip := v_avg_profit_vvip;
  NEW.average_profit_vip := v_avg_profit_vip;
  NEW.average_profit_i := v_avg_profit_i;
  NEW.average_profit_ii := v_avg_profit_ii;
  NEW.average_profit_iii := v_avg_profit_iii;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;

-- Drop trigger lama jika ada
DROP TRIGGER IF EXISTS trigger_update_profit_skenario_tarif_akomodasi ON skenario_tarif_akomodasi;

-- Buat trigger baru
CREATE TRIGGER trigger_update_profit_skenario_tarif_akomodasi
  BEFORE UPDATE ON skenario_tarif_akomodasi
  FOR EACH ROW
  WHEN (
    OLD.tarif_vvip IS DISTINCT FROM NEW.tarif_vvip OR
    OLD.tarif_vip IS DISTINCT FROM NEW.tarif_vip OR
    OLD.tarif_i IS DISTINCT FROM NEW.tarif_i OR
    OLD.tarif_ii IS DISTINCT FROM NEW.tarif_ii OR
    OLD.tarif_iii IS DISTINCT FROM NEW.tarif_iii
  )
  EXECUTE FUNCTION trigger_update_average_profit_skenario_tarif_akomodasi();

-- Buat fungsi untuk update average profit semua row setelah trigger
CREATE OR REPLACE FUNCTION trigger_update_all_average_profit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update semua row di tahun dan tenant yang sama dengan average profit terbaru
  UPDATE skenario_tarif_akomodasi
  SET 
    average_profit_vvip = NEW.average_profit_vvip,
    average_profit_vip = NEW.average_profit_vip,
    average_profit_i = NEW.average_profit_i,
    average_profit_ii = NEW.average_profit_ii,
    average_profit_iii = NEW.average_profit_iii
  WHERE tenant_id = NEW.tenant_id
    AND tahun = NEW.tahun
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Buat trigger untuk sync average profit ke semua row
DROP TRIGGER IF EXISTS trigger_sync_average_profit ON skenario_tarif_akomodasi;

CREATE TRIGGER trigger_sync_average_profit
  AFTER UPDATE ON skenario_tarif_akomodasi
  FOR EACH ROW
  WHEN (
    OLD.average_profit_vvip IS DISTINCT FROM NEW.average_profit_vvip OR
    OLD.average_profit_vip IS DISTINCT FROM NEW.average_profit_vip OR
    OLD.average_profit_i IS DISTINCT FROM NEW.average_profit_i OR
    OLD.average_profit_ii IS DISTINCT FROM NEW.average_profit_ii OR
    OLD.average_profit_iii IS DISTINCT FROM NEW.average_profit_iii
  )
  EXECUTE FUNCTION trigger_update_all_average_profit();

-- Grant permissions
GRANT EXECUTE ON FUNCTION populate_skenario_tarif_akomodasi(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_average_profit_skenario_tarif_akomodasi() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_all_average_profit() TO authenticated;

-- Test populate untuk memastikan average profit terisi
-- SELECT populate_skenario_tarif_akomodasi(NULL, 2025);

-- Verifikasi average profit
-- SELECT 
--   kode_unit_kerja,
--   average_profit_vvip,
--   average_profit_vip,
--   profit_vvip,
--   profit_vip
-- FROM skenario_tarif_akomodasi
-- WHERE tahun = 2025
-- LIMIT 5;
