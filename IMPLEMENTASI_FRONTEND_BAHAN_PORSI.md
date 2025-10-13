# Implementasi Frontend untuk Bahan Porsi dengan Autocomplete

## Ringkasan
Berhasil mengimplementasikan frontend untuk bahan porsi dengan fitur autocomplete yang merujuk ke tabel `data_barang_gizi`, auto-fill data, dan kalkulasi otomatis.

## Komponen yang Dibuat

### 1. BahanPorsiForm Component (`src/components/BahanPorsiForm.tsx`)

#### Fitur Utama:
- **Autocomplete Search**: Pencarian barang gizi dengan dropdown
- **Auto-Fill Data**: Nama barang, satuan, dan harga terisi otomatis
- **Real-time Calculation**: Kalkulasi biaya bahan porsi secara real-time
- **Breakdown Display**: Menampilkan breakdown perhitungan step-by-step

#### Props:
```typescript
interface BahanPorsiFormProps {
  kode: string;
  jenisMakanan: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}
```

#### State Management:
- `searchTerm`: Kata kunci pencarian
- `searchResults`: Hasil pencarian barang gizi
- `selectedBarang`: Barang yang dipilih
- `formData`: Data form (konsumsi, biaya_produksi)

### 2. BahanPorsiService (`src/services/bahanPorsiService.ts`)

#### Methods:
```typescript
// Pencarian barang gizi untuk autocomplete
static async searchBarangGizi(searchTerm: string): Promise<BarangGizi[]>

// CRUD operations
static async getAllBahanPorsi(): Promise<BahanPorsi[]>
static async createBahanPorsi(input: BahanPorsiInput): Promise<BahanPorsi>
static async updateBahanPorsi(id: string, input: Partial<BahanPorsiInput>): Promise<BahanPorsi>
static async deleteBahanPorsi(id: string): Promise<void>

// Perhitungan biaya
static async getBiayaBahanPorsiPerJenisMakanan(): Promise<any[]>
static async getTotalBiayaBahanPorsi(): Promise<any>
```

### 3. Custom Hooks (`src/hooks/useBahanPorsi.ts`)

#### Hooks yang Tersedia:
- `useBahanPorsi()`: Hook untuk CRUD bahan porsi
- `useBarangGiziSearch()`: Hook untuk pencarian barang gizi
- `useBiayaBahanPorsi()`: Hook untuk perhitungan biaya

### 4. BahanPorsiPage (`src/pages/BahanPorsiPage.tsx`)

#### Fitur:
- **Tabbed Interface**: List, Calculation, Summary
- **Form Integration**: Integrasi dengan BahanPorsiForm
- **Data Display**: Tampilan data dengan breakdown perhitungan
- **Real-time Updates**: Update otomatis setelah CRUD operations

## Mekanisme Perhitungan Frontend

### 1. Flow Autocomplete:
```
User ketik → searchBarangGizi() → API call → Display results → 
User pilih → Auto-fill nama_barang, satuan, harga → 
Calculate harga_bah → Calculate biaya_bahan_porsi → Display breakdown
```

### 2. Kalkulasi Real-time:
```typescript
const calculateBiayaBahanPorsi = () => {
  if (!selectedBarang || formData.konsumsi <= 0) return 0;
  
  const hargaBahan = formData.konsumsi * selectedBarang.harga;
  const biayaProduksi = hargaBahan * (formData.biayaProduksi / 100);
  
  return hargaBahan + biayaProduksi;
};
```

### 3. Breakdown Display:
```typescript
// Poin 1: Harga Bahan = konsumsi × harga
// Poin 2: Biaya Produksi = harga_bahan × biaya_produksi ÷ 100
// Poin 3: Total = Poin 1 + Poin 2
```

## Contoh Penggunaan

### 1. Pencarian Barang:
```typescript
// User ketik "beras"
const { searchResults, isLoading, searchBarangGizi } = useBarangGiziSearch();

// Hasil pencarian:
[
  {
    id: "eb367ea4-1e87-4705-9898-b6943ea5bc0a",
    value: "eb367ea4-1e87-4705-9898-b6943ea5bc0a",
    label: "01.01.07.01.07.01.01.273 - Beras (kg - Rp 16500",
    nama_barang: "Beras",
    satuan: "kg",
    harga: 16500
  }
]
```

### 2. Auto-Fill Data:
```typescript
// User pilih barang → Auto-fill otomatis
const handleBarangSelect = (barang: BarangGizi) => {
  setSelectedBarang(barang);
  setSearchTerm(barang.label);
  // nama_barang, satuan, harga terisi otomatis
};
```

### 3. Kalkulasi Otomatis:
```typescript
// Input: konsumsi = 2.5, biaya_produksi = 10%
// Auto-calculate:
// harga_bah = 2.5 × 16500 = 41,250
// biaya_bahan_porsi = 41,250 + (41,250 × 10%) = 45,375
```

