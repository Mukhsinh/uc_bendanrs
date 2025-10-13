# Dokumentasi Skema Distribusi Biaya Pertama

## Overview
Dokumentasi ini menjelaskan skema perhitungan dan relasi antara tabel `distribusi_biaya_pertama` dan `total_alokasi_biaya_pertama`.

## 1. Tabel distribusi_biaya_pertama

### Karakteristik (versi terbaru)
- Presisi: Seluruh nilai disimpan sebagai bilangan bulat (tanpa desimal)
- Jumlah Baris: 36 baris (sesuai jumlah unit kerja pusat biaya)
- Kolom:
  - `unit_kerja_pusat_biaya` ("KODE - NAMA")
  - `biaya_tahunan` (mengikuti preferensi: total_biaya atau total_biaya_tanpa_jp)
  - `dasar_alokasi` (Total_SDM | Total_Kunjungan_Pasien | Luas_Ruangan | Komputer_simrs_user)
  - `tahun`
  - `keterangan` (format: "Basis: … Semua UK (kecuali sumber)")
  - `jumlah_biaya_terdistribusi_i` (penjumlahan seluruh kolom UK per baris)
  - `audit_check` (OK jika jumlah_biaya_terdistribusi_i = biaya_tahunan, selain itu CEK)
  - 77 kolom unit kerja penerima: `ukXXX_nama_unit_kerja`

### Format Kolom
- Semua kolom unit kerja menggunakan format: `ukXXX_nama_unit_kerja` (huruf kecil dengan underscore)
- Contoh: `uk001_direktur`, `uk041_rehab_medik`, `uk064_klinik_mata`

### Perhitungan
- Setiap baris mewakili satu unit kerja sebagai pusat biaya
- Kolom dalam baris tersebut menunjukkan alokasi biaya ke unit kerja lain
- Nilai di kolom unit kerja yang sama dengan baris = 0 (tidak mengalokasi ke diri sendiri)
- Semua alokasi dibulatkan ke 0 desimal; jika terjadi selisih integer terhadap `biaya_tahunan`, selisih tersebut diserap ke kolom target dengan nilai alokasi terbesar (non-self) agar total tepat sama.

## 2. Tabel total_alokasi_biaya_pertama

### Karakteristik
- Presisi: Mengikuti format integer dari distribusi_biaya_pertama
- Jumlah Baris: 1 baris (summary dari semua distribusi)
- Kolom: 77 kolom unit kerja (UK001_Direktur hingga UK077_Unit_Diklat)

### Format Kolom
- Semua kolom unit kerja menggunakan format: `UKXXX_Nama_Unit_Kerja` (huruf besar dengan underscore)
- Contoh: `UK001_Direktur`, `UK041_Rehab_Medik`, `UK064_Klinik_Mata`

### Perhitungan Row Summing
Setiap kolom di `total_alokasi_biaya_pertama` dihitung sebagai penjumlahan vertikal dari kolom yang sama di `distribusi_biaya_pertama`:

```sql
UK001_Direktur = SUM(uk001_direktur) FROM distribusi_biaya_pertama
UK041_Rehab_Medik = SUM(uk041_rehab_medik) FROM distribusi_biaya_pertama
UK064_Klinik_Mata = SUM(uk064_klinik_mata) FROM distribusi_biaya_pertama
-- ... dan seterusnya untuk semua 77 kolom
```

## 3. Relasi dan Mapping

### Mapping Kolom
| distribusi_biaya_pertama | total_alokasi_biaya_pertama |
|-------------------------|----------------------------|
| uk001_direktur | UK001_Direktur |
| uk002_komite_ppi | UK002_Komite_PPI |
| uk041_rehab_medik | UK041_Rehab_Medik |
| uk064_klinik_mata | UK064_Klinik_Mata |
| uk076_hemodialisis | UK076_Hemodialisis |

## 4. Aturan Penting (versi terbaru)

### Presisi
- Wajib integer (0 desimal) untuk seluruh nilai.

### Konsistensi Data
- Tidak boleh ada kolom duplikat dengan format berbeda
- Semua kolom harus menggunakan format underscore (bukan spasi)
- Relasi penjumlahan harus selalu konsisten antara kedua tabel

### Validasi
- `audit_check` pada `distribusi_biaya_pertama` harus "OK" jika `jumlah_biaya_terdistribusi_i = biaya_tahunan` persis.

## 5. Contoh Query Validasi (strict 0)

```sql
SELECT 
  unit_kerja_pusat_biaya,
  biaya_tahunan,
  jumlah_biaya_terdistribusi_i,
  (biaya_tahunan - jumlah_biaya_terdistribusi_i) AS selisih,
  audit_check
FROM distribusi_biaya_pertama
WHERE tahun = 2025;
```

## 6. Status Terakhir (versi terbaru)
- ✅ Presisi: integer (tanpa desimal) di semua kolom
- ✅ Kolom baru: `jumlah_biaya_terdistribusi_i`
- ✅ `audit_check`: OK jika sama persis, CEK jika tidak
- ✅ Kolom `total_alokasi_i`: dihapus
