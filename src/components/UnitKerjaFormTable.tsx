"use client";

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Pencil,
  Trash2,
  Upload,
  Download,
  FileText,
  RefreshCw,
  Loader2,
  Building2,
  Landmark,
  BedDouble,
  Stethoscope,
  Briefcase,
  Workflow,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useReportDownload } from "@/components/report";

// Helpers to map between DB codes and UI labels for 'jenis'
const jenisCodeToLabel = (code: number | null | undefined): "Rawat Jalan" | "Rawat Inap" | "Operatif" | "Non Layanan" | undefined => {
  if (code === 1) return "Rawat Jalan";
  if (code === 2) return "Rawat Inap";
  if (code === 3) return "Operatif";
  if (code === 4) return "Non Layanan";
  return undefined;
};

const jenisLabelToCode = (label: string | null | undefined): 1 | 2 | 3 | 4 | undefined => {
  if (label === "Rawat Jalan") return 1;
  if (label === "Rawat Inap") return 2;
  if (label === "Operatif") return 3;
  if (label === "Non Layanan") return 4;
  return undefined;
};

interface UnitKerja {
  id: string;
  user_id?: string;
  kode: string;
  nama: string;
  lokasi: string;
  luas_ruangan: number;
  // Keep UI-facing type as label; map to/from DB code on IO
  jenis?: "Rawat Jalan" | "Rawat Inap" | "Operatif" | "Non Layanan";
  kategori: "Pusat Biaya" | "Pusat Pendapatan";
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  nama: z.string().min(1, { message: "Nama Unit Kerja harus diisi." }),
  lokasi: z.string().min(1, { message: "Lokasi Unit Kerja harus diisi." }),
  luas_ruangan: z.coerce.number().min(0, { message: "Luas Ruangan harus angka positif." }),
  jenis: z.enum(["Rawat Jalan", "Rawat Inap", "Operatif", "Non Layanan"], {
    required_error: "Jenis harus dipilih.",
  }),
  kategori: z.enum(["Pusat Biaya", "Pusat Pendapatan"], {
    required_error: "Kategori harus dipilih.",
  }),
});

