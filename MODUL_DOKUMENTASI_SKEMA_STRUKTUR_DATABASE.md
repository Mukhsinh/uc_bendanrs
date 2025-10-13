# DOKUMENTASI SKEMA STRUKTUR DATABASE
## APLIKASI UNIT COST RUMAH SAKIT

**Sistem Perhitungan Unit Cost**  
**Metode Activity Based Costing (ABC)**

---

**Disusun oleh:**  
**MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC**

**Hak Cipta: 000831709**

---

## DAFTAR ISI

1. [GAMBARAN UMUM](#gambaran-umum)
2. [DIAGRAM RELASI DATABASE](#diagram-relasi-database)
3. [TABEL MASTER DATA](#tabel-master-data)
4. [TABEL TRANSAKSI](#tabel-transaksi)
5. [TABEL KALKULASI](#tabel-kalkulasi)
6. [TABEL DISTRIBUSI BIAYA](#tabel-distribusi-biaya)
7. [TABEL OUTPUT & REPORTING](#tabel-output--reporting)
8. [VIEWS & STORED PROCEDURES](#views--stored-procedures)
9. [RELASI ANTAR TABEL](#relasi-antar-tabel)
10. [DATA FLOW & PROCESS](#data-flow--process)
11. [FORMULA & METODOLOGI](#formula--metodologi)
12. [BEST PRACTICES](#best-practices)

---

## GAMBARAN UMUM

Aplikasi Unit Cost RS adalah sistem informasi untuk menghitung unit cost layanan rumah sakit menggunakan pendekatan Activity Based Costing (ABC). Sistem ini membantu manajemen rumah sakit dalam menetapkan tarif yang tepat berdasarkan biaya riil operasional.

### **Teknologi Stack**

| Komponen | Teknologi | Deskripsi |
|----------|-----------|-----------|
| **Database** | PostgreSQL (Supabase) | Database relasional dengan RLS |
| **Backend** | Supabase BaaS | Backend as a Service |
| **Frontend** | React + TypeScript | Framework modern & type-safe |
| **Build Tool** | Vite | Fast build & HMR |
| **UI Library** | Tailwind + shadcn/ui | Modern component library |
| **State Management** | TanStack Query | Server state management |

### **Ringkasan Database**

- **Total Tabel**: 43+ tabel
- **Master Data**: 14 tabel
- **Transaksi**: 3 tabel
- **Kalkulasi**: 8 tabel
- **Distribusi Biaya**: 3 tabel
- **Output & Reporting**: 7 tabel
- **Stored Procedures**: 8+ functions

---

## DIAGRAM RELASI DATABASE

### **Entity Relationship Diagram (ERD)**

Sistem database dirancang dengan struktur normalisasi yang optimal untuk mendukung perhitungan unit cost dengan metodologi Activity Based Costing.

#### **Core Entities:**
- **Master Data Entities** - Data referensi dan konfigurasi
- **Transaction Entities** - Data transaksi operasional
- **Calculation Entities** - Data perhitungan biaya
- **Distribution Entities** - Data distribusi biaya
- **Reporting Entities** - Data output dan laporan

#### **Key Relationships:**
- **One-to-Many** - Master data ke transaksi
- **Many-to-Many** - Transaksi ke kalkulasi
- **Hierarchical** - Struktur organisasi unit kerja
- **Temporal** - Data historis dan versi

---

## TABEL MASTER DATA

### **1. Data Unit Kerja**
```sql
CREATE TABLE unit_kerja (
  id UUID PRIMARY KEY,
  kode_unit VARCHAR(10) UNIQUE NOT NULL,
  nama_unit VARCHAR(100) NOT NULL,
  jenis_unit VARCHAR(50),
  parent_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Data Barang**
```sql
CREATE TABLE data_barang (
  id UUID PRIMARY KEY,
  kode_barang VARCHAR(20) UNIQUE NOT NULL,
  nama_barang VARCHAR(200) NOT NULL,
  satuan VARCHAR(20),
  harga_satuan DECIMAL(15,2),
  kategori VARCHAR(50),
  is_active BOOLEAN DEFAULT true
);
```

### **3. Data Barang Gizi**
```sql
CREATE TABLE data_barang_gizi (
  id UUID PRIMARY KEY,
  kode_barang VARCHAR(20) UNIQUE NOT NULL,
  nama_barang VARCHAR(200) NOT NULL,
  satuan VARCHAR(20),
  harga_satuan DECIMAL(15,2),
  kandungan_gizi JSONB,
  is_active BOOLEAN DEFAULT true
);
```

### **4. Data Kamar**
```sql
CREATE TABLE data_kamar (
  id UUID PRIMARY KEY,
  kode_kamar VARCHAR(10) UNIQUE NOT NULL,
  nama_kamar VARCHAR(100) NOT NULL,
  kelas_kamar VARCHAR(50),
  tarif_kamar DECIMAL(15,2),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **5. Data Klinik**
```sql
CREATE TABLE data_klinik (
  id UUID PRIMARY KEY,
  kode_klinik VARCHAR(10) UNIQUE NOT NULL,
  nama_klinik VARCHAR(100) NOT NULL,
  jenis_klinik VARCHAR(50),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **6. Data Kegiatan**
```sql
CREATE TABLE data_kegiatan (
  id UUID PRIMARY KEY,
  kode_kegiatan VARCHAR(20) UNIQUE NOT NULL,
  nama_kegiatan VARCHAR(200) NOT NULL,
  jenis_kegiatan VARCHAR(50),
  unit_id UUID REFERENCES unit_kerja(id),
  durasi_standar INTEGER,
  is_active BOOLEAN DEFAULT true
);
```

### **7. Data Tindakan**
```sql
CREATE TABLE data_tindakan (
  id UUID PRIMARY KEY,
  kode_tindakan VARCHAR(20) UNIQUE NOT NULL,
  nama_tindakan VARCHAR(200) NOT NULL,
  jenis_tindakan VARCHAR(50),
  tarif_tindakan DECIMAL(15,2),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **8. Data Tindakan Laboratorium**
```sql
CREATE TABLE data_tindakan_lab (
  id UUID PRIMARY KEY,
  kode_tindakan VARCHAR(20) UNIQUE NOT NULL,
  nama_tindakan VARCHAR(200) NOT NULL,
  jenis_pemeriksaan VARCHAR(50),
  tarif_tindakan DECIMAL(15,2),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **9. Data Tindakan Radiologi**
```sql
CREATE TABLE data_tindakan_radiologi (
  id UUID PRIMARY KEY,
  kode_tindakan VARCHAR(20) UNIQUE NOT NULL,
  nama_tindakan VARCHAR(200) NOT NULL,
  jenis_pemeriksaan VARCHAR(50),
  tarif_tindakan DECIMAL(15,2),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **10. Data Tindakan Operatif**
```sql
CREATE TABLE data_tindakan_operatif (
  id UUID PRIMARY KEY,
  kode_tindakan VARCHAR(20) UNIQUE NOT NULL,
  nama_tindakan VARCHAR(200) NOT NULL,
  jenis_operasi VARCHAR(50),
  tarif_tindakan DECIMAL(15,2),
  durasi_standar INTEGER,
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **11. Data Tindakan Cathlab**
```sql
CREATE TABLE data_tindakan_cathlab (
  id UUID PRIMARY KEY,
  kode_tindakan VARCHAR(20) UNIQUE NOT NULL,
  nama_tindakan VARCHAR(200) NOT NULL,
  jenis_prosedur VARCHAR(50),
  tarif_tindakan DECIMAL(15,2),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **12. Data Tindakan BDRS**
```sql
CREATE TABLE data_tindakan_bdrs (
  id UUID PRIMARY KEY,
  kode_tindakan VARCHAR(20) UNIQUE NOT NULL,
  nama_tindakan VARCHAR(200) NOT NULL,
  jenis_layanan VARCHAR(50),
  tarif_tindakan DECIMAL(15,2),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **13. Data Diklat**
```sql
CREATE TABLE data_diklat (
  id UUID PRIMARY KEY,
  kode_diklat VARCHAR(20) UNIQUE NOT NULL,
  nama_diklat VARCHAR(200) NOT NULL,
  jenis_diklat VARCHAR(50),
  durasi_jam INTEGER,
  biaya_diklat DECIMAL(15,2),
  unit_id UUID REFERENCES unit_kerja(id),
  is_active BOOLEAN DEFAULT true
);
```

### **14. Dasar Alokasi**
```sql
CREATE TABLE dasar_alokasi (
  id UUID PRIMARY KEY,
  nama_alokasi VARCHAR(100) NOT NULL,
  metode_alokasi VARCHAR(50),
  basis_alokasi VARCHAR(50),
  persentase DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## TABEL TRANSAKSI

### **1. Data Pendapatan**
```sql
CREATE TABLE data_pendapatan (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES unit_kerja(id),
  periode DATE NOT NULL,
  jenis_pendapatan VARCHAR(50),
  jumlah_pendapatan DECIMAL(15,2),
  jumlah_volume INTEGER,
  tarif_rata_rata DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Data Biaya**
```sql
CREATE TABLE data_biaya (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES unit_kerja(id),
  periode DATE NOT NULL,
  jenis_biaya VARCHAR(50),
  jumlah_biaya DECIMAL(15,2),
  jumlah_volume INTEGER,
  biaya_per_unit DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Data Akomodasi Inap**
```sql
CREATE TABLE data_akomodasi_inap (
  id UUID PRIMARY KEY,
  kamar_id UUID REFERENCES data_kamar(id),
  periode DATE NOT NULL,
  jumlah_hari INTEGER,
  tarif_per_hari DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  occupancy_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## TABEL KALKULASI

### **1. Kalkulasi Biaya Gizi**
```sql
CREATE TABLE kalkulasi_biaya_gizi (
  id UUID PRIMARY KEY,
  periode DATE NOT NULL,
  unit_id UUID REFERENCES unit_kerja(id),
  total_biaya_bahan DECIMAL(15,2),
  total_biaya_tenaga DECIMAL(15,2),
  total_biaya_overhead DECIMAL(15,2),
  total_biaya_gizi DECIMAL(15,2),
  jumlah_pori INTEGER,
  biaya_per_pori DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Kalkulasi Tindakan Rawat Jalan**
```sql
CREATE TABLE kalkulasi_tindakan_rawat_jalan (
  id UUID PRIMARY KEY,
  tindakan_id UUID REFERENCES data_tindakan(id),
  periode DATE NOT NULL,
  biaya_bahan DECIMAL(15,2),
  biaya_tenaga DECIMAL(15,2),
  biaya_overhead DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  tarif_jual DECIMAL(15,2),
  margin_profit DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Kalkulasi Biaya Operatif**
```sql
CREATE TABLE kalkulasi_biaya_operatif (
  id UUID PRIMARY KEY,
  tindakan_id UUID REFERENCES data_tindakan_operatif(id),
  periode DATE NOT NULL,
  biaya_instrumen DECIMAL(15,2),
  biaya_bahan DECIMAL(15,2),
  biaya_tenaga DECIMAL(15,2),
  biaya_fasilitas DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  tarif_jual DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **4. Kalkulasi Biaya Laboratorium**
```sql
CREATE TABLE kalkulasi_biaya_laboratorium (
  id UUID PRIMARY KEY,
  tindakan_id UUID REFERENCES data_tindakan_lab(id),
  periode DATE NOT NULL,
  biaya_reagen DECIMAL(15,2),
  biaya_tenaga DECIMAL(15,2),
  biaya_alat DECIMAL(15,2),
  biaya_overhead DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  tarif_jual DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Kalkulasi Biaya Radiologi**
```sql
CREATE TABLE kalkulasi_biaya_radiologi (
  id UUID PRIMARY KEY,
  tindakan_id UUID REFERENCES data_tindakan_radiologi(id),
  periode DATE NOT NULL,
  biaya_kontras DECIMAL(15,2),
  biaya_tenaga DECIMAL(15,2),
  biaya_alat DECIMAL(15,2),
  biaya_overhead DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  tarif_jual DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **6. Kalkulasi Biaya Cathlab**
```sql
CREATE TABLE kalkulasi_biaya_cathlab (
  id UUID PRIMARY KEY,
  tindakan_id UUID REFERENCES data_tindakan_cathlab(id),
  periode DATE NOT NULL,
  biaya_kateter DECIMAL(15,2),
  biaya_tenaga DECIMAL(15,2),
  biaya_alat DECIMAL(15,2),
  biaya_fasilitas DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  tarif_jual DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **7. Kalkulasi Biaya Diklat**
```sql
CREATE TABLE kalkulasi_biaya_diklat (
  id UUID PRIMARY KEY,
  diklat_id UUID REFERENCES data_diklat(id),
  periode DATE NOT NULL,
  biaya_instructor DECIMAL(15,2),
  biaya_materi DECIMAL(15,2),
  biaya_fasilitas DECIMAL(15,2),
  biaya_overhead DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  biaya_per_peserta DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **8. Kalkulasi Biaya BDRS**
```sql
CREATE TABLE kalkulasi_biaya_bdrs (
  id UUID PRIMARY KEY,
  tindakan_id UUID REFERENCES data_tindakan_bdrs(id),
  periode DATE NOT NULL,
  biaya_bahan DECIMAL(15,2),
  biaya_tenaga DECIMAL(15,2),
  biaya_alat DECIMAL(15,2),
  biaya_overhead DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  tarif_jual DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## TABEL DISTRIBUSI BIAYA

### **1. Distribusi Biaya Pertama**
```sql
CREATE TABLE distribusi_biaya_pertama (
  id UUID PRIMARY KEY,
  periode DATE NOT NULL,
  unit_pengirim UUID REFERENCES unit_kerja(id),
  unit_penerima UUID REFERENCES unit_kerja(id),
  jenis_biaya VARCHAR(50),
  jumlah_biaya DECIMAL(15,2),
  basis_alokasi VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Distribusi Biaya Kedua**
```sql
CREATE TABLE distribusi_biaya_kedua (
  id UUID PRIMARY KEY,
  periode DATE NOT NULL,
  unit_pengirim UUID REFERENCES unit_kerja(id),
  unit_penerima UUID REFERENCES unit_kerja(id),
  jenis_biaya VARCHAR(50),
  jumlah_biaya DECIMAL(15,2),
  persentase_alokasi DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Dasar Alokasi Biaya Gizi**
```sql
CREATE TABLE dasar_alokasi_biaya_gizi (
  id UUID PRIMARY KEY,
  periode DATE NOT NULL,
  unit_id UUID REFERENCES unit_kerja(id),
  jumlah_bed INTEGER,
  persentase_alokasi DECIMAL(5,2),
  biaya_alokasi DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## TABEL OUTPUT & REPORTING

### **1. Rekapitulasi Unit Cost**
```sql
CREATE TABLE rekapitulasi_unit_cost (
  id UUID PRIMARY KEY,
  periode DATE NOT NULL,
  unit_id UUID REFERENCES unit_kerja(id),
  total_pendapatan DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  unit_cost DECIMAL(15,2),
  margin_profit DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Skenario Tarif**
```sql
CREATE TABLE skenario_tarif (
  id UUID PRIMARY KEY,
  nama_skenario VARCHAR(100) NOT NULL,
  jenis_layanan VARCHAR(50),
  tarif_awal DECIMAL(15,2),
  tarif_baru DECIMAL(15,2),
  selisih_tarif DECIMAL(15,2),
  dampak_pendapatan DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Cost Recovery**
```sql
CREATE TABLE cost_recovery (
  id UUID PRIMARY KEY,
  periode DATE NOT NULL,
  unit_id UUID REFERENCES unit_kerja(id),
  target_pendapatan DECIMAL(15,2),
  realisasi_pendapatan DECIMAL(15,2),
  recovery_rate DECIMAL(5,2),
  gap_recovery DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **4. Budgeting BHP**
```sql
CREATE TABLE budgeting_bhp (
  id UUID PRIMARY KEY,
  periode DATE NOT NULL,
  unit_id UUID REFERENCES unit_kerja(id),
  jenis_bhp VARCHAR(50),
  budget_awal DECIMAL(15,2),
  realisasi_bhp DECIMAL(15,2),
  variance_bhp DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Produk Layanan**
```sql
CREATE TABLE produk_layanan (
  id UUID PRIMARY KEY,
  kode_produk VARCHAR(20) UNIQUE NOT NULL,
  nama_produk VARCHAR(200) NOT NULL,
  jenis_layanan VARCHAR(50),
  unit_cost DECIMAL(15,2),
  tarif_jual DECIMAL(15,2),
  margin_profit DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true
);
```

### **6. Menu Gizi**
```sql
CREATE TABLE menu_gizi (
  id UUID PRIMARY KEY,
  nama_menu VARCHAR(100) NOT NULL,
  jenis_menu VARCHAR(50),
  kandungan_kalori INTEGER,
  kandungan_protein DECIMAL(5,2),
  biaya_menu DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true
);
```

### **7. Manajemen Tindakan Inap**
```sql
CREATE TABLE manajemen_tindakan_inap (
  id UUID PRIMARY KEY,
  tindakan_id UUID REFERENCES data_tindakan(id),
  kelas_kamar VARCHAR(50),
  biaya_tindakan DECIMAL(15,2),
  biaya_akomodasi DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true
);
```

---

## VIEWS & STORED PROCEDURES

### **Views**

#### **1. View Rekapitulasi Unit Cost**
```sql
CREATE VIEW view_rekapitulasi_unit_cost AS
SELECT 
  u.kode_unit,
  u.nama_unit,
  SUM(p.jumlah_pendapatan) as total_pendapatan,
  SUM(b.jumlah_biaya) as total_biaya,
  CASE 
    WHEN SUM(p.jumlah_volume) > 0 
    THEN SUM(b.jumlah_biaya) / SUM(p.jumlah_volume)
    ELSE 0 
  END as unit_cost
FROM unit_kerja u
LEFT JOIN data_pendapatan p ON u.id = p.unit_id
LEFT JOIN data_biaya b ON u.id = b.unit_id
WHERE u.is_active = true
GROUP BY u.id, u.kode_unit, u.nama_unit;
```

#### **2. View Cost Recovery Summary**
```sql
CREATE VIEW view_cost_recovery_summary AS
SELECT 
  u.kode_unit,
  u.nama_unit,
  cr.target_pendapatan,
  cr.realisasi_pendapatan,
  cr.recovery_rate,
  CASE 
    WHEN cr.recovery_rate >= 100 THEN 'Excellent'
    WHEN cr.recovery_rate >= 80 THEN 'Good'
    WHEN cr.recovery_rate >= 60 THEN 'Fair'
    ELSE 'Poor'
  END as status_recovery
FROM unit_kerja u
LEFT JOIN cost_recovery cr ON u.id = cr.unit_id
WHERE u.is_active = true;
```

### **Stored Procedures**

#### **1. Calculate Unit Cost**
```sql
CREATE OR REPLACE FUNCTION calculate_unit_cost(
  p_unit_id UUID,
  p_periode DATE
) RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_total_biaya DECIMAL(15,2);
  v_total_volume INTEGER;
  v_unit_cost DECIMAL(15,2);
BEGIN
  SELECT 
    COALESCE(SUM(jumlah_biaya), 0),
    COALESCE(SUM(jumlah_volume), 0)
  INTO v_total_biaya, v_total_volume
  FROM data_biaya 
  WHERE unit_id = p_unit_id 
    AND DATE_TRUNC('month', periode) = DATE_TRUNC('month', p_periode);
  
  IF v_total_volume > 0 THEN
    v_unit_cost := v_total_biaya / v_total_volume;
  ELSE
    v_unit_cost := 0;
  END IF;
  
  RETURN v_unit_cost;
END;
$$ LANGUAGE plpgsql;
```

#### **2. Distribute Overhead Cost**
```sql
CREATE OR REPLACE FUNCTION distribute_overhead_cost(
  p_periode DATE,
  p_basis_alokasi VARCHAR(50)
) RETURNS VOID AS $$
DECLARE
  v_total_overhead DECIMAL(15,2);
  v_total_basis DECIMAL(15,2);
  v_unit_record RECORD;
BEGIN
  -- Calculate total overhead cost
  SELECT COALESCE(SUM(jumlah_biaya), 0)
  INTO v_total_overhead
  FROM data_biaya 
  WHERE jenis_biaya = 'Overhead' 
    AND DATE_TRUNC('month', periode) = DATE_TRUNC('month', p_periode);
  
  -- Calculate total basis for allocation
  SELECT COALESCE(SUM(
    CASE p_basis_alokasi
      WHEN 'jumlah_bed' THEN jumlah_bed
      WHEN 'jumlah_volume' THEN jumlah_volume
      ELSE 1
    END
  ), 1)
  INTO v_total_basis
  FROM unit_kerja u
  LEFT JOIN data_biaya b ON u.id = b.unit_id
  WHERE u.is_active = true;
  
  -- Distribute overhead to each unit
  FOR v_unit_record IN
    SELECT u.id, u.kode_unit,
      CASE p_basis_alokasi
        WHEN 'jumlah_bed' THEN COALESCE(SUM(b.jumlah_bed), 0)
        WHEN 'jumlah_volume' THEN COALESCE(SUM(b.jumlah_volume), 0)
        ELSE 1
      END as basis_value
    FROM unit_kerja u
    LEFT JOIN data_biaya b ON u.id = b.unit_id
    WHERE u.is_active = true
    GROUP BY u.id, u.kode_unit
  LOOP
    INSERT INTO distribusi_biaya_pertama (
      periode, unit_pengirim, unit_penerima, 
      jenis_biaya, jumlah_biaya, basis_alokasi
    ) VALUES (
      p_periode, NULL, v_unit_record.id,
      'Overhead', 
      v_total_overhead * (v_unit_record.basis_value / v_total_basis),
      p_basis_alokasi
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## RELASI ANTAR TABEL

### **Primary Relationships**

#### **1. Unit Kerja sebagai Central Hub**
- **One-to-Many**: unit_kerja → data_kamar, data_klinik, data_kegiatan
- **One-to-Many**: unit_kerja → data_pendapatan, data_biaya
- **One-to-Many**: unit_kerja → rekapitulasi_unit_cost, cost_recovery

#### **2. Master Data Relationships**
- **One-to-Many**: data_tindakan → kalkulasi_tindakan_rawat_jalan
- **One-to-Many**: data_tindakan_operatif → kalkulasi_biaya_operatif
- **One-to-Many**: data_tindakan_lab → kalkulasi_biaya_laboratorium

#### **3. Transaction Relationships**
- **Many-to-One**: data_pendapatan → unit_kerja
- **Many-to-One**: data_biaya → unit_kerja
- **Many-to-One**: data_akomodasi_inap → data_kamar

#### **4. Calculation Relationships**
- **One-to-Many**: unit_kerja → kalkulasi_biaya_gizi
- **One-to-Many**: data_tindakan → kalkulasi_tindakan_rawat_jalan
- **One-to-Many**: data_diklat → kalkulasi_biaya_diklat

### **Foreign Key Constraints**

```sql
-- Unit Kerja References
ALTER TABLE data_kamar ADD CONSTRAINT fk_kamar_unit 
  FOREIGN KEY (unit_id) REFERENCES unit_kerja(id);

ALTER TABLE data_klinik ADD CONSTRAINT fk_klinik_unit 
  FOREIGN KEY (unit_id) REFERENCES unit_kerja(id);

-- Transaction References
ALTER TABLE data_pendapatan ADD CONSTRAINT fk_pendapatan_unit 
  FOREIGN KEY (unit_id) REFERENCES unit_kerja(id);

ALTER TABLE data_biaya ADD CONSTRAINT fk_biaya_unit 
  FOREIGN KEY (unit_id) REFERENCES unit_kerja(id);

-- Calculation References
ALTER TABLE kalkulasi_biaya_gizi ADD CONSTRAINT fk_kbg_unit 
  FOREIGN KEY (unit_id) REFERENCES unit_kerja(id);

ALTER TABLE kalkulasi_tindakan_rawat_jalan ADD CONSTRAINT fk_ktrj_tindakan 
  FOREIGN KEY (tindakan_id) REFERENCES data_tindakan(id);
```

---

## DATA FLOW & PROCESS

### **1. Data Input Process**

#### **Master Data Input**
1. **Setup Unit Kerja** - Definisi struktur organisasi
2. **Input Data Barang** - Katalog barang habis pakai
3. **Setup Tindakan** - Katalog layanan medis
4. **Konfigurasi Tarif** - Setup tarif dasar

#### **Transaction Data Input**
1. **Input Pendapatan** - Data pendapatan per periode
2. **Input Biaya** - Data biaya operasional
3. **Input Volume** - Data volume layanan

### **2. Calculation Process**

#### **Activity Based Costing (ABC)**
1. **Identify Activities** - Mapping aktivitas per unit
2. **Cost Assignment** - Alokasi biaya ke aktivitas
3. **Cost Driver Analysis** - Analisis cost driver
4. **Unit Cost Calculation** - Perhitungan biaya per unit

#### **Cost Distribution Process**
1. **Direct Cost Assignment** - Biaya langsung ke unit
2. **Overhead Distribution** - Distribusi biaya overhead
3. **Cost Allocation** - Alokasi biaya berdasarkan basis
4. **Final Cost Calculation** - Perhitungan biaya final

### **3. Reporting Process**

#### **Unit Cost Reports**
1. **Calculate Unit Cost** - Perhitungan unit cost
2. **Generate Summary** - Ringkasan per unit
3. **Create Reports** - Pembuatan laporan
4. **Export Data** - Export untuk analisis

---

## FORMULA & METODOLOGI

### **1. Unit Cost Formula**

#### **Basic Unit Cost Formula**
```
Unit Cost = Total Biaya / Total Volume
```

#### **Activity Based Costing Formula**
```
Unit Cost = (Direct Cost + Allocated Overhead) / Activity Volume
```

### **2. Cost Distribution Formulas**

#### **Overhead Distribution**
```
Unit Overhead = (Unit Basis / Total Basis) × Total Overhead
```

#### **Basis Allocation Methods**
- **Bed Count**: Berdasarkan jumlah tempat tidur
- **Volume**: Berdasarkan volume layanan
- **Revenue**: Berdasarkan pendapatan
- **Direct Cost**: Berdasarkan biaya langsung

### **3. Profitability Analysis**

#### **Margin Calculation**
```
Profit Margin = (Tarif Jual - Unit Cost) / Tarif Jual × 100%
```

#### **Cost Recovery**
```
Recovery Rate = Realisasi Pendapatan / Target Pendapatan × 100%
```

### **4. Performance Metrics**

#### **Efficiency Ratio**
```
Efficiency = Output Volume / Input Cost
```

#### **Utilization Rate**
```
Utilization = Actual Usage / Capacity × 100%
```

---

## BEST PRACTICES

### **1. Database Design**

#### **Normalization**
- **3rd Normal Form** - Menghindari redundancy
- **Proper Indexing** - Optimasi query performance
- **Foreign Key Constraints** - Data integrity
- **Data Types** - Penggunaan tipe data yang tepat

#### **Performance Optimization**
- **Index Strategy** - Index pada kolom yang sering diquery
- **Query Optimization** - Efficient query design
- **Partitioning** - Partition tabel besar
- **Archiving** - Archive data historis

### **2. Data Management**

#### **Data Quality**
- **Validation Rules** - Validasi data input
- **Data Cleaning** - Pembersihan data
- **Consistency Checks** - Konsistensi data
- **Audit Trail** - Tracking perubahan data

#### **Security**
- **Row Level Security (RLS)** - Keamanan tingkat baris
- **User Authentication** - Autentikasi user
- **Access Control** - Kontrol akses
- **Data Encryption** - Enkripsi data sensitif

### **3. Reporting & Analytics**

#### **Report Design**
- **Consistent Format** - Format laporan konsisten
- **Performance Metrics** - KPI yang relevan
- **Visualization** - Grafik dan chart yang jelas
- **Drill-down Capability** - Analisis detail

#### **Data Analysis**
- **Trend Analysis** - Analisis tren
- **Comparative Analysis** - Analisis perbandingan
- **Variance Analysis** - Analisis variansi
- **Forecasting** - Prediksi masa depan

### **4. Maintenance & Support**

#### **Regular Maintenance**
- **Data Backup** - Backup data reguler
- **Performance Monitoring** - Monitoring performa
- **Update Procedures** - Prosedur update
- **Documentation** - Dokumentasi sistem

#### **User Training**
- **System Training** - Pelatihan sistem
- **Best Practices** - Praktik terbaik
- **Troubleshooting** - Pemecahan masalah
- **Support Documentation** - Dokumentasi support

---

**Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang**
