# 📋 Dokumentasi: Kolom Baru di Daftar Tindakan

## 🎯 Overview

Telah ditambahkan **3 kolom baru** ke tabel `daftar_tindakan` untuk melengkapi informasi tindakan medis:

1. ⏱️ **Waktu** - Durasi pelaksanaan dalam menit
2. ⭐ **Profesionalisme** - Tingkat keahlian yang dibutuhkan (1-4)
3. ⚠️ **Tingkat Kesulitan** - Kompleksitas tindakan (1-5)

---

## 🗄️ Perubahan Database

### Migration Applied ✅

**File Migration:** `add_waktu_profesionalisme_tingkat_kesulitan_to_daftar_tindakan`

### Struktur Kolom Baru:

```sql
-- 1. Waktu (dalam menit)
ALTER TABLE daftar_tindakan 
ADD COLUMN waktu INTEGER DEFAULT 0;

-- 2. Profesionalisme (range 1-4)
ALTER TABLE daftar_tindakan 
ADD COLUMN profesionalisme SMALLINT DEFAULT 1;

-- 3. Tingkat Kesulitan (range 1-5)
ALTER TABLE daftar_tindakan 
ADD COLUMN tingkat_kesulitan SMALLINT DEFAULT 1;
```

### Constraints:

```sql
-- Validate ranges
CHECK (profesionalisme >= 1 AND profesionalisme <= 4)
CHECK (tingkat_kesulitan >= 1 AND tingkat_kesulitan <= 5)
CHECK (waktu >= 0)
```

### Comments:

```sql
COMMENT ON COLUMN daftar_tindakan.waktu IS 
  'Waktu pelaksanaan tindakan dalam menit';

COMMENT ON COLUMN daftar_tindakan.profesionalisme IS 
  'Tingkat profesionalisme yang dibutuhkan: 
   1=Dasar, 2=Menengah, 3=Tinggi, 4=Ahli';

COMMENT ON COLUMN daftar_tindakan.tingkat_kesulitan IS 
  'Tingkat kesulitan tindakan: 
   1=Sangat Mudah, 2=Mudah, 3=Sedang, 4=Sulit, 5=Sangat Sulit';
```

---

## 📊 Detail Kolom

### 1. Waktu (Integer)

**Range:** 0 - unlimited (dalam menit)

**Default:** 0

**Contoh:**
- Cek Vital Sign: 5 menit
- Konsultasi Dokter: 15 menit
- Pemeriksaan Fisik: 20 menit
- Operasi Kecil: 60 menit
- Operasi Besar: 180 menit

### 2. Profesionalisme (SmallInt: 1-4)

**Level:**

| Level | Label | Deskripsi | Contoh Tindakan |
|-------|-------|-----------|----------------|
| **1** | Dasar | Keahlian dasar | Pemeriksaan tekanan darah, Pengukuran suhu |
| **2** | Menengah | Keahlian menengah | Pemasangan infus, Suntik IM |
| **3** | Tinggi | Keahlian tinggi | Perawatan luka kompleks, Catheter |
| **4** | Ahli | Keahlian ahli/spesialis | Operasi, Prosedur kompleks |

**Default:** 1 (Dasar)

### 3. Tingkat Kesulitan (SmallInt: 1-5)

**Level:**

| Level | Label | Deskripsi | Contoh Tindakan |
|-------|-------|-----------|----------------|
| **1** | Sangat Mudah | Minimal risiko | Pengukuran vital sign, Pemberian obat oral |
| **2** | Mudah | Risiko rendah | Ganti perban sederhana, Nebulizer |
| **3** | Sedang | Risiko menengah | Pemasangan NGT, Catheter sederhana |
| **4** | Sulit | Risiko tinggi | Perawatan luka kompleks, Tindakan invasif |
| **5** | Sangat Sulit | Risiko sangat tinggi | Operasi mayor, Emergency procedure |

**Default:** 1 (Sangat Mudah)

---

## 💻 Perubahan Frontend

