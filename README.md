# Aplikasi Pencari Duplikat CSV

Aplikasi web sederhana menggunakan Flask untuk mengidentifikasi baris duplikat dalam file CSV berdasarkan semua kolom.

## Fitur

- Upload file CSV
- Identifikasi baris duplikat berdasarkan semua kolom
- Tampilan data asli dan baris duplikat
- Download file CSV yang berisi hanya baris duplikat
- Tampilan statistik (total baris dan jumlah duplikat)

## Instalasi

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Cara Menjalankan

1. Jalankan aplikasi:
```bash
python app.py
```

2. Buka browser dan akses:
```
http://localhost:5000
```

## Cara Menggunakan

1. Klik tombol "Pilih File CSV" dan pilih file CSV Anda
2. Klik "Unggah dan Proses" untuk memproses file
3. Lihat hasil di halaman hasil:
   - Data asli ditampilkan di bagian atas
   - Baris duplikat (jika ada) ditampilkan di bawahnya
   - Statistik menunjukkan total baris dan jumlah duplikat
4. Jika ada duplikat, klik tombol "Unduh CSV Duplikat" untuk mengunduh file CSV yang berisi hanya baris duplikat

## Teknologi yang Digunakan

- Flask: Framework web Python
- Pandas: Library untuk manipulasi data CSV
- Bootstrap: Framework CSS untuk tampilan

## Catatan

- Ukuran maksimal file: 16MB
- Duplikat diidentifikasi berdasarkan kesamaan semua kolom dalam satu baris
- File temporary duplikat disimpan di folder `temp_duplicates/` untuk keperluan download
