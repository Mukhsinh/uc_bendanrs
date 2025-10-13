# 📊 Dokumentasi: Kolom Kalkulasi Otomatis

## 🎯 Overview

Telah ditambahkan **2 kolom kalkulasi otomatis** ke tabel `jenis_tindakan_inap`:

1. **`hasil_kali_waktu`** = `jumlah × waktu`
2. **`hasil_kali`** = `jumlah × waktu × profesionalisme × tingkat_kesulitan`

### ✨ Keunggulan Auto-Calculate

**Kolom ini menggunakan PostgreSQL GENERATED COLUMNS:**
- ✅ **Auto-calculate** saat INSERT
- ✅ **Auto-update** saat ada perubahan di kolom dependensi
- ✅ **Native database feature** - tidak perlu trigger tambahan
- ✅ **Real-time** - tidak ada delay
- ✅ **Konsisten** - dijamin selalu akurat

---

## 🗄️ Perubahan Database

### Migration Applied ✅

**File Migration:** `add_calculated_columns_to_jenis_tindakan_inap`

### Struktur Kolom:

```sql
-- 1. hasil_kali_waktu = jumlah × waktu
ALTER TABLE jenis_tindakan_inap 
ADD COLUMN hasil_kali_waktu INTEGER 
GENERATED ALWAYS AS (
  COALESCE(jumlah, 0) * COALESCE(waktu, 0)
) STORED;

-- 2. hasil_kali = jumlah × waktu × profesionalisme × tingkat_kesulitan
ALTER TABLE jenis_tindakan_inap 
ADD COLUMN hasil_kali INTEGER 
GENERATED ALWAYS AS (
  COALESCE(jumlah, 0) * 
  COALESCE(waktu, 0) * 
  COALESCE(profesionalisme, 1) * 
  COALESCE(tingkat_kesulitan, 1)
) STORED;
```

### GENERATED ALWAYS

**What is it?**
- PostgreSQL native feature
- Kolom yang nilainya selalu dikalkulasi dari kolom lain
- Tidak bisa di-INSERT atau UPDATE manual
- Auto-recalculate saat kolom dependensi berubah

**Why STORED?**
- Nilai disimpan di disk (bukan dikalkulasi setiap query)
- Performa query lebih cepat
- Bisa di-index jika diperlukan

---

## 📐 Formula Kalkulasi

### Formula 1: Hasil Kali Waktu

```
hasil_kali_waktu = jumlah × waktu
```

**Contoh:**
```
jumlah = 3 (kali tindakan)
waktu = 15 (menit)
↓
hasil_kali_waktu = 3 × 15 = 45 menit
```

**Use Case:**
- Total durasi untuk multiple tindakan
- Resource planning (berapa lama total?)
- Scheduling optimization

---

### Formula 2: Hasil Kali (Bobot Total)

```
hasil_kali = jumlah × waktu × profesionalisme × tingkat_kesulitan
```

**Contoh:**
```
jumlah = 3 (kali)
waktu = 15 (menit)
profesionalisme = 2 (menengah)
tingkat_kesulitan = 3 (sedang)
↓
hasil_kali = 3 × 15 × 2 × 3 = 270
```

**Use Case:**
- Kalkulasi biaya (base for pricing)
- Resource allocation (kompleksitas total)
- Workload calculation
- Performance metrics

---

## 🔄 Bagaimana Auto-Calculate Bekerja?

### Scenario 1: INSERT Record Baru

```sql
-- User insert data
INSERT INTO jenis_tindakan_inap (
  kode_unit_kerja,
  kode_jenis_tindakan,
  jumlah  -- user input: 5
) VALUES ('RI.01', 'T.001', 5);

-- Trigger auto-populate berjalan
↓
waktu = 15 (dari master)
profesionalisme = 2 (dari master)
tingkat_kesulitan = 3 (dari master)

-- GENERATED column auto-calculate
↓
hasil_kali_waktu = 5 × 15 = 75
hasil_kali = 5 × 15 × 2 × 3 = 450

-- Result tersimpan ✅
```

---

### Scenario 2: UPDATE Jumlah

```sql
-- User update jumlah
UPDATE jenis_tindakan_inap
SET jumlah = 10
WHERE id = '...';

-- GENERATED column auto-recalculate
↓
hasil_kali_waktu = 10 × 15 = 150 (was 75)
hasil_kali = 10 × 15 × 2 × 3 = 900 (was 450)

-- Result ter-update otomatis ✅
```

---

### Scenario 3: UPDATE Master Data

