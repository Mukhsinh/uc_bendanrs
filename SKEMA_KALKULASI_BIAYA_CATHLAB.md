# Skema Database: Kalkulasi Biaya Cathlab (UK045)

## 📋 Metadata Tabel

| Properti | Nilai |
|----------|-------|
| **Nama Tabel** | `kalkulasi_biaya_cathlab` |
| **Unit Kerja** | UK045 - Cathlab (Kateterisasi Jantung) |
| **Total Kolom** | 44 kolom |
| **Tabel Master** | `tindakan_cathlab` |
| **Foreign Key** | `user_id` → `auth.users(id)` |
| **RLS Enabled** | ✅ Yes |
| **Total Indexes** | 5 |
| **Total Triggers** | 2 (auto-calculate) |
| **Total RPC Functions** | 2 (kalkulasi) |

---

## 📊 STRUKTUR KOLOM LENGKAP

### A. Kolom Identitas & Metadata

```sql
-- Primary Key & Identitas
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- User & Waktu
user_id UUID REFERENCES auth.users(id)
tahun INTEGER NOT NULL

-- Unit Kerja
kode_unit_kerja TEXT DEFAULT 'UK045'
nama_unit_kerja TEXT DEFAULT 'Cathlab'

-- Identifikasi Tindakan (dari tindakan_cathlab)
kode TEXT NOT NULL                    -- CL.01, CL.02, dst
jenis_pemeriksaan TEXT NOT NULL       -- Nama tindakan

-- Timestamp
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Constraint:**
- Unique: `(user_id, tahun, kode)`
- Not Null: `tahun`, `kode`, `jenis_pemeriksaan`

---

### B. Kolom Parameter Input

```sql
-- Volume & Waktu
jumlah INTEGER DEFAULT 0                    -- Jumlah tindakan per tahun
waktu_pemeriksaan INTEGER DEFAULT 0         -- Waktu dalam menit

-- Tingkat Kompleksitas
profesionalisme INTEGER DEFAULT 1           -- Range: 1-4
tingkat_kesulitan INTEGER DEFAULT 1         -- Range: 1-5
```

**Deskripsi Parameter:**

| Parameter | Range | Default | Deskripsi |
|-----------|-------|---------|-----------|
| `jumlah` | 0 - ∞ | 0 | Jumlah tindakan per tahun |
| `waktu_pemeriksaan` | 30 - 220 | 0 | Durasi tindakan (menit) |
| `profesionalisme` | 1 - 4 | 1 | Level keahlian SDM |
| `tingkat_kesulitan` | 1 - 5 | 1 | Kompleksitas tindakan |

**Contoh Nilai:**
- Angiografi diagnostik: `jumlah=60`, `waktu=30`, `prof=4`, `kesulitan=3`
- PCI 3+ stent: `jumlah=1`, `waktu=220`, `prof=4`, `kesulitan=5`

---

### C. Kolom Kalkulasi (Auto-calculated)

```sql
-- Hasil Kali (untuk alokasi biaya SDM)
hasil_kali INTEGER DEFAULT 0
  -- Formula: waktu × jumlah × profesionalisme × tingkat_kesulitan
  -- Auto-calculated by trigger

-- Hasil Kali Waktu (untuk alokasi biaya operasional)
hasil_kali_waktu NUMERIC DEFAULT 0
  -- Formula: waktu × jumlah
  -- Auto-calculated by trigger

-- Dasar Alokasi (proporsi distribusi biaya)
dasar_alokasi_hasil_kali NUMERIC DEFAULT 0
  -- Formula: hasil_kali ÷ SUM(hasil_kali semua tindakan)
  -- Range: 0.000000 - 1.000000 (6 desimal)
  -- Calculated by RPC function

dasar_alokasi_waktu NUMERIC DEFAULT 0
  -- Formula: hasil_kali_waktu ÷ SUM(hasil_kali_waktu semua tindakan)
  -- Range: 0.000000 - 1.000000 (6 desimal)
  -- Calculated by RPC function
```

**Constraint Validasi:**
```sql
-- Sum dari semua dasar_alokasi_hasil_kali harus ≈ 1.0
SELECT SUM(dasar_alokasi_hasil_kali) FROM kalkulasi_biaya_cathlab; -- ≈ 1.0

-- Sum dari semua dasar_alokasi_waktu harus ≈ 1.0
SELECT SUM(dasar_alokasi_waktu) FROM kalkulasi_biaya_cathlab; -- ≈ 1.0
```

---

### D. Kolom Bahan Pemeriksaan

```sql
-- Bahan Pemeriksaan (JSONB Array)
bahan_pemeriksaan JSONB
  -- Format: [{"nama": "...", "jumlah": n, "harga_satuan": x, "harga_total": y}]

-- Biaya Bahan (Auto-calculated from JSON)
biaya_bahan_pemeriksaan_numeric INTEGER DEFAULT 0
  -- Formula: SUM(harga_total dari bahan_pemeriksaan)
  -- Auto-calculated by trigger
