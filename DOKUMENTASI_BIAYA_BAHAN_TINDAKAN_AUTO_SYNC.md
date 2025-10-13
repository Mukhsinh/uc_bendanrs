# 🛒 Dokumentasi: Biaya Bahan Tindakan Auto-Sync

## 🎯 Overview

Telah ditambahkan **kolom `biaya_bahan_tindakan`** ke tabel `jenis_tindakan_inap` yang:

✅ **Auto-sync** dari tabel `daftar_tindakan`  
✅ **Auto-populate** saat INSERT/UPDATE  
✅ **Auto-update** saat master berubah  
✅ **Real-time synchronization**  

---

## 🗄️ Perubahan Database

### Migration Applied ✅

**File Migration:** `add_biaya_bahan_tindakan_to_jenis_tindakan_inap`

### Struktur Kolom:

```sql
-- Add column
ALTER TABLE jenis_tindakan_inap 
ADD COLUMN biaya_bahan_tindakan INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN jenis_tindakan_inap.biaya_bahan_tindakan IS 
  'Biaya bahan tindakan (auto dari daftar_tindakan)';
```

### Relasi:

```
daftar_tindakan.biaya_bahan_tindakan
           ↓ (auto-sync)
jenis_tindakan_inap.biaya_bahan_tindakan
```

---

## 🔄 Sistem Auto-Sync

### Trigger 1: Auto-Populate (Updated) ✅

**Function:** `auto_populate_tindakan_details()`

**Trigger:** `trigger_auto_populate_tindakan_details`

**When:** BEFORE INSERT OR UPDATE di `jenis_tindakan_inap`

**Updated Code:**
```sql
CREATE OR REPLACE FUNCTION auto_populate_tindakan_details()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    COALESCE(waktu, 0),
    COALESCE(profesionalisme, 1),
    COALESCE(tingkat_kesulitan, 1),
    COALESCE(biaya_bahan_tindakan, 0)  -- ✅ NEW
  INTO 
    NEW.waktu,
    NEW.profesionalisme,
    NEW.tingkat_kesulitan,
    NEW.biaya_bahan_tindakan           -- ✅ NEW
  FROM daftar_tindakan
  WHERE kode_tindakan = NEW.kode_jenis_tindakan;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Trigger 2: Auto-Update Master (Updated) ✅

**Function:** `update_related_jenis_tindakan_inap()`

**Trigger:** `trigger_update_related_jenis_tindakan_inap`

**When:** AFTER UPDATE OF `waktu, profesionalisme, tingkat_kesulitan, biaya_bahan_tindakan` di `daftar_tindakan`

**Updated Code:**
```sql
CREATE OR REPLACE FUNCTION update_related_jenis_tindakan_inap()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jenis_tindakan_inap
  SET 
    waktu = COALESCE(NEW.waktu, 0),
    profesionalisme = COALESCE(NEW.profesionalisme, 1),
    tingkat_kesulitan = COALESCE(NEW.tingkat_kesulitan, 1),
    biaya_bahan_tindakan = COALESCE(NEW.biaya_bahan_tindakan, 0),  -- ✅ NEW
    updated_at = now()
  WHERE kode_jenis_tindakan = NEW.kode_tindakan;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated to include biaya_bahan_tindakan
CREATE TRIGGER trigger_update_related_jenis_tindakan_inap
  AFTER UPDATE OF waktu, profesionalisme, tingkat_kesulitan, biaya_bahan_tindakan
  ON daftar_tindakan
  FOR EACH ROW
  WHEN (
    OLD.waktu IS DISTINCT FROM NEW.waktu OR
    OLD.profesionalisme IS DISTINCT FROM NEW.profesionalisme OR
    OLD.tingkat_kesulitan IS DISTINCT FROM NEW.tingkat_kesulitan OR
    OLD.biaya_bahan_tindakan IS DISTINCT FROM NEW.biaya_bahan_tindakan  -- ✅ NEW
  )
  EXECUTE FUNCTION update_related_jenis_tindakan_inap();
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
  biaya_bahan_tindakan?: number;      // ✅ NEW - Auto from master
  hasil_kali_waktu?: number;
  hasil_kali?: number;
  created_at?: string;
  updated_at?: string;
}
```

### 2. Table Display Updated ✅

**New Column Added:**

```tsx
<TableHead className="w-[120px] text-center">
  <div className="flex items-center justify-center gap-1">
    <ShoppingCart className="h-3 w-3" />  {/* ✅ NEW icon */}
    Biaya Bahan
  </div>
