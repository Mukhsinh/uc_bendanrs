# Dokumentasi Lengkap Double Distribution Biaya Rumah Sakit

## 📋 Overview

Sistem Double Distribution Biaya Rumah Sakit adalah solusi komprehensif untuk melakukan alokasi biaya dalam dua tahap di lingkungan rumah sakit. Sistem ini dirancang untuk mengintegrasikan dengan database Supabase yang sudah ada dan juga dapat berjalan dengan data sample atau file CSV.

## 🗂️ Struktur File

### Skrip Utama
1. **`double_distribution_biaya_rs.py`** - Skrip dengan data sample
2. **`double_distribution_with_database.py`** - Skrip dengan integrasi database Supabase
3. **`double_distribution_from_csv.py`** - Skrip yang membaca data dari file CSV

### File Konfigurasi
4. **`config_database.py`** - Konfigurasi database dan parameter
5. **`sample_data.csv`** - Data sample dalam format CSV

### File Dependencies
6. **`requirements_double_distribution.txt`** - Dependencies untuk versi sample
7. **`requirements_database.txt`** - Dependencies untuk versi database

### File Batch/PowerShell
8. **`install_and_run.bat`** - Batch script untuk Windows
9. **`install_and_run.ps1`** - PowerShell script untuk Windows
10. **`run_csv_version.bat`** - Batch script untuk versi CSV
11. **`run_csv_version.ps1`** - PowerShell script untuk versi CSV

### Dokumentasi
12. **`README_DOUBLE_DISTRIBUTION.md`** - Dokumentasi penggunaan
13. **`DOCUMENTATION_COMPLETE.md`** - Dokumentasi lengkap (file ini)

## 🏗️ Arsitektur Sistem

### Database Schema Integration

Sistem ini terintegrasi dengan struktur database yang sudah ada:

