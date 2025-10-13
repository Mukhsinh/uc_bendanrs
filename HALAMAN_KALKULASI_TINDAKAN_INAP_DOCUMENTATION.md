# 📊 Dokumentasi Halaman Kalkulasi Tindakan Inap

## 🎯 **Overview**

Halaman **Kalkulasi Tindakan Inap** adalah fitur baru yang menyediakan tampilan lengkap dan interaktif untuk data perhitungan unit cost tindakan inap. Halaman ini dilengkapi dengan fitur filter canggih dan kemampuan export laporan dalam format Excel dan CSV.

## 🚀 **Fitur Utama**

### 1. **Dashboard Overview**
- **Summary Cards**: Menampilkan statistik ringkasan
  - Total Records
  - Jumlah Unit Kerja
  - Total Unit Cost
  - Rata-rata Unit Cost

### 2. **Filter Data Canggih**
- **Filter Tahun**: Filter berdasarkan tahun kalkulasi
- **Filter Unit Kerja**: Dropdown dengan semua unit kerja tersedia
- **Filter Jenis Tindakan**: Dropdown dengan semua jenis tindakan
- **Search Bar**: Pencarian berdasarkan kode atau nama
- **Real-time Filtering**: Filter diterapkan secara real-time

### 3. **Export Laporan**
- **Excel Export**: Export data ke format .xlsx dengan formatting yang baik
- **CSV Export**: Export data ke format .csv untuk kompatibilitas
- **Filtered Export**: Export hanya data yang difilter
- **Auto Naming**: File otomatis diberi nama dengan tanggal

### 4. **Refresh Data Otomatis**
- **Manual Refresh**: Tombol untuk memperbarui data
- **Trigger Recalculation**: Memanggil fungsi database untuk recalculate
- **Loading States**: Indikator loading yang jelas

## 📋 **Struktur Data**

### **Interface KalkulasiTindakanInap**
```typescript
interface KalkulasiTindakanInap {
  id: string;
  tahun: number;
  kode_jenis: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_jenis_tindakan: string;
  jenis_tindakan: string;
  jumlah: number;
  waktu: number;
  profesionalisme: number;
  tingkat_kesulitan: number;
  hasil_kali_waktu: number;
  hasil_kali: number;
  biaya_bahan_tindakan: number;
  kali_bahan: number;
  rasio_tindakan: number;
  dasar_alokasi_kali_waktu: number;
  dasar_alokasi_hasil_kali: number;
  
  // Biaya Komponen
  biaya_gaji_tunjangan: number;
  biaya_jasa_pelayanan: number;
  biaya_obat: number;
  biaya_bhp: number;
  biaya_makan_karyawan: number;
  biaya_makan_pasien: number;
  biaya_rumah_tangga: number;
  biaya_cetak: number;
  biaya_atk: number;
  biaya_listrik: number;
  biaya_air: number;
  biaya_telp: number;
  biaya_pemeliharaan_bangunan: number;
  biaya_pemeliharaan_alat_medis: number;
  biaya_pemeliharaan_alat_non_medis: number;
  biaya_operasional_lainnya: number;
  biaya_penyusutan_gedung: number;
  biaya_penyusutan_jaringan: number;
  biaya_penyusutan_alat_medis: number;
  biaya_penyusutan_alat_non_medis: number;
  biaya_pendidikan_pelatihan: number;
  biaya_laundry: number;
  biaya_sterilisasi: number;
  biaya_tidak_langsung_terdistribusi: number;
  
  // Hasil Kalkulasi
  unit_cost_tindakan_inap: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}
```

## 🎨 **UI Components**

### **1. Summary Cards**
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Total Records</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{filteredData.length}</div>
    </CardContent>
  </Card>
  // ... other cards
</div>
```

### **2. Filter Section**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Filter className="h-5 w-5" />
      Filter Data
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      // Filter inputs
    </div>
  </CardContent>
</Card>
```

### **3. Data Table**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Tahun</TableHead>
      <TableHead>Unit Kerja</TableHead>
      <TableHead>Jenis Tindakan</TableHead>
      <TableHead>Jumlah</TableHead>
      <TableHead>Waktu (Menit)</TableHead>
      <TableHead>Rasio (%)</TableHead>
      <TableHead>Dasar Alokasi</TableHead>
      <TableHead>Unit Cost</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    // Table rows
  </TableBody>
