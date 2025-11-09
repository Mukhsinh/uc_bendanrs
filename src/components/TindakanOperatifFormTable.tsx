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
import { safeCRUDOperation, handleDatabaseError } from "@/utils/database-operations";

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
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw, Search, X, Stethoscope, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImportProgressModal, UploadProgress } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";

interface TindakanOperatif {
  id: string;
  kode_jenis: number;
  kode_operator_spesialistik: string;
  nama_operator_spesialistik: string;
  kode_tindakan_operatif: string;
  nama_tindakan_operatif: string;
  created_at?: string;
  updated_at?: string;
}


const formSchema = z.object({
  kode_jenis: z.coerce.number().int().min(1).max(3).default(3),
  kode_operator_spesialistik: z.string()
    .min(1, { message: "Kode operator spesialistik wajib." })
    .regex(/^[0-9]+\.[0-9]{2}$/i, { message: "Gunakan format jenis.xx (contoh: 3.01)" }),
  nama_operator_spesialistik: z.string().min(1, { message: "Nama operator spesialistik wajib." }),
  kode_tindakan_operatif: z.string()
    .min(1, { message: "Kode tindakan operatif wajib." })
    .regex(/^[0-9]+\.[0-9]{2}\.[0-9]{3}$/i, { message: "Gunakan format jenis.xx.xxx (contoh: 3.01.005)" }),
  nama_tindakan_operatif: z.string().min(1, { message: "Nama tindakan operatif wajib." }),
});

