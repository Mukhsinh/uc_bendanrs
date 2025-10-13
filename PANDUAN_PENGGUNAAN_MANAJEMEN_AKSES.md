# 📖 PANDUAN PENGGUNAAN MANAJEMEN AKSES

## 🎯 OVERVIEW

Panduan lengkap untuk menggunakan sistem manajemen akses di Aplikasi Unit Cost RS.

---

## 👤 LOGIN PERTAMA KALI

### **User Superadmin Pertama**

**Email:** `mukhsin9@gmail.com`  
**Role:** Super Admin  
**Status:** ✅ Active

Login menggunakan akun ini untuk pertama kali mengakses sistem manajemen akses.

---

## 🔐 AKSES HALAMAN MANAJEMEN AKSES

### **URL:** `/manajemen-akses`

### **Requirement:**
- ✅ Harus sudah login
- ✅ Harus memiliki role **Super Admin**

### **Yang Tidak Bisa Akses:**
- ❌ Admin
- ❌ Manager
- ❌ Operator
- ❌ Viewer

**Jika mencoba akses tanpa permission:** Akan muncul alert "Anda tidak memiliki akses ke halaman Manajemen Akses"

---

## 📝 CARA MEMBUAT USER BARU

### **Step-by-Step:**

1. **Login sebagai Super Admin**
   - Gunakan email & password superadmin

2. **Buka Menu Manajemen Akses**
   - Klik menu "Manajemen Akses" di sidebar
   - Atau akses langsung: `http://localhost:8080/manajemen-akses`

3. **Klik Tombol "Tambah User"**
   - Tombol berwarna biru di pojok kanan atas
   - Icon: UserPlus

4. **Isi Form:**
   ```
   Email: user@example.com
   Password: minimal 6 karakter
   Nama Lengkap: (opsional) Nama User
   Role: Pilih dari dropdown (default: Viewer)
   ```

5. **Klik "Buat User"**
   - Loading indicator akan muncul
   - Jika berhasil: Toast notification "User berhasil dibuat"
   - User baru akan muncul di tabel

### **Role Options:**
- **Super Admin** - Full access (hati-hati!)
- **Admin** - Administrator terbatas
- **Manager** - Laporan & monitoring
- **Operator** - Input data
- **Viewer** - Read-only (default)

### **Contoh:**

**Create Operator:**
```
Email: operator@hospital.com
Password: operator123
Nama: Operator RS
Role: Operator
```

**Create Manager:**
```
Email: manager@hospital.com
Password: manager123
Nama: Manager Keuangan
Role: Manager
```

---

## 🔄 CARA MENGUBAH ROLE USER

### **Step-by-Step:**

1. **Di Halaman Manajemen Akses**
   - Lihat tabel daftar user

2. **Klik Icon Edit (Pensil)**
   - Pada baris user yang ingin diubah

3. **Dialog Edit Akan Muncul**
   - Menampilkan current role
   - Dropdown untuk memilih role baru

4. **Pilih Role Baru**
   - Klik dropdown
   - Pilih role yang diinginkan

5. **Klik "Simpan"**
   - Loading indicator muncul
   - Role lama akan otomatis di-deactivate
   - Role baru akan di-assign
   - Toast notification muncul

### **Contoh Use Case:**

**Promote Operator menjadi Manager:**
1. Find operator@hospital.com di tabel
2. Klik icon Edit
3. Pilih role "Manager"
4. Klik Simpan
5. ✅ User sekarang Manager

---

## 👁️ CARA MELIHAT DETAIL USER & PERMISSIONS

### **Step-by-Step:**

1. **Di Halaman Manajemen Akses**

2. **Klik Icon Eye (Mata)**
   - Pada baris user yang ingin dilihat

3. **Dialog Detail Akan Muncul dengan Info:**
   - **Email:** Email user
   - **Role:** Badge role dengan warna
   - **Role Description:** Deskripsi role
   - **Permissions:** List lengkap permissions
   - **Assigned At:** Tanggal role di-assign
   - **Assigned By:** Email user yang assign role

4. **Review Permissions**
   - Setiap permission ditampilkan dengan:
     - Permission name
     - Permission type (badge)

5. **Klik "Tutup"** untuk keluar

---

## 🗑️ CARA MENONAKTIFKAN USER

### **Step-by-Step:**

1. **Di Halaman Manajemen Akses**

2. **Klik Icon Trash (Tong Sampah Merah)**
   - Pada baris user yang ingin dinonaktifkan
   - **Note:** Icon tidak muncul untuk:
     - User yang sudah inactive
     - Current logged-in user (tidak bisa deactivate diri sendiri)

3. **Confirmation Dialog**
   - "Apakah Anda yakin ingin menonaktifkan user [email]?"

4. **Klik OK untuk Konfirmasi**
   - Loading indicator muncul
   - Semua role user akan di-deactivate
   - User tidak bisa login lagi
   - Toast notification muncul