```

**Contoh JSONB:**
```json
[
  {
    "nama": "Kontras Iodine",
    "jumlah": 2,
    "satuan": "botol",
    "harga_satuan": 500000,
    "harga_total": 1000000
  },
  {
    "nama": "Stent Coronary",
    "jumlah": 3,
    "satuan": "unit",
    "harga_satuan": 15000000,
    "harga_total": 45000000
  }
]
```

---

### E. Kolom Biaya (25 Komponen)

#### E1. Biaya SDM (menggunakan dasar_alokasi_hasil_kali)

```sql
biaya_gaji_tunjangan BIGINT DEFAULT 0
  -- Distribusi: (biaya_gaji_tahunan × dasar_alokasi_hasil_kali) ÷ jumlah

biaya_jasa_pelayanan BIGINT DEFAULT 0
  -- Catatan: Dikosongkan (set 0) sesuai kebijakan
```

#### E2. Biaya Bahan (menggunakan dasar_alokasi_waktu)

```sql
biaya_obat BIGINT DEFAULT 0
biaya_bhp BIGINT DEFAULT 0
biaya_makan_karyawan BIGINT DEFAULT 0
biaya_makan_pasien BIGINT DEFAULT 0
```

#### E3. Biaya Operasional (menggunakan dasar_alokasi_waktu)

```sql
biaya_rumah_tangga BIGINT DEFAULT 0
biaya_cetak BIGINT DEFAULT 0
biaya_atk BIGINT DEFAULT 0
biaya_listrik BIGINT DEFAULT 0
biaya_air BIGINT DEFAULT 0
biaya_telp BIGINT DEFAULT 0
biaya_operasional_lainnya BIGINT DEFAULT 0
```

#### E4. Biaya Pemeliharaan (menggunakan dasar_alokasi_waktu)

```sql
biaya_pemeliharaan_bangunan BIGINT DEFAULT 0
biaya_pemeliharaan_alat_medis BIGINT DEFAULT 0
biaya_pemeliharaan_alat_non_medis BIGINT DEFAULT 0
```

#### E5. Biaya Penyusutan (menggunakan dasar_alokasi_waktu)

```sql
biaya_penyusutan_gedung BIGINT DEFAULT 0
biaya_penyusutan_jaringan BIGINT DEFAULT 0
biaya_penyusutan_alat_medis BIGINT DEFAULT 0
biaya_penyusutan_alat_non_medis BIGINT DEFAULT 0
```

#### E6. Biaya Lainnya (menggunakan dasar_alokasi_waktu)

```sql
biaya_pendidikan_pelatihan BIGINT DEFAULT 0
biaya_laundry BIGINT DEFAULT 0
biaya_sterilisasi BIGINT DEFAULT 0
```

#### E7. Biaya Tidak Langsung (menggunakan dasar_alokasi_waktu)

```sql
biaya_tidak_langsung_terdistribusi BIGINT DEFAULT 0
  -- Sumber: distribusi_biaya_rekap.uk045_cathlab
```

**Formula Distribusi Biaya:**
```sql
-- Untuk biaya SDM
biaya = (biaya_tahunan_uk045 × dasar_alokasi_hasil_kali) ÷ jumlah

-- Untuk biaya operasional, pemeliharaan, penyusutan, dll
biaya = (biaya_tahunan_uk045 × dasar_alokasi_waktu) ÷ jumlah

