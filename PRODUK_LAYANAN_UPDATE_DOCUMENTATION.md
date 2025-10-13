# Dokumentasi Update Produk Layanan

## Tanggal Update
Januari 2025

## Ringkasan Perubahan

Telah dilakukan perbaikan dan penyesuaian pada tabel `produk_layanan` dan komponen terkait untuk memenuhi requirement:

### 1. **Database Schema Updates**

#### Kolom Baru yang Ditambahkan:

- **`tarif_inacbgs_numeric` (bigint)**
  - Menyimpan tarif INA-CBG's dalam format numerik (rupiah)
  - Default: 0
  - Dapat diinput manual oleh user

- **`saldo_distribusi` (bigint, GENERATED COLUMN)**
  - Formula: `tarif_inacbgs_numeric - total_biaya`
  - Auto-calculated setiap kali data berubah
  - Menunjukkan selisih antara tarif INA-CBG's dengan total biaya
  - Nilai positif = profit, nilai negatif = rugi

#### Trigger Update:

**Function: `calculate_total_biaya_produk_layanan_v2()`**
- Menghitung `total_biaya` dari penjumlahan semua array layanan:
  - `tindakan[]`
  - `ibs[]`
  - `laboratorium[]`
  - `radiologi[]`
  - `farmasi[]`
  - `kamar_akomodasi[]`
  - `visite[]`
  - `konsultasi[]`
- Setiap item di array dijumlahkan field `subtotal`-nya
- Auto-executed BEFORE INSERT OR UPDATE

---

## 2. **ServiceSelector Component Updates**

### Interface ServiceItem - Field Baru:

```typescript
interface ServiceItem {
  kode_tindakan: string;
  nama_tindakan: string;
  jasa_sarana?: number;      // untuk skenario_tarif
  biaya_bahan?: number;       // untuk skenario_tarif
  unit_cost?: number;         // backward compatible
  biaya_bhp?: number;         // backward compatible
  tarif?: number;             // untuk akomodasi
  qty: number;
  subtotal: number;
}
```

### Props Baru:

```typescript
interface ServiceSelectorProps {
  label: string;
  value: ServiceItem[];
  onChange: (value: ServiceItem[]) => void;
  tahun: number;
  filterType: string;
  jenisProduk?: string;           // 'rawat jalan' atau 'rawat inap'
  spesialisasiDokter?: string;    // untuk filter IBS
}
```

---

## 3. **Sumber Data per Filter Type**

### a. **Tindakan (filterType="tindakan")**

**Sumber Data:** `skenario_tarif`

**Filter Logic:**
- Jika `jenisProduk = "rawat jalan"` → `sumber_tabel = "kalkulasi_tindakan_rawat_jalan"`
- Jika `jenisProduk = "rawat inap"` → `sumber_tabel = "kalkulasi_tindakan_inap"`

**Data yang Diambil:**
- `kode_tindakan`
- `nama_tindakan`
- `jasa_sarana`
- `biaya_bahan`

**Subtotal:** `(jasa_sarana + biaya_bahan) × qty`

---

### b. **IBS / Tindakan Operatif (filterType="ibs")**

**Sumber Data:** `skenario_tarif`

**Filter Logic:**
- `sumber_tabel = "kalkulasi_biaya_operatif"`
- Jika ada `spesialisasiDokter` → filter by `nama_operator`

**Data yang Diambil:**
- `kode_tindakan`
- `nama_tindakan`
- `kode_operator`
- `nama_operator`
- `jasa_sarana`
- `biaya_bahan`

**Subtotal:** `(jasa_sarana + biaya_bahan) × qty`

---

### c. **Laboratorium (filterType="laboratorium")**

**Sumber Data:** `skenario_tarif`

**Filter Logic:**
- `sumber_tabel = "kalkulasi_biaya_laboratorium"`

**Data yang Diambil:**
- `kode_tindakan`
- `nama_tindakan`
- `jasa_sarana`
- `biaya_bahan`

**Subtotal:** `(jasa_sarana + biaya_bahan) × qty`

---

### d. **Radiologi (filterType="radiologi")**

**Sumber Data:** `skenario_tarif`