### **Note Penting:**
- ⚠️ Hanya **Superadmin** yang bisa deactivate user
- ⚠️ Tidak bisa deactivate diri sendiri
- ⚠️ Soft delete (data tidak hilang, hanya status)

---

## 🎨 UI COMPONENTS

### **Tabel User:**

| Kolom | Deskripsi |
|-------|-----------|
| Email | Email user |
| Role | Badge warna-warni sesuai role |
| Status | Active (hijau) / Inactive (merah) |
| Tanggal Dibuat | Format Indonesia |
| Last Sign In | Terakhir login |
| Assigned By | Email yang assign role |
| Aksi | 3 icon buttons (Eye, Edit, Trash) |

### **Badge Colors:**

- 🟣 **Super Admin** - Purple (default variant)
- 🔵 **Admin** - Blue (secondary variant)
- 🟢 **Manager** - Green (outline)
- 🟠 **Operator** - Orange (outline)
- ⚫ **Viewer** - Gray (outline)

### **Status Badge:**

- 🟢 **Active** - Green background
- 🔴 **Inactive** - Red background

---

## 🔧 API USAGE (Frontend)

### **Import:**

```tsx
import userManagement from '@/lib/userManagement';
```

### **Check if Superadmin:**

```tsx
const isSuperadmin = await userManagement.isSuperadmin();
if (isSuperadmin) {
  // Show admin features
}
```

### **Check Permission:**

```tsx
const canEdit = await userManagement.checkPermission('data_master', 'write');
if (canEdit) {
  // Show edit button
}
```

### **Get Current User Role:**

```tsx
const role = await userManagement.getUserRole();
console.log('Current role:', role);
```

### **Create User:**

```tsx
const result = await userManagement.createUserWithRole(
  'newuser@example.com',
  'password123',
  'Operator',
  'New Operator Name'
);

if (result.success) {
  toast.success(result.message);
} else {
  toast.error(result.message);
}
```

### **Fetch All Users:**

```tsx
const users = await userManagement.getAllUsers();
setUsers(users);
```

### **Assign Role:**

```tsx
const result = await userManagement.assignRoleToUser(
  userId,
  'Manager'
);
```

### **Deactivate User:**

```tsx
const result = await userManagement.deactivateUser(userId);
```

---

## 🚦 PERMISSION MATRIX

### **Menu Access:**

| Menu | Super Admin | Admin | Manager | Operator | Viewer |
|------|-------------|-------|---------|----------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Master | ✅ | ✅ | ✅ | ✅ | ❌ |
| Data Operasional | ✅ | ✅ | ✅ | ✅ | ❌ |
| Unit Penunjang | ✅ | ✅ | ✅ | ✅ | ❌ |
| Unit Keperawatan | ✅ | ✅ | ✅ | ✅ | ❌ |
| Unit Pelayanan | ✅ | ✅ | ✅ | ✅ | ❌ |
| Kalkulasi | ✅ | ✅ | ✅ | ✅ | ❌ |
| Rekapitulasi | ✅ | ✅ | ✅ | ❌ | ✅ |
| Skenario Tarif | ✅ | ✅ | ✅ | ❌ | ❌ |
| Distribusi Biaya | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cost Recovery | ✅ | ✅ | ✅ | ❌ | ✅ |
| Budgeting BHP | ✅ | ✅ | ✅ | ❌ | ❌ |
| Produk Layanan | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Manajemen Akses** | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Actions:**

| Action | Super Admin | Admin | Manager | Operator | Viewer |
|--------|-------------|-------|---------|----------|--------|
| View Data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add Data | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Data | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Data | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🛡️ SECURITY TIPS

### **Password Best Practices:**

