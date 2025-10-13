## Skema dan Perhitungan Kalkulasi Biaya Gizi

Dokumen ini merangkum struktur tabel, kolom-kolom biaya, kolom hasil kalkulasi, serta perilaku aplikasi (ringkasan AUC, ekspor CSV, dan filter) pada fitur Kalkulasi Biaya Gizi.

### 1) Tabel: `kalkulasi_biaya_gizi`

- Identitas dan dasar data
  - `id` uuid (PK)
  - `user_id` uuid (nullable)
  - `tahun` integer (wajib)
  - `kode` text (wajib)
  - `jenis_makanan` text (wajib) – contoh: "Makanan Biasa nasi VVIP", "Bubur nasi TKTP Kelas II"
  - `bahan_porsi` jsonb (opsional) – array item bahan dengan field seperti `biaya_bahan_porsi`

- Porsi per kelas (sumber jumlah total)
  - `jumlah_svip` integer (SVIP/VVIP)
  - `jumlah_vip` integer
  - `jumlah_kelas_i` integer
  - `jumlah_kelas_ii` integer
  - `jumlah_kelas_iii` integer
  - `jumlah` integer (generated/terisi otomatis dari total seluruh kelas)

- Waktu kerja (menit)
  - `waktu_meracik` integer
  - `waktu_memasak` integer
  - `waktu_menata` integer
  - `waktu_total` integer (opsional)
  - `dasar_alokasi_waktu` numeric (opsional)
  - `hasil_kali_waktu` numeric (opsional)

- Kolom biaya (seluruhnya integer)
  - `biaya_gaji_tunjangan`
  - `biaya_jasa_pelayanan`
  - `biaya_obat`
  - `biaya_bhp`
  - `biaya_makan_karyawan`
  - `biaya_makan_pasien`
  - `biaya_rumah_tangga`
  - `biaya_cetak`
  - `biaya_atk`
  - `biaya_listrik`
  - `biaya_air`
  - `biaya_telp`
  - `biaya_pemeliharaan_bangunan`
  - `biaya_pemeliharaan_alat_medis`
  - `biaya_pemeliharaan_alat_non_medis`
  - `biaya_operasional_lainnya`
  - `biaya_penyusutan_gedung`
  - `biaya_penyusutan_jaringan`
  - `biaya_penyusutan_alat_medis`
  - `biaya_penyusutan_alat_non_medis`
  - `biaya_pendidikan_pelatihan`
  - `biaya_laundry`
  - `biaya_sterilisasi`
  - `biaya_tidak_langsung_terdistribusi`
  - `biaya_bahan_porsi_numeric` (integer) – jumlah biaya bahan per porsi (bila tidak ada, dihitung dari `bahan_porsi` saat ekspor)

- Kolom total dan unit cost
  - `unit_cost_per_porsi` integer (generated) = penjumlahan seluruh 25 kolom biaya
  - `total_unit_cost_per_porsi` integer (riil/terisi via proses sebelumnya – tidak wajib dipakai bila `unit_cost_per_porsi` sudah generated)

- Kolom agregat biaya (TUC = Total Unit Cost per kategori)
  - `tuc_gizi_VVIP` integer = `jumlah * unit_cost_per_porsi` hanya untuk baris yang bertipe VVIP/SVIP
  - `tuc_gizi_VIP` integer = `jumlah * unit_cost_per_porsi` hanya untuk VIP (tanpa VVIP)
  - `tuc_gizi_I` integer = `jumlah * unit_cost_per_porsi` hanya untuk "Kelas I" (tanpa Kelas II/III)
  - `tuc_gizi_II` integer = `jumlah * unit_cost_per_porsi` hanya untuk "Kelas II" (tanpa Kelas I/III)
  - `tuc_gizi_III` integer = `jumlah * unit_cost_per_porsi` hanya untuk "Kelas III" (tanpa Kelas I/II)

