# 📊 DOKUMENTASI SISTEM KALKULASI BDRS

## 🎯 Overview
Sistem kalkulasi biaya BDRS (Bank Darah Rumah Sakit) dengan perhitungan **unit cost per pemeriksaan** yang berjalan **OTOMATIS** menggunakan trigger database, RPC functions, dan Supabase Realtime.

---

## 🔄 SKEMA KALKULASI OTOMATIS

### 1️⃣ Hitung Hasil Kali (Auto via Trigger)
**Trigger:** `trigger_auto_calculate_hasil_kali_bdrs`  
**Event:** BEFORE INSERT/UPDATE pada kolom `waktu_pemeriksaan`, `jumlah`, `profesionalisme`, `tingkat_kesulitan`

**Formula:**
```sql
hasil_kali_waktu = waktu_pemeriksaan × jumlah
hasil_kali = waktu_pemeriksaan × jumlah × profesionalisme × tingkat_kesulitan
```

**Contoh:** BDRS.08 - Crossmatch Wb 3
- waktu_pemeriksaan = 70 menit
- jumlah = 8 pemeriksaan
- profesionalisme = 2
- tingkat_kesulitan = 3

**Hasil:**
- hasil_kali_waktu = 70 × 8 = **560**
- hasil_kali = 70 × 8 × 2 × 3 = **3,360**

---

### 2️⃣ Hitung Dasar Alokasi (RPC Function)
**Function:** `fix_dasar_alokasi_bdrs(user_id, tahun)`

**Formula:**
```sql
-- Proporsi untuk distribusi biaya operasional
dasar_alokasi_waktu = hasil_kali_waktu ÷ SUM(hasil_kali_waktu semua tindakan)
-- Format: 6 angka decimal (contoh: 0.003020)

-- Proporsi untuk distribusi biaya SDM
dasar_alokasi_hasil_kali = hasil_kali ÷ SUM(hasil_kali semua tindakan)
-- Format: 6 angka decimal (contoh: 0.002724)
```

**Contoh:** BDRS.08 (dari total 11 tindakan)
- Total hasil_kali_waktu semua tindakan = 185,400
- Total hasil_kali semua tindakan = 1,233,680

**Hasil:**
- dasar_alokasi_waktu = 560 ÷ 185,400 = **0.003020** (0.3020%)
- dasar_alokasi_hasil_kali = 3,360 ÷ 1,233,680 = **0.002724** (0.2724%)

---

### 3️⃣ Distribusi Biaya (RPC Function)
**Function:** `fix_biaya_calculation_bdrs_correct(user_id, tahun)`

#### A. Biaya SDM (menggunakan `dasar_alokasi_hasil_kali`)
```sql
biaya_gaji_tunjangan = data_biaya.biaya_gaji_tunjangan × (dasar_alokasi_hasil_kali ÷ jumlah)
biaya_jasa_pelayanan = 0  -- Dikosongkan sesuai instruksi
```

**Contoh:** BDRS.08
- Biaya Gaji Tunjangan Tahunan UK044 = Rp 248,794,324
- dasar_alokasi_hasil_kali = 0.002724
- jumlah = 8

**Hasil:**
```
biaya_gaji_tunjangan = 248,794,324 × (0.002724 ÷ 8)
                     = 248,794,324 × 0.000340503
                     = Rp 84,714
```

#### B. Biaya Operasional (menggunakan `dasar_alokasi_waktu`)
18 kolom biaya operasional menggunakan formula yang sama:
```sql
biaya_operasional = data_biaya.biaya_operasional × (dasar_alokasi_waktu ÷ jumlah)
```

