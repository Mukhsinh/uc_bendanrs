# 📊 Dokumentasi Skema Database - Aplikasi Unit Cost RS

## 🎯 **Ringkasan Sistem**

Aplikasi Unit Cost RS adalah sistem untuk menghitung biaya unit cost di rumah sakit dengan berbagai modul:
- **Data Operasional**: Input data kegiatan dan biaya tahunan
- **Distribusi Biaya**: Alokasi biaya dari pusat biaya ke pusat pendapatan
- **Kalkulasi Unit Cost**: Perhitungan biaya per unit untuk berbagai jenis layanan
- **Skenario Tarif**: Simulasi tarif berdasarkan unit cost
- **Cost Recovery**: Analisis pendapatan vs biaya

---

## 🗂️ **Kategori Tabel**

### **1. Master Data & Referensi**
- `unit_kerja` - Data unit kerja rumah sakit
- `daftar_tindakan` - Master data tindakan medis
- `tindakan_laboratorium` - Tindakan laboratorium
- `tindakan_radiologi` - Tindakan radiologi
- `tindakan_bdrs` - Tindakan BDRS (Bank Darah)
- `tindakan_operatif` - Tindakan operatif
- `tindakan_cathlab` - Tindakan cathlab
- `menu_gizi` - Menu makanan gizi
- `data_barang_farmasi` - Master barang farmasi
- `data_barang_gizi` - Master barang gizi
- `klinik` - Data klinik rawat jalan
- `Data_Kamar` - Data kamar rawat inap

### **2. Data Operasional**
- `data_kegiatan` - Data kegiatan operasional unit kerja
- `data_kegiatan_transpose` - Data kegiatan dalam format transpose (pivot) untuk analisis
- `data_biaya` - Data biaya tahunan per unit kerja
- `data_pendapatan` - Data pendapatan per unit kerja
- `data_diklat` - Data pendidikan dan pelatihan

### **3. Distribusi Biaya**
- `distribusi_biaya_pertama` - Distribusi biaya tahap I
- `distribusi_biaya_kedua` - Distribusi biaya tahap II
- `total_alokasi_biaya_pertama` - Rekap total alokasi
- `distribusi_biaya_rekap` - Rekap distribusi biaya
- `mapping_dasar_alokasi` - Mapping dasar alokasi
- `Dasar_Alokasi` - Data dasar alokasi

### **4. Kalkulasi Unit Cost**
- `kalkulasi_biaya_gizi` - Unit cost layanan gizi
- `kalkulasi_biaya_laboratorium` - Unit cost laboratorium
- `kalkulasi_biaya_radiologi` - Unit cost radiologi
- `kalkulasi_bdrs` - Unit cost BDRS
- `kalkulasi_biaya_operatif` - Unit cost tindakan operatif
- `kalkulasi_biaya_cathlab` - Unit cost cathlab
- `kalkulasi_tindakan_inap` - Unit cost tindakan rawat inap
- `kalkulasi_tindakan_rawat_jalan` - Unit cost tindakan rawat jalan
- `kalkulasi_biaya_akomodasi` - Unit cost akomodasi rawat inap
- `kalkulasi_biaya_kelas_akomodasi` - Unit cost per kelas akomodasi

### **5. Manajemen Tindakan**
- `jenis_tindakan_inap` - Jenis tindakan rawat inap
- `jenis_tindakan_rawat_jalan` - Jenis tindakan rawat jalan
- `prosentase_akomodasi_tindakan` - Rasio akomodasi vs tindakan
- `data_akomodasi_inap` - Data akomodasi rawat inap

### **6. Rekap & Analisis**
- `rekapitulasi_unit_cost` - Rekap unit cost semua layanan
- `skenario_tarif` - Simulasi tarif berdasarkan unit cost
- `cost_recovery` - Analisis cost recovery

### **7. Sistem & Konfigurasi**
- `profiles` - Profil pengguna
- `biaya_preference` - Preferensi perhitungan biaya

---

## 📋 **Detail Tabel Utama**

### **🔧 unit_kerja**
**Tabel master unit kerja rumah sakit**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `kode` | TEXT | Kode unit kerja (UK001-UK077) | UNIQUE, CHECK |
| `nama` | TEXT | Nama unit kerja | - |
| `lokasi` | TEXT | Lokasi unit kerja | - |
| `luas_ruangan` | NUMERIC | Luas ruangan dalam m² | - |
| `kategori` | TEXT | Pusat Biaya/Pusat Pendapatan | CHECK |
| `jenis` | SMALLINT | 1=Rawat Jalan, 2=Rawat Inap, 3=Operatif, 4=Non Layanan | CHECK |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Timestamp update | DEFAULT now() |

**Constraint:**
- `kode` harus format UK### (UK001, UK002, dst)
- `kategori` hanya 'Pusat Biaya' atau 'Pusat Pendapatan'
- `jenis` hanya 1, 2, 3, atau 4

---

### **🏥 daftar_tindakan**
**Master data tindakan medis**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `kode_tindakan` | VARCHAR | Kode tindakan (T.001, T.002, dst) | UNIQUE, CHECK |
| `nama_tindakan` | VARCHAR | Nama tindakan medis | - |
| `medis` | BOOLEAN | Dilakukan oleh medis | DEFAULT false |
| `paramedis` | BOOLEAN | Dilakukan oleh paramedis | DEFAULT false |
| `bahan_tindakan` | JSONB | Data bahan dalam format JSON | - |
| `biaya_bahan_tindakan` | INTEGER | Total biaya bahan | AUTO-CALCULATED |
| `waktu` | INTEGER | Waktu pelaksanaan (menit) | CHECK >= 0 |
| `profesionalisme` | SMALLINT | Tingkat profesionalisme (1-4) | CHECK 1-4 |
| `tingkat_kesulitan` | SMALLINT | Tingkat kesulitan (1-5) | CHECK 1-5 |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Timestamp update | DEFAULT now() |

**Constraint:**
- `kode_tindakan` harus format T.###
- `waktu` >= 0
- `profesionalisme` 1-4 (Dasar, Menengah, Tinggi, Ahli)
- `tingkat_kesulitan` 1-5 (Sangat Mudah sampai Sangat Sulit)

---