### 1. Interface Updated ✅

```typescript
interface DaftarTindakan {
  id: string;
  kode_tindakan: string;
  nama_tindakan: string;
  medis: boolean;
  paramedis: boolean;
  waktu?: number;                    // ✅ NEW
  profesionalisme?: number;          // ✅ NEW
  tingkat_kesulitan?: number;        // ✅ NEW
  bahan_tindakan?: BahanTindakan[] | null;
  biaya_bahan_tindakan?: number;
  created_at?: string;
}
```

### 2. Form Schema Updated ✅

```typescript
const formSchema = z.object({
  kode_tindakan: z.string().optional(),
  nama_tindakan: z.string().min(1, { message: "Nama wajib." }),
  medis: z.boolean().default(false),
  paramedis: z.boolean().default(false),
  waktu: z.number().min(0).optional(),                                    // ✅ NEW
  profesionalisme: z.number().min(1).max(4).optional(),                   // ✅ NEW
  tingkat_kesulitan: z.number().min(1).max(5).optional(),                 // ✅ NEW
}).refine((data) => data.medis || data.paramedis, {
  message: "Minimal satu pelaksana harus dipilih",
  path: ["medis"],
});
```

### 3. Form Fields Added ✅

**Waktu:**
```tsx
<FormField
  control={form.control}
  name="waktu"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Waktu (menit)</FormLabel>
      <FormControl>
        <Input 
          type="number" 
          min="0"
          placeholder="0" 
          {...field}
          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
        />
      </FormControl>
      <FormDescription>Durasi pelaksanaan</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Profesionalisme:**
```tsx
<FormField
  control={form.control}
  name="profesionalisme"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Profesionalisme</FormLabel>
      <Select 
        onValueChange={(v) => field.onChange(parseInt(v))} 
        defaultValue={field.value?.toString()}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Pilih level" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="1">1 - Dasar</SelectItem>
          <SelectItem value="2">2 - Menengah</SelectItem>
          <SelectItem value="3">3 - Tinggi</SelectItem>
          <SelectItem value="4">4 - Ahli</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>Level keahlian</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Tingkat Kesulitan:**
```tsx
<FormField
  control={form.control}
  name="tingkat_kesulitan"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tingkat Kesulitan</FormLabel>
      <Select 
        onValueChange={(v) => field.onChange(parseInt(v))} 
        defaultValue={field.value?.toString()}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Pilih level" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="1">1 - Sangat Mudah</SelectItem>
          <SelectItem value="2">2 - Mudah</SelectItem>
          <SelectItem value="3">3 - Sedang</SelectItem>
          <SelectItem value="4">4 - Sulit</SelectItem>
          <SelectItem value="5">5 - Sangat Sulit</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>Level kompleksitas</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4. Table Display Updated ✅

**New Columns:**

```tsx
<TableHeader>
  <TableRow>
    <TableHead>Kode</TableHead>
    <TableHead>Nama Tindakan</TableHead>
    <TableHead className="text-center">
      <Clock className="h-3 w-3" /> Waktu       {/* ✅ NEW */}
    </TableHead>
    <TableHead className="text-center">
      <Star className="h-3 w-3" /> Prof.        {/* ✅ NEW */}
    </TableHead>
    <TableHead className="text-center">
      <AlertTriangle className="h-3 w-3" /> Kesulitan  {/* ✅ NEW */}
    </TableHead>
    <TableHead>Pelaksana</TableHead>
    <TableHead className="text-right">Biaya Bahan</TableHead>
    <TableHead className="text-right">Aksi</TableHead>
  </TableRow>
</TableHeader>
```

**Display with Badges:**

```tsx
<TableCell className="text-center">
  <Badge variant="outline">{item.waktu || 0} mnt</Badge>
</TableCell>
<TableCell className="text-center">
  <Badge variant="secondary">{item.profesionalisme || 1}</Badge>
</TableCell>
<TableCell className="text-center">
  <Badge variant="secondary">{item.tingkat_kesulitan || 1}</Badge>
