-- =====================================================
-- MIGRATION SCRIPT FOR 2025 DATA SYNCHRONIZATION
-- =====================================================

-- 1. ADD MISSING COLUMNS
ALTER TABLE IF EXISTS tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE IF EXISTS tenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS tenant_settings ADD COLUMN IF NOT EXISTS calculation_method VARCHAR(50) DEFAULT 'standard';
ALTER TABLE IF EXISTS user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- Ensure we have an 'id' column (renaming user_id if necessary)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='user_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='id') THEN
            ALTER TABLE user_profiles RENAME COLUMN user_id TO id;
        END IF;
    END IF;
END $$;
ALTER TABLE IF EXISTS data_barang_farmasi ADD COLUMN IF NOT EXISTS gudang VARCHAR(100);
ALTER TABLE IF EXISTS data_barang_gizi ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE IF EXISTS data_dokter ADD COLUMN IF NOT EXISTS spesialistik VARCHAR(255);
ALTER TABLE IF EXISTS data_dokter ADD COLUMN IF NOT EXISTS jenis_spesialistik VARCHAR(100);
ALTER TABLE IF EXISTS data_kegiatan ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS data_biaya ADD COLUMN IF NOT EXISTS transaksi_ref_id UUID;
ALTER TABLE IF EXISTS data_biaya ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS data_pendapatan ADD COLUMN IF NOT EXISTS pendapatan_apbd NUMERIC;
ALTER TABLE IF EXISTS data_pendapatan ADD COLUMN IF NOT EXISTS total_pendapatan NUMERIC;
ALTER TABLE IF EXISTS data_pendapatan ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS cost_recovery ADD COLUMN IF NOT EXISTS pendapatan_umum NUMERIC;
ALTER TABLE IF EXISTS cost_recovery ADD COLUMN IF NOT EXISTS pendapatan_bpjs NUMERIC;
ALTER TABLE IF EXISTS cost_recovery ADD COLUMN IF NOT EXISTS pendapatan_apbd NUMERIC;
ALTER TABLE IF EXISTS branding_settings ADD COLUMN IF NOT EXISTS app_title TEXT;
ALTER TABLE IF EXISTS branding_settings ADD COLUMN IF NOT EXISTS logo_alt_text TEXT;
ALTER TABLE IF EXISTS "Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_SVIP" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_VIP" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_I" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_II" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_III" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_Khusus" BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS "Dasar_Alokasi" ADD COLUMN IF NOT EXISTS "Nama_Unit_Kerja" VARCHAR(255);
ALTER TABLE IF EXISTS "Dasar_Alokasi" ALTER COLUMN "Nama_Unit_Kerja" DROP NOT NULL;

-- 2. CREATE MISSING TABLES

-- Table: analisa_bahan_pemeriksaan
CREATE TABLE IF NOT EXISTS analisa_bahan_pemeriksaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID,
    tahun INTEGER,
    kode_unit_kerja VARCHAR(50),
    nama_unit_kerja VARCHAR(255),
    kode_operator VARCHAR(50),
    nama_operator VARCHAR(255),
    kode_tindakan VARCHAR(50),
    nama_tindakan VARCHAR(255),
    jenis_tindakan VARCHAR(100),
    kode_bahan VARCHAR(50),
    nama_bahan VARCHAR(255),
    satuan VARCHAR(50),
    harga_satuan NUMERIC,
    jumlah_satuan NUMERIC,
    total_harga NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: data_master_barang_farmasi
CREATE TABLE IF NOT EXISTS data_master_barang_farmasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    kode_barang VARCHAR(50) UNIQUE,
    nama_barang VARCHAR(255),
    gudang VARCHAR(100),
    satuan VARCHAR(50),
    harga NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: Alokasi
CREATE TABLE IF NOT EXISTS "Alokasi" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    biaya_alokasi_i NUMERIC,
    dasar_alokasi VARCHAR(255),
    keterangan TEXT,
    tahun INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    total_alokasi_i NUMERIC,
    audit_check VARCHAR(50),
    unit_kerja_pusat_biaya VARCHAR(255),
    total_alokasi_biaya_kedua NUMERIC,
    selisih_pembulatan NUMERIC,
    tenant_id UUID REFERENCES tenants(id),
    biaya TEXT,
    urutan INTEGER,
    -- Dynamic columns for units (simplified for now, actual migration might need specific columns if accessed individually)
    -- Adding a few common ones seen in logs
    uk037_ambulance NUMERIC,
    uk038_laboratorium_pk_pa NUMERIC,
    uk039_radiologi NUMERIC,
    uk040_farmasi NUMERIC,
    uk041_rehab_medik NUMERIC,
    uk042_gizi_dapur NUMERIC,
    uk043_laundry_cssd NUMERIC,
    uk044_bdrs NUMERIC,
    uk045_cathlab NUMERIC
);

-- Table: Alokasibiaya
CREATE TABLE IF NOT EXISTS "Alokasibiaya" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    unit_kerja_pusat_biaya VARCHAR(255),
    biaya_tahunan NUMERIC,
    dasar_alokasi VARCHAR(255),
    tahun INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    jumlah_biaya_terdistribusi_i NUMERIC,
    audit_check VARCHAR(50),
    tenant_id UUID REFERENCES tenants(id)
);

-- View/Table: users_with_roles (Assuming it's a table for migration purposes, though usually a view)
CREATE TABLE IF NOT EXISTS users_with_roles (
    id UUID PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_user_meta_data JSONB,
    role_name TEXT,
    role_description TEXT,
    role_is_active BOOLEAN,
    assigned_at TIMESTAMPTZ,
    assigned_by_email TEXT
);

CREATE TABLE IF NOT EXISTS budgeting_bhp_farmasi_public (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    tahun INTEGER,
    kode_jenis INTEGER,
    kode_unit_kerja VARCHAR(50),
    nama_unit_kerja VARCHAR(255),
    kode_operator VARCHAR(50),
    nama_operator VARCHAR(255),
    kode_tindakan VARCHAR(50),
    nama_tindakan VARCHAR(255),
    biaya_bahan NUMERIC,
    unit_cost_per_tindakan NUMERIC,
    jumlah_tindakan NUMERIC,
    rincian_bahan JSONB,
    total_budgeting_bhp NUMERIC,
    total_budgeting_rincian NUMERIC,
    pendapatan NUMERIC,
    rasio_bhp_pendapatan NUMERIC,
    sumber_tabel VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_biaya_endpoints (
    method TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    description TEXT,
    request_body JSONB,
    response_body JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (method, endpoint)
);

-- 3. ENABLE RLS (Optional, since we want to import data)
-- For now, keep them simple or allow authenticated access
ALTER TABLE analisa_bahan_pemeriksaan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON analisa_bahan_pemeriksaan;
CREATE POLICY "Allow all for authenticated" ON analisa_bahan_pemeriksaan FOR ALL USING (true);

-- Repeat for others if necessary...
NOTIFY pgrst, 'reload schema';
