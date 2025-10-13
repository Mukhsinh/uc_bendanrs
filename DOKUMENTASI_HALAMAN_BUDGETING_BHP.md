# 💊 Dokumentasi Halaman Budgeting BHP

## 🎯 Overview
Halaman **Budgeting BHP** terdiri dari 2 submenu untuk menampilkan budgeting Bahan Habis Pakai (BHP) dan Farmasi dengan perspektif yang berbeda:

1. **Budgeting BHP (Rupiah)**: View aggregat per tindakan dengan total budgeting
2. **Budgeting BHP (Rincian)**: View detail per item bahan dengan breakdown lengkap

---

## 📍 Lokasi Menu

**Menu:** `Budgeting BHP`  
**Submenu:**
- `Budgeting BHP (Rupiah)` → `/budgeting-bhp/rupiah`
- `Budgeting BHP (Rincian)` → `/budgeting-bhp/rincian`

---

## 📊 HALAMAN 1: Budgeting BHP (Rupiah)

### 🎨 Tampilan

#### **1. Header Section**
- Judul: "Budgeting BHP (Rupiah)"
- Deskripsi: Total budgeting BHP berdasarkan biaya bahan dan jumlah tindakan
- **2 Action Buttons:**
  - 🔄 **Perbarui**: Refresh data dari database
  - 📥 **Unduh Excel**: Export data ke Excel

#### **2. Statistics Cards (4 Cards)**

| Card | Warna Border | Metric | Deskripsi |
|------|--------------|---------|-----------|
| **Total Items** | Teal | Jumlah jenis tindakan | Count rows |
| **Total Tindakan** | Biru | Volume tindakan | Sum jumlah_tindakan |
| **Total Budgeting** | Ungu | Total budgeting BHP | Sum total_budgeting_bhp |
| **Avg per Tindakan** | Orange | Rata-rata biaya | Total budgeting ÷ total tindakan |

#### **3. Badge Cards (2 Badges)**

##### a. **Volume Terbanyak** (Biru Gradient)
- Icon: TrendingUp
- Background: Gradient blue-50 to blue-100
- Border: blue-300
- Tampilkan:
  - Nama tindakan dengan volume tertinggi
  - Badge unit kerja (bg-blue-600)
  - Jumlah tindakan dalam font besar

##### b. **Budgeting Tertinggi** (Ungu Gradient)
- Icon: DollarSign
- Background: Gradient purple-50 to purple-100
- Border: purple-300
- Tampilkan:
  - Nama tindakan dengan budgeting tertinggi
  - Badge unit kerja (bg-purple-600)
  - Total budgeting dalam font besar

#### **4. Filter Section**
- Dropdown Select untuk filter berdasarkan unit kerja
- Pilihan: "Semua Unit Kerja" atau pilih spesifik unit
- Width: 300px
- Auto-update filtered data saat selection berubah

#### **5. Data Table**
Kolom table:
1. **No** - Nomor urut
2. **Unit Kerja** - Nama & kode unit
3. **Kode** - Kode tindakan (font mono)
4. **Nama Tindakan** - Nama tindakan
5. **Operator** - Nama operator (untuk operatif)
6. **Biaya Bahan** - Biaya bahan per tindakan (currency format)
7. **Jumlah** - Jumlah tindakan (badge outline)
8. **Total Budgeting BHP** - Total budgeting (bold, teal-600)
9. **Total Rincian** - Total dari rincian (bold, purple-600)

**Sorting:** Default by total_budgeting_bhp DESC (tertinggi dulu)

---

## 📋 HALAMAN 2: Budgeting BHP (Rincian)

### 🎨 Tampilan

#### **1. Header Section**
- Judul: "Budgeting BHP (Rincian)"
- Deskripsi: Detail rincian bahan per tindakan dengan kalkulasi jumlah dan harga
- **2 Action Buttons:**
  - 🔄 **Perbarui**: Refresh data rincian
  - 📥 **Unduh Excel**: Export rincian ke Excel

#### **2. Statistics Cards (3 Cards)**

| Card | Warna Border | Metric | Deskripsi |
|------|--------------|---------|-----------|
| **Total Items Bahan** | Teal | Jumlah detail bahan | Count rows |
| **Total Budgeting** | Ungu | Nilai keseluruhan | Sum total_rupiah |
| **Unique Barang** | Biru | Jenis barang unik | Distinct kode_barang |