```sql
-- Admin update master tindakan
UPDATE daftar_tindakan
SET waktu = 20  -- was 15
WHERE kode_tindakan = 'T.001';

-- Trigger update_related_jenis_tindakan_inap
↓
Update waktu di jenis_tindakan_inap: 15 → 20

-- GENERATED column auto-recalculate
↓
hasil_kali_waktu = 10 × 20 = 200 (was 150)
hasil_kali = 10 × 20 × 2 × 3 = 1200 (was 900)

-- Result ter-update otomatis ✅
```

---

## 💻 Perubahan Frontend

### 1. Interface Updated ✅

```typescript
interface JenisTindakanInap {
  id: string;
  kode_jenis: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_jenis_tindakan: string;
  jenis_tindakan: string;
  jumlah?: number;
  waktu?: number;
  profesionalisme?: number;
  tingkat_kesulitan?: number;
  hasil_kali_waktu?: number;           // ✅ NEW - Auto calculated
  hasil_kali?: number;                 // ✅ NEW - Auto calculated
  created_at?: string;
  updated_at?: string;
}
```

### 2. Table Display Updated ✅

**New Columns:**

```tsx
<TableHeader>
  <TableRow>
    <TableHead>Kode</TableHead>
    <TableHead>Nama Tindakan</TableHead>
    <TableHead>Jumlah</TableHead>
    <TableHead><Clock /> Waktu</TableHead>
    <TableHead><Star /> Prof.</TableHead>
    <TableHead><AlertTriangle /> Tingkat</TableHead>
    <TableHead>                                      {/* ✅ NEW */}
      <X /> Jml × Waktu
    </TableHead>
    <TableHead>                                      {/* ✅ NEW */}
      <Calculator /> Hasil Kali
    </TableHead>
    <TableHead>Aksi</TableHead>
  </TableRow>
</TableHeader>
```

### 3. Display with Badges ✅

```tsx
{/* hasil_kali_waktu */}
<TableCell className="text-center">
  <Badge variant="default" className="text-xs font-semibold">
    {tindakan.hasil_kali_waktu?.toLocaleString() || 0}
  </Badge>
</TableCell>

{/* hasil_kali */}
<TableCell className="text-center">
  <Badge variant="default" className="text-xs font-semibold bg-green-600">
    {tindakan.hasil_kali?.toLocaleString() || 0}
  </Badge>
</TableCell>
```

**Visual Hierarchy:**
- `hasil_kali_waktu`: Blue badge (default)
- `hasil_kali`: Green badge (highlight - most important)

---

## 📸 Preview Tampilan

### Table View:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏥 Unit RI.01 - Ruang Rawat Inap Lantai 1                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Kode │ Nama      │Jml│⏱️ │⭐│⚠️│ ✕Jml×Waktu│ 🧮Hasil Kali│ Aksi          │
├─────────────────────────────────────────────────────────────────────────────┤
│ T.001│Konsultasi │ 3 │15m│ 2│ 3│    45     │     270     │ 🗑️            │
│ T.002│Cek Lab    │ 5 │10m│ 1│ 1│    50     │      50     │ 🗑️            │
│ T.003│Infus      │ 2 │20m│ 2│ 3│    40     │     240     │ 🗑️            │
└─────────────────────────────────────────────────────────────────────────────┘

