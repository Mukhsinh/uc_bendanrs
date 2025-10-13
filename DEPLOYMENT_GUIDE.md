# 🚀 Panduan Deployment Aplikasi Unit Cost RS ke Vercel

## 📋 Checklist Persiapan

Sebelum deployment, pastikan:
- ✅ Kode sudah di-commit dan push ke GitHub
- ✅ File `vercel.json` sudah ada
- ✅ File `env.example` sudah ada
- ✅ Supabase project sudah setup
- ✅ Database sudah di-setup dengan script `database-setup.sql`

## 🎯 Langkah-langkah Deployment

### 1. Persiapan di Cursor/VS Code

#### 1.1 Commit dan Push Kode
```bash
# Di terminal Cursor/VS Code
git status
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### 1.2 Pastikan File Konfigurasi Ada
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `package.json` - Script build
- ✅ `vite.config.ts` - Konfigurasi Vite
- ✅ `env.example` - Template environment variables

### 2. Login ke Vercel

#### 2.1 Buka Vercel
1. Buka browser dan kunjungi [vercel.com](https://vercel.com)
2. Klik tombol **"Sign up"** atau **"Log in"** di pojok kanan atas

#### 2.2 Login dengan GitHub
1. Pilih **"Continue with GitHub"**
2. Klik **"Authorize Vercel"** untuk memberikan akses
3. Tunggu proses authorization selesai

### 3. Import Project

#### 3.1 Buat Project Baru
1. Di dashboard Vercel, klik tombol **"New Project"**
2. Anda akan melihat daftar repository GitHub Anda

#### 3.2 Pilih Repository
1. Cari dan klik repository **"Aplikasi-Unit-Cost-RS"** (atau nama repository Anda)
2. Klik tombol **"Import"** di samping repository

### 4. Konfigurasi Project

#### 4.1 Project Settings
- **Project Name**: `aplikasi-unit-cost-rs` (atau sesuai keinginan)
- **Framework Preset**: `Vite` (otomatis terdeteksi)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (otomatis terdeteksi)
- **Output Directory**: `dist` (otomatis terdeteksi)

#### 4.2 Environment Variables
1. Scroll ke bagian **"Environment Variables"**
2. Klik **"Add"** untuk menambah variable baru

**Variable 1:**
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://your-project-id.supabase.co`
- **Environment**: `Production, Preview, Development` (pilih semua)

**Variable 2:**
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `your_supabase_anon_key_here`
- **Environment**: `Production, Preview, Development` (pilih semua)

3. Klik **"Save"** untuk setiap variable

### 5. Deploy

#### 5.1 Mulai Deploy
1. Setelah semua konfigurasi selesai, klik tombol **"Deploy"**
2. Tunggu proses build selesai (biasanya 2-3 menit)

#### 5.2 Monitor Build Process
- Anda akan melihat log build real-time
- Jika ada error, akan ditampilkan di console
- Build berhasil jika status menunjukkan "Ready"

### 6. Testing Deployment

#### 6.1 Akses Aplikasi
1. Setelah build selesai, Anda akan mendapat URL seperti: `https://aplikasi-unit-cost-rs.vercel.app`
2. Klik URL tersebut untuk membuka aplikasi

#### 6.2 Test Fitur Utama
1. **Test Login**: Coba login dengan user yang ada
2. **Test Navigation**: Pastikan semua menu sesuai role
3. **Test Access Control**: Pastikan role-based access berfungsi
4. **Test Responsive**: Test di berbagai ukuran layar

### 7. Setup Domain Custom (Optional)

#### 7.1 Tambah Domain
1. Di project dashboard, klik tab **"Settings"**
2. Scroll ke bagian **"Domains"**
3. Klik **"Add Domain"**

#### 7.2 Konfigurasi DNS
1. Masukkan domain Anda (contoh: `myapp.com`)
2. Follow instruksi untuk setup DNS records
3. Tunggu DNS propagation (bisa 24-48 jam)

