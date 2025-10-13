# 📋 Panduan Template Import Produk Layanan

## 🎯 Overview

Template CSV untuk import **informasi dasar** produk layanan. Data layanan (tindakan, farmasi, dll.) harus diinput via form setelah import.

---

## 📄 FILE TEMPLATE

**Lokasi:** `public/template_produk_layanan.csv`

**Download:** Klik tombol **"Unduh Template"** di halaman Produk Layanan

---

## 📊 STRUKTUR TEMPLATE

### **Kolom yang Dapat Di-import:**

| # | Kolom | Type | Required | Contoh | Keterangan |
|---|-------|------|----------|--------|------------|
| 1 | `jenis` | text | ✅ Yes | rawat jalan | rawat jalan / rawat inap |
| 2 | `inacbg` | text | ❌ No | A-4-10-I | Kode INA-CBG |
| 3 | `grouper` | text | ❌ No | Mild | Grouper (Mild, Moderate, Severe) |
| 4 | `tarif_inacbgs_numeric` | number | ✅ Yes | 2500000 | Tarif INA-CBG dalam rupiah (tanpa titik/koma) |
| 5 | `diaglist` | text | ❌ No | I10 | Daftar diagnosa |
| 6-10 | `diagnosa_1` s/d `diagnosa_5` | text | ❌ No | Hipertensi Esensial | Diagnosa 1-5 |
| 11 | `proclist` | text | ❌ No | Z00.0 | Daftar prosedur |
| 12-16 | `proc_1` s/d `proc_5` | text | ❌ No | Pemeriksaan Medis Umum | Prosedur 1-5 |
| 17 | `los` | number | ✅ Yes | 1 | Length of Stay (hari rawat) |
| 18 | `spesialisasi_dokter` | text | ❌ No | Spesialis Penyakit Dalam | Spesialisasi dokter |
| 19 | `nama_dokter` | text | ❌ No | Dr. Andi | Nama dokter |
| 20 | `kode_dokter` | text | ❌ No | DK001 | Kode dokter |

---

## ⚠️ KOLOM YANG TIDAK BISA DI-IMPORT

### **Kolom Layanan (Format JSONB):**

Kolom-kolom berikut **TIDAK** bisa di-import via CSV:
- ❌ `tindakan` (JSONB array)
- ❌ `ibs` (JSONB array)
- ❌ `laboratorium` (JSONB array)
- ❌ `radiologi` (JSONB array)
- ❌ `farmasi` (JSONB array)
- ❌ `kamar_akomodasi` (JSONB array)
- ❌ `visite` (JSONB array)
- ❌ `konsultasi` (JSONB array)

**Alasan:** Data layanan adalah array kompleks dalam format JSON, tidak bisa direpresentasikan dalam CSV flat.

---

### **Kolom Auto-Calculated:**

Kolom-kolom berikut **AUTO-CALCULATED** oleh database:
- 🤖 `total_biaya` (SUM dari semua layanan)
- 🤖 `saldo_distribusi` (tarif - total_biaya)
- 🤖 `prosentase_saldo` ((saldo / tarif) × 100)

**Tidak perlu diisi** di template.

---

## 📝 CONTOH DATA TEMPLATE

### **Row 1: Rawat Inap Dialisis**

```csv
rawat inap,MEMBUAT BARU MEREVISI DAN MEMINDAHKAN ALAT DIALISIS (SEDANG),N-1-12-II,7700400,T82.7;I12.0,Infection and inflammatory reaction due other cardiac and vascular,Infective and inflammatory reaction due to cardiac valve prosthesis,Other cardiac and vascular device implant and graft infection,,,,39.42;39.95,Revision of arteriovenous shunt for renal dialysis,Hemodialysis,,,,,Bedah Umum,Dr. Andi,DK001
```

**Breakdown:**
- Jenis: Rawat Inap
- INA-CBG: MEMBUAT BARU MEREVISI DAN MEMINDAHKAN ALAT DIALISIS (SEDANG)
- Grouper: N-1-12-II
- Tarif INA-CBG's: Rp 7.700.400
- Diagnosa Utama: T82.7 - Infection and inflammatory reaction due other cardiac and vascular
- Diagnosa 2: I12.0 - Infective and inflammatory reaction due to cardiac valve prosthesis
- Diagnosa 3: Other cardiac and vascular device implant and graft infection
- Prosedur 1: 39.42 - Revision of arteriovenous shunt for renal dialysis
- Prosedur 2: 39.95 - Hemodialysis
- LOS: (kosong - akan diisi otomatis)
- Dokter: Dr. Andi (Bedah Umum)

