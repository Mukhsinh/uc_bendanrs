import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface SkenarioTarifAkomodasiRow {
  id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  tarif_vvip?: number;
  tarif_vip?: number;
  tarif_i?: number;
  tarif_ii?: number;
  tarif_iii?: number;
}

interface SkenarioTarifVisitRow {
  id: string;
  tindakan: string;
  jasa_sarana?: number;
  jasa_pelayanan_medis?: number;
  jasa_pelayanan_non_medis?: number;
}

interface SkenarioTarifRow {
  id: string;
  kode_tindakan: string;
  nama_tindakan: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  jasa_sarana?: number;
  jasa_pelayanan_medis?: number;
  jasa_pelayanan_non_medis?: number;
}

interface SkenarioTarifImportExportToolbarProps {
  tahun: number;
  type: "akomodasi" | "visit" | "skenario";
  data: SkenarioTarifAkomodasiRow[] | SkenarioTarifVisitRow[] | SkenarioTarifRow[];
  onImport: (importedData: any[]) => void;
}

const SkenarioTarifImportExportToolbar: React.FC<SkenarioTarifImportExportToolbarProps> = ({
  tahun,
  type,
  data,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Template
  const handleDownloadTemplate = () => {
    if (type === "skenario") {
      if (!data || data.length === 0) {
        toast.error("Belum ada data untuk membuat template");
        return;
      }

      // Gunakan data yang sudah ada dari sistem
      const templateData = (data as SkenarioTarifRow[]).map((row) => ({
        kode_tindakan: row.kode_tindakan,
        nama_tindakan: row.nama_tindakan,
        kode_unit_kerja: row.kode_unit_kerja,
        nama_unit_kerja: row.nama_unit_kerja, // Hanya sebagai pembantu, tidak diupdate
        jasa_sarana: row.jasa_sarana || 0, // Isi dengan nilai existing
        jasa_pelayanan_medis: row.jasa_pelayanan_medis || 0, // Isi dengan nilai existing
        jasa_pelayanan_non_medis: row.jasa_pelayanan_non_medis || 0, // Isi dengan nilai existing
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, `template_skenario_tarif_${tahun}.xlsx`);
    } else if (type === "akomodasi") {
      if (!data || data.length === 0) {
        toast.error("Belum ada data untuk membuat template");
        return;
      }

      // Gunakan data yang sudah ada dari sistem
      const templateData = (data as SkenarioTarifAkomodasiRow[]).map((row) => ({
        kode_unit_kerja: row.kode_unit_kerja,
        nama_unit_kerja: row.nama_unit_kerja,
        tarif_vvip: "", // Kosongkan untuk input manual
        tarif_vip: "", // Kosongkan untuk input manual
        tarif_i: "", // Kosongkan untuk input manual
        tarif_ii: "", // Kosongkan untuk input manual
        tarif_iii: "", // Kosongkan untuk input manual
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, `template_skenario_tarif_akomodasi_${tahun}.xlsx`);
    } else {
      if (!data || data.length === 0) {
        toast.error("Belum ada data untuk membuat template");
        return;
      }

      // Gunakan data yang sudah ada dari sistem
      const templateData = (data as SkenarioTarifVisitRow[]).map((row) => ({
        tindakan: row.tindakan,
        jasa_sarana: "", // Kosongkan untuk input manual
        jasa_pelayanan_medis: "", // Kosongkan untuk input manual
        jasa_pelayanan_non_medis: "", // Kosongkan untuk input manual
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, `template_skenario_tarif_visit_${tahun}.xlsx`);
    }

    toast.success("Template berhasil diunduh");
  };

  // Download Current Data
  const handleDownloadCurrentData = () => {
    if (!data || data.length === 0) {
      toast.error("Belum ada data untuk diunduh");
      return;
    }

    let exportData: any[] = [];

    if (type === "skenario") {
      exportData = (data as SkenarioTarifRow[]).map((row) => ({
        kode_tindakan: row.kode_tindakan,
        nama_tindakan: row.nama_tindakan,
        kode_unit_kerja: row.kode_unit_kerja,
        nama_unit_kerja: row.nama_unit_kerja,
        jasa_sarana: row.jasa_sarana || 0,
        jasa_pelayanan_medis: row.jasa_pelayanan_medis || 0,
        jasa_pelayanan_non_medis: row.jasa_pelayanan_non_medis || 0,
      }));
    } else if (type === "akomodasi") {
      exportData = (data as SkenarioTarifAkomodasiRow[]).map((row) => ({
        kode_unit_kerja: row.kode_unit_kerja,
        nama_unit_kerja: row.nama_unit_kerja,
        tarif_vvip: row.tarif_vvip || 0,
        tarif_vip: row.tarif_vip || 0,
        tarif_i: row.tarif_i || 0,
        tarif_ii: row.tarif_ii || 0,
        tarif_iii: row.tarif_iii || 0,
      }));
    } else {
      exportData = (data as SkenarioTarifVisitRow[]).map((row) => ({
        tindakan: row.tindakan,
        jasa_sarana: row.jasa_sarana || 0,
        jasa_pelayanan_medis: row.jasa_pelayanan_medis || 0,
        jasa_pelayanan_non_medis: row.jasa_pelayanan_non_medis || 0,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    
    const filename = type === "akomodasi" 
      ? `data_skenario_tarif_akomodasi_${tahun}.xlsx`
      : type === "visit"
      ? `data_skenario_tarif_visit_${tahun}.xlsx`
      : `data_skenario_tarif_${tahun}.xlsx`;
    
    XLSX.writeFile(wb, filename);

    toast.success(`Data berhasil diunduh (${exportData.length} baris)`);
  };

  // Import Data
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast.error("File tidak mengandung data");
        return;
      }

      // Validate columns
      if (type === "skenario") {
        const requiredColumns = ["kode_tindakan", "kode_unit_kerja"];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

        if (missingColumns.length > 0) {
          toast.error(`Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(", ")}`);
          return;
        }

        // Process skenario import
        const importedData: any[] = [];
        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          const kodeTindakan = String(row.kode_tindakan || "").trim();
          const kodeUnitKerja = String(row.kode_unit_kerja || "").trim();
          
          if (!kodeTindakan || !kodeUnitKerja) {
            errorCount++;
            continue;
          }

          // Find matching row in current data
          const existingRow = (data as SkenarioTarifRow[]).find(
            (d) => d.kode_tindakan === kodeTindakan && d.kode_unit_kerja === kodeUnitKerja
          );

          if (!existingRow) {
            errorCount++;
            continue;
          }

          // Only update manual input fields
          const updatedRow = {
            id: existingRow.id,
            jasa_sarana: row.jasa_sarana !== undefined ? parseFloat(String(row.jasa_sarana)) : existingRow.jasa_sarana,
            jasa_pelayanan_medis: row.jasa_pelayanan_medis !== undefined ? parseFloat(String(row.jasa_pelayanan_medis)) : existingRow.jasa_pelayanan_medis,
            jasa_pelayanan_non_medis: row.jasa_pelayanan_non_medis !== undefined ? parseFloat(String(row.jasa_pelayanan_non_medis)) : existingRow.jasa_pelayanan_non_medis,
          };

          importedData.push(updatedRow);
          successCount++;
        }

        if (successCount > 0) {
          onImport(importedData);
          toast.success(
            `Import berhasil: ${successCount} data diupdate${errorCount > 0 ? `, ${errorCount} data gagal` : ""}`
          );
        } else {
          toast.error(`Import gagal: ${errorCount} data tidak valid`);
        }
      } else if (type === "akomodasi") {
        const requiredColumns = ["kode_unit_kerja"];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

        if (missingColumns.length > 0) {
          toast.error(`Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(", ")}`);
          return;
        }

        // Process akomodasi import
        const importedData: any[] = [];
        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          const kodeUnitKerja = String(row.kode_unit_kerja || "").trim();
          
          if (!kodeUnitKerja) {
            errorCount++;
            continue;
          }

          // Find matching row in current data
          const existingRow = (data as SkenarioTarifAkomodasiRow[]).find(
            (d) => d.kode_unit_kerja === kodeUnitKerja
          );

          if (!existingRow) {
            errorCount++;
            continue;
          }

          // Only update manual input fields (tarif)
          const updatedRow = {
            id: existingRow.id,
            tarif_vvip: row.tarif_vvip !== undefined ? parseFloat(String(row.tarif_vvip)) : existingRow.tarif_vvip,
            tarif_vip: row.tarif_vip !== undefined ? parseFloat(String(row.tarif_vip)) : existingRow.tarif_vip,
            tarif_i: row.tarif_i !== undefined ? parseFloat(String(row.tarif_i)) : existingRow.tarif_i,
            tarif_ii: row.tarif_ii !== undefined ? parseFloat(String(row.tarif_ii)) : existingRow.tarif_ii,
            tarif_iii: row.tarif_iii !== undefined ? parseFloat(String(row.tarif_iii)) : existingRow.tarif_iii,
          };

          importedData.push(updatedRow);
          successCount++;
        }

        if (successCount > 0) {
          onImport(importedData);
          toast.success(
            `Import berhasil: ${successCount} data diupdate${errorCount > 0 ? `, ${errorCount} data gagal` : ""}`
          );
        } else {
          toast.error(`Import gagal: ${errorCount} data tidak valid`);
        }
      } else {
        // Process visit import
        const requiredColumns = ["tindakan"];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

        if (missingColumns.length > 0) {
          toast.error(`Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(", ")}`);
          return;
        }

        const importedData: any[] = [];
        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          const tindakan = String(row.tindakan || "").trim();
          
          if (!tindakan) {
            errorCount++;
            continue;
          }

          // Find matching row in current data
          const existingRow = (data as SkenarioTarifVisitRow[]).find(
            (d) => d.tindakan === tindakan
          );

          if (!existingRow) {
            errorCount++;
            continue;
          }

          // Only update manual input fields
          const updatedRow = {
            id: existingRow.id,
            jasa_sarana: row.jasa_sarana !== undefined ? parseFloat(String(row.jasa_sarana)) : existingRow.jasa_sarana,
            jasa_pelayanan_medis: row.jasa_pelayanan_medis !== undefined ? parseFloat(String(row.jasa_pelayanan_medis)) : existingRow.jasa_pelayanan_medis,
            jasa_pelayanan_non_medis: row.jasa_pelayanan_non_medis !== undefined ? parseFloat(String(row.jasa_pelayanan_non_medis)) : existingRow.jasa_pelayanan_non_medis,
          };

          importedData.push(updatedRow);
          successCount++;
        }

        if (successCount > 0) {
          onImport(importedData);
          toast.success(
            `Import berhasil: ${successCount} data diupdate${errorCount > 0 ? `, ${errorCount} data gagal` : ""}`
          );
        } else {
          toast.error(`Import gagal: ${errorCount} data tidak valid`);
        }
      }
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error(error.message || "Terjadi kesalahan saat mengimport data");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadTemplate}
        className="shadow-sm bg-green-600 text-white hover:bg-green-700 border-green-600"
      >
        <Download className="h-4 w-4 mr-2" />
        Unduh Template
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadCurrentData}
        disabled={!data || data.length === 0}
        className="shadow-sm bg-orange-600 text-white hover:bg-orange-700 border-orange-600"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Unduh Data Saat Ini
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportData}
      />
      <Button
        variant="default"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={!data || data.length === 0}
        className="shadow-sm bg-purple-600 text-white hover:bg-purple-700"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Data
      </Button>
    </div>
  );
};

export default SkenarioTarifImportExportToolbar;
