import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useGeneralSettingsContext } from "@/contexts/GeneralSettingsContext";
import { normalizeGeneralSettings } from "@/utils/generalSettings";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  subtitle,
  description,
}) => {
  const { settings } = useGeneralSettingsContext();
  const normalized = normalizeGeneralSettings(settings);

  const today = format(new Date(), "EEEE, dd MMMM yyyy", {
    locale: localeId,
  });

  return (
    <div className="rounded-xl overflow-hidden border border-teal-100 shadow-sm bg-white">
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 text-white px-6 py-5 flex flex-wrap items-center gap-5">
        <div className="w-16 h-16 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden shadow-inner">
          <img
            src={normalized.logoUrl}
            alt="Logo Instansi"
            className="object-contain h-12 w-12"
          />
        </div>
        <div className="flex-1 min-w-[220px] space-y-1">
          <p className="text-xs tracking-[0.2em] uppercase font-medium text-white/80">
            {normalized.appName}
          </p>
          <h1 className="text-2xl font-semibold tracking-wide drop-shadow-sm">
            {normalized.institutionName}
          </h1>
          <p className="text-sm text-white/85">{normalized.address}</p>
        </div>
        <div className="text-right text-white/80 text-sm">
          <p>{today}</p>
        </div>
      </div>
      <div className="px-6 py-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between bg-white">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {description && (
            <p className="text-xs text-slate-400 mt-2">{description}</p>
          )}
        </div>
        <div className="text-sm text-right text-slate-500">
          <p className="font-semibold text-slate-600">Identitas Pelapor</p>
          <p>{normalized.jobTitle}</p>
          <p className="font-medium text-slate-700">{normalized.officerName}</p>
        </div>
      </div>
    </div>
  );
};


