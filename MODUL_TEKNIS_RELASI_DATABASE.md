# 📋 MODUL TEKNIS - RELASI ANTAR TABEL DATABASE

## 🎯 OVERVIEW

Dokumentasi ini menjelaskan struktur database aplikasi Unit Cost RS, termasuk relasi antar tabel, constraints, dan diagram ERD (Entity Relationship Diagram).

---

## 🗄️ ARSITEKTUR DATABASE

### **Database Engine**
- **PostgreSQL** via Supabase
- **Row Level Security (RLS)** enabled untuk semua tabel
- **UUID** sebagai primary key untuk tabel baru
- **Generated Columns** untuk kalkulasi otomatis
- **Triggers** untuk validasi dan kalkulasi real-time

### **Schema Overview**
```
Database: Aplikasi Unit Cost RS
├── Schema: public (main application tables)
├── Schema: auth (Supabase authentication)
└── Extensions: uuid-ossp, pgcrypto
```

---

## 📊 DIAGRAM ERD (ENTITY RELATIONSHIP DIAGRAM)

### **Master Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA OVERVIEW                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   AUTH.USERS    │◄───┤  PUBLIC.PROFILES │    │ UNIT_KERJA      │            │
│  │   (Supabase)    │    │                 │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                       │                       │                   │
│           │                       │                       │                   │
│           ▼                       ▼                       ▼                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   DATA_BIAYA    │    │ DATA_PENDAPATAN │    │   DATA_KEGIATAN │            │
│  │                 │    │                 │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                       │                       │                   │
│           │                       │                       │                   │
│           ▼                       ▼                       ▼                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ DISTRIBUSI_BIYA │    │   COST_RECOVERY │    │ REKAPITULASI_UC │            │
│  │    PERTAMA      │    │                 │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                       │                       │                   │
│           │                       │                       │                   │
│           ▼                       ▼                       ▼                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ DISTRIBUSI_BIYA │    │  SKENARIO_TARIF │    │ PRODUK_LAYANAN  │            │
│  │     KEDUA       │    │                 │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ KATEGORI TABEL

### **1. Master Data Tables**

#### **A. Unit Kerja & Organisasi**
```sql
-- Tabel Unit Kerja (Core Table)
unit_kerja
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── kode (TEXT, UNIQUE, CHECK: UK###)
├── nama (TEXT)
├── lokasi (TEXT)
├── luas_ruangan (NUMERIC)
├── kategori (TEXT, CHECK: 'Pusat Biaya' | 'Pusat Pendapatan')
├── jenis (SMALLINT, CHECK: 1|2|3|4)
└── created_at, updated_at (TIMESTAMPTZ)

-- Keterangan jenis:
-- 1 = rawat jalan
-- 2 = rawat inap  
-- 3 = operatif
-- 4 = non layanan
```

#### **B. Data Master Layanan**
```sql
-- Daftar Tindakan (Master Tindakan Medis)
daftar_tindakan
├── id (UUID, PK)
├── kode_tindakan (VARCHAR, UNIQUE, CHECK: T.###)
├── nama_tindakan (VARCHAR)
├── medis (BOOLEAN) - dilakukan oleh medis
├── paramedis (BOOLEAN) - dilakukan oleh paramedis
├── bahan_tindakan (JSONB) - array bahan
├── biaya_bahan_tindakan (INTEGER) - auto-calculated
├── waktu (INTEGER) - dalam menit
├── profesionalisme (SMALLINT, 1-4)
├── tingkat_kesulitan (SMALLINT, 1-5)
└── created_at, updated_at (TIMESTAMPTZ)

-- Tindakan Laboratorium
tindakan_laboratorium
├── id (UUID, PK)
├── jenis (ENUM: 'PK'|'PA'|'Mi')
├── kode (TEXT, UNIQUE)
├── nama (TEXT)
└── created_at (TIMESTAMPTZ)

-- Tindakan Radiologi
tindakan_radiologi
├── id (UUID, PK)
├── kode_tindakan (TEXT, UNIQUE, CHECK: Rad.###)
├── nama_tindakan (TEXT)
└── created_at, updated_at (TIMESTAMPTZ)

-- Tindakan Operatif
tindakan_operatif
├── id (UUID, PK)
├── kode_jenis (SMALLINT, CHECK: 1|2|3)
├── kode_operator_spesialistik (VARCHAR)
├── nama_operator_spesialistik (VARCHAR)
├── kode_tindakan_operatif (VARCHAR, UNIQUE)
├── nama_tindakan_operatif (VARCHAR)
└── created_at, updated_at (TIMESTAMPTZ)

-- Tindakan BDRS
tindakan_bdrs
├── kode (TEXT, PK, CHECK: BDRS.##)
└── nama (TEXT)

-- Tindakan Cathlab
tindakan_cathlab
├── id (UUID, PK)
├── kode_tindakan (TEXT, UNIQUE, CHECK: CL.###)
├── nama_tindakan (TEXT)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### **C. Data Master Barang & Gizi**
```sql
-- Data Barang Farmasi
data_barang_farmasi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── kode_barang (TEXT, UNIQUE)
├── nama_barang (TEXT)
├── gudang (TEXT, CHECK: 'obat'|'bhp')
├── satuan (TEXT)
├── harga (NUMERIC)
└── created_at, updated_at (TIMESTAMPTZ)

-- Data Barang Gizi
data_barang_gizi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── kode_barang (TEXT, UNIQUE)
├── nama_barang (TEXT)
├── satuan (TEXT)
├── harga (NUMERIC)
└── created_at, updated_at (TIMESTAMPTZ)