-- Untuk biaya tidak langsung
biaya = (uk045_cathlab_dari_rekap × dasar_alokasi_waktu) ÷ jumlah
```

---

### F. Kolom Unit Cost (Generated Column)

```sql
unit_cost_per_tindakan BIGINT GENERATED ALWAYS AS (
  COALESCE(biaya_gaji_tunjangan, 0) +
  COALESCE(biaya_jasa_pelayanan, 0) +
  COALESCE(biaya_obat, 0) +
  COALESCE(biaya_bhp, 0) +
  COALESCE(biaya_makan_karyawan, 0) +
  COALESCE(biaya_makan_pasien, 0) +
  COALESCE(biaya_rumah_tangga, 0) +
  COALESCE(biaya_cetak, 0) +
  COALESCE(biaya_atk, 0) +
  COALESCE(biaya_listrik, 0) +
  COALESCE(biaya_air, 0) +
  COALESCE(biaya_telp, 0) +
  COALESCE(biaya_pemeliharaan_bangunan, 0) +
  COALESCE(biaya_pemeliharaan_alat_medis, 0) +
  COALESCE(biaya_pemeliharaan_alat_non_medis, 0) +
  COALESCE(biaya_operasional_lainnya, 0) +
  COALESCE(biaya_penyusutan_gedung, 0) +
  COALESCE(biaya_penyusutan_jaringan, 0) +
  COALESCE(biaya_penyusutan_alat_medis, 0) +
  COALESCE(biaya_penyusutan_alat_non_medis, 0) +
  COALESCE(biaya_pendidikan_pelatihan, 0) +
  COALESCE(biaya_laundry, 0) +
  COALESCE(biaya_sterilisasi, 0) +
  COALESCE(biaya_tidak_langsung_terdistribusi, 0) +
  COALESCE(biaya_bahan_pemeriksaan_numeric, 0)
) STORED
```

**Karakteristik:**
- Auto-calculated setiap kali ada perubahan pada kolom biaya
- Tidak bisa di-update manual
- Selalu reflect total terkini dari 25 komponen biaya

---

## 🔧 TRIGGERS

### 1. Trigger: Auto-Calculate Hasil Kali

**Nama:** `trigger_calculate_hasil_kali_cathlab`  
**Event:** BEFORE INSERT OR UPDATE OF (jumlah, waktu_pemeriksaan, profesionalisme, tingkat_kesulitan)  
**Function:** `calculate_hasil_kali_cathlab()`

**Deskripsi:**
Otomatis menghitung `hasil_kali` dan `hasil_kali_waktu` setiap kali ada perubahan pada parameter input.

**Implementasi:**
```sql
CREATE OR REPLACE FUNCTION calculate_hasil_kali_cathlab()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate hasil_kali = waktu × jumlah × profesionalisme × tingkat_kesulitan
  NEW.hasil_kali := COALESCE(NEW.waktu_pemeriksaan, 0) * 
                    COALESCE(NEW.jumlah, 0) * 
                    COALESCE(NEW.profesionalisme, 1) * 
                    COALESCE(NEW.tingkat_kesulitan, 1);
  
  -- Calculate hasil_kali_waktu = waktu × jumlah
  NEW.hasil_kali_waktu := COALESCE(NEW.waktu_pemeriksaan, 0) * 
                          COALESCE(NEW.jumlah, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Contoh:**
```sql
-- User update jumlah
UPDATE kalkulasi_biaya_cathlab
SET jumlah = 60
WHERE kode = 'CL.02';

-- Trigger otomatis calculate:
-- hasil_kali = 30 × 60 × 4 × 3 = 21,600
-- hasil_kali_waktu = 30 × 60 = 1,800
```

---

### 2. Trigger: Auto-Calculate Biaya Bahan

**Nama:** `trigger_calculate_biaya_bahan_cathlab`  
**Event:** BEFORE INSERT OR UPDATE OF (bahan_pemeriksaan)  
**Function:** `calculate_biaya_bahan_cathlab()`

**Deskripsi:**
Otomatis menghitung `biaya_bahan_pemeriksaan_numeric` dari JSONB array `bahan_pemeriksaan`.

**Implementasi:**
```sql
CREATE OR REPLACE FUNCTION calculate_biaya_bahan_cathlab()
RETURNS TRIGGER AS $$
DECLARE
  v_total_biaya INTEGER := 0;
  v_item JSONB;
BEGIN
  IF NEW.bahan_pemeriksaan IS NOT NULL AND jsonb_typeof(NEW.bahan_pemeriksaan) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.bahan_pemeriksaan)
    LOOP
      v_total_biaya := v_total_biaya + COALESCE((v_item->>'harga_total')::INTEGER, 0);
    END LOOP;
  END IF;
  
  NEW.biaya_bahan_pemeriksaan_numeric := v_total_biaya;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Contoh:**
```sql
-- User input bahan
UPDATE kalkulasi_biaya_cathlab
SET bahan_pemeriksaan = '[
  {"nama": "Stent", "jumlah": 3, "harga_satuan": 15000000, "harga_total": 45000000},
  {"nama": "Kontras", "jumlah": 2, "harga_satuan": 500000, "harga_total": 1000000}
]'
WHERE kode = 'CL.13';

-- Trigger otomatis calculate:
-- biaya_bahan_pemeriksaan_numeric = 45,000,000 + 1,000,000 = 46,000,000
```

---

## 🎯 RPC FUNCTIONS

### 1. RPC: Calculate Dasar Alokasi

**Nama:** `fix_dasar_alokasi_cathlab(p_user_id UUID, p_tahun INTEGER)`  
**Return:** TABLE(status TEXT, total_records INTEGER, total_hasil_kali NUMERIC, total_hasil_kali_waktu NUMERIC)

**Deskripsi:**
Menghitung dasar alokasi (proporsi) untuk semua tindakan berdasarkan hasil kali dan hasil kali waktu.

**Algoritma:**
```sql
1. Hitung total_hasil_kali = SUM(hasil_kali) untuk semua tindakan
2. Hitung total_hasil_kali_waktu = SUM(hasil_kali_waktu) untuk semua tindakan
3. Untuk setiap tindakan:
   - dasar_alokasi_hasil_kali = hasil_kali ÷ total_hasil_kali
   - dasar_alokasi_waktu = hasil_kali_waktu ÷ total_hasil_kali_waktu
4. Bulatkan ke 6 desimal
```

**Implementasi:**
```sql
CREATE OR REPLACE FUNCTION fix_dasar_alokasi_cathlab(
  p_user_id UUID,
  p_tahun INTEGER
)
RETURNS TABLE(
  status TEXT,
  total_records INTEGER,
  total_hasil_kali NUMERIC,
  total_hasil_kali_waktu NUMERIC
) AS $$
DECLARE
  v_total_hasil_kali NUMERIC;
  v_total_hasil_kali_waktu NUMERIC;
  v_count INTEGER;
BEGIN
  -- Get totals
  SELECT 
    COALESCE(SUM(hasil_kali), 0),
    COALESCE(SUM(hasil_kali_waktu), 0),
    COUNT(*)
  INTO v_total_hasil_kali, v_total_hasil_kali_waktu, v_count
  FROM kalkulasi_biaya_cathlab
  WHERE user_id = p_user_id AND tahun = p_tahun;
  
  -- Update dasar_alokasi_hasil_kali
  UPDATE kalkulasi_biaya_cathlab
  SET dasar_alokasi_hasil_kali = CASE 
    WHEN v_total_hasil_kali > 0 THEN ROUND((hasil_kali::NUMERIC / v_total_hasil_kali), 6)
    ELSE 0
  END
  WHERE user_id = p_user_id AND tahun = p_tahun;
  
  -- Update dasar_alokasi_waktu
  UPDATE kalkulasi_biaya_cathlab
  SET dasar_alokasi_waktu = CASE 
    WHEN v_total_hasil_kali_waktu > 0 THEN ROUND((hasil_kali_waktu::NUMERIC / v_total_hasil_kali_waktu), 6)
    ELSE 0
  END
  WHERE user_id = p_user_id AND tahun = p_tahun;
  
  RETURN QUERY
  SELECT 
    'SUCCESS'::TEXT,
    v_count,
    v_total_hasil_kali,
    v_total_hasil_kali_waktu;
END;
$$ LANGUAGE plpgsql;
```

**Contoh Penggunaan:**
```sql
SELECT * FROM fix_dasar_alokasi_cathlab(
  '3394a4f5-b2ec-444d-b290-a6bdf477dc99'::UUID,
  2025
);

-- Output:
-- status: SUCCESS
-- total_records: 17
-- total_hasil_kali: 209120
-- total_hasil_kali_waktu: 13300
```

---

### 2. RPC: Distribute Biaya

**Nama:** `fix_biaya_calculation_cathlab(p_user_id UUID, p_tahun INTEGER)`  
**Return:** TABLE(status TEXT, records_updated INTEGER, total_unit_cost BIGINT)

**Deskripsi:**
Mendistribusikan biaya tahunan dari `data_biaya` dan `distribusi_biaya_rekap` ke setiap tindakan.

**Sumber Data:**
```sql
-- 1. Biaya tahunan UK045
SELECT * FROM data_biaya WHERE kode_unit_kerja = 'UK045' AND tahun = 2025;
-- → biaya_gaji_tunjangan: Rp 80,869,914
-- → biaya_obat, biaya_bhp, biaya_listrik, dll

-- 2. Biaya tidak langsung
SELECT uk045_cathlab FROM distribusi_biaya_rekap 
WHERE tahun = 2025 AND biaya = 'Biaya Tidak Langsung Terdistribusi';
-- → uk045_cathlab: Rp 154,523,416
```

**Algoritma:**
```sql
FOR EACH tindakan:
  -- Biaya SDM (dasar_alokasi_hasil_kali)
  biaya_gaji_tunjangan = (biaya_gaji_tahunan × dasar_alokasi_hasil_kali) ÷ jumlah
  
  -- Biaya Operasional (dasar_alokasi_waktu)
  biaya_obat = (biaya_obat_tahunan × dasar_alokasi_waktu) ÷ jumlah
  biaya_bhp = (biaya_bhp_tahunan × dasar_alokasi_waktu) ÷ jumlah
  biaya_listrik = (biaya_listrik_tahunan × dasar_alokasi_waktu) ÷ jumlah
  ... (18 komponen lainnya)
  
  -- Biaya Tidak Langsung (dasar_alokasi_waktu)
  biaya_tidak_langsung = (uk045_cathlab × dasar_alokasi_waktu) ÷ jumlah
END FOR
```

**Implementasi:** *(lihat migration file untuk kode lengkap)*

**Contoh Penggunaan:**
```sql
SELECT * FROM fix_biaya_calculation_cathlab(
  '3394a4f5-b2ec-444d-b290-a6bdf477dc99'::UUID,
  2025
);

-- Output:
-- status: SUCCESS
-- records_updated: 17
-- total_unit_cost: 190845682 (Rp 190,845,682)
```

---

## 🔗 RELASI ANTAR TABEL

### Diagram ER

```
┌─────────────────────┐
│   tindakan_cathlab  │
│  (Master Tindakan)  │
├─────────────────────┤
│ • kode_tindakan     │◄─────┐
│ • nama_tindakan     │      │ Sync via Trigger
└─────────────────────┘      │
                             │
┌─────────────────────┐      │
│     auth.users      │      │
├─────────────────────┤      │
│ • id                │◄───┐ │
└─────────────────────┘    │ │
                           │ │
                    FK     │ │ Relasi Logis
┌──────────────────────────┼─┼────────────────────────────┐
│  kalkulasi_biaya_cathlab │ │                            │
├──────────────────────────┼─┼────────────────────────────┤
│ • id (PK)                │ │                            │
│ • user_id ───────────────┘ │                            │
│ • kode ─────────────────────┘                            │
│ • jenis_pemeriksaan                                      │
│ • jumlah, waktu_pemeriksaan                              │
│ • hasil_kali, dasar_alokasi                              │
│ • biaya_gaji_tunjangan ◄────────┐                        │
│ • biaya_tidak_langsung ◄────┐   │                        │
│ • unit_cost_per_tindakan    │   │                        │
└─────────────────────────────┼───┼────────────────────────┘
                              │   │
                              │   │ Distribusi via RPC
┌─────────────────────────────┼───┼────────────────────────┐
│       data_biaya            │   │                        │
│     (Biaya Tahunan)         │   │                        │
├─────────────────────────────┼───┼────────────────────────┤
│ • kode_unit_kerja = 'UK045' │   │                        │
│ • biaya_gaji_tunjangan ─────┘   │                        │
│ • biaya_obat, biaya_bhp, dll    │                        │
└─────────────────────────────────┘                        │
                                                           │
┌──────────────────────────────────────────────────────────┘
│  distribusi_biaya_rekap                                  │
│  (Biaya Tidak Langsung)                                  │
├──────────────────────────────────────────────────────────┤
│ • uk045_cathlab ─────────────────────────────────────────┘
│ • biaya = 'Biaya Tidak Langsung Terdistribusi'
└──────────────────────────────────────────────────────────┘
```

### Foreign Keys

| Kolom | References | On Delete | On Update |
|-------|------------|-----------|-----------|
| `user_id` | `auth.users(id)` | CASCADE | CASCADE |

### Logical Relations (tanpa FK constraint)

| Kolom | References | Sync Method |
|-------|------------|-------------|
| `kode` | `tindakan_cathlab.kode_tindakan` | Trigger auto-sync |
| `jenis_pemeriksaan` | `tindakan_cathlab.nama_tindakan` | Trigger auto-update |

---

## 🔐 ROW LEVEL SECURITY (RLS)

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE kalkulasi_biaya_cathlab ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy
CREATE POLICY "Users can view their own cathlab data"
  ON kalkulasi_biaya_cathlab FOR SELECT
  USING (auth.uid() = user_id);

-- 2. INSERT Policy
CREATE POLICY "Users can insert their own cathlab data"
  ON kalkulasi_biaya_cathlab FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE Policy
CREATE POLICY "Users can update their own cathlab data"
  ON kalkulasi_biaya_cathlab FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. DELETE Policy
CREATE POLICY "Users can delete their own cathlab data"
  ON kalkulasi_biaya_cathlab FOR DELETE
  USING (auth.uid() = user_id);
```

### Test RLS

```sql
-- User hanya bisa lihat data mereka sendiri
SELECT * FROM kalkulasi_biaya_cathlab;
-- ✅ Hanya return data dengan user_id = auth.uid()

-- User tidak bisa lihat data user lain
SELECT * FROM kalkulasi_biaya_cathlab WHERE user_id = 'other-user-id';
-- ✅ Return empty (tidak error, tapi filtered)

-- User tidak bisa insert dengan user_id orang lain
INSERT INTO kalkulasi_biaya_cathlab (user_id, ...) VALUES ('other-user-id', ...);
-- ❌ Error: policy violation
```

---

## ⚡ INDEXES

### Index List

```sql
-- 1. Primary Key Index (auto-created)
CREATE UNIQUE INDEX kalkulasi_biaya_cathlab_pkey ON kalkulasi_biaya_cathlab(id);

-- 2. User Index (untuk RLS & filtering)
CREATE INDEX idx_kalkulasi_biaya_cathlab_user_id 
  ON kalkulasi_biaya_cathlab(user_id);

-- 3. Year Index (untuk filtering by tahun)
CREATE INDEX idx_kalkulasi_biaya_cathlab_tahun 
  ON kalkulasi_biaya_cathlab(tahun);

-- 4. Code Index (untuk lookup by kode)
CREATE INDEX idx_kalkulasi_biaya_cathlab_kode 
  ON kalkulasi_biaya_cathlab(kode);

-- 5. Composite Index (untuk query kombinasi user + tahun)
CREATE INDEX idx_kalkulasi_biaya_cathlab_user_tahun 
  ON kalkulasi_biaya_cathlab(user_id, tahun);
```

### Query Performance

| Query | Index Used | Scan Type |
|-------|-----------|-----------|
| `WHERE user_id = '...'` | #2 | Index Scan |
| `WHERE tahun = 2025` | #3 | Index Scan |
| `WHERE kode = 'CL.02'` | #4 | Index Scan |
| `WHERE user_id = '...' AND tahun = 2025` | #5 | Index Scan (optimal) |
| `WHERE jenis_pemeriksaan LIKE '%PCI%'` | - | Seq Scan (slow) |

**Rekomendasi Query:**
```sql
-- ✅ GOOD: Menggunakan index
SELECT * FROM kalkulasi_biaya_cathlab
WHERE user_id = auth.uid() AND tahun = 2025;

-- ✅ GOOD: Specific lookup
SELECT * FROM kalkulasi_biaya_cathlab
WHERE user_id = auth.uid() AND tahun = 2025 AND kode = 'CL.13';

-- ❌ AVOID: Full table scan
SELECT * FROM kalkulasi_biaya_cathlab
WHERE jenis_pemeriksaan LIKE '%PCI%';
```

---

## 📊 CONTOH DATA

### Sample Record: CL.13 - PCI lebih dari 3 stent

```sql
{
  "id": "uuid-here",
  "user_id": "3394a4f5-b2ec-444d-b290-a6bdf477dc99",
  "tahun": 2025,
  "kode_unit_kerja": "UK045",
  "nama_unit_kerja": "Cathlab",
  "kode": "CL.13",
  "jenis_pemeriksaan": "PCI (Percutaneous Coronary Intervention) lebih dari 3 stent",
  
  -- Parameter Input
  "jumlah": 1,
  "waktu_pemeriksaan": 220,
  "profesionalisme": 4,
  "tingkat_kesulitan": 5,
  
  -- Kalkulasi (Auto)
  "hasil_kali": 4400,                    -- 220 × 1 × 4 × 5
  "hasil_kali_waktu": 220,               -- 220 × 1
  "dasar_alokasi_hasil_kali": 0.021041,  -- 4400 ÷ 209120
  "dasar_alokasi_waktu": 0.016541,       -- 220 ÷ 13300
  
  -- Bahan
  "bahan_pemeriksaan": null,
  "biaya_bahan_pemeriksaan_numeric": 0,
  
  -- Biaya (Distributed)
  "biaya_gaji_tunjangan": 1701584,
  "biaya_jasa_pelayanan": 0,
  "biaya_obat": 0,
  "biaya_bhp": 0,
  "biaya_listrik": 238188,
  "biaya_penyusutan_alat_medis": 16412462,
  "biaya_tidak_langsung_terdistribusi": 2555972,
  
  -- Unit Cost (Generated)
  "unit_cost_per_tindakan": 22285702,    -- Sum dari 25 komponen
  
  -- Timestamp
  "created_at": "2025-10-02T10:00:00Z",
  "updated_at": "2025-10-02T10:30:00Z"
}
```

### Breakdown Biaya CL.13

| Komponen | Nilai | % dari Total |
|----------|-------|--------------|
| Gaji & Tunjangan | Rp 1,701,584 | 7.6% |
| Listrik | Rp 238,188 | 1.1% |
| **Penyusutan Alat Medis** | **Rp 16,412,462** | **73.6%** ⭐ |
| Biaya Tidak Langsung | Rp 2,555,972 | 11.5% |
| Komponen Lainnya | Rp 1,377,496 | 6.2% |
| **TOTAL** | **Rp 22,285,702** | **100%** |

💡 **Insight:** Penyusutan alat medis dominan karena peralatan cathlab sangat mahal (angiography machine, dll).

---

## 🔄 WORKFLOW KALKULASI

### Step-by-Step Process

```
1. USER INPUT
   │
   ├─ Input: jumlah, waktu_pemeriksaan, profesionalisme, tingkat_kesulitan
   └─ Optional: bahan_pemeriksaan (JSONB)
   
2. TRIGGER: calculate_hasil_kali_cathlab()
   │
   ├─ Auto-calculate: hasil_kali = waktu × jumlah × prof × kesulitan
   └─ Auto-calculate: hasil_kali_waktu = waktu × jumlah
   
3. RPC: fix_dasar_alokasi_cathlab(user_id, tahun)
   │
   ├─ Calculate: total_hasil_kali (sum semua tindakan)
   ├─ Calculate: total_hasil_kali_waktu (sum semua tindakan)
   ├─ Update: dasar_alokasi_hasil_kali untuk setiap tindakan
   └─ Update: dasar_alokasi_waktu untuk setiap tindakan
   
4. RPC: fix_biaya_calculation_cathlab(user_id, tahun)
   │
   ├─ Get: biaya tahunan dari data_biaya (UK045)
   ├─ Get: biaya tidak langsung dari distribusi_biaya_rekap
   ├─ Distribute: biaya_gaji_tunjangan (× dasar_alokasi_hasil_kali)
   ├─ Distribute: biaya operasional (× dasar_alokasi_waktu)
   └─ Distribute: biaya_tidak_langsung (× dasar_alokasi_waktu)
   
5. GENERATED COLUMN: unit_cost_per_tindakan
   │
   └─ Auto-calculate: SUM(25 komponen biaya)
   
6. RESULT
   └─ Unit Cost per Tindakan siap digunakan
```

---

## 📝 QUERY EXAMPLES

### 1. Get All Cathlab Calculations

```sql
SELECT 
    kode,
    jenis_pemeriksaan,
    jumlah,
    waktu_pemeriksaan,
    TO_CHAR(unit_cost_per_tindakan, 'FMRp999,999,999') as unit_cost
FROM kalkulasi_biaya_cathlab
WHERE user_id = auth.uid() 
  AND tahun = 2025
ORDER BY unit_cost_per_tindakan DESC;
```

### 2. Get Top 5 Most Expensive Procedures

```sql
SELECT 
    ROW_NUMBER() OVER (ORDER BY unit_cost_per_tindakan DESC) as rank,
    kode,
    jenis_pemeriksaan,
    TO_CHAR(unit_cost_per_tindakan, 'FMRp999,999,999') as unit_cost
FROM kalkulasi_biaya_cathlab
WHERE user_id = auth.uid() 
  AND tahun = 2025
  AND jumlah > 0
ORDER BY unit_cost_per_tindakan DESC
LIMIT 5;
```

### 3. Get Total Unit Cost Summary

```sql
SELECT 
    COUNT(*) as total_tindakan,
    SUM(jumlah) as total_volume,
    TO_CHAR(SUM(unit_cost_per_tindakan), 'FMRp999,999,999') as grand_total_unit_cost,
    TO_CHAR(AVG(unit_cost_per_tindakan), 'FMRp999,999,999') as avg_unit_cost
FROM kalkulasi_biaya_cathlab
WHERE user_id = auth.uid() 
  AND tahun = 2025
  AND jumlah > 0;
```

### 4. Get Detailed Breakdown for Specific Procedure

```sql
SELECT 
    kode,
    jenis_pemeriksaan,
    -- Parameters
    jumlah,
    waktu_pemeriksaan,
    profesionalisme,
    tingkat_kesulitan,
    -- Allocation
    ROUND(dasar_alokasi_hasil_kali::NUMERIC, 6) as da_hasil_kali,
    ROUND(dasar_alokasi_waktu::NUMERIC, 6) as da_waktu,
    -- Cost Breakdown
    TO_CHAR(biaya_gaji_tunjangan, 'FMRp999,999,999') as biaya_gaji,
    TO_CHAR(biaya_penyusutan_alat_medis, 'FMRp999,999,999') as biaya_penyusutan_alkes,
    TO_CHAR(biaya_tidak_langsung_terdistribusi, 'FMRp999,999,999') as biaya_tdk_langsung,
    TO_CHAR(unit_cost_per_tindakan, 'FMRp999,999,999') as total_unit_cost
FROM kalkulasi_biaya_cathlab
WHERE user_id = auth.uid() 
  AND tahun = 2025
  AND kode = 'CL.13';
```

### 5. Validate Dasar Alokasi (Should sum to 1.0)

```sql
SELECT 
    ROUND(SUM(dasar_alokasi_hasil_kali)::NUMERIC, 6) as sum_da_hasil_kali,
    ROUND(SUM(dasar_alokasi_waktu)::NUMERIC, 6) as sum_da_waktu,
    CASE 
        WHEN ROUND(SUM(dasar_alokasi_hasil_kali)::NUMERIC, 2) = 1.00 
        THEN '✅ VALID'
        ELSE '❌ ERROR'
    END as validation_status
FROM kalkulasi_biaya_cathlab
WHERE user_id = auth.uid() 
  AND tahun = 2025;
```

---

## 🧪 TESTING & VALIDATION

### Test 1: Insert New Record

```sql
INSERT INTO kalkulasi_biaya_cathlab (
    user_id, tahun, kode, jenis_pemeriksaan,
    jumlah, waktu_pemeriksaan, profesionalisme, tingkat_kesulitan
) VALUES (
    auth.uid(), 2025, 'CL.99', 'Test Procedure',
    10, 60, 4, 4
);

-- ✅ Expected: hasil_kali = 60×10×4×4 = 9600 (auto-calculated)
-- ✅ Expected: hasil_kali_waktu = 60×10 = 600 (auto-calculated)
```

### Test 2: Update Parameters

```sql
UPDATE kalkulasi_biaya_cathlab
SET jumlah = 20
WHERE kode = 'CL.99' AND user_id = auth.uid() AND tahun = 2025;

-- ✅ Expected: hasil_kali recalculated to 60×20×4×4 = 19200
-- ✅ Expected: hasil_kali_waktu recalculated to 60×20 = 1200
```

### Test 3: Add Bahan Pemeriksaan

