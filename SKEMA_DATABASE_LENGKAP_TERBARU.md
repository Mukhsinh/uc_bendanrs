# SKEMA DATABASE LENGKAP - SISTEM KALKULASI BIAYA AKOMODASI RUMAH SAKIT

## DAFTAR ISI
1. [Overview Sistem](#overview-sistem)
2. [Tabel Master Data](#tabel-master-data)
3. [Tabel Kalkulasi](#tabel-kalkulasi)
4. [Relasi Antar Tabel](#relasi-antar-tabel)
5. [Fungsi dan Trigger](#fungsi-dan-trigger)
6. [Rumus Perhitungan](#rumus-perhitungan)

---

## OVERVIEW SISTEM

Sistem ini digunakan untuk menghitung biaya akomodasi per kelas perawatan di rumah sakit berdasarkan berbagai parameter seperti hari rawat, tempat tidur, dan luas kamar.

### Komponen Utama:
- **Data Master**: Unit kerja, biaya dasar, prosentase alokasi
- **Data Operasional**: Hari rawat, tempat tidur, luas kamar per kelas
- **Kalkulasi Biaya**: Distribusi biaya berdasarkan alokasi
- **Kalkulasi Kelas**: Biaya per kelas perawatan

---

## TABEL MASTER DATA

### 1. `unit_kerja`
**Tujuan**: Master data unit kerja rumah sakit

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `kode_unit_kerja` | TEXT | Kode unik unit kerja |
| `nama_unit_kerja` | TEXT | Nama unit kerja |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

### 2. `data_biaya`
**Tujuan**: Data biaya tahunan per unit kerja

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | ID pengguna |
| `tahun` | INTEGER | Tahun data |
| `kode_unit_kerja` | TEXT | Kode unit kerja |
| `biaya_gaji_tunjangan` | BIGINT | Biaya gaji dan tunjangan |
| `biaya_jasa_pelayanan` | BIGINT | Biaya jasa pelayanan |
| `biaya_obat` | BIGINT | Biaya obat |
| `biaya_bhp` | BIGINT | Biaya bahan habis pakai |
| `biaya_makan_karyawan` | BIGINT | Biaya makan karyawan |
| `biaya_makan_pasien` | BIGINT | Biaya makan pasien |
| `biaya_rumah_tangga` | BIGINT | Biaya rumah tangga |
| `biaya_cetak` | BIGINT | Biaya cetak |
| `biaya_atk` | BIGINT | Biaya alat tulis kantor |
| `biaya_listrik` | BIGINT | Biaya listrik |
| `biaya_air` | BIGINT | Biaya air |
| `biaya_telp` | BIGINT | Biaya telepon |
| `biaya_pemeliharaan_bangunan` | BIGINT | Biaya pemeliharaan bangunan |
| `biaya_pemeliharaan_alat_medis` | BIGINT | Biaya pemeliharaan alat medis |
| `biaya_pemeliharaan_alat_non_medis` | BIGINT | Biaya pemeliharaan alat non medis |
| `biaya_operasional_lainnya` | BIGINT | Biaya operasional lainnya |
| `biaya_penyusutan_gedung` | BIGINT | Biaya penyusutan gedung |
| `biaya_penyusutan_jaringan` | BIGINT | Biaya penyusutan jaringan |
| `biaya_penyusutan_alat_medis` | BIGINT | Biaya penyusutan alat medis |
| `biaya_penyusutan_alat_non_medis` | BIGINT | Biaya penyusutan alat non medis |
| `biaya_pendidikan_pelatihan` | BIGINT | Biaya pendidikan dan pelatihan |
| `biaya_laundry` | BIGINT | Biaya laundry |
| `biaya_sterilisasi` | BIGINT | Biaya sterilisasi |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

### 3. `prosentase_akomodasi_tindakan`
**Tujuan**: Prosentase alokasi untuk akomodasi dan tindakan

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | ID pengguna |
| `tahun` | INTEGER | Tahun data |
| `kode_unit_kerja` | TEXT | Kode unit kerja |
| `rasio_akomodasi` | NUMERIC | Rasio alokasi untuk akomodasi |
| `rasio_tindakan` | NUMERIC | Rasio alokasi untuk tindakan |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

---

## TABEL KALKULASI

### 4. `data_akomodasi_inap`
**Tujuan**: Data operasional akomodasi inap per unit kerja

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | ID pengguna |
| `tahun` | INTEGER | Tahun data |
| `kode_unit_kerja` | TEXT | Kode unit kerja |
| `nama_unit_kerja` | TEXT | Nama unit kerja |
| `auc_gizi_vvip` | NUMERIC | AUC gizi VVIP |
| `auc_gizi_vip` | NUMERIC | AUC gizi VIP |
| `auc_gizi_i` | NUMERIC | AUC gizi kelas I |
| `auc_gizi_ii` | NUMERIC | AUC gizi kelas II |
| `auc_gizi_iii` | NUMERIC | AUC gizi kelas III |
| `hari_rawat_vvip` | INTEGER | Hari rawat VVIP |
| `hari_rawat_vip` | INTEGER | Hari rawat VIP |
| `hari_rawat_i` | INTEGER | Hari rawat kelas I |
| `hari_rawat_ii` | INTEGER | Hari rawat kelas II |
| `hari_rawat_iii` | INTEGER | Hari rawat kelas III |
| `tempat_tidur_svip` | INTEGER | Tempat tidur SVIP |
| `tempat_tidur_vip` | INTEGER | Tempat tidur VIP |
| `tempat_tidur_i` | INTEGER | Tempat tidur kelas I |
| `tempat_tidur_ii` | INTEGER | Tempat tidur kelas II |
| `tempat_tidur_iii` | INTEGER | Tempat tidur kelas III |
| `jumlah_porsi_svip` | INTEGER | Jumlah porsi SVIP |
| `jumlah_porsi_vip` | INTEGER | Jumlah porsi VIP |
| `jumlah_porsi_i` | INTEGER | Jumlah porsi kelas I |
| `jumlah_porsi_ii` | INTEGER | Jumlah porsi kelas II |
| `jumlah_porsi_iii` | INTEGER | Jumlah porsi kelas III |
| `kamar_luas_svip` | DOUBLE PRECISION | Luas kamar SVIP |
| `kamar_luas_vip` | DOUBLE PRECISION | Luas kamar VIP |
| `kamar_luas_i` | DOUBLE PRECISION | Luas kamar kelas I |
| `kamar_luas_ii` | DOUBLE PRECISION | Luas kamar kelas II |
| `kamar_luas_iii` | DOUBLE PRECISION | Luas kamar kelas III |
| `jumlah_kali_porsi_vvip` | BIGINT | Generated: jumlah_porsi_svip × auc_gizi_vvip |
| `jumlah_kali_porsi_vip` | BIGINT | Generated: jumlah_porsi_vip × auc_gizi_vip |
| `jumlah_kali_porsi_i` | BIGINT | Generated: jumlah_porsi_i × auc_gizi_i |
| `jumlah_kali_porsi_ii` | BIGINT | Generated: jumlah_porsi_ii × auc_gizi_ii |
| `jumlah_kali_porsi_iii` | BIGINT | Generated: jumlah_porsi_iii × auc_gizi_iii |
| `total_gizi` | BIGINT | Generated: Sum semua jumlah_kali_porsi_* |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

### 5. `kalkulasi_biaya_gizi`
**Tujuan**: Kalkulasi biaya gizi per kelas

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | ID pengguna |
| `tahun` | INTEGER | Tahun data |
| `kode_unit_kerja` | TEXT | Kode unit kerja |
| `auc_gizi_vvip` | NUMERIC | AUC gizi VVIP |
| `auc_gizi_vip` | NUMERIC | AUC gizi VIP |
| `auc_gizi_i` | NUMERIC | AUC gizi kelas I |
| `auc_gizi_ii` | NUMERIC | AUC gizi kelas II |
| `auc_gizi_iii` | NUMERIC | AUC gizi kelas III |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

### 6. `data_kegiatan`
**Tujuan**: Data kegiatan operasional per unit kerja

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | ID pengguna |
| `tahun` | INTEGER | Tahun data |
| `Kode_UK` | TEXT | Kode unit kerja |
| `Hari_Rawat_SVIP` | INTEGER | Hari rawat SVIP |
| `Hari_Rawat_VIP` | INTEGER | Hari rawat VIP |
| `Hari_Rawat_I` | INTEGER | Hari rawat kelas I |
| `Hari_Rawat_II` | INTEGER | Hari rawat kelas II |
| `Hari_Rawat_III` | INTEGER | Hari rawat kelas III |
| `Tempat_Tidur_SVIP` | INTEGER | Tempat tidur SVIP |
| `Tempat_Tidur_VIP` | INTEGER | Tempat tidur VIP |
| `Tempat_Tidur_I` | INTEGER | Tempat tidur kelas I |
| `Tempat_Tidur_II` | INTEGER | Tempat tidur kelas II |
| `Tempat_Tidur_III` | INTEGER | Tempat tidur kelas III |
| `jumlah_porsi_svip` | INTEGER | Jumlah porsi SVIP |
| `jumlah_porsi_vip` | INTEGER | Jumlah porsi VIP |
| `jumlah_porsi_i` | INTEGER | Jumlah porsi kelas I |
| `jumlah_porsi_ii` | INTEGER | Jumlah porsi kelas II |
| `jumlah_porsi_iii` | INTEGER | Jumlah porsi kelas III |
| `kamar_luas_svip` | DOUBLE PRECISION | Luas kamar SVIP |
| `kamar_luas_vip` | DOUBLE PRECISION | Luas kamar VIP |
| `kamar_luas_i` | DOUBLE PRECISION | Luas kamar kelas I |
| `kamar_luas_ii` | DOUBLE PRECISION | Luas kamar kelas II |
| `kamar_luas_iii` | DOUBLE PRECISION | Luas kamar kelas III |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

### 7. `kalkulasi_biaya_akomodasi`
**Tujuan**: Kalkulasi biaya akomodasi per unit kerja

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | ID pengguna |
| `tahun` | INTEGER | Tahun data |
| `kode_unit_kerja` | TEXT | Kode unit kerja |
| `nama_unit_kerja` | TEXT | Nama unit kerja |
| `biaya_gaji_tunjangan` | BIGINT | Biaya gaji dan tunjangan |
| `biaya_jasa_pelayanan` | BIGINT | Biaya jasa pelayanan |
| `biaya_obat` | BIGINT | Biaya obat |
| `biaya_bhp` | BIGINT | Biaya bahan habis pakai |
| `biaya_makan_karyawan` | BIGINT | Biaya makan karyawan |
| `biaya_makan_pasien` | BIGINT | Biaya makan pasien |
| `biaya_rumah_tangga` | BIGINT | Biaya rumah tangga |
| `biaya_cetak` | BIGINT | Biaya cetak |
| `biaya_atk` | BIGINT | Biaya alat tulis kantor |
| `biaya_listrik` | BIGINT | Biaya listrik |
| `biaya_air` | BIGINT | Biaya air |
| `biaya_telp` | BIGINT | Biaya telepon |
| `biaya_pemeliharaan_bangunan` | BIGINT | Biaya pemeliharaan bangunan |
| `biaya_pemeliharaan_alat_medis` | BIGINT | Biaya pemeliharaan alat medis |
| `biaya_pemeliharaan_alat_non_medis` | BIGINT | Biaya pemeliharaan alat non medis |
| `biaya_operasional_lainnya` | BIGINT | Biaya operasional lainnya |
| `biaya_penyusutan_gedung` | BIGINT | Biaya penyusutan gedung |
| `biaya_penyusutan_jaringan` | BIGINT | Biaya penyusutan jaringan |
| `biaya_penyusutan_alat_medis` | BIGINT | Biaya penyusutan alat medis |
| `biaya_penyusutan_alat_non_medis` | BIGINT | Biaya penyusutan alat non medis |
| `biaya_pendidikan_pelatihan` | BIGINT | Biaya pendidikan dan pelatihan |
| `biaya_laundry` | BIGINT | Biaya laundry |
| `biaya_sterilisasi` | BIGINT | Biaya sterilisasi |
| `biaya_tidak_langsung_terdistribusi` | BIGINT | Biaya tidak langsung terdistribusi |
| `alokasi_biaya_gizi` | BIGINT | Alokasi biaya gizi |
| `rasio_akomodasi` | NUMERIC | Rasio akomodasi |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

### 8. `kalkulasi_biaya_kelas_akomodasi`
**Tujuan**: Kalkulasi biaya per kelas perawatan

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | ID pengguna |
| `tahun` | INTEGER | Tahun data |
| `kode_unit_kerja` | TEXT | Kode unit kerja |
| `nama_unit_kerja` | TEXT | Nama unit kerja |
| `kelas` | TEXT | Kelas perawatan (VVIP, VIP, I, II, III) |
| `dasar_alokasi_hari_rawat` | NUMERIC | Dasar alokasi berdasarkan hari rawat |
| `dasar_alokasi_tempat_tidur` | NUMERIC | Dasar alokasi berdasarkan tempat tidur |
| `dasar_alokasi_luas_kamar` | NUMERIC | Dasar alokasi berdasarkan luas kamar |
| `biaya_gaji_tunjangan` | BIGINT | Biaya gaji dan tunjangan |
| `biaya_jasa_pelayanan` | BIGINT | Biaya jasa pelayanan |
| `biaya_obat` | BIGINT | Biaya obat |
| `biaya_bhp` | BIGINT | Biaya bahan habis pakai |
| `biaya_makan_karyawan` | BIGINT | Biaya makan karyawan |
| `biaya_makan_pasien` | BIGINT | Biaya makan pasien |
| `biaya_rumah_tangga` | BIGINT | Biaya rumah tangga |
| `biaya_cetak` | BIGINT | Biaya cetak |
| `biaya_atk` | BIGINT | Biaya alat tulis kantor |
| `biaya_listrik` | BIGINT | Biaya listrik |
| `biaya_air` | BIGINT | Biaya air |
| `biaya_telp` | BIGINT | Biaya telepon |
| `biaya_pemeliharaan_bangunan` | BIGINT | Biaya pemeliharaan bangunan |
| `biaya_pemeliharaan_alat_medis` | BIGINT | Biaya pemeliharaan alat medis |
| `biaya_pemeliharaan_alat_non_medis` | BIGINT | Biaya pemeliharaan alat non medis |
| `biaya_operasional_lainnya` | BIGINT | Biaya operasional lainnya |
| `biaya_penyusutan_gedung` | BIGINT | Biaya penyusutan gedung |
| `biaya_penyusutan_jaringan` | BIGINT | Biaya penyusutan jaringan |
| `biaya_penyusutan_alat_medis` | BIGINT | Biaya penyusutan alat medis |
| `biaya_penyusutan_alat_non_medis` | BIGINT | Biaya penyusutan alat non medis |
| `biaya_pendidikan_pelatihan` | BIGINT | Biaya pendidikan dan pelatihan |
| `biaya_laundry` | BIGINT | Biaya laundry |
| `biaya_sterilisasi` | BIGINT | Biaya sterilisasi |
| `biaya_tidak_langsung_terdistribusi` | BIGINT | Biaya tidak langsung terdistribusi |
| `alokasi_biaya_gizi` | BIGINT | Alokasi biaya gizi |
| `unit_cost_per_kelas` | BIGINT | Generated: Total biaya per kelas |
| `rata_rata_uc_kelas_vvip` | NUMERIC | Rata-rata unit cost kelas VVIP |
| `rata_rata_uc_kelas_vip` | NUMERIC | Rata-rata unit cost kelas VIP |
| `rata_rata_uc_kelas_i` | NUMERIC | Rata-rata unit cost kelas I |
| `rata_rata_uc_kelas_ii` | NUMERIC | Rata-rata unit cost kelas II |
| `rata_rata_uc_kelas_iii` | NUMERIC | Rata-rata unit cost kelas III |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | Waktu update |

---

## RELASI ANTAR TABEL

### Relasi Utama:
1. **`unit_kerja`** ← **`data_biaya`** (1:N via `kode_unit_kerja`)
2. **`unit_kerja`** ← **`prosentase_akomodasi_tindakan`** (1:N via `kode_unit_kerja`)
3. **`data_biaya`** → **`kalkulasi_biaya_akomodasi`** (1:1 via `kode_unit_kerja` + `tahun`)
4. **`prosentase_akomodasi_tindakan`** → **`kalkulasi_biaya_akomodasi`** (1:1 via `kode_unit_kerja` + `tahun`)
5. **`kalkulasi_biaya_akomodasi`** → **`kalkulasi_biaya_kelas_akomodasi`** (1:N via `kode_unit_kerja` + `tahun`)
6. **`data_akomodasi_inap`** → **`kalkulasi_biaya_kelas_akomodasi`** (1:N via `kode_unit_kerja` + `tahun`)

### Alur Data:
```
data_biaya + prosentase_akomodasi_tindakan 
    ↓
kalkulasi_biaya_akomodasi
    ↓
data_akomodasi_inap + kalkulasi_biaya_akomodasi
    ↓
kalkulasi_biaya_kelas_akomodasi
```

---

## FUNGSI DAN TRIGGER

### 1. `sync_data_akomodasi_inap()`
**Tujuan**: Sinkronisasi data dari tabel sumber ke `data_akomodasi_inap`

**Sumber Data**:
- `kalkulasi_biaya_gizi` → `auc_gizi_*` columns
- `data_kegiatan` → `hari_rawat_*`, `tempat_tidur_*`, `jumlah_porsi_*`, `kamar_luas_*`

**Trigger**: 
- `trigger_sync_data_akomodasi_inap` pada `data_kegiatan`
- `trigger_sync_data_akomodasi_inap_gizi` pada `kalkulasi_biaya_gizi`

### 2. `populate_kalkulasi_biaya_akomodasi(p_user_id, p_tahun)`
**Tujuan**: Mengisi data `kalkulasi_biaya_akomodasi` dari `data_biaya` dan `prosentase_akomodasi_tindakan`

**Rumus**: `biaya = data_biaya.biaya × prosentase_akomodasi_tindakan.rasio_akomodasi / 100`

### 3. `populate_kalkulasi_biaya_kelas_akomodasi(p_user_id, p_tahun)`
**Tujuan**: Mengisi data `kalkulasi_biaya_kelas_akomodasi` dengan distribusi biaya per kelas

**Sumber Data**: `data_akomodasi_inap` + `kalkulasi_biaya_akomodasi`

### 4. `calculate_average_uc_per_class(p_user_id, p_tahun)`
**Tujuan**: Menghitung rata-rata unit cost per kelas

**Trigger**: `trigger_calculate_average_uc_per_class` pada `kalkulasi_biaya_kelas_akomodasi`

---

## RUMUS PERHITUNGAN

### 1. Dasar Alokasi Hari Rawat
```
dasar_alokasi_hari_rawat = (hari_rawat_kelas / total_hari_rawat_unit) / hari_rawat_kelas
```

### 2. Dasar Alokasi Tempat Tidur
```
dasar_alokasi_tempat_tidur = (tempat_tidur_kelas / total_tempat_tidur_unit) / hari_rawat_kelas
```

### 3. Dasar Alokasi Luas Kamar
```
dasar_alokasi_luas_kamar = (kamar_luas_kelas / total_kamar_luas_unit) / hari_rawat_kelas
```

### 4. Perhitungan Biaya Berdasarkan Dasar Alokasi

#### Biaya berdasarkan `dasar_alokasi_hari_rawat`:
- `biaya_gaji_tunjangan` = `dasar_alokasi_hari_rawat` × `biaya_gaji_tunjangan` dari `kalkulasi_biaya_akomodasi`
- `biaya_obat` = `dasar_alokasi_hari_rawat` × `biaya_obat` dari `kalkulasi_biaya_akomodasi`
- `biaya_bhp` = `dasar_alokasi_hari_rawat` × `biaya_bhp` dari `kalkulasi_biaya_akomodasi`
- `biaya_makan_karyawan` = `dasar_alokasi_hari_rawat` × `biaya_makan_karyawan` dari `kalkulasi_biaya_akomodasi`
- `biaya_makan_pasien` = `dasar_alokasi_hari_rawat` × `biaya_makan_pasien` dari `kalkulasi_biaya_akomodasi`
- `biaya_rumah_tangga` = `dasar_alokasi_hari_rawat` × `biaya_rumah_tangga` dari `kalkulasi_biaya_akomodasi`
- `biaya_cetak` = `dasar_alokasi_hari_rawat` × `biaya_cetak` dari `kalkulasi_biaya_akomodasi`
- `biaya_atk` = `dasar_alokasi_hari_rawat` × `biaya_atk` dari `kalkulasi_biaya_akomodasi`
- `biaya_listrik` = `dasar_alokasi_hari_rawat` × `biaya_listrik` dari `kalkulasi_biaya_akomodasi`
- `biaya_air` = `dasar_alokasi_hari_rawat` × `biaya_air` dari `kalkulasi_biaya_akomodasi`
- `biaya_telp` = `dasar_alokasi_hari_rawat` × `biaya_telp` dari `kalkulasi_biaya_akomodasi`
- `biaya_operasional_lainnya` = `dasar_alokasi_hari_rawat` × `biaya_operasional_lainnya` dari `kalkulasi_biaya_akomodasi`
- `biaya_pendidikan_pelatihan` = `dasar_alokasi_hari_rawat` × `biaya_pendidikan_pelatihan` dari `kalkulasi_biaya_akomodasi`
- `biaya_laundry` = `dasar_alokasi_hari_rawat` × `biaya_laundry` dari `kalkulasi_biaya_akomodasi`
- `biaya_sterilisasi` = `dasar_alokasi_hari_rawat` × `biaya_sterilisasi` dari `kalkulasi_biaya_akomodasi`
- `biaya_tidak_langsung_terdistribusi` = `dasar_alokasi_hari_rawat` × `biaya_tidak_langsung_terdistribusi` dari `kalkulasi_biaya_akomodasi`
- `alokasi_biaya_gizi` = `dasar_alokasi_hari_rawat` × `alokasi_biaya_gizi` dari `kalkulasi_biaya_akomodasi`

#### Biaya berdasarkan `dasar_alokasi_luas_kamar`:
- `biaya_pemeliharaan_bangunan` = `dasar_alokasi_luas_kamar` × `biaya_pemeliharaan_bangunan` dari `kalkulasi_biaya_akomodasi`
- `biaya_penyusutan_gedung` = `dasar_alokasi_luas_kamar` × `biaya_penyusutan_gedung` dari `kalkulasi_biaya_akomodasi`
- `biaya_penyusutan_jaringan` = `dasar_alokasi_luas_kamar` × `biaya_penyusutan_jaringan` dari `kalkulasi_biaya_akomodasi`

#### Biaya berdasarkan `dasar_alokasi_tempat_tidur`:
- `biaya_pemeliharaan_alat_medis` = `dasar_alokasi_tempat_tidur` × `biaya_pemeliharaan_alat_medis` dari `kalkulasi_biaya_akomodasi`
- `biaya_pemeliharaan_alat_non_medis` = `dasar_alokasi_tempat_tidur` × `biaya_pemeliharaan_alat_non_medis` dari `kalkulasi_biaya_akomodasi`
- `biaya_penyusutan_alat_medis` = `dasar_alokasi_tempat_tidur` × `biaya_penyusutan_alat_medis` dari `kalkulasi_biaya_akomodasi`
- `biaya_penyusutan_alat_non_medis` = `dasar_alokasi_tempat_tidur` × `biaya_penyusutan_alat_non_medis` dari `kalkulasi_biaya_akomodasi`

### 5. Unit Cost per Kelas
```
unit_cost_per_kelas = SUM(semua biaya dalam tabel kalkulasi_biaya_kelas_akomodasi)
```

### 6. Rata-rata Unit Cost per Kelas
```
rata_rata_uc_kelas_* = AVG(unit_cost_per_kelas) untuk setiap kelas
```

---

## CATATAN PENTING

1. **Generated Columns**: Beberapa kolom dihitung otomatis menggunakan `GENERATED ALWAYS AS`
2. **Trigger Automation**: Sistem menggunakan trigger untuk menjaga konsistensi data
3. **User ID Filtering**: Semua data difilter berdasarkan `user_id` untuk multi-tenant
4. **Tahun Data**: Semua kalkulasi berdasarkan tahun tertentu
5. **Recursion Prevention**: Trigger dilengkapi dengan pencegahan rekursi untuk menghindari stack overflow

---

**Dokumentasi ini dibuat pada**: $(date)
**Versi**: 2.0
**Status**: Aktif