-- Menu Gizi
menu_gizi
├── id (INTEGER, PK)
├── kode_makanan (VARCHAR, UNIQUE, CHECK: gz.###)
├── nama_makanan (VARCHAR)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### **D. Data Master Infrastruktur**
```sql
-- Data Kamar
Data_Kamar
├── id (INTEGER, PK)
├── Kode_Kamar (VARCHAR, UNIQUE, CHECK: RI.###)
├── Nama_Kamar (VARCHAR)
├── Kelas_SVIP (BOOLEAN)
├── Kelas_VIP (BOOLEAN)
├── Kelas_I (BOOLEAN)
├── Kelas_II (BOOLEAN)
├── Kelas_III (BOOLEAN)
├── Kelas_Khusus (BOOLEAN)
└── created_at, updated_at (TIMESTAMPTZ)

-- Klinik
klinik
├── kode_klinik (TEXT, PK, CHECK: RJ.###)
├── nama_klinik (TEXT)
├── Layanan_BPJS_Kes (BOOLEAN)
└── Layanan_Umum_Asuransi (BOOLEAN)

-- Data Diklat
data_diklat
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── kode_strata (TEXT, CHECK: L1|L2|L3|L4|L5)
├── kode_materi (TEXT, UNIQUE)
├── nama_materi (TEXT)
└── created_at, updated_at (TIMESTAMPTZ)
```

### **2. Data Operasional Tables**

#### **A. Data Kegiatan**
```sql
-- Data Kegiatan (Operasional Harian)
data_kegiatan
├── id (INTEGER, PK)
├── Kode_UK (VARCHAR) - Kode Unit Kerja
├── Nama_Unit_Kerja (VARCHAR)
├── Jml_jam_Praktek_Harian (INTEGER)
├── SDM_dokter (INTEGER)
├── SDM_Perawat (INTEGER)
├── SDM_Non (INTEGER)
├── Listrik_kwh (DOUBLE PRECISION)
├── Air_m3 (DOUBLE PRECISION)
├── Telepon_Freq_pakai_per_titik (INTEGER)
├── Komputer_simrs_user (INTEGER)
├── Tempat_Tidur_SVIP (INTEGER)
├── Tempat_Tidur_VIP (INTEGER)
├── Tempat_Tidur_I (INTEGER)
├── Tempat_Tidur_II (INTEGER)
├── Tempat_Tidur_III (INTEGER)
├── Tempat_Tidur_Khusus (INTEGER)
├── Kunjungan_Pasien_Lama (INTEGER)
├── Kunjungan_Pasien_Baru (INTEGER)
├── Jumlah_Tindakan (INTEGER)
├── Resep_Lembar_Resep (INTEGER)
├── Cucian_kg_Cucian (DOUBLE PRECISION)
├── Instrumen_Besar (INTEGER)
├── Instrumen_Sedang (INTEGER)
├── Instrumen_Kecil (INTEGER)
├── Set_Pack_Besar (INTEGER)
├── Set_Pack_Sedang (INTEGER)
├── Set_Pack_Kecil (INTEGER)
├── Makanan_Karyawan_jml_Porsi (INTEGER)
├── Makanan_Pasien_jml_Porsi (INTEGER)
├── Hari_Rawat_SVIP (INTEGER)
├── Hari_Rawat_VIP (INTEGER)
├── Hari_Rawat_I (INTEGER)
├── Hari_Rawat_II (INTEGER)
├── Hari_Rawat_III (INTEGER)
├── tahun (INTEGER)
├── Diklat_Jumlah_Siswa (INTEGER)
├── Diklat_Lama_Hari (INTEGER)
├── Jenis (TEXT, CHECK: 'Rawat Jalan'|'Rawat Inap'|'Operatif'|'Non Layanan')
├── user_id (UUID, FK → auth.users)
├── unit_kerja_pusat_biaya (TEXT)
├── biaya_tahunan (NUMERIC)
├── dasar_alokasi (TEXT)
├── jumlah_porsi_svip (INTEGER)
├── jumlah_porsi_vip (INTEGER)
├── jumlah_porsi_i (INTEGER)
├── jumlah_porsi_ii (INTEGER)
├── jumlah_porsi_iii (INTEGER)
├── kamar_luas_svip (DOUBLE PRECISION)
├── kamar_luas_vip (DOUBLE PRECISION)
├── kamar_luas_i (DOUBLE PRECISION)
├── kamar_luas_ii (DOUBLE PRECISION)
├── kamar_luas_iii (DOUBLE PRECISION)
└── Generated Columns:
    ├── Jumlah_SDM = SDM_dokter + SDM_Perawat + SDM_Non
    ├── Total_Kunjungan_Pasien = Kunjungan_Pasien_Lama + Kunjungan_Pasien_Baru
    ├── Total_Diklat = Diklat_Jumlah_Siswa * Diklat_Lama_Hari
    └── Jumlah_Hari_Rawat = SUM semua Hari_Rawat_*
```

#### **B. Data Biaya**
```sql
-- Data Biaya (Biaya Operasional)
data_biaya
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── transaksi_ref_id (INTEGER)
├── unit_kerja_id (UUID, FK → unit_kerja)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── tahun (INTEGER)
├── Biaya Langsung:
│   ├── biaya_gaji_tunjangan (NUMERIC)
│   ├── biaya_jasa_pelayanan (NUMERIC)
│   ├── biaya_obat (NUMERIC)
│   ├── biaya_bhp (NUMERIC)
│   ├── biaya_makan_karyawan (NUMERIC)
│   ├── biaya_makan_pasien (NUMERIC)
│   ├── biaya_rumah_tangga (NUMERIC)
│   ├── biaya_cetak (NUMERIC)
│   ├── biaya_atk (NUMERIC)
│   ├── biaya_listrik (NUMERIC)
│   ├── biaya_air (NUMERIC)
│   ├── biaya_telp (NUMERIC)
│   ├── biaya_pemeliharaan_bangunan (NUMERIC)
│   ├── biaya_pemeliharaan_alat_medis (NUMERIC)
│   ├── biaya_pemeliharaan_alat_non_medis (NUMERIC)
│   ├── biaya_operasional_lainnya (NUMERIC)
│   ├── biaya_penyusutan_gedung (NUMERIC)
│   ├── biaya_penyusutan_jaringan (NUMERIC)
│   ├── biaya_penyusutan_alat_medis (NUMERIC)
│   ├── biaya_penyusutan_alat_non_medis (NUMERIC)
│   ├── biaya_pendidikan_pelatihan (NUMERIC)
│   ├── biaya_laundry (NUMERIC)
│   └── biaya_sterilisasi (NUMERIC)
└── Generated Columns:
    ├── biaya_bahan = obat + bhp + makanan_karyawan + makanan_pasien + rumah_tangga + atk + cetak
    ├── biaya_pegawai = gaji_tunjangan + jasa_pelayanan + pendidikan_pelatihan
    ├── biaya_daya = listrik + air + telepon
    ├── biaya_pemeliharaan = bangunan + alat_medis + alat_non_medis
    ├── biaya_penyusutan = gedung + jaringan + alat_medis + alat_non_medis
    ├── total_biaya = SUM semua biaya individual
    └── total_biaya_tanpa_jp = total_biaya - biaya_jasa_pelayanan
```

#### **C. Data Pendapatan**
```sql
-- Data Pendapatan
data_pendapatan
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── unit_kerja_id (UUID, FK → unit_kerja)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── pendapatan_umum (NUMERIC)
├── pendapatan_bpjs (NUMERIC)
├── tahun (INTEGER)
└── Generated Column:
    └── total_pendapatan = pendapatan_umum + pendapatan_bpjs
```

### **3. Kalkulasi Unit Cost Tables**

#### **A. Unit Penunjang**
```sql
-- Kalkulasi Biaya Gizi
kalkulasi_biaya_gizi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode (TEXT)
├── jenis_makanan (TEXT)
├── waktu_meracik (INTEGER)
├── waktu_memasak (INTEGER)
├── waktu_menata (INTEGER)
├── bahan_porsi (JSONB)
├── dasar_alokasi_waktu (NUMERIC)
├── semua biaya operasional (INTEGER)
├── jumlah_svip, jumlah_vip, jumlah_kelas_i, jumlah_kelas_ii, jumlah_kelas_iii (INTEGER)
└── Generated Columns:
    ├── waktu_total = waktu_meracik + waktu_memasak + waktu_menata
    ├── jumlah = SUM semua jumlah_kelas_*
    ├── hasil_kali_waktu = jumlah * waktu_total
    ├── biaya_bahan_porsi_numeric = SUM dari JSON bahan_porsi
    ├── unit_cost_per_porsi = SUM semua biaya
    └── tuc_gizi_*, auc_gizi_* (kelas-specific costs)

-- Kalkulasi Biaya Laboratorium
kalkulasi_biaya_laboratorium
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode (TEXT)
├── jenis_pemeriksaan (TEXT)
├── bahan_porsi (JSONB)
├── jumlah (INTEGER)
├── dasar_alokasi_waktu (NUMERIC)
├── hasil_kali_waktu (NUMERIC)
├── semua biaya operasional (BIGINT)
├── waktu_pemeriksaan (INTEGER)
├── profesionalisme (INTEGER)
├── tingkat_kesulitan (INTEGER)
├── hasil_kali (INTEGER)
├── dasar_alokasi_hasil_kali (NUMERIC)
├── bahan_pemeriksaan (JSONB)
├── biaya_bahan_pemeriksaan_numeric (INTEGER)
├── kode_unit_kerja (TEXT, DEFAULT: 'UK038')
└── Generated Column:
    └── unit_cost_per_pemeriksaan = SUM semua biaya

-- Kalkulasi Biaya Radiologi
kalkulasi_biaya_radiologi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode (TEXT, CHECK: Rad.###)
├── jenis_pemeriksaan (TEXT)
├── bahan_pemeriksaan (JSONB)
├── jumlah (INTEGER)
├── dasar_alokasi_waktu (NUMERIC)
├── hasil_kali_waktu (NUMERIC)
├── semua biaya operasional (BIGINT)
├── waktu_pemeriksaan (INTEGER)
├── profesionalisme (INTEGER)
├── tingkat_kesulitan (INTEGER)
├── hasil_kali (INTEGER)
├── dasar_alokasi_hasil_kali (NUMERIC)
├── biaya_bahan_pemeriksaan_numeric (INTEGER)
├── biaya_tidak_langsung_terdistribusi (BIGINT)
├── kode_unit_kerja (TEXT, DEFAULT: 'UK039')
├── nama_unit_kerja (TEXT, DEFAULT: 'Radiologi')
└── Generated Column:
    └── unit_cost_per_pemeriksaan = SUM semua biaya

-- Kalkulasi BDRS
kalkulasi_bdrs
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode (TEXT, CHECK: BDRS.##)
├── jenis_pemeriksaan (TEXT)
├── bahan_pemeriksaan (JSONB)
├── jumlah (INTEGER)
├── dasar_alokasi_waktu (NUMERIC)
├── hasil_kali_waktu (NUMERIC)
├── semua biaya operasional (BIGINT)
├── waktu_pemeriksaan (INTEGER)
├── profesionalisme (INTEGER)
├── tingkat_kesulitan (INTEGER)
├── hasil_kali (INTEGER)
├── dasar_alokasi_hasil_kali (NUMERIC)
├── biaya_bahan_pemeriksaan_numeric (INTEGER)
├── biaya_tidak_langsung_terdistribusi (BIGINT)
├── kode_unit_kerja (TEXT, DEFAULT: 'UK044')
├── nama_unit_kerja (TEXT, DEFAULT: 'BDRS')
└── Generated Column:
    └── unit_cost_per_pemeriksaan = SUM semua biaya
```

#### **B. Unit Keperawatan**
```sql
-- Jenis Tindakan Inap
jenis_tindakan_inap
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── kode_jenis (SMALLINT, CHECK: 2) - rawat inap
├── kode_unit_kerja (TEXT, FK → unit_kerja.kode)
├── nama_unit_kerja (TEXT)
├── kode_jenis_tindakan (VARCHAR, FK → daftar_tindakan.kode_tindakan)
├── jenis_tindakan (VARCHAR)
├── jumlah (INTEGER, CHECK: >= 0)
├── waktu (INTEGER)
├── profesionalisme (SMALLINT, 1-4)
├── tingkat_kesulitan (SMALLINT, 1-5)
├── biaya_bahan_tindakan (INTEGER)
└── Generated Columns:
    ├── hasil_kali_waktu = jumlah * waktu
    ├── hasil_kali = jumlah * waktu * profesionalisme * tingkat_kesulitan

-- Kalkulasi Tindakan Inap
kalkulasi_tindakan_inap
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_jenis (SMALLINT)
├── kode_unit_kerja (TEXT, FK → unit_kerja.kode)
├── nama_unit_kerja (TEXT)
├── kode_jenis_tindakan (VARCHAR, FK → daftar_tindakan.kode_tindakan)
├── jenis_tindakan (VARCHAR)
├── jumlah (INTEGER)
├── waktu (INTEGER)
├── profesionalisme (SMALLINT)
├── tingkat_kesulitan (SMALLINT)
├── hasil_kali_waktu (INTEGER)
├── hasil_kali (INTEGER)
├── biaya_bahan_tindakan (INTEGER)
├── kali_bahan (BIGINT)
├── rasio_tindakan (NUMERIC)
├── dasar_alokasi_kali_waktu (NUMERIC)
├── dasar_alokasi_hasil_kali (NUMERIC)
├── semua biaya operasional (BIGINT)
└── Generated Column:
    └── unit_cost_tindakan_inap = SUM semua biaya

-- Prosentase Akomodasi Tindakan
prosentase_akomodasi_tindakan
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── tindakan (NUMERIC) - total waktu tindakan
├── akomodasi (NUMERIC) - waktu akomodasi
└── Generated Columns:
    ├── rasio_tindakan = (tindakan / (tindakan + akomodasi)) * 100
    └── rasio_akomodasi = (akomodasi / (tindakan + akomodasi)) * 100

-- Kalkulasi Biaya Akomodasi
kalkulasi_biaya_akomodasi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── semua biaya operasional (BIGINT)
├── rasio_akomodasi (NUMERIC)
├── alokasi_biaya_gizi (BIGINT)
└── Generated Column:
    └── total_biaya_akomodasi = SUM semua biaya

-- Data Akomodasi Inap
data_akomodasi_inap
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── auc_gizi_vvip, auc_gizi_vip, auc_gizi_i, auc_gizi_ii, auc_gizi_iii (BIGINT)
├── hari_rawat_vvip, hari_rawat_vip, hari_rawat_i, hari_rawat_ii, hari_rawat_iii (INTEGER)
├── tempat_tidur_* (INTEGER)
├── jumlah_porsi_* (INTEGER)
├── kamar_luas_* (DOUBLE PRECISION)
└── Generated Columns:
    ├── jumlah_kali_porsi_* = jumlah_porsi_* * auc_gizi_*
    └── total_gizi = SUM semua jumlah_kali_porsi_*

-- Kalkulasi Biaya Kelas Akomodasi
kalkulasi_biaya_kelas_akomodasi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── kelas (TEXT)
├── dasar_alokasi_hari_rawat (NUMERIC)
├── semua biaya operasional (BIGINT)
├── alokasi_biaya_gizi (BIGINT)
├── rata_rata_uc_kelas_* (NUMERIC)
├── dasar_alokasi_tempat_tidur (NUMERIC)
├── dasar_alokasi_luas_kamar (NUMERIC)
└── Generated Column:
    └── unit_cost_per_kelas = SUM semua biaya
```

#### **C. Unit Pelayanan**
```sql
-- Jenis Tindakan Rawat Jalan
jenis_tindakan_rawat_jalan
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── kode_jenis (SMALLINT, CHECK: 1) - rawat jalan
├── kode_unit_kerja (TEXT, FK → unit_kerja.kode)
├── nama_unit_kerja (TEXT)
├── kode_jenis_tindakan (VARCHAR, FK → daftar_tindakan.kode_tindakan)
├── jenis_tindakan (VARCHAR)
├── jumlah (INTEGER, CHECK: >= 0)
├── waktu (INTEGER)
├── profesionalisme (SMALLINT, 1-4)
├── tingkat_kesulitan (SMALLINT, 1-5)
├── biaya_bahan_tindakan (INTEGER)
└── Generated Columns:
    ├── hasil_kali_waktu = jumlah * waktu
    ├── hasil_kali = jumlah * waktu * profesionalisme * tingkat_kesulitan

-- Kalkulasi Tindakan Rawat Jalan
kalkulasi_tindakan_rawat_jalan
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_jenis (SMALLINT, CHECK: 1)
├── kode_unit_kerja (TEXT, FK → unit_kerja.kode)
├── nama_unit_kerja (TEXT)
├── kode_jenis_tindakan (VARCHAR, FK → daftar_tindakan.kode_tindakan)
├── jenis_tindakan (VARCHAR)
├── jumlah (INTEGER)
├── waktu (INTEGER)
├── profesionalisme (SMALLINT)
├── tingkat_kesulitan (SMALLINT)
├── hasil_kali_waktu (INTEGER)
├── hasil_kali (INTEGER)
├── biaya_bahan_tindakan (INTEGER)
├── kali_bahan (BIGINT)
├── dasar_alokasi_kali_waktu (NUMERIC)
├── dasar_alokasi_hasil_kali (NUMERIC)
├── semua biaya operasional (BIGINT)
└── Generated Column:
    └── unit_cost_tindakan_rawat_jalan = SUM semua biaya

-- Kalkulasi Biaya Operatif
kalkulasi_biaya_operatif
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode (TEXT)
├── kode_operator_spesialistik (TEXT)
├── nama_operator_spesialistik (TEXT)
├── jenis_pemeriksaan (TEXT)
├── bahan_pemeriksaan (JSONB)
├── jumlah (INTEGER)
├── waktu_pemeriksaan (INTEGER)
├── profesionalisme (INTEGER)
├── tingkat_kesulitan (INTEGER)
├── hasil_kali (INTEGER)
├── hasil_kali_waktu (NUMERIC)
├── dasar_alokasi_waktu (NUMERIC)
├── dasar_alokasi_hasil_kali (NUMERIC)
├── semua biaya operasional (BIGINT)
├── biaya_bahan_pemeriksaan_numeric (INTEGER)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── kode_jenis (SMALLINT, CHECK: 1|2|3)
└── Generated Column:
    └── unit_cost_per_tindakan = SUM semua biaya

-- Kalkulasi Biaya Cathlab
kalkulasi_biaya_cathlab
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode (TEXT, CHECK: CL.###)
├── jenis_pemeriksaan (TEXT)
├── bahan_pemeriksaan (JSONB)
├── jumlah (INTEGER)
├── waktu_pemeriksaan (INTEGER)
├── profesionalisme (INTEGER)
├── tingkat_kesulitan (INTEGER)
├── hasil_kali (INTEGER)
├── hasil_kali_waktu (NUMERIC)
├── dasar_alokasi_waktu (NUMERIC)
├── dasar_alokasi_hasil_kali (NUMERIC)
├── semua biaya operasional (BIGINT)
├── biaya_bahan_pemeriksaan_numeric (INTEGER)
├── biaya_tidak_langsung_terdistribusi (BIGINT)
├── kode_unit_kerja (TEXT, DEFAULT: 'UK045')
├── nama_unit_kerja (TEXT, DEFAULT: 'Cathlab')
└── Generated Column:
    └── unit_cost_per_tindakan = SUM semua biaya

-- Kalkulasi Daftar dan Resep
kalkulasi_daftar_dan_resep
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER, DEFAULT: 2025)
├── jenis_layanan (TEXT, CHECK: 'Pendaftaran Rawat Jalan'|'Peresepan Rawat Jalan'|'Pendaftaran Rawat Inap'|'Peresepan Rawat Inap'|'Peresepan Farmasi')
├── biaya_layanan (NUMERIC)
├── biaya_unit (NUMERIC)
├── biaya_distribusi_kedua (NUMERIC)
├── total_biaya_unit (NUMERIC)
├── jumlah_pembagi (NUMERIC)
└── created_at, updated_at (TIMESTAMPTZ)
```

### **4. Distribusi Biaya Tables**

#### **A. Dasar Alokasi**
```sql
-- Dasar Alokasi
Dasar_Alokasi
├── id (INTEGER, PK)
├── Kode_UK (TEXT)
├── Tahun (INTEGER)
├── Dasar_Alokasi_Field (TEXT)
├── Dasar_Alokasi_Value (NUMERIC)
└── created_at, updated_at (TIMESTAMPTZ)

-- Mapping Dasar Alokasi
mapping_dasar_alokasi
├── id (INTEGER, PK)
├── kode_unit_kerja (TEXT, UNIQUE)
├── nama_unit_kerja (TEXT)
├── dasar_alokasi (TEXT, CHECK: 'Total_SDM'|'Total_Kunjungan'|'Total_Kunjungan_Pasien'|'Luas_Ruangan'|'Komputer_simrs_user')
└── created_at, updated_at (TIMESTAMPTZ)
```

#### **B. Distribusi Biaya**
```sql
-- Distribusi Biaya Pertama
distribusi_biaya_pertama
├── id (UUID, PK)
├── unit_kerja_pusat_biaya (TEXT)
├── user_id (UUID, FK → auth.users)
├── biaya_tahunan (NUMERIC)
├── dasar_alokasi (TEXT)
├── keterangan (TEXT)
├── uk001_direktur sampai uk077_unit_diklat (NUMERIC, DEFAULT: 0)
├── tahun (INTEGER, DEFAULT: 2025)
├── audit_check (TEXT)
├── jumlah_biaya_terdistribusi_i (NUMERIC)
└── created_at, updated_at (TIMESTAMPTZ)

-- Total Alokasi Biaya Pertama
total_alokasi_biaya_pertama
├── id (UUID, PK)
├── unit_kerja_kode (VARCHAR)
├── unit_kerja_nama (VARCHAR)
├── uk001_direktur sampai uk077_unit_diklat (NUMERIC, DEFAULT: 0)
├── total_alokasi_i (NUMERIC)
├── tahun (INTEGER, DEFAULT: 2025)
└── created_at, updated_at (TIMESTAMPTZ)

-- Distribusi Biaya Kedua
distribusi_biaya_kedua
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── biaya_alokasi_i (NUMERIC)
├── dasar_alokasi (TEXT)
├── keterangan (TEXT)
├── uk037_ambulance sampai uk077_unit_diklat (NUMERIC, DEFAULT: 0)
├── tahun (INTEGER, DEFAULT: 2025)
├── total_alokasi_i (NUMERIC, DEFAULT: 0)
├── audit_check (TEXT)
├── distribusi_biaya_pertama_id (UUID, FK → distribusi_biaya_pertama)
├── unit_kerja_pusat_biaya (TEXT)
├── total_alokasi_biaya_kedua (NUMERIC, DEFAULT: 0)
└── created_at, updated_at (TIMESTAMPTZ)

-- Distribusi Biaya Rekap
distribusi_biaya_rekap
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── biaya (VARCHAR)
├── uk037_ambulance sampai uk077_unit_diklat (NUMERIC, DEFAULT: 0)
├── tahun (INTEGER, DEFAULT: 2025)
├── urutan (INTEGER)
└── created_at, updated_at (TIMESTAMPTZ)

-- Data Kegiatan Transpose
data_kegiatan_transpose
├── id (INTEGER)
├── dasar_alokasi (VARCHAR)
├── sub_kategori (VARCHAR)
├── semua unit kerja (DOUBLE PRECISION)
├── tahun (INTEGER)
├── total_dasar_alokasi (DOUBLE PRECISION) - Generated
├── total_dasar_alokasi_pusat_pendapatan (DOUBLE PRECISION)
├── total_dasar_alokasi_pusat_biaya (DOUBLE PRECISION)
└── created_at, updated_at (TIMESTAMPTZ)

-- Distribusi Biaya Pertama Norm
distribusi_biaya_pertama_norm
├── id (BIGINT, PK)
├── tahun (INTEGER)
├── pusat_unit_kerja_id (UUID)
├── pusat_kode (TEXT)
├── pusat_nama (TEXT)
├── dasar_alokasi (TEXT)
├── biaya_tahunan (NUMERIC)
├── target_unit_kerja_id (UUID)
├── target_kode (TEXT)
├── target_nama (TEXT)
├── alokasi (NUMERIC)
└── created_at, updated_at (TIMESTAMPTZ)
```

### **5. Rekapitulasi & Reporting Tables**

#### **A. Rekapitulasi Unit Cost**
```sql
-- Rekapitulasi Unit Cost
rekapitulasi_unit_cost
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_jenis (SMALLINT)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── kode_operator (TEXT)
├── nama_operator (TEXT)
├── kode_tindakan (TEXT)
├── nama_tindakan (TEXT)
├── biaya_bahan (BIGINT)
├── unit_cost_per_tindakan (BIGINT)
├── sumber_tabel (TEXT, CHECK: 'kalkulasi_biaya_laboratorium'|'kalkulasi_biaya_radiologi'|'kalkulasi_bdrs'|'kalkulasi_tindakan_inap'|'kalkulasi_tindakan_rawat_jalan'|'kalkulasi_tindakan_operatif'|'kalkulasi_biaya_cathlab')
└── created_at, updated_at (TIMESTAMPTZ)
```

#### **B. Skenario Tarif**
```sql
-- Skenario Tarif
skenario_tarif
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── kode_jenis (SMALLINT)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── kode_operator (TEXT)
├── nama_operator (TEXT)
├── kode_tindakan (TEXT)
├── nama_tindakan (TEXT)
├── biaya_bahan (BIGINT)
├── unit_cost_per_tindakan (BIGINT)
├── prosentase_jasa_pelayanan (NUMERIC)
├── prosentase_profit (NUMERIC)
├── jasa_sarana (BIGINT)
├── jasa_pelayanan (BIGINT)
├── tarif_per_tindakan (BIGINT)
├── sumber_tabel (TEXT)
├── jasa_pelayanan_medis (BIGINT)
├── jasa_pelayanan_non_medis (BIGINT)
└── created_at, updated_at (TIMESTAMPTZ)

-- Skenario Tarif Akomodasi
skenario_tarif_akomodasi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER)
├── rata_rata_uc_vvip (NUMERIC)
├── rata_rata_uc_vip (NUMERIC)
├── rata_rata_uc_i (NUMERIC)
├── rata_rata_uc_ii (NUMERIC)
├── rata_rata_uc_iii (NUMERIC)
├── tarif_vvip (NUMERIC)
├── tarif_vip (NUMERIC)
├── tarif_i (NUMERIC)
├── tarif_ii (NUMERIC)
├── tarif_iii (NUMERIC)
└── Generated Columns:
    ├── profit_rupiah_* = tarif_* - rata_rata_uc_*
    └── profit_persen_* = (profit_rupiah_* / rata_rata_uc_*) * 100

-- Skenario Tarif Visit
skenario_tarif_visit
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER, DEFAULT: 2025)
├── visit_dokter_umum (BIGINT)
├── visit_dokter_spesialis (BIGINT)
├── visit_dokter_subspesialis (BIGINT)
├── konsultasi_dokter_spesialis (BIGINT)
├── konsultasi_dokter_subspesialis (BIGINT)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### **C. Cost Recovery**
```sql
-- Cost Recovery
cost_recovery
├── id (UUID, PK)
├── unit_kerja_id (UUID, FK → unit_kerja)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── tahun (INTEGER)
├── total_biaya (NUMERIC)
├── pendapatan_umum (NUMERIC)
├── pendapatan_bpjs (NUMERIC)
├── total_pendapatan (NUMERIC)
├── Proyeksi JP (NUMERIC)
├── total biaya dengan JP (NUMERIC)
└── created_at, updated_at (TIMESTAMPTZ)
```

### **6. Budgeting & Planning Tables**

#### **A. Budgeting BHP**
```sql
-- Budgeting BHP Farmasi
budgeting_bhp_farmasi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER, DEFAULT: 2025)
├── kode_jenis (SMALLINT)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── kode_operator (TEXT)
├── nama_operator (TEXT)
├── kode_tindakan (TEXT)
├── nama_tindakan (TEXT)
├── biaya_bahan (BIGINT)
├── unit_cost_per_tindakan (BIGINT)
├── jumlah_tindakan (INTEGER)
├── rincian_bahan (JSONB)
├── pendapatan (BIGINT)
├── sumber_tabel (TEXT)
└── Generated Columns:
    ├── total_budgeting_bhp = biaya_bahan * jumlah_tindakan
    └── rasio_bhp_pendapatan = (total_budgeting_bhp / pendapatan) * 100

