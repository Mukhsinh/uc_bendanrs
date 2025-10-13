# 💊 Dokumentasi Budgeting BHP Farmasi

## 🎯 Overview
Sistem **Budgeting BHP Farmasi** terdiri dari 2 tabel yang saling terintegrasi:
1. **`budgeting_bhp_farmasi`**: Tabel utama yang merekap semua tindakan dengan budgeting BHP
2. **`rincian_budgeting_bhp`**: Tabel detail yang menampilkan rincian bahan per tindakan

---

## 📊 TABEL 1: `budgeting_bhp_farmasi`

### Struktur Tabel
Tabel ini mirip dengan `rekapitulasi_unit_cost` dengan penambahan kolom baru untuk budgeting.

### Kolom-Kolom

| Kolom | Tipe | Deskripsi | Status |
|-------|------|-----------|--------|
| `id` | UUID | Primary key | Standard |
| `user_id` | UUID | Foreign key ke auth.users | Standard |
| `tahun` | INTEGER | Tahun periode | Standard |
| `kode_jenis` | SMALLINT | Jenis unit (1=penunjang, 3=operatif) | Standard |
| `kode_unit_kerja` | TEXT | Kode unit kerja | Standard |
| `nama_unit_kerja` | TEXT | Nama unit kerja | Standard |
| `kode_operator` | TEXT | Kode operator (operatif) | Standard |
| `nama_operator` | TEXT | Nama operator (operatif) | Standard |
| `kode_tindakan` | TEXT | Kode tindakan | Standard |
| `nama_tindakan` | TEXT | Nama tindakan | Standard |
| `biaya_bahan` | BIGINT | Biaya bahan per tindakan | Standard |
| `unit_cost_per_tindakan` | BIGINT | Unit cost per tindakan | Standard |
| **`jumlah_tindakan`** | INTEGER | **Jumlah tindakan dalam periode** | ✨ **BARU** |
| **`rincian_bahan`** | JSONB | **Detail bahan dalam JSON** | ✨ **BARU** |
| **`total_budgeting_bhp`** | BIGINT | **= biaya_bahan × jumlah_tindakan** | ⭐ **GENERATED** |
| **`total_budgeting_rincian`** | BIGINT | **Total dari rincian_budgeting_bhp** | ⭐ **CALCULATED** |
| `sumber_tabel` | TEXT | Sumber data | Standard |
| `created_at` | TIMESTAMPTZ | Waktu dibuat | Standard |
| `updated_at` | TIMESTAMPTZ | Waktu diupdate | Standard |

### Formula Kolom Budgeting

#### 1. `total_budgeting_bhp` (GENERATED COLUMN)
```sql
total_budgeting_bhp = biaya_bahan × jumlah_tindakan
```
**Contoh:**
- Biaya bahan = Rp 51,464
- Jumlah tindakan = 10,572
- **Total Budgeting BHP = Rp 544,077,408**

#### 2. `total_budgeting_rincian` (CALCULATED BY TRIGGER)
```sql
total_budgeting_rincian = SUM(total_rupiah dari rincian_budgeting_bhp)
```
**Cara Kerja:**
- Expand JSON `rincian_bahan` menjadi rows di `rincian_budgeting_bhp`
- Hitung total_rupiah per bahan
- Sum total untuk tindakan tersebut

### Sumber Data
Tabel ini mengambil data dari 5 tabel kalkulasi:
1. `kalkulasi_biaya_laboratorium` (250 records)
2. `kalkulasi_biaya_radiologi` (79 records)
3. `kalkulasi_bdrs` (11 records)
4. `kalkulasi_biaya_operatif` (213 records)
5. `kalkulasi_biaya_cathlab` (17 records)

**Total:** 445 items tindakan dengan 86,918 total tindakan

---

## 📋 TABEL 2: `rincian_budgeting_bhp`

### Struktur Tabel
Tabel ini menyimpan detail rincian bahan per tindakan hasil expand dari JSON.

### Kolom-Kolom

