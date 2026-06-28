"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { fetchUnitKerjaPusatPendapatan, validateUnitKerjaData } from "@/utils/unit-kerja-helper";
import { useReportDownload } from "@/components/report";
import { useYear } from "@/contexts/YearContext";
import { useTenant } from "@/contexts/TenantContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: "Pusat Biaya" | "Pusat Pendapatan";
}

// Kolom DB: pendapatan_umum, pendapatan_bpjs, pendapatan_apbd, total_pendapatan
interface DataPendapatan {
  id: string;
  user_id?: string;
  tenant_id?: string;
  unit_kerja_id?: string;
  kode_unit_kerja?: string;
  nama_unit_kerja?: string;
  pendapatan_umum?: number;
  pendapatan_bpjs?: number;
  pendapatan_apbd?: number;
  total_pendapatan?: number;
  tahun?: number;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  unit_kerja_id:    z.string().min(1, { message: "Unit Kerja harus dipilih." }),
  pendapatan_umum:  z.coerce.number().min(0),
  pendapatan_bpjs:  z.coerce.number().min(0),
  pendapatan_apbd:  z.coerce.number().min(0),
  tahun:            z.coerce.number().min(1900).max(3000),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse angka format Indonesia: "1.500.000" → 1500000, "1.500,50" → 1500.50 */
const parseAngka = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).trim().replace(/\s/g, "");
  if (!s) return 0;
  if (s.includes(",")) {
    const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? 0 : Math.abs(n);
  }
  const n = parseFloat(s.replace(/\./g, ""));
  return isNaN(n) ? 0 : Math.abs(n);
};

