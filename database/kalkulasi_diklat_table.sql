-- Script untuk membuat tabel kalkulasi_diklat
-- Jalankan script ini di Supabase SQL Editor atau psql

-- Buat tabel kalkulasi_diklat
CREATE TABLE IF NOT EXISTS kalkulasi_diklat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tahun INTEGER NOT NULL,
    jenis_diklat VARCHAR(50) NOT NULL CHECK (jenis_diklat IN ('basis_dokter', 'basis_perawat', 'basis_penunjang', 'basis_administrasi')),
    lama_hari_diklat INTEGER NOT NULL DEFAULT 0,
    biaya_unit_diklat DECIMAL(15,2) DEFAULT 0,
    biaya_distribusi_kedua DECIMAL(15,2) DEFAULT 0,
    total_biaya_unit_diklat DECIMAL(15,2) DEFAULT 0,
    total_diklat INTEGER DEFAULT 0,
    biaya_diklat_per_hari DECIMAL(15,2) DEFAULT 0,
    unit_cost_per_jenis_layanan DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_user_tahun ON kalkulasi_diklat(user_id, tahun);
CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_jenis ON kalkulasi_diklat(jenis_diklat);

-- Buat trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_kalkulasi_diklat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kalkulasi_diklat_updated_at
    BEFORE UPDATE ON kalkulasi_diklat
    FOR EACH ROW
    EXECUTE FUNCTION update_kalkulasi_diklat_updated_at();

-- Buat function untuk menghitung total biaya unit diklat
CREATE OR REPLACE FUNCTION calculate_total_biaya_unit_diklat()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_biaya_unit_diklat = NEW.biaya_unit_diklat + NEW.biaya_distribusi_kedua;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_total_biaya_unit_diklat
    BEFORE INSERT OR UPDATE ON kalkulasi_diklat
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_biaya_unit_diklat();

-- Buat function untuk menghitung biaya diklat per hari
CREATE OR REPLACE FUNCTION calculate_biaya_diklat_per_hari()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_diklat > 0 THEN
        NEW.biaya_diklat_per_hari = NEW.total_biaya_unit_diklat / NEW.total_diklat;
    ELSE
        NEW.biaya_diklat_per_hari = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_biaya_diklat_per_hari
    BEFORE INSERT OR UPDATE ON kalkulasi_diklat
    FOR EACH ROW
    EXECUTE FUNCTION calculate_biaya_diklat_per_hari();

-- Buat function untuk menghitung unit cost per jenis layanan
CREATE OR REPLACE FUNCTION calculate_unit_cost_per_jenis_layanan()
RETURNS TRIGGER AS $$
BEGIN
    NEW.unit_cost_per_jenis_layanan = NEW.biaya_diklat_per_hari * NEW.lama_hari_diklat;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_unit_cost_per_jenis_layanan
    BEFORE INSERT OR UPDATE ON kalkulasi_diklat
    FOR EACH ROW
    EXECUTE FUNCTION calculate_unit_cost_per_jenis_layanan();

-- Buat RLS policies
ALTER TABLE kalkulasi_diklat ENABLE ROW LEVEL SECURITY;

-- Policy untuk user bisa melihat data sendiri
CREATE POLICY "Users can view own kalkulasi_diklat" ON kalkulasi_diklat
    FOR SELECT USING (auth.uid() = user_id);

-- Policy untuk user bisa insert data sendiri
CREATE POLICY "Users can insert own kalkulasi_diklat" ON kalkulasi_diklat
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy untuk user bisa update data sendiri
CREATE POLICY "Users can update own kalkulasi_diklat" ON kalkulasi_diklat
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy untuk user bisa delete data sendiri
CREATE POLICY "Users can delete own kalkulasi_diklat" ON kalkulasi_diklat
    FOR DELETE USING (auth.uid() = user_id);

-- Policy untuk sistem bisa update semua data (untuk trigger)
CREATE POLICY "System can update all kalkulasi_diklat" ON kalkulasi_diklat
    FOR UPDATE USING (true);

-- Policy untuk sistem bisa insert semua data (untuk trigger)
CREATE POLICY "System can insert all kalkulasi_diklat" ON kalkulasi_diklat
    FOR INSERT WITH CHECK (true);

-- Policy untuk sistem bisa select semua data (untuk trigger)
CREATE POLICY "System can select all kalkulasi_diklat" ON kalkulasi_diklat
    FOR SELECT USING (true);

-- Policy untuk sistem bisa delete semua data (untuk trigger)
CREATE POLICY "System can delete all kalkulasi_diklat" ON kalkulasi_diklat
    FOR DELETE USING (true);

-- Insert sample data untuk testing
INSERT INTO kalkulasi_diklat (
    user_id, 
    tahun, 
    jenis_diklat, 
    lama_hari_diklat, 
    biaya_unit_diklat, 
    biaya_distribusi_kedua, 
    total_diklat
) VALUES 
(
    (SELECT id FROM auth.users LIMIT 1), 
    2024, 
    'basis_dokter', 
    5, 
    1000000, 
    200000, 
    10
),
(
    (SELECT id FROM auth.users LIMIT 1), 
    2024, 
    'basis_perawat', 
    3, 
    750000, 
    150000, 
    15
),
(
    (SELECT id FROM auth.users LIMIT 1), 
    2024, 
    'basis_penunjang', 
    2, 
    500000, 
    100000, 
    8
),
(
    (SELECT id FROM auth.users LIMIT 1), 
    2024, 
    'basis_administrasi', 
    4, 
    600000, 
    120000, 
    12
);
