# PANDUAN MANAJEMEN USER DAN ADMINISTRASI
## APLIKASI UNIT COST RUMAH SAKIT

**Sistem Pengelolaan Pengguna dan Administrasi**  
**Role-Based Access Control (RBAC)**

---

**Disusun oleh:**  
**MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC**

**Hak Cipta: 000831709**

---

## DAFTAR ISI

1. [PENDAHULUAN](#pendahuluan)
2. [OVERVIEW SISTEM MANAJEMEN USER](#overview-sistem-manajemen-user)
3. [STRUKTUR ROLE DAN PERMISSION](#struktur-role-dan-permission)
4. [PROSEDUR PENAMBAHAN USER](#prosedur-penambahan-user)
5. [MANAJEMEN ROLE DAN AKSES](#manajemen-role-dan-akses)
6. [ADMINISTRASI SISTEM](#administrasi-sistem)
7. [KEAMANAN DAN AUDIT](#keamanan-dan-audit)
8. [TROUBLESHOOTING](#troubleshooting)
9. [BEST PRACTICES](#best-practices)

---

## PENDAHULUAN

Sistem Manajemen User dan Administrasi pada Aplikasi Unit Cost Rumah Sakit dirancang untuk memberikan kontrol akses yang granular dan aman terhadap semua fitur dan data dalam sistem. Sistem ini mengimplementasikan Role-Based Access Control (RBAC) untuk memastikan setiap pengguna memiliki akses yang sesuai dengan tanggung jawab dan wewenangnya.

### **Tujuan Panduan:**
- Memberikan panduan lengkap untuk mengelola pengguna sistem
- Menjelaskan prosedur administrasi yang aman dan efisien
- Menyediakan referensi troubleshooting untuk masalah umum
- Menetapkan best practices untuk keamanan sistem

### **Sasaran Pengguna:**
- **Super Admin** - Pengelola penuh sistem
- **Admin** - Administrator sistem dengan akses terbatas
- **Operator** - Pengguna operasional dengan akses dasar

---

## OVERVIEW SISTEM MANAJEMEN USER

### **Arsitektur Sistem**

Sistem Manajemen User dibangun dengan arsitektur yang aman dan scalable:

#### **1. Komponen Utama:**
- **Authentication Layer** - Verifikasi identitas pengguna
- **Authorization Layer** - Kontrol akses berdasarkan role
- **User Management Layer** - Pengelolaan data pengguna
- **Audit Layer** - Pencatatan aktivitas pengguna

#### **2. Database Schema:**
```sql
-- Tabel utama untuk manajemen user
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
);

-- Tabel role
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Tabel user profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name VARCHAR(255),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true
);
```

#### **3. Flow Authentication:**
1. **Login** - User memasukkan email dan password
2. **Verification** - Sistem memverifikasi kredensial
3. **Role Assignment** - Sistem menetapkan role berdasarkan profil
4. **Permission Check** - Sistem memeriksa izin akses
5. **Session Creation** - Sistem membuat sesi pengguna

---

## STRUKTUR ROLE DAN PERMISSION

### **Hierarki Role:**

#### **1. Super Admin**
- **Akses Penuh** - Semua fitur dan data
- **User Management** - Kelola semua pengguna
- **System Configuration** - Konfigurasi sistem
- **Audit Access** - Akses log dan audit trail

#### **2. Admin**
- **Operational Access** - 13 menu operasional
- **Data Management** - Kelola data master dan transaksi
- **Reporting** - Akses laporan dan analisis
- **No User Management** - Tidak dapat kelola pengguna

#### **3. Operator**
- **Limited Access** - 7 menu terbatas
- **Data Entry** - Input data operasional
- **View Only** - Akses baca pada beberapa menu
- **No Administrative Access** - Tidak ada akses administrasi

### **Permission Matrix:**

| Fitur | Super Admin | Admin | Operator |
|-------|-------------|-------|----------|
| Dashboard | ✅ | ✅ | ✅ |
| Data Master | ✅ | ✅ | ❌ |
| Data Operasional | ✅ | ✅ | ❌ |
| Unit Penunjang | ✅ | ✅ | ✅ |
| Unit Keperawatan | ✅ | ✅ | ✅ |
| Unit Pelayanan | ✅ | ✅ | ✅ |
| Unit Diklat | ✅ | ✅ | ✅ |
| Manajemen Akses | ✅ | ❌ | ❌ |
| Modul Teknis | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ |

---

## PROSEDUR PENAMBAHAN USER

### **1. Persiapan Data User**

#### **Informasi yang Diperlukan:**
- **Email Address** - Alamat email yang valid dan unik
- **Full Name** - Nama lengkap pengguna
- **Role Assignment** - Role yang akan diberikan
- **Department** - Unit kerja atau departemen
- **Access Level** - Level akses yang diperlukan

#### **Validasi Data:**
```javascript
// Validasi email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Format email tidak valid');
}

// Validasi role assignment
const validRoles = ['Super Admin', 'Admin', 'Operator'];
if (!validRoles.includes(role)) {
  throw new Error('Role tidak valid');
}
```

### **2. Proses Penambahan User**

#### **Step 1: Akses User Management**
1. Login sebagai Super Admin
2. Navigate ke menu "Manajemen Akses"
3. Pilih tab "Kelola User"
4. Klik tombol "Tambah User Baru"

#### **Step 2: Input Data User**
```sql
-- Proses penambahan user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('user@example.com', crypt('password123', gen_salt('bf')), NOW());

-- Buat profil user
INSERT INTO user_profiles (id, full_name, role_id, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  'John Doe',
  (SELECT id FROM roles WHERE name = 'Admin'),
  true
);
```

#### **Step 3: Konfirmasi dan Aktivasi**
1. **Email Verification** - Kirim email konfirmasi
2. **Role Assignment** - Tetapkan role yang sesuai
3. **Permission Setup** - Konfigurasi izin akses
4. **Activation** - Aktifkan akun pengguna

### **3. Template Email Konfirmasi**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Konfirmasi Akun Baru</title>
</head>
<body>
    <h2>Selamat Datang di Aplikasi Unit Cost RS</h2>
    <p>Halo {{full_name}},</p>
    <p>Akun Anda telah berhasil dibuat dengan detail sebagai berikut:</p>
    <ul>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Role:</strong> {{role}}</li>
        <li><strong>Status:</strong> Aktif</li>
    </ul>
    <p>Silakan login menggunakan kredensial yang telah diberikan.</p>
    <p>Terima kasih.</p>
</body>
</html>
```

---

## MANAJEMEN ROLE DAN AKSES

### **1. Assignment Role**

#### **Prosedur Assignment:**
1. **Select User** - Pilih pengguna yang akan di-assign
2. **Choose Role** - Pilih role yang sesuai
3. **Validate Permission** - Pastikan role memiliki izin yang tepat
4. **Execute Assignment** - Jalankan assignment
5. **Audit Log** - Catat aktivitas assignment

#### **Code Implementation:**
```javascript
const assignRoleToUser = async (userId, roleId, assignedBy) => {
  try {
    // Validasi user dan role
    const user = await getUserById(userId);
    const role = await getRoleById(roleId);
    
    if (!user || !role) {
      throw new Error('User atau role tidak ditemukan');
    }
    
    // Update role assignment
    await updateUserRole(userId, roleId, assignedBy);
    
    // Log audit
    await logAudit({
      action: 'ROLE_ASSIGNMENT',
      userId: userId,
      roleId: roleId,
      assignedBy: assignedBy,
      timestamp: new Date()
    });
    
    return { success: true, message: 'Role berhasil di-assign' };
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};
```

### **2. Permission Management**

#### **Dynamic Permission Check:**
```sql
-- Function untuk mengecek permission user
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_permission_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.id = p_user_id 
      AND p.permission_name = p_permission_name
      AND up.is_active = TRUE
      AND r.is_active = TRUE
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;
```

### **3. Menu Access Control**

#### **Implementation:**
```javascript
const getMenuAccess = async (userId) => {
  const permissions = await getUserPermissions(userId);
  const availableMenus = [];
  
  // Define menu requirements
  const menuRequirements = {
    'dashboard': ['view_dashboard'],
    'data_master': ['manage_master_data'],
    'data_operasional': ['manage_operational_data'],
    'manajemen_akses': ['manage_users'],
    'modul_teknis': ['access_technical_modules']
  };
  
  // Check permissions for each menu
  Object.entries(menuRequirements).forEach(([menu, requiredPermissions]) => {
    const hasAccess = requiredPermissions.every(permission => 
      permissions.includes(permission)
    );
    
    if (hasAccess) {
      availableMenus.push(menu);
    }
  });
  
  return availableMenus;
};
```

---

## ADMINISTRASI SISTEM

### **1. User Monitoring**

#### **Dashboard Monitoring:**
```sql
-- Query untuk monitoring user aktif
SELECT 
  u.email,
  up.full_name,
  r.name as role_name,
  u.last_sign_in_at,
  up.is_active,
  COUNT(al.id) as login_count_today
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
LEFT JOIN audit_logs al ON u.id = al.user_id 
  AND DATE(al.created_at) = CURRENT_DATE
  AND al.action = 'LOGIN'
WHERE up.is_active = TRUE
GROUP BY u.id, u.email, up.full_name, r.name, u.last_sign_in_at, up.is_active
ORDER BY u.last_sign_in_at DESC;
```

#### **Key Metrics:**
- **Active Users** - Jumlah pengguna aktif
- **Login Frequency** - Frekuensi login harian
- **Role Distribution** - Distribusi role pengguna
- **Failed Attempts** - Upaya login gagal
- **Session Duration** - Durasi sesi rata-rata

### **2. System Health Check**

#### **Automated Health Check:**
```javascript
const systemHealthCheck = async () => {
  const healthStatus = {
    database: await checkDatabaseConnection(),
    authentication: await checkAuthService(),
    userManagement: await checkUserManagement(),
    permissions: await checkPermissionSystem(),
    audit: await checkAuditLogging()
  };
  
  const overallHealth = Object.values(healthStatus).every(status => status.healthy);
  
  return {
    overall: overallHealth ? 'HEALTHY' : 'UNHEALTHY',
    components: healthStatus,
    timestamp: new Date(),
    recommendations: generateRecommendations(healthStatus)
  };
};
```

### **3. Backup dan Recovery**

#### **User Data Backup:**
```sql
-- Backup script untuk data user
CREATE OR REPLACE FUNCTION backup_user_data()
RETURNS TEXT AS $$
DECLARE
  backup_file TEXT;
BEGIN
  backup_file := '/backups/user_data_' || TO_CHAR(NOW(), 'YYYY_MM_DD_HH24_MI_SS') || '.sql';
  
  -- Export user data
  COPY (
    SELECT 
      u.id,
      u.email,
      u.created_at,
      up.full_name,
      r.name as role_name,
      up.is_active
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.id
    LEFT JOIN roles r ON up.role_id = r.id
  ) TO backup_file WITH CSV HEADER;
  
  RETURN 'Backup completed: ' || backup_file;
END;
$$ LANGUAGE plpgsql;
```

---

## KEAMANAN DAN AUDIT

### **1. Security Measures**

#### **Password Policy:**
- **Minimum Length** - 8 karakter
- **Complexity** - Kombinasi huruf, angka, simbol
- **Expiration** - 90 hari
- **History** - Tidak boleh menggunakan 5 password terakhir

#### **Session Management:**
```javascript
const sessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: true, // HTTPS only
  httpOnly: true, // No client-side access
  sameSite: 'strict' // CSRF protection
};
```

#### **Two-Factor Authentication (2FA):**
```javascript
const enable2FA = async (userId) => {
  const secret = authenticator.generateSecret();
  const qrCode = await QRCode.toDataURL(
    authenticator.keyuri(user.email, 'Unit Cost RS', secret)
  );
  
  await updateUser2FASecret(userId, secret);
  
  return { secret, qrCode };
};
```

### **2. Audit Logging**

#### **Comprehensive Audit Trail:**
```sql
-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Critical Events to Log:**
- **Login/Logout** - Autentikasi pengguna
- **Role Changes** - Perubahan role
- **Permission Updates** - Update izin akses
- **Data Access** - Akses data sensitif
- **System Changes** - Perubahan konfigurasi

### **3. Security Monitoring**

#### **Real-time Monitoring:**
```javascript
const securityMonitor = {
  // Detect suspicious activity
  detectAnomalies: async () => {
    const suspiciousPatterns = [
      'multiple_failed_logins',
      'unusual_access_patterns',
      'privilege_escalation_attempts',
      'bulk_data_access'
    ];
    
    for (const pattern of suspiciousPatterns) {
      const alerts = await detectPattern(pattern);
      if (alerts.length > 0) {
        await sendSecurityAlert(alerts);
      }
    }
  },
  
  // Automated response
  respondToThreats: async (threat) => {
    switch (threat.level) {
      case 'HIGH':
        await lockUserAccount(threat.userId);
        await sendImmediateAlert(threat);
        break;
      case 'MEDIUM':
        await requireReauthentication(threat.userId);
        break;
      case 'LOW':
        await logThreat(threat);
        break;
    }
  }
};
```

---

## TROUBLESHOOTING

### **1. Common Issues**

#### **Login Problems:**

**Issue:** User tidak dapat login
```sql
-- Check user status
SELECT 
  u.email,
  up.is_active,
  r.name as role_name,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
WHERE u.email = 'user@example.com';
```

**Solutions:**
1. **Check Account Status** - Pastikan akun aktif
2. **Verify Email** - Pastikan email sudah terkonfirmasi
3. **Reset Password** - Reset password jika diperlukan
4. **Check Role Assignment** - Pastikan role sudah di-assign

#### **Permission Issues:**

**Issue:** User tidak dapat mengakses menu tertentu
```javascript
// Debug permission
const debugPermissions = async (userId) => {
  const user = await getUserWithRole(userId);
  const permissions = await getUserPermissions(userId);
  const menuAccess = await getMenuAccess(userId);
  
  return {
    user: user,
    role: user.role,
    permissions: permissions,
    menuAccess: menuAccess,
    issues: findPermissionIssues(user, permissions, menuAccess)
  };
};
```

### **2. Error Handling**

#### **Common Error Codes:**
- **AUTH_001** - Invalid credentials
- **AUTH_002** - Account locked
- **AUTH_003** - Email not confirmed
- **PERM_001** - Insufficient permissions
- **PERM_002** - Role not found
- **SYS_001** - Database connection error

#### **Error Response Format:**
```javascript
const errorResponse = {
  error: {
    code: 'AUTH_001',
    message: 'Invalid credentials provided',
    details: 'Email or password is incorrect',
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  }
};
```

### **3. Recovery Procedures**

#### **Account Recovery:**
1. **Identify Issue** - Diagnosa masalah
2. **Verify Identity** - Verifikasi identitas pengguna
3. **Apply Fix** - Terapkan solusi yang sesuai
4. **Test Access** - Test akses pengguna
5. **Document** - Dokumentasikan solusi

#### **Data Recovery:**
```sql
-- Restore user data from backup
CREATE OR REPLACE FUNCTION restore_user_data(backup_date DATE)
RETURNS TEXT AS $$
DECLARE
  restore_result TEXT;
BEGIN
  -- Restore from specific backup
  EXECUTE format('COPY user_profiles FROM ''/backups/user_data_%s.csv'' WITH CSV HEADER', 
                 TO_CHAR(backup_date, 'YYYY_MM_DD'));
  
  restore_result := 'User data restored from backup: ' || backup_date;
  RETURN restore_result;
END;
$$ LANGUAGE plpgsql;
```

---

## BEST PRACTICES

### **1. User Management**

#### **Account Lifecycle:**
1. **Onboarding** - Proses masuk pengguna baru
2. **Regular Review** - Review akses secara berkala
3. **Role Updates** - Update role sesuai kebutuhan
4. **Offboarding** - Proses keluar pengguna

#### **Security Guidelines:**
- **Principle of Least Privilege** - Berikan akses minimal yang diperlukan
- **Regular Audits** - Audit akses secara berkala
- **Strong Authentication** - Gunakan autentikasi yang kuat
- **Monitor Activity** - Monitor aktivitas pengguna

### **2. Administrative Procedures**

#### **Daily Tasks:**
- **Monitor Login Activity** - Pantau aktivitas login
- **Check System Health** - Cek kesehatan sistem
- **Review Audit Logs** - Review log audit
- **Backup Verification** - Verifikasi backup

#### **Weekly Tasks:**
- **User Access Review** - Review akses pengguna
- **Security Assessment** - Assessment keamanan
- **Performance Analysis** - Analisis performa
- **Update Documentation** - Update dokumentasi

#### **Monthly Tasks:**
- **Comprehensive Audit** - Audit menyeluruh
- **Security Training** - Pelatihan keamanan
- **System Updates** - Update sistem
- **Disaster Recovery Test** - Test recovery

### **3. Documentation Standards**

#### **Required Documentation:**
- **User Manual** - Panduan pengguna
- **Administrative Guide** - Panduan administrasi
- **Security Policy** - Kebijakan keamanan
- **Incident Response Plan** - Rencana respons insiden

#### **Documentation Maintenance:**
- **Version Control** - Kontrol versi dokumentasi
- **Regular Updates** - Update berkala
- **Review Process** - Proses review
- **Approval Workflow** - Workflow persetujuan

### **4. Monitoring and Alerting**

#### **Key Performance Indicators (KPIs):**
- **User Satisfaction** - Kepuasan pengguna
- **System Uptime** - Waktu aktif sistem
- **Response Time** - Waktu respons
- **Security Incidents** - Insiden keamanan

#### **Alerting Thresholds:**
```javascript
const alertingConfig = {
  login_failures: {
    threshold: 5,
    timeframe: '5 minutes',
    action: 'lock_account'
  },
  permission_denials: {
    threshold: 10,
    timeframe: '1 hour',
    action: 'security_review'
  },
  system_errors: {
    threshold: 3,
    timeframe: '10 minutes',
    action: 'immediate_alert'
  }
};
```

---

**Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang**