#### **3. Badge Cards (2 Badges)**

##### a. **Quantity Terbanyak** (Biru Gradient)
- Icon: TrendingUp
- Tampilkan:
  - Nama barang dengan quantity tertinggi
  - Badge unit kerja
  - Jumlah total dengan satuan
  - Info tindakan yang menggunakan barang tersebut

##### b. **Nilai Tertinggi** (Ungu Gradient)
- Icon: DollarSign
- Tampilkan:
  - Nama barang dengan nilai rupiah tertinggi
  - Badge unit kerja
  - Total rupiah dalam font besar
  - Info tindakan yang menggunakan barang tersebut

#### **4. Filter Section**
- Dropdown Select untuk filter berdasarkan unit kerja
- Sama seperti halaman Rupiah

#### **5. Data Table**
Kolom table:
1. **No** - Nomor urut
2. **Unit Kerja** - Nama & kode unit
3. **Tindakan** - Nama tindakan & kode
4. **Kode Barang** - Kode barang (font mono)
5. **Nama Barang** - Nama barang
6. **Qty/Tindakan** - Quantity per 1 tindakan (badge outline)
7. **Jumlah Tindakan** - Total tindakan (badge secondary)
8. **Satuan** - Satuan barang
9. **Harga Satuan** - Harga per satuan (currency)
10. **Jumlah Total** - Total quantity (bold, blue-600)
11. **Total Rupiah** - Total nilai (bold, purple-600)

**Sorting:** Default by total_rupiah DESC (tertinggi dulu)

---

## 🔧 Fitur-Fitur

### 1. **Filter berdasarkan Unit Kerja** ✅
- Dropdown select dengan semua unit kerja yang ada
- Real-time filtering saat selection berubah
- Update statistics cards sesuai filter
- Update badges sesuai data ter-filter

### 2. **Unduh Laporan (Export Excel)** ✅

#### Halaman Rupiah - Export Format:
```
Columns: No, Unit Kerja, Kode Tindakan, Nama Tindakan, Operator, 
         Biaya Bahan, Jumlah Tindakan, Total Budgeting BHP, 
         Total Budgeting Rincian, Sumber
Filename: Budgeting_BHP_Rupiah_{unit}_{date}.xlsx
Sheet Name: Budgeting BHP
```

#### Halaman Rincian - Export Format:
```
Columns: No, Unit Kerja, Kode Tindakan, Nama Tindakan, Jumlah Tindakan,
         Kode Barang, Nama Barang, Qty per Tindakan, Satuan, 
         Harga Satuan, Jumlah Total, Total Rupiah
Filename: Budgeting_BHP_Rincian_{unit}_{date}.xlsx
Sheet Name: Rincian BHP
```

### 3. **Badge Volume Terbanyak** ✅

**Halaman Rupiah:**
- Tindakan dengan jumlah_tindakan tertinggi
- Background: Blue gradient
- Menampilkan jumlah tindakan dalam angka besar

**Halaman Rincian:**
- Barang dengan jumlah_total tertinggi
- Background: Blue gradient
- Menampilkan total quantity dengan satuan

### 4. **Badge Harga Termahal** ✅

**Halaman Rupiah:**
- Tindakan dengan total_budgeting_bhp tertinggi
- Background: Purple gradient
- Menampilkan total budgeting dalam currency format

**Halaman Rincian:**
- Barang dengan total_rupiah tertinggi
- Background: Purple gradient
- Menampilkan total rupiah dalam currency format

### 5. **Auto Refresh** ✅
- Tombol "Perbarui" untuk manual refresh
- Call RPC function untuk recalculate
- Toast notification untuk feedback
- Loading state saat refresh

### 6. **Responsive Design** ✅
- Mobile: 1 kolom cards, horizontal scroll table
- Tablet: 2-3 kolom cards
- Desktop: 4 kolom cards, full table view

---

## 💻 Technical Implementation

### **State Management:**
```typescript
- data: Full dataset from database
- filteredData: Filtered dataset based on unit kerja
- loading: Initial loading state
- refreshing: Refresh in progress state
- selectedUnit: Selected unit kerja filter
- unitKerjaList: List of unique unit kerja
```

