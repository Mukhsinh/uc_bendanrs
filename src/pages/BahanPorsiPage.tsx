import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calculator, List } from 'lucide-react';
import BahanPorsiForm from '@/components/BahanPorsiForm';
import { useBahanPorsi, useBiayaBahanPorsi } from '@/hooks/useBahanPorsi';

const BahanPorsiPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedJenisMakanan, setSelectedJenisMakanan] = useState('Makanan Biasa nasi VVIP');
  const { bahanPorsi, isLoading, createBahanPorsi } = useBahanPorsi();
  const { biayaPerJenis, totalBiaya, fetchBiayaPerJenis, fetchTotalBiaya } = useBiayaBahanPorsi();

  const handleSave = async (data: any) => {
    try {
      await createBahanPorsi(data);
      setShowForm(false);
      // Refresh calculations
      fetchBiayaPerJenis();
      fetchTotalBiaya();
    } catch (error) {
      console.error('Error saving bahan porsi:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const generateKode = () => {
    const count = bahanPorsi.filter(bp => bp.kode.startsWith('gz.')).length + 1;
    return `gz.${count.toString().padStart(3, '0')}`;
  };

  if (showForm) {
    return (
      <BahanPorsiForm
        kode={generateKode()}
        jenisMakanan={selectedJenisMakanan}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Bahan Porsi</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Bahan Porsi
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Daftar Bahan Porsi
          </TabsTrigger>
          <TabsTrigger value="calculation" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Perhitungan Biaya
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Ringkasan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Bahan Porsi</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {bahanPorsi.map((bahan) => (
                    <div key={bahan.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Kode</label>
                          <p className="font-semibold">{bahan.kode}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Jenis Makanan</label>
                          <p>{bahan.jenis_makanan}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nama Barang</label>
                          <p className="font-semibold">{bahan.nama_barang}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Sumber Data</label>
                          <p className={`text-sm ${bahan.sumber_data === 'Auto-filled from data_barang_gizi' ? 'text-green-600' : 'text-orange-600'}`}>
                            {bahan.sumber_data}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Konsumsi</label>
                          <p>{bahan.konsumsi} {bahan.satuan}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Harga</label>
                          <p>Rp {bahan.harga?.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Harga Bahan</label>
                          <p>Rp {bahan.harga_bah?.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Biaya Produksi</label>
                          <p>{bahan.biaya_produksi}%</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Biaya Bahan Porsi</label>
                          <p className="font-bold text-blue-600">Rp {bahan.biaya_bahan_porsi?.toLocaleString()}</p>
                        </div>
                      </div>

                      {bahan.breakdown_perhitungan && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <label className="text-sm font-medium text-gray-500">Breakdown Perhitungan:</label>
                          <p className="text-sm">{bahan.breakdown_perhitungan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {bahanPorsi.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Belum ada data bahan porsi. Klik "Tambah Bahan Porsi" untuk menambah data.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perhitungan Biaya per Jenis Makanan</CardTitle>
            </CardHeader>
            <CardContent>
              {biayaPerJenis.map((jenis) => (
                <div key={jenis.jenis_makanan} className="border rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-lg mb-2">{jenis.jenis_makanan}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Jumlah Bahan</label>
                      <p className="font-semibold">{jenis.jumlah_bahan}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Harga Bahan</label>
                      <p>Rp {jenis.total_harga_bahan?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Biaya Produksi</label>
                      <p>Rp {jenis.total_biaya_produksi?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Biaya Bahan Porsi</label>
                      <p className="font-bold text-blue-600">Rp {jenis.total_biaya_bahan_porsi?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Daftar Bahan:</strong> {jenis.daftar_bahan}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Total Biaya Bahan Porsi</CardTitle>
            </CardHeader>
            <CardContent>
              {totalBiaya && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800">Total Harga Bahan</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      Rp {totalBiaya.total_harga_bahan?.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-500 mt-1">Poin 1</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800">Total Biaya Produksi</h3>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {totalBiaya.total_biaya_produksi?.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-500 mt-1">Poin 2</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800">Total Biaya Bahan Porsi</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      Rp {totalBiaya.total_biaya_bahan_porsi?.toLocaleString()}
                    </p>
                    <p className="text-sm text-purple-500 mt-1">Poin 3 (Total)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BahanPorsiPage;
