# Dokumentasi: Kalkulasi Tindakan Rawat Jalan

## Struktur Tabel

Tabel `kalkulasi_tindakan_rawat_jalan` dibuat dengan 47 kolom yang terdiri dari:
- 8 kolom identifikasi (id, user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja, kode_jenis_tindakan, jenis_tindakan)
- 8 kolom data tindakan
- 2 kolom dasar alokasi
- 24 kolom biaya
- 2 kolom timestamp
- 1 kolom unit cost (generated)

## Sumber Data untuk Setiap Kolom

### A. Kolom Identifikasi & Data Tindakan (Auto dari `jenis_tindakan_rawat_jalan`)

| Kolom | Sumber | Keterangan |
|-------|--------|------------|
| `id` | Auto-generated | UUID unik |
| `user_id` | auth.users | User yang sedang login |
| `tahun` | Input manual | Tahun kalkulasi (contoh: 2025) |
| `kode_jenis` | jenis_tindakan_rawat_jalan.kode_jenis | Selalu 1 (rawat jalan) |
| `kode_unit_kerja` | jenis_tindakan_rawat_jalan.kode_unit_kerja | UK041, UK055-UK073, UK076 |
| `nama_unit_kerja` | jenis_tindakan_rawat_jalan.nama_unit_kerja | Nama unit kerja |
| `kode_jenis_tindakan` | jenis_tindakan_rawat_jalan.kode_jenis_tindakan | T.001, T.002, dst |
| `jenis_tindakan` | jenis_tindakan_rawat_jalan.jenis_tindakan | Nama tindakan |
| `jumlah` | jenis_tindakan_rawat_jalan.jumlah | Jumlah tindakan |
| `waktu` | jenis_tindakan_rawat_jalan.waktu | Waktu dalam menit |
| `profesionalisme` | jenis_tindakan_rawat_jalan.profesionalisme | 1-4 |
| `tingkat_kesulitan` | jenis_tindakan_rawat_jalan.tingkat_kesulitan | 1-5 |
| `hasil_kali_waktu` | jenis_tindakan_rawat_jalan.hasil_kali_waktu | jumlah × waktu |
| `hasil_kali` | jenis_tindakan_rawat_jalan.hasil_kali | jumlah × waktu × prof × tingkat |
| `biaya_bahan_tindakan` | jenis_tindakan_rawat_jalan.biaya_bahan_tindakan | Dari master tindakan |
| `kali_bahan` | Calculated | jumlah × biaya_bahan_tindakan |

### B. Kolom Dasar Alokasi (Calculated)

| Kolom | Rumus | Keterangan |
|-------|-------|------------|
| `dasar_alokasi_kali_waktu` | hasil_kali_waktu ÷ ΣHKW unit | Proporsi untuk alokasi biaya operasional (6 desimal) |
| `dasar_alokasi_hasil_kali` | hasil_kali ÷ ΣHK unit | Proporsi untuk alokasi biaya SDM (6 desimal) |

**Catatan:** ΣHK = Sum hasil_kali semua tindakan dalam 1 unit kerja yang sama

### C. Kolom Biaya (24 Kolom)

#### 1. Biaya SDM (menggunakan `dasar_alokasi_hasil_kali`)
```
biaya_gaji_tunjangan = (data_biaya.biaya_gaji_tunjangan × dasar_alokasi_hasil_kali) ÷ jumlah
biaya_jasa_pelayanan = (data_biaya.biaya_jasa_pelayanan × dasar_alokasi_hasil_kali) ÷ jumlah
biaya_pendidikan_pelatihan = (data_biaya.biaya_pendidikan_pelatihan × dasar_alokasi_hasil_kali) ÷ jumlah
```

