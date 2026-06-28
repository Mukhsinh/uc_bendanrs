import React, { useState, useEffect, useMemo } from 'react';
import { useYear } from '@/contexts/YearContext';
import YearFilter from '@/components/ui/YearFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Calculator } from 'lucide-react';
import * as XLSX from "xlsx";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useReportDownload } from '@/components/report';
// Revert to API routes usage

interface DistribusiBiayaData {
  id: number;
  unit_kerja_pusat_biaya: string;
  biaya_tahunan: number;
  dasar_alokasi: string;
  tahun: number;
  jumlah_biaya_terdistribusi_i?: number;
  audit_check?: string;
  uk001_direktur: number;
  uk002_komite_ppi: number;
  uk003_komite_pmkp: number;
  uk004_komite_medik: number;
  uk005_akreditasi: number;
  uk006_dewan_pengawas: number;
  uk007_bid_pengembangan_dan_penunjang_pelayanan: number;
  uk008_seksi_penunjang_non_medis_dan_pengembangan_penunjang_pela: number;
  uk009_ipsrs_medis_dan_non_medis: number;
  uk010_seksi_penunjang_pelayanan_medis: number;
  uk011_bid_keperawatan: number;
  uk012_seksi_asuhan_pelayanan_keperawatan: number;
  uk013_seksi_pengembangan_dan_etika_keperawatan: number;
  uk014_bid_pelayanan_medis: number;
  uk015_seksi_pengembangan_pelayanan_medis: number;
  uk016_seksi_pelayanan_medis_dan_rekam_medis: number;
  uk017_tpprj: number;
  uk018_tppri: number;
  uk019_bag_tata_usaha: number;
  uk020_subag_keuangan: number;
  uk021_unit_perbendaharaan: number;
  uk022_unit_pendapatan: number;
  uk023_unit_akuntansi_dan_verifikasi: number;
  uk024_unit_akuntansi_manajemen: number;
  uk025_analis_biaya_dan_kasir: number;
  uk026_subag_umpeg: number;
  uk027_staf_umum_dan_kepegawaian: number;
  uk028_unit_it: number;
  uk029_rumah_tangga: number;
  uk030_cleaning_service: number;
  uk031_security: number;
  uk032_unit_aset: number;
  uk033_instalasi_humas_komplain: number;
  uk034_subag_renval: number;
  uk035_staf_renval: number;
  uk036_rekam_medik: number;
  uk037_ambulance: number;
  uk038_laboratorium_pk_pa: number;
  uk039_radiologi: number;
  uk040_farmasi: number;
  uk041_rehab_medik: number;
  uk042_gizi_dapur: number;
  uk043_laundry_cssd: number;
  uk044_bdrs: number;
  uk045_cathlab: number;
  uk046_terang_bulan_vip_vvip: number;
  uk047_truntum: number;
  uk048_sekarjagat: number;
  uk049_jlamprang: number;
  uk050_nifas: number;
  uk051_perinatologi: number;
  uk052_buketan: number;
  uk053_icu_picu_nicu: number;
  uk054_vk: number;
  uk055_igd_ponek: number;
  uk056_klinik_kebid_kandungan: number;
  uk057_klinik_bedah_mulut: number;
  uk058_klinik_syaraf: number;
  uk059_klinik_bedah_syaraf: number;
  uk060_klinik_bedah_digestif: number;
  uk061_klinik_bedah_umum: number;
  uk062_klinik_anak: number;
  uk063_klinik_penyakit_dalam: number;
  uk064_klinik_mata: number;
  uk065_klinik_kulit_kelamin: number;
  uk066_klinik_tht: number;
  uk067_klinik_gigi: number;
  uk068_klinik_jantung: number;
  uk069_klinik_dot_vct_cst: number;
  uk070_klinik_paru: number;
  uk071_klinik_orthopedi: number;
  uk072_klinik_jiwa: number;
  uk073_klinik_parikesit: number;
  uk074_ibs: number;
  uk075_pemulasaran_jenazah: number;
  uk076_hemodialisis: number;
  uk077_unit_diklat: number;
}

