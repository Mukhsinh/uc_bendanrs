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
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useReportDownload } from "@/components/report";

interface DataKamar {
  id: string;           // uuid di database
  kode_kamar: string;   // lowercase di database
  nama_kamar: string;   // lowercase di database
  Kelas_SVIP: boolean;
  Kelas_VIP: boolean;
  Kelas_I: boolean;     // text di DB, dikonversi ke boolean saat baca
  Kelas_II: boolean;
  Kelas_III: boolean;
  Kelas_Khusus: boolean;
}

const formSchema = z.object({
  Nama_Kamar: z.string().min(1, { message: "Nama kamar wajib." }),
  Kelas_SVIP: z.boolean(),
  Kelas_VIP: z.boolean(),
  Kelas_I: z.boolean(),
  Kelas_II: z.boolean(),
  Kelas_III: z.boolean(),
  Kelas_Khusus: z.boolean(),
});

const DataKamarFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [list, setList] = useState<DataKamar[]>([]);
  const [editing, setEditing] = useState<DataKamar | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      Nama_Kamar: "", 
      Kelas_SVIP: false,
      Kelas_VIP: false,
      Kelas_I: false,
      Kelas_II: false,
      Kelas_III: false,
      Kelas_Khusus: false
    },
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ 
        Nama_Kamar: editing.nama_kamar, 
        Kelas_SVIP: editing.Kelas_SVIP,
        Kelas_VIP: editing.Kelas_VIP,
        Kelas_I: editing.Kelas_I,
        Kelas_II: editing.Kelas_II,
        Kelas_III: editing.Kelas_III,
        Kelas_Khusus: editing.Kelas_Khusus
      });
    } else {
      form.reset({ 
        Nama_Kamar: "", 
        Kelas_SVIP: false,
        Kelas_VIP: false,
        Kelas_I: false,
        Kelas_II: false,
        Kelas_III: false,
        Kelas_Khusus: false
      });
    }
  }, [editing, form]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await tenantSupabase
      .from("Data_Kamar")
      .select("id, kode_kamar, nama_kamar, Kelas_SVIP, Kelas_VIP, Kelas_I, Kelas_II, Kelas_III, Kelas_Khusus")
      .order("kode_kamar", { ascending: true });
    if (error) { toast.error("Gagal memuat data."); console.error(error); setList([]); }
    else {
      // Normalisasi Kelas_I dari text ke boolean
      const normalized = (data || []).map((row: any) => ({
        ...row,
        Kelas_I: row.Kelas_I === true || row.Kelas_I === "true" || row.Kelas_I === "1",
      }));
      setList(normalized);
    }
    setLoading(false);
  };

  // Generate kode kamar berikutnya
  const generateNextKodeKamar = async (): Promise<string> => {
    const { data, error } = await tenantSupabase
      .from("Data_Kamar")
      .select("kode_kamar")
      .order("kode_kamar", { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return "RI.01";
    }
    
    const lastKode = data[0].kode_kamar as string;
    const parts = lastKode?.split('.');
    const lastNumber = parts && parts[1] ? parseInt(parts[1]) : 0;
    const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
    return `RI.${nextNumber.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editing) {
        const { error } = await tenantSupabase
          .from("Data_Kamar")
          .update({ 
            nama_kamar: values.Nama_Kamar, 
            Kelas_SVIP: values.Kelas_SVIP,
            Kelas_VIP: values.Kelas_VIP,
            Kelas_I: values.Kelas_I ? "true" : "false", // text di DB
            Kelas_II: values.Kelas_II,
            Kelas_III: values.Kelas_III,
            Kelas_Khusus: values.Kelas_Khusus
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Data diperbarui.");
      } else {
        const nextKode = await generateNextKodeKamar();
        const { error } = await tenantSupabase
          .from("Data_Kamar")
          .insert([{ 
            kode_kamar: nextKode, 
            nama_kamar: values.Nama_Kamar, 
            Kelas_SVIP: values.Kelas_SVIP,
            Kelas_VIP: values.Kelas_VIP,
            Kelas_I: values.Kelas_I ? "true" : "false", // text di DB
            Kelas_II: values.Kelas_II,
            Kelas_III: values.Kelas_III,
            Kelas_Khusus: values.Kelas_Khusus
          }]);
        if (error) throw error;
        toast.success(`Data ditambahkan dengan kode ${nextKode}.`);
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
    try {
      const { error } = await tenantSupabase.from("Data_Kamar").delete().eq("id", id);
      if (error) throw error;
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Kamar", "Kelas SVIP (true/false)", "Kelas VIP (true/false)", "Kelas I (true/false)", "Kelas II (true/false)", "Kelas III (true/false)", "Kelas Khusus (true/false)"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Data Kamar");
    XLSX.writeFile(wb, "template_data_kamar.xlsx");
    toast.info("Template impor diunduh.");
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset file input
    event.target.value = '';
    
    const pickFirst = (row: any, keys: string[]) => {
      for (const key of keys) {
        const value = row?.[key];
        if (value === undefined || value === null) continue;
        const asString = value.toString().trim();
        if (asString !== "") return value;
      }
      return undefined;
    };

    const parseBool = (value: any): boolean => {
      if (value === true) return true;
      if (value === false) return false;
      const v = (value ?? "").toString().trim().toLowerCase();
      if (["true", "1", "ya", "y", "yes"].includes(v)) return true;
      if (["false", "0", "tidak", "t", "no"].includes(v)) return false;
      return false;
    };

    const parseXlsxToObjects = async (xlsxFile: File): Promise<any[]> => {
      const buffer = await xlsxFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      if (!rows || rows.length < 2) return [];
      const headers = (rows[0] || []).map((h) => (h ?? "").toString().trim());
      return rows
        .slice(1)
        .filter((r) => (r || []).some((cell) => (cell ?? "").toString().trim() !== ""))
        .map((r) => {
          const obj: any = {};
          headers.forEach((h, idx) => {
            if (!h) return;
            obj[h] = r?.[idx];
          });
          return obj;
        });
    };

    const processRows = async (rawRows: any[]) => {
      try {
        const totalRows = rawRows.length;
        startUpload(totalRows, "Sedang mengimpor data kamar...");

        const validRows: Omit<DataKamar, "id" | "kode_kamar">[] = [];
        let missingCount = 0;

        for (const row of rawRows) {
          const namaRaw = pickFirst(row, ["Nama Kamar", "Nama_Kamar", "Nama_Kamar "]);
          const nama = (namaRaw ?? "").toString().trim();

          const kelasSVIP = parseBool(pickFirst(row, ["Kelas SVIP (true/false)", "Kelas_SVIP", "Kelas SVIP"]));
          const kelasVIP = parseBool(pickFirst(row, ["Kelas VIP (true/false)", "Kelas_VIP", "Kelas VIP"]));
          const kelasI = parseBool(pickFirst(row, ["Kelas I (true/false)", "Kelas_I", "Kelas I"]));
          const kelasII = parseBool(pickFirst(row, ["Kelas II (true/false)", "Kelas_II", "Kelas II"]));
          const kelasIII = parseBool(pickFirst(row, ["Kelas III (true/false)", "Kelas_III", "Kelas III"]));
          const kelasKhusus = parseBool(pickFirst(row, ["Kelas Khusus (true/false)", "Kelas_Khusus", "Kelas Khusus"]));

          if (!nama) {
            missingCount++;
            continue;
          }

          validRows.push({
            nama_kamar: nama,
            Kelas_SVIP: kelasSVIP,
            Kelas_VIP: kelasVIP,
            Kelas_I: kelasI,
            Kelas_II: kelasII,
            Kelas_III: kelasIII,
            Kelas_Khusus: kelasKhusus,
          });
        }

        if (validRows.length === 0) {
          showUploadError("Tidak ada data valid untuk diimpor.");
          return;
        }

        // Ambil kode terakhir sekali, lalu generate semua kode secara sequential
        const { data: lastData } = await tenantSupabase
          .from("Data_Kamar")
          .select("kode_kamar")
          .order("kode_kamar", { ascending: false })
          .limit(1);

        const lastKode = lastData?.[0]?.kode_kamar as string | undefined;
        const lastNumber = lastKode
          ? parseInt(lastKode.split('.')[1] || "0")
          : 0;

        const insertData = validRows.map((row, idx) => {
          const num = (isNaN(lastNumber) ? 0 : lastNumber) + idx + 1;
          return {
            kode_kamar: `RI.${num.toString().padStart(2, '0')}`,
            nama_kamar: row.nama_kamar,
            Kelas_SVIP: row.Kelas_SVIP,
            Kelas_VIP: row.Kelas_VIP,
            Kelas_I: row.Kelas_I ? "true" : "false",
            Kelas_II: row.Kelas_II,
            Kelas_III: row.Kelas_III,
            Kelas_Khusus: row.Kelas_Khusus,
          };
        });

        updateProgress(totalRows, 0, 0, `Menyimpan ${insertData.length} data kamar...`);

        const { error } = await tenantSupabase.from("Data_Kamar").insert(insertData);

        let successCount = 0;
        let errorCount = 0;

        if (error) {
          console.error("Batch insert error:", error);
          // Fallback: insert satu per satu
          for (let i = 0; i < insertData.length; i++) {
            const { error: rowError } = await tenantSupabase.from("Data_Kamar").insert([insertData[i]]);
            if (rowError) {
              errorCount++;
              console.error(`Error pada baris ${i + 1}:`, rowError);
            } else {
              successCount++;
            }
            updateProgress(totalRows, successCount, errorCount, `Mengimpor data ${i + 1} dari ${insertData.length}...`);
          }
        } else {
          successCount = insertData.length;
          updateProgress(totalRows, successCount, errorCount);
        }

        completeUpload(successCount, errorCount, missingCount);
        await fetchAll();
      } catch (err: any) {
        console.error(err);
        showUploadError(`Gagal mengimpor data: ${err.message}`);
      }
    };

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      parseXlsxToObjects(file).then(processRows).catch((err: any) => showUploadError(`Gagal membaca file Excel: ${err.message}`));
      return;
    }

    file.text().then((text) => {
      (Papa as any).parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          await processRows(results.data || []);
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
        "Kode Kamar": item.kode_kamar,
        "Nama Kamar": item.nama_kamar,
        "Kelas SVIP": item.Kelas_SVIP ? "Ya" : "Tidak",
        "Kelas VIP": item.Kelas_VIP ? "Ya" : "Tidak",
        "Kelas I": item.Kelas_I ? "Ya" : "Tidak",
        "Kelas II": item.Kelas_II ? "Ya" : "Tidak",
        "Kelas III": item.Kelas_III ? "Ya" : "Tidak",
        "Kelas Khusus": item.Kelas_Khusus ? "Ya" : "Tidak",
      }));

      await downloadReport({
        title: "Laporan Data Kamar",
        filename: "laporan_data_kamar",
        records,
        orientation: "landscape",
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan data kamar:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Kamar</h2>
        <div className="flex gap-2">
          <Button onClick={() => fetchAll()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportData} className="sr-only" />
          </label>
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="shadow-sm">
              Tambah Data Kamar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Data Kamar" : "Tambah Data Kamar"}</DialogTitle>
              <DialogDescription>
                {editing ? "Perbarui detail kamar." : "Tambahkan data kamar baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="Nama_Kamar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Kamar</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Kamar Mawar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Ketersediaan Kelas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="Kelas_SVIP"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Kelas SVIP</FormLabel>
                            <p className="text-xs text-muted-foreground">Kode: kode_kamar.SVIP</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Kelas_VIP"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Kelas VIP</FormLabel>
                            <p className="text-xs text-muted-foreground">Kode: kode_kamar.VIP</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Kelas_I"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Kelas I</FormLabel>
                            <p className="text-xs text-muted-foreground">Kode: kode_kamar.1</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Kelas_II"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Kelas II</FormLabel>
                            <p className="text-xs text-muted-foreground">Kode: kode_kamar.2</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Kelas_III"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Kelas III</FormLabel>
                            <p className="text-xs text-muted-foreground">Kode: kode_kamar.3</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Kelas_Khusus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Kelas Khusus</FormLabel>
                            <p className="text-xs text-muted-foreground">Kode: kode_kamar.4</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

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
      </div>


      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Kode & Nama Kamar</TableHead>
              <TableHead className="font-bold text-white">Kelas SVIP</TableHead>
              <TableHead className="font-bold text-white">Kelas VIP</TableHead>
              <TableHead className="font-bold text-white">Kelas I</TableHead>
              <TableHead className="font-bold text-white">Kelas II</TableHead>
              <TableHead className="font-bold text-white">Kelas III</TableHead>
              <TableHead className="font-bold text-white">Kelas Khusus</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : (
              list.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{item.kode_kamar}</div>
                      <div className="text-sm text-muted-foreground">{item.nama_kamar}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.Kelas_SVIP 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.Kelas_SVIP ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.Kelas_VIP 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.Kelas_VIP ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.Kelas_I 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.Kelas_I ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.Kelas_II 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.Kelas_II ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.Kelas_III 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.Kelas_III ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.Kelas_Khusus 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.Kelas_Khusus ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="edit" size="icon" onClick={() => { setEditing(item); setIsDialogOpen(true); }}>
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

export default DataKamarFormTable;
