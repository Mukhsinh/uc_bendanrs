# 📊 Dokumentasi Skema Database - Sistem Unit Cost Rumah Sakit

## 🎯 Overview
Sistem database untuk perhitungan unit cost rumah sakit dengan fokus pada kalkulasi biaya akomodasi, distribusi biaya, dan perhitungan biaya per unit layanan.

## 🏗️ Struktur Database

### 📋 Daftar Tabel Utama

#### 1. **unit_kerja** (77 rows)
Master data unit kerja rumah sakit
```sql
CREATE TABLE unit_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    kode TEXT UNIQUE CHECK (kode ~ '^UK[0-9]{3}$'),
    nama TEXT,
    lokasi TEXT,
    luas_ruangan NUMERIC,
    kategori TEXT CHECK (kategori = ANY (ARRAY['Pusat Biaya', 'Pusat Pendapatan'])),
    jenis SMALLINT DEFAULT 1 CHECK (jenis = ANY (ARRAY[1, 2, 3, 4])),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. **data_biaya** (77 rows)
Data biaya tahunan per unit kerja
```sql
CREATE TABLE data_biaya (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER,
    unit_kerja_id UUID REFERENCES unit_kerja(id),
    kode_unit_kerja TEXT,
    nama_unit_kerja TEXT,
    
    -- Biaya Individual
    biaya_gaji_tunjangan NUMERIC,
    biaya_jasa_pelayanan NUMERIC,
    biaya_obat NUMERIC,
    biaya_bhp NUMERIC,
    biaya_makan_karyawan NUMERIC,
    biaya_makan_pasien NUMERIC,
    biaya_rumah_tangga NUMERIC,
    biaya_cetak NUMERIC,
    biaya_atk NUMERIC,
    biaya_listrik NUMERIC,
    biaya_air NUMERIC,
    biaya_telp NUMERIC,
    biaya_pemeliharaan_bangunan NUMERIC,
    biaya_pemeliharaan_alat_medis NUMERIC,
    biaya_pemeliharaan_alat_non_medis NUMERIC,
    biaya_operasional_lainnya NUMERIC,
    biaya_penyusutan_gedung NUMERIC,
    biaya_penyusutan_jaringan NUMERIC,
    biaya_penyusutan_alat_medis NUMERIC,
    biaya_penyusutan_alat_non_medis NUMERIC,
    biaya_pendidikan_pelatihan NUMERIC,
    biaya_laundry NUMERIC,
    biaya_sterilisasi NUMERIC,
    
    -- Generated Columns (Computed)
    biaya_bahan NUMERIC GENERATED ALWAYS AS (...) STORED,
    biaya_pegawai NUMERIC GENERATED ALWAYS AS (...) STORED,
    biaya_daya NUMERIC GENERATED ALWAYS AS (...) STORED,
    biaya_pemeliharaan NUMERIC GENERATED ALWAYS AS (...) STORED,
    biaya_penyusutan NUMERIC GENERATED ALWAYS AS (...) STORED,
    total_biaya NUMERIC GENERATED ALWAYS AS (...) STORED,
    total_biaya_tanpa_jp NUMERIC GENERATED ALWAYS AS (...) STORED,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. **data_kegiatan** (77 rows)
Data kegiatan operasional per unit kerja
```sql
CREATE TABLE data_kegiatan (
    id SERIAL PRIMARY KEY,
    "Kode_UK" VARCHAR(50),
    "Nama_Unit_Kerja" VARCHAR(255),
    tahun INTEGER,
    user_id UUID REFERENCES auth.users(id),
    
    -- SDM
    "SDM_dokter" INTEGER,
    "SDM_Perawat" INTEGER,
    "SDM_Non" INTEGER,
    "Jumlah_SDM" INTEGER GENERATED ALWAYS AS (...) STORED,
    
    -- Fasilitas
    "Listrik_kwh" DOUBLE PRECISION,
    "Air_m3" DOUBLE PRECISION,
    "Telepon_Freq_pakai_per_titik" INTEGER,
    "Komputer_simrs_user" INTEGER,
    
    -- Tempat Tidur
    "Tempat_Tidur_SVIP" INTEGER,
    "Tempat_Tidur_VIP" INTEGER,
    "Tempat_Tidur_I" INTEGER,
    "Tempat_Tidur_II" INTEGER,
    "Tempat_Tidur_III" INTEGER,
    "Tempat_Tidur_Khusus" INTEGER,
    
    -- Kegiatan
    "Kunjungan_Pasien_Lama" INTEGER,
    "Kunjungan_Pasien_Baru" INTEGER,
    "Total_Kunjungan_Pasien" INTEGER GENERATED ALWAYS AS (...) STORED,
    "Jumlah_Tindakan" INTEGER,
    
    -- Hari Rawat
    "Hari_Rawat_SVIP" INTEGER,
    "Hari_Rawat_VIP" INTEGER,
    "Hari_Rawat_I" INTEGER,
    "Hari_Rawat_II" INTEGER,
    "Hari_Rawat_III" INTEGER,
    "Jumlah_Hari_Rawat" INTEGER GENERATED ALWAYS AS (...) STORED,
    
    -- Data Gizi
    jumlah_porsi_svip INTEGER DEFAULT 0,
    jumlah_porsi_vip INTEGER DEFAULT 0,
    jumlah_porsi_i INTEGER DEFAULT 0,
    jumlah_porsi_ii INTEGER DEFAULT 0,
    jumlah_porsi_iii INTEGER DEFAULT 0,
    
    -- Luas Kamar
    kamar_luas_svip DOUBLE PRECISION DEFAULT 0,
    kamar_luas_vip DOUBLE PRECISION DEFAULT 0,
    kamar_luas_i DOUBLE PRECISION DEFAULT 0,
    kamar_luas_ii DOUBLE PRECISION DEFAULT 0,
    kamar_luas_iii DOUBLE PRECISION DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. **kalkulasi_biaya_akomodasi** (3 rows)
**TABEL UTAMA** - Kalkulasi biaya untuk waktu akomodasi
```sql
CREATE TABLE kalkulasi_biaya_akomodasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    kode_unit_kerja TEXT NOT NULL,
    nama_unit_kerja TEXT NOT NULL,
    
    -- Rasio Akomodasi
    rasio_akomodasi NUMERIC DEFAULT 0,
    
    -- Biaya Komponen (BIGINT)
    biaya_gaji_tunjangan BIGINT DEFAULT 0,
    biaya_jasa_pelayanan BIGINT DEFAULT 0,
    biaya_obat BIGINT DEFAULT 0,
    biaya_bhp BIGINT DEFAULT 0,
    biaya_makan_karyawan BIGINT DEFAULT 0,
    biaya_makan_pasien BIGINT DEFAULT 0,
    biaya_rumah_tangga BIGINT DEFAULT 0,
    biaya_cetak BIGINT DEFAULT 0,
    biaya_atk BIGINT DEFAULT 0,
    biaya_listrik BIGINT DEFAULT 0,
    biaya_air BIGINT DEFAULT 0,
    biaya_telp BIGINT DEFAULT 0,
    biaya_pemeliharaan_bangunan BIGINT DEFAULT 0,
    biaya_pemeliharaan_alat_medis BIGINT DEFAULT 0,
    biaya_pemeliharaan_alat_non_medis BIGINT DEFAULT 0,
    biaya_operasional_lainnya BIGINT DEFAULT 0,
    biaya_penyusutan_gedung BIGINT DEFAULT 0,
    biaya_penyusutan_jaringan BIGINT DEFAULT 0,
    biaya_penyusutan_alat_medis BIGINT DEFAULT 0,
    biaya_penyusutan_alat_non_medis BIGINT DEFAULT 0,
    biaya_pendidikan_pelatihan BIGINT DEFAULT 0,
    biaya_laundry BIGINT DEFAULT 0,
    biaya_sterilisasi BIGINT DEFAULT 0,
    biaya_tidak_langsung_terdistribusi BIGINT DEFAULT 0,
    alokasi_biaya_gizi BIGINT DEFAULT 0,
    
    -- Generated Column
    total_biaya_akomodasi BIGINT GENERATED ALWAYS AS (
        COALESCE(biaya_gaji_tunjangan, 0) + 
        COALESCE(biaya_jasa_pelayanan, 0) + 
        ... + 
        COALESCE(alokasi_biaya_gizi, 0)
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. **prosentase_akomodasi_tindakan** (3 rows)
Perhitungan rasio waktu akomodasi vs tindakan
```sql
CREATE TABLE prosentase_akomodasi_tindakan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    kode_unit_kerja TEXT NOT NULL,
    nama_unit_kerja TEXT NOT NULL,
    
    tindakan NUMERIC DEFAULT 0,
    akomodasi NUMERIC DEFAULT 0,
    
    -- Generated Columns
    rasio_tindakan NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN (tindakan + akomodasi) > 0 
            THEN ROUND((tindakan / (tindakan + akomodasi)) * 100, 2)
            ELSE 0
        END
    ) STORED,
    
    rasio_akomodasi NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN (tindakan + akomodasi) > 0 
            THEN ROUND((akomodasi / (tindakan + akomodasi)) * 100, 2)
            ELSE 0
        END
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6. **data_akomodasi_inap** (3 rows)
Alokasi biaya gizi per unit kerja rawat inap
```sql
CREATE TABLE data_akomodasi_inap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    kode_unit_kerja TEXT NOT NULL,
    nama_unit_kerja TEXT NOT NULL,
    
    -- AUC Gizi (Average Unit Cost)
    auc_gizi_vvip BIGINT DEFAULT 0,
    auc_gizi_vip BIGINT DEFAULT 0,
    auc_gizi_i BIGINT DEFAULT 0,
    auc_gizi_ii BIGINT DEFAULT 0,
    auc_gizi_iii BIGINT DEFAULT 0,
    
    -- Hari Rawat
    hari_rawat_vvip INTEGER DEFAULT 0,
    hari_rawat_vip INTEGER DEFAULT 0,
    hari_rawat_i INTEGER DEFAULT 0,
    hari_rawat_ii INTEGER DEFAULT 0,
    hari_rawat_iii INTEGER DEFAULT 0,
    
    -- Tempat Tidur
    tempat_tidur_svip INTEGER DEFAULT 0,
    tempat_tidur_vip INTEGER DEFAULT 0,
    tempat_tidur_i INTEGER DEFAULT 0,
    tempat_tidur_ii INTEGER DEFAULT 0,
    tempat_tidur_iii INTEGER DEFAULT 0,
    
    -- Jumlah Porsi
    jumlah_porsi_svip INTEGER DEFAULT 0,
    jumlah_porsi_vip INTEGER DEFAULT 0,
    jumlah_porsi_i INTEGER DEFAULT 0,
    jumlah_porsi_ii INTEGER DEFAULT 0,
    jumlah_porsi_iii INTEGER DEFAULT 0,
    
    -- Luas Kamar
    kamar_luas_svip DOUBLE PRECISION DEFAULT 0,
    kamar_luas_vip DOUBLE PRECISION DEFAULT 0,
    kamar_luas_i DOUBLE PRECISION DEFAULT 0,
    kamar_luas_ii DOUBLE PRECISION DEFAULT 0,
    kamar_luas_iii DOUBLE PRECISION DEFAULT 0,
    
    -- Generated Columns
    jumlah_kali_porsi_vvip BIGINT GENERATED ALWAYS AS (
        COALESCE(jumlah_porsi_svip, 0) * COALESCE(auc_gizi_vvip, 0)
    ) STORED,
    jumlah_kali_porsi_vip BIGINT GENERATED ALWAYS AS (
        COALESCE(jumlah_porsi_vip, 0) * COALESCE(auc_gizi_vip, 0)
    ) STORED,
    jumlah_kali_porsi_i BIGINT GENERATED ALWAYS AS (
        COALESCE(jumlah_porsi_i, 0) * COALESCE(auc_gizi_i, 0)
    ) STORED,
    jumlah_kali_porsi_ii BIGINT GENERATED ALWAYS AS (
        COALESCE(jumlah_porsi_ii, 0) * COALESCE(auc_gizi_ii, 0)
    ) STORED,
    jumlah_kali_porsi_iii BIGINT GENERATED ALWAYS AS (
        COALESCE(jumlah_porsi_iii, 0) * COALESCE(auc_gizi_iii, 0)
    ) STORED,
    
    total_gizi BIGINT GENERATED ALWAYS AS (
        jumlah_kali_porsi_vvip + 
        jumlah_kali_porsi_vip + 
        jumlah_kali_porsi_i + 
        jumlah_kali_porsi_ii + 
        jumlah_kali_porsi_iii
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 7. **distribusi_biaya_rekap** (5 rows)
Rekap distribusi biaya tidak langsung
```sql
CREATE TABLE distribusi_biaya_rekap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    biaya VARCHAR NOT NULL,
    tahun INTEGER DEFAULT 2025,
    urutan INTEGER,
    
    -- Kolom untuk setiap unit kerja pusat pendapatan
    uk037_ambulance NUMERIC DEFAULT 0,
    uk038_laboratorium_pk_pa NUMERIC DEFAULT 0,
    uk039_radiologi NUMERIC DEFAULT 0,
    uk040_farmasi NUMERIC DEFAULT 0,
    uk041_rehab_medik NUMERIC DEFAULT 0,
    uk042_gizi_dapur NUMERIC DEFAULT 0,
    uk043_laundry_cssd NUMERIC DEFAULT 0,
    uk044_bdrs NUMERIC DEFAULT 0,
    uk045_cathlab NUMERIC DEFAULT 0,
    uk046_terang_bulan_vip_vvip NUMERIC DEFAULT 0,
    uk047_truntum NUMERIC DEFAULT 0,
    uk048_sekarjagat NUMERIC DEFAULT 0,
    uk049_jlamprang NUMERIC DEFAULT 0,
    uk050_nifas NUMERIC DEFAULT 0,
    uk051_perinatologi NUMERIC DEFAULT 0,
    uk052_buketan NUMERIC DEFAULT 0,
    uk053_icu_picu_nicu NUMERIC DEFAULT 0,
    uk054_vk NUMERIC DEFAULT 0,
    uk055_igd_ponek NUMERIC DEFAULT 0,
    uk056_klinik_kebid_kandungan NUMERIC DEFAULT 0,
    uk057_klinik_bedah_mulut NUMERIC DEFAULT 0,
    uk058_klinik_syaraf NUMERIC DEFAULT 0,
    uk059_klinik_bedah_syaraf NUMERIC DEFAULT 0,
    uk060_klinik_bedah_digestif NUMERIC DEFAULT 0,
    uk061_klinik_bedah_umum NUMERIC DEFAULT 0,
    uk062_klinik_anak NUMERIC DEFAULT 0,
    uk063_klinik_penyakit_dalam NUMERIC DEFAULT 0,
    uk064_klinik_mata NUMERIC DEFAULT 0,
    uk065_klinik_kulit_kelamin NUMERIC DEFAULT 0,
    uk066_klinik_tht NUMERIC DEFAULT 0,
    uk067_klinik_gigi NUMERIC DEFAULT 0,
    uk068_klinik_jantung NUMERIC DEFAULT 0,
    uk069_klinik_dot_vct_cst NUMERIC DEFAULT 0,
    uk070_klinik_paru NUMERIC DEFAULT 0,
    uk071_klinik_orthopedi NUMERIC DEFAULT 0,
    uk072_klinik_jiwa NUMERIC DEFAULT 0,
    uk073_klinik_parikesit NUMERIC DEFAULT 0,
    uk074_ibs NUMERIC DEFAULT 0,
    uk075_pemulasaran_jenazah NUMERIC DEFAULT 0,
    uk076_hemodialisis NUMERIC DEFAULT 0,
    uk077_unit_diklat NUMERIC DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔗 Relasi Antar Tabel

### Foreign Key Relationships

#### **kalkulasi_biaya_akomodasi** → **prosentase_akomodasi_tindakan**
```sql
-- Relasi kompleks dengan multiple columns
fk_prosentase_akomodasi_tindakan:
  - user_id → prosentase_akomodasi_tindakan.user_id
  - tahun → prosentase_akomodasi_tindakan.tahun  
  - kode_unit_kerja → prosentase_akomodasi_tindakan.kode_unit_kerja
```

#### **data_akomodasi_inap** → **prosentase_akomodasi_tindakan**
```sql
fk_alokasi_gizi_prosentase_akomodasi:
  - user_id → prosentase_akomodasi_tindakan.user_id
  - tahun → prosentase_akomodasi_tindakan.tahun
  - kode_unit_kerja → prosentase_akomodasi_tindakan.kode_unit_kerja
```

#### **data_biaya** → **unit_kerja**
```sql
fk_data_biaya_unit_kerja:
  - unit_kerja_id → unit_kerja.id
```

## ⚙️ Fungsi dan Trigger

### 🔧 Fungsi Utama

#### 1. **populate_kalkulasi_biaya_akomodasi(p_user_id, p_tahun)**
**Fungsi utama** untuk menghitung biaya akomodasi
```sql
-- Menghitung biaya dari data_biaya * rasio_akomodasi / 100
-- Sumber data:
-- - prosentase_akomodasi_tindakan (rasio_akomodasi)
-- - data_biaya (biaya tahunan)
-- - distribusi_biaya_rekap (biaya tidak langsung)
-- - alokasi_biaya_gizi (total_gizi)

-- Rumus perhitungan:
biaya_gaji_tunjangan = ROUND(
    COALESCE(db.biaya_gaji_tunjangan, 0) * pat.rasio_akomodasi / 100
)::BIGINT
```

#### 2. **sync_data_akomodasi_inap()**
Sinkronisasi data dari tabel sumber
```sql
-- Update AUC gizi dari kalkulasi_biaya_gizi
-- Update hari_rawat dari data_kegiatan
-- Update tempat_tidur dari data_kegiatan
-- Update jumlah_porsi dari data_kegiatan
-- Update kamar_luas dari data_kegiatan
```

#### 3. **populate_alokasi_biaya_gizi(p_user_id, p_tahun)**
Populasi alokasi biaya gizi
```sql
-- Menghitung AUC gizi dari kalkulasi_biaya_gizi
-- Mengambil hari_rawat dari data_kegiatan
-- Menyimpan ke data_akomodasi_inap
```

### 🎯 Trigger

#### 1. **trigger_populate_kalkulasi_biaya_akomodasi**
```sql
-- Dipicu saat INSERT/UPDATE pada prosentase_akomodasi_tindakan
-- Memanggil populate_kalkulasi_biaya_akomodasi()
```

#### 2. **trigger_sync_data_akomodasi_inap**
```sql
-- Dipicu saat INSERT/UPDATE pada data_kegiatan
-- Memanggil sync_data_akomodasi_inap()
```

#### 3. **trigger_sync_data_akomodasi_inap_gizi**
```sql
-- Dipicu saat INSERT/UPDATE pada kalkulasi_biaya_gizi
-- Memanggil sync_data_akomodasi_inap()
```

## 📊 Perhitungan Biaya Akomodasi

### 🧮 Rumus Utama

#### **biaya_gaji_tunjangan** di `kalkulasi_biaya_akomodasi`:
```sql
biaya_gaji_tunjangan = ROUND(
    COALESCE(data_biaya.biaya_gaji_tunjangan, 0) * 
    prosentase_akomodasi_tindakan.rasio_akomodasi / 100
)::BIGINT
```

#### **total_biaya_akomodasi** (Generated Column):
```sql
total_biaya_akomodasi = 
    biaya_gaji_tunjangan + 
    biaya_jasa_pelayanan + 
    biaya_obat + 
    biaya_bhp + 
    ... + 
    alokasi_biaya_gizi
```

#### **total_gizi** di `data_akomodasi_inap`:
```sql
total_gizi = 
    (jumlah_porsi_svip * auc_gizi_vvip) +
    (jumlah_porsi_vip * auc_gizi_vip) +
    (jumlah_porsi_i * auc_gizi_i) +
    (jumlah_porsi_ii * auc_gizi_ii) +
    (jumlah_porsi_iii * auc_gizi_iii)
```

## 🔄 Alur Data

### 1. **Input Data**
- `data_biaya` → Biaya tahunan per unit kerja
- `data_kegiatan` → Data operasional (hari rawat, tempat tidur, dll)
- `prosentase_akomodasi_tindakan` → Rasio waktu akomodasi

### 2. **Proses Kalkulasi**
- `populate_kalkulasi_biaya_akomodasi()` → Hitung biaya akomodasi
- `sync_data_akomodasi_inap()` → Sinkronisasi data
- `populate_alokasi_biaya_gizi()` → Alokasi biaya gizi

### 3. **Output**
- `kalkulasi_biaya_akomodasi` → Biaya akomodasi per unit kerja
- `data_akomodasi_inap` → Alokasi biaya gizi per kelas

## 📈 Contoh Perhitungan

### Unit Kerja: UK046 (Terang bulan VIP-VVIP)
```
Biaya Gaji Tunjangan dari data_biaya: 501,139,891
Rasio Akomodasi: 99.76%

Perhitungan:
biaya_gaji_tunjangan = ROUND(501,139,891 * 99.76 / 100) = 499,937,155

Verifikasi: ✅ SESUAI
```

## 🛡️ Security & Constraints

### Row Level Security (RLS)
- Semua tabel memiliki RLS enabled
- Akses berdasarkan `user_id`

### Constraints
- `unit_kerja.kode` → Format UK### (UK001, UK002, dst.)
- `unit_kerja.kategori` → 'Pusat Biaya' atau 'Pusat Pendapatan'
- `unit_kerja.jenis` → 1=Rawat Jalan, 2=Rawat Inap, 3=Operatif, 4=Non Layanan

## 📝 Catatan Penting

1. **Generated Columns**: Tabel menggunakan generated columns untuk perhitungan otomatis
2. **Trigger Automation**: Perhitungan otomatis via trigger saat data berubah
3. **Multi-User**: Sistem mendukung multiple user dengan RLS
4. **Data Integrity**: Foreign key constraints menjaga integritas data
5. **Performance**: Index pada kolom yang sering di-query

## 🔍 Monitoring & Maintenance

### Query untuk Monitoring
```sql
-- Cek data kalkulasi_biaya_akomodasi
SELECT * FROM kalkulasi_biaya_akomodasi 
WHERE tahun = 2024;

-- Verifikasi perhitungan
SELECT 
    kba.kode_unit_kerja,
    kba.biaya_gaji_tunjangan as hasil_kalkulasi,
    ROUND(db.biaya_gaji_tunjangan * pat.rasio_akomodasi / 100) as perhitungan_manual,
    CASE 
        WHEN kba.biaya_gaji_tunjangan = ROUND(db.biaya_gaji_tunjangan * pat.rasio_akomodasi / 100)
        THEN 'SESUAI' 
        ELSE 'TIDAK SESUAI' 
    END as status_verifikasi
FROM kalkulasi_biaya_akomodasi kba
LEFT JOIN data_biaya db ON db.kode_unit_kerja = kba.kode_unit_kerja 
LEFT JOIN prosentase_akomodasi_tindakan pat ON pat.kode_unit_kerja = kba.kode_unit_kerja;
```

---

**Dokumentasi ini mencakup struktur database lengkap untuk sistem unit cost rumah sakit dengan fokus pada kalkulasi biaya akomodasi dan alokasi biaya gizi.**