-- Rincian Budgeting BHP
rincian_budgeting_bhp
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── budgeting_bhp_farmasi_id (UUID, FK → budgeting_bhp_farmasi)
├── tahun (INTEGER, DEFAULT: 2025)
├── kode_unit_kerja (TEXT)
├── nama_unit_kerja (TEXT)
├── kode_tindakan (TEXT)
├── nama_tindakan (TEXT)
├── jumlah_tindakan (INTEGER)
├── kode_barang (TEXT)
├── nama_barang (TEXT)
├── qty_per_tindakan (NUMERIC)
├── satuan (TEXT)
├── harga_satuan (NUMERIC)
├── sumber_tabel (TEXT)
├── jumlah (NUMERIC)
├── harga (NUMERIC)
└── Generated Columns:
    ├── jumlah_total = jumlah_tindakan * qty_per_tindakan
    └── total_rupiah = jumlah_total * harga_satuan
```

### **7. Produk Layanan Tables**

#### **A. Produk Layanan**
```sql
-- Produk Layanan
produk_layanan
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── tahun (INTEGER, DEFAULT: 2025)
├── jenis (TEXT, CHECK: 'rawat jalan'|'rawat inap')
├── deskripsi_inacbg (TEXT)
├── grouper (TEXT)
├── diaglist (TEXT)
├── diagnosa_1 sampai diagnosa_5 (TEXT)
├── proclist (TEXT)
├── proc_1 sampai proc_5 (TEXT)
├── los (INTEGER) - Length of Stay
├── spesialisasi_dokter (TEXT)
├── nama_dokter (TEXT)
├── kode_dokter (TEXT)
├── tindakan (JSONB, DEFAULT: '[]')
├── ibs (JSONB, DEFAULT: '[]')
├── laboratorium (JSONB, DEFAULT: '[]')
├── radiologi (JSONB, DEFAULT: '[]')
├── farmasi (JSONB, DEFAULT: '[]')
├── kamar_akomodasi (JSONB, DEFAULT: '[]')
├── visite (JSONB, DEFAULT: '[]')
├── konsultasi (JSONB, DEFAULT: '[]')
├── total_biaya (BIGINT)
├── tarif_inacbgs_numeric (BIGINT)
└── Generated Columns:
    ├── saldo_distribusi = tarif_inacbgs_numeric - total_biaya
    └── prosentase_saldo = ((tarif_inacbgs_numeric - total_biaya) / tarif_inacbgs_numeric) * 100
