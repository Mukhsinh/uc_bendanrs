# 📊 LAPORAN KALKULASI BIAYA OPERATIF - LENGKAP

## 🎯 RINGKASAN PERUBAHAN

Laporan yang diunduh di submenu **Kalkulasi Biaya Operatif** kini menampilkan **SEMUA 42 KOLOM** termasuk **24 komponen biaya lengkap** sesuai dengan struktur database.

---

## 📋 STRUKTUR LAPORAN CSV

### A. INFORMASI DASAR (8 kolom)
| No | Kolom | Tipe Data | Deskripsi |
|----|-------|-----------|-----------|
| 1 | Kode | Text | Kode unik tindakan operatif |
| 2 | Kode Operator | Text | Kode operator/spesialisasi (3.01-3.08) |
| 3 | Nama Operator | Text | Nama operator spesialistik |
| 4 | Kode Tindakan | Text | Kode tindakan operatif |
| 5 | Nama Tindakan | Text | Nama jenis tindakan operatif |
| 6 | Jenis | SmallInt | Kode jenis (1=Rawat Inap, 2=Rawat Jalan, 3=IBS) |
| 7 | Unit Kerja | Text | Kode unit kerja (UK074) |
| 8 | Nama Unit Kerja | Text | Nama unit kerja (IBS) |

### B. DATA AKTIVITAS (4 kolom)
| No | Kolom | Tipe Data | Deskripsi |
|----|-------|-----------|-----------|
| 9 | Jumlah | Integer | Jumlah tindakan yang dilakukan |
| 10 | Waktu Pemeriksaan | Integer | Waktu tindakan (menit) |
| 11 | Profesionalisme | Integer | Skor profesionalisme (1-4) |
| 12 | Tingkat Kesulitan | Integer | Tingkat kesulitan (1-7) |

### C. PERHITUNGAN DASAR (4 kolom)
| No | Kolom | Tipe Data | Rumus | Deskripsi |
|----|-------|-----------|-------|-----------|
| 13 | Hasil Kali | Integer | `profesionalisme × tingkat_kesulitan × waktu_pemeriksaan × jumlah` | Hasil perkalian untuk alokasi biaya |
| 14 | Hasil Kali Waktu | Numeric | `waktu_pemeriksaan × jumlah` | Hasil kali waktu untuk alokasi biaya berbasis waktu |
| 15 | Dasar Alokasi Waktu | Numeric(6) | `hasil_kali_waktu / TOTAL(hasil_kali_waktu)` | Proporsi alokasi berbasis waktu |
| 16 | Dasar Alokasi Hasil Kali | Numeric(6) | `hasil_kali / TOTAL(hasil_kali)` | Proporsi alokasi berbasis hasil kali |

### D. 24 KOMPONEN BIAYA (BigInt)

#### 1. Biaya Langsung SDM
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 17 | Biaya Gaji & Tunjangan | Gaji dan tunjangan pegawai | Hasil Kali |
| 18 | Biaya Jasa Pelayanan | Jasa pelayanan medis | Hasil Kali |

#### 2. Biaya Bahan & Obat
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 19 | Biaya Obat | Biaya obat-obatan | Hasil Kali |
| 20 | Biaya BHP | Bahan Habis Pakai | Hasil Kali |

#### 3. Biaya Makan
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 21 | Biaya Makan Karyawan | Konsumsi karyawan | Waktu |
| 22 | Biaya Makan Pasien | Konsumsi pasien | Waktu |

#### 4. Biaya Operasional Rutin
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 23 | Biaya Rumah Tangga | Kebersihan dan sanitasi | Waktu |
| 24 | Biaya Cetak | Biaya percetakan | Waktu |
| 25 | Biaya ATK | Alat Tulis Kantor | Waktu |

#### 5. Biaya Utilitas
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 26 | Biaya Listrik | Konsumsi listrik | Waktu |
| 27 | Biaya Air | Konsumsi air | Waktu |
| 28 | Biaya Telepon | Komunikasi telepon | Waktu |

#### 6. Biaya Pemeliharaan
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 29 | Biaya Pemeliharaan Bangunan | Maintenance gedung | Waktu |
| 30 | Biaya Pemeliharaan Alat Medis | Maintenance alat medis | Waktu |
| 31 | Biaya Pemeliharaan Alat Non Medis | Maintenance alat non medis | Waktu |
| 32 | Biaya Operasional Lainnya | Operasional lain-lain | Waktu |

#### 7. Biaya Penyusutan
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 33 | Biaya Penyusutan Gedung | Depresiasi bangunan | Waktu |
| 34 | Biaya Penyusutan Jaringan | Depresiasi infrastruktur | Waktu |
| 35 | Biaya Penyusutan Alat Medis | Depresiasi alat medis | Waktu |
| 36 | Biaya Penyusutan Alat Non Medis | Depresiasi alat non medis | Waktu |