</TableCell>
```

---

## 📥 Template CSV Updated ✅

### Template Baru:

**Headers:**
```
Nama Tindakan, Medis (true/false), Paramedis (true/false), Waktu (menit), Profesionalisme (1-4), Tingkat Kesulitan (1-5)
```

**Sample Data:**
```csv
Konsultasi Dokter Umum,true,false,15,2,2
Pemeriksaan Tekanan Darah,false,true,5,1,1
Pemberian Obat,true,true,10,2,2
Operasi Kecil,true,false,60,4,4
```

### Download Function:

```typescript
const handleDownloadTemplate = () => {
  const headers = [
    "Nama Tindakan", 
    "Medis (true/false)", 
    "Paramedis (true/false)",
    "Waktu (menit)",                      // ✅ NEW
    "Profesionalisme (1-4)",              // ✅ NEW
    "Tingkat Kesulitan (1-5)"             // ✅ NEW
  ];
  const sampleData = [
    ["Konsultasi Dokter Umum", "true", "false", "15", "2", "2"],
    ["Pemeriksaan Tekanan Darah", "false", "true", "5", "1", "1"],
    ["Pemberian Obat", "true", "true", "10", "2", "2"],
    ["Operasi Kecil", "true", "false", "60", "4", "4"]
  ];
  const csv = Papa.unparse([headers, ...sampleData]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "template_daftar_tindakan.csv");
  toast.info("Template impor diunduh.");
};
```

---

## 📤 Import CSV Updated ✅

### Parsing Logic:

```typescript
for (const row of results.data) {
  const nama = (row["Nama Tindakan"] || "").toString().trim();
  const medis = (row["Medis (true/false)"] || "false").toString().toLowerCase() === "true";
  const paramedis = (row["Paramedis (true/false)"] || "false").toString().toLowerCase() === "true";
  
  // ✅ Parse new columns
  const waktu = parseInt(row["Waktu (menit)"] || "0") || 0;
  const profesionalisme = parseInt(row["Profesionalisme (1-4)"] || "1") || 1;
  const tingkat_kesulitan = parseInt(row["Tingkat Kesulitan (1-5)"] || "1") || 1;
  
  // Validate
  if (!nama || (!medis && !paramedis)) {
    skippedRows++;
    continue;
  }
  
  // ✅ Validate ranges
  if (profesionalisme < 1 || profesionalisme > 4) {
    skippedRows++;
    continue;
  }
  if (tingkat_kesulitan < 1 || tingkat_kesulitan > 5) {
    skippedRows++;
    continue;
  }
  
  rows.push({ 
    kode_tindakan: null,
    nama_tindakan: nama, 
    medis: medis,
    paramedis: paramedis,
    waktu: waktu,                        // ✅ NEW
    profesionalisme: profesionalisme,    // ✅ NEW
    tingkat_kesulitan: tingkat_kesulitan // ✅ NEW
  });
}
```

---

## 📊 Report Export Updated ✅

### Export Function:

```typescript
const handleDownloadReport = () => {
  const data = list
    .filter(/* filter logic */)
    .map(item => ({ 
      Kode: item.kode_tindakan, 
      Nama: item.nama_tindakan,
      Medis: item.medis ? "Ya" : "Tidak",
      Paramedis: item.paramedis ? "Ya" : "Tidak",
      "Waktu (menit)": item.waktu || 0,                      // ✅ NEW
      "Profesionalisme (1-4)": item.profesionalisme || 1,    // ✅ NEW
      "Tingkat Kesulitan (1-5)": item.tingkat_kesulitan || 1, // ✅ NEW
      "Biaya Bahan": item.biaya_bahan_tindakan || 0
    }));
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `laporan_daftar_tindakan_${filterPelaksana}.csv`);
  toast.info("Laporan diunduh.");
};
```

---

## 🎨 UI/UX Improvements

### 1. Form Layout

**Grid 3 Columns** untuk field baru:
```tsx
<div className="grid grid-cols-3 gap-4">
  {/* Waktu */}
  {/* Profesionalisme */}
  {/* Tingkat Kesulitan */}