**Filter Logic:**
- `sumber_tabel = "kalkulasi_biaya_radiologi"`

**Data yang Diambil:**
- `kode_tindakan`
- `nama_tindakan`
- `jasa_sarana`
- `biaya_bahan`

**Subtotal:** `(jasa_sarana + biaya_bahan) × qty`

---

### e. **Farmasi (filterType="farmasi")**

**Sumber Data:** `data_barang_farmasi`

**Filter Logic:**
- Query langsung dari tabel `data_barang_farmasi`

**Data yang Diambil:**
- `kode_barang` → mapped ke `kode_tindakan`
- `nama_barang` → mapped ke `nama_tindakan`
- `harga` → mapped ke `biaya_bahan`
- `satuan`

**Subtotal:** `biaya_bahan × qty`

---

### f. **Kamar Akomodasi (filterType="akomodasi")**

**Sumber Data:** `skenario_tarif_akomodasi`

**Filter Logic:**
- Ambil 1 row dari `skenario_tarif_akomodasi`
- Transform menjadi 5 pilihan kelas:
  - VVIP → `tarif_vvip`
  - VIP → `tarif_vip`
  - Kelas I → `tarif_i`
  - Kelas II → `tarif_ii`
  - Kelas III → `tarif_iii`

**Data yang Diambil:**
- `kode_tindakan`: "AKOM.VVIP", "AKOM.VIP", "AKOM.I", "AKOM.II", "AKOM.III"
- `nama_tindakan`: "Kamar VVIP", "Kamar VIP", dst.
- `tarif`: dari kolom tarif_xxx
- `rata_rata_uc`: dari kolom rata_rata_uc_xxx

**Subtotal:** `tarif × qty` (qty = jumlah hari)

---

### g. **Visite (filterType="visite")**

**Sumber Data:** `skenario_tarif`

**Filter Logic:**
- `nama_tindakan ILIKE '%visite%'`

**Data yang Diambil:**
- `kode_tindakan`
- `nama_tindakan`
- `jasa_sarana`
- `biaya_bahan`

**Subtotal:** `(jasa_sarana + biaya_bahan) × qty`

---

### h. **Konsultasi (filterType="konsultasi")**

**Sumber Data:** `skenario_tarif`

**Filter Logic:**
- `nama_tindakan ILIKE '%konsultasi%'`

**Data yang Diambil:**
- `kode_tindakan`
- `nama_tindakan`
- `jasa_sarana`
- `biaya_bahan`

**Subtotal:** `(jasa_sarana + biaya_bahan) × qty`

---

## 4. **UI Updates - ProdukLayanan.tsx**

### Form Input - Tab "Informasi Dasar":

**Field Baru:**
- **Tarif INA-CBG's (Rp)**
  - Type: Number input
  - Stores in: `tarif_inacbgs_numeric`
  - Placeholder: "Masukkan tarif INA-CBG's dalam rupiah"

**Field yang Diubah:**
- INA-CBG dan Grouper sekarang dalam 1 row (2 kolom)
- Field "INA-CBG's" (text) dihapus, diganti dengan "Tarif INA-CBG's" (numeric)

---

### Tabel Display - Kolom Baru:

| Kolom | Deskripsi | Format |
|-------|-----------|--------|
| **Tarif INA-CBGs** | Tarif dari INA-CBG's | Currency (Rp) |
| **Total Biaya** | Sum dari semua layanan | Currency (Rp) |
| **Saldo Distribusi** | `tarif - total_biaya` | Currency (Rp) dengan warna:<br>- Hijau jika ≥ 0<br>- Merah jika < 0 |

**Kolom yang Dihapus:**
- Grouper (dipindah ke form saja)

---

## 5. **ServiceSelector - Tab Layanan**

### Props yang Di-pass:

```tsx
// Tindakan - dengan filter jenis produk
<ServiceSelector
  label="Tindakan"
  filterType="tindakan"
  jenisProduk={formData.jenis}  // 'rawat jalan' atau 'rawat inap'
  ...
/>

// IBS - dengan filter spesialisasi dokter
<ServiceSelector
  label="IBS (Tindakan Operatif)"
  filterType="ibs"
  spesialisasiDokter={formData.spesialisasi_dokter}
  ...
/>

// Laboratorium, Radiologi, Farmasi, Akomodasi, Visite, Konsultasi
// Tidak perlu props tambahan
```

