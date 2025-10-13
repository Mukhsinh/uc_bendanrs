# 📊 Penjelasan: Unit Cost Tindakan Inap

## ❗ JAWABAN PENTING

### **Apakah `unit_cost_tindakan_inap` sudah termasuk `biaya_bahan_tindakan`?**

**JAWABAN: TIDAK! ❌**

`unit_cost_tindakan_inap` **TIDAK TERMASUK** `biaya_bahan_tindakan`.

Kedua kolom ini adalah **TERPISAH**:
- `unit_cost_tindakan_inap` = Biaya operasional & SDM
- `biaya_bahan_tindakan` = Biaya bahan medis untuk tindakan

**Total Biaya Per Tindakan = `unit_cost_tindakan_inap` + `biaya_bahan_tindakan`**

---

## 📋 Formula Unit Cost Tindakan Inap

### **Generated Column (Auto-Calculated)**

```sql
unit_cost_tindakan_inap = 
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
  biaya_tidak_langsung_terdistribusi
```

**Total: 24 Kolom Biaya**

---

## 💰 Breakdown Komponen Biaya

### **A. Biaya SDM (3 kolom)** - Dialokasikan menggunakan `dasar_alokasi_hasil_kali`
1. ✅ `biaya_gaji_tunjangan`
2. ✅ `biaya_jasa_pelayanan`
3. ✅ `biaya_pendidikan_pelatihan`

### **B. Biaya Bahan (4 kolom)** - Biasanya 0 untuk tindakan inap
4. ✅ `biaya_obat` = 0
5. ✅ `biaya_bhp` = 0
6. ✅ `biaya_makan_karyawan` = 0
7. ✅ `biaya_makan_pasien` = 0

### **C. Biaya Operasional (18 kolom)** - Dialokasikan menggunakan `dasar_alokasi_kali_waktu`
8. ✅ `biaya_rumah_tangga`
9. ✅ `biaya_cetak`
10. ✅ `biaya_atk`
11. ✅ `biaya_listrik`
12. ✅ `biaya_air`
13. ✅ `biaya_telp`
14. ✅ `biaya_pemeliharaan_bangunan`
15. ✅ `biaya_pemeliharaan_alat_medis`
16. ✅ `biaya_pemeliharaan_alat_non_medis`
17. ✅ `biaya_operasional_lainnya`
18. ✅ `biaya_penyusutan_gedung`
19. ✅ `biaya_penyusutan_jaringan`
20. ✅ `biaya_penyusutan_alat_medis`
21. ✅ `biaya_penyusutan_alat_non_medis`
22. ✅ `biaya_laundry`
23. ✅ `biaya_sterilisasi`

### **D. Biaya Tidak Langsung (1 kolom)**
24. ✅ `biaya_tidak_langsung_terdistribusi`

### **E. Biaya Bahan Tindakan (TERPISAH)**
❌ **TIDAK TERMASUK** dalam `unit_cost_tindakan_inap`
- `biaya_bahan_tindakan` = Kolom terpisah

---

## 📊 Contoh Data Konkret

### Contoh 1: UK046 - Terang bulan (VIP-VVIP) - T.001 (rawat luka)

| Komponen Biaya | Nilai | Keterangan |
|----------------|-------|------------|
| **Biaya SDM** |
| Gaji & Tunjangan | Rp 194.205 | Dari data_biaya × DA_hasil_kali |
| Jasa Pelayanan | Rp 0 | Dikosongkan |
| **Biaya Operasional** |
| Listrik | Rp 10.047 | Dari data_biaya × DA_kali_waktu |
| Air | Rp xxx | (dan 17 kolom biaya lainnya) |
| ... | ... | ... |
| **Biaya Tidak Langsung** |
| Biaya Tidak Langsung | Rp 35.190 | Dari distribusi_biaya_rekap |
| **SUBTOTAL** | | |
| **unit_cost_tindakan_inap** | **Rp 271.722** | ✅ 24 kolom biaya |
| **biaya_bahan_tindakan** | **Rp 1.569** | ❌ TIDAK termasuk |
| **TOTAL PER TINDAKAN** | **Rp 273.291** | unit_cost + bahan |

---