- Kolom AUC (Average Unit Cost, rata-rata per kelas – disimpan sebagai angka integer sama untuk semua baris saat update massal)
  - `auc_gizi_VVIP` = `SUM(tuc_gizi_VVIP) / SUM(jumlah_svip)`
  - `auc_gizi_VIP` = `SUM(tuc_gizi_VIP) / SUM(jumlah_vip)`
  - `auc_gizi_I` = `SUM(tuc_gizi_I) / SUM(jumlah_kelas_i)`
  - `auc_gizi_II` = `SUM(tuc_gizi_II) / SUM(jumlah_kelas_ii)`
  - `auc_gizi_III` = `SUM(tuc_gizi_III) / SUM(jumlah_kelas_iii)`

Catatan: VVIP ≡ SVIP (identik untuk tujuan agregasi).

### 2) Formula Utama

- Isi kolom biaya turunan (contoh):
  - `biaya_rumah_tangga` = `biaya_rumah_tangga_unit_gizi * (dasar_alokasi_waktu / jumlah)`
  - Formula serupa diterapkan untuk kolom biaya lain yang ditarik dari `data_biaya` atau rekap distribusi sesuai instruksi.

- `unit_cost_per_porsi` (generated integer):
  - Penjumlahan 25 kolom biaya + `biaya_bahan_porsi_numeric` (jika termasuk dalam definisi total)

- TUC per kategori:
  - `tuc_gizi_*` = `jumlah * unit_cost_per_porsi` untuk baris yang sesuai kategori saja.

- AUC per kategori (rata-rata):
  - `auc_gizi_*` = `SUM(tuc_gizi_*) / SUM(jumlah_kelas_*)` (dibulatkan ke integer)

### 3) Perilaku Halaman Aplikasi (`src/pages/KalkulasiBiayaGizi.tsx`)

- Ringkasan AUC di bagian paling atas:
  - Menampilkan AUC untuk SVIP/VVIP, VIP, Kelas I, II, III (client-side compute dari data yang dimuat untuk tahun aktif).
  - Dua tombol unduh: "Unduh Ringkasan AUC" (CSV) dan "Unduh Data Detail" (CSV berisi metadata utama).

- Tombol "Unduh Laporan Detail Biaya":
  - Mengambil data terkini langsung dari `kalkulasi_biaya_gizi` untuk tahun aktif.
  - Memuat seluruh kolom biaya + `biaya_bahan_porsi` (diisi dari `biaya_bahan_porsi_numeric` atau dihitung dari JSON `bahan_porsi` jika numeric tidak ada).
  - Dapat difilter berdasarkan `jenis_makanan` menggunakan aturan strict berikut:
    - Pilih "VVIP"/"SVIP": hanya baris yang mengandung VVIP/SVIP (mengecualikan VIP saja).
    - Pilih "VIP": hanya VIP, mengecualikan VVIP.
    - Pilih "Kelas I": hanya yang mengandung "Kelas I" (tanpa "Kelas II/III").
    - Pilih "Kelas II": hanya "Kelas II" (tanpa "Kelas I/III").
    - Pilih "Kelas III": hanya "Kelas III" (tanpa "Kelas I/II").
    - Selain kata kunci di atas, fallback ke pencarian substring `jenis_makanan`.

- Realtime sinkronisasi:
  - Halaman berlangganan perubahan `kalkulasi_biaya_gizi` (insert/update/delete) dan otomatis memuat ulang data.

### 4) Ekspor CSV

- Format CSV mengikuti header dari objek data, contoh untuk laporan detail biaya:
  - `tahun, kode, jenis_makanan, jumlah, unit_cost_per_porsi, ...[seluruh kolom biaya]..., biaya_bahan_porsi`
  - Nama berkas:
    - Ringkasan AUC: `ringkasan_auc_gizi_<tahun>.csv`
    - Data detail umum: `detail_kalkulasi_gizi_<tahun>.csv`
    - Laporan detail biaya: `detail_biaya_gizi_<tahun>[_filter_<teks>].csv`

### 5) Catatan Implementasi

- Semua kolom biaya bertipe integer (tidak ada angka desimal) untuk konsistensi.
- `unit_cost_per_porsi` diset sebagai kolom generated agar selalu konsisten terhadap perubahan komponen biaya.
- Perhitungan AUC di UI bersifat client-side agar responsif dan sinkron dengan filter tahun.


