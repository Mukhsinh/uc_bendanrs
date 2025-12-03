import { supabase } from '@/integrations/supabase/client';

export interface TenantOnboardingData {
  // Tenant information
  tenantName: string;
  tenantSlug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  
  // Admin user credentials
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  
  // Optional settings
  includeJasaPelayanan?: boolean;
  defaultCurrency?: string;
}

export interface OnboardingResult {
  success: boolean;
  tenantId?: string;
  adminUserId?: string;
  error?: string;
  details?: any;
}

/**
 * Membuat tenant baru dengan admin user dan default data
 * Menggunakan RPC function dengan SECURITY DEFINER untuk elevated privileges
 */
export async function createTenant(data: TenantOnboardingData): Promise<OnboardingResult> {
  try {
    // Validasi slug format di client-side
    const slugValidation = validateTenantSlug(data.tenantSlug);
    if (!slugValidation.valid) {
      return {
        success: false,
        error: slugValidation.error
      };
    }

    // Validasi password minimal 8 karakter
    if (!data.adminPassword || data.adminPassword.length < 8) {
      return {
        success: false,
        error: 'Password admin minimal 8 karakter'
      };
    }

    console.log('Calling create_tenant_with_admin with params:', {
      p_tenant_name: data.tenantName,
      p_tenant_slug: data.tenantSlug,
      p_admin_email: data.adminEmail,
      p_admin_full_name: data.adminFullName
    });

    // Panggil RPC function untuk membuat tenant
    const { data: result, error } = await supabase.rpc('create_tenant_with_admin', {
      p_tenant_name: data.tenantName,
      p_tenant_slug: data.tenantSlug,
      p_admin_email: data.adminEmail,
      p_admin_password: data.adminPassword,
      p_admin_full_name: data.adminFullName,
      p_logo_url: data.logoUrl || null,
      p_primary_color: data.primaryColor || '#6366f1',
      p_secondary_color: data.secondaryColor || '#8b5cf6',
      p_include_jasa_pelayanan: data.includeJasaPelayanan ?? true,
      p_default_currency: data.defaultCurrency || 'IDR'
    });

    console.log('RPC Response:', { result, error, resultType: typeof result });

    if (error) {
      console.error('RPC error:', error);
      return {
        success: false,
        error: error.message || 'Gagal memanggil fungsi create_tenant_with_admin',
        details: error
      };
    }

    // Handle case jika result adalah null atau undefined
    if (result === null || result === undefined) {
      console.error('RPC returned null/undefined result');
      return {
        success: false,
        error: 'Server tidak mengembalikan response. Silakan coba lagi.'
      };
    }

    // Parse result jika berupa string JSON
    let parsedResult = result;
    if (typeof result === 'string') {
      try {
        parsedResult = JSON.parse(result);
        console.log('Parsed JSON result:', parsedResult);
      } catch (parseError) {
        console.error('Failed to parse JSON result:', parseError);
        return {
          success: false,
          error: 'Format response dari server tidak valid'
        };
      }
    }

    // Pastikan parsedResult adalah object
    if (typeof parsedResult !== 'object' || Array.isArray(parsedResult)) {
      console.error('Invalid response type:', typeof parsedResult, parsedResult);
      return {
        success: false,
        error: 'Response tidak valid dari server'
      };
    }

    // Jika RPC return error (cek dengan berbagai cara)
    if (parsedResult.success === false || parsedResult.success === 'false') {
      console.error('Function returned error:', parsedResult);
      const errorMessage = parsedResult.error || parsedResult.message || 'Gagal membuat tenant';
      return {
        success: false,
        error: errorMessage,
        details: parsedResult.details || parsedResult
      };
    }

    // Validasi response success
    if (parsedResult.success !== true && parsedResult.success !== 'true') {
      // Cek apakah ada tenant_id sebagai indikator success
      if (!parsedResult.tenant_id && !parsedResult.tenantId) {
        console.error('Response tidak menunjukkan success dan tidak ada tenant_id:', parsedResult);
        return {
          success: false,
          error: parsedResult.error || parsedResult.message || 'Gagal membuat tenant. Response tidak valid.',
          details: parsedResult
        };
      }
    }

    // Success - extract tenant_id dan admin_user_id
    const tenantId = parsedResult.tenant_id || parsedResult.tenantId;
    const adminUserId = parsedResult.admin_user_id || parsedResult.adminUserId;

    if (!tenantId) {
      console.error('Success response but missing tenant_id:', parsedResult);
      return {
        success: false,
        error: 'Tenant berhasil dibuat tetapi ID tidak ditemukan dalam response'
      };
    }

    console.log('Tenant created successfully:', { tenantId, adminUserId, fullResult: parsedResult });
    return {
      success: true,
      tenantId: tenantId,
      adminUserId: adminUserId
    };

  } catch (error: any) {
    console.error('Error during tenant onboarding:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat membuat tenant',
      details: error
    };
  }
}



/**
 * Validasi tenant slug format
 */
export function validateTenantSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 3) {
    return { valid: false, error: 'Slug minimal 3 karakter' };
  }
  
  if (slug.length > 50) {
    return { valid: false, error: 'Slug maksimal 50 karakter' };
  }
  
  // Hanya huruf kecil, angka, dan dash
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { valid: false, error: 'Slug hanya boleh mengandung huruf kecil, angka, dan dash' };
  }
  
  // Tidak boleh dimulai atau diakhiri dengan dash
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug tidak boleh dimulai atau diakhiri dengan dash' };
  }
  
  return { valid: true };
}

/**
 * Generate slug dari nama tenant
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Hapus karakter special
    .replace(/\s+/g, '-') // Ganti spasi dengan dash
    .replace(/-+/g, '-') // Ganti multiple dash dengan single dash
    .substring(0, 50); // Limit panjang
}
