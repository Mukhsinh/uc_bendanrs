import React, { useState, useEffect } from "react";
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
}

interface LayananInputTableProps {
  label: string;
  value: LayananItem[];
  onChange: (value: LayananItem[]) => void;
  tahun: number;
  filterType: string;
  jenisProduk?: string;
  spesialisasiDokter?: string;
}

const LayananInputTable: React.FC<LayananInputTableProps> = ({
  label,
  value,
  onChange,
  tahun,
  filterType,
  jenisProduk,
  spesialisasiDokter,
}) => {
  const { toast } = useToast();
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      let data: any[] = [];
      let error: any = null;

      if (filterType === "tindakan") {
        let sumberTabel = "";
        if (jenisProduk === "rawat jalan") {
          sumberTabel = "kalkulasi_tindakan_rawat_jalan";
        } else if (jenisProduk === "rawat inap") {
          sumberTabel = "kalkulasi_tindakan_inap";
        }

        if (sumberTabel) {
          const result = await supabase
            .from("skenario_tarif")
            .select("*")
            .eq("user_id", user.id)
            .eq("tahun", tahun)
            .eq("sumber_tabel", sumberTabel)
            .order("nama_tindakan");
          
          data = result.data || [];
          error = result.error;
        }
      } else if (filterType === "ibs") {
        let query = supabase
          .from("skenario_tarif")
          .select("*")
          .eq("user_id", user.id)
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_tindakan_operatif");

        if (spesialisasiDokter) {
          query = query.eq("nama_operator", spesialisasiDokter);
        }

        const result = await query.order("nama_tindakan");
        data = result.data || [];
        error = result.error;
      } else if (filterType === "laboratorium") {
        const result = await supabase
          .from("skenario_tarif")
          .select("*")
          .eq("user_id", user.id)
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_biaya_laboratorium")
          .order("nama_tindakan");
        
        data = result.data || [];
        error = result.error;
      } else if (filterType === "radiologi") {
        const result = await supabase
          .from("skenario_tarif")
          .select("*")
          .eq("user_id", user.id)
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_biaya_radiologi")
          .order("nama_tindakan");
        
        data = result.data || [];
        error = result.error;
      } else if (filterType === "akomodasi") {
        const result = await supabase
          .from("skenario_tarif_akomodasi")
          .select("*")
          .eq("user_id", user.id)
          .eq("tahun", tahun);
        
        if (result.data && result.data.length > 0) {
          const tarif = result.data[0];
          data = [
            {
              id: "akomodasi_vvip",
              kode_tindakan: "AKOM.VVIP",
              nama_tindakan: "Kamar VVIP",
              tarif: tarif.tarif_vvip || 0,
            },
            {
              id: "akomodasi_vip",
              kode_tindakan: "AKOM.VIP",
              nama_tindakan: "Kamar VIP",
              tarif: tarif.tarif_vip || 0,
            },
            {
              id: "akomodasi_i",
              kode_tindakan: "AKOM.I",
              nama_tindakan: "Kamar Kelas I",
              tarif: tarif.tarif_i || 0,
            },
            {
              id: "akomodasi_ii",
              kode_tindakan: "AKOM.II",
              nama_tindakan: "Kamar Kelas II",
              tarif: tarif.tarif_ii || 0,
            },
            {
              id: "akomodasi_iii",
              kode_tindakan: "AKOM.III",
              nama_tindakan: "Kamar Kelas III",
              tarif: tarif.tarif_iii || 0,
            },
          ];
        }
        error = result.error;
      } else if (filterType === "visite") {
        const result = await supabase
          .from("skenario_tarif_visit")
          .select("*")
          .eq("user_id", user.id)
          .eq("tahun", tahun)
          .maybeSingle();
        
        if (result.data) {
          const tarif = result.data;
          data = [
            {
              id: "visit_umum",
              kode_tindakan: "VISIT.UMUM",
              nama_tindakan: "Visit Dokter Umum",
              jasa_sarana: tarif.visit_dokter_umum || 0,
              biaya_bahan: 0,
              tipe_dokter: "umum",
            },
            {
              id: "visit_spesialis",
              kode_tindakan: "VISIT.SPESIALIS",
              nama_tindakan: "Visit Dokter Spesialis",
              jasa_sarana: tarif.visit_dokter_spesialis || 0,
              biaya_bahan: 0,
              tipe_dokter: "spesialis",
            },
            {
              id: "visit_subspesialis",
              kode_tindakan: "VISIT.SUBSPESIALIS",
              nama_tindakan: "Visit Dokter Subspesialis",
              jasa_sarana: tarif.visit_dokter_subspesialis || 0,
              biaya_bahan: 0,
              tipe_dokter: "subspesialis",
            },
          ];
        }
        error = result.error;
      } else if (filterType === "konsultasi") {
        const result = await supabase
          .from("skenario_tarif_visit")
          .select("*")
          .eq("user_id", user.id)
          .eq("tahun", tahun)
          .maybeSingle();
        
        if (result.data) {
          const tarif = result.data;
          data = [
            {
              id: "konsultasi_spesialis",
              kode_tindakan: "KONSUL.SPESIALIS",
              nama_tindakan: "Konsultasi Dokter Spesialis",
              jasa_sarana: tarif.konsultasi_dokter_spesialis || 0,
              biaya_bahan: 0,
              tipe_dokter: "spesialis",
            },
            {
              id: "konsultasi_subspesialis",
              kode_tindakan: "KONSUL.SUBSPESIALIS",
              nama_tindakan: "Konsultasi Dokter Subspesialis",
              jasa_sarana: tarif.konsultasi_dokter_subspesialis || 0,
              biaya_bahan: 0,
              tipe_dokter: "subspesialis",
            },
          ];
        }
        error = result.error;
      }

      if (error) throw error;

      setAvailableServices(data || []);
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
  }, [tahun, jenisProduk, spesialisasiDokter]);

  const filteredServices = availableServices.filter((service) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const kode = (service.kode_tindakan || "").toLowerCase();
    const nama = (service.nama_tindakan || "").toLowerCase();
    const operator = (service.nama_operator || "").toLowerCase();
    
    return kode.includes(query) || nama.includes(query) || operator.includes(query);
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
        qty,
        subtotal: itemTotal,
      };
    } else if (filterType === "visite" || filterType === "konsultasi") {
      itemTotal = (service.jasa_sarana || 0) * qty;
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        jasa_sarana: service.jasa_sarana || 0,
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
      };
    }

    if (existingIndex >= 0) {
      // Update existing
      const newValue = [...value];
      const newQtyTotal = newValue[existingIndex].qty + qty;
      const jasaSarana = newValue[existingIndex].jasa_sarana || newValue[existingIndex].tarif || 0;
      const biayaBahan = newValue[existingIndex].biaya_bahan || 0;
      const newSubtotal = (jasaSarana + biayaBahan) * newQtyTotal;
      
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
    const jasaSarana = newValue[index].jasa_sarana || newValue[index].tarif || 0;
    const biayaBahan = newValue[index].biaya_bahan || 0;
    const newSubtotal = (jasaSarana + biayaBahan) * newQty;
    
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
                    
                    if (filterType === "akomodasi") {
                      displayText += ` (Tarif: ${formatCurrency(service.tarif || 0)})`;
                    } else if (filterType === "visite" || filterType === "konsultasi") {
                      displayText += ` (Tarif: ${formatCurrency(service.jasa_sarana || 0)})`;
                    } else {
                      const jasa = service.jasa_sarana || 0;
                      const bahan = service.biaya_bahan || 0;
                      displayText += ` (Jasa: ${formatCurrency(jasa)}, BHP: ${formatCurrency(bahan)})`;
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
                totalPerItem = (service.jasa_sarana || 0) * qty;
                displayInfo = [
                  <span key="tarif">Tarif: {formatCurrency(service.jasa_sarana || 0)}</span>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className={`${badge.bgLight} font-bold`}>
                <TableCell colSpan={filterType === "akomodasi" ? 4 : 5} className="text-right">
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

