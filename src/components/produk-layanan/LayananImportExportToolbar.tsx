import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface LayananItem {
  kode_tindakan: string;
  nama_tindakan: string;
  jasa_sarana?: number;
  biaya_bahan?: number;
  tarif?: number;
  qty: number;
  subtotal: number;
  tipe_dokter?: string;
  kode_operator?: string;
  nama_operator?: string;
}

interface LayananImportExportToolbarProps {
  tahun: number;
  allServices: {
    tindakan: any[];
    ibs: any[];
    laboratorium: any[];
    radiologi: any[];
    akomodasi: any[];
    visite: any[];
    konsultasi: any[];
  };
  onImport: (data: {
    tindakan: LayananItem[];
    ibs: LayananItem[];
    laboratorium: LayananItem[];
    radiologi: LayananItem[];
    akomodasi: LayananItem[];
    visite: LayananItem[];
    konsultasi: LayananItem[];
  }) => void;
}

const LayananImportExportToolbar: React.FC<LayananImportExportToolbarProps> = ({
  tahun,
  allServices,
  onImport,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const headers = ["jenis_layanan", "kode_tindakan", "nama_tindakan", "qty"];
    const sampleData = [
      ["tindakan", "CONTOH.001", "Contoh Tindakan 1", "1"],
      ["ibs", "IBS.001", "Contoh IBS 1", "2"],
      ["laboratorium", "LAB.001", "Contoh Lab 1", "1"],
      ["radiologi", "RAD.001", "Contoh Radiologi 1", "1"],
      ["akomodasi", "AKOM.VIP", "Kamar VIP", "3"],
      ["visite", "VISIT.UMUM", "Visit Dokter Umum", "1"],
      ["konsultasi", "KONSUL.SPESIALIS", "Konsultasi Dokter Spesialis", "1"],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `template_layanan_${tahun}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Template layanan berhasil diunduh",
    });
  };

  // Download Master Layanan
  const handleDownloadMasterLayanan = () => {
    const allData: any[] = [];

    // Tindakan
    allServices.tindakan.forEach((service) => {
      allData.push({
        jenis_layanan: "tindakan",
        kode_tindakan: service.kode_tindakan || "",
        nama_tindakan: service.nama_tindakan || "",
        jasa_sarana: service.jasa_sarana || 0,
        biaya_bahan: service.biaya_bahan || 0,
        kode_operator: service.kode_operator || "",
        nama_operator: service.nama_operator || "",
      });
    });

    // IBS
    allServices.ibs.forEach((service) => {
      allData.push({
        jenis_layanan: "ibs",
        kode_tindakan: service.kode_tindakan || "",
        nama_tindakan: service.nama_tindakan || "",
        jasa_sarana: service.jasa_sarana || 0,
        biaya_bahan: service.biaya_bahan || 0,
        kode_operator: service.kode_operator || "",
        nama_operator: service.nama_operator || "",
      });
    });

    // Laboratorium
    allServices.laboratorium.forEach((service) => {
      allData.push({
        jenis_layanan: "laboratorium",
        kode_tindakan: service.kode_tindakan || "",
        nama_tindakan: service.nama_tindakan || "",
        jasa_sarana: service.jasa_sarana || 0,
        biaya_bahan: service.biaya_bahan || 0,
      });
    });

    // Radiologi
    allServices.radiologi.forEach((service) => {
      allData.push({
        jenis_layanan: "radiologi",
        kode_tindakan: service.kode_tindakan || "",
        nama_tindakan: service.nama_tindakan || "",
        jasa_sarana: service.jasa_sarana || 0,
        biaya_bahan: service.biaya_bahan || 0,
      });
    });

    // Akomodasi
    allServices.akomodasi.forEach((service) => {
      allData.push({
        jenis_layanan: "akomodasi",
        kode_tindakan: service.kode_tindakan || "",
        nama_tindakan: service.nama_tindakan || "",
        tarif: service.tarif || 0,
      });
    });

    // Visite
    allServices.visite.forEach((service) => {
      allData.push({
        jenis_layanan: "visite",
        kode_tindakan: service.kode_tindakan || "",
        nama_tindakan: service.nama_tindakan || "",
        jasa_sarana: service.jasa_sarana || 0,
        tipe_dokter: service.tipe_dokter || "",
      });
    });

    // Konsultasi
    allServices.konsultasi.forEach((service) => {
      allData.push({
        jenis_layanan: "konsultasi",
        kode_tindakan: service.kode_tindakan || "",
        nama_tindakan: service.nama_tindakan || "",
        jasa_sarana: service.jasa_sarana || 0,
        tipe_dokter: service.tipe_dokter || "",
      });
    });

    if (allData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data master layanan untuk diunduh",
        variant: "destructive",
      });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Layanan");
    XLSX.writeFile(wb, `master_layanan_${tahun}.xlsx`);

    toast({
      title: "Berhasil",
      description: `Master layanan berhasil diunduh (${allData.length} data)`,
    });
  };

  // Import Data
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast({
          title: "Error",
          description: "File tidak mengandung data",
          variant: "destructive",
        });
        return;
      }

      // Validate required columns
      const requiredColumns = ["jenis_layanan", "kode_tindakan", "nama_tindakan", "qty"];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

      if (missingColumns.length > 0) {
        toast({
          title: "Error",
          description: `Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      // Process import data
      const importedData = {
        tindakan: [] as LayananItem[],
        ibs: [] as LayananItem[],
        laboratorium: [] as LayananItem[],
        radiologi: [] as LayananItem[],
        akomodasi: [] as LayananItem[],
        visite: [] as LayananItem[],
        konsultasi: [] as LayananItem[],
      };

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        const jenisLayanan = String(row.jenis_layanan || "").trim().toLowerCase();
        const kodeTindakan = String(row.kode_tindakan || "").trim();
        const namaTindakan = String(row.nama_tindakan || "").trim();
        const qtyValue = parseInt(String(row.qty || "1"));

        if (!jenisLayanan || !kodeTindakan || !namaTindakan) {
          errorCount++;
          continue;
        }

        if (qtyValue <= 0) {
          errorCount++;
          continue;
        }

        // Find service in available services
        let serviceList: any[] = [];
        let filterType = jenisLayanan;

        switch (jenisLayanan) {
          case "tindakan":
            serviceList = allServices.tindakan;
            break;
          case "ibs":
            serviceList = allServices.ibs;
            break;
          case "laboratorium":
            serviceList = allServices.laboratorium;
            break;
          case "radiologi":
            serviceList = allServices.radiologi;
            break;
          case "akomodasi":
            serviceList = allServices.akomodasi;
            break;
          case "visite":
            serviceList = allServices.visite;
            break;
          case "konsultasi":
            serviceList = allServices.konsultasi;
            break;
          default:
            errorCount++;
            continue;
        }

        const service = serviceList.find(
          (s) =>
            s.kode_tindakan === kodeTindakan ||
            s.nama_tindakan.toLowerCase() === namaTindakan.toLowerCase()
        );

        if (!service) {
          errorCount++;
          continue;
        }

        // Create item based on filter type
        let newItem: LayananItem;
        let itemTotal = 0;

        if (filterType === "akomodasi") {
          itemTotal = (service.tarif || 0) * qtyValue;
          newItem = {
            kode_tindakan: service.kode_tindakan,
            nama_tindakan: service.nama_tindakan,
            tarif: service.tarif || 0,
            qty: qtyValue,
            subtotal: itemTotal,
          };
        } else if (filterType === "visite" || filterType === "konsultasi") {
          itemTotal = (service.jasa_sarana || 0) * qtyValue;
          newItem = {
            kode_tindakan: service.kode_tindakan,
            nama_tindakan: service.nama_tindakan,
            jasa_sarana: service.jasa_sarana || 0,
            biaya_bahan: 0,
            qty: qtyValue,
            subtotal: itemTotal,
            tipe_dokter: service.tipe_dokter,
          };
        } else {
          const jasaSarana = service.jasa_sarana || 0;
          const biayaBahan = service.biaya_bahan || 0;
          itemTotal = (jasaSarana + biayaBahan) * qtyValue;

          newItem = {
            kode_tindakan: service.kode_tindakan,
            nama_tindakan: service.nama_tindakan,
            jasa_sarana: jasaSarana,
            biaya_bahan: biayaBahan,
            qty: qtyValue,
            subtotal: itemTotal,
            kode_operator: service.kode_operator,
            nama_operator: service.nama_operator,
          };
        }

        importedData[filterType as keyof typeof importedData].push(newItem);
        successCount++;
      }

      if (successCount > 0) {
        onImport(importedData);

        toast({
          title: "Import Berhasil",
          description: `${successCount} data berhasil diimport${errorCount > 0 ? `, ${errorCount} data gagal` : ""}`,
        });
      } else {
        toast({
          title: "Import Gagal",
          description: `Tidak ada data yang berhasil diimport. ${errorCount} data gagal diproses.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Import",
        description: error.message || "Terjadi kesalahan saat mengimport data",
        variant: "destructive",
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm mb-6">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-semibold text-gray-900">Import & Export Layanan</h3>
          <p className="text-sm text-gray-600">Kelola semua jenis layanan sekaligus</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="shadow-sm bg-white hover:bg-gray-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Unduh Template
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadMasterLayanan}
          className="shadow-sm bg-white hover:bg-gray-50"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Unduh Master Layanan
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
          className="shadow-sm bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </Button>
      </div>
    </div>
  );
};

export default LayananImportExportToolbar;
