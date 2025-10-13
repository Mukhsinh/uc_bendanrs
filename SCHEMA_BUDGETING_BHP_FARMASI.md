# 🗄️ Schema Database: Budgeting BHP Farmasi

## 📦 Table Structure

### 1. **budgeting_bhp_farmasi** (Main Table)

```sql
CREATE TABLE budgeting_bhp_farmasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL DEFAULT 2025,
    
    -- Identitas Tindakan
    kode_jenis SMALLINT,
    kode_unit_kerja TEXT NOT NULL,
    nama_unit_kerja TEXT NOT NULL,
    kode_operator TEXT,
    nama_operator TEXT,
    kode_tindakan TEXT NOT NULL,
    nama_tindakan TEXT NOT NULL,
    
    -- Biaya & Unit Cost
    biaya_bahan BIGINT DEFAULT 0,
    unit_cost_per_tindakan BIGINT DEFAULT 0,
    
    -- ✨ KOLOM BARU
    jumlah_tindakan INTEGER DEFAULT 0,
    rincian_bahan JSONB,
    
    -- ⭐ KOLOM BUDGETING (CALCULATED)
    total_budgeting_bhp BIGINT GENERATED ALWAYS AS (
        COALESCE(biaya_bahan, 0) * COALESCE(jumlah_tindakan, 0)
    ) STORED,
    total_budgeting_rincian BIGINT DEFAULT 0,
    
    -- Metadata
    sumber_tabel TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, tahun, kode_tindakan, kode_unit_kerja, sumber_tabel)
);
```

---

### 2. **rincian_budgeting_bhp** (Detail Table)

```sql
CREATE TABLE rincian_budgeting_bhp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    budgeting_bhp_farmasi_id UUID REFERENCES budgeting_bhp_farmasi(id) ON DELETE CASCADE,
    tahun INTEGER NOT NULL DEFAULT 2025,
    
    -- Data Tindakan (Parent)
    kode_unit_kerja TEXT NOT NULL,
    nama_unit_kerja TEXT NOT NULL,
    kode_tindakan TEXT NOT NULL,
    nama_tindakan TEXT NOT NULL,
    jumlah_tindakan INTEGER DEFAULT 0,
    
    -- Data Barang
    kode_barang TEXT,
    nama_barang TEXT,
    qty_per_tindakan NUMERIC DEFAULT 0,
    satuan TEXT,
    harga_satuan NUMERIC DEFAULT 0,
    
    -- ⭐ CALCULATED FIELDS
    jumlah_total NUMERIC GENERATED ALWAYS AS (
        COALESCE(jumlah_tindakan, 0) * COALESCE(qty_per_tindakan, 0)
    ) STORED,
    
    total_rupiah NUMERIC GENERATED ALWAYS AS (
        COALESCE(jumlah_tindakan, 0) * COALESCE(qty_per_tindakan, 0) * COALESCE(harga_satuan, 0)
    ) STORED,
    
    sumber_tabel TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Relationships

### Foreign Keys:
```
budgeting_bhp_farmasi.user_id → auth.users.id
rincian_budgeting_bhp.user_id → auth.users.id
rincian_budgeting_bhp.budgeting_bhp_farmasi_id → budgeting_bhp_farmasi.id (CASCADE DELETE)
```

### Indirect Links:
```
budgeting_bhp_farmasi ← kalkulasi_biaya_laboratorium (via populate function)
budgeting_bhp_farmasi ← kalkulasi_biaya_radiologi (via populate function)
budgeting_bhp_farmasi ← kalkulasi_bdrs (via populate function)
budgeting_bhp_farmasi ← kalkulasi_biaya_operatif (via populate function)
budgeting_bhp_farmasi ← kalkulasi_biaya_cathlab (via populate function)

rincian_budgeting_bhp → data_barang_farmasi (via kode_barang for price lookup)
```

---

## 📐 Formulas & Calculations

### Table 1: budgeting_bhp_farmasi

#### Generated Column:
```sql
total_budgeting_bhp = biaya_bahan × jumlah_tindakan
```

#### Trigger-Calculated Column:
```sql
total_budgeting_rincian = SUM(total_rupiah FROM rincian_budgeting_bhp WHERE budgeting_bhp_farmasi_id = id)
```

### Table 2: rincian_budgeting_bhp

#### Generated Column 1:
```sql
jumlah_total = jumlah_tindakan × qty_per_tindakan
```

#### Generated Column 2:
```sql
total_rupiah = jumlah_total × harga_satuan
            = jumlah_tindakan × qty_per_tindakan × harga_satuan
```

---

## 🔐 Security (RLS)

### budgeting_bhp_farmasi Policies:
```sql
-- SELECT
CREATE POLICY "Users can view their own budgeting_bhp_farmasi"
    ON budgeting_bhp_farmasi FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own budgeting_bhp_farmasi"
    ON budgeting_bhp_farmasi FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own budgeting_bhp_farmasi"
    ON budgeting_bhp_farmasi FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own budgeting_bhp_farmasi"
    ON budgeting_bhp_farmasi FOR DELETE
    USING (auth.uid() = user_id);
```

### rincian_budgeting_bhp Policies:
Same as above, applied to `rincian_budgeting_bhp`.

---

## 📑 Indexes

### budgeting_bhp_farmasi:
```sql
CREATE INDEX idx_budgeting_bhp_user_tahun 
    ON budgeting_bhp_farmasi(user_id, tahun);

CREATE INDEX idx_budgeting_bhp_sumber_tabel 
    ON budgeting_bhp_farmasi(sumber_tabel);

CREATE INDEX idx_budgeting_bhp_kode_tindakan 
    ON budgeting_bhp_farmasi(kode_tindakan);
```

### rincian_budgeting_bhp:
```sql
CREATE INDEX idx_rincian_budgeting_user_tahun 
    ON rincian_budgeting_bhp(user_id, tahun);

CREATE INDEX idx_rincian_budgeting_parent_id 
    ON rincian_budgeting_bhp(budgeting_bhp_farmasi_id);

CREATE INDEX idx_rincian_budgeting_kode_barang 
    ON rincian_budgeting_bhp(kode_barang);
```

---

## 🔄 Functions

### 1. populate_budgeting_bhp_farmasi(p_user_id, p_tahun)

**Type:** SECURITY DEFINER  
**Returns:** TEXT

**Algorithm:**
```
FOR EACH source_table IN (lab, rad, bdrs, operatif, cathlab)
  INSERT INTO budgeting_bhp_farmasi
    SELECT data FROM source_table
  ON CONFLICT DO UPDATE
    SET biaya_bahan = EXCLUDED.biaya_bahan,
        jumlah_tindakan = EXCLUDED.jumlah_tindakan,
        rincian_bahan = EXCLUDED.rincian_bahan
END FOR
```

---

### 2. populate_rincian_budgeting_bhp(p_user_id, p_tahun)

**Type:** SECURITY DEFINER  
**Returns:** TEXT

**Algorithm:**
```
DELETE old rincian_budgeting_bhp records

FOR EACH budgeting_record WITH rincian_bahan
  FOR EACH bahan_item IN JSON_ARRAY(rincian_bahan)
    kode_barang = bahan_item.kode_barang
    qty = bahan_item.qty
    
    IF kode_barang EXISTS
      harga = SELECT harga FROM data_barang_farmasi WHERE kode_barang = kode_barang
    ELSE
      harga = bahan_item.harga_satuan
    END IF
    
    INSERT INTO rincian_budgeting_bhp (
      kode_barang, nama_barang, qty_per_tindakan, harga_satuan, ...
    )
  END FOR
END FOR

UPDATE budgeting_bhp_farmasi
  SET total_budgeting_rincian = SUM(rincian.total_rupiah)
```

---

## 🔄 Triggers

### Auto-Update Triggers:

```sql
-- 1. Laboratorium
CREATE TRIGGER trigger_auto_update_budgeting_bhp_lab
    AFTER INSERT OR UPDATE ON kalkulasi_biaya_laboratorium
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_budgeting_bhp_farmasi();

-- 2. Radiologi  
CREATE TRIGGER trigger_auto_update_budgeting_bhp_rad
    AFTER INSERT OR UPDATE ON kalkulasi_biaya_radiologi
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_budgeting_bhp_farmasi();

-- 3. BDRS
CREATE TRIGGER trigger_auto_update_budgeting_bhp_bdrs
    AFTER INSERT OR UPDATE ON kalkulasi_bdrs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_budgeting_bhp_farmasi();

