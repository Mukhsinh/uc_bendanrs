# 📋 MODUL TEKNIS - GAMBARAN UMUM APLIKASI

## 🎯 OVERVIEW

**Aplikasi Unit Cost RS** adalah sistem informasi manajemen yang dirancang khusus untuk menghitung biaya unit cost (unit costing) di rumah sakit. Aplikasi ini membantu rumah sakit dalam melakukan perhitungan biaya yang akurat untuk setiap layanan medis yang diberikan.

---

## 🏗️ ARSITEKTUR SISTEM

### **Technology Stack**

| Komponen | Teknologi | Versi | Keterangan |
|----------|-----------|-------|------------|
| **Frontend** | React + TypeScript | 18.x | UI Framework |
| **Backend** | Supabase (PostgreSQL) | Latest | Database & API |
| **UI Library** | Shadcn/ui + Tailwind CSS | Latest | Component Library |
| **State Management** | React Query + useState | Latest | Data Fetching |
| **Authentication** | Supabase Auth | Latest | User Management |
| **Deployment** | Vercel | Latest | Hosting Platform |

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  React App (TypeScript)                                    │
│  ├── Pages & Components                                    │
│  ├── UI Components (Shadcn/ui)                            │
│  ├── State Management (React Query)                       │
│  └── Routing (React Router)                               │
├─────────────────────────────────────────────────────────────┤
│                    API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  Supabase Client                                           │
│  ├── Authentication                                        │
│  ├── Database Access                                       │
│  ├── Real-time Subscriptions                              │
│  └── File Storage                                          │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase)                                     │
│  ├── Tables (45+ tables)                                  │
│  ├── Views & Functions                                     │
│  ├── Triggers & Procedures                                │
│  └── Row Level Security (RLS)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 FITUR-FITUR UTAMA

### **1. Data Master Management**
- **Unit Kerja**: Manajemen departemen dan unit kerja RS
- **Barang Farmasi**: Katalog obat dan bahan farmasi
- **Barang Gizi**: Database menu dan bahan gizi
- **Data Kamar**: Informasi kamar rawat inap
- **Data Klinik**: Data klinik dan poliklinik
- **Menu Gizi**: Menu makanan pasien
- **Data Diklat**: Program pendidikan dan pelatihan
- **Daftar Tindakan**: Katalog tindakan medis
- **Tindakan Spesifik**: Lab, Radiologi, Operatif, BDRS, Cathlab

### **2. Data Operasional**
- **Data Kegiatan**: Aktivitas operasional RS
- **Data Pendapatan**: Tracking pendapatan per unit
- **Data Biaya**: Pencatatan biaya operasional

### **3. Unit Penunjang**
- **Kalkulasi Biaya Gizi**: Perhitungan biaya makanan pasien
- **Kalkulasi Biaya Laboratorium**: Cost per tes lab
- **Kalkulasi Biaya Radiologi**: Cost per pemeriksaan
- **Kalkulasi BDRS**: Biaya dialisis

### **4. Unit Keperawatan**
- **Manajemen Tindakan Inap**: Tindakan perawatan rawat inap
- **Data Akomodasi Inap**: Manajemen kamar dan kelas
- **Kalkulasi Tindakan Inap**: Cost calculation rawat inap
- **Kalkulasi Biaya Kelas Akomodasi**: Tarif per kelas kamar

### **5. Unit Pelayanan**
- **Manajemen Tindakan Rawat Jalan**: Tindakan poliklinik
- **Kalkulasi Biaya Rawat Jalan**: Cost rawat jalan
- **Kalkulasi Pendaftaran dan Peresepan**: Biaya administrasi
- **Kalkulasi Biaya Operatif**: Cost operasi
- **Kalkulasi Biaya Cathlab**: Biaya kateterisasi

### **6. Unit Diklat**
- **Kalkulasi Biaya Diklat**: Cost program pendidikan

### **7. Rekapitulasi & Reporting**
- **Rekapitulasi Unit Cost**: Laporan komprehensif unit cost
- **Skenario Tarif**: Manajemen tarif layanan
- **Distribusi Biaya**: Alokasi biaya ke unit cost
- **Cost Recovery**: Analisis pemulihan biaya
- **Budgeting BHP**: Perencanaan budget BHP

### **8. Produk Layanan**
- **Produk Layanan**: Paket layanan dengan unit cost

---

## 🔄 WORKFLOW UMUM APLIKASI

### **Phase 1: Data Setup**
```
1. Setup Data Master
   ├── Unit Kerja
   ├── Barang Farmasi/Gizi
   ├── Data Kamar/Klinik
   └── Daftar Tindakan

2. Input Data Operasional
   ├── Data Kegiatan
   ├── Data Pendapatan
   └── Data Biaya
```

