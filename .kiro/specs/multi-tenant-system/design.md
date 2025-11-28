# Design Document - Sistem Multi-Tenant untuk Aplikasi Unit Cost RS

## Overview

Dokumen ini menjelaskan desain teknis untuk transformasi aplikasi Unit Cost RS dari sistem single-tenant menjadi multi-tenant. Transformasi ini memungkinkan banyak rumah sakit menggunakan satu instance aplikasi dengan data yang terisolasi sepenuhnya.

### Tujuan Desain

1. **Isolasi Data**: Memastikan data setiap tenant tidak dapat diakses oleh tenant lain
2. **Skalabilitas**: Mendukung penambahan tenant baru tanpa perubahan infrastruktur
3. **Performa**: Menjaga performa query dengan indexing yang tepat
4. **Keamanan**: Menggunakan Row Level Security (RLS) sebagai defense-in-depth
5. **Backward Compatibility**: Migrasi data existing tanpa data loss

### Strategi Multi-Tenant

Kami menggunakan **shared database, shared schema** approach dengan tenant isolation melalui:
- Kolom `tenant_id` di setiap tabel
- Row Level Security (RLS) policies di level database
- Tenant context injection di application layer
- Index optimization untuk performa query

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  (Web Browser, Mobile App, Desktop App)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Auth Layer                        │
│  - JWT dengan tenant_id claim                               │
│  - Session management                                        │
│  - User authentication                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer (React)                   │
│  - Tenant context provider                                   │
│  - API calls dengan tenant filtering                         │
│  - UI tenant branding                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgREST API Layer                       │
│  - Auto-generated REST API                                   │
│  - RLS policy enforcement                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  RLS Policies (280+ policies)                        │   │
│  │  - Tenant isolation                                   │   │
│  │  - Role-based access                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables (77 tables)                                   │   │
│  │  - All with tenant_id column                          │   │
│  │  - Foreign key to tenants table                       │   │
│  │  - Indexed for performance                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Functions (285 functions)                            │   │
│  │  - Tenant-aware calculations                          │   │
│  │  - Security definer functions                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Triggers (248 triggers)                              │   │
│  │  - Auto-populate tenant_id                            │   │
│  │  - Tenant consistency validation                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Isolation Strategy

**Database Level:**
- Setiap tabel memiliki kolom `tenant_id UUID NOT NULL`
- Foreign key constraint ke tabel `tenants(id)`
- RLS policies memfilter semua query berdasarkan `tenant_id`
- Index pada `tenant_id` untuk performa optimal

**Application Level:**
- Tenant context disimpan dalam JWT claims
- React Context API untuk tenant state management
- Automatic tenant_id injection pada semua API calls
- Tenant branding (logo, nama) di UI

**API Level:**
- PostgREST automatically enforces RLS policies
- JWT validation dengan tenant_id extraction
- Service role bypass untuk admin operations

## Components and Interfaces

### 1. Database Schema Components

#### Tabel Tenants (Baru)

```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_is_active ON public.tenants(is_active);
```

#### Tabel Tenant Settings (Baru)

```sql
CREATE TABLE public.tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Preferensi Biaya
  include_jasa_pelayanan BOOLEAN DEFAULT true,
  default_allocation_method TEXT DEFAULT 'double_distribution',
  
  -- Konfigurasi Kalkulasi
  calculation_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Branding
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabel Tenant Audit Log (Baru)

```sql
CREATE TABLE public.tenant_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_id ON public.tenant_audit_log(tenant_id);
CREATE INDEX idx_audit_user_id ON public.tenant_audit_log(user_id);
CREATE INDEX idx_audit_created_at ON public.tenant_audit_log(created_at);
```

#### Modifikasi Tabel Users

```sql
-- Supabase Auth tidak allow direct schema modification
-- Kita gunakan raw_app_meta_data untuk menyimpan tenant_id

-- Buat view untuk kemudahan akses
CREATE OR REPLACE VIEW public.user_tenants AS
SELECT 
  id as user_id,
  email,
  raw_app_meta_data->>'tenant_id' as tenant_id,
  raw_app_meta_data->>'role' as role,
  is_super_admin
FROM auth.users;

