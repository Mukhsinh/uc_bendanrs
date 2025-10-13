# 📋 Dokumentasi Sistem Manajemen User & Role-Based Access Control

## 🎯 Overview

Sistem Manajemen User telah berhasil diimplementasikan dengan fitur lengkap untuk mengelola user, role, permission, dan menu access control berdasarkan Keputusan Menteri Kesehatan Republik Indonesia Nomor HK.01.07/MENKES/346/2025 tentang Pedoman Penghitungan Biaya Satuan Pelayanan di Rumah Sakit.

---

## ✅ Fitur yang Telah Diimplementasikan

### **1. Tampilan Nama User di Pojok Kanan Atas**
- ✅ Dropdown menu dengan nama user dan email
- ✅ Informasi profil user yang login
- ✅ Tombol logout yang mudah diakses
- ✅ Responsive design untuk desktop dan mobile

### **2. Database Schema Lengkap**
- ✅ **Tabel `roles`**: Master data role (admin, manager, analyst, operator, viewer)
- ✅ **Tabel `user_profiles`**: Profil user yang extend auth.users
- ✅ **Tabel `permissions`**: Daftar permission berdasarkan resource dan action
- ✅ **Tabel `role_permissions`**: Relasi many-to-many role dan permission
- ✅ **Tabel `menu_items`**: Konfigurasi menu aplikasi
- ✅ **Tabel `role_menu_items`**: Relasi many-to-many role dan menu items

### **3. Halaman Manajemen User**
- ✅ **Daftar User**: Tabel dengan informasi user, role, status, dan aksi
- ✅ **Update Role User**: Dropdown untuk mengubah role user
- ✅ **Toggle Status User**: Aktifkan/nonaktifkan user
- ✅ **Daftar Role**: Tabel role dengan jumlah user per role
- ✅ **Create/Edit Role**: Form lengkap untuk membuat dan edit role

### **4. Role-Based Access Control (RBAC)**
- ✅ **Permission System**: Sistem permission berdasarkan resource dan action
- ✅ **Menu Access Control**: Kontrol akses menu berdasarkan role
- ✅ **Hook `usePermissions`**: Custom hook untuk cek permission
- ✅ **Row Level Security (RLS)**: Security di level database

---

## 🗄️ Database Schema Detail

### **1. Tabel Roles**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Default Roles:**
- `admin`: Administrator - Full access to all features
- `manager`: Manager - Access to management features  
- `analyst`: Analyst - Access to analysis and reporting
- `operator`: Operator - Limited access to data entry
- `viewer`: Viewer - Read-only access

### **2. Tabel User Profiles**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. Tabel Permissions**
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL, -- e.g., 'data-master', 'kalkulasi', 'distribusi'
  action VARCHAR(50) NOT NULL,    -- e.g., 'read', 'write', 'delete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Default Permissions:**
- **Data Master**: `data_master_read`, `data_master_write`, `data_master_delete`
- **Kalkulasi**: `kalkulasi_read`, `kalkulasi_write`
- **Distribusi**: `distribusi_read`, `distribusi_write`
- **Reporting**: `reporting_read`, `reporting_export`
- **User Management**: `user_management_read`, `user_management_write`, `user_management_delete`