#### Tabel `unit_kerja`
```sql
CREATE TABLE unit_kerja (
  id UUID PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  lokasi VARCHAR(255),
  luas_ruangan DECIMAL(10,2),
  kategori VARCHAR(50) CHECK (kategori IN ('Pusat Biaya', 'Pusat Pendapatan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabel `data_biaya`
```sql
CREATE TABLE data_biaya (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tahun INTEGER NOT NULL,
  unit_kerja_id UUID,
  -- 20+ field biaya individual
  biaya_gaji_tunjangan DECIMAL(15,2),
  biaya_jasa_pelayanan DECIMAL(15,2),
  -- ... field biaya lainnya
  -- Computed fields (otomatis dihitung)
  biaya_bahan DECIMAL(15,2) GENERATED ALWAYS AS (...),
  biaya_pegawai DECIMAL(15,2) GENERATED ALWAYS AS (...),
  biaya_daya DECIMAL(15,2) GENERATED ALWAYS AS (...),
  biaya_pemeliharaan DECIMAL(15,2) GENERATED ALWAYS AS (...),
  biaya_penyusutan DECIMAL(15,2) GENERATED ALWAYS AS (...),
  total_biaya DECIMAL(15,2) GENERATED ALWAYS AS (...),
  total_biaya_tanpa_jp DECIMAL(15,2) GENERATED ALWAYS AS (...),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabel `Data_Kegiatan`
```sql
CREATE TABLE "Data_Kegiatan" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50),
  "Nama_Unit_Kerja" VARCHAR(255),
  tahun INTEGER,
  unit_kerja_id UUID,
  -- Field untuk dasar alokasi
  "Listrik_kwh" FLOAT,
  "Air_m3" FLOAT,
  "Makanan_Karyawan_jml_Porsi" INTEGER,
  "Makanan_Pasien_jml_Porsi" INTEGER,
  "Cucian_kg_Cucian" FLOAT,
  "SDM_Dr" INTEGER,
  "SDM_Prwt" INTEGER,
  "SDM_Non" INTEGER,
  -- ... field lainnya
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Proses Distribusi

### Tahap 1: Distribusi Biaya Tidak Langsung

**Tujuan**: Mengalokasikan biaya overhead/indirek ke semua departemen

**Dasar Alokasi**: Luas Lantai (m²)

**Rumus**:
```
Tarif Alokasi = Total Biaya Tidak Langsung / Total Luas Lantai
Alokasi per Departemen = Luas Lantai Departemen × Tarif Alokasi
```

**Contoh Perhitungan**:
- Total Biaya Tidak Langsung: Rp 200,000,000
- Total Luas Lantai: 3,000 m²
- Tarif Alokasi: Rp 200,000,000 / 3,000 = Rp 66,667 per m²
- Rawat Inap (1,500 m²): 1,500 × Rp 66,667 = Rp 100,000,000

### Tahap 2: Step-Down Allocation Method

**Tujuan**: Mengalokasikan biaya departemen penunjang ke departemen produksi

**Urutan Alokasi**:
1. **IPSRS** → berdasarkan Jam Perbaikan
2. **Laundry** → berdasarkan Kg Cucian  
3. **Gizi** → berdasarkan Jumlah Porsi Makan

**Proses**:
1. Setiap departemen penunjang dialokasikan satu per satu
2. Setelah dialokasikan, departemen tersebut tidak menerima alokasi lagi
3. Biaya yang dialokasikan = Biaya Awal + Alokasi dari departemen sebelumnya

**Contoh Perhitungan IPSRS**:
- Biaya IPSRS: Rp 80,000,000
- Total Jam Perbaikan (penerima): 400 jam
- Tarif per Jam: Rp 80,000,000 / 400 = Rp 200,000 per jam
- Rawat Inap (200 jam): 200 × Rp 200,000 = Rp 40,000,000

## 📊 Output Excel

### Sheet 1: Data_Awal
- **Tabel Biaya Awal**: Kode departemen, nama, jenis, biaya langsung
- **Tabel Dasar Alokasi**: Luas lantai, jumlah karyawan, porsi makan, dll

### Sheet 2: Distribusi_Tahap_1
- **Hasil Alokasi**: Biaya langsung + alokasi biaya tidak langsung
- **Ringkasan**: Total luas lantai, tarif alokasi, detail per departemen

### Sheet 3: Distribusi_Tahap_2
- **Proses Step-Down**: Detail alokasi dari setiap departemen penunjang
- **Kolom**: Total_Biaya_Tahap_1, Alokasi_dari_IPSRS, Alokasi_dari_Laundry, Alokasi_dari_Gizi, Total_Biaya_Final

### Sheet 4: Ringkasan_Final
- **Hasil Akhir**: Total biaya final untuk departemen produksi
- **Persentase**: Distribusi biaya dalam persentase

## 🚀 Cara Penggunaan

### 1. Instalasi Dependencies

#### Versi Sample Data
```bash
pip install -r requirements_double_distribution.txt
```

#### Versi Database
```bash
pip install -r requirements_database.txt
```

### 2. Menjalankan Skrip

#### A. Versi Sample Data
```bash
python double_distribution_biaya_rs.py
```

#### B. Versi Database
```bash
# Edit konfigurasi di dalam file terlebih dahulu
python double_distribution_with_database.py
```

#### C. Versi CSV
```bash
# Menggunakan data sample
python double_distribution_from_csv.py sample_data.csv

# Menggunakan file CSV sendiri
python double_distribution_from_csv.py your_data.csv
```

### 3. Menggunakan Batch/PowerShell Scripts

#### Windows Batch
```cmd
# Versi sample
install_and_run.bat

# Versi CSV
run_csv_version.bat
```

#### Windows PowerShell
```powershell
# Versi sample
.\install_and_run.ps1

# Versi CSV
.\run_csv_version.ps1
```

## ⚙️ Konfigurasi

### Parameter yang Dapat Disesuaikan

1. **Total Biaya Tidak Langsung**
   ```python
   self.total_biaya_tidak_langsung = 200_000_000  # Rp 200 juta
   ```

2. **Tahun Data**
   ```python
   self.tahun = 2025
   ```

3. **Urutan Alokasi Step-Down**
   ```python
   "urutan_alokasi": [
       "IPSRS-01",  # IPSRS (berdasarkan Jam Perbaikan)
       "LND-01",    # Laundry (berdasarkan Kg Cucian)
       "GIZI-01"    # Gizi (berdasarkan Jumlah Porsi Makan)
   ]
   ```

4. **Dasar Alokasi**
   - Tahap 1: Luas Lantai
   - Tahap 2: Jam Perbaikan, Kg Cucian, Porsi Makan

### Konfigurasi Database

Edit file `config_database.py`:
```python
SUPABASE_CONFIG = {
    "url": "YOUR_SUPABASE_URL",
    "key": "YOUR_SUPABASE_ANON_KEY",
    "user_id": "YOUR_USER_ID"
}
```

## 📋 Format Data CSV

File CSV harus memiliki kolom berikut:

```csv
Kode_Dept,Nama_Departemen,Jenis_Departemen,Biaya_Langsung,Luas_Lantai,Jumlah_Karyawan,Jumlah_Porsi_Makan,Kg_Cucian,Jam_Perbaikan
RI-01,Rawat Inap A,Produksi,300000000,1500,50,10000,5000,200
UGD-01,UGD,Produksi,150000000,500,30,1500,1000,150
LAB-01,Laboratorium,Produksi,120000000,400,20,500,300,50
GIZI-01,Gizi,Penunjang,50000000,300,15,0,100,20
LND-01,Laundry,Penunjang,30000000,200,10,0,0,15
IPSRS-01,IPSRS,Penunjang,80000000,100,5,0,0,0
```

## 🔧 Troubleshooting

### Error: "Python not found"
**Solusi**: Install Python dari https://www.python.org/downloads/
- Pastikan centang "Add Python to PATH" saat instalasi

### Error: "Module not found"
**Solusi**: Install dependencies
```bash
pip install pandas numpy openpyxl
```

### Error: "Tidak ada data di database"
**Solusi**: 
- Pastikan data sudah ada di database untuk tahun yang dipilih
- Skrip akan otomatis menggunakan data sample jika database kosong

### Error: "Connection to Supabase failed"
**Solusi**:
- Periksa URL dan API Key Supabase
- Pastikan koneksi internet stabil
- Gunakan versi sample data sebagai alternatif

### Error: "CSV file not found"
**Solusi**:
- Pastikan file CSV ada di direktori yang sama
- Periksa nama file dan path
- Gunakan `sample_data.csv` sebagai contoh

## 📊 Contoh Hasil

### Input Data
- **Departemen Produksi**: Rawat Inap, UGD, Laboratorium
- **Departemen Penunjang**: Gizi, Laundry, IPSRS
- **Total Biaya Tidak Langsung**: Rp 200,000,000

### Output Excel
- **File**: `hasil_distribusi_biaya_rs_2025.xlsx`
- **Total Biaya Final**:
  - Rawat Inap: Rp 450,000,000
  - UGD: Rp 225,000,000
  - Laboratorium: Rp 180,000,000

## 🛠️ Maintenance

### Update Data
1. Jalankan skrip dengan data terbaru dari database
2. Pastikan data CSV terupdate jika menggunakan versi CSV
3. Verifikasi hasil distribusi untuk memastikan akurasi

### Parameter Tuning
1. Sesuaikan dasar alokasi sesuai kebutuhan rumah sakit
2. Ubah urutan alokasi step-down jika diperlukan
3. Adjust total biaya tidak langsung sesuai budget

### Monitoring
1. Periksa log error di console
2. Validasi hasil distribusi dengan perhitungan manual
3. Monitor performa database untuk data besar

## 🔄 Integration dengan Sistem Existing

### Database Integration
- Menggunakan tabel yang sudah ada: `unit_kerja`, `data_biaya`, `Data_Kegiatan`
- Memanfaatkan computed fields yang sudah ada
- Compatible dengan struktur database Supabase

### API Integration
- Dapat diintegrasikan dengan API existing
- Support untuk multiple user dengan filter `user_id`
- Real-time data dari database

### Frontend Integration
- Output Excel dapat diimport ke sistem reporting
- Data dapat ditampilkan di dashboard
- Support untuk export ke format lain

## 📞 Support

### Dokumentasi
- `README_DOUBLE_DISTRIBUTION.md` - Panduan penggunaan
- `DOCUMENTATION_COMPLETE.md` - Dokumentasi lengkap
- `config_database.py` - Konfigurasi parameter

### Testing
- Gunakan `sample_data.csv` untuk testing
- Jalankan dengan data sample terlebih dahulu
- Verifikasi hasil dengan perhitungan manual

### Error Handling
- Skrip memiliki fallback ke data sample
- Error handling untuk koneksi database
- Validasi data input

## 🎯 Best Practices

1. **Data Validation**: Selalu validasi data sebelum proses distribusi
2. **Backup**: Backup data sebelum menjalankan skrip
3. **Testing**: Test dengan data sample sebelum menggunakan data real
4. **Documentation**: Dokumentasikan perubahan parameter
5. **Monitoring**: Monitor hasil distribusi secara berkala

## 🔮 Future Enhancements

1. **Web Interface**: GUI untuk menjalankan distribusi
2. **Real-time Processing**: Processing data real-time
3. **Advanced Analytics**: Analisis lebih detail hasil distribusi
4. **Multiple Allocation Methods**: Support metode alokasi lain
5. **Automated Scheduling**: Jadwal otomatis untuk distribusi berkala