-- Buat table untuk extended user info
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
```

#### Modifikasi Tabel Existing

Semua 77 tabel existing akan ditambahkan kolom tenant_id:

```sql
-- Template untuk setiap tabel
ALTER TABLE <table_name> 
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Set NOT NULL setelah data migration
ALTER TABLE <table_name> 
  ALTER COLUMN tenant_id SET NOT NULL;

-- Tambah index untuk performa
CREATE INDEX idx_<table_name>_tenant_id ON <table_name>(tenant_id);

-- Tambah composite index untuk foreign keys
CREATE INDEX idx_<table_name>_tenant_fk 
  ON <table_name>(tenant_id, <foreign_key_column>);
```

### 2. Row Level Security Policies

#### RLS Policy Pattern

Semua tabel akan menggunakan pattern RLS berikut:

```sql
-- Enable RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT
CREATE POLICY "tenant_isolation_select" ON <table_name>
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id'
    )::uuid
  );

-- Policy untuk INSERT
CREATE POLICY "tenant_isolation_insert" ON <table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (
      SELECT (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id'
    )::uuid
  );

-- Policy untuk UPDATE
CREATE POLICY "tenant_isolation_update" ON <table_name>
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (
      SELECT (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id'
    )::uuid
  )
  WITH CHECK (
    tenant_id = (
      SELECT (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id'
    )::uuid
  );

-- Policy untuk DELETE
CREATE POLICY "tenant_isolation_delete" ON <table_name>
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (
      SELECT (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id'
    )::uuid
  );

-- Policy untuk Super Admin (bypass tenant isolation)
CREATE POLICY "super_admin_all" ON <table_name>
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'super_admin'
  );
```

#### Helper Functions untuk RLS

```sql
-- Function untuk extract tenant_id dari JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    (auth.jwt()->>'app_metadata')::jsonb->>'tenant_id'
  )::uuid;
$$;

-- Function untuk check super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'super_admin',
    false
  );
$$;

-- Function untuk validate tenant access
CREATE OR REPLACE FUNCTION public.has_tenant_access(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    public.get_tenant_id() = check_tenant_id
    OR public.is_super_admin()
  );
$$;
```

### 3. Database Functions Update

Semua 285 functions existing perlu diupdate untuk tenant-aware:

**Pattern 1: Functions yang query data**
```sql
-- Before
CREATE FUNCTION calculate_total_cost(unit_id INT)
RETURNS NUMERIC AS $$
  SELECT SUM(amount) FROM biaya WHERE unit_kerja_id = unit_id;
$$ LANGUAGE SQL;

-- After (tenant-aware)
CREATE FUNCTION calculate_total_cost(unit_id INT)
RETURNS NUMERIC AS $$
  SELECT SUM(amount) 
  FROM biaya 
  WHERE unit_kerja_id = unit_id
    AND tenant_id = public.get_tenant_id();
$$ LANGUAGE SQL SECURITY DEFINER;
```

**Pattern 2: Functions yang insert/update data**
```sql
-- Before
CREATE FUNCTION create_unit_kerja(p_name TEXT)
RETURNS INT AS $$
  INSERT INTO unit_kerja (name) VALUES (p_name) RETURNING id;
$$ LANGUAGE SQL;

-- After (tenant-aware)
CREATE FUNCTION create_unit_kerja(p_name TEXT)
RETURNS INT AS $$
  INSERT INTO unit_kerja (name, tenant_id) 
  VALUES (p_name, public.get_tenant_id()) 
  RETURNING id;
$$ LANGUAGE SQL SECURITY DEFINER;
```

### 4. Triggers Update

Semua 248 triggers perlu diupdate untuk tenant consistency:

```sql
-- Trigger untuk auto-populate tenant_id
CREATE OR REPLACE FUNCTION trigger_set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_tenant_id();
  END IF;
  
  -- Validate tenant_id matches current user's tenant
  IF NEW.tenant_id != public.get_tenant_id() AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Cannot set tenant_id to different tenant';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger ke semua tabel
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON <table_name>
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_tenant_id();
```

### 5. Application Layer Components

#### TenantContext (React Context)

```typescript
// src/contexts/TenantContext.tsx
interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: Error | null;
  refreshTenant: () => Promise<void>;
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTenant();
    }
  }, [user]);

  const loadTenant = async () => {
    const tenantId = user?.app_metadata?.tenant_id;
    if (!tenantId) return;

    const { data, error } = await supabase
      .from('tenants')
      .select('*, tenant_settings(*)')
      .eq('id', tenantId)
      .single();

    if (data) setTenant(data);
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, error, refreshTenant: loadTenant }}>
      {children}
    </TenantContext.Provider>
  );
};
```

#### Supabase Client Wrapper

```typescript
// src/lib/supabaseClient.ts
export const createTenantAwareClient = () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Intercept all queries to add tenant context
  const originalFrom = client.from.bind(client);
  client.from = (table: string) => {
    const query = originalFrom(table);
    // RLS akan handle filtering, tapi kita bisa add explicit filter untuk performa
    return query;
  };

  return client;
};
```

#### Tenant Branding Component

```typescript
// src/components/TenantBranding.tsx
export const TenantBranding: React.FC = () => {
  const { tenant } = useTenant();

  useEffect(() => {
    if (tenant) {
      // Apply tenant colors
      document.documentElement.style.setProperty('--primary-color', tenant.settings.primary_color);
      document.documentElement.style.setProperty('--secondary-color', tenant.settings.secondary_color);
    }
  }, [tenant]);

  return (
    <div className="tenant-branding">
      {tenant?.logo_url && <img src={tenant.logo_url} alt={tenant.name} />}
      <span>{tenant?.name}</span>
    </div>
  );
};
```

### 6. Authentication Flow

#### Login Flow dengan Tenant Detection

```typescript
// src/lib/authService.ts
export const loginWithTenant = async (email: string, password: string) => {
  // 1. Login user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. Check tenant_id in app_metadata
  const tenantId = authData.user?.app_metadata?.tenant_id;
  
  if (!tenantId) {
    // User tidak memiliki tenant, logout dan error
    await supabase.auth.signOut();
    throw new Error('User tidak terdaftar di tenant manapun');
  }

  // 3. Load tenant data
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant.is_active) {
    await supabase.auth.signOut();
    throw new Error('Tenant tidak aktif atau tidak ditemukan');
  }

  return { user: authData.user, tenant };
};
```

### 7. Tenant Onboarding Service

```typescript
// src/services/tenantOnboarding.ts
export const createTenant = async (params: {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}) => {
  // Gunakan service role key untuk bypass RLS
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Create tenant
    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .insert({
        name: params.name,
        slug: params.slug,
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 2. Create tenant settings
    await adminClient
      .from('tenant_settings')
      .insert({
        tenant_id: tenant.id,
      });

    // 3. Create admin user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: params.adminEmail,
      password: params.adminPassword,
      email_confirm: true,
      app_metadata: {
        tenant_id: tenant.id,
        role: 'admin',
      },
    });

    if (authError) throw authError;

    // 4. Create user profile
    await adminClient
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenant.id,
        full_name: params.adminName,
      });

    // 5. Initialize default data (unit kerja, etc)
    await initializeDefaultData(adminClient, tenant.id);

    return { tenant, user: authData.user };
  } catch (error) {
    // Rollback akan handled by database constraints (ON DELETE CASCADE)
    throw error;
  }
};

const initializeDefaultData = async (client: SupabaseClient, tenantId: string) => {
  // Insert default unit kerja
  const defaultUnits = [
    { name: 'Administrasi', jenis: 'non_produksi', tenant_id: tenantId },
    { name: 'Rawat Jalan', jenis: 'produksi', tenant_id: tenantId },
    { name: 'Rawat Inap', jenis: 'produksi', tenant_id: tenantId },
  ];

  await client.from('unit_kerja').insert(defaultUnits);
};
```

## Data Models

### Tenant Model

```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settings?: TenantSettings;
}

interface TenantSettings {
  tenant_id: string;
  include_jasa_pelayanan: boolean;
  default_allocation_method: string;
  calculation_preferences: Record<string, any>;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}
```

### User Model (Extended)

```typescript
interface UserProfile {
  user_id: string;
  tenant_id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserWithTenant extends User {
  app_metadata: {
    tenant_id: string;
    role: 'super_admin' | 'admin' | 'manager' | 'user' | 'guest';
  };
  profile?: UserProfile;
  tenant?: Tenant;
}
```

### Migration Data Model

```typescript
interface MigrationPlan {
  existing_users: Array<{
    user_id: string;
    email: string;
    assigned_tenant_id: string;
  }>;
  tables_to_migrate: Array<{
    table_name: string;
    row_count: number;
    has_user_id: boolean;
  }>;
  estimated_duration_minutes: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tenant Creation Completeness
*For any* valid tenant creation request, the system should create a tenant record with a unique tenant_id, name, and all required metadata fields populated
**Validates: Requirements 1.1**

### Property 2: Admin User Creation on Tenant Onboarding
*For any* newly created tenant, the system should automatically create an associated admin user with proper credentials and tenant_id linkage
**Validates: Requirements 1.2**

### Property 3: Default Data Initialization
*For any* newly created tenant, the system should initialize default master data (unit kerja, settings) specific to that tenant
**Validates: Requirements 1.3**

### Property 4: RLS Policy Activation
*For any* newly created tenant, all relevant RLS policies should be active and enforcing tenant isolation
**Validates: Requirements 1.4**

### Property 5: Tenant Onboarding Atomicity
*For any* tenant onboarding process that fails at any step, all changes should be rolled back leaving no partial tenant data
**Validates: Requirements 1.5**

### Property 6: Login Tenant Context Establishment
*For any* successful user login, the system should extract the user's tenant_id and establish it in the session context
**Validates: Requirements 2.1**

### Property 7: Data Access Tenant Isolation (Core Property)
*For any* authenticated user accessing any data, only records matching the user's tenant_id should be visible or accessible
**Validates: Requirements 2.2, 5.2**

### Property 8: Cross-Tenant Access Denial
*For any* user attempting to access data belonging to a different tenant, the system should deny access and return an appropriate error
**Validates: Requirements 2.3**

### Property 9: Logout Context Cleanup
*For any* user logout operation, the tenant context should be completely removed from the session
**Validates: Requirements 2.4**

### Property 10: User Creation Tenant Binding
*For any* tenant admin creating a new user, the new user's tenant_id should match the admin's tenant_id
**Validates: Requirements 3.1**

### Property 11: User List Tenant Filtering
*For any* tenant admin viewing the user list, only users with matching tenant_id should be displayed
**Validates: Requirements 3.2**

### Property 12: User Role Update Validation
*For any* tenant admin updating a user's role, the system should validate that the role is valid and the user remains in the same tenant
**Validates: Requirements 3.3**

### Property 13: User Deactivation Preserves Data
*For any* user being deactivated, the system should prevent login while preserving all historical data associated with that user
**Validates: Requirements 3.4**

### Property 14: Cross-Tenant User Management Prevention
*For any* tenant admin attempting to manage users from another tenant, the system should reject the operation
**Validates: Requirements 3.5**

### Property 15: Migration Data Mapping Correctness
*For any* existing data being migrated, the assigned tenant_id should correctly map to the appropriate tenant based on the user_id relationship
**Validates: Requirements 4.4**

### Property 16: New Table Schema Compliance
*For any* new table created in the system, it should include a tenant_id column with proper constraints and indexes
**Validates: Requirements 4.5**

### Property 17: Super Admin Bypass
*For any* super admin user accessing data, the system should allow access to all tenants' data regardless of the admin's own tenant_id
**Validates: Requirements 5.3**

### Property 18: RLS Failure Information Hiding
*For any* RLS policy failure, the system should return an empty result set rather than an error that could expose information about other tenants
**Validates: Requirements 5.5**


### Property 19: Tenant Name Display on Login
*For any* user successfully logging in, the system should display the tenant name in the UI header or sidebar
**Validates: Requirements 6.1**

### Property 20: Tenant Name Persistence Across Pages
*For any* authenticated user navigating between pages, the tenant name should remain visible as a context indicator
**Validates: Requirements 6.2**

### Property 21: Tenant Logo Display
*For any* tenant that has a logo configured, the system should display the logo in the application UI
**Validates: Requirements 6.4**

### Property 22: Tenant Information Reactive Update
*For any* change to tenant information (name, logo, settings), the UI should update to reflect the changes without requiring user logout
**Validates: Requirements 6.5**

### Property 23: Tenant Settings Isolation
*For any* tenant admin modifying tenant settings, the changes should only affect that specific tenant and not other tenants
**Validates: Requirements 7.2**

### Property 24: Calculation Preference Application
*For any* tenant with custom calculation preferences, all cost calculations for that tenant should apply those preferences
**Validates: Requirements 7.3**

### Property 25: Settings Change Audit Trail
*For any* modification to tenant settings, the system should create an audit log entry recording the change
**Validates: Requirements 7.4**

### Property 26: Settings Validation
*For any* invalid tenant settings submitted, the system should reject the changes and return validation errors
**Validates: Requirements 7.5**

### Property 27: Tenant Statistics Accuracy
*For any* tenant viewed by a super admin, the displayed statistics (user count, data size, activity) should accurately reflect that tenant's current state
**Validates: Requirements 8.2**

### Property 28: Super Admin Access Audit Logging
*For any* super admin accessing a specific tenant's data, the system should create an audit log entry for compliance tracking
**Validates: Requirements 8.4**

### Property 29: Tenant Status Toggle
*For any* super admin toggling a tenant's active status, the system should immediately enforce the new status (allowing or preventing access)
**Validates: Requirements 8.5**

### Property 30: Database Function Tenant Filtering
*For any* database function execution, the function should filter data based on the tenant_id from the session or parameter
**Validates: Requirements 9.1**

### Property 31: Trigger Tenant Consistency
*For any* INSERT or UPDATE operation triggering a database trigger, the trigger should ensure tenant_id consistency across related records
**Validates: Requirements 9.2**

### Property 32: Calculation Function Tenant Scoping
*For any* calculation function execution, the function should only use data from the same tenant
**Validates: Requirements 9.3**

### Property 33: Batch Operation Tenant Isolation
*For any* populate or sync function processing data, the function should process each tenant's data in isolation
**Validates: Requirements 9.4**

### Property 34: Cross-Table Tenant Validation
*For any* function performing cross-table operations, the function should validate that tenant_id is consistent across all involved tables
**Validates: Requirements 9.5**

### Property 35: Migration Tenant Assignment
*For any* existing user data being migrated, the system should create or assign appropriate tenant records
**Validates: Requirements 10.2**

### Property 36: Migration Referential Integrity
*For any* data record being migrated, all related records across tables should be assigned the same tenant_id
**Validates: Requirements 10.3**


### Property 37: Automatic Tenant Detection on Login
*For any* user logging in with email and password, the system should automatically detect and load the tenant from the user's profile
**Validates: Requirements 11.1**

### Property 38: Password Reset Tenant Awareness
*For any* user requesting a password reset, the system should send a reset link that includes tenant context
**Validates: Requirements 11.3**

### Property 39: Session Tenant Context Restoration
*For any* user accessing the application with a valid session, the system should automatically load the tenant context
**Validates: Requirements 11.4**

### Property 40: Session Expiry Tenant Preservation
*For any* session expiration, the system should preserve tenant context information for seamless re-authentication
**Validates: Requirements 11.5**

### Property 41: API Tenant Context Injection
*For any* API endpoint call, the system should extract tenant_id from the user session and inject it into the query
**Validates: Requirements 12.1**

### Property 42: Service Function Tenant Validation
*For any* service function execution, the function should validate tenant_id consistency for all operations
**Validates: Requirements 12.2**

### Property 43: API Data Creation Tenant Auto-Assignment
*For any* data creation via API, the system should automatically set the tenant_id from the user's context
**Validates: Requirements 12.3**

### Property 44: API Update Tenant Ownership Validation
*For any* data update via API, the system should validate that the data belongs to the user's tenant before allowing the update
**Validates: Requirements 12.4**

### Property 45: API Response Tenant Isolation
*For any* API response, the system should ensure no data from other tenants is included in the response
**Validates: Requirements 12.5**

### Property 46: Export Data Tenant Scoping
*For any* tenant admin requesting a data export, the system should generate an export file containing only that tenant's data
**Validates: Requirements 13.1**

### Property 47: Export Completeness with Filtering
*For any* data export process, the system should include all relevant tables with proper tenant_id filtering applied
**Validates: Requirements 13.2**

### Property 48: Export Link Security
*For any* completed export, the system should provide a secure, time-limited download link
**Validates: Requirements 13.3**

### Property 49: Export Format Importability
*For any* exported file, the format should be structured to allow re-import (SQL dump or JSON)
**Validates: Requirements 13.4**

### Property 50: Export Failure Cleanup
*For any* failed export operation, the system should not leave partial export files and should provide clear error messages
**Validates: Requirements 13.5**

## Error Handling

### Database Level Errors

1. **Tenant Not Found**: When a user's tenant_id references a non-existent tenant
   - Action: Deny login and prompt for tenant assignment
   - Log: Security audit log entry

2. **RLS Policy Violation**: When a query attempts to access data from another tenant
   - Action: Return empty result set (not error)
   - Log: Security audit log entry with attempted access details

3. **Foreign Key Violation on tenant_id**: When inserting data with invalid tenant_id
   - Action: Reject operation with clear error message
   - Log: Application error log

4. **Tenant Deactivated**: When accessing data for an inactive tenant
   - Action: Deny access and show tenant inactive message
   - Log: Access attempt log

### Application Level Errors

1. **Missing Tenant Context**: When API call lacks tenant context
   - Action: Return 401 Unauthorized
   - Response: `{ "error": "Tenant context required" }`

2. **Tenant Mismatch**: When attempting to access data from different tenant
   - Action: Return 403 Forbidden
   - Response: `{ "error": "Access denied" }`

3. **Invalid Tenant Settings**: When submitting invalid configuration
   - Action: Return 400 Bad Request with validation errors
   - Response: `{ "error": "Validation failed", "details": [...] }`

4. **Onboarding Failure**: When tenant creation fails
   - Action: Rollback all changes, return 500 with details
   - Response: `{ "error": "Tenant creation failed", "reason": "..." }`

### Migration Errors

1. **Data Mapping Failure**: When unable to map existing data to tenant
   - Action: Halt migration, preserve backup
   - Notification: Alert admin with details

2. **Referential Integrity Violation**: When related records have mismatched tenant_id
   - Action: Halt migration, report inconsistencies
   - Notification: Detailed report of affected records

3. **Backup Failure**: When pre-migration backup fails
   - Action: Abort migration immediately
   - Notification: Critical alert to admin

## Testing Strategy

### Unit Testing

**Database Functions Testing:**
- Test each tenant-aware function with multiple tenant contexts
- Verify functions only return data for correct tenant
- Test super admin bypass functionality
- Verify error handling for invalid tenant_id

**RLS Policy Testing:**
- Test each policy with different user roles
- Verify tenant isolation for SELECT, INSERT, UPDATE, DELETE
- Test super admin access to all tenants
- Verify policy performance with indexes

**Trigger Testing:**
- Test auto-population of tenant_id
- Verify tenant_id consistency validation
- Test error cases (mismatched tenant_id)

### Property-Based Testing

Property-based testing akan menggunakan **fast-check** library untuk JavaScript/TypeScript.

**Test Configuration:**
- Minimum 100 iterations per property test
- Random data generation for tenants, users, and records
- Shrinking enabled for minimal failing examples

**Key Property Tests:**

1. **Tenant Isolation Property** (Property 7)
   - Generate: Random tenants, users, and data records
   - Test: User from tenant A cannot access data from tenant B
   - Verify: All queries return only matching tenant_id data

2. **Tenant Creation Atomicity** (Property 5)
   - Generate: Random tenant creation scenarios with failures
   - Test: Failed creation leaves no partial data
   - Verify: Database state unchanged after failure

3. **Cross-Table Consistency** (Property 36)
   - Generate: Random related records across tables
   - Test: All related records have same tenant_id
   - Verify: No orphaned records with mismatched tenant_id

4. **API Tenant Injection** (Property 41)
   - Generate: Random API requests with different users
   - Test: All queries include correct tenant_id filter
   - Verify: No cross-tenant data leakage

5. **Settings Isolation** (Property 23)
   - Generate: Random setting changes for multiple tenants
   - Test: Changes only affect target tenant
   - Verify: Other tenants' settings unchanged

### Integration Testing

**End-to-End Tenant Isolation:**
```typescript
describe('Tenant Isolation E2E', () => {
  it('should isolate data between tenants', async () => {
    // Create two tenants with users and data
    const tenant1 = await createTestTenant('Hospital A');
    const tenant2 = await createTestTenant('Hospital B');
    
    // Login as tenant1 user
    await loginAs(tenant1.adminUser);
    
    // Create data for tenant1
    const data1 = await createUnitKerja({ name: 'Unit A' });
    
    // Login as tenant2 user
    await loginAs(tenant2.adminUser);
    
    // Verify tenant2 cannot see tenant1 data
    const units = await fetchUnitKerja();
    expect(units).not.toContainEqual(data1);
    
    // Create data for tenant2
    const data2 = await createUnitKerja({ name: 'Unit B' });
    
    // Verify tenant2 only sees their data
    expect(units).toContainEqual(data2);
    expect(units.length).toBe(1);
  });
});
```

**Migration Testing:**
```typescript
describe('Data Migration', () => {
  it('should migrate existing data with correct tenant assignment', async () => {
    // Setup: Create existing single-tenant data
    await seedExistingData();
    
    // Execute migration
    const result = await runMigration();
    
    // Verify: All data has tenant_id
    const tablesWithoutTenantId = await checkTablesForTenantId();
    expect(tablesWithoutTenantId).toHaveLength(0);
    
    // Verify: Referential integrity maintained
    const inconsistencies = await checkTenantIdConsistency();
    expect(inconsistencies).toHaveLength(0);
    
    // Verify: RLS policies active
    const rlsStatus = await checkRLSPolicies();
    expect(rlsStatus.allEnabled).toBe(true);
  });
});
```

### Performance Testing

**RLS Policy Performance:**
- Measure query execution time with RLS enabled
- Verify index usage on tenant_id columns
- Test with large datasets (1M+ records)
- Target: < 100ms for typical queries

**Multi-Tenant Scalability:**
- Test with 100+ tenants
- Measure resource usage per tenant
- Verify no performance degradation with tenant count
- Test concurrent access from multiple tenants

### Security Testing

**Penetration Testing Scenarios:**

1. **JWT Manipulation**: Attempt to modify tenant_id in JWT
   - Expected: Signature validation failure, access denied

2. **SQL Injection**: Attempt to bypass RLS with SQL injection
   - Expected: Parameterized queries prevent injection

3. **Direct Database Access**: Attempt to query without RLS context
   - Expected: Empty results or access denied

4. **Session Hijacking**: Attempt to use another user's session
   - Expected: Session validation failure

5. **API Parameter Tampering**: Attempt to pass different tenant_id in API
   - Expected: Parameter ignored, session tenant_id used

## Deployment Strategy

### Phase 1: Preparation (Week 1-2)
- Create backup of production database
- Set up staging environment with production data copy
- Test migration scripts on staging
- Prepare rollback procedures

### Phase 2: Schema Migration (Week 3)
- Add tenants table and related tables
- Add tenant_id columns to all tables (nullable initially)
- Create indexes on tenant_id columns
- Deploy helper functions

### Phase 3: Data Migration (Week 4)
- Create default tenant for existing data
- Populate tenant_id for all existing records
- Verify data integrity
- Set tenant_id columns to NOT NULL

### Phase 4: RLS Deployment (Week 5)
- Deploy RLS policies (in permissive mode initially)
- Monitor for any access issues
- Switch to restrictive mode
- Verify isolation working correctly

### Phase 5: Application Update (Week 6)
- Deploy tenant-aware application code
- Update authentication flow
- Deploy tenant UI components
- Enable tenant branding

### Phase 6: Testing & Validation (Week 7)
- Run full test suite on production
- Perform security audit
- Load testing with multiple tenants
- User acceptance testing

### Phase 7: Go-Live (Week 8)
- Enable multi-tenant features for all users
- Monitor system performance
- Provide user support
- Document any issues

### Rollback Plan

If critical issues are discovered:

1. **Immediate Rollback** (< 1 hour):
   - Disable RLS policies
   - Revert application code
   - Restore from backup if necessary

2. **Data Preservation**:
   - Keep tenant_id columns (for future retry)
   - Maintain audit logs
   - Document failure reasons

3. **Communication**:
   - Notify all stakeholders
   - Provide incident report
   - Plan remediation steps

## Monitoring and Observability

### Key Metrics

1. **Tenant Isolation Metrics**:
   - Cross-tenant access attempts (should be 0)
   - RLS policy violations
   - Failed authentication due to tenant issues

2. **Performance Metrics**:
   - Query execution time by tenant
   - Database connection pool usage
   - API response time per tenant

3. **Usage Metrics**:
   - Active tenants count
   - Users per tenant
   - Data size per tenant
   - API calls per tenant

### Alerts

1. **Critical Alerts**:
   - Cross-tenant data access detected
   - RLS policy disabled
   - Tenant creation failure
   - Migration rollback triggered

2. **Warning Alerts**:
   - Tenant approaching data limits
   - Slow query performance
   - High error rate for specific tenant

### Logging

**Audit Logs** (stored in tenant_audit_log table):
- All tenant setting changes
- User management operations
- Super admin access to tenant data
- Export operations

**Security Logs**:
- Failed authentication attempts
- RLS policy violations
- Cross-tenant access attempts
- Permission denied errors

**Application Logs**:
- Tenant onboarding events
- Migration progress
- Performance metrics
- Error traces

## Documentation Requirements

### Technical Documentation

1. **Architecture Document**:
   - Multi-tenant design overview
   - Data isolation strategy
   - RLS policy structure
   - Database schema with ERD

2. **API Documentation**:
   - Tenant-aware endpoints
   - Authentication flow
   - Error responses
   - Rate limiting per tenant

3. **Database Documentation**:
   - Table schemas with tenant_id
   - RLS policies for each table
   - Helper functions
   - Triggers and their purpose

### Operational Documentation

1. **Tenant Onboarding Guide**:
   - Step-by-step process
   - Required information
   - Default data initialization
   - Verification checklist

2. **Migration Guide**:
   - Pre-migration checklist
   - Migration steps
   - Verification procedures
   - Rollback procedures

3. **Troubleshooting Guide**:
   - Common issues and solutions
   - Tenant isolation problems
   - Performance issues
   - Data inconsistency resolution

### User Documentation

1. **Admin User Guide**:
   - Tenant management
   - User management within tenant
   - Settings configuration
   - Data export procedures

2. **End User Guide**:
   - Understanding tenant context
   - Tenant branding
   - Data privacy assurance
   - Support contacts

## Security Considerations

### Defense in Depth

1. **Database Level**: RLS policies enforce tenant isolation
2. **Application Level**: Tenant context validation in all operations
3. **API Level**: JWT validation with tenant_id verification
4. **UI Level**: Tenant context display and validation

### Data Privacy

- Each tenant's data is cryptographically isolated
- Super admin access is logged for audit
- Export functionality respects tenant boundaries
- Backup procedures maintain tenant separation

### Compliance

- GDPR: Tenant data can be exported and deleted independently
- HIPAA: Audit logs track all data access
- SOC 2: Tenant isolation provides logical separation
- ISO 27001: Security controls at multiple layers

## Performance Optimization

### Database Optimization

1. **Indexing Strategy**:
   - Single column index on tenant_id for all tables
   - Composite indexes on (tenant_id, frequently_queried_column)
   - Covering indexes for common queries

2. **Query Optimization**:
   - Always include tenant_id in WHERE clause (even though RLS adds it)
   - Use prepared statements
   - Batch operations per tenant

3. **Connection Pooling**:
   - Separate connection pools per tenant (for large tenants)
   - Shared pool for small tenants
   - Monitor connection usage

### Application Optimization

1. **Caching Strategy**:
   - Cache tenant settings per tenant
   - Cache user permissions per tenant
   - Invalidate cache on tenant settings change

2. **API Optimization**:
   - Rate limiting per tenant
   - Request batching
   - Response pagination

3. **UI Optimization**:
   - Lazy load tenant branding
   - Cache tenant logo and colors
   - Minimize tenant context API calls

## Future Enhancements

### Potential Features

1. **Tenant Analytics Dashboard**:
   - Usage statistics
   - Cost analysis per tenant
   - Performance metrics

2. **Tenant-Specific Customization**:
   - Custom workflows
   - Custom reports
   - Custom calculations

3. **Multi-Tenant Reporting**:
   - Cross-tenant analytics (for super admin)
   - Benchmarking between tenants
   - Aggregate statistics

4. **Tenant Marketplace**:
   - Shared templates
   - Best practices library
   - Community features

5. **Advanced Isolation**:
   - Separate database per tenant (for enterprise)
   - Geographic data residency
   - Custom backup schedules per tenant