### **💰 data_biaya**
**Data biaya tahunan per unit kerja**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `tahun` | INTEGER | Tahun periode | - |
| `unit_kerja_id` | UUID | Foreign key ke unit_kerja | FK |
| `kode_unit_kerja` | TEXT | Kode unit kerja | - |
| `nama_unit_kerja` | TEXT | Nama unit kerja | - |
| `biaya_gaji_tunjangan` | NUMERIC | Biaya gaji dan tunjangan | - |
| `biaya_jasa_pelayanan` | NUMERIC | Biaya jasa pelayanan | - |
| `biaya_obat` | NUMERIC | Biaya obat-obatan | - |
| `biaya_bhp` | NUMERIC | Biaya BHP (Bahan Habis Pakai) | - |
| `biaya_makan_karyawan` | NUMERIC | Biaya makan karyawan | - |
| `biaya_makan_pasien` | NUMERIC | Biaya makan pasien | - |
| `biaya_rumah_tangga` | NUMERIC | Biaya rumah tangga | - |
| `biaya_cetak` | NUMERIC | Biaya cetak | - |
| `biaya_atk` | NUMERIC | Biaya ATK | - |
| `biaya_listrik` | NUMERIC | Biaya listrik | - |
| `biaya_air` | NUMERIC | Biaya air | - |
| `biaya_telp` | NUMERIC | Biaya telepon | - |
| `biaya_pemeliharaan_bangunan` | NUMERIC | Biaya pemeliharaan bangunan | - |
| `biaya_pemeliharaan_alat_medis` | NUMERIC | Biaya pemeliharaan alat medis | - |
| `biaya_pemeliharaan_alat_non_medis` | NUMERIC | Biaya pemeliharaan alat non medis | - |
| `biaya_operasional_lainnya` | NUMERIC | Biaya operasional lainnya | - |
| `biaya_penyusutan_gedung` | NUMERIC | Biaya penyusutan gedung | - |
| `biaya_penyusutan_jaringan` | NUMERIC | Biaya penyusutan jaringan | - |
| `biaya_penyusutan_alat_medis` | NUMERIC | Biaya penyusutan alat medis | - |
| `biaya_penyusutan_alat_non_medis` | NUMERIC | Biaya penyusutan alat non medis | - |
| `biaya_pendidikan_pelatihan` | NUMERIC | Biaya pendidikan pelatihan | - |
| `biaya_laundry` | NUMERIC | Biaya laundry | - |
| `biaya_sterilisasi` | NUMERIC | Biaya sterilisasi | - |
| `biaya_bahan` | NUMERIC | **GENERATED** - Total biaya bahan | AUTO-CALCULATED |
| `biaya_pegawai` | NUMERIC | **GENERATED** - Total biaya pegawai | AUTO-CALCULATED |
| `biaya_daya` | NUMERIC | **GENERATED** - Total biaya daya | AUTO-CALCULATED |
| `biaya_pemeliharaan` | NUMERIC | **GENERATED** - Total biaya pemeliharaan | AUTO-CALCULATED |
| `biaya_penyusutan` | NUMERIC | **GENERATED** - Total biaya penyusutan | AUTO-CALCULATED |
| `total_biaya` | NUMERIC | **GENERATED** - Total semua biaya | AUTO-CALCULATED |
| `total_biaya_tanpa_jp` | NUMERIC | **GENERATED** - Total biaya tanpa jasa pelayanan | AUTO-CALCULATED |

**Generated Columns:**
- `biaya_bahan` = obat + bhp + makanan karyawan + makanan pasien + rumah tangga + atk + cetak
- `biaya_pegawai` = gaji tunjangan + jasa pelayanan + pendidikan pelatihan
- `biaya_daya` = listrik + air + telepon
- `biaya_pemeliharaan` = bangunan + alat medis + alat non medis
- `biaya_penyusutan` = gedung + jaringan + alat medis + alat non medis
- `total_biaya` = SUM(semua biaya individual)
- `total_biaya_tanpa_jp` = total_biaya - biaya_jasa_pelayanan

---

### **📊 data_kegiatan**
**Data kegiatan operasional unit kerja**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | INTEGER | Primary key | PK, auto-increment |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `tahun` | INTEGER | Tahun periode | - |
| `Kode_UK` | VARCHAR | Kode unit kerja | - |
| `Nama_Unit_Kerja` | VARCHAR | Nama unit kerja | - |
| `Jml_jam_Praktek_Harian` | INTEGER | Jam praktek harian | - |
| `SDM_dokter` | INTEGER | Jumlah SDM dokter | - |
| `SDM_Perawat` | INTEGER | Jumlah SDM perawat | - |
| `SDM_Non` | INTEGER | Jumlah SDM non medis | - |
| `Listrik_kwh` | DOUBLE PRECISION | Konsumsi listrik (kWh) | - |
| `Air_m3` | DOUBLE PRECISION | Konsumsi air (m³) | - |
| `Telepon_Freq_pakai_per_titik` | INTEGER | Frekuensi pakai telepon | - |
| `Komputer_simrs_user` | INTEGER | Jumlah komputer SIMRS | - |
| `Tempat_Tidur_SVIP` | INTEGER | Jumlah tempat tidur SVIP | - |
| `Tempat_Tidur_VIP` | INTEGER | Jumlah tempat tidur VIP | - |
| `Tempat_Tidur_I` | INTEGER | Jumlah tempat tidur kelas I | - |
| `Tempat_Tidur_II` | INTEGER | Jumlah tempat tidur kelas II | - |
| `Tempat_Tidur_III` | INTEGER | Jumlah tempat tidur kelas III | - |
| `Tempat_Tidur_Khusus` | INTEGER | Jumlah tempat tidur khusus | - |
| `Kunjungan_Pasien_Lama` | INTEGER | Kunjungan pasien lama | - |
| `Kunjungan_Pasien_Baru` | INTEGER | Kunjungan pasien baru | - |
| `Jumlah_Tindakan` | INTEGER | Total jumlah tindakan | - |
| `Resep_Lembar_Resep` | INTEGER | Jumlah lembar resep | - |
| `Cucian_kg_Cucian` | DOUBLE PRECISION | Berat cucian (kg) | - |
| `Instrumen_Besar` | INTEGER | Jumlah instrumen besar | - |
| `Instrumen_Sedang` | INTEGER | Jumlah instrumen sedang | - |
| `Instrumen_Kecil` | INTEGER | Jumlah instrumen kecil | - |
| `Set_Pack_Besar` | INTEGER | Jumlah set pack besar | - |
| `Set_Pack_Sedang` | INTEGER | Jumlah set pack sedang | - |
| `Set_Pack_Kecil` | INTEGER | Jumlah set pack kecil | - |
| `Makanan_Karyawan_jml_Porsi` | INTEGER | Jumlah porsi makanan karyawan | - |
| `Makanan_Pasien_jml_Porsi` | INTEGER | Jumlah porsi makanan pasien | - |
| `Hari_Rawat_SVIP` | INTEGER | Hari rawat SVIP | - |
| `Hari_Rawat_VIP` | INTEGER | Hari rawat VIP | - |
| `Hari_Rawat_I` | INTEGER | Hari rawat kelas I | - |
| `Hari_Rawat_II` | INTEGER | Hari rawat kelas II | - |
| `Hari_Rawat_III` | INTEGER | Hari rawat kelas III | - |
| `Diklat_Jumlah_Siswa` | INTEGER | Jumlah siswa diklat | - |
| `Diklat_Lama_Hari` | INTEGER | Lama diklat (hari) | - |
| `Jenis` | TEXT | Jenis unit kerja | CHECK |
| `Jumlah_SDM` | INTEGER | **GENERATED** - Total SDM | AUTO-CALCULATED |
| `Total_Kunjungan_Pasien` | INTEGER | **GENERATED** - Total kunjungan | AUTO-CALCULATED |
| `Total_Diklat` | INTEGER | **GENERATED** - Total diklat | AUTO-CALCULATED |
| `Jumlah_Hari_Rawat` | INTEGER | **GENERATED** - Total hari rawat | AUTO-CALCULATED |