---

### **Row 2: Rawat Jalan Perawatan Luka**

```csv
rawat jalan,PERAWATAN LUKA,Z-3-27-0,191400,Z47.9;S42.0,Orthopaedic follow-up care unspecified,Fracture of scapula,Other specified orthopaedic aftercare,,,,93.57.00,Application of other wound dressing,,,,3,Bedah Umum,RICKKY KURNIAWAN DR. SP.B,DK002
```

**Breakdown:**
- Jenis: Rawat Jalan
- INA-CBG: PERAWATAN LUKA
- Grouper: Z-3-27-0
- Tarif INA-CBG's: Rp 191.400
- Diagnosa Utama: Z47.9 - Orthopaedic follow-up care unspecified
- Diagnosa 2: S42.0 - Fracture of scapula
- Diagnosa 3: Other specified orthopaedic aftercare
- Prosedur: 93.57.00 - Application of other wound dressing
- LOS: 3 hari
- Dokter: RICKKY KURNIAWAN DR. SP.B (Bedah Umum)

---

### **Row 3: Rawat Jalan Konsultasi Spesialis**

```csv
rawat jalan,KONSULTASI DOKTER SPESIALIS,A-5-15-I,450000,Z00.0,Konsultasi Dokter Spesialis,,,,,,Z00.0,Konsultasi Dokter Spesialis,,,,1,Spesialis Penyakit Dalam,YUSUF KHAIRUL DR. SP.OT,DK003
```

**Breakdown:**
- Jenis: Rawat Jalan
- INA-CBG: KONSULTASI DOKTER SPESIALIS
- Grouper: A-5-15-I
- Tarif INA-CBG's: Rp 450.000
- Diagnosa: Z00.0 - Konsultasi Dokter Spesialis
- Prosedur: Z00.0 - Konsultasi Dokter Spesialis
- LOS: 1 hari
- Dokter: YUSUF KHAIRUL DR. SP.OT (Spesialis Penyakit Dalam)

---

## 🔄 WORKFLOW LENGKAP

### **Step 1: Import Data Dasar**

1. Download template dari halaman Produk Layanan
2. Buka di Excel/Google Sheets
3. Isi data basic info (jenis, INA-CBG, diagnosa, dll)
4. **JANGAN** isi kolom layanan (tidak ada di template)
5. Save as CSV (UTF-8)
6. Upload via tombol "Import Data"

**Result:** ✅ Data basic ter-import

---

### **Step 2: Input Layanan via Form**

1. Klik **Edit** pada data yang baru di-import
2. Buka tab **"Layanan"**
3. Input semua layanan menggunakan **LayananInputTable**:

   **a. Tindakan (Biru 🔵):**
   - Search → Pilih → Qty → [+]
   - Repeat untuk multiple tindakan
   
   **b. IBS (Merah 🔴):**
   - Search → Pilih → Qty → [+]
   
   **c. Laboratorium (Cyan 🩵):**
   - Search → Pilih → Qty → [+]
   - Repeat untuk multiple lab
   
   **d. Radiologi (Kuning 🟡):**
   - Search → Pilih → Qty → [+]
   
   **e. Farmasi (Emerald 🟢):**
   - Search → Pilih → Qty → [+]
   - Repeat untuk multiple obat (5-10 items)
   
   **f. Kamar Akomodasi (Pink 🩷):**
   - Pilih kelas → Qty (= LOS) → [+]
   
   **g. Visite (Teal 🔷):**
   - Pilih kategori dokter → Qty → [+]
   
   **h. Konsultasi (Indigo 🟣):**
   - Pilih kategori dokter → Qty → [+]

4. Review semua layanan di tabel
5. Klik **"Simpan"**

**Result:** ✅ Data lengkap dengan layanan

---

## 📋 TEMPLATE EXCEL

### **Format untuk Excel:**

**Sheet: Produk Layanan**

