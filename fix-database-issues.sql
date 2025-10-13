-- Script untuk Memperbaiki Masalah Database
-- Jalankan script ini di Supabase SQL Editor jika ada masalah

-- 1. Cek apakah tabel distribusi biaya ada
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%distribusi%'
ORDER BY table_name;

-- 2. Jika tabel tidak ada, buat ulang
-- Buat tabel distribusi_biaya_tahap_1
CREATE TABLE IF NOT EXISTS distribusi_biaya_tahap_1 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tahun INTEGER NOT NULL,
  unit_kerja_id UUID NOT NULL,
  kode_unit_kerja VARCHAR(50),
  nama_unit_kerja VARCHAR(255),
  jenis_departemen VARCHAR(50) CHECK (jenis_departemen IN ('Produksi', 'Penunjang')),
  biaya_langsung DECIMAL(15,2) NOT NULL DEFAULT 0,
  dasar_alokasi VARCHAR(100),
  nilai_dasar_alokasi DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_biaya_tidak_langsung DECIMAL(15,2) NOT NULL DEFAULT 0,
  tarif_alokasi DECIMAL(15,2) NOT NULL DEFAULT 0,
  alokasi_biaya_tidak_langsung DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_biaya_tahap_1 DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel distribusi_biaya_tahap_2
CREATE TABLE IF NOT EXISTS distribusi_biaya_tahap_2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tahun INTEGER NOT NULL,
  unit_kerja_id UUID NOT NULL,
  kode_unit_kerja VARCHAR(50),
  nama_unit_kerja VARCHAR(255),
  jenis_departemen VARCHAR(50) CHECK (jenis_departemen IN ('Produksi', 'Penunjang')),
  total_biaya_tahap_1 DECIMAL(15,2) NOT NULL DEFAULT 0,
  alokasi_dari_ipsrs DECIMAL(15,2) NOT NULL DEFAULT 0,
  alokasi_dari_laundry DECIMAL(15,2) NOT NULL DEFAULT 0,
  alokasi_dari_gizi DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_biaya_final DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel konfigurasi_distribusi_biaya
CREATE TABLE IF NOT EXISTS konfigurasi_distribusi_biaya (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tahun INTEGER NOT NULL,
  total_biaya_tidak_langsung DECIMAL(15,2) NOT NULL DEFAULT 200000000,
  jenis_biaya VARCHAR(50) DEFAULT 'total_biaya' CHECK (jenis_biaya IN ('total_biaya', 'total_biaya_tanpa_jp')),
  urutan_alokasi JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel mapping_dasar_alokasi
CREATE TABLE IF NOT EXISTS mapping_dasar_alokasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_kerja_id UUID NOT NULL,
  kode_unit_kerja VARCHAR(50),
  nama_unit_kerja VARCHAR(255),
  dasar_alokasi VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel log_distribusi_biaya
CREATE TABLE IF NOT EXISTS log_distribusi_biaya (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tahun INTEGER NOT NULL,
  tahap VARCHAR(50) NOT NULL CHECK (tahap IN ('tahap_1', 'tahap_2', 'complete')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cek apakah field yang diperlukan ada di Data_Kegiatan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Data_Kegiatan' 
  AND column_name IN ('Kunjungan_jml_pasien_Total', 'Komputer_SIMRS_jml_User');

-- 4. Tambahkan field jika belum ada
DO $$
BEGIN
    -- Tambahkan field Kunjungan_jml_pasien_Total jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Data_Kegiatan' 
        AND column_name = 'Kunjungan_jml_pasien_Total'
    ) THEN
        ALTER TABLE "Data_Kegiatan" ADD COLUMN "Kunjungan_jml_pasien_Total" INTEGER DEFAULT 0;
    END IF;
    
    -- Tambahkan field Komputer_SIMRS_jml_User jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Data_Kegiatan' 
        AND column_name = 'Komputer_SIMRS_jml_User'
    ) THEN
        ALTER TABLE "Data_Kegiatan" ADD COLUMN "Komputer_SIMRS_jml_User" INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. Cek apakah field yang diperlukan ada di data_biaya
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'data_biaya' 
  AND column_name IN ('total_biaya', 'total_biaya_tanpa_jp');

-- 6. Tambahkan field jika belum ada
DO $$
BEGIN
    -- Tambahkan field total_biaya_tanpa_jp jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_biaya' 
        AND column_name = 'total_biaya_tanpa_jp'
    ) THEN
        ALTER TABLE data_biaya ADD COLUMN total_biaya_tanpa_jp DECIMAL(15,2) DEFAULT 0;
    END IF;
