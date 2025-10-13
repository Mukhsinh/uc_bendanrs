import { supabase } from '@/integrations/supabase/client';

export interface BarangGizi {
  id: string;
  value: string;
  label: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
}

export interface BahanPorsi {
  id?: string;
  kode: string;
  jenis_makanan: string;
  nama_barang: string;
  satuan: string;
  konsumsi: number;
  harga: number;
  harga_bah: number; // Integer tanpa desimal
  biaya_produksi: number;
  biaya_bahan_porsi: number; // Integer tanpa desimal
  data_barang_gizi_id?: string;
  sumber_data?: string;
  breakdown_perhitungan?: string;
}

export interface BahanPorsiInput {
  kode: string;
  jenis_makanan: string;
  data_barang_gizi_id: string;
  konsumsi: number;
  biaya_produksi: number;
}

export class BahanPorsiService {
  // Search barang gizi untuk autocomplete
  static async searchBarangGizi(searchTerm: string = ''): Promise<BarangGizi[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_barang_gizi_for_autocomplete', { search_term: searchTerm });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error searching barang gizi:', error);
      throw error;
    }
  }

  // Get semua bahan porsi
  static async getAllBahanPorsi(): Promise<BahanPorsi[]> {
    try {
      const { data, error } = await supabase
        .from('view_bahan_porsi_with_barang_gizi')
        .select('*')
        .order('jenis_makanan', { ascending: true })
        .order('kode', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching bahan porsi:', error);
      throw error;
    }
  }

  // Get bahan porsi by jenis makanan
  static async getBahanPorsiByJenisMakanan(jenisMakanan: string): Promise<BahanPorsi[]> {
    try {
      const { data, error } = await supabase
        .from('view_bahan_porsi_with_barang_gizi')
        .select('*')
        .eq('jenis_makanan', jenisMakanan)
        .order('kode', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching bahan porsi by jenis makanan:', error);
      throw error;
    }
  }

  // Create bahan porsi baru
  static async createBahanPorsi(input: BahanPorsiInput): Promise<BahanPorsi> {
    try {
      const { data, error } = await supabase
        .from('bahan_porsi')
        .insert([input])
        .select(`
          *,
          data_barang_gizi:kode_barang_gizi,
          data_barang_gizi:nama_barang_gizi,
          data_barang_gizi:satuan_gizi,
          data_barang_gizi:harga_gizi
        `)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating bahan porsi:', error);
      throw error;
    }
  }

  // Update bahan porsi
  static async updateBahanPorsi(id: string, input: Partial<BahanPorsiInput>): Promise<BahanPorsi> {
    try {
      const { data, error } = await supabase
        .from('bahan_porsi')
        .update(input)
        .eq('id', id)
        .select(`
          *,
          data_barang_gizi:kode_barang_gizi,
          data_barang_gizi:nama_barang_gizi,
          data_barang_gizi:satuan_gizi,
          data_barang_gizi:harga_gizi
        `)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating bahan porsi:', error);
      throw error;
    }
  }

  // Delete bahan porsi
  static async deleteBahanPorsi(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bahan_porsi')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bahan porsi:', error);
      throw error;
    }
  }

  // Get perhitungan biaya bahan porsi per jenis makanan
  static async getBiayaBahanPorsiPerJenisMakanan(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_biaya_bahan_porsi_per_jenis_makanan');

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching perhitungan biaya bahan porsi:', error);
      throw error;
    }
  }

  // Get total biaya bahan porsi
  static async getTotalBiayaBahanPorsi(): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_total_biaya_bahan_porsi');

      if (error) throw error;
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching total biaya bahan porsi:', error);
      throw error;
    }
  }
}

export default BahanPorsiService;