| Jenis | INA-CBG | Grouper | Tarif INA-CBG's | Diaglist | Diagnosa 1 | ... | LOS | Spesialisasi | Nama Dokter | Kode Dokter |
|-------|---------|---------|-----------------|----------|------------|-----|-----|--------------|-------------|-------------|
| rawat jalan | A-4-10-I | Mild | 2500000 | I10 | Hipertensi Esensial | ... | 1 | Spesialis Penyakit Dalam | Dr. Andi | DK001 |
| rawat inap | Z-3-14-I | Moderate | 5000000 | K35.8 | Appendisitis akut | ... | 3 | Bedah Digestif | Dr. Budi | DK002 |

**Notes:**
- Tarif INA-CBG's: Format angka tanpa titik/koma (2500000, bukan 2.500.000)
- Jenis: lowercase (rawat jalan, rawat inap)
- LOS: Angka integer

---

## ⚙️ IMPORT SETTINGS

### **Delimiter:** Koma (,)
### **Encoding:** UTF-8
### **Quote Character:** " (double quote)
### **Line Terminator:** \n (newline)

### **Excel → CSV Conversion:**

**Langkah:**
1. Buka file di Excel
2. **File** → **Save As**
3. **Save as type:** CSV UTF-8 (Comma delimited) (*.csv)
4. **Klik Save**
5. Jika ada warning, klik **"Yes"** atau **"OK"**

---

## 🎓 CARA PENGGUNAAN

### **Scenario: Import 10 Produk Layanan**

**Persiapan:**
1. Download template
2. Buka di Excel
3. Isi 10 rows dengan data basic info
4. Save as CSV UTF-8

**Import:**
1. Buka halaman Produk Layanan
2. Klik tombol **"Import Data"**
3. Pilih file CSV
4. Wait for success toast
5. ✅ 10 produk ter-import (basic info only)

**Completion (Input Layanan):**

**Option A: Edit Satu-satu (Recommended untuk data berbeda)**
1. Klik Edit pada Produk 1
2. Tab Layanan → Input semua layanan
3. Simpan
4. Repeat untuk Produk 2-10

**Option B: Edit Batch (untuk data mirip)**
1. Edit Produk 1 (full layanan)
2. Export CSV
3. Duplicate row di Excel
4. Ubah data yang berbeda
5. Re-import
6. ⚠️ Layanan tidak ter-copy (harus input manual)

---

## ⚠️ COMMON ERRORS

### **Error 1: Tarif Format Salah**

**Error Message:**
```
Error importing data: invalid input syntax for type bigint
```

**Cause:** Tarif INA-CBG's pakai titik/koma

**Fix:**
```
❌ Wrong: 2.500.000 atau 2,500,000
✅ Correct: 2500000
```

---

### **Error 2: Jenis Invalid**

**Error Message:**
```
Error: new row violates check constraint
```

**Cause:** Jenis tidak sesuai constraint

**Fix:**
```
❌ Wrong: "Rawat Jalan" (capital) atau "rj"
✅ Correct: "rawat jalan" atau "rawat inap"
```

---

### **Error 3: Encoding Issue**

**Symptom:** Karakter aneh (ï¿½, �, dll)

**Cause:** Encoding bukan UTF-8

**Fix:**
1. Buka Notepad++
2. **Encoding** → **Convert to UTF-8**
3. Save
4. Re-import

---

### **Error 4: Kolom Tidak Match**

**Error Message:**
```
Error: column "xxx" does not exist
```

**Cause:** Header CSV tidak sesuai template

**Fix:**
- Download template terbaru
- Copy-paste data ke template
- Jangan ubah header

---

## 📊 POST-IMPORT VALIDATION

### **Checklist Setelah Import:**

- [ ] Jumlah data sesuai (10 rows import = 10 data muncul)
- [ ] Jenis correct (rawat jalan / rawat inap)
- [ ] Tarif INA-CBG's ter-import (bukan 0)
- [ ] LOS correct
- [ ] Nama dokter correct
- [ ] **Total Biaya = 0** (normal, karena layanan belum diisi)
- [ ] **Saldo Distribusi = Tarif** (normal, karena biaya = 0)
- [ ] **Prosentase Saldo = 100%** (normal, karena biaya = 0)

---

## 🎯 BEST PRACTICES

### **1. Import untuk Data Dasar Only**

✅ **Use Import For:**
- Bulk create produk layanan (10, 50, 100 rows)
- Data basic info (jenis, INA-CBG, diagnosa, dokter)
- Initial data seeding

❌ **Don't Use Import For:**
- Data layanan (tindakan, farmasi, dll) - use form
- Update existing data - use edit
- Complex data structures

