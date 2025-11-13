import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Image as ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  Settings2,
  Upload,
  UserRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GeneralSettings, defaultGeneralSettings } from "@/hooks/useGeneralSettings";
import { useGeneralSettingsContext } from "@/contexts/GeneralSettingsContext";
import { supabase } from "@/integrations/supabase/client";

const PengaturanUmum: React.FC = () => {
  const { toast } = useToast();
  const { settings, loading, saving, error, save } = useGeneralSettingsContext();
  const [formData, setFormData] = useState<GeneralSettings>(settings);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.logo_url ?? null
  );

  useEffect(() => {
    setFormData(settings);
    setLogoPreview(settings.logo_url ?? null);
  }, [settings]);

  const isPristine = useMemo(() => {
    return (
      JSON.stringify({
        ...formData,
        updated_at: undefined,
        created_at: undefined,
      }) ===
      JSON.stringify({
        ...settings,
        updated_at: undefined,
        created_at: undefined,
      })
    );
  }, [formData, settings]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format tidak didukung",
        description: "Silakan unggah file gambar dengan format yang valid.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Ukuran file terlalu besar",
        description: "Logo instansi maksimal 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `general-settings/logo-${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("branding-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("branding-assets")
        .getPublicUrl(data?.path ?? fileName);

      setFormData((prev) => ({
        ...prev,
        logo_url: publicUrl,
        logo_storage_path: data?.path ?? fileName,
      }));
      setLogoPreview(publicUrl);

      toast({
        title: "Logo berhasil diunggah",
        description: "Logo instansi siap digunakan.",
      });
    } catch (err) {
      console.error("PengaturanUmum.handleLogoUpload error:", err);
      toast({
        title: "Gagal mengunggah logo",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan saat unggah logo.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!formData.logo_storage_path) {
      setFormData((prev) => ({
        ...prev,
        logo_url: null,
        logo_storage_path: null,
      }));
      setLogoPreview(null);
      return;
    }

    try {
      await supabase.storage
        .from("branding-assets")
        .remove([formData.logo_storage_path]);
    } catch (err) {
      console.error("PengaturanUmum.handleDeleteLogo storage error:", err);
    } finally {
      setFormData((prev) => ({
        ...prev,
        logo_url: null,
        logo_storage_path: null,
      }));
      setLogoPreview(null);
      toast({
        title: "Logo dihapus",
        description: "Logo instansi berhasil dihapus.",
      });
    }
  };

  const handleReset = () => {
    setFormData(settings);
    setLogoPreview(settings.logo_url ?? null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const saved = await save(formData);
      setFormData(saved);
      setLogoPreview(saved.logo_url ?? null);
      toast({
        title: "Pengaturan tersimpan",
        description: "Pengaturan umum berhasil diperbarui.",
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan pengaturan",
        description:
          err instanceof Error ? err.message : "Silakan coba lagi beberapa saat.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p>Memuat pengaturan umum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Pengaturan Umum</h1>
        <p className="text-muted-foreground">
          Kelola informasi dasar aplikasi dan organisasi yang ditampilkan pada
          berbagai modul.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-teal-600" />
              Setting Aplikasi
            </CardTitle>
            <CardDescription>
              Pengaturan identitas aplikasi yang ditampilkan pada header, footer,
              dan laporan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-1">
              <Label htmlFor="nama_aplikasi">Nama Aplikasi</Label>
              <Input
                id="nama_aplikasi"
                name="nama_aplikasi"
                placeholder="Masukkan nama aplikasi"
                value={formData.nama_aplikasi}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">
                Digunakan sebagai judul utama aplikasi dan laporan.
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="footer">Footer</Label>
              <Textarea
                id="footer"
                name="footer"
                placeholder="Teks footer aplikasi"
                value={formData.footer}
                onChange={handleInputChange}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Teks tambahan yang akan muncul pada bagian footer aplikasi atau
                laporan.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              Setting Organisasi
            </CardTitle>
            <CardDescription>
              Informasi instansi untuk identitas resmi dan keperluan tanda tangan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-1">
              <Label htmlFor="nama_instansi">Nama Instansi</Label>
              <Input
                id="nama_instansi"
                name="nama_instansi"
                placeholder="Masukkan nama instansi"
                value={formData.nama_instansi}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label htmlFor="nama_jabatan">Nama Jabatan</Label>
                <Input
                  id="nama_jabatan"
                  name="nama_jabatan"
                  placeholder="Contoh: Direktur RS"
                  value={formData.nama_jabatan}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="nama_pejabat">
                  Nama Pejabat (Untuk Tanda Tangan)
                </Label>
                <Input
                  id="nama_pejabat"
                  name="nama_pejabat"
                  placeholder="Nama lengkap pejabat"
                  value={formData.nama_pejabat}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="alamat" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-600" />
                Alamat Instansi
              </Label>
              <Textarea
                id="alamat"
                name="alamat"
                placeholder="Masukkan alamat lengkap instansi"
                value={formData.alamat}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="logo_instansi" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-teal-600" />
                Logo Instansi
              </Label>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Input
                  id="logo_instansi"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="md:max-w-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("logo_instansi")?.click()
                    }
                    disabled={uploadingLogo}
                    className="gap-2"
                  >
                    {uploadingLogo ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingLogo ? "Mengunggah..." : "Pilih Logo"}
                  </Button>
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteLogo}
                    >
                      Hapus Logo
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Format gambar: PNG, JPG, atau SVG dengan ukuran maksimal 2MB.
              </p>

              {logoPreview ? (
                <div className="border rounded-lg p-4 inline-flex items-center gap-4 bg-muted/40">
                  <img
                    src={logoPreview}
                    alt="Logo Instansi"
                    className="h-16 w-16 object-contain rounded-md border bg-white"
                  />
                  <div>
                    <p className="font-semibold">{formData.nama_instansi}</p>
                    <p className="text-sm text-muted-foreground">
                      Pratinjau logo instansi saat ini.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-dashed border-2 border-muted rounded-lg p-6 text-center text-sm text-muted-foreground">
                  <ImageIcon className="h-6 w-6 mx-auto mb-2 opacity-60" />
                  Belum ada logo yang diunggah. Unggah logo untuk memperkuat
                  identitas instansi.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData((prev) => ({
                  ...defaultGeneralSettings,
                  id: prev.id,
                }));
                setLogoPreview(null);
              }}
              disabled={saving || uploadingLogo}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset ke Default
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={saving || uploadingLogo || isPristine}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Batalkan Perubahan
            </Button>
          </div>
          <Button
            type="submit"
            disabled={saving || uploadingLogo || isPristine}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </form>

      <Alert>
        <UserRound className="h-4 w-4" />
        <AlertTitle>Tips</AlertTitle>
        <AlertDescription>
          Pastikan informasi jabatan dan pejabat selalu diperbarui untuk
          memastikan dokumen resmi menampilkan tanda tangan yang valid.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PengaturanUmum;