| Kolom | Tipe | Deskripsi | Formula |
|-------|------|-----------|---------|
| `id` | UUID | Primary key | - |
| `user_id` | UUID | Foreign key ke auth.users | - |
| `budgeting_bhp_farmasi_id` | UUID | FK ke budgeting_bhp_farmasi | - |
| `tahun` | INTEGER | Tahun periode | - |
| `kode_unit_kerja` | TEXT | Kode unit kerja | - |
| `nama_unit_kerja` | TEXT | Nama unit kerja | - |
| `kode_tindakan` | TEXT | Kode tindakan | - |
| `nama_tindakan` | TEXT | Nama tindakan | - |
| `jumlah_tindakan` | INTEGER | Jumlah tindakan | - |
| `kode_barang` | TEXT | Kode barang (dari JSON atau data_barang_farmasi) | - |
| `nama_barang` | TEXT | Nama barang | - |
| `qty_per_tindakan` | NUMERIC | Quantity per 1 tindakan (dari JSON) | - |
| `satuan` | TEXT | Satuan barang | - |
| `harga_satuan` | NUMERIC | Harga per satuan (dari data_barang_farmasi) | - |
| **`jumlah_total`** | NUMERIC | **= jumlah_tindakan × qty_per_tindakan** | **GENERATED** |
| **`total_rupiah`** | NUMERIC | **= jumlah_total × harga_satuan** | **GENERATED** |
| `sumber_tabel` | TEXT | Sumber tabel kalkulasi | - |

### Formula Generated Columns

#### 1. `jumlah_total` (GENERATED COLUMN)
```sql
jumlah_total = jumlah_tindakan × qty_per_tindakan
```
**Contoh:**
- Tindakan "Glukosa Pictus 700" dilakukan 10,572 kali
- Tiap tindakan pakai 1 unit Gas Oxygen
- **Jumlah Total = 10,572 unit**

#### 2. `total_rupiah` (GENERATED COLUMN)
```sql
total_rupiah = jumlah_total × harga_satuan
```
**Contoh:**
- Jumlah total = 10,572 unit
- Harga satuan = Rp 51,464
- **Total Rupiah = Rp 544,077,408**

---

## 🔄 Data Flow

```
┌──────────────────────────────┐
│ Tabel Sumber Kalkulasi       │
│ - kalkulasi_biaya_lab        │
│ - kalkulasi_biaya_radiologi  │
│ - kalkulasi_bdrs             │
│ - kalkulasi_biaya_operatif   │
│ - kalkulasi_biaya_cathlab    │
└──────────┬───────────────────┘
           │ populate_budgeting_bhp_farmasi()
           ↓
┌──────────────────────────────┐
│ budgeting_bhp_farmasi        │
│ - kode_tindakan              │
│ - jumlah_tindakan (BARU)     │
│ - rincian_bahan (BARU)       │
│ - biaya_bahan                │
│ - total_budgeting_bhp ⭐     │
│ - total_budgeting_rincian ⭐ │
└──────────┬───────────────────┘
           │ populate_rincian_budgeting_bhp()
           ↓
┌──────────────────────────────┐
│ rincian_budgeting_bhp        │
│ - kode_barang                │
│ - nama_barang                │
│ - qty_per_tindakan           │
│ - jumlah_total ⭐            │
│ - harga_satuan               │
│ - total_rupiah ⭐            │
└──────────────────────────────┘
           │ Link ke Master
           ↓
┌──────────────────────────────┐
│ data_barang_farmasi          │
│ - kode_barang                │
│ - nama_barang                │
│ - harga (untuk update harga) │
└──────────────────────────────┘
```

---

## 🔧 Functions

### 1. `populate_budgeting_bhp_farmasi(p_user_id, p_tahun)`

**Purpose:** Populate/refresh data budgeting BHP dari tabel sumber

**Parameters:**
- `p_user_id` (UUID): ID user
- `p_tahun` (INTEGER): Tahun periode (default: 2025)

**Returns:** TEXT (status message)

**Usage:**
```sql
SELECT populate_budgeting_bhp_farmasi(auth.uid(), 2025);
```