-- 4. Operatif
CREATE TRIGGER trigger_auto_update_budgeting_bhp_operatif
    AFTER INSERT OR UPDATE ON kalkulasi_biaya_operatif
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_budgeting_bhp_farmasi();

-- 5. Cathlab
CREATE TRIGGER trigger_auto_update_budgeting_bhp_cathlab
    AFTER INSERT OR UPDATE ON kalkulasi_biaya_cathlab
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_budgeting_bhp_farmasi();
```

### Trigger Function:
```sql
CREATE OR REPLACE FUNCTION trigger_update_budgeting_bhp_farmasi()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM populate_budgeting_bhp_farmasi(
        COALESCE(NEW.user_id, OLD.user_id),
        COALESCE(NEW.tahun, OLD.tahun)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Data Model Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  budgeting_bhp_farmasi                      │
├─────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                               │
│ FK: user_id → auth.users.id                                 │
├─────────────────────────────────────────────────────────────┤
│ • tahun                                                     │
│ • kode_unit_kerja, nama_unit_kerja                          │
│ • kode_tindakan, nama_tindakan                              │
│ • biaya_bahan                                               │
│ • jumlah_tindakan ✨                                        │
│ • rincian_bahan (JSONB) ✨                                  │
│ • total_budgeting_bhp ⭐ (GENERATED)                        │
│ • total_budgeting_rincian ⭐                                │
└───────────────────┬─────────────────────────────────────────┘
                    │ 1:N
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  rincian_budgeting_bhp                      │
├─────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                               │
│ FK: user_id → auth.users.id                                 │
│ FK: budgeting_bhp_farmasi_id → budgeting_bhp_farmasi.id     │
├─────────────────────────────────────────────────────────────┤
│ • kode_tindakan, nama_tindakan                              │
│ • kode_barang, nama_barang                                  │
│ • qty_per_tindakan                                          │
│ • jumlah_tindakan                                           │
│ • harga_satuan (from data_barang_farmasi)                   │
│ • jumlah_total ⭐ (GENERATED)                               │
│ • total_rupiah ⭐ (GENERATED)                               │
└───────────────────┬─────────────────────────────────────────┘
                    │ Lookup
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  data_barang_farmasi                        │
├─────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                               │
├─────────────────────────────────────────────────────────────┤
│ • kode_barang (UNIQUE)                                      │
│ • nama_barang                                               │
│ • satuan                                                    │
│ • harga → digunakan untuk kalkulasi                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔢 Sample Data Flow

### Input di Tabel Sumber:
```sql
-- kalkulasi_biaya_laboratorium
kode: PK.021
jenis_pemeriksaan: Glukosa Pictus 700
jumlah: 10,572
biaya_bahan_pemeriksaan_numeric: 51,464
bahan_pemeriksaan: [{"kode_barang": "BHP00400", "qty": 1, "harga_satuan": 51464}]
```

### Hasil di budgeting_bhp_farmasi:
```sql
kode_tindakan: PK.021
nama_tindakan: Glukosa Pictus 700
jumlah_tindakan: 10,572 ✨
biaya_bahan: 51,464
rincian_bahan: [{"kode_barang": "BHP00400", ...}] ✨
total_budgeting_bhp: 544,077,408 ⭐ (51,464 × 10,572)
total_budgeting_rincian: 544,077,408 ⭐
```

### Hasil di rincian_budgeting_bhp:
```sql
kode_tindakan: PK.021
kode_barang: BHP00400
nama_barang: Gas Oxygen (O2) 6M3
qty_per_tindakan: 1
jumlah_tindakan: 10,572
satuan: UNIT
harga_satuan: 51,464 (from data_barang_farmasi)
jumlah_total: 10,572 ⭐ (10,572 × 1)
total_rupiah: 544,077,408 ⭐ (10,572 × 51,464)
```

---

## 📊 Aggregation Queries

### Total Budgeting per Unit Kerja:
```sql
SELECT 
    nama_unit_kerja,
    COUNT(*) as jumlah_tindakan,
    SUM(total_budgeting_bhp) as total_budgeting
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY nama_unit_kerja;
```

### Procurement List (Agregasi per Barang):
```sql
SELECT 
    kode_barang,
    nama_barang,
    satuan,
    SUM(jumlah_total) as total_kebutuhan,
    MAX(harga_satuan) as harga_per_satuan,
    SUM(total_rupiah) as total_budget
FROM rincian_budgeting_bhp
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY kode_barang, nama_barang, satuan
ORDER BY SUM(total_rupiah) DESC;
```

### Top Consumer Items (Barang Paling Banyak Digunakan):
```sql
SELECT 
    r.nama_barang,
    r.satuan,
    COUNT(DISTINCT r.kode_tindakan) as digunakan_di_tindakan,
    SUM(r.jumlah_total) as total_qty,
    SUM(r.total_rupiah) as total_value
FROM rincian_budgeting_bhp r
WHERE r.user_id = auth.uid() AND r.tahun = 2025
GROUP BY r.nama_barang, r.satuan
ORDER BY SUM(r.total_rupiah) DESC
LIMIT 20;
```

---

## 🎯 Business Logic

### Perbedaan 2 Kolom Budgeting:

#### 1. `total_budgeting_bhp`
- **Kalkulasi:** Langsung dari biaya_bahan × jumlah
- **Speed:** Sangat cepat (generated column)
- **Use case:** Quick summary, dashboard
- **Limitation:** Tidak ada breakdown per item bahan

#### 2. `total_budgeting_rincian`
- **Kalkulasi:** Sum dari rincian detail bahan
- **Speed:** Lebih lambat (perlu join)
- **Use case:** Procurement planning, detailed budgeting
- **Advantage:** Ada breakdown per kode_barang

**Idealnya:** Kedua nilai harus sama jika data konsisten.

---

## 🔄 Maintenance Procedures

### Daily/Weekly:
```sql
-- Sync dari tabel sumber
SELECT populate_budgeting_bhp_farmasi(auth.uid(), 2025);

-- Refresh rincian
SELECT populate_rincian_budgeting_bhp(auth.uid(), 2025);
```

### Monthly:
```sql
-- Verify data integrity
SELECT 
    kode_tindakan,
    total_budgeting_bhp,
    total_budgeting_rincian,
    ABS(total_budgeting_bhp - total_budgeting_rincian) as selisih
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid()
  AND ABS(total_budgeting_bhp - total_budgeting_rincian) > 100
ORDER BY selisih DESC;
```

### Yearly:
```sql
-- Archive old year data
CREATE TABLE budgeting_bhp_farmasi_archive_2024 AS
SELECT * FROM budgeting_bhp_farmasi WHERE tahun = 2024;

-- Cleanup
DELETE FROM budgeting_bhp_farmasi WHERE tahun < 2024;
```

---

## 🧪 Testing Queries

### 1. Verify Generated Columns:
```sql
SELECT 
    kode_tindakan,
    biaya_bahan,
    jumlah_tindakan,
    total_budgeting_bhp,
    (biaya_bahan * jumlah_tindakan) as manual_calculation,
    CASE 
        WHEN total_budgeting_bhp = (biaya_bahan * jumlah_tindakan) 
        THEN 'OK' 
        ELSE 'ERROR' 
    END as validation
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() AND biaya_bahan > 0
LIMIT 10;
```

### 2. Verify Rincian Calculations:
```sql
SELECT 
    kode_tindakan,
    qty_per_tindakan,
    jumlah_tindakan,
    harga_satuan,
    jumlah_total,
    total_rupiah,
    (qty_per_tindakan * jumlah_tindakan * harga_satuan) as manual_calc,
    CASE 
        WHEN total_rupiah = (qty_per_tindakan * jumlah_tindakan * harga_satuan)
        THEN 'OK'
        ELSE 'ERROR'
    END as validation
FROM rincian_budgeting_bhp
WHERE user_id = auth.uid()
LIMIT 10;
```

### 3. Verify Rincian Sum:
```sql
SELECT 
    b.kode_tindakan,
    b.total_budgeting_rincian as total_di_budgeting,
    SUM(r.total_rupiah) as total_di_rincian,
    CASE 
        WHEN b.total_budgeting_rincian = SUM(r.total_rupiah)
        THEN 'OK'
        ELSE 'MISMATCH'
    END as status
FROM budgeting_bhp_farmasi b
LEFT JOIN rincian_budgeting_bhp r ON r.budgeting_bhp_farmasi_id = b.id
WHERE b.user_id = auth.uid() AND b.rincian_bahan IS NOT NULL
GROUP BY b.id, b.kode_tindakan, b.total_budgeting_rincian;
```

---

## 📊 Reporting Queries

### 1. Summary Report by Unit:
```sql
SELECT 
    nama_unit_kerja,
    COUNT(*) as total_jenis_tindakan,
    SUM(jumlah_tindakan) as total_volume_tindakan,
    TO_CHAR(SUM(total_budgeting_bhp), 'FM999,999,999,999') as total_budgeting
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY nama_unit_kerja
ORDER BY SUM(total_budgeting_bhp) DESC;
```

### 2. Material Procurement List:
```sql
SELECT 
    kode_barang,
    nama_barang,
    satuan,
    SUM(jumlah_total) as qty_kebutuhan,
    MAX(harga_satuan) as harga_satuan,
    TO_CHAR(SUM(total_rupiah), 'FM999,999,999,999') as total_budget
FROM rincian_budgeting_bhp
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY kode_barang, nama_barang, satuan
ORDER BY SUM(total_rupiah) DESC;
```

### 3. Budget Allocation by Category:
```sql
SELECT 
    CASE 
        WHEN b.sumber_tabel LIKE '%laboratorium%' THEN 'Laboratorium'
        WHEN b.sumber_tabel LIKE '%radiologi%' THEN 'Radiologi'
        WHEN b.sumber_tabel LIKE '%bdrs%' THEN 'BDRS'
        WHEN b.sumber_tabel LIKE '%operatif%' THEN 'Operatif'
        WHEN b.sumber_tabel LIKE '%cathlab%' THEN 'Cathlab'
    END as kategori,
    COUNT(*) as items,
    TO_CHAR(SUM(total_budgeting_bhp), 'FM999,999,999,999') as budgeting
FROM budgeting_bhp_farmasi b
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY kategori
ORDER BY SUM(total_budgeting_bhp) DESC;
```

---

## 🎓 Migration History

### Migrations Created:
1. ✅ `create_budgeting_bhp_farmasi` - Create main table
2. ✅ `create_function_populate_budgeting_bhp_fixed` - Initial function
3. ✅ `recreate_budgeting_bhp_farmasi_complete` - Add unique constraint
4. ✅ `add_rincian_budgeting_bhp_tables` - Create rincian table & add column
5. ✅ `create_function_populate_rincian_budgeting` - Rincian function
6. ✅ `simplify_populate_budgeting_bhp` - Optimize populate function
7. ✅ `fix_populate_with_distinct` - Handle duplicates
8. ✅ `create_triggers_budgeting_bhp` - Auto-update triggers

---

## 📈 Performance Considerations

### Query Performance:
- **budgeting_bhp_farmasi SELECT:** < 100ms (445 records)
- **rincian_budgeting_bhp SELECT:** < 50ms (with indexes)
- **populate_budgeting_bhp_farmasi():** ~2-5 seconds (upsert 445 records)
- **populate_rincian_budgeting_bhp():** ~1-2 seconds (expand JSON)

### Optimization Tips:
- ✅ Indexes pada (user_id, tahun) sudah dibuat
- ✅ Generated columns untuk fast calculation
- ✅ DISTINCT ON untuk handle duplicates efficiently
- ⚠️ Triggers dapat slow down bulk operations (disable saat import besar)

---

## 🔐 Security Considerations

### RLS Implementation:
- ✅ All tables have RLS enabled
- ✅ User isolation via user_id
- ✅ Service role functions for admin access
- ✅ Cascade delete untuk referential integrity

### Data Privacy:
- User hanya bisa akses data mereka sendiri
- Admin dapat akses via service role
- Audit trail via timestamps

---

## 🚀 Next Steps

### Recommended Actions:
1. ⏭️ Input data bahan untuk tindakan dengan volume tinggi
2. ⏭️ Buat frontend page untuk visualisasi budgeting
3. ⏭️ Setup scheduled jobs untuk auto-refresh
4. ⏭️ Export functionality ke Excel/PDF
5. ⏭️ Comparison view: budgeted vs actual
6. ⏭️ Approval workflow

---

**Last Updated:** 9 Oktober 2025  
**Schema Version:** 1.0.0  
**Status:** ✅ Production Ready with Sample Data