</TableHead>
```

### 3. Cell Display ✅

```tsx
<TableCell className="text-center">
  {tindakan.biaya_bahan_tindakan ? (
    <span className="text-xs font-medium text-green-700">
      Rp {tindakan.biaya_bahan_tindakan.toLocaleString()}
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  )}
</TableCell>
```

**Features:**
- ✅ Display dengan format rupiah
- ✅ Green color untuk visibility
- ✅ Thousand separator
- ✅ Show "-" jika tidak ada biaya

### 4. Dialog Info Updated ✅

```tsx
<li className="text-xs text-blue-600 mt-2">
  ℹ️ Waktu, Profesionalisme, Tingkat Kesulitan, dan Biaya Bahan 
     akan otomatis terisi dari master tindakan
</li>
```

---

## 📸 Preview Tampilan

### Table View:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🏥 RI.01 - Ruang Rawat Inap Lantai 1                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Kode│Nama   │Jml│⏱️│⭐│⚠️│ 🛒Biaya Bahan│✕Jml×Waktu│🧮Hasil Kali│ Aksi    │
├──────────────────────────────────────────────────────────────────────────────┤
│T.001│Konsul │ 3 │15│2 │3 │  Rp 1,569   │    45    │    270     │ ✏️🗑️    │
│T.002│Lab    │ 5 │10│1 │1 │  Rp 1,790   │    50    │     50     │ ✏️🗑️    │
│T.003│Infus  │ 2 │20│2 │3 │      -      │    40    │    240     │ ✏️🗑️    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Visual Features:**
- 🛒 ShoppingCart icon untuk biaya bahan
- Green text color untuk emphasis
- Format rupiah dengan thousand separator
- Show "-" untuk tindakan tanpa biaya bahan

---

## 🔄 Workflow Auto-Sync

### Scenario 1: Tambah Tindakan Baru

```
┌────────────────────────────────────────────────────────┐
│ User tambah tindakan T.001 ke unit RI.01              │
│ Input: jumlah = 3                                      │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│ Trigger: auto_populate_tindakan_details               │
│ Ambil dari master daftar_tindakan:                    │
│ • waktu = 15                                           │
│ • profesionalisme = 2                                  │
│ • tingkat_kesulitan = 3                                │
│ • biaya_bahan_tindakan = 1,569 ✅                      │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│ Tersimpan di jenis_tindakan_inap:                     │
│ • jumlah = 3                                           │
│ • waktu = 15 (auto)                                    │
│ • profesionalisme = 2 (auto)                           │
│ • tingkat_kesulitan = 3 (auto)                         │
│ • biaya_bahan_tindakan = 1,569 (auto) ✅               │
│ • hasil_kali_waktu = 45 (generated)                    │
│ • hasil_kali = 270 (generated)                         │
└────────────────────────────────────────────────────────┘
```

---

### Scenario 2: Update Master - Biaya Bahan Berubah

```
┌────────────────────────────────────────────────────────┐
│ Admin update master T.001:                             │
│ • Tambah bahan baru ke tindakan                        │
│ • biaya_bahan_tindakan: 1,569 → 2,000                  │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│ Trigger: update_related_jenis_tindakan_inap           │
│ Berjalan otomatis AFTER UPDATE                         │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│ Update SEMUA record dengan kode_jenis_tindakan=T.001  │
│ RI.01: biaya_bahan_tindakan = 2,000 ✅                 │
│ RI.02: biaya_bahan_tindakan = 2,000 ✅                 │
│ ICU:   biaya_bahan_tindakan = 2,000 ✅                 │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│ User buka halaman → Data sudah updated! 🎉             │
└────────────────────────────────────────────────────────┘
```

**Semua otomatis tanpa intervensi manual!**

---

## 📊 Biaya Bahan Tindakan di Master

### Sumber Data: `daftar_tindakan.biaya_bahan_tindakan`

**Calculated from:** `bahan_tindakan` (JSONB array)

**Example:**
```json
{
  "bahan_tindakan": [
    {
      "nama": "Alkohol 70%",
      "jumlah": 1,
      "satuan": "botol",
      "harga_satuan": 15000,
      "harga_total": 15000
    },
    {
      "nama": "Kapas Steril",
      "jumlah": 2,
      "satuan": "pack",
      "harga_satuan": 8000,
      "harga_total": 16000
    }
  ],
  "biaya_bahan_tindakan": 31000  // Sum of harga_total
}
```

**Trigger:** `calculate_biaya_bahan_tindakan` di tabel `daftar_tindakan`

---

## 🎯 Use Cases

### Use Case 1: Kalkulasi Total Biaya Tindakan + Bahan

**Scenario:** Hitung total biaya untuk pasien di RI.01

**Data:**
```
T.001: Konsultasi
- jumlah = 3
- hasil_kali = 270 (bobot tindakan)
- biaya_bahan_tindakan = 1,569