**Logic:**
1. Ambil data dari 5 tabel kalkulasi
2. INSERT dengan ON CONFLICT DO UPDATE (upsert)
3. Copy: kode, nama, jumlah, biaya_bahan, rincian_bahan (JSON)
4. Return success message

---

### 2. `populate_rincian_budgeting_bhp(p_user_id, p_tahun)`

**Purpose:** Expand JSON rincian_bahan menjadi rows detail bahan

**Parameters:**
- `p_user_id` (UUID): ID user
- `p_tahun` (INTEGER): Tahun periode (default: 2025)

**Returns:** TEXT (status message)

**Usage:**
```sql
SELECT populate_rincian_budgeting_bhp(auth.uid(), 2025);
```

**Logic:**
1. Loop setiap record di `budgeting_bhp_farmasi` yang punya `rincian_bahan`
2. Expand JSON array menjadi individual rows
3. Ambil harga dari `data_barang_farmasi` berdasarkan `kode_barang`
4. Insert ke `rincian_budgeting_bhp`
5. Calculate `jumlah_total` dan `total_rupiah` (auto via generated column)
6. Update `total_budgeting_rincian` di `budgeting_bhp_farmasi`

---

## 📊 Contoh Data

### Sample: Tindakan "Glukosa Pictus 700" (PK.021)

#### Data di `budgeting_bhp_farmasi`:
```
Kode Tindakan: PK.021
Nama Tindakan: Glukosa Pictus 700
Unit Kerja: UK038 - Laboratorium (PK-PA)
Biaya Bahan per Tindakan: Rp 51,464
Jumlah Tindakan: 10,572
Total Budgeting BHP: Rp 544,077,408 ⭐
Total Budgeting Rincian: Rp 544,077,408 ⭐
Rincian Bahan: 1 item bahan
```

#### Data di `rincian_budgeting_bhp`:
```
Kode Barang: BHP00400
Nama Barang: Gas Oxygen (O2) 6M3
Qty per Tindakan: 1
Satuan: UNIT
Harga Satuan: Rp 51,464
Jumlah Total: 10,572 UNIT ⭐
Total Rupiah: Rp 544,077,408 ⭐
```

---

## 📈 Hasil Kalkulasi Sample Data

### Tabel `budgeting_bhp_farmasi` (3 sample dengan bahan):

| No | Unit Kerja | Kode | Nama Tindakan | Jumlah Tindakan | Biaya Bahan | Total Budgeting BHP | Total Budgeting Rincian |
|----|------------|------|---------------|-----------------|-------------|---------------------|------------------------|
| 1 | Laboratorium | PK.021 | Glukosa Pictus 700 | 10,572 | Rp 51,464 | **Rp 544,077,408** | **Rp 544,077,408** |
| 2 | Radiologi | Rad.034 | Os Nasal | 9,131 | Rp 8,433 | **Rp 77,001,723** | **Rp 77,001,723** |
| 3 | BDRS | BDRS.01 | Crossmatch Prc 1 | 1,042 | Rp 5,000 | **Rp 5,210,000** | **Rp 5,210,000** |

### Tabel `rincian_budgeting_bhp` (3 detail bahan):

| No | Tindakan | Kode Barang | Nama Barang | Qty/Tindakan | Jumlah Tindakan | Satuan | Harga Satuan | Jumlah Total | Total Rupiah |
|----|----------|-------------|-------------|--------------|-----------------|--------|--------------|--------------|--------------|
| 1 | PK.021 | BHP00400 | Gas Oxygen | 1 | 10,572 | UNIT | Rp 51,464 | 10,572 | **Rp 544,077,408** |
| 2 | Rad.034 | BHP00401 | Liquid Oxygen | 1 | 9,131 | M³ | Rp 8,433 | 9,131 | **Rp 77,001,723** |
| 3 | BDRS.01 | OBT00393 | Gliquidone 30 Mg | 5 | 1,042 | TABLET | Rp 1,000 | 5,210 | **Rp 5,210,000** |

### Agregasi per Barang:

| Kode Barang | Nama Barang | Digunakan di Berapa Tindakan | Total Qty | Harga Satuan | Total Budgeting |
|-------------|-------------|------------------------------|-----------|--------------|-----------------|
| BHP00400 | Gas Oxygen | 1 tindakan | 10,572 UNIT | Rp 51,464 | **Rp 544,077,408** |
| BHP00401 | Liquid Oxygen | 1 tindakan | 9,131 M³ | Rp 8,433 | **Rp 77,001,723** |
| OBT00393 | Gliquidone 30 Mg | 1 tindakan | 5,210 TABLET | Rp 1,000 | **Rp 5,210,000** |

**Grand Total Budgeting (Rincian):** **Rp 626,289,131**

---

## 🔑 Unique Constraints

### `budgeting_bhp_farmasi`:
```sql
UNIQUE(user_id, tahun, kode_tindakan, kode_unit_kerja, sumber_tabel)
```
Memastikan tidak ada duplikasi per tindakan per unit per sumber.

### `rincian_budgeting_bhp`:
Tidak ada unique constraint karena bisa ada multiple bahan per tindakan.

---

## 🔒 Row Level Security (RLS)

**Status:** ✅ ENABLED di kedua tabel

**Policies:**
- Users can SELECT their own data
- Users can INSERT their own data
- Users can UPDATE their own data
- Users can DELETE their own data

---

## 🔄 Auto-Update Triggers

### Triggers Aktif:
1. ✅ `trigger_auto_update_budgeting_bhp_lab` - pada kalkulasi_biaya_laboratorium
2. ✅ `trigger_auto_update_budgeting_bhp_rad` - pada kalkulasi_biaya_radiologi
3. ✅ `trigger_auto_update_budgeting_bhp_bdrs` - pada kalkulasi_bdrs
4. ✅ `trigger_auto_update_budgeting_bhp_operatif` - pada kalkulasi_biaya_operatif
5. ✅ `trigger_auto_update_budgeting_bhp_cathlab` - pada kalkulasi_biaya_cathlab

**Cara Kerja:**
- Saat data di tabel sumber berubah (INSERT/UPDATE)
- Trigger otomatis memanggil `populate_budgeting_bhp_farmasi()`
- Data di `budgeting_bhp_farmasi` ter-update otomatis

---

## 💡 Cara Penggunaan

### 1. Populate Data Awal
```sql
-- Populate budgeting BHP farmasi
SELECT populate_budgeting_bhp_farmasi(auth.uid(), 2025);

-- Populate rincian bahan
SELECT populate_rincian_budgeting_bhp(auth.uid(), 2025);
```

### 2. Lihat Data Budgeting BHP
```sql
SELECT 
    nama_unit_kerja,
    kode_tindakan,
    nama_tindakan,
    jumlah_tindakan,
    biaya_bahan,
    total_budgeting_bhp,
    total_budgeting_rincian
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() AND tahun = 2025
ORDER BY total_budgeting_bhp DESC;
```

### 3. Lihat Rincian Bahan
```sql
SELECT 
    kode_tindakan,
    nama_tindakan,
    kode_barang,
    nama_barang,
    qty_per_tindakan,
    jumlah_tindakan,
    jumlah_total,
    harga_satuan,
    total_rupiah
FROM rincian_budgeting_bhp
WHERE user_id = auth.uid() AND tahun = 2025
ORDER BY total_rupiah DESC;
```

### 4. Agregasi per Barang (untuk procurement)
```sql
SELECT 
    kode_barang,
    nama_barang,
    satuan,
    COUNT(DISTINCT kode_tindakan) as digunakan_di_berapa_tindakan,
    SUM(jumlah_total) as total_qty_kebutuhan,
    MAX(harga_satuan) as harga_satuan,
    SUM(total_rupiah) as total_budgeting
FROM rincian_budgeting_bhp
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY kode_barang, nama_barang, satuan
ORDER BY SUM(total_rupiah) DESC;
```

---

## 📝 Format JSON rincian_bahan

