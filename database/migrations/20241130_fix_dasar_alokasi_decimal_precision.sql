-- Migration: Fix Decimal Precision untuk Dasar Alokasi Kelas Akomodasi
-- Tanggal: 30 November 2024
-- Deskripsi: Memastikan semua kolom dasar_alokasi menggunakan NUMERIC(10,6) untuk konsistensi

-- 1. Ubah tipe data kolom dasar_alokasi_tempat_tidur menjadi NUMERIC(10,6)
ALTER TABLE kalkulasi_biaya_kelas_akomodasi
ALTER COLUMN dasar_alokasi_tempat_tidur TYPE NUMERIC(10,6);

-- 2. Ubah tipe data kolom dasar_alokasi_luas_kamar menjadi NUMERIC(10,6)
ALTER TABLE kalkulasi_biaya_kelas_akomodasi
ALTER COLUMN dasar_alokasi_luas_kamar TYPE NUMERIC(10,6);

-- 3. Verifikasi bahwa dasar_alokasi_hari_rawat sudah benar (seharusnya sudah NUMERIC(10,6))
-- Tidak perlu diubah karena sudah benar dari migrasi sebelumnya

-- 4. Update trigger function untuk memastikan ROUND ke 6 decimal places
CREATE OR REPLACE FUNCTION auto_calculate_dasar_alokasi_kelas_akomodasi()
RETURNS TRIGGER AS $$
DECLARE
    v_total_hari_rawat NUMERIC;
    v_total_tempat_tidur NUMERIC;
    v_total_luas_kamar NUMERIC;
    v_hari_rawat_kelas NUMERIC;
    v_tempat_tidur_kelas NUMERIC;
    v_luas_kamar_kelas NUMERIC;
