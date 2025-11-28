import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Eye, Edit, Trash2, Download, Upload, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AccessLevel } from '@/services/roleAccessService';

interface PermissionDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
  menuName: string;
  access: AccessLevel | undefined;
  roleId?: string; // UUID
  menuId?: string;
  onSave?: (roleId: string, menuId: string, permissions: AccessLevel) => Promise<void>;
}

export const PermissionDetailDialog = ({
  isOpen,
  onClose,
  roleName,
  menuName,
  access,
  roleId,
  menuId,
  onSave
}: PermissionDetailDialogProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedAccess, setEditedAccess] = useState<AccessLevel | undefined>(access);

  if (!access) return null;

  // Reset edited access when dialog opens or access changes
  useState(() => {
    setEditedAccess(access);
  });

  const operations = [
    { name: 'View', key: 'canView', icon: Eye, allowed: isEditing ? editedAccess?.canView : access.canView },
    { name: 'Create', key: 'canCreate', icon: Edit, allowed: isEditing ? editedAccess?.canCreate : access.canCreate },
    { name: 'Update', key: 'canUpdate', icon: Edit, allowed: isEditing ? editedAccess?.canUpdate : access.canUpdate },
    { name: 'Delete', key: 'canDelete', icon: Trash2, allowed: isEditing ? editedAccess?.canDelete : access.canDelete },
    { name: 'Export', key: 'canExport', icon: Download, allowed: isEditing ? editedAccess?.canExport : access.canExport },
    { name: 'Import', key: 'canImport', icon: Upload, allowed: isEditing ? editedAccess?.canImport : access.canImport }
  ];

  const handleTogglePermission = (key: string) => {
    if (!isEditing || !editedAccess) return;
    
    setEditedAccess({
      ...editedAccess,
      [key]: !editedAccess[key as keyof AccessLevel]
    });
  };

  const handleSave = async () => {
    if (!onSave || !roleId || !menuId || !editedAccess) {
      toast({
        title: 'Error',
        description: 'Tidak dapat menyimpan perubahan',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(roleId, menuId, editedAccess);
      toast({
        title: 'Berhasil',
        description: 'Permission berhasil diperbarui'
      });
      setIsEditing(false);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menyimpan perubahan',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedAccess(access);
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Permission</DialogTitle>
          <DialogDescription>
            Rincian akses untuk <strong>{roleName}</strong> pada menu <strong>{menuName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Operations List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold">Operasi yang Diizinkan</h4>
              {!isEditing && onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Permission
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {operations.map((op) => {
                const Icon = op.icon;
                return (
                  <div
                    key={op.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      op.allowed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    } ${isEditing ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                    onClick={() => isEditing && handleTogglePermission(op.key)}
                  >
                    <Icon className={`h-5 w-5 ${op.allowed ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="flex-1 font-medium">{op.name}</span>
                    {isEditing ? (
                      <Switch
                        checked={op.allowed || false}
                        onCheckedChange={() => handleTogglePermission(op.key)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : op.allowed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Access Level Summary */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Tingkat Akses</h4>
            <Badge
              variant="outline"
              className={
                (isEditing ? editedAccess : access)?.canCreate && 
                (isEditing ? editedAccess : access)?.canUpdate && 
                (isEditing ? editedAccess : access)?.canDelete
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : !(isEditing ? editedAccess : access)?.canCreate && 
                    !(isEditing ? editedAccess : access)?.canUpdate && 
                    !(isEditing ? editedAccess : access)?.canDelete
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-300'
              }
            >
              {(isEditing ? editedAccess : access)?.canCreate && 
               (isEditing ? editedAccess : access)?.canUpdate && 
               (isEditing ? editedAccess : access)?.canDelete
                ? 'Akses Penuh'
                : !(isEditing ? editedAccess : access)?.canCreate && 
                  !(isEditing ? editedAccess : access)?.canUpdate && 
                  !(isEditing ? editedAccess : access)?.canDelete
                ? 'Hanya Lihat'
                : 'Akses Sebagian'}
            </Badge>
          </div>

          {/* Note */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Catatan:</strong> Permission ini dikombinasikan dengan Row Level Security (RLS) 
              untuk memastikan keamanan data yang lebih ketat.
            </p>
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Tutup</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