END $$;

-- 7. Insert mapping dasar alokasi jika belum ada
INSERT INTO mapping_dasar_alokasi (unit_kerja_id, kode_unit_kerja, nama_unit_kerja, dasar_alokasi)
SELECT 
  uk.id,
  uk.kode,
  uk.nama,
  CASE 
    -- Jumlah_SDM
    WHEN LOWER(uk.nama) LIKE '%direktur%' OR 
         LOWER(uk.nama) LIKE '%komite ppi%' OR 
         LOWER(uk.nama) LIKE '%komite pmpk%' OR 
         LOWER(uk.nama) LIKE '%akreditasi%' OR 
         LOWER(uk.nama) LIKE '%dewan pengawas%' OR 
         LOWER(uk.nama) LIKE '%bag tata usaha%' OR 
         LOWER(uk.nama) LIKE '%subag keuangan%' OR 
         LOWER(uk.nama) LIKE '%unit perbendaharaan%' OR 
         LOWER(uk.nama) LIKE '%unit pendapatan%' OR 
         LOWER(uk.nama) LIKE '%unit akuntansi dan verifikasi%' OR 
         LOWER(uk.nama) LIKE '%subag umpeg%' OR 
         LOWER(uk.nama) LIKE '%staf umum dan kerjasama%' OR 
         LOWER(uk.nama) LIKE '%rumah tangga%' OR 
         LOWER(uk.nama) LIKE '%subag renval%' OR 
         LOWER(uk.nama) LIKE '%staf renval%' OR 
         LOWER(uk.nama) LIKE '%rekam medik%'
    THEN 'Jumlah_SDM'
    
    -- Total_Kunjungan_Pasien
    WHEN LOWER(uk.nama) LIKE '%komite medik%' OR 
         LOWER(uk.nama) LIKE '%bid pengembangan%' OR 
         LOWER(uk.nama) LIKE '%seksi penunjang%' OR 
         LOWER(uk.nama) LIKE '%bid keperawatan%' OR 
         LOWER(uk.nama) LIKE '%seksi asuhan perawatan%' OR 
         LOWER(uk.nama) LIKE '%seksi pengembangan%' OR 
         LOWER(uk.nama) LIKE '%bid pelayanan medis%' OR 
         LOWER(uk.nama) LIKE '%seksi pelayanan%' OR 
         LOWER(uk.nama) LIKE '%tpprj%' OR 
         LOWER(uk.nama) LIKE '%tppri%' OR 
         LOWER(uk.nama) LIKE '%unit akuntansi manajemen%' OR 
         LOWER(uk.nama) LIKE '%analis biaya dan tarif%' OR 
         LOWER(uk.nama) LIKE '%unit aset%' OR 
         LOWER(uk.nama) LIKE '%instalasi humas%'
    THEN 'Total_Kunjungan_Pasien'
    
    -- Luas_ruangan
    WHEN LOWER(uk.nama) LIKE '%ipsrs%' OR 
         LOWER(uk.nama) LIKE '%cleaning service%' OR 
         LOWER(uk.nama) LIKE '%security%'
    THEN 'Luas_ruangan'
    
    -- Unit IT now uses Jumlah_SDM as basis
    WHEN LOWER(uk.nama) LIKE '%unit it%'
    THEN 'Jumlah_SDM'
    
    -- Default untuk unit kerja lainnya
    ELSE 'Jumlah_SDM'
  END as dasar_alokasi
FROM unit_kerja uk
WHERE NOT EXISTS (
  SELECT 1 FROM mapping_dasar_alokasi mda 
  WHERE mda.unit_kerja_id = uk.id
);

-- 8. Insert sample data untuk Data_Kegiatan jika belum ada
INSERT INTO "Data_Kegiatan" (
    "Kode_UK", "Nama_Unit_Kerja", tahun, unit_kerja_id,
    "Listrik_kwh", "Air_m3", "Makanan_Karyawan_jml_Porsi", 
    "Makanan_Pasien_jml_Porsi", "Cucian_kg_Cucian",
    "SDM_Dr", "SDM_Prwt", "SDM_Non", "Kunjungan_jml_pasien_Total", "Komputer_SIMRS_jml_User"
)
SELECT 
    uk.kode,
    uk.nama,
    2025,
    uk.id,
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 5000
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 2000
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 3000
        WHEN LOWER(uk.nama) LIKE '%gizi%' THEN 1000
        WHEN LOWER(uk.nama) LIKE '%laundry%' THEN 800
        WHEN LOWER(uk.nama) LIKE '%ipsrs%' THEN 500
        ELSE 500
    END as "Listrik_kwh",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 2000
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 800
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 500
        WHEN LOWER(uk.nama) LIKE '%gizi%' THEN 300
        WHEN LOWER(uk.nama) LIKE '%laundry%' THEN 200
        WHEN LOWER(uk.nama) LIKE '%ipsrs%' THEN 100
        ELSE 100
    END as "Air_m3",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 5000
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 750
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 250
        ELSE 0
    END as "Makanan_Karyawan_jml_Porsi",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 5000
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 750
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 250
        ELSE 0
    END as "Makanan_Pasien_jml_Porsi",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 5000
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 1000
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 300
        WHEN LOWER(uk.nama) LIKE '%gizi%' THEN 100
        ELSE 0
    END as "Cucian_kg_Cucian",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 20
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 15
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 10
        WHEN LOWER(uk.nama) LIKE '%gizi%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%laundry%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%ipsrs%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%direktur%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%komite%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%akreditasi%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%dewan pengawas%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%bag tata usaha%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%subag keuangan%' THEN 8
        WHEN LOWER(uk.nama) LIKE '%unit perbendaharaan%' THEN 4
        WHEN LOWER(uk.nama) LIKE '%unit pendapatan%' THEN 6
        WHEN LOWER(uk.nama) LIKE '%unit akuntansi%' THEN 7
        WHEN LOWER(uk.nama) LIKE '%subag umpeg%' THEN 4
        WHEN LOWER(uk.nama) LIKE '%staf umum%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%rumah tangga%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%subag renval%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%staf renval%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%rekam medik%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%unit it%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%cleaning service%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%security%' THEN 1
        ELSE 1
    END as "SDM_Dr",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 25
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 10
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 8
        WHEN LOWER(uk.nama) LIKE '%gizi%' THEN 8
        WHEN LOWER(uk.nama) LIKE '%laundry%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%ipsrs%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%direktur%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%komite%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%akreditasi%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%dewan pengawas%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%bag tata usaha%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%subag keuangan%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%unit perbendaharaan%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%unit pendapatan%' THEN 4
        WHEN LOWER(uk.nama) LIKE '%unit akuntansi%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%subag umpeg%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%staf umum%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%rumah tangga%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%subag renval%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%staf renval%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%rekam medik%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%unit it%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%cleaning service%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%security%' THEN 0
        ELSE 1
    END as "SDM_Prwt",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 5
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%gizi%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%laundry%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%ipsrs%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%direktur%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%komite%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%akreditasi%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%dewan pengawas%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%bag tata usaha%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%subag keuangan%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%unit perbendaharaan%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%unit pendapatan%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%unit akuntansi%' THEN 3
        WHEN LOWER(uk.nama) LIKE '%subag umpeg%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%staf umum%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%rumah tangga%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%subag renval%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%staf renval%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%rekam medik%' THEN 2
        WHEN LOWER(uk.nama) LIKE '%unit it%' THEN 1
        WHEN LOWER(uk.nama) LIKE '%cleaning service%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%security%' THEN 0
        ELSE 1
    END as "SDM_Non",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%rawat%' THEN 15000
        WHEN LOWER(uk.nama) LIKE '%ugd%' THEN 8000
        WHEN LOWER(uk.nama) LIKE '%lab%' THEN 5000
        WHEN LOWER(uk.nama) LIKE '%gizi%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%laundry%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%ipsrs%' THEN 0
        WHEN LOWER(uk.nama) LIKE '%komite medik%' THEN 2000
        WHEN LOWER(uk.nama) LIKE '%bid pengembangan%' THEN 1000
        WHEN LOWER(uk.nama) LIKE '%seksi penunjang%' THEN 500
        WHEN LOWER(uk.nama) LIKE '%bid keperawatan%' THEN 3000
        WHEN LOWER(uk.nama) LIKE '%seksi asuhan perawatan%' THEN 2000
        WHEN LOWER(uk.nama) LIKE '%seksi pengembangan%' THEN 1000
        WHEN LOWER(uk.nama) LIKE '%bid pelayanan medis%' THEN 4000
        WHEN LOWER(uk.nama) LIKE '%seksi pelayanan%' THEN 2000
        WHEN LOWER(uk.nama) LIKE '%tpprj%' THEN 6000
        WHEN LOWER(uk.nama) LIKE '%tppri%' THEN 8000
        WHEN LOWER(uk.nama) LIKE '%unit akuntansi manajemen%' THEN 1000
        WHEN LOWER(uk.nama) LIKE '%analis biaya dan tarif%' THEN 500
        WHEN LOWER(uk.nama) LIKE '%unit aset%' THEN 300
        WHEN LOWER(uk.nama) LIKE '%instalasi humas%' THEN 200
        ELSE 0
    END as "Kunjungan_jml_pasien_Total",
    CASE 
        WHEN LOWER(uk.nama) LIKE '%unit it%' OR LOWER(uk.nama) LIKE '%it%' THEN 50
        ELSE 0
    END as "Komputer_SIMRS_jml_User"