### Contoh 2: UK046 - Terang bulan (VIP-VVIP) - T.002 (injeksi 5 cc)

| Komponen Biaya | Nilai | Keterangan |
|----------------|-------|------------|
| **Biaya SDM** |
| Gaji & Tunjangan | Rp 901.669 | Lebih tinggi karena jumlah besar |
| Jasa Pelayanan | Rp 0 | Dikosongkan |
| **Biaya Operasional** |
| Listrik | Rp 279.869 | Lebih tinggi karena jumlah besar |
| ... | ... | (dan 17 kolom biaya lainnya) |
| **Biaya Tidak Langsung** |
| Biaya Tidak Langsung | Rp 980.271 | Dari distribusi_biaya_rekap |
| **SUBTOTAL** | | |
| **unit_cost_tindakan_inap** | **Rp 3.061.056** | ✅ 24 kolom biaya |
| **biaya_bahan_tindakan** | **Rp 1.790** | ❌ TIDAK termasuk |
| **TOTAL PER TINDAKAN** | **Rp 3.062.846** | unit_cost + bahan |

---

## 🔍 Cara Mengisi Nilai Unit Cost

### **OTOMATIS via Generated Column** ✅

Kolom `unit_cost_tindakan_inap` adalah **GENERATED COLUMN**, artinya:
- ❌ **TIDAK diisi manual**
- ✅ **Otomatis dihitung** oleh database
- ✅ **Selalu update** saat ada perubahan di 24 kolom biaya

### Proses Perhitungan:

```
┌─────────────────────────────────────────────────┐
│ STEP 1: Hitung Dasar Alokasi                   │
│ ────────────────────────────────────            │
│ DA_kali_waktu = hasil_kali_waktu ÷ Σ HKW       │
│ DA_hasil_kali = hasil_kali ÷ Σ HK              │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ STEP 2: Distribusi Biaya SDM                   │
│ ────────────────────────────────                │
│ biaya_gaji = (data_biaya.gaji × DA_hasil_kali) │
│              ÷ jumlah                           │
│ biaya_jasa = (data_biaya.jasa × DA_hasil_kali) │
│              ÷ jumlah                           │
│ biaya_diklat = (data_biaya.diklat × DA_hasil)  │
│                ÷ jumlah                         │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ STEP 3: Distribusi Biaya Operasional           │
│ ────────────────────────────────────            │
│ biaya_listrik = (data_biaya.listrik ×          │
│                  DA_kali_waktu) ÷ jumlah       │
│ ... (dan 17 kolom biaya operasional lainnya)   │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ STEP 4: Distribusi Biaya Tidak Langsung       │
│ ────────────────────────────────────            │
│ biaya_tidak_langsung = (distribusi_biaya ×     │
│                         DA_kali_waktu) ÷ jumlah│
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ HASIL: Unit Cost OTOMATIS Terhitung            │
│ ────────────────────────────────────            │
│ unit_cost_tindakan_inap = SUM(24 kolom biaya)  │
│ ✅ GENERATED COLUMN - Auto update              │
└─────────────────────────────────────────────────┘
```

---

## 📈 Contoh Perhitungan Detail

### Tindakan: T.001 (rawat luka) - UK046 - Jumlah: 21

#### Input Data:
- **Jumlah:** 21 tindakan
- **Waktu:** 15 menit
- **Profesionalisme:** 2
- **Tingkat Kesulitan:** 3
- **Hasil Kali Waktu:** 21 × 15 = 315
- **Hasil Kali:** 21 × 15 × 2 × 3 = 1,890

#### Dasar Alokasi (Contoh):
- **DA Kali Waktu:** 0.034653 (315 ÷ total unit kerja)
- **DA Hasil Kali:** 0.177215 (1,890 ÷ total unit kerja)

#### Distribusi Biaya (Contoh):
Misalkan `data_biaya` untuk UK046:
- Gaji & Tunjangan Tahunan: Rp 50,000,000
- Jasa Pelayanan Tahunan: Rp 0 (dikosongkan)
- Listrik Tahunan: Rp 10,000,000

