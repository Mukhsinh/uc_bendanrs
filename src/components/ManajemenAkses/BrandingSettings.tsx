import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, Image as ImageIcon, RefreshCw, Trash2 } from 'lucide-react';

interface BrandingSettings {
  id?: string;
  app_title: string;
  logo_url?: string;
  logo_alt_text: string;
}

const BrandingSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<BrandingSettings>({
    app_title: 'PINTAR UC',
    logo_alt_text: 'Logo'
  });

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user authenticated');
        return;
      }

      console.log('Fetching branding settings for user:', user.id);

      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching branding settings:', error);
        throw error;
      }

      if (data) {
        console.log('Found existing branding settings:', data);
        setSettings(data);
      } else {
        console.log('No existing branding settings found, using defaults');
        setSettings({
          app_title: 'PINTAR UC',
          logo_alt_text: 'Logo'
        });
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "File harus berupa gambar",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('branding-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(fileName);

      setSettings(prev => ({
        ...prev,
        logo_url: publicUrl
      }));

      toast({
        title: "Berhasil",
        description: "Logo berhasil diupload",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Gagal mengupload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Check if Supabase client is available
      if (!supabase) {
        throw new Error('Supabase client tidak tersedia');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('Saving branding settings:', {
        user_id: user.id,
        app_title: settings.app_title,
        logo_url: settings.logo_url,
        logo_alt_text: settings.logo_alt_text
      });

      // Validate data before sending
      if (!settings.app_title || settings.app_title.trim() === '') {
        throw new Error('Judul aplikasi tidak boleh kosong');
      }

      if (settings.app_title.length > 50) {
        throw new Error('Judul aplikasi maksimal 50 karakter');
      }

      // First, check if branding settings already exist for this user
      const { data: existingData, error: checkError } = await supabase
        .from('branding_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let data, error;

      if (checkError && checkError.code !== 'PGRST116') {
        // If there's an error other than "not found", throw it
        throw checkError;
      }

      if (existingData) {
        // Update existing record
        console.log('Updating existing branding settings:', existingData.id);
        const result = await supabase
          .from('branding_settings')
          .update({
            app_title: settings.app_title.trim(),
            logo_url: settings.logo_url || null,
            logo_alt_text: settings.logo_alt_text.trim() || 'Logo',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select();
        
        data = result.data;
        error = result.error;
      } else {
        // Insert new record
        console.log('Creating new branding settings');
        const result = await supabase
          .from('branding_settings')
          .insert({
            user_id: user.id,
            app_title: settings.app_title.trim(),
            logo_url: settings.logo_url || null,
            logo_alt_text: settings.logo_alt_text.trim() || 'Logo'
          })
          .select();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Branding settings saved successfully:', data);

      toast({
        title: "Berhasil",
        description: existingData ? "Pengaturan branding berhasil diperbarui" : "Pengaturan branding berhasil dibuat",
      });

      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // Log the full error object for debugging
      console.error('Full error object:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error saving branding settings:', error);
      
      // More detailed error handling
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else if ('details' in error) {
          errorMessage = String(error.details);
        } else if ('hint' in error) {
          errorMessage = String(error.hint);
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
      
      // Check for specific Supabase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === 'PGRST301') {
          errorMessage = 'Tidak memiliki izin untuk mengakses data ini';
        } else if (errorCode === 'PGRST116') {
          errorMessage = 'Data tidak ditemukan';
        } else if (errorCode === '23505') {
          errorMessage = 'Data sudah ada';
        } else if (errorCode === '23503') {
          errorMessage = 'Referensi data tidak valid';
        }
      }
      
      console.error('Detailed error info:', {
        error,
        errorType: typeof error,
        errorMessage,
        errorString: String(error)
      });
      
      toast({
        title: "Error",
        description: `Gagal menyimpan pengaturan: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!settings.logo_url) return;

    try {
      // Extract file path from URL
      const url = new URL(settings.logo_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const userFolder = pathParts[pathParts.length - 2];
      const fullPath = `${userFolder}/${fileName}`;

      console.log('Deleting logo file:', fullPath);

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('branding-assets')
        .remove([fullPath]);

      if (deleteError) {
        console.error('Error deleting logo from storage:', deleteError);
        // Continue anyway, as the file might not exist
      }

      // Update settings to remove logo
      setSettings(prev => ({
        ...prev,
        logo_url: undefined
      }));

      toast({
        title: "Berhasil",
        description: "Logo berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus logo",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSettings({
      app_title: 'PINTAR UC',
      logo_alt_text: 'Logo',
      logo_url: undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Pengaturan Branding
        </CardTitle>
        <CardDescription>
          Kustomisasi judul aplikasi dan logo untuk navigasi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* App Title */}
        <div className="space-y-2">
          <Label htmlFor="app_title">Judul Aplikasi</Label>
          <Input
            id="app_title"
            value={settings.app_title}
            onChange={(e) => setSettings(prev => ({ ...prev, app_title: e.target.value }))}
            placeholder="Masukkan judul aplikasi"
            maxLength={50}
          />
          <p className="text-sm text-muted-foreground">
            Maksimal 50 karakter
          </p>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label htmlFor="logo_upload">Logo Aplikasi</Label>
          <div className="flex items-center gap-4">
            <Input
              id="logo_upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById('logo_upload')?.click()}
            >
              {uploading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Uploading...' : 'Pilih File'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Format: JPG, PNG, SVG. Maksimal 2MB
          </p>
        </div>

        {/* Logo Preview */}
        {settings.logo_url && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preview Logo</Label>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteLogo}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Logo
              </Button>
            </div>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <img
                  src={settings.logo_url}
                  alt={settings.logo_alt_text}
                  className="h-8 w-8 object-contain"
                />
                <span className="font-semibold">{settings.app_title}</span>
              </div>
            </div>
          </div>
        )}

        {/* Logo Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="logo_alt_text">Alt Text Logo</Label>
          <Input
            id="logo_alt_text"
            value={settings.logo_alt_text}
            onChange={(e) => setSettings(prev => ({ ...prev, logo_alt_text: e.target.value }))}
            placeholder="Masukkan alt text untuk logo"
            maxLength={100}
          />
          <p className="text-sm text-muted-foreground">
            Deskripsi untuk aksesibilitas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Pengaturan
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset ke Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandingSettings;
