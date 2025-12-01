-- Migration: Fix perbarui_data_skenario_tarif to preserve manual input
-- Date: 2024-12-01
-- Description: Perbaiki fungsi perbarui_data_skenario_tarif agar tidak menghapus
--              data jasa_sarana dan jasa_pelayanan yang sudah diinput manual

-- Drop fungsi lama
DROP FUNCTION IF EXISTS perbarui_data_skenario_tarif(UUID, INTEGER);

-- Buat fungsi baru yang preserve manual input
CREATE OR REPLACE FUNCTION perbarui_data_skenario_tarif(
  p_user_id UUID DEFAULT NULL,
  p_tahun INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tahun INTEGER;
  v_user_id UUID;
  v_updated_count INTEGER := 0;
  v_inserted_count INTEGER := 0;
  v_tenant_id UUID;
  v_rec RECORD;
BEGIN
  -- Set default values
  v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Get tenant_id from user_profiles
  SELECT tenant_id INTO v_tenant_id
  FROM user_profiles
  WHERE user_id = v_user_id;

  -- Jika tidak ada tenant_id, gunakan auth.uid() sebagai fallback
  IF v_tenant_id IS NULL THEN
    v_tenant_id := v_user_id;
  END IF;

  -- Update data dari rekapitulasi_unit_cost
  FOR v_rec IN (
    SELECT 
      ruc.kode_jenis,
      ruc.kode_unit_kerja,
      ruc.nama_unit_kerja,
      ruc.kode_operator,
      ruc.nama_operator,
      ruc.kode_tindakan,
      ruc.nama_tindakan,
      COALESCE(ruc.biaya_bahan, 0) as biaya_bahan,
      COALESCE(ruc.unit_cost_per_tindakan, 0) as unit_cost_per_tindakan,
      ruc.sumber_tabel
    FROM rekapitulasi_unit_cost ruc
    WHERE ruc.tahun = v_tahun
      AND ruc.tenant_id = v_tenant_id
  ) LOOP
    -- Coba update data yang sudah ada
    -- PERBAIKAN: TIDAK update jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis
    -- karena ini adalah input manual dari user
    UPDATE skenario_tarif
    SET 
      kode_jenis = v_rec.kode_jenis,
      nama_unit_kerja = v_rec.nama_unit_kerja,
      kode_operator = v_rec.kode_operator,
      nama_operator = v_rec.nama_operator,
      nama_tindakan = v_rec.nama_tindakan,
      biaya_bahan = v_rec.biaya_bahan,
      unit_cost_per_tindakan = v_rec.unit_cost_per_tindakan,
      sumber_tabel = v_rec.sumber_tabel,
      updated_at = NOW()
      -- TIDAK update: jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis
      -- karena ini adalah input manual yang harus dipertahankan
    WHERE kode_unit_kerja = v_rec.kode_unit_kerja
      AND kode_tindakan = v_rec.kode_tindakan
      AND tahun = v_tahun
      AND tenant_id = v_tenant_id;
    
    -- Jika ada yang diupdate
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    ELSE
      -- Jika tidak ada yang diupdate, insert baru
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
      ) VALUES (
        v_user_id,
        v_tahun,
        v_rec.kode_jenis,
        v_rec.kode_unit_kerja,
        v_rec.nama_unit_kerja,
        v_rec.kode_operator,
        v_rec.nama_operator,
        v_rec.kode_tindakan,
        v_rec.nama_tindakan,
        v_rec.biaya_bahan,
        v_rec.unit_cost_per_tindakan,
        0, -- prosentase_jasa_pelayanan (akan dihitung oleh trigger)
        0, -- prosentase_profit (akan dihitung oleh trigger)
        0, -- jasa_sarana (input manual)
        0, -- jasa_pelayanan_medis (input manual)
        0, -- jasa_pelayanan_non_medis (input manual)
        0, -- jasa_pelayanan (akan dihitung oleh trigger)
        0, -- tarif_per_tindakan (akan dihitung oleh trigger)
        v_rec.sumber_tabel,
        v_tenant_id
      );
      
      v_inserted_count := v_inserted_count + 1;
    END IF;
  END LOOP;

  -- Return total records yang diproses
  RETURN v_updated_count + v_inserted_count;
END;
$$;

-- Tambahkan komentar
COMMENT ON FUNCTION perbarui_data_skenario_tarif IS 
'Memperbarui data skenario tarif dari rekapitulasi_unit_cost. 
PENTING: Fungsi ini TIDAK akan mengubah jasa_sarana, jasa_pelayanan_medis, 
dan jasa_pelayanan_non_medis yang sudah diinput manual oleh user.
Hanya update: kode_jenis, nama_unit_kerja, kode_operator, nama_operator, 
nama_tindakan, biaya_bahan, unit_cost_per_tindakan, sumber_tabel';