```

### **8. Supporting Tables**

#### **A. Bahan Porsi**
```sql
-- Bahan Porsi
bahan_porsi
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── kode (TEXT)
├── jenis_makanan (TEXT)
├── nama_barang (TEXT)
├── satuan (TEXT)
├── konsumsi (NUMERIC)
├── harga (NUMERIC)
├── biaya_produksi (NUMERIC)
├── data_barang_gizi_id (UUID, FK → data_barang_gizi)
└── Generated Columns:
    ├── harga_bah = ROUND(konsumsi * harga)
    └── biaya_bahan_porsi = harga_bah + ROUND(harga_bah * biaya_produksi / 100)
```

#### **B. Biaya Preference**
```sql
-- Biaya Preference
biaya_preference
├── id (INTEGER, PK)
├── user_id (UUID, FK → auth.users, DEFAULT: auth.uid())
├── biaya_type (TEXT, CHECK: 'total_biaya'|'total_biaya_tanpa_jp')
└── created_at, updated_at (TIMESTAMPTZ)
```

---

## 🔗 RELASI ANTAR TABEL (FOREIGN KEYS)

### **1. Core Relationships**

#### **A. User & Authentication**
```sql
-- Semua tabel memiliki relasi ke auth.users
auth.users (1) ←→ (N) public.*.user_id

