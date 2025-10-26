import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';
// import BahanPorsiList from './BahanPorsiList';
// import BahanPorsiEditForm from './BahanPorsiEditForm';

interface BarangGizi {
  id: string;
  value: string;
  label: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
}

interface BahanPorsiItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
  konsumsi: number;
  biaya_produksi: number;
  harga_bahan: number;
  biaya_bahan_porsi: number;
}

interface BahanPorsiFormProps {
  kode: string;
  jenisMakanan: string;
  onSave: (data: BahanPorsiItem[]) => void;
  onCancel: () => void;
  onRefresh?: () => void;
}

export const BahanPorsiForm: React.FC<BahanPorsiFormProps> = ({
  kode,
  jenisMakanan,
  onSave,
  onCancel,
  onRefresh
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

  // Preview items
  const [previewItems, setPreviewItems] = useState<BahanPorsiItem[]>([]);
  
  // Edit mode
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [existingItems, setExistingItems] = useState<any[]>([]);

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
      
      // Ensure harga is parsed as number
      const processedData = (data || []).map(item => ({
        ...item,
        harga: typeof item.harga === 'string' ? parseFloat(item.harga) : item.harga
      }));
      
      setSearchResults(processedData);
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
    if (value.length >= 2) {
      searchBarangGizi(value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Handle barang selection
  const handleBarangSelect = (barang: BarangGizi) => {
    setSelectedBarang(barang);
    setSearchTerm(barang.label);
    setShowResults(false);
    
    // Auto-fill form data when barang is selected
    console.log('Selected barang:', barang);
    console.log('Satuan:', barang.satuan);
    console.log('Harga:', barang.harga);
    
    // Force re-render to show auto-filled values
    setTimeout(() => {
      console.log('Form should now show auto-filled values');
    }, 100);
  };

  // Calculate biaya bahan porsi (integer tanpa desimal)
  const calculateBiayaBahanPorsi = () => {
    if (!selectedBarang || formData.konsumsi <= 0) return 0;
    
    const hargaBahan = Math.round(formData.konsumsi * selectedBarang.harga);
    const biayaProduksi = Math.round(hargaBahan * (formData.biayaProduksi / 100));
    
    return hargaBahan + biayaProduksi;
  };

  // Handle tambah to preview
  const handleTambah = () => {
    if (!selectedBarang) {
      alert('Pilih barang gizi terlebih dahulu');
      return;
    }

    if (formData.konsumsi <= 0) {
      alert('Masukkan konsumsi yang valid');
      return;
    }

    const hargaBahan = Math.round(formData.konsumsi * selectedBarang.harga);
    const biayaProduksi = Math.round(hargaBahan * (formData.biayaProduksi / 100));
    const biayaBahanPorsi = hargaBahan + biayaProduksi;

    const newItem: BahanPorsiItem = {
      id: selectedBarang.id, // Use actual barang gizi ID
      kode_barang: selectedBarang.kode_barang,
      nama_barang: selectedBarang.nama_barang,
      satuan: selectedBarang.satuan,
      harga: selectedBarang.harga,
      konsumsi: formData.konsumsi,
      biaya_produksi: formData.biayaProduksi,
      harga_bahan: hargaBahan,
      biaya_bahan_porsi: biayaBahanPorsi
    };

    setPreviewItems(prev => [...prev, newItem]);
    
    // Reset form
    setSelectedBarang(null);
    setSearchTerm('');
    setFormData({ konsumsi: 0, biayaProduksi: 15 });
  };

  // Handle simpan all items
  const handleSimpan = async () => {
    if (previewItems.length === 0) {
      alert('Tidak ada item untuk disimpan');
      return;
    }

    try {
      const dataToSave = previewItems.map(item => ({
        kode,
        jenis_makanan: jenisMakanan,
        konsumsi: item.konsumsi,
        biaya_produksi: item.biaya_produksi,
        data_barang_gizi_id: item.id // Use the actual barang gizi ID
      }));

      onSave(dataToSave as unknown as BahanPorsiItem[]);
      setPreviewItems([]); // Clear preview items
      loadExistingItems(); // Reload existing items
    } catch (error) {
      console.error('Error saving bahan porsi:', error);
      alert('Gagal menyimpan bahan porsi');
    }
  };

  // Remove item from preview
  const handleRemoveItem = (itemId: string) => {
    setPreviewItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle edit existing item
  const handleEditItem = (item: any) => {
    setEditingItem(item);
  };

  // Handle save edited item
  const handleSaveEdit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('bahan_porsi')
        .update({
          konsumsi: data.konsumsi,
          biaya_produksi: data.biaya_produksi,
          data_barang_gizi_id: data.data_barang_gizi_id
        })
        .eq('id', data.id);

      if (error) throw error;
      
      alert('Bahan porsi berhasil diperbarui');
      setEditingItem(null);
      loadExistingItems(); // Reload existing items
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating bahan porsi:', error);
      alert('Gagal memperbarui bahan porsi');
    }
  };

  // Handle delete existing item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bahan porsi ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bahan_porsi')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Bahan porsi berhasil dihapus');
      loadExistingItems(); // Reload existing items
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting bahan porsi:', error);
      alert('Gagal menghapus bahan porsi');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  // Load existing bahan porsi
  const loadExistingItems = useCallback(async () => {
    setIsLoadingExisting(true);
    try {
      const { data, error } = await supabase
        .from('bahan_porsi')
        .select(`
          *,
          data_barang_gizi (
            kode_barang,
            nama_barang,
            satuan,
            harga
          )
        `)
        .eq('kode', kode)
        .eq('jenis_makanan', jenisMakanan);

      if (error) throw error;
      setExistingItems(data || []);
    } catch (error) {
      console.error('Error loading existing items:', error);
    } finally {
      setIsLoadingExisting(false);
    }
  }, [kode, jenisMakanan]);

  // Load existing items on mount
  useEffect(() => {
    loadExistingItems();
  }, [kode, jenisMakanan, loadExistingItems]);

  return (
    <>
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
            className={`bg-gray-100 ${selectedBarang?.satuan ? 'border-green-300 bg-green-50' : ''}`}
            placeholder={selectedBarang ? 'Otomatis terisi dari data barang' : 'Pilih barang terlebih dahulu'}
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
            value={selectedBarang?.harga ? selectedBarang.harga.toLocaleString() : ''} 
            readOnly 
            className={`bg-gray-100 ${selectedBarang?.harga ? 'border-green-300 bg-green-50' : ''}`}
            placeholder={selectedBarang ? 'Otomatis terisi dari data barang' : 'Pilih barang terlebih dahulu'}
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
            className={`bg-gray-100 ${selectedBarang && formData.konsumsi > 0 ? 'border-blue-300 bg-blue-50' : ''}`}
            placeholder="Otomatis dihitung: Konsumsi × Harga"
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
            onClick={handleTambah}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!selectedBarang || formData.konsumsi <= 0}
          >
            Tambah ke Preview
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
        </div>

        {/* Preview Section */}
        {previewItems.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Preview Bahan Porsi</h3>
            <div className="space-y-2">
              {previewItems.map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{item.nama_barang}</div>
                      <div className="text-sm text-gray-600">
                        {item.kode_barang} - {item.satuan}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Konsumsi: {item.konsumsi} | Harga: Rp {item.harga.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Harga Bahan: Rp {item.harga_bahan.toLocaleString()} | 
                        Biaya Produksi: {item.biaya_produksi}% | 
                        Total: Rp {item.biaya_bahan_porsi.toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Summary */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Biaya Bahan Porsi:</span>
                <span className="font-bold text-lg">
                  Rp {previewItems.reduce((sum, item) => sum + item.biaya_bahan_porsi, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Final Save Button */}
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleSimpan}
                className="bg-green-600 hover:bg-green-700"
              >
                Simpan Semua Bahan Porsi
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Existing Items Section */}
    {existingItems.length > 0 && (
      <Card className="w-full max-w-2xl mx-auto mt-4">
        <CardHeader>
          <CardTitle>Bahan Porsi yang Sudah Ada ({existingItems.length} item)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {existingItems.map((item, index) => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.data_barang_gizi?.nama_barang || item.nama_barang || 'N/A'}</div>
                    <div className="text-sm text-gray-600">
                      Konsumsi: {item.konsumsi} | Biaya Produksi: {item.biaya_produksi}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Edit Form - Simplified */}
    {editingItem && (
      <Card className="w-full max-w-2xl mx-auto mt-4">
        <CardHeader>
          <CardTitle>Edit Bahan Porsi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Nama Barang</Label>
              <Input value={editingItem.data_barang_gizi?.nama_barang || editingItem.nama_barang || 'N/A'} readOnly />
            </div>
            <div>
              <Label>Konsumsi</Label>
              <Input 
                type="number" 
                value={editingItem.konsumsi} 
                onChange={(e) => {
                  const updatedItem = { ...editingItem, konsumsi: parseFloat(e.target.value) || 0 };
                  setEditingItem(updatedItem);
                }}
              />
            </div>
            <div>
              <Label>Biaya Produksi (%)</Label>
              <Input 
                type="number" 
                value={editingItem.biaya_produksi} 
                onChange={(e) => {
                  const updatedItem = { ...editingItem, biaya_produksi: parseFloat(e.target.value) || 0 };
                  setEditingItem(updatedItem);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleSaveEdit(editingItem)}
                className="bg-green-600 hover:bg-green-700"
              >
                Simpan Perubahan
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Batal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )}
    </>
  );
};

export default BahanPorsiForm;
