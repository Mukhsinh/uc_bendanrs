import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, Building2, Palette, Settings as SettingsIcon, Database, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

// Validation schema
const tenantInfoSchema = z.object({
  name: z.string().min(3, 'Nama tenant minimal 3 karakter'),
  logoUrl: z.string().url('URL logo tidak valid').optional().or(z.literal('')),
});

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
});

const calculationSchema = z.object({
  includeJasaPelayanan: z.boolean(),
  currency: z.string().min(3, 'Kode mata uang minimal 3 karakter'),
  roundingMethod: z.enum(['round', 'floor', 'ceil']),
  decimalPlaces: z.number().min(0).max(4),
});

type TenantInfoFormData = z.infer<typeof tenantInfoSchema>;
type BrandingFormData = z.infer<typeof brandingSchema>;
type CalculationFormData = z.infer<typeof calculationSchema>;

export default function TenantSettings() {
  const { toast } = useToast();
  const { tenant, refreshTenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [fromYear, setFromYear] = useState<number>(2025);
  const [toYear, setToYear] = useState<number>(2026);
  const [copying, setCopying] = useState(false);

  // Form untuk tenant info
  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    reset: resetInfo
  } = useForm<TenantInfoFormData>({
    resolver: zodResolver(tenantInfoSchema)
  });

  // Form untuk branding
  const {
    register: registerBranding,
    handleSubmit: handleSubmitBranding,
    watch: watchBranding,
    formState: { errors: errorsBranding },
    reset: resetBranding
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema)
  });

  // Form untuk calculation preferences
  const {
    register: registerCalculation,
    handleSubmit: handleSubmitCalculation,
    watch: watchCalculation,
    setValue: setValueCalculation,
    formState: { errors: errorsCalculation },
    reset: resetCalculation
  } = useForm<CalculationFormData>({
    resolver: zodResolver(calculationSchema)
  });

  useEffect(() => {
    loadSettings();
  }, [tenant]);

  const loadSettings = async () => {
    if (!tenant) return;

    setLoading(true);
    try {
      // Load tenant settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      if (settingsError) throw settingsError;

      setSettings(settingsData);

      // Reset forms dengan data yang ada
      resetInfo({
        name: tenant.name,
        logoUrl: tenant.logo_url || ''
      });

      resetBranding({
        primaryColor: tenant.primary_color || '#6366f1',
        secondaryColor: tenant.secondary_color || '#8b5cf6'
      });

      if (settingsData) {
        resetCalculation({
          includeJasaPelayanan: settingsData.include_jasa_pelayanan ?? true,
          currency: settingsData.currency || 'IDR',
          roundingMethod: settingsData.calculation_preferences?.rounding_method || 'round',
          decimalPlaces: settingsData.calculation_preferences?.decimal_places || 2
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat pengaturan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitInfo = async (data: TenantInfoFormData) => {
    if (!tenant) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: data.name,
          logo_url: data.logoUrl || null
        })
        .eq('id', tenant.id);

      if (error) throw error;

      // Log audit trail
      await logAuditTrail('tenant_info_updated', {
        old_name: tenant.name,
        new_name: data.name,
        old_logo: tenant.logo_url,
        new_logo: data.logoUrl
      });

      toast({
        title: 'Berhasil',
        description: 'Informasi tenant berhasil diperbarui'
      });

      await refreshTenant();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui informasi tenant',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitBranding = async (data: BrandingFormData) => {
    if (!tenant) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tenant_settings')
        .update({
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor
        })
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      // Log audit trail
      await logAuditTrail('branding_updated', {
        old_colors: {
          primary: tenant.primary_color,
          secondary: tenant.secondary_color
        },
        new_colors: {
          primary: data.primaryColor,
          secondary: data.secondaryColor
        }
      });

      toast({
        title: 'Berhasil',
        description: 'Branding berhasil diperbarui'
      });

      await refreshTenant();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui branding',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitCalculation = async (data: CalculationFormData) => {
    if (!tenant || !settings) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tenant_settings')
        .update({
          include_jasa_pelayanan: data.includeJasaPelayanan,
          currency: data.currency,
          calculation_preferences: {
            rounding_method: data.roundingMethod,
            decimal_places: data.decimalPlaces
          }
        })
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      // Log audit trail
      await logAuditTrail('calculation_preferences_updated', {
        old_settings: {
          include_jasa_pelayanan: settings.include_jasa_pelayanan,
          currency: settings.currency,
          calculation_preferences: settings.calculation_preferences
        },
        new_settings: {
          include_jasa_pelayanan: data.includeJasaPelayanan,
          currency: data.currency,
          calculation_preferences: {
            rounding_method: data.roundingMethod,
            decimal_places: data.decimalPlaces
          }
        }
      });

      toast({
        title: 'Berhasil',
        description: 'Preferensi kalkulasi berhasil diperbarui'
      });

      await loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui preferensi kalkulasi',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyYearData = async () => {
    if (!tenant) return;

    if (fromYear === toYear) {
      toast({
        title: 'Peringatan',
        description: 'Tahun sumber dan tujuan tidak boleh sama.',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage = `Apakah Anda yakin ingin menyalin semua data dari tahun ${fromYear} ke tahun ${toYear}? Data tahun ${toYear} yang sudah ada akan dihapus.`;
    if (!window.confirm(confirmMessage)) return;

    setCopying(true);
    try {
      const { error } = await supabase.rpc('copy_year_data', {
        from_year: fromYear,
        to_year: toYear,
        p_tenant_id: tenant.id
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Data dari tahun ${fromYear} berhasil disalin ke tahun ${toYear}.`,
      });

      // Log audit trail
      await logAuditTrail('copy_year_data', {
        from_year: fromYear,
        to_year: toYear
      });
    } catch (error: any) {
      console.error('Error copying year data:', error);
      toast({
        title: 'Gagal Menyalin Data',
        description: error.message || 'Terjadi kesalahan saat menyalin data. Pastikan fungsi database sudah terpasang.',
        variant: 'destructive'
      });
    } finally {
      setCopying(false);
    }
  };

  const logAuditTrail = async (action: string, changes: any) => {
    if (!tenant) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('tenant_audit_log')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          action,
          table_name: 'tenant_settings',
          record_id: tenant.id,
          changes
        });
    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-600">
              Tenant tidak ditemukan. Silakan login kembali.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Tenant</h1>
        <p className="text-sm text-gray-600 mt-1">
          Kelola informasi dan preferensi untuk tenant Anda
        </p>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">
            <Building2 className="h-4 w-4 mr-2" />
            Informasi Tenant
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="calculation">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Preferensi Kalkulasi
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Manajemen Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Tenant</CardTitle>
              <CardDescription>
                Perbarui informasi dasar tenant Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitInfo(onSubmitInfo)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Tenant *</Label>
                  <Input
                    id="name"
                    {...registerInfo('name')}
                    placeholder="Nama tenant"
                  />
                  {errorsInfo.name && (
                    <p className="text-sm text-red-600 mt-1">{errorsInfo.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="logoUrl">URL Logo</Label>
                  <Input
                    id="logoUrl"
                    {...registerInfo('logoUrl')}
                    placeholder="https://example.com/logo.png"
                  />
                  {errorsInfo.logoUrl && (
                    <p className="text-sm text-red-600 mt-1">{errorsInfo.logoUrl.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Sesuaikan warna tema untuk tenant Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitBranding(onSubmitBranding)} className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Warna Primer</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...registerBranding('primaryColor')}
                      className="w-20 h-10"
                    />
                    <Input
                      {...registerBranding('primaryColor')}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                  {errorsBranding.primaryColor && (
                    <p className="text-sm text-red-600 mt-1">{errorsBranding.primaryColor.message}</p>
                  )}
                  <div
                    className="mt-2 h-12 rounded border"
                    style={{ backgroundColor: watchBranding('primaryColor') }}
                  />
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Warna Sekunder</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...registerBranding('secondaryColor')}
                      className="w-20 h-10"
                    />
                    <Input
                      {...registerBranding('secondaryColor')}
                      placeholder="#8b5cf6"
                      className="flex-1"
                    />
                  </div>
                  {errorsBranding.secondaryColor && (
                    <p className="text-sm text-red-600 mt-1">{errorsBranding.secondaryColor.message}</p>
                  )}
                  <div
                    className="mt-2 h-12 rounded border"
                    style={{ backgroundColor: watchBranding('secondaryColor') }}
                  />
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation">
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Kalkulasi</CardTitle>
              <CardDescription>
                Atur preferensi untuk kalkulasi biaya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitCalculation(onSubmitCalculation)} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeJasaPelayanan"
                    checked={watchCalculation('includeJasaPelayanan')}
                    onCheckedChange={(checked) =>
                      setValueCalculation('includeJasaPelayanan', checked as boolean)
                    }
                  />
                  <Label htmlFor="includeJasaPelayanan" className="cursor-pointer">
                    Sertakan Jasa Pelayanan dalam kalkulasi biaya
                  </Label>
                </div>

                <div>
                  <Label htmlFor="currency">Mata Uang</Label>
                  <Input
                    id="currency"
                    {...registerCalculation('currency')}
                    placeholder="IDR"
                  />
                  {errorsCalculation.currency && (
                    <p className="text-sm text-red-600 mt-1">{errorsCalculation.currency.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="roundingMethod">Metode Pembulatan</Label>
                  <select
                    id="roundingMethod"
                    {...registerCalculation('roundingMethod')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="round">Pembulatan Normal</option>
                    <option value="floor">Pembulatan Ke Bawah</option>
                    <option value="ceil">Pembulatan Ke Atas</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="decimalPlaces">Jumlah Desimal</Label>
                  <Input
                    id="decimalPlaces"
                    type="number"
                    min="0"
                    max="4"
                    {...registerCalculation('decimalPlaces', { valueAsNumber: true })}
                  />
                  {errorsCalculation.decimalPlaces && (
                    <p className="text-sm text-red-600 mt-1">{errorsCalculation.decimalPlaces.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Salin Data Antar Tahun</CardTitle>
              <CardDescription>
                Duplikasi seluruh data transaksi dan kalkulasi dari satu tahun ke tahun lainnya.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Peringatan Penting:</p>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Proses ini akan <strong>menghapus seluruh data yang sudah ada</strong> di tahun tujuan.</li>
                    <li>Pastikan Anda memilih tahun sumber dan tujuan dengan benar.</li>
                    <li>Sistem hanya menyalin data transaksi dan kalkulasi, data master tidak terpengaruh.</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromYear">Tahun Sumber (Copy dari)</Label>
                  <select
                    id="fromYear"
                    value={fromYear}
                    onChange={(e) => setFromYear(parseInt(e.target.value))}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toYear">Tahun Tujuan (Salin ke)</Label>
                  <select
                    id="toYear"
                    value={toYear}
                    onChange={(e) => setToYear(parseInt(e.target.value))}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleCopyYearData}
                disabled={copying}
                className="w-full md:w-auto"
                variant="destructive"
              >
                {copying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang Menyalin Data...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Salin Seluruh Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