-- Profil user
auth.users (1) ←→ (1) public.profiles
```

#### **B. Unit Kerja (Central Hub)**
```sql
-- Unit Kerja sebagai pusat relasi
public.unit_kerja (1) ←→ (N) public.data_biaya.unit_kerja_id
public.unit_kerja (1) ←→ (N) public.data_pendapatan.unit_kerja_id
public.unit_kerja (1) ←→ (N) public.cost_recovery.unit_kerja_id

-- Relasi kode unit kerja
public.unit_kerja.kode ←→ public.jenis_tindakan_rawat_jalan.kode_unit_kerja
public.unit_kerja.kode ←→ public.jenis_tindakan_inap.kode_unit_kerja
public.unit_kerja.kode ←→ public.kalkulasi_tindakan_inap.kode_unit_kerja
public.unit_kerja.kode ←→ public.kalkulasi_tindakan_rawat_jalan.kode_unit_kerja
```

#### **C. Daftar Tindakan (Master Tindakan)**
```sql
-- Daftar Tindakan sebagai master tindakan
public.daftar_tindakan.kode_tindakan ←→ public.jenis_tindakan_rawat_jalan.kode_jenis_tindakan
public.daftar_tindakan.kode_tindakan ←→ public.jenis_tindakan_inap.kode_jenis_tindakan
public.daftar_tindakan.kode_tindakan ←→ public.kalkulasi_tindakan_inap.kode_jenis_tindakan
public.daftar_tindakan.kode_tindakan ←→ public.kalkulasi_tindakan_rawat_jalan.kode_jenis_tindakan
```

### **2. Kalkulasi Relationships**

#### **A. Distribusi Biaya Chain**
```sql
-- Chain distribusi biaya
public.distribusi_biaya_pertama (1) ←→ (N) public.distribusi_biaya_kedua.distribusi_biaya_pertama_id

