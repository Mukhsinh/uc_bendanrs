import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit, Plus, Upload, Download, RefreshCcw, Calculator } from "lucide-react";
import * as XLSX from "xlsx";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LayananInputTable from "@/components/produk-layanan/LayananInputTable";
import LayananImportExportToolbar from "@/components/produk-layanan/LayananImportExportToolbar";
import FarmasiInputTable from "@/components/produk-layanan/FarmasiInputTable";
import KlinikInputTable from "@/components/produk-layanan/KlinikInputTable";
import { useReportDownload } from "@/components/report";

interface ProdukLayanan {
  user_id: string;
  id: string;
  tahun: number;
  jenis: string;
  deskripsi_inacbg: string | null;
  grouper: string | null;
  diaglist: string | null;
  diagnosa_1: string | null;
  diagnosa_2: string | null;
  diagnosa_3: string | null;
  diagnosa_4: string | null;
  diagnosa_5: string | null;
  proclist: string | null;
  proc_1: string | null;
  proc_2: string | null;
  proc_3: string | null;
  proc_4: string | null;
  proc_5: string | null;
  los: number;
  spesialisasi_dokter: string | null;
  nama_dokter: string | null;
  kode_dokter: string | null;
  klinik: any[]; // Unit kerja rawat jalan
  tindakan: any[];
  ibs: any[];
  laboratorium: any[];
  radiologi: any[];
  laboratorium_eksternal: any[];
  radiologi_eksternal: any[];
  farmasi: any[];
  kamar_akomodasi: any[];
  visite: any[];
  konsultasi: any[];
  total_biaya: number;
  tarif_inacbgs_numeric: number;
  saldo_distribusi: number;
  prosentase_saldo: number;
  jp_tindakan: number;
  jp_ibs: number;
  jp_laboratorium: number;
  jp_radiologi: number;
  jp_laboratorium_eksternal: number;
  jp_radiologi_eksternal: number;
  jp_farmasi: number;
  jp_kamar_akomodasi: number;
  jp_visite: number;
  jp_konsultasi: number;
  jp_farmasi_prosentase: number;
}

