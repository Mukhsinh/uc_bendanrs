# Database Structure - Quick Reference

## 📊 Ringkasan Struktur Database

### Total Tabel: 43+
- **Master Data**: 14 tabel
- **Transaksi**: 3 tabel  
- **Kalkulasi**: 8 tabel
- **Distribusi Biaya**: 3 tabel
- **Output & Reporting**: 7 tabel
- **Views**: 1+ view
- **Stored Procedures**: 8+ functions

---

## 🗂️ Kategori Tabel

### 1️⃣ Master Data (14 tabel)
| Tabel | Deskripsi | Relasi Utama |
|-------|-----------|--------------|
| `unit_kerja` | Cost center/unit kerja RS | → data_kegiatan, data_biaya |
| `data_kamar` | Master kamar rawat inap | → data_kegiatan |
| `klinik` | Master klinik/poli | → data_kegiatan |
| `daftar_tindakan` | Master tindakan medis/non-medis | → rekapitulasi_unit_cost |
| `tindakan_cathlab` | Tindakan cathlab | → kalkulasi_biaya_cathlab |
| `tindakan_bdrs` | Tindakan bedah digestif | → kalkulasi_biaya_bdrs |
| `tindakan_ibs` | Tindakan IBS | → kalkulasi_biaya_ibs |
| `tindakan_laboratorium` | Tindakan lab (PK/PA/Mi) | → kalkulasi_biaya_laboratorium |
| `tindakan_radiologi` | Tindakan radiologi | → kalkulasi_biaya_radiologi |
| `tindakan_operatif` | Tindakan operatif | → kalkulasi_biaya_operatif |
| `menu_gizi` | Menu makanan | → kalkulasi_biaya_gizi |
| `data_barang_farmasi` | Obat & BHP | → bahan_farmasi_list (JSONB) |
| `data_barang_gizi` | Bahan makanan | → kalkulasi_biaya_gizi |
| `data_diklat` | Materi diklat | → data_kegiatan |

### 2️⃣ Transaksi (3 tabel)
| Tabel | Deskripsi | Kolom Penting |
|-------|-----------|---------------|
| `data_kegiatan` | Aktivitas unit kerja per tahun | 40+ kolom aktivitas |
| `data_biaya` | Biaya operasional per tahun | 8 kategori biaya |
| `data_pendapatan` | Pendapatan per tahun | pendapatan_umum, pendapatan_bpjs |

### 3️⃣ Kalkulasi (8 tabel)
| Tabel | Deskripsi | Output |
|-------|-----------|--------|
| `kalkulasi_biaya_bdrs` | Kalkulasi unit cost BDRS | unit_cost_per_pemeriksaan |
| `kalkulasi_biaya_laboratorium` | Kalkulasi unit cost lab | unit_cost_per_pemeriksaan |
| `kalkulasi_biaya_radiologi` | Kalkulasi unit cost radiologi | unit_cost_per_pemeriksaan |
| `kalkulasi_biaya_operatif` | Kalkulasi unit cost operatif | unit_cost_per_tindakan |
| `kalkulasi_biaya_cathlab` | Kalkulasi unit cost cathlab | unit_cost_per_tindakan |
| `kalkulasi_biaya_ibs` | Kalkulasi unit cost IBS | unit_cost_per_pemeriksaan |
| `kalkulasi_biaya_gizi` | Kalkulasi unit cost menu | unit_cost_per_porsi |
| `kalkulasi_biaya_kelas_akomodasi` | Kalkulasi unit cost rawat inap | unit_cost per hari |

### 4️⃣ Distribusi Biaya (3 tabel)
| Tabel | Deskripsi | Kolom UK |
|-------|-----------|----------|
| `distribusi_biaya_pertama` | Distribusi tahap I | UK001-UK077 (77 kolom) |
| `distribusi_biaya_kedua` | Distribusi tahap II | UK037-UK077 (41 kolom) |
| `distribusi_biaya_rekap` | Rekapitulasi distribusi | UK037-UK077 (41 kolom) |

### 5️⃣ Output & Reporting (7 tabel)
| Tabel | Deskripsi | Kegunaan |
|-------|-----------|----------|
| `rekapitulasi_unit_cost` | Rekap unit cost final | Dashboard utama |
| `produk_layanan` | Analisis layanan vs pendapatan | Cost recovery analysis |
| `skenario_tarif` | Skenario tarif dengan profit | Penetapan tarif |
| `skenario_tarif_akomodasi` | Tarif rawat inap per kelas | Tarif akomodasi |
| `rincian_budgeting_bhp` | Detail budgeting BHP | Perencanaan BHP |
| `rupiah_budgeting_bhp` | Rekap budgeting BHP per unit | Budgeting summary |
| `view_cost_recovery` | View cost recovery rate | Analisis finansial |

---

## 🔄 Alur Data (Data Flow)