#### 2. Biaya Operasional (menggunakan `dasar_alokasi_kali_waktu`)
```
biaya_rumah_tangga = (data_biaya.biaya_rumah_tangga × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_cetak = (data_biaya.biaya_cetak × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_atk = (data_biaya.biaya_atk × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_listrik = (data_biaya.biaya_listrik × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_air = (data_biaya.biaya_air × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_telp = (data_biaya.biaya_telp × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_pemeliharaan_bangunan = (data_biaya.biaya_pemeliharaan_bangunan × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_pemeliharaan_alat_medis = (data_biaya.biaya_pemeliharaan_alat_medis × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_pemeliharaan_alat_non_medis = (data_biaya.biaya_pemeliharaan_alat_non_medis × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_operasional_lainnya = (data_biaya.biaya_operasional_lainnya × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_penyusutan_gedung = (data_biaya.biaya_penyusutan_gedung × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_penyusutan_jaringan = (data_biaya.biaya_penyusutan_jaringan × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_penyusutan_alat_medis = (data_biaya.biaya_penyusutan_alat_medis × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_penyusutan_alat_non_medis = (data_biaya.biaya_penyusutan_alat_non_medis × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_laundry = (data_biaya.biaya_laundry × dasar_alokasi_kali_waktu) ÷ jumlah
biaya_sterilisasi = (data_biaya.biaya_sterilisasi × dasar_alokasi_kali_waktu) ÷ jumlah
```

#### 3. Biaya Bahan (dikosongkan untuk rawat jalan)
```
biaya_obat = 0
biaya_bhp = 0
biaya_makan_karyawan = 0
biaya_makan_pasien = 0
```

#### 4. Biaya Tidak Langsung (dari distribusi_biaya_rekap)
```
biaya_tidak_langsung_terdistribusi = 
  (distribusi_biaya_rekap[kode_unit_kerja].biaya_tidak_langsung × dasar_alokasi_kali_waktu) ÷ jumlah
```

### D. Unit Cost (Auto-Calculated)
```sql
unit_cost_tindakan_rawat_jalan = SUM(semua 24 kolom biaya)
```

## Langkah-Langkah Mengisi Data

### Step 1: Generate Data Awal dari jenis_tindakan_rawat_jalan

```sql
-- Populate data awal untuk tahun 2025
INSERT INTO kalkulasi_tindakan_rawat_jalan (
  user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
  kode_jenis_tindakan, jenis_tindakan, jumlah, waktu, 
  profesionalisme, tingkat_kesulitan, hasil_kali_waktu, 
  hasil_kali, biaya_bahan_tindakan, kali_bahan
)
SELECT 
  jtr.user_id,
  2025 as tahun,
  jtr.kode_jenis,
  jtr.kode_unit_kerja,
  jtr.nama_unit_kerja,
  jtr.kode_jenis_tindakan,
  jtr.jenis_tindakan,
  jtr.jumlah,
  jtr.waktu,
  jtr.profesionalisme,
  jtr.tingkat_kesulitan,
  jtr.hasil_kali_waktu,
  jtr.hasil_kali,
  jtr.biaya_bahan_tindakan,
  (jtr.jumlah * COALESCE(jtr.biaya_bahan_tindakan, 0)) as kali_bahan
FROM jenis_tindakan_rawat_jalan jtr
WHERE jtr.jumlah > 0; -- Hanya ambil yang sudah ada jumlahnya
```

### Step 2: Hitung Dasar Alokasi

```sql
-- Function untuk menghitung dasar alokasi
CREATE OR REPLACE FUNCTION calculate_dasar_alokasi_tindakan_rj(
  p_user_id UUID,
  p_tahun INTEGER
) RETURNS void AS $$
DECLARE
  v_unit_kerja TEXT;
  v_total_hasil_kali_waktu NUMERIC;
  v_total_hasil_kali NUMERIC;
BEGIN
  -- Loop untuk setiap unit kerja
  FOR v_unit_kerja IN 
    SELECT DISTINCT kode_unit_kerja 
    FROM kalkulasi_tindakan_rawat_jalan 
    WHERE user_id = p_user_id AND tahun = p_tahun
  LOOP
    -- Hitung total hasil_kali_waktu untuk unit kerja ini
    SELECT COALESCE(SUM(hasil_kali_waktu), 0)
    INTO v_total_hasil_kali_waktu
    FROM kalkulasi_tindakan_rawat_jalan
    WHERE user_id = p_user_id 
      AND tahun = p_tahun 
      AND kode_unit_kerja = v_unit_kerja;

    -- Hitung total hasil_kali untuk unit kerja ini
    SELECT COALESCE(SUM(hasil_kali), 0)
    INTO v_total_hasil_kali
    FROM kalkulasi_tindakan_rawat_jalan
    WHERE user_id = p_user_id 
      AND tahun = p_tahun 
      AND kode_unit_kerja = v_unit_kerja;

    -- Update dasar alokasi
    IF v_total_hasil_kali_waktu > 0 THEN
      UPDATE kalkulasi_tindakan_rawat_jalan
      SET dasar_alokasi_kali_waktu = ROUND((hasil_kali_waktu::NUMERIC / v_total_hasil_kali_waktu), 6)
      WHERE user_id = p_user_id 
        AND tahun = p_tahun 
        AND kode_unit_kerja = v_unit_kerja;
    END IF;

    IF v_total_hasil_kali > 0 THEN
      UPDATE kalkulasi_tindakan_rawat_jalan
      SET dasar_alokasi_hasil_kali = ROUND((hasil_kali::NUMERIC / v_total_hasil_kali), 6)
      WHERE user_id = p_user_id 
        AND tahun = p_tahun 
        AND kode_unit_kerja = v_unit_kerja;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Jalankan function
SELECT calculate_dasar_alokasi_tindakan_rj('USER_ID', 2025);
```