**Generated Columns:**
- `Jumlah_SDM` = SDM_dokter + SDM_Perawat + SDM_Non
- `Total_Kunjungan_Pasien` = Kunjungan_Pasien_Lama + Kunjungan_Pasien_Baru
- `Total_Diklat` = Diklat_Jumlah_Siswa × Diklat_Lama_Hari
- `Jumlah_Hari_Rawat` = SUM(semua hari rawat per kelas)

---

### **📊 data_kegiatan_transpose**
**Data kegiatan dalam format transpose (pivot) untuk analisis**

Tabel ini adalah hasil transpose dari `data_kegiatan`, di mana setiap baris mewakili satu kombinasi `(dasar_alokasi, sub_kategori, tahun)` dan setiap kolom mewakili unit kerja. Struktur ini memudahkan analisis data per unit kerja secara horizontal.

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | INTEGER | Primary key | PK, auto-increment |
| `dasar_alokasi` | VARCHAR | Dasar alokasi (contoh: "SDM", "Kunjungan", "Listrik") | NOT NULL |
| `sub_kategori` | VARCHAR | Sub kategori (contoh: "dr", "Total", "Kwh") | - |
| `tahun` | INTEGER | Tahun periode | - |
| `direktur` | DOUBLE PRECISION | Nilai untuk unit kerja Direktur | - |
| `komite_ppi` | DOUBLE PRECISION | Nilai untuk unit kerja Komite PPI | - |
| `komite_pmkp` | DOUBLE PRECISION | Nilai untuk unit kerja Komite PMKP | - |
| `komite_medik` | DOUBLE PRECISION | Nilai untuk unit kerja Komite Medik | - |
| `akreditasi` | DOUBLE PRECISION | Nilai untuk unit kerja Akreditasi | - |
| `dewan_pengawas` | DOUBLE PRECISION | Nilai untuk unit kerja Dewan Pengawas | - |
| ... (35 kolom Pusat Biaya lainnya) | DOUBLE PRECISION | ... | ... |
| `ambulance` | DOUBLE PRECISION | Nilai untuk unit kerja Ambulance | - |
| `laboratorium_pk_pa` | DOUBLE PRECISION | Nilai untuk unit kerja Laboratorium PK PA | - |
| `radiologi` | DOUBLE PRECISION | Nilai untuk unit kerja Radiologi | - |
| `farmasi` | DOUBLE PRECISION | Nilai untuk unit kerja Farmasi | - |
| ... (41 kolom Pusat Pendapatan lainnya) | DOUBLE PRECISION | ... | ... |
| `total_dasar_alokasi` | DOUBLE PRECISION | **GENERATED** - Total semua kolom unit kerja | AUTO-CALCULATED |
| `total_dasar_alokasi_pusat_biaya` | DOUBLE PRECISION | **GENERATED** - Total kolom Pusat Biaya | AUTO-CALCULATED |
| `total_dasar_alokasi_pusat_pendapatan` | DOUBLE PRECISION | **GENERATED** - Total kolom Pusat Pendapatan | AUTO-CALCULATED |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Timestamp update | DEFAULT now() |

**Struktur:**
- Setiap baris = 1 kombinasi `(dasar_alokasi, sub_kategori, tahun)`
- Setiap kolom unit kerja = nilai dari `data_kegiatan` untuk unit kerja tersebut
- Total 76 kolom unit kerja (35 Pusat Biaya + 41 Pusat Pendapatan)

**Kombinasi dasar_alokasi + sub_kategori (48 kombinasi):**
1. **Jml jam Praktek** - Shift (8 jam)
2. **SDM** - dr, Prwt, Non, Total
3. **Listrik** - Kwh
4. **Air** - m3
5. **Telepon** - Freq pakai/titik
6. **Komputer** - jml. User
7. **Tempat Tidur** - SVIP, VIP, I, II, III, Khusus
8. **Kunjungan** - Total, Baru, Lama
9. **Diklat** - Total, Jumlah Siswa, Lama Hari
10. **Hari Rawat** - Total, SVIP, VIP, I, II, III
11. **Tindakan** - Jumlah
12. **Cucian** - kg
13. **Makanan** - Karyawan (Porsi), Pasien (Porsi), Porsi SVIP, VIP, I, II, III
14. **Resep** - Lembar
15. **Instrumen** - Besar, Sedang, Kecil
16. **Set Pack** - Besar, Sedang, Kecil
17. **Kamar** - Luas SVIP, VIP, I, II, III

