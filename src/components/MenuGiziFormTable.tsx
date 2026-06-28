"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
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
  id: string;
  kode: string;
  jenis_makanan: string;
  kelas: string;
}

const formSchema = z.object({
  kode: z.string().min(1, { message: "Kode menu wajib." }),
  jenis_makanan: z.string().min(1, { message: "Jenis makanan wajib." }),
  kelas: z.string().min(1, { message: "Kelas wajib." }),
});

type FormValues = z.infer<typeof formSchema>;

const MenuGiziFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [list, setList] = useState<MenuGizi[]>([]);
  const [editing, setEditing] = useState<MenuGizi | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError, hideProgress } = useUploadProgress();
  const [isImporting, setIsImporting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { kode: "", jenis_makanan: "", kelas: "" },
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ kode: editing.kode, jenis_makanan: editing.jenis_makanan, kelas: editing.kelas });
    } else {
      form.reset({ kode: "", jenis_makanan: "", kelas: "" });
    }
  }, [editing, form]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await tenantSupabase
      .from("menu_gizi")
      .select("id, kode, jenis_makanan, kelas")
      .order("kode", { ascending: true });
    if (error) { toast.error("Gagal memuat data."); console.error(error); setList([]); }
    else setList((data as MenuGizi[]) || []);
    setLoading(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        const { error } = await tenantSupabase
          .from("menu_gizi")
          .update({ kode: values.kode, jenis_makanan: values.jenis_makanan, kelas: values.kelas })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Data diperbarui.");
      } else {
        const { error } = await tenantSupabase
          .from("menu_gizi")
          .insert([{ kode: values.kode, jenis_makanan: values.jenis_makanan, kelas: values.kelas }]);
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

  const handleDelete = async (id: string) => {
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
    const headers = ["Kode", "Jenis Makanan", "Kelas"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Menu Gizi");
    XLSX.writeFile(wb, "template_menu_gizi.xlsx");
    toast.info("Template impor diunduh.");
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isImporting) return;
    event.target.value = "";

    const pickFirst = (row: any, keys: string[]) => {
      for (const key of keys) {
        const value = row?.[key];
        if (value === undefined || value === null) continue;
        const s = value.toString().trim();
        if (s !== "") return s;
      }
      // Fallback case-insensitive
      const rowKeys = Object.keys(row || {});
      for (const key of keys) {
        const found = rowKeys.find(k => k.trim().toLowerCase() === key.toLowerCase());
        if (found) {
          const value = row[found];
          const s = (value ?? "").toString().trim();
          if (s !== "") return s;
        }
      }
      return "";
    };

    // Mengikuti pola KlinikFormTable yang terbukti bekerja
    const parseXlsxToObjects = async (xlsxFile: File): Promise<any[]> => {
      const buffer = await xlsxFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      if (!rows || rows.length < 2) return [];
      const headers = (rows[0] || []).map((h) => (h ?? "").toString().trim());
      console.log("[MenuGizi Import] Header Excel:", headers);
      return rows
        .slice(1)
        .filter((r) => (r || []).some((cell) => (cell ?? "").toString().trim() !== ""))
        .map((r) => {
          const obj: any = {};
          headers.forEach((h, idx) => { if (h) obj[h] = r?.[idx]; });
          return obj;
        });
    };

    const processRows = async (rawRows: any[]) => {
      if (isImporting) return;
      setIsImporting(true);
      try {
        const totalRows = rawRows.length;
        if (totalRows === 0) { setIsImporting(false); showUploadError("File kosong atau tidak ada data valid."); return; }

        startUpload(totalRows, "Sedang mengimpor data menu gizi...");

        if (rawRows[0]) {
          console.log("[MenuGizi Import] Kolom tersedia:", Object.keys(rawRows[0]));
          console.log("[MenuGizi Import] Baris pertama:", rawRows[0]);
        }

        // Kumpulkan semua baris valid dulu
        const validRows: Array<{ kode: string; jenis_makanan: string; kelas: string }> = [];
        let missingCount = 0;

        for (const row of rawRows) {
          // Coba semua variasi header yang mungkin dipakai user
          const jenisMakanan = pickFirst(row, [
            "Jenis Makanan", "jenis_makanan", "Jenis_Makanan",
            "Nama Makanan", "nama_makanan", "Nama_Makanan",
            "Nama", "nama",
          ]);

          const kode = pickFirst(row, [
            "Kode", "kode", "KODE",
            "Kode Makanan", "kode_makanan",
          ]);

          const kelas = pickFirst(row, [
            "Kelas", "kelas", "KELAS",
          ]);

          if (!jenisMakanan) {
            missingCount++;
            continue;
          }

          validRows.push({
            kode: kode || jenisMakanan.slice(0, 20),
            jenis_makanan: jenisMakanan,
            kelas: kelas || "",
          });
        }

        if (validRows.length === 0) {
          setIsImporting(false);
          showUploadError("Tidak ada data valid untuk diimpor. Pastikan file memiliki kolom 'Jenis Makanan' atau 'Nama Makanan'.");
          return;
        }

        updateProgress(totalRows, 0, 0, `Menyimpan ${validRows.length} data menu gizi...`);

        // Batch insert sekaligus
        const { error } = await tenantSupabase.from("menu_gizi").insert(validRows);

        let successCount = 0;
        let errorCount = 0;

        if (error) {
          console.error("[MenuGizi Import] Batch insert error:", error);
          // Fallback: insert satu per satu
          for (let i = 0; i < validRows.length; i++) {
            const { error: rowError } = await tenantSupabase.from("menu_gizi").insert([validRows[i]]);
            if (rowError) {
              errorCount++;
              console.error(`[MenuGizi Import] Error baris ${i + 1}:`, rowError.message);
            } else {
              successCount++;
            }
            updateProgress(totalRows, successCount, errorCount, `Mengimpor data ${i + 1} dari ${validRows.length}...`);
          }
        } else {
          successCount = validRows.length;
          updateProgress(totalRows, successCount, 0);
        }

        completeUpload(successCount, errorCount, missingCount);
        await fetchAll();
      } catch (err: any) {
        console.error(err);
        showUploadError(`Gagal mengimpor data: ${err.message}`);
      } finally {
        setIsImporting(false);
      }
    };

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      parseXlsxToObjects(file)
        .then(processRows)
        .catch((err: any) => showUploadError(`Gagal membaca file Excel: ${err.message}`));
      return;
    }

    file.text().then((text) => {
      (Papa as any).parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => { await processRows(results.data || []); },
        error: (error: Papa.ParseError) => { showUploadError(`Gagal membaca file CSV: ${error.message}`); },
      });
    });
  };

  const handleDownloadReport = async () => {
    if (list.length === 0) { toast.warning("Tidak ada data untuk laporan."); return; }
    try {
      const records = list.map((item, index) => ({
        No: index + 1,
        "Kode": item.kode,
        "Jenis Makanan": item.jenis_makanan,
        "Kelas": item.kelas,
      }));
      await downloadReport({ title: "Laporan Menu Gizi", filename: "laporan_menu_gizi", records });
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
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportData} className="sr-only" />
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
                <FormField control={form.control} name="kode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode</FormLabel>
                    <FormControl><Input placeholder="Contoh: MG001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="jenis_makanan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Makanan</FormLabel>
                    <FormControl><Input placeholder="Contoh: Nasi Putih" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="kelas" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas</FormLabel>
                    <FormControl><Input placeholder="Contoh: VIP" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
        <Button onClick={() => fetchAll()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Kode</TableHead>
              <TableHead className="font-bold text-white">Jenis Makanan</TableHead>
              <TableHead className="font-bold text-white">Kelas</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : list.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Belum ada data.</TableCell></TableRow>
            ) : (
              list.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.kode}</TableCell>
                  <TableCell>{item.jenis_makanan}</TableCell>
                  <TableCell>{item.kelas}</TableCell>
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

      <ImportProgressModal progress={uploadProgress} onClose={hideProgress} />
    </div>
  );
};

export default MenuGiziFormTable;
