-- ============================================
-- Testing Script: Kalkulasi Biaya Kelas Akomodasi
-- Validasi implementasi 3 jenis dasar alokasi
-- ============================================

-- 1. Verifikasi struktur tabel (kolom baru sudah ada)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'kalkulasi_biaya_kelas_akomodasi'
    AND column_name IN (
        'dasar_alokasi_hari_rawat',
        'dasar_alokasi_tempat_tidur',
        'dasar_alokasi_luas_kamar'
    )
ORDER BY column_name;

-- Expected Output:
-- dasar_alokasi_hari_rawat     | numeric | YES | ...
-- dasar_alokasi_tempat_tidur   | numeric | YES | 0
-- dasar_alokasi_luas_kamar     | numeric | YES | 0

-- ============================================
-- 2. Sample Data Check: Verifikasi dasar alokasi per kelas
-- ============================================
SELECT 
    kode_unit_kerja,
    nama_unit_kerja,
    kelas,
    dasar_alokasi_hari_rawat,
    dasar_alokasi_tempat_tidur,
    dasar_alokasi_luas_kamar,
    -- Verifikasi total dasar alokasi per unit kerja = 1.0
    SUM(dasar_alokasi_hari_rawat) OVER (PARTITION BY kode_unit_kerja, tahun) as total_da_hari_rawat,
    SUM(dasar_alokasi_tempat_tidur) OVER (PARTITION BY kode_unit_kerja, tahun) as total_da_tempat_tidur,
    SUM(dasar_alokasi_luas_kamar) OVER (PARTITION BY kode_unit_kerja, tahun) as total_da_luas_kamar
FROM kalkulasi_biaya_kelas_akomodasi
WHERE tahun = 2024  -- Ganti dengan tahun yang sesuai
ORDER BY kode_unit_kerja, 
    CASE kelas 
        WHEN 'VVIP' THEN 1 
        WHEN 'VIP' THEN 2 
        WHEN 'I' THEN 3 
        WHEN 'II' THEN 4 
        WHEN 'III' THEN 5 
    END
LIMIT 20;

-- Expected: 
-- - Total untuk setiap dasar alokasi per unit kerja harus = 1.0 (atau mendekati karena pembulatan)
-- - Setiap kelas memiliki nilai dasar alokasi yang proporsional

-- ============================================
-- 3. Validation: Biaya Kategori Hari Rawat
-- ============================================
-- Verifikasi biaya yang menggunakan dasar_alokasi_hari_rawat
WITH biaya_check AS (
    SELECT 
        kbka.kode_unit_kerja,
        kbka.kelas,
        kbka.dasar_alokasi_hari_rawat,
        -- Biaya dari kalkulasi_biaya_akomodasi
        kba.biaya_gaji_tunjangan as biaya_gaji_tunjangan_source,
        kba.biaya_jasa_pelayanan as biaya_jasa_pelayanan_source,
        -- Biaya di kelas akomodasi (hasil kalkulasi)
        kbka.biaya_gaji_tunjangan as biaya_gaji_tunjangan_result,
        kbka.biaya_jasa_pelayanan as biaya_jasa_pelayanan_result,
        -- Verifikasi rumus
        ROUND(kba.biaya_gaji_tunjangan * kbka.dasar_alokasi_hari_rawat) as expected_gaji_tunjangan,
        ROUND(kba.biaya_jasa_pelayanan * kbka.dasar_alokasi_hari_rawat) as expected_jasa_pelayanan
    FROM kalkulasi_biaya_kelas_akomodasi kbka
    LEFT JOIN kalkulasi_biaya_akomodasi kba 
        ON kba.kode_unit_kerja = kbka.kode_unit_kerja 
        AND kba.tahun = kbka.tahun
    WHERE kbka.tahun = 2024  -- Ganti dengan tahun yang sesuai
)
SELECT 
    kode_unit_kerja,
    kelas,
    dasar_alokasi_hari_rawat,
    -- Gaji Tunjangan
    biaya_gaji_tunjangan_source,
    biaya_gaji_tunjangan_result,
    expected_gaji_tunjangan,
    CASE 
        WHEN biaya_gaji_tunjangan_result = expected_gaji_tunjangan THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as gaji_status,
    -- Jasa Pelayanan
    biaya_jasa_pelayanan_source,
    biaya_jasa_pelayanan_result,
    expected_jasa_pelayanan,
    CASE 
        WHEN biaya_jasa_pelayanan_result = expected_jasa_pelayanan THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as jasa_status