</div>
```

### 2. Icons Added

- ⏱️ `Clock` - Waktu
- ⭐ `Star` - Profesionalisme
- ⚠️ `AlertTriangle` - Tingkat Kesulitan

### 3. Badges for Display

- **Waktu**: `<Badge variant="outline">15 mnt</Badge>`
- **Profesionalisme**: `<Badge variant="secondary">2</Badge>`
- **Tingkat Kesulitan**: `<Badge variant="secondary">3</Badge>`

### 4. Form Descriptions

Setiap field punya description:
- Waktu: "Durasi pelaksanaan"
- Profesionalisme: "Level keahlian"
- Tingkat Kesulitan: "Level kompleksitas"

---

## 📸 Preview Tampilan

### Form Dialog:

```
┌─────────────────────────────────────────────────────┐
│ 📋 Tambah Tindakan                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Kode Tindakan: [Auto-Generate Aktif]               │
│                                                     │
│ Nama Tindakan: [_____________________________]     │
│                                                     │
│ ┌─────────────┬──────────────┬──────────────┐      │
│ │ Waktu       │ Profesional. │ Kesulitan    │      │
│ │ [15] menit  │ [2 ▼]        │ [3 ▼]        │      │
│ │ Durasi      │ Level keahl. │ Level kompl. │      │
│ └─────────────┴──────────────┴──────────────┘      │
│                                                     │
│ ☐ Medis       ☐ Paramedis                          │
│                                                     │
│ Bahan Tindakan: [+ Tambah Bahan]                   │
│                                                     │
│                          [Batal]  [Tambah] ✅       │
└─────────────────────────────────────────────────────┘
```

### Table Preview:

```
┌────────────────────────────────────────────────────────────────┐
│ Kode  │ Nama       │ ⏱️ │ ⭐ │ ⚠️ │ Pelaksana │ Biaya │ Aksi │
├────────────────────────────────────────────────────────────────┤
│ T.001 │ Konsul...  │15m │ 2  │ 2  │ 🟢 Medis  │  -    │ ✏️🗑️ │
│ T.002 │ Cek TD     │ 5m │ 1  │ 1  │ ⚪ Param. │  -    │ ✏️🗑️ │
│ T.003 │ Infus      │20m │ 2  │ 3  │ 🟢⚪ Both │ 50k   │ ✏️🗑️ │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### Use Case 1: Tambah Tindakan Sederhana

**Tindakan:** Pemeriksaan Tekanan Darah

**Input:**
- Nama: "Pemeriksaan Tekanan Darah"
- Waktu: 5 menit
- Profesionalisme: 1 (Dasar)
- Tingkat Kesulitan: 1 (Sangat Mudah)
- Pelaksana: Paramedis

### Use Case 2: Tambah Tindakan Kompleks

**Tindakan:** Operasi Kecil

**Input:**
- Nama: "Operasi Kecil - Eksisi Lipoma"
- Waktu: 60 menit
- Profesionalisme: 4 (Ahli)
- Tingkat Kesulitan: 4 (Sulit)
- Pelaksana: Medis
- Bahan: Alat bedah, Anestesi lokal, dll

### Use Case 3: Import Bulk Data

**File CSV:**
```csv
Nama Tindakan,Medis (true/false),Paramedis (true/false),Waktu (menit),Profesionalisme (1-4),Tingkat Kesulitan (1-5)
Konsultasi Dokter Umum,true,false,15,2,2
Pemeriksaan Tekanan Darah,false,true,5,1,1
Pemasangan Infus,false,true,20,2,3
Operasi Kecil,true,false,60,4,4
Perawatan Luka,true,true,30,2,3
```

**Result:** 5 tindakan ter-import dengan data lengkap ✅

---

## ✅ Checklist Implementation

