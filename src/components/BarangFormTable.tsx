"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFormOperations } from "@/hooks/use-form-operations";
import { showError, showInfo } from "@/utils/notifications";
import { supabase } from "@/integrations/supabase/client";
import { safeCRUDOperation, handleDatabaseError } from "@/utils/database-operations";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useReportDownload } from "@/components/report";

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
}
from "@/components/ui/table";
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

interface Barang {
  id: string;
  user_id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
  gudang: "obat" | "bhp";
  created_at?: string;
  updated_at?: string;
}


const formSchema = z.object({
  kode_barang: z.string().min(1, { message: "Kode Barang harus diisi." }),
  nama_barang: z.string().min(1, { message: "Nama Barang harus diisi." }),
  satuan: z.string().min(1, { message: "Satuan harus diisi." }),
  harga: z.number().min(0, { message: "Harga harus lebih dari atau sama dengan 0." }),
  gudang: z.enum(["obat", "bhp"], {
    required_error: "Gudang harus dipilih.",
  }),
});

const BarangFormTable: React.FC = () => {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "obat" | "bhp">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const { downloadReport } = useReportDownload();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kode_barang: "",
      nama_barang: "",
      satuan: "",
      harga: 0,
      gudang: "obat",
    },
  });

  const handleOperationSuccess = useCallback(() => {
    setEditingBarang(null);
    setIsDialogOpen(false);
    form.reset();
  }, [form]);

  const formOperationsOptions = useMemo(
    () => ({
      entityName: "Barang",
      onSuccess: handleOperationSuccess,
    }),
    [handleOperationSuccess]
  );

  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, loadData, saveData, deleteData } = useFormOperations(formOperationsOptions);

  const normalizeGudang = (value: any): "obat" | "bhp" => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "bhp") return "bhp";
    return "obat";
  };

  const getRecordTimestamp = (item: any) => {
    const updated = item?.updated_at ? new Date(item.updated_at).getTime() : 0;
    const created = item?.created_at ? new Date(item.created_at).getTime() : 0;
    return Math.max(updated, created);
  };

  const normalizeBarangRecord = (item: any): Barang => ({
    id: item.id,
    user_id: item.user_id,
    kode_barang: item.kode_barang?.trim().toUpperCase() || "",
    nama_barang: item.nama_barang?.trim() || "",
    satuan: item.satuan?.trim() || "",
    harga: typeof item.harga === "string" ? parseFloat(item.harga) || 0 : item.harga ?? 0,
    gudang: normalizeGudang(item.gudang),
    created_at: item.created_at,
    updated_at: item.updated_at,
  });

  const fetchBarang = useCallback(async () => {
    await loadData(async () => {
      try {
        console.log("=== FETCHING BARANG DATA (global scope) ===");

        const batchSize = 1000;
        let page = 0;
        let fetchedAll = false;
        const allRows: any[] = [];

        while (!fetchedAll) {
          const from = page * batchSize;
          const to = from + batchSize - 1;

          const { data, error } = await supabase
            .from("data_barang_farmasi")
            .select("*")
            .order("updated_at", { ascending: false, nullsFirst: false })
            .range(from, to);

          if (error) {
            console.error("Error fetching barang data:", error);
            throw error;
          }

          if (data && data.length > 0) {
            allRows.push(...data);
            if (data.length < batchSize) {
              fetchedAll = true;
            } else {
              page += 1;
            }
          } else {
            fetchedAll = true;
          }
        }

        console.log("Total raw rows fetched:", allRows.length);

        const latestByKodeGudang = new Map<string, { record: Barang; timestamp: number }>();
        allRows.forEach((row) => {
          const normalized = normalizeBarangRecord(row);
          if (!normalized.kode_barang) {
            return;
          }

          const timestamp = getRecordTimestamp(row);
          const dedupeKey = `${normalized.kode_barang}__${normalized.gudang}`;
          const existing = latestByKodeGudang.get(dedupeKey);

          if (!existing || timestamp >= existing.timestamp) {
            latestByKodeGudang.set(dedupeKey, {
              record: normalized,
              timestamp,
            });
          }
        });

        const processedData = Array.from(latestByKodeGudang.values())
          .map((entry) => entry.record)
          .sort((a, b) => {
            const kodeCompare = a.kode_barang.localeCompare(b.kode_barang, "id");
            if (kodeCompare !== 0) return kodeCompare;
            return a.gudang.localeCompare(b.gudang, "id");
          });

        console.log("Processed data (deduped) length:", processedData.length);
        setBarangList(processedData);
      } catch (error) {
        console.error("Error in fetchBarang:", error);
        setBarangList([]);
        throw error;
      }
    }, { showLoadingToast: false, showSuccessToast: false });
  }, [loadData]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("User authenticated:", session.user.id);
          setUserId(session.user.id);
        } else {
          console.log("No user session found, continuing with global data scope");
          setUserId(null);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
        setUserId(null);
      } finally {
        await fetchBarang();
      }
    };

    init();
  }, [fetchBarang]);

  useEffect(() => {
    if (editingBarang) {
      form.reset({
        kode_barang: editingBarang.kode_barang?.trim() || "",
        nama_barang: editingBarang.nama_barang?.trim() || "",
        satuan: editingBarang.satuan?.trim() || "",
        harga: editingBarang.harga,
        gudang: editingBarang.gudang,
      });
    } else {
      form.reset({
        kode_barang: "",
        nama_barang: "",
        satuan: "",
        harga: 0,
        gudang: "obat",
      });
    }
  }, [editingBarang, form]);

  const checkKodeExists = async (kode: string, excludeId?: string): Promise<any | null> => {
    const normalizedKode = kode.trim().toUpperCase();
    let query = supabase
      .from('data_barang_farmasi')
      .select('id, kode_barang, nama_barang, satuan, harga, gudang, user_id')
      .ilike('kode_barang', normalizedKode);
      
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.limit(1).maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      showError("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    await saveData(async () => {
      const normalizedValues = {
        ...values,
        kode_barang: values.kode_barang.trim().toUpperCase(),
        nama_barang: values.nama_barang.trim(),
        satuan: values.satuan.trim(),
      };
      
      // Check jika kode sudah ada
      const existingBarangRaw = await checkKodeExists(
        normalizedValues.kode_barang,
        editingBarang?.id
      );
      const existingBarang = existingBarangRaw
        ? {
            ...existingBarangRaw,
            kode_barang: existingBarangRaw.kode_barang?.trim().toUpperCase() || "",
            nama_barang: existingBarangRaw.nama_barang?.trim() || "",
            satuan: existingBarangRaw.satuan?.trim() || "",
            harga: typeof existingBarangRaw.harga === "string" ? parseFloat(existingBarangRaw.harga) || 0 : existingBarangRaw.harga,
          }
        : null;
      
      if (existingBarang && !editingBarang) {
        const existingGudangLabel = existingBarang.gudang ? existingBarang.gudang.toUpperCase() : "TIDAK DIKETAHUI";
        setSearchTerm(existingBarang.kode_barang);
        setReportFilter("all");
        setEditingBarang(existingBarang);
        setIsDialogOpen(true);
        showInfo(`Kode Barang sudah digunakan untuk "${existingBarang.nama_barang}" di gudang ${existingGudangLabel}. Form dialihkan ke mode edit data tersebut.`);
        return;
      } else if (existingBarang && editingBarang) {
        throw new Error("Kode Barang sudah digunakan. Silakan gunakan kode yang lain.");
      }

      if (editingBarang) {
        await safeCRUDOperation('UPDATE', 'data_barang_farmasi', editingBarang.id, {
          ...normalizedValues,
          user_id: userId || null
        });
      } else {
        await safeCRUDOperation('INSERT', 'data_barang_farmasi', undefined, {
          ...normalizedValues,
          user_id: userId || null
        });
      }
      
      await fetchBarang();
    }, {
      loadingMessage: editingBarang ? "Memperbarui barang farmasi..." : "Menyimpan barang farmasi...",
      successMessage: editingBarang ? "Barang farmasi berhasil diperbarui" : "Barang farmasi berhasil ditambahkan"
    });
  };

  const handleEdit = (barang: Barang) => {
    setEditingBarang(barang);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteData(async () => {
      await safeCRUDOperation('DELETE', 'data_barang_farmasi', id);
      await fetchBarang();
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
              startUpload(totalRows, "Sedang mengimpor barang farmasi...");
              
              // Step 1: Process and validate all data
              const duplicateCodes: string[] = [];
              let processedCount = 0;
              let errorCount = 0;
              let duplicateInFileCount = 0;
              
              // First, get all existing kode barang from database to avoid duplicates
              console.log("Fetching existing data for user:", userId);
              const { data: existingData, error: fetchError } = await supabase
                .from('data_barang_farmasi')
                .select('kode_barang');
              
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
                const gudang = row["Gudang"] || row["gudang"] || "";
                
                console.log(`Row ${totalRowsProcessed}:`, { kode, namaBarang, satuan, harga, gudang });
                
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
                
                // Validate gudang value (more flexible)
                const validGudangValues = ["obat", "bhp"];
                let gudangValue = gudang;
                
                // Try to match gudang with partial matching
                if (!validGudangValues.includes(gudangValue)) {
                  if (gudangValue.toLowerCase().includes("obat")) {
                    gudangValue = "obat";
                  } else if (gudangValue.toLowerCase().includes("bhp")) {
                    gudangValue = "bhp";
                  } else {
                    console.log(`Row ${totalRowsProcessed} invalid gudang: ${gudangValue}`);
                    invalidRowsCount++;
                    errorCount++;
                    continue;
                  }
                }
                
                const hargaValue = parseFloat(harga) || 0;
                const itemData = {
                  kode_barang: kode,
                  nama_barang: namaBarang,
                  satuan: satuan,
                  harga: hargaValue,
                  gudang: gudangValue,
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
                    .from('data_barang_farmasi')
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
              await fetchBarang();
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
    const headers = ["Kode Barang", "Nama Barang", "Satuan", "Harga", "Gudang"];
    const sampleData = [
      ["BRG001", "Contoh Barang 1", "pcs", "10000", "obat"],
      ["BRG002", "Contoh Barang 2", "box", "25000", "bhp"],
      ["BRG003", "Contoh Barang 3", "kg", "5000", "obat"]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Barang");
    XLSX.writeFile(wb, "template_barang.xlsx");
    toast.info("Template impor data berhasil diunduh. Catatan: Jika ada kode barang duplikat, hanya data dengan harga tertinggi yang akan disimpan. Gudang harus: 'obat' atau 'bhp'.");
  };


  // Filter data based on search term and report filter
  const filteredBarangList = barangList.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_barang.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = reportFilter === "all" ? true : item.gudang === reportFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Debug filtering - only log when there are issues
  if (barangList.length > 0 && filteredBarangList.length === 0 && reportFilter === 'bhp') {
    console.log('Filtering debug for bhp:', {
      totalItems: barangList.length,
      filteredItems: filteredBarangList.length,
      searchTerm,
      reportFilter,
      bhpInOriginal: barangList.filter(item => item.gudang === 'bhp').length,
      bhpInFiltered: filteredBarangList.filter(item => item.gudang === 'bhp').length,
      allGudangsInOriginal: [...new Set(barangList.map(item => item.gudang))],
      allGudangsInFiltered: [...new Set(filteredBarangList.map(item => item.gudang))],
      sampleBhpItems: barangList.filter(item => item.gudang === 'bhp').slice(0, 3)
    });
  }

  const handleDownloadReport = useCallback(async () => {
    const filteredData = barangList.filter((item) =>
      reportFilter === "all" ? true : item.gudang === reportFilter,
    );

    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan dengan filter ini.");
      return;
    }

    const dataToExport = filteredData.map((item) => ({
      "Kode Barang": item.kode_barang,
      "Nama Barang": item.nama_barang,
      "Satuan": item.satuan,
      "Harga": item.harga,
      "Gudang": item.gudang,
    }));

    await downloadReport({
      title: "Laporan Barang Farmasi",
      subtitle: "Daftar barang farmasi berdasarkan gudang",
      filename: `laporan_barang_${reportFilter}`,
      filters: {
        Gudang: reportFilter === "all" ? "Semua" : reportFilter.toUpperCase(),
        Pencarian: searchTerm || "Tidak ada",
      },
      records: dataToExport,
    });
  }, [barangList, reportFilter, downloadReport, searchTerm]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manajemen Barang Farmasi</h2>
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-500 mt-1">
            Debug: Total data: {barangList.length} | BHP: {barangList.filter(item => item.gudang === "bhp").length}
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
            <Button onClick={() => setEditingBarang(null)} className="shadow-sm">
              Tambah Barang Farmasi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBarang ? "Edit Barang Farmasi" : "Tambah Barang Farmasi"}</DialogTitle>
              <DialogDescription>
                {editingBarang ? "Perbarui detail barang." : "Tambahkan barang baru ke sistem."}
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
                        <Input placeholder="Contoh: BRG001" {...field} />
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
                        <Input placeholder="Contoh: Infus Set" {...field} />
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
                        <Input placeholder="Contoh: pcs, box, kg" {...field} />
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
                <FormField
                  control={form.control}
                  name="gudang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gudang</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Gudang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="obat">Obat</SelectItem>
                          <SelectItem value="bhp">BHP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <LoadingButton
                    type="submit"
                    loading={saving}
                    loadingText={editingBarang ? "Menyimpan perubahan..." : "Menyimpan..."}
                  >
                    {editingBarang ? "Simpan Perubahan" : "Tambah"}
                  </LoadingButton>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Button onClick={handleDownloadReport} variant="report" className="shadow-sm">
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
        <Button onClick={() => fetchBarang()} variant="outline" size="icon" title="Refresh Data">
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
              {filteredBarangList.length} dari {barangList.length} data ditemukan
            </div>
          )}
          {!searchTerm && barangList.length > 0 && (
            <div className="text-sm text-gray-600">
              Total: {barangList.length} data | 
              Obat: {barangList.filter(item => item.gudang === 'obat').length} | 
              BHP: {barangList.filter(item => item.gudang === 'bhp').length}
            </div>
          )}
          {!searchTerm && barangList.length === 0 && !loading && (
            <div className="text-sm text-red-600">
              Tidak ada barang farmasi yang ditemukan. Periksa koneksi database atau coba refresh halaman.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Select onValueChange={(value: "all" | "obat" | "bhp") => setReportFilter(value)} defaultValue={reportFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Gudang</SelectItem>
            <SelectItem value="obat">Obat</SelectItem>
            <SelectItem value="bhp">BHP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Kode Barang</TableHead>
              <TableHead className="font-bold text-white">Nama Barang</TableHead>
              <TableHead className="font-bold text-white">Satuan</TableHead>
              <TableHead className="font-bold text-white">Harga</TableHead>
              <TableHead className="font-bold text-white">Gudang</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <LoadingSpinner size="md" text="Memuat data..." />
                </TableCell>
              </TableRow>
            ) : filteredBarangList.length > 0 ? (
              filteredBarangList.map((barang) => (
                <TableRow key={barang.id}>
                  <TableCell className="font-medium">{barang.kode_barang}</TableCell>
                  <TableCell>{barang.nama_barang}</TableCell>
                  <TableCell>{barang.satuan}</TableCell>
                  <TableCell>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(barang.harga)}</TableCell>
                  <TableCell>{barang.gudang}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="edit" size="icon" onClick={() => handleEdit(barang)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(barang.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm ? `Tidak ada barang farmasi yang cocok dengan pencarian "${searchTerm}".` : "Tidak ada barang farmasi."}
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

export default BarangFormTable;