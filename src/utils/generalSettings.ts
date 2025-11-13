import { GeneralSettings, defaultGeneralSettings } from "@/hooks/useGeneralSettings";

const FALLBACK_LOGO =
  "https://placehold.co/160x160/0d9488/ffffff/png?text=LOGO";

export interface FormattedGeneralSettings {
  appName: string;
  institutionName: string;
  address: string;
  footer: string;
  jobTitle: string;
  officerName: string;
  logoUrl: string;
}

export const normalizeGeneralSettings = (
  settings?: Partial<GeneralSettings> | null
): FormattedGeneralSettings => {
  const safeSettings = { ...defaultGeneralSettings, ...settings };

  return {
    appName: tidyText(safeSettings.nama_aplikasi, "Aplikasi Unit Cost"),
    institutionName: tidyText(safeSettings.nama_instansi, "Instansi Kesehatan"),
    address: tidyText(safeSettings.alamat, "Alamat instansi belum diatur"),
    footer: tidyText(
      safeSettings.footer,
      "Dicetak otomatis oleh PINTAR UC · © 2025"
    ),
    jobTitle: tidyText(safeSettings.nama_jabatan, "Penanggung Jawab"),
    officerName: tidyText(safeSettings.nama_pejabat, "........................"),
    logoUrl: tidyLogo(safeSettings.logo_url),
  };
};

const tidyText = (value?: string | null, fallback = ""): string => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\s+/g, " ");
};

const tidyLogo = (url?: string | null): string => {
  if (!url || url.trim() === "") {
    return FALLBACK_LOGO;
  }
  return url;
};

export const buildSignatureBlock = (settings?: GeneralSettings) => {
  const normalized = normalizeGeneralSettings(settings);
  return {
    titleLine: normalized.jobTitle.toUpperCase(),
    nameLine: normalized.officerName,
  };
};

export const generalSettingsToMetadata = (settings?: GeneralSettings) => {
  const normalized = normalizeGeneralSettings(settings);
  return {
    title: normalized.appName,
    organization: normalized.institutionName,
    footer: normalized.footer,
    logoUrl: normalized.logoUrl,
  };
};