T.002: Lab
- jumlah = 5
- hasil_kali = 50 (bobot tindakan)
- biaya_bahan_tindakan = 1,790
```

**Kalkulasi:**
```
Tarif per unit bobot = Rp 1,000

Biaya T.001:
- Biaya tindakan: 270 × Rp 1,000 = Rp 270,000
- Biaya bahan: Rp 1,569
- Total: Rp 271,569

Biaya T.002:
- Biaya tindakan: 50 × Rp 1,000 = Rp 50,000
- Biaya bahan: Rp 1,790
- Total: Rp 51,790

GRAND TOTAL: Rp 323,359 ✅
```

---

### Use Case 2: Track Biaya Bahan per Unit

**Scenario:** Analisis biaya bahan per unit kerja

**Query:**
```sql
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  COUNT(*) as jumlah_tindakan,
  SUM(biaya_bahan_tindakan) as total_biaya_bahan
FROM jenis_tindakan_inap
GROUP BY kode_unit_kerja, nama_unit_kerja
ORDER BY total_biaya_bahan DESC;
```

**Result:**
```
RI.01 - Ruang VIP:       Rp 5,000,000
RI.02 - Ruang Kelas 1:   Rp 3,500,000
ICU:                     Rp 8,000,000
```

**Insight:** ICU punya biaya bahan tertinggi karena tindakan lebih kompleks

---

### Use Case 3: Update Harga Bahan Master

**Scenario:** Harga alkohol naik dari Rp 15,000 → Rp 18,000

**Steps:**
1. Admin buka "Daftar Tindakan"
2. Edit tindakan yang pakai alkohol
3. Update bahan tindakan (harga baru)
4. System auto-calculate `biaya_bahan_tindakan` baru
5. Trigger auto-update semua referensi di `jenis_tindakan_inap` ✅

**Result:**
- Semua unit yang pakai tindakan itu otomatis ter-update
- Biaya bahan terbaru langsung tersedia
- Tidak perlu update manual

---

## 🧪 Testing & Verification

### Test 1: Verify Sync Status ✅

```sql
SELECT 
  jti.kode_jenis_tindakan,
  jti.biaya_bahan_tindakan as "jenis_tindakan_inap",
  dt.biaya_bahan_tindakan as "daftar_tindakan",
  CASE 
    WHEN jti.biaya_bahan_tindakan = dt.biaya_bahan_tindakan 
    THEN '✅ Synced'
    ELSE '❌ Not Synced'
  END as status
FROM jenis_tindakan_inap jti
JOIN daftar_tindakan dt 
  ON jti.kode_jenis_tindakan = dt.kode_tindakan;
```

**Expected Result:**
```
T.001: 1569 = 1569 → ✅ Synced
T.002: 1790 = 1790 → ✅ Synced
T.003: 0 = 0 → ✅ Synced
```

---

### Test 2: Test Auto-Populate

```sql
-- Insert new record
INSERT INTO jenis_tindakan_inap (
  kode_unit_kerja,
  kode_jenis_tindakan,
  jumlah
) VALUES ('RI.01', 'T.001', 5);

-- Check auto-populated values
SELECT 
  kode_jenis_tindakan,
  jumlah,                    -- 5 (user input)
  waktu,                     -- 15 (auto)
  profesionalisme,           -- 2 (auto)
  tingkat_kesulitan,         -- 3 (auto)
  biaya_bahan_tindakan       -- 1569 (auto) ✅
FROM jenis_tindakan_inap
WHERE kode_jenis_tindakan = 'T.001'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
```
biaya_bahan_tindakan = 1569 ✅ (from master)
```

---

### Test 3: Test Auto-Update from Master

```sql
-- Step 1: Update master
UPDATE daftar_tindakan
SET biaya_bahan_tindakan = 2000  -- was 1569
WHERE kode_tindakan = 'T.001';

-- Step 2: Check all references updated
SELECT 
  kode_unit_kerja,
  kode_jenis_tindakan,
  biaya_bahan_tindakan
FROM jenis_tindakan_inap
WHERE kode_jenis_tindakan = 'T.001';
```

**Expected Result:**
```
All records with T.001 now have biaya_bahan_tindakan = 2000 ✅
```

---

## 📚 Complete Auto-Sync Fields

### Current Auto-Sync Fields dari `daftar_tindakan`:

| Field | Type | Source | Auto-Sync |
|-------|------|--------|-----------|
| **waktu** | INTEGER | daftar_tindakan.waktu | ✅ Yes |
| **profesionalisme** | SMALLINT | daftar_tindakan.profesionalisme | ✅ Yes |
| **tingkat_kesulitan** | SMALLINT | daftar_tindakan.tingkat_kesulitan | ✅ Yes |
| **biaya_bahan_tindakan** | INTEGER | daftar_tindakan.biaya_bahan_tindakan | ✅ Yes |

### Dependency Flow:

```
daftar_tindakan (Master)
├─ waktu
├─ profesionalisme
├─ tingkat_kesulitan
└─ biaya_bahan_tindakan ✅ NEW
   ↓ (Auto-sync via triggers)
jenis_tindakan_inap (Child)
├─ waktu (auto)
├─ profesionalisme (auto)
├─ tingkat_kesulitan (auto)
└─ biaya_bahan_tindakan (auto) ✅ NEW
   ↓ (Used in calculations)
├─ hasil_kali_waktu (generated)
└─ hasil_kali (generated)
```

---

## ✅ Checklist Implementation

### Database:
- [x] Kolom `biaya_bahan_tindakan` added
- [x] Trigger `auto_populate_tindakan_details` updated
- [x] Trigger `update_related_jenis_tindakan_inap` updated
- [x] Trigger includes `biaya_bahan_tindakan` in WHEN clause
- [x] Existing data updated
- [x] All records synced ✅

### Frontend:
- [x] Interface updated
- [x] Table header added (ShoppingCart icon)
- [x] Table cell added (rupiah format)
- [x] Dialog info updated
- [x] No linting errors

### Testing:
- [x] Column verified
- [x] Triggers verified
- [x] Sync status verified (all ✅)
- [x] Auto-populate tested
- [x] Auto-update tested

---

## 🎓 Summary

### What Changed:

1. **Database:**
   - Kolom `biaya_bahan_tindakan` di `jenis_tindakan_inap`
   - 2 triggers updated untuk include field baru

2. **Frontend:**
   - Table column baru dengan icon 🛒
   - Format rupiah dengan thousand separator
   - Dialog info updated

3. **Auto-Sync:**
   - Trigger 1: Auto-populate saat INSERT/UPDATE
   - Trigger 2: Auto-sync saat master berubah

### Benefits:

- ✅ **Data Lengkap**: Biaya bahan otomatis tersedia
- ✅ **Always Synced**: Real-time synchronization
- ✅ **No Manual Work**: Zero maintenance
- ✅ **Accurate Costing**: Untuk kalkulasi biaya total
- ✅ **Transparent**: User bisa lihat breakdown biaya

### Key Innovation:

🔄 **Complete Auto-Sync System**
```
4 fields auto-sync dari master:
- waktu ✅
- profesionalisme ✅
- tingkat_kesulitan ✅
- biaya_bahan_tindakan ✅ NEW

→ Zero manual intervention!
```

---

## 🚀 Status

**✅ COMPLETE & PRODUCTION READY**

**All components:**
- ✅ Database (column + triggers)
- ✅ Frontend (display + formatting)
- ✅ Auto-sync (100% functional)
- ✅ Testing (all synced ✅)

**Special Features:**
- 🔄 Real-time auto-sync ✅
- 🛒 Biaya bahan tracking ✅
- 💰 Ready for cost calculation ✅

**Ready for comprehensive billing!** 💼📊

---

## 📖 Quick Reference

```
╔══════════════════════════════════════════════════════════╗
║    BIAYA BAHAN TINDAKAN - AUTO SYNC REFERENCE           ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Source: daftar_tindakan.biaya_bahan_tindakan           ║
║  Target: jenis_tindakan_inap.biaya_bahan_tindakan       ║
║                                                          ║
║  🔄 AUTO-POPULATE: On INSERT/UPDATE                      ║
║  🔄 AUTO-SYNC: On master change                          ║
║  ✅ VERIFIED: All records synced                         ║
║                                                          ║
║  Display: Rp format with thousand separator             ║
║  Icon: 🛒 ShoppingCart                                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

**Documentation Created:** 2 Oktober 2025  
**Version:** 1.0  
**Status:** ✅ Complete  
**Auto-Sync:** ✅ Active (Biaya Bahan included)


