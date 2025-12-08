import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Search, Activity, FlaskConical, Radiation, Bed, Stethoscope, MessageSquare, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LayananItem {
  kode_tindakan: string;
  nama_tindakan: string;
  jasa_sarana?: number;
  biaya_bahan?: number;
  tarif?: number;
  qty: number;
  subtotal: number;
  tipe_dokter?: string;
  kode_operator?: string;
  nama_operator?: string;
  kode_unit_kerja?: string;
  nama_unit_kerja?: string;
  kelas?: string;
  jasa_pelayanan_medis?: number; // Untuk visite dan konsultasi
  jasa_pelayanan_non_medis?: number; // Untuk visite dan konsultasi
}

interface LayananInputTableProps {
  label: string;
  value: LayananItem[];
  onChange: (value: LayananItem[]) => void;
  tahun: number;
  filterType: string;
  jenisProduk?: string;
  spesialisasiDokter?: string;
  refreshKey: number;
  onServicesLoaded?: (services: any[]) => void;
  selectedKamarAkomodasi?: LayananItem[]; // Kamar yang sudah dipilih untuk filter tindakan
  selectedKlinik?: LayananItem[]; // Klinik yang sudah dipilih untuk filter tindakan rawat jalan
}

const LayananInputTable: React.FC<LayananInputTableProps> = ({
  label,
  value,
  onChange,
  tahun,
  filterType,
  jenisProduk,
  spesialisasiDokter,
  refreshKey,
  onServicesLoaded,
  selectedKamarAkomodasi = [],
  selectedKlinik = [],
}) => {
  const { toast } = useToast();
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Computed keys untuk dependency detection - menghindari infinite loop
  const selectedKamarKeys = useMemo(() => 
    selectedKamarAkomodasi?.map(k => k.kode_unit_kerja).filter(Boolean).sort().join(',') || '',
    [selectedKamarAkomodasi]
  );

  const selectedKlinikKeys = useMemo(() =>
    selectedKlinik?.map(k => k.kode_unit_kerja).filter(Boolean).sort().join(',') || '',
    [selectedKlinik]
  );

  const getBadgeConfig = () => {
    switch (filterType) {
      case "tindakan":
        return { 
          color: "bg-blue-500 text-white border-blue-600", 
          icon: Activity,
          bgLight: "bg-blue-50",
          borderLight: "border-blue-200",
          textDark: "text-blue-700"
        };
      case "ibs":
        return { 
          color: "bg-red-500 text-white border-red-600", 
          icon: Scissors,
          bgLight: "bg-red-50",
          borderLight: "border-red-200",
          textDark: "text-red-700"
        };
      case "laboratorium":
        return { 
          color: "bg-cyan-500 text-white border-cyan-600", 
          icon: FlaskConical,
          bgLight: "bg-cyan-50",
          borderLight: "border-cyan-200",
          textDark: "text-cyan-700"
        };
      case "radiologi":
        return { 
          color: "bg-yellow-500 text-white border-yellow-600", 
          icon: Radiation,
          bgLight: "bg-yellow-50",
          borderLight: "border-yellow-200",
          textDark: "text-yellow-700"
        };
      case "akomodasi":
        return { 
          color: "bg-pink-500 text-white border-pink-600", 
          icon: Bed,
          bgLight: "bg-pink-50",
          borderLight: "border-pink-200",
          textDark: "text-pink-700"
        };
      case "visite":
        return { 
          color: "bg-teal-500 text-white border-teal-600", 
          icon: Stethoscope,
          bgLight: "bg-teal-50",
          borderLight: "border-teal-200",
          textDark: "text-teal-700"
        };
      case "konsultasi":
        return { 
          color: "bg-indigo-500 text-white border-indigo-600", 
          icon: MessageSquare,
          bgLight: "bg-indigo-50",
          borderLight: "border-indigo-200",
          textDark: "text-indigo-700"
        };
      default:
        return { 
          color: "bg-gray-500 text-white border-gray-600", 
          icon: Activity,
          bgLight: "bg-gray-50",
          borderLight: "border-gray-200",
          textDark: "text-gray-700"
        };
    }
  };

  const badge = getBadgeConfig();
  const IconComponent = badge.icon;

  const getTimestamp = (item: any) => {
    const updated = item?.updated_at ? new Date(item.updated_at).getTime() : 0;
    const created = item?.created_at ? new Date(item.created_at).getTime() : 0;
    return Math.max(updated, created);
  };

  const dedupeByKodeTindakan = (items: any[]) => {
    const map = new Map<string, any>();
    items.forEach((item) => {
      const kode = item?.kode_tindakan || item?.id;
      if (!kode) return;

      const key = String(kode);
      const existing = map.get(key);
      if (!existing || getTimestamp(item) >= getTimestamp(existing)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  };

  /**
   * applyUserScope
   * ----------------
   * Untuk tabel skenario_tarif dan turunannya, data sudah difilter oleh RLS/tenant_id,
   * sehingga TIDAK boleh dibatasi lagi berdasarkan user_id. Semua user dalam tenant
   * yang sama (admin, superadmin, dsb) harus melihat skenario yang sama.
   *
   * Karena itu, fungsi ini sekarang hanya mengembalikan query apa adanya.
   */
  const applyUserScope = (query: any, _userId: string | null) => {
    return query;
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      let data: any[] = [];
      let error: any = null;

      if (filterType === "tindakan") {
        console.log("=== FETCHING TINDAKAN ===");
        console.log("Tahun:", tahun);
        console.log("Selected Kamar Akomodasi:", selectedKamarAkomodasi);
        console.log("Selected Klinik:", selectedKlinik);

        // Ambil semua tindakan dari kedua sumber tabel (rawat jalan dan rawat inap)
        let query = supabase
          .from("skenario_tarif")
          .select("*, kode_unit_kerja, nama_unit_kerja")
          .eq("tahun", tahun)
          .in("sumber_tabel", ["kalkulasi_tindakan_rawat_jalan", "kalkulasi_tindakan_inap"]);
        
        // Filter berdasarkan kamar akomodasi atau klinik yang dipilih (jika ada)
        // Tidak dibedakan berdasarkan jenis rawat
        const kodeUnitKerjaList: string[] = [];
        
        if (selectedKamarAkomodasi && selectedKamarAkomodasi.length > 0) {
          const kamarUnitKerja = selectedKamarAkomodasi
            .map(k => k.kode_unit_kerja)
            .filter(k => k) as string[];
          kodeUnitKerjaList.push(...kamarUnitKerja);
        }
        
        if (selectedKlinik && selectedKlinik.length > 0) {
          const klinikUnitKerja = selectedKlinik
            .map(k => k.kode_unit_kerja)
            .filter(k => k) as string[];
          kodeUnitKerjaList.push(...klinikUnitKerja);
        }
        
        // Hapus duplikat
        const uniqueUnitKerja = [...new Set(kodeUnitKerjaList)];
        
        if (uniqueUnitKerja.length > 0) {
          console.log("Filtering by Unit Kerja:", uniqueUnitKerja);
          query = query.in("kode_unit_kerja", uniqueUnitKerja);
        }
        
        query = applyUserScope(query, userId);
        const result = await query.order("nama_unit_kerja", { ascending: true }).order("nama_tindakan", { ascending: true });
        data = result.data || [];
        error = result.error;
        
        console.log("📦 Query result:", {
          totalFetched: data.length,
          sampleData: data.slice(0, 3),
          uniqueUnitKerja: [...new Set(data.map(d => d.kode_unit_kerja))],
          uniqueNamaUnitKerja: [...new Set(data.map(d => d.nama_unit_kerja))]
        });
        
        if (data.length === 0) {
          console.warn("⚠️ No tindakan found. Check if:");
          console.log("- Kamar/Klinik have valid kode_unit_kerja");
          console.log("- Tindakan exists for those unit kerja in skenario_tarif");
          console.log("- Selected unit kerja:", uniqueUnitKerja);
        }
      } else if (filterType === "ibs") {
        console.log("🔍 Fetching IBS services (tindakan operatif) tanpa filter jenis/rawat:", {
          tahun,
          userId,
        });

        // Ambil SELURUH tindakan IBS (operatif) untuk tahun & tenant aktif
        const result = await applyUserScope(
          supabase
            .from("skenario_tarif")
            .select("*, kode_unit_kerja, nama_unit_kerja")
            .eq("tahun", tahun)
            .eq("sumber_tabel", "kalkulasi_biaya_operatif"),
          userId
        )
          .order("nama_unit_kerja", { ascending: true })
          .order("nama_tindakan", { ascending: true });

        data = result.data || [];
        error = result.error;

        console.log("✅ IBS services loaded:", {
          total: data.length,
          sample: data.slice(0, 3),
        });
      } else if (filterType === "laboratorium") {
        let query = supabase
          .from("skenario_tarif")
          .select("*")
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_biaya_laboratorium");
        query = applyUserScope(query, userId).order("nama_tindakan");
        const result = await query;
        data = result.data || [];
        error = result.error;
      } else if (filterType === "radiologi") {
        let query = supabase
          .from("skenario_tarif")
          .select("*")
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_biaya_radiologi");
        query = applyUserScope(query, userId).order("nama_tindakan");
        const result = await query;
        data = result.data || [];
        error = result.error;
      } else if (filterType === "akomodasi") {
        // Ambil data dari skenario_tarif_akomodasi yang memiliki tarif per unit kerja per kelas
        let query = supabase
          .from("skenario_tarif_akomodasi")
          .select("*")
          .eq("tahun", tahun);
        query = applyUserScope(query, userId);
        const result = await query;
        
        if (result.data && result.data.length > 0) {
          // Transform data: setiap row menjadi multiple items (satu per kelas)
          const transformedData: any[] = [];
          
          result.data.forEach((item: any) => {
            // Mapping kelas dengan tarif dan label
            const kelasMapping = [
              { kelas: 'VVIP', label: 'VVIP', tarif: item.tarif_vvip },
              { kelas: 'VIP', label: 'VIP', tarif: item.tarif_vip },
              { kelas: 'I', label: 'Kelas I', tarif: item.tarif_i },
              { kelas: 'II', label: 'Kelas II', tarif: item.tarif_ii },
              { kelas: 'III', label: 'Kelas III', tarif: item.tarif_iii }
            ];
            
            kelasMapping.forEach(({ kelas, label, tarif }) => {
              // Hanya tambahkan jika tarif ada dan > 0
              if (tarif && tarif > 0) {
                transformedData.push({
                  id: `${item.id}_${kelas}`,
                  kode_tindakan: `AKOM.${kelas}`,
                  nama_tindakan: `${item.nama_unit_kerja} - ${label}`,
                  kode_unit_kerja: item.kode_unit_kerja,
                  nama_unit_kerja: item.nama_unit_kerja,
                  kelas: kelas,
                  tarif: parseFloat(tarif) || 0,
                });
              }
            });
          });
          
          // Sort by unit kerja first, then by kelas
          data = transformedData.sort((a, b) => {
            if (a.nama_unit_kerja !== b.nama_unit_kerja) {
              return a.nama_unit_kerja.localeCompare(b.nama_unit_kerja, 'id');
            }
            const kelasOrder: any = { 'VVIP': 1, 'VIP': 2, 'I': 3, 'II': 4, 'III': 5 };
            return (kelasOrder[a.kelas] || 99) - (kelasOrder[b.kelas] || 99);
          });
        }
        error = result.error;
      } else if (filterType === "visite") {
        let query = supabase
          .from("skenario_tarif_visit")
          .select("*")
          .eq("tahun", tahun)
          .ilike("tindakan", "Visit%");
        query = applyUserScope(query, userId);
        const result = await query;
        if (result.data && result.data.length > 0) {
          data = result.data.map((item: any) => {
            let kodeTindakan = "VISIT.UMUM";
            let tipeDokter = "umum";
            
            if (item.tindakan.includes("Spesialis") && !item.tindakan.includes("Subspesialis")) {
              kodeTindakan = "VISIT.SPESIALIS";
              tipeDokter = "spesialis";
            } else if (item.tindakan.includes("Subspesialis")) {
              kodeTindakan = "VISIT.SUBSPESIALIS";
              tipeDokter = "subspesialis";
            }
            
            return {
              id: item.id,
              kode_tindakan: kodeTindakan,
              nama_tindakan: item.tindakan,
              jasa_sarana: parseFloat(item.jasa_sarana || 0),
              jasa_pelayanan_medis: parseFloat(item.jasa_pelayanan_medis || 0),
              jasa_pelayanan_non_medis: parseFloat(item.jasa_pelayanan_non_medis || 0),
              biaya_bahan: 0,
              tipe_dokter: tipeDokter,
            };
          });
        }
        error = result.error;
      } else if (filterType === "konsultasi") {
        let query = supabase
          .from("skenario_tarif_visit")
          .select("*")
          .eq("tahun", tahun)
          .ilike("tindakan", "Konsultasi%");
        query = applyUserScope(query, userId);
        const result = await query;
        if (result.data && result.data.length > 0) {
          data = result.data.map((item: any) => {
            let kodeTindakan = "KONSUL.SPESIALIS";
            let tipeDokter = "spesialis";
            
            if (item.tindakan.includes("Subspesialis")) {
              kodeTindakan = "KONSUL.SUBSPESIALIS";
              tipeDokter = "subspesialis";
            }
            
            return {
              id: item.id,
              kode_tindakan: kodeTindakan,
              nama_tindakan: item.tindakan,
              jasa_sarana: parseFloat(item.jasa_sarana || 0),
              jasa_pelayanan_medis: parseFloat(item.jasa_pelayanan_medis || 0),
              jasa_pelayanan_non_medis: parseFloat(item.jasa_pelayanan_non_medis || 0),
              biaya_bahan: 0,
              tipe_dokter: tipeDokter,
            };
          });
        }
        error = result.error;
      }

      if (error) throw error;

      const normalizedData =
        filterType === "akomodasi" || filterType === "visite" || filterType === "konsultasi"
          ? data || []
          : dedupeByKodeTindakan(data || []).sort((a, b) =>
              (a?.nama_tindakan || "").localeCompare(b?.nama_tindakan || "", "id", {
                sensitivity: "base",
              })
            );

      setAvailableServices(normalizedData);
      console.log("✅ availableServices updated:", normalizedData.length, "services");
      
      // Notify parent component about loaded services
      if (onServicesLoaded) {
        onServicesLoaded(normalizedData);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching services",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [tahun, jenisProduk, spesialisasiDokter, refreshKey, selectedKamarKeys, selectedKlinikKeys]);

  // Filter berdasarkan kamar akomodasi atau klinik yang dipilih (untuk tindakan)
  // NOTE: Data sudah difilter di server-side dalam fetchServices() berdasarkan kode_unit_kerja
  // Fungsi ini sekarang hanya mengembalikan availableServices yang sudah terfilter
  const getFilteredByKamarOrKlinik = () => {
    console.log("📊 getFilteredByKamarOrKlinik - Available services:", availableServices.length);
    // Data sudah difilter di server, langsung return
    return availableServices;
  };

  const filteredServices = getFilteredByKamarOrKlinik()
    .filter((service) => {
      // Filter berdasarkan search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const kode = (service.kode_tindakan || "").toLowerCase();
        const nama = (service.nama_tindakan || "").toLowerCase();
        const operator = (service.nama_operator || "").toLowerCase();
        const unitKerja = (service.nama_unit_kerja || "").toLowerCase();
        
        if (!kode.includes(query) && !nama.includes(query) && !operator.includes(query) && !unitKerja.includes(query)) {
          return false;
        }
      }
      
      // Filter: exclude tindakan yang sudah dipilih
      // Cek apakah kode_tindakan sudah ada di list value
      const isAlreadySelected = value.some(item => item.kode_tindakan === service.kode_tindakan);
      return !isAlreadySelected;
    });

  const handleAddToList = () => {
    if (!selectedService) {
      toast({
        title: "Error",
        description: "Pilih layanan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (qty <= 0) {
      toast({
        title: "Error",
        description: "Quantity harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    const service = filteredServices.find((s) => s.id === selectedService);
    if (!service) return;

    // Check duplicate
    const existingIndex = value.findIndex((v) => v.kode_tindakan === service.kode_tindakan);
    
    let newItem: LayananItem;
    let itemTotal = 0;

    if (filterType === "akomodasi") {
      itemTotal = (service.tarif || 0) * qty;
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        tarif: service.tarif || 0,
        kode_unit_kerja: service.kode_unit_kerja,
        nama_unit_kerja: service.nama_unit_kerja,
        kelas: service.kelas,
        qty,
        subtotal: itemTotal,
      };
    } else if (filterType === "visite" || filterType === "konsultasi") {
      // Untuk visite dan konsultasi, subtotal dihitung dari jasa_sarana + jasa_pelayanan_medis + jasa_pelayanan_non_medis
      const jasaSarana = service.jasa_sarana || 0;
      const jasaPelayananMedis = service.jasa_pelayanan_medis || 0;
      const jasaPelayananNonMedis = service.jasa_pelayanan_non_medis || 0;
      itemTotal = (jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis) * qty;
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        jasa_sarana: jasaSarana,
        jasa_pelayanan_medis: jasaPelayananMedis,
        jasa_pelayanan_non_medis: jasaPelayananNonMedis,
        biaya_bahan: 0,
        qty,
        subtotal: itemTotal,
        tipe_dokter: service.tipe_dokter,
      };
    } else {
      const jasaSarana = service.jasa_sarana || 0;
      const biayaBahan = service.biaya_bahan || 0;
      itemTotal = (jasaSarana + biayaBahan) * qty;
      
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        jasa_sarana: jasaSarana,
        biaya_bahan: biayaBahan,
        qty,
        subtotal: itemTotal,
        kode_operator: service.kode_operator,
        nama_operator: service.nama_operator,
        kode_unit_kerja: service.kode_unit_kerja,
        nama_unit_kerja: service.nama_unit_kerja,
      };
    }

    if (existingIndex >= 0) {
      // Update existing
      const newValue = [...value];
      const newQtyTotal = newValue[existingIndex].qty + qty;
      
      let newSubtotal = 0;
      if (filterType === "visite" || filterType === "konsultasi") {
        const jasaSarana = newValue[existingIndex].jasa_sarana || 0;
        const jasaPelayananMedis = newValue[existingIndex].jasa_pelayanan_medis || 0;
        const jasaPelayananNonMedis = newValue[existingIndex].jasa_pelayanan_non_medis || 0;
        newSubtotal = (jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis) * newQtyTotal;
      } else if (filterType === "akomodasi") {
        const tarif = newValue[existingIndex].tarif || 0;
        newSubtotal = tarif * newQtyTotal;
      } else {
        const jasaSarana = newValue[existingIndex].jasa_sarana || newValue[existingIndex].tarif || 0;
        const biayaBahan = newValue[existingIndex].biaya_bahan || 0;
        newSubtotal = (jasaSarana + biayaBahan) * newQtyTotal;
      }
      
      newValue[existingIndex] = {
        ...newValue[existingIndex],
        qty: newQtyTotal,
        subtotal: newSubtotal,
      };
      onChange(newValue);
      
      toast({
        title: "Berhasil",
        description: `Quantity ${service.nama_tindakan} berhasil ditambahkan`,
      });
    } else {
      // Add new
      onChange([...value, newItem]);
      
      toast({
        title: "Berhasil",
        description: `${service.nama_tindakan} berhasil ditambahkan ke list`,
      });
    }

    setSelectedService("");
    setQty(1);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      toast({
        title: "Error",
        description: "Quantity harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }
    
    const newValue = [...value];
    let newSubtotal = 0;
    
    if (filterType === "visite" || filterType === "konsultasi") {
      const jasaSarana = newValue[index].jasa_sarana || 0;
      const jasaPelayananMedis = newValue[index].jasa_pelayanan_medis || 0;
      const jasaPelayananNonMedis = newValue[index].jasa_pelayanan_non_medis || 0;
      newSubtotal = (jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis) * newQty;
    } else if (filterType === "akomodasi") {
      const tarif = newValue[index].tarif || 0;
      newSubtotal = tarif * newQty;
    } else {
      const jasaSarana = newValue[index].jasa_sarana || newValue[index].tarif || 0;
      const biayaBahan = newValue[index].biaya_bahan || 0;
      newSubtotal = (jasaSarana + biayaBahan) * newQty;
    }
    
    newValue[index] = {
      ...newValue[index],
      qty: newQty,
      subtotal: newSubtotal,
    };
    onChange(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalBiaya = value.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconComponent className={`h-5 w-5 ${badge.textDark}`} />
        <Label className="text-base font-semibold">{label}</Label>
        <Badge className={badge.color}>
          {value.length} item
        </Badge>
      </div>
      
      {/* Peringatan jika tindakan rawat jalan tapi belum pilih klinik */}
      {filterType === "tindakan" && jenisProduk === "rawat jalan" && selectedKlinik.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <div className="text-yellow-600 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Pilih Klinik Terlebih Dahulu
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Untuk menambahkan tindakan rawat jalan, silakan pilih klinik terlebih dahulu. Tindakan yang ditampilkan akan disesuaikan dengan klinik yang dipilih.
            </p>
          </div>
        </div>
      )}

      {/* Informasi filter berdasarkan klinik (untuk rawat jalan) */}
      {filterType === "tindakan" && jenisProduk === "rawat jalan" && selectedKlinik.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-start gap-2">
          <div className="text-teal-600 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-teal-800">
              Filter Aktif: {selectedKlinik.length} Klinik Dipilih
            </p>
            <p className="text-xs text-teal-700 mt-1">
              Menampilkan tindakan dari klinik: {selectedKlinik.map(k => k.nama_unit_kerja).filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Peringatan jika tindakan rawat inap tapi belum pilih kamar */}
      {filterType === "tindakan" && jenisProduk === "rawat inap" && selectedKamarAkomodasi.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <div className="text-yellow-600 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Pilih Kamar Akomodasi Terlebih Dahulu
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Untuk menambahkan tindakan rawat inap, silakan pilih kamar akomodasi terlebih dahulu. Tindakan yang ditampilkan akan disesuaikan dengan unit kerja dari kamar yang dipilih.
            </p>
          </div>
        </div>
      )}

      {/* Informasi filter berdasarkan kamar (hanya untuk rawat inap) */}
      {filterType === "tindakan" && jenisProduk === "rawat inap" && selectedKamarAkomodasi.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <div className="text-blue-600 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              Filter Aktif: {selectedKamarAkomodasi.length} Kamar Dipilih
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Menampilkan tindakan dari unit kerja: {selectedKamarAkomodasi.map(k => k.nama_unit_kerja).filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className={`border rounded-lg p-4 ${badge.bgLight} ${badge.borderLight} space-y-3`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5">
            <Label htmlFor={`search-${filterType}`} className="text-sm">Cari {label}</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id={`search-${filterType}`}
                placeholder={`Ketik kode atau nama ${label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Ditemukan {filteredServices.length} dari {availableServices.length} layanan
              </p>
            )}
          </div>

          {/* Select */}
          <div className="md:col-span-4">
            <Label htmlFor={`service-${filterType}`} className="text-sm">Pilih {label}</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={`Pilih ${label.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="p-4 text-center text-sm">Loading...</div>
                ) : filteredServices.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : `Tidak ada data ${label.toLowerCase()}`}
                  </div>
                ) : (
                  filteredServices.map((service) => {
                    let displayText = `${service.kode_tindakan} - ${service.nama_tindakan}`;
                    
                    // Tambahkan nama unit kerja di belakang nama tindakan (untuk tindakan dan IBS)
                    if ((filterType === "tindakan" || filterType === "ibs") && service.nama_unit_kerja) {
                      displayText += ` (${service.nama_unit_kerja})`;
                    }
                    
                    if (filterType === "akomodasi") {
                      displayText += ` - Tarif: ${formatCurrency(service.tarif || 0)}`;
                    } else if (filterType === "visite" || filterType === "konsultasi") {
                      const jasaSarana = service.jasa_sarana || 0;
                      const jasaPelayananMedis = service.jasa_pelayanan_medis || 0;
                      const jasaPelayananNonMedis = service.jasa_pelayanan_non_medis || 0;
                      const totalTarif = jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis;
                      displayText += ` - Tarif: ${formatCurrency(totalTarif)}`;
                    } else {
                      const jasa = service.jasa_sarana || 0;
                      const bahan = service.biaya_bahan || 0;
                      displayText += ` - Jasa: ${formatCurrency(jasa)}, BHP: ${formatCurrency(bahan)}`;
                    }
                    
                    return (
                      <SelectItem key={service.id} value={service.id}>
                        {displayText}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="md:col-span-2">
            <Label htmlFor={`qty-${filterType}`} className="text-sm">Qty</Label>
            <Input
              id={`qty-${filterType}`}
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              placeholder="1"
              className="mt-1"
            />
          </div>

          {/* Button Add */}
          <div className="md:col-span-1 flex items-end">
            <Button 
              onClick={handleAddToList} 
              disabled={!selectedService}
              className={`w-full ${badge.color}`}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Selected */}
        {selectedService && (
          <div className={`${badge.bgLight} border-2 ${badge.borderLight} rounded p-3`}>
            {(() => {
              const service = filteredServices.find((s) => s.id === selectedService);
              if (!service) return null;
              
              let totalPerItem = 0;
              let displayInfo: JSX.Element[] = [];

              if (filterType === "akomodasi") {
                totalPerItem = (service.tarif || 0) * qty;
                displayInfo = [
                  <span key="tarif">Tarif: {formatCurrency(service.tarif || 0)}</span>
                ];
              } else if (filterType === "visite" || filterType === "konsultasi") {
                const jasaSarana = service.jasa_sarana || 0;
                const jasaPelayananMedis = service.jasa_pelayanan_medis || 0;
                const jasaPelayananNonMedis = service.jasa_pelayanan_non_medis || 0;
                const totalTarif = jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis;
                totalPerItem = totalTarif * qty;
                displayInfo = [
                  <span key="tarif">Tarif: {formatCurrency(totalTarif)}</span>
                ];
              } else {
                const jasa = service.jasa_sarana || 0;
                const bahan = service.biaya_bahan || 0;
                totalPerItem = (jasa + bahan) * qty;
                displayInfo = [
                  <span key="jasa">Jasa: {formatCurrency(jasa)}</span>,
                  <span key="sep" className="mx-2">•</span>,
                  <span key="bahan">BHP: {formatCurrency(bahan)}</span>
                ];
              }

              return (
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold">{service.nama_tindakan}</span>
                    <span className="text-muted-foreground"> × {qty}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs">{displayInfo}</p>
                    <p className={`${badge.textDark} font-bold`}>Total: {formatCurrency(totalPerItem)}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Table Display */}
      <div className="border rounded-lg overflow-hidden">
        {value.length === 0 ? (
          <div className={`text-center py-8 text-gray-500 ${badge.bgLight}`}>
            Belum ada {label.toLowerCase()} ditambahkan. Pilih {label.toLowerCase()} di atas dan klik tombol + untuk menambahkan.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className={badge.bgLight}>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama {label}</TableHead>
                {(filterType === "tindakan" || filterType === "ibs" || filterType === "akomodasi") && (
                  <TableHead className="w-[180px]">Unit Kerja</TableHead>
                )}
                {filterType === "akomodasi" ? (
                  <TableHead className="text-right w-[130px]">Tarif</TableHead>
                ) : (
                  <>
                    <TableHead className="text-right w-[130px]">Jasa Sarana</TableHead>
                    <TableHead className="text-right w-[130px]">Biaya Bahan</TableHead>
                  </>
                )}
                <TableHead className="text-center w-[100px]">Qty</TableHead>
                <TableHead className="text-right w-[130px]">Subtotal</TableHead>
                <TableHead className="text-right w-[80px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">{item.kode_tindakan}</TableCell>
                  <TableCell className="font-medium">{item.nama_tindakan}</TableCell>
                  {(filterType === "tindakan" || filterType === "ibs" || filterType === "akomodasi") && (
                    <TableCell className="text-sm text-muted-foreground">
                      {item.nama_unit_kerja || "-"}
                    </TableCell>
                  )}
                  {filterType === "akomodasi" ? (
                    <TableCell className="text-right">{formatCurrency(item.tarif || 0)}</TableCell>
                  ) : (
                    <>
                      <TableCell className="text-right">{formatCurrency(item.jasa_sarana || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.biaya_bahan || 0)}</TableCell>
                    </>
                  )}
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.subtotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleRemove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className={`${badge.bgLight} font-bold`}>
                <TableCell 
                  colSpan={
                    filterType === "akomodasi" ? 5 : 
                    (filterType === "tindakan" || filterType === "ibs") ? 6 : 
                    5
                  } 
                  className="text-right"
                >
                  Total {label}:
                </TableCell>
                <TableCell className={`text-right ${badge.textDark} text-lg`}>
                  {formatCurrency(totalBiaya)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default LayananInputTable;

