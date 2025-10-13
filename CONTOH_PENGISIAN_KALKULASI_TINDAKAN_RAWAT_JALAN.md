# Contoh Konkret: Pengisian Data Kalkulasi Tindakan Rawat Jalan

## Skenario Contoh

Misalkan kita punya:
- **Unit Kerja:** UK056 - Klinik Kebid. & Kandungan
- **Tahun:** 2025
- **Tindakan:** T.001 (rawat luka) dan T.002 (injeksi 5 cc)

## Data di Tabel `jenis_tindakan_rawat_jalan`

| Kolom | T.001 | T.002 |
|-------|-------|-------|
| kode_unit_kerja | UK056 | UK056 |
| nama_unit_kerja | Klinik Kebid. & Kandungan | Klinik Kebid. & Kandungan |
| kode_jenis_tindakan | T.001 | T.002 |
| jenis_tindakan | rawat luka | injeksi 5 cc |
| jumlah | 21 | 585 |
| waktu | 15 | 15 |
| profesionalisme | 2 | 1 |
| tingkat_kesulitan | 3 | 1 |
| hasil_kali_waktu | 315 (21×15) | 8,775 (585×15) |
| hasil_kali | 1,890 (21×15×2×3) | 8,775 (585×15×1×1) |
| biaya_bahan_tindakan | 1,569 | 1,790 |

## Step 1: Generate Data Awal

```sql
-- Data awal akan ter-copy dari jenis_tindakan_rawat_jalan
INSERT INTO kalkulasi_tindakan_rawat_jalan (
  user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
  kode_jenis_tindakan, jenis_tindakan, jumlah, waktu, 
  profesionalisme, tingkat_kesulitan, hasil_kali_waktu, 
  hasil_kali, biaya_bahan_tindakan, kali_bahan
)
VALUES
  -- Tindakan T.001
  ('USER_ID', 2025, 1, 'UK056', 'Klinik Kebid. & Kandungan',
   'T.001', 'rawat luka', 21, 15, 2, 3, 315, 1890, 1569, 32949),
  
  -- Tindakan T.002  
  ('USER_ID', 2025, 1, 'UK056', 'Klinik Kebid. & Kandungan',
   'T.002', 'injeksi 5 cc', 585, 15, 1, 1, 8775, 8775, 1790, 1047150);
```

**Hasil:**
| id | kode_jenis_tindakan | jumlah | hasil_kali_waktu | hasil_kali | kali_bahan |
|----|---------------------|--------|------------------|------------|------------|
| uuid-1 | T.001 | 21 | 315 | 1,890 | 32,949 |
| uuid-2 | T.002 | 585 | 8,775 | 8,775 | 1,047,150 |

## Step 2: Hitung Dasar Alokasi

### Total untuk Unit Kerja UK056:
- **Total hasil_kali_waktu** = 315 + 8,775 = 9,090
- **Total hasil_kali** = 1,890 + 8,775 = 10,665

### Perhitungan T.001:
```
dasar_alokasi_kali_waktu = 315 ÷ 9,090 = 0.034653 (6 desimal)
dasar_alokasi_hasil_kali = 1,890 ÷ 10,665 = 0.177215 (6 desimal)
```

### Perhitungan T.002:
```
dasar_alokasi_kali_waktu = 8,775 ÷ 9,090 = 0.965347 (6 desimal)
dasar_alokasi_hasil_kali = 8,775 ÷ 10,665 = 0.822785 (6 desimal)
```

**Query:**
```sql
UPDATE kalkulasi_tindakan_rawat_jalan
SET 
  dasar_alokasi_kali_waktu = ROUND((hasil_kali_waktu::NUMERIC / 9090), 6),
  dasar_alokasi_hasil_kali = ROUND((hasil_kali::NUMERIC / 10665), 6)
WHERE user_id = 'USER_ID' 
  AND tahun = 2025 
  AND kode_unit_kerja = 'UK056';
```

**Hasil:**
| kode_tindakan | dasar_alokasi_kali_waktu | dasar_alokasi_hasil_kali |
|---------------|--------------------------|--------------------------|
| T.001 | 0.034653 | 0.177215 |
| T.002 | 0.965347 | 0.822785 |

## Step 3: Distribusi Biaya SDM

Misalkan dari tabel `data_biaya` untuk UK056:
- biaya_gaji_tunjangan = Rp 50,000,000
- biaya_jasa_pelayanan = Rp 30,000,000
- biaya_pendidikan_pelatihan = Rp 5,000,000

