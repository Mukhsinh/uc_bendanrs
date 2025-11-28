/**
 * TenantSelector Component
 * Allows super admin to switch between tenants
 */

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface TenantSelectorProps {
  className?: string;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ className }) => {
  const { tenant: currentTenant, refreshTenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Load all tenants (super admin only)
  useEffect(() => {
    loadTenants();
  }, []);

  // Set current tenant as selected
  useEffect(() => {
    if (currentTenant) {
      setSelectedTenantId(currentTenant.id);
    }
  }, [currentTenant]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, is_active')
        .order('name');

      if (error) throw error;

      setTenants(data || []);
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      toast.error('Gagal memuat daftar tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSwitch = async (tenantId: string) => {
    if (tenantId === selectedTenantId) {
      setOpen(false);
      return;
    }

    try {
      // Get the selected tenant
      const selectedTenant = tenants.find(t => t.id === tenantId);
      if (!selectedTenant) {
        toast.error('Tenant tidak ditemukan');
        return;
      }

      if (!selectedTenant.is_active) {
        toast.error('Tenant tidak aktif');
        return;
      }

      // Update session storage with new tenant context
      sessionStorage.setItem('tenant_id', selectedTenant.id);
      sessionStorage.setItem('tenant_name', selectedTenant.name);

      // Refresh tenant context
      await refreshTenant();

      setSelectedTenantId(tenantId);
      setOpen(false);

      toast.success(`Beralih ke tenant: ${selectedTenant.name}`);

      // Reload page to apply new tenant context
      window.location.reload();
    } catch (error: any) {
      console.error('Error switching tenant:', error);
      toast.error('Gagal beralih tenant');
    }
  };

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-[280px] justify-between bg-white/90 backdrop-blur-sm border-teal-200 hover:bg-white hover:border-teal-300',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
            <span className="truncate">
              {selectedTenant ? selectedTenant.name : 'Pilih tenant...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Cari tenant..." />
          <CommandEmpty>Tenant tidak ditemukan.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Memuat tenant...
              </div>
            ) : (
              tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  value={tenant.name}
                  onSelect={() => handleTenantSwitch(tenant.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedTenantId === tenant.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">{tenant.slug}</span>
                  </div>
                  {!tenant.is_active && (
                    <span className="ml-2 text-xs text-red-500">(Nonaktif)</span>
                  )}
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TenantSelector;