**Kolom biaya operasional:**
- biaya_rumah_tangga
- biaya_cetak
- biaya_atk
- biaya_listrik
- biaya_air
- biaya_telp
- biaya_pemeliharaan_bangunan
- biaya_pemeliharaan_alat_medis
- biaya_pemeliharaan_alat_non_medis
- biaya_operasional_lainnya
- biaya_penyusutan_gedung
- biaya_penyusutan_jaringan
- biaya_penyusutan_alat_medis
- biaya_penyusutan_alat_non_medis
- biaya_pendidikan_pelatihan
- biaya_laundry
- biaya_sterilisasi
- biaya_obat, biaya_bhp, biaya_makan_karyawan, biaya_makan_pasien

#### C. Biaya Tidak Langsung (menggunakan `dasar_alokasi_waktu`)
```sql
biaya_tidak_langsung_terdistribusi = distribusi_biaya_rekap.uk044_bdrs × (dasar_alokasi_waktu ÷ jumlah)
```

**Contoh:** BDRS.08
- Biaya TL Tahunan UK044 = Rp 180,916,052
- dasar_alokasi_waktu = 0.003020
- jumlah = 8

**Hasil:**
```
biaya_tidak_langsung_terdistribusi = 180,916,052 × (0.003020 ÷ 8)
                                   = 180,916,052 × 0.000377541
                                   = Rp 68,296
```

---

### 4️⃣ Hitung Biaya Bahan (Auto via Trigger)
**Trigger:** `trigger_calculate_biaya_bahan_bdrs`  
**Event:** BEFORE INSERT/UPDATE pada kolom `bahan_pemeriksaan`

**Formula:**
```sql
biaya_bahan_pemeriksaan_numeric = SUM(harga_total dari JSON bahan_pemeriksaan)
```

**Format JSON:**
```json
[
  {
    "kode_barang": "BRG001",
    "nama": "Reagen A",
    "qty": 1,
    "harga_satuan": 50000,
    "harga_total": 50000
  }
]
```

---

### 5️⃣ Hitung Unit Cost (Auto via Generated Column)
**Column:** `unit_cost_per_pemeriksaan` (GENERATED STORED)

**Formula:**
```sql
unit_cost_per_pemeriksaan = 
    biaya_gaji_tunjangan +
    biaya_jasa_pelayanan +
    biaya_obat +
    biaya_bhp +
    biaya_makan_karyawan +
    biaya_makan_pasien +
    biaya_rumah_tangga +
    biaya_cetak +
    biaya_atk +
    biaya_listrik +
    biaya_air +
    biaya_telp +
    biaya_pemeliharaan_bangunan +
    biaya_pemeliharaan_alat_medis +
    biaya_pemeliharaan_alat_non_medis +
    biaya_operasional_lainnya +
    biaya_penyusutan_gedung +
    biaya_penyusutan_jaringan +
    biaya_penyusutan_alat_medis +
    biaya_penyusutan_alat_non_medis +
    biaya_pendidikan_pelatihan +
    biaya_laundry +
    biaya_sterilisasi +
    biaya_tidak_langsung_terdistribusi +
    biaya_bahan_pemeriksaan_numeric
```

**Contoh:** BDRS.08
```
unit_cost_per_pemeriksaan = 84,714 + 0 + ... + 68,296 + 0
                          = Rp 225,370
```

---

## 🔄 ALUR KALKULASI OTOMATIS

### Skenario 1: User Input Data Manual
```
1. User input/update data:
   ├─ jumlah = 8
   ├─ waktu_pemeriksaan = 70
   ├─ profesionalisme = 2
   └─ tingkat_kesulitan = 3

2. TRIGGER: trigger_auto_calculate_hasil_kali_bdrs (BEFORE)
   ├─ hasil_kali_waktu = 70 × 8 = 560
   └─ hasil_kali = 70 × 8 × 2 × 3 = 3,360

3. Data tersimpan ke database

4. Frontend memanggil RPC:
   ├─ fix_hasil_kali_bdrs(user_id, tahun)
   ├─ fix_dasar_alokasi_bdrs(user_id, tahun)
   └─ fix_biaya_calculation_bdrs_correct(user_id, tahun)

5. GENERATED COLUMN: unit_cost_per_pemeriksaan auto-update

6. REALTIME: Frontend auto-refresh data
```

