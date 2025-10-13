# 📋 Dokumentasi Update Skenario Tarif

## 🎯 Ringkasan Perubahan

Telah dilakukan pembaruan pada tabel `skenario_tarif` dan halaman aplikasi untuk mendukung input manual jasa pelayanan medis dan non medis dengan kalkulasi otomatis.

---

## 🗄️ Perubahan Database

### Kolom Baru yang Ditambahkan

1. **`jasa_pelayanan_medis`** (BIGINT)
   - Jasa pelayanan medis (input manual)
   - Default: 0

2. **`jasa_pelayanan_non_medis`** (BIGINT)
   - Jasa pelayanan non medis (input manual)
   - Default: 0

### Kolom yang Diupdate

1. **`jasa_pelayanan`** (BIGINT)
   - **Auto-calculated**: `jasa_pelayanan_medis + jasa_pelayanan_non_medis`
   - Tidak perlu input manual lagi

2. **`prosentase_jasa_pelayanan`** (NUMERIC)
   - **Formula**: `(jasa_pelayanan / tarif_per_tindakan) × 100%`
   - Dibulatkan ke 2 desimal

3. **`prosentase_profit`** (NUMERIC)
   - **Formula**: `((jasa_sarana - unit_cost_per_tindakan) / unit_cost_per_tindakan) × 100%`
   - Dibulatkan ke 2 desimal

4. **`tarif_per_tindakan`** (BIGINT)
   - **Formula**: `jasa_sarana + biaya_bahan + jasa_pelayanan`

---

## ⚙️ Database Trigger

### Function: `calculate_skenario_tarif()`

Fungsi ini dijalankan secara otomatis setiap kali ada INSERT atau UPDATE pada tabel `skenario_tarif`.

**Urutan Kalkulasi:**
1. Hitung `jasa_pelayanan` = `jasa_pelayanan_medis + jasa_pelayanan_non_medis`
2. Hitung `tarif_per_tindakan` = `jasa_sarana + biaya_bahan + jasa_pelayanan`
3. Hitung `prosentase_jasa_pelayanan` = `(jasa_pelayanan / tarif_per_tindakan) × 100`
4. Hitung `prosentase_profit` = `((jasa_sarana - unit_cost) / unit_cost) × 100`
5. Update `updated_at` timestamp

---

## 🖥️ Perubahan Halaman Aplikasi

### File: `src/pages/SkenarioTarif.tsx`

### Fitur Baru:

#### 1. **Edit Row Inline**
   - Klik tombol "Edit" pada baris untuk mengaktifkan mode edit
   - Input manual untuk:
     - Jasa Sarana
     - Jasa Pelayanan Medis
     - Jasa Pelayanan Non Medis
   - Tombol "Simpan" dan "Batal" untuk kontrol edit

#### 2. **Kolom Tabel yang Ditampilkan**
   - Unit Kerja
   - Operator (untuk tindakan operatif)
   - Tindakan
   - Unit Cost (exclude bahan)
   - Biaya Bahan
   - **Jasa Sarana** (editable)
   - **Jasa Pelayanan Medis** (editable)
   - **Jasa Pelayanan Non Medis** (editable)
   - Jasa Pelayanan (auto-calculated)
   - **% Jasa Pelayanan** (auto-calculated, badge)
   - **% Profit** (auto-calculated, badge dengan warna)
   - **Tarif per Tindakan** (auto-calculated, bold)
   - Aksi (Edit/Simpan/Batal)

#### 3. **Visual Enhancements**
   - Badge untuk persentase jasa pelayanan (outline)
   - Badge untuk persentase profit:
     - Warna default (biru) untuk profit positif
     - Warna destructive (merah) untuk profit negatif
   - Tarif per tindakan ditampilkan bold dengan warna primary

#### 4. **Export CSV**
   - Export mencakup semua kolom baru
   - Format: Unit Kerja, Operator, Tindakan, Unit Cost, Biaya Bahan, Jasa Sarana, Jasa Pelayanan Medis, Jasa Pelayanan Non Medis, Jasa Pelayanan, % Jasa Pelayanan, % Profit, Tarif per Tindakan

---

## 📊 Contoh Perhitungan

### Input Manual:
- Biaya Bahan: Rp 50,000
- Unit Cost: Rp 100,000
- **Jasa Sarana**: Rp 150,000 (manual input)
- **Jasa Pelayanan Medis**: Rp 30,000 (manual input)
- **Jasa Pelayanan Non Medis**: Rp 20,000 (manual input)

