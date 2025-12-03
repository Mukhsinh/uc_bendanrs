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
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useReportDownload } from "@/components/report";

interface MenuGizi {
  id: number;
  kode_makanan: string;
  nama_makanan: string;
}

const formSchema = z.object({
  nama_makanan: z.string().min(1, { message: "Nama makanan wajib." }),
});

const MenuGiziFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [list, setList] = useState<MenuGizi[]>([]);
  const [editing, setEditing] = useState<MenuGizi | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      nama_makanan: ""
    },
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ 
        nama_makanan: editing.nama_makanan
      });
    } else {
      form.reset({ 
        nama_makanan: ""
      });
    }
  }, [editing, form]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await tenantSupabase
      .from("menu_gizi")
      .select("id, kode_makanan, nama_makanan")
      .order("id", { ascending: true });
    if (error) { toast.error("Gagal memuat data."); console.error(error); setList([]); }
    else setList(data || []);
    setLoading(false);
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editing) {
        const { error } = await supabase
          .from("menu_gizi")
          .update({ 
            nama_makanan: values.nama_makanan
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Data diperbarui.");
      } else {
        const { error } = await supabase
          .from("menu_gizi")
          .insert([{ 
            nama_makanan: values.nama_makanan
          }]);
        if (error) throw error;
        toast.success("Data ditambahkan.");
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

  const handleDelete = async (id: number) => {
    try {
      const { error } = await tenantSupabase.from("menu_gizi").delete().eq("id", id);
      if (error) throw error;
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Makanan"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Menu Gizi");
    XLSX.writeFile(wb, "template_menu_gizi.xlsx");
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
            startUpload(totalRows, "Sedang mengimpor data menu gizi...");
            
            const rows: Omit<MenuGizi, "id">[] = [];
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            let missingCount = 0;
            
            for (const row of results.data) {
              processedCount++;
              updateProgress(processedCount, successCount, errorCount);
              
              const nama = (row["Nama Makanan"] || "").toString().trim();
              
              if (!nama) {
                missingCount++;
                continue;
              }
              
              rows.push({ 
                kode_makanan: "", // Will be generated automatically
                nama_makanan: nama
              });
            }
            
            if (rows.length === 0) { 
              showUploadError("Tidak ada data valid untuk diimpor."); 
              return; 
            }
            
            // Insert data one by one (kode makanan will be auto-generated by database trigger)
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              try {
                const { error } = await tenantSupabase.from("menu_gizi").insert([{ 
                  nama_makanan: row.nama_makanan
                }]);
                
                if (error) {
                  errorCount++;
                } else {
                  successCount++;
                }
                
                // Update progress
                updateProgress(totalRows, successCount, errorCount, `Mengimpor data ${i + 1} dari ${rows.length}...`);
                
              } catch (err: any) {
                errorCount++;
                console.error(err);
              }
            }
            
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
      const records = list.map((item, index) => ({
        No: index + 1,
        "Kode Makanan": item.kode_makanan,
        "Nama Makanan": item.nama_makanan,
      }));

      await downloadReport({
        title: "Laporan Menu Gizi",
        filename: "laporan_menu_gizi",
        records,
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan menu gizi:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manajemen Menu Gizi</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
          </label>
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="shadow-sm">
              Tambah Menu Gizi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Menu Gizi" : "Tambah Menu Gizi"}</DialogTitle>
              <DialogDescription>{editing ? "Perbarui detail menu gizi." : "Tambahkan menu gizi baru."}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="nama_makanan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Makanan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Nasi Putih" {...field} />
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
              <TableHead className="font-bold text-white">Kode Makanan</TableHead>
              <TableHead className="font-bold text-white">Nama Makanan</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : (
              list.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.kode_makanan}</TableCell>
                  <TableCell>{item.nama_makanan}</TableCell>
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
      
      {/* Import Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
    </div>
  );
};

export default MenuGiziFormTable;
