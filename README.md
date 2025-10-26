# Aplikasi Unit Cost RS

Sistem komprehensif untuk menghitung unit cost berbagai layanan rumah sakit dengan fokus pada kalkulasi biaya gizi yang akurat dan terintegrasi.

## 🚀 Features

- **Kalkulasi Biaya Gizi**: Perhitungan unit cost untuk berbagai jenis makanan
- **Data Master**: Kelola data unit kerja, barang gizi, dan data dasar
- **Data Operasional**: Input data biaya operasional per unit kerja
- **Audit Trail**: Pencatatan lengkap semua aktivitas pengguna
- **Role-Based Access**: Sistem akses berdasarkan role pengguna
- **Real-time Calculation**: Perhitungan otomatis dengan trigger database
- **Export/Import**: Fitur export Excel dan import data massal
- **Responsive Design**: Interface yang responsif untuk berbagai device

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Business Logic](#business-logic)
- [Deployment](#deployment)
- [User Guide](#user-guide)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Installation

### Prerequisites
- Node.js v18.0.0+
- npm v8.0.0+
- Supabase account
- Modern browser (Chrome, Firefox, Safari, Edge)

### Setup
```bash
# Clone repository
git clone <repository-url>
cd Aplikasi-Unit-Cost-RS

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## 🚀 Quick Start

### 1. Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 2. First User Setup
1. Buka aplikasi di browser
2. Register user pertama sebagai Super Admin
3. Setup unit kerja dan data master
4. Input data biaya operasional
5. Mulai kalkulasi biaya gizi

### 3. Basic Workflow
1. **Setup Data Master**: Unit kerja, barang gizi
2. **Input Data Biaya**: Biaya operasional per unit
3. **Kalkulasi Biaya Gizi**: Setup dan hitung unit cost
4. **Input Bahan Porsi**: Detail bahan untuk setiap jenis makanan
5. **Generate Laporan**: Export dan analisis hasil

## 📚 Documentation

### Core Documentation
- **[Database Schema](DATABASE_SCHEMA.md)**: Dokumentasi lengkap skema database
- **[API Documentation](API_DOCUMENTATION.md)**: Referensi API endpoints dan functions
- **[Business Logic](BUSINESS_LOGIC.md)**: Aturan bisnis dan formula perhitungan
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Panduan deployment dan maintenance
- **[User Guide](USER_GUIDE.md)**: Panduan penggunaan untuk end user

### Technical Details
- **Database**: PostgreSQL dengan Supabase
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Authentication**: Supabase Auth
- **State Management**: React Hooks + Context
- **Data Validation**: Zod schemas
- **File Handling**: XLSX library

## 🔧 API Reference

### Core Endpoints
```typescript
// Audit Trail
GET /audit-trail?search=keyword&action=CREATE&page=1&limit=50

// Data Biaya
GET /data-biaya?tahun=2025&unit_kerja_id=uuid
POST /data-biaya
PUT /data-biaya/:id
DELETE /data-biaya/:id

// Kalkulasi Biaya Gizi
GET /kalkulasi-biaya-gizi?tahun=2025&jenis_makanan=Nasi
POST /kalkulasi-biaya-gizi
PUT /kalkulasi-biaya-gizi/:id

// Bahan Porsi
GET /bahan-porsi?kode=gz.001&jenis_makanan=Nasi
POST /bahan-porsi
PUT /bahan-porsi/:id
DELETE /bahan-porsi/:id
```

### RPC Functions
```sql
-- Get audit trail with emails
SELECT * FROM get_audit_trail_with_emails(
  search_term => 'keyword',
  action_filter => 'CREATE',
  table_filter => 'data_biaya',
  date_from => '2025-01-01',
  date_to => '2025-12-31',
  page_num => 1,
  page_size => 50
);

-- Get barang gizi for autocomplete
SELECT * FROM get_barang_gizi_for_autocomplete('beras');

-- Calculate biaya bahan porsi
SELECT calculate_biaya_bahan_porsi_numeric('gz.001', 'Nasi Putih');

-- Calculate all biaya columns
SELECT calculate_all_biaya_columns('gz.001', 'Nasi Putih');
```

## 🗄 Database Schema

### Core Tables
- **audit_trail**: Log aktivitas pengguna
- **data_biaya**: Data biaya operasional
- **unit_kerja**: Master unit kerja
- **kalkulasi_biaya_gizi**: Data kalkulasi biaya gizi
- **bahan_porsi**: Detail bahan porsi
- **data_barang_gizi**: Master barang gizi
- **distribusi_biaya_rekap**: Data distribusi biaya

### Key Features
- **Generated Columns**: Perhitungan otomatis
- **Triggers**: Update otomatis data
- **RLS Policies**: Keamanan data
- **Audit Trail**: Pencatatan semua perubahan
- **JSONB**: Data struktur kompleks

## 💼 Business Logic

### Calculation Formulas
```typescript
// Dasar Alokasi Waktu
dasar_alokasi_waktu = hasil_kali_waktu / total_hasil_kali_waktu_semua_baris

// Unit Cost Per Porsi
unit_cost_per_porsi = biaya_bahan_porsi_numeric + biaya_gaji_tunjangan + ... + biaya_tidak_langsung_terdistribusi

// Biaya dari Data Biaya
biaya_kolom = biaya_dari_data_biaya × (dasar_alokasi_waktu / jumlah)

// UC Gizi
uc_gizi_VVIP = jumlah × unit_cost_per_porsi (hanya untuk jenis_makanan yang mengandung 'VVIP')

// AUC Gizi
auc_gizi_VVIP = sum(tuc_gizi_VVIP) / sum(jumlah_VVIP)
```

### Business Rules
- Data biaya harus unik per tahun per unit kerja
- Kalkulasi biaya gizi harus memiliki kode yang valid
- Bahan porsi harus memiliki data barang gizi yang valid
- Audit trail tidak dapat diubah setelah dibuat

## 🚀 Deployment

### Production Deployment
```bash
# Build application
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Deploy to custom server
scp -r dist/* user@server:/var/www/html/
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Configuration
```sql
-- Enable RLS
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_biaya ENABLE ROW LEVEL SECURITY;
-- ... other tables

-- Create RLS policies
CREATE POLICY "Data biaya is viewable by everyone" ON data_biaya FOR SELECT USING (true);
CREATE POLICY "Data biaya is manageable by authenticated users" ON data_biaya FOR ALL USING (auth.role() = 'authenticated');
```

## 👥 User Guide

### Getting Started
1. **Login**: Masukkan email dan password
2. **Dashboard**: Lihat ringkasan data dan navigasi
3. **Setup Data Master**: Unit kerja, barang gizi
4. **Input Data Biaya**: Biaya operasional per unit
5. **Kalkulasi Biaya Gizi**: Setup dan hitung unit cost

### Key Features
- **Input Bahan Porsi**: Detail bahan untuk setiap jenis makanan
- **Edit/Delete Bahan Porsi**: Kelola data bahan porsi
- **Real-time Calculation**: Perhitungan otomatis
- **Export Data**: Download data ke Excel/CSV
- **Audit Trail**: Lihat log aktivitas pengguna

### Tips & Tricks
- Gunakan template Excel untuk input data massal
- Filter data untuk fokus pada data tertentu
- Backup data secara berkala
- Gunakan keyboard shortcuts untuk efisiensi

## 🔒 Security

### Authentication
- JWT token required for all operations
- Session management dengan auto refresh
- Role-based access control (RBAC)

### Data Protection
- Row Level Security (RLS) aktif
- Audit trail untuk semua operasi
- Encryption untuk data sensitif
- IP address dan user agent logging

### Best Practices
- Gunakan password yang kuat
- Logout setelah selesai menggunakan aplikasi
- Jangan berbagi akses dengan user lain
- Backup data secara berkala

## 📊 Performance

### Optimization
- Database indexes pada kolom yang sering diquery
- Generated columns untuk perhitungan kompleks
- Triggers untuk update otomatis
- Connection pooling untuk performa database

### Monitoring
- Query performance monitoring
- Error rate tracking
- Response time metrics
- User activity analytics

## 🐛 Troubleshooting

### Common Issues
- **Build Errors**: Clear cache dan reinstall dependencies
- **Database Connection**: Cek environment variables
- **Performance Issues**: Monitor query performance
- **Authentication**: Cek JWT token dan session

### Debug Mode
```bash
# Enable debug mode
DEBUG=true npm run dev

# Check database connection
npm run db:check

# Validate data
npm run validate
```

## 🤝 Contributing

### Development Setup
```bash
# Fork repository
git clone <your-fork-url>
cd Aplikasi-Unit-Cost-RS

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git commit -m "Add your feature"

# Push to fork
git push origin feature/your-feature

# Create pull request
```

### Code Standards
- TypeScript untuk type safety
- ESLint untuk code quality
- Prettier untuk code formatting
- Jest untuk testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

### Documentation
- [Database Schema](DATABASE_SCHEMA.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Business Logic](BUSINESS_LOGIC.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [User Guide](USER_GUIDE.md)

### Contact
- **Email**: support@unitcostrs.com
- **Documentation**: [docs.unitcostrs.com](https://docs.unitcostrs.com)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**Aplikasi Unit Cost RS v1.0**  
*Sistem kalkulasi unit cost rumah sakit yang komprehensif dan terintegrasi*

*Terakhir diperbarui: 24 Oktober 2025*