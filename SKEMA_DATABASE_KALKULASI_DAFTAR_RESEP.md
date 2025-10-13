# 🗄️ Schema Database: Kalkulasi Daftar dan Resep

## 📋 Tabel: `kalkulasi_daftar_dan_resep`

Tabel ini menyimpan hasil kalkulasi biaya untuk layanan pendaftaran dan peresepan di berbagai unit pelayanan.

---

## 🏗️ Struktur Tabel

```sql
CREATE TABLE kalkulasi_daftar_dan_resep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL DEFAULT 2025,
    
    -- Kolom jenis layanan (5 jenis)
    jenis_layanan TEXT NOT NULL CHECK (jenis_layanan IN (
        'Pendaftaran Rawat Jalan',
        'Peresepan Rawat Jalan',
        'Pendaftaran Rawat Inap',
        'Peresepan Rawat Inap',
        'Peresepan Farmasi'
    )),
    
    -- Kolom biaya layanan (auto-calculated)
    biaya_layanan NUMERIC DEFAULT 0,
    
    -- Metadata untuk tracking kalkulasi
    biaya_unit NUMERIC DEFAULT 0,
    biaya_distribusi_kedua NUMERIC DEFAULT 0,
    total_biaya_unit NUMERIC DEFAULT 0,
    jumlah_pembagi NUMERIC DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, tahun, jenis_layanan)
);
```

---

## 📊 Kolom-Kolom

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Primary key unik |
| `user_id` | UUID | YES | NULL | Foreign key ke auth.users |
| `tahun` | INTEGER | NO | 2025 | Tahun periode kalkulasi |
| `jenis_layanan` | TEXT | NO | - | Jenis layanan (5 pilihan) |
| `biaya_layanan` | NUMERIC | YES | 0 | **Biaya per layanan (hasil kalkulasi)** |
| `biaya_unit` | NUMERIC | YES | 0 | Biaya unit dari data_biaya |
| `biaya_distribusi_kedua` | NUMERIC | YES | 0 | Distribusi kedua dari distribusi_biaya_kedua |
| `total_biaya_unit` | NUMERIC | YES | 0 | Total biaya = biaya_unit + distribusi_kedua |
| `jumlah_pembagi` | NUMERIC | YES | 0 | Jumlah kunjungan/lembar resep |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Waktu record dibuat |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Waktu record terakhir diupdate |

---

## 🔑 Keys & Constraints

### Primary Key:
```sql
PRIMARY KEY (id)
```

### Foreign Keys:
```sql
FOREIGN KEY (user_id) REFERENCES auth.users(id)
```

### Unique Constraint:
```sql
UNIQUE(user_id, tahun, jenis_layanan)
```
*Memastikan satu user hanya punya satu record per jenis layanan per tahun*

### Check Constraint:
```sql
CHECK (jenis_layanan IN (
    'Pendaftaran Rawat Jalan',
    'Peresepan Rawat Jalan',
    'Pendaftaran Rawat Inap',
    'Peresepan Rawat Inap',
    'Peresepan Farmasi'
))
```

---

## 🔒 Row Level Security (RLS)

### Status: **ENABLED** ✅

### Policies:

#### 1. SELECT Policy
```sql
CREATE POLICY "Users can view their own kalkulasi_daftar_dan_resep"
    ON kalkulasi_daftar_dan_resep FOR SELECT
    USING (auth.uid() = user_id);
```

#### 2. INSERT Policy
```sql
CREATE POLICY "Users can insert their own kalkulasi_daftar_dan_resep"
    ON kalkulasi_daftar_dan_resep FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

#### 3. UPDATE Policy
```sql
CREATE POLICY "Users can update their own kalkulasi_daftar_dan_resep"
    ON kalkulasi_daftar_dan_resep FOR UPDATE
    USING (auth.uid() = user_id);
```

#### 4. DELETE Policy
```sql
CREATE POLICY "Users can delete their own kalkulasi_daftar_dan_resep"
    ON kalkulasi_daftar_dan_resep FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 📈 Indexes

### Composite Index:
```sql
CREATE INDEX idx_kalkulasi_daftar_resep_user_tahun 
    ON kalkulasi_daftar_dan_resep(user_id, tahun);
```

**Purpose:** Optimize queries yang filter by user_id dan tahun

---

## 🔄 Auto-Update Triggers

### 1. Trigger pada `data_biaya`
```sql
CREATE TRIGGER trigger_auto_update_daftar_resep_biaya
    AFTER INSERT OR UPDATE ON data_biaya
    FOR EACH ROW
    WHEN (NEW.kode_unit_kerja IN ('UK017', 'UK018', 'UK040'))
    EXECUTE FUNCTION trigger_update_kalkulasi_daftar_resep();
```
**Trigger saat:** Perubahan biaya unit TPPRJ, TPPRI, atau Farmasi

