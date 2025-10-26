// Script untuk membuat tabel kalkulasi_diklat menggunakan Supabase client
// Jalankan script ini di browser console atau sebagai script terpisah

import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const supabaseUrl = 'https://koepzicdtovtknsqlnac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDg1NzgsImV4cCI6MjA3Mjg4NDU3OH0.QUpuIaPDlDVp2LKSJYkBj4z3IY0aJwyCNhOXyVC2Ui0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Script SQL untuk membuat tabel
const createTableSQL = `
-- Create kalkulasi_diklat table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_user_tahun ON kalkulasi_diklat(user_id, tahun);
CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_jenis ON kalkulasi_diklat(jenis_diklat);

-- Create triggers
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

-- Create calculation functions
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

-- Enable RLS
ALTER TABLE kalkulasi_diklat ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own kalkulasi_diklat" ON kalkulasi_diklat
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kalkulasi_diklat" ON kalkulasi_diklat
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kalkulasi_diklat" ON kalkulasi_diklat
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kalkulasi_diklat" ON kalkulasi_diklat
    FOR DELETE USING (auth.uid() = user_id);
`;

async function createTable() {
    try {
        console.log('Creating kalkulasi_diklat table...');
        
        // Execute the SQL script
        const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (error) {
            console.error('Error creating table:', error);
            return false;
        }
        
        console.log('Table created successfully!');
        return true;
        
    } catch (err) {
        console.error('Error:', err);
        return false;
    }
}

// Export function untuk digunakan di aplikasi
export { createTable };

// Jika dijalankan langsung
if (typeof window !== 'undefined') {
    createTable().then(success => {
        if (success) {
            alert('Tabel kalkulasi_diklat berhasil dibuat! Silakan refresh aplikasi.');
        } else {
            alert('Gagal membuat tabel. Silakan jalankan script SQL manual di Supabase Dashboard.');
        }
    });
}