### Database:
- [x] Kolom `waktu` ditambahkan
- [x] Kolom `profesionalisme` ditambahkan
- [x] Kolom `tingkat_kesulitan` ditambahkan
- [x] Check constraints untuk validasi range
- [x] Default values set
- [x] Comments untuk dokumentasi

### Frontend - Interface:
- [x] Interface `DaftarTindakan` updated
- [x] Form schema updated dengan validasi

### Frontend - Form:
- [x] Input field waktu (number)
- [x] Dropdown profesionalisme (1-4)
- [x] Dropdown tingkat kesulitan (1-5)
- [x] Form descriptions added
- [x] Default values set

### Frontend - Display:
- [x] Table columns added
- [x] Icons added
- [x] Badges untuk display
- [x] Responsive layout

### Import/Export:
- [x] Template CSV updated
- [x] Import logic updated
- [x] Validation during import
- [x] Export report updated

### Testing:
- [x] No linting errors
- [x] TypeScript types correct
- [x] Form validation works
- [x] Database constraints work

---

## 🧪 Testing Guide

### Test 1: Tambah Data Manual

1. Buka halaman Daftar Tindakan
2. Click "Tambah Tindakan"
3. Isi semua field termasuk 3 field baru
4. Submit
5. Verify data tersimpan dengan benar

### Test 2: Edit Data Existing

1. Click edit pada tindakan yang ada
2. Update waktu, profesionalisme, tingkat kesulitan
3. Submit
4. Verify changes saved

### Test 3: Import CSV

1. Download template CSV
2. Isi dengan data sample
3. Import file
4. Verify semua data ter-import dengan 3 kolom baru

### Test 4: Export Report

1. Filter data (optional)
2. Click "Unduh Laporan"
3. Buka CSV file
4. Verify 3 kolom baru ada dalam export

### Test 5: Validasi Range

1. Try input profesionalisme = 0 atau 5 → Should be rejected
2. Try input tingkat_kesulitan = 0 atau 6 → Should be rejected
3. Try input waktu = -1 → Should be rejected

---

## 📚 Helper Functions

### Get Label Functions:

```typescript
const getProfesionalismeLabel = (level: number) => {
  const labels: Record<number, string> = {
    1: "Dasar",
    2: "Menengah",
    3: "Tinggi",
    4: "Ahli"
  };
  return labels[level] || "Tidak diketahui";
};

const getTingkatKesulitanLabel = (level: number) => {
  const labels: Record<number, string> = {
    1: "Sangat Mudah",
    2: "Mudah",
    3: "Sedang",
    4: "Sulit",
    5: "Sangat Sulit"
  };
  return labels[level] || "Tidak diketahui";
};
```

**Usage:**
```typescript
console.log(getProfesionalismeLabel(2));     // "Menengah"
console.log(getTingkatKesulitanLabel(4));    // "Sulit"
```

---

## 🎓 Summary

### What Changed:

1. **Database**: 3 kolom baru dengan constraints
2. **Frontend**: Form fields, table display, badges
3. **Import/Export**: Template dan logic updated
4. **Validation**: Range validation for all new fields
5. **UI/UX**: Icons, descriptions, responsive layout

### Benefits:

- ✅ **Data Lengkap**: Tindakan punya informasi waktu, keahlian, kompleksitas
- ✅ **Analisis**: Bisa analisis tindakan berdasarkan profesionalisme/kesulitan
- ✅ **Kalkulasi**: Waktu bisa digunakan untuk cost calculation
- ✅ **Planning**: Info kesulitan untuk resource planning
- ✅ **Scalable**: Structure siap untuk future features

---

## 🚀 Status

**✅ COMPLETE & READY TO USE**

**All components updated:**
- ✅ Database schema
- ✅ Frontend interface
- ✅ Form with validation
- ✅ Table display
- ✅ Import/Export
- ✅ No linting errors

**Ready for production!** 🎉

---

**Documentation Created:** 2 Oktober 2025  
**Version:** 1.0  
**Status:** ✅ Complete

