# Aplikasi Unit Cost RS

Aplikasi untuk manajemen unit cost rumah sakit dengan sistem role-based access control (RBAC).

## 🚀 Fitur Utama

- **Dashboard**: Overview sistem dan statistik
- **Data Master**: Manajemen data master (unit kerja, barang, kamar, dll)
- **Data Operasional**: Data kegiatan, pendapatan, dan biaya
- **Unit Penunjang**: Kalkulasi biaya gizi, laboratorium, radiologi, BDRS
- **Unit Keperawatan**: Manajemen tindakan inap dan akomodasi
- **Unit Pelayanan**: Manajemen tindakan rawat jalan dan operatif
- **Unit Diklat**: Kalkulasi biaya diklat
- **Laporan**: Rekapitulasi, skenario tarif, distribusi biaya, dll
- **Manajemen Akses**: Role-based access control

## 🛡️ Role-Based Access Control

### Roles yang Tersedia:
- **Super Admin**: Akses penuh ke semua fitur (15 menus)
- **Admin**: Administrator dengan akses terbatas (13 menus)
- **Manager**: Akses laporan dan monitoring (7 menus)
- **Operator**: Operator dengan akses input data (5 menus)
- **Viewer**: Hanya dapat melihat data dan laporan (7 menus)
- **Operator Penunjang**: Akses terbatas ke Unit Penunjang (2 menus)
- **Operator Keperawatan**: Akses terbatas ke Unit Keperawatan (2 menus)
- **Operator Pelayanan**: Akses terbatas ke Unit Pelayanan (2 menus)

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React.js + TypeScript + Vite
- **UI Library**: Radix UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Charts**: Recharts
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm atau yarn
- Akun Supabase
- Akun Vercel (untuk deployment)

## 🔧 Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd aplikasi-unit-cost-rs
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp env.example .env.local
```

Edit `.env.local` dengan konfigurasi Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Setup Database

#### Option A: Setup Database Baru
1. Buat project baru di Supabase
2. Jalankan script setup database:
```bash
# Masuk ke SQL Editor di Supabase Dashboard
# Copy dan jalankan isi file: scripts/database-setup.sql
```

#### Option B: Migrasi dari Database Lama
```bash
# Set environment variables untuk migrasi
export FROM_PROJECT_ID=source_project_id
export TO_PROJECT_ID=target_project_id
export FROM_KEY=source_service_role_key
export TO_KEY=target_service_role_key

# Jalankan migrasi
npm run db:migrate
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`

## 🚀 Deployment ke Vercel

### Langkah-langkah Deployment:

#### 1. Persiapan di Cursor/VS Code
1. **Commit semua perubahan**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Pastikan file yang diperlukan sudah ada**:
   - ✅ `vercel.json` (konfigurasi Vercel)
   - ✅ `package.json` (dengan script `vercel-build`)
   - ✅ `vite.config.ts` (konfigurasi build)

#### 2. Login ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Klik **"Sign up"** atau **"Log in"**
3. Pilih **"Continue with GitHub"** (atau Git provider lainnya)
4. Authorize Vercel untuk mengakses repository Anda

#### 3. Import Project
1. Di dashboard Vercel, klik **"New Project"**
2. Pilih repository **"Aplikasi-Unit-Cost-RS"**
3. Klik **"Import"**

#### 4. Konfigurasi Project
1. **Project Name**: `aplikasi-unit-cost-rs` (atau sesuai keinginan)
2. **Framework Preset**: `Vite`
3. **Root Directory**: `./` (default)
4. **Build Command**: `npm run build` (otomatis terdeteksi)
5. **Output Directory**: `dist` (otomatis terdeteksi)

#### 5. Setup Environment Variables
1. Di bagian **"Environment Variables"**, klik **"Add"**
2. Tambahkan variables berikut:
   ```
   Name: VITE_SUPABASE_URL
   Value: https://your-project-id.supabase.co
   ```

   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: your_supabase_anon_key_here
   ```
3. Klik **"Save"** untuk setiap variable

#### 6. Deploy
1. Klik **"Deploy"**
2. Tunggu proses build selesai (biasanya 2-3 menit)
3. Setelah selesai, Anda akan mendapat URL aplikasi

#### 7. Setup Domain (Optional)
1. Di project dashboard, klik tab **"Settings"**
2. Scroll ke **"Domains"**
3. Klik **"Add Domain"**
4. Masukkan domain custom Anda
5. Follow instruksi untuk setup DNS

### 🔄 Auto-Deployment
Setelah setup pertama, setiap kali Anda push ke branch `main`, Vercel akan otomatis deploy aplikasi.

### 📱 Testing Deployment
1. Buka URL aplikasi yang diberikan Vercel
2. Test login dengan user yang ada
3. Test semua fitur sesuai role user
4. Pastikan tidak ada error di console

## 🗄️ Database Management

### Backup Database
```bash
npm run db:backup
```

### Migrasi Database
```bash
npm run db:migrate
```

### Reset Database (Development)
```sql
-- Di SQL Editor Supabase
SELECT reset_database_data();
```

### Verifikasi Setup Database
```sql
-- Di SQL Editor Supabase
SELECT * FROM verify_database_setup();
```

## 🔐 User Management

### Assign Role ke User
```sql
-- Di SQL Editor Supabase (login sebagai Super Admin)
SELECT assign_role_to_user('user-uuid-here', 'Admin');
```

### Lihat Semua User dengan Role
```sql
SELECT * FROM get_all_users_with_roles();
```

### Lihat Summary Role dan Menu Access
```sql
SELECT * FROM get_all_roles_menu_summary();
```

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- Pastikan Supabase URL dan API key benar
- Cek network connection
- Pastikan Supabase project aktif

### Error: "Invalid login credentials"
- Pastikan user sudah terdaftar di Supabase Auth
- Cek email dan password
- Pastikan user sudah di-assign role

### Error: "You don't have permission"
- Pastikan user memiliki role yang sesuai
- Cek role assignment di database
- Pastikan RLS policies aktif

### Build Error di Vercel
- Pastikan semua dependencies terinstall
- Cek TypeScript errors
- Pastikan environment variables sudah di-set

## 📞 Support

Jika mengalami masalah:
1. Cek console browser untuk error
2. Cek Supabase logs
3. Cek Vercel deployment logs
4. Pastikan semua environment variables sudah benar

## 📄 License

MIT License - lihat file LICENSE untuk detail.