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


---

## Fitur Manajemen Akses

### Overview

Halaman Manajemen Akses menyediakan interface terpadu untuk mengelola tenant dan user dalam sistem multi-tenant. Fitur ini memungkinkan super admin untuk mengelola semua tenant, sementara tenant admin dapat mengelola user dalam tenant mereka sendiri.

### Akses Halaman

- **URL**: `/manajemen-akses`
- **Role yang Dapat Mengakses**: Super Admin, Admin

### Fitur Utama

#### 1. Kelola Tenant (Super Admin Only)

**Akses**: Hanya super admin (mukhsin9@gmail.com)

**Fitur**:
- Melihat daftar semua tenant dengan informasi:
  - Nama rumah sakit
  - Slug
  - Jumlah user
  - Status (aktif/nonaktif)
  - Tanggal dibuat
- Mencari tenant berdasarkan nama atau slug
- Filter tenant berdasarkan status
- Membuat tenant baru dengan admin pertama
- Mengaktifkan/menonaktifkan tenant
- Melihat daftar user dalam setiap tenant (expandable row)

**Cara Membuat Tenant Baru**:
1. Klik tombol "Tambah Tenant Baru"
2. Isi form:
   - Nama Rumah Sakit (required)
   - Slug (auto-generated, dapat diedit)
   - Email Admin (required)
   - Nama Admin (required)
   - Password Admin (required, minimal 8 karakter)
3. Klik "Buat Tenant"
4. Sistem akan membuat tenant baru beserta user admin pertama

#### 2. Kelola User

**Akses**: Super Admin dan Tenant Admin

**Fitur**:
- Melihat daftar user dengan informasi:
  - Email
  - Role
  - Status (aktif/nonaktif)
  - Tanggal dibuat
  - Login terakhir
- Mencari user berdasarkan email atau nama
- Filter user berdasarkan role
- Filter user berdasarkan status
- Membuat user baru
- Mengubah role user
- Mengaktifkan/menonaktifkan user

**Cara Membuat User Baru**:
1. Klik tombol "Tambah User"
2. Isi form:
   - Email (required)
   - Nama Lengkap (optional)
   - Password (required, minimal 8 karakter)
   - Role (required)
3. Klik "Buat User"
4. User baru akan otomatis terikat ke tenant yang sama dengan admin

### Tab Interface

Halaman menggunakan tab interface untuk memisahkan fungsi:

- **Super Admin**: Melihat 2 tab
  - "Kelola Tenant": Manajemen tenant
  - "Kelola User": Manajemen user
  
- **Tenant Admin**: Melihat 1 tab
  - "Kelola User": Manajemen user (hanya user dalam tenant sendiri)

### Fitur Keamanan

1. **Role-Based Access Control**
   - Super admin dapat mengakses semua tenant
   - Tenant admin hanya dapat mengakses user dalam tenant sendiri
   - Enforced di level UI dan database (RLS policies)

2. **Audit Logging**
   - Semua operasi tenant dicatat (creation, status changes)
   - Akses super admin ke data tenant dicatat
   - Log tersimpan di `tenant_audit_log` table

3. **Data Isolation**
   - User hanya dapat melihat data dalam tenant mereka
   - Super admin dapat melihat semua data dengan audit trail

### Optimasi Performa

1. **Debouncing**: Search input di-debounce 300ms untuk mengurangi API calls
2. **Caching**: React Query caching dengan staleTime 2-5 menit
3. **Optimistic Updates**: Status toggle langsung update UI, rollback jika error
4. **Memoization**: Component dan value memoization untuk mencegah re-renders

### Error Handling

- **Error Boundaries**: Mencegah crash seluruh aplikasi jika terjadi error
- **Loading States**: Spinner dan loading indicators saat data dimuat
- **Success Notifications**: Toast notification untuk operasi berhasil
- **Error Messages**: Pesan error yang jelas dan actionable

### Validasi Form

**Tenant Creation**:
- Nama: Minimal 3 karakter
- Slug: Format kebab-case, minimal 3 karakter
- Email: Format email valid
- Password: Minimal 8 karakter

**User Creation**:
- Email: Format email valid
- Password: Minimal 8 karakter
- Role: Harus dipilih dari daftar role yang tersedia

### Teknologi

- **Frontend**: React 18 + TypeScript
- **State Management**: TanStack React Query v5
- **UI Components**: Shadcn/ui (Radix UI)
- **Form Validation**: React Hook Form + Zod
- **Styling**: Tailwind CSS

### Testing

Fitur ini dilengkapi dengan comprehensive testing:
- **Unit Tests**: 50 test cases covering all components
- **Test Files**:
  - `src/test/components/TenantTable.test.tsx`
  - `src/test/components/SearchFilter.test.tsx`
  - `src/test/components/TenantUserList.test.tsx`
  - `src/test/components/CreateTenantDialog.test.tsx`
  - `src/test/pages/ManajemenAkses.test.tsx`

Run tests:
```bash
npm run test
```

### Troubleshooting

**Tidak bisa melihat tab "Kelola Tenant"**:
- Pastikan Anda login sebagai super admin (mukhsin9@gmail.com)
- Tenant admin tidak memiliki akses ke tab ini

**User baru tidak bisa login**:
- Pastikan user sudah diaktifkan (status aktif)
- Pastikan tenant dalam status aktif
- Cek password minimal 8 karakter

**Tenant tidak bisa dinonaktifkan**:
- Pastikan Anda memiliki permission yang sesuai
- Cek console untuk error messages

### Related Documentation

- `IMPLEMENTASI_UI_MANAJEMEN_AKSES_FINAL.md` - Dokumentasi teknis lengkap
- `.kiro/specs/tenant-user-management-ui/` - Spec documents (requirements, design, tasks)