### 2. Trigger pada `data_kegiatan`
```sql
CREATE TRIGGER trigger_auto_update_daftar_resep_kegiatan
    AFTER INSERT OR UPDATE ON data_kegiatan
    FOR EACH ROW
    WHEN (NEW."Total_Kunjungan_Pasien" IS NOT NULL OR NEW."Resep_Lembar_Resep" IS NOT NULL)
    EXECUTE FUNCTION trigger_update_kalkulasi_daftar_resep();
```
**Trigger saat:** Perubahan kunjungan pasien atau lembar resep

### 3. Trigger pada `distribusi_biaya_kedua`
```sql
CREATE TRIGGER trigger_auto_update_daftar_resep_distribusi
    AFTER INSERT OR UPDATE ON distribusi_biaya_kedua
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_kalkulasi_daftar_resep();
```
**Trigger saat:** Perubahan distribusi biaya kedua

### 4. Trigger pada `biaya_preference`
```sql
CREATE TRIGGER trigger_auto_update_daftar_resep_preference
    AFTER INSERT OR UPDATE ON biaya_preference
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_kalkulasi_daftar_resep();
```
**Trigger saat:** Perubahan preferensi biaya

---

## 🔧 Functions

### 1. `calculate_biaya_layanan_daftar_resep()`

**Signature:**
```sql
calculate_biaya_layanan_daftar_resep(
    p_user_id UUID,
    p_tahun INTEGER,
    p_jenis_layanan TEXT
) RETURNS TABLE (
    biaya_unit NUMERIC,
    biaya_distribusi_kedua NUMERIC,
    total_biaya_unit NUMERIC,
    jumlah_pembagi NUMERIC,
    biaya_layanan NUMERIC
)
```

**Purpose:** Menghitung biaya layanan untuk satu jenis layanan spesifik

**Logic Flow:**
1. Ambil preferensi biaya user (total_biaya atau total_biaya_tanpa_jp)
2. Berdasarkan jenis_layanan:
   - Tentukan unit kerja (TPPRJ/TPPRI/Farmasi)
   - Tentukan jenis data (Rawat Jalan/Rawat Inap)
   - Ambil biaya unit dari `data_biaya`
   - Ambil distribusi kedua (jika ada) dari `distribusi_biaya_kedua`
   - Hitung pembagi dari `data_kegiatan`
3. Hitung biaya layanan = (biaya_unit + distribusi_kedua) / pembagi
4. Return hasil kalkulasi

---

### 2. `populate_kalkulasi_daftar_resep()`

**Signature:**
```sql
populate_kalkulasi_daftar_resep(
    p_user_id UUID,
    p_tahun INTEGER DEFAULT 2025
) RETURNS TEXT
```

**Purpose:** Populate/refresh semua data kalkulasi untuk user tertentu

**Logic Flow:**
1. Loop untuk setiap jenis layanan (5 jenis)
2. Call `calculate_biaya_layanan_daftar_resep()` untuk setiap jenis
3. INSERT atau UPDATE data ke tabel
4. Return status message

**Usage:**
```sql
SELECT populate_kalkulasi_daftar_resep(
    '3394a4f5-b2ec-444d-b290-a6bdf477dc99'::UUID,
    2025
);
```

---

### 3. `trigger_update_kalkulasi_daftar_resep()`

**Signature:**
```sql
trigger_update_kalkulasi_daftar_resep() RETURNS TRIGGER
```

**Purpose:** Trigger function untuk auto-update data

**Logic Flow:**
1. Extract user_id dan tahun dari NEW/OLD record
2. Call `populate_kalkulasi_daftar_resep()` untuk user tersebut
3. Return NEW

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  data_biaya     │
│  (UK017, UK018, │──┐
│   UK040)        │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │  ┌──────────────────────────────┐
│ data_kegiatan   │  ├─→│ calculate_biaya_layanan_     │
│ (kunjungan,     │──┤  │ daftar_resep()               │
│  lembar resep)  │  │  └──────────────────────────────┘
└─────────────────┘  │                 │
                     │                 ↓
┌─────────────────┐  │  ┌──────────────────────────────┐
│ distribusi_     │  │  │ populate_kalkulasi_daftar_   │
│ biaya_kedua     │──┘  │ resep()                      │
└─────────────────┘     └──────────────────────────────┘
                                      │
                                      ↓
                       ┌──────────────────────────────┐
                       │ kalkulasi_daftar_dan_resep   │
                       │ (hasil kalkulasi)            │
                       └──────────────────────────────┘
```

---

## 💡 Contoh Data

### Sample Record:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "3394a4f5-b2ec-444d-b290-a6bdf477dc99",
  "tahun": 2025,
  "jenis_layanan": "Pendaftaran Rawat Jalan",
  "biaya_layanan": 4458,
  "biaya_unit": 703326596,
  "biaya_distribusi_kedua": 0,
  "total_biaya_unit": 703326596,
  "jumlah_pembagi": 157752,
  "created_at": "2025-10-09T03:13:41.000Z",
  "updated_at": "2025-10-09T03:13:41.000Z"
}
```