-- Transpose relationships
public.distribusi_biaya_pertama ←→ public.total_alokasi_biaya_pertama
public.distribusi_biaya_rekap ←→ public.total_alokasi_biaya_pertama
```

#### **B. Budgeting Relationships**
```sql
-- Budgeting BHP chain
public.budgeting_bhp_farmasi (1) ←→ (N) public.rincian_budgeting_bhp.budgeting_bhp_farmasi_id
```

#### **C. Barang Gizi Relationships**
```sql
-- Barang Gizi relationships
public.data_barang_gizi (1) ←→ (N) public.bahan_porsi.data_barang_gizi_id
```

### **3. Complex Relationships**

#### **A. Akomodasi & Tindakan**
```sql
-- Complex relationship untuk akomodasi
public.prosentase_akomodasi_tindakan ←→ public.kalkulasi_biaya_akomodasi
public.prosentase_akomodasi_tindakan ←→ public.data_akomodasi_inap
```

#### **B. Rekapitulasi Relationships**
```sql
-- Rekapitulasi mengumpulkan dari semua tabel kalkulasi
public.kalkulasi_biaya_laboratorium ←→ public.rekapitulasi_unit_cost
public.kalkulasi_biaya_radiologi ←→ public.rekapitulasi_unit_cost
public.kalkulasi_bdrs ←→ public.rekapitulasi_unit_cost
public.kalkulasi_tindakan_inap ←→ public.rekapitulasi_unit_cost
public.kalkulasi_tindakan_rawat_jalan ←→ public.rekapitulasi_unit_cost
public.kalkulasi_tindakan_operatif ←→ public.rekapitulasi_unit_cost
public.kalkulasi_biaya_cathlab ←→ public.rekapitulasi_unit_cost

