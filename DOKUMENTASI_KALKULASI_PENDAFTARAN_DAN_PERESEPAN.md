# 📋 Dokumentasi Kalkulasi Pendaftaran dan Peresepan

## 🎯 Overview
Halaman **Kalkulasi Pendaftaran dan Peresepan** menampilkan biaya per layanan untuk pendaftaran dan peresepan di Rawat Jalan, Rawat Inap, dan Farmasi. Data dihitung secara otomatis berdasarkan biaya unit, distribusi biaya kedua, dan jumlah kunjungan/lembar resep.

---

## 📍 Lokasi Menu
**Menu:** `Unit Pelayanan` > `Kalkulasi Pendaftaran dan Peresepan`  
**URL:** `/pelayanan/kalkulasi-pendaftaran-resep`

---

## 🎨 Tampilan Halaman

### 1. **Header Section**
- Judul: "Kalkulasi Pendaftaran dan Peresepan"
- Tombol "Perbarui Data" untuk refresh manual
- Deskripsi singkat tentang halaman

### 2. **Info Card**
Card informasi dengan latar belakang gradient teal-blue yang menjelaskan:
- Sumber data kalkulasi
- Cara perhitungan otomatis

### 3. **Cards Kalkulasi (5 Jenis Layanan)**

Setiap card menampilkan badge dengan informasi lengkap:

#### a. **Pendaftaran Rawat Jalan**
- **Badge:** Biru (Default variant)
- **Icon:** ClipboardList
- **Biaya per Layanan:** Ditampilkan dengan latar belakang gradient teal
- **Rincian:**
  - Biaya Unit: dari TPPRJ (UK017)
  - Distribusi Kedua: Rp 0 (pusat biaya)
  - Total Biaya Unit
  - Jumlah Pembagi: Total kunjungan pasien rawat jalan

#### b. **Peresepan Rawat Jalan**
- **Badge:** Biru (Default variant)
- **Icon:** Pill
- **Rincian:**
  - Biaya Unit: dari Farmasi (UK040)
  - Distribusi Kedua: dari tabel distribusi_biaya_kedua
  - Total Biaya Unit
  - Jumlah Pembagi: Total lembar resep rawat jalan

#### c. **Pendaftaran Rawat Inap**
- **Badge:** Abu-abu (Secondary variant)
- **Icon:** ClipboardList
- **Rincian:**
  - Biaya Unit: dari TPPRI (UK018)
  - Distribusi Kedua: Rp 0 (pusat biaya)
  - Total Biaya Unit
  - Jumlah Pembagi: Total kunjungan pasien rawat inap

#### d. **Peresepan Rawat Inap**
- **Badge:** Abu-abu (Secondary variant)
- **Icon:** Pill
- **Rincian:**
  - Biaya Unit: dari Farmasi (UK040)
  - Distribusi Kedua: dari tabel distribusi_biaya_kedua
  - Total Biaya Unit
  - Jumlah Pembagi: Total lembar resep rawat inap

#### e. **Peresepan Farmasi**
- **Badge:** Outline variant
- **Icon:** Pill
- **Rincian:**
  - Biaya Unit: dari Farmasi (UK040)
  - Distribusi Kedua: dari tabel distribusi_biaya_kedua
  - Total Biaya Unit
  - Jumlah Pembagi: Total lembar resep semua unit kerja

### 4. **Legend Section**
Kartu keterangan yang menjelaskan:
- Ikon dan makna setiap jenis layanan
- Cara perhitungan pendaftaran dan peresepan
- Sistem auto-update

---

## 🔄 Sistem Auto-Update

### Trigger Otomatis
Data akan diperbarui secara otomatis ketika terjadi perubahan pada:

1. **Tabel `data_biaya`** (untuk unit UK017, UK018, UK040)
   - Perubahan biaya unit TPPRJ, TPPRI, atau Farmasi
   - Memicu kalkulasi ulang otomatis

2. **Tabel `data_kegiatan`**
   - Perubahan jumlah kunjungan pasien
   - Perubahan jumlah lembar resep
   - Memicu kalkulasi ulang otomatis

3. **Tabel `distribusi_biaya_kedua`**
   - Perubahan distribusi biaya kedua untuk Farmasi
   - Memicu kalkulasi ulang otomatis

