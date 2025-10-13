# Dokumentasi Relasi Produk Layanan dengan Skenario Tarif Visit & Konsultasi

## Tanggal: Januari 2025

---

## 🎯 OVERVIEW

Kolom **Visit** dan **Konsultasi** di tabel `produk_layanan` mengacu (relasi) ke tabel `skenario_tarif_visit`. User hanya perlu:
1. ✅ **Pilih kategori dokter** dari dropdown
2. ✅ **Input kuantitas**
3. ✅ **Tarif otomatis** dari `skenario_tarif_visit`

---

## 🗄️ RELASI DATABASE

### Tabel Sumber: `skenario_tarif_visit`

**Kolom Tarif:**
```sql
visit_dokter_umum                    bigint  -- Tarif visit dokter umum
visit_dokter_spesialis               bigint  -- Tarif visit dokter spesialis
visit_dokter_subspesialis            bigint  -- Tarif visit dokter subspesialis
konsultasi_dokter_spesialis          bigint  -- Tarif konsultasi spesialis
konsultasi_dokter_subspesialis       bigint  -- Tarif konsultasi subspesialis
```

**Key Fields:**
- `user_id` - Foreign key ke auth.users
- `tahun` - Tahun periode
- UNIQUE constraint: `(user_id, tahun)`

---

### Tabel Target: `produk_layanan`

**Kolom Layanan:**
```sql
visite       jsonb  -- Array visit dengan qty dan subtotal
konsultasi   jsonb  -- Array konsultasi dengan qty dan subtotal
```

**Format Data:**
```json
{
  "visite": [
    {
      "kode_tindakan": "VISIT.SPESIALIS",
      "nama_tindakan": "Visit Dokter Spesialis",
      "jasa_sarana": 150000,
      "biaya_bahan": 0,
      "qty": 3,
      "subtotal": 450000,
      "tipe_dokter": "spesialis"
    }
  ],
  "konsultasi": [
    {
      "kode_tindakan": "KONSUL.SPESIALIS",
      "nama_tindakan": "Konsultasi Dokter Spesialis",
      "jasa_sarana": 250000,
      "biaya_bahan": 0,
      "qty": 2,
      "subtotal": 500000,
      "tipe_dokter": "spesialis"
    }
  ]
}
```

---

## 🔄 DATA FLOW