## Demonstrasi Data

### Data Test yang Berhasil:
| Kode | Nama Barang | Satuan | Konsumsi | Harga | Harga Bahan | Biaya Produksi | Biaya Bahan Porsi |
|------|-------------|--------|----------|-------|-------------|----------------|------------------|
| demo.001 | Santan Kara | bungkus | 0.5 | 14,500 | 7,250 | 12% | 8,120 |
| demo.002 | Bawang Putih | kg | 20 | 52,000 | 1,040,000 | 8% | 1,123,200 |
| demo.003 | Cabai | kg | 15 | 80,000 | 1,200,000 | 15% | 1,380,000 |
| demo.004 | Ketumbar | kg | 5 | 55,000 | 275,000 | 10% | 302,500 |

### Total per Jenis Makanan "Demo Makanan":
- **Jumlah Bahan**: 4 bahan
- **Total Harga Bahan (Poin 1)**: 2,522,250
- **Total Biaya Produksi (Poin 2)**: 291,570
- **Total Biaya Bahan Porsi (Poin 3)**: 2,813,820

## API Integration

### 1. Search Endpoint:
```typescript
// GET /api/barang-gizi/search?q=beras
const results = await BahanPorsiService.searchBarangGizi('beras');
```

### 2. Create Endpoint:
```typescript
// POST /api/bahan-porsi
const newBahanPorsi = await BahanPorsiService.createBahanPorsi({
  kode: 'gz.001',
  jenis_makanan: 'Nasi Putih',
  data_barang_gizi_id: 'eb367ea4-1e87-4705-9898-b6943ea5bc0a',
  konsumsi: 2.5,
  biaya_produksi: 10
});
```

### 3. View Endpoint:
```typescript
// GET /api/bahan-porsi
const allBahanPorsi = await BahanPorsiService.getAllBahanPorsi();
```

## Keunggulan Implementasi

### 1. User Experience:
- **Autocomplete**: Pencarian mudah dengan dropdown
- **Auto-Fill**: Data terisi otomatis, mengurangi kesalahan input
- **Real-time**: Kalkulasi update secara real-time
- **Visual Feedback**: Breakdown perhitungan jelas

### 2. Data Integrity:
- **Referential Integrity**: Foreign key ke data_barang_gizi
- **Trigger-based**: Auto-update melalui database trigger
- **Validation**: Validasi input di frontend dan backend

### 3. Performance:
- **Debounced Search**: Pencarian tidak terlalu sering
- **Limit Results**: Batas hasil pencarian (50 items)
- **Cached Data**: Data tersimpan di state untuk performa

### 4. Maintainability:
- **Modular Components**: Komponen terpisah dan reusable
- **Type Safety**: TypeScript untuk type safety
- **Error Handling**: Error handling yang komprehensif

## Cara Kerja Rujukan Data

### 1. Database Level:
```sql
-- Trigger otomatis update ketika data_barang_gizi_id diisi
CREATE TRIGGER trigger_update_bahan_porsi_from_barang_gizi
    BEFORE INSERT OR UPDATE OF data_barang_gizi_id
    ON bahan_porsi
    FOR EACH ROW
    EXECUTE FUNCTION update_bahan_porsi_from_barang_gizi();
```

### 2. Frontend Level:
```typescript
// Autocomplete search
const searchBarangGizi = async (term: string) => {
  const results = await BahanPorsiService.searchBarangGizi(term);
  setSearchResults(results);
};

// Auto-fill ketika barang dipilih
const handleBarangSelect = (barang: BarangGizi) => {
  setSelectedBarang(barang);
  // nama_barang, satuan, harga terisi otomatis
};
```

### 3. Calculation Level:
```typescript
// Kalkulasi otomatis setiap kali ada perubahan
const calculateBiayaBahanPorsi = () => {
  const hargaBahan = formData.konsumsi * selectedBarang.harga;
  const biayaProduksi = hargaBahan * (formData.biayaProduksi / 100);
  return hargaBahan + biayaProduksi;
};
```

## Testing dan Validasi

### 1. Data Test:
- ✅ Autocomplete search berfungsi
- ✅ Auto-fill data berhasil
- ✅ Kalkulasi otomatis benar
- ✅ Breakdown perhitungan akurat
- ✅ CRUD operations berhasil

### 2. Edge Cases:
- ✅ Pencarian kosong
- ✅ Data tidak ditemukan
- ✅ Input validation
- ✅ Error handling

Implementasi ini memberikan pengalaman user yang smooth dengan autocomplete search, auto-fill data, dan kalkulasi otomatis yang akurat sesuai dengan rumus yang ditentukan.
