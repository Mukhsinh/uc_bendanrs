"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
import { useReportDownload } from "@/components/report";

interface DataDiklat {
  id: string;
  kode_strata: string;
  nama_strata: string;
  kode_materi: string;
  nama_materi: string;
  lama_hari: number;
  jenis_diklat: string;
}

const formSchema = z.object({
  kode_strata: z.string().min(1, { message: "Kode strata wajib." }),
  nama_strata: z.string().min(1, { message: "Nama strata wajib." }),
  kode_materi: z.string()
    .min(1, { message: "Kode materi wajib." })
    .regex(/^[L][1-5]\.\d{2}$/, { message: "Format kode materi harus L1.xx, L2.xx, L3.xx, L4.xx, atau L5.xx" }),
  nama_materi: z.string().min(1, { message: "Nama materi wajib." }),
  lama_hari: z.number().min(1, { message: "Lama hari wajib." }),
  jenis_diklat: z.string().min(1, { message: "Jenis diklat wajib." }),
});

const DataDiklatFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [diklatList, setDiklatList] = useState<DataDiklat[]>([]);
  const [editing, setEditing] = useState<DataDiklat | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, deleting, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Data Diklat",
    onSuccess: () => {
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      kode_strata: "", 
      nama_strata: "", 
      kode_materi: "", 
      nama_materi: "", 
      lama_hari: 1, 
      jenis_diklat: "" 
    },
  });

  const strataOptions = [
    { value: "L1", label: "L1 - SMA" },
    { value: "L2", label: "L2 - D3" },
    { value: "L3", label: "L3 - S1" },
    { value: "L4", label: "L4 - S2" },
    { value: "L5", label: "L5 - S3" },
  ];

  const kalkulasiDiklatOptions = [
    { value: "basis_dokter", label: "Basis Dokter - Rp 7.446.149/hari" },
    { value: "basis_perawat", label: "Basis Perawat - Rp 4.964.099/hari" },
    { value: "basis_tenaga_kesehatan", label: "Basis Tenaga Kesehatan - Rp 3.723.074/hari" },
  ];

  useEffect(() => { fetchDiklat(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset(editing);
    } else {
      form.reset({ kode_strata: "", kode_materi: "", nama_materi: "" });
    }
  }, [editing, form]);

  // Auto-generate kode_materi when kode_strata changes
  const handleStrataChange = (value: string) => {
    if (!editing && value) {
      // Generate next available kode_materi for the selected strata
      const existingKodes = diklatList
        .filter(item => item.kode_strata === value)
        .map(item => item.kode_materi)
        .sort();
      
      let nextNumber = 1;
      let newKode = `${value}.${nextNumber.toString().padStart(2, '0')}`;
      
      while (existingKodes.includes(newKode)) {
        nextNumber++;
        newKode = `${value}.${nextNumber.toString().padStart(2, '0')}`;
      }
      
      form.setValue("kode_materi", newKode);
    }
    form.setValue("kode_strata", value);
  };

  const fetchDiklat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User tidak terautentikasi.");
      return;
    }

    const { data, error } = await supabase
      .from("data_diklat")
      .select("id, kode_strata, kode_materi, nama_materi")
      .order("kode_strata", { ascending: true })
      .order("kode_materi", { ascending: true });
    
    if (error) {
      toast.error("Gagal memuat data diklat.");
      console.error(error);
      setDiklatList([]);
    } else {
      setDiklatList((data || []) as DataDiklat[]);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Form values:", values);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi.");
        return;
      }
      console.log("User ID:", user.id);

      if (editing) {
        // Check if kode_materi is being changed and if it already exists
        if (values.kode_materi !== editing.kode_materi) {
          const { data: existingData } = await supabase
            .from("data_diklat")
            .select("id")
            .eq("kode_materi", values.kode_materi)
            .neq("id", editing.id)
            .maybeSingle();
          
          if (existingData) {
            toast.error("Kode materi sudah digunakan. Silakan gunakan kode yang berbeda.");
            return;
          }
        }

        const { error } = await supabase
          .from("data_diklat")
          .update({ 
            kode_strata: values.kode_strata,
            nama_strata: values.nama_strata,
            kode_materi: values.kode_materi,
            nama_materi: values.nama_materi,
            lama_hari: values.lama_hari,
            jenis_diklat: values.jenis_diklat,
            updated_at: new Date().toISOString()
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Data diklat diperbarui.");
      } else {
        // Check if kode_materi already exists for new entries
        const { data: existingData } = await supabase
          .from("data_diklat")
          .select("id")
          .eq("kode_materi", values.kode_materi)
          .maybeSingle();
        
        if (existingData) {
          toast.error("Kode materi sudah digunakan. Silakan gunakan kode yang berbeda.");
          return;
        }

        const insertData = { 
          user_id: user.id,
          kode_strata: values.kode_strata,
          nama_strata: values.nama_strata,
          kode_materi: values.kode_materi,
          nama_materi: values.nama_materi,
          lama_hari: values.lama_hari,
          jenis_diklat: values.jenis_diklat,
          kalkulasi_diklat_id: null // Explicitly set to null
        };
        console.log("Insert data:", insertData);
        
        const { data: insertResult, error } = await supabase
          .from("data_diklat")
          .insert([insertData])
          .select();
        if (error) {
          console.error("Supabase error:", error);
          console.error("Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        console.log("Insert result:", insertResult);
        toast.success("Data diklat ditambahkan.");
      }
      await fetchDiklat();
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("duplicate key value violates unique constraint")) {
        toast.error("Kode materi sudah digunakan. Silakan gunakan kode yang berbeda.");
      } else if (err.message?.includes("violates unique constraint")) {
        toast.error("Kode materi sudah digunakan. Silakan gunakan kode yang berbeda.");
      } else {
        toast.error(`Gagal menyimpan data diklat: ${err.message || 'Terjadi kesalahan yang tidak diketahui'}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("data_diklat").delete().eq("id", id);
      if (error) throw error;
      await fetchDiklat();
      toast.success("Data diklat dihapus.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menghapus data diklat: ${err.message || 'Terjadi kesalahan yang tidak diketahui'}`);
    }
  };

  const handleDownloadTemplate = () => {
    // Sinkronkan dengan kolom yang diwajibkan saat impor
    const headers = [
      "Kode Strata",
      "Nama Strata",
      "Kode Materi",
      "Nama Materi",
      "Lama Hari",
      "Jenis Diklat"
    ];
    const csvContent = [headers].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_data_diklat.csv");
    toast.info("Template CSV impor diunduh.");
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              showUploadError("User tidak terautentikasi.");
              return;
            }

            const allRows = results.data;
            const totalRows = allRows.length;
            
            // Start upload progress
            startUpload(totalRows, "Sedang mengimpor data diklat...");

            // Get existing kode_materi to check duplicates
            const { data: existingData } = await supabase
              .from("data_diklat")
              .select("kode_materi");

            const existingKodeMateri = new Set(existingData?.map(item => item.kode_materi) || []);
            const rows: any[] = [];
            const duplicateRows: string[] = [];
            const validRows: any[] = [];
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            let missingCount = 0;

            for (const row of results.data) {
              processedCount++;
              updateProgress(processedCount, successCount, errorCount);
              
              const kodeStrata = (row["Kode Strata"] || "").toString().trim();
              const namaStrata = (row["Nama Strata"] || "").toString().trim();
              const kodeMateri = (row["Kode Materi"] || "").toString().trim();
              const namaMateri = (row["Nama Materi"] || "").toString().trim();
              const lamaHari = parseInt((row["Lama Hari"] || "1").toString()) || 1;
              const jenisDiklat = (row["Jenis Diklat"] || "").toString().trim();
              
              if (!kodeStrata || !namaStrata || !kodeMateri || !namaMateri || !jenisDiklat) {
                missingCount++;
                continue;
              }
              
              const rowData = { 
                user_id: user.id,
                kode_strata: kodeStrata,
                nama_strata: namaStrata,
                kode_materi: kodeMateri,
                nama_materi: namaMateri,
                lama_hari: lamaHari,
                jenis_diklat: jenisDiklat
              };

              if (existingKodeMateri.has(kodeMateri)) {
                duplicateRows.push(kodeMateri);
                errorCount++;
              } else {
                validRows.push(rowData);
                existingKodeMateri.add(kodeMateri); // Add to set to prevent duplicates within the same import
                successCount++;
              }
            }

            if (validRows.length === 0) {
              if (duplicateRows.length > 0) {
                showUploadError(`Semua data sudah ada. Kode materi yang duplikat: ${duplicateRows.join(", ")}`);
              } else {
                showUploadError("Tidak ada data valid untuk diimpor.");
              }
              return;
            }

            // Insert data to database
            const { error } = await supabase.from("data_diklat").insert(validRows);
            if (error) throw error;
            
            // Complete upload with final counts
            completeUpload(successCount, errorCount, missingCount);
            
            // Refresh data
            await fetchDiklat();
            
            let message = `${validRows.length} data diimpor.`;
            if (duplicateRows.length > 0) {
              message += ` ${duplicateRows.length} data diabaikan karena kode materi sudah ada: ${duplicateRows.join(", ")}`;
            }
            toast.success(message);
          } catch (err: any) {
            console.error(err);
            toast.error(`Gagal impor: ${err.message}`);
          }
        },
        error: (error: Papa.ParseError) => toast.error(`Gagal impor: ${error.message}`),
      });
    });
  };

  const handleDownloadReport = async () => {
    if (diklatList.length === 0) {
      toast.warning("Tidak ada data untuk laporan.");
      return;
    }

    try {
      const records = diklatList.map((d) => ({
        "Kode Strata": d.kode_strata,
        "Kode Materi": d.kode_materi,
        "Nama Materi": d.nama_materi,
      }));

      await downloadReport({
        title: "Laporan Data Diklat",
        filename: "laporan_data_diklat",
        records,
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan data diklat:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Diklat</h2>
        <div className="flex gap-2">
          <Button onClick={() => fetchDiklat()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>Tambah Data Diklat</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Data Diklat" : "Tambah Data Diklat"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Perbarui detail diklat." : "Tambahkan diklat baru."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="kode_strata"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Strata</FormLabel>
                        <Select onValueChange={handleStrataChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih strata" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {strataOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                    name="kode_materi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Materi</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: L1.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nama_materi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Materi</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Dasar-dasar Keperawatan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nama_strata"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Strata</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: SMA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lama_hari"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lama Hari</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Contoh: 10" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jenis_diklat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Diklat</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis diklat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {kalkulasiDiklatOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">{editing ? "Simpan Perubahan" : "Tambah"}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={handleDownloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <label htmlFor="import-file-diklat" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
          <Upload className="mr-2 h-4 w-4" /> Impor Data
          <Input id="import-file-diklat" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
        </label>
        <Button
          onClick={() => {
            void handleDownloadReport();
          }}
          variant="outline"
        >
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Strata</TableHead>
              <TableHead>Kode Materi</TableHead>
              <TableHead>Nama Materi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Memuat data...</TableCell>
              </TableRow>
            ) : diklatList.length > 0 ? (
              diklatList.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {strataOptions.find(s => s.value === row.kode_strata)?.label || row.kode_strata}
                  </TableCell>
                  <TableCell>{row.kode_materi}</TableCell>
                  <TableCell>{row.nama_materi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="edit"
                        size="icon"
                        onClick={() => {
                          setEditing(row);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Tidak ada data diklat.</TableCell>
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

export default DataDiklatFormTable;