const getColumnName = (i: number): string => {
  const ukCode = `uk${i.toString().padStart(3, '0')}`;
  const suffixes = [
    '_direktur', '_komite_ppi', '_komite_pmkp', '_komite_medik', '_akreditasi', '_dewan_pengawas',
    '_bid_pengembangan_dan_penunjang_pelayanan', '_seksi_penunjang_non_medis_dan_pengembangan_penunjang_pela',
    '_ipsrs_medis_dan_non_medis', '_seksi_penunjang_pelayanan_medis', '_bid_keperawatan',
    '_seksi_asuhan_pelayanan_keperawatan', '_seksi_pengembangan_dan_etika_keperawatan', '_bid_pelayanan_medis',
    '_seksi_pengembangan_pelayanan_medis', '_seksi_pelayanan_medis_dan_rekam_medis', '_tpprj', '_tppri',
    '_bag_tata_usaha', '_subag_keuangan', '_unit_perbendaharaan', '_unit_pendapatan',
    '_unit_akuntansi_dan_verifikasi', '_unit_akuntansi_manajemen', '_analis_biaya_dan_kasir',
    '_subag_umpeg', '_staf_umum_dan_kepegawaian', '_unit_it', '_rumah_tangga', '_cleaning_service',
    '_security', '_unit_aset', '_instalasi_humas_komplain', '_subag_renval', '_staf_renval',
    '_rekam_medik', '_ambulance', '_laboratorium_pk_pa', '_radiologi', '_farmasi', '_rehab_medik',
    '_gizi_dapur', '_laundry_cssd', '_bdrs', '_cathlab', '_terang_bulan_vip_vvip', '_truntum',
    '_sekarjagat', '_jlamprang', '_nifas', '_perinatologi', '_buketan', '_icu_picu_nicu', '_vk',
    '_igd_ponek', '_klinik_kebid_kandungan', '_klinik_bedah_mulut', '_klinik_syaraf',
    '_klinik_bedah_syaraf', '_klinik_bedah_digestif', '_klinik_bedah_umum', '_klinik_anak',
    '_klinik_penyakit_dalam', '_klinik_mata', '_klinik_kulit_kelamin', '_klinik_tht', '_klinik_gigi',
    '_klinik_jantung', '_klinik_dot_vct_cst', '_klinik_paru', '_klinik_orthopedi', '_klinik_jiwa',
    '_klinik_parikesit', '_ibs', '_pemulasaran_jenazah', '_hemodialisis', '_unit_diklat'
  ];
  return ukCode + suffixes[i - 1];
};

