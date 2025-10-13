-- Script untuk membuat tabel Dasar_Alokasi dan Distribusi_Biaya
-- Jalankan script ini di Supabase SQL Editor
-- Project: koepzicdtovtknsqlnac

-- 1. Buat tabel Dasar_Alokasi
CREATE TABLE IF NOT EXISTS "Dasar_Alokasi" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat tabel Distribusi_Biaya
CREATE TABLE IF NOT EXISTS "Distribusi_Biaya" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Total_Dasar_Alokasi" DECIMAL(15,2) DEFAULT 0,
  "Persentase_Alokasi" DECIMAL(5,4) DEFAULT 0,
  "Biaya_Dialokasikan" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_kode_uk ON "Dasar_Alokasi"("Kode_UK");
CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_tahun ON "Dasar_Alokasi"("Tahun");
CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_unit_kerja_id ON "Dasar_Alokasi"("Unit_Kerja_ID");
CREATE INDEX IF NOT EXISTS idx_dasar_alokasi_field ON "Dasar_Alokasi"("Dasar_Alokasi_Field");

CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_kode_uk ON "Distribusi_Biaya"("Kode_UK");
CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_tahun ON "Distribusi_Biaya"("Tahun");
CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_unit_kerja_id ON "Distribusi_Biaya"("Unit_Kerja_ID");
CREATE INDEX IF NOT EXISTS idx_distribusi_biaya_field ON "Distribusi_Biaya"("Dasar_Alokasi_Field");

-- 4. Enable RLS (Row Level Security)
ALTER TABLE "Dasar_Alokasi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Distribusi_Biaya" ENABLE ROW LEVEL SECURITY;

-- 5. Buat policies untuk akses authenticated users
CREATE POLICY "Allow all operations for authenticated users on Dasar_Alokasi" ON "Dasar_Alokasi"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on Distribusi_Biaya" ON "Distribusi_Biaya"
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Buat function untuk update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Buat triggers untuk updated_at
DROP TRIGGER IF EXISTS update_dasar_alokasi_updated_at ON "Dasar_Alokasi";
CREATE TRIGGER update_dasar_alokasi_updated_at
    BEFORE UPDATE ON "Dasar_Alokasi"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_distribusi_biaya_updated_at ON "Distribusi_Biaya";
CREATE TRIGGER update_distribusi_biaya_updated_at
    BEFORE UPDATE ON "Distribusi_Biaya"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Buat function untuk generate dasar alokasi otomatis
CREATE OR REPLACE FUNCTION generate_dasar_alokasi_otomatis(tahun_param INTEGER)
RETURNS VOID AS $$
DECLARE
    unit_record RECORD;
    data_kegiatan_record RECORD;
    dasar_alokasi_field VARCHAR(100);
    dasar_alokasi_value DECIMAL(15,2);
BEGIN
    -- Hapus data lama untuk tahun yang sama
    DELETE FROM "Dasar_Alokasi" WHERE "Tahun" = tahun_param;
    
    -- Loop melalui semua unit kerja
    FOR unit_record IN 
        SELECT uk.id, uk.kode, uk.nama, uk.kategori, uk.luas_ruangan
        FROM unit_kerja uk
    LOOP
        -- Cari data kegiatan untuk unit kerja ini
        SELECT dk.id, dk."Jumlah_SDM", dk."Total_Kunjungan_Pasien", dk."Komputer_simrs_user"
        INTO data_kegiatan_record
        FROM "Data_Kegiatan" dk
        WHERE dk."Kode_UK" = unit_record.kode 
        AND dk.tahun = tahun_param
        LIMIT 1;
        
        -- Tentukan dasar alokasi berdasarkan nama unit kerja
        CASE 
            WHEN unit_record.nama ILIKE '%Direktur%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Komite PPI%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Komite PMKP%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Komite Medik%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Akreditasi%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Dewan Pengawas%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Bid Pengembangan%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Seksi penunjang%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%IPSRS%' THEN
                dasar_alokasi_field := 'Luas_Ruangan';
                dasar_alokasi_value := COALESCE(unit_record.luas_ruangan, 0);
                
            WHEN unit_record.nama ILIKE '%Bid Keperawatan%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Seksi asuhan perawatan%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Seksi pengembangan%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Bid Pelayanan Medis%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Seksi pelayanan%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%TPPRJ%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%TPPRI%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Bag Tata Usaha%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Subag Keuangan%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Unit Perbendaharaan%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Unit Pendapatan%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Unit Akuntansi dan Verifikasi%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Unit Akuntansi Manajemen%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Analis Biaya dan tarif%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Subag umpeg%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Staf Umum dan kerjasama%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Unit IT%' THEN
                dasar_alokasi_field := 'Komputer_simrs_user';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Komputer_simrs_user", 0);
                
            WHEN unit_record.nama ILIKE '%Rumah Tangga%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Cleaning service%' THEN
                dasar_alokasi_field := 'Luas_Ruangan';
                dasar_alokasi_value := COALESCE(unit_record.luas_ruangan, 0);
                
            WHEN unit_record.nama ILIKE '%Security%' THEN
                dasar_alokasi_field := 'Luas_Ruangan';
                dasar_alokasi_value := COALESCE(unit_record.luas_ruangan, 0);
                
            WHEN unit_record.nama ILIKE '%Unit Aset%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Instalasi Humas%' THEN
                dasar_alokasi_field := 'Total_Kunjungan_Pasien';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Total_Kunjungan_Pasien", 0);
                
            WHEN unit_record.nama ILIKE '%Subag renval%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Staf Renval%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            WHEN unit_record.nama ILIKE '%Rekam Medik%' THEN
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
                
            ELSE
                -- Default untuk unit kerja yang tidak terdefinisi
                dasar_alokasi_field := 'Jumlah_SDM';
                dasar_alokasi_value := COALESCE(data_kegiatan_record."Jumlah_SDM", 0);
        END CASE;
        
        -- Insert data dasar alokasi
        INSERT INTO "Dasar_Alokasi" (
            "Kode_UK", 
            "Nama_Unit_Kerja", 
            "Kategori", 
            "Dasar_Alokasi_Field", 
            "Dasar_Alokasi_Value", 
            "Tahun", 
            "Unit_Kerja_ID", 
            "Data_Kegiatan_ID"
        ) VALUES (
            unit_record.kode,
            unit_record.nama,
            unit_record.kategori,
            dasar_alokasi_field,
            dasar_alokasi_value,
            tahun_param,
            unit_record.id,
            data_kegiatan_record.id
        );
        
    END LOOP;
    
    RAISE NOTICE 'Dasar alokasi berhasil digenerate untuk tahun %', tahun_param;
END;
$$ LANGUAGE plpgsql;

-- 9. Buat function untuk menghitung distribusi biaya
CREATE OR REPLACE FUNCTION hitung_distribusi_biaya(tahun_param INTEGER, total_biaya DECIMAL(15,2))
RETURNS VOID AS $$
DECLARE
    alokasi_record RECORD;
    total_dasar_alokasi DECIMAL(15,2);
    persentase DECIMAL(5,4);
    biaya_dialokasikan DECIMAL(15,2);
BEGIN
    -- Hapus data lama untuk tahun yang sama
    DELETE FROM "Distribusi_Biaya" WHERE "Tahun" = tahun_param;
    
    -- Hitung total dasar alokasi untuk setiap field
    FOR alokasi_record IN 
        SELECT 
            da.*,
            SUM(da."Dasar_Alokasi_Value") OVER (PARTITION BY da."Dasar_Alokasi_Field") as total_field
        FROM "Dasar_Alokasi" da
        WHERE da."Tahun" = tahun_param
    LOOP
        -- Hitung persentase alokasi
        IF alokasi_record.total_field > 0 THEN
            persentase := alokasi_record."Dasar_Alokasi_Value" / alokasi_record.total_field;
        ELSE
            persentase := 0;
        END IF;
        
        -- Hitung biaya yang dialokasikan
        biaya_dialokasikan := total_biaya * persentase;
        
        -- Insert data distribusi biaya
        INSERT INTO "Distribusi_Biaya" (
            "Kode_UK", 
            "Nama_Unit_Kerja", 
            "Kategori", 
            "Dasar_Alokasi_Field", 
            "Dasar_Alokasi_Value", 
            "Total_Dasar_Alokasi", 
            "Persentase_Alokasi", 
            "Biaya_Dialokasikan", 
            "Tahun", 
            "Unit_Kerja_ID", 
            "Data_Kegiatan_ID"
        ) VALUES (
            alokasi_record."Kode_UK",
            alokasi_record."Nama_Unit_Kerja",
            alokasi_record."Kategori",
            alokasi_record."Dasar_Alokasi_Field",
            alokasi_record."Dasar_Alokasi_Value",
            alokasi_record.total_field,
            persentase,
            biaya_dialokasikan,
            tahun_param,
            alokasi_record."Unit_Kerja_ID",
            alokasi_record."Data_Kegiatan_ID"
        );
        
    END LOOP;
    
    RAISE NOTICE 'Distribusi biaya berhasil dihitung untuk tahun % dengan total biaya %', tahun_param, total_biaya;
END;
$$ LANGUAGE plpgsql;

-- 10. Verifikasi tabel yang dibuat
SELECT 
  'Dasar_Alokasi' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Dasar_Alokasi' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'Distribusi_Biaya' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Distribusi_Biaya' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Test insert data sample
INSERT INTO "Dasar_Alokasi" (
    "Kode_UK", 
    "Nama_Unit_Kerja", 
    "Kategori", 
    "Dasar_Alokasi_Field", 
    "Dasar_Alokasi_Value", 
    "Tahun"
) VALUES (
    'TEST001', 
    'Test Unit Kerja', 
    'Test Kategori', 
    'Jumlah_SDM', 
    10, 
    2024
);

-- 12. Test select data
SELECT * FROM "Dasar_Alokasi" WHERE "Kode_UK" = 'TEST001';

-- 13. Cleanup test data
DELETE FROM "Dasar_Alokasi" WHERE "Kode_UK" = 'TEST001';

-- 14. Final verification
SELECT 
    'Tables Created Successfully' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name IN ('Dasar_Alokasi', 'Distribusi_Biaya') 
  AND table_schema = 'public';
