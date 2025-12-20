# Changelog: Kalkulasi Biaya Kelas Akomodasi

## [2024-12-10] Perbaikan Rumus Dasar Alokasi

### Perubahan Utama
Memperbaiki rumus kalkulasi biaya kelas akomodasi dengan menambahkan 2 jenis dasar alokasi baru dan menyesuaikan rumus setiap kolom biaya.

### Detail Perubahan

#### 1. Penambahan Kolom Baru
- **dasar_alokasi_tempat_tidur**: Rasio tempat tidur kelas terhadap total tempat tidur unit
- **dasar_alokasi_luas_kamar**: Rasio luas kamar kelas terhadap total luas kamar unit

#### 2. Kategori Biaya Berdasarkan Dasar Alokasi

##### Kategori A: Biaya dengan `dasar_alokasi_hari_rawat` (13 kolom)
Rumus: `biaya_dari_kalkulasi_biaya_akomodasi × dasar_alokasi_hari_rawat`

1. biaya_gaji_tunjangan
2. biaya_jasa_pelayanan
3. biaya_obat
4. biaya_bhp
5. biaya_makan_karyawan
6. biaya_makan_pasien
7. biaya_rumah_tangga
8. biaya_cetak
9. biaya_atk
10. biaya_operasional_lainnya
11. biaya_pendidikan_pelatihan
12. biaya_laundry
13. biaya_sterilisasi

##### Kategori B: Biaya dengan `dasar_alokasi_tempat_tidur` (7 kolom)
Rumus: `biaya_dari_kalkulasi_biaya_akomodasi × dasar_alokasi_tempat_tidur`

1. biaya_listrik
2. biaya_air
3. biaya_telp
4. biaya_pemeliharaan_alat_medis
5. biaya_pemeliharaan_alat_non_medis
6. biaya_penyusutan_alat_medis
7. biaya_penyusutan_alat_non_medis

##### Kategori C: Biaya dengan `dasar_alokasi_luas_kamar` (4 kolom)
Rumus: `biaya_dari_kalkulasi_biaya_akomodasi × dasar_alokasi_luas_kamar`

1. biaya_pemeliharaan_bangunan
2. biaya_penyusutan_gedung
3. biaya_penyusutan_jaringan
4. biaya_tidak_langsung_terdistribusi

#### 3. Rumus Dasar Alokasi

```sql
-- Dasar alokasi hari rawat
dasar_alokasi_hari_rawat = hari_rawat_kelas / total_hari_rawat_unit

-- Dasar alokasi tempat tidur (BARU)
dasar_alokasi_tempat_tidur = tempat_tidur_kelas / total_tempat_tidur_unit

-- Dasar alokasi luas kamar (BARU)
dasar_alokasi_luas_kamar = kamar_luas_kelas / total_kamar_luas_unit
```

#### 4. Kolom yang Tidak Berubah

**alokasi_biaya_gizi**: Tetap menggunakan rumus:
```sql
alokasi_biaya_gizi = jumlah_kali_porsi_kelas / hari_rawat_kelas
```

### Rasionalisasi Perubahan

#### Mengapa Ada 3 Jenis Dasar Alokasi?

1. **Dasar Alokasi Hari Rawat**: Digunakan untuk biaya yang berkaitan dengan pelayanan medis dan operasional harian yang terikat langsung dengan lama rawat inap pasien.

2. **Dasar Alokasi Tempat Tidur**: Digunakan untuk biaya yang terkait dengan fasilitas dan peralatan per tempat tidur, seperti:
   - Utilitas (listrik, air, telepon)
   - Pemeliharaan dan penyusutan alat medis/non-medis

3. **Dasar Alokasi Luas Kamar**: Digunakan untuk biaya yang berkaitan dengan infrastruktur fisik bangunan dan jaringan, seperti:
   - Pemeliharaan bangunan
   - Penyusutan gedung dan jaringan
   - Biaya tidak langsung terdistribusi

### Impact Analysis

#### Before (Semua menggunakan dasar_alokasi_hari_rawat)
```sql
biaya_listrik = biaya_listrik_kalkulasi × dasar_alokasi_hari_rawat
biaya_pemeliharaan_bangunan = biaya_pemeliharaan_bangunan_kalkulasi × dasar_alokasi_hari_rawat
```

#### After (Menggunakan dasar alokasi yang sesuai)
```sql
biaya_listrik = biaya_listrik_kalkulasi × dasar_alokasi_tempat_tidur
biaya_pemeliharaan_bangunan = biaya_pemeliharaan_bangunan_kalkulasi × dasar_alokasi_luas_kamar
```

### Migration

File: `database/migrations/20241210_fix_kalkulasi_kelas_akomodasi_dasar_alokasi.sql`

**Langkah-langkah:**
1. Tambahkan kolom `dasar_alokasi_tempat_tidur` dan `dasar_alokasi_luas_kamar`
2. Update function `populate_kalkulasi_biaya_kelas_akomodasi`
3. Update comment pada function

### Testing Checklist

- [ ] Verifikasi kolom baru ada di tabel `kalkulasi_biaya_kelas_akomodasi`
- [ ] Test function `populate_kalkulasi_biaya_kelas_akomodasi` dengan data sample
- [ ] Verifikasi perhitungan `dasar_alokasi_tempat_tidur` sudah benar
- [ ] Verifikasi perhitungan `dasar_alokasi_luas_kamar` sudah benar
- [ ] Verifikasi setiap kategori biaya menggunakan dasar alokasi yang tepat
- [ ] Compare hasil before/after untuk memastikan perubahan sesuai ekspektasi
- [ ] Test dengan berbagai kelas (VVIP, VIP, I, II, III)
- [ ] Test dengan berbagai unit kerja

### Rollback

Jika perlu rollback, gunakan backup function di:
`database/fix_populate_kalkulasi_biaya_kelas_akomodasi.sql.backup`

### Notes

- Perubahan ini tidak bersifat backward breaking karena kolom baru memiliki default value 0
- Data existing akan tetap valid, namun perlu re-kalkulasi untuk mendapatkan nilai yang benar
- Relasi dengan tabel lain tidak terpengaruh
- RLS policies tidak perlu diubah

### Related Files

- Main function: `database/fix_populate_kalkulasi_biaya_kelas_akomodasi.sql`
- Backup: `database/fix_populate_kalkulasi_biaya_kelas_akomodasi.sql.backup`
- Migration: `database/migrations/20241210_fix_kalkulasi_kelas_akomodasi_dasar_alokasi.sql`
- Frontend: `src/pages/KalkulasiBiayaKelasAkomodasi.tsx`

### Contributors

- Date: 2024-12-10
- Changes: Implemented 3-tier allocation base system for cost calculation