const UnitKerjaFormTable: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingUnitKerja, setEditingUnitKerja] = useState<UnitKerja | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "Pusat Biaya" | "Pusat Pendapatan">(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("kategori") as "all" | "Pusat Biaya" | "Pusat Pendapatan" | null;
    const fromStorage = localStorage.getItem("unitKerjaKategoriFilter") as "all" | "Pusat Biaya" | "Pusat Pendapatan" | null;
    return fromUrl || fromStorage || "all";
  });
  const [jenisFilter, setJenisFilter] = useState<"all" | "Rawat Jalan" | "Rawat Inap" | "Operatif" | "Non Layanan">(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("jenis") as "all" | "Rawat Jalan" | "Rawat Inap" | "Operatif" | "Non Layanan" | null;
    const fromStorage = localStorage.getItem("unitKerjaJenisFilter") as "all" | "Rawat Jalan" | "Rawat Inap" | "Operatif" | "Non Layanan" | null;
    return fromUrl || fromStorage || "all";
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (reportFilter === "all") params.delete("kategori"); else params.set("kategori", reportFilter);
    if (jenisFilter === "all") params.delete("jenis"); else params.set("jenis", jenisFilter);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
    localStorage.setItem("unitKerjaKategoriFilter", reportFilter);
    localStorage.setItem("unitKerjaJenisFilter", jenisFilter);
  }, [reportFilter, jenisFilter]);
  
  // Use form operations hook
  const { loading, saving, importing, loadData, saveData, deleteData, importData } = useFormOperations({
    entityName: "Unit Kerja",
    onSuccess: () => {
      setEditingUnitKerja(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      lokasi: "",
      luas_ruangan: 0,
      jenis: "Rawat Jalan",
      kategori: "Pusat Biaya",
    },
  });

  useEffect(() => {
    // Load all unit_kerja records (shared across users)
    fetchUnitKerja();
  }, []);

  useEffect(() => {
    if (editingUnitKerja) {
      form.reset({
        nama: editingUnitKerja.nama,
        lokasi: editingUnitKerja.lokasi,
        luas_ruangan: editingUnitKerja.luas_ruangan,
        jenis: editingUnitKerja.jenis ?? "Rawat Jalan",
        kategori: editingUnitKerja.kategori,
      });
    } else {
      form.reset({
        nama: "",
        lokasi: "",
        luas_ruangan: 0,
        jenis: "Rawat Jalan",
        kategori: "Pusat Biaya",
      });
    }
  }, [editingUnitKerja, form]);

  const fetchUnitKerja = async () => {
    await loadData(async () => {
      const { data, error } = await supabase
        .from('unit_kerja')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mapped = (data || []).map((row: any) => ({
        ...row,
        jenis: typeof row.jenis === 'number' ? (jenisCodeToLabel(row.jenis) ?? undefined) : row.jenis,
      })) as UnitKerja[];
      setUnitKerjaList(mapped);
    }, { showLoadingToast: false });
  };

  const generateKodeUnitKerja = async () => {
    try {
      // Get the latest unit kerja globally to determine the next number
      const { data, error } = await supabase
        .from('unit_kerja')
        .select('kode')
        .order('kode', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest kode:', error);
        toast.error("Gagal mendapatkan kode unit kerja terbaru.");
        return 'UK001';
      }

      if (!data || data.length === 0) {
        // If no data exists, start from UK001
        return 'UK001';
      }

      // Extract the number from the latest kode and increment
      const latestKode = data[0].kode;
      
      // Validate the kode format (should be UK###)
      if (!latestKode || !latestKode.match(/^UK\d{3}$/)) {
        console.error('Invalid kode format:', latestKode);
        toast.error("Format kode unit kerja tidak valid.");
        return 'UK001';
      }

      const numberPart = parseInt(latestKode.substring(2));
      
      if (isNaN(numberPart)) {
        console.error('Could not parse number from kode:', latestKode);
        toast.error("Tidak dapat memparse nomor dari kode unit kerja.");
        return 'UK001';
      }

      const nextNumber = numberPart + 1;
      
      // Ensure the number doesn't exceed 999 (UK999 is the maximum)
      if (nextNumber > 999) {
        toast.error("Tidak dapat membuat kode unit kerja baru. Maksimal 999 unit kerja.");
        return null;
      }

      return `UK${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Unexpected error in generateKodeUnitKerja:', error);
      toast.error("Terjadi kesalahan saat membuat kode unit kerja.");
      return 'UK001';
    }
  };

  const iconMap: Record<string, React.ReactNode> = {
    "Pusat Pendapatan": <Building2 className="h-5 w-5" />,
    "Pusat Biaya": <Landmark className="h-5 w-5" />,
    "Rawat Inap": <BedDouble className="h-5 w-5" />,
    "Rawat Jalan": <Stethoscope className="h-5 w-5" />,
    "Non Layanan": <Briefcase className="h-5 w-5" />,
    Operatif: <Workflow className="h-5 w-5" />,
  };

  const iconBackgrounds: Record<string, string> = {
    "Pusat Pendapatan": "bg-indigo-100 text-indigo-600",
    "Pusat Biaya": "bg-emerald-100 text-emerald-600",
    "Rawat Inap": "bg-orange-100 text-orange-500",
    "Rawat Jalan": "bg-blue-100 text-blue-500",
    "Non Layanan": "bg-slate-100 text-slate-500",
    Operatif: "bg-rose-100 text-rose-500",
  };

  const slugify = (value?: string) =>
    (value ?? "unknown")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const RADIAN = Math.PI / 180;
  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value, name, payload } = props;
    const color = payload?.borderColor ?? "#1f2937";
    const radius = outerRadius + 16;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={color}
        fontSize={12}
        fontWeight={600}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${name} (${value})`}
      </text>
    );
  };

  const categoryColors: Record<string, string> = {
    "Pusat Pendapatan": "#EEF2FF",
    "Pusat Biaya": "#ECFDF5",
  };

  const categoryBorderColors: Record<string, string> = {
    "Pusat Pendapatan": "#6366F1",
    "Pusat Biaya": "#10B981",
  };

  const typeColors: Record<string, string> = {
    "Rawat Inap": "#FFF7ED",
    "Rawat Jalan": "#EFF6FF",
    Operatif: "#FEE2E2",
    "Non Layanan": "#F4F4F5",
  };

  const typeBorderColors: Record<string, string> = {
    "Rawat Inap": "#F97316",
    "Rawat Jalan": "#3B82F6",
    Operatif: "#F43F5E",
    "Non Layanan": "#6B7280",
  };

  const metrics = React.useMemo(
    () => [
      { label: "Pusat Pendapatan", value: unitKerjaList.filter((u) => u.kategori === "Pusat Pendapatan").length },
      { label: "Pusat Biaya", value: unitKerjaList.filter((u) => u.kategori === "Pusat Biaya").length },
      { label: "Rawat Inap", value: unitKerjaList.filter((u) => u.jenis === "Rawat Inap").length },
      { label: "Rawat Jalan", value: unitKerjaList.filter((u) => u.jenis === "Rawat Jalan").length },
      { label: "Operatif", value: unitKerjaList.filter((u) => u.jenis === "Operatif").length },
      { label: "Non Layanan", value: unitKerjaList.filter((u) => u.jenis === "Non Layanan").length },
    ],
    [unitKerjaList],
  );

  const categoryChartData = React.useMemo(
    () =>
      Object.entries(
        unitKerjaList.reduce(
          (acc, curr) => {
            acc[curr.kategori] = (acc[curr.kategori] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      ).map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name] || "#EEF2FF",
        borderColor: categoryBorderColors[name] || "#6366F1",
      })),
    [unitKerjaList],
  );

  const typeChartData = React.useMemo(
    () =>
      Object.entries(
        unitKerjaList.reduce(
          (acc, curr) => {
            const key = curr.jenis ?? "Tidak Ditetapkan";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      ).map(([name, value]) => ({
        name,
        value,
        color: typeColors[name] || "#EFF6FF",
        borderColor: typeBorderColors[name] || "#3B82F6",
      })),
    [unitKerjaList],
  );

  const totalUnit = React.useMemo(
    () => unitKerjaList.length || 1,
    [unitKerjaList.length],
  );

  const formatPercentage = (value: number) =>
    `${((value / totalUnit) * 100).toFixed(0)}%`;

  const generateBatchKodeUnitKerja = async (count: number) => {
    try {
      // Get the latest unit kerja globally to determine the starting number
      const { data, error } = await supabase
        .from('unit_kerja')
        .select('kode')
        .order('kode', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest kode:', error);
        toast.error("Gagal mendapatkan kode unit kerja terbaru.");
        return [];
      }

      let startNumber = 1;
      if (data && data.length > 0) {
        const latestKode = data[0].kode;
        
        // Validate the kode format (should be UK###)
        if (latestKode && latestKode.match(/^UK\d{3}$/)) {
          const numberPart = parseInt(latestKode.substring(2));
          if (!isNaN(numberPart)) {
            startNumber = numberPart + 1;
          }
        }
      }

      // Check if we have enough space for all codes
      if (startNumber + count - 1 > 999) {
        toast.error(`Tidak dapat membuat ${count} kode unit kerja. Maksimal 999 unit kerja.`);
        return [];
      }

      // Generate sequential codes
      const codes: string[] = [];
      for (let i = 0; i < count; i++) {
        const codeNumber = startNumber + i;
        codes.push(`UK${codeNumber.toString().padStart(3, '0')}`);
      }

      return codes;
    } catch (error) {
      console.error('Unexpected error in generateBatchKodeUnitKerja:', error);
      toast.error("Terjadi kesalahan saat membuat kode unit kerja batch.");
      return [];
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await saveData(async () => {
      let kode: string;
      
      if (editingUnitKerja) {
        // For editing, keep the existing kode
        kode = editingUnitKerja.kode;
        const { error } = await supabase
          .from('unit_kerja')
          .update({
            ...values,
            kode,
            // Convert label to numeric code for DB
            jenis: jenisLabelToCode(values.jenis) ?? 1,
          })
          .eq('id', editingUnitKerja.id);

        if (error) throw error;
      } else {
        // Generate new kode for new entries
        kode = await generateKodeUnitKerja();
        
        // Check if kode generation failed
        if (!kode) {
          throw new Error("Gagal membuat kode unit kerja baru.");
        }
        
        // Check if kode already exists (shouldn't happen but just in case)
        const { data: existingData, error: checkError } = await supabase
          .from('unit_kerja')
          .select('id')
          .eq('kode', kode)
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingData) {
          // This should be very rare, but if it happens, generate a new one
          throw new Error("Kode unit kerja sudah ada. Silakan coba lagi.");
        }

        const { error } = await supabase
          .from('unit_kerja')
          .insert([{ 
            ...values,
            kode,
            jenis: jenisLabelToCode(values.jenis) ?? 1,
          }]);

        if (error) throw error;
      }
      
      await fetchUnitKerja();
    }, {
      loadingMessage: editingUnitKerja ? "Memperbarui data unit kerja..." : "Menyimpan data unit kerja...",
      successMessage: editingUnitKerja ? "Data unit kerja berhasil diperbarui" : "Data unit kerja berhasil ditambahkan"
    });
  };

  const handleEdit = (unitKerja: UnitKerja) => {
    setEditingUnitKerja(unitKerja);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteData(async () => {
      const { error } = await supabase
        .from('unit_kerja')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchUnitKerja();
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      file.text().then((text) => {
        (Papa as any).parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: async (results: Papa.ParseResult<any>) => {
            await importData(async () => {
              // Show parsing progress
              showInfo("Memproses file CSV...");
              
              // Filter and validate data
              const allRows = results.data;
              const validRows = allRows.filter((row: any) => 
                row["Nama Unit Kerja"] && row["Nama Unit Kerja"].toString().trim()
              );
              const invalidRows = allRows.filter((row: any) => 
                !row["Nama Unit Kerja"] || !row["Nama Unit Kerja"].toString().trim()
              );
              
              if (validRows.length === 0) {
                throw new Error("Tidak ada data valid untuk diimpor.");
              }

              // Show code generation progress
              showInfo("Membuat kode unit kerja...");
              
              const codes = await generateBatchKodeUnitKerja(validRows.length);
              if (codes.length === 0) {
                throw new Error("Gagal membuat kode untuk data yang diimpor.");
              }

              // Prepare data for import
              const importedData: any[] = [];
              for (let i = 0; i < validRows.length; i++) {
                const row = validRows[i];
                importedData.push({
                  kode: codes[i],
                  nama: row["Nama Unit Kerja"] || "",
                  lokasi: row["Lokasi Unit Kerja"] || "",
                  luas_ruangan: parseFloat(row["Luas Ruangan (M2)"]) || 0,
                  jenis: ["Rawat Jalan", "Rawat Inap", "Operatif", "Non Layanan"].includes(row["Jenis"]) ? row["Jenis"] : "Rawat Jalan",
                  kategori: row["Kategori"] === "Pusat Pendapatan" ? "Pusat Pendapatan" : "Pusat Biaya",
                });
              }

              // Show upload progress
              showInfo("Mengunggah data ke database...");

              const { error } = await supabase
                .from('unit_kerja')
                .insert(importedData.map((it) => ({
                  ...it,
                  jenis: jenisLabelToCode(it.jenis) ?? 1,
                })));

              if (error) throw error;
              
              // Refresh data
              await fetchUnitKerja();
              
              // Return success message with detailed information
              const successCount = importedData.length;
              const missingCount = invalidRows.length;
              
              if (missingCount === 0) {
                return `✅ Sukses! ${successCount} baris data berhasil diunggah. Missing data = 0`;
              } else {
                return `✅ Sukses! ${successCount} baris data berhasil diunggah. Missing data = ${missingCount} baris (tidak memiliki nama unit kerja)`;
              }
            }, {
              loadingMessage: "Mengimpor data unit kerja...",
              successMessage: "" // Will be overridden by the return value
            }).then((result) => {
              if (result) {
                showSuccess(result);
              }
            }).catch((error) => {
              showError(`❌ Gagal mengimpor data: ${error.message}`);
            }).finally(() => {
              // Reset file input
              event.target.value = '';
            });
          },
          error: (error: Papa.ParseError) => {
            showError(`❌ Gagal memproses file CSV: ${error.message}`);
            // Reset file input
            event.target.value = '';
          }
        });
      });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Unit Kerja", "Lokasi Unit Kerja", "Luas Ruangan (M2)", "Jenis", "Kategori"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Unit Kerja");
    XLSX.writeFile(wb, "template_unit_kerja.xlsx");
    toast.info("Template impor data berhasil diunduh.");
  };

  const handleDownloadReport = async () => {
    const filteredData = unitKerjaList.filter(item =>
      (reportFilter === "all" ? true : item.kategori === reportFilter) &&
      (jenisFilter === "all" ? true : item.jenis === jenisFilter)
    );

    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan dengan filter ini.");
      return;
    }

    const dataToExport = filteredData.map(item => ({
      "Kode Unit Kerja": item.kode,
      "Nama Unit Kerja": item.nama,
      "Lokasi Unit Kerja": item.lokasi,
      "Luas Ruangan (M2)": item.luas_ruangan,
      "Jenis": item.jenis ?? "",
      "Kategori": item.kategori,
    }));

    await downloadReport({
      title: "Laporan Unit Kerja",
      subtitle: "Daftar unit kerja sesuai filter",
      filename: `laporan_unit_kerja_${reportFilter.replace(/\s/g, "_")}_${jenisFilter.replace(/\s/g, "_")}`,
      filters: {
        Kategori: reportFilter === "all" ? "Semua" : reportFilter,
        Jenis: jenisFilter === "all" ? "Semua" : jenisFilter,
      },
      records: dataToExport,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 space-y-4">
        <h2 className="text-2xl font-bold">Manajemen Data Unit Kerja</h2>

        <div className="grid gap-3 xl:grid-cols-6 lg:grid-cols-3 sm:grid-cols-2">
          {metrics.map((metric) => (
            <Card
              key={metric.label}
              className={cn(
                "border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
                metric.label === "Pusat Pendapatan" && "bg-indigo-50",
                metric.label === "Pusat Biaya" && "bg-emerald-50",
                metric.label === "Rawat Inap" && "bg-orange-50",
                metric.label === "Rawat Jalan" && "bg-blue-50",
                metric.label === "Operatif" && "bg-rose-50",
                metric.label === "Non Layanan" && "bg-slate-50",
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                  {metric.label}
                </CardTitle>
                <div
                  className={cn(
                    "rounded-full p-1.5 shadow-inner",
                    iconBackgrounds[metric.label] ?? "bg-slate-100 text-slate-500",
                  )}
                >
                  {iconMap[metric.label] ?? <Briefcase className="h-5 w-5" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-slate-900">{metric.value}</div>
                <p className="text-sm font-semibold text-slate-500">
                  {metric.value === 0
                    ? "Belum ada data"
                    : `${formatPercentage(metric.value)} dari total`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-none shadow-md bg-white/85 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                  Distribusi Kategori
                </CardTitle>
                <PieChart className="h-5 w-5 text-indigo-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                Proporsi unit kerja berdasarkan kategori
              </p>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <defs>
                    <filter id="category-shadow" x="-20%" y="-20%" width="150%" height="150%">
                      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#94a3b8" floodOpacity="0.25" />
                    </filter>
                    {categoryChartData.map((entry) => (
                      <linearGradient
                        key={entry.name}
                        id={`gradient-cat-${slugify(entry.name)}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="10%" stopColor={entry.borderColor} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={72}
                    paddingAngle={3}
                    cornerRadius={12}
                    strokeWidth={3}
                    label={renderPieLabel}
                    labelLine={false}
                    startAngle={90}
                    endAngle={-270}
                    filter="url(#category-shadow)"
                  >
                    {categoryChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={`url(#gradient-cat-${slugify(entry.name)})`}
                        stroke={entry.borderColor}
                      />
                    ))}
                  </Pie>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    cx="50%"
                    cy="52%"
                    innerRadius={72}
                    outerRadius={78}
                    fill="#CBD5F5"
                    opacity={0.25}
                    isAnimationActive={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, padding: 12, borderColor: "#e5e7eb" }}
                    formatter={(value: number, name: string) => [
                      `${value} unit (${formatPercentage(value)})`,
                      name,
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/85 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                  Distribusi Jenis
                </CardTitle>
                <PieChart className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                Proporsi unit kerja berdasarkan jenis layanan
              </p>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <defs>
                    <filter id="type-shadow" x="-20%" y="-20%" width="150%" height="150%">
                      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#94a3b8" floodOpacity="0.25" />
                    </filter>
                    {typeChartData.map((entry) => (
                      <linearGradient
                        key={entry.name}
                        id={`gradient-type-${slugify(entry.name)}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="10%" stopColor={entry.borderColor} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={typeChartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={72}
                    paddingAngle={3}
                    cornerRadius={12}
                    strokeWidth={3}
                    label={renderPieLabel}
                    labelLine={false}
                    startAngle={90}
                    endAngle={-270}
                    filter="url(#type-shadow)"
                  >
                    {typeChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={`url(#gradient-type-${slugify(entry.name)})`}
                        stroke={entry.borderColor}
                      />
                    ))}
                  </Pie>
                  <Pie
                    data={typeChartData}
                    dataKey="value"
                    cx="50%"
                    cy="52%"
                    innerRadius={72}
                    outerRadius={78}
                    fill="#CBD5F5"
                    opacity={0.25}
                    isAnimationActive={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, padding: 12, borderColor: "#e5e7eb" }}
                    formatter={(value: number, name: string) => [
                      `${value} unit (${formatPercentage(value)})`,
                      name,
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleDownloadTemplate}
            variant="template"
            className="shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
          </Button>

          <label htmlFor="import-file" className="cursor-pointer">
            <LoadingButton
              loading={importing}
              loadingText="Mengunggah Data..."
              variant="import"
              className="shadow-sm"
              asChild
            >
              <span className="flex items-center gap-2 px-4 py-2">
                <Upload className="h-4 w-4" />
                Impor Data
              </span>
            </LoadingButton>
            <Input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={handleImportData}
              className="sr-only"
              disabled={importing}
            />
          </label>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUnitKerja(null)} className="shadow-sm">
                Tambah Data Unit Kerja
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingUnitKerja ? "Edit Data Unit Kerja" : "Tambah Data Unit Kerja"}</DialogTitle>
                <DialogDescription>
                  {editingUnitKerja ? "Perbarui detail unit kerja." : "Tambahkan unit kerja baru ke sistem."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Unit Kerja</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: IGD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lokasi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lokasi Unit Kerja</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Gedung A Lantai 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="luas_ruangan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Luas Ruangan (M2)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kategori"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pusat Biaya">Pusat Biaya</SelectItem>
                            <SelectItem value="Pusat Pendapatan">Pusat Pendapatan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jenis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Jenis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                            <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                            <SelectItem value="Operatif">Operatif</SelectItem>
                            <SelectItem value="Non Layanan">Non Layanan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <LoadingButton
                      type="submit"
                      loading={saving}
                      loadingText={editingUnitKerja ? "Menyimpan perubahan..." : "Menyimpan..."}
                    >
                      {editingUnitKerja ? "Simpan Perubahan" : "Tambah"}
                    </LoadingButton>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => { void handleDownloadReport(); }}
            variant="report"
            className="shadow-sm"
          >
            <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
          </Button>

          <Button onClick={() => fetchUnitKerja()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            onValueChange={(value: "all" | "Pusat Biaya" | "Pusat Pendapatan") => setReportFilter(value)}
            defaultValue={reportFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Pusat Biaya">Pusat Biaya</SelectItem>
              <SelectItem value="Pusat Pendapatan">Pusat Pendapatan</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value: "all" | "Rawat Jalan" | "Rawat Inap" | "Operatif" | "Non Layanan") => setJenisFilter(value)}
            defaultValue={jenisFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
              <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
              <SelectItem value="Operatif">Operatif</SelectItem>
              <SelectItem value="Non Layanan">Non Layanan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0f766e]">
            <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
              <TableHead className="font-bold text-white">Kode Unit Kerja</TableHead>
              <TableHead className="font-bold text-white">Nama Unit Kerja</TableHead>
              <TableHead className="font-bold text-white">Lokasi Unit Kerja</TableHead>
              <TableHead className="font-bold text-white">Luas Ruangan (M2)</TableHead>
              <TableHead className="font-bold text-white">Jenis</TableHead>
              <TableHead className="font-bold text-white">Kategori</TableHead>
              <TableHead className="text-right font-bold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || importing ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <LoadingSpinner 
                    size="md" 
                    text={importing ? "Mengunggah data..." : "Memuat data..."} 
                  />
                </TableCell>
              </TableRow>
            ) : unitKerjaList.filter(item =>
                (reportFilter === "all" ? true : item.kategori === reportFilter) &&
                (jenisFilter === "all" ? true : item.jenis === jenisFilter)
              ).length > 0 ? (
              unitKerjaList
                .filter(item =>
                  (reportFilter === "all" ? true : item.kategori === reportFilter) &&
                  (jenisFilter === "all" ? true : item.jenis === jenisFilter)
                )
                .map((unitKerja) => (
                <TableRow key={unitKerja.id}>
                  <TableCell className="font-medium">{unitKerja.kode}</TableCell>
                  <TableCell>{unitKerja.nama}</TableCell>
                  <TableCell>{unitKerja.lokasi}</TableCell>
                  <TableCell>{unitKerja.luas_ruangan}</TableCell>
                <TableCell>{unitKerja.jenis ?? '-'}</TableCell>
                  <TableCell>{unitKerja.kategori}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="edit" size="icon" onClick={() => handleEdit(unitKerja)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(unitKerja.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada data unit kerja.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UnitKerjaFormTable;