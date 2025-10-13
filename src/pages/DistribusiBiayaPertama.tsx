import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, RefreshCw, Calculator } from 'lucide-react';
import * as XLSX from "xlsx";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

const DistribusiBiayaPertama: React.FC = () => {
  const [data, setData] = useState<DistribusiBiayaData[]>([]);
  const [filteredData, setFilteredData] = useState<DistribusiBiayaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // Filter states
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>('all');
  const [selectedTahun, setSelectedTahun] = useState<string>('2025');
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('api_distribusi_biaya_pertama', { p_tahun: parseInt(selectedTahun) });
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

  // Calculate distribusi biaya -> backend already recalculates; just refresh
  const calculateDistribusiBiaya = async () => {
    try {
      setCalculating(true);
      await loadData();
      toast.success('Data berhasil diperbarui');
    } catch (error) {
      console.error('Error calculating:', error);
      toast.error('Terjadi kesalahan saat memperbarui');
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

    if (selectedTahun !== 'all') {
      filtered = filtered.filter(item => item.tahun === parseInt(selectedTahun));
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.unit_kerja_pusat_biaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dasar_alokasi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  // Download report
  const downloadReport = () => {
    const wb = generateExcel(filteredData);
    XLSX.writeFile(wb, `distribusi_biaya_pertama_${selectedTahun}.xlsx`);
  };

  // Generate Excel content
  const generateExcel = (data: DistribusiBiayaData[]) => {
    const headers = [
      'Unit Kerja Pusat Biaya',
      'Biaya Tahunan',
      'Dasar Alokasi',
      'Tahun',
      'Jumlah Biaya Terdistribusi I',
      'Audit Check',
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
      'UK077 Unit Diklat'
    ];

    const rows = data.map(item => [
      item.unit_kerja_pusat_biaya,
      item.biaya_tahunan,
      item.dasar_alokasi,
      item.tahun,
      item.jumlah_biaya_terdistribusi_i ?? 0,
      item.audit_check ?? '',
      item.uk001_direktur,
      item.uk002_komite_ppi,
      item.uk003_komite_pmkp,
      item.uk004_komite_medik,
      item.uk005_akreditasi,
      item.uk006_dewan_pengawas,
      item.uk007_bid_pengembangan_dan_penunjang_pelayanan,
      item.uk008_seksi_penunjang_non_medis_dan_pengembangan_penunjang_pela,
      item.uk009_ipsrs_medis_dan_non_medis,
      item.uk010_seksi_penunjang_pelayanan_medis,
      item.uk011_bid_keperawatan,
      item.uk012_seksi_asuhan_pelayanan_keperawatan,
      item.uk013_seksi_pengembangan_dan_etika_keperawatan,
      item.uk014_bid_pelayanan_medis,
      item.uk015_seksi_pengembangan_pelayanan_medis,
      item.uk016_seksi_pelayanan_medis_dan_rekam_medis,
      item.uk017_tpprj,
      item.uk018_tppri,
      item.uk019_bag_tata_usaha,
      item.uk020_subag_keuangan,
      item.uk021_unit_perbendaharaan,
      item.uk022_unit_pendapatan,
      item.uk023_unit_akuntansi_dan_verifikasi,
      item.uk024_unit_akuntansi_manajemen,
      item.uk025_analis_biaya_dan_kasir,
      item.uk026_subag_umpeg,
      item.uk027_staf_umum_dan_kepegawaian,
      item.uk028_unit_it,
      item.uk029_rumah_tangga,
      item.uk030_cleaning_service,
      item.uk031_security,
      item.uk032_unit_aset,
      item.uk033_instalasi_humas_komplain,
      item.uk034_subag_renval,
      item.uk035_staf_renval,
      item.uk036_rekam_medik,
      item.uk037_ambulance,
      item.uk038_laboratorium_pk_pa,
      item.uk039_radiologi,
      item.uk040_farmasi,
      item.uk041_rehab_medik,
      item.uk042_gizi_dapur,
      item.uk043_laundry_cssd,
      item.uk044_bdrs,
      item.uk045_cathlab,
      item.uk046_terang_bulan_vip_vvip,
      item.uk047_truntum,
      item.uk048_sekarjagat,
      item.uk049_jlamprang,
      item.uk050_nifas,
      item.uk051_perinatologi,
      item.uk052_buketan,
      item.uk053_icu_picu_nicu,
      item.uk054_vk,
      item.uk055_igd_ponek,
      item.uk056_klinik_kebid_kandungan,
      item.uk057_klinik_bedah_mulut,
      item.uk058_klinik_syaraf,
      item.uk059_klinik_bedah_syaraf,
      item.uk060_klinik_bedah_digestif,
      item.uk061_klinik_bedah_umum,
      item.uk062_klinik_anak,
      item.uk063_klinik_penyakit_dalam,
      item.uk064_klinik_mata,
      item.uk065_klinik_kulit_kelamin,
      item.uk066_klinik_tht,
      item.uk067_klinik_gigi,
      item.uk068_klinik_jantung,
      item.uk069_klinik_dot_vct_cst,
      item.uk070_klinik_paru,
      item.uk071_klinik_orthopedi,
      item.uk072_klinik_jiwa,
      item.uk073_klinik_parikesit,
      item.uk074_ibs,
      item.uk075_pemulasaran_jenazah,
      item.uk076_hemodialisis,
      item.uk077_unit_diklat
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Distribusi Biaya Pertama");
    return wb;
  };

  // Format currency (integer)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedUnitKerja, selectedTahun, searchTerm, data]);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Distribusi Biaya Pertama</h1>
          <p className="text-muted-foreground">
            Perhitungan distribusi biaya berdasarkan rumus yang telah divalidasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={calculateDistribusiBiaya}
            disabled={calculating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {calculating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            Perbarui
          </Button>
          <Button onClick={downloadReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
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
            
            <div>
              <Label htmlFor="tahun">Tahun</Label>
              <Select value={selectedTahun} onValueChange={setSelectedTahun}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Pencarian</Label>
              <Input
                id="search"
                placeholder="Cari unit kerja atau dasar alokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                Terapkan Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-sm text-muted-foreground">Total Unit Kerja</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredData.reduce((sum, item) => sum + (item.biaya_tahunan || 0), 0) / (filteredData.length || 1)
              )}
            </div>
            <p className="text-sm text-muted-foreground">Rata-rata Biaya Tahunan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredData.reduce((sum, item) => sum + (item.jumlah_biaya_terdistribusi_i || 0), 0)
              )}
            </div>
            <p className="text-sm text-muted-foreground">Total Alokasi (Terdistribusi I)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(filteredData.map(item => item.dasar_alokasi)).size}
            </div>
            <p className="text-sm text-muted-foreground">Jenis Dasar Alokasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Distribusi Biaya Pertama</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Dasar Alokasi</TableHead>
                  <TableHead>Biaya Tahunan</TableHead>
                  <TableHead>Terdistribusi I</TableHead>
                  <TableHead>Audit</TableHead>
                  <TableHead>Direktur</TableHead>
                  <TableHead>Komite PPI</TableHead>
                  <TableHead>Komite PMKP</TableHead>
                  <TableHead>Komite Medik</TableHead>
                  <TableHead>Akreditasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
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
                      <Badge variant={item.audit_check === 'OK' ? 'default' : 'destructive'}>
                        {item.audit_check || ''}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.uk001_direktur)}</TableCell>
                    <TableCell>{formatCurrency(item.uk002_komite_ppi)}</TableCell>
                    <TableCell>{formatCurrency(item.uk003_komite_pmkp)}</TableCell>
                    <TableCell>{formatCurrency(item.uk004_komite_medik)}</TableCell>
                    <TableCell>{formatCurrency(item.uk005_akreditasi)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistribusiBiayaPertama;