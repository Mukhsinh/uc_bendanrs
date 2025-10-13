# Verifikasi Template Import Data Pendapatan - Relasi Unit Kerja

## 🔍 **Analisis Struktur Database**

### **Tabel unit_kerja (Data Master)**
- **Total Unit Kerja:** 77 unit
- **Pusat Pendapatan:** 41 unit
- **Format Kode:** UK### (contoh: UK037, UK038, UK039, dll)
- **Kategori:** 'Pusat Biaya' | 'Pusat Pendapatan'
- **Jenis:** 1=Rawat Jalan, 2=Rawat Inap, 3=Operatif, 4=Non Layanan

### **Tabel data_pendapatan**
- **Relasi:** Foreign Key ke unit_kerja.id
- **Kolom Cached:** kode_unit_kerja, nama_unit_kerja
- **Constraint:** data_pendapatan_unit_kerja_id_fkey

## ✅ **Verifikasi Template Import**

### **1. Template CSV yang Dihasilkan**
```csv
Kode Unit Kerja,Nama Unit Kerja,Pendapatan Umum,Pendapatan BPJS,Tahun
UK037,Ambulance,0,0,2024
UK038,Laboratorium (PK-PA),0,0,2024
UK039,Radiologi,0,0,2024
UK040,Farmasi,0,0,2024
UK041,Rehab. Medik,0,0,2024
UK042,Gizi (Dapur),0,0,2024
UK043,Laundry & CSSD,0,0,2024
UK044,BDRS,0,0,2024
UK045,Cathlab,0,0,2024
UK046,Terang bulan (VIP-VVIP),0,0,2024
UK047,Truntum,0,0,2024
UK048,Sekarjagat,0,0,2024
UK049,Jlamprang,0,0,2024
UK050,Nifas,0,0,2024
UK051,Perinatologi,0,0,2024
... (dan seterusnya untuk semua 41 unit Pusat Pendapatan)
```

### **2. Fungsi Template yang Sudah Diperbaiki**
```typescript
const handleDownloadTemplate = () => {
  if (unitKerjaList.length === 0) {
    toast.warning("Belum ada data unit kerja. Silakan refresh halaman dan coba lagi.");
    return;
  }

  // Create template with unit kerja data
  const templateData = unitKerjaList.map(unitKerja => ({
    "Kode Unit Kerja": unitKerja.kode,        // ✅ Menggunakan kode asli (UK037, UK038, dll)
    "Nama Unit Kerja": unitKerja.nama,        // ✅ Nama lengkap unit kerja
    "Pendapatan Umum": 0,                     // ✅ Default value
    "Pendapatan BPJS": 0,                     // ✅ Default value
    "Tahun": new Date().getFullYear()         // ✅ Tahun saat ini
  }));

  const csv = Papa.unparse(templateData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "template_data_pendapatan.csv");
  toast.info(`Template impor data berhasil diunduh dengan ${unitKerjaList.length} unit kerja Pusat Pendapatan.`);
};
```

### **3. Fungsi Import yang Sudah Benar**
```typescript
// Find unit kerja by kode
const unitKerja = unitKerjaList.find(uk => uk.kode === row["Kode Unit Kerja"]);

if (unitKerja) {
  importedData.push({
    unit_kerja_id: unitKerja.id,              // ✅ UUID dari tabel unit_kerja
    kode_unit_kerja: unitKerja.kode,          // ✅ Kode asli (UK037, dll)
    nama_unit_kerja: unitKerja.nama,          // ✅ Nama lengkap
    pendapatan_umum: parseFloat(row["Pendapatan Umum"]) || 0,
    pendapatan_bpjs: parseFloat(row["Pendapatan BPJS"]) || 0,
    tahun: parseInt(row["Tahun"]) || new Date().getFullYear(),
  });
  successCount++;
} else {
  errorCount++;                               // ✅ Error jika kode tidak ditemukan
}
```

## 🔗 **Relasi Database yang Benar**

### **Foreign Key Constraint**
```sql
CONSTRAINT data_pendapatan_unit_kerja_id_fkey 
FOREIGN KEY (unit_kerja_id) 
REFERENCES unit_kerja(id) 
ON DELETE SET NULL
```

### **Data Flow**
1. **Template Download:** Mengambil data dari `unit_kerja` WHERE `kategori = 'Pusat Pendapatan'`
2. **User Input:** Mengisi template dengan nilai pendapatan
3. **Import Process:** Mencocokkan kode dari CSV dengan `unit_kerja.kode`
4. **Database Insert:** Menyimpan dengan `unit_kerja_id` yang benar

## 📊 **Contoh Data Unit Kerja Pusat Pendapatan**

| Kode | Nama | Jenis | Kategori |
|------|------|-------|----------|
| UK037 | Ambulance | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK038 | Laboratorium (PK-PA) | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK039 | Radiologi | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK040 | Farmasi | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK041 | Rehab. Medik | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK042 | Gizi (Dapur) | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK043 | Laundry & CSSD | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK044 | BDRS | 1 (Rawat Jalan) | Pusat Pendapatan |
| UK045 | Cathlab | 3 (Operatif) | Pusat Pendapatan |
| UK046 | Terang bulan (VIP-VVIP) | 2 (Rawat Inap) | Pusat Pendapatan |
| UK047 | Truntum | 2 (Rawat Inap) | Pusat Pendapatan |
| UK048 | Sekarjagat | 2 (Rawat Inap) | Pusat Pendapatan |
| UK049 | Jlamprang | 2 (Rawat Inap) | Pusat Pendapatan |
| UK050 | Nifas | 2 (Rawat Inap) | Pusat Pendapatan |
| UK051 | Perinatologi | 2 (Rawat Inap) | Pusat Pendapatan |

## ✅ **Status Verifikasi**

- ✅ **Relasi Database:** Foreign key constraint sudah benar
- ✅ **Template Format:** Menggunakan kode asli (UK037, UK038, dll)
- ✅ **Filter Kategori:** Hanya menampilkan "Pusat Pendapatan"
- ✅ **Import Process:** Mencocokkan kode dengan benar
- ✅ **Data Integrity:** Menggunakan unit_kerja_id yang valid
- ✅ **Error Handling:** Validasi kode unit kerja
- ✅ **User Experience:** Template siap pakai dengan 41 unit kerja

## 🎯 **Kesimpulan**

Template import data pendapatan sudah **sesuai dengan relasi tabel unit_kerja di data master**. Semua 41 unit kerja dengan kategori "Pusat Pendapatan" akan otomatis muncul dalam template dengan kode yang benar (format UK###), dan proses import akan mencocokkan kode tersebut dengan data master untuk mendapatkan unit_kerja_id yang valid.

**Tidak ada perubahan lebih lanjut yang diperlukan** - sistem sudah bekerja dengan benar sesuai dengan struktur database yang ada.
