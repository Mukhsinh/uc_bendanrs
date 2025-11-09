"use client";

import React, { useEffect, useState } from "react";
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
import { 
  optimizedDelete, 
  optimizedUpdate, 
  optimizedInsert, 
  handleDatabaseError,
  safeCRUDOperation 
} from "@/utils/database-operations";

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

interface TindakanRadiologi {
  id: string;
  kode_tindakan: string;
  nama_tindakan: string;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  nama_tindakan: z.string().min(1, { message: "Nama tindakan wajib." }),
});

const TindakanRadiologiFormTable: React.FC = () => {
  const [list, setList] = useState<TindakanRadiologi[]>([]);
  const [editing, setEditing] = useState<TindakanRadiologi | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError } = useUploadProgress();
  // Use form operations hook
  const { saving, deleting, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Tindakan Radiologi",
    onSuccess: () => {
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nama_tindakan: "" },
  });

  // Function to generate next available Rad.xxx code
  const generateNextCode = async (): Promise<string> => {
    const { data, error } = await supabase
      .from("tindakan_radiologi")
      .select("kode_tindakan")
      .order("kode_tindakan", { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Error fetching last code:", error);
      return "Rad.001"; // Default fallback
    }
    
    if (!data || data.length === 0) {
      return "Rad.001"; // First code
    }
    
    const lastCode = data[0].kode_tindakan;
    const match = lastCode.match(/^Rad\.(\d+)$/);
    
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      return `Rad.${nextNumber.toString().padStart(3, '0')}`;
    }
    
    return "Rad.001"; // Fallback if format doesn't match
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ nama_tindakan: editing.nama_tindakan });
    } else {
      form.reset({ nama_tindakan: "" });
    }
  }, [editing, form]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tindakan_radiologi")
      .select("id, kode_tindakan, nama_tindakan, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal memuat data.");
      console.error(error);
      setList([]);
    } else {
      setList(data || []);
    }
    setLoading(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editing) {
        // For editing, use SAFE update operation
        await safeCRUDOperation('UPDATE', 'tindakan_radiologi', editing.id, {
          nama_tindakan: values.nama_tindakan
        });
        toast.success("Data diperbarui.");
      } else {
        // For new records, generate automatic code and use SAFE insert
        const newCode = await generateNextCode();
        await safeCRUDOperation('INSERT', 'tindakan_radiologi', undefined, {
          kode_tindakan: newCode,
          nama_tindakan: values.nama_tindakan
        });
        toast.success(`Data ditambahkan dengan kode ${newCode}.`);
      }
      await fetchAll();
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      handleDatabaseError(err, editing ? "memperbarui data" : "menambahkan data");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Use SAFE delete operation
      await safeCRUDOperation('DELETE', 'tindakan_radiologi', id);
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      handleDatabaseError(err, "menghapus data");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Tindakan"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Tindakan Radiologi");
    XLSX.writeFile(wb, "template_tindakan_radiologi.xlsx");
    toast.info("Template impor diunduh. Kode akan digenerate otomatis.");
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
            const rows: { nama_tindakan: string }[] = [];
            let missingCount = 0;
            
            for (const row of results.data) {
              const nama = (row["Nama Tindakan"] || "").toString().trim();
              if (!nama) {
                missingCount++;
                continue;
              }
              rows.push({ nama_tindakan: nama });
            }
            
            if (rows.length === 0) { 
              toast.warning("Tidak ada data valid untuk diimpor.");
              return; 
            }
            
            // Start upload progress
            startUpload(rows.length, 'Sedang mengimpor data tindakan radiologi...');
            
            // Import rows one by one to generate automatic codes
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              try {
                const newCode = await generateNextCode();
                const { error } = await supabase
                  .from("tindakan_radiologi")
                  .insert([{ kode_tindakan: newCode, nama_tindakan: row.nama_tindakan }]);
                
                if (error) {
                  errorCount++;
                  errors.push(`${row.nama_tindakan}: ${error.message}`);
                } else {
                  successCount++;
                }
                
                // Update progress
                updateProgress(i + 1, successCount, errorCount, `Mengimpor data ${i + 1} dari ${rows.length}...`);
                
              } catch (err: any) {
                errorCount++;
                errors.push(`${row.nama_tindakan}: ${err.message}`);
              }
            }
            
            await fetchAll();
            
            // Show final status
            completeUpload(successCount, errorCount, missingCount);
            
          } catch (err: any) {
            console.error(err);
            showError('Gagal memproses file');
          }
        },
        error: (error: Papa.ParseError) => {
          showError('Gagal membaca file CSV');
        },
      });
    });
  };

  const handleDownloadReport = () => {
    const data = list.map(item => ({ 
      "Kode Tindakan": item.kode_tindakan, 
      "Nama Tindakan": item.nama_tindakan 
    }));
    if (data.length === 0) { toast.warning("Tidak ada data untuk laporan."); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Tindakan Radiologi");
    XLSX.writeFile(wb, "laporan_tindakan_radiologi.xlsx");
    toast.info("Laporan diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      {/* Upload Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manajemen Tindakan Radiologi</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input id="import-file-tindakan-radiologi" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
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
                {editing ? "Perbarui detail tindakan radiologi." : "Tambahkan tindakan radiologi baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  {editing && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kode Tindakan</label>
                      <div className="p-2 bg-muted rounded-md text-sm font-mono">
                        {editing.kode_tindakan}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Kode tidak dapat diubah setelah dibuat
                      </p>
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="nama_tindakan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Tindakan</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Foto Rontgen Thorax" {...field} />
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
        <Button onClick={handleDownloadReport} variant="report" className="shadow-sm">
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
        <Button onClick={() => fetchAll()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-700">
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
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.kode_tindakan}</TableCell>
                  <TableCell>{item.nama_tindakan}</TableCell>
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
    </div>
  );
};

export default TindakanRadiologiFormTable;
