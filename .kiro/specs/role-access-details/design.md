# Design Document - Rincian Role Akses

## Overview

Dokumen ini menjelaskan desain teknis untuk fitur "Rincian Role Akses" yang menambahkan tab ketiga pada halaman Manajemen Akses. Tab ini menampilkan matriks akses lengkap yang menunjukkan permission setiap role untuk setiap menu/submenu dalam aplikasi.

### Tujuan Desain

1. **Visual Permission Matrix**: Tampilan matriks yang mudah dipahami untuk mapping role-menu-permission
2. **Interactive Exploration**: Filter, search, expand/collapse untuk eksplorasi data
3. **Detailed Information**: Dialog detail untuk melihat permission spesifik
4. **Export Capability**: Generate dokumentasi dalam format PDF/Excel/CSV
5. **Performance**: Optimasi rendering untuk tabel besar dengan banyak menu

### Strategi Implementasi

- Tambahkan tab "Rincian Role Akses" pada ManajemenAkses.tsx
- Buat komponen RoleAccessDetailsTab sebagai container utama
- Implementasi AccessMatrix component untuk tabel matriks
- Gunakan React Query untuk data fetching dan caching
- Implementasi export functionality dengan jsPDF dan XLSX
- Optimasi rendering dengan virtualization jika diperlukan

## Architecture

### Component Hierarchy

```
ManajemenAkses (Page)
├── Tab: Kelola Tenant (existing)
├── Tab: Kelola User (existing)
└── Tab: Rincian Role Akses (NEW)
    └── RoleAccessDetailsTab
        ├── AccessStatistics
        │   └── RoleStatCard (per role)
        ├── AccessMatrixToolbar
        │   ├── SearchInput
        │   ├── RoleFilter
        │   ├── ExpandAllButton
        │   └── ExportButton
        ├── AccessMatrix
        │   ├── MatrixHeader (role columns)
        │   └── MatrixBody
        │       └── MenuRow (expandable)
        │           ├── MenuCell
        │           └── AccessCell (per role)
        │               └── AccessIndicator
        └── PermissionDetailDialog
            ├── OperationList
            └── RLSPolicyInfo
```

### Data Flow

```
Component Mount → Fetch Roles → Fetch Menus → Fetch Permissions
                                                      ↓
                                                React Query Cache
                                                      ↓
                                                Build Matrix Data
                                                      ↓
                                                Render Matrix
                                                      ↓
User Interaction → Filter/Search → Update Display
                                                      ↓
Export Action → Generate Document → Download
```

## Components and Interfaces

### 1. RoleAccessDetailsTab Component

**File**: `src/components/ManajemenAkses/RoleAccessDetailsTab.tsx`


```typescript
interface RoleAccessDetailsTabProps {}

const RoleAccessDetailsTab: React.FC<RoleAccessDetailsTabProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<AccessCell | null>(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchAllRoles
  });

  const { data: menus, isLoading: menusLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: fetchAllMenuItems
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: fetchAllPermissions
  });

  const matrixData = useMemo(() => 
    buildAccessMatrix(roles, menus, permissions),
    [roles, menus, permissions]
  );

  const filteredData = useMemo(() => 
    filterMatrix(matrixData, searchQuery, roleFilter),
    [matrixData, searchQuery, roleFilter]
  );

  const statistics = useMemo(() => 
    calculateStatistics(matrixData, roles),
    [matrixData, roles]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rincian Role Akses</CardTitle>
        <CardDescription>
          Matriks akses lengkap untuk semua role dan menu dalam sistem
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <AccessStatistics statistics={statistics} roles={roles} />
        
        <AccessMatrixToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          roles={roles}
          onExpandAll={() => setExpandedMenus(new Set(menus?.map(m => m.id)))}
          onCollapseAll={() => setExpandedMenus(new Set())}
          onExport={(format) => handleExport(format, filteredData)}
        />

        {(rolesLoading || menusLoading || permissionsLoading) ? (
          <MatrixSkeleton />
        ) : (
          <AccessMatrix
            data={filteredData}
            roles={roles}
            expandedMenus={expandedMenus}
            onToggleMenu={(menuId) => {
              const newExpanded = new Set(expandedMenus);
              if (newExpanded.has(menuId)) {
                newExpanded.delete(menuId);
              } else {
                newExpanded.add(menuId);
              }
              setExpandedMenus(newExpanded);
            }}
            onCellClick={setSelectedCell}
          />
        )}
      </CardContent>

      <PermissionDetailDialog
        open={!!selectedCell}
        onOpenChange={(open) => !open && setSelectedCell(null)}
        cell={selectedCell}
      />
    </Card>
  );
};
```

### 2. AccessStatistics Component

**File**: `src/components/ManajemenAkses/AccessStatistics.tsx`

```typescript
interface RoleStatistics {
  roleId: number;
  roleName: string;
  totalMenus: number;
  accessibleMenus: number;
  fullAccessCount: number;
  readOnlyCount: number;
  noAccessCount: number;
  accessPercentage: number;
}

interface AccessStatisticsProps {
  statistics: RoleStatistics[];
  roles: Role[];
}

const AccessStatistics: React.FC<AccessStatisticsProps> = ({ 
  statistics, 
  roles 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statistics.map((stat) => (
        <RoleStatCard key={stat.roleId} stat={stat} />
      ))}
    </div>
  );
};

const RoleStatCard: React.FC<{ stat: RoleStatistics }> = ({ stat }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Badge className={getRoleColorClass(stat.roleName)}>
          {stat.roleName}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Akses:</span>
            <span className="font-semibold">
              {stat.accessibleMenus}/{stat.totalMenus}
            </span>
          </div>
          <Progress value={stat.accessPercentage} className="h-2" />
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Full Access:</span>
              <span>{stat.fullAccessCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Read Only:</span>
              <span>{stat.readOnlyCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3. AccessMatrixToolbar Component

**File**: `src/components/ManajemenAkses/AccessMatrixToolbar.tsx`

```typescript
interface AccessMatrixToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  roles: Role[];
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
}

