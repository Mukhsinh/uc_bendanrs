import { useState, useEffect, useCallback } from 'react';
import { BahanPorsiService, BarangGizi, BahanPorsi, BahanPorsiInput } from '@/services/bahanPorsiService';

export const useBahanPorsi = () => {
  const [bahanPorsi, setBahanPorsi] = useState<BahanPorsi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch semua bahan porsi
  const fetchBahanPorsi = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await BahanPorsiService.getAllBahanPorsi();
      setBahanPorsi(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching bahan porsi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch bahan porsi by jenis makanan
  const fetchBahanPorsiByJenisMakanan = useCallback(async (jenisMakanan: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await BahanPorsiService.getBahanPorsiByJenisMakanan(jenisMakanan);
      setBahanPorsi(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching bahan porsi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create bahan porsi
  const createBahanPorsi = useCallback(async (input: BahanPorsiInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const newBahanPorsi = await BahanPorsiService.createBahanPorsi(input);
      setBahanPorsi(prev => [...prev, newBahanPorsi]);
      return newBahanPorsi;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating bahan porsi');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update bahan porsi
  const updateBahanPorsi = useCallback(async (id: string, input: Partial<BahanPorsiInput>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedBahanPorsi = await BahanPorsiService.updateBahanPorsi(id, input);
      setBahanPorsi(prev => prev.map(item => 
        item.id === id ? updatedBahanPorsi : item
      ));
      return updatedBahanPorsi;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating bahan porsi');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete bahan porsi
  const deleteBahanPorsi = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await BahanPorsiService.deleteBahanPorsi(id);
      setBahanPorsi(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting bahan porsi');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchBahanPorsi();
  }, [fetchBahanPorsi]);

  return {
    bahanPorsi,
    isLoading,
    error,
    fetchBahanPorsi,
    fetchBahanPorsiByJenisMakanan,
    createBahanPorsi,
    updateBahanPorsi,
    deleteBahanPorsi,
  };
};

export const useBarangGiziSearch = () => {
  const [searchResults, setSearchResults] = useState<BarangGizi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBarangGizi = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const results = await BahanPorsiService.searchBarangGizi(searchTerm);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error searching barang gizi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    searchBarangGizi,
    clearSearch,
  };
};

export const useBiayaBahanPorsi = () => {
  const [biayaPerJenis, setBiayaPerJenis] = useState<any[]>([]);
  const [totalBiaya, setTotalBiaya] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch perhitungan biaya per jenis makanan
  const fetchBiayaPerJenis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await BahanPorsiService.getBiayaBahanPorsiPerJenisMakanan();
      setBiayaPerJenis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching biaya per jenis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch total biaya
  const fetchTotalBiaya = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await BahanPorsiService.getTotalBiayaBahanPorsi();
      setTotalBiaya(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching total biaya');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    biayaPerJenis,
    totalBiaya,
    isLoading,
    error,
    fetchBiayaPerJenis,
    fetchTotalBiaya,
  };
};

export default useBahanPorsi;