### Hasil Kalkulasi Otomatis:
1. **Jasa Pelayanan**:
   ```
   = 30,000 + 20,000
   = Rp 50,000
   ```

2. **Tarif per Tindakan**:
   ```
   = 150,000 + 50,000 + 50,000
   = Rp 250,000
   ```

3. **Persentase Jasa Pelayanan**:
   ```
   = (50,000 / 250,000) × 100%
   = 20.00%
   ```

4. **Persentase Profit**:
   ```
   = ((150,000 - 100,000) / 100,000) × 100%
   = 50.00%
   ```

---

## 🚀 Cara Penggunaan

### 1. **Muat Data dari Rekapitulasi**
   - Pilih tahun
   - Klik tombol "Muat Data dari Rekapitulasi"
   - Data akan dimuat dari tabel `rekapitulasi_unit_cost`

### 2. **Edit Manual per Baris**
   - Klik tombol "Edit" pada baris yang ingin diubah
   - Input nilai untuk:
     - Jasa Sarana
     - Jasa Pelayanan Medis
     - Jasa Pelayanan Non Medis
   - Klik "Simpan" untuk menyimpan perubahan
   - Kalkulasi otomatis akan berjalan
   - Data akan refresh otomatis

### 3. **Filter per Unit Kerja**
   - Gunakan dropdown "Unit Kerja" untuk filter data
   - Pilih "Semua Unit Kerja" untuk melihat semua data

### 4. **Export Data**
   - Klik tombol "Export CSV" untuk download data
   - File akan berisi semua kolom termasuk perhitungan

---

## ✅ Testing & Validasi

### Test Case 1: Kalkulasi Dasar
✅ Input manual jasa sarana, medis, non medis  
✅ Jasa pelayanan dihitung otomatis  
✅ Tarif per tindakan dihitung otomatis  
✅ Persentase jasa pelayanan dihitung otomatis  
✅ Persentase profit dihitung otomatis  

### Test Case 2: Edge Cases
✅ Handle nilai 0 untuk jasa pelayanan  
✅ Handle nilai 0 untuk unit cost (prevent division by zero)  
✅ Handle nilai 0 untuk tarif (prevent division by zero)  
✅ Pembulatan desimal ke 2 angka di belakang koma  

### Test Case 3: UI Interaction
✅ Mode edit berfungsi dengan baik  
✅ Simpan data ke database  
✅ Cancel edit membatalkan perubahan  
✅ Loading state saat save  
✅ Toast notification success/error  
✅ Auto refresh data setelah save  

---

## 🔧 Maintenance

### Update Existing Data
Jika ada data lama yang perlu diupdate dengan kolom baru:

```sql
-- Set default values untuk data existing
UPDATE skenario_tarif
SET 
  jasa_pelayanan_medis = 0,
  jasa_pelayanan_non_medis = 0
WHERE jasa_pelayanan_medis IS NULL 
   OR jasa_pelayanan_non_medis IS NULL;
```

### Recalculate All Data
Untuk memicu recalculate semua data:

```sql
-- Trigger recalculation dengan update dummy
UPDATE skenario_tarif
SET updated_at = NOW();
```

---

## 📝 Catatan Penting

1. **Kolom Manual Input:**
   - `jasa_sarana`
   - `jasa_pelayanan_medis`
   - `jasa_pelayanan_non_medis`

2. **Kolom Auto-Calculated (JANGAN di-edit manual):**
   - `jasa_pelayanan`
   - `tarif_per_tindakan`
   - `prosentase_jasa_pelayanan`
   - `prosentase_profit`

3. **Trigger akan otomatis berjalan** setiap kali ada INSERT atau UPDATE

4. **Nilai decimal dibulatkan ke 2 angka** di belakang koma untuk persentase

5. **Division by zero handled** dengan return 0 jika denominator = 0

---

## 🎨 UI/UX Improvements

1. **Color Coding:**
   - Profit positif: Badge biru (default)
   - Profit negatif: Badge merah (destructive)
   - Tarif final: Bold dengan warna primary

2. **Inline Editing:**
   - Edit langsung di tabel tanpa modal
   - Input fields dengan styling konsisten
   - Clear visual feedback (Save/Cancel buttons)

3. **Responsive:**
   - Overflow horizontal untuk tabel lebar
   - Truncate text dengan max-width untuk kolom tertentu
   - Font size yang sesuai untuk readability

---

*Dokumentasi dibuat: 8 Oktober 2025*
*Last Updated: Database migration & UI implementation completed*

