"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFormOperations } from "@/hooks/use-form-operations";
import { showSuccess, showError, showLoading, showInfo, NotificationMessages } from "@/utils/notifications";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw, Loader2, Plus, Users, Stethoscope, BarChart3 } from "lucide-react";

interface DataDokter {
  id: string;
  user_id?: string;
  kode_dokter: string;
  nama_dokter: string;
  spesialistik: string;
  jenis_spesialistik: string;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  nama_dokter: z.string().min(1, { message: "Nama Dokter harus diisi." }),
  spesialistik: z.string().min(1, { message: "Spesialistik harus diisi." }),
  jenis_spesialistik: z.string().min(1, { message: "Jenis Spesialistik harus diisi." }),
});

const DataDokterFormTable: React.FC = () => {
  const [dataDokterList, setDataDokterList] = useState<DataDokter[]>([]);
  const [editingDataDokter, setEditingDataDokter] = useState<DataDokter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_dokter: "",
      spesialistik: "",
      jenis_spesialistik: "",
    },
  });

  const { handleSubmit, reset, setValue } = form;

  // Fetch data from Supabase
  const fetchDataDokter = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("data_dokter")
        .select("*")
        .order("kode_dokter", { ascending: true });

      if (error) throw error;
      setDataDokterList(data || []);
    } catch (error) {
      console.error("Error fetching data dokter:", error);
      showError("Gagal mengambil data dokter");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataDokter();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      if (editingDataDokter) {
        // Update existing data
        const { error } = await supabase
          .from("data_dokter")
          .update({
            nama_dokter: values.nama_dokter,
            spesialistik: values.spesialistik,
            jenis_spesialistik: values.jenis_spesialistik,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingDataDokter.id);

        if (error) throw error;
        showSuccess("Data dokter berhasil diperbarui");
      } else {
        // Insert new data
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from("data_dokter")
          .insert([{
            nama_dokter: values.nama_dokter,
            spesialistik: values.spesialistik,
            jenis_spesialistik: values.jenis_spesialistik,
            user_id: user?.id,
          }]);

        if (error) throw error;
        showSuccess("Data dokter berhasil ditambahkan");
      }

      reset();
      setEditingDataDokter(null);
      setIsDialogOpen(false);
      fetchDataDokter();
    } catch (error) {
      console.error("Error saving data dokter:", error);
      showError("Gagal menyimpan data dokter");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (dataDokter: DataDokter) => {
    setEditingDataDokter(dataDokter);
    setValue("nama_dokter", dataDokter.nama_dokter);
    setValue("spesialistik", dataDokter.spesialistik);
    setValue("jenis_spesialistik", dataDokter.jenis_spesialistik);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data dokter ini?")) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("data_dokter")
        .delete()
        .eq("id", id);

      if (error) throw error;
      showSuccess("Data dokter berhasil dihapus");
      fetchDataDokter();
    } catch (error) {
      console.error("Error deleting data dokter:", error);
      showError("Gagal menghapus data dokter");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingDataDokter(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleTemplateDownload = () => {
    try {
      setIsDownloading(true);
      
      // Create template data with correct jenis spesialistik
      const templateData = [
        {
          "Nama Dokter": "Dr. John Doe",
          "Spesialistik": "Kardiologi",
          "Jenis Spesialistik": "Non Bedah"
        },
        {
          "Nama Dokter": "Dr. Jane Smith",
          "Spesialistik": "Bedah Umum", 
          "Jenis Spesialistik": "Bedah"
        },
        {
          "Nama Dokter": "Dr. Ahmad Wijaya",
          "Spesialistik": "Anestesi",
          "Jenis Spesialistik": "Anestesi"
        },
        {
          "Nama Dokter": "Dr. Sarah Johnson",
          "Spesialistik": "Radiologi",
          "Jenis Spesialistik": "Penunjang"
        },
        {
          "Nama Dokter": "Dr. Michael Brown",
          "Spesialistik": "Dokter Umum",
          "Jenis Spesialistik": "Non Spesialistik"
        },
        {
          "Nama Dokter": "Dr. Lisa Wang",
          "Spesialistik": "Dermatologi",
          "Jenis Spesialistik": "Non Bedah"
        },
        {
          "Nama Dokter": "Dr. Robert Kim",
          "Spesialistik": "Orthopedi",
          "Jenis Spesialistik": "Bedah"
        }
      ];

      // Convert to Excel
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Data Dokter");
      
      // Save file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, "Template_Data_Dokter.xlsx");
      
      showSuccess("Template berhasil diunduh");
    } catch (error) {
      console.error("Error downloading template:", error);
      showError("Gagal mengunduh template");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReportDownload = () => {
    try {
      setIsDownloading(true);
      
      // Prepare data for report
      const reportData = dataDokterList.map(item => ({
        "Kode Dokter": item.kode_dokter,
        "Nama Dokter": item.nama_dokter,
        "Spesialistik": item.spesialistik,
        "Jenis Spesialistik": item.jenis_spesialistik,
        "Tanggal Dibuat": new Date(item.created_at || '').toLocaleDateString('id-ID')
      }));

      // Convert to Excel
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Data Dokter");
      
      // Save file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `Laporan_Data_Dokter_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showSuccess("Laporan berhasil diunduh");
    } catch (error) {
      console.error("Error downloading report:", error);
      showError("Gagal mengunduh laporan");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Reset file input
    event.target.value = '';
    
    console.log("Starting file upload:", file.name, file.type);
    
    // Check file type and handle accordingly
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel files
      handleExcelFile(file);
    } else {
      // Handle CSV files
      handleCSVFile(file);
    }
  };

  const handleExcelFile = async (file: File) => {
    try {
      console.log("Processing Excel file:", file.name);
      
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log("Excel data:", jsonData);
      
      if (jsonData.length < 2) {
        showError("File Excel kosong atau tidak memiliki data");
        return;
      }
      
      // Get headers from first row
      const headers = jsonData[0] as string[];
      console.log("Excel headers:", headers);
      
      // Convert to object format
      const dataObjects = jsonData.slice(1).map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
      
      console.log("Converted data objects:", dataObjects);
      
      // Process the data
      await processImportData(dataObjects);
      
    } catch (error) {
      console.error("Error processing Excel file:", error);
      showError(`Gagal memproses file Excel: ${error.message || error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const processImportData = async (data: any[]) => {
    try {
      console.log("=== PROCESSING IMPORT DATA ===");
      console.log("Raw data:", data);
      console.log("Data length:", data.length);
      
      if (data.length === 0) {
        showError("File kosong atau tidak ada data yang dapat dibaca");
        return;
      }
      
      // Log all available column names
      if (data.length > 0) {
        console.log("Available columns:", Object.keys(data[0]));
      }
      
      // More flexible column name matching with better debugging
      const validData = data.filter((row, index) => {
        console.log(`\n--- Processing row ${index + 1} ---`);
        console.log("Raw row:", row);
        
        // Try multiple column name variations
        const namaDokter = row["Nama Dokter"] || row["nama_dokter"] || row["Nama"] || row["nama"] || row["Doctor Name"] || row["doctor_name"] || "";
        const spesialistik = row["Spesialistik"] || row["spesialistik"] || row["Specialty"] || row["specialty"] || row["Spesialis"] || row["spesialis"] || "";
        const jenisSpesialistik = row["Jenis Spesialistik"] || row["jenis_spesialistik"] || row["Jenis"] || row["jenis"] || row["Type"] || row["type"] || row["Type of Specialty"] || row["type_of_specialty"] || "";
        
        console.log("Extracted values:", { 
          namaDokter: `"${namaDokter}"`, 
          spesialistik: `"${spesialistik}"`, 
          jenisSpesialistik: `"${jenisSpesialistik}"` 
        });
        
        const isValid = namaDokter.trim() && spesialistik.trim() && jenisSpesialistik.trim();
        console.log("Is valid:", isValid);
        
        return isValid;
      });

      console.log("Valid data count:", validData.length);
      console.log("Valid data:", validData);

      if (validData.length === 0) {
        const availableColumns = data.length > 0 ? Object.keys(data[0]).join(", ") : "Tidak ada kolom";
        showError(`Tidak ada data valid untuk diimpor. Kolom yang tersedia: ${availableColumns}. Pastikan file memiliki kolom: Nama Dokter, Spesialistik, Jenis Spesialistik`);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user?.id);
      
      // Prepare data for insertion with flexible column mapping
      const insertData = validData.map((row, index) => {
        const namaDokter = (row["Nama Dokter"] || row["nama_dokter"] || row["Nama"] || row["nama"] || row["Doctor Name"] || row["doctor_name"] || "").trim();
        const spesialistik = (row["Spesialistik"] || row["spesialistik"] || row["Specialty"] || row["specialty"] || row["Spesialis"] || row["spesialis"] || "").trim();
        const jenisSpesialistik = (row["Jenis Spesialistik"] || row["jenis_spesialistik"] || row["Jenis"] || row["jenis"] || row["Type"] || row["type"] || row["Type of Specialty"] || row["type_of_specialty"] || "").trim();
        
        console.log(`Mapping row ${index + 1}:`, { namaDokter, spesialistik, jenisSpesialistik });
        
        return {
          nama_dokter: namaDokter,
          spesialistik: spesialistik,
          jenis_spesialistik: jenisSpesialistik,
          user_id: user?.id,
        };
      });

      console.log("Final data to insert:", insertData);

      // Insert to database
      const { error } = await supabase
        .from("data_dokter")
        .insert(insertData);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }
      
      showSuccess(`${validData.length} data dokter berhasil diimpor`);
      fetchDataDokter();
    } catch (error) {
      console.error("Error processing import data:", error);
      showError(`Gagal mengimpor data: ${error.message || error}`);
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
          
          const data = results.data as any[];
          console.log("Raw data from CSV file:", data);
          
          // Process the data using the same function
          await processImportData(data);
          
        } catch (error) {
          console.error("Error importing CSV data:", error);
          showError(`Gagal mengimpor data: ${error.message || error}`);
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
        showError(`Gagal memproses file CSV: ${error.message || error}`);
        setIsUploading(false);
      }
    });
  };

  if (isLoading && dataDokterList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculate statistics
  const totalDokter = dataDokterList.length;
  const spesialistikCount = dataDokterList.reduce((acc, item) => {
    acc[item.spesialistik] = (acc[item.spesialistik] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const jenisSpesialistikCount = dataDokterList.reduce((acc, item) => {
    acc[item.jenis_spesialistik] = (acc[item.jenis_spesialistik] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate dokter spesialis (exclude dokter umum and dokter gigi umum)
  const dokterSpesialis = dataDokterList.filter(item => 
    !item.spesialistik.toLowerCase().includes('dokter umum') && 
    !item.spesialistik.toLowerCase().includes('dokter gigi umum')
  ).length;
  
  // Calculate dokter umum dan dokter gigi umum
  const dokterUmum = dataDokterList.filter(item => 
    item.spesialistik.toLowerCase().includes('dokter umum') || 
    item.spesialistik.toLowerCase().includes('dokter gigi umum')
  ).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dokter Card - Smaller */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Dokter</p>
              <p className="text-2xl font-bold">{totalDokter}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-2">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Dokter Spesialis Card - Smaller */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">Dokter Spesialis</p>
              <p className="text-2xl font-bold">{dokterSpesialis}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-2">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Jenis Spesialistik Breakdown Card - Smaller */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Jenis Spesialistik</p>
              <p className="text-2xl font-bold">{Object.keys(jenisSpesialistikCount).length}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-2">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Dokter Umum Card - New */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Dokter/Gigi Umum</p>
              <p className="text-2xl font-bold">{dokterUmum}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-2">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spesialistik Detailed Breakdown */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Breakdown Spesialistik</h3>
            <div className="bg-green-100 rounded-full p-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(spesialistikCount)
              .sort(([,a], [,b]) => b - a)
              .map(([spesialistik, count]) => (
                <div key={spesialistik} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]" title={spesialistik}>
                      {spesialistik}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">{count}</span>
                    <span className="text-sm text-gray-500">dokter</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Jenis Spesialistik Detailed Breakdown */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Breakdown Jenis Spesialistik</h3>
            <div className="bg-purple-100 rounded-full p-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(jenisSpesialistikCount)
              .sort(([,a], [,b]) => b - a)
              .map(([jenis, count]) => (
                <div key={jenis} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">{jenis}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-purple-600">{count}</span>
                    <span className="text-sm text-gray-500">dokter</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Dokter</h1>
          <p className="text-muted-foreground">
            Kelola data dokter dengan kode otomatis DK.xxx
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="template"
            className="shadow-sm"
            onClick={handleTemplateDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? "Mengunduh..." : "Unduh Template"}
          </Button>
          <Button
            variant="report"
            className="shadow-sm"
            onClick={handleReportDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? "Menyiapkan..." : "Unduh Laporan"}
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button variant="import" className="shadow-sm" disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? "Mengunggah..." : "Impor Data"}
            </Button>
          </div>
          <Button onClick={handleAddNew} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Data
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-700">
              <TableHead className="font-bold text-white">Kode Dokter</TableHead>
              <TableHead className="font-bold text-white">Nama Dokter</TableHead>
              <TableHead className="font-bold text-white">Spesialistik</TableHead>
              <TableHead className="font-bold text-white">Jenis Spesialistik</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataDokterList.map((dataDokter) => (
              <TableRow key={dataDokter.id}>
                <TableCell className="font-medium">
                  {dataDokter.kode_dokter}
                </TableCell>
                <TableCell>{dataDokter.nama_dokter}</TableCell>
                <TableCell>{dataDokter.spesialistik}</TableCell>
                <TableCell>{dataDokter.jenis_spesialistik}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="edit" size="sm" onClick={() => handleEdit(dataDokter)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(dataDokter.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingDataDokter ? "Edit Data Dokter" : "Tambah Data Dokter"}
            </DialogTitle>
            <DialogDescription>
              {editingDataDokter 
                ? "Perbarui informasi data dokter." 
                : "Tambahkan data dokter baru. Kode dokter akan dibuat otomatis."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nama_dokter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Dokter</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama dokter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spesialistik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spesialistik</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan spesialistik" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jenis_spesialistik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Spesialistik</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis spesialistik" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Anestesi">Anestesi</SelectItem>
                        <SelectItem value="Bedah">Bedah</SelectItem>
                        <SelectItem value="Non Bedah">Non Bedah</SelectItem>
                        <SelectItem value="Non Spesialistik">Non Spesialistik</SelectItem>
                        <SelectItem value="Penunjang">Penunjang</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <LoadingButton type="submit" loading={isLoading}>
                  {editingDataDokter ? "Perbarui" : "Simpan"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataDokterFormTable;