### Step 3: Distribusi Biaya SDM (dasar_alokasi_hasil_kali)

```sql
-- Function untuk distribusi biaya SDM
CREATE OR REPLACE FUNCTION distribute_biaya_sdm_tindakan_rj(
  p_user_id UUID,
  p_tahun INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE kalkulasi_tindakan_rawat_jalan kt
  SET 
    biaya_gaji_tunjangan = CASE 
      WHEN kt.jumlah > 0 THEN 
        ROUND((db.biaya_gaji_tunjangan * kt.dasar_alokasi_hasil_kali / kt.jumlah)::NUMERIC)
      ELSE 0 
    END,
    biaya_jasa_pelayanan = CASE 
      WHEN kt.jumlah > 0 THEN 
        ROUND((db.biaya_jasa_pelayanan * kt.dasar_alokasi_hasil_kali / kt.jumlah)::NUMERIC)
      ELSE 0 
    END,
    biaya_pendidikan_pelatihan = CASE 
      WHEN kt.jumlah > 0 THEN 
        ROUND((db.biaya_pendidikan_pelatihan * kt.dasar_alokasi_hasil_kali / kt.jumlah)::NUMERIC)
      ELSE 0 
    END
  FROM data_biaya db
  WHERE kt.user_id = p_user_id
    AND kt.tahun = p_tahun
    AND db.kode_unit_kerja = kt.kode_unit_kerja
    AND db.tahun = p_tahun;
END;
$$ LANGUAGE plpgsql;

-- Jalankan function
SELECT distribute_biaya_sdm_tindakan_rj('USER_ID', 2025);
```

### Step 4: Distribusi Biaya Operasional (dasar_alokasi_kali_waktu)

```sql
-- Function untuk distribusi biaya operasional
CREATE OR REPLACE FUNCTION distribute_biaya_operasional_tindakan_rj(
  p_user_id UUID,
  p_tahun INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE kalkulasi_tindakan_rawat_jalan kt
  SET 
    biaya_rumah_tangga = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_rumah_tangga * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_cetak = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_cetak * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_atk = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_atk * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_listrik = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_listrik * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_air = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_air * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_telp = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_telp * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_pemeliharaan_bangunan = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_pemeliharaan_bangunan * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_pemeliharaan_alat_medis = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_pemeliharaan_alat_medis * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_pemeliharaan_alat_non_medis = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_pemeliharaan_alat_non_medis * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_operasional_lainnya = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_operasional_lainnya * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_penyusutan_gedung = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_penyusutan_gedung * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_penyusutan_jaringan = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_penyusutan_jaringan * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_penyusutan_alat_medis = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_penyusutan_alat_medis * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_penyusutan_alat_non_medis = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_penyusutan_alat_non_medis * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_laundry = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_laundry * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END,
    biaya_sterilisasi = CASE WHEN kt.jumlah > 0 THEN ROUND((db.biaya_sterilisasi * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC) ELSE 0 END
  FROM data_biaya db
  WHERE kt.user_id = p_user_id
    AND kt.tahun = p_tahun
    AND db.kode_unit_kerja = kt.kode_unit_kerja
    AND db.tahun = p_tahun;
END;
$$ LANGUAGE plpgsql;

-- Jalankan function
SELECT distribute_biaya_operasional_tindakan_rj('USER_ID', 2025);
```

### Step 5: Distribusi Biaya Tidak Langsung