### **API Calls:**

#### Fetch Data:
```typescript
// Halaman Rupiah
supabase
  .from("budgeting_bhp_farmasi")
  .select("*")
  .eq("user_id", userId)
  .eq("tahun", 2025)
  .order("total_budgeting_bhp", { ascending: false });

// Halaman Rincian
supabase
  .from("rincian_budgeting_bhp")
  .select("*")
  .eq("user_id", userId)
  .eq("tahun", 2025)
  .order("total_rupiah", { ascending: false });
```

#### Refresh Data:
```typescript
// Halaman Rupiah
supabase.rpc("populate_budgeting_bhp_farmasi", {
  p_user_id: userId,
  p_tahun: 2025
});

// Halaman Rincian
supabase.rpc("populate_rincian_budgeting_bhp", {
  p_user_id: userId,
  p_tahun: 2025
});
```

### **Export Implementation:**
```typescript
import * as XLSX from "xlsx";

const exportData = filteredData.map((item, index) => ({...}));
const ws = XLSX.utils.json_to_sheet(exportData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet Name");
XLSX.writeFile(wb, fileName);
```

---

## 🎨 Color Scheme

### Statistics Cards:
- **Teal** (border-l-teal-500): Total Items
- **Blue** (border-l-blue-500): Total Tindakan / Unique Barang
- **Purple** (border-l-purple-500): Total Budgeting
- **Orange** (border-l-orange-500): Average

### Badge Cards:
- **Blue Gradient**: Volume/Quantity terbanyak
  - from-blue-50 to-blue-100
  - border-blue-300
  - badge: bg-blue-600
  
- **Purple Gradient**: Harga/Nilai tertinggi
  - from-purple-50 to-purple-100
  - border-purple-300
  - badge: bg-purple-600

### Table Highlights:
- **Total Budgeting BHP**: text-teal-600 (bold)
- **Total Rincian/Rupiah**: text-purple-600 (bold)
- **Jumlah Total**: text-blue-600 (bold)

---

## 📊 Data Source

### Halaman Rupiah:
**Table:** `budgeting_bhp_farmasi`

**Kolom yang ditampilkan:**
- kode_unit_kerja, nama_unit_kerja
- kode_tindakan, nama_tindakan
- kode_operator, nama_operator
- biaya_bahan
- jumlah_tindakan ✨
- total_budgeting_bhp ⭐
- total_budgeting_rincian ⭐
- sumber_tabel

### Halaman Rincian:
**Table:** `rincian_budgeting_bhp`

**Kolom yang ditampilkan:**
- kode_unit_kerja, nama_unit_kerja
- kode_tindakan, nama_tindakan
- jumlah_tindakan
- kode_barang, nama_barang
- qty_per_tindakan
- satuan
- harga_satuan
- jumlah_total ⭐
- total_rupiah ⭐

---

## 🔄 User Workflow

### Workflow Halaman Rupiah:
```
1. User navigate ke Budgeting BHP → Budgeting BHP (Rupiah)
2. System fetch data dari budgeting_bhp_farmasi
3. Display statistics cards (total items, tindakan, budgeting, avg)
4. Display badges (volume terbanyak, budgeting tertinggi)
5. User dapat:
   - Filter by unit kerja
   - Lihat table data
   - Export to Excel
   - Refresh data manual
```

### Workflow Halaman Rincian:
```
1. User navigate ke Budgeting BHP → Budgeting BHP (Rincian)
2. System fetch data dari rincian_budgeting_bhp
3. Display statistics cards (total items, budgeting, unique barang)
4. Display badges (qty terbanyak, nilai tertinggi)
5. User dapat:
   - Filter by unit kerja
   - Lihat breakdown per barang
   - Export to Excel dengan detail lengkap
   - Refresh data manual
```

---

## 📈 Statistics Calculation

### Halaman Rupiah:
```typescript
totalItems = filteredData.length
totalTindakan = SUM(filteredData.jumlah_tindakan)
totalBudgeting = SUM(filteredData.total_budgeting_bhp)
avgPerTindakan = totalBudgeting / totalTindakan

topVolume = MAX(filteredData.jumlah_tindakan)
topBudget = MAX(filteredData.total_budgeting_bhp)
```

