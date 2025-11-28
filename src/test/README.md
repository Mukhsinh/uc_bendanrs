# Testing Setup untuk Multi-Tenant System

## Prerequisites

Untuk menjalankan property-based tests, Anda memerlukan:

1. **Supabase Service Role Key**: Key ini diperlukan untuk bypass RLS policies saat testing
2. **Environment Variables**: Konfigurasi yang benar di `.env.local`

## Setup Instructions

### 1. Dapatkan Service Role Key

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Navigasi ke **Settings** → **API**
4. Copy **service_role** key (bukan anon key!)

⚠️ **PENTING**: Service role key memiliki akses penuh ke database. Jangan commit key ini ke git!

### 2. Tambahkan ke Environment Variables

Buka file `.env.local` dan tambahkan:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Verifikasi Setup

Jalankan test untuk memverifikasi setup:

```bash
npm test
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- src/test/multi-tenant/tenant-creation.test.ts
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with UI
```bash
npm run test:ui
```

## Property-Based Testing

Tests menggunakan **fast-check** library untuk property-based testing dengan:

- **Minimum 100 iterations** per property test
- **Random data generation** untuk tenants, users, dan records
- **Automatic shrinking** untuk minimal failing examples

### Test Structure

```typescript
/**
 * Feature: multi-tenant-system, Property 1: Tenant Creation Completeness
 * Validates: Requirements 1.1
 */
it('Property 1: should create tenant with all required fields', async () => {
  await fc.assert(
    fc.asyncProperty(
      // Generator untuk random data
      fc.record({ ... }),
      async (data) => {
        // Test logic
        expect(...).toBe(...);
      }
    ),
    { numRuns: 100 } // 100 iterations
  );
});
```

## Test Cleanup

Tests secara otomatis membersihkan data setelah setiap test menggunakan:

```typescript
afterEach(async () => {
  await cleanupTestTenants(testTenantIds);
});
```

## Troubleshooting

### Error: Missing Supabase credentials for testing

**Solusi**: Tambahkan `VITE_SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`

### Error: Permission denied

**Solusi**: Pastikan menggunakan service role key, bukan anon key

### Tests timeout

**Solusi**: 
1. Periksa koneksi internet
2. Periksa Supabase project status
3. Increase timeout di vitest config jika perlu

## Security Notes

- ⚠️ **NEVER** commit `.env.local` to git
- ⚠️ Service role key memiliki akses penuh - gunakan hanya untuk testing
- ⚠️ Jangan expose service role key di client-side code
- ✅ Tests menggunakan service role key untuk bypass RLS policies
- ✅ Cleanup otomatis mencegah data test menumpuk

## Test Coverage

Current test coverage untuk multi-tenant system:

- ✅ Property 1: Tenant Creation Completeness
- ⏳ Property 2-50: Coming soon...

Lihat `.kiro/specs/multi-tenant-system/design.md` untuk daftar lengkap properties yang akan ditest.