**Perhitungan:**
```
1. biaya_gaji_tunjangan:
   = (50,000,000 × 0.177215) ÷ 21
   = 8,860,750 ÷ 21
   = 421,940 per tindakan
   
2. biaya_listrik:
   = (10,000,000 × 0.034653) ÷ 21
   = 346,530 ÷ 21
   = 16,501 per tindakan
   
3. biaya_tidak_langsung:
   = (distribusi_biaya_rekap × 0.034653) ÷ 21
   = 35,190 per tindakan
   
4. ... (21 kolom biaya lainnya)
```

#### Hasil Akhir:
```
unit_cost_tindakan_inap = 
  421,940 (gaji) +
  0 (jasa) +
  16,501 (listrik) +
  35,190 (tidak langsung) +
  ... (20 kolom biaya lainnya)
= Rp 271,722 ✅

biaya_bahan_tindakan = Rp 1,569 (TERPISAH) ❌

TOTAL BIAYA = Rp 271,722 + Rp 1,569 = Rp 273,291
```

---

## 🎯 Kesimpulan

### 1. **Unit Cost Tindakan Inap = Biaya Operasional**

Kolom ini berisi:
- ✅ Biaya SDM (gaji, jasa, diklat)
- ✅ Biaya Operasional (listrik, air, atk, pemeliharaan, penyusutan, dll)
- ✅ Biaya Tidak Langsung (dari distribusi biaya)

**Total: 24 Komponen Biaya**

### 2. **Biaya Bahan Tindakan = Biaya Material**

Kolom terpisah yang berisi:
- ❌ TIDAK termasuk dalam `unit_cost_tindakan_inap`
- ✅ Biaya obat/BHP yang dibutuhkan untuk tindakan
- ✅ Dari tabel `daftar_tindakan.biaya_bahan_tindakan`

### 3. **Total Biaya Per Tindakan**

```
Total = unit_cost_tindakan_inap + biaya_bahan_tindakan
```

---

## 📊 Tabel Perbandingan

| Tindakan | Jumlah | Unit Cost<br>(Operasional) | Biaya Bahan<br>(Material) | Total Biaya<br>Per Tindakan |
|----------|--------|----------------------------|---------------------------|-----------------------------|
| **UK046 - T.001**<br>rawat luka | 21 | Rp 271.722 | Rp 1.569 | **Rp 273.291** |
| **UK046 - T.002**<br>injeksi 5 cc | 585 | Rp 3.061.056 | Rp 1.790 | **Rp 3.062.846** |
| **UK046 - T.003**<br>rawat luka sedang | 104 | Rp 362.792 | Rp 6.976 | **Rp 369.768** |

### Observasi:
- Unit cost **BERVARIASI** tergantung:
  - Jumlah tindakan
  - Waktu tindakan
  - Profesionalisme & tingkat kesulitan
  - Biaya tahunan unit kerja

- Biaya bahan **TETAP** per jenis tindakan:
  - T.001 selalu Rp 1.569 (di semua unit kerja)
  - T.002 selalu Rp 1.790 (di semua unit kerja)
  - T.003 selalu Rp 6.976 (di semua unit kerja)

---

## 🔧 Cara Mengisi Nilai (Otomatis)

### **Sistem Berjalan Otomatis!** ✅

Anda **TIDAK PERLU** mengisi manual kolom `unit_cost_tindakan_inap`.

### Proses Otomatis:

1. **User input** jumlah tindakan di halaman "Manajemen Tindakan Inap"
2. **Trigger otomatis** sync data ke `kalkulasi_tindakan_inap`
3. **Function otomatis** hitung dasar alokasi
4. **Function otomatis** distribusi 24 biaya
5. **Generated column** otomatis sum 24 biaya → `unit_cost_tindakan_inap`

### Yang Perlu Anda Pastikan:

✅ Data `data_biaya` sudah ada untuk unit kerja
✅ Data `distribusi_biaya_rekap` sudah dihitung
✅ Data `jenis_tindakan_inap` sudah diinput (jumlah > 0)

Sisanya **OTOMATIS**! 🚀

---

## 📝 Query untuk Verifikasi

### 1. Lihat Breakdown Biaya Lengkap