**Generated Columns:**
- `total_dasar_alokasi` = SUM(semua kolom unit kerja) - Total dari semua 76 kolom unit kerja
- `total_dasar_alokasi_pusat_biaya` = SUM(35 kolom Pusat Biaya) - Total dari unit kerja kategori "Pusat Biaya"
- `total_dasar_alokasi_pusat_pendapatan` = SUM(41 kolom Pusat Pendapatan) - Total dari unit kerja kategori "Pusat Pendapatan"

**Unit Kerja Pusat Biaya (35 kolom):**
direktur, komite_ppi, komite_pmkp, komite_medik, akreditasi, dewan_pengawas, bid_pengembangan, seksi_penunjang_non_medis, ipsrs_medis_non_medis, seksi_penunjang_medis, bid_keperawatan, seksi_asuhan_pelayanan_keperawatan, seksi_pengembangan_dan_etika_keperawatan, bid_pelayanan_medis, seksi_pengembangan_pelayanan_medis, seksi_pelayanan_medis_dan_rekam_medis, tpprj, tppri, bag_tata_usaha, subag_keuangan, unit_perbendaharaan, unit_pendapatan, unit_akuntansi_dan_verifikasi, unit_akuntansi_manajemen, analis_biaya_dan_kasir, subag_umpeg, staf_umum_dan_kepegawaian, unit_it, rumah_tangga, cleaning_service, security, unit_aset, instalasi_humas_komplain, subag_renval, staf_renval, rekam_medik

**Unit Kerja Pusat Pendapatan (41 kolom):**
ambulance, laboratorium_pk_pa, radiologi, farmasi, rehab_medik, gizi_dapur, laundry_cssd, bdrs, cathlab, terang_bulan_vip_vvip, truntum, sekarjagat, jlamprang, nifas, perinatologi, buketan, icu_picu_nicu, vk, igd_ponek, klinik_kebid_kandungan, klinik_bedah_mulut, klinik_syaraf, klinik_bedah_syaraf, klinik_bedah_digestif, klinik_bedah_umum, klinik_anak, klinik_penyakit_dalam, klinik_mata, klinik_kulit_kelamin, klinik_tht, klinik_gigi, klinik_jantung, klinik_dot_vct_cst, klinik_paru, klinik_orthopedi, klinik_jiwa, klinik_parikesit, ibs, pemulasaran_jenazah, hemodialisis, unit_diklat

**Fungsi dan Trigger:**
- `populate_transpose_data()` - Fungsi untuk mengisi/memperbarui data dari `data_kegiatan`
- `refresh_transpose_data()` - Fungsi wrapper untuk memanggil `populate_transpose_data()`
- `refresh_transpose_data_with_status()` - Fungsi wrapper yang mengembalikan status dan durasi
- Trigger `trigger_refresh_transpose_on_data_kegiatan_*` - Trigger otomatis untuk refresh saat `data_kegiatan` berubah
- Trigger `set_totals_on_dk_transpose` - Trigger untuk set nilai total sebelum INSERT/UPDATE
- Trigger `trigger_data_kegiatan_transpose_changed` - Trigger untuk recalculate distribusi biaya setelah perubahan

**Cara Menggunakan:**
- Data diisi otomatis melalui fungsi `refresh_transpose_data()` atau `refresh_transpose_data_with_status()`
- Data juga ter-update otomatis melalui trigger saat `data_kegiatan` diubah (INSERT/UPDATE/DELETE)
- Kolom computed (`total_dasar_alokasi`, `total_dasar_alokasi_pusat_biaya`, `total_dasar_alokasi_pusat_pendapatan`) dihitung otomatis oleh database

---

### **🔄 distribusi_biaya_pertama**
**Distribusi biaya tahap I dari pusat biaya ke unit kerja**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `unit_kerja_pusat_biaya` | TEXT | Unit kerja pusat biaya | - |
| `biaya_tahunan` | NUMERIC | Biaya tahunan unit kerja | - |
| `dasar_alokasi` | TEXT | Dasar alokasi yang digunakan | - |
| `keterangan` | TEXT | Keterangan distribusi | - |
| `tahun` | INTEGER | Tahun periode | DEFAULT 2025 |
| `uk001_direktur` | NUMERIC | Alokasi ke Direktur | DEFAULT 0 |
| `uk002_komite_ppi` | NUMERIC | Alokasi ke Komite PPI | DEFAULT 0 |
| ... | ... | ... (uk003 sampai uk077) | ... |
| `uk077_unit_diklat` | NUMERIC | Alokasi ke Unit Diklat | DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Timestamp update | DEFAULT now() |

**Struktur:**
- Setiap baris = 1 unit kerja pusat biaya yang mendistribusikan biaya
- Setiap kolom uk### = alokasi ke unit kerja tertentu
- Total 77 kolom unit kerja (uk001 sampai uk077)

---

