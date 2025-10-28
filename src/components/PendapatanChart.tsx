"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  jenis: number; // 1: rawat jalan, 2: rawat inap, 3: operatif
  kategori: "Pusat Biaya" | "Pusat Pendapatan";
}

interface DataPendapatan {
  id: string;
  unit_kerja_id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  pendapatan_umum: number;
  pendapatan_bpjs: number;
  pendapatan_apbd: number;
  total_pendapatan: number;
  tahun: number;
  unit_kerja?: UnitKerja;
}

interface ChartData {
  unit_kerja: string;
  pendapatan_bpjs: number;
  pendapatan_umum: number;
  pendapatan_apbd: number;
  total_pendapatan: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

const PendapatanChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJenis, setSelectedJenis] = useState<string>("all");
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  const [chartFilter, setChartFilter] = useState<string>("all");

  const jenisOptions = [
    { value: "all", label: "Semua Jenis" },
    { value: "1", label: "Rawat Jalan" },
    { value: "2", label: "Rawat Inap" }
  ];

  const chartFilterOptions = [
    { value: "all", label: "Tampilkan Semua" },
    { value: "without-apbd", label: "Tanpa Pendapatan APBD" }
  ];

  const colors = {
    bpjs: "#3b82f6", // blue
    umum: "#10b981", // emerald
    apbd: "#f59e0b", // amber
    total: "#8b5cf6" // violet
  };

  useEffect(() => {
    fetchData();
  }, [selectedJenis, selectedTahun, chartFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch unit kerja data with jenis information
      const { data: unitKerjaData, error: unitKerjaError } = await supabase
        .from('unit_kerja')
        .select('id, kode, nama, jenis, kategori')
        .eq('kategori', 'Pusat Pendapatan');

      if (unitKerjaError) {
        throw unitKerjaError;
      }

      // Fetch pendapatan data
      let query = supabase
        .from('data_pendapatan')
        .select('*')
        .eq('tahun', selectedTahun);

      const { data: pendapatanData, error: pendapatanError } = await query;

      if (pendapatanError) {
        throw pendapatanError;
      }

      // Filter data based on selected jenis
      let filteredData = pendapatanData || [];
      
      if (selectedJenis !== "all") {
        const jenisCode = parseInt(selectedJenis);
        const filteredUnitKerja = unitKerjaData?.filter(uk => uk.jenis === jenisCode) || [];
        const filteredUnitKerjaIds = filteredUnitKerja.map(uk => uk.id);
        
        filteredData = filteredData.filter(p => 
          filteredUnitKerjaIds.includes(p.unit_kerja_id)
        );
      }

      // Transform data for charts
      const chartData: ChartData[] = filteredData.map(item => {
        const unitKerja = unitKerjaData?.find(uk => uk.id === item.unit_kerja_id);
        return {
          unit_kerja: `${item.kode_unit_kerja} - ${item.nama_unit_kerja}`,
          pendapatan_bpjs: item.pendapatan_bpjs || 0,
          pendapatan_umum: item.pendapatan_umum || 0,
          pendapatan_apbd: item.pendapatan_apbd || 0,
          total_pendapatan: item.total_pendapatan || (item.pendapatan_bpjs || 0) + (item.pendapatan_umum || 0) + (item.pendapatan_apbd || 0)
        };
      });

      // Calculate pie chart data
      const totalBpjs = chartData.reduce((sum, item) => sum + item.pendapatan_bpjs, 0);
      const totalUmum = chartData.reduce((sum, item) => sum + item.pendapatan_umum, 0);
      const totalApbd = chartData.reduce((sum, item) => sum + item.pendapatan_apbd, 0);

      const pieChartData: PieData[] = [
        {
          name: "BPJS Kesehatan",
          value: totalBpjs,
          color: colors.bpjs
        },
        {
          name: "Umum/Asuransi",
          value: totalUmum,
          color: colors.umum
        }
      ];

      // Add APBD only if chartFilter is "all"
      if (chartFilter === "all") {
        pieChartData.push({
          name: "Pendapatan APBD",
          value: totalApbd,
          color: colors.apbd
        });
      }

      setData(chartData);
      setPieData(pieChartData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data grafik");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grafik Perbandingan Pendapatan</CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Memuat data grafik...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Perbandingan Pendapatan BPJS vs Umum/Asuransi</CardTitle>
        <CardDescription>
          Analisis perbandingan pendapatan berdasarkan jenis layanan
        </CardDescription>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Filter Jenis Layanan</label>
            <Select value={selectedJenis} onValueChange={setSelectedJenis}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis layanan" />
              </SelectTrigger>
              <SelectContent>
                {jenisOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tahun</label>
            <Select value={selectedTahun.toString()} onValueChange={(value) => setSelectedTahun(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Filter Grafik</label>
            <Select value={chartFilter} onValueChange={setChartFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih filter grafik" />
              </SelectTrigger>
              <SelectContent>
                {chartFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
              <p className="text-sm text-gray-400 mt-1">
                Pastikan ada data pendapatan untuk tahun {selectedTahun}
                {selectedJenis !== "all" && ` dan jenis ${jenisOptions.find(opt => opt.value === selectedJenis)?.label}`}
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="bar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bar">Grafik Batang</TabsTrigger>
              <TabsTrigger value="pie">Grafik Pie</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bar" className="mt-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="unit_kerja" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="pendapatan_bpjs" 
                      name="BPJS Kesehatan" 
                      fill={colors.bpjs}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="pendapatan_umum" 
                      name="Umum/Asuransi" 
                      fill={colors.umum}
                      radius={[2, 2, 0, 0]}
                    />
                    {chartFilter === "all" && (
                      <Bar 
                        dataKey="pendapatan_apbd" 
                        name="Pendapatan APBD" 
                        fill={colors.apbd}
                        radius={[2, 2, 0, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="pie" className="mt-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Summary Statistics */}
        {data.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Total BPJS Kesehatan</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(pieData.find(p => p.name === "BPJS Kesehatan")?.value || 0)}
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h4 className="font-medium text-emerald-900">Total Umum/Asuransi</h4>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(pieData.find(p => p.name === "Umum/Asuransi")?.value || 0)}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-medium text-amber-900">
                Total Pendapatan APBD
                <span className="text-xs text-amber-700 ml-1">(SUBSIDI)</span>
              </h4>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(pieData.find(p => p.name === "Pendapatan APBD")?.value || 0)}
              </p>
            </div>
            <div className="bg-violet-50 p-4 rounded-lg">
              <h4 className="font-medium text-violet-900">Total Pendapatan</h4>
              <p className="text-2xl font-bold text-violet-600">
                {formatCurrency(pieData.reduce((sum, item) => sum + item.value, 0))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendapatanChart;
