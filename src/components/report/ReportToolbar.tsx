import { ComponentProps, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ReportFilters, ReportTableColumn } from "@/utils/reportExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReportDownload } from "./ReportDownloadProvider";

type AnyRow = Record<string, unknown>;

interface ReportToolbarProps {
  title: string;
  subtitle?: string;
  filename: string;
  columns?: ReportTableColumn<AnyRow>[];
  rows?: AnyRow[];
  filters?: ReportFilters;
  className?: string;
  prepareDataset?: () =>
    | {
        columns: ReportTableColumn<AnyRow>[];
        rows: AnyRow[];
      }
    | Promise<{
        columns: ReportTableColumn<AnyRow>[];
        rows: AnyRow[];
      }>;
  align?: "start" | "center" | "end";
  buttonVariant?: ComponentProps<typeof Button>["variant"];
  buttonSize?: ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
  orientation?: "portrait" | "landscape";
}

export const ReportToolbar = ({
  title,
  subtitle,
  filename,
  columns,
  rows,
  filters,
  className,
  prepareDataset,
  align = "end",
  buttonVariant = "default",
  buttonSize = "sm",
  buttonClassName,
  orientation = "portrait",
}: ReportToolbarProps) => {
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();

  const [exportState, setExportState] = useState<"idle" | "pdf" | "excel">(
    "idle",
  );

  const resolveDataset = async () => {
    if (prepareDataset) {
      const result = await prepareDataset();
      if (!result?.columns || !result?.rows) {
        throw new Error("Data laporan belum siap.");
      }
      if (result.columns.length === 0 || result.rows.length === 0) {
        throw new Error("Tidak ada data yang dapat diunduh.");
      }
      return result;
    }

    if (!columns || !rows || columns.length === 0 || rows.length === 0) {
      throw new Error("Data laporan belum siap atau kosong.");
    }

    return { columns, rows };
  };

  const handleExportPdf = async () => {
    setExportState("pdf");
    try {
      const dataset = await resolveDataset();
      await downloadReport({
        title,
        subtitle,
        filename,
        filters,
        dataset,
        orientation,
      });
      toast({
        title: "Berhasil",
        description: "Laporan PDF berhasil diunduh.",
      });
    } catch (error) {
      console.error("Gagal menghasilkan PDF:", error);
      toast({
        title: "Gagal mengunduh PDF",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat PDF.",
        variant: "destructive",
      });
    } finally {
      setExportState("idle");
    }
  };

  const handleExportExcel = async () => {
    setExportState("excel");
    try {
      const dataset = await resolveDataset();
      await downloadReport({
        title,
        subtitle,
        filename,
        filters,
        dataset,
        orientation,
      });
      toast({
        title: "Berhasil",
        description: "Laporan Excel berhasil diunduh.",
      });
    } catch (error) {
      console.error("Gagal menghasilkan Excel:", error);
      toast({
        title: "Gagal mengunduh Excel",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat Excel.",
        variant: "destructive",
      });
    } finally {
      setExportState("idle");
    }
  };

  const disabled =
    !prepareDataset &&
    (!columns ||
      !rows ||
      columns.length === 0 ||
      rows.length === 0);
  const busy = exportState !== "idle";

  const alignmentClass =
    align === "start" ? "justify-start" : align === "center" ? "justify-center" : "justify-end";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${alignmentClass} ${className ?? ""}`.trim()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={buttonVariant}
            size={buttonSize}
            disabled={disabled || busy}
            className={`gap-2 ${buttonClassName ?? "bg-teal-600 hover:bg-teal-700"}`.trim()}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Unduh Laporan
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Pilih Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              if (!busy) {
                void handleExportPdf();
              }
            }}
          >
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              if (!busy) {
                void handleExportExcel();
              }
            }}
          >
            Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};