const ProdukLayanan = () => {
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [data, setData] = useState<ProdukLayanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tahun, setTahun] = useState(2025);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [recalculatingJP, setRecalculatingJP] = useState(false);
  const [formData, setFormData] = useState<Partial<ProdukLayanan>>({
    tahun: 2025,
    jenis: "rawat jalan",
    los: 0,
    klinik: [],
    tindakan: [],
    ibs: [],
    laboratorium: [],
    radiologi: [],
    laboratorium_eksternal: [],
    radiologi_eksternal: [],
    farmasi: [],
    kamar_akomodasi: [],
    visite: [],
    konsultasi: [],
  });
  
  // State untuk menyimpan available services dari setiap jenis layanan
  const [availableServices, setAvailableServices] = useState({
    tindakan: [] as any[],
    ibs: [] as any[],
    laboratorium: [] as any[],
    radiologi: [] as any[],
    laboratorium_eksternal: [] as any[],
    radiologi_eksternal: [] as any[],
    akomodasi: [] as any[],
    visite: [] as any[],
    konsultasi: [] as any[],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const { data: produkLayanan, error } = await supabase
        .from("produk_layanan")
        .select("*")
        .eq("tahun", tahun)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setData(produkLayanan || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.rpc("populate_skenario_tarif_from_rekapitulasi", {
        p_user_id: null,
        p_tahun: tahun,
        p_prosentase_jasa_pelayanan: 0,
        p_prosentase_profit: 0,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Data layanan berhasil diperbarui (${data ?? 0} entri).`,
      });

      setRefreshKey((prev) => prev + 1);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecalculateJP = async () => {
    if (!confirm("Apakah Anda yakin ingin menghitung ulang JP untuk semua data produk layanan? Proses ini akan memperbarui JP Tindakan, JP IBS, JP Laboratorium, JP Radiologi, JP Farmasi, JP Kamar Akomodasi, JP Visite, dan JP Konsultasi.")) {
      return;
    }

    try {
      setRecalculatingJP(true);
      const { data, error } = await supabase.rpc("recalculate_jp_produk_layanan_rpc", {
        p_tahun: tahun,
        p_id: null,
      });

      if (error) throw error;

      if (data && data.success) {
        toast({
          title: "Berhasil",
          description: `JP berhasil dihitung ulang. ${data.affected_rows} data diperbarui dari ${data.total_processed} data yang diproses.`,
        });
        await fetchData();
      } else {
        throw new Error(data?.message || "Recalculate JP gagal");
      }
    } catch (error: any) {
      toast({
        title: "Gagal menghitung ulang JP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRecalculatingJP(false);
    }
  };

  // Fungsi untuk membersihkan data dari computed/generated columns sebelum save
  const prepareDataForSave = (data: Partial<ProdukLayanan>) => {
    // Exclude computed/generated columns yang tidak boleh di-update manual
    const {
      id,
      created_at,
      updated_at,
      total_biaya,           // Computed dari sum semua biaya
      total_jp,              // GENERATED: sum dari semua jp_* columns
      saldo_distribusi,      // GENERATED: tarif_inacbgs_numeric - total_biaya
      prosentase_saldo,      // GENERATED: (saldo_distribusi / tarif_inacbg_numeric) * 100
      jp_tindakan,           // Computed dari tindakan array
      jp_ibs,                // Computed dari ibs array
      jp_laboratorium,       // Computed dari laboratorium array
      jp_radiologi,          // Computed dari radiologi array
      jp_farmasi,            // Computed dari farmasi array
      jp_kamar_akomodasi,    // Computed dari kamar_akomodasi array
      jp_visite,             // Computed dari visite array
      jp_konsultasi,         // Computed dari konsultasi array
      jp_laboratorium_eksternal, // Computed dari laboratorium_eksternal array
      jp_radiologi_eksternal,    // Computed dari radiologi_eksternal array
      ...cleanData
    } = data as any;
    
    // Pastikan data yang dikirim valid dan sesuai dengan schema database
    const validatedData = {
      ...cleanData,
      // Pastikan jenis sesuai dengan constraint check
      jenis: cleanData.jenis === 'rawat jalan' || cleanData.jenis === 'rawat inap' 
        ? cleanData.jenis 
        : 'rawat jalan', // default fallback
      // Pastikan array fields adalah valid JSON
      tindakan: Array.isArray(cleanData.tindakan) ? cleanData.tindakan : [],
      ibs: Array.isArray(cleanData.ibs) ? cleanData.ibs : [],
      laboratorium: Array.isArray(cleanData.laboratorium) ? cleanData.laboratorium : [],
      radiologi: Array.isArray(cleanData.radiologi) ? cleanData.radiologi : [],
      farmasi: Array.isArray(cleanData.farmasi) ? cleanData.farmasi : [],
      kamar_akomodasi: Array.isArray(cleanData.kamar_akomodasi) ? cleanData.kamar_akomodasi : [],
      visite: Array.isArray(cleanData.visite) ? cleanData.visite : [],
      konsultasi: Array.isArray(cleanData.konsultasi) ? cleanData.konsultasi : [],
      klinik: Array.isArray(cleanData.klinik) ? cleanData.klinik : [],
      laboratorium_eksternal: Array.isArray(cleanData.laboratorium_eksternal) ? cleanData.laboratorium_eksternal : [],
      radiologi_eksternal: Array.isArray(cleanData.radiologi_eksternal) ? cleanData.radiologi_eksternal : [],
      // Pastikan numeric fields valid
      los: typeof cleanData.los === 'number' ? cleanData.los : 0,
      tarif_inacbgs_numeric: typeof cleanData.tarif_inacbgs_numeric === 'number' ? cleanData.tarif_inacbgs_numeric : 0,
      jp_farmasi_prosentase: typeof cleanData.jp_farmasi_prosentase === 'number' ? cleanData.jp_farmasi_prosentase : 0,
      // Pastikan string fields tidak undefined
      deskripsi_inacbg: cleanData.deskripsi_inacbg || null,
      grouper: cleanData.grouper || null,
      diaglist: cleanData.diaglist || null,
      diagnosa_1: cleanData.diagnosa_1 || null,
      diagnosa_2: cleanData.diagnosa_2 || null,
      diagnosa_3: cleanData.diagnosa_3 || null,
      diagnosa_4: cleanData.diagnosa_4 || null,
      diagnosa_5: cleanData.diagnosa_5 || null,
      proclist: cleanData.proclist || null,
      proc_1: cleanData.proc_1 || null,
      proc_2: cleanData.proc_2 || null,
      proc_3: cleanData.proc_3 || null,
      proc_4: cleanData.proc_4 || null,
      proc_5: cleanData.proc_5 || null,
      spesialisasi_dokter: cleanData.spesialisasi_dokter || null,
      nama_dokter: cleanData.nama_dokter || null,
      kode_dokter: cleanData.kode_dokter || null,
    };
    
    return validatedData;
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      // Validasi data sebelum disimpan
      if (!formData.jenis) {
        toast({
          title: "Error",
          description: "Jenis produk layanan harus dipilih",
          variant: "destructive",
        });
        return;
      }

      if (!formData.deskripsi_inacbg || formData.deskripsi_inacbg.trim() === '') {
        toast({
          title: "Error",
          description: "Deskripsi INA-CBG harus diisi",
          variant: "destructive",
        });
        return;
      }

      const dataToSave = prepareDataForSave({
        ...formData,
        user_id: user.id,
        tahun,
        // Pastikan array fields tidak null
        tindakan: formData.tindakan || [],
        ibs: formData.ibs || [],
        laboratorium: formData.laboratorium || [],
        radiologi: formData.radiologi || [],
        farmasi: formData.farmasi || [],
        kamar_akomodasi: formData.kamar_akomodasi || [],
        visite: formData.visite || [],
        konsultasi: formData.konsultasi || [],
        klinik: formData.klinik || [],
        // Pastikan numeric fields tidak null
        los: formData.los || 0,
        tarif_inacbgs_numeric: formData.tarif_inacbgs_numeric || 0,
        jp_farmasi_prosentase: formData.jp_farmasi_prosentase || 0,
      });

      console.log('Data yang akan disimpan:', dataToSave);

      if (editingId) {
        const { error } = await supabase
          .from("produk_layanan")
          .update(dataToSave)
          .eq("id", editingId);

        if (error) {
          console.error('Error updating data:', error);
          throw error;
        }

        toast({
          title: "Berhasil",
          description: "Data berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("produk_layanan")
          .insert(dataToSave);

        if (error) {
          console.error('Error inserting data:', error);
          throw error;
        }

        toast({
          title: "Berhasil",
          description: "Data berhasil ditambahkan",
        });
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        tahun: 2025,
        jenis: "rawat jalan",
        los: 0,
        klinik: [],
        tindakan: [],
        ibs: [],
        laboratorium: [],
        radiologi: [],
        laboratorium_eksternal: [],
        radiologi_eksternal: [],
        farmasi: [],
        kamar_akomodasi: [],
        visite: [],
        konsultasi: [],
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error saving data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: ProdukLayanan) => {
    setEditingId(item.id);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("produk_layanan")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil dihapus",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    if (data.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk di-export",
        variant: "destructive",
      });
      return;
    }

    const dataForExport = data.map(item => ({
      "ID": item.id || "",
      "Tahun": item.tahun || tahun,
      "Jenis": item.jenis || "",
      "Deskripsi INA-CBG": item.deskripsi_inacbg || "",
      "Grouper": item.grouper || "",
      "Diaglist": item.diaglist || "",
      "Diagnosa 1": item.diagnosa_1 || "",
      "Diagnosa 2": item.diagnosa_2 || "",
      "Diagnosa 3": item.diagnosa_3 || "",
      "Diagnosa 4": item.diagnosa_4 || "",
      "Diagnosa 5": item.diagnosa_5 || "",
      "Proclist": item.proclist || "",
      "Prosedur 1": item.proc_1 || "",
      "Prosedur 2": item.proc_2 || "",
      "Prosedur 3": item.proc_3 || "",
      "Prosedur 4": item.proc_4 || "",
      "Prosedur 5": item.proc_5 || "",
      "LOS": item.los || 0,
      "Spesialisasi Dokter": item.spesialisasi_dokter || "",
      "Nama Dokter": item.nama_dokter || "",
      "Kode Dokter": item.kode_dokter || "",
      "Tarif INA-CBGs": item.tarif_inacbgs_numeric || 0,
      "JP Farmasi Prosentase": item.jp_farmasi_prosentase || 0,
      "Total Biaya": item.total_biaya || 0,
      "Saldo Distribusi": item.saldo_distribusi || 0,
      "Prosentase Saldo": item.prosentase_saldo || 0,
      "JP Tindakan": item.jp_tindakan || 0,
      "JP IBS": item.jp_ibs || 0,
      "JP Laboratorium": item.jp_laboratorium || 0,
      "JP Radiologi": item.jp_radiologi || 0,
      "JP Farmasi": item.jp_farmasi || 0,
      "JP Kamar Akomodasi": item.jp_kamar_akomodasi || 0,
      "JP Visite": item.jp_visite || 0,
      "JP Konsultasi": item.jp_konsultasi || 0
    }));

    await downloadReport({
      title: "Laporan Produk Layanan",
      subtitle: `Data tahun ${tahun}`,
      filename: `produk_layanan_${tahun}`,
      records: dataForExport,
      filters: {
        Tahun: tahun,
      },
    });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "tahun",
      "jenis",
      "deskripsi_inacbg",
      "grouper",
      "diaglist",
      "diagnosa_1",
      "diagnosa_2",
      "diagnosa_3",
      "diagnosa_4",
      "diagnosa_5",
      "proclist",
      "proc_1",
      "proc_2",
      "proc_3",
      "proc_4",
      "proc_5",
      "los",
      "spesialisasi_dokter",
      "nama_dokter",
      "kode_dokter",
      "tarif_inacbgs_numeric",
      "jp_farmasi_prosentase"
    ];
    const sampleData = [
      [
        2025,
        "rawat jalan",
        "Hipertensi Esensial",
        "Mild",
        "I10",
        "Hipertensi Esensial",
        "",
        "",
        "",
        "",
        "Z00.0",
        "Pemeriksaan Medis Umum",
        "",
        "",
        "",
        "",
        1,
        "Spesialis Penyakit Dalam",
        "Dr. Andi",
        "DK001",
        300000,
        15.0
      ],
      [
        2025,
        "rawat inap",
        "Pneumonia",
        "Moderate",
        "J18",
        "Pneumonia",
        "",
        "",
        "",
        "",
        "J44.1",
        "Bronkitis Kronis",
        "",
        "",
        "",
        "",
        3,
        "Spesialis Paru",
        "Dr. Budi",
        "DK002",
        8000000,
        20.0
      ]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Produk Layanan");
    XLSX.writeFile(wb, "template_produk_layanan.xlsx");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    event.target.value = "";

    console.log("Starting file upload:", file.name, file.type);

    // Check file type and handle accordingly
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Handle Excel files
      await handleExcelFile(file);
    } else {
      // Handle CSV files
      handleCSVFile(file);
    }
  };

  const handleExcelFile = async (file: File) => {
    try {
      console.log("Processing Excel file:", file.name);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Get first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      console.log("Excel data:", jsonData);

      if (jsonData.length < 2) {
        toast({
          title: "Error",
          description: "File Excel kosong atau tidak memiliki data",
          variant: "destructive",
        });
        return;
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      console.log("Excel headers:", headers);

      // Convert to object format
      const dataObjects = jsonData.slice(1).map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });
        return obj;
      });

      console.log("Converted data objects:", dataObjects);

      // Process the data
      await processImportData(dataObjects, user.id);
    } catch (error: any) {
      console.error("Error processing Excel file:", error);
      toast({
        title: "Error",
        description: `Gagal memproses file Excel: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  const handleCSVFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          console.log("=== CSV FILE PARSING DEBUG ===");
          console.log("File parsing results:", results);
          console.log("Errors:", results.errors);
          console.log("Meta:", results.meta);

          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            toast({
              title: "Error",
              description: "User not authenticated",
              variant: "destructive",
            });
            return;
          }

          const data = results.data as any[];
          console.log("Raw data from CSV file:", data);

          // Process the data using the same function
          await processImportData(data, user.id);
        } catch (error: any) {
          console.error("Error importing CSV data:", error);
          toast({
            title: "Error",
            description: `Gagal mengimpor data: ${error.message || error}`,
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
        toast({
          title: "Error",
          description: `Gagal memproses file CSV: ${error.message || error}`,
          variant: "destructive",
        });
      },
    });
  };

  const processImportData = async (data: any[], userId: string) => {
    try {
      console.log("=== PROCESSING IMPORT DATA ===");
      console.log("Raw data:", data);
      console.log("Data length:", data.length);

      if (data.length === 0) {
        toast({
          title: "Error",
          description: "File kosong atau tidak ada data yang dapat dibaca",
          variant: "destructive",
        });
        return;
      }

      // Log all available column names
      if (data.length > 0) {
        console.log("Available columns:", Object.keys(data[0]));
      }

      // Map headers to database fields (flexible matching)
      const headerMapping: { [key: string]: string } = {
        tahun: "tahun",
        jenis: "jenis",
        deskripsi_inacbg: "deskripsi_inacbg",
        grouper: "grouper",
        diaglist: "diaglist",
        diagnosa_1: "diagnosa_1",
        diagnosa_2: "diagnosa_2",
        diagnosa_3: "diagnosa_3",
        diagnosa_4: "diagnosa_4",
        diagnosa_5: "diagnosa_5",
        proclist: "proclist",
        proc_1: "proc_1",
        proc_2: "proc_2",
        proc_3: "proc_3",
        proc_4: "proc_4",
        proc_5: "proc_5",
        los: "los",
        spesialisasi_dokter: "spesialisasi_dokter",
        nama_dokter: "nama_dokter",
        kode_dokter: "kode_dokter",
        tarif_inacbgs_numeric: "tarif_inacbgs_numeric",
        jp_farmasi_prosentase: "jp_farmasi_prosentase",
      };

      // Normalize header names (case-insensitive, handle spaces/underscores)
      const normalizeHeader = (header: string): string => {
        return header
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
      };

      // Get normalized headers from first row
      const firstRow = data[0];
      const normalizedHeaders: { [key: string]: string } = {};
      Object.keys(firstRow).forEach((key) => {
        const normalized = normalizeHeader(key);
        normalizedHeaders[normalized] = key;
      });

      console.log("Normalized headers mapping:", normalizedHeaders);

      // Filter and map data
      const validData = data
        .filter((row, index) => {
          // At least jenis or deskripsi_inacbg should be present
          const jenis = row[normalizedHeaders["jenis"]] || row["jenis"] || row["Jenis"] || "";
          const deskripsi = row[normalizedHeaders["deskripsi_inacbg"]] || row["deskripsi_inacbg"] || row["Deskripsi INA-CBG"] || "";
          
          const isValid = (jenis && jenis.toString().trim()) || (deskripsi && deskripsi.toString().trim());
          
          if (!isValid) {
            console.log(`Row ${index + 1} skipped: missing jenis or deskripsi_inacbg`);
          }
          
          return isValid;
        })
        .map((row) => {
          const obj: any = { user_id: userId, tahun };

          // Map each field
          Object.keys(headerMapping).forEach((dbField) => {
            const normalized = normalizeHeader(dbField);
            const originalHeader = normalizedHeaders[normalized] || dbField;
            
            // Try multiple variations
            let value = row[originalHeader] || 
                       row[dbField] || 
                       row[dbField.replace(/_/g, " ")] ||
                       row[dbField.replace(/_/g, "-")] ||
                       "";

            value = value?.toString().trim() || "";

            // Type conversion
            if (dbField === "los" || dbField === "tahun" || dbField === "tarif_inacbgs_numeric") {
              obj[dbField] = value ? parseInt(value) || 0 : 0;
            } else if (dbField === "jp_farmasi_prosentase") {
              obj[dbField] = value ? parseFloat(value) || 0 : 0;
            } else if (dbField === "jenis") {
              // Normalisasi nilai jenis untuk menghindari constraint error
              const normalizedJenis = value.toLowerCase().trim();
              // Hanya terima "rawat jalan" atau "rawat inap"
              if (normalizedJenis === "rawat jalan" || normalizedJenis === "rawatjalan" || normalizedJenis === "rawat_jalan") {
                obj[dbField] = "rawat jalan";
              } else if (normalizedJenis === "rawat inap" || normalizedJenis === "rawatinap" || normalizedJenis === "rawat_inap") {
                obj[dbField] = "rawat inap";
              } else if (normalizedJenis) {
                // Jika ada nilai tapi tidak valid, gunakan nilai asli (akan error di database jika tidak sesuai constraint)
                obj[dbField] = value;
              } else {
                obj[dbField] = null;
              }
            } else {
              obj[dbField] = value || null;
            }
          });

          // Initialize arrays
          obj.tindakan = [];
          obj.ibs = [];
          obj.laboratorium = [];
          obj.radiologi = [];
          obj.farmasi = [];
          obj.kamar_akomodasi = [];
          obj.visite = [];
          obj.konsultasi = [];
          obj.klinik = [];

          return obj;
        });

      console.log("Valid data count:", validData.length);
      console.log("Valid data sample:", validData.slice(0, 2));

      if (validData.length === 0) {
        const availableColumns = data.length > 0 ? Object.keys(data[0]).join(", ") : "Tidak ada kolom";
        toast({
          title: "Error",
          description: `Tidak ada data valid untuk diimpor. Kolom yang tersedia: ${availableColumns}`,
          variant: "destructive",
        });
        return;
      }

      // Insert to database
      const { error } = await tenantSupabase.from("produk_layanan").insert(validData);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      toast({
        title: "Berhasil",
        description: `${validData.length} data berhasil di-import`,
      });

      fetchData();
    } catch (error: any) {
      console.error("Error processing import data:", error);
      toast({
        title: "Error",
        description: `Gagal mengimpor data: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getProsentaseBadge = (prosentase: number) => {
    const isProfit = prosentase >= 38;
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isProfit 
          ? "bg-green-100 text-green-800 border border-green-300" 
          : "bg-red-100 text-red-800 border border-red-300"
      }`}>
        {prosentase.toFixed(2)}%
      </div>
    );
  };

  // Hitung rata-rata prosentase saldo
  const rataRataProsentase = data.length > 0
    ? data.reduce((sum, item) => sum + (item.prosentase_saldo || 0), 0) / data.length
    : 0;

  return (
    <div className="container mx-auto py-6 px-4 max-w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle>Produk Layanan</CardTitle>
                {data.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Rata-rata Prosentase Saldo:
                    </span>
                    {getProsentaseBadge(rataRataProsentase)}
                  </div>
                )}
              </div>
              <CardDescription>
                Kelola data produk layanan rumah sakit dengan referensi ke rekapitulasi unit cost
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={String(tahun)} onValueChange={(value) => setTahun(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button
              variant="template"
              onClick={handleDownloadTemplate}
              className="shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Template Impor
            </Button>

            <label className="cursor-pointer">
              <Button asChild variant="import" className="shadow-sm">
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Impor Data
                </span>
              </Button>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />
            </label>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="shadow-sm"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      tahun: 2025,
                      jenis: "rawat jalan",
                      los: 0,
                      klinik: [],
                      tindakan: [],
                      ibs: [],
                      laboratorium: [],
                      radiologi: [],
                      laboratorium_eksternal: [],
                      radiologi_eksternal: [],
                      farmasi: [],
                      kamar_akomodasi: [],
                      visite: [],
                      konsultasi: [],
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="max-w-6xl max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Produk Layanan" : "Tambah Produk Layanan"}
                  </DialogTitle>
                  <DialogDescription>
                    Lengkapi form di bawah untuk {editingId ? "mengupdate" : "menambahkan"} produk layanan
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                    <TabsTrigger value="diagnosa">Diagnosa & Prosedur</TabsTrigger>
                    <TabsTrigger value="layanan">Layanan</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jenis">Jenis</Label>
                        <Select
                          value={formData.jenis}
                          onValueChange={(value) => {
                            // Reset klinik dan kamar_akomodasi saat ganti jenis
                            setFormData({ 
                              ...formData, 
                              jenis: value,
                      klinik: [],
                      kamar_akomodasi: [],
                      tindakan: [], // Reset tindakan juga karena filter berubah
                      laboratorium_eksternal: [],
                      radiologi_eksternal: []
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rawat jalan">Rawat Jalan</SelectItem>
                            <SelectItem value="rawat inap">Rawat Inap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="los">LOS (Length of Stay)</Label>
                        <Input
                          id="los"
                          type="number"
                          value={formData.los}
                          onChange={(e) =>
                            setFormData({ ...formData, los: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deskripsi_inacbg">Deskripsi INA-CBG</Label>
                        <Input
                          id="deskripsi_inacbg"
                          value={formData.deskripsi_inacbg || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, deskripsi_inacbg: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="grouper">Grouper</Label>
                        <Input
                          id="grouper"
                          value={formData.grouper || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, grouper: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tarif_inacbgs">Tarif INA-CBG's (Rp)</Label>
                      <Input
                        id="tarif_inacbgs"
                        type="number"
                        value={formData.tarif_inacbgs_numeric || 0}
                        onChange={(e) =>
                          setFormData({ ...formData, tarif_inacbgs_numeric: parseInt(e.target.value) || 0 })
                        }
                        placeholder="Masukkan tarif INA-CBG's dalam rupiah"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="spesialisasi_dokter">Spesialisasi Dokter</Label>
                        <Input
                          id="spesialisasi_dokter"
                          value={formData.spesialisasi_dokter || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, spesialisasi_dokter: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="nama_dokter">Nama Dokter</Label>
                        <Input
                          id="nama_dokter"
                          value={formData.nama_dokter || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, nama_dokter: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="kode_dokter">Kode Dokter</Label>
                        <Input
                          id="kode_dokter"
                          value={formData.kode_dokter || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, kode_dokter: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="diagnosa" className="space-y-4">
                    <div>
                      <Label htmlFor="diaglist">Diaglist</Label>
                      <Input
                        id="diaglist"
                        value={formData.diaglist || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, diaglist: e.target.value })
                        }
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={`diagnosa_${num}`}>
                          <Label htmlFor={`diagnosa_${num}`}>Diagnosa {num}</Label>
                          <Input
                            id={`diagnosa_${num}`}
                            value={formData[`diagnosa_${num}` as keyof ProdukLayanan] as string || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, [`diagnosa_${num}`]: e.target.value })
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label htmlFor="proclist">Proclist</Label>
                      <Input
                        id="proclist"
                        value={formData.proclist || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, proclist: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={`proc_${num}`}>
                          <Label htmlFor={`proc_${num}`}>Prosedur {num}</Label>
                          <Input
                            id={`proc_${num}`}
                            value={formData[`proc_${num}` as keyof ProdukLayanan] as string || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, [`proc_${num}`]: e.target.value })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="layanan" className="space-y-6">
                    {/* Toolbar Import/Export Terpusat */}
                    <LayananImportExportToolbar
                      tahun={tahun}
                      allServices={availableServices}
                      onImport={(importedData) => {
                        // Merge imported data dengan data yang sudah ada
                        setFormData({
                          ...formData,
                          tindakan: [...(formData.tindakan || []), ...importedData.tindakan],
                          ibs: [...(formData.ibs || []), ...importedData.ibs],
                          laboratorium: [...(formData.laboratorium || []), ...importedData.laboratorium],
                          radiologi: [...(formData.radiologi || []), ...importedData.radiologi],
                          laboratorium_eksternal: [...(formData.laboratorium_eksternal || []), ...importedData.laboratorium_eksternal],
                          radiologi_eksternal: [...(formData.radiologi_eksternal || []), ...importedData.radiologi_eksternal],
                          kamar_akomodasi: [...(formData.kamar_akomodasi || []), ...importedData.akomodasi],
                          visite: [...(formData.visite || []), ...importedData.visite],
                          konsultasi: [...(formData.konsultasi || []), ...importedData.konsultasi],
                        });
                      }}
                    />

                    {/* URUTAN 1: Klinik - Tersedia untuk semua jenis rawat */}
                    <KlinikInputTable
                      value={formData.klinik || []}
                      onChange={(value) => setFormData({ ...formData, klinik: value })}
                      tahun={tahun}
                    />

                    {/* URUTAN 2: Kamar Akomodasi - Tersedia untuk semua jenis rawat */}
                    <LayananInputTable
                      label="Kamar Akomodasi"
                      value={formData.kamar_akomodasi || []}
                      onChange={(value) => setFormData({ ...formData, kamar_akomodasi: value })}
                      tahun={tahun}
                      filterType="akomodasi"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, akomodasi: services }))
                      }
                    />

                    {/* URUTAN 3: Tindakan - Tersedia untuk semua jenis rawat */}
                    <LayananInputTable
                      label="Tindakan"
                      value={formData.tindakan || []}
                      onChange={(value) => setFormData({ ...formData, tindakan: value })}
                      tahun={tahun}
                      filterType="tindakan"
                      refreshKey={refreshKey}
                      selectedKamarAkomodasi={formData.kamar_akomodasi || []}
                      selectedKlinik={formData.klinik || []}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, tindakan: services }))
                      }
                    />

                    <LayananInputTable
                      label="IBS (Tindakan Operatif)"
                      value={formData.ibs || []}
                      onChange={(value) => setFormData({ ...formData, ibs: value })}
                      tahun={tahun}
                      filterType="ibs"
                      spesialisasiDokter={formData.spesialisasi_dokter || undefined}
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, ibs: services }))
                      }
                    />

                    <LayananInputTable
                      label="Laboratorium"
                      value={formData.laboratorium || []}
                      onChange={(value) => setFormData({ ...formData, laboratorium: value })}
                      tahun={tahun}
                      filterType="laboratorium"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, laboratorium: services }))
                      }
                    />

                    <LayananInputTable
                      label="Laboratorium Eksternal"
                      value={formData.laboratorium_eksternal || []}
                      onChange={(value) => setFormData({ ...formData, laboratorium_eksternal: value })}
                      tahun={tahun}
                      filterType="laboratorium_eksternal"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, laboratorium_eksternal: services }))
                      }
                    />

                    <LayananInputTable
                      label="Radiologi"
                      value={formData.radiologi || []}
                      onChange={(value) => setFormData({ ...formData, radiologi: value })}
                      tahun={tahun}
                      filterType="radiologi"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, radiologi: services }))
                      }
                    />

                    <LayananInputTable
                      label="Radiologi Eksternal"
                      value={formData.radiologi_eksternal || []}
                      onChange={(value) => setFormData({ ...formData, radiologi_eksternal: value })}
                      tahun={tahun}
                      filterType="radiologi_eksternal"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, radiologi_eksternal: services }))
                      }
                    />

                    <div className="space-y-2">
                      <Label htmlFor="jp_farmasi_prosentase">Prosentase JP Farmasi (%)</Label>
                      <Input
                        id="jp_farmasi_prosentase"
                        type="number"
                        value={formData.jp_farmasi_prosentase || 0}
                        onChange={(e) =>
                          setFormData({ ...formData, jp_farmasi_prosentase: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="Masukkan prosentase JP Farmasi"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <FarmasiInputTable
                      label="Farmasi"
                      value={formData.farmasi || []}
                      onChange={(value) => setFormData({ ...formData, farmasi: value })}
                      refreshKey={refreshKey}
                    />

                    <LayananInputTable
                      label="Visite"
                      value={formData.visite || []}
                      onChange={(value) => setFormData({ ...formData, visite: value })}
                      tahun={tahun}
                      filterType="visite"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, visite: services }))
                      }
                    />

                    <LayananInputTable
                      label="Konsultasi"
                      value={formData.konsultasi || []}
                      onChange={(value) => setFormData({ ...formData, konsultasi: value })}
                      tahun={tahun}
                      filterType="konsultasi"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, konsultasi: services }))
                      }
                    />
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSave}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="report" onClick={handleExport} className="shadow-sm">
              <Download className="h-4 w-4 mr-2" />
              Unduh Laporan
            </Button>

            <Button
              variant="secondary"
              onClick={handleRefreshData}
              disabled={refreshing}
              className="shadow-sm bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Memperbarui…" : "Perbarui Data"}
            </Button>

            <Button
              variant="default"
              onClick={handleRecalculateJP}
              disabled={recalculatingJP}
              className="shadow-sm bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Calculator className={`h-4 w-4 mr-2 ${recalculatingJP ? "animate-pulse" : ""}`} />
              {recalculatingJP ? "Menghitung Ulang JP…" : "Recalculate JP"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Belum ada data. Klik "Tambah Data" untuk memulai.
            </div>
          ) : (
            <div className="w-full">
              <div className="overflow-x-auto">
                <Table className="w-full text-xs">
                  <TableHeader className="bg-[#0f766e]">
                    <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                      <TableHead className="text-white font-bold text-xs px-2 py-2 sticky left-0 bg-[#0f766e] z-10 min-w-[80px] whitespace-normal">Jenis</TableHead>
                      <TableHead className="text-white font-bold text-xs px-2 py-2 min-w-[150px] whitespace-normal">Deskripsi<br />INA-CBG</TableHead>
                      <TableHead className="text-white font-bold text-xs px-2 py-2 text-center min-w-[60px] whitespace-normal">LOS</TableHead>
                      <TableHead className="text-white font-bold text-xs px-2 py-2 min-w-[120px] whitespace-normal">Dokter</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-2 py-2 min-w-[100px] whitespace-normal">Tarif<br />INA-CBGs</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-2 py-2 min-w-[100px] whitespace-normal">Total<br />Biaya</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />Tindakan</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />IBS</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />Lab</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />Radiologi</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />Farmasi</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />Kamar</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />Visite</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-1 py-2 min-w-[80px] whitespace-normal">JP<br />Konsultasi</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-2 py-2 min-w-[100px] whitespace-normal">Total<br />JP</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-2 py-2 min-w-[100px] whitespace-normal">Saldo<br />Distribusi</TableHead>
                      <TableHead className="text-center text-white font-bold text-xs px-2 py-2 min-w-[80px] whitespace-normal">%<br />Saldo</TableHead>
                      <TableHead className="text-right text-white font-bold text-xs px-2 py-2 min-w-[80px] whitespace-normal">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium capitalize text-xs px-2 py-2 sticky left-0 bg-white z-10 border-r">{item.jenis}</TableCell>
                        <TableCell className="text-xs px-2 py-2">{item.deskripsi_inacbg || "-"}</TableCell>
                        <TableCell className="text-xs px-2 py-2 text-center">{item.los} h</TableCell>
                        <TableCell className="text-xs px-2 py-2">{item.nama_dokter || "-"}</TableCell>
                        <TableCell className="text-right text-xs px-2 py-2 font-mono">{formatCurrency(item.tarif_inacbgs_numeric || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-2 py-2 font-mono">{formatCurrency(item.total_biaya)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_tindakan || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_ibs || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_laboratorium || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_radiologi || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_farmasi || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_kamar_akomodasi || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_visite || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2 font-mono">{formatCurrency(item.jp_konsultasi || 0)}</TableCell>
                        <TableCell className="text-right text-xs px-2 py-2 font-bold text-green-600 font-mono">
                          {formatCurrency((item.jp_tindakan || 0) + (item.jp_ibs || 0) + (item.jp_laboratorium || 0) + (item.jp_radiologi || 0) + (item.jp_farmasi || 0) + (item.jp_kamar_akomodasi || 0) + (item.jp_visite || 0) + (item.jp_konsultasi || 0))}
                        </TableCell>
                        <TableCell className={`text-right text-xs px-2 py-2 font-semibold font-mono ${
                          (item.saldo_distribusi || 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatCurrency(item.saldo_distribusi || 0)}
                        </TableCell>
                        <TableCell className="text-center px-2 py-2">
                          {getProsentaseBadge(item.prosentase_saldo || 0)}
                        </TableCell>
                        <TableCell className="text-right px-2 py-2">
                          <div className="flex justify-end gap-1">
                            <Button variant="edit" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdukLayanan;