### **Phase 2: Kalkulasi Unit Cost**
```
3. Kalkulasi per Unit
   ├── Unit Penunjang (Gizi, Lab, Radiologi, BDRS)
   ├── Unit Keperawatan (Tindakan Inap, Akomodasi)
   ├── Unit Pelayanan (Rawat Jalan, Operatif, Cathlab)
   └── Unit Diklat

4. Rekapitulasi Unit Cost
   └── Aggregasi semua unit cost
```

### **Phase 3: Distribusi & Tarif**
```
5. Skenario Tarif
   ├── Tarif Tindakan
   ├── Tarif Akomodasi
   └── Tarif Visit & Konsultasi

6. Distribusi Biaya
   ├── Distribusi Pertama
   ├── Distribusi Kedua
   └── Rekap Distribusi

7. Cost Recovery & Budgeting
   ├── Analisis Cost Recovery
   └── Budgeting BHP
```

### **Phase 4: Produk Layanan**
```
8. Produk Layanan
   ├── Setup produk berdasarkan INA-CBG
   ├── Input layanan (tindakan, farmasi, dll)
   ├── Kalkulasi total biaya
   └── Analisis profit margin
```

---

## 📊 STRUKTUR MENU DAN NAVIGASI

### **Hierarchy Menu**

```
🏠 Dashboard
├── 📊 Data Master
│   ├── Unit Kerja
│   ├── Barang Farmasi
│   ├── Barang Gizi
│   ├── Data Kamar
│   ├── Data Klinik
│   ├── Menu Gizi
│   ├── Data Diklat
│   ├── Daftar Tindakan
│   ├── Tindakan Laboratorium
│   ├── Tindakan Radiologi
│   ├── Tindakan Operatif
│   ├── Tindakan BDRS
│   └── Tindakan Cathlab
├── ⚙️ Data Operasional
│   ├── Data Kegiatan
│   ├── Data Pendapatan
│   └── Data Biaya
├── 🏢 Unit Penunjang
│   ├── Kalkulasi Biaya Gizi
│   ├── Kalkulasi Biaya Laboratorium
│   ├── Kalkulasi Biaya Radiologi
│   └── Kalkulasi BDRS
├── 👥 Unit Keperawatan
│   ├── Manajemen Tindakan Inap
│   ├── Data Akomodasi Inap
│   ├── Kalkulasi Tindakan Inap
│   └── Kalkulasi Biaya Kelas Akomodasi
├── 🏥 Unit Pelayanan
│   ├── Manajemen Tindakan Rawat Jalan
│   ├── Kalkulasi Biaya Rawat Jalan
│   ├── Kalkulasi Pendaftaran dan Peresepan
│   ├── Kalkulasi Biaya Operatif
│   └── Kalkulasi Biaya Cathlab
├── 📚 Unit Diklat
│   └── Kalkulasi Biaya Diklat
├── 📈 Rekapitulasi Unit Cost
├── 📋 Skenario Tarif
│   ├── Skenario Tarif Tindakan
│   ├── Skenario Tarif Akomodasi
│   └── Skenario Tarif Visit & Konsultasi
├── 📊 Distribusi Biaya
│   ├── Distribusi Biaya Pertama
│   ├── Distribusi Biaya Kedua
│   └── Distribusi Biaya Rekap
├── 🥧 Cost Recovery
├── 📦 Budgeting BHP
│   ├── Budgeting BHP (Rupiah)
│   └── Budgeting BHP (Rincian)
├── 🛒 Produk Layanan
└── 📖 Modul Teknis
```

---

## 💡 PRINSIP-PRINSIP UNIT COSTING

### **1. Activity-Based Costing (ABC)**
- **Konsep**: Biaya dialokasikan berdasarkan aktivitas yang dilakukan
- **Implementasi**: Setiap tindakan medis memiliki biaya tersendiri
- **Benefit**: Akurasi tinggi dalam perhitungan biaya

### **2. Cost Center Approach**
- **Konsep**: Setiap unit kerja sebagai pusat biaya
- **Implementasi**: Unit Penunjang, Keperawatan, Pelayanan, Diklat
- **Benefit**: Kontrol biaya per departemen

### **3. Direct & Indirect Cost Allocation**
- **Direct Cost**: Biaya langsung ke pasien (obat, tindakan)
- **Indirect Cost**: Biaya tidak langsung (overhead, administrasi)
- **Implementasi**: Sistem distribusi biaya bertahap

### **4. Time-Driven Activity-Based Costing**
- **Konsep**: Biaya berdasarkan waktu yang digunakan
- **Implementasi**: LOS (Length of Stay), jam kerja per tindakan
- **Benefit**: Perhitungan biaya yang realistis

---

## 🔐 SISTEM KEAMANAN

### **Authentication & Authorization**
- **Supabase Auth**: Sistem login yang aman
- **Row Level Security (RLS)**: Data isolation per user
- **Protected Routes**: Akses terbatas berdasarkan role

### **Data Security**
- **Encryption**: Data dienkripsi di transit dan rest
- **Backup**: Automated backup harian
- **Audit Trail**: Log semua perubahan data

### **Access Control**
- **User Management**: Kontrol akses per user
- **Role-based Access**: Berbeda akses per role
- **Session Management**: Auto logout untuk keamanan

---

## 📱 RESPONSIVE DESIGN

### **Device Compatibility**
- **Desktop**: Full functionality dengan layout optimal
- **Tablet**: Responsive design dengan touch-friendly UI
- **Mobile**: Core functionality dengan UI yang disesuaikan

### **Browser Support**
- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

---

## 🚀 PERFORMANCE OPTIMIZATION

### **Frontend Optimization**
- **Code Splitting**: Load component on demand
- **Lazy Loading**: Load data when needed
- **Caching**: React Query untuk data caching
- **Bundle Optimization**: Minified production build

### **Database Optimization**
- **Indexing**: Optimized database indexes
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Supabase managed connections
- **Real-time Updates**: Efficient data synchronization

---

## 🔧 MAINTENANCE & SUPPORT

### **Monitoring**
- **Error Tracking**: Automatic error reporting
- **Performance Monitoring**: Real-time performance metrics
- **User Analytics**: Usage statistics and patterns

### **Updates & Maintenance**
- **Automated Updates**: Frontend auto-update via Vercel
- **Database Maintenance**: Supabase managed maintenance
- **Security Patches**: Regular security updates

### **Support Channels**
- **Documentation**: Comprehensive technical documentation
- **User Guide**: Step-by-step user manual
- **Technical Support**: Developer support available

---

## 📈 SCALABILITY

### **Horizontal Scaling**
- **Frontend**: CDN distribution via Vercel
- **Database**: Supabase auto-scaling
- **API**: Supabase managed API scaling

### **Data Growth**
- **Storage**: Unlimited storage via Supabase
- **Performance**: Optimized for large datasets
- **Archiving**: Automated data archiving strategies

---

## 🎯 BUSINESS VALUE

### **Cost Transparency**
- **Accurate Costing**: Perhitungan biaya yang akurat
- **Cost Control**: Kontrol biaya per unit kerja
- **Profitability Analysis**: Analisis profitabilitas layanan

### **Operational Efficiency**
- **Automated Calculations**: Kalkulasi otomatis
- **Standardized Processes**: Proses yang terstandarisasi
- **Real-time Reporting**: Laporan real-time

### **Strategic Decision Making**
- **Data-driven Decisions**: Keputusan berdasarkan data
- **Performance Benchmarking**: Benchmarking kinerja
- **Resource Optimization**: Optimasi penggunaan sumber daya

---

## 📋 SYSTEM REQUIREMENTS

### **Minimum System Requirements**
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 100MB untuk aplikasi web
- **Internet**: Stable internet connection
- **Browser**: Modern browser dengan JavaScript enabled

### **Recommended Configuration**
- **RAM**: 8GB atau lebih
- **Storage**: SSD untuk performa optimal
- **Internet**: Broadband connection (10 Mbps+)
- **Browser**: Chrome atau Firefox terbaru

---

## 🔮 ROADMAP & FUTURE ENHANCEMENTS

### **Short Term (3-6 months)**
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Enhanced reporting features
- **API Integration**: Third-party system integration

### **Medium Term (6-12 months)**
- **AI/ML Features**: Predictive analytics
- **Advanced Workflows**: Complex business process automation
- **Multi-tenant Support**: Support multiple hospitals

### **Long Term (12+ months)**
- **Cloud Migration**: Full cloud-native architecture
- **Microservices**: Service-oriented architecture
- **Real-time Collaboration**: Multi-user real-time editing

---

## 📞 CONTACT & SUPPORT

### **Technical Support**
- **Email**: support@unitcostrs.com
- **Documentation**: Available in Modul Teknis
- **Training**: On-site training available

### **Development Team**
- **Lead Developer**: Available for technical consultation
- **Database Admin**: Database optimization and maintenance
- **UI/UX Designer**: User experience improvements

---

**Dokumentasi ini merupakan bagian dari Modul Teknis Aplikasi Unit Cost RS**

**Versi**: 1.0  
**Tanggal**: Januari 2025  
**Status**: Production Ready
