-- =====================================================
-- PERBAIKAN SKENARIO TARIF: PERBARUI DATA DARI REKAPITULASI UNIT COST
-- =====================================================
-- Tanggal: 27 November 2024
-- Deskripsi: 
-- 1. Memastikan tombol "Perbarui Data" mengupdate nilai dari rekapitulasi_unit_cost
-- 2. Menambahkan/memperbarui kolom kode_operator dan nama_operator
-- 3. Memastikan semua kolom diambil sesuai dengan tabel rekapitulasi_unit_cost
-- =====================================================

-- Drop fungsi lama jika ada
DROP FUNCTION IF EXISTS public.perbarui_data_skenario_tarif(UUID, INTEGER);

-- Fungsi untuk memperbarui data skenario tarif dari rekapitulasi_unit_cost
CREATE OR REPLACE FUNCTION public.perbarui_data_skenario_tarif(
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
  v_tenant_id UUID;
  v_rec RECORD;
BEGIN
  -- Get tenant_id from auth context
  v_tenant_id := auth.uid()::uuid;
  
  -- Set default values
  v_tahun := COALESCE(p_tahun, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_user_id := COALESCE(p_user_id, auth.uid());

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
    -- Update atau insert data ke skenario_tarif
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
    WHERE kode_unit_kerja = v_rec.kode_unit_kerja
      AND kode_tindakan = v_rec.kode_tindakan
      AND tahun = v_tahun
      AND tenant_id = v_tenant_id;
    
    -- Jika tidak ada yang diupdate, insert baru
    IF NOT FOUND THEN
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
    END IF;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN v_updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.perbarui_data_skenario_tarif(UUID, INTEGER) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.perbarui_data_skenario_tarif(UUID, INTEGER) IS 
'Memperbarui data skenario tarif dari rekapitulasi_unit_cost. 
Mengupdate semua kolom termasuk kode_operator dan nama_operator.
Digunakan oleh tombol "Perbarui Data" di halaman Skenario Tarif.';

-- =====================================================
-- TESTING
-- =====================================================

-- Test: Perbarui data skenario tarif untuk tahun 2025
-- SELECT public.perbarui_data_skenario_tarif(auth.uid(), 2025);

-- Verifikasi: Cek data yang sudah diupdate
-- SELECT 
--   kode_unit_kerja,
--   nama_unit_kerja,
--   kode_operator,
--   nama_operator,
--   kode_tindakan,
--   nama_tindakan,
--   biaya_bahan,
--   unit_cost_per_tindakan,
--   sumber_tabel
-- FROM skenario_tarif
-- WHERE tahun = 2025
--   AND kode_operator IS NOT NULL
-- ORDER BY kode_unit_kerja, kode_operator, kode_tindakan
-- LIMIT 20;