/** Ambil tenant_id: context → sessionStorage → user_profiles */
const resolveTenantId = async (fromContext?: string | null): Promise<string | null> => {
  if (fromContext) return fromContext;
  try {
    const s = sessionStorage.getItem("tenant_id");
    if (s) return s;
  } catch (_) { /* ignore */ }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("user_profiles").select("tenant_id").eq("id", user.id).single();
    return (data as any)?.tenant_id ?? null;
  } catch (_) { return null; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const PendapatanFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const { selectedYear } = useYear();
  const { tenant } = useTenant();

  const [rows, setRows]           = useState<DataPendapatan[]>([]);
  const [ukList, setUkList]       = useState<UnitKerja[]>([]);
  const ukRef                     = useRef<UnitKerja[]>([]);   // stale-closure-safe ref
  const [editing, setEditing]     = useState<DataPendapatan | null>(null);
  const [dialogOpen, setDialog]   = useState(false);
  const [isLoading, setLoading]   = useState(false);

  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();

  const filtered = useMemo(() => rows.filter((r) => r.tahun === selectedYear), [rows, selectedYear]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { unit_kerja_id: "", pendapatan_umum: 0, pendapatan_bpjs: 0, pendapatan_apbd: 0, tahun: new Date().getFullYear() },
  });

  // Sinkronisasi ref saat state berubah
  useEffect(() => { ukRef.current = ukList; }, [ukList]);
  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({
        unit_kerja_id:   editing.unit_kerja_id ?? "",
        pendapatan_umum: editing.pendapatan_umum ?? 0,
        pendapatan_bpjs: editing.pendapatan_bpjs ?? 0,
        pendapatan_apbd: editing.pendapatan_apbd ?? 0,
        tahun:           editing.tahun ?? new Date().getFullYear(),
      });
    } else {
      form.reset({ unit_kerja_id: "", pendapatan_umum: 0, pendapatan_bpjs: 0, pendapatan_apbd: 0, tahun: new Date().getFullYear() });
    }
  }, [editing]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setLoading(true);
    try {
      const ukData = await fetchUnitKerjaPusatPendapatan();
      if (validateUnitKerjaData(ukData)) {
        setUkList(ukData);
        ukRef.current = ukData;
      } else {
        toast.error("Data unit kerja tidak valid atau kosong.");
      }

      const { data, error } = await supabase
        .from("data_pendapatan")
        .select("id, user_id, tenant_id, unit_kerja_id, kode_unit_kerja, nama_unit_kerja, pendapatan_umum, pendapatan_bpjs, pendapatan_apbd, total_pendapatan, tahun, created_at, updated_at")
        .order("kode_unit_kerja", { ascending: true });

      if (error) {
        console.error("Fetch error:", error);
        toast.error(`Gagal memuat data: ${error.message}`);
      } else {
        setRows((data as DataPendapatan[]) ?? []);
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit (tambah / edit) ─────────────────────────────────────────────────

  const onSubmit = async (v: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Tidak terautentikasi."); return; }

      const tenantId = await resolveTenantId(tenant?.id);
      if (!tenantId) { toast.error("Tenant tidak ditemukan, coba login ulang."); return; }

      const uk = ukList.find((u) => u.id === v.unit_kerja_id);
      if (!uk) { toast.error("Unit kerja tidak ditemukan."); return; }

      const payload = {
        user_id: user.id, tenant_id: tenantId,
        unit_kerja_id: uk.id, kode_unit_kerja: uk.kode, nama_unit_kerja: uk.nama,
        pendapatan_umum: v.pendapatan_umum,
        pendapatan_bpjs: v.pendapatan_bpjs,
        pendapatan_apbd: v.pendapatan_apbd,
        tahun: v.tahun,
      };

      const { error } = editing
        ? await supabase.from("data_pendapatan").update(payload).eq("id", editing.id)
        : await supabase.from("data_pendapatan").insert([payload]);

      if (error) throw error;
      toast.success(editing ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.");
      await fetchAll();
      setEditing(null); setDialog(false); form.reset();
    } catch (e: any) {
      toast.error(`Gagal menyimpan: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("data_pendapatan").delete().eq("id", id);
    if (error) { toast.error(`Gagal hapus: ${error.message}`); return; }
    toast.success("Data berhasil dihapus.");
    await fetchAll();
  };

  // ── Download Template Excel ────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      let list = ukRef.current;
      if (list.length === 0) {
        list = await fetchUnitKerjaPusatPendapatan();
        if (!validateUnitKerjaData(list)) { toast.error("Unit kerja kosong."); return; }
        setUkList(list); ukRef.current = list;
      }

      // Template kolom sesuai gambar: Kode Unit Kerja | Nama Unit Kerja | Pendapatan Umum | Pendapatan BPJS | Tahun
      // Pendapatan APBD ditambahkan setelah BPJS (ada di DB)
      const templateData = list.map((uk, i) => ({
        "Kode Unit Kerja":  uk.kode,
        "Nama Unit Kerja":  uk.nama,
        "Pendapatan Umum":  i < 3 ? (i + 1) * 50000000 : 0,
        "Pendapatan BPJS":  i < 3 ? (i + 1) * 30000000 : 0,
        "Pendapatan APBD":  0,
        "Tahun":            selectedYear,
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      ws["!cols"] = [{ wch: 16 }, { wch: 36 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 8 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Pendapatan");
      XLSX.writeFile(wb, `template_data_pendapatan_${selectedYear}.xlsx`);
      toast.success(`Template berhasil diunduh (${list.length} unit kerja).`);
    } catch (e: any) {
      toast.error(`Gagal membuat template: ${e.message}`);
    }
  };

  // ── Import (Excel / CSV) ───────────────────────────────────────────────────

  const processRows = async (rawRows: Record<string, unknown>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showUploadError("Tidak terautentikasi."); return; }

      const tenantId = await resolveTenantId(tenant?.id);
      if (!tenantId) { showUploadError("Tenant tidak ditemukan, coba login ulang."); return; }

      if (rawRows.length === 0) { showUploadError("File kosong."); return; }

      // Pastikan ukList tersedia via ref (tidak stale)
      let list = ukRef.current;
      if (list.length === 0) {
        list = await fetchUnitKerjaPusatPendapatan();
        if (!validateUnitKerjaData(list)) { showUploadError("Gagal memuat unit kerja."); return; }
        setUkList(list); ukRef.current = list;
      }

      console.log(`Import: ${rawRows.length} baris | ${list.length} unit kerja`);
      console.log("Header kolom file:", Object.keys(rawRows[0]));

      startUpload(rawRows.length, "Memvalidasi data pendapatan...");

      const valid: Record<string, unknown>[] = [];
      let skipped = 0, errCount = 0;
      const errMsgs: string[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        updateProgress(i + 1, valid.length, errCount);

        const kode = (row["Kode Unit Kerja"] ?? row["kode_unit_kerja"] ?? row["KODE UNIT KERJA"])
          ?.toString().trim();

        if (!kode) { skipped++; continue; }

        const uk = list.find((u) => u.kode === kode);
        if (!uk) {
          errMsgs.push(`Baris ${i + 2}: kode "${kode}" tidak ditemukan`);
          errCount++; continue;
        }

        const umum  = parseAngka(row["Pendapatan Umum"]  ?? row["pendapatan_umum"]  ?? 0);
        const bpjs  = parseAngka(row["Pendapatan BPJS"]  ?? row["pendapatan_bpjs"]  ?? 0);
        const apbd  = parseAngka(row["Pendapatan APBD"]  ?? row["pendapatan_apbd"]  ?? 0);
        const tahun = parseInt(String(row["Tahun"] ?? "")) || selectedYear;

        // Lewati baris yang semua nilai 0 (baris kosong template)
        if (umum === 0 && bpjs === 0 && apbd === 0) { skipped++; continue; }

        valid.push({
          user_id: user.id, tenant_id: tenantId,
          unit_kerja_id: uk.id, kode_unit_kerja: uk.kode, nama_unit_kerja: uk.nama,
          pendapatan_umum: umum,
          pendapatan_bpjs: bpjs,
          pendapatan_apbd: apbd,
          tahun,
        });
      }

      if (valid.length === 0) {
        const detail = errMsgs.length
          ? `\n${errMsgs.slice(0, 5).join("\n")}`
          : "\nPastikan kolom 'Kode Unit Kerja' benar dan nilai pendapatan diisi.";
        showUploadError(`Tidak ada data valid. Diproses: ${rawRows.length}, Dilewati: ${skipped}, Error: ${errCount}.${detail}`);
        return;
      }

      // Insert per batch 50
      const BATCH = 50;
      const insertErrs: string[] = [];
      for (let i = 0; i < valid.length; i += BATCH) {
        const { error } = await supabase.from("data_pendapatan").insert(valid.slice(i, i + BATCH) as any);
        if (error) { console.error("Insert error:", error); insertErrs.push(error.message); }
      }

      if (insertErrs.length) { showUploadError(`Gagal simpan: ${insertErrs[0]}`); return; }

      completeUpload(valid.length, errCount, 0);
      await fetchAll();
      let msg = `${valid.length} data berhasil diimpor`;
      if (skipped)   msg += `, ${skipped} baris dilewati`;
      if (errCount)  msg += `, ${errCount} baris error`;
      toast.success(msg);
    } catch (e: any) {
      showUploadError(`Gagal impor: ${e.message}`);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          processRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" }));
        } catch (err: any) { showUploadError(`Gagal baca Excel: ${err.message}`); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      file.text().then((text) => {
        (Papa as any).parse(text, {
          header: true, skipEmptyLines: true,
          complete: (r: Papa.ParseResult<Record<string, unknown>>) => processRows(r.data),
          error: (err: Papa.ParseError) => showUploadError(`Gagal baca CSV: ${err.message}`),
        });
      });
    }
  };

  // ── Download Laporan ───────────────────────────────────────────────────────

  const handleDownloadReport = async () => {
    if (!filtered.length) { toast.warning("Tidak ada data untuk diekspor."); return; }
    await downloadReport({
      title: "Laporan Pendapatan Unit Kerja",
      subtitle: `Tahun ${selectedYear}`,
      filename: `laporan_pendapatan_${selectedYear}`,
      records: filtered.map((r) => ({
        "Kode Unit Kerja":  r.kode_unit_kerja ?? "",
        "Nama Unit Kerja":  r.nama_unit_kerja ?? "",
        "Pendapatan Umum":  r.pendapatan_umum ?? 0,
        "Pendapatan BPJS":  r.pendapatan_bpjs ?? 0,
        "Pendapatan APBD":  r.pendapatan_apbd ?? 0,
        "Total Pendapatan": r.total_pendapatan ?? 0,
        "Tahun":            r.tahun ?? "",
      })),
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString("id-ID");

  return (
    <div className="container mx-auto p-4">
      {/* Header — tidak perlu YearFilter di sini karena sudah ada di PendapatanChart */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Pendapatan</h2>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button onClick={handleDownloadTemplate} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>

        <label
          htmlFor="import-pendapatan"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white h-10 px-4 py-2 cursor-pointer transition-colors"
        >
          <Upload className="mr-2 h-4 w-4" /> Impor Data
          <input id="import-pendapatan" type="file" accept=".xlsx,.xls,.csv" onChange={handleImportData} className="sr-only" />
        </label>

        {/* Dialog tambah / edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="bg-red-500 hover:bg-red-600 text-white">
              Tambah Data Pendapatan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Data Pendapatan" : "Tambah Data Pendapatan"}</DialogTitle>
              <DialogDescription>{editing ? "Perbarui data pendapatan." : "Tambah data pendapatan baru."}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField control={form.control} name="unit_kerja_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Kerja (Pusat Pendapatan)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Unit Kerja" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ukList.map((uk) => (
                          <SelectItem key={uk.id} value={uk.id}>{uk.kode} – {uk.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tahun" render={({ field }) => (
                  <FormItem><FormLabel>Tahun</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pendapatan_umum" render={({ field }) => (
                  <FormItem><FormLabel>Pendapatan Umum (Rp)</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pendapatan_bpjs" render={({ field }) => (
                  <FormItem><FormLabel>Pendapatan BPJS (Rp)</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pendapatan_apbd" render={({ field }) => (
                  <FormItem><FormLabel>Pendapatan APBD (Rp)</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit">{editing ? "Simpan Perubahan" : "Tambah"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Button onClick={() => { void handleDownloadReport(); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
        <Button onClick={fetchAll} size="icon" variant="outline" title="Perbarui Data">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabel data */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="text-white font-semibold">Kode Unit Kerja</TableHead>
              <TableHead className="text-white font-semibold">Nama Unit Kerja</TableHead>
              <TableHead className="text-white font-semibold">Tahun</TableHead>
              <TableHead className="text-white font-semibold text-right">Pendapatan Umum (Rp)</TableHead>
              <TableHead className="text-white font-semibold text-right">Pendapatan BPJS (Rp)</TableHead>
              <TableHead className="text-white font-semibold text-right">Pendapatan APBD (Rp)</TableHead>
              <TableHead className="text-white font-semibold text-right">Total Pendapatan (Rp)</TableHead>
              <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : filtered.length > 0 ? filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.kode_unit_kerja}</TableCell>
                <TableCell>{item.nama_unit_kerja}</TableCell>
                <TableCell>{item.tahun}</TableCell>
                <TableCell className="text-right">{fmt(item.pendapatan_umum)}</TableCell>
                <TableCell className="text-right">{fmt(item.pendapatan_bpjs)}</TableCell>
                <TableCell className="text-right">{fmt(item.pendapatan_apbd)}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(item.total_pendapatan)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="edit" size="icon" onClick={() => { setEditing(item); setDialog(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} className="h-24 text-center">Tidak ada data pendapatan.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ImportProgressModal progress={uploadProgress} />
    </div>
  );
};

export default PendapatanFormTable;
