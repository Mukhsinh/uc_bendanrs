-- Perbaikan Rumus Dasar Alokasi Kelas Akomodasi
-- Tanggal: 30 November 2024
-- 
-- Memperbaiki rumus perhitungan untuk kolom:
-- 1. dasar_alokasi_hari_rawat
-- 2. dasar_alokasi_tempat_tidur  
-- 3. dasar_alokasi_luas_kamar

CREATE OR REPLACE FUNCTION auto_calculate_dasar_alokasi_kelas_akomodasi()
RETURNS TRIGGER AS $$
DECLARE
    v_hari_rawat INTEGER;
    v_tempat_tidur INTEGER;
    v_luas_kamar NUMERIC;
    v_total_hari_rawat INTEGER;
    v_total_tempat_tidur INTEGER;
    v_total_luas_kamar NUMERIC;
    v_kelas_column TEXT;
BEGIN
    -- Tentukan kolom berdasarkan kelas
    CASE NEW.kelas
        WHEN 'VVIP' THEN v_kelas_column := 'vvip';
        WHEN 'VIP' THEN v_kelas_column := 'vip';
        WHEN 'I' THEN v_kelas_column := 'i';
        WHEN 'II' THEN v_kelas_column := 'ii';
        WHEN 'III' THEN v_kelas_column := 'iii';
        ELSE v_kelas_column := 'i'; -- default
    END CASE;

    -- Ambil data dari data_akomodasi_inap untuk kelas tertentu
    EXECUTE format('
        SELECT 
            COALESCE(hari_rawat_%s, 0),
            COALESCE(tempat_tidur_%s, 0),
            COALESCE(kamar_luas_%s, 0)
        FROM data_akomodasi_inap
        WHERE kode_unit_kerja = $1 
        AND tahun = $2
        AND tenant_id = $3
    ', v_kelas_column, 
       CASE v_kelas_column WHEN 'vvip' THEN 'svip' ELSE v_kelas_column END,
       CASE v_kelas_column WHEN 'vvip' THEN 'svip' ELSE v_kelas_column END)
    INTO v_hari_rawat, v_tempat_tidur, v_luas_kamar
    USING NEW.kode_unit_kerja, NEW.tahun, NEW.tenant_id;

    -- Ambil total dari semua kelas untuk unit kerja yang sama
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
    AND tenant_id = NEW.tenant_id;

    -- ========================================================================
    -- PERBAIKAN RUMUS 1: dasar_alokasi_hari_rawat
    -- ========================================================================
    -- Rumus: (hari_rawat_kelas / total_hari_rawat_semua_kelas) / hari_rawat_kelas
    -- Simplifikasi: = 1 / total_hari_rawat_semua_kelas
    IF v_total_hari_rawat > 0 THEN
        NEW.dasar_alokasi_hari_rawat := 1.0 / v_total_hari_rawat::NUMERIC;
    ELSE
        NEW.dasar_alokasi_hari_rawat := 0;
    END IF;

    -- ========================================================================
    -- PERBAIKAN RUMUS 2: dasar_alokasi_tempat_tidur
    -- ========================================================================
    -- Rumus: (tempat_tidur_kelas / total_tempat_tidur_semua_kelas) / hari_rawat_kelas
    IF v_hari_rawat > 0 AND v_total_tempat_tidur > 0 THEN
        NEW.dasar_alokasi_tempat_tidur := (v_tempat_tidur::NUMERIC / v_total_tempat_tidur::NUMERIC) / v_hari_rawat::NUMERIC;
    ELSE
        NEW.dasar_alokasi_tempat_tidur := 0;
    END IF;

    -- ========================================================================
    -- PERBAIKAN RUMUS 3: dasar_alokasi_luas_kamar
    -- ========================================================================
    -- Rumus: (luas_kamar_kelas / total_luas_kamar_semua_kelas) / hari_rawat_kelas
    IF v_hari_rawat > 0 AND v_total_luas_kamar > 0 THEN
        NEW.dasar_alokasi_luas_kamar := (v_luas_kamar::NUMERIC / v_total_luas_kamar::NUMERIC) / v_hari_rawat::NUMERIC;
    ELSE
        NEW.dasar_alokasi_luas_kamar := 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Komentar untuk dokumentasi
COMMENT ON FUNCTION auto_calculate_dasar_alokasi_kelas_akomodasi() IS 
'Trigger function untuk menghitung dasar alokasi kelas akomodasi dengan rumus:
1. dasar_alokasi_hari_rawat = 1 / total_hari_rawat_semua_kelas
2. dasar_alokasi_tempat_tidur = (tempat_tidur_kelas / total_tempat_tidur) / hari_rawat_kelas
3. dasar_alokasi_luas_kamar = (luas_kamar_kelas / total_luas_kamar) / hari_rawat_kelas';
