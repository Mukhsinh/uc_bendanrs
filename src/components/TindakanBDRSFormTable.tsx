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

interface TindakanBDRS {
  kode: string;
  nama: string;
  created_at?: string;
}

const formSchema = z.object({
  nama: z.string().min(1, { message: "Nama tindakan wajib." }),
});

const TindakanBDRSFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [list, setList] = useState<TindakanBDRS[]>([]);
  const [editing, setEditing] = useState<TindakanBDRS | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, deleting, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Tindakan BDRS",
    onSuccess: () => {
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nama: "" },
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) form.reset({ nama: editing.nama });
    else form.reset({ nama: "" });
  }, [editing, form]);

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("tindakan_bdrs")
      .select("kode, nama")
      .order("kode", { ascending: true });
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
          .from("tindakan_bdrs")
          .update({ nama: values.nama })
          .eq("kode", editing.kode);
        if (error) throw error;
        toast.success("Data diperbarui.");
      } else {
        // For new records, let the database auto-generate the code
        const { error } = await supabase
          .from("tindakan_bdrs")
          .insert([{ nama: values.nama }]);
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

  const handleDelete = async (kode: string) => {
    try {
      const { error } = await supabase.from("tindakan_bdrs").delete().eq("kode", kode);
      if (error) throw error;
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Tindakan"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Tindakan BDRS");
    XLSX.writeFile(wb, "template_tindakan_bdrs.xlsx");
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
            startUpload(totalRows, "Sedang mengimpor data tindakan BDRS...");
            
            const rows: { nama: string }[] = [];
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            let missingCount = 0;
            
            for (const row of results.data) {
              processedCount++;
              updateProgress(processedCount, successCount, errorCount);
              
              const nama = (row["Nama Tindakan"] || "").toString().trim();
              if (!nama) {
                missingCount++;
                continue;
              }
              rows.push({ nama });
              successCount++;
            }
            
            if (rows.length === 0) { 
              showUploadError("Tidak ada data valid untuk diimpor."); 
              return; 
            }
            
            // Insert data to database
            const { error } = await supabase.from("tindakan_bdrs").insert(rows);
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
        "Kode Tindakan": item.kode,
        "Nama Tindakan": item.nama,
      }));

      await downloadReport({
        title: "Laporan Tindakan BDRS",
        filename: "laporan_tindakan_bdrs",
        records,
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan tindakan BDRS:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manajemen Tindakan BDRS</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input id="import-file-tindakan-bdrs" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
          </label>
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="shadow-sm">
              Tambah Tindakan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Tindakan" : "Tambah Tindakan"}</DialogTitle>
              <DialogDescription>
                {editing ? "Perbarui detail tindakan BDRS." : "Tambahkan tindakan BDRS baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Tindakan</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Nama Tindakan" {...field} />
                        </FormControl>
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
        <Button
          onClick={() => {
            void handleDownloadReport();
          }}
          variant="report"
          className="shadow-sm"
        >
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
        <Button onClick={() => fetchAll()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Kode Tindakan</TableHead>
              <TableHead className="font-bold text-white">Nama Tindakan</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : (
              list.map(item => (
                <TableRow key={item.kode}>
                  <TableCell className="font-medium">{item.kode}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(item.kode)}>
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
      
      {/* Import Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
    </div>
  );
};

export default TindakanBDRSFormTable;