Total Hasil Kali: 560
```

**Visual Features:**
- ✕ icon untuk perkalian sederhana
- 🧮 Calculator icon untuk hasil kali lengkap
- Number formatting dengan thousand separator
- Color coding: Blue untuk intermediate, Green untuk final result

---

## 🎯 Use Cases

### Use Case 1: Total Durasi Tindakan

**Scenario:** Berapa total waktu untuk semua tindakan pasien?

**Data:**
```
T.001: jumlah=3, waktu=15 → hasil_kali_waktu = 45 menit
T.002: jumlah=5, waktu=10 → hasil_kali_waktu = 50 menit
T.003: jumlah=2, waktu=20 → hasil_kali_waktu = 40 menit
```

**Total:** 45 + 50 + 40 = **135 menit** (2 jam 15 menit)

**Benefits:**
- Schedule planning
- Room allocation
- Staff assignment

---

### Use Case 2: Kalkulasi Bobot/Biaya

**Scenario:** Kalkulasi biaya berdasarkan kompleksitas

**Data:**
```
T.001: hasil_kali = 270
T.002: hasil_kali = 50
T.003: hasil_kali = 240
```

**Total Bobot:** 270 + 50 + 240 = **560**

**Kalkulasi Biaya:**
```
Biaya per unit bobot = Rp 1.000
Total biaya = 560 × Rp 1.000 = Rp 560.000
```

**Benefits:**
- Fair pricing berdasarkan kompleksitas
- Resource-based costing
- Transparent calculation

---

### Use Case 3: Workload Analysis

**Scenario:** Analisis beban kerja per unit

**Data Unit RI.01:**
```
Total tindakan: 10 jenis
Total hasil_kali: 2,500
Average per tindakan: 250
```

**Data Unit RI.02:**
```
Total tindakan: 8 jenis
Total hasil_kali: 3,200
Average per tindakan: 400
```

**Insight:** RI.02 punya tindakan lebih kompleks meskipun jumlahnya lebih sedikit

---

## 📊 Real-World Example

### Complete Calculation:

**Input Data:**
```
Tindakan: Pemasangan Infus
Unit: RI.01
```

**User Input:**
```
jumlah = 3 (dilakukan 3 kali)
```

**Auto from Master:**
```
waktu = 20 menit
profesionalisme = 2 (menengah)
tingkat_kesulitan = 3 (sedang)
```

**Auto-Calculated:**
```
hasil_kali_waktu = 3 × 20 = 60 menit
hasil_kali = 3 × 20 × 2 × 3 = 360
```

**Stored in DB:**
```sql
{
  kode_jenis_tindakan: "T.003",
  jenis_tindakan: "Pemasangan Infus",
  jumlah: 3,                    ← user input
  waktu: 20,                    ← auto from master
  profesionalisme: 2,           ← auto from master
  tingkat_kesulitan: 3,         ← auto from master
  hasil_kali_waktu: 60,         ← auto calculated ✨
  hasil_kali: 360               ← auto calculated ✨
}
```

**Display in Table:**
```
│ T.003 │ Pemasangan Infus │ 3 │ 20m │ 2 │ 3 │  60  │  360  │ 🗑️ │
```

---

## 🔄 Dependency Flow

### Calculation Dependencies:

```
┌─────────────────────────────────────────────────┐
│ INPUT (Manual)                                  │
│ • jumlah                                        │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ AUTO FROM MASTER (Trigger)                      │
│ • waktu                                         │
│ • profesionalisme                               │
│ • tingkat_kesulitan                             │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ AUTO CALCULATED (Generated Column)              │
│ • hasil_kali_waktu = jumlah × waktu             │
│ • hasil_kali = jumlah × waktu × prof × tingkat  │
└─────────────────────────────────────────────────┘
```

### Update Propagation:

```
Master Update (daftar_tindakan)
↓
Trigger: update_related_jenis_tindakan_inap
↓
Update: waktu, profesionalisme, tingkat_kesulitan
↓
Auto-recalculate: hasil_kali_waktu, hasil_kali
↓
Done ✅ (All in one transaction)
```

---

## 🧪 Testing & Verification

### Test 1: Verify Calculation

```sql
-- Sample data
INSERT INTO jenis_tindakan_inap (
  kode_unit_kerja,
  kode_jenis_tindakan,
  jumlah
) VALUES ('RI.01', 'T.001', 12);

-- Verify
SELECT 
  jumlah,                    -- 12
  waktu,                     -- 15 (from master)
  profesionalisme,           -- 2 (from master)
  tingkat_kesulitan,         -- 3 (from master)
  hasil_kali_waktu,          -- 12 × 15 = 180 ✅
  hasil_kali                 -- 12 × 15 × 2 × 3 = 1080 ✅
FROM jenis_tindakan_inap
WHERE kode_jenis_tindakan = 'T.001';
```

**Expected Result:**
```
jumlah: 12
waktu: 15
profesionalisme: 2
tingkat_kesulitan: 3
hasil_kali_waktu: 180 ✅
hasil_kali: 1080 ✅
```

---

### Test 2: Update Propagation

```sql
-- Step 1: Update master
UPDATE daftar_tindakan
SET waktu = 20  -- was 15
WHERE kode_tindakan = 'T.001';

-- Step 2: Check auto-update
SELECT 
  jumlah,                    -- 12 (unchanged)
  waktu,                     -- 20 (updated)
  hasil_kali_waktu,          -- 12 × 20 = 240 ✅
  hasil_kali                 -- 12 × 20 × 2 × 3 = 1440 ✅
