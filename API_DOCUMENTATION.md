# API Documentation - Aplikasi Unit Cost RS

## Overview
Aplikasi Unit Cost RS menggunakan Supabase sebagai backend dengan PostgreSQL dan menyediakan API endpoints untuk berbagai operasi kalkulasi biaya rumah sakit.

## Authentication
Semua API endpoints memerlukan authentication melalui Supabase Auth.

### Headers Required
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

## Core API Endpoints

### 1. Audit Trail

#### GET /audit-trail
Mengambil data audit trail dengan filtering dan pagination.

**Parameters:**
- `search` (string, optional): Pencarian berdasarkan action, table, atau description
- `action` (string, optional): Filter berdasarkan action (CREATE, UPDATE, DELETE, VIEW, LOGIN, EXPORT)
- `table` (string, optional): Filter berdasarkan nama tabel
- `date_from` (string, optional): Filter tanggal dari (ISO format)
- `date_to` (string, optional): Filter tanggal sampai (ISO format)
- `page` (integer, optional): Nomor halaman (default: 1)
- `limit` (integer, optional): Jumlah data per halaman (default: 50)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_email": "string",
      "action": "string",
      "table_name": "string",
      "record_id": "uuid",
      "description": "string",
      "created_at": "timestamp"
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 50,
  "total_pages": 20
}
```

### 2. Data Biaya

#### GET /data-biaya
Mengambil data biaya operasional.

**Parameters:**
- `tahun` (integer, optional): Filter berdasarkan tahun
- `unit_kerja_id` (uuid, optional): Filter berdasarkan unit kerja

**Response:**
```json
[
  {
    "id": "uuid",
    "tahun": 2025,
    "unit_kerja_id": "uuid",
    "biaya_gaji_tunjangan": 1000000,
    "biaya_rumah_tangga": 500000,
    // ... other biaya fields
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### POST /data-biaya
Membuat data biaya baru.

**Request Body:**
```json
{
  "tahun": 2025,
  "unit_kerja_id": "uuid",
  "biaya_gaji_tunjangan": 1000000,
  "biaya_rumah_tangga": 500000
  // ... other biaya fields
}
```

#### PUT /data-biaya/:id
Update data biaya.

**Request Body:**
```json
{
  "biaya_gaji_tunjangan": 1200000,
  "biaya_rumah_tangga": 600000
  // ... other fields to update
}
```

#### DELETE /data-biaya/:id
Hapus data biaya.

### 3. Kalkulasi Biaya Gizi

#### GET /kalkulasi-biaya-gizi
Mengambil data kalkulasi biaya gizi.

**Parameters:**
- `tahun` (integer, optional): Filter berdasarkan tahun
- `jenis_makanan` (string, optional): Filter berdasarkan jenis makanan

**Response:**
```json
[
  {
    "id": "uuid",
    "tahun": 2025,
    "kode": "gz.001",
    "jenis_makanan": "Nasi Putih",
    "jumlah": 100,
    "unit_cost_per_porsi": 5000,
    "tuc_gizi_VVIP": 500000,
    "auc_gizi_VVIP": 5000,
    // ... other calculated fields
    "bahan_porsi": [
      {
        "nama_barang": "Beras",
        "konsumsi": 0.1,
        "harga": 15000,
        "biaya_bahan_porsi": 1500
      }
    ]
  }
]
```

#### POST /kalkulasi-biaya-gizi
Membuat data kalkulasi biaya gizi baru.

**Request Body:**
```json
{
  "tahun": 2025,
  "kode": "gz.001",
  "jenis_makanan": "Nasi Putih",
  "jumlah": 100,
  "waktu_meracik": 20,
  "waktu_memasak": 25,
  "waktu_menata": 4
}
```

#### PUT /kalkulasi-biaya-gizi/:id
Update data kalkulasi biaya gizi.

#### DELETE /kalkulasi-biaya-gizi/:id
Hapus data kalkulasi biaya gizi.

### 4. Bahan Porsi

#### GET /bahan-porsi
Mengambil data bahan porsi.

**Parameters:**
- `kode` (string, optional): Filter berdasarkan kode makanan
- `jenis_makanan` (string, optional): Filter berdasarkan jenis makanan

**Response:**
```json
[
  {
    "id": "uuid",
    "kode": "gz.001",
    "jenis_makanan": "Nasi Putih",
    "data_barang_gizi": {
      "id": "uuid",
      "nama_barang": "Beras",
      "satuan": "kg",
      "harga": 15000
    },
    "konsumsi": 0.1,
    "biaya_produksi": 15,
    "harga_bahan": 1500,
    "biaya_bahan_porsi": 1725
  }
]
```

#### POST /bahan-porsi
Membuat data bahan porsi baru.

**Request Body:**
```json
{
  "kode": "gz.001",
  "jenis_makanan": "Nasi Putih",
  "data_barang_gizi_id": "uuid",
  "konsumsi": 0.1,
  "biaya_produksi": 15
}
```

#### PUT /bahan-porsi/:id
Update data bahan porsi.

#### DELETE /bahan-porsi/:id
Hapus data bahan porsi.

### 5. Data Barang Gizi

#### GET /data-barang-gizi
Mengambil data barang gizi dengan autocomplete.

**Parameters:**
- `search` (string, optional): Pencarian nama barang

**Response:**
```json
[
  {
    "id": "uuid",
    "kode_barang": "BG001",
    "nama_barang": "Beras",
    "satuan": "kg",
    "harga": 15000
  }
]
```

#### POST /data-barang-gizi
Membuat data barang gizi baru.

**Request Body:**
```json
{
  "kode_barang": "BG001",
  "nama_barang": "Beras",
  "satuan": "kg",
  "harga": 15000
}
```

## RPC Functions

### 1. get_audit_trail_with_emails
Function untuk mengambil audit trail dengan email pengguna.

**Parameters:**
- `search_term` (text, optional)
- `action_filter` (text, optional)
- `table_filter` (text, optional)
- `date_from` (timestamp, optional)
- `date_to` (timestamp, optional)
- `page_num` (integer, default: 1)
- `page_size` (integer, default: 50)

**Response:**
```json
{
  "data": [...],
  "total": 1000,
  "page": 1,
  "limit": 50,
  "total_pages": 20
}
```

### 2. get_barang_gizi_for_autocomplete
Function untuk autocomplete barang gizi.

**Parameters:**
- `search_term` (text)

**Response:**
```json
[
  {
    "id": "uuid",
    "kode_barang": "BG001",
    "nama_barang": "Beras",
    "satuan": "kg",
    "harga": 15000,
    "label": "Beras (BG001)"
  }
]
```

### 3. calculate_biaya_bahan_porsi_numeric
Function untuk menghitung biaya bahan porsi dari JSONB data.

### 4. calculate_all_biaya_columns
Function untuk menghitung semua kolom biaya berdasarkan formula.

### 5. calculate_uc_gizi
Function untuk menghitung unit cost gizi berdasarkan jenis makanan.

### 6. calculate_auc_gizi
Function untuk menghitung average unit cost gizi.

## Business Logic

### 1. Kalkulasi Biaya Gizi

#### Formula Dasar Alokasi Waktu
```
dasar_alokasi_waktu = hasil_kali_waktu / total_hasil_kali_waktu_semua_baris
```
- `hasil_kali_waktu = waktu_meracik + waktu_memasak + waktu_menata`
- `total_hasil_kali_waktu_semua_baris` = sum dari semua baris dalam tahun yang sama

#### Formula Unit Cost Per Porsi
```
unit_cost_per_porsi = biaya_bahan_porsi_numeric + biaya_gaji_tunjangan + biaya_rumah_tangga + ... + biaya_tidak_langsung_terdistribusi
```

#### Formula Biaya dari Data Biaya
```
biaya_kolom = biaya_dari_data_biaya × (dasar_alokasi_waktu / jumlah)
```
- `biaya_dari_data_biaya` = biaya dari tabel `data_biaya` untuk unit 'Gizi (Dapur)'
- `dasar_alokasi_waktu / jumlah` = faktor alokasi

#### Formula UC Gizi
```
uc_gizi_VVIP = jumlah × unit_cost_per_porsi (hanya untuk jenis_makanan yang mengandung 'VVIP')
uc_gizi_VIP = jumlah × unit_cost_per_porsi (hanya untuk jenis_makanan yang mengandung 'VIP')
uc_gizi_I = jumlah × unit_cost_per_porsi (hanya untuk jenis_makanan yang mengandung 'Kelas I')
uc_gizi_II = jumlah × unit_cost_per_porsi (hanya untuk jenis_makanan yang mengandung 'Kelas II')
uc_gizi_III = jumlah × unit_cost_per_porsi (hanya untuk jenis_makanan yang mengandung 'Kelas III')
```

#### Formula AUC Gizi
```
auc_gizi_VVIP = sum(tuc_gizi_VVIP) / sum(jumlah_VVIP)
auc_gizi_VIP = sum(tuc_gizi_VIP) / sum(jumlah_VIP)
auc_gizi_I = sum(tuc_gizi_I) / sum(jumlah_I)
auc_gizi_II = sum(tuc_gizi_II) / sum(jumlah_II)
auc_gizi_III = sum(tuc_gizi_III) / sum(jumlah_III)
```

### 2. Bahan Porsi Calculation

#### Formula Harga Bahan
```
harga_bahan = konsumsi × harga_barang
```

#### Formula Biaya Bahan Porsi
```
biaya_bahan_porsi = harga_bahan + (harga_bahan × biaya_produksi / 100)
```

### 3. Audit Trail

#### Automatic Logging
- **CREATE**: Otomatis log saat insert data baru
- **UPDATE**: Otomatis log saat update data (dengan old_values dan new_values)
- **DELETE**: Otomatis log saat delete data
- **VIEW**: Manual log saat user melihat data
- **LOGIN**: Manual log saat user login
- **EXPORT**: Manual log saat user export data

#### Data Captured
- User ID dan email
- Action type
- Table name dan record ID
- Old values dan new values (untuk UPDATE)
- IP address dan user agent
- Timestamp

## Error Handling

### Common Error Codes
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Missing or invalid authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Data conflict (e.g., duplicate key)
- **500**: Internal Server Error - Server error

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

## Rate Limiting

### Limits
- **API Calls**: 1000 requests per hour per user
- **File Upload**: 10MB per request
- **Export**: 10000 records per export

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Data Validation

### Input Validation
- **Tahun**: Integer, range 2020-2030
- **Biaya**: BigInt, non-negative
- **Konsumsi**: Numeric, positive
- **Persentase**: Integer, range 0-100
- **UUID**: Valid UUID format
- **Email**: Valid email format

### Business Rules
- Data biaya harus unik per tahun dan unit kerja
- Kalkulasi biaya gizi harus memiliki kode yang valid
- Bahan porsi harus memiliki data barang gizi yang valid
- Audit trail tidak dapat diubah setelah dibuat

## Security

### Authentication
- JWT token required for all operations
- Token expiration: 24 hours
- Refresh token: 7 days

### Authorization
- Role-based access control (RBAC)
- Super Admin: Full access
- Admin: Limited access
- User: Read-only access

### Data Protection
- All sensitive data encrypted
- Audit trail for all operations
- IP address logging
- User agent tracking

## Performance

### Optimization
- Database indexes on frequently queried columns
- Generated columns for complex calculations
- Triggers for automatic updates
- Connection pooling

### Monitoring
- Query performance monitoring
- Error rate tracking
- Response time metrics
- User activity analytics

---

*API Documentation untuk Aplikasi Unit Cost RS v1.0*
*Terakhir diperbarui: 24 Oktober 2025*
