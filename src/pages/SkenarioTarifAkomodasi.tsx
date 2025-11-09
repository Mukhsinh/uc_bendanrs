import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Download, Upload, Calculator, Pencil, Check, X } from "lucide-react";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";

interface SkenarioTarifAkomodasiData {
  id: string;
  tahun: number;
  rata_rata_uc_vvip: number;
  rata_rata_uc_vip: number;
  rata_rata_uc_i: number;
  rata_rata_uc_ii: number;
  rata_rata_uc_iii: number;
  tarif_vvip: number;
  tarif_vip: number;
  tarif_i: number;
  tarif_ii: number;
  tarif_iii: number;
  profit_rupiah_vvip: number;
  profit_rupiah_vip: number;
  profit_rupiah_i: number;
  profit_rupiah_ii: number;
  profit_rupiah_iii: number;
  profit_persen_vvip: number;
  profit_persen_vip: number;
  profit_persen_i: number;
  profit_persen_ii: number;
  profit_persen_iii: number;
}

interface KelasData {
  kelas: string;
  rataRataUc: number;
  tarif: number;
  profitRupiah: number;
  profitPersen: number;
}

const SkenarioTarifAkomodasi = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [editingKelas, setEditingKelas] = useState<string | null>(null);
  const [editTarif, setEditTarif] = useState<number>(0);

  const queryClient = useQueryClient();

  // Fetch data skenario tarif akomodasi
  const { data: skenarioData, isLoading, refetch } = useQuery({
    queryKey: ["skenario_tarif_akomodasi", tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skenario_tarif_akomodasi")
        .select("*")
        .eq("tahun", tahun)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as SkenarioTarifAkomodasiData | null;
    },
    enabled: !!tahun,
  });

  // Transform data into table format
  const kelasDataArray: KelasData[] = React.useMemo(() => {
    if (!skenarioData) return [];
    
    return [
      {
        kelas: "VVIP",
        rataRataUc: skenarioData.rata_rata_uc_vvip,
        tarif: skenarioData.tarif_vvip,
        profitRupiah: skenarioData.profit_rupiah_vvip,
        profitPersen: skenarioData.profit_persen_vvip,
      },
      {
        kelas: "VIP",
        rataRataUc: skenarioData.rata_rata_uc_vip,
        tarif: skenarioData.tarif_vip,
        profitRupiah: skenarioData.profit_rupiah_vip,
        profitPersen: skenarioData.profit_persen_vip,
      },
      {
        kelas: "I",
        rataRataUc: skenarioData.rata_rata_uc_i,
        tarif: skenarioData.tarif_i,
        profitRupiah: skenarioData.profit_rupiah_i,
        profitPersen: skenarioData.profit_persen_i,
      },
      {
        kelas: "II",
        rataRataUc: skenarioData.rata_rata_uc_ii,
        tarif: skenarioData.tarif_ii,
        profitRupiah: skenarioData.profit_rupiah_ii,
        profitPersen: skenarioData.profit_persen_ii,
      },
      {
        kelas: "III",
        rataRataUc: skenarioData.rata_rata_uc_iii,
        tarif: skenarioData.tarif_iii,
        profitRupiah: skenarioData.profit_rupiah_iii,
        profitPersen: skenarioData.profit_persen_iii,
      },
    ];
  }, [skenarioData]);

  // Calculate average profit
  const averageProfit = React.useMemo(() => {
    if (kelasDataArray.length === 0) return 0;
    const total = kelasDataArray.reduce((sum, item) => sum + item.profitPersen, 0);
    return total / kelasDataArray.length;
  }, [kelasDataArray]);

  // Populate data dari kalkulasi_biaya_kelas_akomodasi
  const populateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("populate_skenario_tarif_akomodasi", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_tahun: tahun,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      toast.success(`Berhasil memuat data skenario tarif akomodasi`);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_akomodasi"] });
    },
    onError: (error) => {
      toast.error("Gagal memuat data: " + error.message);
    },
  });

  // Update tarif for a specific kelas
  const updateTarifMutation = useMutation({
    mutationFn: async ({ kelas, tarif }: { kelas: string; tarif: number }) => {
      if (!skenarioData) throw new Error("No data found");
      
      const updateField = `tarif_${kelas.toLowerCase().replace("vvip", "vvip")}`;
      const { error } = await supabase
        .from("skenario_tarif_akomodasi")
        .update({ [updateField]: tarif })
        .eq("id", skenarioData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil update tarif");
      setEditingKelas(null);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_akomodasi"] });
    },
    onError: (error) => {
      toast.error("Gagal update tarif: " + error.message);
    },
  });

  const handleEditKelas = (kelas: string, currentTarif: number) => {
    setEditingKelas(kelas);
    setEditTarif(currentTarif);
  };

  const handleSaveTarif = (kelas: string) => {
    updateTarifMutation.mutate({ kelas, tarif: editTarif });
  };

  const handleCancelEdit = () => {
    setEditingKelas(null);
  };

  const handleExport = () => {
    if (!kelasDataArray || kelasDataArray.length === 0) return;
    
    const dataForExport = kelasDataArray.map(item => ({
      "Tahun": tahun,
      "Kelas": item.kelas,
      "Rata-rata Unit Cost": item.rataRataUc,
      "Tarif": item.tarif,
      "Profit (Rp)": item.profitRupiah,
      "Profit (%)": item.profitPersen
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Skenario Tarif Akomodasi");
    XLSX.writeFile(wb, `skenario_tarif_akomodasi_${tahun}.xlsx`);
    
    toast.success("Laporan berhasil diunduh");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skenario Tarif Akomodasi</h1>
          <p className="text-muted-foreground">
            Kelola tarif akomodasi per kelas dengan perhitungan profit otomatis
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input
                id="tahun"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Button 
                onClick={() => populateMutation.mutate()} 
                disabled={populateMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white/80"
              >
                {populateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Update Data
              </Button>
              
              <Button 
                onClick={handleExport} 
                disabled={!kelasDataArray.length}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
              
              {/* Average Profit Badge */}
              {kelasDataArray.length > 0 && (
                <Badge className="px-3 py-1 bg-green-600 text-white">
                  <span className="font-medium">Rata-rata Profit:</span>
                  <span className="ml-2 text-sm font-bold">{averageProfit.toFixed(2)}%</span>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Skenario Tarif Akomodasi per Kelas</CardTitle>
          <CardDescription>
            {kelasDataArray.length > 0 ? `${kelasDataArray.length} kelas akomodasi` : "Belum ada data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : kelasDataArray.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data skenario tarif akomodasi untuk tahun {tahun}</p>
              <p className="text-sm">Klik "Update Data dari Kalkulasi" untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="w-[120px] font-bold text-white">Kelas</TableHead>
                    <TableHead className="text-right w-[150px] text-white">Rata-rata UC</TableHead>
                    <TableHead className="text-right w-[150px] text-white">
                      <div className="flex items-center justify-end gap-1">
                        Tarif
                        {editingKelas && (
                          <Pencil className="h-3 w-3 text-white/80" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[150px] text-white">Profit (Rp)</TableHead>
                    <TableHead className="text-right w-[120px] text-white">Profit (%)</TableHead>
                    <TableHead className="w-[100px] text-center text-white">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelasDataArray.map((item) => (
                    <TableRow key={item.kelas}>
                      <TableCell className="font-bold text-lg">
                        <Badge 
                          variant="outline" 
                          className={`text-base px-3 py-1 ${
                            item.kelas === 'VVIP' ? 'bg-red-500 text-white border-red-500' :
                            item.kelas === 'VIP' ? 'bg-purple-500 text-white border-purple-500' :
                            item.kelas === 'I' ? 'bg-blue-500 text-white border-blue-500' :
                            item.kelas === 'II' ? 'bg-green-500 text-white border-green-500' :
                            item.kelas === 'III' ? 'bg-orange-500 text-white border-orange-500' :
                            'bg-gray-500 text-white border-gray-500'
                          }`}
                        >
                          Kelas {item.kelas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.rataRataUc)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingKelas === item.kelas ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={editTarif}
                              onChange={(e) => setEditTarif(parseInt(e.target.value) || 0)}
                              className="w-32 text-right"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-primary text-lg">
                            {formatCurrency(item.tarif)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${item.profitRupiah >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.profitRupiah)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={item.profitPersen >= 0 ? "default" : "destructive"} 
                          className={`text-sm font-bold px-3 py-1 ${
                            item.profitPersen >= 0 
                              ? item.kelas === 'VVIP' ? 'bg-red-500 text-white border-red-500' :
                                item.kelas === 'VIP' ? 'bg-purple-500 text-white border-purple-500' :
                                item.kelas === 'I' ? 'bg-blue-500 text-white border-blue-500' :
                                item.kelas === 'II' ? 'bg-green-500 text-white border-green-500' :
                                item.kelas === 'III' ? 'bg-orange-500 text-white border-orange-500' :
                                'bg-gray-500 text-white border-gray-500'
                              : 'bg-red-500 text-white border-red-500'
                          }`}
                        >
                          {item.profitPersen.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {editingKelas === item.kelas ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveTarif(item.kelas)}
                              disabled={updateTarifMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              {updateTarifMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditKelas(item.kelas, item.tarif)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkenarioTarifAkomodasi;

