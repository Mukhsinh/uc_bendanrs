import jsPDF from "jspdf";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  GeneralSettings,
  defaultGeneralSettings,
} from "@/hooks/useGeneralSettings";
import {
  buildSignatureBlock,
  generalSettingsToMetadata,
  normalizeGeneralSettings,
} from "@/utils/generalSettings";

type Align = "left" | "center" | "right";

export interface ReportTableColumn<Row = Record<string, unknown>> {
  key: keyof Row | string;
  header: string;
  width?: number;
  align?: Align;
  formatter?: (
    value: unknown,
    row: Row,
    rowIndex: number,
    columnIndex: number
  ) => string | number | null | undefined;
  excelFormatter?: (
    value: unknown,
    row: Row,
    rowIndex: number,
    columnIndex: number
  ) => string | number | null | undefined;
}

export interface ReportFilters {
  [label: string]: string | number | undefined | null;
}

interface BaseReportOptions<Row> {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ReportTableColumn<Row>[];
  rows: Row[];
  filters?: ReportFilters;
  settings?: GeneralSettings;
}

const margin = 15; // 1.5 cm
const tableHeaderHeight = 10;
const rowLineHeight = 5;
const cellPaddingX = 3;
const cellPaddingY = 2.5;
const headerGradientSteps = 24;
const headerStartColor: [number, number, number] = [13, 148, 136]; // teal-600
const headerEndColor: [number, number, number] = [14, 165, 233]; // cyan-500
const tableHeaderColor: [number, number, number] = [15, 118, 110]; // teal-700

const imageCache = new Map<string, string>();

const ensureSettings = (settings?: GeneralSettings) =>
  settings ?? defaultGeneralSettings;

const resolveCellValue = <Row,>(
  column: ReportTableColumn<Row>,
  row: Row,
  rowIndex: number,
  columnIndex: number
) => {
  const raw =
    column.formatter?.(
      (row as Record<string, unknown>)[column.key as string],
      row,
      rowIndex,
      columnIndex
    ) ?? (row as Record<string, unknown>)[column.key as string];

  if (raw === undefined || raw === null) return "-";
  if (typeof raw === "number") return Number.isFinite(raw) ? raw.toString() : "-";
  const text = String(raw).trim();
  return text.length === 0 ? "-" : text;
};

const drawGradientBar = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  for (let i = 0; i < headerGradientSteps; i++) {
    const ratio = i / Math.max(headerGradientSteps - 1, 1);
    const r = Math.round(
      headerStartColor[0] +
        (headerEndColor[0] - headerStartColor[0]) * ratio
    );
    const g = Math.round(
      headerStartColor[1] +
        (headerEndColor[1] - headerStartColor[1]) * ratio
    );
    const b = Math.round(
      headerStartColor[2] +
        (headerEndColor[2] - headerStartColor[2]) * ratio
    );
    pdf.setFillColor(r, g, b);
    pdf.rect(
      x + (width / headerGradientSteps) * i,
      y,
      width / headerGradientSteps + 0.2,
      height,
      "F"
    );
  }
};

const addLogoToPdf = async (
  pdf: jsPDF,
  logoUrl: string,
  x: number,
  y: number,
  size: number
) => {
  if (!logoUrl) return;
  try {
    let dataUrl = imageCache.get(logoUrl);
    if (!dataUrl) {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = bitmap.width;
      offscreenCanvas.height = bitmap.height;
      const ctx = offscreenCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (maxChannel - minChannel < 40 && luminance > 220) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        dataUrl = offscreenCanvas.toDataURL("image/png");
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Gagal membaca logo instansi"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      }
      imageCache.set(logoUrl, dataUrl);
    }
    pdf.addImage(dataUrl, "PNG", x, y, size, size, undefined, "FAST");
  } catch (error) {
    console.warn("Tidak dapat memuat logo instansi:", error);
  }
};

