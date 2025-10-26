# DOKUMENTASI SKEMA DATABASE
## Aplikasi Unit Cost Rumah Sakit

---

## 📋 **OVERVIEW**

Dokumentasi ini menjelaskan skema database lengkap untuk Aplikasi Unit Cost Rumah Sakit yang menggunakan Supabase PostgreSQL sebagai backend.

---

## 🗄️ **STRUKTUR DATABASE**

### **1. TABEL MASTER DATA**

#### `unit_kerja`
**Deskripsi:** Master data unit kerja rumah sakit
```sql
CREATE TABLE unit_kerja (
    kode VARCHAR PRIMARY KEY,           -- Kode unit (UK001, UK002, dst)
    nama VARCHAR NOT NULL,              -- Nama unit kerja
    jenis INTEGER NOT NULL,             -- Klasifikasi jenis (1=Rawat Jalan, 2=Rawat Inap, 3=Operatif, 4=Administrasi)
    kategori VARCHAR,                   -- Kategori unit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Index:**
```sql
CREATE INDEX idx_unit_kerja_jenis ON unit_kerja(jenis);
```

#### `tindakan_radiologi`
**Deskripsi:** Master data tindakan radiologi
```sql
CREATE TABLE tindakan_radiologi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jenis_pemeriksaan VARCHAR NOT NULL,  -- Jenis pemeriksaan
    kode_tindakan VARCHAR UNIQUE NOT NULL, -- Kode tindakan
    nama_tindakan VARCHAR NOT NULL,      -- Nama tindakan
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `tindakan_laboratorium`
**Deskripsi:** Master data tindakan laboratorium
```sql
CREATE TABLE tindakan_laboratorium (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jenis VARCHAR NOT NULL,              -- Jenis lab (PK, PA, MK, dll)
    kode VARCHAR UNIQUE NOT NULL,        -- Auto-generated (PK.001, PA.001, dll)
    nama VARCHAR NOT NULL,               -- Nama tindakan
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `tindakan_operatif`
**Deskripsi:** Master data tindakan operatif
```sql
CREATE TABLE tindakan_operatif (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jenis_tindakan VARCHAR NOT NULL,     -- Jenis tindakan operatif
    kode_tindakan VARCHAR UNIQUE NOT NULL,
    nama_tindakan VARCHAR NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `data_barang_farmasi`
**Deskripsi:** Master data barang farmasi
```sql
CREATE TABLE data_barang_farmasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode VARCHAR UNIQUE NOT NULL,        -- Kode barang
    nama VARCHAR NOT NULL,               -- Nama barang
    satuan VARCHAR,                      -- Satuan (tablet, botol, dll)
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **2. TABEL DATA KEGIATAN & BIAYA**

#### `data_kegiatan`
**Deskripsi:** Data kegiatan operasional unit kerja
```sql
CREATE TABLE data_kegiatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Kode_UK" VARCHAR REFERENCES unit_kerja(kode),
    "Nama_Unit_Kerja" VARCHAR,
    "Jenis" VARCHAR,                     -- Rawat Jalan/Rawat Inap/Operatif
    "Total_Kunjungan_Pasien" NUMERIC DEFAULT 0,
    "Resep_Lembar_Resep" NUMERIC DEFAULT 0,
    tahun INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Index:**
```sql
CREATE INDEX idx_data_kegiatan_tahun_user ON data_kegiatan(tahun, user_id);
CREATE INDEX idx_data_kegiatan_kode_uk ON data_kegiatan("Kode_UK");
```

#### `data_biaya`
**Deskripsi:** Data biaya unit kerja
```sql
CREATE TABLE data_biaya (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_unit_kerja VARCHAR REFERENCES unit_kerja(kode),
    nama_unit_kerja VARCHAR,
    total_biaya NUMERIC DEFAULT 0,
    total_biaya_tanpa_jp NUMERIC DEFAULT 0,
    tahun INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `distribusi_biaya_kedua`
**Deskripsi:** Data distribusi biaya kedua
```sql
CREATE TABLE distribusi_biaya_kedua (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uk040_farmasi NUMERIC DEFAULT 0,    -- Distribusi biaya farmasi
    tahun INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **3. TABEL KALKULASI**

#### `kalkulasi_biaya_radiologi`
**Deskripsi:** Kalkulasi biaya radiologi
```sql
CREATE TABLE kalkulasi_biaya_radiologi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    jenis_pemeriksaan VARCHAR,
    kode_tindakan VARCHAR,
    nama_tindakan VARCHAR,
    volume_kegiatan NUMERIC DEFAULT 0,
    hasil_kali NUMERIC DEFAULT 0,       -- volume_kegiatan * dasar_alokasi
    dasar_alokasi NUMERIC DEFAULT 0,
    biaya_bahan_medis NUMERIC DEFAULT 0,
    biaya_bhp NUMERIC DEFAULT 0,
    biaya_peralatan_medis NUMERIC DEFAULT 0,
    biaya_amortisasi NUMERIC DEFAULT 0,
    biaya_pemeliharaan NUMERIC DEFAULT 0,
    biaya_sdm_medis NUMERIC DEFAULT 0,
    biaya_sdm_non_medis NUMERIC DEFAULT 0,
    biaya_distribusi_listrik NUMERIC DEFAULT 0,
    biaya_distribusi_air NUMERIC DEFAULT 0,
    biaya_distribusi_gas_medis NUMERIC DEFAULT 0,
    biaya_distribusi_limbah NUMERIC DEFAULT 0,
    biaya_distribusi_cssd NUMERIC DEFAULT 0,
    biaya_distribusi_gizi NUMERIC DEFAULT 0,
    biaya_distribusi_laundry NUMERIC DEFAULT 0,
    biaya_distribusi_ambulance NUMERIC DEFAULT 0,
    biaya_distribusi_pemulasaran NUMERIC DEFAULT 0,
    biaya_distribusi_keamanan NUMERIC DEFAULT 0,
    biaya_distribusi_kebersihan NUMERIC DEFAULT 0,
    total_biaya_unit NUMERIC DEFAULT 0,
    is_manual_input BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `kalkulasi_biaya_gizi`
**Deskripsi:** Kalkulasi biaya gizi
```sql
CREATE TABLE kalkulasi_biaya_gizi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    jenis_pemeriksaan VARCHAR,
    kode_tindakan VARCHAR,
    nama_tindakan VARCHAR,
    volume_kegiatan NUMERIC DEFAULT 0,
    hasil_kali NUMERIC DEFAULT 0,
    dasar_alokasi NUMERIC DEFAULT 0,
    -- Kolom biaya sama dengan radiologi
    total_biaya_unit NUMERIC DEFAULT 0,
    is_manual_input BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `kalkulasi_biaya_laboratorium`
**Deskripsi:** Kalkulasi biaya laboratorium
```sql
CREATE TABLE kalkulasi_biaya_laboratorium (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    jenis_pemeriksaan VARCHAR,
    kode_tindakan VARCHAR,
    nama_tindakan VARCHAR,
    volume_kegiatan NUMERIC DEFAULT 0,
    hasil_kali NUMERIC DEFAULT 0,
    dasar_alokasi NUMERIC DEFAULT 0,
    -- Kolom biaya sama dengan radiologi
    total_biaya_unit NUMERIC DEFAULT 0,
    is_manual_input BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `kalkulasi_biaya_bdrs`
**Deskripsi:** Kalkulasi biaya BDRS
```sql
CREATE TABLE kalkulasi_biaya_bdrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    jenis_pemeriksaan VARCHAR,
    kode_tindakan VARCHAR,
    nama_tindakan VARCHAR,
    volume_kegiatan NUMERIC DEFAULT 0,
    hasil_kali NUMERIC DEFAULT 0,
    dasar_alokasi NUMERIC DEFAULT 0,
    -- Kolom biaya sama dengan radiologi
    total_biaya_unit NUMERIC DEFAULT 0,
    is_manual_input BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `kalkulasi_biaya_operatif`
**Deskripsi:** Kalkulasi biaya operatif
```sql
CREATE TABLE kalkulasi_biaya_operatif (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    jenis_pemeriksaan VARCHAR,
    kode_tindakan VARCHAR,
    nama_tindakan VARCHAR,
    volume_kegiatan NUMERIC DEFAULT 0,
    hasil_kali NUMERIC DEFAULT 0,
    dasar_alokasi NUMERIC DEFAULT 0,
    -- Kolom biaya sama dengan radiologi
    total_biaya_unit NUMERIC DEFAULT 0,
    is_manual_input BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `kalkulasi_biaya_cathlab`
**Deskripsi:** Kalkulasi biaya cathlab
```sql
CREATE TABLE kalkulasi_biaya_cathlab (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    jenis_pemeriksaan VARCHAR,
    kode_tindakan VARCHAR,
    nama_tindakan VARCHAR,
    volume_kegiatan NUMERIC DEFAULT 0,
    hasil_kali NUMERIC DEFAULT 0,
    dasar_alokasi NUMERIC DEFAULT 0,
    -- Kolom biaya sama dengan radiologi
    total_biaya_unit NUMERIC DEFAULT 0,
    is_manual_input BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `kalkulasi_daftar_dan_resep`
**Deskripsi:** Kalkulasi biaya layanan pendaftaran dan peresepan
```sql
CREATE TABLE kalkulasi_daftar_dan_resep (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jenis_layanan VARCHAR NOT NULL,      -- Pendaftaran Rawat Jalan/Inap, Peresepan Rawat Jalan/Inap, Peresepan Farmasi
    biaya_unit NUMERIC DEFAULT 0,
    biaya_distribusi_kedua NUMERIC DEFAULT 0,
    total_biaya_unit NUMERIC DEFAULT 0,
    jumlah_pembagi NUMERIC DEFAULT 0,    -- Kunci perhitungan
    biaya_layanan NUMERIC DEFAULT 0,
    tahun INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **4. TABEL KONFIGURASI**

#### `biaya_preference`
**Deskripsi:** Preferensi perhitungan biaya per user
```sql
CREATE TABLE biaya_preference (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    biaya_type VARCHAR DEFAULT 'total_biaya', -- 'total_biaya' atau 'total_biaya_tanpa_jp'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔗 **RELASI ANTAR TABEL**

### **Entity Relationship Diagram (ERD)**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   unit_kerja    │◄─────►│  data_kegiatan  │       │   data_biaya    │
│                 │       │                 │       │                 │
│ • kode (PK)     │       │ • Kode_UK (FK)  │       │ • kode_unit_    │
│ • nama          │       │ • Total_Kunjung │       │   kerja (FK)    │
│ • jenis         │       │ • Resep_Lembar  │       │ • total_biaya   │
│ • kategori      │       │ • tahun         │       │ • tahun         │
└─────────────────┘       │ • user_id       │       │ • user_id       │
                          └─────────────────┘       └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ kalkulasi_daftar│
                          │    _dan_resep   │
                          │                 │
                          │ • jenis_layanan │
                          │ • jumlah_pembagi│
                          │ • biaya_layanan │
                          │ • tahun         │
                          │ • user_id       │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ tindakan_       │◄─────►│ kalkulasi_biaya_│
│ radiologi       │       │ radiologi       │
│                 │       │                 │
│ • kode_tindakan │       │ • kode_tindakan │
│ • nama_tindakan │       │ • volume_kegiatan│
│ • jenis_pemeriksaan     │ • total_biaya_  │
│ • user_id       │       │   unit          │
└─────────────────┘       │ • user_id       │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ tindakan_       │◄─────►│ kalkulasi_biaya_│
│ laboratorium    │       │ laboratorium    │
│                 │       │                 │
│ • kode          │       │ • kode_tindakan │
│ • nama          │       │ • volume_kegiatan│
│ • jenis         │       │ • total_biaya_  │
│ • user_id       │       │   unit          │
└─────────────────┘       │ • user_id       │
                          └─────────────────┘
```

---

## 🔧 **FUNGSI DATABASE PENTING**

### **1. Fungsi Auto-Generate Kode**
```sql
CREATE OR REPLACE FUNCTION generate_lab_code(p_jenis text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  last_code text;
  last_number integer;
  new_number integer;
  new_code text;
BEGIN
  -- Ambil kode terakhir untuk jenis yang diberikan
  SELECT kode INTO last_code
  FROM public.tindakan_laboratorium
  WHERE kode LIKE p_jenis || '.%'
  ORDER BY kode DESC
  LIMIT 1;

  IF last_code IS NOT NULL THEN
    -- Extract nomor, convert ke integer, dan increment
    last_number := (SUBSTRING(last_code FROM LENGTH(p_jenis) + 2))::integer;
    new_number := last_number + 1;
  ELSE
    -- Jika belum ada kode, mulai dari 1
    new_number := 1;
  END IF;

  -- Format kode baru dengan padding zeros (PK.001, PK.010, PK.100)
  new_code := p_jenis || '.' || LPAD(new_number::text, 3, '0');

  RETURN new_code;
END;
$$;
```

### **2. Fungsi Perhitungan Pembagi**
```sql
CREATE OR REPLACE FUNCTION calculate_biaya_layanan_daftar_resep(
    p_jenis_layanan text, 
    p_tahun integer, 
    p_user_id uuid
)
RETURNS TABLE(
    biaya_unit numeric,
    biaya_distribusi_kedua numeric,
    total_biaya_unit numeric,
    jumlah_pembagi numeric,
    biaya_layanan numeric
)
LANGUAGE plpgsql
```

### **3. Fungsi Rekalkulasi Manual**
```sql
-- Untuk setiap modul kalkulasi:
CREATE OR REPLACE FUNCTION manual_recalculate_radiologi(p_tahun integer, p_user_id uuid)
CREATE OR REPLACE FUNCTION manual_recalculate_gizi(p_tahun integer, p_user_id uuid)
CREATE OR REPLACE FUNCTION manual_recalculate_laboratorium(p_tahun integer, p_user_id uuid)
CREATE OR REPLACE FUNCTION manual_recalculate_bdrs(p_tahun integer, p_user_id uuid)
CREATE OR REPLACE FUNCTION manual_recalculate_operatif(p_tahun integer, p_user_id uuid)
CREATE OR REPLACE FUNCTION manual_recalculate_cathlab(p_tahun integer, p_user_id uuid)
CREATE OR REPLACE FUNCTION manual_recalculate_daftar_resep(p_tahun integer, p_user_id uuid)
```

### **4. Fungsi CRUD Aman**
```sql
-- Untuk operasi CRUD yang aman:
CREATE OR REPLACE FUNCTION safe_radiologi_crud_operation(...)
CREATE OR REPLACE FUNCTION safe_gizi_crud_operation(...)
CREATE OR REPLACE FUNCTION safe_laboratorium_crud_operation(...)
CREATE OR REPLACE FUNCTION safe_bdrs_crud_operation(...)
CREATE OR REPLACE FUNCTION safe_operatif_crud_operation(...)
CREATE OR REPLACE FUNCTION safe_cathlab_crud_operation(...)
```

---

## 🚀 **TRIGGER & AUTOMATION**

### **1. Smart Sync Triggers**
```sql
-- Auto-sync master data ke tabel kalkulasi
CREATE TRIGGER trigger_smart_sync_tindakan_lab_to_kalkulasi
    AFTER INSERT ON tindakan_laboratorium
    FOR EACH ROW
    EXECUTE FUNCTION smart_sync_tindakan_lab_to_kalkulasi();

-- Untuk tindakan operatif
CREATE TRIGGER trigger_sync_tindakan_operatif_to_kalkulasi
    AFTER INSERT ON tindakan_operatif
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_tindakan_operatif_to_kalkulasi();
```

### **2. Auto-Update Timestamps**
```sql
-- Semua tabel memiliki trigger untuk auto-update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON [table_name]
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 **INDEX STRATEGY**

### **Performance Indexes**
```sql
-- Index untuk pencarian cepat
CREATE INDEX idx_kalkulasi_user_tahun ON kalkulasi_biaya_radiologi(user_id, tahun);
CREATE INDEX idx_kalkulasi_kode ON kalkulasi_biaya_radiologi(kode_tindakan);
CREATE INDEX idx_data_kegiatan_composite ON data_kegiatan("Kode_UK", tahun, user_id);
CREATE INDEX idx_unit_kerja_jenis ON unit_kerja(jenis);

-- Index untuk foreign keys
CREATE INDEX idx_fk_kode_uk ON data_kegiatan("Kode_UK");
CREATE INDEX idx_fk_user_id ON kalkulasi_biaya_radiologi(user_id);
```

---

## 🔐 **SECURITY & RLS**

### **Row Level Security (RLS)**
```sql
-- Enable RLS pada tabel sensitif
ALTER TABLE kalkulasi_biaya_radiologi ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_kegiatan ENABLE ROW LEVEL SECURITY;

-- Policy untuk akses data per user
CREATE POLICY user_access_policy ON kalkulasi_biaya_radiologi
    FOR ALL USING (auth.uid() = user_id);
```

---

## 📚 **REFERENSI**

- **Database Engine:** Supabase PostgreSQL 15+
- **UUID Generation:** uuid-ossp extension
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Backup Strategy:** Daily automated backups
- **Migration System:** Supabase migrations

---

## 📈 **MONITORING & PERFORMANCE**

### **Key Metrics to Monitor:**
1. **Query Performance:** Index usage, slow queries
2. **Table Sizes:** Growth rate, storage usage
3. **Connection Pool:** Active connections, timeouts
4. **RPC Functions:** Execution time, error rates

### **Optimization Guidelines:**
1. Use appropriate indexes for frequent queries
2. Implement proper RLS policies
3. Monitor function execution times
4. Regular VACUUM and ANALYZE operations
5. Partitioning for large historical data

---

*Dokumentasi ini mencakup skema database lengkap untuk Aplikasi Unit Cost Rumah Sakit dengan fokus pada integritas data, performa, dan keamanan.*
