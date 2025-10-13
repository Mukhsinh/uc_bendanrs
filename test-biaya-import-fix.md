# Perbaikan Import Data Biaya - Statement Timeout

## Masalah yang Ditemukan
1. **Statement Timeout**: Database timeout 2 menit tidak cukup untuk import data besar
2. **Tidak ada Batch Processing**: Semua data di-insert sekaligus
3. **Query Duplicate Check Per Row**: Sangat lambat untuk data besar (N+1 query problem)

## Perbaikan yang Dilakukan

### 1. Batch Processing
- **Sebelum**: Insert semua data sekaligus
- **Sesudah**: Insert data dalam batch 50 records dengan delay 100ms antar batch

```typescript
// Insert data to database in batches to avoid timeout
const batchSize = 50; // Process 50 records at a time
let totalInserted = 0;

for (let i = 0; i < filteredData.length; i += batchSize) {
  const batch = filteredData.slice(i, i + batchSize);
  
  const { error } = await supabase
    .from('data_biaya')
    .insert(batch);

  if (error) throw error;
  
  totalInserted += batch.length;
  
  // Small delay between batches to prevent overwhelming the database
  if (i + batchSize < filteredData.length) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### 2. Bulk Duplicate Check
- **Sebelum**: Query database per row untuk cek duplicate (N+1 problem)
- **Sesudah**: Single bulk query untuk cek semua duplicates sekaligus

```typescript
// Bulk check for existing data to avoid duplicates
const tahunList = [...new Set(importedData.map(item => item.tahun))];
const unitKerjaIdList = [...new Set(importedData.map(item => item.unit_kerja_id).filter(id => id))];

const { data: existingData, error: checkError } = await supabase
  .from('data_biaya')
  .select('tahun, unit_kerja_id')
  .eq('user_id', userId)
  .in('tahun', tahunList)
  .in('unit_kerja_id', unitKerjaIdList);
```

### 3. Optimized Progress Tracking
- Progress tracking yang lebih akurat dengan batch processing
- Update progress per batch, bukan per row

## Hasil Perbaikan
- **Performance**: Mengurangi query database dari N+1 menjadi 1 query untuk duplicate check
- **Reliability**: Batch processing mencegah timeout untuk data besar
- **User Experience**: Progress tracking yang lebih akurat dan responsive

## Testing
Untuk test perbaikan:
1. Coba import file CSV dengan data biaya
2. Monitor progress bar dan tidak ada timeout error
3. Data berhasil tersimpan di database

## Catatan
- Timeout database tetap 2 menit (tidak bisa diubah via migration)
- Batch size 50 records optimal untuk balance performance dan reliability
- Delay 100ms antar batch mencegah overwhelming database