FROM biaya_check
LIMIT 10;

-- Expected: Semua status = '✓ OK'

-- ============================================
-- 4. Validation: Biaya Kategori Tempat Tidur
-- ============================================
-- Verifikasi biaya yang menggunakan dasar_alokasi_tempat_tidur
WITH biaya_check AS (
    SELECT 
        kbka.kode_unit_kerja,
        kbka.kelas,
        kbka.dasar_alokasi_tempat_tidur,
        -- Biaya dari kalkulasi_biaya_akomodasi
        kba.biaya_listrik as biaya_listrik_source,
        kba.biaya_air as biaya_air_source,
        kba.biaya_telp as biaya_telp_source,
        -- Biaya di kelas akomodasi (hasil kalkulasi)
        kbka.biaya_listrik as biaya_listrik_result,
        kbka.biaya_air as biaya_air_result,
        kbka.biaya_telp as biaya_telp_result,
        -- Verifikasi rumus
        ROUND(kba.biaya_listrik * kbka.dasar_alokasi_tempat_tidur) as expected_listrik,
        ROUND(kba.biaya_air * kbka.dasar_alokasi_tempat_tidur) as expected_air,
        ROUND(kba.biaya_telp * kbka.dasar_alokasi_tempat_tidur) as expected_telp
    FROM kalkulasi_biaya_kelas_akomodasi kbka
    LEFT JOIN kalkulasi_biaya_akomodasi kba 
        ON kba.kode_unit_kerja = kbka.kode_unit_kerja 
        AND kba.tahun = kbka.tahun
    WHERE kbka.tahun = 2024  -- Ganti dengan tahun yang sesuai
)
SELECT 
    kode_unit_kerja,
    kelas,
    dasar_alokasi_tempat_tidur,
    -- Listrik
    biaya_listrik_source,
    biaya_listrik_result,
    expected_listrik,
    CASE 
        WHEN biaya_listrik_result = expected_listrik THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as listrik_status,
    -- Air
    biaya_air_source,
    biaya_air_result,
    expected_air,
    CASE 
        WHEN biaya_air_result = expected_air THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as air_status,
    -- Telp
    biaya_telp_source,
    biaya_telp_result,
    expected_telp,
    CASE 
        WHEN biaya_telp_result = expected_telp THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as telp_status
FROM biaya_check
LIMIT 10;

-- Expected: Semua status = '✓ OK'

-- ============================================
-- 5. Validation: Biaya Kategori Luas Kamar
-- ============================================
-- Verifikasi biaya yang menggunakan dasar_alokasi_luas_kamar
WITH biaya_check AS (
    SELECT 
        kbka.kode_unit_kerja,
        kbka.kelas,
        kbka.dasar_alokasi_luas_kamar,
        -- Biaya dari kalkulasi_biaya_akomodasi
        kba.biaya_pemeliharaan_bangunan as biaya_pemeliharaan_bangunan_source,
        kba.biaya_penyusutan_gedung as biaya_penyusutan_gedung_source,
        kba.biaya_tidak_langsung_terdistribusi as biaya_tidak_langsung_source,
        -- Biaya di kelas akomodasi (hasil kalkulasi)
        kbka.biaya_pemeliharaan_bangunan as biaya_pemeliharaan_bangunan_result,
        kbka.biaya_penyusutan_gedung as biaya_penyusutan_gedung_result,
        kbka.biaya_tidak_langsung_terdistribusi as biaya_tidak_langsung_result,
        -- Verifikasi rumus
        ROUND(kba.biaya_pemeliharaan_bangunan * kbka.dasar_alokasi_luas_kamar) as expected_pemeliharaan_bangunan,
        ROUND(kba.biaya_penyusutan_gedung * kbka.dasar_alokasi_luas_kamar) as expected_penyusutan_gedung,
        ROUND(kba.biaya_tidak_langsung_terdistribusi * kbka.dasar_alokasi_luas_kamar) as expected_tidak_langsung
    FROM kalkulasi_biaya_kelas_akomodasi kbka
    LEFT JOIN kalkulasi_biaya_akomodasi kba 
        ON kba.kode_unit_kerja = kbka.kode_unit_kerja 
        AND kba.tahun = kbka.tahun
    WHERE kbka.tahun = 2024  -- Ganti dengan tahun yang sesuai
)
SELECT 
    kode_unit_kerja,
    kelas,
    dasar_alokasi_luas_kamar,
    -- Pemeliharaan Bangunan
    biaya_pemeliharaan_bangunan_source,
    biaya_pemeliharaan_bangunan_result,
    expected_pemeliharaan_bangunan,
    CASE 
        WHEN biaya_pemeliharaan_bangunan_result = expected_pemeliharaan_bangunan THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as pemeliharaan_status,
    -- Penyusutan Gedung
    biaya_penyusutan_gedung_source,
    biaya_penyusutan_gedung_result,
    expected_penyusutan_gedung,
    CASE 
        WHEN biaya_penyusutan_gedung_result = expected_penyusutan_gedung THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as penyusutan_status,
    -- Tidak Langsung
    biaya_tidak_langsung_source,
    biaya_tidak_langsung_result,
    expected_tidak_langsung,
    CASE 
        WHEN biaya_tidak_langsung_result = expected_tidak_langsung THEN '✓ OK'
        ELSE '✗ MISMATCH'
    END as tidak_langsung_status