### Halaman Rincian:
```typescript
totalItemsBahan = filteredData.length
totalBudgeting = SUM(filteredData.total_rupiah)
uniqueBarang = DISTINCT(filteredData.kode_barang).size

topVolume = MAX(filteredData.jumlah_total)
topPrice = MAX(filteredData.total_rupiah)
```

---

## 🎯 Filter Implementation

### Filter Logic:
```typescript
useEffect(() => {
  if (selectedUnit === "all") {
    setFilteredData(data);
  } else {
    setFilteredData(data.filter(item => item.nama_unit_kerja === selectedUnit));
  }
}, [selectedUnit, data]);
```

### Impact Filter:
- ✅ Table rows filtered
- ✅ Statistics cards recalculated
- ✅ Badges updated to filtered data
- ✅ Export includes only filtered data

---

## 📥 Export Functionality

### Excel Export Features:
- ✅ All columns exported with proper formatting
- ✅ Filename includes unit filter and date
- ✅ Numbers formatted as numbers (not text)
- ✅ Currency values as raw numbers
- ✅ Toast notification on success
- ✅ Disabled button saat data kosong

### Library Used:
```typescript
import * as XLSX from "xlsx";
```

### Export Process:
1. Map filtered data to export format
2. Convert to worksheet (json_to_sheet)
3. Create workbook
4. Append sheet to workbook
5. Write file to download
6. Show success toast

---

## 🎨 UI Components

### Components Used:
- `Card, CardContent, CardHeader, CardTitle, CardDescription`
- `Badge` (variants: default, outline, secondary)
- `Button` (variants: default, outline)
- `Select, SelectContent, SelectItem, SelectTrigger, SelectValue`
- `Table, TableBody, TableCell, TableHead, TableHeader, TableRow`
- `Loader2` (loading spinner)
- `Toast` (notifications)

### Icons:
- `Loader2` - Loading state
- `Download` - Export button
- `RefreshCw` - Refresh button
- `TrendingUp` - Volume badge
- `DollarSign` - Price badge
- `Package` - Empty state

---

## 📱 Responsive Breakpoints

### Mobile (< 768px):
- Statistics: 1 column grid
- Badges: 1 column
- Table: Horizontal scroll
- Buttons: Stack vertically

### Tablet (768px - 1024px):
- Statistics: 2 columns
- Badges: 2 columns
- Table: Horizontal scroll if needed

### Desktop (> 1024px):
- Statistics: 4 columns (Rupiah) / 3 columns (Rincian)
- Badges: 2 columns
- Table: Full width, all columns visible

---

## 🔔 Notifications (Toast)

### Success Messages:
- ✅ "Data berhasil diperbarui" - after refresh
- ✅ "Data rincian berhasil diperbarui" - after rincian refresh
- ✅ "File {filename} berhasil diunduh" - after export

### Error Messages:
- ❌ "Gagal mengambil data budgeting" - fetch error
- ❌ "Gagal mengambil data rincian" - fetch error
- ❌ "Gagal memperbarui data" - refresh error
- ❌ "User tidak terautentikasi" - auth error

---

## 🎓 User Guide

### Cara Menggunakan Halaman Rupiah:

1. **Akses Menu:**
   - Login → Sidebar → Budgeting BHP → Budgeting BHP (Rupiah)

2. **Lihat Overview:**
   - Statistics cards menampilkan ringkasan
   - Badge menampilkan top performers

3. **Filter Data:**
   - Pilih unit kerja dari dropdown
   - Data table akan ter-filter otomatis
   - Statistics akan ter-recalculate

4. **Export Laporan:**
   - Klik tombol "Unduh Excel"
   - File akan terdownload otomatis
   - Buka file Excel untuk analisis lebih lanjut

5. **Refresh Data:**
   - Klik tombol "Perbarui" jika ada perubahan data sumber
   - Tunggu proses selesai
   - Data akan ter-update otomatis

### Cara Menggunakan Halaman Rincian:

1. **Akses Menu:**
   - Login → Sidebar → Budgeting BHP → Budgeting BHP (Rincian)

2. **Lihat Detail:**
   - Table menampilkan breakdown per barang
   - Setiap row adalah 1 barang dalam 1 tindakan