### **💊 kalkulasi_biaya_gizi**
**Kalkulasi unit cost layanan gizi**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `tahun` | INTEGER | Tahun periode | - |
| `kode` | TEXT | Kode makanan | - |
| `jenis_makanan` | TEXT | Jenis makanan | - |
| `waktu_meracik` | INTEGER | Waktu meracik (menit) | DEFAULT 0 |
| `waktu_memasak` | INTEGER | Waktu memasak (menit) | DEFAULT 0 |
| `waktu_menata` | INTEGER | Waktu menata (menit) | DEFAULT 0 |
| `waktu_total` | INTEGER | **GENERATED** - Total waktu | AUTO-CALCULATED |
| `bahan_porsi` | JSONB | Data bahan porsi dalam JSON | - |
| `dasar_alokasi_waktu` | NUMERIC | Dasar alokasi waktu | DEFAULT 0 |
| `biaya_gaji_tunjangan` | INTEGER | Biaya gaji tunjangan | DEFAULT 0 |
| `biaya_jasa_pelayanan` | INTEGER | Biaya jasa pelayanan | DEFAULT 0 |
| `biaya_obat` | INTEGER | Biaya obat | DEFAULT 0 |
| `biaya_bhp` | INTEGER | Biaya BHP | DEFAULT 0 |
| `biaya_makan_karyawan` | INTEGER | Biaya makan karyawan | DEFAULT 0 |
| `biaya_makan_pasien` | INTEGER | Biaya makan pasien | DEFAULT 0 |
| `biaya_rumah_tangga` | INTEGER | Biaya rumah tangga | DEFAULT 0 |
| `biaya_cetak` | INTEGER | Biaya cetak | DEFAULT 0 |
| `biaya_atk` | INTEGER | Biaya ATK | DEFAULT 0 |
| `biaya_listrik` | INTEGER | Biaya listrik | DEFAULT 0 |
| `biaya_air` | INTEGER | Biaya air | DEFAULT 0 |
| `biaya_telp` | INTEGER | Biaya telepon | DEFAULT 0 |
| `biaya_pemeliharaan_bangunan` | INTEGER | Biaya pemeliharaan bangunan | DEFAULT 0 |
| `biaya_pemeliharaan_alat_medis` | INTEGER | Biaya pemeliharaan alat medis | DEFAULT 0 |
| `biaya_pemeliharaan_alat_non_medis` | INTEGER | Biaya pemeliharaan alat non medis | DEFAULT 0 |
| `biaya_operasional_lainnya` | INTEGER | Biaya operasional lainnya | DEFAULT 0 |
| `biaya_penyusutan_gedung` | INTEGER | Biaya penyusutan gedung | DEFAULT 0 |
| `biaya_penyusutan_jaringan` | INTEGER | Biaya penyusutan jaringan | DEFAULT 0 |
| `biaya_penyusutan_alat_medis` | INTEGER | Biaya penyusutan alat medis | DEFAULT 0 |
| `biaya_penyusutan_alat_non_medis` | INTEGER | Biaya penyusutan alat non medis | DEFAULT 0 |
| `biaya_pendidikan_pelatihan` | INTEGER | Biaya pendidikan pelatihan | DEFAULT 0 |
| `biaya_laundry` | INTEGER | Biaya laundry | DEFAULT 0 |
| `biaya_sterilisasi` | INTEGER | Biaya sterilisasi | DEFAULT 0 |
| `biaya_tidak_langsung_terdistribusi` | INTEGER | Biaya tidak langsung terdistribusi | DEFAULT 0 |
| `jumlah_svip` | INTEGER | Jumlah porsi kelas SVIP | DEFAULT 0 |
| `jumlah_vip` | INTEGER | Jumlah porsi kelas VIP | DEFAULT 0 |
| `jumlah_kelas_i` | INTEGER | Jumlah porsi kelas I | DEFAULT 0 |
| `jumlah_kelas_ii` | INTEGER | Jumlah porsi kelas II | DEFAULT 0 |
| `jumlah_kelas_iii` | INTEGER | Jumlah porsi kelas III | DEFAULT 0 |
| `jumlah` | INTEGER | **GENERATED** - Total jumlah porsi | AUTO-CALCULATED |
| `hasil_kali_waktu` | NUMERIC | **GENERATED** - Hasil kali waktu | AUTO-CALCULATED |
| `biaya_bahan_porsi_numeric` | INTEGER | Biaya bahan porsi | DEFAULT 0 |
| `total_unit_cost_per_porsi` | INTEGER | Total unit cost per porsi | - |
| `unit_cost_per_porsi` | INTEGER | **GENERATED** - Unit cost per porsi | AUTO-CALCULATED |
| `tuc_gizi_vvip` | INTEGER | TUC gizi VVIP | DEFAULT 0 |
| `tuc_gizi_vip` | INTEGER | TUC gizi VIP | DEFAULT 0 |
| `tuc_gizi_i` | INTEGER | TUC gizi kelas I | DEFAULT 0 |
| `tuc_gizi_ii` | INTEGER | TUC gizi kelas II | DEFAULT 0 |
| `tuc_gizi_iii` | INTEGER | TUC gizi kelas III | DEFAULT 0 |
| `auc_gizi_vvip` | INTEGER | AUC gizi VVIP | DEFAULT 0 |
| `auc_gizi_vip` | INTEGER | AUC gizi VIP | DEFAULT 0 |
| `auc_gizi_i` | INTEGER | AUC gizi kelas I | DEFAULT 0 |
| `auc_gizi_ii` | INTEGER | AUC gizi kelas II | DEFAULT 0 |
| `auc_gizi_iii` | INTEGER | AUC gizi kelas III | DEFAULT 0 |

**Generated Columns:**
- `waktu_total` = waktu_meracik + waktu_memasak + waktu_menata
- `jumlah` = SUM(semua jumlah per kelas)
- `hasil_kali_waktu` = jumlah × waktu_total
- `unit_cost_per_porsi` = SUM(semua biaya + biaya_bahan_porsi_numeric)

---

