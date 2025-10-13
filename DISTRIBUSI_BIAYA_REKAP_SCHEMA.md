## Skema dan Aturan Pengisian: distribusi_biaya_rekap

### Ringkas Tujuan
- Menyediakan rekap biaya per pusat pendapatan (UK037–UK077) dalam 4 baris utama:
  - Biaya Tahunan Unit Kerja
  - Biaya Alokasi Tahap I
  - Biaya Alokasi Tahap II
  - Total Biaya

### Tabel Utama
- Tabel: `public.distribusi_biaya_rekap`
- Kolom kunci:
  - `id` (uuid)
  - `biaya` (varchar) → salah satu dari: "Biaya Tahunan Unit Kerja", "Biaya Alokasi Tahap I", "Biaya Alokasi Tahap II", "Total Biaya"
  - `tahun` (int)
  - UK kolom tujuan: `uk037_ambulance` s.d. `uk077_unit_diklat` (numeric)
  - `created_at`, `updated_at`, `urutan`

### Sumber Data Utama
- `public.data_biaya`
  - Kunci: `kode_unit_kerja` (contoh: "UK042"), `tahun`
  - Nilai sumber:
    - `total_biaya`
    - `total_biaya_tanpa_jp`

- `public.biaya_preference`
  - Kolom: `biaya_type` bernilai salah satu dari:
    - `total_biaya`
    - `total_biaya_tanpa_jp`
  - Baris terbaru (berdasar `updated_at` desc, `id` desc) menjadi preferensi aktif.

### Aturan Pengisian Baris "Biaya Tahunan Unit Kerja"
Untuk setiap kolom UK042–UK077 pada baris `biaya = 'Biaya Tahunan Unit Kerja'` dan tahun T:

1) Tentukan preferensi aktif:
   - Ambil satu baris terbaru dari `public.biaya_preference`.
   - Jika `biaya_type = 'total_biaya_tanpa_jp'` → gunakan `data_biaya.total_biaya_tanpa_jp`.
   - Selain itu → gunakan `data_biaya.total_biaya`.

2) Pemetaan kolom → kode unit kerja:
   - `uk042_gizi_dapur` → `UK042`
   - `uk043_laundry_cssd` → `UK043`
   - `uk044_bdrs` → `UK044`
   - `uk045_cathlab` → `UK045`
   - `uk046_terang_bulan_vip_vvip` → `UK046`
   - `uk047_truntum` → `UK047`
   - `uk048_sekarjagat` → `UK048`
   - `uk049_jlamprang` → `UK049`
   - `uk050_nifas` → `UK050`
   - `uk051_perinatologi` → `UK051`
   - `uk052_buketan` → `UK052`
   - `uk053_icu_picu_nicu` → `UK053`
   - `uk054_vk` → `UK054`
   - `uk055_igd_ponek` → `UK055`
   - `uk056_klinik_kebid_kandungan` → `UK056`
   - `uk057_klinik_bedah_mulut` → `UK057`
   - `uk058_klinik_syaraf` → `UK058`
   - `uk059_klinik_bedah_syaraf` → `UK059`
   - `uk060_klinik_bedah_digestif` → `UK060`
   - `uk061_klinik_bedah_umum` → `UK061`
   - `uk062_klinik_anak` → `UK062`
   - `uk063_klinik_penyakit_dalam` → `UK063`
   - `uk064_klinik_mata` → `UK064`
   - `uk065_klinik_kulit_kelamin` → `UK065`
   - `uk066_klinik_tht` → `UK066`
   - `uk067_klinik_gigi` → `UK067`
   - `uk068_klinik_jantung` → `UK068`
   - `uk069_klinik_dot_vct_cst` → `UK069`
   - `uk070_klinik_paru` → `UK070`
   - `uk071_klinik_orthopedi` → `UK071`
   - `uk072_klinik_jiwa` → `UK072`
   - `uk073_klinik_parikesit` → `UK073`
   - `uk074_ibs` → `UK074`
   - `uk075_pemulasaran_jenazah` → `UK075`
   - `uk076_hemodialisis` → `UK076`
   - `uk077_unit_diklat` → `UK077`

3) Format angka: integer (tanpa desimal)
   - Nilai dari sumber (numeric) diproyeksikan sebagai bilangan bulat, misalnya `::bigint`.

Contoh update 1-statement untuk tahun berjalan (skema ringkas per kolom):

```sql
UPDATE public.distribusi_biaya_rekap r
SET uk042_gizi_dapur = (
      SELECT CASE WHEN p.biaya_type='total_biaya_tanpa_jp'
                  THEN COALESCE(db.total_biaya_tanpa_jp,0)
                  ELSE COALESCE(db.total_biaya,0)
             END::bigint
      FROM public.data_biaya db
      CROSS JOIN LATERAL (
        SELECT biaya_type
        FROM public.biaya_preference
        ORDER BY updated_at DESC NULLS LAST, id DESC
        LIMIT 1
      ) p
      WHERE db.kode_unit_kerja='UK042' AND db.tahun=r.tahun
    )
--, ... ulangi pola untuk UK043 s.d. UK077 ...
WHERE r.biaya = 'Biaya Tahunan Unit Kerja' AND r.tahun = 2025;
```

Catatan:
- Jika preferensi berubah, jalankan pernyataan update di atas untuk menyesuaikan baris "Biaya Tahunan Unit Kerja" agar selaras dengan preferensi aktif.
- Baris lain (Alokasi Tahap I/II, Total Biaya) dihitung dari proses distribusi, bukan dari preferensi ini.