const createHeaderSection = async (
  pdf: jsPDF,
  options: BaseReportOptions<Record<string, unknown>>
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const headerHeight = 24;
  const headerWidth = pageWidth - margin * 2;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, margin, headerWidth, headerHeight, 4, 4, "F");
  pdf.setDrawColor(14, 165, 233);
  pdf.setLineWidth(0.15);
  pdf.roundedRect(margin, margin, headerWidth, headerHeight, 4, 4, "S");

  const metadata = generalSettingsToMetadata(ensureSettings(options.settings));
  const normalized = normalizeGeneralSettings(options.settings);
  const logoSize = 20;
  await addLogoToPdf(pdf, metadata.logoUrl, margin + 6, margin + 4, logoSize);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(18, 53, 91);
  pdf.setFontSize(13);
  pdf.text(metadata.organization, margin + logoSize + 14, margin + 13);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.text(normalized.address, margin + logoSize + 14, margin + 19, {
    maxWidth: headerWidth - logoSize - 24,
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(28, 58, 118);
  pdf.text(options.title, margin, margin + headerHeight + 6, {
    maxWidth: headerWidth,
  });
  if (options.subtitle) {
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text(options.subtitle, margin, margin + headerHeight + 14, {
      maxWidth: headerWidth,
    });
  }

  const filters = options.filters
    ? Object.entries(options.filters)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([label, value]) => `${label}: ${value}`)
    : [];
  if (filters.length > 0) {
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    const filterText = filters.join("   ·   ");
    pdf.text(filterText, margin, margin + headerHeight + 28, {
      maxWidth: pageWidth - margin * 2,
    });
  }

  const printedAt = format(new Date(), "dd MMMM yyyy HH:mm", {
    locale: localeId,
  });
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Dicetak: ${printedAt}`, pageWidth - margin, margin + headerHeight + 4, {
    align: "right",
  });

  return margin + headerHeight + (options.subtitle ? 16 : 6) + (filters.length > 0 ? 12 : 0);
};

const computeColumnWidths = <Row,>(
  columns: ReportTableColumn<Row>[],
  availableWidth: number
) => {
  const totalWeight = columns.reduce(
    (sum, col) => sum + (col.width ?? 1),
    0
  );
  return columns.map(
    (col) => ((col.width ?? 1) / totalWeight) * availableWidth
  );
};

const ensureWithinPage = (
  pdf: jsPDF,
  currentY: number,
  requiredHeight: number
) => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (currentY + requiredHeight > pageHeight - margin) {
    pdf.addPage();
    return margin;
  }
  return currentY;
};

const drawTableHeader = <Row,>(
  pdf: jsPDF,
  columns: ReportTableColumn<Row>[],
  colWidths: number[],
  startY: number
) => {
  const rowWidth = colWidths.reduce((a, b) => a + b, 0);
  drawGradientBar(pdf, margin, startY, rowWidth, tableHeaderHeight);
  pdf.setDrawColor(12, 74, 110);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(margin, startY, rowWidth, tableHeaderHeight, 2, 2, "S");

  let currentX = margin;
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);

  columns.forEach((column, index) => {
    const width = colWidths[index];
    if (index > 0) {
      pdf.setDrawColor(255, 255, 255, 0.2);
      pdf.line(currentX, startY, currentX, startY + tableHeaderHeight);
    }
    const textX = currentX + width / 2;
    pdf.text(column.header.toUpperCase(), textX, startY + tableHeaderHeight / 2, {
      align: "center",
      maxWidth: width - cellPaddingX * 2,
      baseline: "middle",
    });
    currentX += width;
  });

  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "normal");
};

const drawTableBody = <Row,>(
  pdf: jsPDF,
  columns: ReportTableColumn<Row>[],
  colWidths: number[],
  startY: number,
  rows: Row[]
) => {
  let currentY = startY + tableHeaderHeight;
  const pageHeight = pdf.internal.pageSize.getHeight();

  rows.forEach((row, rowIndex) => {
    // Determine row content
    const cellData = columns.map((column, columnIndex) => {
      const value = resolveCellValue(column, row, rowIndex, columnIndex);
      const maxWidth = Math.max(colWidths[columnIndex] - cellPaddingX * 2, 12);
      const lines = pdf.splitTextToSize(value, maxWidth);
      const baseHeight = rowLineHeight * 2.5;
      const contentHeight = Math.max(lines.length * rowLineHeight, rowLineHeight);
      const height = Math.max(contentHeight + cellPaddingY * 2, baseHeight);
      return { value, lines, height, align: column.align ?? "left" };
    });

    const rowHeight = Math.max(...cellData.map((cell) => cell.height));
    if (currentY + rowHeight > pageHeight - margin) {
      pdf.addPage();
      drawTableHeader(pdf, columns, colWidths, margin);
      currentY = margin + tableHeaderHeight;
    }

    let currentX = margin;
    const rowWidth = colWidths.reduce((a, b) => a + b, 0);
    pdf.setFillColor(rowIndex % 2 === 0 ? 249 : 255, 250, 252);
    pdf.roundedRect(currentX, currentY, rowWidth, rowHeight, 1.5, 1.5, "F");

    cellData.forEach((cell, columnIndex) => {
      const cellX = currentX + cellPaddingX;
      let textY = currentY + cellPaddingY + rowLineHeight - 0.5;
      pdf.setTextColor(15, 23, 42);

      cell.lines.forEach((line) => {
        pdf.setFontSize(9);
        let align: Align | undefined;
        if (cell.align === "center") {
          align = "center";
        } else if (cell.align === "right") {
          align = "right";
        }

        if (align === "center") {
          pdf.text(line, currentX + colWidths[columnIndex] / 2, textY, {
            align: "center",
            maxWidth: colWidths[columnIndex] - cellPaddingX * 2,
          });
        } else if (align === "right") {
          pdf.text(line, currentX + colWidths[columnIndex] - cellPaddingX, textY, {
            align: "right",
            maxWidth: colWidths[columnIndex] - cellPaddingX * 2,
          });
        } else {
          pdf.text(line, cellX, textY, {
            align: "left",
            maxWidth: colWidths[columnIndex] - cellPaddingX * 2,
          });
        }
        textY += rowLineHeight + 0.5;
      });

      currentX += colWidths[columnIndex];
    });

    currentY += rowHeight;
  });

  return currentY;
};

const drawFooter = (
  pdf: jsPDF,
  currentY: number,
  settings: GeneralSettings
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const normalized = normalizeGeneralSettings(settings);
  const signature = buildSignatureBlock(settings);

  const signatureWidth = 70;
  currentY = ensureWithinPage(pdf, currentY + 8, 34);
  const signatureX = pageWidth - margin - signatureWidth;

  const dateText = format(new Date(), "dd MMMM yyyy", { locale: localeId });

  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(normalized.institutionName, signatureX + signatureWidth / 2, currentY, {
    align: "center",
  });
  pdf.text(`Tanggal: ${dateText}`, signatureX + signatureWidth / 2, currentY + 5, {
    align: "center",
  });

  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    "Mengetahui,",
    signatureX + signatureWidth / 2,
    currentY + 12,
    { align: "center" }
  );

  pdf.setDrawColor(148, 163, 184);
  pdf.setLineWidth(0.2);
  pdf.line(
    signatureX + 10,
    currentY + 26,
    signatureX + signatureWidth - 10,
    currentY + 26
  );

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text(
    signature.nameLine.toUpperCase(),
    signatureX + signatureWidth / 2,
    currentY + 24,
    { align: "center" }
  );

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.text(signature.titleLine, signatureX + signatureWidth / 2, currentY + 32, {
    align: "center",
  });
};

const applyFooterToAllPages = (pdf: jsPDF, footerText: string) => {
  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.text(footerText, pdf.internal.pageSize.getWidth() / 2, pageHeight - 8, {
      align: "center",
    });
    pdf.text(
      `Halaman ${page} / ${totalPages}`,
      pdf.internal.pageSize.getWidth() - margin,
      pageHeight - 8,
      {
        align: "right",
      },
    );
  }
};

export const generateReportPdf = async <Row,>(
  options: BaseReportOptions<Row>
) => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.setFont("helvetica", "normal");

  const stabilizedSettings = ensureSettings(options.settings);
  const normalizedSettings = normalizeGeneralSettings(stabilizedSettings);

  const contentStartY = await createHeaderSection(pdf, {
    ...options,
    settings: stabilizedSettings,
  } as BaseReportOptions<Record<string, unknown>>);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const availableWidth = pageWidth - margin * 2;
  const colWidths = computeColumnWidths(options.columns, availableWidth);

  drawTableHeader(pdf, options.columns, colWidths, contentStartY + 4);

  const endY = drawTableBody(
    pdf,
    options.columns,
    colWidths,
    contentStartY + 4,
    options.rows
  );

  drawFooter(pdf, endY, stabilizedSettings);
  applyFooterToAllPages(pdf, normalizedSettings.footer);

  pdf.save(`${options.filename}.pdf`);
};

export const generateReportExcel = <Row,>(options: BaseReportOptions<Row>) => {
  const rows: (string | number)[][] = [];

  const normalized = normalizeGeneralSettings(options.settings);
  rows.push([normalized.institutionName]);
  rows.push([normalized.address]);
  rows.push([`Laporan: ${options.title}`]);
  if (options.subtitle) {
    rows.push([options.subtitle]);
  }
  if (options.filters) {
    Object.entries(options.filters).forEach(([label, value]) => {
      if (value !== undefined && value !== null) {
        rows.push([`${label}`, String(value)]);
      }
    });
  }
  rows.push([]);

  const headers = options.columns.map((column) => column.header);
  rows.push(headers);

  options.rows.forEach((row, rowIndex) => {
    const rowData = options.columns.map((column, columnIndex) => {
      const formatter = column.excelFormatter ?? column.formatter;
      const raw =
        formatter?.(
          (row as Record<string, unknown>)[column.key as string],
          row,
          rowIndex,
          columnIndex
        ) ?? (row as Record<string, unknown>)[column.key as string];
      if (raw === undefined || raw === null) return "-";
      return typeof raw === "number" ? raw : String(raw);
    });
    rows.push(rowData);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = options.columns.map((column) => ({
    wch: Math.max(12, column.header.length + 4),
  }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: rows.length - options.rows.length - 1 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${options.filename}.xlsx`);
};