### Perhitungan T.001 (jumlah = 21):
```
biaya_gaji_tunjangan = (50,000,000 × 0.177215) ÷ 21 = 421,940
biaya_jasa_pelayanan = (30,000,000 × 0.177215) ÷ 21 = 253,164
biaya_pendidikan_pelatihan = (5,000,000 × 0.177215) ÷ 21 = 42,194
```

### Perhitungan T.002 (jumlah = 585):
```
biaya_gaji_tunjangan = (50,000,000 × 0.822785) ÷ 585 = 70,374
biaya_jasa_pelayanan = (30,000,000 × 0.822785) ÷ 585 = 42,224
biaya_pendidikan_pelatihan = (5,000,000 × 0.822785) ÷ 585 = 7,037
```

**Query:**
```sql
UPDATE kalkulasi_tindakan_rawat_jalan kt
SET 
  biaya_gaji_tunjangan = ROUND((50000000 * kt.dasar_alokasi_hasil_kali / kt.jumlah)::NUMERIC),
  biaya_jasa_pelayanan = ROUND((30000000 * kt.dasar_alokasi_hasil_kali / kt.jumlah)::NUMERIC),
  biaya_pendidikan_pelatihan = ROUND((5000000 * kt.dasar_alokasi_hasil_kali / kt.jumlah)::NUMERIC)
WHERE kt.user_id = 'USER_ID'
  AND kt.tahun = 2025
  AND kt.kode_unit_kerja = 'UK056';
```

**Hasil:**
| kode_tindakan | biaya_gaji_tunjangan | biaya_jasa_pelayanan | biaya_pendidikan_pelatihan |
|---------------|----------------------|----------------------|----------------------------|
| T.001 | 421,940 | 253,164 | 42,194 |
| T.002 | 70,374 | 42,224 | 7,037 |

## Step 4: Distribusi Biaya Operasional

Misalkan dari tabel `data_biaya` untuk UK056:
- biaya_listrik = Rp 10,000,000
- biaya_air = Rp 3,000,000
- biaya_atk = Rp 2,000,000
- ... (18 kolom biaya operasional lainnya)

### Perhitungan T.001 (dasar_alokasi_kali_waktu = 0.034653, jumlah = 21):
```
biaya_listrik = (10,000,000 × 0.034653) ÷ 21 = 16,501
biaya_air = (3,000,000 × 0.034653) ÷ 21 = 4,950
biaya_atk = (2,000,000 × 0.034653) ÷ 21 = 3,300
```

### Perhitungan T.002 (dasar_alokasi_kali_waktu = 0.965347, jumlah = 585):
```
biaya_listrik = (10,000,000 × 0.965347) ÷ 585 = 16,502
biaya_air = (3,000,000 × 0.965347) ÷ 585 = 4,951
biaya_atk = (2,000,000 × 0.965347) ÷ 585 = 3,300
```

**Query:**
```sql
UPDATE kalkulasi_tindakan_rawat_jalan kt
SET 
  biaya_listrik = ROUND((10000000 * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC),
  biaya_air = ROUND((3000000 * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC),
  biaya_atk = ROUND((2000000 * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC)
  -- ... tambahkan 15 kolom biaya operasional lainnya
WHERE kt.user_id = 'USER_ID'
  AND kt.tahun = 2025
  AND kt.kode_unit_kerja = 'UK056';
```

**Hasil:**
| kode_tindakan | biaya_listrik | biaya_air | biaya_atk |
|---------------|---------------|-----------|-----------|
| T.001 | 16,501 | 4,950 | 3,300 |
| T.002 | 16,502 | 4,951 | 3,300 |

## Step 5: Distribusi Biaya Tidak Langsung

Misalkan dari tabel `distribusi_biaya_rekap` untuk UK056:
- Kolom: `uk056_klinik_kebid_kandungan`
- Baris: "Biaya Tidak Langsung Terdistribusi"
- Nilai: Rp 20,000,000

### Perhitungan T.001:
```
biaya_tidak_langsung = (20,000,000 × 0.034653) ÷ 21 = 33,003
```

### Perhitungan T.002:
```
biaya_tidak_langsung = (20,000,000 × 0.965347) ÷ 585 = 33,003
```

**Query:**
```sql
UPDATE kalkulasi_tindakan_rawat_jalan kt
SET biaya_tidak_langsung_terdistribusi = 
  ROUND((20000000 * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC)
WHERE kt.user_id = 'USER_ID'
  AND kt.tahun = 2025
  AND kt.kode_unit_kerja = 'UK056';
```

