import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TenantUserList from './TenantUserList';
import type { Tenant } from '@/types/tenant-management';

interface TenantTableProps {
  tenants: Tenant[];
  isLoading: boolean;
  expandedTenantId: string | null;
  onToggleExpand: (tenantId: string | null) => void;
  onToggleStatus: (tenantId: string, currentStatus: boolean) => Promise<void>;
  onRefetch: () => void;
}

const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  isLoading,
  expandedTenantId,
  onToggleExpand,
  onToggleStatus,
  onRefetch
}) => {
  const { toast } = useToast();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    setTogglingId(tenantId);
    try {
      await onToggleStatus(tenantId, currentStatus);
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditClick = (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTenant(tenant);
    setEditName(tenant.name);
  };

  const handleSaveEdit = async () => {
    if (!editingTenant || !editName.trim()) {
      toast({
        title: 'Validasi Error',
        description: 'Nama tenant tidak boleh kosong',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          name: editName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTenant.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Nama tenant berhasil diubah'
      });

      setEditingTenant(null);
      setEditName('');
      onRefetch();
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah nama tenant',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Tidak ada tenant ditemukan
      </div>
    );
  }

  return (
    <>
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
                <div className="flex items-center gap-2">
                  <Switch
                    checked={tenant.is_active}
                    onCheckedChange={() => handleToggleStatus(tenant.id, tenant.is_active)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={togglingId === tenant.id}
                  />
                  <span className="text-sm">
                    {tenant.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {new Date(tenant.created_at).toLocaleDateString('id-ID')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleEditClick(tenant, e)}
                  title="Edit nama tenant"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>

            {expandedTenantId === tenant.id && (
              <TableRow>
                <TableCell colSpan={6} className="bg-gray-50 p-0">
                  <TenantUserList tenantId={tenant.id} />
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>

    {/* Edit Tenant Dialog */}
    <Dialog open={!!editingTenant} onOpenChange={() => setEditingTenant(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Nama Tenant</DialogTitle>
          <DialogDescription>
            Ubah nama tenant. Slug tidak dapat diubah.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tenant-name">Nama Rumah Sakit</Label>
            <Input
              id="tenant-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Masukkan nama rumah sakit"
            />
          </div>
          <div>
            <Label>Slug (tidak dapat diubah)</Label>
            <Input
              value={editingTenant?.slug || ''}
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setEditingTenant(null)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button onClick={handleSaveEdit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default TenantTable;
