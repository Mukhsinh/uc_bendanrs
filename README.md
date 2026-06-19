# UC_Bendan

Aplikasi Unit Cost Rumah Sakit (Pintar UC) terintegrasi dengan Supabase.

## Fitur Utama
- Login Multi-Organisasi (Multi-Tenant)
- Manajemen Tahun Data (Default 2025)
- Salin Data Antar Tahun via Database RPC

## Setup Pengembangan
1. Install dependencies:
```bash
npm install
```

2. Konfigurasi Environment:
Copy file `.env.example` menjadi `.env` dan isi dengan kredensial Supabase Anda.

3. Jalankan aplikasi:
```bash
npm run dev
```

## Teknologi
- React + Vite
- TypeScript
- Supabase (Auth, Database, RLS)
- Tailwind CSS
