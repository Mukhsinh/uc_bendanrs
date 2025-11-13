import { createContext, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGeneralSettingsContext } from "@/contexts/GeneralSettingsContext";
import {
  ReportDataset,
  ReportFilters,
  buildDatasetFromRecords,
  generateReportExcel,
  generateReportPdf,
} from "@/utils/reportExport";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

type DownloadFormat = "pdf" | "excel";

type PdfOrientation = "portrait" | "landscape";

interface ReportDownloadRequest {
  title: string;
  subtitle?: string;
  filename: string;
  filters?: ReportFilters;
  dataset?: ReportDataset<Record<string, unknown>>;
  records?: Record<string, unknown>[];
  orientation?: PdfOrientation;
}

interface ReportDownloadContextValue {
  downloadReport: (request: ReportDownloadRequest) => Promise<void>;
}

interface PendingRequest {
  request: ReportDownloadRequest;
  dataset: ReportDataset<Record<string, unknown>>;
  resolve: () => void;
  reject: (reason?: unknown) => void;
}

const ReportDownloadContext = createContext<ReportDownloadContextValue | undefined>(undefined);

export const ReportDownloadProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { settings } = useGeneralSettingsContext();

  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [loadingFormat, setLoadingFormat] = useState<DownloadFormat | null>(null);

  const downloadReport = async (request: ReportDownloadRequest) => {
    const dataset =
      request.dataset ??
      (request.records ? buildDatasetFromRecords(request.records) : { columns: [], rows: [] });

    if (!dataset.columns.length || !dataset.rows.length) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data yang siap untuk diunduh.",
        variant: "destructive",
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      setPending({
        request,
        dataset,
        resolve,
        reject,
      });
    });
  };

  const formatFilters = useMemo(() => {
    if (!pending?.request.filters) return [];
    return Object.entries(pending.request.filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );
  }, [pending]);

  const handleClose = () => {
    if (loadingFormat) return;
    pending?.reject(new Error("Pengunduhan dibatalkan."));
    setPending(null);
  };

  const handleDownload = async (format: DownloadFormat) => {
    if (!pending) return;
    setLoadingFormat(format);
    try {
      const commonOptions = {
        title: pending.request.title,
        subtitle: pending.request.subtitle,
        filename: pending.request.filename,
        columns: pending.dataset.columns,
        rows: pending.dataset.rows,
        filters: pending.request.filters,
        settings,
        orientation: pending.request.orientation,
      };

      if (format === "pdf") {
        await generateReportPdf(commonOptions);
      } else {
        await generateReportExcel(commonOptions);
      }

      toast({
        title: "Berhasil",
        description: `Laporan ${format === "pdf" ? "PDF" : "Excel"} berhasil diunduh.`,
      });
      pending.resolve();
      setPending(null);
    } catch (error) {
      console.error("Gagal mengunduh laporan:", error);
      toast({
        title: `Gagal mengunduh ${format === "pdf" ? "PDF" : "Excel"}`,
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat laporan.",
        variant: "destructive",
      });
      pending.reject(error);
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <ReportDownloadContext.Provider value={{ downloadReport }}>
      {children}
      <Dialog open={!!pending} onOpenChange={(open) => (!open ? handleClose() : void 0)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pilih Format Unduhan</DialogTitle>
            <DialogDescription>
              {pending?.request.title ?? "Pilih format laporan yang akan diunduh."}
            </DialogDescription>
          </DialogHeader>
          {pending && (
            <div className="space-y-4">
              {pending.request.subtitle && (
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {pending.request.subtitle}
                </div>
              )}

              {formatFilters.length > 0 && (
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">Filter laporan:</div>
                  <ul className="space-y-0.5">
                    {formatFilters.map(([label, value]) => (
                      <li key={label} className="flex justify-between gap-2">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="truncate text-slate-600">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={() => handleDownload("pdf")}
                  disabled={loadingFormat !== null}
                  className="flex items-center justify-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
                >
                  {loadingFormat === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Unduh PDF
                </Button>
                <Button
                  onClick={() => handleDownload("excel")}
                  disabled={loadingFormat !== null}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {loadingFormat === "excel" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Unduh Excel
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={loadingFormat !== null}
                className="w-full"
              >
                Batal
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ReportDownloadContext.Provider>
  );
};

export const useReportDownload = () => {
  const context = useContext(ReportDownloadContext);
  if (!context) {
    throw new Error("useReportDownload harus digunakan di dalam ReportDownloadProvider.");
  }

  return context;
};