4. **Tabel `biaya_preference`**
   - Perubahan preferensi biaya (total_biaya atau total_biaya_tanpa_jp)
   - Memicu kalkulasi ulang otomatis

### Manual Refresh
Pengguna dapat klik tombol **"Perbarui Data"** untuk:
- Memicu kalkulasi ulang secara manual
- Sinkronisasi data terbaru dari database
- Menampilkan notifikasi berhasil/gagal

---

## 📊 Sumber Data

### 1. **Tabel Database**
- `kalkulasi_daftar_dan_resep`: Menyimpan hasil kalkulasi
- `data_biaya`: Sumber biaya unit
- `distribusi_biaya_kedua`: Sumber distribusi kedua
- `data_kegiatan`: Sumber jumlah kunjungan dan lembar resep
- `biaya_preference`: Preferensi jenis biaya (total_biaya vs total_biaya_tanpa_jp)

### 2. **Unit Kerja Terkait**
- **UK017 (TPPRJ)**: Tempat Pendaftaran Pasien Rawat Jalan
- **UK018 (TPPRI)**: Tempat Pendaftaran Pasien Rawat Inap
- **UK040 (Farmasi)**: Unit Farmasi

---

## 💰 Formula Kalkulasi

### **Rumus Umum:**
```
Biaya Per Layanan = (Biaya Unit + Distribusi Kedua) ÷ Jumlah Pembagi
```

### **Detail per Jenis Layanan:**

#### 1. Pendaftaran Rawat Jalan
```
Biaya = (Biaya Unit TPPRJ + 0) ÷ Total Kunjungan Rawat Jalan
```

#### 2. Peresepan Rawat Jalan
```
Biaya = (Biaya Unit Farmasi + Distribusi Kedua Farmasi) ÷ Total Lembar Resep Rawat Jalan
```

#### 3. Pendaftaran Rawat Inap
```
Biaya = (Biaya Unit TPPRI + 0) ÷ Total Kunjungan Rawat Inap
```

#### 4. Peresepan Rawat Inap
```
Biaya = (Biaya Unit Farmasi + Distribusi Kedua Farmasi) ÷ Total Lembar Resep Rawat Inap
```

#### 5. Peresepan Farmasi
```
Biaya = (Biaya Unit Farmasi + Distribusi Kedua Farmasi) ÷ Total Lembar Resep Semua Unit
```

---

## 🛠️ Technical Stack

### **Frontend:**
- React + TypeScript
- TailwindCSS untuk styling
- Shadcn UI components
- Lucide icons
- React Router untuk routing

### **Backend:**
- Supabase (PostgreSQL)
- Row Level Security (RLS) aktif
- Auto-trigger functions
- Real-time data sync

### **Components:**
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Badge untuk kategori
- Button untuk aksi
- Toast notifications
- Loader untuk loading state

---

## 🎨 Color Scheme & Styling

### **Badge Variants:**
- **Default (Biru)**: Rawat Jalan
- **Secondary (Abu-abu)**: Rawat Inap
- **Outline**: Farmasi (semua unit)

### **Card Styling:**
- Border kiri teal (4px) untuk highlight
- Hover shadow effect
- Responsive grid layout (1 kolom di mobile, 2 kolom di desktop)

### **Biaya Layanan Display:**
- Gradient background: teal-600 to teal-700
- White text
- Large font (3xl) untuk emphasis
- Rounded corners

---

## 📱 Responsive Design

### **Mobile (< 768px):**
- Single column layout
- Full-width cards
- Stacked content
- Touch-friendly buttons

### **Tablet (768px - 1024px):**
- 2 column grid
- Adjusted padding

### **Desktop (> 1024px):**
- 2 column grid
- Full feature display
- Optimal spacing

---

## 🔔 Notifications

### **Success:**
- "Data berhasil diperbarui" - setelah refresh manual sukses

### **Error:**
- "Gagal mengambil data kalkulasi" - saat fetch data gagal
- "Gagal memperbarui data" - saat refresh manual gagal
- "User tidak terautentikasi" - saat session expired

---

## 🔒 Security

### **Row Level Security (RLS):**
- Aktif pada tabel `kalkulasi_daftar_dan_resep`
- User hanya dapat melihat data mereka sendiri
- Filter otomatis berdasarkan `user_id`

### **Authentication:**
- Protected route dengan `ProtectedRoute` wrapper
- Redirect ke `/login` jika tidak terautentikasi
- Session checking via Supabase Auth