const TindakanOperatifFormTable: React.FC = () => {
  const [list, setList] = useState<TindakanOperatif[]>([]);
  const [filteredList, setFilteredList] = useState<TindakanOperatif[]>([]);
  const [editing, setEditing] = useState<TindakanOperatif | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [operatorFilter, setOperatorFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError } = useUploadProgress();
  // Use form operations hook
  const { loading: formLoading, saving, deleting, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Tindakan Operatif",
    onSuccess: () => {
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      kode_jenis: 3,
      kode_operator_spesialistik: "",
      nama_operator_spesialistik: "",
      kode_tindakan_operatif: "",
      nama_tindakan_operatif: "",
    },
  });

  useEffect(() => { fetchAll(); }, []);

  // Filter data based on operator and search term
  useEffect(() => {
    let filtered = list;
    
    // Filter by operator
    if (operatorFilter !== "all") {
      filtered = filtered.filter(item => item.nama_operator_spesialistik === operatorFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.nama_operator_spesialistik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_tindakan_operatif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kode_tindakan_operatif.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredList(filtered);
  }, [list, operatorFilter, searchTerm]);

  // Get unique operators for filter dropdown
  const uniqueOperators = Array.from(new Set(list.map(item => item.nama_operator_spesialistik))).sort();
  const operatorCount = React.useMemo(() => uniqueOperators.length, [uniqueOperators.length]);
  const tindakanCount = React.useMemo(() => list.length, [list.length]);

  useEffect(() => {
    if (editing) form.reset({
      kode_jenis: editing.kode_jenis,
      kode_operator_spesialistik: editing.kode_operator_spesialistik,
      nama_operator_spesialistik: editing.nama_operator_spesialistik,
      kode_tindakan_operatif: editing.kode_tindakan_operatif,
      nama_tindakan_operatif: editing.nama_tindakan_operatif,
    });
    else form.reset({
      kode_jenis: 3,
      kode_operator_spesialistik: "",
      nama_operator_spesialistik: "",
      kode_tindakan_operatif: "",
      nama_tindakan_operatif: "",
    });
  }, [editing, form]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tindakan_operatif")
      .select("id, kode_jenis, kode_operator_spesialistik, nama_operator_spesialistik, kode_tindakan_operatif, nama_tindakan_operatif, created_at, updated_at")
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
        // Use new signature: (operation, table, recordId, data)
        await safeCRUDOperation('UPDATE', 'tindakan_operatif', editing.id, {
          kode_jenis: values.kode_jenis,
          kode_operator_spesialistik: values.kode_operator_spesialistik,
          nama_operator_spesialistik: values.nama_operator_spesialistik,
          kode_tindakan_operatif: values.kode_tindakan_operatif,
          nama_tindakan_operatif: values.nama_tindakan_operatif,
        });
        toast.success("Data diperbarui.");
      } else {
        // Use new signature: (operation, table, undefined, data)
        await safeCRUDOperation('INSERT', 'tindakan_operatif', undefined, {
          kode_jenis: values.kode_jenis,
          kode_operator_spesialistik: values.kode_operator_spesialistik,
          nama_operator_spesialistik: values.nama_operator_spesialistik,
          kode_tindakan_operatif: values.kode_tindakan_operatif,
          nama_tindakan_operatif: values.nama_tindakan_operatif,
        });
        toast.success("Data ditambahkan.");
      }
      await fetchAll();
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      handleDatabaseError(err, editing ? "memperbarui" : "menyimpan");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Use new signature: (operation, table, recordId)
      await safeCRUDOperation('DELETE', 'tindakan_operatif', id);
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      handleDatabaseError(err, "menghapus");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Kode Jenis (1/2/3)",
      "Kode Operator Spesialistik (jenis.xx)",
      "Nama Operator Spesialistik",
      "Kode Tindakan Operatif (jenis.xx.xxx)",
      "Nama Tindakan Operatif",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Tindakan Operatif");
    XLSX.writeFile(wb, "template_tindakan_operatif.xlsx");
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
            const rows: Omit<TindakanOperatif, "id">[] = [];
            let missingCount = 0;
            
            for (const row of results.data) {
              const jenis = Number((row["Kode Jenis (1/2/3)"] || "3").toString().trim() || 3);
              const kodeOp = (row["Kode Operator Spesialistik (jenis.xx)"] || "").toString().trim();
              const namaOp = (row["Nama Operator Spesialistik"] || "").toString().trim();
              const kodeTind = (row["Kode Tindakan Operatif (jenis.xx.xxx)"] || "").toString().trim();
              const namaTind = (row["Nama Tindakan Operatif"] || "").toString().trim();
              
              // Count missing data
              if (!kodeOp || !namaOp || !kodeTind || !namaTind) {
                missingCount++;
                continue;
              }
              if (!kodeOp.match(/^[0-9]+\.[0-9]{2}$/)) {
                missingCount++;
                continue;
              }
              if (!kodeTind.match(/^[0-9]+\.[0-9]{2}\.[0-9]{3}$/)) {
                missingCount++;
                continue;
              }
              
              rows.push({ 
                kode_jenis: jenis,
                kode_operator_spesialistik: kodeOp,
                nama_operator_spesialistik: namaOp,
                kode_tindakan_operatif: kodeTind,
                nama_tindakan_operatif: namaTind,
              });
            }
            
            if (rows.length === 0) { 
              toast.warning("Tidak ada data valid untuk diimpor.");
              return; 
            }
            
            // Check for existing codes and handle duplicates
            const existingCodes = new Set(list.map(item => item.kode_tindakan_operatif));
            const newRows = rows.filter(row => !existingCodes.has(row.kode_tindakan_operatif));
            const duplicateCount = rows.length - newRows.length;
            
            if (newRows.length === 0) {
              toast.warning("Semua data sudah ada di database.");
              return;
            }
            
            // Start upload progress
            startUpload(newRows.length, 'Sedang mengimpor data tindakan operatif...');
            
            // Insert new rows one by one to handle individual errors
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];
            
            for (let i = 0; i < newRows.length; i++) {
              const row = newRows[i];
              try {
                const { error } = await supabase
                  .from("tindakan_operatif")
                  .insert([{
                    kode_jenis: row.kode_jenis,
                    kode_operator_spesialistik: row.kode_operator_spesialistik,
                    nama_operator_spesialistik: row.nama_operator_spesialistik,
                    kode_tindakan_operatif: row.kode_tindakan_operatif,
                    nama_tindakan_operatif: row.nama_tindakan_operatif,
                  }]);
                
                if (error) {
                  errorCount++;
                  errors.push(`${row.kode_tindakan_operatif}: ${error.message}`);
                } else {
                  successCount++;
                }
                
                // Update progress
                updateProgress(i + 1, successCount, errorCount, `Mengimpor data ${i + 1} dari ${newRows.length}...`);
                
              } catch (err: any) {
                errorCount++;
                errors.push(`${row.kode_tindakan_operatif}: ${err.message}`);
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
      "Kode Jenis": item.kode_jenis, 
      "Kode Operator Spesialistik": item.kode_operator_spesialistik,
      "Nama Operator Spesialistik": item.nama_operator_spesialistik,
      "Kode Tindakan Operatif": item.kode_tindakan_operatif, 
      "Nama Tindakan Operatif": item.nama_tindakan_operatif 
    }));
    if (data.length === 0) { toast.warning("Tidak ada data untuk laporan."); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Tindakan Operatif");
    XLSX.writeFile(wb, "laporan_tindakan_operatif.xlsx");
    toast.info("Laporan diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      {/* Upload Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />

      <div className="mb-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[220px]">
            <h2 className="text-2xl font-bold mb-1">Manajemen Tindakan Operatif</h2>
            <p className="text-sm text-muted-foreground">
              Kelola data prosedur operatif beserta operator spesialistik
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Card className={cn("border-none shadow-sm bg-violet-50 w-[160px]")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                  Dokter Operator
                </CardTitle>
                <div className="rounded-full bg-violet-100 text-violet-600 p-2 shadow-inner">
                  <Stethoscope className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-xl font-semibold text-violet-700">{operatorCount}</div>
                <p className="text-xs text-violet-500 font-medium">
                  Operator unik
                </p>
              </CardContent>
            </Card>

            <Card className={cn("border-none shadow-sm bg-rose-50 w-[160px]")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
                  Tindakan Operatif
                </CardTitle>
                <div className="rounded-full bg-rose-100 text-rose-600 p-2 shadow-inner">
                  <Activity className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-xl font-semibold text-rose-700">{tindakanCount}</div>
                <p className="text-xs text-rose-500 font-medium">
                  Prosedur tercatat
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input id="import-file-tindakan-operatif" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
          </label>
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="shadow-sm">
              Tambah Tindakan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Tindakan" : "Tambah Tindakan"}</DialogTitle>
              <DialogDescription>
                {editing ? "Perbarui detail tindakan operatif." : "Tambahkan tindakan operatif baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="kode_jenis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Jenis</FormLabel>
                        <FormControl>
                          <Input placeholder="Default 3 (Operatif)" type="number" min={1} max={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kode_operator_spesialistik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Operator Spesialistik</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: 3.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nama_operator_spesialistik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Operator Spesialistik</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Bedah Umum" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kode_tindakan_operatif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Tindakan Operatif</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: 3.01.005" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nama_tindakan_operatif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Tindakan Operatif</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Apendektomi" {...field} />
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

      {/* Filter Section */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Cari berdasarkan nama operator, tindakan, atau kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchTerm("")}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter Operator:</span>
          <Select value={operatorFilter} onValueChange={setOperatorFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Operator</SelectItem>
              {uniqueOperators.map((operator) => (
                <SelectItem key={operator} value={operator}>
                  {operator}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {operatorFilter !== "all" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOperatorFilter("all")}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex-1" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-700">
              <TableHead className="font-bold text-white">Kode Jenis</TableHead>
              <TableHead className="font-bold text-white">Kode Operator</TableHead>
              <TableHead className="font-bold text-white">Nama Operator</TableHead>
              <TableHead className="font-bold text-white">Kode Tindakan</TableHead>
              <TableHead className="font-bold text-white">Nama Tindakan</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Tidak ada data yang sesuai dengan filter.</TableCell></TableRow>
            ) : (
              filteredList.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.kode_jenis}</TableCell>
                  <TableCell>{item.kode_operator_spesialistik}</TableCell>
                  <TableCell>{item.nama_operator_spesialistik}</TableCell>
                  <TableCell>{item.kode_tindakan_operatif}</TableCell>
                  <TableCell>{item.nama_tindakan_operatif}</TableCell>
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

export default TindakanOperatifFormTable;


