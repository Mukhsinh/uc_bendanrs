import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceItem {
  kode_tindakan: string;
  nama_tindakan: string;
  jasa_sarana?: number; // untuk skenario_tarif
  biaya_bahan?: number; // untuk skenario_tarif
  unit_cost?: number; // untuk rekapitulasi (backward compatible)
  biaya_bhp?: number; // untuk rekapitulasi (backward compatible)
  tarif?: number; // untuk akomodasi
  qty: number;
  subtotal: number;
  jasa_pelayanan_medis?: number; // Untuk visite dan konsultasi
  jasa_pelayanan_non_medis?: number; // Untuk visite dan konsultasi
}

interface ServiceSelectorProps {
  label: string;
  value: ServiceItem[];
  onChange: (value: ServiceItem[]) => void;
  tahun: number;
  filterType: string;
  jenisProduk?: string; // 'rawat jalan' atau 'rawat inap' - untuk filter tindakan
  spesialisasiDokter?: string; // untuk filter IBS berdasarkan operator
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  label,
  value,
  onChange,
  tahun,
  filterType,
  jenisProduk,
  spesialisasiDokter,
}) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getTimestamp = (item: any) => {
    const updated = item?.updated_at ? new Date(item.updated_at).getTime() : 0;
    const created = item?.created_at ? new Date(item.created_at).getTime() : 0;
    return Math.max(updated, created);
  };

  const dedupeFarmasiItems = (items: any[]) => {
    const map = new Map<string, any>();

    items.forEach((item) => {
      if (!item) return;

      const kode = String(item?.kode_barang || item?.id || "")
        .trim()
        .toUpperCase();
      if (!kode) return;

      const normalized = {
        ...item,
        kode_barang: kode,
        nama_barang: (item?.nama_barang || "").trim(),
        satuan: (item?.satuan || "").trim(),
        harga:
          typeof item?.harga === "string"
            ? parseFloat(item.harga) || 0
            : item?.harga ?? 0,
      };

      const existing = map.get(kode);
      if (!existing || getTimestamp(item) >= getTimestamp(existing)) {
        map.set(kode, normalized);
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
      
      if (!user) return;

      let data: any[] = [];
      let error: any = null;

      // Apply filter based on type
      if (filterType === "tindakan") {
        // Ambil dari skenario_tarif berdasarkan jenis (rawat jalan/rawat inap)
        // Filter by jenis produk dan hanya ambil yang sumber_tabel sesuai
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
            .eq("tahun", tahun)
            .eq("sumber_tabel", sumberTabel)
            .order("nama_tindakan");
          
          data = result.data || [];
          error = result.error;
        }
      } else if (filterType === "ibs") {
        // Ambil dari skenario_tarif untuk tindakan operatif
        // Filter by spesialisasi dokter (operator) jika ada
        let query = supabase
          .from("skenario_tarif")
          .select("*")
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_tindakan_operatif");

        if (spesialisasiDokter) {
          query = query.eq("nama_operator", spesialisasiDokter);
        }

        const result = await query.order("nama_tindakan");
        data = result.data || [];
        error = result.error;
      } else if (filterType === "laboratorium") {
        // Ambil dari skenario_tarif untuk laboratorium
        const result = await supabase
          .from("skenario_tarif")
          .select("*")
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_biaya_laboratorium")
          .order("nama_tindakan");
        
        data = result.data || [];
        error = result.error;
      } else if (filterType === "radiologi") {
        // Ambil dari skenario_tarif untuk radiologi
        const result = await supabase
          .from("skenario_tarif")
          .select("*")
          .eq("tahun", tahun)
          .eq("sumber_tabel", "kalkulasi_biaya_radiologi")
          .order("nama_tindakan");
        
        data = result.data || [];
        error = result.error;
      } else if (filterType === "farmasi") {
        const batchSize = 1000;
        let page = 0;
        let fetchedAll = false;
        const allRows: any[] = [];

        while (!fetchedAll) {
          const from = page * batchSize;
          const to = from + batchSize - 1;

          const { data: farmasiData, error: farmasiError } = await supabase
            .from("data_barang_farmasi")
            .select("id, kode_barang, nama_barang, satuan, harga, created_at, updated_at, gudang")
            .order("updated_at", { ascending: false, nullsFirst: false })
            .range(from, to);

          if (farmasiError) {
            error = farmasiError;
            break;
          }

          if (farmasiData && farmasiData.length > 0) {
            allRows.push(...farmasiData);
            if (farmasiData.length < batchSize) {
              fetchedAll = true;
            } else {
              page += 1;
            }
          } else {
            fetchedAll = true;
          }
        }

        if (!error) {
          const normalized = dedupeFarmasiItems(allRows).sort((a, b) =>
            (a?.nama_barang || "").localeCompare(b?.nama_barang || "", "id", {
              sensitivity: "base",
            })
          );

          data = normalized.map((item: any) => ({
            id: item.id,
            kode_tindakan: item.kode_barang,
            nama_tindakan: item.nama_barang,
            jasa_sarana: 0,
            biaya_bahan: item.harga || 0,
            satuan: item.satuan,
          }));
        }
      } else if (filterType === "akomodasi") {
        // Ambil dari skenario_tarif_akomodasi
        const result = await supabase
          .from("skenario_tarif_akomodasi")
          .select("*")
          .eq("tahun", tahun);
        
        if (result.data && result.data.length > 0) {
          const tarif = result.data[0];
          // Transform ke format array dengan kelas akomodasi
          data = [
            {
              id: "akomodasi_vvip",
              kode_tindakan: "AKOM.VVIP",
              nama_tindakan: "Kamar VVIP",
              tarif: tarif.tarif_vvip || 0,
              rata_rata_uc: tarif.rata_rata_uc_vvip || 0,
            },
            {
              id: "akomodasi_vip",
              kode_tindakan: "AKOM.VIP",
              nama_tindakan: "Kamar VIP",
              tarif: tarif.tarif_vip || 0,
              rata_rata_uc: tarif.rata_rata_uc_vip || 0,
            },
            {
              id: "akomodasi_i",
              kode_tindakan: "AKOM.I",
              nama_tindakan: "Kamar Kelas I",
              tarif: tarif.tarif_i || 0,
              rata_rata_uc: tarif.rata_rata_uc_i || 0,
            },
            {
              id: "akomodasi_ii",
              kode_tindakan: "AKOM.II",
              nama_tindakan: "Kamar Kelas II",
              tarif: tarif.tarif_ii || 0,
              rata_rata_uc: tarif.rata_rata_uc_ii || 0,
            },
            {
              id: "akomodasi_iii",
              kode_tindakan: "AKOM.III",
              nama_tindakan: "Kamar Kelas III",
              tarif: tarif.tarif_iii || 0,
              rata_rata_uc: tarif.rata_rata_uc_iii || 0,
            },
          ];
        }
        error = result.error;
      } else if (filterType === "visite") {
        // Ambil dari skenario_tarif_visit dengan filter Visit%
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
        // Ambil dari skenario_tarif_visit dengan filter Konsultasi%
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
    if (dialogOpen) {
      fetchServices();
      setSearchQuery(""); // Reset search saat dialog dibuka
    }
  }, [dialogOpen, tahun]);

  // Filter services berdasarkan search query
  const filteredServices = availableServices.filter((service) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const kode = (service.kode_tindakan || "").toLowerCase();
    const nama = (service.nama_tindakan || "").toLowerCase();
    const operator = (service.nama_operator || "").toLowerCase();
    
    return kode.includes(query) || nama.includes(query) || operator.includes(query);
  });

  const handleAdd = () => {
    if (!selectedService) {
      toast({
        title: "Error",
        description: "Pilih layanan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const service = availableServices.find((s) => s.id === selectedService);
    if (!service) return;

    let newItem: ServiceItem;

    if (filterType === "akomodasi") {
      // Untuk akomodasi, gunakan tarif langsung
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        tarif: service.tarif || 0,
        qty,
        subtotal: (service.tarif || 0) * qty,
      };
    } else if (filterType === "farmasi") {
      // Untuk farmasi, gunakan harga dari biaya_bahan
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        biaya_bahan: service.biaya_bahan || 0,
        qty,
        subtotal: (service.biaya_bahan || 0) * qty,
      };
    } else if (filterType === "visite" || filterType === "konsultasi") {
      // Untuk visite dan konsultasi, gunakan jasa_sarana + jasa_pelayanan_medis + jasa_pelayanan_non_medis dari skenario_tarif_visit
      const jasaSarana = service.jasa_sarana || 0;
      const jasaPelayananMedis = service.jasa_pelayanan_medis || 0;
      const jasaPelayananNonMedis = service.jasa_pelayanan_non_medis || 0;
      const totalPerItem = jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis;
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        jasa_sarana: jasaSarana,
        jasa_pelayanan_medis: jasaPelayananMedis,
        jasa_pelayanan_non_medis: jasaPelayananNonMedis,
        biaya_bahan: 0,
        qty,
        subtotal: totalPerItem * qty,
      };
    } else {
      // Untuk tindakan, IBS, laboratorium, radiologi - gunakan jasa_sarana + biaya_bahan dari skenario_tarif
      const jasaSarana = service.jasa_sarana || 0;
      const biayaBahan = service.biaya_bahan || service.biaya_bhp || 0;
      
      newItem = {
        kode_tindakan: service.kode_tindakan,
        nama_tindakan: service.nama_tindakan,
        jasa_sarana: jasaSarana,
        biaya_bahan: biayaBahan,
        qty,
        subtotal: (jasaSarana + biayaBahan) * qty,
      };
    }

    onChange([...value, newItem]);
    setSelectedService("");
    setQty(1);
    setSearchQuery("");
    setDialogOpen(false);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getDokterBadge = (tipe: string) => {
    switch (tipe) {
      case "umum":
        return (
          <Badge className="bg-purple-100 text-purple-800 border border-purple-300 ml-2">
            Dokter Umum
          </Badge>
        );
      case "spesialis":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-300 ml-2">
            Dokter Spesialis
          </Badge>
        );
      case "subspesialis":
        return (
          <Badge className="bg-orange-100 text-orange-800 border border-orange-300 ml-2">
            Dokter Subspesialis
          </Badge>
        );
      default:
        return null;
    }
  };

  const totalBiaya = value.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-lg p-4 space-y-2">
        {value.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Belum ada layanan dipilih
          </div>
        ) : (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  {filterType === "akomodasi" ? (
                    <TableHead className="text-right">Tarif</TableHead>
                  ) : (
                    <>
                      <TableHead className="text-right">Jasa Sarana</TableHead>
                      <TableHead className="text-right">Biaya Bahan</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{item.kode_tindakan}</TableCell>
                    <TableCell>{item.nama_tindakan}</TableCell>
                    {filterType === "akomodasi" ? (
                      <TableCell className="text-right">{formatCurrency(item.tarif || 0)}</TableCell>
                    ) : (
                      <>
                        <TableCell className="text-right">{formatCurrency(item.jasa_sarana || item.unit_cost || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.biaya_bahan || item.biaya_bhp || 0)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={filterType === "akomodasi" ? 4 : 5} className="text-right font-bold">Total:</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalBiaya)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Tambah {label}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Pilih {label}</DialogTitle>
              <DialogDescription>
                Pilih layanan dari rekapitulasi unit cost dengan unit cost + BHP
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-10">Loading...</div>
              ) : availableServices.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Tidak ada layanan tersedia untuk tahun {tahun}
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="search">Cari Tindakan</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Ketik kode atau nama tindakan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    {searchQuery && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Ditemukan {filteredServices.length} dari {availableServices.length} layanan
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="service">Pilih Layanan</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih layanan" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredServices.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Tidak ada hasil untuk "{searchQuery}"
                          </div>
                        ) : (
                          filteredServices.map((service) => {
                          let displayText = `${service.kode_tindakan} - ${service.nama_tindakan}`;
                          
                          if (filterType === "akomodasi") {
                            displayText += ` (Tarif: ${formatCurrency(service.tarif || 0)})`;
                          } else if (filterType === "farmasi") {
                            displayText += ` (Harga: ${formatCurrency(service.biaya_bahan || 0)})`;
                          } else if (filterType === "visite" || filterType === "konsultasi") {
                            const jasaSarana = service.jasa_sarana || 0;
                            const jasaPelayananMedis = service.jasa_pelayanan_medis || 0;
                            const jasaPelayananNonMedis = service.jasa_pelayanan_non_medis || 0;
                            const totalTarif = jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis;
                            displayText += ` (Tarif: ${formatCurrency(totalTarif)})`;
                          } else {
                            const jasa = service.jasa_sarana || service.unit_cost_per_tindakan || 0;
                            const bahan = service.biaya_bahan || 0;
                            displayText += ` (Jasa: ${formatCurrency(jasa)}, BHP: ${formatCurrency(bahan)})`;
                          }
                          
                          return (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{displayText}</span>
                                {(filterType === "visite" || filterType === "konsultasi") && service.tipe_dokter && (
                                  <span className="ml-2">{getDokterBadge(service.tipe_dokter)}</span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedService && (
                    <>
                      <div>
                        <Label htmlFor="qty">Quantity</Label>
                        <Input
                          id="qty"
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="border-t pt-4">
                        {(() => {
                          const service = availableServices.find((s) => s.id === selectedService);
                          if (!service) return null;
                          
                          let total = 0;
                          let displayItems: JSX.Element[] = [];

                          if (filterType === "akomodasi") {
                            const tarif = service.tarif || 0;
                            total = tarif * qty;
                            displayItems = [
                              <div key="tarif" className="flex justify-between">
                                <span>Tarif per Hari:</span>
                                <span className="font-semibold">{formatCurrency(tarif)}</span>
                              </div>
                            ];
                          } else if (filterType === "farmasi") {
                            const harga = service.biaya_bahan || 0;
                            total = harga * qty;
                            displayItems = [
                              <div key="harga" className="flex justify-between">
                                <span>Harga:</span>
                                <span className="font-semibold">{formatCurrency(harga)}</span>
                              </div>
                            ];
                          } else if (filterType === "visite" || filterType === "konsultasi") {
                            const jasaSarana = service.jasa_sarana || 0;
                            const jasaPelayananMedis = service.jasa_pelayanan_medis || 0;
                            const jasaPelayananNonMedis = service.jasa_pelayanan_non_medis || 0;
                            const totalTarif = jasaSarana + jasaPelayananMedis + jasaPelayananNonMedis;
                            total = totalTarif * qty;
                            displayItems = [
                              <div key="tarif" className="flex justify-between">
                                <span>Tarif:</span>
                                <span className="font-semibold">{formatCurrency(totalTarif)}</span>
                              </div>
                            ];
                          } else {
                            const jasaSarana = service.jasa_sarana || service.unit_cost_per_tindakan || 0;
                            const biayaBahan = service.biaya_bahan || 0;
                            total = (jasaSarana + biayaBahan) * qty;
                            displayItems = [
                              <div key="jasa" className="flex justify-between">
                                <span>Jasa Sarana:</span>
                                <span className="font-semibold">{formatCurrency(jasaSarana)}</span>
                              </div>,
                              <div key="bahan" className="flex justify-between">
                                <span>Biaya Bahan:</span>
                                <span className="font-semibold">{formatCurrency(biayaBahan)}</span>
                              </div>
                            ];
                          }

                          return (
                            <div className="space-y-2">
                              {displayItems}
                              <div className="flex justify-between">
                                <span>Quantity:</span>
                                <span className="font-semibold">{qty}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between text-lg">
                                <span className="font-bold">Subtotal:</span>
                                <span className="font-bold text-green-600">{formatCurrency(total)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAdd} disabled={!selectedService}>
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceSelector;