const DistribusiBiayaPertama: React.FC = () => {
  const { downloadReport } = useReportDownload();
  const { selectedYear } = useYear();
  const [data, setData] = useState<DistribusiBiayaData[]>([]);
  const [filteredData, setFilteredData] = useState<DistribusiBiayaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // Filter states
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Unit kerja options
  const unitKerjaOptions = [
    'all', 'Direktur', 'Komite PPI', 'Komite PMKP', 'Komite Medik', 'Akreditasi',
    'Dewan Pengawas', 'Bid Pengembangan', 'Seksi penunjang', 'IPSRS',
    'Bid Keperawatan', 'Bid Pelayanan Medis', 'TPPRJ', 'TPPRI', 'Bag Tata Usaha',
    'Subag Keuangan', 'Unit Perbendaharaan', 'Unit Pendapatan', 'Unit Akuntansi',
    'Analis Biaya', 'Subag Umpeg', 'Staf Umum', 'Unit IT', 'Rumah Tangga',
    'Cleaning Service', 'Security', 'Unit Aset', 'Instalasi Humas', 'Subag Renval',
    'Staf Renval', 'Rekam Medik', 'Ambulance', 'Laboratorium', 'Radiologi',
    'Farmasi', 'Rehab Medik', 'Gizi Dapur', 'Laundry', 'BDRS', 'Cathlab', 'Unit Diklat'
  ];

  const columnKeys = useMemo(
    () => Array.from({ length: 77 }, (_, idx) => getColumnName(idx + 1)),
    []
  );

  const totals = useMemo(() => {
    const totalsMap = new Map<string, number>();
    columnKeys.forEach((key) => totalsMap.set(key, 0));

    let totalBiayaTahunan = 0;
    let totalTerdistribusi = 0;

    filteredData.forEach((item) => {
      totalBiayaTahunan += item.biaya_tahunan || 0;
      totalTerdistribusi += item.jumlah_biaya_terdistribusi_i || 0;

      columnKeys.forEach((key) => {
        const current = totalsMap.get(key) || 0;
        const value = (item as any)[key] ?? 0;
        totalsMap.set(key, current + (value || 0));
      });
    });

    return {
      totalBiayaTahunan,
      totalTerdistribusi,
      columnTotals: totalsMap,
    };
  }, [filteredData, columnKeys]);

  // Load data dari tabel distribusi_biaya_pertama
  const loadData = async () => {
    try {
      setLoading(true);
      // Gunakan fungsi RPC untuk membaca dari tabel distribusi_biaya_pertama
      const { data, error } = await supabase.rpc('api_distribusi_biaya_pertama', { 
        p_tahun: selectedYear
      });
      if (error) {
        console.error('Supabase RPC error:', error);
        toast.error('Gagal memuat data distribusi biaya');
        return;
      }
      setData((data as unknown as DistribusiBiayaData[]) || []);
      setFilteredData((data as unknown as DistribusiBiayaData[]) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distribusi biaya -> recalculate dan rebuild table
  // PENTING: HANYA UPDATE TABEL distribusi_biaya_pertama (tabel utama yang ditampilkan)
  // Tabel distribusi_biaya_pertama_norm hanya digunakan sebagai working table internal untuk kalkulasi
  // Tidak ada update langsung ke tabel norm dari halaman ini
  const calculateDistribusiBiaya = async () => {
    try {
      setCalculating(true);
      
      // Ambil user_id dari session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        toast.error('Gagal mendapatkan informasi user. Silakan login kembali.');
        return;
      }
      
      const userId = user?.id;
      
      if (!userId) {
        toast.error('User tidak ditemukan. Silakan login kembali.');
        return;
      }
      
      toast.info('Memperbarui data distribusi biaya pertama...');
      
      // Panggil fungsi RPC untuk update (HANYA update tabel distribusi_biaya_pertama)
      const { data, error } = await supabase.rpc('recalculate_and_fill_distribusi_biaya_pertama', {
        p_tahun: selectedYear,
        p_user_id: userId
      });
      
      if (error) {
        console.error('Error updating:', error);
        
        // Handle specific error types
        let errorMessage = error.message || 'Terjadi kesalahan saat memperbarui data';
        
        // Handle foreign key constraint violation (409 Conflict)
        if (error.code === '409' || error.message?.includes('foreign key constraint')) {
          errorMessage = 'Gagal memperbarui: Ada data di distribusi biaya kedua yang masih mereferensi data ini. Silakan coba lagi.';
        }
        
        toast.error(`Gagal memperbarui: ${errorMessage}`);
        return;
      }
      
      // Check response
      if (!data) {
        toast.error('Tidak ada response dari server. Silakan coba lagi.');
        return;
      }
      
      if (data.success === false) {
        const errorMsg = data.message || 'Gagal memperbarui data';
        console.error('Update failed:', errorMsg);
        
        if (errorMsg.includes('tidak memiliki data biaya')) {
          toast.error(
            `⚠️ ${errorMsg}\n\n` +
            `💡 Tips: Pastikan Anda sudah menginput data biaya untuk unit kerja pusat biaya pada tahun ${selectedYear}.`
          );
        } else if (errorMsg.includes('denominator alokasi = 0')) {
          toast.error(
            `⚠️ ${errorMsg}\n\n` +
            `💡 Tips: Pastikan data kegiatan (SDM/Kunjungan/Luas Ruangan) sudah diinput untuk tahun ${selectedYear}.`
          );
        } else {
          toast.error(errorMsg);
        }
        return;
      }
      
      // Refresh data setelah update
      await loadData();
      
      const insertedRows = data?.inserted_rows || 0;
      
      if (insertedRows > 0) {
        toast.success(
          `✅ Data berhasil diperbarui!\n` +
          `📊 ${insertedRows} baris diperbarui di tabel distribusi_biaya_pertama\n` +
          `📅 Menggunakan data biaya terbaru untuk tahun ${selectedYear}`
        );
      } else {
        toast.warning('Tidak ada data yang diperbarui. Periksa apakah ada data untuk tahun yang dipilih.');
      }
    } catch (error: any) {
      console.error('Error calculating:', error);
      if (error.message?.includes('message channel closed')) {
        console.warn('Browser extension error (safe to ignore):', error.message);
      }
      toast.error(`Terjadi kesalahan: ${error.message || 'Unknown error'}`);
    } finally {
      setCalculating(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = data;

    if (selectedUnitKerja !== 'all') {
      filtered = filtered.filter(item => 
        item.unit_kerja_pusat_biaya.toLowerCase().includes(selectedUnitKerja.toLowerCase())
      );
    }

    // filter by tahun dari context
    filtered = filtered.filter(item => item.tahun === selectedYear);

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.unit_kerja_pusat_biaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dasar_alokasi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  // Download report
  const handleDownloadReport = async () => {
    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk laporan.");
      return;
    }

    try {
      const columnLabels = [
        'UK001 Direktur',
        'UK002 Komite PPI',
        'UK003 Komite PMKP',
        'UK004 Komite Medik',
        'UK005 Akreditasi',
        'UK006 Dewan Pengawas',
        'UK007 Bid Pengembangan',
        'UK008 Seksi Penunjang Non Medis',
        'UK009 IPSRS',
        'UK010 Seksi Penunjang Pelayanan Medis',
        'UK011 Bid Keperawatan',
        'UK012 Seksi Asuhan Pelayanan Keperawatan',
        'UK013 Seksi Pengembangan dan Etika Keperawatan',
        'UK014 Bid Pelayanan Medis',
        'UK015 Seksi Pengembangan Pelayanan Medis',
        'UK016 Seksi Pelayanan Medis dan Rekam Medis',
        'UK017 TPPRJ',
        'UK018 TPPRI',
        'UK019 Bag Tata Usaha',
        'UK020 Subag Keuangan',
        'UK021 Unit Perbendaharaan',
        'UK022 Unit Pendapatan',
        'UK023 Unit Akuntansi dan Verifikasi',
        'UK024 Unit Akuntansi Manajemen',
        'UK025 Analis Biaya dan Kasir',
        'UK026 Subag Umpeg',
        'UK027 Staf Umum dan Kepegawaian',
        'UK028 Unit IT',
        'UK029 Rumah Tangga',
        'UK030 Cleaning Service',
        'UK031 Security',
        'UK032 Unit Aset',
        'UK033 Instalasi Humas Komplain',
        'UK034 Subag Renval',
        'UK035 Staf Renval',
        'UK036 Rekam Medik',
        'UK037 Ambulance',
        'UK038 Laboratorium PK PA',
        'UK039 Radiologi',
        'UK040 Farmasi',
        'UK041 Rehab Medik',
        'UK042 Gizi Dapur',
        'UK043 Laundry CSSD',
        'UK044 BDRS',
        'UK045 Cathlab',
        'UK046 Terang Bulan VIP VVIP',
        'UK047 Truntum',
        'UK048 Sekarjagat',
        'UK049 Jlamprang',
        'UK050 Nifas',
        'UK051 Perinatologi',
        'UK052 Buketan',
        'UK053 ICU PICU NICU',
        'UK054 VK',
        'UK055 IGD PONEK',
        'UK056 Klinik Kebid Kandungan',
        'UK057 Klinik Bedah Mulut',
        'UK058 Klinik Syaraf',
        'UK059 Klinik Bedah Syaraf',
        'UK060 Klinik Bedah Digestif',
        'UK061 Klinik Bedah Umum',
        'UK062 Klinik Anak',
        'UK063 Klinik Penyakit Dalam',
        'UK064 Klinik Mata',
        'UK065 Klinik Kulit Kelamin',
        'UK066 Klinik THT',
        'UK067 Klinik Gigi',
        'UK068 Klinik Jantung',
        'UK069 Klinik DOT VCT CST',
        'UK070 Klinik Paru',
        'UK071 Klinik Orthopedi',
        'UK072 Klinik Jiwa',
        'UK073 Klinik Parikesit',
        'UK074 IBS',
        'UK075 Pemulasaran Jenazah',
        'UK076 Hemodialisis',
        'UK077 Unit Diklat',
      ];

      const records = filteredData.map((item) => {
        const base: Record<string, number | string> = {
          'Unit Kerja Pusat Biaya': item.unit_kerja_pusat_biaya,
          'Biaya Tahunan': item.biaya_tahunan || 0,
          'Dasar Alokasi': item.dasar_alokasi,
          Tahun: item.tahun,
          'Jumlah Biaya Terdistribusi I': item.jumlah_biaya_terdistribusi_i || 0,
          'Audit Check': item.audit_check || 0,
        };

        columnKeys.forEach((key, index) => {
          const label = columnLabels[index] ?? key;
          base[label] = (item as any)[key] ?? 0;
        });

        return base;
      });

      await downloadReport({
        title: "Laporan Distribusi Biaya Pertama",
        subtitle: `Tahun ${selectedYear}`,
        filename: `distribusi_biaya_pertama_${selectedYear}`,
        records,
        orientation: "landscape",
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan distribusi biaya pertama:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  // Format number (integer)
  const formatCurrency = (amount: number) => {
    return Math.round(amount || 0).toLocaleString('id-ID');
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  useEffect(() => {
    applyFilters();
  }, [selectedUnitKerja, searchTerm, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Distribusi Biaya Pertama</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters((prev) => !prev)}
          className="min-w-[110px] border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          Filter
        </Button>
        <Button
          onClick={() => {
            void handleDownloadReport();
          }}
          className="bg-red-600 hover:bg-red-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Unduh Laporan
        </Button>
        <Button
          onClick={calculateDistribusiBiaya}
          disabled={calculating}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white/80"
        >
          {calculating ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          Perbarui Data
        </Button>
        <Button
          onClick={applyFilters}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          Terapkan Filter
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 max-w-[220px]">
                <Label htmlFor="unit-kerja">Unit Kerja</Label>
                <Select value={selectedUnitKerja} onValueChange={setSelectedUnitKerja}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Unit Kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitKerjaOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === 'all' ? 'Semua Unit Kerja' : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-w-[180px]">
                <Label>Tahun</Label>
                <YearFilter />
              </div>

              <div className="space-y-2 min-w-[220px]">
                <Label htmlFor="search">Pencarian</Label>
                <Input
                  id="search"
                  placeholder="Cari unit kerja atau dasar alokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[200px] max-w-[240px] border-slate-200 bg-slate-50">
          <CardContent className="p-4">
            <div className="text-xl font-semibold text-slate-800">{filteredData.length}</div>
            <p className="text-xs text-slate-600">Total Unit Kerja</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px] max-w-[240px] border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="text-xl font-semibold text-emerald-900">
              {formatCurrency(
                filteredData.reduce((sum, item) => sum + (item.biaya_tahunan || 0), 0) / (filteredData.length || 1)
              )}
            </div>
            <p className="text-xs text-emerald-700">Rata-rata Biaya Tahunan</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px] max-w-[240px] border-sky-200 bg-sky-50">
          <CardContent className="p-4">
            <div className="text-xl font-semibold text-sky-900">
              {formatCurrency(totals.totalTerdistribusi)}
            </div>
            <p className="text-xs text-sky-700">Total Alokasi (Terdistribusi I)</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px] max-w-[240px] border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="text-xl font-semibold text-purple-900">
              {new Set(filteredData.map((item) => item.dasar_alokasi)).size}
            </div>
            <p className="text-xs text-purple-700">Jenis Dasar Alokasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Distribusi Biaya Pertama</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Keterangan: Selisih terjadi karena pembulatan alokasi distribusi menjadi format tanpa desimal
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="sticky left-0 min-w-[200px] bg-[#0f766e] text-white">
                    Unit Kerja
                  </TableHead>
                  <TableHead className="min-w-[150px] text-white">Dasar Alokasi</TableHead>
                  <TableHead className="min-w-[120px] text-white">Biaya Tahunan</TableHead>
                  <TableHead className="min-w-[120px] text-white">Terdistribusi I</TableHead>
                  <TableHead className="min-w-[80px] text-white">Audit</TableHead>
                  {columnKeys.map((key, idx) => {
                    const ukCode = `UK${(1 + idx).toString().padStart(3, '0')}`;
                    return (
                      <TableHead key={key} className="min-w-[110px] text-white">
                        {ukCode}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="sticky left-0 bg-background font-medium">
                      {item.unit_kerja_pusat_biaya}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.dasar_alokasi}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.biaya_tahunan)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(item.jumlah_biaya_terdistribusi_i || 0)}
                    </TableCell>
                    <TableCell>
                      {item.audit_check ? (
                        <Badge
                          className={
                            item.audit_check === 'OK'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {item.audit_check}
                      </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {columnKeys.map((col) => {
                      const val = (item as any)[col] ?? 0;
                      return (
                        <TableCell key={col}>{formatCurrency(val)}</TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {filteredData.length > 0 && (
                  <TableRow className="bg-slate-50 font-semibold">
                    <TableCell className="sticky left-0 bg-slate-50">Total</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{formatCurrency(totals.totalBiayaTahunan)}</TableCell>
                    <TableCell>{formatCurrency(totals.totalTerdistribusi)}</TableCell>
                    <TableCell>-</TableCell>
                    {columnKeys.map((col) => (
                      <TableCell key={`total-${col}`}>
                        {formatCurrency(totals.columnTotals.get(col) || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistribusiBiayaPertama;