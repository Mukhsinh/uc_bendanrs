"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useReportDownload } from "@/components/report";

interface TindakanIBS {
  id: string;
  kode_tindakan: string;
  nama_tindakan: string;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  kode_tindakan: z.string().min(1, { message: "Kode tindakan wajib." }).regex(/^IBS\.[0-9]+$/, { message: "Format kode harus IBS.xxx (contoh: IBS.001)" }),
  nama_tindakan: z.string().min(1, { message: "Nama tindakan wajib." }),
});

const TindakanIBSFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [list, setList] = useState<TindakanIBS[]>([]);
  const [editing, setEditing] = useState<TindakanIBS | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, deleting, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Tindakan IBS",
    onSuccess: () => {
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      kode_tindakan: "",
      nama_tindakan: "" 
    },
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ 
        kode_tindakan: editing.kode_tindakan,
        nama_tindakan: editing.nama_tindakan 
      });
    } else {
      form.reset({ 
        kode_tindakan: "",
        nama_tindakan: "" 
      });
    }
  }, [editing, form]);

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("tindakan_ibs")
      .select("id, kode_tindakan, nama_tindakan, created_at, updated_at")
      .order("kode_tindakan", { ascending: true });
    if (error) {
      toast.error("Gagal memuat data.");
      console.error(error);
      setList([]);
    } else {
      setList(data || []);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editing) {
        const { error } = await supabase
          .from("tindakan_ibs")
          .update({ 
            kode_tindakan: values.kode_tindakan,
            nama_tindakan: values.nama_tindakan 
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Data diperbarui.");
      } else {
        const { error } = await supabase
          .from("tindakan_ibs")
          .insert([{ 
            kode_tindakan: values.kode_tindakan,
            nama_tindakan: values.nama_tindakan 
          }]);
        if (error) throw error;
        toast.success("Data disimpan.");
      }
      await fetchAll();
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus data ini?")) return;
    try {
      const { error } = await supabase.from("tindakan_ibs").delete().eq("id", id);
      if (error) throw error;
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Kode Tindakan", "Nama Tindakan"];
    const rows = [
      ["IBS.001", "Contoh Tindakan 1"],
      ["IBS.002", "Contoh Tindakan 2"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Tindakan IBS");
    XLSX.writeFile(wb, "template_tindakan_ibs.xlsx");
    toast.info("Template impor diunduh.");
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
            const allRows = results.data;
            const totalRows = allRows.length;
            
            // Start upload progress
            startUpload(totalRows, "Sedang mengimpor data tindakan IBS...");
            
            const rows: { kode_tindakan: string; nama_tindakan: string }[] = [];
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            let missingCount = 0;
            
            for (const row of results.data) {
              processedCount++;
              updateProgress(processedCount, successCount, errorCount);
              
              const kode = (row["Kode Tindakan"] || "").toString().trim();
              const nama = (row["Nama Tindakan"] || "").toString().trim();
              
              if (!kode || !nama) {
                missingCount++;
                errorCount++;
                continue;
              }
              
              // Validate format
              if (!/^IBS\.[0-9]+$/.test(kode)) {
                errorCount++;
                continue;
              }
              
              rows.push({ kode_tindakan: kode, nama_tindakan: nama });
              successCount++;
            }
            
            if (rows.length === 0) { 
              showUploadError("Tidak ada data valid untuk diimpor."); 
              return; 
            }
            
            // Insert data to database (using upsert to handle duplicates)
            const { error } = await supabase
              .from("tindakan_ibs")
              .upsert(rows, { 
                onConflict: 'kode_tindakan',
                ignoreDuplicates: false 
              });
            if (error) throw error;
            
            // Complete upload with final counts
            completeUpload(successCount, errorCount, missingCount);
            
            // Refresh data
            await fetchAll();
          } catch (err: any) {
            console.error(err);
            showUploadError(`Gagal mengimpor data: ${err.message}`);
          }
        },
        error: (error: Papa.ParseError) => {
          showUploadError(`Gagal membaca file CSV: ${error.message}`);
        },
      });
    });
  };

  const handleDownloadReport = async () => {
    if (list.length === 0) {
      toast.warning("Tidak ada data untuk laporan.");
      return;
    }

    try {
      const records = list.map((item) => ({
        "Kode Tindakan": item.kode_tindakan,
        "Nama Tindakan": item.nama_tindakan,
      }));

      await downloadReport({
        title: "Laporan Tindakan IBS",
        filename: "laporan_tindakan_ibs",
        records,
      });
      toast.success("Laporan berhasil diunduh.");
    } catch (error) {
      console.error("Gagal mengunduh laporan tindakan IBS:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  return (
    <div className="space-y-4">
      <ImportProgressModal 
        progress={uploadProgress}
      />

      <div>
        <h2 className="text-2xl font-bold">Manajemen Tindakan IBS</h2>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="shadow-sm"
              onClick={() => {
                setEditing(null);
                form.reset({ kode_tindakan: "", nama_tindakan: "" });
              }}
            >
              Tambah Data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Tambah"} Tindakan IBS</DialogTitle>
              <DialogDescription>
                {editing ? "Ubah" : "Masukkan"} data tindakan IBS dengan format kode IBS.xxx
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="kode_tindakan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Tindakan</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="IBS.001" 
                          disabled={!!editing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nama_tindakan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Tindakan</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nama tindakan IBS" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Button variant="template" className="shadow-sm" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Unduh Template
        </Button>
        
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
            <input
              type="file"
              accept=".csv"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </Button>
        
        <Button
          variant="report"
          className="shadow-sm"
          onClick={() => {
            void handleDownloadReport();
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Unduh Laporan
        </Button>
        
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Memuat data tindakan IBS..." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-[#0f766e]">
              <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                <TableHead className="font-bold text-white">Kode Tindakan</TableHead>
                <TableHead className="font-bold text-white">Nama Tindakan</TableHead>
                <TableHead className="w-[100px] font-bold text-white">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-gray-500">Tidak ada data.</div>
                      <div className="text-xs text-blue-600">
                        💡 Klik "Tambah Data" atau "Import Data" untuk memulai
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-semibold bg-blue-50">{item.kode_tindakan}</TableCell>
                    <TableCell>{item.nama_tindakan}</TableCell>
                    <TableCell>
                      <div className="flex justify-start gap-2">
                        <Button
                          variant="edit"
                          size="icon"
                          onClick={() => {
                            setEditing(item);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TindakanIBSFormTable;