const AccessMatrixToolbar: React.FC<AccessMatrixToolbarProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  roles,
  onExpandAll,
  onCollapseAll,
  onExport
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Cari menu atau submenu..."
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
          {roles?.map((role) => (
            <SelectItem key={role.id} value={role.role_name}>
              {role.role_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onExpandAll}>
          <ChevronsDown className="h-4 w-4 mr-2" />
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={onCollapseAll}>
          <ChevronsUp className="h-4 w-4 mr-2" />
          Collapse All
        </Button>
      </div>

      <DropdownMenu open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="default">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
```


### 4. AccessMatrix Component

**File**: `src/components/ManajemenAkses/AccessMatrix.tsx`

```typescript
interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  parent_id: string | null;
  order: number;
  children?: MenuItem[];
}

interface AccessLevel {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
}

interface AccessCell {
  menuId: string;
  menuName: string;
  roleId: number;
  roleName: string;
  access: AccessLevel;
  rlsPolicy?: string;
}

interface MatrixData {
  menu: MenuItem;
  accessByRole: Map<number, AccessLevel>;
}

interface AccessMatrixProps {
  data: MatrixData[];
  roles: Role[];
  expandedMenus: Set<string>;
  onToggleMenu: (menuId: string) => void;
  onCellClick: (cell: AccessCell) => void;
}

const AccessMatrix: React.FC<AccessMatrixProps> = ({
  data,
  roles,
  expandedMenus,
  onToggleMenu,
  onCellClick
}) => {
  return (
    <div className="border rounded-lg overflow-auto max-h-[600px]">
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <TableHead className="w-[300px] sticky left-0 bg-white">
              Menu / Submenu
            </TableHead>
            {roles?.map((role) => (
              <TableHead key={role.id} className="text-center min-w-[120px]">
                <Badge className={getRoleColorClass(role.role_name)}>
                  {role.role_name}
                </Badge>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <MenuRow
              key={item.menu.id}
              menu={item.menu}
              accessByRole={item.accessByRole}
              roles={roles}
              isExpanded={expandedMenus.has(item.menu.id)}
              onToggle={() => onToggleMenu(item.menu.id)}
              onCellClick={onCellClick}
              level={0}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const MenuRow: React.FC<{
  menu: MenuItem;
  accessByRole: Map<number, AccessLevel>;
  roles: Role[];
  isExpanded: boolean;
  onToggle: () => void;
  onCellClick: (cell: AccessCell) => void;
  level: number;
}> = ({ menu, accessByRole, roles, isExpanded, onToggle, onCellClick, level }) => {
  const hasChildren = menu.children && menu.children.length > 0;
  const indent = level * 24;

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <TableCell className="sticky left-0 bg-white">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${indent}px` }}>
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onToggle}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {menu.icon && <span className="text-gray-500">{menu.icon}</span>}
            <span className={hasChildren ? 'font-semibold' : ''}>
              {menu.name}
            </span>
          </div>
        </TableCell>
        {roles?.map((role) => {
          const access = accessByRole.get(role.id);
          return (
            <TableCell
              key={role.id}
              className="text-center cursor-pointer hover:bg-gray-100"
              onClick={() => onCellClick({
                menuId: menu.id,
                menuName: menu.name,
                roleId: role.id,
                roleName: role.role_name,
                access: access || getNoAccess(),
                rlsPolicy: undefined
              })}
            >
              <AccessIndicator access={access} />
            </TableCell>
          );
        })}
      </TableRow>
      {hasChildren && isExpanded && menu.children?.map((child) => (
        <MenuRow
          key={child.id}
          menu={child}
          accessByRole={accessByRole}
          roles={roles}
          isExpanded={isExpanded}
          onToggle={() => {}}
          onCellClick={onCellClick}
          level={level + 1}
        />
      ))}
    </>
  );
};

const AccessIndicator: React.FC<{ access?: AccessLevel }> = ({ access }) => {
  if (!access || !access.canView) {
    return <X className="h-5 w-5 text-red-500 mx-auto" />;
  }

  const isFullAccess = access.canCreate && access.canUpdate && access.canDelete;
  const isReadOnly = access.canView && !access.canCreate && !access.canUpdate && !access.canDelete;

  if (isFullAccess) {
    return (
      <div className="flex items-center justify-center gap-1">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="text-xs text-gray-600">Full</span>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div className="flex items-center justify-center gap-1">
        <Eye className="h-5 w-5 text-blue-500" />
        <span className="text-xs text-gray-600">View</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <CheckCircle2 className="h-5 w-5 text-yellow-500" />
      <span className="text-xs text-gray-600">Partial</span>
    </div>
  );
};
```

### 5. PermissionDetailDialog Component

**File**: `src/components/ManajemenAkses/PermissionDetailDialog.tsx`

```typescript
interface PermissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: AccessCell | null;
}

const PermissionDetailDialog: React.FC<PermissionDetailDialogProps> = ({
  open,
  onOpenChange,
  cell
}) => {
  if (!cell) return null;

  const operations = [
    { name: 'View', allowed: cell.access.canView, icon: Eye },
    { name: 'Create', allowed: cell.access.canCreate, icon: Plus },
    { name: 'Update', allowed: cell.access.canUpdate, icon: Edit },
    { name: 'Delete', allowed: cell.access.canDelete, icon: Trash2 },
    { name: 'Export', allowed: cell.access.canExport, icon: Download },
    { name: 'Import', allowed: cell.access.canImport, icon: Upload }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Permission</DialogTitle>
          <DialogDescription>
            {cell.menuName} - {cell.roleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Operasi yang Diizinkan:</h4>
            <div className="space-y-2">
              {operations.map((op) => (
                <div key={op.name} className="flex items-center gap-2">
                  {op.allowed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <op.icon className="h-4 w-4 text-gray-500" />
                  <span className={op.allowed ? 'text-gray-900' : 'text-gray-400'}>
                    {op.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {cell.rlsPolicy && (
            <div>
              <h4 className="font-semibold mb-2">RLS Policy:</h4>
              <code className="block p-2 bg-gray-100 rounded text-xs">
                {cell.rlsPolicy}
              </code>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>
              <strong>Catatan:</strong> Permission ini dikontrol oleh kombinasi 
              role-based access control dan row-level security policies.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```


## Data Models

### Role Model

```typescript
interface Role {
  id: number;
  role_name: string;
  description: string;
  level: number; // 1=Super Admin, 2=Admin, 3=Manager, 4=User, 5=Guest
  created_at: string;
}
```

### MenuItem Model

```typescript
interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  parent_id: string | null;
  order: number;
  is_active: boolean;
  children?: MenuItem[];
}
```

### Permission Model

```typescript
interface Permission {
  id: string;
  role_id: number;
  menu_id: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_import: boolean;
  rls_policy?: string;
  conditions?: Record<string, any>;
}
```

### AccessLevel Model

```typescript
interface AccessLevel {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
}
```

### MatrixData Model

```typescript
interface MatrixData {
  menu: MenuItem;
  accessByRole: Map<number, AccessLevel>;
}
```

### RoleStatistics Model

```typescript
interface RoleStatistics {
  roleId: number;
  roleName: string;
  totalMenus: number;
  accessibleMenus: number;
  fullAccessCount: number;
  readOnlyCount: number;
  noAccessCount: number;
  accessPercentage: number;
}
```

## Service Layer

### Role Access Service

**File**: `src/services/roleAccessService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

export const fetchAllRoles = async (): Promise<Role[]> => {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('level', { ascending: true });

  if (error) throw error;
  return data;
};

export const fetchAllMenuItems = async (): Promise<MenuItem[]> => {
  // Option 1: From database table (if exists)
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    // Option 2: Fallback to hardcoded menu structure
    return getMenuStructureFromRoutes();
  }

  return buildMenuHierarchy(data);
};

export const fetchAllPermissions = async (): Promise<Permission[]> => {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*');

  if (error) throw error;
  return data;
};

export const buildAccessMatrix = (
  roles: Role[],
  menus: MenuItem[],
  permissions: Permission[]
): MatrixData[] => {
  const permissionMap = new Map<string, Permission>();
  
  permissions.forEach(perm => {
    const key = `${perm.role_id}-${perm.menu_id}`;
    permissionMap.set(key, perm);
  });

  return menus.map(menu => {
    const accessByRole = new Map<number, AccessLevel>();
    
    roles.forEach(role => {
      const key = `${role.id}-${menu.id}`;
      const perm = permissionMap.get(key);
      
      if (perm) {
        accessByRole.set(role.id, {
          canView: perm.can_view,
          canCreate: perm.can_create,
          canUpdate: perm.can_update,
          canDelete: perm.can_delete,
          canExport: perm.can_export,
          canImport: perm.can_import
        });
      } else {
        accessByRole.set(role.id, getNoAccess());
      }
    });

    return {
      menu,
      accessByRole
    };
  });
};

export const filterMatrix = (
  data: MatrixData[],
  searchQuery: string,
  roleFilter: string
): MatrixData[] => {
  let filtered = data;

  if (searchQuery) {
    filtered = filtered.filter(item =>
      item.menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.menu.children?.some(child =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }

  // Role filter is handled in rendering, not data filtering
  return filtered;
};

export const calculateStatistics = (
  data: MatrixData[],
  roles: Role[]
): RoleStatistics[] => {
  return roles.map(role => {
    const totalMenus = data.length;
    let accessibleMenus = 0;
    let fullAccessCount = 0;
    let readOnlyCount = 0;

    data.forEach(item => {
      const access = item.accessByRole.get(role.id);
      if (access && access.canView) {
        accessibleMenus++;
        
        if (access.canCreate && access.canUpdate && access.canDelete) {
          fullAccessCount++;
        } else if (!access.canCreate && !access.canUpdate && !access.canDelete) {
          readOnlyCount++;
        }
      }
    });

    return {
      roleId: role.id,
      roleName: role.role_name,
      totalMenus,
      accessibleMenus,
      fullAccessCount,
      readOnlyCount,
      noAccessCount: totalMenus - accessibleMenus,
      accessPercentage: (accessibleMenus / totalMenus) * 100
    };
  });
};

const getNoAccess = (): AccessLevel => ({
  canView: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canExport: false,
  canImport: false
});

const buildMenuHierarchy = (flatMenus: MenuItem[]): MenuItem[] => {
  const menuMap = new Map<string, MenuItem>();
  const rootMenus: MenuItem[] = [];

  flatMenus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  flatMenus.forEach(menu => {
    const menuItem = menuMap.get(menu.id)!;
    if (menu.parent_id) {
      const parent = menuMap.get(menu.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(menuItem);
      }
    } else {
      rootMenus.push(menuItem);
    }
  });

  return rootMenus;
};

const getMenuStructureFromRoutes = (): MenuItem[] => {
  // Hardcoded menu structure based on application routes
  return [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/',
      icon: 'LayoutDashboard',
      parent_id: null,
      order: 1,
      is_active: true
    },
    {
      id: 'data-master',
      name: 'Data Master',
      path: '/data-master',
      icon: 'Database',
      parent_id: null,
      order: 2,
      is_active: true,
      children: [
        {
          id: 'unit-pelayanan',
          name: 'Unit Pelayanan',
          path: '/unit-pelayanan',
          parent_id: 'data-master',
          order: 1,
          is_active: true
        },
        {
          id: 'unit-diklat',
          name: 'Unit Diklat',
          path: '/unit-diklat',
          parent_id: 'data-master',
          order: 2,
          is_active: true
        }
        // ... more submenus
      ]
    }
    // ... more menus
  ];
};
```

### Export Service

**File**: `src/services/roleAccessExportService.ts`

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = async (
  data: MatrixData[],
  roles: Role[]
): Promise<void> => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(16);
  doc.text('Matriks Akses Role', 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 14, 22);

  const headers = ['Menu', ...roles.map(r => r.role_name)];
  const rows = data.map(item => [
    item.menu.name,
    ...roles.map(role => {
      const access = item.accessByRole.get(role.id);
      if (!access || !access.canView) return '✗';
      if (access.canCreate && access.canUpdate && access.canDelete) return '✓ Full';
      if (!access.canCreate && !access.canUpdate && !access.canDelete) return '👁 View';
      return '◐ Partial';
    })
  ]);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] }
  });

  const filename = `role-access-matrix-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const exportToExcel = async (
  data: MatrixData[],
  roles: Role[]
): Promise<void> => {
  const workbook = XLSX.utils.book_new();

  // Create summary sheet
  const summaryData = [
    ['Matriks Akses Role'],
    ['Generated:', new Date().toLocaleString('id-ID')],
    [],
    ['Menu', ...roles.map(r => r.role_name)]
  ];

  data.forEach(item => {
    summaryData.push([
      item.menu.name,
      ...roles.map(role => {
        const access = item.accessByRole.get(role.id);
        if (!access || !access.canView) return 'No Access';
        if (access.canCreate && access.canUpdate && access.canDelete) return 'Full Access';
        if (!access.canCreate && !access.canUpdate && !access.canDelete) return 'Read Only';
        return 'Partial Access';
      })
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Create detailed sheet per role
  roles.forEach(role => {
    const roleData = [
      [`Detail Akses - ${role.role_name}`],
      [],
      ['Menu', 'View', 'Create', 'Update', 'Delete', 'Export', 'Import']
    ];

    data.forEach(item => {
      const access = item.accessByRole.get(role.id);
      roleData.push([
        item.menu.name,
        access?.canView ? 'Yes' : 'No',
        access?.canCreate ? 'Yes' : 'No',
        access?.canUpdate ? 'Yes' : 'No',
        access?.canDelete ? 'Yes' : 'No',
        access?.canExport ? 'Yes' : 'No',
        access?.canImport ? 'Yes' : 'No'
      ]);
    });

    const roleSheet = XLSX.utils.aoa_to_sheet(roleData);
    XLSX.utils.book_append_sheet(workbook, roleSheet, role.role_name);
  });

  const filename = `role-access-matrix-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export const exportToCSV = async (
  data: MatrixData[],
  roles: Role[]
): Promise<void> => {
  const headers = ['Menu', ...roles.map(r => r.role_name)];
  const rows = data.map(item => [
    item.menu.name,
    ...roles.map(role => {
      const access = item.accessByRole.get(role.id);
      if (!access || !access.canView) return 'No Access';
      if (access.canCreate && access.canUpdate && access.canDelete) return 'Full Access';
      if (!access.canCreate && !access.canUpdate && !access.canDelete) return 'Read Only';
      return 'Partial Access';
    })
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `role-access-matrix-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tab Click Displays Matrix
*For any* user role, when clicking the "Rincian Role Akses" tab, the access matrix should be displayed
**Validates: Requirements 1.2**

### Property 2: Loading State Visibility
*For any* data loading scenario, a loading indicator should be visible while data is being fetched
**Validates: Requirements 1.4, 13.2**

### Property 3: Error Message Display
*For any* error that occurs during data fetching, a clear and actionable error message should be displayed
**Validates: Requirements 1.5, 13.4**

### Property 4: Role Header Completeness
*For any* set of roles in the database, all roles should be displayed as column headers in the matrix
**Validates: Requirements 2.1**

### Property 5: Role Ordering Consistency
*For any* set of roles, they should always be displayed in the order: Super Admin, Admin, Manager, User, Guest
**Validates: Requirements 2.2**

### Property 6: Role Badge Color Uniqueness
*For any* set of roles, each role should have a unique color class for its badge
**Validates: Requirements 2.3**

### Property 7: Role Description Display
*For any* role, a description should be displayed alongside the role name
**Validates: Requirements 2.4**

### Property 8: Menu Row Completeness
*For any* set of menus in the database, all menus should be displayed as rows in the matrix
**Validates: Requirements 3.1**

### Property 9: Submenu Hierarchical Grouping
*For any* menu with submenus, the submenus should be grouped under the parent menu
**Validates: Requirements 3.2**

### Property 10: Indentation by Level
*For any* menu at level N, the indentation should be N * 24 pixels
**Validates: Requirements 3.3**

### Property 11: Icon Conditional Display
*For any* menu with an icon property, the icon should be displayed; menus without icons should not show an icon placeholder
**Validates: Requirements 3.4**

### Property 12: Expand Button for Parents
*For any* menu with children, an expand/collapse button should be displayed; menus without children should not have this button
**Validates: Requirements 3.5**

### Property 13: Matrix Cell Completeness
*For any* set of roles R and menus M, the matrix should contain exactly |R| × |M| cells
**Validates: Requirements 4.1**

### Property 14: Full Access Indicator
*For any* role-menu combination where the role has view, create, update, and delete permissions, a green checkmark icon should be displayed
**Validates: Requirements 4.2**

### Property 15: No Access Indicator
*For any* role-menu combination where the role has no view permission, a red X icon or empty cell should be displayed
**Validates: Requirements 4.3**

### Property 16: Read-Only Access Indicator
*For any* role-menu combination where the role has only view permission (no create, update, delete), a blue eye icon should be displayed
**Validates: Requirements 4.4**

### Property 17: Role Filter Column Visibility
*For any* role selected in the filter, only that role's column should be visible in the matrix (except when "all" is selected)
**Validates: Requirements 5.2**

### Property 18: Filter State Persistence
*For any* filter state, navigating away from the tab and returning should preserve the filter selection
**Validates: Requirements 5.4**

### Property 19: Filtered Statistics Accuracy
*For any* role filter applied, the displayed accessible menu count should match the number of menus where that role has view permission
**Validates: Requirements 5.5**

### Property 20: Search Filtering Accuracy
*For any* search query, only menus whose names contain the query (case-insensitive) should be displayed
**Validates: Requirements 6.2**

### Property 21: Search Auto-Expand Parent
*For any* search query that matches a submenu, the parent menu should be automatically expanded
**Validates: Requirements 6.3**

### Property 22: Chevron Display for Parents
*For any* menu with children, a chevron icon should be displayed; menus without children should not have a chevron
**Validates: Requirements 7.1**

### Property 23: Expand/Collapse Toggle
*For any* menu, clicking the chevron should toggle between expanded and collapsed states
**Validates: Requirements 7.2**

### Property 24: Expanded Menu Shows Children
*For any* expanded menu with children, all child menus should be visible with proper indentation
**Validates: Requirements 7.3**

### Property 25: Collapsed Menu Hides Children
*For any* collapsed menu with children, all child menus should be hidden
**Validates: Requirements 7.4**

### Property 26: Permission Dialog Operations List
*For any* access cell clicked, the detail dialog should display all 6 operations (view, create, update, delete, export, import) with their allowed/denied status
**Validates: Requirements 8.2**

### Property 27: RLS Policy Conditional Display
*For any* permission with an associated RLS policy, the policy should be displayed in the detail dialog; permissions without policies should not show a policy section
**Validates: Requirements 8.3**

### Property 28: Special Conditions Display
*For any* permission with special conditions, those conditions should be displayed in the detail dialog
**Validates: Requirements 8.4**

### Property 29: PDF Export Completeness
*For any* matrix data, the exported PDF should contain all visible menus and roles with their access indicators
**Validates: Requirements 9.3**

### Property 30: Excel Export Sheet Structure
*For any* matrix data with N roles, the exported Excel should contain N+1 sheets (1 summary + 1 per role)
**Validates: Requirements 9.4**

### Property 31: Export Filename Pattern
*For any* export operation, the downloaded file should have the name pattern "role-access-matrix-YYYY-MM-DD.{ext}"
**Validates: Requirements 9.5**

### Property 32: Database Error Fallback
*For any* database query error, if cached data exists, it should be displayed; otherwise, an error message should be shown
**Validates: Requirements 10.5**

### Property 33: Statistics Count Accuracy
*For any* role, the displayed accessible menu count should equal the number of menus where that role has view permission
**Validates: Requirements 11.2**

### Property 34: Statistics Percentage Accuracy
*For any* role with A accessible menus out of T total menus, the displayed percentage should be (A/T) × 100
**Validates: Requirements 11.3**

### Property 35: Export Loading State
*For any* export operation in progress, the export button should display a loading spinner
**Validates: Requirements 13.3**

### Property 36: Success Notification Display
*For any* successful operation (export, data refresh), a success notification should be displayed
**Validates: Requirements 13.5**

### Property 37: Guest Role Visibility Restriction
*For any* user with Guest role, only Guest role information should be visible in the matrix
**Validates: Requirements 15.1**

### Property 38: User Role Visibility Restriction
*For any* user with User role, only User and Guest role information should be visible in the matrix
**Validates: Requirements 15.2**

### Property 39: Manager Role Visibility Restriction
*For any* user with Manager role, only Manager, User, and Guest role information should be visible in the matrix
**Validates: Requirements 15.3**

### Property 40: Admin Role Visibility Restriction
*For any* user with Admin role, all roles except Super Admin should be visible in the matrix
**Validates: Requirements 15.4**

### Property 41: Super Admin Full Visibility
*For any* user with Super Admin role, all roles should be visible in the matrix without restrictions
**Validates: Requirements 15.5**


## Error Handling

### Data Fetching Errors

```typescript
const handleFetchError = (error: Error, dataType: string) => {
  console.error(`Error fetching ${dataType}:`, error);
  
  toast({
    title: 'Error',
    description: `Gagal memuat ${dataType}. Silakan coba lagi.`,
    variant: 'destructive',
    action: (
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Coba Lagi
      </Button>
    )
  });
};
```

### Export Errors

```typescript
const handleExportError = (error: Error, format: string) => {
  console.error(`Error exporting to ${format}:`, error);
  
  toast({
    title: 'Export Gagal',
    description: `Gagal mengexport ke format ${format}. ${error.message}`,
    variant: 'destructive'
  });
};
```

### Permission Errors

```typescript
const handlePermissionError = () => {
  toast({
    title: 'Akses Ditolak',
    description: 'Anda tidak memiliki permission untuk melihat informasi ini.',
    variant: 'destructive'
  });
};
```

## Testing Strategy

### Unit Testing

**Test Coverage:**
- Component rendering dengan berbagai props
- Event handlers (click, hover, search, filter)
- Data transformation functions (buildAccessMatrix, filterMatrix, calculateStatistics)
- Export functions (PDF, Excel, CSV generation)
- Error handling scenarios

**Test Files:**
- `src/test/components/RoleAccessDetailsTab.test.tsx`
- `src/test/components/AccessMatrix.test.tsx`
- `src/test/components/AccessStatistics.test.tsx`
- `src/test/components/PermissionDetailDialog.test.tsx`
- `src/test/services/roleAccessService.test.ts`
- `src/test/services/roleAccessExportService.test.ts`

### Property-Based Testing

**Library:** fast-check (already installed)

**Test Configuration:**
- Minimum 100 iterations per property
- Use custom arbitraries for domain models (Role, MenuItem, Permission)
- Test universal properties across all valid inputs

**Property Tests:**
- Property 1-41 as defined in Correctness Properties section
- Each property implemented as a separate test
- Tagged with format: `**Feature: role-access-details, Property N: [property text]**`

**Test Files:**
- `src/test/property/role-access-matrix.test.ts`
- `src/test/property/role-access-filtering.test.ts`
- `src/test/property/role-access-export.test.ts`
- `src/test/property/role-access-visibility.test.ts`

### Integration Testing

**Test Scenarios:**
- Complete user flow: load tab → filter → search → view details → export
- Role-based access control: verify visibility restrictions per role
- Data consistency: verify matrix data matches database state
- Export functionality: verify exported files contain correct data

**Test Files:**
- `src/test/integration/role-access-details-flow.test.ts`

## Performance Considerations

### Data Optimization

1. **Memoization:**
   - Use `useMemo` for matrix data computation
   - Use `useMemo` for filtered data
   - Use `useMemo` for statistics calculation
   - Wrap pure components with `React.memo`

2. **React Query Caching:**
   - Cache roles data: `staleTime: 10 minutes`
   - Cache menus data: `staleTime: 10 minutes`
   - Cache permissions data: `staleTime: 5 minutes`
   - Invalidate cache on permission changes

3. **Virtualization (if needed):**
   - If menu count > 100, implement virtual scrolling with `react-virtual`
   - Render only visible rows in viewport
   - Maintain scroll position on filter/search

### Rendering Optimization

1. **Lazy Loading:**
   - Lazy load PermissionDetailDialog
   - Lazy load export libraries (jsPDF, XLSX) only when needed

2. **Debouncing:**
   - Debounce search input: 300ms delay
   - Debounce filter changes: 200ms delay

3. **Code Splitting:**
   - Split RoleAccessDetailsTab into separate chunk
   - Split export functionality into separate chunk

## Database Schema

### Tables Required

**roles** (existing)
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**menu_items** (new - optional, can use hardcoded structure)
```sql
CREATE TABLE menu_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(200),
  icon VARCHAR(50),
  parent_id VARCHAR(50) REFERENCES menu_items(id),
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**role_permissions** (new)
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  menu_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  can_import BOOLEAN DEFAULT FALSE,
  rls_policy TEXT,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, menu_id)
);
```

**permission_changelog** (new - for history tracking)
```sql
CREATE TABLE permission_changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER REFERENCES roles(id),
  menu_id VARCHAR(50) REFERENCES menu_items(id),
  changed_by UUID REFERENCES auth.users(id),
  change_type VARCHAR(20), -- 'create', 'update', 'delete'
  old_permissions JSONB,
  new_permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Migration Script

**File:** `database/migrations/20241127_create_role_access_tables.sql`

```sql
-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(200),
  icon VARCHAR(50),
  parent_id VARCHAR(50) REFERENCES menu_items(id),
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  menu_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  can_import BOOLEAN DEFAULT FALSE,
  rls_policy TEXT,
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, menu_id)
);

-- Create permission_changelog table
CREATE TABLE IF NOT EXISTS permission_changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER REFERENCES roles(id),
  menu_id VARCHAR(50) REFERENCES menu_items(id),
  changed_by UUID REFERENCES auth.users(id),
  change_type VARCHAR(20),
  old_permissions JSONB,
  new_permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_menu ON role_permissions(menu_id);
CREATE INDEX idx_permission_changelog_role ON permission_changelog(role_id);
CREATE INDEX idx_permission_changelog_menu ON permission_changelog(menu_id);
CREATE INDEX idx_permission_changelog_created ON permission_changelog(created_at DESC);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all authenticated users"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to role_permissions based on user role"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    -- Super admin can see all
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'mukhsin9@gmail.com'
    OR
    -- Others can see their role and below
    role_id >= (
      SELECT r.id FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Allow read access to permission_changelog for admins"
  ON permission_changelog FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.role_name IN ('Super Admin', 'Admin')
    )
  );
```

## Security Considerations

### Role-Based Visibility

- Implement client-side filtering based on user role
- Verify role on server-side via RLS policies
- Log all access to sensitive permission data
- Prevent information leakage through error messages

### Data Protection

- Never expose Super Admin permissions to non-Super Admin users
- Sanitize permission data before export
- Validate user role before allowing export
- Rate limit export operations to prevent abuse

### Audit Trail

- Log all permission changes in permission_changelog
- Log all export operations in tenant_audit_log
- Include user_id, IP address, and timestamp in logs
- Retain logs for compliance requirements

## Future Enhancements

### Phase 2 Features

1. **Permission Editing:**
   - Inline editing of permissions in matrix
   - Bulk permission updates
   - Permission templates

2. **Advanced Filtering:**
   - Filter by access level (full, read-only, no access)
   - Filter by menu category
   - Saved filter presets

3. **Visualization:**
   - Heatmap view of access matrix
   - Chart showing access distribution
   - Comparison view between roles

4. **History & Audit:**
   - Full changelog viewer
   - Diff view for permission changes
   - Rollback capability

5. **Export Enhancements:**
   - Custom export templates
   - Scheduled exports
   - Email export results

