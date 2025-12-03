import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";
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
import Papa from "papaparse";

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
  const [isRefreshingTranspose, setIsRefreshingTranspose] = useState(false);

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
      const { error } = await tenantSupabase.from("data_kegiatan").delete().eq("id", id);

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
      // Tampilkan loading awal tanpa progress bar (sampai kita tahu total data yang akan diupdate)
      const text = await file.text();

      let rawRows: any[] = [];
      (Papa as any).parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => (h || "").trim(),
        complete: async (results: any) => {
          try {
            rawRows = Array.isArray(results.data) ? results.data : [];
            if (rawRows.length === 0) {
              showUploadError("File tidak berisi data");
              return;
            }

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("User tidak ditemukan. Silakan login kembali.");

            const numericKeys = [
              "SDM_dokter","SDM_Perawat","SDM_Non","Jml_jam_Praktek_Harian",
              "Diklat_Jumlah_Siswa","Diklat_Lama_Hari","Listrik_kwh","Air_m3",
              "Telepon_Freq_pakai_per_titik","Komputer_simrs_user","Tempat_Tidur_SVIP",
              "Tempat_Tidur_VIP","Tempat_Tidur_I","Tempat_Tidur_II","Tempat_Tidur_III",
              "Tempat_Tidur_Khusus","kamar_luas_svip","kamar_luas_vip","kamar_luas_i",
              "kamar_luas_ii","kamar_luas_iii","Kunjungan_Pasien_Lama","Kunjungan_Pasien_Baru",
              "Jumlah_Tindakan","Resep_Lembar_Resep","Hari_Rawat_SVIP","Hari_Rawat_VIP",
              "Hari_Rawat_I","Hari_Rawat_II","Hari_Rawat_III","Cucian_kg_Cucian",
              "Instrumen_Besar","Instrumen_Sedang","Instrumen_Kecil","Set_Pack_Besar",
              "Set_Pack_Sedang","Set_Pack_Kecil","Makanan_Karyawan_jml_Porsi",
              "Makanan_Pasien_jml_Porsi","jumlah_porsi_svip","jumlah_porsi_vip",
              "jumlah_porsi_i","jumlah_porsi_ii","jumlah_porsi_iii"
            ];
            const computedKeys = ["Jumlah_SDM","Total_Diklat","Total_Kunjungan_Pasien","Jumlah_Hari_Rawat"];

            const normalized: any[] = [];
            const seen = new Set<string>();
            let missingKeyRows = 0;

            console.log(`[Import] Memulai validasi ${rawRows.length} baris data...`);

            for (const r of rawRows) {
              const row = { ...r } as any;
              const kodeRaw = row["Kode_UK"] ?? row["kode"] ?? row["Kode"] ?? row["kode_uk"];
              const tahunRaw = row["tahun"] ?? row["Tahun"];

              const kode = (kodeRaw !== undefined && kodeRaw !== null) ? String(kodeRaw).trim().toUpperCase() : "";
              const tahunNum = Number(String(tahunRaw ?? selectedYear).toString().trim());

              if (!kode || !Number.isFinite(tahunNum)) { missingKeyRows++; continue; }

              const key = `${kode}-${tahunNum}`;
              if (seen.has(key)) continue;
              seen.add(key);

              const payload: any = { user_id: user.id, Kode_UK: kode, tahun: tahunNum };

              for (const k of numericKeys) {
                if (k in row) {
                  const raw = row[k];
                  const num = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9.-]/g, ''));
                  payload[k] = Number.isFinite(num) ? num : 0;
                }
              }
              if (row["Nama_Unit_Kerja"]) payload["Nama_Unit_Kerja"] = String(row["Nama_Unit_Kerja"]).trim();
              for (const ck of computedKeys) delete payload[ck];

              normalized.push(payload);
            }

            if (normalized.length === 0) {
              const msg = missingKeyRows > 0 ? "Semua baris tidak valid (kolom kode/tahun hilang)." : "Tidak ada baris valid untuk diimpor.";
              console.error(`[Import] ${msg}, missingKeyRows: ${missingKeyRows}`);
              showUploadError(msg);
              return;
            }

            console.log(`[Import] Validasi selesai: ${normalized.length} baris valid dari ${rawRows.length} baris total`);

            updateProgress(Math.floor(rawRows.length * 0.35), 0, 0, "Mengecek data yang sudah ada...");

            const kodeList = [...new Set(normalized.map(x => x.Kode_UK))];
            const tahunList = [...new Set(normalized.map(x => x.tahun))];

            console.log(`[Import] Mengecek existing data untuk ${kodeList.length} kode unik dan ${tahunList.length} tahun:`, { kodeList, tahunList });

            let updateCount = 0;
            let insertCount = 0;

            // Query existing data - get all data for the years (not just user_id) to handle cases where
            // data might have different user_id or null user_id, but still need to be matched
            // This approach handles case-insensitive matching better
            const { data: existing, error: checkErr } = await supabase
              .from("data_kegiatan")
              .select("id, Kode_UK, tahun, user_id")
              .in("tahun", tahunList);

            const existingMap = new Map<string, number>();
            if (!checkErr && Array.isArray(existing)) {
              console.log(`[Import] Query berhasil: ${existing.length} records ditemukan dari database`);
              // Normalize Kode_UK to uppercase when creating map key for case-insensitive matching
              for (const it of existing) {
                if (it.Kode_UK) {
                  const normalizedKode = String(it.Kode_UK).trim().toUpperCase();
                  const key = `${normalizedKode}-${it.tahun}`;
                  // Handle duplicate keys - log warning if duplicate found
                  if (existingMap.has(key)) {
                    console.warn(`[Import] Duplicate key ditemukan: ${key}, id lama: ${existingMap.get(key)}, id baru: ${it.id}`);
                  }
                  existingMap.set(key, it.id as number);
                } else {
                  console.warn(`[Import] Record dengan id ${it.id} tidak memiliki Kode_UK`);
                }
              }
              console.log(`[Import] Existing map dibuat: ${existingMap.size} entries`);
              console.log(`[Import] Sample keys:`, Array.from(existingMap.keys()).slice(0, 5));
            } else if (checkErr) {
              console.error("[Import] Error checking existing data:", checkErr);
            }

            const rowsToUpdate: any[] = [];
            let rowsToInsert: any[] = [];

            for (const item of normalized) {
              // Normalize Kode_UK to uppercase for consistent key matching
              const normalizedKode = String(item.Kode_UK || '').trim().toUpperCase();
              const key2 = `${normalizedKode}-${item.tahun}`;
              const existingId = existingMap.get(key2);
              
              if (existingId) {
                console.log(`[Import] Data existing ditemukan: ${key2} -> id: ${existingId}`);
                const { user_id, tahun, Kode_UK, ...payload } = item;
                // Update-only: simpan matcher tahun+Kode_UK (normalized uppercase), bukan id
                rowsToUpdate.push({ tahun: item.tahun, Kode_UK: normalizedKode, payload });
              } else {
                // Update-only mode: jangan insert data baru
                console.log(`[Import] Mode update-only: baris ${key2} akan dilewati karena tidak ditemukan`);
              }
            }
            
            console.log(`[Import] Akan update ${rowsToUpdate.length} data (update-only mode)`);
            if (rowsToUpdate.length > 0) {
              console.log(`[Import] Sample update matches:`, rowsToUpdate.slice(0, 3).map(r => ({ tahun: r.tahun, Kode_UK: r.Kode_UK })));
            }

            updateCount = rowsToUpdate.length;
            insertCount = 0; // Update-only mode: tidak ada insert

            // Start upload dengan total yang benar setelah rowsToUpdate ditentukan
            if (updateCount === 0) {
              showUploadError("Tidak ada data yang akan diupdate. Pastikan data dengan tahun dan Kode_UK yang sama sudah ada di database.");
              return;
            }

            // Inisialisasi progress modal dengan total yang benar
            startUpload(updateCount, "Memulai proses update data...");
            updateProgress(0, 0, 0, `Siap memperbarui ${updateCount} data...`);

            let successCount = 0;
            let errorCount = 0;

            // Disable trigger otomatis sebelum update
            console.log(`[Import] Menonaktifkan trigger otomatis...`);
            let triggersDisabled = false;
            try {
              const { error: disableError } = await supabase.rpc('disable_data_kegiatan_triggers');
              if (disableError) {
                console.warn(`[Import] Warning: Gagal menonaktifkan trigger (mungkin tidak ada):`, disableError);
                // Continue anyway - mungkin trigger tidak ada atau sudah dinonaktifkan
              } else {
                triggersDisabled = true;
                console.log(`[Import] Trigger otomatis berhasil dinonaktifkan`);
              }
            } catch (err: any) {
              console.warn(`[Import] Warning: Error saat menonaktifkan trigger:`, err);
              // Continue anyway
            }

            if (rowsToUpdate.length > 0) {
              console.log(`[Import] Memulai update ${rowsToUpdate.length} data...`);
              for (let i = 0; i < rowsToUpdate.length; i++) {
                const { tahun, Kode_UK, payload } = rowsToUpdate[i];
                // Kode_UK sudah dinormalisasi saat menyimpan ke rowsToUpdate
                console.log(`[Import] Updating row ${i + 1}/${rowsToUpdate.length}: match={tahun:${tahun}, Kode_UK:${Kode_UK}}, payload keys:`, Object.keys(payload));

                // Update progress sebelum update
                const progressPercentage = Math.floor(((i + 1) / rowsToUpdate.length) * 100);
                updateProgress(
                  i + 1, 
                  successCount, 
                  errorCount, 
                  `Memperbarui data ${i + 1} dari ${rowsToUpdate.length} (${progressPercentage}%)`
                );

                const { error } = await supabase
                  .from("data_kegiatan")
                  .update(payload)
                  .match({ tahun, Kode_UK });

                if (error) {
                  console.error(`[Import] Error updating row ${i + 1} (match tahun=${tahun}, Kode_UK=${Kode_UK}):`, {
                    message: (error as any).message,
                    details: (error as any).details,
                    hint: (error as any).hint,
                    code: (error as any).code,
                  });
                  errorCount++;
                } else {
                  console.log(`[Import] Successfully updated row ${i + 1} (tahun=${tahun}, Kode_UK=${Kode_UK})`);
                  successCount++;
                }
                
                // Update progress setelah update dengan hasil
                updateProgress(
                  i + 1, 
                  successCount, 
                  errorCount, 
                  `Memperbarui data ${i + 1} dari ${rowsToUpdate.length} - ${successCount} berhasil, ${errorCount} gagal`
                );
              }
              console.log(`[Import] Update selesai: ${successCount} berhasil, ${errorCount} gagal`);
            }

            // Re-enable trigger otomatis setelah update selesai
            if (triggersDisabled) {
              console.log(`[Import] Mengaktifkan kembali trigger otomatis...`);
              try {
                const { error: enableError } = await supabase.rpc('reenable_data_kegiatan_triggers');
                if (enableError) {
                  console.error(`[Import] Error: Gagal mengaktifkan kembali trigger:`, enableError);
                  toast.error(`Import selesai, tapi gagal mengaktifkan kembali trigger otomatis. Silakan aktifkan manual.`);
                } else {
                  console.log(`[Import] Trigger otomatis berhasil diaktifkan kembali`);
                }
              } catch (err: any) {
                console.error(`[Import] Error saat mengaktifkan kembali trigger:`, err);
                toast.error(`Import selesai, tapi gagal mengaktifkan kembali trigger otomatis. Silakan aktifkan manual.`);
              }
            }

            // Update-only mode: pastikan tidak ada proses insert
            rowsToInsert = [];

            const finalMessage = updateCount > 0 && insertCount > 0
              ? `Berhasil memperbarui ${updateCount} dan menambahkan ${insertCount} data!`
              : updateCount > 0
              ? `Berhasil memperbarui ${updateCount} data!`
              : `Berhasil menambahkan ${insertCount} data!`;

            console.log(`[Import] Proses selesai - Success: ${successCount}, Failed: ${errorCount}, Total: ${rawRows.length}`);
            console.log(`[Import] Update: ${updateCount}, Insert: ${insertCount}`);

            // Update progress dengan hasil final
            updateProgress(updateCount, successCount, errorCount, finalMessage);
            
            // Complete upload untuk menampilkan hasil di modal
            completeUpload(successCount, errorCount, 0);
            
            // Tampilkan notifikasi setelah progress modal selesai ditampilkan
            setTimeout(() => {
              if (errorCount === 0) {
                toast.success(finalMessage, {
                  duration: 5000,
                  description: `Semua ${successCount} data berhasil diupdate.`
                });
                console.log(`[Import] Import berhasil: ${finalMessage}`);
              } else if (successCount > 0) {
                toast.warning(`${finalMessage} (dengan ${errorCount} gagal)`, {
                  duration: 6000,
                  description: `${successCount} data berhasil, ${errorCount} data gagal diupdate.`
                });
                console.warn(`[Import] Import selesai dengan error: ${finalMessage} (${errorCount} gagal)`);
              } else {
                toast.error(`Import gagal seluruhnya.`, {
                  duration: 8000,
                  description: `Semua ${errorCount} data gagal diupdate. Silakan periksa file CSV dan coba lagi.`
                });
                console.error(`[Import] Import gagal seluruhnya - ${errorCount} error`);
              }
              
              // Reload data setelah notifikasi
              loadData();
            }, 1500);
          } catch (err: any) {
            console.error("Error importing CSV:", err);
            const msg = err?.message || "Gagal mengimpor data";
            updateProgress(rawRows.length || 1, 0, rawRows.length || 1, msg);
            setTimeout(() => { showUploadError(msg); toast.error(msg, { duration: 6000 }); }, 300);
          } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        },
        error: (e: any) => {
          const msg = `Gagal membaca CSV: ${e.message}`;
          showUploadError(msg);
          toast.error(msg);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      });
    } catch (error: any) {
      const msg = error?.message || "Gagal membaca file";
      showUploadError(msg);
      toast.error(msg);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePerbaruiData = async () => {
    setIsRefreshingTranspose(true);
    try {
      console.log("🔄 Memulai proses perbarui data transpose...");
      
      // Coba gunakan fungsi dengan status terlebih dahulu, jika tidak ada gunakan yang void
      const { data, error } = await supabase.rpc('refresh_transpose_data_with_status', {});

      if (error) {
        console.warn("⚠️ Fungsi dengan status tidak tersedia atau error, mencoba fungsi void:", error);
        
        // Jika fungsi dengan status tidak ada, coba fungsi void
        const { error: voidError } = await supabase.rpc('refresh_transpose_data', {});
        
        if (voidError) {
          console.error("❌ Error dari fungsi void:", voidError);
          
          // Extract error message dengan lebih detail
          let errorMessage = "Gagal memperbarui data transpose";
          
          if (voidError.message) {
            errorMessage = voidError.message;
            console.error("Error message:", voidError.message);
          }
          if (voidError.details) {
            console.error("Error details:", voidError.details);
            errorMessage += ` - ${voidError.details}`;
          }
          if (voidError.hint) {
            console.error("Error hint:", voidError.hint);
            errorMessage += ` (${voidError.hint})`;
          }
          
          // Deteksi error spesifik
          if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('cancel')) {
            errorMessage = "Proses membutuhkan waktu lebih lama dan terhenti. Silakan tunggu beberapa saat dan coba lagi.";
          } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('denied')) {
            errorMessage = "Tidak memiliki izin untuk melakukan operasi ini. Silakan hubungi administrator.";
          }
          
          toast.error(errorMessage);
          return;
        }
        
        // Jika void berhasil
        console.log("✅ Data berhasil diperbarui menggunakan fungsi void");
        toast.success("Data kegiatan transpose berhasil diperbarui");
        await loadData();
        return;
      }

      // Jika fungsi dengan status berhasil
      console.log("📊 Response dari fungsi dengan status:", data);
      
      if (data && typeof data === 'object') {
        if (data.success === false) {
          const errorMsg = data.message || data.error || "Gagal memperbarui data transpose";
          console.error("❌ Error dari fungsi:", errorMsg);
          throw new Error(errorMsg);
        }
        
        const duration = data.duration_seconds ? ` (${Math.round(data.duration_seconds)}s)` : '';
        console.log(`✅ Data berhasil diperbarui${duration}`);
        toast.success(`Data kegiatan transpose berhasil diperbarui${duration}`);
      } else {
        console.log("✅ Data berhasil diperbarui (tidak ada detail)");
        toast.success("Data kegiatan transpose berhasil diperbarui");
      }
      
      // Reload data untuk memastikan UI ter-update
      await loadData();
    } catch (error: any) {
      console.error("❌ Error refreshing transpose data:", error);
      
      let errorMessage = "Gagal memperbarui data transpose. Silakan coba lagi.";
      
      if (error?.message) {
        errorMessage = error.message;
        console.error("Error message:", error.message);
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Log semua detail error untuk debugging
      if (error) {
        console.error("Full error object:", JSON.stringify(error, null, 2));
      }
      
      // Deteksi error spesifik
      if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('cancel')) {
        errorMessage = "Proses membutuhkan waktu lebih lama dan terhenti. Silakan tunggu beberapa saat dan coba lagi.";
      } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('denied')) {
        errorMessage = "Tidak memiliki izin untuk melakukan operasi ini. Silakan hubungi administrator.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRefreshingTranspose(false);
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
              <Button
                onClick={handleDownloadTemplate}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Unduh Template Impor
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Impor Data
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
              <Button
                onClick={handleDownloadReport}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
              <Button
                onClick={handlePerbaruiData}
                size="icon"
                disabled={isRefreshingTranspose}
                className="bg-slate-200 hover:bg-slate-300 text-teal-700 disabled:opacity-70"
                title="Perbarui Data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingTranspose ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Kegiatan</CardTitle>
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
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="w-12 text-white"></TableHead>
                    <TableHead className="text-white">Unit Kerja</TableHead>
                    <TableHead className="text-right text-white">Total SDM</TableHead>
                    <TableHead className="text-right text-white">Total Kunjungan</TableHead>
                    <TableHead className="text-right text-white">Total Diklat</TableHead>
                    <TableHead className="text-right text-white">Total Hari Rawat</TableHead>
                    <TableHead className="text-center text-white">Aksi</TableHead>
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
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id!, item.Nama_Unit_Kerja!)}
                              title="Hapus Data"
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
        accept=".csv"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}

