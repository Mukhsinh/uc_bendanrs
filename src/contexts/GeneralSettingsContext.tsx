import { createContext, useContext, useMemo } from "react";
import {
  GeneralSettings,
  defaultGeneralSettings,
  useGeneralSettings,
} from "@/hooks/useGeneralSettings";

interface GeneralSettingsContextValue {
  settings: GeneralSettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (payload: GeneralSettings) => Promise<GeneralSettings>;
}

const GeneralSettingsContext = createContext<GeneralSettingsContextValue>({
  settings: defaultGeneralSettings,
  loading: true,
  saving: false,
  error: null,
  refresh: async () => {
    // noop default
  },
  save: async () => defaultGeneralSettings,
});

export const GeneralSettingsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { settings, loading, saving, error, refetch, saveSettings } = useGeneralSettings();

  const value = useMemo(
    () => ({
      settings,
      loading,
      saving,
      error,
      refresh: async () => {
        await refetch();
      },
      save: async (payload: GeneralSettings) => {
        const result = await saveSettings(payload);
        return result;
      },
    }),
    [settings, loading, saving, error, refetch, saveSettings],
  );

  return (
    <GeneralSettingsContext.Provider value={value}>
      {children}
    </GeneralSettingsContext.Provider>
  );
};

export const useGeneralSettingsContext = () => {
  const context = useContext(GeneralSettingsContext);
  if (!context) {
    throw new Error(
      "useGeneralSettingsContext harus digunakan di dalam GeneralSettingsProvider",
    );
  }
  return context;
};