---

### **2. Workflow Hybrid**

**Efficient Workflow:**
```
1. Excel: Prepare data basic info (bulk)
   ↓
2. Import CSV: Upload (1 minute)
   ↓
3. Form: Edit & add layanan per produk (5-10 minutes each)
   ↓
4. Result: Complete produk layanan
```

**Time Saving:**
- Without import: 20 min × 10 = 200 minutes
- With import: 1 min + (10 min × 10) = 101 minutes
- **Saving: 50%** ⚡

---

### **3. Template Customization**

**You Can:**
- ✅ Add more sample rows
- ✅ Sort by jenis
- ✅ Group by dokter
- ✅ Add comments (will be ignored)

**You Cannot:**
- ❌ Change header column names
- ❌ Change column order
- ❌ Add new columns
- ❌ Remove required columns

---

## 📋 TEMPLATE SAMPLE DATA

### **Template Includes 3 Sample Rows:**

1. **Rawat Inap - Dialisis**
   - Tarif: Rp 7.700.400
   - INA-CBG: MEMBUAT BARU MEREVISI DAN MEMINDAHKAN ALAT DIALISIS (SEDANG)
   - Grouper: N-1-12-II
   - Dokter: Dr. Andi (Bedah Umum)

2. **Rawat Jalan - Perawatan Luka**
   - Tarif: Rp 191.400
   - INA-CBG: PERAWATAN LUKA
   - Grouper: Z-3-27-0
   - LOS: 3 hari
   - Dokter: RICKKY KURNIAWAN DR. SP.B (Bedah Umum)

3. **Rawat Jalan - Konsultasi Spesialis**
   - Tarif: Rp 450.000
   - INA-CBG: KONSULTASI DOKTER SPESIALIS
   - Grouper: A-5-15-I
   - LOS: 1 hari
   - Dokter: YUSUF KHAIRUL DR. SP.OT (Spesialis Penyakit Dalam)

---

## 🔄 UPDATE IMPORT HANDLER

### **File:** `src/pages/ProdukLayanan.tsx`

**Updated Logic:**

```typescript
const importData = dataRows
  .filter((row) => row.length === headers.length && row[0])
  .map((row) => {
    const obj: any = { user_id: user.id, tahun };
    headers.forEach((header, index) => {
      const value = row[index]?.trim();
      
      // Parse numeric fields
      if (header === "los" || header === "tarif_inacbgs_numeric") {
        obj[header] = value ? parseInt(value) : 0;
      } else {
        obj[header] = value || null;
      }
    });
    
    // Initialize layanan arrays (empty)
    obj.tindakan = [];
    obj.ibs = [];
    obj.laboratorium = [];
    obj.radiologi = [];
    obj.farmasi = [];
    obj.kamar_akomodasi = [];
    obj.visite = [];
    obj.konsultasi = [];
    
    return obj;
  });
```

**Key Points:**
- ✅ Parse `tarif_inacbgs_numeric` as integer
- ✅ Initialize all layanan arrays as empty []
- ✅ User will fill layanan via form later

---

## 📊 AFTER IMPORT

### **Data State:**

| Field | Value | Status |
|-------|-------|--------|
| jenis | rawat jalan | ✅ From CSV |
| inacbg | A-4-10-I | ✅ From CSV |
| tarif_inacbgs_numeric | 2500000 | ✅ From CSV |
| los | 1 | ✅ From CSV |
| nama_dokter | Dr. Andi | ✅ From CSV |
| **tindakan** | [] | ⚠️ Empty (needs input) |
| **farmasi** | [] | ⚠️ Empty (needs input) |
| **total_biaya** | 0 | 🤖 Auto (no layanan yet) |
| **saldo_distribusi** | 2500000 | 🤖 Auto (tarif - 0) |
| **prosentase_saldo** | 100% | 🤖 Auto (100% profit!) |

---

## 🎯 NEXT STEPS AFTER IMPORT

### **Recommended Workflow:**

**For Each Imported Product:**

