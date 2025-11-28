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
import { useReportDownload } from "@/components/report";
import { formatCurrency } from "@/lib/utils";
import { calculateTariff } from "@/utils/calculations";

interface SkenarioTarifAkomodasiData {
  id: string;
  tahun: number;
  // VVIP
  rata_rata_uc_vvip: number;
  jasa_sarana_vvip: number;
  jasa_pelayanan_medis_vvip: number;
  jasa_pelayanan_non_medis_vvip: number;
  jasa_pelayanan_vvip: number;
  tarif_vvip: number;
  prosentase_jasa_pelayanan_vvip: number;
  profit_rupiah_vvip: number;
  profit_persen_vvip: number;
  // VIP
  rata_rata_uc_vip: number;
  jasa_sarana_vip: number;
  jasa_pelayanan_medis_vip: number;
  jasa_pelayanan_non_medis_vip: number;
  jasa_pelayanan_vip: number;
  tarif_vip: number;
  prosentase_jasa_pelayanan_vip: number;
  profit_rupiah_vip: number;
  profit_persen_vip: number;
  // Kelas I
  rata_rata_uc_i: number;
  jasa_sarana_i: number;
  jasa_pelayanan_medis_i: number;
  jasa_pelayanan_non_medis_i: number;
  jasa_pelayanan_i: number;
  tarif_i: number;
  prosentase_jasa_pelayanan_i: number;
  profit_rupiah_i: number;
  profit_persen_i: number;
  // Kelas II
  rata_rata_uc_ii: number;
  jasa_sarana_ii: number;
  jasa_pelayanan_medis_ii: number;
  jasa_pelayanan_non_medis_ii: number;
  jasa_pelayanan_ii: number;
  tarif_ii: number;
  prosentase_jasa_pelayanan_ii: number;
  profit_rupiah_ii: number;
  profit_persen_ii: number;
  // Kelas III
  rata_rata_uc_iii: number;
  jasa_sarana_iii: number;
  jasa_pelayanan_medis_iii: number;
  jasa_pelayanan_non_medis_iii: number;
  jasa_pelayanan_iii: number;
  tarif_iii: number;
  prosentase_jasa_pelayanan_iii: number;
  profit_rupiah_iii: number;
  profit_persen_iii: number;
}

interface KelasData {
  kelas: string;
  rataRataUc: number;
  jasaSarana: number;
  jasaPelayananMedis: number;
  jasaPelayananNonMedis: number;
  jasaPelayanan: number;
  tarif: number;
  prosentaseJasaPelayanan: number;
  profitRupiah: number;
  profitPersen: number;
}