### Skenario 2: Data Biaya Berubah (Auto-Recalculation)
```
1. User mengubah data_biaya untuk UK044 atau distribusi_biaya_rekap.uk044_bdrs

2. TRIGGER: trigger_auto_recalc_bdrs_on_data_biaya (AFTER)
           trigger_auto_recalc_bdrs_on_distribusi (AFTER)

3. OTOMATIS memanggil:
   ├─ fix_hasil_kali_bdrs(user_id, tahun)
   ├─ fix_dasar_alokasi_bdrs(user_id, tahun)
   └─ fix_biaya_calculation_bdrs_correct(user_id, tahun)

4. SEMUA kalkulasi_bdrs untuk user & tahun tersebut DI-RECALCULATE

5. GENERATED COLUMN: unit_cost_per_pemeriksaan auto-update

6. REALTIME: Frontend auto-refresh data
```

### Skenario 3: Input Bahan Pemeriksaan
```
1. User input/update bahan_pemeriksaan (JSON)

2. TRIGGER: trigger_calculate_biaya_bahan_bdrs (BEFORE)
   └─ biaya_bahan_pemeriksaan_numeric = SUM(harga_total)

3. GENERATED COLUMN: unit_cost_per_pemeriksaan otomatis menyertakan biaya bahan

4. REALTIME: Frontend auto-refresh data
```

---

## 📋 KOMPONEN SISTEM

### Triggers (4 triggers)
| No | Trigger | Table | Event | Fungsi |
|----|---------|-------|-------|--------|
| 1 | `trigger_auto_calculate_hasil_kali_bdrs` | kalkulasi_bdrs | BEFORE INSERT/UPDATE | Auto-calculate hasil_kali & hasil_kali_waktu |
| 2 | `trigger_calculate_biaya_bahan_bdrs` | kalkulasi_bdrs | BEFORE INSERT/UPDATE | Auto-calculate biaya_bahan_pemeriksaan_numeric |
| 3 | `trigger_auto_recalc_bdrs_on_data_biaya` | data_biaya | AFTER INSERT/UPDATE | Auto-recalculate SEMUA kalkulasi_bdrs saat data_biaya UK044 berubah |
| 4 | `trigger_auto_recalc_bdrs_on_distribusi` | distribusi_biaya_rekap | AFTER INSERT/UPDATE | Auto-recalculate SEMUA kalkulasi_bdrs saat distribusi_biaya_rekap.uk044_bdrs berubah |

### RPC Functions (8 functions)
| No | Function | Parameter | Fungsi |
|----|----------|-----------|--------|
| 1 | `fix_hasil_kali_bdrs()` | user_id, tahun | Hitung hasil_kali_waktu & hasil_kali untuk semua tindakan |
| 2 | `fix_dasar_alokasi_bdrs()` | user_id, tahun | Hitung dasar_alokasi_waktu & dasar_alokasi_hasil_kali (6 decimal) |
| 3 | `fix_biaya_calculation_bdrs_correct()` | user_id, tahun | Distribusi biaya tahunan ke setiap tindakan |
| 4 | `calculate_biaya_bahan_bdrs()` | - | Trigger function untuk hitung biaya bahan dari JSON |
| 5 | `auto_calculate_hasil_kali_bdrs()` | - | Trigger function untuk hitung hasil_kali otomatis |
| 6 | `auto_recalculate_kalkulasi_bdrs_on_data_biaya_change()` | - | Trigger function untuk recalculate saat data_biaya berubah |
| 7 | `auto_recalculate_kalkulasi_bdrs_on_distribusi_change()` | - | Trigger function untuk recalculate saat distribusi berubah |
| 8 | `auto_generate_bdrs_code()` | - | Trigger function untuk generate kode BDRS otomatis |

