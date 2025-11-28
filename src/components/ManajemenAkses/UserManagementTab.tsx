import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Shield, UserX, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUsers,
  getAllRoles,
  createUserWithRole,
  assignRoleToUser,
  toggleUserStatus,
  getRoleColorClass,
  type UserWithRole,
  type Role
} from '@/lib/userManagement';
import { UserSearchFilter } from './SearchFilter';

export default function UserManagementTab() {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const { user: currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state untuk change role
  const [selectedRole, setSelectedRole] = useState('');

  // Debounce search query dengan delay 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', debouncedSearchQuery, roleFilter, statusFilter],
    queryFn: () => fetchUsers(debouncedSearchQuery, roleFilter, statusFilter),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: getAllRoles,
    staleTime: 10 * 60 * 1000, // 10 minutes (roles rarely change)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const handleChangeRole = async () => {
    if (!selectedUser || !selectedRole) return;

    // Validasi: User tidak bisa mengubah role mereka sendiri
    if (currentUser?.id === selectedUser.id) {
      toast({
        title: 'Tidak Diizinkan',
        description: 'Anda tidak dapat mengubah role Anda sendiri',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await assignRoleToUser(selectedUser.id, selectedRole);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Role berhasil diubah'
        });
        setShowRoleDialog(false);
        setSelectedUser(null);
        setSelectedRole('');
        refetch();
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
        description: 'Gagal mengubah role',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user: UserWithRole) => {
    // Validasi: User tidak bisa menonaktifkan diri sendiri
    if (currentUser?.id === user.id) {
      toast({
        title: 'Tidak Diizinkan',
        description: 'Anda tidak dapat menonaktifkan akun Anda sendiri',
        variant: 'destructive'
      });
      return;
    }

    const isActive = user.role_is_active;
    
    try {
      const result = await toggleUserStatus(user.id, !isActive);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `User berhasil ${isActive ? 'dinonaktifkan' : 'diaktifkan'}`
        });
        refetch();
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
        description: `Gagal ${isActive ? 'menonaktifkan' : 'mengaktifkan'} user`,
        variant: 'destructive'
      });
    }
  };

  const openRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role_name);
    setShowRoleDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Daftar User</CardTitle>
          {tenant && (
            <CardDescription>
              Tenant: <span className="font-semibold">{tenant.name}</span>
              <br />
              <span className="text-xs text-gray-500">
                Untuk menambah user, buka tab "Kelola Tenant" dan klik tenant yang diinginkan
              </span>
            </CardDescription>
          )}
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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Tidak ada user
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {user.tenant_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColorClass(user.role_name)}>
                        {user.role_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role_is_active ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoleDialog(user)}
                        disabled={currentUser?.id === user.id}
                        title={currentUser?.id === user.id ? 'Tidak dapat mengubah role sendiri' : 'Ubah role user'}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Ubah Role
                      </Button>
                      <Button
                        variant={user.role_is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={currentUser?.id === user.id}
                        title={currentUser?.id === user.id ? 'Tidak dapat menonaktifkan akun sendiri' : `${user.role_is_active ? 'Nonaktifkan' : 'Aktifkan'} user`}
                      >
                        {user.role_is_active ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aktifkan
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role User</DialogTitle>
            <DialogDescription>
              Ubah role untuk {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="changeRole">Role Baru</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.role_name}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleChangeRole} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengubah...
                </>
              ) : (
                'Ubah Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