-- Skenario Tarif mengacu ke Rekapitulasi
public.rekapitulasi_unit_cost ←→ public.skenario_tarif
```

---

## 📊 DIAGRAM RELASI UTAMA

### **Master Data Flow**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MASTER DATA FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                        │
│  │   AUTH.     │───▶│  PROFILES   │    │ UNIT_KERJA  │                        │
│  │   USERS     │    │             │    │             │                        │
│  └─────────────┘    └─────────────┘    └─────────────┘                        │
│           │                                │                                   │
│           ▼                                ▼                                   │
│  ┌─────────────┐                    ┌─────────────┐                            │
│  │   DATA_     │                    │   DATA_     │                            │
│  │   BIAYA     │                    │PENDAPATAN   │                            │
│  └─────────────┘                    └─────────────┘                            │
│           │                                │                                   │
│           ▼                                ▼                                   │
│  ┌─────────────┐                    ┌─────────────┐                            │
│  │   DATA_     │                    │   COST      │                            │
│  │  KEGIATAN   │                    │ RECOVERY    │                            │
│  └─────────────┘                    └─────────────┘                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **Kalkulasi Flow**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             KALKULASI FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                        │
│  │   DATA_     │───▶│ KALKULASI   │───▶│ REKAPITULASI│                        │
│  │  KEGIATAN   │    │   BIAYA     │    │ UNIT_COST   │                        │
│  └─────────────┘    └─────────────┘    └─────────────┘                        │
│           │                                │                                   │
│           ▼                                ▼                                   │
│  ┌─────────────┐                    ┌─────────────┐                            │
│  │   DATA_     │                    │ SKENARIO    │                            │
│  │   BIAYA     │                    │   TARIF     │                            │
│  └─────────────┘                    └─────────────┘                            │
│           │                                │                                   │
│           ▼                                ▼                                   │
│  ┌─────────────┐                    ┌─────────────┐                            │
│  │ DISTRIBUSI  │                    │  PRODUK     │                            │
│  │   BIAYA     │                    │ LAYANAN     │                            │
│  └─────────────┘                    └─────────────┘                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **Unit Cost Calculation Chain**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         UNIT COST CALCULATION CHAIN                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                        │
│  │   MASTER    │───▶│   INPUT     │───▶│ KALKULASI   │                        │
│  │    DATA     │    │   DATA      │    │   BIAYA     │                        │
│  └─────────────┘    └─────────────┘    └─────────────┘                        │
│                              │                   │                             │
│                              ▼                   ▼                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                        │
│  │ DISTRIBUSI  │◄───│   TOTAL     │◄───│   UNIT      │                        │
│  │   BIAYA     │    │   BIAYA     │    │   COST      │                        │
│  └─────────────┘    └─────────────┘    └─────────────┘                        │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────┐                                                               │
│  │   SKENARIO  │                                                               │
│  │    TARIF    │                                                               │
│  └─────────────┘                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 CONSTRAINTS & VALIDATIONS

### **1. Primary Key Constraints**
- Semua tabel menggunakan **UUID** sebagai primary key (kecuali tabel legacy)
- Auto-generated dengan `gen_random_uuid()`

### **2. Foreign Key Constraints**
- **Cascade Delete**: Tidak ada cascade delete untuk data integrity
- **Restrict**: Foreign key constraints mencegah penghapusan data yang masih direferensi

### **3. Check Constraints**
```sql
-- Unit Kerja
CHECK (kode ~ '^UK[0-9]{3}$')
CHECK (kategori = ANY (ARRAY['Pusat Biaya', 'Pusat Pendapatan']))
CHECK (jenis = ANY (ARRAY[1, 2, 3, 4]))

-- Daftar Tindakan
CHECK (kode_tindakan ~ '^T\\.[0-9]+$')
CHECK (profesionalisme >= 1 AND profesionalisme <= 4)
CHECK (tingkat_kesulitan >= 1 AND tingkat_kesulitan <= 5)

-- Data Barang Farmasi
CHECK (gudang = ANY (ARRAY['obat', 'bhp']))

-- Data Kamar
CHECK (Kode_Kamar ~ '^RI\\.[0-9]+$')

-- Klinik
CHECK (kode_klinik ~ '^RJ\\.[0-9]+$')

-- Menu Gizi
CHECK (kode_makanan ~ '^gz\\.[0-9]+$')

-- Data Diklat
CHECK (kode_strata = ANY (ARRAY['L1', 'L2', 'L3', 'L4', 'L5']))

-- Tindakan Laboratorium
CHECK (jenis = ANY (ARRAY['PK', 'PA', 'Mi']))

-- Tindakan Radiologi
CHECK (kode_tindakan ~ '^Rad\\.[0-9]+$')

-- Tindakan BDRS
CHECK (kode ~~ 'BDRS.%')

-- Tindakan Operatif
CHECK (kode_jenis = ANY (ARRAY[1, 2, 3]))

-- Tindakan Cathlab
CHECK (kode_tindakan ~ '^CL\\.[0-9]+')

-- Jenis Tindakan
CHECK (kode_jenis = 1) -- Rawat Jalan
CHECK (kode_jenis = 2) -- Rawat Inap

-- Kalkulasi Daftar dan Resep
CHECK (jenis_layanan = ANY (ARRAY['Pendaftaran Rawat Jalan', 'Peresepan Rawat Jalan', 'Pendaftaran Rawat Inap', 'Peresepan Rawat Inap', 'Peresepan Farmasi']))

-- Biaya Preference
CHECK (biaya_type = ANY (ARRAY['total_biaya', 'total_biaya_tanpa_jp']))

-- Produk Layanan
CHECK (jenis = ANY (ARRAY['rawat jalan', 'rawat inap']))

-- Mapping Dasar Alokasi
CHECK (dasar_alokasi = ANY (ARRAY['Total_SDM', 'Total_Kunjungan', 'Total_Kunjungan_Pasien', 'Luas_Ruangan', 'Komputer_simrs_user']))
```

### **4. Unique Constraints**
```sql
-- Unit Kerja
UNIQUE (user_id, kode)

-- Data Barang Farmasi
UNIQUE (user_id, kode_barang)

-- Data Barang Gizi
UNIQUE (user_id, kode_barang)

-- Daftar Tindakan
UNIQUE (kode_tindakan)

-- Menu Gizi
UNIQUE (kode_makanan)

-- Data Kamar
UNIQUE (Kode_Kamar)

-- Klinik
UNIQUE (kode_klinik)

-- Data Diklat
UNIQUE (user_id, kode_materi)

-- Tindakan Laboratorium
UNIQUE (kode)

-- Tindakan Radiologi
UNIQUE (kode_tindakan)

-- Tindakan Operatif
UNIQUE (kode_tindakan_operatif)

-- Tindakan Cathlab
UNIQUE (kode_tindakan)

-- Skenario Tarif Visit
UNIQUE (user_id, tahun)

-- Mapping Dasar Alokasi
UNIQUE (kode_unit_kerja)

-- Biaya Preference
UNIQUE (user_id)
```

---

## 🔄 TRIGGERS & FUNCTIONS

### **1. Auto-Calculated Fields**
Banyak tabel menggunakan **Generated Columns** untuk kalkulasi otomatis:

```sql
-- Contoh Generated Columns
biaya_bahan = SUM(obat + bhp + makanan_karyawan + makanan_pasien + rumah_tangga + atk + cetak)
total_biaya = SUM(semua biaya individual)
saldo_distribusi = tarif_inacbgs_numeric - total_biaya
prosentase_saldo = ((tarif_inacbgs_numeric - total_biaya) / tarif_inacbgs_numeric) * 100
```

### **2. Triggers**
- **Calculate Biaya Bahan**: Trigger untuk menghitung biaya bahan dari JSON
- **Update Timestamps**: Trigger untuk update `updated_at`
- **Validation Triggers**: Trigger untuk validasi data

### **3. RPC Functions**
- **fix_dasar_alokasi_***: Functions untuk menghitung dasar alokasi
- **fix_biaya_calculation_***: Functions untuk kalkulasi biaya
- **fix_hasil_kali_***: Functions untuk menghitung hasil kali

---

## 📈 INDEXES & PERFORMANCE

### **1. Primary Indexes**
- Semua primary key otomatis ter-index
- Foreign key constraints juga ter-index

### **2. Composite Indexes**
```sql
-- Index untuk query yang sering digunakan
CREATE INDEX idx_data_biaya_user_tahun ON data_biaya(user_id, tahun);
CREATE INDEX idx_data_pendapatan_user_tahun ON data_pendapatan(user_id, tahun);
CREATE INDEX idx_data_kegiatan_user_tahun ON data_kegiatan(user_id, tahun);
```

### **3. JSON Indexes**
```sql
-- Index untuk JSON fields
CREATE INDEX idx_produk_layanan_tindakan_gin ON produk_layanan USING GIN(tindakan);
CREATE INDEX idx_produk_layanan_farmasi_gin ON produk_layanan USING GIN(farmasi);
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

### **1. RLS Policies**
Semua tabel memiliki RLS enabled dengan policy:
```sql
-- Policy untuk user isolation
CREATE POLICY "Users can only see their own data" ON table_name
FOR ALL TO authenticated
USING (auth.uid() = user_id);
```

### **2. Service Role**
- Service role memiliki akses penuh untuk operations
- Authenticated role hanya bisa akses data sendiri

---

## 📊 STATISTICS

### **Database Size**
- **Total Tables**: 45+ tables
- **Total Rows**: 10,000+ rows
- **Database Size**: ~500MB
- **Indexes**: 100+ indexes

### **Table Sizes (Approximate)**
```
data_kegiatan: ~77 rows
data_biaya: ~77 rows  
data_pendapatan: ~41 rows
rekapitulasi_unit_cost: ~445 rows
skenario_tarif: ~445 rows
budgeting_bhp_farmasi: ~445 rows
kalkulasi_biaya_laboratorium: ~558 rows
kalkulasi_biaya_radiologi: ~79 rows
kalkulasi_biaya_operatif: ~213 rows
produk_layanan: ~0 rows (new table)
```

---

## 🚀 MAINTENANCE & OPTIMIZATION

### **1. Regular Maintenance**
- **VACUUM**: Automatic via Supabase
- **ANALYZE**: Automatic via Supabase
- **Index Maintenance**: Automatic via Supabase

### **2. Performance Monitoring**
- Query performance monitoring via Supabase dashboard
- Slow query identification
- Index usage analysis

### **3. Backup Strategy**
- **Daily Backups**: Automatic via Supabase
- **Point-in-time Recovery**: Available
- **Export/Import**: Via CSV functionality

---

## 📋 MIGRATION STRATEGY

### **1. Schema Changes**
- **Additive Changes**: New columns, tables
- **Breaking Changes**: Rename, drop columns (careful planning required)
- **Data Migration**: Via SQL scripts

### **2. Version Control**
- **Migration Files**: SQL files dengan timestamp
- **Rollback Strategy**: Reverse migration scripts
- **Testing**: Staging environment testing

---

**Dokumentasi ini merupakan bagian dari Modul Teknis Aplikasi Unit Cost RS**

**Versi**: 1.0  
**Tanggal**: Januari 2025  
**Status**: Production Ready