**Hasil:**
| kode_tindakan | biaya_tidak_langsung_terdistribusi |
|---------------|------------------------------------|
| T.001 | 33,003 |
| T.002 | 33,003 |

## Hasil Akhir: Unit Cost

Setelah semua biaya terdistribusi, kolom `unit_cost_tindakan_rawat_jalan` akan **otomatis terhitung** (generated column):

### T.001 - rawat luka:
```
unit_cost = 
  biaya_gaji_tunjangan (421,940) +
  biaya_jasa_pelayanan (253,164) +
  biaya_pendidikan_pelatihan (42,194) +
  biaya_listrik (16,501) +
  biaya_air (4,950) +
  biaya_atk (3,300) +
  ... (15 kolom biaya operasional lainnya) +
  biaya_tidak_langsung (33,003)
= Rp 775,052 per tindakan (contoh)

Total dengan bahan = 775,052 + 1,569 = Rp 776,621
```

### T.002 - injeksi 5 cc:
```
unit_cost = 
  biaya_gaji_tunjangan (70,374) +
  biaya_jasa_pelayanan (42,224) +
  biaya_pendidikan_pelatihan (7,037) +
  biaya_listrik (16,502) +
  biaya_air (4,951) +
  biaya_atk (3,300) +
  ... (15 kolom biaya operasional lainnya) +
  biaya_tidak_langsung (33,003)
= Rp 177,391 per tindakan (contoh)

Total dengan bahan = 177,391 + 1,790 = Rp 179,181
```

## Query Lengkap untuk Melihat Hasil

```sql
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  kode_jenis_tindakan,
  jenis_tindakan,
  jumlah,
  waktu,
  profesionalisme,
  tingkat_kesulitan,
  hasil_kali_waktu,
  hasil_kali,
  ROUND(dasar_alokasi_kali_waktu, 6) as dasar_alokasi_waktu,
  ROUND(dasar_alokasi_hasil_kali, 6) as dasar_alokasi_hasil,
  biaya_bahan_tindakan,
  biaya_gaji_tunjangan,
  biaya_jasa_pelayanan,
  biaya_listrik,
  biaya_tidak_langsung_terdistribusi,
  unit_cost_tindakan_rawat_jalan,
  (unit_cost_tindakan_rawat_jalan + biaya_bahan_tindakan) as total_unit_cost
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = 'USER_ID'
  AND tahun = 2025
  AND kode_unit_kerja = 'UK056'
ORDER BY kode_jenis_tindakan;
```

## Tabel Ringkasan Hasil Akhir

| Field | T.001 (rawat luka) | T.002 (injeksi 5 cc) |
|-------|-------------------|----------------------|
| **Data Tindakan** |
| Jumlah | 21 | 585 |
| Waktu (menit) | 15 | 15 |
| Profesionalisme | 2 | 1 |
| Tingkat Kesulitan | 3 | 1 |
| Hasil Kali Waktu | 315 | 8,775 |
| Hasil Kali | 1,890 | 8,775 |
| **Dasar Alokasi** |
| DA Kali Waktu | 0.034653 | 0.965347 |
| DA Hasil Kali | 0.177215 | 0.822785 |
| **Biaya Terdistribusi** |
| Gaji & Tunjangan | 421,940 | 70,374 |
| Jasa Pelayanan | 253,164 | 42,224 |
| Listrik | 16,501 | 16,502 |
| Air | 4,950 | 4,951 |
| ATK | 3,300 | 3,300 |
| Tidak Langsung | 33,003 | 33,003 |
| ... (biaya lainnya) | ... | ... |
| **Unit Cost** |
| Unit Cost | 775,052 | 177,391 |
| Biaya Bahan | 1,569 | 1,790 |
| **Total Unit Cost** | **776,621** | **179,181** |

## Catatan Penting

1. ✅ Semua nilai **biaya_bahan_tindakan** sudah include biaya obat/BHP yang dibutuhkan untuk tindakan
2. ✅ **Unit Cost** = Biaya SDM + Biaya Operasional + Biaya Tidak Langsung (tanpa bahan)
3. ✅ **Total Unit Cost** = Unit Cost + Biaya Bahan Tindakan
4. ✅ Nilai di kolom biaya akan **berbeda antar tindakan** tergantung:
   - Proporsi dasar alokasi (hasil_kali_waktu & hasil_kali)
   - Jumlah tindakan yang dilakukan
5. ✅ Semakin banyak jumlah tindakan, semakin **rendah biaya per tindakan** (ekonomi skala)



