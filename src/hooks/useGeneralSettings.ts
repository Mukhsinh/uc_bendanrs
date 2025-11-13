import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GeneralSettings {
  id?: string;
  nama_aplikasi: string;
  footer: string;
  nama_instansi: string;
  nama_jabatan: string;
  nama_pejabat: string;
  logo_url?: string | null;
  logo_storage_path?: string | null;
  alamat: string;
  created_at?: string;
  updated_at?: string;
}

export const defaultGeneralSettings: GeneralSettings = {
  nama_aplikasi: "",
  footer: "",
  nama_instansi: "",
  nama_jabatan: "",
  nama_pejabat: "",
  logo_url: null,
  logo_storage_path: null,
  alamat: "",
};

export const useGeneralSettings = () => {
  const [settings, setSettings] = useState<GeneralSettings>(defaultGeneralSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("general_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.code !== "PGRST116") {
          throw fetchError;
        }
        setSettings(defaultGeneralSettings);
        return;
      }

      if (data) {
        setSettings({
          ...defaultGeneralSettings,
          ...data,
        });
      } else {
        setSettings(defaultGeneralSettings);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memuat pengaturan umum. Silakan coba lagi.";
      console.error("useGeneralSettings.fetchSettings error:", err);
      setError(message);
      setSettings(defaultGeneralSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (payload: GeneralSettings) => {
      setSaving(true);
      setError(null);
      try {
        const sanitizedPayload = {
          nama_aplikasi: payload.nama_aplikasi?.trim() ?? "",
          footer: payload.footer?.trim() ?? "",
          nama_instansi: payload.nama_instansi?.trim() ?? "",
          nama_jabatan: payload.nama_jabatan?.trim() ?? "",
          nama_pejabat: payload.nama_pejabat?.trim() ?? "",
          logo_url: payload.logo_url || null,
          logo_storage_path: payload.logo_storage_path || null,
          alamat: payload.alamat?.trim() ?? "",
          updated_at: new Date().toISOString(),
        };

        let data;
        let errorResult;

        if (payload.id) {
          const result = await supabase
            .from("general_settings")
            .update(sanitizedPayload)
            .eq("id", payload.id)
            .select()
            .maybeSingle();

          data = result.data;
          errorResult = result.error;
        } else {
          const result = await supabase
            .from("general_settings")
            .insert({
              ...sanitizedPayload,
              created_at: new Date().toISOString(),
            })
            .select()
            .maybeSingle();

          data = result.data;
          errorResult = result.error;
        }

        if (errorResult) {
          throw errorResult;
        }

        if (data) {
          setSettings({
            ...defaultGeneralSettings,
            ...data,
          });
          return data;
        }

        throw new Error("Tidak ada data yang dikembalikan dari penyimpanan.");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal menyimpan pengaturan umum. Silakan coba lagi.";
        console.error("useGeneralSettings.saveSettings error:", err);
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    settings,
    loading,
    saving,
    error,
    setSettings,
    refetch: fetchSettings,
    saveSettings,
    defaultGeneralSettings,
  };
};

