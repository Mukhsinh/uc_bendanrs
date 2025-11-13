import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGeneralSettingsContext } from "@/contexts/GeneralSettingsContext";
import {
  ReportFilters,
  ReportTableColumn,
  generateReportExcel,
  generateReportPdf,
} from "@/utils/reportExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AnyRow = Record<string, unknown>;

interface ReportToolbarProps {
  title: string;
  subtitle?: string;
  filename: string;
  columns?: ReportTableColumn<AnyRow>[];
  rows?: AnyRow[];
  filters?: ReportFilters;
  className?: string;
}

export const ReportToolbar = ({
  title,
  subtitle,
  filename,
  columns,
  rows,
  filters,
  className,
}: ReportToolbarProps) => {
  const { toast } = useToast();
  const { settings } = useGeneralSettingsContext();

  const [exportState, setExportState] = useState<"idle" | "pdf" | "excel">(
    "idle",
  );

  const handleExportPdf = async () => {
    setExportState("pdf");
    try {
      const dataset = { columns, rows };
      await generateReportPdf({
        title,
        subtitle,
        filename,
        columns: dataset.columns,
        rows: dataset.rows,
        filters,
        settings,
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
          error instanceof Error ? error.message : "Terjadi kesalahan saat membuat PDF.",
        variant: "destructive",
      });
    } finally {
      setExportState("idle");
    }
  };

  const handleExportExcel = async () => {
    setExportState("excel");
    try {
      const dataset = { columns, rows };
      await generateReportExcel({
        title,
        subtitle,
        filename,
        columns: dataset.columns,
        rows: dataset.rows,
        filters,
        settings,
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
          error instanceof Error ? error.message : "Terjadi kesalahan saat membuat Excel.",
        variant: "destructive",
      });
    } finally {
      setExportState("idle");
    }
  };

  const disabled =
    !columns ||
    !rows ||
    columns.length === 0 ||
    rows.length === 0;
  const busy = exportState !== "idle";

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 ${className ?? ""}`.trim()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            disabled={disabled || busy}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
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


