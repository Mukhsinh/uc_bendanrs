# API Dokumentasi - Sistem Pilihan Biaya Tahunan

## Overview
Sistem ini memungkinkan aplikasi manajemen data biaya untuk memilih jenis biaya yang akan digunakan dalam tabel `distribusi_biaya_pertama`. Pilihan tersedia antara `total_biaya` dan `total_biaya_tanpa_jp`.

## Database Functions

### 1. `update_distribusi_biaya_pertama_biaya_tahunan(biaya_type text)`
**Deskripsi**: Mengupdate kolom `biaya_tahunan` di tabel `distribusi_biaya_pertama` berdasarkan jenis biaya yang dipilih.

**Parameter**:
- `biaya_type`: `'total_biaya'` atau `'total_biaya_tanpa_jp'`

**Return**: JSON dengan informasi sukses/gagal dan jumlah baris yang diupdate.

### 2. `set_biaya_preference_and_update(p_user_id UUID, p_biaya_type text)`
**Deskripsi**: Menyimpan preferensi user dan mengupdate biaya tahunan secara otomatis.

**Parameter**:
- `p_user_id`: UUID user yang melakukan perubahan
- `p_biaya_type`: `'total_biaya'` atau `'total_biaya_tanpa_jp'`

**Return**: JSON dengan hasil update.

### 3. `get_biaya_preference(p_user_id UUID)`
**Deskripsi**: Mendapatkan preferensi biaya saat ini untuk user.

**Parameter**:
- `p_user_id`: UUID user

**Return**: JSON dengan preferensi saat ini.

## Tabel Database

### `biaya_preference`
Tabel untuk menyimpan preferensi pilihan biaya user:
- `id`: Primary key
- `user_id`: Foreign key ke auth.users
- `biaya_type`: 'total_biaya' atau 'total_biaya_tanpa_jp'
- `created_at`: Timestamp pembuatan
- `updated_at`: Timestamp update terakhir

## Contoh Penggunaan

### 1. Set Preferensi ke Total Biaya
```sql
SELECT set_biaya_preference_and_update(
    'user-uuid-here'::uuid, 
    'total_biaya'
);
```

### 2. Set Preferensi ke Total Biaya Tanpa JP
```sql
SELECT set_biaya_preference_and_update(
    'user-uuid-here'::uuid, 
    'total_biaya_tanpa_jp'
);
```

### 3. Get Preferensi Saat Ini
```sql
SELECT get_biaya_preference('user-uuid-here'::uuid);
```

## Frontend Integration

### Tombol Pilihan di Aplikasi
```javascript
// Contoh implementasi di frontend
const handleBiayaTypeChange = async (biayaType) => {
  try {
    const response = await fetch('/api/biaya-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        biaya_type: biayaType
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update UI atau refresh data
      console.log(`Biaya tahunan diupdate menggunakan ${biayaType}`);
      console.log(`Jumlah baris yang diupdate: ${result.updated_rows}`);
    }
  } catch (error) {
    console.error('Error updating biaya preference:', error);
  }
};

// Penggunaan
<button onClick={() => handleBiayaTypeChange('total_biaya')}>
  Gunakan Total Biaya
</button>

<button onClick={() => handleBiayaTypeChange('total_biaya_tanpa_jp')}>
  Gunakan Total Biaya Tanpa JP
</button>
```

## Validasi Data

### 1. Mapping Unit Kerja
Sistem menggunakan mapping berdasarkan format:
- `distribusi_biaya_pertama.unit_kerja_pusat_biaya` = `CONCAT(data_biaya.kode_unit_kerja, ' - ', data_biaya.nama_unit_kerja)`

### 2. Validasi Parameter
- `biaya_type` harus berupa `'total_biaya'` atau `'total_biaya_tanpa_jp'`
- `user_id` harus berupa UUID yang valid

### 3. Error Handling
- Jika parameter tidak valid, fungsi akan mengembalikan error message
- Jika tidak ada data yang cocok, `updated_rows` akan bernilai 0

## Monitoring dan Logging

### 1. Update Timestamp
Setiap update akan mengupdate kolom `updated_at` di tabel `distribusi_biaya_pertama`.

### 2. Preferensi History
Tabel `biaya_preference` menyimpan history perubahan preferensi user.

### 3. Response Information
Setiap fungsi mengembalikan informasi detail tentang:
- Status sukses/gagal
- Jumlah baris yang diupdate
- Jenis biaya yang digunakan
- Pesan error jika ada

## Testing

### Test Cases
1. **Valid Parameters**: Test dengan parameter yang valid
2. **Invalid Parameters**: Test dengan parameter yang tidak valid
3. **No Matching Data**: Test ketika tidak ada data yang cocok
4. **User Preference**: Test penyimpanan dan pengambilan preferensi user

### Contoh Test
```sql
-- Test 1: Valid total_biaya
SELECT update_distribusi_biaya_pertama_biaya_tahunan('total_biaya');

-- Test 2: Valid total_biaya_tanpa_jp
SELECT update_distribusi_biaya_pertama_biaya_tahunan('total_biaya_tanpa_jp');

-- Test 3: Invalid parameter
SELECT update_distribusi_biaya_pertama_biaya_tahunan('invalid_type');

-- Test 4: Set preference
SELECT set_biaya_preference_and_update('user-uuid', 'total_biaya');

-- Test 5: Get preference
SELECT get_biaya_preference('user-uuid');
```