### **🧪 kalkulasi_biaya_laboratorium**
**Kalkulasi unit cost laboratorium**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `tahun` | INTEGER | Tahun periode | - |
| `kode` | TEXT | Kode pemeriksaan laboratorium | - |
| `jenis_pemeriksaan` | TEXT | Jenis pemeriksaan | - |
| `bahan_porsi` | JSONB | Data bahan pemeriksaan | - |
| `jumlah` | INTEGER | Jumlah pemeriksaan | - |
| `dasar_alokasi_waktu` | NUMERIC | Dasar alokasi waktu | - |
| `hasil_kali_waktu` | NUMERIC | Hasil kali waktu | - |
| `biaya_gaji_tunjangan` | BIGINT | Biaya gaji tunjangan | - |
| `biaya_jasa_pelayanan` | BIGINT | Biaya jasa pelayanan | - |
| `biaya_obat` | BIGINT | Biaya obat | - |
| `biaya_bhp` | BIGINT | Biaya BHP | - |
| `biaya_makan_karyawan` | BIGINT | Biaya makan karyawan | - |
| `biaya_makan_pasien` | BIGINT | Biaya makan pasien | - |
| `biaya_rumah_tangga` | BIGINT | Biaya rumah tangga | - |
| `biaya_cetak` | BIGINT | Biaya cetak | - |
| `biaya_atk` | BIGINT | Biaya ATK | - |
| `biaya_listrik` | BIGINT | Biaya listrik | - |
| `biaya_air` | BIGINT | Biaya air | - |
| `biaya_telp` | BIGINT | Biaya telepon | - |
| `biaya_pemeliharaan_bangunan` | BIGINT | Biaya pemeliharaan bangunan | - |
| `biaya_pemeliharaan_alat_medis` | BIGINT | Biaya pemeliharaan alat medis | - |
| `biaya_pemeliharaan_alat_non_medis` | BIGINT | Biaya pemeliharaan alat non medis | - |
| `biaya_operasional_lainnya` | BIGINT | Biaya operasional lainnya | - |
| `biaya_penyusutan_gedung` | BIGINT | Biaya penyusutan gedung | - |
| `biaya_penyusutan_jaringan` | BIGINT | Biaya penyusutan jaringan | - |
| `biaya_penyusutan_alat_medis` | BIGINT | Biaya penyusutan alat medis | - |
| `biaya_penyusutan_alat_non_medis` | BIGINT | Biaya penyusutan alat non medis | - |
| `biaya_pendidikan_pelatihan` | BIGINT | Biaya pendidikan pelatihan | - |
| `biaya_laundry` | BIGINT | Biaya laundry | - |
| `biaya_sterilisasi` | BIGINT | Biaya sterilisasi | - |
| `biaya_tidak_langsung_terdistribusi` | BIGINT | Biaya tidak langsung terdistribusi | - |
| `biaya_bahan_pemeriksaan_numeric` | INTEGER | Biaya bahan pemeriksaan | - |
| `waktu_pemeriksaan` | INTEGER | Waktu pemeriksaan (menit) | - |
| `profesionalisme` | INTEGER | Tingkat profesionalisme | - |
| `tingkat_kesulitan` | INTEGER | Tingkat kesulitan | - |
| `hasil_kali` | INTEGER | Hasil kali | - |
| `dasar_alokasi_hasil_kali` | NUMERIC | Dasar alokasi hasil kali | - |
| `bahan_pemeriksaan` | JSONB | Data bahan pemeriksaan | - |
| `unit_cost_per_pemeriksaan` | BIGINT | **GENERATED** - Unit cost per pemeriksaan | AUTO-CALCULATED |
| `kode_unit_kerja` | TEXT | Kode unit kerja (UK038) | DEFAULT 'UK038' |

**Generated Columns:**
- `unit_cost_per_pemeriksaan` = SUM(semua biaya + biaya_bahan_pemeriksaan_numeric)

---

### **🏥 kalkulasi_tindakan_inap**
**Kalkulasi unit cost tindakan rawat inap**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `tahun` | INTEGER | Tahun periode | - |
| `kode_jenis` | SMALLINT | Kode jenis (2 = rawat inap) | - |
| `kode_unit_kerja` | TEXT | Kode unit kerja | FK ke unit_kerja.kode |
| `nama_unit_kerja` | TEXT | Nama unit kerja | - |
| `kode_jenis_tindakan` | VARCHAR | Kode jenis tindakan | FK ke daftar_tindakan.kode_tindakan |
| `jenis_tindakan` | VARCHAR | Jenis tindakan | - |
| `jumlah` | INTEGER | Jumlah tindakan | DEFAULT 0 |
| `waktu` | INTEGER | Waktu tindakan (menit) | DEFAULT 0 |
| `profesionalisme` | SMALLINT | Tingkat profesionalisme | DEFAULT 1 |
| `tingkat_kesulitan` | SMALLINT | Tingkat kesulitan | DEFAULT 1 |
| `hasil_kali_waktu` | INTEGER | Hasil kali waktu | DEFAULT 0 |
| `hasil_kali` | INTEGER | Hasil kali | DEFAULT 0 |
| `biaya_bahan_tindakan` | INTEGER | Biaya bahan tindakan | DEFAULT 0 |
| `kali_bahan` | BIGINT | Kali bahan | DEFAULT 0 |
| `rasio_tindakan` | NUMERIC | Rasio tindakan | DEFAULT 0 |
| `dasar_alokasi_kali_waktu` | NUMERIC | Dasar alokasi kali waktu | DEFAULT 0 |
| `dasar_alokasi_hasil_kali` | NUMERIC | Dasar alokasi hasil kali | DEFAULT 0 |
| `biaya_gaji_tunjangan` | BIGINT | Biaya gaji tunjangan | DEFAULT 0 |
| `biaya_jasa_pelayanan` | BIGINT | Biaya jasa pelayanan | DEFAULT 0 |
| `biaya_obat` | BIGINT | Biaya obat | DEFAULT 0 |
| `biaya_bhp` | BIGINT | Biaya BHP | DEFAULT 0 |
| `biaya_makan_karyawan` | BIGINT | Biaya makan karyawan | DEFAULT 0 |
| `biaya_makan_pasien` | BIGINT | Biaya makan pasien | DEFAULT 0 |
| `biaya_rumah_tangga` | BIGINT | Biaya rumah tangga | DEFAULT 0 |
| `biaya_cetak` | BIGINT | Biaya cetak | DEFAULT 0 |
| `biaya_atk` | BIGINT | Biaya ATK | DEFAULT 0 |
| `biaya_listrik` | BIGINT | Biaya listrik | DEFAULT 0 |
| `biaya_air` | BIGINT | Biaya air | DEFAULT 0 |
| `biaya_telp` | BIGINT | Biaya telepon | DEFAULT 0 |
| `biaya_pemeliharaan_bangunan` | BIGINT | Biaya pemeliharaan bangunan | DEFAULT 0 |
| `biaya_pemeliharaan_alat_medis` | BIGINT | Biaya pemeliharaan alat medis | DEFAULT 0 |
| `biaya_pemeliharaan_alat_non_medis` | BIGINT | Biaya pemeliharaan alat non medis | DEFAULT 0 |
| `biaya_operasional_lainnya` | BIGINT | Biaya operasional lainnya | DEFAULT 0 |
| `biaya_penyusutan_gedung` | BIGINT | Biaya penyusutan gedung | DEFAULT 0 |
| `biaya_penyusutan_jaringan` | BIGINT | Biaya penyusutan jaringan | DEFAULT 0 |
| `biaya_penyusutan_alat_medis` | BIGINT | Biaya penyusutan alat medis | DEFAULT 0 |
| `biaya_penyusutan_alat_non_medis` | BIGINT | Biaya penyusutan alat non medis | DEFAULT 0 |
| `biaya_pendidikan_pelatihan` | BIGINT | Biaya pendidikan pelatihan | DEFAULT 0 |
| `biaya_laundry` | BIGINT | Biaya laundry | DEFAULT 0 |
| `biaya_sterilisasi` | BIGINT | Biaya sterilisasi | DEFAULT 0 |
| `biaya_tidak_langsung_terdistribusi` | BIGINT | Biaya tidak langsung terdistribusi | DEFAULT 0 |
| `unit_cost_tindakan_inap` | BIGINT | **GENERATED** - Unit cost tindakan inap | AUTO-CALCULATED |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Timestamp update | DEFAULT now() |