```sql
-- Function untuk distribusi biaya tidak langsung
CREATE OR REPLACE FUNCTION distribute_biaya_tidak_langsung_tindakan_rj(
  p_user_id UUID,
  p_tahun INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE kalkulasi_tindakan_rawat_jalan kt
  SET biaya_tidak_langsung_terdistribusi = CASE 
    WHEN kt.jumlah > 0 THEN 
      ROUND((dbr.biaya_tidak_langsung * kt.dasar_alokasi_kali_waktu / kt.jumlah)::NUMERIC)
    ELSE 0 
  END
  FROM (
    SELECT 
      kode_unit_kerja,
      CASE kode_unit_kerja
        WHEN 'UK037' THEN uk037_ambulance
        WHEN 'UK038' THEN uk038_laboratorium_pk_pa
        WHEN 'UK039' THEN uk039_radiologi
        WHEN 'UK040' THEN uk040_farmasi
        WHEN 'UK041' THEN uk041_rehab_medik
        WHEN 'UK042' THEN uk042_gizi_dapur
        WHEN 'UK043' THEN uk043_laundry_cssd
        WHEN 'UK044' THEN uk044_bdrs
        WHEN 'UK055' THEN uk055_igd_ponek
        WHEN 'UK056' THEN uk056_klinik_kebid_kandungan
        WHEN 'UK057' THEN uk057_klinik_bedah_mulut
        WHEN 'UK058' THEN uk058_klinik_syaraf
        WHEN 'UK059' THEN uk059_klinik_bedah_syaraf
        WHEN 'UK060' THEN uk060_klinik_bedah_digestif
        WHEN 'UK061' THEN uk061_klinik_bedah_umum
        WHEN 'UK062' THEN uk062_klinik_anak
        WHEN 'UK063' THEN uk063_klinik_penyakit_dalam
        WHEN 'UK064' THEN uk064_klinik_mata
        WHEN 'UK065' THEN uk065_klinik_kulit_kelamin
        WHEN 'UK066' THEN uk066_klinik_tht
        WHEN 'UK067' THEN uk067_klinik_gigi
        WHEN 'UK068' THEN uk068_klinik_jantung
        WHEN 'UK069' THEN uk069_klinik_dot_vct_cst
        WHEN 'UK070' THEN uk070_klinik_paru
        WHEN 'UK071' THEN uk071_klinik_orthopedi
        WHEN 'UK072' THEN uk072_klinik_jiwa
        WHEN 'UK073' THEN uk073_klinik_parikesit
        WHEN 'UK075' THEN uk075_pemulasaran_jenazah
        WHEN 'UK076' THEN uk076_hemodialisis
        WHEN 'UK077' THEN uk077_unit_diklat
      END as biaya_tidak_langsung
    FROM distribusi_biaya_rekap
    WHERE tahun = p_tahun
      AND biaya = 'Biaya Tidak Langsung Terdistribusi'
    LIMIT 1
  ) dbr,
  unit_kerja uk
  WHERE kt.user_id = p_user_id
    AND kt.tahun = p_tahun
    AND uk.kode = kt.kode_unit_kerja
    AND dbr.kode_unit_kerja = kt.kode_unit_kerja;
END;
$$ LANGUAGE plpgsql;

-- Jalankan function
SELECT distribute_biaya_tidak_langsung_tindakan_rj('USER_ID', 2025);
```

## Proses Kalkulasi Lengkap (All-in-One)

