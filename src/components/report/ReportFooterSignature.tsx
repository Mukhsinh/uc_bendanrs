import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useGeneralSettingsContext } from "@/contexts/GeneralSettingsContext";
import {
  buildSignatureBlock,
  normalizeGeneralSettings,
} from "@/utils/generalSettings";

interface ReportFooterSignatureProps {
  className?: string;
  locationLabel?: string;
}

export const ReportFooterSignature: React.FC<ReportFooterSignatureProps> = ({
  className,
  locationLabel,
}) => {
  const { settings } = useGeneralSettingsContext();
  const normalized = normalizeGeneralSettings(settings);
  const signature = buildSignatureBlock(settings);

  const dateText = format(new Date(), "dd MMMM yyyy", { locale: localeId });

  return (
    <div
      className={`mt-12 flex justify-end ${className ?? ""}`.trim()}
    >
      <div className="max-w-xs text-right space-y-2 text-sm text-slate-600">
        <p className="font-semibold text-slate-700">{normalized.institutionName}</p>
        <p>{locationLabel ?? "Pekalongan"}, {dateText}</p>
        <p className="text-slate-500">Mengetahui,</p>
        <div className="pt-12 pb-2">
          <p className="font-semibold text-slate-800 uppercase tracking-wide">
            {signature.nameLine}
          </p>
          <p className="text-slate-500 text-xs">{signature.titleLine}</p>
        </div>
        <p className="text-xs text-slate-400 mt-4">{normalized.footer}</p>
      </div>
    </div>
  );
};