**Generated Columns:**
- `unit_cost_tindakan_inap` = SUM(semua biaya)

---

### **📋 rekapitulasi_unit_cost**
**Rekap unit cost dari semua tabel kalkulasi**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `tahun` | INTEGER | Tahun periode | - |
| `kode_jenis` | SMALLINT | Kode jenis (1=RJ, 2=RI, 3=Op, 4=NL) | - |
| `kode_unit_kerja` | TEXT | Kode unit kerja | - |
| `nama_unit_kerja` | TEXT | Nama unit kerja | - |
| `kode_operator` | TEXT | Kode operator (untuk operatif) | - |
| `nama_operator` | TEXT | Nama operator (untuk operatif) | - |
| `kode_tindakan` | TEXT | Kode tindakan | - |
| `nama_tindakan` | TEXT | Nama tindakan | - |
| `biaya_bahan` | BIGINT | Biaya bahan | DEFAULT 0 |
| `unit_cost_per_tindakan` | BIGINT | Unit cost per tindakan | DEFAULT 0 |
| `sumber_tabel` | TEXT | Nama tabel sumber | CHECK |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Timestamp update | DEFAULT now() |

**Constraint:**
- `sumber_tabel` harus salah satu dari:
  - 'kalkulasi_biaya_laboratorium'
  - 'kalkulasi_biaya_radiologi'
  - 'kalkulasi_bdrs'
  - 'kalkulasi_tindakan_inap'
  - 'kalkulasi_tindakan_rawat_jalan'
  - 'kalkulasi_tindakan_operatif'
  - 'kalkulasi_biaya_cathlab'

---

### **💰 skenario_tarif**
**Simulasi tarif berdasarkan unit cost**

| Kolom | Tipe | Deskripsi | Constraint |
|-------|------|-----------|------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `user_id` | UUID | Foreign key ke auth.users | FK, nullable |
| `tahun` | INTEGER | Tahun periode | - |
| `kode_jenis` | SMALLINT | Kode jenis | - |
| `kode_unit_kerja` | TEXT | Kode unit kerja | - |
| `nama_unit_kerja` | TEXT | Nama unit kerja | - |
| `kode_operator` | TEXT | Kode operator | - |
| `nama_operator` | TEXT | Nama operator | - |
| `kode_tindakan` | TEXT | Kode tindakan | - |
| `nama_tindakan` | TEXT | Nama tindakan | - |
| `biaya_bahan` | BIGINT | Biaya bahan | DEFAULT 0 |
| `unit_cost_per_tindakan` | BIGINT | Unit cost per tindakan | DEFAULT 0 |
| `prosentase_jasa_pelayanan` | NUMERIC | Prosentase jasa pelayanan (%) | DEFAULT 0 |
| `prosentase_profit` | NUMERIC | Prosentase profit (%) | DEFAULT 0 |
| `jasa_sarana` | BIGINT | Jasa sarana | DEFAULT 0 |
| `jasa_pelayanan` | BIGINT | Jasa pelayanan | DEFAULT 0 |
| `tarif_per_tindakan` | BIGINT | Tarif per tindakan | DEFAULT 0 |
| `sumber_tabel` | TEXT | Nama tabel sumber | CHECK |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Timestamp update | DEFAULT now() |

**Constraint:**
- `sumber_tabel` harus salah satu dari:
  - 'kalkulasi_biaya_laboratorium'
  - 'kalkulasi_biaya_radiologi'
  - 'kalkulasi_bdrs'
  - 'kalkulasi_tindakan_inap'
  - 'kalkulasi_tindakan_rawat_jalan'
  - 'kalkulasi_tindakan_operatif'
  - 'kalkulasi_biaya_cathlab'

---

## 🔗 **Relasi Antar Tabel**

### **Relasi Utama:**

1. **unit_kerja** → **data_biaya**
   - `unit_kerja.id` → `data_biaya.unit_kerja_id`

2. **unit_kerja** → **data_pendapatan**
   - `unit_kerja.id` → `data_pendapatan.unit_kerja_id`

3. **daftar_tindakan** → **jenis_tindakan_inap**
   - `daftar_tindakan.kode_tindakan` → `jenis_tindakan_inap.kode_jenis_tindakan`

4. **daftar_tindakan** → **jenis_tindakan_rawat_jalan**
   - `daftar_tindakan.kode_tindakan` → `jenis_tindakan_rawat_jalan.kode_jenis_tindakan`

5. **unit_kerja** → **jenis_tindakan_inap**
   - `unit_kerja.kode` → `jenis_tindakan_inap.kode_unit_kerja`

6. **unit_kerja** → **jenis_tindakan_rawat_jalan**
   - `unit_kerja.kode` → `jenis_tindakan_rawat_jalan.kode_unit_kerja`

7. **jenis_tindakan_inap** → **kalkulasi_tindakan_inap**
   - Sinkronisasi otomatis via trigger

8. **jenis_tindakan_rawat_jalan** → **kalkulasi_tindakan_rawat_jalan**
   - Sinkronisasi otomatis via trigger

9. **rekapitulasi_unit_cost** ← **semua tabel kalkulasi**
   - Data dikumpulkan dari semua tabel kalkulasi

10. **skenario_tarif** ← **rekapitulasi_unit_cost**
    - Data diambil dari rekapitulasi untuk simulasi tarif

### **Foreign Key Constraints:**

- Semua tabel memiliki `user_id` → `auth.users.id` untuk Row Level Security
- Tabel kalkulasi memiliki relasi ke `unit_kerja.kode`
- Tabel kalkulasi memiliki relasi ke `daftar_tindakan.kode_tindakan`
- Tabel distribusi biaya saling berelasi untuk alokasi

---

## ⚙️ **Fungsi dan Trigger**

### **Trigger Utama:**