## 🔄 Auto-Deployment Setup

### 8. Konfigurasi Auto-Deploy

#### 8.1 Git Integration
- Vercel otomatis terintegrasi dengan GitHub
- Setiap push ke branch `main` akan trigger deployment otomatis
- Pull request akan membuat preview deployment

#### 8.2 Branch Settings
1. Di project settings, klik **"Git"**
2. **Production Branch**: `main`
- **Preview Branches**: `develop`, `staging` (optional)

## 🐛 Troubleshooting

### Error: "Build Failed"

#### 9.1 Cek Build Logs
1. Di deployment page, klik tab **"Functions"** atau **"Build Logs"**
2. Scroll ke bawah untuk melihat error details
3. Common errors:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies

#### 9.2 Fix Common Issues
```bash
# Pastikan dependencies terinstall
npm install

# Fix TypeScript errors
npm run lint

# Test build lokal
npm run build
```

### Error: "Environment Variables Missing"

#### 9.3 Setup Environment Variables
1. Kembali ke project settings
2. Tambah environment variables yang missing
3. Redeploy aplikasi

### Error: "Supabase Connection Failed"

#### 9.4 Cek Supabase Config
1. Pastikan Supabase URL dan API key benar
2. Pastikan Supabase project aktif
3. Cek RLS policies di Supabase

## 📱 Monitoring & Analytics

### 10. Vercel Analytics

#### 10.1 Enable Analytics
1. Di project dashboard, klik **"Analytics"**
2. Enable **"Web Analytics"**
3. Monitor traffic dan performance

#### 10.2 Performance Monitoring
- **Core Web Vitals**: Monitor loading performance
- **Real User Monitoring**: Track user experience
- **Error Tracking**: Monitor JavaScript errors

## 🔐 Security Best Practices

### 11. Security Checklist

#### 11.1 Environment Variables
- ✅ Jangan commit `.env` files
- ✅ Gunakan Vercel environment variables
- ✅ Rotate API keys secara berkala

#### 11.2 Supabase Security
- ✅ Enable RLS (Row Level Security)
- ✅ Set proper CORS settings
- ✅ Monitor API usage

#### 11.3 Application Security
- ✅ Validasi input di frontend dan backend
- ✅ Implement proper error handling
- ✅ Regular security updates

## 📞 Support & Maintenance

### 12. Monitoring

#### 12.1 Vercel Dashboard
- Monitor deployments
- Track performance metrics
- View error logs

#### 12.2 Supabase Dashboard
- Monitor database performance
- Track API usage
- View auth logs

### 12.3 Regular Maintenance
- Update dependencies secara berkala
- Monitor error logs
- Backup database secara berkala
- Test aplikasi setelah update

## ✅ Deployment Checklist

- [ ] Kode sudah di-commit dan push ke GitHub
- [ ] Supabase project sudah setup
- [ ] Database sudah di-setup dengan script
- [ ] Environment variables sudah dikonfigurasi
- [ ] Build berhasil tanpa error
- [ ] Aplikasi bisa diakses via URL Vercel
- [ ] Login berfungsi dengan baik
- [ ] Role-based access control berfungsi
- [ ] Responsive design berfungsi di mobile
- [ ] Auto-deployment sudah dikonfigurasi
- [ ] Domain custom sudah di-setup (jika diperlukan)
- [ ] Analytics sudah di-enable
- [ ] Monitoring sudah dikonfigurasi

## 🎉 Selamat!

Aplikasi Anda sudah berhasil di-deploy ke Vercel! 

**Next Steps:**
1. Share URL aplikasi dengan tim
2. Setup monitoring dan alerts
3. Plan regular maintenance schedule
4. Consider setting up staging environment

**URL Aplikasi**: `https://your-project-name.vercel.app`

**Dashboard Vercel**: [vercel.com/dashboard](https://vercel.com/dashboard)

**Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
