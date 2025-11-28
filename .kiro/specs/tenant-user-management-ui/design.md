# Design Document - UI Manajemen Tenant dan User Terpadu

## Overview

Dokumen ini menjelaskan desain teknis untuk enhancement UI halaman Manajemen Akses yang menggabungkan fungsi manajemen tenant dan user dalam satu interface dengan sistem tab. Desain ini memanfaatkan infrastruktur multi-tenant yang sudah ada dan menambahkan layer UI yang lebih user-friendly.

### Tujuan Desain

1. **Unified Interface**: Satu halaman untuk mengelola tenant dan user
2. **Role-Based UI**: Tampilan berbeda untuk super admin vs tenant admin
3. **Reusability**: Menggunakan service layer dan komponen yang sudah ada
4. **Consistency**: Mengikuti design pattern aplikasi existing
5. **Performance**: Optimasi loading dan rendering dengan React Query

### Strategi Implementasi

- Modifikasi halaman ManajemenUser.tsx menjadi ManajemenAkses.tsx
- Implementasi tab interface dengan Tabs component dari shadcn/ui
- Reuse service functions dari tenantOnboarding.ts dan userManagement.ts
- Implementasi role-based rendering untuk super admin vs tenant admin
- Optimasi dengan React Query untuk caching dan real-time updates

## Architecture

### Component Hierarchy

```
ManajemenAkses (Page)
├── TenantManagementTab (Super Admin Only)
│   ├── TenantList
│   │   ├── TenantTable
│   │   │   ├── TenantRow (expandable)
│   │   │   │   └── TenantUserList
│   │   │   └── TenantActions
│   │   └── TenantSearchFilter
│   └── CreateTenantDialog
│
└── UserManagementTab (All Roles)
    ├── UserList
    │   ├── UserTable
    │   │   ├── UserRow
    │   │   └── UserActions
    │   └── UserSearchFilter
    ├── CreateUserDialog
    ├── ChangeRoleDialog
    └── ConfirmationDialog
```

### Data Flow

```
User Action → Component Event Handler → Service Layer → Supabase
                                              ↓
                                        React Query
                                              ↓
                                        Cache Update
                                              ↓
                                        UI Re-render
```


## Components and Interfaces

### 1. ManajemenAkses Page Component

**File**: `src/pages/ManajemenAkses.tsx`

```typescript
interface ManajemenAksesProps {}

interface TabValue {
  TENANT: 'tenant';
  USER: 'user';
}

const ManajemenAkses: React.FC<ManajemenAksesProps> = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const isSuperAdmin = user?.email === 'mukhsin9@gmail.com';
  
  const [activeTab, setActiveTab] = useState<string>(
    isSuperAdmin ? 'tenant' : 'user'
  );

  return (
    <div className="container mx-auto py-6">
      <h1>Manajemen Akses</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {isSuperAdmin && <TabsTrigger value="tenant">Kelola Tenant</TabsTrigger>}
          <TabsTrigger value="user">Kelola User</TabsTrigger>
        </TabsList>
        
        {isSuperAdmin && (
          <TabsContent value="tenant">
            <TenantManagementTab />
          </TabsContent>
        )}
        
        <TabsContent value="user">
          <UserManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 2. TenantManagementTab Component

**File**: `src/components/ManajemenAkses/TenantManagementTab.tsx`

```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  user_count?: number;
}

interface TenantManagementTabProps {}

const TenantManagementTab: React.FC<TenantManagementTabProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);

  const { data: tenants, isLoading, refetch } = useQuery({
    queryKey: ['tenants', searchQuery, statusFilter],
    queryFn: () => fetchTenants(searchQuery, statusFilter)
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Daftar Tenant</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Tambah Tenant Baru
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <TenantSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <TenantTable
          tenants={tenants}
          isLoading={isLoading}
          expandedTenantId={expandedTenantId}
          onToggleExpand={setExpandedTenantId}
          onRefetch={refetch}
        />
      </CardContent>
      
      <CreateTenantDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />
    </Card>
  );
};
```


### 3. TenantTable Component

**File**: `src/components/ManajemenAkses/TenantTable.tsx`

```typescript
interface TenantTableProps {
  tenants: Tenant[];
  isLoading: boolean;
  expandedTenantId: string | null;
  onToggleExpand: (tenantId: string | null) => void;
  onRefetch: () => void;
}

const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  isLoading,
  expandedTenantId,
  onToggleExpand,
  onRefetch
}) => {
  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    await toggleTenantStatus(tenantId, !currentStatus);
    onRefetch();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Rumah Sakit</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Jumlah User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Dibuat</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants.map((tenant) => (
          <React.Fragment key={tenant.id}>
            <TableRow 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onToggleExpand(
                expandedTenantId === tenant.id ? null : tenant.id
              )}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {expandedTenantId === tenant.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {tenant.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{tenant.slug}</Badge>
              </TableCell>
              <TableCell>{tenant.user_count || 0} user</TableCell>
              <TableCell>
                <Switch
                  checked={tenant.is_active}
                  onCheckedChange={() => handleToggleStatus(tenant.id, tenant.is_active)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell>
                {new Date(tenant.created_at).toLocaleDateString('id-ID')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to tenant settings
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            
            {expandedTenantId === tenant.id && (
              <TableRow>
                <TableCell colSpan={6} className="bg-gray-50">
                  <TenantUserList tenantId={tenant.id} />
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};
```

### 4. TenantUserList Component

**File**: `src/components/ManajemenAkses/TenantUserList.tsx`

```typescript
interface TenantUserListProps {
  tenantId: string;
}

const TenantUserList: React.FC<TenantUserListProps> = ({ tenantId }) => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: () => fetchUsersByTenant(tenantId)
  });

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  return (
    <div className="p-4">
      <h4 className="font-semibold mb-3">User dalam Tenant</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.full_name || '-'}</TableCell>
              <TableCell>
                <Badge className={getRoleColorClass(user.role_name)}>
                  {user.role_name}
                </Badge>
              </TableCell>
              <TableCell>
                {user.is_active ? (
                  <Badge variant="outline" className="text-green-600">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600">
                    Nonaktif
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```


### 5. CreateTenantDialog Component

**File**: `src/components/ManajemenAkses/CreateTenantDialog.tsx`

```typescript
interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreateTenantFormData {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

const createTenantSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  slug: z.string()
    .min(3, 'Slug minimal 3 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug harus format kebab-case'),
  adminEmail: z.string().email('Format email tidak valid'),
  adminPassword: z.string().min(8, 'Password minimal 8 karakter'),
  adminName: z.string().min(3, 'Nama admin minimal 3 karakter')
});

const CreateTenantDialog: React.FC<CreateTenantDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      adminEmail: '',
      adminPassword: '',
      adminName: ''
    }
  });

  const onSubmit = async (data: CreateTenantFormData) => {
    setSubmitting(true);
    try {
      const result = await createTenant({
        name: data.name,
        slug: data.slug,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        adminName: data.adminName
      });

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Tenant baru berhasil dibuat'
        });
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat tenant',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    form.setValue('slug', slug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Tenant Baru</DialogTitle>
          <DialogDescription>
            Buat rumah sakit baru dengan admin pertama
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Rumah Sakit *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="RS Umum Contoh"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="rs-umum-contoh" />
                  </FormControl>
                  <FormDescription>
                    Format: huruf kecil, angka, dan tanda hubung
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Admin *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="admin@rs.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Admin *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Admin *</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Minimal 8 karakter" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  'Buat Tenant'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```


### 6. UserManagementTab Component

**File**: `src/components/ManajemenAkses/UserManagementTab.tsx`

```typescript
interface UserManagementTabProps {}

const UserManagementTab: React.FC<UserManagementTabProps> = () => {
  const { tenant } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', tenant?.id, searchQuery, roleFilter, statusFilter],
    queryFn: () => fetchUsers(searchQuery, roleFilter, statusFilter)
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: getAllRoles
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Daftar User</CardTitle>
            {tenant && (
              <CardDescription>
                Tenant: <span className="font-semibold">{tenant.name}</span>
              </CardDescription>
            )}
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah User
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <UserSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          roles={roles || []}
        />
        
        <UserTable
          users={users || []}
          isLoading={isLoading}
          onChangeRole={(user) => {
            setSelectedUser(user);
            setShowRoleDialog(true);
          }}
          onToggleStatus={async (user) => {
            await toggleUserStatus(user.id, !user.role_is_active);
            refetch();
          }}
        />
      </CardContent>
      
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
        roles={roles || []}
      />
      
      <ChangeRoleDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        user={selectedUser}
        roles={roles || []}
        onSuccess={refetch}
      />
    </Card>
  );
};
```

### 7. Search and Filter Components

**File**: `src/components/ManajemenAkses/SearchFilter.tsx`

```typescript
interface TenantSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
}

const TenantSearchFilter: React.FC<TenantSearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <Input
          placeholder="Cari nama atau slug tenant..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="active">Aktif</SelectItem>
          <SelectItem value="inactive">Nonaktif</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

interface UserSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  roles: Role[];
}

const UserSearchFilter: React.FC<UserSearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  roles
}) => {
  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <Input
          placeholder="Cari email atau nama user..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Role</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.role_name}>
              {role.role_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="active">Aktif</SelectItem>
          <SelectItem value="inactive">Nonaktif</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
```


## Data Models

### Tenant Model (Extended)

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
  
  // Computed fields
  user_count?: number;
  settings?: TenantSettings;
}

interface TenantWithUsers extends Tenant {
  users: UserWithRole[];
}
```

### User Model (Extended)

```typescript
interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  
  // From user_profiles
  full_name: string | null;
  phone: string | null;
  tenant_id: string;
  
  // From user_roles
  role_id: number;
  role_name: string;
  role_is_active: boolean;
}
```

### Form Data Models

```typescript
interface CreateTenantFormData {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

interface CreateUserFormData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

interface ChangeRoleFormData {
  userId: string;
  newRole: string;
}
```

## Service Layer Integration

### Tenant Services

**File**: `src/services/tenantManagement.ts` (New)

```typescript
import { supabase } from '@/integrations/supabase/client';
import { createTenant as createTenantOnboarding } from './tenantOnboarding';

export const fetchTenants = async (
  searchQuery: string = '',
  statusFilter: 'all' | 'active' | 'inactive' = 'all'
) => {
  let query = supabase
    .from('tenants')
    .select(`
      *,
      user_profiles(count)
    `)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
  }

  if (statusFilter !== 'all') {
    query = query.eq('is_active', statusFilter === 'active');
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map(tenant => ({
    ...tenant,
    user_count: tenant.user_profiles?.[0]?.count || 0
  }));
};

export const fetchUsersByTenant = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      user_roles(
        role_id,
        role_name,
        is_active
      )
    `)
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return data;
};

export const toggleTenantStatus = async (
  tenantId: string,
  isActive: boolean
) => {
  const { error } = await supabase
    .from('tenants')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', tenantId);

  if (error) throw error;

  // Log audit trail
  await logAuditTrail({
    tenant_id: tenantId,
    action: isActive ? 'activate_tenant' : 'deactivate_tenant',
    table_name: 'tenants',
    record_id: tenantId
  });

  return { success: true };
};

