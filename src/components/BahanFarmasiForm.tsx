import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';

interface BarangFarmasi {
  id: string;
  value: string;
  label: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
  gudang: string;
}

interface BahanFarmasiFormProps {
  kode: string;
  jenisPemeriksaan: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const BahanFarmasiForm: React.FC<BahanFarmasiFormProps> = ({
  kode,
  jenisPemeriksaan,
  onSave,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BarangFarmasi[]>([]);
  const [selectedBarang, setSelectedBarang] = useState<BarangFarmasi | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    qty: 1,
    hargaSatuan: 0,
    hargaTotal: 0
  });

  // Search barang farmasi
  const searchBarangFarmasi = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_barang_farmasi')
        .select('id, kode_barang, nama_barang, satuan, harga, gudang')
        .or(`nama_barang.ilike.%${term}%,kode_barang.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      
      const formattedResults = data?.map(item => ({
        id: item.id,
        value: item.kode_barang,
        label: `${item.nama_barang} (${item.kode_barang})`,
        kode_barang: item.kode_barang,
        nama_barang: item.nama_barang,
        satuan: item.satuan,
        harga: item.harga,
        gudang: item.gudang
      })) || [];
      
      setSearchResults(formattedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching barang farmasi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (selectedBarang) {
      setSelectedBarang(null);
    }
    searchBarangFarmasi(value);
  };

  // Handle barang selection
  const handleBarangSelect = (barang: BarangFarmasi) => {
    setSelectedBarang(barang);
    setSearchTerm(barang.label);
    setShowResults(false);
    setFormData(prev => ({
      ...prev,
      hargaSatuan: barang.harga,
      hargaTotal: barang.harga * prev.qty
    }));
  };

  // Handle qty change
  const handleQtyChange = (qty: number) => {
    setFormData(prev => ({
      ...prev,
      qty,
      hargaTotal: selectedBarang ? selectedBarang.harga * qty : 0
    }));
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!selectedBarang) {
      alert('Pilih barang farmasi terlebih dahulu');
      return;
    }

    if (formData.qty <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }
    
    const data = {
      kode_barang: selectedBarang.kode_barang,
      nama: selectedBarang.nama_barang,
      qty: formData.qty,
      harga_satuan: selectedBarang.harga,
      harga_total: formData.hargaTotal
    };

    onSave(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Menambah bahan farmasi untuk: {jenisPemeriksaan}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Kode - Read Only */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kode">Kode</Label>
            <Input id="kode" value={kode} readOnly className="bg-gray-100" />
          </div>
          <div>
            <Label htmlFor="jenis-pemeriksaan">Jenis Pemeriksaan</Label>
            <Input id="jenis-pemeriksaan" value={jenisPemeriksaan} readOnly className="bg-gray-100" />
          </div>
        </div>

        {/* Nama Barang - Autocomplete */}
        <div className="relative">
          <Label htmlFor="nama-barang">Nama Barang</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="nama-barang"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Ketik nama barang farmasi untuk mencari..."
              className="pl-10"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((barang) => (
                <div
                  key={barang.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  onClick={() => handleBarangSelect(barang)}
                >
                  <div className="font-medium">{barang.nama_barang}</div>
                  <div className="text-sm text-gray-500">
                    {barang.kode_barang} - {barang.satuan} - {barang.gudang} - Rp {barang.harga?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Satuan - Auto-filled */}
        <div>
          <Label htmlFor="satuan">Satuan</Label>
          <Input 
            id="satuan" 
            value={selectedBarang?.satuan || ''} 
            readOnly 
            className="bg-gray-100"
          />
        </div>

        {/* Qty */}
        <div>
          <Label htmlFor="qty">Jumlah</Label>
          <Input
            id="qty"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="1"
            value={formData.qty}
            onChange={(e) => handleQtyChange(parseFloat(e.target.value) || 1)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Masukkan jumlah dalam angka desimal (contoh: 1.5, 2.25)
          </p>
        </div>

        {/* Harga Satuan - Auto-filled */}
        <div>
          <Label htmlFor="harga-satuan">Harga Satuan</Label>
          <Input 
            id="harga-satuan" 
            value={selectedBarang?.harga?.toLocaleString() || ''} 
            readOnly 
            className="bg-gray-100"
          />
        </div>

        {/* Harga Total - Auto-calculated */}
        <div>
          <Label htmlFor="harga-total">Harga Total</Label>
          <Input 
            id="harga-total" 
            value={formData.hargaTotal.toLocaleString()} 
            readOnly 
            className="bg-blue-50 font-semibold"
          />
        </div>

        {/* Gudang - Auto-filled */}
        <div>
          <Label htmlFor="gudang">Gudang</Label>
          <Input 
            id="gudang" 
            value={selectedBarang?.gudang || ''} 
            readOnly 
            className="bg-gray-100"
          />
        </div>

        {/* Breakdown Perhitungan */}
        {selectedBarang && formData.qty > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Breakdown Perhitungan:</h4>
            <div className="text-sm space-y-1">
              <div>Jumlah: {formData.qty} {selectedBarang.satuan}</div>
              <div>Harga Satuan: Rp {selectedBarang.harga?.toLocaleString()}</div>
              <div className="font-semibold">Total: {formData.qty} × Rp {selectedBarang.harga?.toLocaleString()} = Rp {formData.hargaTotal.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!selectedBarang || formData.qty <= 0}
          >
            Tambah Bahan Farmasi
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BahanFarmasiForm;
