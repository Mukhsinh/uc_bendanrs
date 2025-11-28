import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fetchUsersByTenant } from '@/services/tenantManagement';
import { getRoleColorClass, getAllRoles, createUserWithRole } from '@/lib/userManagement';

interface TenantUserListProps {
  tenantId: string;
}

const TenantUserList: React.FC<TenantUserListProps> = ({ tenantId }) => {
  const { toast } = useToast();
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: () => fetchUsersByTenant(tenantId),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: getAllRoles,
    staleTime: 10 * 60 * 1000,
  });

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserRole) {
      toast({
        title: 'Validasi Error',
        description: 'Email, password, dan role harus diisi',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUserWithRole(
        newUserEmail,
        newUserPassword,
        newUserRole,
        newUserFullName || undefined,
        tenantId
      );

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'User berhasil ditambahkan ke tenant'
        });
        setShowAddUserDialog(false);
        resetForm();
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
        description: 'Gagal menambahkan user',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserFullName('');
    setNewUserRole('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-sm text-gray-700">
          User dalam Tenant ({users?.length || 0})
        </h4>
        <Button
          size="sm"
          onClick={() => setShowAddUserDialog(true)}
          className="h-8"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Tambah User
        </Button>
      </div>

      {!users || users.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Tidak ada user dalam tenant ini
        </div>
      ) : (
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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email || '-'}</TableCell>
                <TableCell>{user.full_name || '-'}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User ke Tenant</DialogTitle>
            <DialogDescription>
              User baru akan otomatis ditambahkan ke tenant ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
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
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                'Tambah User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantUserList;