---

## 6. **Display Logic - Tabel Layanan**

### Header Kolom (Dynamic):

**Untuk Akomodasi:**
- Kode | Nama | **Tarif** | Qty | Subtotal | Aksi

**Untuk Lainnya:**
- Kode | Nama | **Jasa Sarana** | **Biaya Bahan** | Qty | Subtotal | Aksi

---

### Preview Selection (Dynamic):

**Untuk Akomodasi:**
```
Tarif per Hari: Rp xxx.xxx
Quantity: n hari
─────────────────────
Subtotal: Rp xxx.xxx
```

**Untuk Farmasi:**
```
Harga: Rp xxx.xxx
Quantity: n
─────────────────────
Subtotal: Rp xxx.xxx
```

**Untuk Lainnya:**
```
Jasa Sarana: Rp xxx.xxx
Biaya Bahan: Rp xxx.xxx
Quantity: n
─────────────────────
Subtotal: Rp xxx.xxx
```

---

## 7. **Perhitungan Otomatis**

### Formula Total Biaya:

```
total_biaya = 
  SUM(tindakan[].subtotal) +
  SUM(ibs[].subtotal) +
  SUM(laboratorium[].subtotal) +
  SUM(radiologi[].subtotal) +
  SUM(farmasi[].subtotal) +
  SUM(kamar_akomodasi[].subtotal) +
  SUM(visite[].subtotal) +
  SUM(konsultasi[].subtotal)
```

### Formula Saldo Distribusi:

```
saldo_distribusi = tarif_inacbgs_numeric - total_biaya
```

**Interpretasi:**
- Jika **positif** → Ada keuntungan/surplus
- Jika **negatif** → Ada kerugian/defisit
- Jika **0** → Break-even

---

## 8. **Migration Files**

### File: `update_produk_layanan_add_saldo_distribusi`

**Isi:**
1. Add column `tarif_inacbgs_numeric` (bigint)
2. Migrate data dari `tarif inacbgs` (text) → `tarif_inacbgs_numeric` (bigint)
3. Add generated column `saldo_distribusi`
4. Update trigger function `calculate_total_biaya_produk_layanan_v2()`
5. Drop old trigger dan create new trigger

**Status:** ✅ Applied successfully

---

## 9. **Cara Penggunaan**

### Skenario: Membuat Produk Layanan Rawat Inap

1. **Klik "Tambah Data"**

2. **Tab "Informasi Dasar":**
   - Jenis: Rawat Inap
   - INA-CBG: A-4-10-I
   - Grouper: Moderate
   - Tarif INA-CBG's: Rp 5.000.000
   - LOS: 3 hari
   - Spesialisasi Dokter: Bedah Digestif
   - Nama Dokter: Dr. Budi

3. **Tab "Diagnosa & Prosedur":**
   - Isi diagnosa dan prosedur sesuai kasus

4. **Tab "Layanan":**

   **a. Tindakan:**
   - Karena jenis = "rawat inap", sistem akan menampilkan tindakan dari `skenario_tarif` dengan `sumber_tabel = "kalkulasi_tindakan_inap"`
   - Pilih: Pemeriksaan Dokter Spesialis (Jasa: Rp 150.000, BHP: Rp 20.000)
   - Qty: 3
   - Subtotal: Rp 510.000

   **b. IBS:**
   - Karena spesialisasi = "Bedah Digestif", sistem akan filter tindakan operatif dengan `nama_operator = "Bedah Digestif"`
   - Pilih: Appendektomi (Jasa: Rp 3.000.000, BHP: Rp 500.000)
   - Qty: 1
   - Subtotal: Rp 3.500.000

   **c. Laboratorium:**
   - Pilih: Darah Lengkap (Jasa: Rp 75.000, BHP: Rp 25.000)
   - Qty: 1
   - Subtotal: Rp 100.000

   **d. Kamar Akomodasi:**
   - Pilih: Kamar Kelas I (Tarif: Rp 250.000/hari)
   - Qty: 3 hari
   - Subtotal: Rp 750.000

   **e. Farmasi:**
   - Pilih dari data_barang_farmasi:
     - Infus NaCl 500ml (Harga: Rp 15.000) × 6 = Rp 90.000
     - Antibiotik (Harga: Rp 50.000) × 3 = Rp 150.000
   - Total farmasi: Rp 240.000

   **f. Visite:**
   - Pilih: Visite Dokter Spesialis (Jasa: Rp 100.000, BHP: Rp 0)
   - Qty: 2
   - Subtotal: Rp 200.000