### Generated Columns (1 column)
| Column | Type | Fungsi |
|--------|------|--------|
| `unit_cost_per_pemeriksaan` | BIGINT GENERATED STORED | Auto-calculate unit cost = SUM(semua 25 kolom biaya) |

### Realtime
| Channel | Table | Event |
|---------|-------|-------|
| `kalkulasi_bdrs_changes` | kalkulasi_bdrs | INSERT, UPDATE, DELETE |

---

## 📊 RELASI TABEL

```
┌─────────────────────┐
│   tindakan_bdrs     │
│  (kode, nama)       │
└──────────┬──────────┘
           │
           │ reference
           ↓
┌─────────────────────┐      ┌─────────────────────┐
│   kalkulasi_bdrs    │◄─────│    auth.users       │
│                     │      │    (user_id)        │
│  • kode             │      └─────────────────────┘
│  • jenis_pemeriksaan│
│  • jumlah           │
│  • hasil_kali_waktu │      ┌─────────────────────┐
│  • hasil_kali       │◄─────│    data_biaya       │
│  • dasar_alokasi_*  │      │ (UK044, tahun)      │
│  • biaya_*          │      └─────────────────────┘
│  • unit_cost        │
└─────────────────────┘      ┌─────────────────────┐
           ▲                 │ distribusi_biaya_   │
           │                 │ rekap               │
           └─────────────────│ (uk044_bdrs)        │
                             └─────────────────────┘
```

---

## 🎯 CARA MENGGUNAKAN

### 1. Generate Data Awal
```typescript
// Frontend akan otomatis generate data dari tabel tindakan_bdrs
const { data, error } = await supabase
  .from('kalkulasi_bdrs')
  .select('*')
  .eq('tahun', 2025)

if (data.length === 0) {
  // Generate initial data
  await generateInitialData()
}
```

### 2. Input Data Manual
```typescript
// Input jumlah, waktu, profesionalisme, tingkat_kesulitan
await supabase
  .from('kalkulasi_bdrs')
  .update({
    jumlah: 8,
    waktu_pemeriksaan: 70,
    profesionalisme: 2,
    tingkat_kesulitan: 3
  })
  .eq('id', row_id)

// Jalankan kalkulasi
await supabase.rpc('fix_hasil_kali_bdrs', { p_user_id, p_tahun })
await supabase.rpc('fix_dasar_alokasi_bdrs', { p_user_id, p_tahun })
await supabase.rpc('fix_biaya_calculation_bdrs_correct', { p_user_id, p_tahun })

// Unit cost otomatis ter-update
```

### 3. Import dari CSV
```typescript
// Import CSV dengan PapaParse
const results = Papa.parse(csvFile, { header: true })

// Insert/Update batch
for (const row of results.data) {
  await supabase
    .from('kalkulasi_bdrs')
    .upsert({
      kode: row.kode,
      jumlah: parseInt(row.jumlah),
      waktu_pemeriksaan: parseInt(row.waktu_pemeriksaan),
      // ... kolom lainnya
    })
}

// Jalankan kalkulasi
await supabase.rpc('fix_hasil_kali_bdrs', { p_user_id, p_tahun })
await supabase.rpc('fix_dasar_alokasi_bdrs', { p_user_id, p_tahun })
await supabase.rpc('fix_biaya_calculation_bdrs_correct', { p_user_id, p_tahun })
```

---

## ✅ VALIDASI HASIL

### Test Case: BDRS.08 - Crossmatch Wb 3

**Input:**
- jumlah = 8
- waktu_pemeriksaan = 70
- profesionalisme = 2
- tingkat_kesulitan = 3