```
┌─────────────────┐
│  Master Data    │
│  - Unit Kerja   │
│  - Tindakan     │
│  - Barang       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Transaksi     │
│  - Data Kegiatan│
│  - Data Biaya   │
│  - Pendapatan   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Kalkulasi     │
│  - Unit Cost    │
│  - Per Tindakan │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Distribusi I   │
│  Admin → All    │
│  (77 Unit)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Distribusi II  │
│  Penunjang →    │
│  Pelayanan      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Output Final   │
│  - Rekap UC     │
│  - Skenario     │
│  - Budgeting    │
└─────────────────┘
```

---

## 🔑 Key Concepts

### Activity Based Costing (ABC)
```
Total Biaya Unit = Biaya Overhead + Biaya SDM + Biaya Bahan

Unit Cost = Total Biaya Unit / Volume Aktivitas
```

### Distribusi Biaya 2 Tahap
```
Tahap I:  Unit Administrasi Umum → Semua Unit (UK001-UK077)
          Dasar: Luas ruangan, jumlah pegawai, dll

Tahap II: Unit Penunjang (UK037-UK046) → Unit Pelayanan (UK047-UK077)
          Dasar: Volume aktivitas/layanan
```

### Komponen Unit Cost
```
Unit Cost Tindakan = 
  + Biaya Overhead (hasil distribusi)
  + Biaya SDM (berdasarkan waktu × profesionalisme × kesulitan)
  + Biaya Bahan (dari bahan_farmasi_list)
```

---

## 📝 Stored Procedures Penting

| Function | Parameter | Deskripsi |
|----------|-----------|-----------|
| `populate_distribusi_biaya_pertama` | user_id, tahun | Generate distribusi biaya tahap I |
| `populate_distribusi_biaya_kedua` | user_id, tahun | Generate distribusi biaya tahap II |
| `populate_distribusi_biaya_rekap` | user_id, tahun | Generate rekapitulasi distribusi |
| `populate_rekapitulasi_unit_cost` | user_id, tahun | Generate rekap unit cost |
| `populate_skenario_tarif` | user_id, tahun | Generate skenario tarif |
| `populate_skenario_tarif_akomodasi` | user_id, tahun | Generate tarif akomodasi |
| `populate_rincian_budgeting_bhp` | user_id, tahun | Generate rincian budgeting BHP |
| `populate_rupiah_budgeting_bhp` | user_id, tahun | Generate rekap budgeting BHP |

---

## 🔒 Row Level Security (RLS)

Semua tabel menggunakan RLS dengan policy:
```sql
-- Users can only access their own data
CREATE POLICY "Users can CRUD own data"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## 📊 Contoh Query Penting

### 1. Total Biaya per Unit Kerja
```sql
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  biaya_pegawai + biaya_bahan + biaya_jasa_pelayanan + 
  biaya_pemeliharaan + biaya_barang_jasa + biaya_penyusutan + 
  biaya_farmasi + biaya_operasional_lainnya AS total_biaya
FROM data_biaya
WHERE tahun = 2025 AND user_id = auth.uid();
```

### 2. Cost Recovery Rate
```sql
SELECT 
  uk.nama,
  db.total_biaya,
  dp.total_pendapatan,
  (dp.total_pendapatan / NULLIF(db.total_biaya, 0)) * 100 AS cost_recovery_rate
FROM unit_kerja uk
JOIN data_biaya db ON uk.kode = db.kode_unit_kerja
JOIN data_pendapatan dp ON uk.kode = dp.kode_unit_kerja 
  AND db.tahun = dp.tahun
WHERE uk.jenis = 'Pusat Pendapatan';
```

### 3. Top 10 Tindakan Termahal
```sql
SELECT 
  nama_unit_kerja,
  nama_tindakan,
  unit_cost_per_tindakan,
  biaya_bahan
FROM rekapitulasi_unit_cost
WHERE tahun = 2025
ORDER BY unit_cost_per_tindakan DESC
LIMIT 10;
```

---

## 🛠️ Maintenance Tips

### Backup Data
```sql
-- Export semua data user
COPY (
  SELECT * FROM table_name WHERE user_id = 'xxx'
) TO '/path/to/backup.csv' CSV HEADER;
```

### Clean Old Data
```sql
-- Hapus data tahun lama (hati-hati!)
DELETE FROM data_kegiatan WHERE tahun < 2023;
```

### Reindex Tables
```sql
-- Reindex untuk performa
REINDEX TABLE rekapitulasi_unit_cost;
```

---

## 📚 Dokumentasi Lengkap

Untuk dokumentasi lengkap dengan detail setiap kolom dan relasi, lihat:
👉 **[SKEMA_DATABASE.md](./SKEMA_DATABASE.md)**

---

## 🆘 Troubleshooting

### Data Tidak Muncul
```sql
-- Cek apakah data exists
SELECT COUNT(*) FROM table_name WHERE user_id = auth.uid();

-- Cek RLS policy
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

### Stored Procedure Error
```sql
-- Cek error log
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%populate_%'
ORDER BY last_call DESC;
```

### Performance Issues
```sql
-- Cek query lambat
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

**Versi**: 1.0  
**Terakhir Update**: 2025-01-11

