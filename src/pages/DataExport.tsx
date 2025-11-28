/**
 * Data Export Page
 * 
 * Halaman untuk export data tenant dalam format SQL atau JSON.
 * Hanya accessible oleh tenant admin atau super admin.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileJson, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { exportTenantData } from '@/services/tenantDataExport';

export default function DataExport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenant } = useTenant();

  const [format, setFormat] = useState<'sql' | 'json'>('json');
  const [includeSettings, setIncludeSettings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!tenant) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tenant context tidak ditemukan. Silakan login kembali.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await exportTenantData({
        tenantId: tenant.id,
        format,
        includeSettings,
      });

      if (result.success && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${tenant.slug}_export_${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export Berhasil',
          description: `Data telah di-export dalam format ${format.toUpperCase()}`,
        });
      } else {
        throw new Error(result.error || 'Export gagal');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Export Data</h1>
        <p className="text-muted-foreground mt-2">
          Export data tenant untuk backup atau analisis offline
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Export</CardTitle>
          <CardDescription>
            Pilih format dan opsi export data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium">Tenant</div>
            <div className="text-lg font-semibold">{tenant.name}</div>
            <div className="text-sm text-muted-foreground">{tenant.slug}</div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Format Export</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'sql' | 'json')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileJson className="h-4 w-4" />
                  <div>
                    <div className="font-medium">JSON</div>
                    <div className="text-sm text-muted-foreground">
                      Format JSON untuk analisis atau import ke aplikasi lain
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="sql" id="sql" />
                <Label htmlFor="sql" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">SQL Dump</div>
                    <div className="text-sm text-muted-foreground">
                      SQL statements untuk import ke database PostgreSQL
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Opsi Export</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="settings"
                checked={includeSettings}
                onCheckedChange={(checked) => setIncludeSettings(checked as boolean)}
              />
              <Label htmlFor="settings" className="cursor-pointer">
                Include tenant settings dan konfigurasi
              </Label>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Export hanya mencakup data yang terkait dengan tenant ini. 
              File export akan tersedia untuk download selama 24 jam.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Mengexport...' : 'Export Data'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isExporting}
            >
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
