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
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { fetchUnitKerjaPusatPendapatan, validateUnitKerjaData, type UnitKerja as UnitKerjaType } from "@/utils/unit-kerja-helper";

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: "Pusat Biaya" | "Pusat Pendapatan";
}

interface DataPendapatan {
  id: string;
  user_id?: string;
  unit_kerja_id?: string;
  kode_unit_kerja?: string;
  nama_unit_kerja?: string;
  pendapatan_umum?: number;
  pendapatan_bpjs?: number;
  pendapatan_apbd?: number;
  total_pendapatan?: number;
  tahun?: number;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  unit_kerja_id: z.string().min(1, { message: "Unit Kerja harus dipilih." }),
  pendapatan_umum: z.coerce.number().min(0, { message: "Pendapatan Umum harus angka positif." }),
  pendapatan_bpjs: z.coerce.number().min(0, { message: "Pendapatan BPJS harus angka positif." }),
  pendapatan_apbd: z.coerce.number().min(0, { message: "Pendapatan APBD harus angka positif." }),
  tahun: z.coerce.number().min(1900).max(3000, { message: "Tahun harus antara 1900-3000." }),
});

const PendapatanFormTable: React.FC = () => {
  const [pendapatanList, setPendapatanList] = useState<DataPendapatan[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingPendapatan, setEditingPendapatan] = useState<DataPendapatan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, deleting, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Pendapatan",
    onSuccess: () => {
      setEditingPendapatan(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit_kerja_id: "",
      pendapatan_umum: 0,
      pendapatan_bpjs: 0,
      pendapatan_apbd: 0,
      tahun: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    console.log("PendapatanFormTable: Component mounted, fetching data...");
    fetchData();
  }, []);

  // Debug effect to monitor unitKerjaList changes
  useEffect(() => {
    console.log("PendapatanFormTable: unitKerjaList updated:", unitKerjaList.length, "items");
    if (unitKerjaList.length > 0) {
      console.log("First few unit kerja:", unitKerjaList.slice(0, 3));
    }
  }, [unitKerjaList]);

  useEffect(() => {
    if (editingPendapatan) {
      form.reset({
        unit_kerja_id: editingPendapatan.unit_kerja_id || "",
        pendapatan_umum: editingPendapatan.pendapatan_umum || 0,
        pendapatan_bpjs: editingPendapatan.pendapatan_bpjs || 0,
        pendapatan_apbd: editingPendapatan.pendapatan_apbd || 0,
        tahun: editingPendapatan.tahun || new Date().getFullYear(),
      });
    } else {
      form.reset({
        unit_kerja_id: "",
        pendapatan_umum: 0,
        pendapatan_bpjs: 0,
        pendapatan_apbd: 0,
        tahun: new Date().getFullYear(),
      });
    }
  }, [editingPendapatan, form]);

  const fetchData = async () => {
    try {
      // Fetch unit kerja data using helper function
      const unitKerjaData = await fetchUnitKerjaPusatPendapatan();
      
      if (validateUnitKerjaData(unitKerjaData)) {
        setUnitKerjaList(unitKerjaData);
        console.log(`Successfully loaded ${unitKerjaData.length} unit kerja Pusat Pendapatan`);
      } else {
        toast.error("Data unit kerja tidak valid atau kosong.");
        setUnitKerjaList([]);
      }

      // Fetch pendapatan data - optimized query with specific columns
      const startTime = performance.now();
      const { data: pendapatanData, error: pendapatanError } = await supabase
        .from('data_pendapatan')
        .select(`
          id,
          user_id,
          unit_kerja_id,
          kode_unit_kerja,
          nama_unit_kerja,
          pendapatan_umum,
          pendapatan_bpjs,
          pendapatan_apbd,
          total_pendapatan,
          tahun,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      const endTime = performance.now();
      console.log(`📊 Pendapatan data fetch took ${(endTime - startTime).toFixed(2)}ms`);

      if (pendapatanError) {
        toast.error("Gagal memuat data pendapatan.");
        console.error(pendapatanError);
        setPendapatanList([]);
      } else {
        setPendapatanList(pendapatanData || []);
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      toast.error("Terjadi kesalahan saat memuat data.");
      setUnitKerjaList([]);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi. Silakan login ulang.");
        return;
      }

      // Get unit kerja details
      const selectedUnitKerja = unitKerjaList.find(uk => uk.id === values.unit_kerja_id);
      
      if (!selectedUnitKerja) {
        toast.error("Unit kerja tidak ditemukan.");
        return;
      }

      const pendapatanData = {
        user_id: user.id,
        unit_kerja_id: values.unit_kerja_id,
        kode_unit_kerja: selectedUnitKerja.kode,
        nama_unit_kerja: selectedUnitKerja.nama,
        pendapatan_umum: values.pendapatan_umum,
        pendapatan_bpjs: values.pendapatan_bpjs,
        pendapatan_apbd: values.pendapatan_apbd,
        tahun: values.tahun,
      };

      if (editingPendapatan) {
        const { error } = await supabase
          .from('data_pendapatan')
          .update(pendapatanData)
          .eq('id', editingPendapatan.id);

        if (error) throw error;
        toast.success("Data Pendapatan berhasil diperbarui.");
      } else {
        const { error } = await supabase
          .from('data_pendapatan')
          .insert([pendapatanData]);

        if (error) throw error;
        toast.success("Data Pendapatan berhasil ditambahkan.");
      }
      
      await fetchData();
      setEditingPendapatan(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan data.");
    }
  };

  const handleEdit = (pendapatan: DataPendapatan) => {
    setEditingPendapatan(pendapatan);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('data_pendapatan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      toast.success("Data Pendapatan berhasil dihapus.");
    } catch (error: any) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menghapus data.");
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset file input
    event.target.value = '';
    
    file.text().then((text) => {
      (Papa as any).parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            // Check user authentication first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              showUploadError("User tidak terautentikasi. Silakan login ulang.");
              return;
            }

            const allRows = results.data;
            const totalRows = allRows.length;
            
            // Debug: Log CSV headers and first few rows
            console.log("CSV Headers:", results.meta.fields);
            console.log("First few rows:", allRows.slice(0, 3));
            console.log("Total rows:", totalRows);
            
            if (totalRows === 0) {
              showUploadError("File CSV kosong atau tidak valid.");
              return;
            }
            
            // Start upload progress
            startUpload(totalRows, "Sedang mengimpor data pendapatan...");
            
            const importedData: any[] = [];
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            const errors: string[] = [];
            
            for (const row of results.data) {
              processedCount++;
              updateProgress(processedCount, successCount, errorCount);
              
              try {
                // Debug logging
                console.log(`Processing row ${processedCount}:`, row);
                
                // Validate required fields - try different column name variations
                const kodeUnitKerja = row["Kode Unit Kerja"] || row["kode_unit_kerja"] || row["Kode Unit Kerja"] || row["Unit Kerja"];
                if (!kodeUnitKerja || kodeUnitKerja.toString().trim() === "") {
                  errors.push(`Baris ${processedCount}: Kode Unit Kerja tidak boleh kosong`);
                  errorCount++;
                  continue;
                }
                
                // Find unit kerja by kode
                const unitKerja = unitKerjaList.find(uk => uk.kode === kodeUnitKerja);
                
                if (unitKerja) {
                  // Validate numeric fields - handle empty strings properly with multiple column name variations
                  const pendapatanUmumStr = row["Pendapatan Umum"] || row["pendapatan_umum"] || row["Pendapatan Umum (Rp)"] || row["Pendapatan_Umum"];
                  const pendapatanBpjsStr = row["Pendapatan BPJS"] || row["pendapatan_bpjs"] || row["Pendapatan BPJS (Rp)"] || row["Pendapatan_BPJS"];
                  const pendapatanApbdStr = row["Pendapatan APBD"] || row["pendapatan_apbd"] || row["Pendapatan APBD (Rp)"] || row["Pendapatan_APBD"];
                  
                  // Debug logging for values
                  console.log(`Row ${processedCount} values:`, {
                    pendapatanUmumStr,
                    pendapatanBpjsStr,
                    pendapatanApbdStr,
                    pendapatanUmumStrType: typeof pendapatanUmumStr,
                    pendapatanBpjsStrType: typeof pendapatanBpjsStr,
                    pendapatanApbdStrType: typeof pendapatanApbdStr
                  });
                  
                  // Skip rows where all values are empty
                  const pendapatanUmumEmpty = !pendapatanUmumStr || pendapatanUmumStr.toString().trim() === "";
                  const pendapatanBpjsEmpty = !pendapatanBpjsStr || pendapatanBpjsStr.toString().trim() === "";
                  const pendapatanApbdEmpty = !pendapatanApbdStr || pendapatanApbdStr.toString().trim() === "";
                  
                  console.log(`Row ${processedCount} empty check:`, {
                    pendapatanUmumEmpty,
                    pendapatanBpjsEmpty,
                    pendapatanApbdEmpty,
                    allEmpty: pendapatanUmumEmpty && pendapatanBpjsEmpty && pendapatanApbdEmpty
                  });
                  
                  if (pendapatanUmumEmpty && pendapatanBpjsEmpty && pendapatanApbdEmpty) {
                    // Skip rows where all values are empty - this is expected behavior for template rows
                    console.log(`Skipping row ${processedCount} - all values empty`);
                    skippedCount++;
                    continue;
                  }
                  
                  // Parse values, default to 0 if empty
                  const pendapatanUmum = pendapatanUmumEmpty ? 0 : parseFloat(pendapatanUmumStr);
                  const pendapatanBpjs = pendapatanBpjsEmpty ? 0 : parseFloat(pendapatanBpjsStr);
                  const pendapatanApbd = pendapatanApbdEmpty ? 0 : parseFloat(pendapatanApbdStr);
                  const tahun = parseInt(row["Tahun"]) || new Date().getFullYear();
                  
                  console.log(`Row ${processedCount} parsed values:`, {
                    pendapatanUmum,
                    pendapatanBpjs,
                    pendapatanApbd,
                    tahun,
                    pendapatanUmumIsNaN: isNaN(pendapatanUmum),
                    pendapatanBpjsIsNaN: isNaN(pendapatanBpjs),
                    pendapatanApbdIsNaN: isNaN(pendapatanApbd)
                  });
                  
                  // Validate that parsed values are valid numbers
                  if (!pendapatanUmumEmpty && isNaN(pendapatanUmum)) {
                    console.log(`Row ${processedCount}: Pendapatan Umum isNaN`);
                    errors.push(`Baris ${processedCount}: Pendapatan Umum harus berupa angka`);
                    errorCount++;
                    continue;
                  }
                  
                  if (!pendapatanBpjsEmpty && isNaN(pendapatanBpjs)) {
                    console.log(`Row ${processedCount}: Pendapatan BPJS isNaN`);
                    errors.push(`Baris ${processedCount}: Pendapatan BPJS harus berupa angka`);
                    errorCount++;
                    continue;
                  }
                  
                  if (!pendapatanApbdEmpty && isNaN(pendapatanApbd)) {
                    console.log(`Row ${processedCount}: Pendapatan APBD isNaN`);
                    errors.push(`Baris ${processedCount}: Pendapatan APBD harus berupa angka`);
                    errorCount++;
                    continue;
                  }
                  
                  const dataToInsert = {
                    user_id: user.id,
                    unit_kerja_id: unitKerja.id,
                    kode_unit_kerja: unitKerja.kode,
                    nama_unit_kerja: unitKerja.nama,
                    pendapatan_umum: pendapatanUmum,
                    pendapatan_bpjs: pendapatanBpjs,
                    pendapatan_apbd: pendapatanApbd,
                    tahun: tahun,
                  };
                  
                  console.log(`Row ${processedCount}: Adding to import data:`, dataToInsert);
                  importedData.push(dataToInsert);
                  successCount++;
                } else {
                  console.log(`Unit kerja not found for kode: ${kodeUnitKerja}`);
                  console.log(`Available unit kerja:`, unitKerjaList.map(uk => uk.kode));
                  errors.push(`Baris ${processedCount}: Unit kerja dengan kode "${kodeUnitKerja}" tidak ditemukan`);
                  errorCount++;
                }
              } catch (rowError: any) {
                errors.push(`Baris ${processedCount}: ${rowError.message}`);
                errorCount++;
              }
            }

            if (importedData.length === 0) {
              console.log("No valid data found. Errors:", errors);
              console.log("Processed count:", processedCount, "Success:", successCount, "Skipped:", skippedCount, "Errors:", errorCount);
              showUploadError(`Tidak ada data yang valid untuk diimpor. Processed: ${processedCount}, Success: ${successCount}, Skipped: ${skippedCount}, Errors: ${errorCount}. Details: ${errors.join('; ')}`);
              return;
            }

            // Insert data to database in batches to avoid timeout
            const batchSize = 50;
            let insertErrors: string[] = [];
            
            for (let i = 0; i < importedData.length; i += batchSize) {
              const batch = importedData.slice(i, i + batchSize);
              try {
                const { error } = await supabase
                  .from('data_pendapatan')
                  .insert(batch);

                if (error) {
                  insertErrors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
                  console.error('Insert error:', error);
                }
              } catch (batchError: any) {
                insertErrors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${batchError.message}`);
                console.error('Batch error:', batchError);
              }
            }

            if (insertErrors.length > 0) {
              showUploadError(`Gagal mengimpor sebagian data: ${insertErrors.join(', ')}`);
            } else {
              // Complete upload with final counts
              completeUpload(successCount, errorCount, 0);
              
              // Refresh data
              await fetchData();
              
              // Show success message with details
              let message = `${successCount} data berhasil diimpor`;
              if (skippedCount > 0) {
                message += `, ${skippedCount} baris dilewati (kosong)`;
              }
              if (errorCount > 0) {
                message += `, ${errorCount} data gagal diimpor`;
              }
              toast.success(message);
            }
            
          } catch (error: any) {
            console.error('Import error:', error);
            showUploadError(`Gagal mengimpor data: ${error.message}`);
          }
        },
        error: (error: Papa.ParseError) => {
          console.error('Parse error:', error);
          showUploadError(`Gagal memparse file CSV: ${error.message}`);
        }
      });
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      let dataToUse = unitKerjaList;
      
      // If no data loaded, fetch it
      if (dataToUse.length === 0) {
        toast.info("Memuat data unit kerja...");
        dataToUse = await fetchUnitKerjaPusatPendapatan();
        
        if (!validateUnitKerjaData(dataToUse)) {
          toast.error("Tidak ada unit kerja dengan kategori 'Pusat Pendapatan' di database.");
          return;
        }
        
        // Update state for future use
        setUnitKerjaList(dataToUse);
      }

      // Create template with unit kerja data and example values
      const templateData = dataToUse.map((unitKerja, index) => ({
        "Kode Unit Kerja": unitKerja.kode,
        "Nama Unit Kerja": unitKerja.nama,
        "Pendapatan Umum": index < 3 ? (index + 1) * 5000000 : "", // Example values for first 3 rows
        "Pendapatan BPJS": index < 3 ? (index + 1) * 3000000 : "", // Example values for first 3 rows
        "Pendapatan APBD": index < 3 ? (index + 1) * 2000000 : "", // Example values for first 3 rows
        "Tahun": new Date().getFullYear()
      }));
      
      console.log("Template data sample:", templateData.slice(0, 2));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Data Pendapatan");
      XLSX.writeFile(wb, "template_data_pendapatan.xlsx");
      toast.success(`Template impor data berhasil diunduh dengan ${dataToUse.length} unit kerja Pusat Pendapatan. 3 baris pertama berisi contoh nilai. Silakan isi nilai pendapatan untuk unit kerja yang diinginkan.`);
      
    } catch (error) {
      console.error("Error in handleDownloadTemplate:", error);
      toast.error("Terjadi kesalahan saat membuat template. Silakan coba lagi.");
    }
  };

  const handleDownloadReport = () => {
    if (pendapatanList.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan.");
      return;
    }

    const dataToExport = pendapatanList.map(item => ({
      "Kode Unit Kerja": item.kode_unit_kerja,
      "Nama Unit Kerja": item.nama_unit_kerja,
      "Pendapatan Umum": item.pendapatan_umum,
      "Pendapatan BPJS": item.pendapatan_bpjs,
      "Pendapatan APBD": item.pendapatan_apbd,
      "Total Pendapatan": (item.pendapatan_umum || 0) + (item.pendapatan_bpjs || 0) + (item.pendapatan_apbd || 0),
      "Tahun": item.tahun,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Data Pendapatan");
    XLSX.writeFile(wb, "laporan_data_pendapatan.xlsx");
    toast.info("Laporan berhasil diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Pendapatan</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          onClick={handleDownloadTemplate}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <label
          htmlFor="import-file"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer"
        >
          <Upload className="mr-2 h-4 w-4" /> Impor Data
          <Input id="import-file" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
        </label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingPendapatan(null)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Tambah Data Pendapatan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingPendapatan ? "Edit Data Pendapatan" : "Tambah Data Pendapatan"}</DialogTitle>
              <DialogDescription>
                {editingPendapatan ? "Perbarui detail pendapatan." : "Tambahkan data pendapatan baru ke sistem."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="unit_kerja_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Kerja (Pusat Pendapatan)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Unit Kerja" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitKerjaList.map((unitKerja) => (
                            <SelectItem key={unitKerja.id} value={unitKerja.id}>
                              {unitKerja.kode} - {unitKerja.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tahun"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pendapatan_umum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pendapatan Umum (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pendapatan_bpjs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pendapatan BPJS (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pendapatan_apbd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pendapatan APBD (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{editingPendapatan ? "Simpan Perubahan" : "Tambah"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Button
          onClick={handleDownloadReport}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
        <Button
          onClick={() => fetchData()}
          size="icon"
          className="bg-slate-200 hover:bg-slate-300 text-teal-700"
          title="Perbarui Data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-700">
              <TableHead className="text-white">Kode Unit Kerja</TableHead>
              <TableHead className="text-white">Nama Unit Kerja</TableHead>
              <TableHead className="text-white">Tahun</TableHead>
              <TableHead className="text-white">Pendapatan Umum (Rp)</TableHead>
              <TableHead className="text-white">Pendapatan BPJS (Rp)</TableHead>
              <TableHead className="text-white">Pendapatan APBD (Rp)</TableHead>
              <TableHead className="text-white">Total Pendapatan (Rp)</TableHead>
              <TableHead className="text-right text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : pendapatanList.length > 0 ? (
              pendapatanList.map((pendapatan) => {
                const totalPendapatan = (pendapatan.pendapatan_umum || 0) + (pendapatan.pendapatan_bpjs || 0) + (pendapatan.pendapatan_apbd || 0);
                return (
                  <TableRow key={pendapatan.id}>
                    <TableCell className="font-medium">{pendapatan.kode_unit_kerja}</TableCell>
                    <TableCell>{pendapatan.nama_unit_kerja}</TableCell>
                    <TableCell>{pendapatan.tahun}</TableCell>
                    <TableCell>{pendapatan.pendapatan_umum?.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{pendapatan.pendapatan_bpjs?.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{pendapatan.pendapatan_apbd?.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="font-medium">{totalPendapatan.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="edit" size="icon" onClick={() => handleEdit(pendapatan)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(pendapatan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada data pendapatan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Import Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
    </div>
  );
};

export default PendapatanFormTable;