FROM unit_kerja uk
WHERE NOT EXISTS (
    SELECT 1 FROM "Data_Kegiatan" dk 
    WHERE dk.unit_kerja_id = uk.id AND dk.tahun = 2025
);

-- 9. Update data_biaya dengan total_biaya_tanpa_jp jika belum ada
UPDATE data_biaya 
SET total_biaya_tanpa_jp = total_biaya * 0.8  -- Contoh: 80% dari total biaya
WHERE total_biaya_tanpa_jp IS NULL OR total_biaya_tanpa_jp = 0;

-- 10. Final verification
SELECT 
    'Tabel Distribusi' as kategori,
    COUNT(*) as jumlah
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%distribusi%'
UNION ALL
SELECT 
    'Mapping Dasar Alokasi' as kategori,
    COUNT(*) as jumlah
FROM mapping_dasar_alokasi
UNION ALL
SELECT 
    'Data Kegiatan 2025' as kategori,
    COUNT(*) as jumlah
FROM "Data_Kegiatan"
WHERE tahun = 2025
UNION ALL
SELECT 
    'Data Biaya 2025' as kategori,
    COUNT(*) as jumlah
FROM data_biaya
WHERE tahun = 2025;

-- 11. Tampilkan sample data untuk verifikasi
SELECT 
    uk.kode,
    uk.nama,
    mda.dasar_alokasi,
    CASE 
        WHEN mda.dasar_alokasi = 'Jumlah_SDM' THEN 
            COALESCE(dk."SDM_Dr", 0) + COALESCE(dk."SDM_Prwt", 0) + COALESCE(dk."SDM_Non", 0)
        WHEN mda.dasar_alokasi = 'Total_Kunjungan_Pasien' THEN 
            COALESCE(dk."Kunjungan_jml_pasien_Total", 0)
        WHEN mda.dasar_alokasi = 'Luas_ruangan' THEN 
            COALESCE(uk.luas_ruangan, 0)
        WHEN mda.dasar_alokasi = 'Komputer_simrs_user' THEN 
            COALESCE(dk."Komputer_SIMRS_jml_User", 0)
        ELSE 0
    END as nilai_dasar_alokasi,
    COALESCE(db.total_biaya, 0) as total_biaya,
    COALESCE(db.total_biaya_tanpa_jp, 0) as total_biaya_tanpa_jp
FROM unit_kerja uk
LEFT JOIN mapping_dasar_alokasi mda ON uk.id = mda.unit_kerja_id
LEFT JOIN "Data_Kegiatan" dk ON uk.id = dk.unit_kerja_id AND dk.tahun = 2025
LEFT JOIN data_biaya db ON uk.id = db.unit_kerja_id AND db.tahun = 2025
ORDER BY uk.kode
LIMIT 10;
