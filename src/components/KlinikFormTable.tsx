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
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useReportDownload } from "@/components/report";

interface Klinik {
  kode_klinik: string;
  nama_klinik: string;
  Layanan_BPJS_Kes: boolean;
  Layanan_Umum_Asuransi: boolean;
}

const formSchema = z.object({
  nama_klinik: z.string().min(1, { message: "Nama klinik wajib." }),
  Layanan_BPJS_Kes: z.boolean(),
  Layanan_Umum_Asuransi: z.boolean(),
});

const KlinikFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [klinikList, setKlinikList] = useState<Klinik[]>([]);
  const [editing, setEditing] = useState<Klinik | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      nama_klinik: "",
      Layanan_BPJS_Kes: false,
      Layanan_Umum_Asuransi: false
    },
  });

  useEffect(() => { fetchKlinik(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ 
        nama_klinik: editing.nama_klinik,
        Layanan_BPJS_Kes: editing.Layanan_BPJS_Kes,
        Layanan_Umum_Asuransi: editing.Layanan_Umum_Asuransi
      });
    } else {
      form.reset({ 
        nama_klinik: "",
        Layanan_BPJS_Kes: false,
        Layanan_Umum_Asuransi: false
      });
    }
  }, [editing, form]);

  const fetchKlinik = async () => {
    setLoading(true);
    const { data, error } = await tenantSupabase
      .from("klinik")
      .select("kode_klinik, nama_klinik, Layanan_BPJS_Kes, Layanan_Umum_Asuransi")
      .order("kode_klinik", { ascending: true });
    if (error) {
      toast.error("Gagal memuat data klinik.");
      console.error(error);
      setKlinikList([]);
    } else {
      setKlinikList(data || []);
    }
    setLoading(false);
  };

  // Function to generate next kode klinik
  const generateNextKodeKlinik = async (): Promise<string> => {
    const { data, error } = await tenantSupabase
      .from("klinik")
      .select("kode_klinik")
      .order("kode_klinik", { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return "RJ.01";
    }
    
    const lastKode = data[0].kode_klinik;
    const lastNumber = parseInt(lastKode.split('.')[1]);
    const nextNumber = lastNumber + 1;
    return `RJ.${nextNumber.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editing) {
        const { error } = await tenantSupabase
          .from("klinik")
          .update({ 
            nama_klinik: values.nama_klinik,
            Layanan_BPJS_Kes: values.Layanan_BPJS_Kes,
            Layanan_Umum_Asuransi: values.Layanan_Umum_Asuransi
          })
          .eq("kode_klinik", editing.kode_klinik);
        if (error) throw error;
        toast.success("Data klinik diperbarui.");
      } else {
        const nextKode = await generateNextKodeKlinik();
        const { error } = await tenantSupabase
          .from("klinik")
          .insert([{ 
            kode_klinik: nextKode, 
            nama_klinik: values.nama_klinik,
            Layanan_BPJS_Kes: values.Layanan_BPJS_Kes,
            Layanan_Umum_Asuransi: values.Layanan_Umum_Asuransi
          }]);
        if (error) throw error;
        toast.success(`Data klinik ditambahkan dengan kode ${nextKode}.`);
      }
      await fetchKlinik();
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (kode_klinik: string) => {
    try {
      const { error } = await tenantSupabase.from("klinik").delete().eq("kode_klinik", kode_klinik);
      if (error) throw error;
      await fetchKlinik();
      toast.success("Data klinik dihapus.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Klinik", "Layanan BPJS Kes (true/false)", "Layanan Umum/Asuransi (true/false)"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Klinik");
    XLSX.writeFile(wb, "template_klinik.xlsx");
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
        startUpload(totalRows, "Sedang mengimpor data klinik...");

        const validRows: Omit<Klinik, "kode_klinik">[] = [];
        let missingCount = 0;

        for (const row of rawRows) {
          const namaRaw = pickFirst(row, ["Nama Klinik", "nama_klinik", "Nama_Klinik"]);
          const nama = (namaRaw ?? "").toString().trim();
          const layananBPJS = parseBool(pickFirst(row, ["Layanan BPJS Kes (true/false)", "Layanan_BPJS_Kes", "Layanan BPJS Kes"]));
          const layananUmum = parseBool(pickFirst(row, ["Layanan Umum/Asuransi (true/false)", "Layanan_Umum_Asuransi", "Layanan Umum/Asuransi"]));

          if (!nama) {
            missingCount++;
            continue;
          }

          validRows.push({
            nama_klinik: nama,
            Layanan_BPJS_Kes: layananBPJS,
            Layanan_Umum_Asuransi: layananUmum,
          });
        }

        if (validRows.length === 0) {
          showUploadError("Tidak ada data valid untuk diimpor.");
          return;
        }

        // Ambil kode terakhir sekali, lalu generate semua kode secara sequential
        const { data: lastData } = await tenantSupabase
          .from("klinik")
          .select("kode_klinik")
          .order("kode_klinik", { ascending: false })
          .limit(1);

        const lastNumber = lastData?.[0]?.kode_klinik
          ? parseInt((lastData[0].kode_klinik as string).split('.')[1] || "0")
          : 0;

        // Bangun array insert dengan kode yang unik
        const insertData = validRows.map((row, idx) => {
          const num = (isNaN(lastNumber) ? 0 : lastNumber) + idx + 1;
          return {
            kode_klinik: `RJ.${num.toString().padStart(2, '0')}`,
            nama_klinik: row.nama_klinik,
            Layanan_BPJS_Kes: row.Layanan_BPJS_Kes,
            Layanan_Umum_Asuransi: row.Layanan_Umum_Asuransi,
          };
        });

        updateProgress(totalRows, 0, 0, `Menyimpan ${insertData.length} data klinik...`);

        // Batch insert sekaligus
        const { error } = await tenantSupabase.from("klinik").insert(insertData);

        let successCount = 0;
        let errorCount = 0;

        if (error) {
          console.error("Batch insert error:", error);
          // Fallback: insert satu per satu untuk mendapatkan detail error
          for (let i = 0; i < insertData.length; i++) {
            const { error: rowError } = await tenantSupabase.from("klinik").insert([insertData[i]]);
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
        await fetchKlinik();
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
    if (klinikList.length === 0) {
      toast.warning("Tidak ada data untuk laporan.");
      return;
    }
    const dataToExport = klinikList.map((k) => ({ 
      "Kode Klinik": k.kode_klinik, 
      "Nama Klinik": k.nama_klinik,
      "Layanan BPJS Kes": k.Layanan_BPJS_Kes ? "Ya" : "Tidak",
      "Layanan Umum/Asuransi": k.Layanan_Umum_Asuransi ? "Ya" : "Tidak"
    }));
    await downloadReport({
      title: "Laporan Klinik",
      subtitle: "Daftar layanan klinik",
      filename: "laporan_klinik",
      records: dataToExport,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Klinik</h2>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Button onClick={handleDownloadTemplate} variant="template" className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <Button variant="import" className="shadow-sm" asChild>
          <label className="flex cursor-pointer items-center gap-2">
            <Upload className="h-4 w-4" /> Impor Data
            <Input id="import-file-klinik" type="file" accept=".csv,.xlsx,.xls" onChange={handleImportData} className="sr-only" />
          </label>
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="shadow-sm">
              Tambah Data Klinik
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Data Klinik" : "Tambah Data Klinik"}</DialogTitle>
              <DialogDescription>
                {editing ? "Perbarui detail klinik." : "Tambahkan klinik baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="nama_klinik"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Klinik</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Poli Umum" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Jenis Layanan</h4>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="Layanan_BPJS_Kes"
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
                            <FormLabel>BPJS Kesehatan</FormLabel>
                            <p className="text-xs text-muted-foreground">Klinik melayani pasien BPJS Kesehatan</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Layanan_Umum_Asuransi"
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
                            <FormLabel>Umum/Asuransi</FormLabel>
                            <p className="text-xs text-muted-foreground">Klinik melayani pasien umum dan asuransi</p>
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
        <Button onClick={() => { void handleDownloadReport(); }} variant="report" className="shadow-sm">
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
        <Button onClick={() => fetchKlinik()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Kode Klinik</TableHead>
              <TableHead className="font-bold text-white">Nama Klinik</TableHead>
              <TableHead className="font-bold text-white">Layanan BPJS Kes</TableHead>
              <TableHead className="font-bold text-white">Layanan Umum/Asuransi</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Memuat data...</TableCell>
              </TableRow>
            ) : klinikList.length > 0 ? (
              klinikList.map((row) => (
                <TableRow key={row.kode_klinik}>
                  <TableCell className="font-medium">{row.kode_klinik}</TableCell>
                  <TableCell>{row.nama_klinik}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      row.Layanan_BPJS_Kes 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {row.Layanan_BPJS_Kes ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      row.Layanan_Umum_Asuransi 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {row.Layanan_Umum_Asuransi ? '✓' : '✗'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="edit" size="icon" onClick={() => { setEditing(row); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(row.kode_klinik)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Tidak ada data klinik.</TableCell>
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

export default KlinikFormTable;
