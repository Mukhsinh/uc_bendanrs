import { supabase } from "@/integrations/supabase/client";

export interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: "Pusat Biaya" | "Pusat Pendapatan";
  jenis?: number;
}

export const fetchUnitKerjaPusatPendapatan = async (): Promise<UnitKerja[]> => {
  try {
    console.log("Fetching unit kerja Pusat Pendapatan...");
    
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('id, kode, nama, kategori, jenis')
      .eq('kategori', 'Pusat Pendapatan')
      .order('nama', { ascending: true });

    if (error) {
      console.error("Error fetching unit kerja:", error);
      throw error;
    }

    console.log(`Successfully fetched ${data?.length || 0} unit kerja Pusat Pendapatan`);
    return data || [];
  } catch (error) {
    console.error("Failed to fetch unit kerja:", error);
    return [];
  }
};

export const validateUnitKerjaData = (unitKerjaList: UnitKerja[]): boolean => {
  if (!unitKerjaList || unitKerjaList.length === 0) {
    console.warn("Unit kerja list is empty or null");
    return false;
  }

  // Check if all items have required fields
  const hasValidItems = unitKerjaList.every(item => 
    item.id && item.kode && item.nama && item.kategori === 'Pusat Pendapatan'
  );

  if (!hasValidItems) {
    console.warn("Some unit kerja items are missing required fields");
    return false;
  }

  console.log(`Unit kerja data validation passed: ${unitKerjaList.length} valid items`);
  return true;
};