### Flow Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin Setup Tarif                                        │
│    ↓                                                         │
│    skenario_tarif_visit                                     │
│    - visit_dokter_umum: 100000                              │
│    - visit_dokter_spesialis: 150000                         │
│    - visit_dokter_subspesialis: 200000                      │
│    - konsultasi_dokter_spesialis: 250000                    │
│    - konsultasi_dokter_subspesialis: 300000                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ServiceSelector Fetch Data                               │
│    ↓                                                         │
│    Query: SELECT * FROM skenario_tarif_visit                │
│           WHERE user_id = ? AND tahun = ?                   │
│    ↓                                                         │
│    Transform ke Array:                                      │
│    [                                                        │
│      { kode: "VISIT.UMUM", nama: "Visit Dokter Umum",      │
│        jasa_sarana: 100000, tipe_dokter: "umum" },         │
│      { kode: "VISIT.SPESIALIS", nama: "Visit Dok Sp",      │
│        jasa_sarana: 150000, tipe_dokter: "spesialis" },    │
│      ...                                                    │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User Interaction (Produk Layanan)                        │
│    ↓                                                         │
│    Form Input:                                              │
│    - Pilih: "Visit Dokter Spesialis" 🟢                     │
│    - Qty: 3                                                 │
│    ↓                                                         │
│    Auto-Calculate:                                          │
│    - Jasa Sarana: Rp 150.000 (dari skenario_tarif_visit)  │
│    - Subtotal: 150.000 × 3 = Rp 450.000                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Save to produk_layanan                                   │
│    ↓                                                         │
│    visite: [                                                │
│      {                                                      │
│        kode_tindakan: "VISIT.SPESIALIS",                   │
│        nama_tindakan: "Visit Dokter Spesialis",            │
│        jasa_sarana: 150000,                                │
│        qty: 3,                                              │
│        subtotal: 450000                                     │
│      }                                                      │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Total Biaya Auto-Calculate (Trigger)                    │
│    ↓                                                         │
│    total_biaya = SUM(all layanan.subtotal)                 │
│    Including: visite[].subtotal + konsultasi[].subtotal    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 UI IMPLEMENTATION

### A. Dropdown Visite (3 Pilihan)

**File:** `ServiceSelector.tsx` (filterType="visite")

**Implementasi:**
```typescript
// Fetch dari skenario_tarif_visit
const { data: tarif } = await supabase
  .from("skenario_tarif_visit")
  .select("*")
  .eq("user_id", user.id)
  .eq("tahun", tahun)
  .maybeSingle();

// Transform ke array pilihan
const visitOptions = [
  {
    id: "visit_umum",
    kode_tindakan: "VISIT.UMUM",
    nama_tindakan: "Visit Dokter Umum",
    jasa_sarana: tarif.visit_dokter_umum || 0,
    biaya_bahan: 0,
    tipe_dokter: "umum"
  },
  {
    id: "visit_spesialis",
    kode_tindakan: "VISIT.SPESIALIS",
    nama_tindakan: "Visit Dokter Spesialis",
    jasa_sarana: tarif.visit_dokter_spesialis || 0,
    biaya_bahan: 0,
    tipe_dokter: "spesialis"
  },
  {
    id: "visit_subspesialis",
    kode_tindakan: "VISIT.SUBSPESIALIS",
    nama_tindakan: "Visit Dokter Subspesialis",
    jasa_sarana: tarif.visit_dokter_subspesialis || 0,
    biaya_bahan: 0,
    tipe_dokter: "subspesialis"
  }
];
```

---

### B. Dropdown Konsultasi (2 Pilihan)

**Implementasi:**
```typescript
// Transform ke array pilihan
const konsultasiOptions = [
  {
    id: "konsultasi_spesialis",
    kode_tindakan: "KONSUL.SPESIALIS",
    nama_tindakan: "Konsultasi Dokter Spesialis",
    jasa_sarana: tarif.konsultasi_dokter_spesialis || 0,
    biaya_bahan: 0,
    tipe_dokter: "spesialis"
  },
  {
    id: "konsultasi_subspesialis",
    kode_tindakan: "KONSUL.SUBSPESIALIS",
    nama_tindakan: "Konsultasi Dokter Subspesialis",
    jasa_sarana: tarif.konsultasi_dokter_subspesialis || 0,
    biaya_bahan: 0,
    tipe_dokter: "subspesialis"
  }
];
```

---

## 🎯 USER EXPERIENCE

### Workflow: Menambah Visite di Produk Layanan

**Step 1:** Buka Produk Layanan → Tambah Data → Tab Layanan

**Step 2:** Klik **"Tambah Visite"**

**Dialog Muncul:**
```
┌──────────────────────────────────────────────────────┐
│ Pilih Visite                                  [X]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Cari Tindakan                                        │
│ ┌──────────────────────────────────────────────────┐│
│ │ 🔍 [ketik untuk cari...]                         ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ Pilih Layanan                                        │
│ ┌──────────────────────────────────────────────────┐│
│ │ ▼ VISIT.UMUM - Visit Dokter Umum (Rp 100.000)   ││
│ │     [Dokter Umum] 🟣                             ││
│ │                                                  ││
│ │   VISIT.SPESIALIS - Visit Dokter Spesialis      ││
│ │     (Rp 150.000) [Dokter Spesialis] 🟢          ││
│ │                                                  ││
│ │   VISIT.SUBSPESIALIS - Visit Dokter Subsp.      ││
│ │     (Rp 200.000) [Dokter Subspesialis] 🟠       ││
│ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Step 3:** User **pilih** → "Visit Dokter Spesialis" 🟢

**Step 4:** Input **Quantity:**
```
┌──────────────────────────────────────────────────────┐
│ Quantity                                             │
│ ┌──────────────────────────────────────────────────┐│
│ │ 3                                                ││ ← USER INPUT INI SAJA
│ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Step 5:** Preview **Auto-Calculate:**
```
┌──────────────────────────────────────────────────────┐
│ Jasa Sarana: Rp 150.000    ← Otomatis dari tabel    │
│ Biaya Bahan: Rp 0                                    │
│ Quantity: 3                ← User input              │
│ ─────────────────────────                            │
│ Subtotal: Rp 450.000       ← Auto-calculate          │
└──────────────────────────────────────────────────────┘
```

**Step 6:** Klik **"Tambah"**

**Step 7:** Data tersimpan:
```json
{
  "visite": [
    {
      "kode_tindakan": "VISIT.SPESIALIS",
      "nama_tindakan": "Visit Dokter Spesialis",
      "jasa_sarana": 150000,
      "biaya_bahan": 0,
      "qty": 3,
      "subtotal": 450000,
      "tipe_dokter": "spesialis"
    }
  ]
}
```

---

## 🔗 RELASI & DEPENDENCY

### Dependency Chain:

```
skenario_tarif_visit (Master Data)
         ↓
  [Admin Setup Tarif]
         ↓
    Tersimpan di DB
         ↓
ServiceSelector Fetch
         ↓
 Transform ke Options
         ↓
  User Pilih + Qty
         ↓
  Auto-Calculate
         ↓
  Save ke produk_layanan
```

### Important Notes:

⚠️ **Prerequisite:**
- Admin **HARUS** setup tarif di "Skenario Tarif Visit & Konsultasi" terlebih dahulu
- Jika belum setup, dropdown akan kosong

✅ **Auto-Sync:**
- Jika admin update tarif, produk layanan baru akan gunakan tarif terbaru
- Produk layanan lama tetap pakai tarif saat dibuat (snapshot)

---

## 📊 DATA COMPARISON

### Sebelum (Manual Input):

❌ User harus tahu tarif visit
❌ Harus input manual jasa sarana
❌ Risiko salah input
❌ Tidak konsisten antar user

**Form Input:**
```
Pilih Layanan: [Dropdown dari skenario_tarif]
Jasa Sarana: [Input manual] ← Error prone!
Biaya Bahan: [Input manual]
Qty: [Input]
```

---

### Sesudah (Relasi Otomatis):

✅ Tarif otomatis dari master
✅ User hanya pilih kategori
✅ Konsisten untuk semua user
✅ Update mudah (hanya di 1 tempat)

**Form Input:**
```
Pilih Layanan: [Dropdown 3-5 pilihan] ← Dari skenario_tarif_visit
Qty: [Input] ← USER HANYA ISI INI!
─────────────────────
Tarif: Rp 150.000 ← Otomatis
Subtotal: Rp 450.000 ← Auto-calculate
```

---

## 🎨 UI/UX DETAILS

### A. Dropdown Display

**Format:**
```
[KODE] - [Nama Lengkap] (Tarif: Rp [Value]) [Badge Warna]
```

**Example Visite:**
```
┌────────────────────────────────────────────────────────────┐
│ VISIT.UMUM - Visit Dokter Umum (Tarif: Rp 100.000)        │
│   [Dokter Umum] 🟣                                         │
├────────────────────────────────────────────────────────────┤
│ VISIT.SPESIALIS - Visit Dokter Spesialis (Rp 150.000)     │
│   [Dokter Spesialis] 🟢                                    │
├────────────────────────────────────────────────────────────┤
│ VISIT.SUBSPESIALIS - Visit Dokter Subspesialis (Rp 200k)  │
│   [Dokter Subspesialis] 🟠                                 │
└────────────────────────────────────────────────────────────┘
```

**Example Konsultasi:**
```
┌────────────────────────────────────────────────────────────┐
│ KONSUL.SPESIALIS - Konsultasi Dokter Spesialis            │
│   (Tarif: Rp 250.000) [Dokter Spesialis] 🟢               │
├────────────────────────────────────────────────────────────┤
│ KONSUL.SUBSPESIALIS - Konsultasi Dokter Subspesialis      │
│   (Tarif: Rp 300.000) [Dokter Subspesialis] 🟠            │
└────────────────────────────────────────────────────────────┘
```

---

### B. Badge di Dropdown

**Badge Kecil (Inline):**

🟣 **Dokter Umum:**
```tsx
<Badge className="bg-purple-500 text-white border border-purple-600 flex items-center gap-1">
  <User className="h-4 w-4" />
  Dokter Umum
</Badge>
```

🟢 **Dokter Spesialis:**
```tsx
<Badge className="bg-green-500 text-white border border-green-600 flex items-center gap-1">
  <Stethoscope className="h-4 w-4" />
  Dokter Spesialis
</Badge>
```

🟠 **Dokter Subspesialis:**
```tsx
<Badge className="bg-orange-500 text-white border border-orange-600 flex items-center gap-1">
  <UserCog className="h-4 w-4" />
  Dokter Subspesialis
</Badge>
```

---

### C. Preview Before Add

**Display:**
```
┌──────────────────────────────────────┐
│ Jasa Sarana: Rp 150.000  ← Otomatis │
│ Biaya Bahan: Rp 0        ← Always 0 │
│ Quantity: 3              ← User inp │
│ ──────────────────────────           │
│ Subtotal: Rp 450.000     ← Calc    │
└──────────────────────────────────────┘
```

**Fields:**
- ✅ Jasa Sarana: Read-only, dari `skenario_tarif_visit`
- ✅ Biaya Bahan: Always 0 (visit/konsultasi tidak ada BHP)
- ✅ Quantity: User input (editable)
- ✅ Subtotal: Auto-calculate (`jasa_sarana × qty`)

---

## 💡 CONTOH KASUS LENGKAP

### Scenario: Produk Layanan Rawat Inap dengan Visit

**Context:**
- Pasien rawat inap 3 hari
- Perlu visit dokter spesialis setiap hari
- Admin sudah setup: Visit Dokter Spesialis = Rp 150.000

---

**Step-by-Step:**

**1. Setup Tarif (Dilakukan Admin 1x):**
- Buka: Skenario Tarif → Visit & Konsultasi
- Klik card "Visit Dokter Spesialis 🟢"
- Input: 150000
- Klik "Simpan"
- ✅ Tarif tersimpan

---

**2. Input Produk Layanan (Dilakukan Staff):**
- Buka: Produk Layanan → Tambah Data
- Jenis: Rawat Inap
- LOS: 3 hari
- Tab Layanan → Klik "Tambah Visite"

---

**3. Dialog Tambah Visite:**

**Pilih Layanan:**
```
Dropdown options (auto dari skenario_tarif_visit):
┌─────────────────────────────────────────────────────┐
│ ▼ VISIT.SPESIALIS - Visit Dokter Spesialis         │
│     (Tarif: Rp 150.000) [Dokter Spesialis] 🟢      │ ← User pilih ini
└─────────────────────────────────────────────────────┘
```

**Input Quantity:**
```
Quantity
┌─────────┐
│    3    │ ← User isi sesuai LOS (3 hari)
└─────────┘
```

**Preview Auto-Calculate:**
```
Jasa Sarana: Rp 150.000   ← Otomatis dari tabel
Biaya Bahan: Rp 0
Quantity: 3
─────────────────────
Subtotal: Rp 450.000      ← 150.000 × 3
```

**Klik "Tambah"** ✅

---

**4. Hasil di Tabel Layanan:**

| Kode | Nama | Jasa Sarana | Biaya Bahan | Qty | Subtotal | Aksi |
|------|------|-------------|-------------|-----|----------|------|
| VISIT.SPESIALIS | Visit Dokter Spesialis | Rp 150.000 | Rp 0 | 3 | Rp 450.000 | 🗑️ |

---

**5. Total Biaya (Auto):**
```
Total Biaya = ... + Visite (Rp 450.000) + ...
```

---

## 🔍 VALIDATION & ERROR HANDLING

### Scenario 1: Tarif Belum Di-setup

**Problem:**
User buka "Tambah Visite", tapi admin belum setup tarif

**Behavior:**
```
┌──────────────────────────────────────────────────┐
│ Tidak ada layanan tersedia untuk tahun 2025     │
│                                                  │
│ ⚠️ Silakan setup tarif di:                      │
│    Skenario Tarif → Visit & Konsultasi          │
└──────────────────────────────────────────────────┘
```

**Solution:**
- Admin setup tarif dulu
- Refresh halaman Produk Layanan
- Dropdown akan muncul

---

### Scenario 2: Tarif = 0

**Problem:**
Admin input tarif = 0 atau 0 by default

**Behavior:**
```
Dropdown:
VISIT.UMUM - Visit Dokter Umum (Tarif: Rp 0) [Dokter Umum 🟣]
```

**Calculation:**
```
Jasa Sarana: Rp 0
Qty: 3
Subtotal: Rp 0
```

**Valid:** Ya (bisa saja gratis)

---

### Scenario 3: Update Tarif di Tengah Jalan

**Timeline:**
1. **Hari 1:** Admin setup Visit Spesialis = Rp 150.000
2. **Hari 2:** Staff buat Produk A dengan Visit Spesialis (Rp 150.000)
3. **Hari 3:** Admin update Visit Spesialis = Rp 175.000
4. **Hari 4:** Staff buat Produk B dengan Visit Spesialis (Rp 175.000)

**Result:**
- Produk A: Visit = Rp 150.000 (snapshot saat dibuat)
- Produk B: Visit = Rp 175.000 (tarif terbaru)

**Behavior:** ✅ **Correct** - Tarif di-snapshot saat produk dibuat

---

## 📋 FIELD MAPPING

### Visit Field Mapping:

| skenario_tarif_visit Column | Produk Layanan Value | Display |
|----------------------------|----------------------|---------|
| `visit_dokter_umum` | `visite[].jasa_sarana` | VISIT.UMUM - Rp 100.000 🟣 |
| `visit_dokter_spesialis` | `visite[].jasa_sarana` | VISIT.SPESIALIS - Rp 150.000 🟢 |
| `visit_dokter_subspesialis` | `visite[].jasa_sarana` | VISIT.SUBSPESIALIS - Rp 200.000 🟠 |

---

### Konsultasi Field Mapping:

| skenario_tarif_visit Column | Produk Layanan Value | Display |
|----------------------------|----------------------|---------|
| `konsultasi_dokter_spesialis` | `konsultasi[].jasa_sarana` | KONSUL.SPESIALIS - Rp 250.000 🟢 |
| `konsultasi_dokter_subspesialis` | `konsultasi[].jasa_sarana` | KONSUL.SUBSPESIALIS - Rp 300.000 🟠 |

---

## 🧮 CALCULATION FORMULAS

### Individual Item:

```typescript
subtotal = jasa_sarana × qty
```

**Example:**
- Visit Dokter Spesialis: Rp 150.000
- Qty: 3
- Subtotal: **Rp 450.000**

---

### Total Biaya Produk Layanan:

```sql
total_biaya = 
  SUM(tindakan[].subtotal) +
  SUM(ibs[].subtotal) +
  SUM(laboratorium[].subtotal) +
  SUM(radiologi[].subtotal) +
  SUM(farmasi[].subtotal) +
  SUM(kamar_akomodasi[].subtotal) +
  SUM(visite[].subtotal) +           ← Include visite
  SUM(konsultasi[].subtotal)         ← Include konsultasi
```

**Trigger:** `calculate_total_biaya_produk_layanan_v2()`

---

## 🎓 BEST PRACTICES

### For Admin:

1. **Setup Tarif Awal:**
   - Setup semua tarif sebelum staff mulai input produk layanan
   - Review tarif secara berkala (bulanan/tahunan)

2. **Update Tarif:**
   - Komunikasikan ke staff saat update tarif
   - Catat tarif lama untuk referensi
   - Update di awal periode (awal tahun)

3. **Validation:**
   - Pastikan tarif > 0
   - Pastikan hierarchy: Subspesialis > Spesialis > Umum
   - Pastikan Konsultasi > Visit (same level)

---

### For Staff (Data Entry):

1. **Check Tarif Availability:**
   - Pastikan tahun yang dipilih sudah ada tarifnya
   - Jika dropdown kosong, hubungi admin

2. **Pilih Kategori yang Tepat:**
   - Lihat badge warna untuk guidance
   - 🟣 Umum = General practitioner
   - 🟢 Spesialis = Specialist
   - 🟠 Subspesialis = Subspecialist

3. **Input Quantity:**
   - Visit: biasanya = LOS (length of stay)
   - Konsultasi: sesuai kebutuhan kasus

---

## 📊 REPORTING & ANALYTICS

### Query: Total Biaya Visit per Kategori Dokter

```sql
SELECT 
  item->>'tipe_dokter' as kategori_dokter,
  COUNT(*) as jumlah_produk,
  SUM((item->>'subtotal')::bigint) as total_biaya_visit
FROM produk_layanan,
     jsonb_array_elements(visite) as item
WHERE tahun = 2025
GROUP BY item->>'tipe_dokter'
ORDER BY total_biaya_visit DESC;
```

**Result Example:**
```
kategori_dokter  | jumlah_produk | total_biaya_visit
-----------------+---------------+------------------
spesialis        | 45            | 6,750,000
subspesialis     | 12            | 2,400,000
umum             | 8             | 800,000
```

---

### Query: Produk dengan Visit Terbanyak

```sql
SELECT 
  id,
  jenis,
  inacbg,
  jsonb_array_length(visite) as jumlah_visit,
  total_biaya
FROM produk_layanan
WHERE tahun = 2025
  AND jsonb_array_length(visite) > 0
ORDER BY jsonb_array_length(visite) DESC
LIMIT 10;
```

---

## 🔄 UPDATE FLOW

### Saat Admin Update Tarif:

**Before Update:**
- Visit Spesialis: Rp 150.000

**Admin Action:**
1. Buka Skenario Tarif Visit & Konsultasi
2. Klik card "Visit Dokter Spesialis 🟢"
3. Edit: 150000 → 175000
4. Klik "Simpan"

**After Update:**
- Visit Spesialis: Rp 175.000 ✅

**Impact:**
- ✅ Produk layanan **baru** akan gunakan Rp 175.000
- ✅ Produk layanan **lama** tetap Rp 150.000 (historical data preserved)

---

## ✅ IMPLEMENTATION CHECKLIST

### Database ✅
- [x] Tabel `skenario_tarif_visit` created
- [x] 5 kolom tarif (visit: 3, konsultasi: 2)
- [x] RLS enabled
- [x] Indexes created
- [x] Unique constraint (user_id, tahun)

### ServiceSelector ✅
- [x] Fetch dari `skenario_tarif_visit` untuk visite
- [x] Fetch dari `skenario_tarif_visit` untuk konsultasi
- [x] Transform ke array options
- [x] Display badge warna di dropdown
- [x] Tarif otomatis populate
- [x] User hanya input qty
- [x] Auto-calculate subtotal

### UI/UX ✅
- [x] Dropdown menampilkan tarif
- [x] Badge warna sesuai kategori
- [x] Preview calculation clear
- [x] Input validation
- [x] Toast notifications
- [x] Error handling

### Integration ✅
- [x] Works with Produk Layanan
- [x] Works with trigger total_biaya
- [x] Data properly stored in JSONB
- [x] No breaking changes

---

## 🎯 SUMMARY

### User Journey (Simplified):

**Admin (1x per tahun):**
```
Setup Tarif Visit & Konsultasi
  ↓
Input 5 tarif kategori
  ↓
Simpan
```

**Staff (setiap produk layanan):**
```
Tambah Visite/Konsultasi
  ↓
Pilih kategori dokter (dari dropdown)
  ↓
Input qty
  ↓
Tambah (tarif otomatis!)
```

### Key Benefits:

✅ **Konsistensi:** Semua user pakai tarif yang sama  
✅ **Efisiensi:** User hanya isi qty (bukan tarif)  
✅ **Akurasi:** Tidak ada salah input tarif  
✅ **Maintainability:** Update tarif di 1 tempat saja  
✅ **Audit Trail:** Historical data preserved  

---

**Dokumentasi dibuat:** Januari 2025  
**Versi:** 1.0  
**Status:** ✅ Production Ready