### Format di Tabel Sumber:
```json
[
    {
        "kode_barang": "BHP00400",
        "nama": "Gas Oxygen (O2) 6M3",
        "qty": 1,
        "satuan": "UNIT",
        "harga_satuan": 51464,
        "harga_total": 51464
    },
    {
        "kode_barang": "BHP00060",
        "nama": "Needle Spuit 18",
        "qty": 2,
        "satuan": "BUAH",
        "harga_satuan": 348,
        "harga_total": 696
    }
]
```

### Fields dalam JSON:
- `kode_barang`: Kode dari data_barang_farmasi
- `nama`: Nama barang
- `qty`: Quantity per 1 tindakan
- `satuan`: Satuan barang
- `harga_satuan`: Harga per satuan (reference)
- `harga_total`: Total harga bahan untuk 1 tindakan

---

## 🎯 Use Cases

### 1. **Budgeting Tahunan BHP**
Lihat total kebutuhan BHP per tahun berdasarkan volume tindakan aktual:
```sql
SELECT SUM(total_budgeting_bhp) as total_budgeting_tahunan
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() AND tahun = 2025;
```

### 2. **Procurement Planning**
Lihat detail barang yang perlu dibeli:
```sql
SELECT 
    kode_barang,
    nama_barang,
    satuan,
    SUM(jumlah_total) as total_kebutuhan,
    SUM(total_rupiah) as total_budget
FROM rincian_budgeting_bhp
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY kode_barang, nama_barang, satuan;
```

### 3. **Analisis per Unit Kerja**
```sql
SELECT 
    nama_unit_kerja,
    COUNT(*) as jumlah_jenis_tindakan,
    SUM(total_budgeting_bhp) as total_budgeting
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY nama_unit_kerja
ORDER BY SUM(total_budgeting_bhp) DESC;
```

### 4. **Top 10 Tindakan dengan Budgeting Tertinggi**
```sql
SELECT 
    nama_unit_kerja,
    kode_tindakan,
    nama_tindakan,
    jumlah_tindakan,
    total_budgeting_bhp
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() 
  AND tahun = 2025
  AND total_budgeting_bhp > 0
ORDER BY total_budgeting_bhp DESC
LIMIT 10;
```

---

## 🔍 Query Examples

### Cek Tindakan yang Belum Input Bahan:
```sql
SELECT 
    kode_unit_kerja,
    nama_unit_kerja,
    kode_tindakan,
    nama_tindakan,
    jumlah_tindakan
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid()
  AND tahun = 2025
  AND (biaya_bahan = 0 OR biaya_bahan IS NULL)
  AND jumlah_tindakan > 0
ORDER BY jumlah_tindakan DESC
LIMIT 20;
```

### Lihat Breakdown Bahan per Tindakan:
```sql
SELECT 
    r.kode_tindakan,
    r.nama_tindakan,
    r.kode_barang,
    r.nama_barang,
    r.qty_per_tindakan,
    r.harga_satuan,
    b.jumlah_tindakan,
    r.jumlah_total,
    r.total_rupiah
FROM rincian_budgeting_bhp r
JOIN budgeting_bhp_farmasi b ON b.id = r.budgeting_bhp_farmasi_id
WHERE r.user_id = auth.uid()
  AND r.kode_tindakan = 'PK.021';
```

---

## 🚀 Workflow Lengkap

### Step 1: Input Data Bahan di Tabel Sumber
```sql
-- Contoh: Input bahan untuk tindakan laboratorium
UPDATE kalkulasi_biaya_laboratorium
SET 
    bahan_pemeriksaan = '[
        {"kode_barang": "BHP00400", "nama": "Gas Oxygen", "qty": 1, "satuan": "UNIT", "harga_satuan": 51464}
    ]'::jsonb,
    biaya_bahan_pemeriksaan_numeric = 51464
WHERE kode = 'PK.021' AND tahun = 2025;
```

### Step 2: Populate Budgeting BHP (Auto via Trigger)
Trigger akan otomatis memanggil `populate_budgeting_bhp_farmasi()`

**Atau manual:**
```sql
SELECT populate_budgeting_bhp_farmasi(auth.uid(), 2025);
```

### Step 3: Populate Rincian (Manual)
```sql
SELECT populate_rincian_budgeting_bhp(auth.uid(), 2025);
```