#### 8. Biaya Pengembangan & Support
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 37 | Biaya Pendidikan & Pelatihan | Training dan diklat | Waktu |
| 38 | Biaya Laundry | Pencucian linen | Waktu |
| 39 | Biaya Sterilisasi | Sterilisasi alat | Waktu |

#### 9. Biaya Tidak Langsung
| No | Kolom | Deskripsi | Alokasi |
|----|-------|-----------|---------|
| 40 | Biaya Tidak Langsung Terdistribusi | Total biaya tidak langsung yang dialokasikan | Hasil Kali |
| 41 | Biaya Bahan Pemeriksaan | Biaya bahan khusus per tindakan (JSONB) | Manual Input |

### E. HASIL AKHIR (1 kolom)
| No | Kolom | Tipe Data | Rumus | Deskripsi |
|----|-------|-----------|-------|-----------|
| 42 | Unit Cost Per Tindakan | BigInt | `SUM(semua_24_komponen_biaya + biaya_bahan_pemeriksaan)` | **Total biaya per tindakan** |

---

## 🔄 LOGIKA ALOKASI BIAYA

### 1️⃣ Alokasi Berbasis **Hasil Kali** (4 komponen)
Komponen yang dialokasikan berdasarkan intensitas dan kompleksitas:
- Biaya Gaji & Tunjangan
- Biaya Jasa Pelayanan
- Biaya Obat
- Biaya BHP

**Rumus:**
```
Biaya_Tindakan = Biaya_Unit × dasar_alokasi_hasil_kali
```

### 2️⃣ Alokasi Berbasis **Waktu** (19 komponen)
Komponen yang dialokasikan berdasarkan durasi penggunaan:
- Biaya Makan (Karyawan & Pasien)
- Biaya Utilitas (Listrik, Air, Telepon)
- Biaya Pemeliharaan (Bangunan, Alat Medis, Alat Non Medis)
- Biaya Penyusutan (Gedung, Jaringan, Alat)
- Biaya Support (Pendidikan, Laundry, Sterilisasi)
- Dan lainnya...

**Rumus:**
```
Biaya_Tindakan = Biaya_Unit × dasar_alokasi_waktu
```

### 3️⃣ Biaya Tidak Langsung Terdistribusi
Alokasi biaya dari unit pendukung (non-revenue) menggunakan **Hasil Kali**.

### 4️⃣ Biaya Bahan Pemeriksaan
Input manual per tindakan (disimpan dalam JSONB).

---

## 📥 CONTOH OUTPUT LAPORAN

### Sample Data (Top 3 Tindakan Termahal):

#### 1. HERNIORAPHY (3.04.011)
```
Kode: 3.04.011
Operator: 3.04 - Bedah Digestif
Tindakan: HERNIORAPHY
Unit Kerja: UK074 - IBS
Jumlah: 1,001 tindakan
Waktu: 60 menit
Profesionalisme: 4
Kesulitan: 4
Hasil Kali: 960,960

24 Komponen Biaya:
- Gaji & Tunjangan: Rp XXX
- Jasa Pelayanan: Rp XXX
- ... (semua 24 komponen)

Unit Cost Per Tindakan: Rp 1,269,014
```

#### 2. PHACO + IOL (3.08.001)
```
Kode: 3.08.001
Operator: 3.08 - Mata
Tindakan: PHACO + IOL
Unit Kerja: UK074 - IBS
Jumlah: 1,064 tindakan
Waktu: 30 menit
Profesionalisme: 4
Kesulitan: 6
Hasil Kali: 766,080

Unit Cost Per Tindakan: Rp 677,088
```

#### 3. SC (3.03.001)
```
Kode: 3.03.001
Operator: 3.03 - Kebidanan dan Kandungan
Tindakan: SC (Sectio Caesarea)
Unit Kerja: UK074 - IBS
Jumlah: 479 tindakan
Waktu: 60 menit
Profesionalisme: 4
Kesulitan: 6
Hasil Kali: 689,760

Unit Cost Per Tindakan: Rp 1,354,169
```

---

## 🎯 FITUR FILTER LAPORAN

### 1. **Laporan Keseluruhan**
```
File: laporan_kalkulasi_operatif_2025.csv
Isi: Semua 213 tindakan operatif
```

### 2. **Laporan Per Operator**
```
File: laporan_kalkulasi_operatif_2025_operator_3.04.csv
Isi: Hanya tindakan Bedah Digestif
```

### 3. **Laporan Per Tindakan**
```
File: laporan_kalkulasi_operatif_2025_tindakan_3.04.011.csv
Isi: Detail HERNIORAPHY saja
```

---

## 📊 STATISTIK LAPORAN

### Data Summary (Tahun 2025):
- **Total Baris**: 213 tindakan operatif
- **Baris Aktif**: 145 (dengan jumlah > 0)
- **Baris Non-Aktif**: 68 (jumlah = 0)
- **Total Kolom**: 42 kolom
- **Total Komponen Biaya**: 24 komponen

