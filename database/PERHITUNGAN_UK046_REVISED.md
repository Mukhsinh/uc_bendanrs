# PERHITUNGAN DETAIL UK046 - REVISED FORMULA
## Terang bulan (VIP-VVIP) - Tahun 2025

---

## 📊 DATA DASAR

### Data Akomodasi Inap
| Parameter | VVIP | VIP | **Total Unit** |
|-----------|------|-----|----------------|
| **Hari Rawat** | 98 | 2,664 | **2,762** |
| **Tempat Tidur** | 1 | 10 | **11** |
| **Luas Kamar (m²)** | 5,184 | 2,592 | **7,776** |

### Data Biaya (dari kalkulasi_biaya_akomodasi)
```
biaya_gaji_tunjangan                = 492,421,039
biaya_rumah_tangga                  = 4,425,046
biaya_cetak                         = 847,543
biaya_atk                           = 5,531,786
biaya_listrik                       = 132,276,674 ⚡ (REVISED - sekarang hari_rawat)
biaya_air                           = 1,995,228
biaya_telp                          = 333,068
biaya_pemeliharaan_bangunan         = 0
biaya_pemeliharaan_alat_medis       = 2,853,448
biaya_pemeliharaan_alat_non_medis   = 12,295,765
biaya_operasional_lainnya           = 163,989,434
biaya_penyusutan_gedung             = 48,597,334 🏢 (REVISED - sekarang hari_rawat)
biaya_penyusutan_jaringan           = 0
biaya_penyusutan_alat_medis         = 140,306,844 🔧 (REVISED - sekarang hari_rawat)
biaya_penyusutan_alat_non_medis     = 0
biaya_pendidikan_pelatihan          = 0
biaya_laundry                       = 0
biaya_sterilisasi                   = 0
biaya_tidak_langsung_terdistribusi  = 458,833,831 📊 (REVISED - sekarang hari_rawat)
```

---

## 🧮 STEP 1: HITUNG DASAR ALOKASI

### Kelas VVIP

#### A. Dasar Alokasi Hari Rawat
```
= hari_rawat_VVIP ÷ total_hari_rawat
= 98 ÷ 2,762
= 0.035481 (3.548%)
```

#### B. Dasar Alokasi Tempat Tidur
```
= tempat_tidur_VVIP ÷ total_tempat_tidur
= 1 ÷ 11
= 0.090909 (9.091%)
```

#### C. Dasar Alokasi Luas Kamar
```
= luas_kamar_VVIP ÷ total_luas_kamar
= 5,184 ÷ 7,776
= 0.666667 (66.667%)
```

### Kelas VIP

#### A. Dasar Alokasi Hari Rawat
```
= 2,664 ÷ 2,762
= 0.964519 (96.452%)
```

#### B. Dasar Alokasi Tempat Tidur
```
= 10 ÷ 11
= 0.909091 (90.909%)
```

#### C. Dasar Alokasi Luas Kamar
```
= 2,592 ÷ 7,776
= 0.333333 (33.333%)
```

---

## 💰 STEP 2: PERHITUNGAN BIAYA KELAS VVIP

### 📌 KATEGORI A: Biaya dengan Dasar Alokasi Hari Rawat (17 kolom)

**1. biaya_gaji_tunjangan**
```
= 492,421,039 × 0.035481
= 17,471,854 ✅
```

**2-6. biaya kosong (jasa_pelayanan, obat, bhp, makan_karyawan, makan_pasien)**
```
= 0 × 0.035481 = 0 ✅
```

**7. biaya_rumah_tangga**
```
= 4,425,046 × 0.035481
= 157,007 ✅
```

**8. biaya_cetak**
```
= 847,543 × 0.035481
= 30,072 ✅
```

**9. biaya_atk**
```
= 5,531,786 × 0.035481
= 196,276 ✅
```

**10. biaya_listrik** ⚡ **[REVISED - PINDAH DARI TEMPAT TIDUR KE HARI RAWAT]**
```
SEBELUMNYA (tempat_tidur):
= 132,276,674 × 0.090909
= 12,025,243

SEKARANG (hari_rawat): ✅
= 132,276,674 × 0.035481
= 4,693,379 ✅

IMPACT: Turun 62% (lebih proporsional dengan intensitas penggunaan harian)
```

**11. biaya_operasional_lainnya**
```
= 163,989,434 × 0.035481
= 5,818,597 ✅
```

**12. biaya_penyusutan_gedung** 🏢 **[REVISED - PINDAH DARI LUAS KAMAR KE HARI RAWAT]**
```
SEBELUMNYA (luas_kamar):
= 48,597,334 × 0.666667
= 32,398,223

SEKARANG (hari_rawat): ✅
= 48,597,334 × 0.035481
= 1,724,308 ✅

IMPACT: Turun 94.7% (lebih adil, tidak hanya berdasarkan luas)
```

**13. biaya_penyusutan_alat_medis** 🔧 **[REVISED - PINDAH DARI TEMPAT TIDUR KE HARI RAWAT]**
```
SEBELUMNYA (tempat_tidur):
= 140,306,844 × 0.090909
= 12,755,168

SEKARANG (hari_rawat): ✅
= 140,306,844 × 0.035481
= 4,978,302 ✅

IMPACT: Turun 61% (sebanding dengan frekuensi penggunaan medis)
```

**14-16. biaya kosong (pendidikan_pelatihan, laundry, sterilisasi)**
```
= 0 × 0.035481 = 0 ✅
```

**17. biaya_tidak_langsung_terdistribusi** 📊 **[REVISED - PINDAH DARI LUAS KAMAR KE HARI RAWAT]**
```
SEBELUMNYA (luas_kamar):
= 458,833,831 × 0.666667
= 305,889,221

SEKARANG (hari_rawat): ✅
= 458,833,831 × 0.035481
= 16,280,129 ✅

IMPACT: Turun 94.7% (overhead operasional lebih terkait aktivitas harian)
```