FROM biaya_check
LIMIT 10;

-- Expected: Semua status = '✓ OK'

-- ============================================
-- 6. Summary Report: Distribusi Biaya per Kategori
-- ============================================
SELECT 
    'KATEGORI A: Dasar Alokasi Hari Rawat' as kategori,
    COUNT(*) as jumlah_record,
    SUM(biaya_gaji_tunjangan + biaya_jasa_pelayanan + biaya_obat + biaya_bhp + 
        biaya_makan_karyawan + biaya_makan_pasien + biaya_rumah_tangga + 
        biaya_cetak + biaya_atk + biaya_operasional_lainnya + 
        biaya_pendidikan_pelatihan + biaya_laundry + biaya_sterilisasi) as total_biaya
FROM kalkulasi_biaya_kelas_akomodasi
WHERE tahun = 2024

UNION ALL

SELECT 
    'KATEGORI B: Dasar Alokasi Tempat Tidur' as kategori,
    COUNT(*) as jumlah_record,
    SUM(biaya_listrik + biaya_air + biaya_telp + 
        biaya_pemeliharaan_alat_medis + biaya_pemeliharaan_alat_non_medis + 
        biaya_penyusutan_alat_medis + biaya_penyusutan_alat_non_medis) as total_biaya
FROM kalkulasi_biaya_kelas_akomodasi
WHERE tahun = 2024

UNION ALL

SELECT 
    'KATEGORI C: Dasar Alokasi Luas Kamar' as kategori,
    COUNT(*) as jumlah_record,
    SUM(biaya_pemeliharaan_bangunan + biaya_penyusutan_gedung + 
        biaya_penyusutan_jaringan + biaya_tidak_langsung_terdistribusi) as total_biaya
FROM kalkulasi_biaya_kelas_akomodasi
WHERE tahun = 2024;

-- ============================================
-- 7. Data Integrity Check
-- ============================================
-- Pastikan tidak ada NULL pada kolom dasar alokasi
SELECT 
    'NULL Check' as test_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN dasar_alokasi_hari_rawat IS NULL THEN 1 END) as null_hari_rawat,
    COUNT(CASE WHEN dasar_alokasi_tempat_tidur IS NULL THEN 1 END) as null_tempat_tidur,
    COUNT(CASE WHEN dasar_alokasi_luas_kamar IS NULL THEN 1 END) as null_luas_kamar
FROM kalkulasi_biaya_kelas_akomodasi
WHERE tahun = 2024;

-- Expected: All null counts = 0

-- ============================================
-- 8. Function Comment Check
-- ============================================
SELECT 
    routine_name,
    routine_type,
    pg_catalog.obj_description(p.oid, 'pg_proc') as function_comment
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
    AND routine_name = 'populate_kalkulasi_biaya_kelas_akomodasi';

-- Expected: Comment should mention 3 types of allocation bases

-- ============================================
-- NOTES:
-- 1. Ganti tahun = 2024 dengan tahun yang sesuai dengan data Anda
-- 2. Jalankan script ini setelah menjalankan migration
-- 3. Semua test harus menunjukkan hasil '✓ OK'
-- 4. Jika ada mismatch, periksa data source di kalkulasi_biaya_akomodasi
-- ============================================