✅ **DO:**
- Gunakan minimal 6 karakter
- Kombinasi huruf besar dan kecil
- Tambahkan angka
- Tambahkan symbol (!@#$%^&*)
- Unique password per user

❌ **DON'T:**
- Jangan gunakan password yang mudah ditebak
- Jangan share password
- Jangan gunakan password yang sama untuk multiple accounts

### **Role Assignment Best Practices:**

✅ **DO:**
- Assign role sesuai job description
- Review permissions secara berkala
- Deactivate user yang sudah tidak bekerja
- Keep audit trail of role changes

❌ **DON'T:**
- Jangan assign Super Admin ke semua orang
- Jangan lupa deactivate user lama
- Jangan share superadmin access

### **Superadmin Guidelines:**

⚠️ **IMPORTANT:**
- Hanya assign Super Admin ke 1-2 orang trusted
- Superadmin bisa akses dan edit SEMUA data
- Superadmin bisa manage semua user
- Keep superadmin credentials sangat aman

---

## 🔍 TROUBLESHOOTING

### **Problem: Tidak bisa login**

**Solution:**
1. Check email & password
2. Check apakah user sudah terdaftar
3. Check apakah role user active
4. Contact superadmin

### **Problem: Tidak bisa akses Manajemen Akses**

**Solution:**
1. Check role - harus Super Admin
2. Logout dan login kembali
3. Contact superadmin untuk upgrade role

### **Problem: Error saat create user**

**Possible Causes:**
- Email sudah terdaftar
- Password terlalu pendek (< 6 karakter)
- Network error
- Database error

**Solution:**
- Check email di tabel users
- Gunakan password lebih panjang
- Check connection
- Check console logs

### **Problem: Permission denied saat assign role**

**Solution:**
- Hanya Superadmin dan Admin yang bisa assign role
- Check role current user
- Refresh page dan coba lagi

---

## 📊 MONITORING

### **Check User Activity:**

```sql
-- View all users with roles
SELECT * FROM users_with_roles;

-- Check specific user
SELECT * FROM users_with_roles WHERE email = 'user@example.com';

-- Count users per role
SELECT role_name, COUNT(*) as total_users
FROM users_with_roles
GROUP BY role_name
ORDER BY total_users DESC;
```

### **Check Permissions:**

```sql
-- Get all permissions for Super Admin
SELECT * 
FROM role_permissions rp
JOIN role_akses_aplikasi r ON rp.role_id = r.id
WHERE r.role_name = 'Super Admin';

-- Check specific user permissions
SELECT * FROM public.get_user_permissions('user_id_uuid');
```

### **Audit Trail:**

```sql
-- Check who assigned what role to whom
SELECT 
  u1.email as assigned_to,
  u2.email as assigned_by,
  r.role_name,
  ur.assigned_at
FROM user_roles ur
JOIN auth.users u1 ON ur.user_id = u1.id
JOIN auth.users u2 ON ur.assigned_by = u2.id
JOIN role_akses_aplikasi r ON ur.role_id = r.id
WHERE ur.is_active = true
ORDER BY ur.assigned_at DESC;
```

---

## 🎓 TRAINING USERS

### **Untuk Superadmin:**

**Topics:**
1. Cara create user
2. Cara assign role
3. Cara deactivate user
4. Security best practices
5. Monitoring & audit

**Duration:** 30 menit

### **Untuk Admin:**

**Topics:**
1. Cara menggunakan aplikasi
2. Permission yang dimiliki
3. Cara report issues

**Duration:** 15 menit

### **Untuk User Biasa:**

**Topics:**
1. Login & logout
2. Navigasi menu
3. Input data
4. View reports
5. Understand limitations

**Duration:** 45 menit

---

## 📋 CHECKLIST DEPLOYMENT

### **Pre-Deployment:**

- ✅ Database migrations completed
- ✅ RLS policies applied (54 tables)
- ✅ Helper functions created (8 functions)
- ✅ Frontend page created
- ✅ First superadmin assigned
- ✅ Testing completed
- ✅ Documentation created

### **Deployment:**

- ⬜ Backup database
- ⬜ Deploy to production
- ⬜ Verify superadmin login
- ⬜ Create initial admin users
- ⬜ Test permissions
- ⬜ Monitor for errors

### **Post-Deployment:**

- ⬜ Train superadmin
- ⬜ Create admin users (2-3 orang)
- ⬜ Create manager users
- ⬜ Create operator users
- ⬜ Document all credentials (securely!)
- ⬜ Setup backup & recovery plan
- ⬜ Setup monitoring alerts

---

## 🎯 RECOMMENDED SETUP

### **Small Hospital (< 100 staff):**

**Users:**
- 1 Super Admin
- 2 Admin
- 3 Manager
- 10 Operator
- 50+ Viewer

### **Medium Hospital (100-300 staff):**

**Users:**
- 1-2 Super Admin
- 3-5 Admin
- 5-10 Manager
- 20-50 Operator
- 100+ Viewer

### **Large Hospital (> 300 staff):**

**Users:**
- 2 Super Admin
- 5-10 Admin
- 10-20 Manager
- 50-100 Operator
- 200+ Viewer

---

## 📞 SUPPORT

### **Questions?**

**Contact:**
- Email: support@hospital.com
- Phone: (021) xxxx-xxxx
- Telegram: @hospital_support

### **Emergency:**

Jika superadmin lupa password atau terkunci:
1. Contact database administrator
2. Reset via SQL direct:
```sql
-- Reset password via SQL (last resort)
-- Contact DBA for assistance
```

---

## ✅ SUMMARY

**Sistem Manajemen Akses sudah SIAP DIGUNAKAN!**

**Next Steps:**
1. ✅ Login sebagai superadmin (mukhsin9@gmail.com)
2. ⬜ Create admin users (2-3 orang)
3. ⬜ Create manager users sesuai kebutuhan
4. ⬜ Create operator users untuk data entry
5. ⬜ Train all users
6. ⬜ Start using the system

**Happy Managing! 🎉**

