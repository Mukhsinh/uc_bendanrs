-- ============================================
-- Migration: Fix Kalkulasi Biaya Kelas Akomodasi - FINAL VERSION
-- Date: 2024-12-10
-- 
-- PERBAIKAN KRITIS:
-- Migration ini mengapply function yang MENJAMIN nilai dasar_alokasi_*
-- yang tersimpan di kolom SAMA PERSIS dengan nilai yang digunakan
-- untuk menghitung biaya.
--
-- Cara kerja function baru:
-- 1. Hitung dasar alokasi SEKALI dalam CTE (dasar_alokasi_calculated)
-- 2. Simpan nilai tersebut ke kolom dasar_alokasi_*
-- 3. Gunakan NILAI YANG SAMA untuk menghitung SEMUA biaya
-- 
-- GARANTISASI KONSISTENSI 100%!
-- ============================================

-- Pertama, pastikan kolom dasar_alokasi_tempat_tidur dan dasar_alokasi_luas_kamar ada di tabel
DO $$ 
BEGIN
    -- Check dan tambahkan dasar_alokasi_tempat_tidur jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kalkulasi_biaya_kelas_akomodasi' 
        AND column_name = 'dasar_alokasi_tempat_tidur'
    ) THEN
        ALTER TABLE public.kalkulasi_biaya_kelas_akomodasi 
        ADD COLUMN dasar_alokasi_tempat_tidur NUMERIC(10, 6) DEFAULT 0;
        
        RAISE NOTICE 'Kolom dasar_alokasi_tempat_tidur berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom dasar_alokasi_tempat_tidur sudah ada';
    END IF;

    -- Check dan tambahkan dasar_alokasi_luas_kamar jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kalkulasi_biaya_kelas_akomodasi' 
        AND column_name = 'dasar_alokasi_luas_kamar'
    ) THEN
        ALTER TABLE public.kalkulasi_biaya_kelas_akomodasi 
        ADD COLUMN dasar_alokasi_luas_kamar NUMERIC(10, 6) DEFAULT 0;
        
        RAISE NOTICE 'Kolom dasar_alokasi_luas_kamar berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom dasar_alokasi_luas_kamar sudah ada';
    END IF;
END $$;

-- Update function dengan versi FINAL yang guarantee konsistensi
\i database/fix_populate_kalkulasi_biaya_kelas_akomodasi_FINAL.sql

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration FINAL completed successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PERBAIKAN KRITIS:';
    RAISE NOTICE '- Function sekarang menghitung dasar alokasi SEKALI';
    RAISE NOTICE '- Nilai yang tersimpan di kolom = nilai untuk hitung biaya';
    RAISE NOTICE '- GARANTISASI konsistensi 100%%';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DISTRIBUSI AKHIR:';
    RAISE NOTICE '- Kategori A (hari_rawat): 17 kolom';
    RAISE NOTICE '- Kategori B (tempat_tidur): 5 kolom';
    RAISE NOTICE '- Kategori C (luas_kamar): 2 kolom';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Re-run function untuk semua data';
    RAISE NOTICE '2. Verify: SELECT * FROM kalkulasi_biaya_kelas_akomodasi WHERE kode_unit_kerja = ''UK046''';
    RAISE NOTICE '3. Check: dasar_alokasi_* should be 0.035481, 0.090909, 0.666667 for VVIP';
    RAISE NOTICE '========================================';
END $$;