3. **Analisis:**
   - Lihat barang mana yang paling banyak digunakan (badge biru)
   - Lihat barang mana yang paling mahal (badge ungu)
   - Gunakan untuk procurement planning

4. **Export untuk Procurement:**
   - Filter unit kerja yang diinginkan
   - Export ke Excel
   - Gunakan untuk purchase order

---

## 📊 Sample Data Display

### Halaman Rupiah - Sample Row:
```
No: 1
Unit Kerja: Laboratorium (PK-PA) | UK038
Kode: PK.021
Nama Tindakan: Glukosa Pictus 700
Operator: -
Biaya Bahan: Rp 51,464
Jumlah: 10,572
Total Budgeting BHP: Rp 544,077,408
Total Rincian: Rp 544,077,408
```

### Halaman Rincian - Sample Row:
```
No: 1
Unit Kerja: Laboratorium (PK-PA) | UK038
Tindakan: Glukosa Pictus 700 | PK.021
Kode Barang: BHP00400
Nama Barang: Gas Oxygen (O2) 6M3
Qty/Tindakan: 1
Jumlah Tindakan: 10,572
Satuan: UNIT
Harga Satuan: Rp 51,464
Jumlah Total: 10,572
Total Rupiah: Rp 544,077,408
```

---

## 🔒 Security

### Authentication:
- ✅ Protected routes dengan ProtectedRoute wrapper
- ✅ Session checking via Supabase Auth
- ✅ Redirect ke /login jika tidak terautentikasi

### Authorization:
- ✅ RLS aktif di kedua tabel
- ✅ User hanya bisa lihat data mereka sendiri
- ✅ Filter by user_id otomatis di backend

---

## 🐛 Troubleshooting

### Problem: Data tidak muncul
**Solution:**
1. Pastikan sudah login
2. Check data di tabel budgeting_bhp_farmasi
3. Klik tombol "Perbarui"
4. Check console untuk error

### Problem: Badge tidak muncul
**Solution:**
- Badge hanya muncul jika ada data
- Badge budgeting hanya muncul jika total_budgeting_bhp > 0
- Pastikan data ter-filter punya nilai

### Problem: Export tidak bekerja
**Solution:**
- Pastikan ada data (button disabled jika kosong)
- Check browser console untuk error
- Pastikan browser allow downloads

### Problem: Filter tidak bekerja
**Solution:**
- Check selectedUnit state
- Check filteredData state
- Pastikan useEffect dependency array benar

---

## 🚀 Future Enhancements

### Planned Features:
- [ ] Search/filter by tindakan atau barang
- [ ] Pagination untuk data banyak
- [ ] Sort by column (ascending/descending)
- [ ] Comparison view (budget vs actual)
- [ ] Charts/graphs visualization
- [ ] Print to PDF functionality
- [ ] Bulk edit capabilities
- [ ] Historical data comparison
- [ ] Budget approval workflow
- [ ] Alert untuk overspending

---

## 📚 Related Documentation

- `DOKUMENTASI_BUDGETING_BHP_FARMASI.md` - Business logic & database
- `SCHEMA_BUDGETING_BHP_FARMASI.md` - Database schema detail
- Tabel database: `budgeting_bhp_farmasi`, `rincian_budgeting_bhp`
- Functions: `populate_budgeting_bhp_farmasi()`, `populate_rincian_budgeting_bhp()`

---

## 🎯 Key Takeaways

### Halaman Rupiah - Best For:
- ✅ Quick overview budgeting per tindakan
- ✅ Identifikasi tindakan dengan budgeting tinggi
- ✅ Analysis volume vs budgeting
- ✅ Export summary untuk management

### Halaman Rincian - Best For:
- ✅ Detail breakdown per barang
- ✅ Procurement planning & purchase order
- ✅ Inventory management
- ✅ Cost analysis per item
- ✅ Export detail untuk purchasing dept

---

## 📝 Changelog

### Version 1.0.0 (9 Oktober 2025)
- ✅ Initial release
- ✅ 2 halaman dengan fitur lengkap
- ✅ Filter by unit kerja
- ✅ Export to Excel
- ✅ Badge volume terbanyak
- ✅ Badge harga termahal
- ✅ Auto refresh functionality
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Statistics cards

---

**Last Updated:** 9 Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

