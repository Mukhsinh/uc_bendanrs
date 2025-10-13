"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFormOperations } from "@/hooks/use-form-operations";
import { showError } from "@/utils/notifications";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

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
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { testSupabaseConnection, testAuthStatus } from "@/test-supabase";

interface Biaya {
  id: string;
  user_id: string;
  tahun: number;
  unit_kerja_id: string | null;
  unit_kerja?: {
    id: string;
    kode: string;
    nama: string;
    kategori: string;
  };
  biaya_gaji_tunjangan: number | null;
  biaya_jasa_pelayanan: number | null;
  biaya_obat: number | null;
  biaya_bhp: number | null;
  biaya_makan_karyawan: number | null;
  biaya_makan_pasien: number | null;
  biaya_rumah_tangga: number | null;
  biaya_cetak: number | null;
  biaya_atk: number | null;
  biaya_listrik: number | null;
  biaya_air: number | null;
  biaya_telp: number | null;
  biaya_pemeliharaan_bangunan: number | null;
  biaya_pemeliharaan_alat_medis: number | null;
  biaya_pemeliharaan_alat_non_medis: number | null;
  biaya_operasional_lainnya: number | null;
  biaya_penyusutan_gedung: number | null;
  biaya_penyusutan_jaringan: number | null;
  biaya_penyusutan_alat_medis: number | null;
  biaya_penyusutan_alat_non_medis: number | null;
  biaya_pendidikan_pelatihan: number | null;
  // Computed fields (automatically calculated by database)
  biaya_bahan: number | null;
  biaya_pegawai: number | null;
  biaya_daya: number | null;
  biaya_pemeliharaan: number | null;
  biaya_penyusutan: number | null;
  total_biaya: number | null;
  total_biaya_tanpa_jp: number | null;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  tahun: z.coerce.number().min(1900, { message: "Tahun harus valid." }),
  unit_kerja_id: z.string().optional().nullable(),
  biaya_gaji_tunjangan: z.coerce.number().min(0).optional(),
  biaya_jasa_pelayanan: z.coerce.number().min(0).optional(),
  biaya_obat: z.coerce.number().min(0).optional(),
  biaya_bhp: z.coerce.number().min(0).optional(),
  biaya_makan_karyawan: z.coerce.number().min(0).optional(),
  biaya_makan_pasien: z.coerce.number().min(0).optional(),
  biaya_rumah_tangga: z.coerce.number().min(0).optional(),
  biaya_cetak: z.coerce.number().min(0).optional(),
  biaya_atk: z.coerce.number().min(0).optional(),
  biaya_listrik: z.coerce.number().min(0).optional(),
  biaya_air: z.coerce.number().min(0).optional(),
  biaya_telp: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_bangunan: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_alat_medis: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_alat_non_medis: z.coerce.number().min(0).optional(),
  biaya_operasional_lainnya: z.coerce.number().min(0).optional(),
  biaya_penyusutan_gedung: z.coerce.number().min(0).optional(),
  biaya_penyusutan_jaringan: z.coerce.number().min(0).optional(),
  biaya_penyusutan_alat_medis: z.coerce.number().min(0).optional(),
  biaya_penyusutan_alat_non_medis: z.coerce.number().min(0).optional(),
  biaya_pendidikan_pelatihan: z.coerce.number().min(0).optional(),
});

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

