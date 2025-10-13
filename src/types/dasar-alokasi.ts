export interface DasarAlokasi {
  id?: string;
  user_id?: string | null;
  kode_alokasi?: string | null;
  nama_alokasi?: string | null;
  deskripsi?: string | null;
  kategori?: string | null;
  metode_alokasi?: string | null;
  unit_kerja_id?: string | null;
  kode_unit_kerja?: string | null;
  nama_unit_kerja?: string | null;
  persentase_alokasi?: number | null;
  nilai_alokasi?: number | null;
  basis_alokasi?: string | null;
  status?: string | null;
  tahun?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DasarAlokasiInsert extends Omit<DasarAlokasi, 'id' | 'created_at' | 'updated_at'> {}

export interface DistribusiBiaya {
  id?: string;
  user_id?: string | null;
  kode_distribusi?: string | null;
  nama_distribusi?: string | null;
  deskripsi?: string | null;
  unit_kerja_sumber_id?: string | null;
  kode_unit_kerja_sumber?: string | null;
  nama_unit_kerja_sumber?: string | null;
  unit_kerja_tujuan_id?: string | null;
  kode_unit_kerja_tujuan?: string | null;
  nama_unit_kerja_tujuan?: string | null;
  jenis_biaya?: string | null;
  kategori_distribusi?: string | null;
  nilai_biaya_sumber?: number | null;
  persentase_distribusi?: number | null;
  nilai_distribusi?: number | null;
  basis_perhitungan?: string | null;
  faktor_distribusi?: number | null;
  periode_awal?: string | null;
  periode_akhir?: string | null;
  tahun?: number | null;
  bulan?: number | null;
  status?: string | null;
  tanggal_approval?: string | null;
  approved_by?: string | null;
  catatan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DistribusiBiayaInsert extends Omit<DistribusiBiaya, 'id' | 'created_at' | 'updated_at'> {}

// Mapping untuk dasar alokasi berdasarkan nama unit kerja
export const DASAR_ALOKASI_MAPPING: Record<string, string> = {
  'Direktur': 'Jumlah_SDM',
  'Komite PPI': 'Jumlah_SDM',
  'Komite PMKP': 'Jumlah_SDM',
  'Komite Medik': 'Total_Kunjungan_Pasien',
  'Akreditasi': 'Jumlah_SDM',
  'Dewan Pengawas': 'Jumlah_SDM',
  'Bid Pengembangan': 'Total_Kunjungan_Pasien',
  'Seksi penunjang': 'Total_Kunjungan_Pasien',
  'IPSRS': 'Luas_Ruangan',
  'Bid Keperawatan': 'Total_Kunjungan_Pasien',
  'Seksi asuhan perawatan': 'Total_Kunjungan_Pasien',
  'Seksi pengembangan': 'Total_Kunjungan_Pasien',
  'Bid Pelayanan Medis': 'Total_Kunjungan_Pasien',
  'Seksi pelayanan': 'Total_Kunjungan_Pasien',
  'TPPRJ': 'Total_Kunjungan_Pasien',
  'TPPRI': 'Total_Kunjungan_Pasien',
  'Bag Tata Usaha': 'Jumlah_SDM',
  'Subag Keuangan': 'Jumlah_SDM',
  'Unit Perbendaharaan': 'Jumlah_SDM',
  'Unit Pendapatan': 'Jumlah_SDM',
  'Unit Akuntansi dan Verifikasi': 'Jumlah_SDM',
  'Unit Akuntansi Manajemen': 'Total_Kunjungan_Pasien',
  'Analis Biaya dan tarif': 'Total_Kunjungan_Pasien',
  'Subag umpeg': 'Jumlah_SDM',
  'Staf Umum dan kerjasama': 'Jumlah_SDM',
  'Unit IT': 'Komputer_simrs_user',
  'Rumah Tangga': 'Jumlah_SDM',
  'Cleaning service': 'Luas_Ruangan',
  'Security': 'Luas_Ruangan',
  'Unit Aset': 'Total_Kunjungan_Pasien',
  'Instalasi Humas': 'Total_Kunjungan_Pasien',
  'Subag renval': 'Jumlah_SDM',
  'Staf Renval': 'Jumlah_SDM',
  'Rekam Medik': 'Jumlah_SDM'
};

// Helper function untuk menentukan dasar alokasi berdasarkan nama unit kerja
export function getDasarAlokasiField(namaUnitKerja: string): string {
  for (const [key, value] of Object.entries(DASAR_ALOKASI_MAPPING)) {
    if (namaUnitKerja.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return 'Jumlah_SDM'; // Default
}

// Helper function untuk mendapatkan label yang user-friendly
export function getDasarAlokasiLabel(field: string): string {
  const labels: Record<string, string> = {
    'Jumlah_SDM': 'Jumlah SDM',
    'Total_Kunjungan_Pasien': 'Total Kunjungan Pasien',
    'Komputer_simrs_user': 'Komputer SIMRS User',
    'Luas_Ruangan': 'Luas Ruangan'
  };
  return labels[field] || field;
}