**Expected Results:**
| Kolom | Rumus | Nilai | Status |
|-------|-------|-------|--------|
| hasil_kali_waktu | 70 × 8 | 560 | ✅ |
| hasil_kali | 70 × 8 × 2 × 3 | 3,360 | ✅ |
| dasar_alokasi_waktu | 560 ÷ 185,400 | 0.003020 | ✅ |
| dasar_alokasi_hasil_kali | 3,360 ÷ 1,233,680 | 0.002724 | ✅ |
| biaya_gaji_tunjangan | 248,794,324 × (0.002724 ÷ 8) | Rp 84,714 | ✅ |
| biaya_tidak_langsung_terdistribusi | 180,916,052 × (0.003020 ÷ 8) | Rp 68,296 | ✅ |
| unit_cost_per_pemeriksaan | SUM(semua biaya) | Rp 225,370 | ✅ |

---

## 🔍 MONITORING & DEBUGGING

### Query untuk Cek Trigger
```sql
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%bdrs%'
ORDER BY trigger_name;
```

### Query untuk Cek Dokumentasi
```sql
-- Dokumentasi tabel
SELECT obj_description('public.kalkulasi_bdrs'::regclass);

-- Dokumentasi kolom
SELECT 
    c.column_name,
    pgd.description
FROM pg_catalog.pg_statio_all_tables as st
INNER JOIN pg_catalog.pg_description pgd on (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c on (
    pgd.objsubid = c.ordinal_position 
    and c.table_schema = st.schemaname 
    and c.table_name = st.relname
)
WHERE st.schemaname = 'public' 
  AND st.relname = 'kalkulasi_bdrs';
```

### Query untuk Validasi Hasil
```sql
-- Validasi hasil_kali_waktu & hasil_kali
SELECT 
    kode,
    jenis_pemeriksaan,
    waktu_pemeriksaan * jumlah as expected_hkw,
    hasil_kali_waktu as actual_hkw,
    waktu_pemeriksaan * jumlah * profesionalisme * tingkat_kesulitan as expected_hk,
    hasil_kali as actual_hk,
    CASE 
        WHEN waktu_pemeriksaan * jumlah = hasil_kali_waktu 
         AND waktu_pemeriksaan * jumlah * profesionalisme * tingkat_kesulitan = hasil_kali
        THEN '✅' 
        ELSE '❌' 
    END as validasi
FROM kalkulasi_bdrs
WHERE tahun = 2025;
```

---

## 📝 CHANGELOG

### Version 1.2 (Current)
- ✅ Update rumus hasil_kali_waktu: `waktu × jumlah` (melibatkan jumlah)
- ✅ Update rumus hasil_kali: `waktu × jumlah × profesionalisme × tingkat_kesulitan`
- ✅ Trigger auto-recalculation saat data_biaya berubah
- ✅ Trigger auto-recalculation saat distribusi_biaya_rekap berubah
- ✅ Dokumentasi lengkap 36 kolom
- ✅ Dasar alokasi menggunakan 6 angka decimal

### Version 1.1
- ✅ Biaya jasa pelayanan = 0 (sesuai instruksi)
- ✅ Dasar alokasi menggunakan 6 angka decimal
- ✅ Trigger auto-calculate hasil_kali saat input

### Version 1.0
- ✅ Tabel kalkulasi_bdrs dengan 40+ kolom
- ✅ Generated column untuk unit_cost_per_pemeriksaan
- ✅ RPC functions untuk kalkulasi
- ✅ Frontend dengan realtime update

---

## 📞 SUPPORT

Untuk pertanyaan atau issue terkait sistem kalkulasi BDRS:
1. Cek dokumentasi di file ini
2. Lihat comment di tabel database: `COMMENT ON TABLE public.kalkulasi_bdrs`
3. Lihat comment di kolom: `COMMENT ON COLUMN public.kalkulasi_bdrs.<nama_kolom>`
4. Jalankan query validasi untuk debugging

---

**Last Updated:** 2025-10-01  
**Database Version:** PostgreSQL (Supabase)  
**Frontend:** React + TypeScript + Supabase Client