FROM jenis_tindakan_inap
WHERE kode_jenis_tindakan = 'T.001';
```

**Expected Result:**
```
hasil_kali_waktu: 240 ✅ (was 180)
hasil_kali: 1440 ✅ (was 1080)
```

---

### Test 3: Update Jumlah

```sql
-- Update jumlah
UPDATE jenis_tindakan_inap
SET jumlah = 10  -- was 12
WHERE kode_jenis_tindakan = 'T.001';

-- Check auto-recalculation
SELECT 
  jumlah,                    -- 10 (updated)
  waktu,                     -- 20 (unchanged)
  hasil_kali_waktu,          -- 10 × 20 = 200 ✅
  hasil_kali                 -- 10 × 20 × 2 × 3 = 1200 ✅
FROM jenis_tindakan_inap
WHERE kode_jenis_tindakan = 'T.001';
```

**Expected Result:**
```
hasil_kali_waktu: 200 ✅ (was 240)
hasil_kali: 1200 ✅ (was 1440)
```

---

## 📚 Comparison: Manual vs Auto-Calculate

### Before (Manual Calculation):

**Problems:**
```sql
-- Manual update needed
UPDATE jenis_tindakan_inap
SET hasil_kali = jumlah * waktu * profesionalisme * tingkat_kesulitan
WHERE ...;
```

❌ Prone to errors  
❌ Forgotten updates  
❌ Inconsistent data  
❌ Need trigger or application logic  
❌ Extra maintenance  

---

### After (Auto-Calculate):

**Benefits:**
```sql
-- Just update the source
UPDATE jenis_tindakan_inap
SET jumlah = 10;
-- hasil_kali auto-updates! ✨
```

✅ Always accurate  
✅ Zero maintenance  
✅ Native database feature  
✅ Instant recalculation  
✅ Consistent data  

---

## ✅ Checklist Implementation

### Database:
- [x] Kolom `hasil_kali_waktu` (GENERATED ALWAYS)
- [x] Kolom `hasil_kali` (GENERATED ALWAYS)
- [x] Formula correct
- [x] COALESCE for null safety
- [x] STORED for performance
- [x] Comments for documentation

### Frontend:
- [x] Interface updated
- [x] Table headers added
- [x] Table cells added
- [x] Icons added (X, Calculator)
- [x] Badges styling
- [x] Number formatting (toLocaleString)

### Testing:
- [x] No linting errors
- [x] Columns verified
- [x] Calculation verified
- [x] Auto-update verified
- [x] Formula tested

---

## 🎓 Summary

### What Changed:

1. **Database:**
   - 2 GENERATED columns (hasil_kali_waktu, hasil_kali)
   - Auto-calculate native di PostgreSQL
   - No triggers needed for calculation

2. **Frontend:**
   - 2 new table columns
   - Icons & badges
   - Number formatting

3. **Logic:**
   - Formula 1: jumlah × waktu
   - Formula 2: jumlah × waktu × prof × tingkat
   - Auto-recalculate on any change

### Benefits:

- ✅ **Always Accurate:** Native calculation, zero error
- ✅ **Real-time:** Instant recalculation
- ✅ **Zero Maintenance:** No triggers or app logic needed
- ✅ **Performance:** STORED = fast queries
- ✅ **Scalable:** Ready for aggregation & reporting

### Key Innovation:

🧮 **GENERATED COLUMNS**
```
No code, no trigger, just pure database magic! ✨
```

---

## 🚀 Status

**✅ COMPLETE & READY TO USE**

**All components updated:**
- ✅ Database (GENERATED columns)
- ✅ Frontend (display + formatting)
- ✅ Testing (formulas verified)
- ✅ No linting errors

**Special Features:**
- 🧮 Auto-calculation ✅
- 🔄 Auto-recalculation ✅
- 📊 Complete display ✅

**Ready for production!** 🎉

---

## 📖 Formula Reference Card

```
╔══════════════════════════════════════════════════════════╗
║              FORMULA REFERENCE CARD                      ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  hasil_kali_waktu = jumlah × waktu                       ║
║                                                          ║
║  hasil_kali = jumlah × waktu × profesionalisme           ║
║                     × tingkat_kesulitan                  ║
║                                                          ║
║  COALESCE: jumlah/waktu → 0, prof/tingkat → 1           ║
║                                                          ║
║  AUTO-CALCULATE: ✅ Always                               ║
║  AUTO-UPDATE: ✅ On dependency change                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

**Documentation Created:** 2 Oktober 2025  
**Version:** 1.0  
**Status:** ✅ Complete  
**Auto-Calculate:** ✅ Active (Native)

