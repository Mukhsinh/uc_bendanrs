import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DataKegiatan } from "@/types/data-kegiatan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Activity,
  GraduationCap,
  Bed,
  Plus,
  Download,
  Upload,
  FileText,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { DataKegiatanAddForm } from "@/components/DataKegiatanAddForm";

interface StatsCard {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

interface DataGroup {
  name: string;
  fields: Array<{
    label: string;
    key: keyof DataKegiatan;
    isComputed?: boolean;
  }>;
}

const dataGroups: DataGroup[] = [
  {
    name: "Data Kepegawaian",
    fields: [
      { label: "SDM Dokter", key: "SDM_dokter" },
      { label: "SDM Perawat", key: "SDM_Perawat" },
      { label: "SDM Non-Medis", key: "SDM_Non" },
      { label: "Jumlah SDM", key: "Jumlah_SDM", isComputed: true },
      { label: "Diklat Jumlah Siswa", key: "Diklat_Jumlah_Siswa" },
      { label: "Diklat Lama Hari", key: "Diklat_Lama_Hari" },
      { label: "Total Diklat", key: "Total_Diklat", isComputed: true },
      { label: "Jam Praktek Harian", key: "Jml_jam_Praktek_Harian" },
    ],
  },
  {
    name: "Data Daya",
    fields: [
      { label: "Listrik (kWh)", key: "Listrik_kwh" },
      { label: "Air (m³)", key: "Air_m3" },
      { label: "Telepon (Frekuensi)", key: "Telepon_Freq_pakai_per_titik" },
      { label: "Komputer SIMRS User", key: "Komputer_simrs_user" },
    ],
  },
  {
    name: "Data Infrastruktur",
    fields: [
      { label: "Tempat Tidur SVIP", key: "Tempat_Tidur_SVIP" },
      { label: "Tempat Tidur VIP", key: "Tempat_Tidur_VIP" },
      { label: "Tempat Tidur Kelas I", key: "Tempat_Tidur_I" },
      { label: "Tempat Tidur Kelas II", key: "Tempat_Tidur_II" },
      { label: "Tempat Tidur Kelas III", key: "Tempat_Tidur_III" },
      { label: "Tempat Tidur Khusus", key: "Tempat_Tidur_Khusus" },
    ],
  },
  {
    name: "Data Layanan",
    fields: [
      { label: "Kunjungan Pasien Lama", key: "Kunjungan_Pasien_Lama" },
      { label: "Kunjungan Pasien Baru", key: "Kunjungan_Pasien_Baru" },
      { label: "Total Kunjungan Pasien", key: "Total_Kunjungan_Pasien", isComputed: true },
      { label: "Jumlah Tindakan", key: "Jumlah_Tindakan" },
      { label: "Resep Lembar", key: "Resep_Lembar_Resep" },
    ],
  },
  {
    name: "Data Keperawatan",
    fields: [
      { label: "Hari Rawat SVIP", key: "Hari_Rawat_SVIP" },
      { label: "Hari Rawat VIP", key: "Hari_Rawat_VIP" },
      { label: "Hari Rawat Kelas I", key: "Hari_Rawat_I" },
      { label: "Hari Rawat Kelas II", key: "Hari_Rawat_II" },
      { label: "Hari Rawat Kelas III", key: "Hari_Rawat_III" },
      { label: "Jumlah Hari Rawat", key: "Jumlah_Hari_Rawat", isComputed: true },
    ],
  },
  {
    name: "Data Penunjang",
    fields: [
      { label: "Cucian (kg)", key: "Cucian_kg_Cucian" },
      { label: "Instrumen Besar", key: "Instrumen_Besar" },
      { label: "Instrumen Sedang", key: "Instrumen_Sedang" },
      { label: "Instrumen Kecil", key: "Instrumen_Kecil" },
      { label: "Set Pack Besar", key: "Set_Pack_Besar" },
      { label: "Set Pack Sedang", key: "Set_Pack_Sedang" },
      { label: "Set Pack Kecil", key: "Set_Pack_Kecil" },
    ],
  },
  {
    name: "Data Gizi",
    fields: [
      { label: "Makanan Karyawan (Porsi)", key: "Makanan_Karyawan_jml_Porsi" },
      { label: "Makanan Pasien (Porsi)", key: "Makanan_Pasien_jml_Porsi" },
    ],
  },
];

export default function DataKegiatanRS() {
  const [data, setData] = useState<DataKegiatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedUnitName, setSelectedUnitName] = useState<string | "all">("all");
  const [unitKerjaList, setUnitKerjaList] = useState<{ id: string; kode: string; nama: string }[]>([]);
  const [viewingItem, setViewingItem] = useState<DataKegiatan | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError, hideProgress } = useUploadProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<DataKegiatan>>({});

  // Stats calculations
  const stats: StatsCard[] = [
    {
      title: "Total SDM",
      value: data.reduce((sum, item) => sum + (item.Jumlah_SDM || 0), 0),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Kunjungan",
      value: data.reduce((sum, item) => sum + (item.Total_Kunjungan_Pasien || 0), 0),
      icon: Activity,
      color: "text-green-600",
    },
    {
      title: "Total Diklat",
      value: data.reduce((sum, item) => sum + (item.Total_Diklat || 0), 0),
      icon: GraduationCap,
      color: "text-purple-600",
    },
    {
      title: "Total Hari Rawat",
      value: data.reduce((sum, item) => sum + (item.Jumlah_Hari_Rawat || 0), 0),
      icon: Bed,
      color: "text-orange-600",
    },
    {
      title: "Total Tindakan",
      value: data.reduce((sum, item) => sum + (item.Jumlah_Tindakan || 0), 0),
      icon: Activity,
      color: "text-red-600",
    },
  ];

  useEffect(() => {
    loadUnitKerja();
    loadData();
  }, [selectedYear, selectedUnitName]);

  const loadUnitKerja = async () => {
    try {
      const { data: units, error } = await supabase
        .from("unit_kerja")
        .select("id, kode, nama")
        .order("nama");

      if (error) throw error;
      setUnitKerjaList(units || []);
    } catch (error) {
      console.error("Error loading unit kerja:", error);
      toast.error("Gagal memuat data unit kerja");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("data_kegiatan")
        .select("*")
        .eq("tahun", selectedYear);

      if (selectedUnitName !== "all") {
        query = query.eq("Nama_Unit_Kerja", selectedUnitName);
      }

      const { data: result, error } = await query.order("Kode_UK");

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data kegiatan");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item: DataKegiatan) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number, namaUnit: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data kegiatan ${namaUnit}?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("data_kegiatan").delete().eq("id", id);

      if (error) throw error;

      toast.success("Data berhasil dihapus");
      loadData();
    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleDownloadTemplate = async () => {
    try {
      // Load unit kerja data for template
      const { data: units, error } = await supabase
        .from("unit_kerja")
        .select("kode, nama")
        .order("kode");

      if (error) throw error;

      // Create template with unit kerja data
      const templateData = units && units.length > 0
        ? units.map((unit) => ({
            Kode_UK: unit.kode,
            Nama_Unit_Kerja: unit.nama,
            tahun: selectedYear,
            SDM_dokter: 0,
            SDM_Perawat: 0,
            SDM_Non: 0,
            Jml_jam_Praktek_Harian: 0,
            Diklat_Jumlah_Siswa: 0,
            Diklat_Lama_Hari: 0,
            Listrik_kwh: 0,
            Air_m3: 0,
            Telepon_Freq_pakai_per_titik: 0,
            Komputer_simrs_user: 0,
            Tempat_Tidur_SVIP: 0,
            Tempat_Tidur_VIP: 0,
            Tempat_Tidur_I: 0,
            Tempat_Tidur_II: 0,
            Tempat_Tidur_III: 0,
            Tempat_Tidur_Khusus: 0,
            kamar_luas_svip: 0,
            kamar_luas_vip: 0,
            kamar_luas_i: 0,
            kamar_luas_ii: 0,
            kamar_luas_iii: 0,
            Kunjungan_Pasien_Lama: 0,
            Kunjungan_Pasien_Baru: 0,
            Jumlah_Tindakan: 0,
            Resep_Lembar_Resep: 0,
            Hari_Rawat_SVIP: 0,
            Hari_Rawat_VIP: 0,
            Hari_Rawat_I: 0,
            Hari_Rawat_II: 0,
            Hari_Rawat_III: 0,
            Cucian_kg_Cucian: 0,
            Instrumen_Besar: 0,
            Instrumen_Sedang: 0,
            Instrumen_Kecil: 0,
            Set_Pack_Besar: 0,
            Set_Pack_Sedang: 0,
            Set_Pack_Kecil: 0,
            Makanan_Karyawan_jml_Porsi: 0,
            Makanan_Pasien_jml_Porsi: 0,
            jumlah_porsi_svip: 0,
            jumlah_porsi_vip: 0,
            jumlah_porsi_i: 0,
            jumlah_porsi_ii: 0,
            jumlah_porsi_iii: 0,
          }))
        : [
            {
              Kode_UK: "UK001",
              Nama_Unit_Kerja: "Contoh Unit Kerja",
              tahun: selectedYear,
              SDM_dokter: 0,
              SDM_Perawat: 0,
              SDM_Non: 0,
              Jml_jam_Praktek_Harian: 0,
              Diklat_Jumlah_Siswa: 0,
              Diklat_Lama_Hari: 0,
              Listrik_kwh: 0,
              Air_m3: 0,
              Telepon_Freq_pakai_per_titik: 0,
              Komputer_simrs_user: 0,
              Tempat_Tidur_SVIP: 0,
              Tempat_Tidur_VIP: 0,
              Tempat_Tidur_I: 0,
              Tempat_Tidur_II: 0,
              Tempat_Tidur_III: 0,
              Tempat_Tidur_Khusus: 0,
              kamar_luas_svip: 0,
              kamar_luas_vip: 0,
              kamar_luas_i: 0,
              kamar_luas_ii: 0,
              kamar_luas_iii: 0,
              Kunjungan_Pasien_Lama: 0,
              Kunjungan_Pasien_Baru: 0,
              Jumlah_Tindakan: 0,
              Resep_Lembar_Resep: 0,
              Hari_Rawat_SVIP: 0,
              Hari_Rawat_VIP: 0,
              Hari_Rawat_I: 0,
              Hari_Rawat_II: 0,
              Hari_Rawat_III: 0,
              Cucian_kg_Cucian: 0,
              Instrumen_Besar: 0,
              Instrumen_Sedang: 0,
              Instrumen_Kecil: 0,
              Set_Pack_Besar: 0,
              Set_Pack_Sedang: 0,
              Set_Pack_Kecil: 0,
              Makanan_Karyawan_jml_Porsi: 0,
              Makanan_Pasien_jml_Porsi: 0,
              jumlah_porsi_svip: 0,
              jumlah_porsi_vip: 0,
              jumlah_porsi_i: 0,
              jumlah_porsi_ii: 0,
              jumlah_porsi_iii: 0,
            },
          ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Data Kegiatan");
      XLSX.writeFile(wb, `Template_Data_Kegiatan_${selectedYear}.xlsx`);
      toast.success(`Template berhasil diunduh dengan ${templateData.length} unit kerja`);
    } catch (error: any) {
      console.error("Error downloading template:", error);
      toast.error("Gagal mengunduh template");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            showUploadError("File tidak berisi data");
            return;
          }

          // Start upload with total count
          startUpload(jsonData.length, "Mengimpor data...");

          // Update progress during import
          updateProgress(Math.floor(jsonData.length / 2), 0, 0, "Memvalidasi data...");

          const { error } = await supabase.from("data_kegiatan").insert(jsonData as any[]);

          if (error) throw error;

          // Complete upload
          completeUpload(jsonData.length, 0, 0);
          toast.success(`Berhasil mengimpor ${jsonData.length} data`);
          loadData();
        } catch (error: any) {
          console.error("Error importing data:", error);
          showUploadError(error.message || "Gagal mengimpor data");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error("Error reading file:", error);
      showUploadError(error.message || "Gagal membaca file");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadReport = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diunduh");
      return;
    }

    const exportData = data.map((item) => ({
      "Kode UK": item.Kode_UK,
      "Nama Unit Kerja": item.Nama_Unit_Kerja,
      Tahun: item.tahun,
      "SDM Dokter": item.SDM_dokter,
      "SDM Perawat": item.SDM_Perawat,
      "SDM Non-Medis": item.SDM_Non,
      "Total SDM": item.Jumlah_SDM,
      "Jam Praktek Harian": item.Jml_jam_Praktek_Harian,
      "Diklat Siswa": item.Diklat_Jumlah_Siswa,
      "Diklat Lama Hari": item.Diklat_Lama_Hari,
      "Total Diklat": item.Total_Diklat,
      "Listrik (kWh)": item.Listrik_kwh,
      "Air (m³)": item.Air_m3,
      "Telepon (Freq)": item.Telepon_Freq_pakai_per_titik,
      "Komputer SIMRS": item.Komputer_simrs_user,
      "TT SVIP": item.Tempat_Tidur_SVIP,
      "TT VIP": item.Tempat_Tidur_VIP,
      "TT Kelas I": item.Tempat_Tidur_I,
      "TT Kelas II": item.Tempat_Tidur_II,
      "TT Kelas III": item.Tempat_Tidur_III,
      "TT Khusus": item.Tempat_Tidur_Khusus,
      "Kunjungan Lama": item.Kunjungan_Pasien_Lama,
      "Kunjungan Baru": item.Kunjungan_Pasien_Baru,
      "Total Kunjungan": item.Total_Kunjungan_Pasien,
      "Jumlah Tindakan": item.Jumlah_Tindakan,
      "Resep Lembar": item.Resep_Lembar_Resep,
      "HR SVIP": item.Hari_Rawat_SVIP,
      "HR VIP": item.Hari_Rawat_VIP,
      "HR Kelas I": item.Hari_Rawat_I,
      "HR Kelas II": item.Hari_Rawat_II,
      "HR Kelas III": item.Hari_Rawat_III,
      "Total Hari Rawat": item.Jumlah_Hari_Rawat,
      "Cucian (kg)": item.Cucian_kg_Cucian,
      "Instrumen Besar": item.Instrumen_Besar,
      "Instrumen Sedang": item.Instrumen_Sedang,
      "Instrumen Kecil": item.Instrumen_Kecil,
      "Set Pack Besar": item.Set_Pack_Besar,
      "Set Pack Sedang": item.Set_Pack_Sedang,
      "Set Pack Kecil": item.Set_Pack_Kecil,
      "Makanan Karyawan": item.Makanan_Karyawan_jml_Porsi,
      "Makanan Pasien": item.Makanan_Pasien_jml_Porsi,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Kegiatan RS");
    const fileName = `Laporan_Data_Kegiatan_RS_${selectedYear}_${
      selectedUnitName === "all" ? "Semua_Unit" : selectedUnitName
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Laporan berhasil diunduh");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Kegiatan RS</h1>
          <p className="text-gray-600 mt-1">
            Kelola data kegiatan operasional rumah sakit dengan fitur otomatisasi perhitungan
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString("id-ID")}</p>
                  <Badge variant="outline" className="mt-2">
                    Computed
                  </Badge>
                </div>
                <stat.icon className={`h-12 w-12 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Aksi</CardTitle>
          <CardDescription>Filter data berdasarkan tahun dan unit kerja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Year Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tahun</label>
              <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Kerja Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Unit Kerja</label>
              <Select value={selectedUnitName} onValueChange={setSelectedUnitName}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {unitKerjaList.map((unit) => (
                    <SelectItem key={unit.id} value={unit.nama}>
                      {unit.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleDownloadReport} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Kegiatan ({data.length} data)</CardTitle>
          <CardDescription>Klik tombol expand untuk melihat detail data yang dikelompokkan</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Tidak ada data untuk tahun {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead className="text-right">Total SDM</TableHead>
                    <TableHead className="text-right">Total Kunjungan</TableHead>
                    <TableHead className="text-right">Total Diklat</TableHead>
                    <TableHead className="text-right">Total Hari Rawat</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpand(item.id!)}
                          >
                            {expandedRows.has(item.id!) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.Nama_Unit_Kerja}
                          <div className="text-xs text-gray-500">{item.Kode_UK}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{item.Jumlah_SDM || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{item.Total_Kunjungan_Pasien || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{item.Total_Diklat || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{item.Jumlah_Hari_Rawat || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(item)}
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id!, item.Nama_Unit_Kerja!)}
                              title="Hapus Data"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(item.id!) && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50">
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {dataGroups.map((group) => (
                                <Card key={group.name}>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold text-teal-700">
                                      {group.name}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    {group.fields.map((field) => (
                                      <div
                                        key={field.key}
                                        className="flex justify-between text-sm"
                                      >
                                        <span className="text-gray-600">{field.label}:</span>
                                        <span className={`font-medium ${field.isComputed ? 'text-blue-600 font-bold' : ''}`}>
                                          {(item[field.key] as number) || 0}
                                          {field.isComputed && (
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              Auto
                                            </Badge>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Tambah Data Kegiatan</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk menambahkan data kegiatan baru
            </DialogDescription>
          </DialogHeader>
          <DataKegiatanAddForm
            onSuccess={() => {
              setIsAddDialogOpen(false);
              loadData();
            }}
            onCancel={() => setIsAddDialogOpen(false)}
            selectedYear={selectedYear}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Data Kegiatan</DialogTitle>
            <DialogDescription>
              {viewingItem?.Nama_Unit_Kerja} - Tahun {viewingItem?.tahun}
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {dataGroups.map((group) => (
                <Card key={group.name}>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.fields.map((field) => (
                      <div key={field.key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{field.label}:</span>
                        <span className={`font-medium ${field.isComputed ? 'text-blue-600 font-bold' : ''}`}>
                          {(viewingItem[field.key] as number) || 0}
                          {field.isComputed && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Auto
                            </Badge>
                          )}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Progress Modal */}
      <ImportProgressModal
        progress={uploadProgress}
        onClose={hideProgress}
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}