### Kategori Operator (8 grup):
1. **3.01** - Bedah Mulut (17 tindakan)
2. **3.02** - Bedah Saraf (11 tindakan)
3. **3.03** - Bedah Kandungan (24 tindakan)
4. **3.04** - Bedah Digestif (34 tindakan)
5. **3.05** - Bedah Orthopedi (38 tindakan)
6. **3.06** - Bedah Umum (56 tindakan)
7. **3.07** - Bedah THT (16 tindakan)
8. **3.08** - Bedah Mata (17 tindakan)

---

## 💡 KEGUNAAN LAPORAN LENGKAP

### 1. **Analisis Biaya Detail**
- Lihat kontribusi setiap komponen biaya
- Identifikasi komponen biaya terbesar
- Evaluasi efisiensi operasional

### 2. **Benchmarking**
- Bandingkan biaya antar operator
- Bandingkan biaya antar tindakan
- Identifikasi tindakan paling cost-effective

### 3. **Perencanaan Anggaran**
- Proyeksi biaya per tindakan
- Alokasi budget per komponen
- Optimalisasi sumber daya

### 4. **Audit & Compliance**
- Transparansi perhitungan biaya
- Verifikasi alokasi biaya
- Dokumentasi lengkap untuk akreditasi

### 5. **Decision Making**
- Penetapan tarif layanan
- Evaluasi profitabilitas
- Strategi cost recovery

---

## 🔧 CARA MENGGUNAKAN

### Step 1: Buka Aplikasi
```
Menu: Kalkulasi Biaya Operatif
```

### Step 2: Generate Data (jika belum ada)
```
Klik: "Generate Data Awal"
Sistem akan membuat 213 baris tindakan operatif
```

### Step 3: Import Jumlah Tindakan (opsional)
```
1. Unduh Template CSV
2. Isi kolom "Jumlah"
3. Upload file CSV
4. Sistem akan kalkulasi otomatis
```

### Step 4: Unduh Laporan
```
1. Klik: "Unduh Laporan"
2. Pilih filter:
   - Keseluruhan
   - Per Operator Spesialistik
   - Per Jenis Tindakan
3. Klik: "Unduh"
4. File CSV akan terunduh dengan 42 kolom lengkap
```

### Step 5: Analisis di Excel/Spreadsheet
```
1. Buka file CSV
2. Semua 42 kolom akan tampil
3. Gunakan Pivot Table untuk analisis
4. Buat chart untuk visualisasi
```

---

## 📈 CONTOH ANALISIS EXCEL

### Pivot Table 1: Total Biaya Per Operator
```
Rows: Nama Operator
Values: SUM(Unit Cost Per Tindakan)
```

### Pivot Table 2: Breakdown Komponen Biaya
```
Rows: Nama Tindakan
Values: SUM(24 komponen biaya)
Column: Jenis Komponen
```

### Chart 1: Pareto Chart
```
X-Axis: Nama Tindakan
Y-Axis: Unit Cost Per Tindakan
Sorted: Descending
```

### Chart 2: Stacked Bar Chart
```
X-Axis: Nama Operator
Y-Axis: Total Biaya
Breakdown: 24 komponen biaya (warna berbeda)
```

---

## ✅ VALIDASI DATA

### Rumus Excel untuk Validasi:
```excel
// Validasi Unit Cost = Sum 24 Komponen
=SUM(Q2:AO2) = AP2

// Validasi Dasar Alokasi Waktu
=SUM(O:O) = 1

// Validasi Dasar Alokasi Hasil Kali
=SUM(P:P) = 1
```

---

## 📌 CATATAN PENTING

1. **Presisi Desimal**: Dasar alokasi menggunakan 6 angka di belakang koma
2. **Unit Kerja**: Semua tindakan menggunakan UK074 (IBS)
3. **Tahun Data**: Filter otomatis berdasarkan tahun input pengguna
4. **Nilai NULL**: Semua nilai NULL dikonversi ke 0 dalam laporan
5. **Format CSV**: Gunakan encoding UTF-8 untuk karakter Indonesia

---

## 🎉 KESIMPULAN

Laporan **Kalkulasi Biaya Operatif** kini menyediakan:
- ✅ **42 kolom** data lengkap
- ✅ **24 komponen biaya** detail
- ✅ **3 opsi filter** (keseluruhan, operator, tindakan)
- ✅ **Rumus transparan** dan dapat diaudit
- ✅ **Format CSV** standar untuk analisis lanjutan

**Laporan ini adalah alat yang powerful untuk cost analysis, budget planning, dan decision making di unit pelayanan operatif rumah sakit!** 🏥💰📊

---

**Dibuat**: $(Get-Date)  
**Versi**: 2.0 - Complete with All Cost Components  
**Developer**: AI Assistant  
**Status**: ✅ Production Ready