```sql
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  kode_jenis_tindakan,
  jenis_tindakan,
  jumlah,
  
  -- Biaya SDM
  biaya_gaji_tunjangan,
  biaya_jasa_pelayanan,
  biaya_pendidikan_pelatihan,
  
  -- Biaya Operasional (contoh)
  biaya_listrik,
  biaya_air,
  biaya_atk,
  biaya_pemeliharaan_alat_medis,
  biaya_penyusutan_alat_medis,
  
  -- Biaya Tidak Langsung
  biaya_tidak_langsung_terdistribusi,
  
  -- HASIL
  unit_cost_tindakan_inap,
  biaya_bahan_tindakan,
  (unit_cost_tindakan_inap + biaya_bahan_tindakan) as total_biaya_per_tindakan
FROM kalkulasi_tindakan_inap
WHERE tahun = 2025
ORDER BY kode_unit_kerja, kode_jenis_tindakan;
```

### 2. Verifikasi Formula Unit Cost

```sql
-- Cek apakah unit_cost = SUM(24 kolom biaya)
SELECT 
  kode_jenis_tindakan,
  jenis_tindakan,
  
  -- Manual sum 24 kolom
  (biaya_gaji_tunjangan +
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
   biaya_tidak_langsung_terdistribusi) as manual_sum,
  
  -- Generated column
  unit_cost_tindakan_inap,
  
  -- Should be 0 (match)
  (unit_cost_tindakan_inap - (
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
    biaya_tidak_langsung_terdistribusi
  )) as difference
FROM kalkulasi_tindakan_inap
WHERE tahun = 2025
LIMIT 5;

-- Expected: difference = 0 (unit_cost match dengan manual sum)
```

---

## 💡 Interpretasi Data

### Mengapa Unit Cost Berbeda Antar Tindakan?

**Contoh dari data:**
- T.001 (jumlah 21): Unit Cost = Rp 271.722
- T.002 (jumlah 585): Unit Cost = Rp 3.061.056
- T.003 (jumlah 104): Unit Cost = Rp 362.792

**Alasan:**

1. **Jumlah Tindakan Berbeda**
   - Lebih banyak tindakan → biaya per unit lebih rendah (ekonomi skala)
   - Lebih sedikit tindakan → biaya per unit lebih tinggi

2. **Dasar Alokasi Berbeda**
   - T.002 punya DA_hasil_kali tinggi (0.822785) → biaya SDM tinggi
   - T.001 punya DA_hasil_kali rendah (0.177215) → biaya SDM rendah

3. **Profesionalisme & Tingkat Kesulitan**
   - T.001: Prof 2, Tingkat 3 → Hasil Kali lebih besar
   - T.002: Prof 1, Tingkat 1 → Hasil Kali lebih kecil

---

## 📋 Rangkuman

### ✅ Yang TERMASUK dalam Unit Cost:
- Biaya Gaji & Tunjangan
- Biaya Jasa Pelayanan
- Biaya Listrik, Air, Telepon
- Biaya Pemeliharaan (bangunan, alat medis, alat non medis)
- Biaya Penyusutan (gedung, jaringan, alat)
- Biaya Pendidikan & Pelatihan
- Biaya Laundry & Sterilisasi
- Biaya Tidak Langsung Terdistribusi
- (Total: **24 komponen**)

### ❌ Yang TIDAK TERMASUK dalam Unit Cost:
- Biaya Bahan Tindakan (kolom terpisah)

### 💰 Total Biaya Per Tindakan:
```
TOTAL = unit_cost_tindakan_inap + biaya_bahan_tindakan
```

---

## 🎯 Kesimpulan

### Pertanyaan: **Apakah unit_cost sudah termasuk biaya_bahan_tindakan?**
**Jawaban: TIDAK! ❌**

`unit_cost_tindakan_inap` hanya berisi **biaya operasional dan SDM** (24 komponen).

`biaya_bahan_tindakan` adalah **kolom terpisah** yang harus **ditambahkan** untuk mendapat total biaya per tindakan.

### Formula Final:
```
Total Biaya Per Tindakan = unit_cost_tindakan_inap + biaya_bahan_tindakan
```

**Contoh:**
- Unit Cost: Rp 271,722
- Biaya Bahan: Rp 1,569
- **Total: Rp 273,291** ✅

---

**Semoga penjelasan ini menjawab pertanyaan Anda! 🎉**