1. **calculate_skenario_tarif()**
   - Trigger untuk menghitung jasa_sarana, jasa_pelayanan, dan tarif_per_tindakan
   - Formula:
     - `jasa_sarana = (1 + prosentase_profit/100) * unit_cost_per_tindakan`
     - `jasa_pelayanan = (unit_cost_per_tindakan + biaya_bahan) * prosentase_jasa_pelayanan / 100`
     - `tarif_per_tindakan = jasa_sarana + biaya_bahan + jasa_pelayanan`

2. **privileged_sync_jenis_tindakan_to_kalkulasi_inap()**
   - Trigger untuk sinkronisasi otomatis antara `jenis_tindakan_inap` dan `kalkulasi_tindakan_inap`
   - Menangani INSERT, UPDATE, DELETE
   - Menggunakan SECURITY DEFINER untuk bypass RLS

3. **auto_cleanup_orphaned_data()**
   - Trigger untuk membersihkan data orphan setelah DELETE
   - Memanggil `cleanup_orphaned_kalkulasi_tindakan_inap()`

### **Fungsi Utama:**

1. **cleanup_orphaned_kalkulasi_tindakan_inap()**
   - Membersihkan data di `kalkulasi_tindakan_inap` yang tidak memiliki relasi dengan `jenis_tindakan_inap`

2. **populate_skenario_tarif_from_rekapitulasi()**
   - Mengisi data `skenario_tarif` dari `rekapitulasi_unit_cost`

3. **populate_transpose_data()**
   - Fungsi untuk mengisi/memperbarui data di tabel `data_kegiatan_transpose` dari `data_kegiatan`
   - Melakukan transpose data: setiap baris = kombinasi `(dasar_alokasi, sub_kategori, tahun)`, setiap kolom = unit kerja
   - Memproses 48 kombinasi dasar_alokasi + sub_kategori
   - Menggunakan SECURITY DEFINER untuk bypass RLS
   - Timeout: 20 menit (1200 detik)
   - **Return:** void

4. **refresh_transpose_data()**
   - Wrapper function untuk memanggil `populate_transpose_data()`
   - Menggunakan SECURITY DEFINER untuk bypass RLS
   - **Return:** void

5. **refresh_transpose_data_with_status()**
   - Wrapper function yang mengembalikan status dan durasi eksekusi
   - Menggunakan SECURITY DEFINER untuk bypass RLS
   - **Return:** JSONB dengan format:
     ```json
     {
       "success": true/false,
       "message": "Data berhasil diperbarui" / "Gagal memperbarui data transpose",
       "duration_seconds": 0.123,
       "error": "error message" (jika ada),
       "detail": "error stack" (jika ada)
     }
     ```

6. **trigger_refresh_transpose_data()**
   - Trigger function yang dipanggil otomatis saat `data_kegiatan` berubah
   - Memanggil `refresh_transpose_data()` untuk update otomatis
   - Dipanggil oleh trigger: `trigger_refresh_transpose_on_data_kegiatan_insert`, `trigger_refresh_transpose_on_data_kegiatan_update`, `trigger_refresh_transpose_on_data_kegiatan_delete`

---

## 🔒 **Row Level Security (RLS)**

Semua tabel utama memiliki RLS enabled dengan policy:
- User hanya dapat mengakses data milik mereka (`user_id = auth.uid()`)
- Beberapa fungsi menggunakan `SECURITY DEFINER` untuk bypass RLS saat diperlukan

---

## 📊 **Generated Columns**

Banyak tabel menggunakan generated columns untuk perhitungan otomatis:

1. **data_biaya**: `biaya_bahan`, `biaya_pegawai`, `biaya_daya`, `biaya_pemeliharaan`, `biaya_penyusutan`, `total_biaya`, `total_biaya_tanpa_jp`

2. **data_kegiatan**: `Jumlah_SDM`, `Total_Kunjungan_Pasien`, `Total_Diklat`, `Jumlah_Hari_Rawat`

3. **data_kegiatan_transpose**: `total_dasar_alokasi`, `total_dasar_alokasi_pusat_biaya`, `total_dasar_alokasi_pusat_pendapatan`

4. **kalkulasi_biaya_gizi**: `waktu_total`, `jumlah`, `hasil_kali_waktu`, `unit_cost_per_porsi`

5. **Semua tabel kalkulasi**: `unit_cost_per_*` = SUM(semua biaya)

---

## 🎯 **Workflow Sistem**

### **1. Input Data Operasional**
```
data_kegiatan + data_biaya + data_pendapatan
↓
data_kegiatan_transpose (transpose otomatis dari data_kegiatan)
↓
Distribusi Biaya (Tahap I & II)
↓
Kalkulasi Unit Cost
```

### **2. Kalkulasi Unit Cost**
```
Jenis Tindakan → Kalkulasi Biaya → Unit Cost
↓
Rekapitulasi → Skenario Tarif
```

### **3. Sinkronisasi Otomatis**
```
jenis_tindakan_inap ↔ kalkulasi_tindakan_inap
(INSERT/UPDATE/DELETE otomatis tersinkronisasi)
```

---

## 🔧 **Konfigurasi Database**

### **Extensions yang Digunakan:**
- `uuid-ossp`: Generate UUID
- `pgcrypto`: Cryptographic functions
- `pg_stat_statements`: Query performance monitoring
- `pg_graphql`: GraphQL support

### **Indexes:**
- Primary keys pada semua tabel
- Unique constraints pada kode-kode
- Foreign key indexes
- Indexes pada `user_id` untuk RLS performance

---

## 📝 **Catatan Penting**

1. **Data Integrity**: Semua relasi menggunakan foreign key constraints
2. **Audit Trail**: Setiap tabel memiliki `created_at` dan `updated_at`
3. **Multi-tenancy**: RLS memastikan isolasi data antar user
4. **Auto-calculation**: Generated columns memastikan konsistensi perhitungan
5. **Trigger-based Sync**: Sinkronisasi otomatis antar tabel terkait
6. **Flexible Schema**: JSONB fields untuk data yang fleksibel
7. **Performance**: Indexes dan constraints untuk performa optimal

---

*Dokumentasi ini dibuat untuk membantu developer memahami struktur database Aplikasi Unit Cost RS. Untuk informasi lebih detail tentang implementasi, silakan lihat kode sumber aplikasi.*