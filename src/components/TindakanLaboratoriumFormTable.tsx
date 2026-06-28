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
import { 
  safeCRUDOperation,
  handleDatabaseError 
} from "@/utils/database-operations";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useReportDownload } from "@/components/report";

type JenisLab = "PK" | "PA" | "Mi";

interface TindakanLab {
  id: string;
  jenis: JenisLab;
  kode: string;
  nama: string;
  created_at?: string;
}

const formSchema = z.object({
  jenis: z.enum(["PK", "PA", "Mi"], { required_error: "Jenis wajib dipilih." }),
  nama: z.string().min(1, { message: "Nama tindakan wajib." }),
});

const TindakanLaboratoriumFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [list, setList] = useState<TindakanLab[]>([]);
  const [editing, setEditing] = useState<TindakanLab | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError } = useUploadProgress();
  // Use form operations hook
  const { saving, deleting, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Tindakan Laboratorium",
    onSuccess: () => {
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });
  const [filterJenis, setFilterJenis] = useState<"all" | JenisLab>("all");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { jenis: undefined, nama: "" },
  });

  // Function to generate next available code
  const generateNextCode = async (jenis: JenisLab): Promise<string> => {
    const { data, error } = await tenantSupabase
      .from("tindakan_laboratorium")
      .select("kode")
      .eq("jenis", jenis)
      .order("kode", { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Error fetching last code:", error);
      return `${jenis}.001`; // Default fallback
    }
    
    if (!data || data.length === 0) {
      return `${jenis}.001`; // First code
    }
    
    const lastCode = data[0].kode;
    const match = lastCode.match(new RegExp(`^${jenis}\\.(\\d+)$`));
    
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      return `${jenis}.${nextNumber.toString().padStart(3, '0')}`;
    }
    
    return `${jenis}.001`; // Fallback if format doesn't match
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ jenis: editing.jenis, nama: editing.nama });
    } else {
      form.reset({ jenis: undefined, nama: "" });
    }
  }, [editing, form]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await tenantSupabase
      .from("tindakan_laboratorium")
      .select("id, jenis, kode, nama, created_at")
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
        // Direct database call like operatif - avoid trigger issues
        const { error } = await tenantSupabase
          .from("tindakan_laboratorium")
          .update({
            jenis: values.jenis as JenisLab,
            nama: values.nama
          })
          .eq("id", editing.id);
        
        if (error) throw error;
        toast.success("Data diperbarui.");
      } else {
        // For new records, generate automatic code and use direct insert
        const newCode = await generateNextCode(values.jenis as JenisLab);
        const { error } = await tenantSupabase
          .from("tindakan_laboratorium")
          .insert([{
            jenis: values.jenis as JenisLab,
            kode: newCode,
            nama: values.nama
          }]);
        
        if (error) throw error;
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
      // Direct database call like operatif - avoid trigger issues
      const { error } = await tenantSupabase
        .from("tindakan_laboratorium")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      handleDatabaseError(err, "menghapus data");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Jenis (PK/PA/Mi)", "Nama Tindakan"];
    const sampleData = [
      ["PK", "Hematologi Lengkap"],
      ["PA", "Biopsi Jaringan"],
      ["Mi", "Kultur Bakteri"]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Tindakan Laboratorium");
    XLSX.writeFile(wb, "template_tindakan_laboratorium.xlsx");
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
            const rows: { jenis: JenisLab, nama: string }[] = [];
            let missingCount = 0;
            
            for (const row of results.data) {
              const jenisRaw = (row["Jenis (PK/PA/Mi)"] || "").toString().trim() as JenisLab;
              const nama = (row["Nama Tindakan"] || "").toString().trim();
              
              if (!jenisRaw || !nama) {
                missingCount++;
                continue;
              }
              if (!["PK", "PA", "Mi"].includes(jenisRaw)) {
                missingCount++;
                continue;
              }
              
              rows.push({ jenis: jenisRaw, nama });
            }
            
            if (rows.length === 0) { 
              toast.warning("Tidak ada data valid untuk diimpor.");
              return; 
            }
            
            // Start upload progress
            startUpload(rows.length, 'Sedang mengimpor data tindakan laboratorium...');
            
            // Import rows one by one to generate automatic codes
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              try {
                const newCode = await generateNextCode(row.jenis);
                const { error } = await tenantSupabase
                  .from("tindakan_laboratorium")
                  .insert([{ jenis: row.jenis, kode: newCode, nama: row.nama }]);
                
                if (error) {
                  errorCount++;
                  errors.push(`${row.nama}: ${error.message}`);
                } else {
                  successCount++;
                }
                
                // Update progress
                updateProgress(i + 1, successCount, errorCount, `Mengimpor data ${i + 1} dari ${rows.length}...`);
                
              } catch (err: any) {
                errorCount++;
                errors.push(`${row.nama}: ${err.message}`);
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

  const handleDownloadReport = async () => {
    const data = list
      .filter((item) => (filterJenis === "all" ? true : item.jenis === filterJenis))
      .map((item) => ({
        Jenis: item.jenis,
        Kode: item.kode,
        "Nama Tindakan": item.nama,
      }));

    if (data.length === 0) {
      toast.warning("Tidak ada data untuk laporan.");
      return;
    }

    try {
      await downloadReport({
        title: "Laporan Tindakan Laboratorium",
        subtitle: filterJenis === "all" ? undefined : `Jenis ${filterJenis}`,
        filename: `laporan_tindakan_laboratorium_${filterJenis}`,
        records: data,
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan tindakan laboratorium:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Upload Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manajemen Tindakan Laboratorium</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input id="import-file-tindakan-lab" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
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
                {editing ? "Perbarui detail tindakan laboratorium." : "Tambahkan tindakan laboratorium baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  {editing && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kode Tindakan</label>
                      <div className="p-2 bg-muted rounded-md text-sm font-mono">
                        {editing.kode}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Kode tidak dapat diubah setelah dibuat
                      </p>
                    </div>
                  )}
                  {!editing && (
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md">
                      💡 Kode akan digenerate otomatis berdasarkan jenis yang dipilih
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="jenis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Laboratorium</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Jenis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PK">Patologi Klinik (PK)</SelectItem>
                            <SelectItem value="PA">Patologi Anatomi (PA)</SelectItem>
                            <SelectItem value="Mi">Mikrobiologi (Mi)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Tindakan</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Hematologi Lengkap" {...field} />
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

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Select onValueChange={(v: any) => setFilterJenis(v)} defaultValue={filterJenis}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Jenis" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="PK">PK</SelectItem>
            <SelectItem value="PA">PA</SelectItem>
            <SelectItem value="Mi">Mi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Jenis</TableHead>
              <TableHead className="font-bold text-white">Kode</TableHead>
              <TableHead className="font-bold text-white">Nama Tindakan</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : (
              (filterJenis === "all" ? list : list.filter(i => i.jenis === filterJenis)).map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.jenis}</TableCell>
                  <TableCell>{item.kode}</TableCell>
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

export default TindakanLaboratoriumFormTable;