BEGIN
    -- Ambil data dari data_akomodasi_inap untuk unit kerja ini
    SELECT 
        COALESCE(hari_rawat_vvip, 0) + COALESCE(hari_rawat_vip, 0) + 
        COALESCE(hari_rawat_i, 0) + COALESCE(hari_rawat_ii, 0) + COALESCE(hari_rawat_iii, 0),
        COALESCE(tempat_tidur_svip, 0) + COALESCE(tempat_tidur_vip, 0) + 
        COALESCE(tempat_tidur_i, 0) + COALESCE(tempat_tidur_ii, 0) + COALESCE(tempat_tidur_iii, 0),
        COALESCE(kamar_luas_svip, 0) + COALESCE(kamar_luas_vip, 0) + 
        COALESCE(kamar_luas_i, 0) + COALESCE(kamar_luas_ii, 0) + COALESCE(kamar_luas_iii, 0)
    INTO v_total_hari_rawat, v_total_tempat_tidur, v_total_luas_kamar
    FROM data_akomodasi_inap
    WHERE kode_unit_kerja = NEW.kode_unit_kerja
      AND tahun = NEW.tahun
      AND (NEW.tenant_id IS NULL OR tenant_id = NEW.tenant_id);

    -- Ambil nilai untuk kelas spesifik
    SELECT 
        CASE NEW.kelas
            WHEN 'VVIP' THEN COALESCE(hari_rawat_vvip, 0)
            WHEN 'VIP' THEN COALESCE(hari_rawat_vip, 0)
            WHEN 'I' THEN COALESCE(hari_rawat_i, 0)
            WHEN 'II' THEN COALESCE(hari_rawat_ii, 0)
            WHEN 'III' THEN COALESCE(hari_rawat_iii, 0)
            ELSE 0
        END,
        CASE NEW.kelas
            WHEN 'VVIP' THEN COALESCE(tempat_tidur_svip, 0)
            WHEN 'VIP' THEN COALESCE(tempat_tidur_vip, 0)
            WHEN 'I' THEN COALESCE(tempat_tidur_i, 0)
            WHEN 'II' THEN COALESCE(tempat_tidur_ii, 0)
            WHEN 'III' THEN COALESCE(tempat_tidur_iii, 0)
            ELSE 0
        END,
        CASE NEW.kelas
            WHEN 'VVIP' THEN COALESCE(kamar_luas_svip, 0)
            WHEN 'VIP' THEN COALESCE(kamar_luas_vip, 0)
            WHEN 'I' THEN COALESCE(kamar_luas_i, 0)
            WHEN 'II' THEN COALESCE(kamar_luas_ii, 0)
            WHEN 'III' THEN COALESCE(kamar_luas_iii, 0)
            ELSE 0
        END
    INTO v_hari_rawat_kelas, v_tempat_tidur_kelas, v_luas_kamar_kelas
    FROM data_akomodasi_inap
    WHERE kode_unit_kerja = NEW.kode_unit_kerja
      AND tahun = NEW.tahun
      AND (NEW.tenant_id IS NULL OR tenant_id = NEW.tenant_id);

    -- Hitung dasar_alokasi_hari_rawat (UNIT COST PER HARI)
    -- Formula: 1 / Total_Hari_Rawat (SAMA untuk semua kelas)
    -- ROUND ke 6 decimal places
    IF v_total_hari_rawat > 0 AND v_hari_rawat_kelas > 0 THEN
        NEW.dasar_alokasi_hari_rawat := ROUND((1.0 / v_total_hari_rawat)::NUMERIC, 6);
    ELSE
        NEW.dasar_alokasi_hari_rawat := 0;
    END IF;

    -- Hitung dasar_alokasi_tempat_tidur
    -- Formula: (Tempat_Tidur_Kelas / Total_Tempat_Tidur) / Hari_Rawat_Kelas
    -- ROUND ke 6 decimal places
    IF v_total_tempat_tidur > 0 AND v_hari_rawat_kelas > 0 THEN
        NEW.dasar_alokasi_tempat_tidur := ROUND(((v_tempat_tidur_kelas / v_total_tempat_tidur) / v_hari_rawat_kelas)::NUMERIC, 6);
    ELSE
        NEW.dasar_alokasi_tempat_tidur := 0;
    END IF;

    -- Hitung dasar_alokasi_luas_kamar
    -- Formula: (Luas_Kamar_Kelas / Total_Luas_Kamar) / Hari_Rawat_Kelas
    -- ROUND ke 6 decimal places
    IF v_total_luas_kamar > 0 AND v_hari_rawat_kelas > 0 THEN
        NEW.dasar_alokasi_luas_kamar := ROUND(((v_luas_kamar_kelas / v_total_luas_kamar) / v_hari_rawat_kelas)::NUMERIC, 6);
    ELSE
        NEW.dasar_alokasi_luas_kamar := 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update semua data existing untuk memastikan format 6 decimal places
UPDATE kalkulasi_biaya_kelas_akomodasi
SET 
    dasar_alokasi_hari_rawat = ROUND(dasar_alokasi_hari_rawat::NUMERIC, 6),
    dasar_alokasi_tempat_tidur = ROUND(dasar_alokasi_tempat_tidur::NUMERIC, 6),
    dasar_alokasi_luas_kamar = ROUND(dasar_alokasi_luas_kamar::NUMERIC, 6)
WHERE tahun = 2025;

-- 6. Tambahkan comment untuk dokumentasi
COMMENT ON COLUMN kalkulasi_biaya_kelas_akomodasi.dasar_alokasi_hari_rawat IS 
'Dasar alokasi hari rawat dengan format NUMERIC(10,6). Formula: 1 / Total_Hari_Rawat. Nilai SAMA untuk semua kelas dalam unit kerja yang sama (unit cost per hari approach).';

COMMENT ON COLUMN kalkulasi_biaya_kelas_akomodasi.dasar_alokasi_tempat_tidur IS 
'Dasar alokasi tempat tidur dengan format NUMERIC(10,6). Formula: (Tempat_Tidur_Kelas / Total_Tempat_Tidur) / Hari_Rawat_Kelas.';

COMMENT ON COLUMN kalkulasi_biaya_kelas_akomodasi.dasar_alokasi_luas_kamar IS 
'Dasar alokasi luas kamar dengan format NUMERIC(10,6). Formula: (Luas_Kamar_Kelas / Total_Luas_Kamar) / Hari_Rawat_Kelas.';
