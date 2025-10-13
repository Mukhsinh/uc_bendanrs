import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';

interface BarangGizi {
  id: string;
  value: string;
  label: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
}

interface BahanPorsiFormProps {
  kode: string;
  jenisMakanan: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const BahanPorsiForm: React.FC<BahanPorsiFormProps> = ({
  kode,
  jenisMakanan,
  onSave,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BarangGizi[]>([]);
  const [selectedBarang, setSelectedBarang] = useState<BarangGizi | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    konsumsi: 0,
    biayaProduksi: 15
  });

  // Search barang gizi
  const searchBarangGizi = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_barang_gizi_for_autocomplete', { search_term: term });

      if (error) throw error;
      
      setSearchResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching barang gizi:', error);
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
    searchBarangGizi(value);
  };

  // Handle barang selection
  const handleBarangSelect = (barang: BarangGizi) => {
    setSelectedBarang(barang);
    setSearchTerm(barang.label);
    setShowResults(false);
  };

  // Calculate biaya bahan porsi (integer tanpa desimal)
  const calculateBiayaBahanPorsi = () => {
    if (!selectedBarang || formData.konsumsi <= 0) return 0;
    
    const hargaBahan = Math.round(formData.konsumsi * selectedBarang.harga);
    const biayaProduksi = Math.round(hargaBahan * (formData.biayaProduksi / 100));
    
    return hargaBahan + biayaProduksi;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!selectedBarang) {
      alert('Pilih barang gizi terlebih dahulu');
      return;
    }

    const biayaBahanPorsi = calculateBiayaBahanPorsi();
    
    const data = {
      kode,
      jenis_makanan: jenisMakanan,
      konsumsi: formData.konsumsi,
      biaya_produksi: formData.biayaProduksi,
      data_barang_gizi_id: selectedBarang.id
      // Note: nama_barang, satuan, harga will be auto-filled by trigger from data_barang_gizi_id
      // harga_bah and biaya_bahan_porsi are computed fields (GENERATED ALWAYS)
      // They will be automatically calculated by the database
    };

    onSave(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Menambah bahan porsi untuk: {jenisMakanan}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Kode - Read Only */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kode">Kode</Label>
            <Input id="kode" value={kode} readOnly className="bg-gray-100" />
          </div>
          <div>
            <Label htmlFor="jenis-makanan">Jenis Makanan</Label>
            <Input id="jenis-makanan" value={jenisMakanan} readOnly className="bg-gray-100" />
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
              placeholder="Ketik nama barang untuk mencari..."
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
                    {barang.kode_barang} - {barang.satuan} - Rp {barang.harga?.toLocaleString()}
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

        {/* Konsumsi */}
        <div>
          <Label htmlFor="konsumsi">Konsumsi</Label>
          <Input
            id="konsumsi"
            type="number"
            step="0.01"
            value={formData.konsumsi}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              konsumsi: parseFloat(e.target.value) || 0 
            }))}
          />
        </div>

        {/* Harga - Auto-filled */}
        <div>
          <Label htmlFor="harga">Harga</Label>
          <Input 
            id="harga" 
            value={selectedBarang?.harga?.toLocaleString() || ''} 
            readOnly 
            className="bg-gray-100"
          />
        </div>

        {/* Harga Bahan - Auto-calculated */}
        <div>
          <Label htmlFor="harga-bahan">Harga Bahan</Label>
          <Input 
            id="harga-bahan" 
            value={selectedBarang && formData.konsumsi > 0 
              ? Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString() 
              : '0'
            } 
            readOnly 
            className="bg-gray-100"
          />
        </div>

        {/* Biaya Produksi */}
        <div>
          <Label htmlFor="biaya-produksi">Biaya Produksi (%)</Label>
          <Select 
            value={formData.biayaProduksi.toString()} 
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              biayaProduksi: parseInt(value) 
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0%</SelectItem>
              <SelectItem value="5">5%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="15">15%</SelectItem>
              <SelectItem value="20">20%</SelectItem>
              <SelectItem value="25">25%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Biaya Bahan Porsi - Auto-calculated */}
        <div>
          <Label htmlFor="biaya-bahan-porsi">Biaya Bahan Porsi</Label>
          <Input 
            id="biaya-bahan-porsi" 
            value={calculateBiayaBahanPorsi().toLocaleString()} 
            readOnly 
            className="bg-blue-50 font-semibold"
          />
        </div>

        {/* Breakdown Perhitungan */}
        {selectedBarang && formData.konsumsi > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Breakdown Perhitungan:</h4>
            <div className="text-sm space-y-1">
              <div>Poin 1 (Harga Bahan): {formData.konsumsi} × {selectedBarang.harga?.toLocaleString()} = {Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString()}</div>
              <div>Poin 2 (Biaya Produksi): {Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString()} × {formData.biayaProduksi}% = {Math.round(Math.round(formData.konsumsi * selectedBarang.harga) * formData.biayaProduksi / 100).toLocaleString()}</div>
              <div className="font-semibold">Poin 3 (Total): {Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString()} + {Math.round(Math.round(formData.konsumsi * selectedBarang.harga) * formData.biayaProduksi / 100).toLocaleString()} = {calculateBiayaBahanPorsi().toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700"
            disabled={!selectedBarang || formData.konsumsi <= 0}
          >
            Tambah Bahan Porsi
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BahanPorsiForm;