const BiayaFormTable: React.FC = () => {
  const [biayaList, setBiayaList] = useState<Biaya[]>([]);
  
  // Debug: Log biayaList changes
  useEffect(() => {
    console.log('biayaList state updated:', biayaList.length, 'records');
    if (biayaList.length > 0) {
      console.log('First record:', biayaList[0]);
    }
  }, [biayaList]);
  
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingBiaya, setEditingBiaya] = useState<Biaya | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [biayaPreference, setBiayaPreference] = useState<'total_biaya' | 'total_biaya_tanpa_jp'>('total_biaya');
  const [updatingPreference, setUpdatingPreference] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, saveData, deleteData } = useFormOperations({
    entityName: "Biaya",
    onSuccess: () => {
      setEditingBiaya(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tahun: new Date().getFullYear(),
      unit_kerja_id: null,
      biaya_gaji_tunjangan: 0,
      biaya_jasa_pelayanan: 0,
      biaya_obat: 0,
      biaya_bhp: 0,
      biaya_makan_karyawan: 0,
      biaya_makan_pasien: 0,
      biaya_rumah_tangga: 0,
      biaya_cetak: 0,
      biaya_atk: 0,
      biaya_listrik: 0,
      biaya_air: 0,
      biaya_telp: 0,
      biaya_pemeliharaan_bangunan: 0,
      biaya_pemeliharaan_alat_medis: 0,
      biaya_pemeliharaan_alat_non_medis: 0,
      biaya_operasional_lainnya: 0,
      biaya_penyusutan_gedung: 0,
      biaya_penyusutan_jaringan: 0,
      biaya_penyusutan_alat_medis: 0,
      biaya_penyusutan_alat_non_medis: 0,
      biaya_pendidikan_pelatihan: 0,
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('=== BIYA FORM TABLE INITIALIZATION ===');
        
        // Run comprehensive tests
        await testSupabaseConnection();
        await testAuthStatus();
        
        console.log('Checking Supabase auth session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Error mendapatkan sesi: ' + sessionError.message);
          return;
        }
        
        console.log('Current session:', session);
        console.log('Session user:', session?.user);
        
        if (session?.user) {
          console.log('User ID:', session.user.id);
          console.log('User email:', session.user.email);
          setUserId(session.user.id);
          await fetchBiaya(session.user.id);
          await fetchUnitKerja();
          await loadBiayaPreference(session.user.id);
        } else {
          console.log('No active session found');
          console.log('This means user needs to login first');
          // Don't show error immediately, let the loading state handle it
        }
        
        console.log('=== END BIYA FORM TABLE INITIALIZATION ===');
      } catch (error) {
        console.error('Error fetching user session:', error);
        toast.error('Terjadi kesalahan saat memuat sesi pengguna.');
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (editingBiaya) {
      form.reset({
        tahun: editingBiaya.tahun,
        unit_kerja_id: editingBiaya.unit_kerja_id || null,
        biaya_gaji_tunjangan: editingBiaya.biaya_gaji_tunjangan || 0,
        biaya_jasa_pelayanan: editingBiaya.biaya_jasa_pelayanan || 0,
        biaya_obat: editingBiaya.biaya_obat || 0,
        biaya_bhp: editingBiaya.biaya_bhp || 0,
        biaya_makan_karyawan: editingBiaya.biaya_makan_karyawan || 0,
        biaya_makan_pasien: editingBiaya.biaya_makan_pasien || 0,
        biaya_rumah_tangga: editingBiaya.biaya_rumah_tangga || 0,
        biaya_cetak: editingBiaya.biaya_cetak || 0,
        biaya_atk: editingBiaya.biaya_atk || 0,
        biaya_listrik: editingBiaya.biaya_listrik || 0,
        biaya_air: editingBiaya.biaya_air || 0,
        biaya_telp: editingBiaya.biaya_telp || 0,
        biaya_pemeliharaan_bangunan: editingBiaya.biaya_pemeliharaan_bangunan || 0,
        biaya_pemeliharaan_alat_medis: editingBiaya.biaya_pemeliharaan_alat_medis || 0,
        biaya_pemeliharaan_alat_non_medis: editingBiaya.biaya_pemeliharaan_alat_non_medis || 0,
        biaya_operasional_lainnya: editingBiaya.biaya_operasional_lainnya || 0,
        biaya_penyusutan_gedung: editingBiaya.biaya_penyusutan_gedung || 0,
        biaya_penyusutan_jaringan: editingBiaya.biaya_penyusutan_jaringan || 0,
        biaya_penyusutan_alat_medis: editingBiaya.biaya_penyusutan_alat_medis || 0,
        biaya_penyusutan_alat_non_medis: editingBiaya.biaya_penyusutan_alat_non_medis || 0,
        biaya_pendidikan_pelatihan: editingBiaya.biaya_pendidikan_pelatihan || 0,
      });
    } else {
      form.reset({
        tahun: new Date().getFullYear(),
        unit_kerja_id: null,
        biaya_gaji_tunjangan: 0,
        biaya_jasa_pelayanan: 0,
        biaya_obat: 0,
        biaya_bhp: 0,
        biaya_makan_karyawan: 0,
        biaya_makan_pasien: 0,
        biaya_rumah_tangga: 0,
        biaya_cetak: 0,
        biaya_atk: 0,
        biaya_listrik: 0,
        biaya_air: 0,
        biaya_telp: 0,
        biaya_pemeliharaan_bangunan: 0,
        biaya_pemeliharaan_alat_medis: 0,
        biaya_pemeliharaan_alat_non_medis: 0,
        biaya_operasional_lainnya: 0,
        biaya_penyusutan_gedung: 0,
        biaya_penyusutan_jaringan: 0,
        biaya_penyusutan_alat_medis: 0,
        biaya_penyusutan_alat_non_medis: 0,
        biaya_pendidikan_pelatihan: 0,
      });
    }
  }, [editingBiaya, form]);

  const fetchBiaya = async (currentUserId: string) => {
    console.log('Starting fetchBiaya for user:', currentUserId);
    
    try {
      // First, get all biaya data
      const { data: biayaData, error: biayaError } = await supabase
        .from('data_biaya')
        .select('*')
        .eq('user_id', currentUserId)
        .order('tahun', { ascending: false });

      if (biayaError) {
        console.error('Error fetching biaya data:', biayaError);
        console.error('Error details:', {
          message: biayaError.message,
          details: biayaError.details,
          hint: biayaError.hint,
          code: biayaError.code
        });
        toast.error('Gagal memuat data biaya: ' + biayaError.message);
        return;
      }

      if (!biayaData || biayaData.length === 0) {
        console.log('No biaya data found for user:', currentUserId);
        console.log('This might be due to RLS policies or no data exists for this user');
        setBiayaList([]);
        toast.info('Tidak ada data biaya untuk pengguna ini. Silakan tambahkan data baru.');
        return;
      }

      console.log('Raw biaya data:', biayaData);

      // Get unique unit_kerja_ids
      const unitKerjaIds = [...new Set(biayaData.map(item => item.unit_kerja_id).filter(Boolean))];
      console.log('Unit kerja IDs:', unitKerjaIds);
      
      // Fetch unit kerja data if there are any unit_kerja_ids
      let unitKerjaMap = new Map();
      if (unitKerjaIds.length > 0) {
        const { data: unitKerjaData, error: unitKerjaError } = await supabase
          .from('unit_kerja')
          .select('id, kode, nama, kategori')
          .in('id', unitKerjaIds);

        if (unitKerjaError) {
          console.error('Error fetching unit kerja data:', unitKerjaError);
          // Continue without unit kerja data
        } else {
          unitKerjaMap = new Map(unitKerjaData?.map(uk => [uk.id, uk]) || []);
          console.log('Unit kerja map:', unitKerjaMap);
        }
      }

      // Combine the data
      const combinedData = biayaData.map(biaya => ({
        ...biaya,
        unit_kerja: biaya.unit_kerja_id ? unitKerjaMap.get(biaya.unit_kerja_id) : null
      }));

      console.log('Fetched biaya data:', combinedData);
      console.log('Setting biayaList with', combinedData.length, 'records');
      setBiayaList(combinedData);
    } catch (error) {
      console.error('Unexpected error in fetchBiaya:', error);
      toast.error('Terjadi kesalahan saat memuat data biaya');
    }
  };

  const fetchUnitKerja = async () => {
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('id, kode, nama, kategori')
      .order('nama', { ascending: true });

    if (error) {
      toast.error("Gagal memuat data unit kerja.");
      console.error(error);
    } else {
      setUnitKerjaList(data || []);
    }
  };

  const loadBiayaPreference = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_biaya_preference', {
        p_user_id: currentUserId
      });
      if (error) {
        console.error('Error loading biaya preference:', error);
        return;
      }
      if (data && data.success && data.current_preference) {
        setBiayaPreference(data.current_preference === 'total_biaya_tanpa_jp' ? 'total_biaya_tanpa_jp' : 'total_biaya');
      }
    } catch (err) {
      console.error('Unexpected error loading biaya preference:', err);
    }
  };

  const handleSetBiayaPreference = async (type: 'total_biaya' | 'total_biaya_tanpa_jp') => {
    if (!userId) {
      showError('User tidak ditemukan. Silakan login kembali.');
      return;
    }
    try {
      setUpdatingPreference(true);
      const { data, error } = await supabase.rpc('set_biaya_preference_and_update', {
        p_user_id: userId,
        p_biaya_type: type
      });
      if (error) throw error;
      if (data && data.success) {
        setBiayaPreference(type);
        // Update eksplisit untuk tahun aktif agar kolom biaya_tahunan di distribusi_biaya_pertama ikut berubah
        const activeYear = biayaList[0]?.tahun ?? new Date().getFullYear();
        await supabase.rpc('update_distribusi_biaya_pertama_biaya_tahunan', {
          biaya_type: type,
          p_user_id: userId,
          p_tahun: activeYear
        });
        toast.success(`Biaya tahunan berhasil diupdate menggunakan ${type === 'total_biaya' ? 'Total Biaya' : 'Total Biaya Tanpa JP'}`);
      } else {
        toast.error(data?.message || 'Gagal memperbarui preferensi biaya.');
      }
    } catch (err: any) {
      console.error('Error updating biaya preference:', err);
      toast.error('Gagal memperbarui preferensi biaya: ' + (err?.message || 'Unknown error'));
    } finally {
      setUpdatingPreference(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      showError("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    await saveData(async () => {
      if (editingBiaya) {
        const { error } = await supabase
          .from('data_biaya')
          .update({ 
            ...values, 
            user_id: userId,
            unit_kerja_id: values.unit_kerja_id || null
          })
          .eq('id', editingBiaya.id);

        if (error) throw error;
      } else {
        // Check if tahun already exists for this user and unit kerja
        const { data: existingData, error: checkError } = await supabase
          .from('data_biaya')
          .select('id')
          .eq('tahun', values.tahun)
          .eq('user_id', userId)
          .eq('unit_kerja_id', values.unit_kerja_id || null)
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingData) {
          throw new Error("Data biaya untuk tahun dan unit kerja ini sudah ada.");
        }

        const { error } = await supabase
          .from('data_biaya')
          .insert([{ 
            ...values, 
            user_id: userId,
            unit_kerja_id: values.unit_kerja_id || null
          }]);

        if (error) throw error;
      }
      
      await fetchBiaya(userId);
    }, {
      loadingMessage: editingBiaya ? "Memperbarui data biaya..." : "Menyimpan data biaya...",
      successMessage: editingBiaya ? "Data biaya berhasil diperbarui" : "Data biaya berhasil ditambahkan"
    });
  };

  const handleEdit = (biaya: Biaya) => {
    setEditingBiaya(biaya);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteData(async () => {
      const { error } = await supabase
        .from('data_biaya')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (userId) await fetchBiaya(userId);
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      file.text().then((text) => {
        // Reset file input
        event.target.value = '';
        
        if (!text || text.trim().length === 0) {
          showUploadError("File CSV kosong atau tidak dapat dibaca.");
          return;
        }
        (Papa as any).parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header ? header.trim() : "",
          transform: (value: string) => value ? value.trim() : "",
          complete: async (results: Papa.ParseResult<any>) => {
            try {
              // Validate results
              if (!results || !results.data) {
                showUploadError("File CSV tidak valid atau kosong.");
                return;
              }

              const allRows = results.data;
              const totalRows = allRows.length;
              
              if (totalRows === 0) {
                showUploadError("Tidak ada data dalam file CSV.");
                return;
              }
              
              // Start upload progress
              startUpload(totalRows, "Sedang mengimpor data biaya...");
              
              const importedData: any[] = [];
              const duplicateYears: number[] = [];
              let processedCount = 0;
              let successCount = 0;
              let errorCount = 0;
              
              for (const row of results.data) {
                processedCount++;
                updateProgress(processedCount, successCount, errorCount);
                
                // Skip empty rows
                if (!row || Object.keys(row).length === 0) {
                  continue;
                }
                
                // Debug logging for troubleshooting
                if (processedCount <= 3) {
                  console.log(`Processing row ${processedCount}:`, row);
                }
                
                const tahun = parseInt(row["Tahun"] || "0");
                const kodeUnitKerja = row["Kode Unit Kerja"] ? row["Kode Unit Kerja"].toString().trim() : "";
                
                if (isNaN(tahun) || tahun <= 0) {
                  errorCount++;
                  continue;
                }
                
                // Find unit kerja by kode
                let unitKerjaId = null;
                if (kodeUnitKerja) {
                  const unitKerja = unitKerjaList.find(uk => uk.kode === kodeUnitKerja);
                  if (unitKerja) {
                    unitKerjaId = unitKerja.id;
                  }
                }
                
                // Skip duplicate check per row - will be handled after processing all data
                
                // Check if tahun and unit_kerja_id combination already exists in this import batch
                const isDuplicateInBatch = importedData.some(item => 
                  item.tahun === tahun && item.unit_kerja_id === unitKerjaId
                );
                if (isDuplicateInBatch) {
                  duplicateYears.push(tahun);
                  errorCount++;
                  continue;
                }
                
                // Helper function to safely parse float values
                const safeParseFloat = (value: any): number => {
                  if (value === null || value === undefined || value === "") return 0;
                  const parsed = parseFloat(value.toString());
                  return isNaN(parsed) ? 0 : parsed;
                };

                importedData.push({
                  tahun,
                  unit_kerja_id: unitKerjaId,
                  biaya_gaji_tunjangan: safeParseFloat(row["Biaya Gaji dan Tunjangan"]),
                  biaya_jasa_pelayanan: safeParseFloat(row["Biaya Jasa Pelayanan"]),
                  biaya_pendidikan_pelatihan: safeParseFloat(row["Biaya Pendidikan dan Pelatihan"]),
                  biaya_obat: safeParseFloat(row["Biaya Obat"]),
                  biaya_bhp: safeParseFloat(row["Biaya BHP"]),
                  biaya_makan_karyawan: safeParseFloat(row["Biaya Bahan Makanan Karyawan"]),
                  biaya_makan_pasien: safeParseFloat(row["Biaya Bahan Makanan Pasien"]),
                  biaya_rumah_tangga: safeParseFloat(row["Biaya Alat Rumah Tangga"]),
                  biaya_cetak: safeParseFloat(row["Biaya Cetak"]),
                  biaya_atk: safeParseFloat(row["Biaya Alat Tulis Kantor"]),
                  biaya_listrik: safeParseFloat(row["Biaya Listrik"]),
                  biaya_air: safeParseFloat(row["Biaya Air"]),
                  biaya_telp: safeParseFloat(row["Biaya Telepon"]),
                  biaya_pemeliharaan_bangunan: safeParseFloat(row["Biaya Pemeliharaan Gedung dan Bangunan"]),
                  biaya_pemeliharaan_alat_medis: safeParseFloat(row["Biaya Pemeliharaan Alat Medis"]),
                  biaya_pemeliharaan_alat_non_medis: safeParseFloat(row["Biaya Pemeliharaan Alat Non Medis"]),
                  biaya_operasional_lainnya: safeParseFloat(row["Biaya Operasional Lainnya"]),
                  biaya_penyusutan_gedung: safeParseFloat(row["Biaya Penyusutan Gedung dan Bangunan"]),
                  biaya_penyusutan_jaringan: safeParseFloat(row["Biaya Penyusutan Jaringan"]),
                  biaya_penyusutan_alat_medis: safeParseFloat(row["Biaya Penyusutan Alat Medis"]),
                  biaya_penyusutan_alat_non_medis: safeParseFloat(row["Biaya Penyusutan Alat Non Medis"]),
                  user_id: userId,
                });
                successCount++;
              }
              
              // Remove duplicate check here since we handle it after bulk check
              
              if (importedData.length === 0) {
                showUploadError("Tidak ada data valid untuk diimpor.");
                return;
              }

              // Bulk check for existing data to avoid duplicates
              const tahunList = [...new Set(importedData.map(item => item.tahun))];
              const unitKerjaIdList = [...new Set(importedData.map(item => item.unit_kerja_id).filter(id => id))];
              
              const { data: existingData, error: checkError } = await supabase
                .from('data_biaya')
                .select('tahun, unit_kerja_id')
                .eq('user_id', userId)
                .in('tahun', tahunList)
                .in('unit_kerja_id', unitKerjaIdList);
              
              if (checkError) {
                showUploadError(`Gagal memeriksa data yang sudah ada: ${checkError.message}`);
                return;
              }
              
              // Filter out duplicates
              const existingCombinations = new Set(
                existingData?.map(item => `${item.tahun}-${item.unit_kerja_id}`) || []
              );
              
              const filteredData = importedData.filter(item => {
                const combination = `${item.tahun}-${item.unit_kerja_id}`;
                if (existingCombinations.has(combination)) {
                  duplicateYears.push(item.tahun);
                  return false;
                }
                return true;
              });
              
              if (filteredData.length === 0) {
                showUploadError(`Semua data untuk tahun berikut sudah ada: ${[...new Set(duplicateYears)].join(", ")}`);
                return;
              }

              // Insert data to database in batches to avoid timeout
              const batchSize = 50; // Process 50 records at a time
              let totalInserted = 0;
              
              for (let i = 0; i < filteredData.length; i += batchSize) {
                const batch = filteredData.slice(i, i + batchSize);
                
                const { error } = await supabase
                  .from('data_biaya')
                  .insert(batch);

                if (error) throw error;
                
                totalInserted += batch.length;
                
                // Update progress for batch processing
                updateProgress(processedCount, totalInserted, errorCount);
                
                // Small delay between batches to prevent overwhelming the database
                if (i + batchSize < filteredData.length) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }
              
              // Complete upload with final counts
              const finalDuplicateCount = [...new Set(duplicateYears)].length;
              completeUpload(filteredData.length, errorCount, finalDuplicateCount);
              
              // Refresh data
              if (userId) await fetchBiaya(userId);
            } catch (error: any) {
              console.error(error);
              showUploadError(`Gagal mengimpor data: ${error.message}`);
            }
          },
          error: (error: Papa.ParseError) => {
            console.error("Papa Parse Error:", error);
            showUploadError(`Gagal mengimpor data: ${error.message || "Format file CSV tidak valid"}`);
          }
        });
      }).catch((error) => {
        console.error("File reading error:", error);
        showUploadError("Gagal membaca file CSV. Pastikan file tidak rusak dan formatnya benar.");
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      let dataToUse = unitKerjaList;
      
      // If no data loaded, fetch it
      if (dataToUse.length === 0) {
        toast.info("Memuat data unit kerja...");
        const { data, error } = await supabase
          .from('unit_kerja')
          .select('id, kode, nama, kategori')
          .order('nama', { ascending: true });

        if (error) {
          toast.error("Gagal memuat data unit kerja.");
          return;
        }
        
        dataToUse = data || [];
        setUnitKerjaList(dataToUse);
      }

      // Create template with unit kerja data
      const templateData = dataToUse.map(unitKerja => ({
        "Kode Unit Kerja": unitKerja.kode,
        "Nama Unit Kerja": unitKerja.nama,
        "Kategori Unit Kerja": unitKerja.kategori,
        "Tahun": new Date().getFullYear(),
        "Biaya Obat": 0,
        "Biaya BHP": 0,
        "Biaya Bahan Makanan Karyawan": 0,
        "Biaya Bahan Makanan Pasien": 0,
        "Biaya Alat Rumah Tangga": 0,
        "Biaya Alat Tulis Kantor": 0,
        "Biaya Cetak": 0,
        "Biaya Gaji dan Tunjangan": 0,
        "Biaya Jasa Pelayanan": 0,
        "Biaya Pendidikan dan Pelatihan": 0,
        "Biaya Air": 0,
        "Biaya Listrik": 0,
        "Biaya Telepon": 0,
        "Biaya Pemeliharaan Gedung dan Bangunan": 0,
        "Biaya Pemeliharaan Alat Medis": 0,
        "Biaya Pemeliharaan Alat Non Medis": 0,
        "Biaya Penyusutan Gedung dan Bangunan": 0,
        "Biaya Penyusutan Jaringan": 0,
        "Biaya Penyusutan Alat Medis": 0,
        "Biaya Penyusutan Alat Non Medis": 0,
        "Biaya Operasional Lainnya": 0
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Data Biaya");
      XLSX.writeFile(wb, `template_data_biaya_${new Date().getFullYear()}_dengan_data_master.xlsx`);
      toast.success(`Template impor data berhasil diunduh dengan ${dataToUse.length} unit kerja.`);
      
    } catch (error) {
      console.error("Error in handleDownloadTemplate:", error);
      toast.error("Gagal mengunduh template.");
    }
  };

  const handleDownloadReport = () => {
    if (biayaList.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan.");
      return;
    }

    const dataToExport = biayaList.map(item => ({
      "Tahun": item.tahun,
      "Unit Kerja": item.unit_kerja ? `${item.unit_kerja.kode} - ${item.unit_kerja.nama}` : "Semua Unit Kerja",
      "Kategori Unit Kerja": item.unit_kerja?.kategori || "",
      // Computed totals
      "Total Biaya Bahan": item.biaya_bahan || 0,
      "Total Biaya Pegawai": item.biaya_pegawai || 0,
      "Total Biaya Daya": item.biaya_daya || 0,
      "Total Biaya Pemeliharaan": item.biaya_pemeliharaan || 0,
      "Total Biaya Penyusutan": item.biaya_penyusutan || 0,
      "Total Biaya Operasional Lainnya": item.biaya_operasional_lainnya || 0,
      "Total Biaya Keseluruhan": item.total_biaya || 0,
      "Total Biaya Tanpa Jasa Pelayanan": item.total_biaya_tanpa_jp || 0,
      // Detailed breakdown
      "Biaya Obat": item.biaya_obat || 0,
      "Biaya BHP": item.biaya_bhp || 0,
      "Biaya Bahan Makanan Karyawan": item.biaya_makan_karyawan || 0,
      "Biaya Bahan Makanan Pasien": item.biaya_makan_pasien || 0,
      "Biaya Alat Rumah Tangga": item.biaya_rumah_tangga || 0,
      "Biaya Alat Tulis Kantor": item.biaya_atk || 0,
      "Biaya Cetak": item.biaya_cetak || 0,
      "Biaya Gaji dan Tunjangan": item.biaya_gaji_tunjangan || 0,
      "Biaya Jasa Pelayanan": item.biaya_jasa_pelayanan || 0,
      "Biaya Pendidikan dan Pelatihan": item.biaya_pendidikan_pelatihan || 0,
      "Biaya Air": item.biaya_air || 0,
      "Biaya Listrik": item.biaya_listrik || 0,
      "Biaya Telepon": item.biaya_telp || 0,
      "Biaya Pemeliharaan Gedung dan Bangunan": item.biaya_pemeliharaan_bangunan || 0,
      "Biaya Pemeliharaan Alat Medis": item.biaya_pemeliharaan_alat_medis || 0,
      "Biaya Pemeliharaan Alat Non Medis": item.biaya_pemeliharaan_alat_non_medis || 0,
      "Biaya Penyusutan Gedung dan Bangunan": item.biaya_penyusutan_gedung || 0,
      "Biaya Penyusutan Jaringan": item.biaya_penyusutan_jaringan || 0,
      "Biaya Penyusutan Alat Medis": item.biaya_penyusutan_alat_medis || 0,
      "Biaya Penyusutan Alat Non Medis": item.biaya_penyusutan_alat_non_medis || 0,
      "Biaya Operasional Lainnya": item.biaya_operasional_lainnya || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Biaya");
    XLSX.writeFile(wb, "laporan_biaya.xlsx");
    toast.info("Laporan berhasil diunduh.");
  };

  // Format currency for display
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'Rp0';
    return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  };

  // Show loading state if no user session yet
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-muted-foreground">Memuat data biaya...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user session
  if (!userId) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Sesi Tidak Ditemukan</h3>
            <p className="text-muted-foreground mb-4">
              Silakan login terlebih dahulu untuk mengakses data biaya.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Biaya</h2>
        <div className="flex gap-2">
          {userId && (
            <Button onClick={() => fetchBiaya(userId)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Area Unduh Laporan + tombol preference dan tambah data */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Button onClick={handleDownloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <label htmlFor="import-file" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
          <Upload className="mr-2 h-4 w-4" /> Impor Data
          <Input id="import-file" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
        </label>
        <Button onClick={handleDownloadReport} variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>

        {/* Toggle Pilihan Jenis Biaya Tahunan */}
        <div className="flex items-center gap-1">
          <Button
            variant={biayaPreference === 'total_biaya' ? undefined : 'outline'}
            size="sm"
            disabled={updatingPreference}
            onClick={() => handleSetBiayaPreference('total_biaya')}
          >
            {updatingPreference && biayaPreference === 'total_biaya' ? 'Memproses...' : 'Total Biaya'}
          </Button>
          <Button
            variant={biayaPreference === 'total_biaya_tanpa_jp' ? undefined : 'outline'}
            size="sm"
            disabled={updatingPreference}
            onClick={() => handleSetBiayaPreference('total_biaya_tanpa_jp')}
          >
            {updatingPreference && biayaPreference === 'total_biaya_tanpa_jp' ? 'Memproses...' : 'Total Biaya Tanpa JP'}
          </Button>
        </div>

        {/* Tombol Tambah Data Biaya */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBiaya(null)}>Tambah Data Biaya</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBiaya ? "Edit Data Biaya" : "Tambah Data Biaya"}</DialogTitle>
              <DialogDescription>
                {editingBiaya ? "Perbarui detail biaya tahunan." : "Tambahkan data biaya tahunan baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="tahun"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Contoh: 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit_kerja_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Kerja</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "null" ? null : value)} value={field.value || "null"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Unit Kerja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Semua Unit Kerja</SelectItem>
                            {unitKerjaList.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.kode} - {unit.nama} ({unit.kategori})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Biaya Bahan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_obat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Obat</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_bhp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya BHP</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_makan_karyawan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Bahan Makanan Karyawan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_makan_pasien"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Bahan Makanan Pasien</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_rumah_tangga"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Alat Rumah Tangga</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_atk"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Alat Tulis Kantor</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_cetak"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Cetak</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Biaya Pegawai</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_gaji_tunjangan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Gaji dan Tunjangan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_jasa_pelayanan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Jasa Pelayanan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pendidikan_pelatihan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pendidikan dan Pelatihan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Biaya Daya</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_air"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Air</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_listrik"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Listrik</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_telp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Telepon</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Biaya Pemeliharaan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_bangunan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Gedung dan Bangunan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_alat_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Alat Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_alat_non_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Alat Non Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5">
                      <AccordionTrigger>Biaya Penyusutan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_gedung"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Gedung dan Bangunan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_jaringan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Jaringan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_alat_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Alat Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_alat_non_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Alat Non Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6">
                      <AccordionTrigger>Biaya Operasional Lainnya</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_operasional_lainnya"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Operasional Lainnya</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <DialogFooter>
                    <LoadingButton 
                      type="submit" 
                      loading={saving}
                      loadingText={editingBiaya ? "Menyimpan perubahan..." : "Menyimpan..."}
                    >
                      {editingBiaya ? "Simpan Perubahan" : "Tambah"}
                    </LoadingButton>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      

      

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tahun</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead>Biaya Bahan</TableHead>
              <TableHead>Biaya Pegawai</TableHead>
              <TableHead>Biaya Daya</TableHead>
              <TableHead>Biaya Pemeliharaan</TableHead>
              <TableHead>Biaya Penyusutan</TableHead>
              <TableHead>Biaya Operasional Lainnya</TableHead>
              <TableHead>Total Biaya</TableHead>
              <TableHead>Total Biaya Tanpa JP</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {biayaList.length > 0 ? (
              biayaList.map((biaya) => (
                <TableRow key={biaya.id}>
                  <TableCell className="font-medium">{biaya.tahun}</TableCell>
                  <TableCell>
                    {biaya.unit_kerja ? (
                      <div className="font-medium">
                        {biaya.unit_kerja.kode} - {biaya.unit_kerja.nama}
                        <div className="text-sm text-muted-foreground">
                          {biaya.unit_kerja.kategori}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic">
                        Semua Unit Kerja
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-green-600">
                        Total: {formatCurrency(biaya.biaya_bahan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Obat: {formatCurrency(biaya.biaya_obat)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        BHP: {formatCurrency(biaya.biaya_bhp)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Makan Karyawan: {formatCurrency(biaya.biaya_makan_karyawan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Makan Pasien: {formatCurrency(biaya.biaya_makan_pasien)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-blue-600">
                        Total: {formatCurrency(biaya.biaya_pegawai)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Gaji & Tunjangan: {formatCurrency(biaya.biaya_gaji_tunjangan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Jasa Pelayanan: {formatCurrency(biaya.biaya_jasa_pelayanan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pendidikan & Pelatihan: {formatCurrency(biaya.biaya_pendidikan_pelatihan)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-orange-600">
                        Total: {formatCurrency(biaya.biaya_daya)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Air: {formatCurrency(biaya.biaya_air)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Listrik: {formatCurrency(biaya.biaya_listrik)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Telepon: {formatCurrency(biaya.biaya_telp)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-purple-600">
                        Total: {formatCurrency(biaya.biaya_pemeliharaan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bangunan: {formatCurrency(biaya.biaya_pemeliharaan_bangunan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Alat Medis: {formatCurrency(biaya.biaya_pemeliharaan_alat_medis)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Alat Non Medis: {formatCurrency(biaya.biaya_pemeliharaan_alat_non_medis)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-red-600">
                        Total: {formatCurrency(biaya.biaya_penyusutan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Gedung: {formatCurrency(biaya.biaya_penyusutan_gedung)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Jaringan: {formatCurrency(biaya.biaya_penyusutan_jaringan)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Alat Medis: {formatCurrency(biaya.biaya_penyusutan_alat_medis)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Alat Non Medis: {formatCurrency(biaya.biaya_penyusutan_alat_non_medis)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-600">
                        Total: {formatCurrency(biaya.biaya_operasional_lainnya)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Operasional Lainnya: {formatCurrency(biaya.biaya_operasional_lainnya)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-lg text-primary">
                      {formatCurrency(biaya.total_biaya)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Keseluruhan
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-lg text-orange-600">
                      {formatCurrency(biaya.total_biaya_tanpa_jp)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tanpa Jasa Pelayanan
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(biaya)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(biaya.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  Tidak ada data biaya.
                </TableCell>
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

export default BiayaFormTable;