const SkenarioTarifAkomodasi = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [editingKelas, setEditingKelas] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    jasaSarana: number;
    jasaPelayananMedis: number;
    jasaPelayananNonMedis: number;
  }>({
    jasaSarana: 0,
    jasaPelayananMedis: 0,
    jasaPelayananNonMedis: 0,
  });
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const { downloadReport } = useReportDownload();

  // Fetch data skenario tarif akomodasi
  const { data: skenarioData, isLoading, refetch } = useQuery({
    queryKey: ["skenario_tarif_akomodasi", tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skenario_tarif_akomodasi")
        .select("*")
        .eq("tahun", tahun)
        .maybeSingle();

      if (error) throw error;
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
        rataRataUc: skenarioData.rata_rata_uc_vvip || 0,
        jasaSarana: skenarioData.jasa_sarana_vvip || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_vvip || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_vvip || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_vvip || 0,
        tarif: skenarioData.tarif_vvip || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_vvip || 0,
        profitRupiah: skenarioData.profit_rupiah_vvip || 0,
        profitPersen: skenarioData.profit_persen_vvip || 0,
      },
      {
        kelas: "VIP",
        rataRataUc: skenarioData.rata_rata_uc_vip || 0,
        jasaSarana: skenarioData.jasa_sarana_vip || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_vip || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_vip || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_vip || 0,
        tarif: skenarioData.tarif_vip || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_vip || 0,
        profitRupiah: skenarioData.profit_rupiah_vip || 0,
        profitPersen: skenarioData.profit_persen_vip || 0,
      },
      {
        kelas: "I",
        rataRataUc: skenarioData.rata_rata_uc_i || 0,
        jasaSarana: skenarioData.jasa_sarana_i || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_i || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_i || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_i || 0,
        tarif: skenarioData.tarif_i || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_i || 0,
        profitRupiah: skenarioData.profit_rupiah_i || 0,
        profitPersen: skenarioData.profit_persen_i || 0,
      },
      {
        kelas: "II",
        rataRataUc: skenarioData.rata_rata_uc_ii || 0,
        jasaSarana: skenarioData.jasa_sarana_ii || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_ii || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_ii || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_ii || 0,
        tarif: skenarioData.tarif_ii || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_ii || 0,
        profitRupiah: skenarioData.profit_rupiah_ii || 0,
        profitPersen: skenarioData.profit_persen_ii || 0,
      },
      {
        kelas: "III",
        rataRataUc: skenarioData.rata_rata_uc_iii || 0,
        jasaSarana: skenarioData.jasa_sarana_iii || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_iii || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_iii || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_iii || 0,
        tarif: skenarioData.tarif_iii || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_iii || 0,
        profitRupiah: skenarioData.profit_rupiah_iii || 0,
        profitPersen: skenarioData.profit_persen_iii || 0,
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

  // Update tarif for a specific kelas dengan calculation
  const updateTarifMutation = useMutation({
    mutationFn: async ({ 
      kelas, 
      values 
    }: { 
      kelas: string; 
      values: { jasaSarana: number; jasaPelayananMedis: number; jasaPelayananNonMedis: number } 
    }) => {
      if (!skenarioData) throw new Error("No data found");
      
      // Get unit cost untuk kelas ini
      const kelasLower = kelas.toLowerCase().replace("vvip", "vvip");
      const unitCostField = `rata_rata_uc_${kelasLower}` as keyof SkenarioTarifAkomodasiData;
      const unitCost = Number(skenarioData[unitCostField]) || 0;
      
      // Calculate derived values menggunakan shared utility
      const calculated = calculateTariff({
        jasaSarana: values.jasaSarana,
        jasaPelayananMedis: values.jasaPelayananMedis,
        jasaPelayananNonMedis: values.jasaPelayananNonMedis,
        unitCost: unitCost,
      });
      
      // Calculate profit rupiah
      const profitRupiah = calculated.tarif - unitCost;
      
      // Prepare update object dengan semua field yang dikalkulasi
      const updateData = {
        [`jasa_sarana_${kelasLower}`]: values.jasaSarana,
        [`jasa_pelayanan_medis_${kelasLower}`]: values.jasaPelayananMedis,
        [`jasa_pelayanan_non_medis_${kelasLower}`]: values.jasaPelayananNonMedis,
        [`jasa_pelayanan_${kelasLower}`]: calculated.jasaPelayanan,
        [`tarif_${kelasLower}`]: calculated.tarif,
        [`prosentase_jasa_pelayanan_${kelasLower}`]: calculated.prosentaseJasaPelayanan,
        [`profit_rupiah_${kelasLower}`]: profitRupiah,
        [`profit_persen_${kelasLower}`]: calculated.prosentaseProfit,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from("skenario_tarif_akomodasi")
        .update(updateData)
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

  const handleEditKelas = (item: KelasData) => {
    setEditingKelas(item.kelas);
    setEditValues({
      jasaSarana: item.jasaSarana,
      jasaPelayananMedis: item.jasaPelayananMedis,
      jasaPelayananNonMedis: item.jasaPelayananNonMedis,
    });
  };

  const handleSaveKelas = (kelas: string) => {
    updateTarifMutation.mutate({ kelas, values: editValues });
  };

  const handleCancelEdit = () => {
    setEditingKelas(null);
  };

  const handleDownloadReport = async () => {
    if (!kelasDataArray || kelasDataArray.length === 0) {
      toast.error("Belum ada data untuk diunduh");
      return;
    }

    try {
      setDownloadingReport(true);

      const records = kelasDataArray.map((item) => ({
        "Tahun": tahun,
        "Kelas": item.kelas,
        "Rata-rata Unit Cost": Math.round(item.rataRataUc || 0),
        "Tarif": Math.round(item.tarif || 0),
        "Profit (Rp)": Math.round(item.profitRupiah || 0),
        "Profit (%)": Number((item.profitPersen || 0).toFixed(2)),
      }));

      await downloadReport({
        title: "Laporan Skenario Tarif Akomodasi",
        subtitle: `Tahun ${tahun}`,
        filename: `skenario_tarif_akomodasi_${tahun}`,
        records,
        orientation: "portrait",
      });

      toast.success("Laporan berhasil disiapkan");
    } catch (error: any) {
      console.error("Gagal mengunduh skenario tarif akomodasi:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menyiapkan laporan");
    } finally {
      setDownloadingReport(false);
    }
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
                onClick={() => {
                  void handleDownloadReport();
                }} 
                disabled={!kelasDataArray.length || downloadingReport}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {downloadingReport ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
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
                    <TableHead className="w-[100px] font-bold text-white">Kelas</TableHead>
                    <TableHead className="text-right w-[130px] text-white">Rata-rata UC</TableHead>
                    <TableHead className="text-right w-[130px] text-white">Jasa Sarana</TableHead>
                    <TableHead className="text-right w-[130px] text-white">JP Medis</TableHead>
                    <TableHead className="text-right w-[130px] text-white">JP Non Medis</TableHead>
                    <TableHead className="text-right w-[130px] text-white">JP Total</TableHead>
                    <TableHead className="text-right w-[130px] text-white">Tarif</TableHead>
                    <TableHead className="text-right w-[100px] text-white">% JP</TableHead>
                    <TableHead className="text-right w-[130px] text-white">Profit (Rp)</TableHead>
                    <TableHead className="text-right w-[100px] text-white">Profit (%)</TableHead>
                    <TableHead className="w-[100px] text-center text-white">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelasDataArray.map((item) => {
                    const isEditing = editingKelas === item.kelas;
                    
                    // Calculate preview values saat edit
                    const previewValues = isEditing ? calculateTariff({
                      jasaSarana: editValues.jasaSarana,
                      jasaPelayananMedis: editValues.jasaPelayananMedis,
                      jasaPelayananNonMedis: editValues.jasaPelayananNonMedis,
                      unitCost: item.rataRataUc,
                    }) : null;
                    
                    const previewProfitRupiah = previewValues ? previewValues.tarif - item.rataRataUc : 0;
                    
                    return (
                      <TableRow key={item.kelas}>
                        <TableCell className="font-bold">
                          <Badge 
                            variant="outline" 
                            className={`text-sm px-2 py-1 ${
                              item.kelas === 'VVIP' ? 'bg-red-500 text-white border-red-500' :
                              item.kelas === 'VIP' ? 'bg-purple-500 text-white border-purple-500' :
                              item.kelas === 'I' ? 'bg-blue-500 text-white border-blue-500' :
                              item.kelas === 'II' ? 'bg-green-500 text-white border-green-500' :
                              item.kelas === 'III' ? 'bg-orange-500 text-white border-orange-500' :
                              'bg-gray-500 text-white border-gray-500'
                            }`}
                          >
                            {item.kelas}
                          </Badge>
                        </TableCell>
                        
                        {/* Rata-rata UC */}
                        <TableCell className="text-right font-medium text-sm">
                          {formatCurrency(item.rataRataUc)}
                        </TableCell>
                        
                        {/* Jasa Sarana - Editable */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasaSarana}
                              onChange={(e) => setEditValues(prev => ({ 
                                ...prev, 
                                jasaSarana: parseInt(e.target.value) || 0 
                              }))}
                              className="w-28 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasaSarana)}</span>
                          )}
                        </TableCell>
                        
                        {/* JP Medis - Editable */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasaPelayananMedis}
                              onChange={(e) => setEditValues(prev => ({ 
                                ...prev, 
                                jasaPelayananMedis: parseInt(e.target.value) || 0 
                              }))}
                              className="w-28 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasaPelayananMedis)}</span>
                          )}
                        </TableCell>
                        
                        {/* JP Non Medis - Editable */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasaPelayananNonMedis}
                              onChange={(e) => setEditValues(prev => ({ 
                                ...prev, 
                                jasaPelayananNonMedis: parseInt(e.target.value) || 0 
                              }))}
                              className="w-28 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasaPelayananNonMedis)}</span>
                          )}
                        </TableCell>
                        
                        {/* JP Total - Calculated */}
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${isEditing ? 'text-blue-600' : ''}`}>
                            {formatCurrency(isEditing ? previewValues!.jasaPelayanan : item.jasaPelayanan)}
                          </span>
                        </TableCell>
                        
                        {/* Tarif - Calculated */}
                        <TableCell className="text-right">
                          <span className={`text-sm font-bold ${isEditing ? 'text-blue-600' : 'text-primary'}`}>
                            {formatCurrency(isEditing ? previewValues!.tarif : item.tarif)}
                          </span>
                        </TableCell>
                        
                        {/* % JP - Calculated */}
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {(isEditing ? previewValues!.prosentaseJasaPelayanan : item.prosentaseJasaPelayanan).toFixed(2)}%
                          </Badge>
                        </TableCell>
                        
                        {/* Profit Rupiah - Calculated */}
                        <TableCell className="text-right">
                          <span className={`text-sm font-semibold ${
                            (isEditing ? previewProfitRupiah : item.profitRupiah) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(isEditing ? previewProfitRupiah : item.profitRupiah)}
                          </span>
                        </TableCell>
                        
                        {/* Profit % - Calculated */}
                        <TableCell className="text-right">
                          <Badge 
                            variant={(isEditing ? previewValues!.prosentaseProfit : item.profitPersen) >= 0 ? "default" : "destructive"} 
                            className={`text-xs font-bold px-2 py-1 ${
                              (isEditing ? previewValues!.prosentaseProfit : item.profitPersen) >= 0 
                                ? item.kelas === 'VVIP' ? 'bg-red-500 text-white' :
                                  item.kelas === 'VIP' ? 'bg-purple-500 text-white' :
                                  item.kelas === 'I' ? 'bg-blue-500 text-white' :
                                  item.kelas === 'II' ? 'bg-green-500 text-white' :
                                  item.kelas === 'III' ? 'bg-orange-500 text-white' :
                                  'bg-gray-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {(isEditing ? previewValues!.prosentaseProfit : item.profitPersen).toFixed(2)}%
                          </Badge>
                        </TableCell>
                        
                        {/* Aksi */}
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveKelas(item.kelas)}
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
                              onClick={() => handleEditKelas(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

