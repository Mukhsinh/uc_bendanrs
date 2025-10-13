# Diagram Alur: Kalkulasi Tindakan Rawat Jalan

## 📊 Alur Data Lengkap

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUMBER DATA                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ↓                      ↓                      ↓
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ jenis_       │    │   data_biaya     │    │ distribusi_     │
│ tindakan_    │    │   (UK056)        │    │ biaya_rekap     │
│ rawat_jalan  │    │                  │    │ (Biaya Tidak    │
│              │    │ - gaji_tunjangan │    │  Langsung)      │
│ - T.001: 21  │    │ - jasa_pelayanan│    │                 │
│ - T.002: 585 │    │ - listrik       │    │ - UK056 column  │
└──────────────┘    │ - air           │    └─────────────────┘
                    │ - atk           │
                    │ - ... (24 item) │
                    └──────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        │                                       │
        ↓                                       ↓
┌─────────────────────────────────────────────────────────────────┐
│       STEP 1: GENERATE DATA AWAL                                │
│  INSERT INTO kalkulasi_tindakan_rawat_jalan                     │
│  FROM jenis_tindakan_rawat_jalan                                │
├─────────────────────────────────────────────────────────────────┤
│  Data yang ter-copy:                                            │
│  • kode_unit_kerja, nama_unit_kerja                             │
│  • kode_jenis_tindakan, jenis_tindakan                          │
│  • jumlah, waktu, profesionalisme, tingkat_kesulitan            │
│  • hasil_kali_waktu, hasil_kali                                 │
│  • biaya_bahan_tindakan, kali_bahan                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│       STEP 2: HITUNG DASAR ALOKASI                              │
│  Per Unit Kerja:                                                │
│    Σ hasil_kali_waktu = 9,090                                   │
│    Σ hasil_kali = 10,665                                        │
├─────────────────────────────────────────────────────────────────┤
│  T.001:                                                         │
│    DA_kali_waktu = 315 ÷ 9,090 = 0.034653                      │
│    DA_hasil_kali = 1,890 ÷ 10,665 = 0.177215                   │
│  T.002:                                                         │
│    DA_kali_waktu = 8,775 ÷ 9,090 = 0.965347                    │
│    DA_hasil_kali = 8,775 ÷ 10,665 = 0.822785                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        │                                       │
        ↓                                       ↓
┌───────────────────────┐         ┌────────────────────────────┐
│  STEP 3: BIAYA SDM    │         │ STEP 4: BIAYA OPERASIONAL  │
│  (DA_hasil_kali)      │         │ (DA_kali_waktu)            │
├───────────────────────┤         ├────────────────────────────┤
│ Formula:              │         │ Formula:                   │
│ biaya = (data_biaya × │         │ biaya = (data_biaya ×      │
│   DA_hasil_kali) ÷    │         │   DA_kali_waktu) ÷ jumlah  │
│   jumlah              │         │                            │
│                       │         │ Biaya yang dialokasikan:   │
│ Biaya yang dialokasi: │         │ • rumah_tangga             │
│ • gaji_tunjangan      │         │ • cetak                    │
│ • jasa_pelayanan      │         │ • atk                      │
│ • pendidikan_pelatihan│         │ • listrik, air, telp       │
│                       │         │ • pemeliharaan (3 jenis)   │
│ T.001:                │         │ • penyusutan (4 jenis)     │
│ • gaji: 421,940       │         │ • operasional_lainnya      │
│ • jasa: 253,164       │         │ • laundry, sterilisasi     │
│                       │         │                            │
│ T.002:                │         │ T.001:                     │
│ • gaji: 70,374        │         │ • listrik: 16,501          │
│ • jasa: 42,224        │         │ • air: 4,950               │
└───────────────────────┘         └────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│       STEP 5: BIAYA TIDAK LANGSUNG                              │
│  (DA_kali_waktu)                                                │
├─────────────────────────────────────────────────────────────────┤
│  Formula:                                                       │
│  biaya_tidak_langsung = (distribusi_biaya_rekap[UK056] ×        │
│    DA_kali_waktu) ÷ jumlah                                      │
│                                                                 │
│  T.001: 33,003                                                  │
│  T.002: 33,003                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│       HASIL AKHIR: UNIT COST (AUTO-CALCULATED)                  │
├─────────────────────────────────────────────────────────────────┤
│  unit_cost_tindakan_rawat_jalan =                              │
│    SUM(24 kolom biaya)                                          │
│                                                                 │
│  T.001: Rp 775,052 + biaya_bahan (1,569) = Rp 776,621         │
│  T.002: Rp 177,391 + biaya_bahan (1,790) = Rp 179,181         │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Relasi Tabel