5. **Klik "Simpan"**

6. **Hasil Auto-Calculation:**
   - **Total Biaya:** Rp 5.300.000
   - **Tarif INA-CBGs:** Rp 5.000.000
   - **Saldo Distribusi:** Rp -300.000 (Merah = Defisit)

---

## 10. **Validasi & Testing**

### Checklist Testing:

- [x] Database migration berhasil applied
- [x] Kolom `tarif_inacbgs_numeric` dapat diinput
- [x] Kolom `saldo_distribusi` auto-calculated
- [x] Trigger `total_biaya` berfungsi untuk semua 8 array layanan
- [x] ServiceSelector untuk tindakan filter by jenis (rawat jalan/inap)
- [x] ServiceSelector untuk IBS filter by spesialisasi dokter
- [x] ServiceSelector untuk farmasi ambil dari `data_barang_farmasi`
- [x] ServiceSelector untuk akomodasi ambil dari `skenario_tarif_akomodasi`
- [x] ServiceSelector untuk visite filter by nama containing "visite"
- [x] ServiceSelector untuk konsultasi filter by nama containing "konsultasi"
- [x] Tabel display menampilkan Tarif INA-CBGs dan Saldo Distribusi
- [x] Saldo Distribusi berwarna hijau (profit) atau merah (loss)
- [x] Tidak ada linter errors

---

## 11. **Keunggulan Update**

1. **Akurasi Data Sumber:**
   - Semua data mengacu ke tabel skenario_tarif (kecuali farmasi dan akomodasi)
   - Jasa sarana dan biaya bahan langsung dari tarif yang sudah ditetapkan

2. **Filter Otomatis:**
   - Tindakan otomatis filter by jenis produk
   - IBS otomatis filter by spesialisasi dokter
   - Mengurangi human error dalam pemilihan layanan

3. **Transparansi Biaya:**
   - User bisa melihat breakdown jasa sarana dan biaya bahan
   - Saldo distribusi menunjukkan profit/loss langsung
   - Color coding memudahkan identifikasi

4. **Fleksibilitas:**
   - Support multiple quantity
   - Support berbagai jenis layanan (8 kategori)
   - Backward compatible dengan data lama

5. **Auto-Calculation:**
   - Total biaya dihitung otomatis
   - Saldo distribusi dihitung otomatis
   - Subtotal per layanan dihitung otomatis

---

## 12. **Roadmap Future Enhancement**

1. **Validasi Business Rule:**
   - Warning jika saldo distribusi negatif > threshold tertentu
   - Suggestion layanan alternatif yang lebih efisien

2. **Preset Template:**
   - Simpan produk layanan sebagai template
   - Clone template untuk kasus serupa

3. **Analisis Margin:**
   - Dashboard analisis profit/loss per produk layanan
   - Grafik trend saldo distribusi

4. **Integration SIMRS:**
   - Auto-populate dari data rekam medis
   - Sinkronisasi dengan billing system

5. **Reporting:**
   - Export detail breakdown biaya per layanan
   - Report komparasi tarif INA-CBG vs total biaya

---

## Status Implementasi

✅ **COMPLETED** - Semua fitur berhasil diimplementasikan
- Database migration: ✅
- ServiceSelector updates: ✅
- ProdukLayanan UI updates: ✅
- Testing & validation: ✅
- No linter errors: ✅

---

**Dokumentasi dibuat:** Januari 2025
**Versi:** 2.0
**Author:** AI Assistant
**Status:** Production Ready

