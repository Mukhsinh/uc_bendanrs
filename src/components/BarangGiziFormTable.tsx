"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFormOperations } from "@/hooks/use-form-operations";
import { showError } from "@/utils/notifications";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

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
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw, Search, X } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";

interface BarangGizi {
  id: string;
  user_id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  kode_barang: z.string().min(1, { message: "Kode Barang harus diisi." }),
  nama_barang: z.string().min(1, { message: "Nama Barang harus diisi." }),
  satuan: z.string().min(1, { message: "Satuan harus diisi." }),
  harga: z.number().min(0, { message: "Harga harus lebih dari atau sama dengan 0." }),
});

const BarangGiziFormTable: React.FC = () => {
  const [barangGiziList, setBarangGiziList] = useState<BarangGizi[]>([]);
  const [editingBarangGizi, setEditingBarangGizi] = useState<BarangGizi | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, loadData, saveData, deleteData } = useFormOperations({
    entityName: "Barang Gizi",
    onSuccess: () => {
      setEditingBarangGizi(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kode_barang: "",
      nama_barang: "",
      satuan: "",
      harga: 0,
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session);
        if (session?.user) {
          console.log('User authenticated:', session.user.id);
          setUserId(session.user.id);
          fetchBarangGizi(session.user.id);
        } else {
          console.log('No user session found, fetching all data for debugging');
          setUserId(null);
          fetchBarangGizi(null);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
        // Fallback: try to fetch data anyway
        setUserId(null);
        fetchBarangGizi(null);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (editingBarangGizi) {
      form.reset({
        kode_barang: editingBarangGizi.kode_barang,
        nama_barang: editingBarangGizi.nama_barang,
        satuan: editingBarangGizi.satuan,
        harga: editingBarangGizi.harga,
      });
    } else {
      form.reset({
        kode_barang: "",
        nama_barang: "",
        satuan: "",
        harga: 0,
      });
    }
  }, [editingBarangGizi, form]);

  const fetchBarangGizi = async (currentUserId: string | null) => {
    await loadData(async () => {
      try {
        console.log('=== FETCHING BARANG GIZI DATA ===');
        console.log('Current user ID:', currentUserId);
        
        // Fetch all data with explicit limit to ensure we get all records
        const { data, error } = await supabase
          .from('data_barang_gizi')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2000); // Set higher limit to get all data

        if (error) {
          console.error('Error fetching barang gizi data:', error);
          throw error;
        }

        console.log('Raw data from Supabase:', data?.length, 'items');
        
        // Convert harga from string to number if needed
        const processedData = (data || []).map(item => ({
          ...item,
          harga: typeof item.harga === 'string' ? parseFloat(item.harga) || 0 : item.harga
        }));
        
        console.log('Processed data length:', processedData.length);
        setBarangGiziList(processedData);
        
        console.log('=== FETCHING COMPLETE ===');
      } catch (error) {
        console.error('Error in fetchBarangGizi:', error);
        // Set empty array on error to prevent undefined state
        setBarangGiziList([]);
        throw error;
      }
    }, { showLoadingToast: false });
  };

  const checkKodeExists = async (kode: string, currentUserId: string, excludeId?: string) => {
    let query = supabase
      .from('data_barang_gizi')
      .select('id')
      .eq('kode_barang', kode)
      .eq('user_id', currentUserId);
      
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    return !!data;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      showError("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    await saveData(async () => {
      // Check if kode already exists
      const isKodeExists = await checkKodeExists(
        values.kode_barang, 
        userId, 
        editingBarangGizi?.id
      );
      
      if (isKodeExists) {
        throw new Error("Kode Barang sudah digunakan. Silakan gunakan kode yang lain.");
      }

      if (editingBarangGizi) {
        const { error } = await supabase
          .from('data_barang_gizi')
          .update({ 
            ...values, 
            user_id: userId
          })
          .eq('id', editingBarangGizi.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('data_barang_gizi')
          .insert([{
            ...values,
            user_id: userId
          }]);

        if (error) throw error;
      }
      
      await fetchBarangGizi(userId);
    }, {
      loadingMessage: editingBarangGizi ? "Memperbarui barang gizi..." : "Menyimpan barang gizi...",
      successMessage: editingBarangGizi ? "Barang gizi berhasil diperbarui" : "Barang gizi berhasil ditambahkan"
    });
  };

  const handleEdit = (barangGizi: BarangGizi) => {
    setEditingBarangGizi(barangGizi);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteData(async () => {
      const { error } = await supabase
        .from('data_barang_gizi')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (userId) await fetchBarangGizi(userId);
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Import data triggered", event.target.files);
    console.log("Current userId:", userId);
    
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      toast.error("Tidak ada file yang dipilih.");
      return;
    }

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    if (file) {
      console.log("Starting import for file:", file.name, "Size:", file.size, "Type:", file.type);
      file.text().then((text) => {
        console.log("File content length:", text.length);
        (Papa as any).parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: async (results: Papa.ParseResult<any>) => {
            try {
              console.log("CSV parsing completed. Results:", results);
              const allRows = results.data;
              const totalRows = allRows.length;
              
              console.log("Total rows to process:", totalRows);
              
              if (totalRows === 0) {
                showUploadError("File CSV kosong atau tidak memiliki data valid.");
                return;
              }
              
              // Start upload progress
              startUpload(totalRows, "Sedang mengimpor barang gizi...");
              
              // Step 1: Process and validate all data
              const duplicateCodes: string[] = [];
              let processedCount = 0;
              let errorCount = 0;
              let duplicateInFileCount = 0;
              
              // First, get all existing kode barang from database to avoid duplicates
              console.log("Fetching existing data for user:", userId);
              const { data: existingData, error: fetchError } = await supabase
                .from('data_barang_gizi')
                .select('kode_barang')
                .eq('user_id', userId);
              
              console.log("Existing data fetch result:", { existingData, fetchError });
              if (fetchError) throw fetchError;
              
              const existingKodes = new Set(existingData?.map(item => item.kode_barang) || []);
              
              // Process all rows and create a map for deduplication
              const kodeMap = new Map<string, any>();
              let totalRowsProcessed = 0;
              let validRowsCount = 0;
              let invalidRowsCount = 0;
              
              console.log("Processing rows:", results.data.length);
              console.log("Sample row:", results.data[0]);
              
              for (const row of results.data) {
                processedCount++;
                totalRowsProcessed++;
                updateProgress(processedCount, 0, errorCount);
                
                // Get data with flexible column name matching
                const kode = row["Kode Barang"] || row["kode_barang"] || row["Kode"] || "";
                const namaBarang = row["Nama Barang"] || row["nama_barang"] || row["Nama"] || "";
                const satuan = row["Satuan"] || row["satuan"] || "";
                const harga = row["Harga"] || row["harga"] || "";
                
                console.log(`Row ${totalRowsProcessed}:`, { kode, namaBarang, satuan, harga });
                
                // Validate required fields
                if (!kode || !namaBarang) {
                  console.log(`Row ${totalRowsProcessed} invalid: missing kode or nama`);
                  invalidRowsCount++;
                  errorCount++;
                  continue;
                }
                
                // Check if kode already exists in database
                if (existingKodes.has(kode)) {
                  console.log(`Row ${totalRowsProcessed} duplicate in DB: ${kode}`);
                  duplicateCodes.push(kode);
                  errorCount++;
                  continue;
                }
                
                const hargaValue = parseFloat(harga) || 0;
                const itemData = {
                  kode_barang: kode,
                  nama_barang: namaBarang,
                  satuan: satuan,
                  harga: hargaValue,
                  user_id: userId,
                };
                
                validRowsCount++;
                
                // Deduplication logic: keep only the highest priced item per kode
                if (!kodeMap.has(kode)) {
                  kodeMap.set(kode, itemData);
                } else if (kodeMap.get(kode).harga < hargaValue) {
                  duplicateInFileCount++;
                  kodeMap.set(kode, itemData);
                } else {
                  duplicateInFileCount++;
                }
              }
              
              console.log(`Processing complete: ${totalRowsProcessed} total, ${validRowsCount} valid, ${invalidRowsCount} invalid`);
              
              if (duplicateCodes.length > 0) {
                showUploadError(`Kode Barang berikut sudah ada di database: ${duplicateCodes.slice(0, 10).join(", ")}${duplicateCodes.length > 10 ? ` dan ${duplicateCodes.length - 10} lainnya` : ""}`);
                return;
              }
              
              const finalData = Array.from(kodeMap.values());
              
              console.log(`Final data to insert: ${finalData.length} items`);
              
              if (finalData.length === 0) {
                let errorMessage = "Tidak ada data valid untuk diimpor.\n";
                errorMessage += `📊 Total data diproses: ${totalRowsProcessed}\n`;
                errorMessage += `✅ Data valid: ${validRowsCount}\n`;
                errorMessage += `❌ Data tidak valid: ${invalidRowsCount}\n`;
                errorMessage += `🚫 Duplikat di database: ${duplicateCodes.length}\n`;
                errorMessage += `🔄 Duplikat dalam file: ${duplicateInFileCount}`;
                
                showUploadError(errorMessage);
                return;
              }

              // Step 2: Insert data in batches to avoid timeout
              const batchSize = 100;
              let successCount = 0;
              let batchErrorCount = 0;
              
              for (let i = 0; i < finalData.length; i += batchSize) {
                const batch = finalData.slice(i, i + batchSize);
                
                try {
                  console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} with ${batch.length} items`);
                  const { error } = await supabase
                    .from('data_barang_gizi')
                    .insert(batch);

                  if (error) {
                    console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error);
                    batchErrorCount += batch.length;
                  } else {
                    console.log(`Batch ${Math.floor(i/batchSize) + 1} success`);
                    successCount += batch.length;
                  }
                } catch (batchError) {
                  console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, batchError);
                  batchErrorCount += batch.length;
                }
                
                // Update progress
                updateProgress(processedCount, successCount, errorCount + batchErrorCount);
                
                // Small delay to prevent overwhelming the database
                if (i + batchSize < finalData.length) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }
              
              // Complete upload with final counts
              completeUpload(successCount, errorCount + batchErrorCount, duplicateCodes.length);
              
              // Show detailed summary message
              const totalProcessed = totalRowsProcessed;
              const totalValid = validRowsCount;
              const totalInvalid = invalidRowsCount;
              const totalDuplicatesInFile = duplicateInFileCount;
              const totalDuplicatesInDB = duplicateCodes.length;
              const totalSuccess = successCount;
              const totalErrors = errorCount + batchErrorCount;
              
              let summaryMessage = `Import selesai!\n`;
              summaryMessage += `📊 Total data diproses: ${totalProcessed}\n`;
              summaryMessage += `✅ Data valid: ${totalValid}\n`;
              summaryMessage += `❌ Data tidak valid: ${totalInvalid}\n`;
              summaryMessage += `🔄 Duplikat dalam file: ${totalDuplicatesInFile} (hanya harga tertinggi disimpan)\n`;
              summaryMessage += `🚫 Duplikat di database: ${totalDuplicatesInDB}\n`;
              summaryMessage += `💾 Berhasil diunggah: ${totalSuccess}\n`;
              summaryMessage += `⚠️ Gagal diunggah: ${totalErrors}`;
              
              if (totalSuccess > 0) {
                toast.success(summaryMessage, { duration: 8000 });
              } else {
                toast.error(summaryMessage, { duration: 8000 });
              }
              
              // Refresh data
              if (userId) await fetchBarangGizi(userId);
            } catch (error: any) {
              console.error(error);
              showUploadError(`Gagal mengimpor data: ${error.message}`);
            }
          },
          error: (error: Papa.ParseError) => {
            console.error("CSV parsing error:", error);
            showUploadError(`Gagal memparse file CSV: ${error.message}`);
          }
        });
      }).catch((error) => {
        console.error("File reading error:", error);
        showUploadError(`Gagal membaca file: ${error.message}`);
      });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Kode Barang", "Nama Barang", "Satuan", "Harga"];
    const sampleData = [
      ["GZI001", "Nasi Putih", "porsi", "5000"],
      ["GZI002", "Sayur Bayam", "porsi", "3000"],
      ["GZI003", "Daging Ayam", "porsi", "8000"]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Barang Gizi");
    XLSX.writeFile(wb, "template_barang_gizi.xlsx");
    toast.info("Template impor data berhasil diunduh. Catatan: Jika ada kode barang duplikat, hanya data dengan harga tertinggi yang akan disimpan.");
  };

  // Filter data based on search term
  const filteredBarangGiziList = barangGiziList.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_barang.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDownloadReport = () => {
    if (barangGiziList.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan.");
      return;
    }

    const dataToExport = barangGiziList.map(item => ({
      "Kode Barang": item.kode_barang,
      "Nama Barang": item.nama_barang,
      "Satuan": item.satuan,
      "Harga": item.harga,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Barang Gizi");
    XLSX.writeFile(wb, "laporan_barang_gizi.xlsx");
    toast.info("Laporan berhasil diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manajemen Barang Gizi</h2>
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-500 mt-1">
            Debug: Total data: {barangGiziList.length}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportData}
              className="sr-only"
            />
          </label>
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBarangGizi(null)} className="shadow-sm">
              Tambah Barang Gizi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBarangGizi ? "Edit Barang Gizi" : "Tambah Barang Gizi"}</DialogTitle>
              <DialogDescription>
                {editingBarangGizi ? "Perbarui detail barang gizi." : "Tambahkan barang gizi baru ke sistem."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="kode_barang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Barang</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: GZI001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nama_barang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Barang</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Nasi Putih" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="satuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satuan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: porsi, kg, gram" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="harga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <LoadingButton
                    type="submit"
                    loading={saving}
                    loadingText={editingBarangGizi ? "Menyimpan perubahan..." : "Menyimpan..."}
                  >
                    {editingBarangGizi ? "Simpan Perubahan" : "Tambah"}
                  </LoadingButton>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Button onClick={handleDownloadReport} variant="report" className="shadow-sm">
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
        <Button onClick={() => fetchBarangGizi(userId)} variant="outline" size="icon" title="Refresh Data">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari nama barang atau kode barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {searchTerm && (
            <div className="text-sm text-gray-600">
              {filteredBarangGiziList.length} dari {barangGiziList.length} data ditemukan
            </div>
          )}
          {!searchTerm && barangGiziList.length > 0 && (
            <div className="text-sm text-gray-600">
              Total: {barangGiziList.length} data
            </div>
          )}
          {!searchTerm && barangGiziList.length === 0 && !loading && (
            <div className="text-sm text-red-600">
              Tidak ada barang gizi yang ditemukan. Periksa koneksi database atau coba refresh halaman.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-700">
              <TableHead className="font-bold text-white">Kode Barang</TableHead>
              <TableHead className="font-bold text-white">Nama Barang</TableHead>
              <TableHead className="font-bold text-white">Satuan</TableHead>
              <TableHead className="font-bold text-white">Harga</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <LoadingSpinner size="md" text="Memuat data..." />
                </TableCell>
              </TableRow>
            ) : filteredBarangGiziList.length > 0 ? (
              filteredBarangGiziList.map((barangGizi) => (
                <TableRow key={barangGizi.id}>
                  <TableCell className="font-medium">{barangGizi.kode_barang}</TableCell>
                  <TableCell>{barangGizi.nama_barang}</TableCell>
                  <TableCell>{barangGizi.satuan}</TableCell>
                  <TableCell>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(barangGizi.harga)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="edit" size="icon" onClick={() => handleEdit(barangGizi)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(barangGizi.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm ? `Tidak ada barang gizi yang cocok dengan pencarian "${searchTerm}".` : "Tidak ada barang gizi."}
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

export default BarangGiziFormTable;