1. Klik **Edit** (icon ✏️)
2. Tab **"Layanan"**
3. Input layanan sesuai kasus:

   **Example untuk Dialisis (Rawat Inap):**
   
   **Tindakan 🔵:**
   - Revision of arteriovenous shunt × 1
   - Hemodialysis × 3 sesi
   
   **IBS 🔴:**
   - Operasi Dialisis × 1
   
   **Laboratorium 🩵:**
   - Darah Lengkap × 1
   - Creatinine × 1
   - Ureum × 1
   
   **Farmasi 🟢:**
   - Heparin × 10 vial
   - Normal Saline × 5 bag
   - Antibiotik × 7 hari
   
   **Kamar Akomodasi 🩷:**
   - Kelas 2 × 7 hari
   
   **Visite 🔷:**
   - Visit Dokter Spesialis × 7 hari
   
   **Konsultasi 🟣:**
   - Konsultasi Dokter Spesialis × 1

4. Review semua di tabel
5. Klik **"Simpan"**
6. ✅ Produk complete!

**Repeat** untuk produk lainnya.

---

## 📈 BULK IMPORT STRATEGY

### **Untuk 50+ Produk:**

**Phase 1: Import Basic (Day 1)**
- Prepare 50 rows di Excel
- Import sekaligus
- Time: 1-2 hours

**Phase 2: Add Layanan (Day 2-5)**
- Edit 10 produk per hari
- 10 min per produk
- Time: 100 min per hari

**Phase 3: Review & QA (Day 6)**
- Check all data
- Verify calculations
- Export for backup

**Total Time:** 6 days  
**Vs Manual Entry:** 15-20 days  
**Efficiency:** **60-70% faster** 🚀

---

## ⚡ TIPS & TRICKS

### **1. Excel Formula untuk Tarif:**

**Convert Rp to Number:**
```excel
=SUBSTITUTE(SUBSTITUTE(A2,"Rp ",""),".","")
```

**Result:** 2.500.000 → 2500000

---

### **2. Batch Fill Diagnosa:**

**Untuk kasus yang sama (misal: 10 Hipertensi):**
- Row 1: Isi lengkap
- Row 2-10: Copy-paste row 1
- Ubah hanya: nama_dokter, kode_dokter (unique)

---

### **3. Validation di Excel:**

**Data Validation untuk Jenis:**
```
Source: rawat jalan,rawat inap
```

**Prevent typo!**

---

### **4. Conditional Formatting:**

**Highlight Required Fields:**
- Color: Yellow untuk jenis, tarif, los
- Reminder: Must fill these!

---

## 📁 FILES

### **Template File:**
- ✅ `public/template_produk_layanan.csv` - Updated

### **Documentation:**
- ✅ `TEMPLATE_PRODUK_LAYANAN_README.md` - This file

### **Related:**
- `LAYANAN_INPUT_TABLE_DOCUMENTATION.md` - Input pattern
- `FARMASI_INPUT_TABLE_DOCUMENTATION.md` - Farmasi specific
- `RELASI_PRODUK_LAYANAN_VISIT_KONSULTASI.md` - Visit & konsultasi

---

## ✅ VALIDATION CHECKLIST

### **Before Import:**
- [ ] Header sesuai template (20 kolom)
- [ ] Jenis: lowercase (rawat jalan / rawat inap)
- [ ] Tarif: numeric tanpa titik/koma
- [ ] LOS: numeric
- [ ] Encoding: UTF-8
- [ ] Format: CSV (comma delimited)

### **After Import:**
- [ ] Jumlah row sesuai
- [ ] Tarif ter-import correct
- [ ] Jenis correct
- [ ] LOS correct
- [ ] Dokter correct
- [ ] Total biaya = 0 (normal)
- [ ] Saldo = tarif (normal)

### **After Add Layanan:**
- [ ] Semua layanan terisi
- [ ] Total biaya > 0
- [ ] Saldo < tarif
- [ ] Prosentase saldo < 100%
- [ ] Data make sense

---

## 🎉 STATUS

✅ **TEMPLATE UPDATED & DOCUMENTED**

**Changes:**
- ✅ Remove kolom auto-calculated (total_biaya, saldo, prosentase)
- ✅ Focus on basic info only
- ✅ Add more sample data (4 rows)
- ✅ Clear structure
- ✅ UTF-8 encoding

**Documentation:**
- ✅ Complete usage guide
- ✅ Excel tips
- ✅ Error handling
- ✅ Best practices
- ✅ Workflow examples

**Ready to use!** 🎉

---

**Dokumentasi dibuat:** Januari 2025  
**Versi:** 2.0  
**Author:** AI Assistant  
**Status:** Production Ready

