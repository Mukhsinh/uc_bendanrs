import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";
import { Download, RefreshCcw, ClipboardList, Bed, TrendingUp, TrendingDown } from "lucide-react";
import { useReportDownload } from "@/components/report";

interface KalkulasiTindakanInapData {
  id: string;
  user_id: string;
  tahun: number;
  kode_jenis: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_jenis_tindakan: string;
  jenis_tindakan: string;
  jumlah: number;
  waktu: number;
  profesionalisme: number;
  tingkat_kesulitan: number;
  hasil_kali_waktu: number;
  hasil_kali: number;
  biaya_bahan_tindakan: number;
  kali_bahan: number;
  rasio_tindakan: number;
  dasar_alokasi_kali_waktu: number;
  dasar_alokasi_hasil_kali: number;
  biaya_gaji_tunjangan: number;
  biaya_makan_karyawan: number;
  biaya_rumah_tangga: number;
  biaya_cetak: number;
  biaya_atk: number;
  biaya_listrik: number;
  biaya_air: number;
  biaya_telp: number;
  biaya_pemeliharaan_bangunan: number;
  biaya_pemeliharaan_alat_medis: number;
  biaya_pemeliharaan_alat_non_medis: number;
  biaya_operasional_lainnya: number;
  biaya_penyusutan_gedung: number;
  biaya_penyusutan_jaringan: number;
  biaya_penyusutan_alat_medis: number;
  biaya_penyusutan_alat_non_medis: number;
  biaya_pendidikan_pelatihan: number;
  biaya_laundry: number;
  biaya_sterilisasi: number;
  biaya_tidak_langsung_terdistribusi: number;
  unit_cost_tindakan_inap: number;
  created_at: string;
  updated_at: string;
}

const biayaFields: Array<keyof Pick<KalkulasiTindakanInapData,
  'biaya_gaji_tunjangan' |
  'biaya_makan_karyawan' |
  'biaya_rumah_tangga' |
  'biaya_cetak' |
  'biaya_atk' |
  'biaya_listrik' |
  'biaya_air' |
  'biaya_telp' |
  'biaya_pemeliharaan_bangunan' |
  'biaya_pemeliharaan_alat_medis' |
  'biaya_pemeliharaan_alat_non_medis' |
  'biaya_operasional_lainnya' |
  'biaya_penyusutan_gedung' |
  'biaya_penyusutan_jaringan' |
  'biaya_penyusutan_alat_medis' |
  'biaya_penyusutan_alat_non_medis' |
  'biaya_pendidikan_pelatihan' |
  'biaya_laundry' |
  'biaya_sterilisasi' |
  'biaya_tidak_langsung_terdistribusi'
>> = [
  'biaya_gaji_tunjangan',
  'biaya_makan_karyawan',
  'biaya_rumah_tangga',
  'biaya_cetak',
  'biaya_atk',
  'biaya_listrik',
  'biaya_air',
  'biaya_telp',
  'biaya_pemeliharaan_bangunan',
  'biaya_pemeliharaan_alat_medis',
  'biaya_pemeliharaan_alat_non_medis',
  'biaya_operasional_lainnya',
  'biaya_penyusutan_gedung',
  'biaya_penyusutan_jaringan',
  'biaya_penyusutan_alat_medis',
  'biaya_penyusutan_alat_non_medis',
  'biaya_pendidikan_pelatihan',
  'biaya_laundry',
  'biaya_sterilisasi',
  'biaya_tidak_langsung_terdistribusi',
];

const safeNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const KalkulasiTindakanInap = () => {
  const [data, setData] = useState<KalkulasiTindakanInapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<KalkulasiTindakanInapData[]>([]);
  const [filters, setFilters] = useState({
    tahun: new Date().getFullYear().toString(),
    nama_unit_kerja: "",
    jenis_tindakan: "",
    search: ""
  });
  const { toast } = useToast();
  const [showStats, setShowStats] = useState<boolean>(true);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);
  const { downloadReport } = useReportDownload();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Applying filters...', filters);
    applyFilters();
  }, [data, filters]);

  const fetchData = async (): Promise<boolean> => {
    let success = false;
    try {
      console.log('Starting data fetch...');
      setLoading(true);
      setError(null);
      
      const { data: result, error: fetchError } = await tenantSupabase
        .from('kalkulasi_tindakan_inap')
        .select('*')
        .order('nama_unit_kerja', { ascending: true })
        .limit(5000);

      console.log('Fetch result:', result);
      console.log('Fetch error:', fetchError);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      const normalizedData = (result || []).map((item) => {
        const normalizedItem: KalkulasiTindakanInapData = {
          ...item,
          tahun: safeNumber(item.tahun),
          kode_jenis: safeNumber(item.kode_jenis),
          jumlah: safeNumber(item.jumlah),
          waktu: safeNumber(item.waktu),
          profesionalisme: safeNumber(item.profesionalisme),
          tingkat_kesulitan: safeNumber(item.tingkat_kesulitan),
          hasil_kali_waktu: safeNumber(item.hasil_kali_waktu),
          hasil_kali: safeNumber(item.hasil_kali),
          biaya_bahan_tindakan: safeNumber(item.biaya_bahan_tindakan),
          kali_bahan: safeNumber(item.kali_bahan),
          rasio_tindakan: safeNumber(item.rasio_tindakan),
          dasar_alokasi_kali_waktu: safeNumber(item.dasar_alokasi_kali_waktu),
          dasar_alokasi_hasil_kali: safeNumber(item.dasar_alokasi_hasil_kali),
          unit_cost_tindakan_inap: safeNumber(item.unit_cost_tindakan_inap),
        } as KalkulasiTindakanInapData;

        biayaFields.forEach((field) => {
          normalizedItem[field] = safeNumber(item[field]);
        });

        if (!Number.isFinite(normalizedItem.unit_cost_tindakan_inap) || normalizedItem.unit_cost_tindakan_inap <= 0) {
          // Hitung unit cost termasuk biaya bahan tindakan
          const computedUnitCost = biayaFields.reduce((sum, field) => sum + safeNumber(item[field]), 0) 
            + safeNumber(item.biaya_bahan_tindakan);
          if (computedUnitCost > 0) {
            normalizedItem.unit_cost_tindakan_inap = computedUnitCost;
          } else if (!Number.isFinite(normalizedItem.unit_cost_tindakan_inap)) {
            normalizedItem.unit_cost_tindakan_inap = 0;
          }
        }

        return normalizedItem;
      });

      setData(normalizedData);
      console.log('Data set successfully:', normalizedData.length, 'items');
      success = true;
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Gagal mengambil data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('Fetch completed, loading set to false');
    }
    return success;
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      const parsedYear = filters.tahun ? parseInt(filters.tahun, 10) : NaN;
      // Jika tahun tidak valid atau kosong, gunakan tahun berjalan agar tipe parameter selalu integer (menghindari error 400 Supabase)
      const tahunParam = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();

      const { data: recalcResult, error: recalcError } = await supabase
        .rpc('manual_recalculate_kalkulasi_tindakan_inap', {
          p_tahun: tahunParam,
          p_kode_unit_kerja: null,
        });

      console.log('Recalculate result:', recalcResult);
      console.log('Recalculate error:', recalcError);

      if (recalcError) {
        // Log detail error ke console agar mudah di-debug (misalnya status 400 dari Supabase)
        console.error('Supabase RPC manual_recalculate_kalkulasi_tindakan_inap failed:', recalcError);
        throw new Error(recalcError.message || 'Gagal memanggil fungsi rekalkulasi kalkulasi tindakan inap');
      }

      // Jika fungsi mengembalikan payload JSONB dengan struktur { success, message, affected_rows, execution_time_seconds, ... }
      if (!recalcResult || (typeof recalcResult === 'object' && 'success' in (recalcResult as any) && !(recalcResult as any).success)) {
        const resultMessage =
          (recalcResult as any)?.message ||
          'Rekalkulasi kalkulasi tindakan inap gagal dijalankan, silakan cek data sumber (jenis tindakan, data biaya, distribusi biaya).';
        throw new Error(resultMessage);
      }

      const success = await fetchData();

      if (success) {
        const message = typeof recalcResult === 'object' && recalcResult !== null && 'message' in recalcResult
          ? String((recalcResult as { message?: string }).message ?? 'Kalkulasi tindakan inap berhasil diperbarui')
          : 'Kalkulasi tindakan inap berhasil diperbarui';

        toast({
          title: "Berhasil",
          description: message,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `Gagal memperbarui data kalkulasi: ${error.message}`
        : 'Gagal memperbarui data kalkulasi';

      console.error('Error saat menjalankan handleRefresh di KalkulasiTindakanInap:', error);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Pastikan indikator refresh selalu dimatikan walaupun terjadi error RPC atau error lain
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    console.log('Applying filters to data:', data.length, 'items');
    let filtered = [...data];

    if (filters.tahun) {
      filtered = filtered.filter(item => item.tahun.toString() === filters.tahun);
    }

    if (filters.nama_unit_kerja) {
      filtered = filtered.filter(item => 
        item.nama_unit_kerja.toLowerCase().includes(filters.nama_unit_kerja.toLowerCase())
      );
    }

    if (filters.jenis_tindakan) {
      filtered = filtered.filter(item => 
        item.jenis_tindakan.toLowerCase().includes(filters.jenis_tindakan.toLowerCase())
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.nama_unit_kerja.toLowerCase().includes(searchLower) ||
        item.jenis_tindakan.toLowerCase().includes(searchLower) ||
        item.kode_jenis_tindakan.toLowerCase().includes(searchLower)
      );
    }

    console.log('Filtered data:', filtered.length, 'items');
    setFilteredData(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    console.log('Filter change:', key, value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDownloadReport = async () => {
    if (filteredData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diunduh",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadingReport(true);

      const subtitleParts: string[] = [];
      if (filters.tahun) subtitleParts.push(`Tahun ${filters.tahun}`);
      if (filters.nama_unit_kerja) subtitleParts.push(`Unit ${filters.nama_unit_kerja}`);
      if (filters.jenis_tindakan) subtitleParts.push(`Jenis ${filters.jenis_tindakan}`);

      // Records untuk PDF: menggunakan data frontend (filteredData yang ditampilkan di tabel)
      const recordsForPdf = filteredData.map((item) => ({
        "Tahun": item.tahun,
        "Unit Kerja": `${item.nama_unit_kerja} (${item.kode_unit_kerja})`,
        "Jenis Tindakan": `${item.jenis_tindakan} (${item.kode_jenis_tindakan})`,
        "Jumlah": safeNumber(item.jumlah),
        "Biaya Bahan Tindakan": safeNumber(item.biaya_bahan_tindakan),
        "Unit Cost": safeNumber(item.unit_cost_tindakan_inap),
      }));

      // Records untuk Excel: menggunakan data database (fetch langsung dari database)
      const { data: dbData, error: fetchError } = await tenantSupabase
        .from('kalkulasi_tindakan_inap')
        .select('*')
        .order('tahun', { ascending: false })
        .order('nama_unit_kerja')
        .order('jenis_tindakan')
        .limit(5000);

      if (fetchError) {
        throw fetchError;
      }

      // Apply same filters as frontend
      let filteredDbData = dbData || [];
      if (filters.tahun) {
        filteredDbData = filteredDbData.filter((item: any) => item.tahun.toString() === filters.tahun);
      }
      if (filters.nama_unit_kerja) {
        filteredDbData = filteredDbData.filter((item: any) =>
          item.nama_unit_kerja?.toLowerCase().includes(filters.nama_unit_kerja.toLowerCase())
        );
      }
      if (filters.jenis_tindakan) {
        filteredDbData = filteredDbData.filter((item: any) =>
          item.jenis_tindakan?.toLowerCase().includes(filters.jenis_tindakan.toLowerCase())
        );
      }

      const recordsForExcel = filteredDbData.map((item: any) => ({
        "Tahun": item.tahun,
        "Kode Unit Kerja": item.kode_unit_kerja,
        "Nama Unit Kerja": item.nama_unit_kerja,
        "Kode Jenis Tindakan": item.kode_jenis_tindakan,
        "Jenis Tindakan": item.jenis_tindakan,
        "Jumlah": safeNumber(item.jumlah),
        "Waktu": safeNumber(item.waktu),
        "Profesionalisme": safeNumber(item.profesionalisme),
        "Tingkat Kesulitan": safeNumber(item.tingkat_kesulitan),
        "Biaya Bahan Tindakan": safeNumber(item.biaya_bahan_tindakan),
        "Biaya Gaji & Tunjangan": safeNumber(item.biaya_gaji_tunjangan),
        "Biaya Makan Karyawan": safeNumber(item.biaya_makan_karyawan),
        "Biaya Rumah Tangga": safeNumber(item.biaya_rumah_tangga),
        "Biaya Cetak": safeNumber(item.biaya_cetak),
        "Biaya ATK": safeNumber(item.biaya_atk),
        "Biaya Listrik": safeNumber(item.biaya_listrik),
        "Biaya Air": safeNumber(item.biaya_air),
        "Biaya Telepon": safeNumber(item.biaya_telp),
        "Biaya Pemeliharaan Bangunan": safeNumber(item.biaya_pemeliharaan_bangunan),
        "Biaya Pemeliharaan Alat Medis": safeNumber(item.biaya_pemeliharaan_alat_medis),
        "Biaya Pemeliharaan Alat Non Medis": safeNumber(item.biaya_pemeliharaan_alat_non_medis),
        "Biaya Operasional Lainnya": safeNumber(item.biaya_operasional_lainnya),
        "Biaya Penyusutan Gedung": safeNumber(item.biaya_penyusutan_gedung),
        "Biaya Penyusutan Jaringan": safeNumber(item.biaya_penyusutan_jaringan),
        "Biaya Penyusutan Alat Medis": safeNumber(item.biaya_penyusutan_alat_medis),
        "Biaya Penyusutan Alat Non Medis": safeNumber(item.biaya_penyusutan_alat_non_medis),
        "Biaya Pendidikan & Pelatihan": safeNumber(item.biaya_pendidikan_pelatihan),
        "Biaya Laundry": safeNumber(item.biaya_laundry),
        "Biaya Sterilisasi": safeNumber(item.biaya_sterilisasi),
        "Biaya Tidak Langsung Terdistribusi": safeNumber(item.biaya_tidak_langsung_terdistribusi),
        "Unit Cost Tindakan Inap": safeNumber(item.unit_cost_tindakan_inap),
      }));

      await downloadReport({
        title: "Laporan Kalkulasi Tindakan Rawat Inap",
        subtitle: subtitleParts.join(" • ") || undefined,
        filename: `kalkulasi_tindakan_inap_${filters.tahun || 'all'}`,
        recordsForPdf,
        recordsForExcel,
        orientation: "landscape",
      });

      toast({
        title: "Berhasil",
        description: "Laporan berhasil disiapkan.",
      });
    } catch (error: any) {
      console.error("Gagal mengunduh kalkulasi tindakan inap:", error);
      toast({
        title: "Error",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const getTotalJumlah = () => {
    return filteredData.reduce((total, item) => total + safeNumber(item.jumlah), 0);
  };

  const uniqueUnitCount = new Set(filteredData.map((item) => item.kode_unit_kerja)).size;
  const topTerbanyak = filteredData
    .slice()
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 3);
  const topTersedikit = filteredData
    .slice()
    .sort((a, b) => a.jumlah - b.jumlah)
    .slice(0, 3);

  const totalJumlahTindakan = getTotalJumlah();
  const calculateShare = (value: number) => {
    if (!totalJumlahTindakan) return 0;
    return Math.round((value / totalJumlahTindakan) * 1000) / 10;
  };

  console.log('Rendering component. Loading:', loading, 'Error:', error, 'Data length:', data.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error loading data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-3">
          <h1 className="text-3xl font-bold">Kalkulasi Tindakan Inap</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={filters.tahun}
            onChange={(e) => handleFilterChange('tahun', e.target.value)}
            placeholder="Tahun"
            className="w-24"
          />
          <Input
            value={filters.nama_unit_kerja}
            onChange={(e) => handleFilterChange('nama_unit_kerja', e.target.value)}
            placeholder="Filter unit kerja"
            className="w-48"
          />
          <Input
            value={filters.jenis_tindakan}
            onChange={(e) => handleFilterChange('jenis_tindakan', e.target.value)}
            placeholder="Filter jenis tindakan"
            className="flex-1 min-w-[180px]"
          />
          <Input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Cari unit kerja atau tindakan..."
            className="flex-1 min-w-[200px]"
          />
          <Button
            onClick={() => {
              void handleDownloadReport();
            }}
            disabled={filteredData.length === 0 || downloadingReport}
          >
            {downloadingReport ? (
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            aria-label="Perbarui data"
          >
            <RefreshCcw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isRefreshing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Rekalkulasi kalkulasi tindakan inap sedang berjalan...
                </span>
                <span className="text-xs text-blue-800">
                  Proses ini dapat memakan waktu beberapa detik.
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full w-1/2 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border border-sky-100 bg-sky-50">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sky-700">Total Data</p>
                <p className="text-2xl font-bold text-sky-900">{filteredData.length}</p>
              </div>
              <div className="rounded-full bg-sky-100 p-3 text-sky-600">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-sky-600">Jumlah baris sesuai filter aktif</p>
          </CardContent>
        </Card>
        <Card className="border border-emerald-100 bg-emerald-50">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Jumlah Ruang Rawat Inap</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {uniqueUnitCount.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                <Bed className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-emerald-600">Unit kerja unik dalam daftar</p>
        </CardContent>
      </Card>
        <Card className="border border-indigo-100 bg-indigo-50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-indigo-700">Top 3 Tindakan Terbanyak</p>
              <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            {topTerbanyak.length > 0 ? (
              <ul className="space-y-2">
                {topTerbanyak.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2"
                  >
                    <div className="flex-1 pr-3">
                      <p className="text-sm font-semibold text-indigo-800">
                        {index + 1}. {item.jenis_tindakan}
                      </p>
                      <p className="text-xs text-indigo-500">
                        {item.jumlah.toLocaleString("id-ID")} tindakan · {calculateShare(item.jumlah)}%
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-600">
                      #{index + 1}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Data tidak tersedia</p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-amber-100 bg-amber-50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-700">Top 3 Tindakan Tersedikit</p>
              <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            {topTersedikit.length > 0 ? (
              <ul className="space-y-2">
                {topTersedikit.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2"
                  >
                    <div className="flex-1 pr-3">
                      <p className="text-sm font-semibold text-amber-800">
                        {index + 1}. {item.jenis_tindakan}
                      </p>
                      <p className="text-xs text-amber-500">
                        {item.jumlah.toLocaleString("id-ID")} tindakan · {calculateShare(item.jumlah)}%
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-600">
                      #{index + 1}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Data tidak tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Kalkulasi Tindakan Inap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="text-white font-semibold">Tahun</TableHead>
                  <TableHead className="text-white font-semibold">Unit Kerja</TableHead>
                  <TableHead className="text-white font-semibold">Jenis Tindakan</TableHead>
                  <TableHead className="text-white font-semibold">Jumlah</TableHead>
                  <TableHead className="text-white font-semibold">Biaya Bahan Tindakan</TableHead>
                  <TableHead className="text-white font-semibold">Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tahun}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.nama_unit_kerja}</div>
                      <div className="text-sm text-muted-foreground">{item.kode_unit_kerja}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.jenis_tindakan}</div>
                      <div className="text-sm text-muted-foreground">{item.kode_jenis_tindakan}</div>
                    </TableCell>
                    <TableCell>{item.jumlah.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.biaya_bahan_tindakan)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.unit_cost_tindakan_inap)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data yang sesuai dengan filter
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KalkulasiTindakanInap;