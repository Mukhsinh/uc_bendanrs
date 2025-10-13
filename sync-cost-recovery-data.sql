-- Script untuk memastikan sinkronisasi data Cost Recovery
-- Pastikan data pendapatan ada untuk unit kerja yang ada di distribusi_biaya_rekap

-- 1. Cek struktur tabel data_pendapatan
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'data_pendapatan' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Cek unit kerja yang ada di distribusi_biaya_rekap (baris Total Biaya)
SELECT DISTINCT
  'UK037' as kode_unit_kerja, 'Ambulance' as nama_unit_kerja
UNION ALL SELECT 'UK038', 'Laboratorium PK/PA'
UNION ALL SELECT 'UK039', 'Radiologi'
UNION ALL SELECT 'UK040', 'Farmasi'
UNION ALL SELECT 'UK041', 'Rehab Medik'
UNION ALL SELECT 'UK042', 'Gizi Dapur'
UNION ALL SELECT 'UK043', 'Laundry/CSSD'
UNION ALL SELECT 'UK044', 'BDRS'
UNION ALL SELECT 'UK045', 'Cathlab'
UNION ALL SELECT 'UK046', 'Terang Bulan VIP/VVIP'
UNION ALL SELECT 'UK047', 'Truntum'
UNION ALL SELECT 'UK048', 'Sekarjagat'
UNION ALL SELECT 'UK049', 'Jlamprang'
UNION ALL SELECT 'UK050', 'Nifas'
UNION ALL SELECT 'UK051', 'Perinatologi'
UNION ALL SELECT 'UK052', 'Buketan'
UNION ALL SELECT 'UK053', 'ICU/PICU/NICU'
UNION ALL SELECT 'UK054', 'VK'
UNION ALL SELECT 'UK055', 'IGD Ponek'
UNION ALL SELECT 'UK056', 'Klinik Kebid. & Kandungan'
UNION ALL SELECT 'UK057', 'Klinik Bedah Mulut'
UNION ALL SELECT 'UK058', 'Klinik Syaraf'
UNION ALL SELECT 'UK059', 'Klinik Bedah Syaraf'
UNION ALL SELECT 'UK060', 'Klinik Bedah Digestif'
UNION ALL SELECT 'UK061', 'Klinik Bedah Umum'
UNION ALL SELECT 'UK062', 'Klinik Anak'
UNION ALL SELECT 'UK063', 'Klinik Penyakit Dalam'
UNION ALL SELECT 'UK064', 'Klinik Mata'
UNION ALL SELECT 'UK065', 'Klinik Kulit & Kelamin'
UNION ALL SELECT 'UK066', 'Klinik THT'
UNION ALL SELECT 'UK067', 'Klinik Gigi'
UNION ALL SELECT 'UK068', 'Klinik Jantung'
UNION ALL SELECT 'UK069', 'Klinik DOT/VCT/CST'
UNION ALL SELECT 'UK070', 'Klinik Paru'
UNION ALL SELECT 'UK071', 'Klinik Orthopedi'
UNION ALL SELECT 'UK072', 'Klinik Jiwa'
UNION ALL SELECT 'UK073', 'Klinik Parikesit'
UNION ALL SELECT 'UK074', 'IBS'
UNION ALL SELECT 'UK075', 'Pemulasaran Jenazah'
UNION ALL SELECT 'UK076', 'Hemodialisis'
UNION ALL SELECT 'UK077', 'Unit Diklat';

-- 3. Cek data pendapatan yang ada untuk tahun 2025
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  pendapatan_umum,
  pendapatan_bpjs,
  (pendapatan_umum + pendapatan_bpjs) as total_pendapatan
FROM data_pendapatan 
WHERE tahun = 2025
  AND kode_unit_kerja IN (
    'UK037', 'UK038', 'UK039', 'UK040', 'UK041', 'UK042', 'UK043', 'UK044', 'UK045',
    'UK046', 'UK047', 'UK048', 'UK049', 'UK050', 'UK051', 'UK052', 'UK053', 'UK054',
    'UK055', 'UK056', 'UK057', 'UK058', 'UK059', 'UK060', 'UK061', 'UK062', 'UK063',
    'UK064', 'UK065', 'UK066', 'UK067', 'UK068', 'UK069', 'UK070', 'UK071', 'UK072',
    'UK073', 'UK074', 'UK075', 'UK076', 'UK077'
  )
ORDER BY kode_unit_kerja;

-- 4. Cek unit kerja yang belum ada data pendapatan
SELECT 
  uk.kode as kode_unit_kerja,
  uk.nama as nama_unit_kerja
FROM unit_kerja uk
WHERE uk.kategori = 'Pusat Pendapatan'
  AND uk.kode IN (
    'UK037', 'UK038', 'UK039', 'UK040', 'UK041', 'UK042', 'UK043', 'UK044', 'UK045',
    'UK046', 'UK047', 'UK048', 'UK049', 'UK050', 'UK051', 'UK052', 'UK053', 'UK054',
    'UK055', 'UK056', 'UK057', 'UK058', 'UK059', 'UK060', 'UK061', 'UK062', 'UK063',
    'UK064', 'UK065', 'UK066', 'UK067', 'UK068', 'UK069', 'UK070', 'UK071', 'UK072',
    'UK073', 'UK074', 'UK075', 'UK076', 'UK077'
  )
  AND NOT EXISTS (
    SELECT 1 FROM data_pendapatan dp 
    WHERE dp.kode_unit_kerja = uk.kode 
      AND dp.tahun = 2025
  )
ORDER BY uk.kode;

-- 5. Cek data distribusi_biaya_rekap untuk tahun 2025
SELECT 
  biaya,
  tahun,
  uk037_ambulance,
  uk038_laboratorium_pk_pa,
  uk039_radiologi,
  uk040_farmasi
FROM distribusi_biaya_rekap 
WHERE tahun = 2025 
  AND biaya = 'Total Biaya';

-- 6. Script untuk insert data pendapatan kosong jika belum ada
-- HATI-HATI: Jalankan hanya jika diperlukan dan sudah dikonfirmasi
/*
INSERT INTO data_pendapatan (unit_kerja_id, kode_unit_kerja, nama_unit_kerja, pendapatan_umum, pendapatan_bpjs, tahun)
SELECT 
  uk.id as unit_kerja_id,
  uk.kode as kode_unit_kerja,
  uk.nama as nama_unit_kerja,
  0 as pendapatan_umum,
  0 as pendapatan_bpjs,
  2025 as tahun
FROM unit_kerja uk
WHERE uk.kategori = 'Pusat Pendapatan'
  AND uk.kode IN (
    'UK037', 'UK038', 'UK039', 'UK040', 'UK041', 'UK042', 'UK043', 'UK044', 'UK045',
    'UK046', 'UK047', 'UK048', 'UK049', 'UK050', 'UK051', 'UK052', 'UK053', 'UK054',
    'UK055', 'UK056', 'UK057', 'UK058', 'UK059', 'UK060', 'UK061', 'UK062', 'UK063',
    'UK064', 'UK065', 'UK066', 'UK067', 'UK068', 'UK069', 'UK070', 'UK071', 'UK072',
    'UK073', 'UK074', 'UK075', 'UK076', 'UK077'
  )
  AND NOT EXISTS (
    SELECT 1 FROM data_pendapatan dp 
    WHERE dp.kode_unit_kerja = uk.kode 
      AND dp.tahun = 2025
  );
*/