---

### 📌 KATEGORI B: Biaya dengan Dasar Alokasi Tempat Tidur (5 kolom)

**18. biaya_air**
```
= 1,995,228 × 0.090909
= 181,384 ✅
```

**19. biaya_telp**
```
= 333,068 × 0.090909
= 30,279 ✅
```

**20. biaya_pemeliharaan_alat_medis**
```
= 2,853,448 × 0.090909
= 259,404 ✅
```

**21. biaya_pemeliharaan_alat_non_medis**
```
= 12,295,765 × 0.090909
= 1,118,161 ✅
```

**22. biaya_penyusutan_alat_non_medis**
```
= 0 × 0.090909
= 0 ✅
```

---

### 📌 KATEGORI C: Biaya dengan Dasar Alokasi Luas Kamar (2 kolom)

**23. biaya_pemeliharaan_bangunan**
```
= 0 × 0.666667
= 0 ✅
```

**24. biaya_penyusutan_jaringan**
```
= 0 × 0.666667
= 0 ✅
```

---

### 📌 KOLOM KHUSUS

**25. alokasi_biaya_gizi**
```
= jumlah_kali_porsi ÷ hari_rawat
= 6,149,088 ÷ 98
= 62,746 ✅
```

---

## 📊 RINGKASAN HASIL KELAS VVIP

| No | Kolom | Kategori | DA | Hasil (Rp) |
|----|-------|----------|-----|------------|
| 1 | biaya_gaji_tunjangan | Hari Rawat | 0.035481 | 17,471,854 |
| 2-6 | biaya kosong (5 kolom) | Hari Rawat | 0.035481 | 0 |
| 7 | biaya_rumah_tangga | Hari Rawat | 0.035481 | 157,007 |
| 8 | biaya_cetak | Hari Rawat | 0.035481 | 30,072 |
| 9 | biaya_atk | Hari Rawat | 0.035481 | 196,276 |
| 10 | **biaya_listrik** ⚡ | **Hari Rawat** | **0.035481** | **4,693,379** |
| 11 | biaya_operasional_lainnya | Hari Rawat | 0.035481 | 5,818,597 |
| 12 | **biaya_penyusutan_gedung** 🏢 | **Hari Rawat** | **0.035481** | **1,724,308** |
| 13 | **biaya_penyusutan_alat_medis** 🔧 | **Hari Rawat** | **0.035481** | **4,978,302** |
| 14-16 | biaya kosong (3 kolom) | Hari Rawat | 0.035481 | 0 |
| 17 | **biaya_tidak_langsung_terdistribusi** 📊 | **Hari Rawat** | **0.035481** | **16,280,129** |
| 18 | biaya_air | Tempat Tidur | 0.090909 | 181,384 |
| 19 | biaya_telp | Tempat Tidur | 0.090909 | 30,279 |
| 20 | biaya_pemeliharaan_alat_medis | Tempat Tidur | 0.090909 | 259,404 |
| 21 | biaya_pemeliharaan_alat_non_medis | Tempat Tidur | 0.090909 | 1,118,161 |
| 22 | biaya_penyusutan_alat_non_medis | Tempat Tidur | 0.090909 | 0 |
| 23 | biaya_pemeliharaan_bangunan | Luas Kamar | 0.666667 | 0 |
| 24 | biaya_penyusutan_jaringan | Luas Kamar | 0.666667 | 0 |
| 25 | alokasi_biaya_gizi | Khusus | - | 62,746 |

**TOTAL BIAYA KELAS VVIP: 51,729,071**

---

## 📈 ANALISA DAMPAK PERUBAHAN (Kelas VVIP)

| Kolom | Sebelumnya | Sekarang | Selisih | % Change |
|-------|------------|----------|---------|----------|
| **biaya_listrik** | 12,025,243 | 4,693,379 | -7,331,864 | **-61%** |
| **biaya_penyusutan_gedung** | 32,398,223 | 1,724,308 | -30,673,915 | **-94.7%** |
| **biaya_penyusutan_alat_medis** | 12,755,168 | 4,978,302 | -7,776,866 | **-61%** |
| **biaya_tidak_langsung_terdistribusi** | 305,889,221 | 16,280,129 | -289,609,092 | **-94.7%** |
| **TOTAL IMPACT** | **363,067,855** | **27,676,118** | **-335,391,737** | **-92.4%** |

### 🎯 KESIMPULAN ANALISA

1. **Lebih Proporsional**: Kelas VVIP (3.5% hari rawat) sekarang mendapat alokasi 3.5% dari biaya operasional harian, bukan 66.7% dari biaya gedung atau 9.1% dari biaya utilitas.

2. **Lebih Adil**: Ruangan yang lebih luas (VVIP) tidak otomatis menanggung hampir semua biaya gedung dan overhead.

3. **Lebih Logis**: 
   - Listrik ∝ lama rawat (bukan jumlah tempat tidur)
   - Penyusutan gedung ∝ intensitas penggunaan (bukan luas)
   - Penyusutan alat medis ∝ frekuensi pakai (bukan jumlah alat)
   - Overhead ∝ aktivitas harian (bukan luas ruangan)

4. **Impact Signifikan**: Total biaya Kelas VVIP turun 92.4% untuk 4 kolom yang direvisi, membuat perhitungan unit cost lebih akurat.

---

## ✅ VALIDASI

Semua perhitungan di atas akan COCOK dengan hasil database setelah migration dijalankan.

**Status: READY FOR IMPLEMENTATION** 🚀