---

## 🔍 Query Examples

### 1. Ambil semua data untuk user tertentu:
```sql
SELECT * 
FROM kalkulasi_daftar_dan_resep
WHERE user_id = '3394a4f5-b2ec-444d-b290-a6bdf477dc99'
  AND tahun = 2025
ORDER BY jenis_layanan;
```

### 2. Ambil hanya biaya layanan pendaftaran:
```sql
SELECT jenis_layanan, biaya_layanan
FROM kalkulasi_daftar_dan_resep
WHERE user_id = auth.uid()
  AND tahun = 2025
  AND jenis_layanan LIKE 'Pendaftaran%';
```

### 3. Refresh data untuk user:
```sql
SELECT populate_kalkulasi_daftar_resep(
    auth.uid(),
    2025
);
```

### 4. Check data dengan breakdown:
```sql
SELECT 
    jenis_layanan,
    biaya_unit,
    biaya_distribusi_kedua,
    total_biaya_unit,
    jumlah_pembagi,
    biaya_layanan,
    ROUND((biaya_layanan / NULLIF(total_biaya_unit, 0)) * 100, 2) as persen_dari_total
FROM kalkulasi_daftar_dan_resep
WHERE user_id = auth.uid()
  AND tahun = 2025;
```

---

## 🔄 Data Lifecycle

### 1. **Creation**
- Otomatis saat pertama kali user mengakses halaman
- Atau via manual trigger: `populate_kalkulasi_daftar_resep()`

### 2. **Update**
- Auto-update via triggers saat data sumber berubah
- Manual refresh via UI button
- Scheduled jobs (future enhancement)

### 3. **Deletion**
- Manual delete via UI (future enhancement)
- Cascade delete saat user dihapus

---

## 🎯 Business Rules

### 1. **Pendaftaran Rawat Jalan**
- Biaya Unit: TPPRJ (UK017)
- Distribusi Kedua: Tidak ada (pusat biaya)
- Pembagi: Total kunjungan pasien rawat jalan

### 2. **Peresepan Rawat Jalan**
- Biaya Unit: Farmasi (UK040)
- Distribusi Kedua: Ada (dari distribusi_biaya_kedua)
- Pembagi: Total lembar resep rawat jalan

### 3. **Pendaftaran Rawat Inap**
- Biaya Unit: TPPRI (UK018)
- Distribusi Kedua: Tidak ada (pusat biaya)
- Pembagi: Total kunjungan pasien rawat inap

### 4. **Peresepan Rawat Inap**
- Biaya Unit: Farmasi (UK040)
- Distribusi Kedua: Ada (dari distribusi_biaya_kedua)
- Pembagi: Total lembar resep rawat inap

### 5. **Peresepan Farmasi**
- Biaya Unit: Farmasi (UK040)
- Distribusi Kedua: Ada (dari distribusi_biaya_kedua)
- Pembagi: Total lembar resep semua unit kerja

---

## 🧪 Testing Queries

### Verify trigger is working:
```sql
-- 1. Check initial data
SELECT * FROM kalkulasi_daftar_dan_resep 
WHERE user_id = auth.uid() AND tahun = 2025;

-- 2. Update biaya unit Farmasi
UPDATE data_biaya 
SET biaya_obat = biaya_obat + 1000000
WHERE kode_unit_kerja = 'UK040' AND tahun = 2025;

-- 3. Wait 1-2 seconds, then check again
SELECT * FROM kalkulasi_daftar_dan_resep 
WHERE user_id = auth.uid() AND tahun = 2025;

-- Result: biaya_layanan should be updated
```

---

## 📚 Related Tables

### Dependencies:
1. `data_biaya` - Sumber biaya unit
2. `distribusi_biaya_kedua` - Sumber distribusi kedua
3. `data_kegiatan` - Sumber kunjungan dan lembar resep
4. `biaya_preference` - Preferensi jenis biaya
5. `unit_kerja` - Master data unit kerja
6. `auth.users` - User authentication

---

## 🔐 Security Considerations

### RLS Implementation:
- ✅ Semua queries auto-filter by user_id
- ✅ User tidak bisa lihat data user lain
- ✅ User tidak bisa modify data user lain
- ✅ Admin privileges handled via service role

### Data Privacy:
- User ID stored for audit trail
- Timestamps untuk tracking changes
- Unique constraint mencegah duplikasi

---

## 📊 Performance Metrics

### Expected Performance:
- **SELECT query:** < 50ms
- **INSERT/UPDATE:** < 100ms
- **populate function:** < 500ms (5 records)
- **Trigger execution:** < 200ms

### Optimization Tips:
- Index on (user_id, tahun) sudah ada
- Use EXPLAIN ANALYZE untuk query optimization
- Monitor trigger execution time
- Consider materialized views untuk reporting

---

**Last Updated:** 9 Oktober 2025  
**Schema Version:** 1.0.0  
**Status:** ✅ Production Ready

