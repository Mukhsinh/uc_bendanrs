import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tenant } from '@/types/tenant-management';

interface UseTenantsOptions {
  search?: string;
  statusFilter?: 'all' | 'active' | 'inactive';
}

/**
 * Custom hook untuk fetch dan manage tenants data
 * 
 * Features:
 * - Automatic caching dengan React Query
 * - Search filtering
 * - Status filtering
 * - Refetch capability
 * 
 * @param options - Search dan filter options
 * @returns Query result dengan data, loading state, error, dan refetch function
 */
export function useTenants(options: UseTenantsOptions = {}): UseQueryResult<Tenant[], Error> {
  const { search = '', statusFilter = 'all' } = options;

  return useQuery({
    queryKey: ['tenants', search, statusFilter],
    queryFn: async () => {
      try {
        console.log('Fetching tenants with params:', { search, statusFilter });
        
        // Gunakan RPC function untuk mendapatkan tenant dengan user count yang benar
        const { data, error } = await supabase.rpc('get_tenants_with_user_count', {
          p_search: search || null,
          p_status_filter: statusFilter
        });

        if (error) {
          console.error('Error fetching tenants:', error);
          throw new Error(`Gagal memuat tenant: ${error.message}`);
        }

        console.log('Tenants fetched successfully:', data?.length || 0, 'tenants');
        return data as Tenant[];
      } catch (error) {
        console.error('Exception in useTenants:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - lebih pendek untuk data yang sering berubah
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry 2 kali jika gagal
    retryDelay: 1000, // Delay 1 detik antara retry
  });
}
