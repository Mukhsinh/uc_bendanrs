"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";
import { useYear } from "@/contexts/YearContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useReportDownload } from "@/components/report";
import YearFilter from "@/components/ui/YearFilter";

interface Klinik {
  id: string;
  kode_klinik: string;
  nama_klinik: string;
  Layanan_BPJS_Kes: boolean;
  Layanan_Umum_Asuransi: boolean;
  tahun: number;
}

const formSchema = z.object({
  nama_klinik: z.string().min(1, { message: "Nama klinik wajib." }),
  Layanan_BPJS_Kes: z.boolean(),
  Layanan_Umum_Asuransi: z.boolean(),
});

const KlinikFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const { selectedYear } = useYear();
  const [klinikList, setKlinikList] = useState<Klinik[]>([]);
  const [editing, setEditing] = useState<Klinik | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nama_klinik: "", Layanan_BPJS_Kes: false, Layanan_Umum_Asuransi: false },
  });

  useEffect(() => { fetchKlinik(); }, [selectedYear]);

  useEffect(() => {
    if (editing) {
      form.reset({ nama_klinik: editing.nama_klinik, Layanan_BPJS_Kes: editing.Layanan_BPJS_Kes, Layanan_Umum_Asuransi: editing.Layanan_Umum_Asuransi });
    } else {
      form.reset({ nama_klinik: "", Layanan_BPJS_Kes: false, Layanan_Umum_Asuransi: false });
    }
  }, [editing, form]);

  const fetchKlinik = async () => {
    setLoading(true);
    const { data, error } = await tenantSupabase
      .from("klinik")
      .select("id, kode_klinik, nama_klinik, Layanan_BPJS_Kes, Layanan_Umum_Asuransi, tahun")
      .eq("tahun", selectedYear)
      .order("kode_klinik", { ascending: true });
    if (error) { toast.error("Gagal memuat data klinik."); console.error(error); setKlinikList([]); }
    else { setKlinikList((data || []).map((row: any) => ({ ...row, tahun: row.tahun ?? selectedYear }))); }
    setLoading(false);
  };

  const generateNextKodeKlinik = async (): Promise<string> => {
    const { data, error } = await tenantSupabase
      .from("klinik").select("kode_klinik")
      .eq("tahun", selectedYear)
      .order("kode_klinik", { ascending: false }).limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return "RJ.01";
    const lastNumber = parseInt((data[0].kode_klinik as string).split(".")[1] || "0");
    return `RJ.${(lastNumber + 1).toString().padStart(2, "0")}`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editing) {
        const { error } = await tenantSupabase.from("klinik")
          .update({ nama_klinik: values.nama_klinik, Layanan_BPJS_Kes: values.Layanan_BPJS_Kes, Layanan_Umum_Asuransi: values.Layanan_Umum_Asuransi })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Data klinik diperbarui.");
      } else {
        const nextKode = await generateNextKodeKlinik();
        const { error } = await tenantSupabase.from("klinik")
          .insert([{ kode_klinik: nextKode, nama_klinik: values.nama_klinik, Layanan_BPJS_Kes: values.Layanan_BPJS_Kes, Layanan_Umum_Asuransi: values.Layanan_Umum_Asuransi, tahun: selectedYear }]);
        if (error) throw error;
        toast.success(`Data klinik ditambahkan dengan kode ${nextKode}.`);
      }
      await fetchKlinik();
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await tenantSupabase.from("klinik").delete().eq("id", id);
      if (error) throw error;
      await fetchKlinik();
      toast.success("Data klinik dihapus.");
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Klinik", "Layanan BPJS Kes (true/false)", "Layanan Umum/Asuransi (true/false)", "Tahun"];
    const ws = XLSX.utils.aoa_to_sheet([headers, ["Poli Umum", "true", "true", selectedYear]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Klinik");
    XLSX.writeFile(wb, `template_klinik_${selectedYear}.xlsx`);
    toast.info("Template impor diunduh.");
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const pickFirst = (row: any, keys: string[]) => {
      for (const key of keys) {
        const value = row?.[key];
        if (value !== undefined && value !== null && value.toString().trim() !== "") return value;
      }
      return undefined;
    };
    const parseBool = (value: any): boolean => {
      if (value === true) return true;
      if (value === false) return false;
      return ["true", "1", "ya", "y", "yes"].includes((value ?? "").toString().trim().toLowerCase());
    };
    const parseXlsxToObjects = async (xlsxFile: File): Promise<any[]> => {
      const buffer = await xlsxFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      if (!rows || rows.length < 2) return [];
      const headers = (rows[0] || []).map((h) => (h ?? "").toString().trim());
      return rows.slice(1).filter((r) => (r || []).some((c) => (c ?? "").toString().trim() !== ""))
        .map((r) => { const obj: any = {}; headers.forEach((h, i) => { if (h) obj[h] = r?.[i]; }); return obj; });
    };
    const processRows = async (rawRows: any[]) => {
      try {
        startUpload(rawRows.length, "Sedang mengimpor data klinik...");
        const validRows: any[] = [];
        let missingCount = 0;
        for (const row of rawRows) {
          const nama = (pickFirst(row, ["Nama Klinik", "nama_klinik"]) ?? "").toString().trim();
          if (!nama) { missingCount++; continue; }
          const tahunRaw = pickFirst(row, ["Tahun", "tahun"]);
          const tahunVal = tahunRaw ? parseInt(tahunRaw.toString()) : selectedYear;
          validRows.push({
            nama_klinik: nama,
            Layanan_BPJS_Kes: parseBool(pickFirst(row, ["Layanan BPJS Kes (true/false)", "Layanan_BPJS_Kes"])),
            Layanan_Umum_Asuransi: parseBool(pickFirst(row, ["Layanan Umum/Asuransi (true/false)", "Layanan_Umum_Asuransi"])),
            tahun: isNaN(tahunVal) ? selectedYear : tahunVal,
          });
        }
        if (validRows.length === 0) { showUploadError("Tidak ada data valid."); return; }
        const { data: lastData } = await tenantSupabase.from("klinik").select("kode_klinik")
          .eq("tahun", selectedYear).order("kode_klinik", { ascending: false }).limit(1);
        const lastNumber = lastData?.[0]?.kode_klinik ? parseInt((lastData[0].kode_klinik as string).split(".")[1] || "0") : 0;
        const insertData = validRows.map((row, idx) => ({
          ...row, kode_klinik: `RJ.${((isNaN(lastNumber) ? 0 : lastNumber) + idx + 1).toString().padStart(2, "0")}`,
        }));
        updateProgress(rawRows.length, 0, 0, `Menyimpan ${insertData.length} data klinik...`);
        const { error } = await tenantSupabase.from("klinik").insert(insertData);
        let successCount = 0, errorCount = 0;
        if (error) {
          for (let i = 0; i < insertData.length; i++) {
            const { error: e } = await tenantSupabase.from("klinik").insert([insertData[i]]);
            if (e) errorCount++; else successCount++;
            updateProgress(rawRows.length, successCount, errorCount, `Mengimpor ${i + 1} dari ${insertData.length}...`);
          }
        } else { successCount = insertData.length; updateProgress(rawRows.length, successCount, 0); }
        completeUpload(successCount, errorCount, missingCount);
        await fetchKlinik();
      } catch (err: any) { showUploadError(`Gagal mengimpor: ${err.message}`); }
    };
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      parseXlsxToObjects(file).then(processRows).catch((e: any) => showUploadError(e.message));
      return;
    }
    file.text().then((text) => {
      (Papa as any).parse(text, { header: true, skipEmptyLines: true,
        complete: async (r: Papa.ParseResult<any>) => { await processRows(r.data || []); },
        error: (e: Papa.ParseError) => { showUploadError(`Gagal membaca CSV: ${e.message}`); },
      });
    });
  };

  const handleDownloadReport = async () => {
    if (klinikList.length === 0) { toast.warning("Tidak ada data untuk laporan."); return; }
    await downloadReport({
      title: `Laporan Klinik Tahun ${selectedYear}`, subtitle: "Daftar layanan klinik",
      filename: `laporan_klinik_${selectedYear}`,
      records: klinikList.map((k) => ({
        "Kode Klinik": k.kode_klinik, "Nama Klinik": k.nama_klinik, "Tahun": k.tahun,
        "Layanan BPJS Kes": k.Layanan_BPJS_Kes ? "Ya" : "Tidak",
        "Layanan Umum/Asuransi": k.Layanan_Umum_Asuransi ? "Ya" : "Tidak",
      })),
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Klinik</h2>
        <div className="flex items-center gap-2">
          <YearFilter />
          <Button onClick={() => fetchKlinik()} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
        </div>
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
            <Button onClick={() => setEditing(null)} className="shadow-sm">Tambah Data Klinik</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Data Klinik" : `Tambah Data Klinik (${selectedYear})`}</DialogTitle>
              <DialogDescription>{editing ? "Perbarui detail klinik." : "Tambahkan klinik baru."}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField control={form.control} name="nama_klinik" render={({ field }) => (
                  <FormItem><FormLabel>Nama Klinik</FormLabel><FormControl><Input placeholder="Contoh: Poli Umum" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Jenis Layanan</h4>
                  <FormField control={form.control} name="Layanan_BPJS_Kes" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="mt-1" /></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>BPJS Kesehatan</FormLabel>
                        <p className="text-xs text-muted-foreground">Klinik melayani pasien BPJS Kesehatan</p>
                      </div>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="Layanan_Umum_Asuransi" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="mt-1" /></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Umum/Asuransi</FormLabel>
                        <p className="text-xs text-muted-foreground">Klinik melayani pasien umum dan asuransi</p>
                      </div>
                    </FormItem>
                  )} />
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
      </div>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Kode Klinik</TableHead>
              <TableHead className="font-bold text-white">Nama Klinik</TableHead>
              <TableHead className="font-bold text-white">Tahun</TableHead>
              <TableHead className="font-bold text-white">BPJS Kes</TableHead>
              <TableHead className="font-bold text-white">Umum/Asuransi</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : klinikList.length > 0 ? (
              klinikList.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.kode_klinik}</TableCell>
                  <TableCell>{row.nama_klinik}</TableCell>
                  <TableCell>{row.tahun}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.Layanan_BPJS_Kes ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {row.Layanan_BPJS_Kes ? "Ya" : "Tidak"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.Layanan_Umum_Asuransi ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {row.Layanan_Umum_Asuransi ? "Ya" : "Tidak"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="edit" size="icon" onClick={() => { setEditing(row); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(row.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Tidak ada data klinik untuk tahun {selectedYear}.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <ImportProgressModal progress={uploadProgress} />
    </div>
  );
};

export default KlinikFormTable;