### Step 4: Lihat Hasil
```sql
-- Budgeting per tindakan
SELECT * FROM budgeting_bhp_farmasi WHERE user_id = auth.uid();

-- Detail rincian bahan
SELECT * FROM rincian_budgeting_bhp WHERE user_id = auth.uid();
```

---

## 📊 Statistik Data (Current)

### Total Records:
```
budgeting_bhp_farmasi: 445 items
- Laboratorium: 125 items (60,008 tindakan)
- Radiologi: 79 items (17,350 tindakan)
- Operatif: 213 items (6,314 tindakan)
- BDRS: 11 items (3,059 tindakan)
- Cathlab: 17 items (187 tindakan)

rincian_budgeting_bhp: 3 items (sample)
- Total Budgeting: Rp 626,289,131
```

### Status Data Bahan:
- ✅ 3 tindakan sudah punya data bahan (sample)
- ⏳ 442 tindakan belum input data bahan
- 📊 Total volume: 86,918 tindakan

---

## ⚙️ Maintenance

### Refresh Data Manual:
```sql
-- Refresh budgeting BHP
SELECT populate_budgeting_bhp_farmasi(auth.uid(), 2025);

-- Refresh rincian
SELECT populate_rincian_budgeting_bhp(auth.uid(), 2025);
```

### Update Harga Barang:
Ketika harga di `data_barang_farmasi` berubah:
1. Re-run `populate_rincian_budgeting_bhp()`
2. Harga baru akan ter-apply
3. Total rupiah auto-recalculate

### Clean Up Old Data:
```sql
-- Hapus data tahun lama
DELETE FROM budgeting_bhp_farmasi WHERE tahun < 2024;
DELETE FROM rincian_budgeting_bhp WHERE tahun < 2024;
```

---

## 🎓 Best Practices

### 1. Input Data Bahan Secara Berkala
- Input melalui halaman kalkulasi masing-masing
- Gunakan format JSON yang konsisten
- Link dengan `data_barang_farmasi` untuk harga akurat

### 2. Populate Rincian Setelah Input Bahan
- Setelah input bahan, call `populate_rincian_budgeting_bhp()`
- Verifikasi total_budgeting_rincian = total_budgeting_bhp

### 3. Monitor Data Quality
- Cek tindakan dengan jumlah tinggi yang belum punya bahan
- Validasi harga barang di master data
- Review budgeting secara periodik

### 4. Export untuk Procurement
- Export `rincian_budgeting_bhp` agregasi per barang
- Gunakan untuk purchase order
- Track actual vs budgeted

---

## 🐛 Troubleshooting

### Problem: total_budgeting_bhp = 0
**Solution:**
- Cek `biaya_bahan` sudah diisi
- Cek `jumlah_tindakan` > 0
- Re-populate dengan function

### Problem: total_budgeting_rincian tidak sama dengan total_budgeting_bhp
**Solution:**
- Re-run `populate_rincian_budgeting_bhp()`
- Cek JSON rincian_bahan format nya benar
- Verifikasi harga di data_barang_farmasi

### Problem: Harga tidak sesuai
**Solution:**
- Update harga di `data_barang_farmasi`
- Re-run `populate_rincian_budgeting_bhp()`
- Harga akan ter-update otomatis

---

## 📚 Related Tables

### Dependencies:
- `kalkulasi_biaya_laboratorium` - source data
- `kalkulasi_biaya_radiologi` - source data
- `kalkulasi_bdrs` - source data
- `kalkulasi_biaya_operatif` - source data
- `kalkulasi_biaya_cathlab` - source data
- `data_barang_farmasi` - master harga barang
- `auth.users` - user authentication

---

## 🎯 Future Enhancements

- [ ] Frontend page untuk menampilkan budgeting BHP
- [ ] Export to Excel functionality
- [ ] Comparison dengan actual usage
- [ ] Variance analysis (budgeted vs actual)
- [ ] Approval workflow untuk budgeting
- [ ] Historical trend analysis
- [ ] Auto-alert untuk harga yang berubah signifikan

---

**Last Updated:** 9 Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready with Sample Data