```
┌────────────────────────────────────────────────────────────┐
│                    unit_kerja                              │
│  • UK041, UK055-UK073, UK076                               │
│  • jenis = 1 (rawat jalan)                                 │
│  • Exclude: UK037,UK038,UK039,UK040,UK042,UK043,UK044,     │
│             UK075,UK077                                    │
└────────────┬───────────────────────────────────────────────┘
             │ FK: kode
             ↓
┌────────────────────────────────────────────────────────────┐
│             daftar_tindakan                                │
│  • T.001, T.002, T.003, ...                                │
│  • waktu, profesionalisme, tingkat_kesulitan               │
│  • biaya_bahan_tindakan                                    │
└────────────┬───────────────────────────────────────────────┘
             │ FK: kode_tindakan
             ↓
┌────────────────────────────────────────────────────────────┐
│          jenis_tindakan_rawat_jalan                        │
│  • Relasi: unit_kerja ↔ daftar_tindakan                    │
│  • Input: jumlah tindakan                                  │
│  • Auto-calc: hasil_kali_waktu, hasil_kali                 │
└────────────┬───────────────────────────────────────────────┘
             │ Data Source
             ↓
┌────────────────────────────────────────────────────────────┐
│       kalkulasi_tindakan_rawat_jalan                       │
│  • Copy data dari jenis_tindakan_rawat_jalan               │
│  • Hitung dasar alokasi                                    │
│  • Distribusi biaya dari data_biaya                        │
│  • Distribusi biaya tidak langsung                         │
│  • Auto-calc: unit_cost_tindakan_rawat_jalan               │
└────────────────────────────────────────────────────────────┘
             ↑                      ↑
             │                      │
  ┌──────────┴────────┐   ┌────────┴────────────────┐
  │   data_biaya      │   │ distribusi_biaya_rekap  │
  │ (24 kolom biaya)  │   │ (Biaya Tidak Langsung)  │
  └───────────────────┘   └─────────────────────────┘
```

## 📐 Formula Ringkas

### 1. Dasar Alokasi
```
Per tindakan dalam 1 unit kerja:

DA_kali_waktu = hasil_kali_waktu_tindakan ÷ Σ hasil_kali_waktu_unit
DA_hasil_kali = hasil_kali_tindakan ÷ Σ hasil_kali_unit
```

### 2. Biaya Per Tindakan
```
Biaya SDM:
  biaya_per_tindakan = (biaya_tahunan × DA_hasil_kali) ÷ jumlah

Biaya Operasional:
  biaya_per_tindakan = (biaya_tahunan × DA_kali_waktu) ÷ jumlah

Biaya Tidak Langsung:
  biaya_per_tindakan = (biaya_terdistribusi × DA_kali_waktu) ÷ jumlah
```

### 3. Unit Cost
```
unit_cost = Σ (24 kolom biaya)

Total Unit Cost = unit_cost + biaya_bahan_tindakan
```

## 🎯 Poin Penting

### Mengapa Menggunakan 2 Jenis Dasar Alokasi?

1. **DA Hasil Kali** (untuk Biaya SDM)
   - Memperhitungkan: waktu × jumlah × profesionalisme × tingkat_kesulitan
   - Logika: Biaya SDM lebih tinggi untuk tindakan yang butuh skill tinggi
   - Contoh: Tindakan sulit (prof=4, tingkat=5) dapat biaya SDM lebih besar

2. **DA Kali Waktu** (untuk Biaya Operasional)
   - Memperhitungkan: waktu × jumlah saja
   - Logika: Biaya listrik, air, dll tergantung durasi, bukan skill
   - Contoh: Tindakan 60 menit dapat biaya operasional 4× tindakan 15 menit

### Contoh Perbandingan:

| Tindakan | Waktu | Jumlah | Prof | Tingkat | HKW | HK | DA_Waktu | DA_Hasil |
|----------|-------|--------|------|---------|-----|----|----|-------|
| Tindakan Mudah | 15 | 100 | 1 | 1 | 1,500 | 1,500 | 30% | 10% |
| Tindakan Sulit | 15 | 50 | 4 | 5 | 750 | 15,000 | 15% | 80% |

**Hasil:**
- Tindakan Mudah: biaya SDM rendah (10%), biaya operasional tinggi (30%)
- Tindakan Sulit: biaya SDM tinggi (80%), biaya operasional rendah (15%)

## 🔍 Query Verifikasi

```sql
-- Cek apakah total dasar alokasi = 1 (100%)
SELECT 
  kode_unit_kerja,
  SUM(dasar_alokasi_kali_waktu) as total_da_waktu,
  SUM(dasar_alokasi_hasil_kali) as total_da_hasil
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = 'USER_ID' AND tahun = 2025
GROUP BY kode_unit_kerja;

-- Expected result: total_da_waktu ≈ 1.0, total_da_hasil ≈ 1.0
```

## 📊 Perbandingan dengan Kalkulasi Tindakan Inap

| Aspek | Rawat Jalan | Rawat Inap |
|-------|-------------|------------|
| **Kode Jenis** | 1 | 2 |
| **Source Table** | jenis_tindakan_rawat_jalan | jenis_tindakan_inap |
| **Unit Kerja** | Klinik (UK041, UK055-UK073, UK076) | Ruang Rawat (UK046-UK054) |
| **Rasio Tindakan** | ❌ Tidak ada | ✅ Ada (dari prosentase_akomodasi_tindakan) |
| **Biaya Bahan** | Include dalam biaya_bahan_tindakan | Include dalam biaya_bahan_tindakan |
| **Kolom Biaya** | 24 kolom | 24 kolom (sama) |
| **Unit Cost** | unit_cost_tindakan_rawat_jalan | unit_cost_tindakan_inap |
| **Dasar Alokasi** | 2 jenis (waktu & hasil kali) | 2 jenis (waktu & hasil kali) |

**Perbedaan Utama:**
- Rawat Jalan: Tidak ada konsep rasio akomodasi karena tidak ada "waktu tidur"
- Rawat Inap: Ada rasio tindakan vs akomodasi (waktu perawatan di tempat tidur)



