import React, { useState, useEffect } from 'react';
import { useYear } from '@/contexts/YearContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Download, FileText } from 'lucide-react';
import * as XLSX from "xlsx";
import { useToast } from '@/hooks/use-toast';
import { DistribusiBiaya } from '@/types/dasar-alokasi';

export default function DistribusiBiayaPage() {
  const [distribusiBiaya, setDistribusiBiaya] = useState<DistribusiBiaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [totalBiaya, setTotalBiaya] = useState<number>(0);
  const { toast } = useToast();
  // supabase sudah diimport dari client.ts

  useEffect(() => {
    fetchDistribusiBiaya();
  }, [tahun]);

  const fetchDistribusiBiaya = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('distribusi_biaya')
        .select('*')
        .eq('tahun', tahun)
        .order('nama_unit_kerja_tujuan');

      if (error) throw error;
      setDistribusiBiaya(data || []);

      // Hitung total biaya dari data
      const total = data?.reduce((sum, item) => sum + (item.nilai_distribusi || 0), 0) || 0;
      setTotalBiaya(total);

    } catch (error) {
      console.error('Error fetching distribusi biaya:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data distribusi biaya",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (distribusiBiaya.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Kode Distribusi',
      'Nama Distribusi',
      'Unit Kerja Tujuan',
      'Jenis Biaya',
      'Kategori Distribusi',
      'Nilai Biaya Sumber',
      'Persentase Distribusi (%)',
      'Nilai Distribusi (Rp)',
      'Basis Perhitungan',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...distribusiBiaya.map(item => [
        item.kode_distribusi || '',
        `"${item.nama_distribusi || ''}"`,
        `"${item.nama_unit_kerja_tujuan || ''}"`,
        item.jenis_biaya || '',
        item.kategori_distribusi || '',
        item.nilai_biaya_sumber || 0,
        item.persentase_distribusi || 0,
        item.nilai_distribusi || 0,
        `"${item.basis_perhitungan || ''}"`,
        item.status || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `distribusi_biaya_${tahun}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: `Data distribusi biaya tahun ${tahun} berhasil diekspor`,
    });
  };

  const getSummaryByJenisBiaya = () => {
    const summary: Record<string, { total: number; count: number; biaya: number }> = {};
    
    distribusiBiaya.forEach(item => {
      const jenis = item.jenis_biaya || 'Unknown';
      if (!summary[jenis]) {
        summary[jenis] = { total: 0, count: 0, biaya: 0 };
      }
      summary[jenis].total += item.nilai_biaya_sumber || 0;
      summary[jenis].count += 1;
      summary[jenis].biaya += item.nilai_distribusi || 0;
    });

    return summary;
  };

  const getSummaryByKategori = () => {
    const summary: Record<string, { count: number; biaya: number }> = {};
    
    distribusiBiaya.forEach(item => {
      const kategori = item.kategori_distribusi || 'Unknown';
      if (!summary[kategori]) {
        summary[kategori] = { count: 0, biaya: 0 };
      }
      summary[kategori].count += 1;
      summary[kategori].biaya += item.nilai_distribusi || 0;
    });

    return summary;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data distribusi biaya...</span>
      </div>
    );
  }

  const summaryByJenisBiaya = getSummaryByJenisBiaya();
  const summaryByKategori = getSummaryByKategori();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Distribusi Biaya - Tahun {tahun}
          </CardTitle>
          <CardDescription>
            Laporan distribusi biaya berdasarkan dasar alokasi unit kerja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex items-end gap-2">
              <Button
                onClick={fetchDistribusiBiaya}
                disabled={loading}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={exportToCSV}
                disabled={distribusiBiaya.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {distribusiBiaya.length === 0 && (
            <Alert>
              <AlertDescription>
                Belum ada data distribusi biaya untuk tahun {tahun}. 
                Silakan hitung distribusi biaya terlebih dahulu di halaman Dasar Alokasi.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {distribusiBiaya.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Biaya Dialokasikan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp {totalBiaya.toLocaleString('id-ID')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Jumlah Unit Kerja</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {distribusiBiaya.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Jumlah Jenis Biaya</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(summaryByJenisBiaya).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary by Jenis Biaya */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Berdasarkan Jenis Biaya</CardTitle>
              <CardDescription>
                Distribusi biaya berdasarkan jenis biaya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis Biaya</TableHead>
                      <TableHead>Jumlah Unit</TableHead>
                      <TableHead>Total Nilai Sumber</TableHead>
                      <TableHead>Total Biaya Dialokasikan</TableHead>
                      <TableHead>Persentase dari Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(summaryByJenisBiaya).map(([jenis, data]) => (
                      <TableRow key={jenis}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{jenis}</Badge>
                        </TableCell>
                        <TableCell>{data.count}</TableCell>
                        <TableCell className="text-right">
                          Rp {data.total.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {data.biaya.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalBiaya > 0 ? ((data.biaya / totalBiaya) * 100).toFixed(2) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary by Kategori */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Berdasarkan Kategori</CardTitle>
              <CardDescription>
                Distribusi biaya berdasarkan kategori unit kerja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Jumlah Unit</TableHead>
                      <TableHead>Total Biaya Dialokasikan</TableHead>
                      <TableHead>Persentase dari Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(summaryByKategori).map(([kategori, data]) => (
                      <TableRow key={kategori}>
                        <TableCell className="font-medium">
                          <Badge variant={kategori === 'Pusat Biaya' ? 'default' : 'secondary'}>
                            {kategori}
                          </Badge>
                        </TableCell>
                        <TableCell>{data.count}</TableCell>
                        <TableCell className="text-right">
                          Rp {data.biaya.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalBiaya > 0 ? ((data.biaya / totalBiaya) * 100).toFixed(2) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detail Data */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Distribusi Biaya</CardTitle>
              <CardDescription>
                Detail distribusi biaya untuk setiap unit kerja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Distribusi</TableHead>
                      <TableHead>Nama Distribusi</TableHead>
                      <TableHead>Unit Kerja Tujuan</TableHead>
                      <TableHead>Jenis Biaya</TableHead>
                      <TableHead>Kategori Distribusi</TableHead>
                      <TableHead>Persentase</TableHead>
                      <TableHead>Biaya Dialokasikan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distribusiBiaya.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.kode_distribusi}</TableCell>
                        <TableCell>{item.nama_distribusi}</TableCell>
                        <TableCell>{item.nama_unit_kerja_tujuan}</TableCell>
                        <TableCell>
                          <Badge variant={item.jenis_biaya === 'Biaya Langsung' ? 'default' : 'secondary'}>
                            {item.jenis_biaya}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.kategori_distribusi}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.persentase_distribusi?.toFixed(2) || 0}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {item.nilai_distribusi?.toLocaleString('id-ID') || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Processed' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