export const createTenant = async (params: CreateTenantFormData) => {
  try {
    const result = await createTenantOnboarding(params);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal membuat tenant'
    };
  }
};
```

### User Services (Enhanced)

**File**: `src/lib/userManagement.ts` (Update existing)

```typescript
// Add new function for filtered user fetch
export const fetchUsers = async (
  searchQuery: string = '',
  roleFilter: string = 'all',
  statusFilter: 'all' | 'active' | 'inactive' = 'all'
) => {
  const users = await getAllUsers();
  
  let filtered = users;

  if (searchQuery) {
    filtered = filtered.filter(user =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (roleFilter !== 'all') {
    filtered = filtered.filter(user => user.role_name === roleFilter);
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter(user =>
      user.role_is_active === (statusFilter === 'active')
    );
  }

  return filtered;
};

export const toggleUserStatus = async (userId: string, isActive: boolean) => {
  if (isActive) {
    return await activateUser(userId);
  } else {
    return await deactivateUser(userId);
  }
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Super Admin Tab Visibility
*For any* user with email mukhsin9@gmail.com, the system should display both "Kelola Tenant" and "Kelola User" tabs
**Validates: Requirements 1.1**

### Property 2: Tenant Admin Tab Restriction
*For any* user who is not super admin, the system should only display the "Kelola User" tab
**Validates: Requirements 1.4**

### Property 3: Tenant List Completeness
*For any* super admin viewing the tenant list, all tenants in the database should be displayed
**Validates: Requirements 1.2**

### Property 4: Tenant Creation Atomicity
*For any* tenant creation request, either all components (tenant, admin user, settings, default data) are created successfully or none are created
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 5: Tenant User List Isolation
*For any* expanded tenant row, only users with matching tenant_id should be displayed in the user list
**Validates: Requirements 3.3**

### Property 6: Tenant Status Toggle Effect
*For any* tenant status change to inactive, all users from that tenant should be prevented from logging in
**Validates: Requirements 4.2**

### Property 7: User List Tenant Filtering
*For any* tenant admin viewing the user list, only users with the same tenant_id as the admin should be visible
**Validates: Requirements 5.2**

### Property 8: User Creation Tenant Binding
*For any* user created by a tenant admin, the new user's tenant_id should match the admin's tenant_id
**Validates: Requirements 6.2, 6.3, 6.4**

### Property 9: Role Change Tenant Validation
*For any* role change operation, the system should validate that the user remains in the same tenant
**Validates: Requirements 7.3**

### Property 10: User Deactivation Data Preservation
*For any* user deactivation, all historical data associated with the user should remain unchanged
**Validates: Requirements 8.4**

### Property 11: Super Admin Cross-Tenant Access
*For any* data access by super admin (mukhsin9@gmail.com), the system should allow access to all tenants
**Validates: Requirements 9.2**

### Property 12: Super Admin Audit Logging
*For any* operation performed by super admin on tenant data, an audit log entry should be created
**Validates: Requirements 9.3**

### Property 13: Search Query Filtering Accuracy
*For any* search query entered, only tenants or users matching the query in name, email, or slug should be displayed
**Validates: Requirements 13.2, 14.2**

### Property 14: Status Filter Consistency
*For any* status filter applied, only items with the selected status should be displayed
**Validates: Requirements 13.3, 14.4**

### Property 15: Form Validation Real-time
*For any* form field with validation rules, validation errors should be displayed immediately upon invalid input
**Validates: Requirements 12.1, 12.2, 12.3**

### Property 16: Slug Auto-generation Correctness
*For any* tenant name entered, the auto-generated slug should be in kebab-case format and contain only lowercase letters, numbers, and hyphens
**Validates: Requirements 12.3**

### Property 17: Loading State Visibility
*For any* async operation in progress, a loading indicator should be visible to the user
**Validates: Requirements 11.1, 11.2**

### Property 18: Success Notification Display
*For any* successful operation, a success toast notification should be displayed
**Validates: Requirements 11.5**

### Property 19: Error Message Clarity
*For any* failed operation, a clear and actionable error message should be displayed
**Validates: Requirements 11.4**

### Property 20: Component Consistency
*For any* UI component used, it should be from the shadcn/ui library or follow the same design pattern
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

## Error Handling

### Client-Side Errors

1. **Validation Errors**
   - Display inline error messages on form fields
   - Prevent form submission until all validations pass
   - Use Zod schema validation for type safety

2. **Network Errors**
   - Display toast notification with retry option
   - Log error to console for debugging
   - Maintain form state for retry

3. **Permission Errors**
   - Display "Access Denied" message
   - Redirect to appropriate page based on role
   - Log security event

### Server-Side Errors

1. **Duplicate Tenant Slug**
   - Return 409 Conflict error
   - Display message: "Slug sudah digunakan, silakan gunakan slug lain"
   - Suggest alternative slugs

2. **Tenant Creation Failure**
   - Rollback all changes (handled by database constraints)
   - Display detailed error message
   - Log error for admin review

3. **User Creation Failure**
   - Display specific error (email exists, weak password, etc.)
   - Maintain form data for correction
   - Provide actionable guidance

### Database Errors

1. **RLS Policy Violation**
   - Return empty result set (not error)
   - Log security event
   - Display "No data available" message

2. **Foreign Key Constraint**
   - Prevent deletion of tenant with active users
   - Display message: "Tidak dapat menghapus tenant dengan user aktif"
   - Suggest deactivating users first

3. **Connection Timeout**
   - Retry with exponential backoff
   - Display loading state during retry
   - Show error after max retries


## Testing Strategy

### Unit Testing

**Framework**: Vitest + React Testing Library

**Test Coverage**:

1. **Component Tests**
   - ManajemenAkses: Tab visibility based on role
   - TenantManagementTab: Render tenant list, search, filter
   - CreateTenantDialog: Form validation, submission
   - UserManagementTab: Render user list, actions
   - TenantTable: Expand/collapse, status toggle
   - SearchFilter: Query and filter changes

2. **Service Tests**
   - fetchTenants: Query with filters
   - toggleTenantStatus: Status update and audit log
   - createTenant: Successful creation and rollback on failure
   - fetchUsers: Filtering logic
   - toggleUserStatus: Activation/deactivation

3. **Hook Tests**
   - useTenant: Tenant context access
   - useAuth: User authentication state
   - Form hooks: Validation and submission

### Property-Based Testing

**Framework**: fast-check

**Properties to Test**:

1. **Property 1: Super Admin Tab Visibility**
   - Generate random user with email mukhsin9@gmail.com
   - Verify both tabs are rendered
   - Test with 100 iterations

2. **Property 4: Tenant Creation Atomicity**
   - Generate random tenant data
   - Simulate creation failure at different steps
   - Verify no partial data exists
   - Test with 100 iterations

3. **Property 7: User List Tenant Filtering**
   - Generate multiple tenants with users
   - For each tenant admin, verify only their users visible
   - Test with 100 iterations

4. **Property 13: Search Query Filtering Accuracy**
   - Generate random tenant/user data
   - Generate random search queries
   - Verify only matching items displayed
   - Test with 100 iterations

5. **Property 16: Slug Auto-generation Correctness**
   - Generate random tenant names (including special chars)
   - Verify generated slug is valid kebab-case
   - Test with 100 iterations

### Integration Testing

**Test Scenarios**:

1. **Tenant Onboarding Flow**
   - Super admin creates tenant
   - Verify tenant appears in list
   - Verify admin user can login
   - Verify default data initialized

2. **User Management Flow**
   - Tenant admin creates user
   - Verify user appears in list
   - Change user role
   - Deactivate user
   - Verify user cannot login

3. **Cross-Tenant Isolation**
   - Create two tenants with users
   - Verify tenant A admin cannot see tenant B users
   - Verify tenant A users cannot access tenant B data

4. **Super Admin Access**
   - Super admin views all tenants
   - Super admin accesses tenant A data
   - Verify audit log created
   - Super admin switches to tenant B
   - Verify correct data displayed

### End-to-End Testing

**Test Cases**:

1. **Complete Tenant Lifecycle**
   - Create tenant → Add users → Manage roles → Deactivate tenant → Reactivate

2. **Search and Filter**
   - Apply various search queries and filters
   - Verify correct results
   - Clear filters and verify all data shown

3. **Error Handling**
   - Submit invalid form data
   - Simulate network errors
   - Verify error messages and recovery

## Performance Considerations

### Optimization Strategies

1. **React Query Caching**
   - Cache tenant list with 5-minute stale time
   - Cache user list with 2-minute stale time
   - Invalidate cache on mutations

2. **Lazy Loading**
   - Load tenant users only when row expanded
   - Paginate tenant list if > 50 items
   - Paginate user list if > 100 items

3. **Debounced Search**
   - Debounce search input by 300ms
   - Cancel previous requests on new input
   - Show loading state during search

4. **Optimistic Updates**
   - Update UI immediately on status toggle
   - Rollback on error
   - Show loading state on button

5. **Memoization**
   - Memoize filtered lists with useMemo
   - Memoize expensive computations
   - Use React.memo for pure components

### Performance Metrics

- Initial page load: < 1 second
- Search response: < 300ms
- Form submission: < 2 seconds
- Tab switch: < 100ms
- Expand tenant row: < 500ms

## Security Considerations

### Authentication & Authorization

1. **Role-Based Access Control**
   - Verify user role on every render
   - Hide/disable actions based on permissions
   - Validate permissions on server-side

2. **Super Admin Identification**
   - Check email === 'mukhsin9@gmail.com'
   - Verify in both client and server
   - Log all super admin actions

3. **Tenant Isolation**
   - Enforce tenant_id filtering in all queries
   - Use RLS policies as defense-in-depth
   - Validate tenant_id on all mutations

### Data Protection

1. **Password Handling**
   - Never display passwords in UI
   - Use type="password" for input fields
   - Enforce minimum 8 characters
   - Hash passwords on server (handled by Supabase Auth)

2. **Sensitive Data**
   - Mask email addresses in logs
   - Redact sensitive fields in audit logs
   - Use HTTPS for all communications

3. **Audit Logging**
   - Log all tenant status changes
   - Log all user role changes
   - Log all super admin access
   - Include IP address and user agent

### Input Validation

1. **Client-Side Validation**
   - Zod schema validation
   - Real-time error display
   - Prevent submission of invalid data

2. **Server-Side Validation**
   - Validate all inputs in database functions
   - Sanitize inputs to prevent SQL injection
   - Validate tenant_id consistency

3. **XSS Prevention**
   - Escape all user inputs in UI
   - Use React's built-in XSS protection
   - Sanitize HTML content if needed

## Deployment Strategy

### Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] All property tests passing
- [ ] All integration tests passing
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated

### Deployment Steps

1. **Database Migration** (if needed)
   - No new tables required
   - No schema changes needed

2. **Frontend Deployment**
   - Build production bundle
   - Deploy to Vercel/hosting
   - Verify environment variables

3. **Testing in Production**
   - Test super admin access
   - Test tenant admin access
   - Test user creation flow
   - Verify tenant isolation

4. **Rollback Plan**
   - Keep previous version deployed
   - Monitor error rates
   - Rollback if critical issues found

### Post-Deployment Monitoring

- Monitor page load times
- Track error rates
- Monitor API response times
- Review audit logs
- Collect user feedback

## Migration from Current Implementation

### Changes Required

1. **Rename Page Component**
   - Rename `ManajemenUser.tsx` to `ManajemenAkses.tsx`
   - Update route in App.tsx
   - Update navigation links

2. **Add New Components**
   - Create `TenantManagementTab.tsx`
   - Create `TenantTable.tsx`
   - Create `TenantUserList.tsx`
   - Create `CreateTenantDialog.tsx`
   - Create `SearchFilter.tsx` components

3. **Update Existing Components**
   - Extract user management logic to `UserManagementTab.tsx`
   - Reuse existing dialogs (CreateUserDialog, ChangeRoleDialog)
   - Update imports and exports

4. **Add New Services**
   - Create `tenantManagement.ts` service
   - Add filtering functions to `userManagement.ts`

5. **Update Routes**
   - Change `/manajemen-user` to `/manajemen-akses`
   - Update sidebar navigation
   - Update breadcrumbs

### Backward Compatibility

- Existing user management functionality preserved
- No breaking changes to API
- No database schema changes
- Existing permissions and RLS policies unchanged

### Testing Migration

1. Test existing user management features still work
2. Test new tenant management features
3. Test role-based tab visibility
4. Test data isolation
5. Test super admin access

