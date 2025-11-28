import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Building2, User, Settings, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  createTenant, 
  validateTenantSlug, 
  generateSlugFromName,
  type TenantOnboardingData 
} from '@/services/tenantOnboarding';
import { useToast } from '@/hooks/use-toast';

// Validation schema
const onboardingSchema = z.object({
  tenantName: z.string().min(3, 'Nama tenant minimal 3 karakter'),
  tenantSlug: z.string().min(3, 'Slug minimal 3 karakter').refine(
    (slug) => validateTenantSlug(slug).valid,
    (slug) => ({ message: validateTenantSlug(slug).error || 'Slug tidak valid' })
  ),
  logoUrl: z.string().url('URL logo tidak valid').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid').optional(),
  adminEmail: z.string().email('Email tidak valid'),
  adminPassword: z.string().min(8, 'Password minimal 8 karakter'),
  adminPasswordConfirm: z.string(),
  adminFullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  includeJasaPelayanan: z.boolean().default(true),
  defaultCurrency: z.string().default('IDR')
}).refine((data) => data.adminPassword === data.adminPasswordConfirm, {
  message: 'Password tidak cocok',
  path: ['adminPasswordConfirm']
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

type OnboardingStep = 'tenant' | 'admin' | 'settings' | 'processing' | 'success';

export default function TenantOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('tenant');
  const [error, setError] = useState<string | null>(null);
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      includeJasaPelayanan: true,
      defaultCurrency: 'IDR',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6'
    }
  });

  const tenantName = watch('tenantName');

  // Auto-generate slug dari nama tenant
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('tenantName', name);
    
    if (name) {
      const slug = generateSlugFromName(name);
      setValue('tenantSlug', slug);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setError(null);
    setCurrentStep('processing');

    const onboardingData: TenantOnboardingData = {
      tenantName: data.tenantName,
      tenantSlug: data.tenantSlug,
      logoUrl: data.logoUrl || undefined,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      adminEmail: data.adminEmail,
      adminPassword: data.adminPassword,
      adminFullName: data.adminFullName,
      includeJasaPelayanan: data.includeJasaPelayanan,
      defaultCurrency: data.defaultCurrency
    };

    const result = await createTenant(onboardingData);

    if (result.success) {
      setCreatedTenantId(result.tenantId || null);
      setCurrentStep('success');
      toast({
        title: 'Tenant berhasil dibuat',
        description: `Tenant ${data.tenantName} telah berhasil dibuat dengan admin user ${data.adminEmail}`,
      });
    } else {
      setError(result.error || 'Terjadi kesalahan saat membuat tenant');
      setCurrentStep('settings'); // Kembali ke step terakhir
      toast({
        title: 'Gagal membuat tenant',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'tenant', label: 'Informasi Tenant', icon: Building2 },
      { id: 'admin', label: 'Admin User', icon: User },
      { id: 'settings', label: 'Pengaturan', icon: Settings }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'border-primary bg-primary/10' : 
                  isCompleted ? 'border-green-600 bg-green-50' : 
                  'border-gray-300'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                </div>
                <span className="text-sm mt-2 font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-24 h-0.5 mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTenantStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Tenant</CardTitle>
        <CardDescription>Masukkan informasi dasar untuk tenant baru</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tenantName">Nama Tenant *</Label>
          <Input
            id="tenantName"
            {...register('tenantName')}
            onChange={handleNameChange}
            placeholder="Contoh: RS Sehat Sentosa"
          />
          {errors.tenantName && (
            <p className="text-sm text-red-600 mt-1">{errors.tenantName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tenantSlug">Slug Tenant *</Label>
          <Input
            id="tenantSlug"
            {...register('tenantSlug')}
            placeholder="rs-sehat-sentosa"
          />
          <p className="text-xs text-gray-500 mt-1">
            Slug akan digunakan dalam URL dan harus unik
          </p>
          {errors.tenantSlug && (
            <p className="text-sm text-red-600 mt-1">{errors.tenantSlug.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="logoUrl">URL Logo (Opsional)</Label>
          <Input
            id="logoUrl"
            {...register('logoUrl')}
            placeholder="https://example.com/logo.png"
          />
          {errors.logoUrl && (
            <p className="text-sm text-red-600 mt-1">{errors.logoUrl.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Warna Primer</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                {...register('primaryColor')}
                className="w-20 h-10"
              />
              <Input
                {...register('primaryColor')}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
            {errors.primaryColor && (
              <p className="text-sm text-red-600 mt-1">{errors.primaryColor.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="secondaryColor">Warna Sekunder</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                {...register('secondaryColor')}
                className="w-20 h-10"
              />
              <Input
                {...register('secondaryColor')}
                placeholder="#8b5cf6"
                className="flex-1"
              />
            </div>
            {errors.secondaryColor && (
              <p className="text-sm text-red-600 mt-1">{errors.secondaryColor.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setCurrentStep('admin')}>
            Lanjut
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdminStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Admin User</CardTitle>
        <CardDescription>Buat akun admin untuk tenant ini</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="adminFullName">Nama Lengkap *</Label>
          <Input
            id="adminFullName"
            {...register('adminFullName')}
            placeholder="John Doe"
          />
          {errors.adminFullName && (
            <p className="text-sm text-red-600 mt-1">{errors.adminFullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="adminEmail">Email *</Label>
          <Input
            id="adminEmail"
            type="email"
            {...register('adminEmail')}
            placeholder="admin@example.com"
          />
          {errors.adminEmail && (
            <p className="text-sm text-red-600 mt-1">{errors.adminEmail.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="adminPassword">Password *</Label>
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

        <div>
          <Label htmlFor="adminPasswordConfirm">Konfirmasi Password *</Label>
          <Input
            id="adminPasswordConfirm"
            type="password"
            {...register('adminPasswordConfirm')}
            placeholder="Ulangi password"
          />
          {errors.adminPasswordConfirm && (
            <p className="text-sm text-red-600 mt-1">{errors.adminPasswordConfirm.message}</p>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('tenant')}>
            Kembali
          </Button>
          <Button onClick={() => setCurrentStep('settings')}>
            Lanjut
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSettingsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Awal</CardTitle>
        <CardDescription>Konfigurasi pengaturan default untuk tenant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeJasaPelayanan"
            checked={watch('includeJasaPelayanan')}
            onCheckedChange={(checked) => setValue('includeJasaPelayanan', checked as boolean)}
          />
          <Label htmlFor="includeJasaPelayanan" className="cursor-pointer">
            Sertakan Jasa Pelayanan dalam kalkulasi biaya
          </Label>
        </div>

        <div>
          <Label htmlFor="defaultCurrency">Mata Uang Default</Label>
          <Input
            id="defaultCurrency"
            {...register('defaultCurrency')}
            placeholder="IDR"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('admin')}>
            Kembali
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat Tenant...
              </>
            ) : (
              'Buat Tenant'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcessingStep = () => (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-lg font-semibold">Membuat Tenant...</h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Sedang membuat tenant, admin user, dan data default. Proses ini mungkin memakan waktu beberapa saat.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
          <h3 className="text-2xl font-bold">Tenant Berhasil Dibuat!</h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Tenant telah berhasil dibuat dengan semua data default. Admin user dapat login menggunakan kredensial yang telah dibuat.
          </p>
          {createdTenantId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Tenant ID:</span> {createdTenantId}
              </p>
            </div>
          )}
          <div className="flex gap-4 mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Buat Tenant Lain
            </Button>
            <Button onClick={() => navigate('/login')}>
              Ke Halaman Login
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Onboarding Tenant Baru</h1>
          <p className="text-gray-600">
            Ikuti langkah-langkah berikut untuk membuat tenant baru
          </p>
        </div>

        {currentStep !== 'processing' && currentStep !== 'success' && renderStepIndicator()}

        {currentStep === 'tenant' && renderTenantStep()}
        {currentStep === 'admin' && renderAdminStep()}
        {currentStep === 'settings' && renderSettingsStep()}
        {currentStep === 'processing' && renderProcessingStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
}