```sql
UPDATE kalkulasi_biaya_cathlab
SET bahan_pemeriksaan = '[
    {"nama": "Kontras", "jumlah": 2, "harga_satuan": 500000, "harga_total": 1000000}
]'
WHERE kode = 'CL.99' AND user_id = auth.uid() AND tahun = 2025;

-- ✅ Expected: biaya_bahan_pemeriksaan_numeric = 1000000 (auto-calculated)
```

### Test 4: Run Full Calculation

```sql
-- Step 1: Calculate dasar alokasi
SELECT * FROM fix_dasar_alokasi_cathlab(auth.uid(), 2025);
-- ✅ Expected: status = SUCCESS

-- Step 2: Distribute biaya
SELECT * FROM fix_biaya_calculation_cathlab(auth.uid(), 2025);
-- ✅ Expected: status = SUCCESS, records_updated > 0

-- Step 3: Verify unit_cost is calculated
SELECT kode, unit_cost_per_tindakan 
FROM kalkulasi_biaya_cathlab
WHERE kode = 'CL.99' AND user_id = auth.uid() AND tahun = 2025;
-- ✅ Expected: unit_cost_per_tindakan > 0
```

---

## 📚 BEST PRACTICES

### DO ✅

1. **Selalu filter by user_id dan tahun:**
   ```sql
   WHERE user_id = auth.uid() AND tahun = 2025
   ```

2. **Gunakan RPC functions untuk kalkulasi:**
   ```sql
   SELECT * FROM fix_dasar_alokasi_cathlab(auth.uid(), 2025);
   SELECT * FROM fix_biaya_calculation_cathlab(auth.uid(), 2025);
   ```

3. **Validasi dasar alokasi setelah kalkulasi:**
   ```sql
   SELECT SUM(dasar_alokasi_hasil_kali) FROM kalkulasi_biaya_cathlab;
   -- Should be ≈ 1.0
   ```

4. **Gunakan computed column untuk unit cost:**
   ```sql
   SELECT unit_cost_per_tindakan FROM ... -- ✅ Auto-calculated
   ```

### DON'T ❌

1. **Jangan manual update hasil_kali:**
   ```sql
   UPDATE kalkulasi_biaya_cathlab SET hasil_kali = 5000; -- ❌ Let trigger handle it
   ```

2. **Jangan manual update unit_cost:**
   ```sql
   UPDATE kalkulasi_biaya_cathlab SET unit_cost_per_tindakan = 10000000; -- ❌ Generated column
   ```

3. **Jangan query tanpa filter user:**
   ```sql
   SELECT * FROM kalkulasi_biaya_cathlab; -- ❌ Slow & RLS filtered
   ```

4. **Jangan skip dasar alokasi sebelum distribusi biaya:**
   ```sql
   -- ❌ Wrong order:
   SELECT * FROM fix_biaya_calculation_cathlab(...);  -- Akan error/salah
   
   -- ✅ Correct order:
   SELECT * FROM fix_dasar_alokasi_cathlab(...);      -- First
   SELECT * FROM fix_biaya_calculation_cathlab(...);  -- Then
   ```

---

## 📊 PERFORMANCE METRICS

### Typical Data Size

| Metric | Value |
|--------|-------|
| Total Records per User | 17 tindakan |
| Storage per Record | ~2 KB |
| Total Storage per User | ~34 KB |
| Query Time (with index) | < 50ms |
| Calculation Time | < 200ms |

### Scalability

| Users | Total Records | Est. Storage | Query Performance |
|-------|--------------|--------------|-------------------|
| 10 | 170 | 340 KB | ✅ Excellent |
| 100 | 1,700 | 3.4 MB | ✅ Excellent |
| 1,000 | 17,000 | 34 MB | ✅ Good |
| 10,000 | 170,000 | 340 MB | ⚠️ Need partitioning |

---

## 🔧 MAINTENANCE

### Regular Tasks

1. **Reindex (every 6 months):**
   ```sql
   REINDEX TABLE kalkulasi_biaya_cathlab;
   ```

2. **Vacuum (auto, but can force):**
   ```sql
   VACUUM ANALYZE kalkulasi_biaya_cathlab;
   ```

3. **Check Data Integrity:**
   ```sql
   -- Verify sum of dasar alokasi
   SELECT 
       tahun,
       ROUND(SUM(dasar_alokasi_hasil_kali)::NUMERIC, 4) as sum_hasil_kali,
       ROUND(SUM(dasar_alokasi_waktu)::NUMERIC, 4) as sum_waktu
   FROM kalkulasi_biaya_cathlab
   GROUP BY tahun;
   ```

### Backup

```sql
-- Export data
COPY (
    SELECT * FROM kalkulasi_biaya_cathlab 
    WHERE tahun = 2025
) TO '/path/to/backup_cathlab_2025.csv' CSV HEADER;

-- Import data
COPY kalkulasi_biaya_cathlab FROM '/path/to/backup_cathlab_2025.csv' CSV HEADER;
```

---

**Dokumentasi Dibuat:** 2 Oktober 2025  
**Versi:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2 Oktober 2025 10:30 WIB

