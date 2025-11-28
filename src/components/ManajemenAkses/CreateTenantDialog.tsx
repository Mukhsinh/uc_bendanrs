import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createTenant } from '@/services/tenantManagement';
import type { CreateTenantFormData } from '@/types/tenant-management';

const createTenantSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  slug: z.string()
    .min(3, 'Slug minimal 3 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug harus format kebab-case (huruf kecil, angka, dan tanda hubung)'),
  adminEmail: z.string().email('Format email tidak valid'),
  adminPassword: z.string().min(8, 'Password minimal 8 karakter'),
  adminName: z.string().min(3, 'Nama admin minimal 3 karakter')
});

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateTenantDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateTenantDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      adminEmail: '',
      adminPassword: '',
      adminName: ''
    }
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setValue('name', name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setValue('slug', slug);
  };

  const onSubmit = async (data: CreateTenantFormData) => {
    setSubmitting(true);
    try {
      console.log('Submitting tenant creation:', data);
      const result = await createTenant(data);

      console.log('Create tenant response:', result);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Tenant baru berhasil dibuat'
        });
        
        // Reset form dan close dialog
        reset();
        onOpenChange(false);
        
        // Invalidate semua query yang berhubungan dengan tenant
        await queryClient.invalidateQueries({ queryKey: ['tenants'] });
        
        // Tunggu sebentar untuk memastikan data sudah tersimpan
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Call onSuccess untuk trigger refetch
        try {
          onSuccess();
        } catch (refreshError) {
          console.error('Error during refresh:', refreshError);
          // Jangan tampilkan error ke user karena tenant sudah berhasil dibuat
          // User bisa refresh manual jika perlu
        }
      } else {
        console.error('Failed to create tenant:', result.message);
        toast({
          title: 'Error',
          description: result.message || 'Gagal membuat tenant',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Exception during tenant creation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal membuat tenant',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Tenant Baru</DialogTitle>
          <DialogDescription>
            Buat rumah sakit baru dengan admin pertama
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Rumah Sakit *</Label>
            <Input
              id="name"
              {...register('name')}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="RS Umum Contoh"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="rs-umum-contoh"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: huruf kecil, angka, dan tanda hubung
            </p>
            {errors.slug && (
              <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
            )}
          </div>

          <Separator />

          <div>
            <Label htmlFor="adminEmail">Email Admin *</Label>
            <Input
              id="adminEmail"
              type="email"
              {...register('adminEmail')}
              placeholder="admin@rs.com"
            />
            {errors.adminEmail && (
              <p className="text-sm text-red-600 mt-1">{errors.adminEmail.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="adminName">Nama Admin *</Label>
            <Input
              id="adminName"
              {...register('adminName')}
              placeholder="John Doe"
            />
            {errors.adminName && (
              <p className="text-sm text-red-600 mt-1">{errors.adminName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="adminPassword">Password Admin *</Label>
            <Input
              id="adminPassword"
              type="password"
              {...register('adminPassword')}
              placeholder="Minimal 8 karakter"
            />
            {errors.adminPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.adminPassword.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
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
      </DialogContent>
    </Dialog>
  );
}