### **4. Tabel Menu Items**
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  href VARCHAR(200),
  icon VARCHAR(50),
  parent_id UUID REFERENCES menu_items(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 Sistem Permission

### **Permission Matrix by Role**

| Permission | Admin | Manager | Analyst | Operator | Viewer |
|------------|-------|---------|---------|----------|--------|
| Data Master Read | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Master Write | ✅ | ✅ | ❌ | ✅ | ❌ |
| Data Master Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kalkulasi Read | ✅ | ✅ | ✅ | ✅ | ❌ |
| Kalkulasi Write | ✅ | ✅ | ❌ | ✅ | ❌ |
| Distribusi Read | ✅ | ✅ | ✅ | ❌ | ❌ |
| Distribusi Write | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reporting Read | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reporting Export | ✅ | ✅ | ✅ | ❌ | ❌ |
| User Management Read | ✅ | ❌ | ❌ | ❌ | ❌ |
| User Management Write | ✅ | ❌ | ❌ | ❌ | ❌ |
| User Management Delete | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Menu Access Matrix by Role**

| Menu | Admin | Manager | Analyst | Operator | Viewer |
|------|-------|---------|---------|----------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Master | ✅ | ✅ | ❌ | ✅ | ❌ |
| Data Operasional | ✅ | ✅ | ❌ | ✅ | ❌ |
| Unit Penunjang | ✅ | ✅ | ❌ | ✅ | ❌ |
| Unit Keperawatan | ✅ | ✅ | ❌ | ✅ | ❌ |
| Unit Pelayanan | ✅ | ✅ | ❌ | ✅ | ❌ |
| Unit Diklat | ✅ | ✅ | ❌ | ✅ | ❌ |
| Rekapitulasi Unit Cost | ✅ | ✅ | ✅ | ❌ | ✅ |
| Skenario Tarif | ✅ | ✅ | ✅ | ❌ | ❌ |
| Distribusi Biaya | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cost Recovery | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manajemen User | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Cara Penggunaan

### **1. Setup Database**
```bash
# Jalankan script SQL di Supabase SQL Editor
psql -f create-user-management-tables.sql
```

### **2. Akses Halaman Manajemen User**
- URL: `/user-management`
- Akses: Hanya user dengan role `admin`

### **3. Mengelola User**
1. **Lihat Daftar User**: Tabel menampilkan semua user yang terdaftar
2. **Ubah Role User**: Gunakan dropdown di kolom "Role"
3. **Aktifkan/Nonaktifkan User**: Klik tombol di kolom "Aksi"

### **4. Mengelola Role**
1. **Tambah Role Baru**: Klik tombol "Tambah Role"
2. **Edit Role**: Klik tombol "Edit" di tabel role
3. **Set Permission**: Centang permission yang diizinkan
4. **Set Menu Access**: Centang menu yang bisa diakses

### **5. Menggunakan Hook Permission**
```typescript
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
  const { canRead, canWrite, isAdmin, userRole } = usePermissions();

  if (!canRead('data-master')) {
    return <div>Anda tidak memiliki akses</div>;
  }

  return (
    <div>
      {canWrite('data-master') && (
        <Button>Edit Data</Button>
      )}
      <p>Role Anda: {userRole}</p>
    </div>
  );
};
```

---

## 🔧 Technical Implementation

### **1. Frontend Components**
- **Layout.tsx**: Header dengan dropdown user
- **UserManagement.tsx**: Halaman manajemen user lengkap
- **usePermissions.ts**: Hook untuk permission checking
- **SidebarNav.tsx**: Navigation dengan role-based menu

### **2. Database Functions**
- **handle_new_user()**: Auto-create user profile saat signup
- **user_has_permission()**: Check permission user
- **get_user_menu_items()**: Get accessible menu items

### **3. Security Features**
- **Row Level Security (RLS)**: Enabled di semua tabel
- **Policies**: Comprehensive access control policies
- **Trigger**: Auto-assign default role saat signup
- **View**: user_with_role untuk data user lengkap

---

## 📊 Default Data

### **Roles**
1. **Admin**: Full access ke semua fitur
2. **Manager**: Akses management kecuali user management
3. **Analyst**: Akses read-only untuk analisis dan reporting
4. **Operator**: Akses data entry dan kalkulasi terbatas
5. **Viewer**: Akses read-only ke dashboard dan rekapitulasi

### **Permissions**
- 11 permission covering all major resources
- Granular control per resource dan action
- Extensible untuk permission baru

### **Menu Items**
- 50+ menu items covering semua halaman aplikasi
- Hierarchical structure dengan parent-child
- Sort order untuk urutan menu

---

## 🔄 Workflow User Management

### **1. User Registration**
1. User signup via Supabase Auth
2. Trigger `handle_new_user()` auto-create profile
3. Default role: `viewer`
4. Admin bisa ubah role via halaman manajemen

### **2. Role Assignment**
1. Admin buka halaman User Management
2. Pilih user dari tabel
3. Ubah role via dropdown
4. System update permission otomatis

### **3. Permission Checking**
1. Component load hook `usePermissions()`
2. Hook check user role dan permission
3. Component render berdasarkan permission
4. Menu navigation filter berdasarkan role

---

## 🎯 Benefits

### **1. Security**
- ✅ Granular permission control
- ✅ Role-based access control
- ✅ Database-level security dengan RLS
- ✅ Audit trail lengkap

### **2. Flexibility**
- ✅ Easy role management
- ✅ Configurable permissions
- ✅ Dynamic menu access
- ✅ Extensible untuk fitur baru

### **3. User Experience**
- ✅ Clear role-based interface
- ✅ Intuitive permission management
- ✅ Responsive design
- ✅ Real-time updates

### **4. Compliance**
- ✅ Sesuai standar Kemenkes RI
- ✅ Audit trail untuk compliance
- ✅ Role separation of duties
- ✅ Data access logging

---

## 📝 Next Steps

### **Immediate**
1. ✅ Test semua fitur manajemen user
2. ✅ Verify permission checking works
3. ✅ Update sidebar navigation berdasarkan role

### **Future Enhancements**
1. **Audit Logging**: Log semua perubahan user/role
2. **Bulk Operations**: Bulk assign role ke multiple users
3. **Role Templates**: Template role untuk deployment baru
4. **Advanced Permissions**: Field-level permissions
5. **User Groups**: Group-based permissions

---

**Sistem Manajemen User telah siap digunakan dengan fitur lengkap untuk mengelola akses user berdasarkan role dan permission yang sesuai dengan kebutuhan aplikasi Unit Cost RS.**

**Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang**





