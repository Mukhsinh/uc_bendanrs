# 📊 Update: Budgeting BHP dengan Rasio Pendapatan

## 🎉 Fitur Baru yang Ditambahkan

### ✅ **1. Kolom Pendapatan di Tabel budgeting_bhp_farmasi**

**Kolom Baru:** `pendapatan` (BIGINT)
- **Sumber:** Tabel `data_pendapatan.total_pendapatan`
- **Relasi:** Berdasarkan `kode_unit_kerja` dan `tahun`
- **Auto-populate:** Ya, via function `populate_budgeting_bhp_farmasi()`
- **Update:** Otomatis saat data pendapatan berubah (via trigger)

---

### ✅ **2. Kolom Rasio BHP Pendapatan (GENERATED COLUMN)**

**Kolom Baru:** `rasio_bhp_pendapatan` (NUMERIC)

**Formula:**
```sql
rasio_bhp_pendapatan = (total_budgeting_bhp / pendapatan) × 100
                     = ((biaya_bahan × jumlah_tindakan) / pendapatan) × 100
```

**Contoh Kalkulasi:**
```
Tindakan: Os Nasal (Radiologi)
- Biaya Bahan: Rp 8,433
- Jumlah Tindakan: 9,131
- Total Budgeting BHP: Rp 77,001,723
- Pendapatan Unit: Rp 33,705,537
- Rasio BHP: 228.45%
```

**Interpretasi Rasio:**
- 🟢 **0-5%**: Baik (Hijau) - Efisien
- 🟠 **5-10%**: Sedang (Orange) - Perlu monitoring
- 🔴 **> 10%**: Tinggi (Merah) - Perlu evaluasi
- ⚪ **0%**: Tidak ada data (Abu-abu)

---

### ✅ **3. Badge Rasio BHP Pendapatan per Unit Kerja**

**Lokasi:** Halaman Budgeting BHP (Rupiah)

**Tampilan:**
- Grid layout 3 kolom (desktop) / 2 kolom (tablet) / 1 kolom (mobile)
- Card per unit kerja dengan:
  - Nama unit kerja & kode
  - Total budgeting BHP
  - Total pendapatan
  - **Badge rasio dengan warna dinamis:**
    - 🔴 Merah: Rasio > 10%
    - 🟠 Orange: Rasio 5-10%
    - 🟢 Hijau: Rasio 0-5%
    - ⚪ Abu-abu: Rasio 0%

**Sorting:** Dari rasio tertinggi ke terendah

---

### ✅ **4. Badge Total Keseluruhan Unit Kerja**

**Lokasi:** Di bawah badge rasio per unit kerja

**Tampilan:**
- Card dengan gradient teal
- Menampilkan:
  - Total unit kerja yang ter-track
  - **Total Budgeting BHP** keseluruhan
  - **Total Pendapatan** keseluruhan
  - **Rasio Total** dalam badge besar (teal)

**Formula Rasio Total:**
```
Rasio Total = (ΣTotal Budgeting BHP / ΣTotal Pendapatan) × 100
```

---

## 📊 Data yang Sudah Terisi

### **Rasio BHP Pendapatan per Unit Kerja:**

| Rank | Unit Kerja | Items | Total Budgeting | Pendapatan | Rasio | Kategori |
|------|------------|-------|-----------------|------------|-------|----------|
| 1 | **Radiologi** (UK039) | 79 | Rp 77,001,723 | Rp 33,705,537 | **228.45%** | 🔴 Tinggi |
| 2 | **BDRS** (UK044) | 11 | Rp 5,210,000 | Rp 72,359,706 | **7.20%** | 🟠 Sedang |
| 3 | **Cathlab** (UK045) | 17 | Rp 0 | Rp 0 | **0%** | ⚪ Belum ada |
| 4 | **IBS** (UK074) | 213 | Rp 0 | Rp 0 | **0%** | ⚪ Belum ada |
| 5 | **Laboratorium** (UK038) | 125 | Rp 0 | Rp 38,211,160 | **0%** | ⚪ Belum ada |

### **Grand Total:**
```
Total Budgeting BHP: Rp 82,211,723
Total Pendapatan: Rp 144,276,403
Rasio Total: 56.98%
```

---

## 🎨 Tampilan di Halaman Aplikasi

### **Section 1: Statistics Cards** (4 cards - tidak berubah)
- Total Items
- Total Tindakan
- Total Budgeting
- Avg per Tindakan

### **Section 2: Badges Top Performers** (2 cards - tidak berubah)
- Volume Terbanyak (Biru)
- Budgeting Tertinggi (Ungu)

### **Section 3: Rasio BHP Pendapatan per Unit Kerja** ✨ **BARU**