---

## 📈 Performance

### **Optimizations:**
- Data fetching on mount (useEffect)
- Loading state management
- Error boundary handling
- Efficient re-renders
- Memoized calculations (database side)

### **Database Performance:**
- Indexed columns (user_id, tahun)
- Efficient queries with WHERE clauses
- Generated columns untuk computed values
- Trigger-based auto-updates

---

## 🧪 Testing

### **Manual Testing Checklist:**
- [ ] Halaman loading dengan benar
- [ ] Data ditampilkan sesuai format
- [ ] Tombol "Perbarui Data" berfungsi
- [ ] Badge variant sesuai jenis layanan
- [ ] Format currency dan number benar
- [ ] Responsive di berbagai device
- [ ] Auto-update trigger berfungsi
- [ ] Error handling bekerja
- [ ] Toast notifications muncul
- [ ] Navigation dari sidebar bekerja

---

## 📚 API Reference

### **Supabase RPC Function:**
```typescript
supabase.rpc("populate_kalkulasi_daftar_resep", {
  p_user_id: string (UUID),
  p_tahun: number
})
```

### **Table Query:**
```typescript
supabase
  .from("kalkulasi_daftar_dan_resep")
  .select("*")
  .eq("user_id", userId)
  .eq("tahun", 2025)
  .order("jenis_layanan")
```

---

## 🐛 Troubleshooting

### **Problem: Data tidak muncul**
**Solution:**
1. Pastikan user sudah login
2. Cek data di tabel `data_biaya` untuk UK017, UK018, UK040
3. Cek data di tabel `data_kegiatan`
4. Klik tombol "Perbarui Data" untuk trigger manual

### **Problem: Biaya layanan = 0**
**Solution:**
1. Cek jumlah kunjungan/lembar resep di `data_kegiatan`
2. Pastikan ada data untuk jenis yang sesuai (Rawat Jalan/Rawat Inap)
3. Pastikan biaya unit tidak 0 di `data_biaya`

### **Problem: Auto-update tidak berjalan**
**Solution:**
1. Cek trigger aktif di database
2. Verifikasi data yang diubah sesuai dengan trigger condition
3. Cek log error di Supabase dashboard

---

## 📝 Changelog

### **Version 1.0.0 (9 Oktober 2025)**
- ✅ Initial release
- ✅ 5 jenis layanan dengan badge
- ✅ Auto-update triggers
- ✅ Manual refresh button
- ✅ Responsive design
- ✅ Real-time data sync
- ✅ Error handling & notifications
- ✅ Detailed breakdown per card

---

## 🎓 User Guide

### **Cara Menggunakan:**

1. **Akses Halaman:**
   - Login ke aplikasi
   - Klik menu "Unit Pelayanan"
   - Pilih "Kalkulasi Pendaftaran dan Peresepan"

2. **Lihat Data:**
   - Data akan otomatis dimuat saat halaman dibuka
   - Setiap card menampilkan 1 jenis layanan
   - Biaya per layanan ditampilkan dengan highlight

3. **Perbarui Data:**
   - Klik tombol "Perbarui Data" di pojok kanan atas
   - Tunggu proses selesai
   - Toast notification akan muncul

4. **Interpretasi Data:**
   - Lihat "Biaya Per Layanan" (angka besar di tengah card)
   - Cek "Rincian Kalkulasi" untuk detail breakdown
   - Perhatikan jumlah pembagi untuk memahami volume

5. **Legend:**
   - Scroll ke bawah untuk melihat keterangan
   - Pahami perbedaan pendaftaran vs peresepan
   - Ketahui sumber data setiap perhitungan

---

## 🔮 Future Enhancements

### **Planned Features:**
- [ ] Export ke Excel/PDF
- [ ] Filter by tahun
- [ ] Comparison view (year-over-year)
- [ ] Charts/graphs visualisasi
- [ ] Historical data view
- [ ] Breakdown per unit kerja
- [ ] Customizable alerts/thresholds
- [ ] Bulk operations

---

## 👥 Support & Contact

Untuk pertanyaan atau masalah terkait halaman ini:
- Dokumentasi lengkap tersedia di `/docs`
- Database schema di file `SKEMA_DATABASE_KALKULASI_DAFTAR_RESEP.md`
- Check migrations di folder `supabase/migrations`

---

**Last Updated:** 9 Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

