import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Calculator, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DasarAlokasi, getDasarAlokasiLabel } from '@/types/dasar-alokasi';

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  luas_ruangan: number;
}

interface DataKegiatan {
  id: number;
  Kode_UK: string;
  Nama_Unit_Kerja: string;
  Jumlah_SDM: number;
  Total_Kunjungan_Pasien: number;
  Komputer_simrs_user: number;
}

export default function DasarAlokasiFormTable() {
  const [dasarAlokasi, setDasarAlokasi] = useState<DasarAlokasi[]>([]);
  const [unitKerja, setUnitKerja] = useState<UnitKerja[]>([]);
  const [dataKegiatan, setDataKegiatan] = useState<DataKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [totalBiaya, setTotalBiaya] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  // supabase sudah diimport dari client.ts

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data for year:', tahun);
      
      // Fetch unit kerja
      const { data: unitKerjaData, error: unitKerjaError } = await supabase
        .from('unit_kerja')
        .select('*')
        .order('nama');

      if (unitKerjaError) {
        console.error('Unit kerja error:', unitKerjaError);
        setError(`Error fetching unit kerja: ${unitKerjaError.message}`);
        return;
      }
      console.log('Unit kerja data:', unitKerjaData?.length || 0, 'records');
      setUnitKerja(unitKerjaData || []);

      // Fetch data kegiatan
      const { data: dataKegiatanData, error: dataKegiatanError } = await supabase
        .from('data_kegiatan')
        .select('id, Kode_UK, Nama_Unit_Kerja, Jumlah_SDM, Total_Kunjungan_Pasien, Komputer_simrs_user')
        .eq('tahun', tahun);

      if (dataKegiatanError) {
        console.error('Data kegiatan error:', dataKegiatanError);
        setError(`Error fetching data kegiatan: ${dataKegiatanError.message}`);
        return;
      }
      console.log('Data kegiatan data:', dataKegiatanData?.length || 0, 'records');
      setDataKegiatan(dataKegiatanData || []);

      // Fetch dasar alokasi (optional - table might not exist yet)
      const { data: dasarAlokasiData, error: dasarAlokasiError } = await supabase
        .from('dasar_alokasi')
        .select('*')
        .eq('tahun', tahun)
        .order('nama_unit_kerja');

      if (dasarAlokasiError) {
        console.log('Dasar alokasi table not found or error:', dasarAlokasiError.message);
        setDasarAlokasi([]);
      } else {
        console.log('Dasar alokasi data:', dasarAlokasiData?.length || 0, 'records');
        setDasarAlokasi(dasarAlokasiData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDasarAlokasi = async () => {
    try {
      setGenerating(true);
      console.log('Starting generate dasar alokasi for year:', tahun);
      
      const { data, error } = await supabase.rpc('generate_dasar_alokasi_otomatis', {
        tahun_param: tahun
      });

      console.log('RPC result:', { data, error });

      if (error) {
        console.error('RPC error details:', error);
        throw error;
      }

      console.log('Generate dasar alokasi successful');
      toast({
        title: "Berhasil",
        description: `Dasar alokasi berhasil digenerate untuk tahun ${tahun}`,
      });

      await fetchData();
    } catch (error) {
      console.error('Error generating dasar alokasi:', error);
      toast({
        title: "Error",
        description: `Gagal generate dasar alokasi: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const hitungDistribusiBiaya = async () => {
    if (totalBiaya <= 0) {
      toast({
        title: "Error",
        description: "Total biaya harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      console.log('Starting hitung distribusi biaya for year:', tahun, 'total biaya:', totalBiaya);
      
      const { data, error } = await supabase.rpc('hitung_distribusi_biaya', {
        tahun_param: tahun,
        total_biaya: totalBiaya
      });

      console.log('RPC result:', { data, error });

      if (error) {
        console.error('RPC error details:', error);
        throw error;
      }

      console.log('Hitung distribusi biaya successful');
      toast({
        title: "Berhasil",
        description: `Distribusi biaya berhasil dihitung untuk tahun ${tahun}`,
      });

    } catch (error) {
      console.error('Error calculating distribution:', error);
      toast({
        title: "Error",
        description: `Gagal menghitung distribusi biaya: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getDasarAlokasiValue = (unitKerja: UnitKerja, dataKegiatan: DataKegiatan | undefined, field: string): number => {
    if (!dataKegiatan) return 0;
    
    switch (field) {
      case 'Jumlah_SDM':
        return dataKegiatan.Jumlah_SDM || 0;
      case 'Total_Kunjungan_Pasien':
        return dataKegiatan.Total_Kunjungan_Pasien || 0;
      case 'Komputer_simrs_user':
        return dataKegiatan.Komputer_simrs_user || 0;
      case 'Luas_Ruangan':
        return unitKerja.luas_ruangan || 0;
      default:
        return 0;
    }
  };

  const getTotalDasarAlokasi = (kategori: string): number => {
    return dasarAlokasi
      .filter(da => da.kategori === kategori)
      .reduce((sum, da) => sum + (da.nilai_alokasi || 0), 0);
  };

  const getPersentaseAlokasi = (value: number, kategori: string): number => {
    const total = getTotalDasarAlokasi(kategori);
    return total > 0 ? (value / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dasar Alokasi Biaya
          </CardTitle>
          <CardDescription>
            Kelola dasar alokasi untuk distribusi biaya berdasarkan unit kerja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
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
            <div>
              <Label htmlFor="totalBiaya">Total Biaya (Rp)</Label>
              <Input
                id="totalBiaya"
                type="number"
                value={totalBiaya}
                onChange={(e) => setTotalBiaya(parseFloat(e.target.value) || 0)}
                placeholder="Masukkan total biaya"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={generateDasarAlokasi}
                disabled={generating}
                className="flex-1"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Generate Dasar Alokasi
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={hitungDistribusiBiaya}
              disabled={generating || totalBiaya <= 0}
              variant="outline"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Hitung Distribusi Biaya
            </Button>
            <Button
              onClick={fetchData}
              disabled={generating}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {dasarAlokasi.length === 0 && (
            <Alert>
              <AlertDescription>
                Belum ada data dasar alokasi untuk tahun {tahun}. 
                Klik "Generate Dasar Alokasi" untuk membuat data otomatis berdasarkan unit kerja dan data kegiatan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {dasarAlokasi.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Dasar Alokasi - Tahun {tahun}</CardTitle>
            <CardDescription>
              Dasar alokasi untuk setiap unit kerja berdasarkan field yang ditentukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode UK</TableHead>
                    <TableHead>Nama Unit Kerja</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Dasar Alokasi</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Total Field</TableHead>
                    <TableHead>Persentase</TableHead>
                    <TableHead>Biaya Dialokasikan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dasarAlokasi.map((da) => {
                    const persentase = getPersentaseAlokasi(da.nilai_alokasi || 0, da.kategori || '');
                    const biayaDialokasikan = (totalBiaya * persentase) / 100;
                    
                    return (
                      <TableRow key={da.id}>
                        <TableCell className="font-medium">{da.kode_unit_kerja}</TableCell>
                        <TableCell>{da.nama_unit_kerja}</TableCell>
                        <TableCell>
                          <Badge variant={da.kategori === 'Biaya Langsung' ? 'default' : 'secondary'}>
                            {da.kategori}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {da.basis_alokasi || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {da.nilai_alokasi?.toLocaleString('id-ID') || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {getTotalDasarAlokasi(da.kategori || '').toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {persentase.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {biayaDialokasikan.toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