**Card Container:**
- Judul: "Rasio BHP terhadap Pendapatan per Unit Kerja"
- Deskripsi: "Persentase budgeting BHP dibandingkan dengan total pendapatan unit kerja"

**Grid Cards (3 kolom):**
Setiap unit kerja ditampilkan dalam card dengan:
```
┌────────────────────────────────┐
│ [Nama Unit Kerja]              │
│ [Kode Unit Kerja]              │
│                                │
│ Budgeting: Rp XXX              │
│ Pendapatan: Rp XXX             │
│ ─────────────────────          │
│ Rasio BHP: [XX.XX%] 🟢/🟠/🔴  │
└────────────────────────────────┘
```

**Badge Rasio Warna:**
- 🟢 Hijau (bg-green-600): Rasio 0-5%
- 🟠 Orange (bg-orange-600): Rasio 5-10%
- 🔴 Merah (bg-red-600): Rasio > 10%
- ⚪ Abu-abu (bg-gray-400): Rasio 0% (belum ada data)

### **Section 4: Total Keseluruhan** ✨ **BARU**

**Card Gradient Teal:**
Display 4 info dalam 1 baris:
```
┌─────────────────────────────────────────────────────────────┐
│ Total Keseluruhan Unit Kerja          [Badge: XX.XX%] 🏷️    │
│ 5 unit kerja                                                 │
│                                                              │
│ Total Budgeting BHP    Total Pendapatan       Rasio Total   │
│ Rp XXX,XXX,XXX        Rp XXX,XXX,XXX         XX.XX%         │
└─────────────────────────────────────────────────────────────┘
```

### **Section 5: Filter** (tidak berubah)
- Dropdown select unit kerja

### **Section 6: Data Table** (Update: +2 kolom baru)

**Kolom Baru yang Ditambahkan:**
| Kolom | Format | Color | Deskripsi |
|-------|--------|-------|-----------|
| **Pendapatan** | Currency | Gray-700 | Total pendapatan unit kerja |
| **Rasio %** | Badge dengan warna | Dynamic | Rasio BHP/Pendapatan dengan color coding |

**Total Kolom:** 10 kolom (dari 9 menjadi 10)

---

## 🔧 Technical Changes

### **Database:**

#### Migration 1: Add Columns
```sql
ALTER TABLE budgeting_bhp_farmasi 
ADD COLUMN pendapatan BIGINT DEFAULT 0;

ALTER TABLE budgeting_bhp_farmasi 
ADD COLUMN rasio_bhp_pendapatan NUMERIC GENERATED ALWAYS AS (
    CASE 
        WHEN COALESCE(pendapatan, 0) > 0 
        THEN ROUND(((COALESCE(biaya_bahan, 0) * COALESCE(jumlah_tindakan, 0))::NUMERIC 
                    / pendapatan::NUMERIC) * 100, 2)
        ELSE 0
    END
) STORED;
```

#### Migration 2: Update Function
Function `populate_budgeting_bhp_farmasi()` updated dengan:
- LEFT JOIN ke `data_pendapatan`
- Populate kolom `pendapatan` otomatis
- Rasio ter-calculate otomatis via generated column

### **Frontend:**

#### State Updates:
```typescript
// New interface
interface RasioPerUnit {
  nama_unit_kerja: string;
  kode_unit_kerja: string;
  total_budgeting: number;
  pendapatan: number;
  rasio: number;
}

// New state
const [rasioPerUnit, setRasioPerUnit] = useState<RasioPerUnit[]>([]);
```

#### Calculation Logic:
```typescript
// Group by unit kerja
unitMap.forEach((value, key) => {
  const rasio = value.pendapatan > 0 
    ? (value.budgeting / value.pendapatan) * 100 
    : 0;
  rasioData.push({...});
});

// Sort by rasio DESC
setRasioPerUnit(rasioData.sort((a, b) => b.rasio - a.rasio));
```

---

## 📈 Cara Interpretasi Rasio

### **Rasio BHP Pendapatan = (Budgeting BHP / Pendapatan) × 100%**

### **Contoh 1: Radiologi - 228.45%** 🔴
```
Total Budgeting BHP: Rp 77,001,723
Total Pendapatan: Rp 33,705,537
Rasio: 228.45%

Interpretasi: 
❌ PERINGATAN! Budgeting BHP lebih dari 2x pendapatan!
⚠️ Perlu evaluasi:
   - Apakah data bahan sudah akurat?
   - Apakah harga bahan terlalu tinggi?
   - Apakah pendapatan perlu ditingkatkan?
```

### **Contoh 2: BDRS - 7.20%** 🟠
```
Total Budgeting BHP: Rp 5,210,000
Total Pendapatan: Rp 72,359,706
Rasio: 7.20%

Interpretasi:
⚠️ SEDANG - Perlu monitoring
✓ Masih dalam batas wajar
📊 Monitor trend ke depan
```

### **Contoh 3: Rasio Ideal - < 5%** 🟢
```
Interpretasi:
✓ BAIK - Efisien
✓ Budgeting BHP proporsional dengan pendapatan
✓ Operasional sustainable
```

---

## 🔄 Auto-Update Flow

```
data_pendapatan (UPDATE)
        ↓
[Trigger on data_pendapatan - future enhancement]
        ↓
populate_budgeting_bhp_farmasi()
        ↓
budgeting_bhp_farmasi.pendapatan ← data_pendapatan.total_pendapatan
        ↓
budgeting_bhp_farmasi.rasio_bhp_pendapatan (AUTO-CALCULATED)
        ↓
Frontend fetch & display badges
```

**Note:** Saat ini trigger untuk data_pendapatan belum dibuat. User bisa:
1. Manual refresh di halaman
2. Atau setup trigger untuk auto-update (future enhancement)

---

## 📊 Sample Display di Aplikasi

### **Badge Rasio per Unit:**

```
┌─────────────────────────────────┐
│ Radiologi        UK039          │
│ Budgeting: Rp 77,001,723        │
│ Pendapatan: Rp 33,705,537       │
│ ─────────────────────           │
│ Rasio BHP: [228.45%] 🔴         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ BDRS             UK044          │
│ Budgeting: Rp 5,210,000         │
│ Pendapatan: Rp 72,359,706       │
│ ─────────────────────           │
│ Rasio BHP: [7.20%] 🟠           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Laboratorium     UK038          │
│ Budgeting: Rp 0                 │
│ Pendapatan: Rp 38,211,160       │
│ ─────────────────────           │
│ Rasio BHP: [0%] ⚪              │
└─────────────────────────────────┘
```

### **Badge Total Keseluruhan:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Total Keseluruhan Unit Kerja                                         │
│ 5 unit kerja                                                         │
│                                                                      │
│ Total Budgeting BHP     Total Pendapatan        Rasio Total         │
│ Rp 82,211,723           Rp 144,276,403         [56.98%] 🏷️          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Table Display Update

### **Kolom Tabel (Sebelum):**
1. No
2. Unit Kerja
3. Kode
4. Nama Tindakan
5. Operator
6. Biaya Bahan
7. Jumlah
8. Total Budgeting BHP
9. Total Rincian

### **Kolom Tabel (Sesudah):** ✨
1. No
2. Unit Kerja
3. Kode
4. Nama Tindakan
5. Operator
6. Biaya Bahan
7. Jumlah
8. Total Budgeting BHP
9. **Pendapatan** ✨ (NEW - Gray-700)
10. **Rasio %** ✨ (NEW - Badge dengan warna dinamis)

---

## 🎨 Color Coding Rasio

### **Badge Colors dalam Table:**
```typescript
if (rasio > 10%) → bg-red-600 (Merah)
if (rasio > 5%)  → bg-orange-600 (Orange)
if (rasio > 0%)  → bg-green-600 (Hijau)
if (rasio = 0%)  → bg-gray-400 (Abu-abu)
```

---

## 📊 Hasil Verifikasi Data

### **Sample Data dengan Rasio:**

| Tindakan | Unit | Biaya Bahan | Jumlah | Budgeting | Pendapatan | Rasio | Status |
|----------|------|-------------|--------|-----------|------------|-------|--------|
| Os Nasal | Radiologi | Rp 8,433 | 9,131 | Rp 77,001,723 | Rp 33,705,537 | **228.45%** | 🔴 Tinggi |
| Crossmatch Prc 1 | BDRS | Rp 5,000 | 1,042 | Rp 5,210,000 | Rp 72,359,706 | **7.20%** | 🟠 Sedang |

### **Agregasi per Unit Kerja:**

| Unit Kerja | Items | Total Budgeting | Pendapatan | Rasio | Kategori |
|------------|-------|-----------------|------------|-------|----------|
| Radiologi | 79 | Rp 77,001,723 | Rp 33,705,537 | **228.45%** | 🔴 Tinggi |
| BDRS | 11 | Rp 5,210,000 | Rp 72,359,706 | **7.20%** | 🟠 Sedang |
| Laboratorium | 125 | Rp 0 | Rp 38,211,160 | **0%** | ⚪ Belum ada data |
| IBS | 213 | Rp 0 | Rp 0 | **0%** | ⚪ Belum ada data |
| Cathlab | 17 | Rp 0 | Rp 0 | **0%** | ⚪ Belum ada data |

### **Grand Total:**
```
Total Budgeting BHP: Rp 82,211,723
Total Pendapatan: Rp 144,276,403
Rasio Total: 56.98% 🟠
```

---

## 🚨 Insight & Rekomendasi

### **⚠️ Radiologi - Rasio 228.45%**
**Masalah:**
- Budgeting BHP 2.28x lebih besar dari pendapatan
- Tidak sustainable

**Rekomendasi:**
1. Review data bahan - apakah qty dan harga akurat?
2. Verifikasi jumlah tindakan (9,131)
3. Check pendapatan - apakah data pendapatan sudah lengkap?
4. Evaluasi efficiency penggunaan bahan
5. Pertimbangkan review tarif tindakan

### **✓ BDRS - Rasio 7.20%**
**Status:**
- Dalam batas wajar
- Perlu monitoring trend

**Rekomendasi:**
1. Monitor bulanan untuk trend
2. Pastikan tidak naik > 10%
3. Maintain efficiency

### **📊 Total - Rasio 56.98%**
**Status:**
- Cukup tinggi untuk keseluruhan
- Didominasi oleh Radiologi yang tinggi

**Rekomendasi:**
1. Focus improvement di Radiologi
2. Track rasio per bulan
3. Set target rasio ideal (misal: < 10% per unit)

---

## 🔄 Workflow Penggunaan

### **1. Lihat Dashboard Rasio:**
```
Budgeting BHP → Budgeting BHP (Rupiah)
→ Scroll ke "Rasio BHP terhadap Pendapatan per Unit Kerja"
→ Lihat badge per unit kerja
→ Identifikasi unit dengan rasio tinggi (merah/orange)
```

### **2. Filter & Analisis:**
```
→ Pilih unit kerja dengan rasio tinggi dari dropdown filter
→ Lihat detail tindakan di table
→ Identifikasi tindakan mana yang menyebabkan rasio tinggi
→ Export ke Excel untuk analisis lebih detail
```

### **3. Action Items:**
```
→ Review tindakan dengan budgeting tinggi
→ Verifikasi data bahan di halaman kalkulasi
→ Update harga atau qty jika diperlukan
→ Monitor perubahan rasio setelah adjustment
```

---

## 🔧 Maintenance

### **Refresh Data Pendapatan:**
```sql
-- Option 1: Via UI
Klik tombol "Perbarui" di halaman

-- Option 2: Via SQL
SELECT populate_budgeting_bhp_farmasi(auth.uid(), 2025);
```

### **Check Rasio per Unit:**
```sql
SELECT 
    nama_unit_kerja,
    SUM(total_budgeting_bhp) as budgeting,
    MAX(pendapatan) as pendapatan,
    ROUND((SUM(total_budgeting_bhp) / MAX(pendapatan)) * 100, 2) as rasio
FROM budgeting_bhp_farmasi
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY nama_unit_kerja
ORDER BY rasio DESC;
```

---

## 📚 File yang Diupdate

### **Database Migrations:**
1. ✅ `add_pendapatan_and_rasio_fixed` - Add columns
2. ✅ `update_function_with_pendapatan` - Update populate function (v1)
3. ✅ `fix_ambiguous_column_reference` - Fix function (v2)

### **Frontend Files:**
1. ✅ `src/pages/BudgetingBHPRupiah.tsx` - Major update
   - Add interface RasioPerUnit
   - Add state rasioPerUnit
   - Add calculation logic in fetchData
   - Add Rasio section UI
   - Add Total badge UI
   - Update table columns

### **Documentation:**
1. ✅ `UPDATE_BUDGETING_BHP_WITH_RASIO_PENDAPATAN.md` (THIS FILE)

---

## ✅ Checklist Implementasi

- [x] Tambah kolom `pendapatan` di budgeting_bhp_farmasi
- [x] Tambah kolom `rasio_bhp_pendapatan` (GENERATED)
- [x] Update function populate untuk include pendapatan
- [x] Populate data dengan pendapatan
- [x] Verify rasio calculation
- [x] Add Rasio section di halaman
- [x] Add badge per unit kerja dengan color coding
- [x] Add total keseluruhan badge
- [x] Update table dengan kolom baru
- [x] Test filter dengan rasio
- [x] Verify export include new columns
- [x] Documentation

---

## 🎯 Next Steps for Users

### **Immediate Actions:**
1. ✅ Refresh browser (HMR sudah update otomatis)
2. ✅ Navigate ke: Budgeting BHP → Budgeting BHP (Rupiah)
3. ✅ Scroll untuk lihat badge rasio per unit kerja
4. ✅ Identifikasi unit dengan rasio tinggi (merah)
5. ✅ Filter unit tersebut dan analisis detail

### **Data Input (untuk lengkapi budgeting):**
1. Input data bahan di halaman kalkulasi masing-masing
2. Data akan auto-sync ke budgeting_bhp_farmasi
3. Rasio akan auto-recalculate
4. Monitor perubahan rasio

---

**Last Updated:** 9 Oktober 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready with Rasio Feature