```sql
-- Master function untuk kalkulasi lengkap
CREATE OR REPLACE FUNCTION process_kalkulasi_tindakan_rawat_jalan(
  p_user_id UUID,
  p_tahun INTEGER
) RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_result TEXT;
BEGIN
  -- Step 1: Generate data awal
  INSERT INTO kalkulasi_tindakan_rawat_jalan (
    user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
    kode_jenis_tindakan, jenis_tindakan, jumlah, waktu, 
    profesionalisme, tingkat_kesulitan, hasil_kali_waktu, 
    hasil_kali, biaya_bahan_tindakan, kali_bahan
  )
  SELECT 
    jtr.user_id, p_tahun, jtr.kode_jenis, jtr.kode_unit_kerja, jtr.nama_unit_kerja,
    jtr.kode_jenis_tindakan, jtr.jenis_tindakan, jtr.jumlah, jtr.waktu, 
    jtr.profesionalisme, jtr.tingkat_kesulitan, jtr.hasil_kali_waktu, 
    jtr.hasil_kali, jtr.biaya_bahan_tindakan,
    (jtr.jumlah * COALESCE(jtr.biaya_bahan_tindakan, 0))
  FROM jenis_tindakan_rawat_jalan jtr
  WHERE jtr.user_id = p_user_id 
    AND jtr.jumlah > 0
    AND NOT EXISTS (
      SELECT 1 FROM kalkulasi_tindakan_rawat_jalan kt
      WHERE kt.user_id = p_user_id 
        AND kt.tahun = p_tahun
        AND kt.kode_unit_kerja = jtr.kode_unit_kerja
        AND kt.kode_jenis_tindakan = jtr.kode_jenis_tindakan
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := 'Step 1: ' || v_count || ' data generated. ';

  -- Step 2: Calculate dasar alokasi
  PERFORM calculate_dasar_alokasi_tindakan_rj(p_user_id, p_tahun);
  v_result := v_result || 'Step 2: Dasar alokasi calculated. ';

  -- Step 3: Distribute biaya SDM
  PERFORM distribute_biaya_sdm_tindakan_rj(p_user_id, p_tahun);
  v_result := v_result || 'Step 3: Biaya SDM distributed. ';

  -- Step 4: Distribute biaya operasional
  PERFORM distribute_biaya_operasional_tindakan_rj(p_user_id, p_tahun);
  v_result := v_result || 'Step 4: Biaya operasional distributed. ';

  -- Step 5: Distribute biaya tidak langsung
  PERFORM distribute_biaya_tidak_langsung_tindakan_rj(p_user_id, p_tahun);
  v_result := v_result || 'Step 5: Biaya tidak langsung distributed. ';

  -- Update timestamp
  UPDATE kalkulasi_tindakan_rawat_jalan
  SET updated_at = now()
  WHERE user_id = p_user_id AND tahun = p_tahun;

  RETURN v_result || 'COMPLETED!';
END;
$$ LANGUAGE plpgsql;

-- Cara menggunakan:
-- SELECT process_kalkulasi_tindakan_rawat_jalan('YOUR_USER_ID', 2025);
```

## Contoh Query untuk Melihat Hasil

```sql
-- Lihat unit cost per tindakan per unit kerja
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  kode_jenis_tindakan,
  jenis_tindakan,
  jumlah,
  waktu,
  hasil_kali_waktu,
  hasil_kali,
  dasar_alokasi_kali_waktu,
  dasar_alokasi_hasil_kali,
  unit_cost_tindakan_rawat_jalan,
  ROUND(unit_cost_tindakan_rawat_jalan + biaya_bahan_tindakan) as total_unit_cost_dengan_bahan
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = 'YOUR_USER_ID'
  AND tahun = 2025
ORDER BY kode_unit_kerja, kode_jenis_tindakan;

-- Summary per unit kerja
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  COUNT(*) as jumlah_tindakan,
  SUM(jumlah) as total_tindakan_dilakukan,
  AVG(unit_cost_tindakan_rawat_jalan) as avg_unit_cost,
  MIN(unit_cost_tindakan_rawat_jalan) as min_unit_cost,
  MAX(unit_cost_tindakan_rawat_jalan) as max_unit_cost
FROM kalkulasi_tindakan_rawat_jalan
WHERE user_id = 'YOUR_USER_ID'
  AND tahun = 2025
GROUP BY kode_unit_kerja, nama_unit_kerja
ORDER BY kode_unit_kerja;
```

## Catatan Penting

1. **Biaya Bahan:** Untuk rawat jalan, biaya obat/bhp/makanan dikosongkan karena sudah ada di `biaya_bahan_tindakan`
2. **Unit Cost Final:** Unit cost tindakan + biaya bahan tindakan = total biaya per tindakan
3. **Dasar Alokasi:** Hitung ulang jika ada perubahan jumlah tindakan di tabel `jenis_tindakan_rawat_jalan`
4. **Biaya Tidak Langsung:** Ambil dari `distribusi_biaya_rekap` baris "Biaya Tidak Langsung Terdistribusi"
5. **Update Data:** Jika ada perubahan biaya di `data_biaya`, jalankan kembali Step 3-5

## Relasi Tabel

```
jenis_tindakan_rawat_jalan (Data Tindakan)
    ↓
kalkulasi_tindakan_rawat_jalan (Kalkulasi)
    ↓
Mengambil biaya dari:
    - data_biaya (Biaya tahunan unit kerja)
    - distribusi_biaya_rekap (Biaya tidak langsung terdistribusi)
```