</Table>
```

## 🔧 **Fungsi Utama**

### **1. fetchData()**
- Mengambil data dari tabel `kalkulasi_tindakan_inap`
- Mengurutkan berdasarkan `kode_unit_kerja` dan `kode_jenis_tindakan`
- Error handling dengan toast notification

### **2. applyFilters()**
- Menerapkan filter tahun, unit kerja, jenis tindakan, dan search
- Real-time filtering tanpa perlu submit
- Case-insensitive search

### **3. handleRefresh()**
- Memanggil fungsi database `calculate_all_kalkulasi_tindakan_inap`
- Memperbarui data setelah recalculation
- Loading state management

### **4. exportToExcel()**
- Menggunakan library `xlsx` untuk export
- Format data yang user-friendly
- Auto-generated filename dengan timestamp

### **5. exportToCSV()**
- Export ke format CSV
- Proper CSV formatting dengan quotes
- Download otomatis

## 📊 **Format Export**

### **Excel Export**
- Sheet name: "Kalkulasi Tindakan Inap"
- Headers dalam bahasa Indonesia
- Semua kolom data termasuk
- Filename: `kalkulasi_tindakan_inap_YYYY_YYYY-MM-DD.xlsx`

### **CSV Export**
- UTF-8 encoding
- Comma-separated values
- Proper escaping untuk text dengan quotes
- Filename: `kalkulasi_tindakan_inap_YYYY_YYYY-MM-DD.csv`

## 🎯 **Navigation Integration**

### **Menu Location**
```
Unit Keperawatan
├── Manajemen Tindakan Inap
├── Data Akomodasi Inap
└── Kalkulasi Tindakan Inap ← NEW
```

### **Route Configuration**
```tsx
<Route path="/keperawatan/kalkulasi-tindakan-inap" element={
  <ProtectedRoute>
    <KalkulasiTindakanInap />
  </ProtectedRoute>
} />
```

## 🔐 **Security Features**

### **Authentication**
- Protected route dengan `ProtectedRoute` component
- User session validation
- Redirect ke login jika tidak authenticated

### **Data Access**
- Menggunakan Supabase RLS (Row Level Security)
- Data hanya dapat diakses oleh user yang memiliki akses
- User ID validation pada semua queries

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: Single column layout
- **Tablet**: 2-3 column grid
- **Desktop**: 4-5 column grid

### **Adaptive Components**
- Responsive table dengan horizontal scroll
- Collapsible filter section
- Mobile-friendly buttons

## 🚀 **Performance Features**

### **Loading States**
- Skeleton loading untuk initial load
- Spinner untuk refresh operations
- Progressive data loading

### **Optimization**
- Debounced search input
- Efficient filtering algorithms
- Lazy loading untuk large datasets

## 🎨 **UI/UX Features**

### **Visual Indicators**
- Badge untuk rasio tindakan
- Currency formatting untuk nilai moneter
- Color-coded status indicators

### **User Feedback**
- Toast notifications untuk semua actions
- Loading spinners
- Success/error messages

### **Accessibility**
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

## 🔄 **Integration dengan Database**

### **Supabase Integration**
```typescript
// Fetch data
const { data: kalkulasiData, error } = await supabase
  .from('kalkulasi_tindakan_inap')
  .select('*')
  .order('kode_unit_kerja', { ascending: true })
  .order('kode_jenis_tindakan', { ascending: true });

// Trigger recalculation
const { error } = await supabase.rpc('calculate_all_kalkulasi_tindakan_inap', {
  p_user_id: (await supabase.auth.getUser()).data.user?.id,
  p_tahun: parseInt(filter.tahun)
});
```

### **Real-time Updates**
- Automatic refresh setelah data changes
- Trigger-based recalculation
- Consistent data state

## 📈 **Future Enhancements**

### **Planned Features**
1. **Chart Visualization**: Grafik trend unit cost
2. **Comparative Analysis**: Perbandingan antar periode
3. **Drill-down Reports**: Detail breakdown per komponen biaya
4. **Scheduled Reports**: Export otomatis per jadwal
5. **Advanced Filtering**: Date range, cost range filters
6. **Print Preview**: Print-friendly view
7. **Data Validation**: Real-time data validation indicators

### **Technical Improvements**
1. **Virtual Scrolling**: Untuk handle large datasets
2. **Caching**: Implementasi cache untuk performance
3. **Offline Support**: PWA capabilities
4. **Batch Operations**: Bulk export/import features

## 🎯 **Usage Guidelines**

### **Untuk Administrator**
1. Gunakan fitur refresh untuk memperbarui data setelah perubahan master data
2. Export laporan secara berkala untuk backup
3. Monitor summary cards untuk overview kesehatan data

### **Untuk User**
1. Gunakan filter untuk fokus pada data yang relevan
2. Export hanya data yang diperlukan untuk efisiensi
3. Gunakan search untuk menemukan data spesifik dengan cepat

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Data tidak muncul**: Check authentication dan refresh data
2. **Export gagal**: Pastikan browser mendukung file download
3. **Filter tidak bekerja**: Clear browser cache dan reload halaman

### **Error Handling**
- Semua error ditampilkan dengan toast notification
- Logging untuk debugging
- Graceful degradation untuk network issues

---

## 📞 **Support**

Untuk pertanyaan atau masalah teknis, silakan hubungi tim development atau buka issue di repository project.

**Dibuat dengan ❤️ menggunakan React, TypeScript, dan Supabase**
