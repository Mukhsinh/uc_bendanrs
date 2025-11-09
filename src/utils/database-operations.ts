import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TABLE_COLUMN_WHITELIST: Record<string, ReadonlySet<string>> = {
  jenis_tindakan_rawat_jalan: new Set([
    'id',
    'user_id',
    'kode_jenis',
    'kode_unit_kerja',
    'nama_unit_kerja',
    'kode_jenis_tindakan',
    'jenis_tindakan',
    'jumlah',
    'waktu',
    'profesionalisme',
    'tingkat_kesulitan',
    'hasil_kali_waktu',
    'hasil_kali',
    'biaya_bahan_tindakan',
    'kali_bahan',
    'created_at',
    'updated_at'
  ]),
  kalkulasi_tindakan_rawat_jalan: new Set([
    'id',
    'user_id',
    'tahun',
    'kode_jenis',
    'kode_unit_kerja',
    'nama_unit_kerja',
    'kode_jenis_tindakan',
    'jenis_tindakan',
    'jumlah',
    'waktu',
    'profesionalisme',
    'tingkat_kesulitan',
    'hasil_kali_waktu',
    'hasil_kali',
    'biaya_bahan_tindakan',
    'kali_bahan',
    'dasar_alokasi_kali_waktu',
    'dasar_alokasi_hasil_kali',
    'biaya_gaji_tunjangan',
    'biaya_makan_karyawan',
    'biaya_rumah_tangga',
    'biaya_cetak',
    'biaya_atk',
    'biaya_listrik',
    'biaya_air',
    'biaya_telp',
    'biaya_pemeliharaan_bangunan',
    'biaya_pemeliharaan_alat_medis',
    'biaya_pemeliharaan_alat_non_medis',
    'biaya_operasional_lainnya',
    'biaya_penyusutan_gedung',
    'biaya_penyusutan_jaringan',
    'biaya_penyusutan_alat_medis',
    'biaya_penyusutan_alat_non_medis',
    'biaya_pendidikan_pelatihan',
    'biaya_laundry',
    'biaya_sterilisasi',
    'biaya_tidak_langsung_terdistribusi',
    'created_at',
    'updated_at'
  ])
};

const filterPayloadByTable = (table: string, payload: Record<string, any>) => {
  const whitelist = TABLE_COLUMN_WHITELIST[table];
  if (!whitelist) {
    return payload;
  }

  const filteredEntries = Object.entries(payload).filter(([key]) => whitelist.has(key));

  if (filteredEntries.length === Object.keys(payload).length) {
    return payload;
  }

  return filteredEntries.reduce<Record<string, any>>((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};

export const filterDataForTable = (
  table: string,
  data: Record<string, any> | Record<string, any>[]
) => {
  if (Array.isArray(data)) {
    return data.map((item) => filterPayloadByTable(table, item));
  }

  return filterPayloadByTable(table, data);
};

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeoutMs?: number;
}

/**
 * Executes a database operation with retry logic and timeout handling
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeoutMs = 45000
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database operation attempt ${attempt}/${maxRetries}`);
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Race between operation and timeout
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);

      console.log(`✅ Database operation successful on attempt ${attempt}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Database operation failed on attempt ${attempt}:`, error);

      // Don't retry for certain types of errors
      if (error.message?.includes('duplicate key') || 
          error.message?.includes('foreign key') ||
          error.message?.includes('not found') ||
          error.code === '23505') { // PostgreSQL unique constraint violation
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Optimized delete operation with proper error handling
 */
export async function optimizedDelete(
  table: string,
  id: string,
  entityName: string = 'data'
): Promise<void> {
  return executeWithRetry(async () => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Delete error for ${table}:`, error);
      throw new Error(`Gagal menghapus ${entityName}: ${error.message}`);
    }

    console.log(`✅ Successfully deleted from ${table}:`, id);
  }, {
    maxRetries: 2,
    timeoutMs: 30000
  });
}

/**
 * Optimized update operation with proper error handling
 */
export async function optimizedUpdate(
  table: string,
  id: string,
  data: Record<string, any>,
  entityName: string = 'data'
): Promise<void> {
  return executeWithRetry(async () => {
    const filteredData = filterPayloadByTable(table, data);
    const { error, count } = await supabase
      .from(table)
      .update(filteredData)
      .eq('id', id);

    if (error) {
      console.error(`Update error for ${table}:`, error);
      throw new Error(`Gagal memperbarui ${entityName}: ${error.message}`);
    }

    if (count === 0) {
      throw new Error(`Data ${entityName} tidak ditemukan untuk diperbarui`);
    }

    console.log(`✅ Successfully updated ${table}:`, id);
  }, {
    maxRetries: 2,
    timeoutMs: 30000
  });
}

/**
 * Optimized insert operation with proper error handling
 */
export async function optimizedInsert(
  table: string,
  data: Record<string, any> | Record<string, any>[],
  entityName: string = 'data'
): Promise<any> {
  return executeWithRetry(async () => {
    const filteredData = filterDataForTable(table, data);
    const { data: result, error } = await supabase
      .from(table)
      .insert(filteredData)
      .select();

    if (error) {
      console.error(`Insert error for ${table}:`, error);
      
      // Handle specific error types with better messages
      if (error.message?.includes('duplicate key')) {
        throw new Error(`Data ${entityName} sudah ada. Silakan gunakan data yang berbeda.`);
      }
      
      throw new Error(`Gagal menambahkan ${entityName}: ${error.message}`);
    }

    console.log(`✅ Successfully inserted into ${table}:`, result);
    return result;
  }, {
    maxRetries: 2,
    timeoutMs: 30000
  });
}

/**
 * Execute RPC function with retry and timeout
 */
export async function executeRPC(
  functionName: string,
  params: Record<string, any> = {},
  options: RetryOptions = {}
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🚀 Executing RPC: ${functionName}`, params);
    
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      console.error(`RPC error for ${functionName}:`, error);
      throw new Error(`Gagal menjalankan kalkulasi: ${error.message}`);
    }

    console.log(`✅ RPC ${functionName} completed successfully`);
    return data;
  }, {
    maxRetries: 1, // RPC functions usually shouldn't be retried as they might have side effects
    timeoutMs: 60000, // Longer timeout for complex calculations
    ...options
  });
}

/**
 * Safe CRUD operations menggunakan database functions yang sudah dioptimasi
 */
export async function safeCRUDOperation(
  operationType: 'INSERT' | 'UPDATE' | 'DELETE',
  tableName: string,
  recordId?: string,
  dataPayload?: Record<string, any>
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🛡️ Safe ${operationType} operation on ${tableName}`, { recordId, dataPayload });
    
    // Use direct database operations for better compatibility
    let result;
    if (operationType === 'INSERT') {
      if (!dataPayload) {
        throw new Error('Data payload is required for INSERT operation');
      }
      const filteredPayload = filterPayloadByTable(tableName, dataPayload);
      const { data, error } = await supabase
        .from(tableName)
        .insert([filteredPayload])
        .select();
      if (error) throw error;
      result = { success: true, data };
    } else if (operationType === 'UPDATE') {
      if (!recordId || !dataPayload) {
        throw new Error('Record ID and data payload are required for UPDATE operation');
      }
      const filteredPayload = filterPayloadByTable(tableName, dataPayload);
      const { data, error } = await supabase
        .from(tableName)
        .update(filteredPayload)
        .eq('id', recordId)
        .select();
      if (error) throw error;
      result = { success: true, data };
    } else if (operationType === 'DELETE') {
      if (!recordId) {
        throw new Error('Record ID is required for DELETE operation');
      }
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);
      if (error) throw error;
      result = { success: true };
    }

    console.log(`✅ Safe ${operationType} completed successfully`);
    return result;
  }, {
    maxRetries: 2,
    timeoutMs: 45000 // 45 seconds timeout for safe operations
  });
}

/**
 * Safe minimal recalculation untuk radiologi (legacy - for backward compatibility)
 */
export async function safeMinimalRecalculation(
  tahun: number,
  userId?: string
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🔢 Safe minimal recalculation for year ${tahun}`);
    
    const { data, error } = await supabase.rpc('safe_recalculate_radiologi_minimal', {
      p_tahun: tahun,
      p_user_id: userId || null
    });

    if (error) {
      console.error(`Safe recalculation error:`, error);
      throw new Error(`Gagal melakukan recalculation: ${error.message}`);
    }

    if (data && !data.success) {
      throw new Error(data.error || 'Recalculation gagal');
    }

    console.log(`✅ Safe recalculation completed in ${data.execution_time}s`);
    return data;
  }, {
    maxRetries: 1,
    timeoutMs: 30000 // 30 seconds for recalculation
  });
}

/**
 * Manual comprehensive recalculation untuk radiologi - dipanggil via tombol user
 */
export async function manualRecalculateRadiologi(
  tahun: number,
  userId?: string
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🔄 Manual comprehensive recalculation for year ${tahun}`);
    
    const { data, error } = await supabase.rpc('manual_recalculate_radiologi', {
      p_tahun: tahun,
      p_user_id: userId || null
    });

    if (error) {
      console.error(`Manual recalculation error:`, error);
      throw new Error(`Gagal melakukan rekalkulasi: ${error.message}`);
    }

    if (data && !data.success) {
      throw new Error(data.error || 'Rekalkulasi gagal');
    }

    console.log(`✅ Manual recalculation completed successfully`);
    console.log(`📊 Stats: ${data.affected_rows} records updated in ${data.execution_time_seconds}s`);
    return data;
  }, {
    maxRetries: 1,
    timeoutMs: 120000 // 2 minutes for comprehensive recalculation
  });
}

export async function manualRecalculateGizi(
  tahun: number,
  userId?: string
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🔄 Manual comprehensive recalculation Gizi for year ${tahun}`);
    
    const { data, error } = await supabase.rpc('manual_recalculate_gizi', {
      p_tahun: tahun,
      p_user_id: userId || null
    });

    if (error) {
      console.error(`Manual recalculation Gizi error:`, error);
      throw new Error(`Gagal melakukan rekalkulasi: ${error.message}`);
    }

    if (data && !data.success) {
      throw new Error(data.error || 'Rekalkulasi gagal');
    }

    console.log(`✅ Manual recalculation Gizi completed successfully`);
    console.log(`📊 Stats: ${data.affected_rows} records updated in ${data.execution_time_seconds}s`);
    return data;
  }, {
    maxRetries: 1,
    timeoutMs: 120000 // 2 minutes for comprehensive recalculation
  });
}

export async function manualRecalculateLaboratorium(
  tahun: number,
  userId?: string
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🔄 Manual comprehensive recalculation Laboratorium for year ${tahun}`);
    
    const { data, error } = await supabase.rpc('manual_recalculate_laboratorium_v2', {
      p_tahun: tahun,
      p_user_id: userId || null
    });

    if (error) {
      console.error(`Manual recalculation Laboratorium error:`, error);
      throw new Error(`Gagal melakukan rekalkulasi: ${error.message}`);
    }

    if (data && !data.success) {
      throw new Error(data.error || 'Rekalkulasi gagal');
    }

    console.log(`✅ Manual recalculation Laboratorium completed successfully`);
    console.log(`📊 Stats: ${data.affected_rows} records updated in ${data.execution_time_seconds}s`);
    return data;
  }, {
    maxRetries: 1,
    // Panjangkan timeout client agar aman saat fungsi DB menjalankan proses besar
    timeoutMs: 600000
  });
}

export async function manualRecalculateBdrs(
  tahun: number,
  userId?: string
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🔄 Manual comprehensive recalculation BDRS for year ${tahun}`);
    
    const { data, error } = await supabase.rpc('manual_recalculate_bdrs', {
      p_tahun: tahun,
      p_user_id: userId || null
    });

    if (error) {
      console.error(`Manual recalculation BDRS error:`, error);
      throw new Error(`Gagal melakukan rekalkulasi: ${error.message}`);
    }

    if (data && !data.success) {
      throw new Error(data.error || 'Rekalkulasi gagal');
    }

    console.log(`✅ Manual recalculation BDRS completed successfully`);
    console.log(`📊 Stats: ${data.affected_rows} records updated in ${data.execution_time_seconds}s`);
    return data;
  }, {
    maxRetries: 1,
    timeoutMs: 120000 // 2 minutes for comprehensive recalculation
  });
}

export async function manualRecalculateOperatif(
  tahun: number,
  datasetUserId?: string | null
): Promise<any> {
  if (!datasetUserId) {
    throw new Error('ID pemilik data kalkulasi diperlukan untuk rekalkulasi Operatif');
  }

  console.log(`🔄 Starting batched manual recalculation Operatif for year ${tahun}`);
  
  // Use batched approach like laboratorium to avoid timeout
  const result = await recalculateOperatifBatched(tahun, datasetUserId);
  
  console.log(`✅ Batched recalculation Operatif completed successfully`);
  console.log(`📊 Stats: ${result.totalOperators} operators, ${result.totalAffected} records, ${result.totalDbSeconds}s`);
  
  return {
    success: true,
    affected_rows: result.totalAffected,
    execution_time_seconds: result.totalDbSeconds,
    batches: result.totalOperators,
    succeeded: result.succeeded,
    failed: result.failed
  };
}

export async function manualRecalculateCathlab(
  tahun: number,
  userId?: string
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🔄 Manual comprehensive recalculation Cathlab for year ${tahun}`);
    
    const { data, error } = await supabase.rpc('manual_recalculate_cathlab', {
      p_tahun: tahun,
      p_user_id: userId || null
    });

    if (error) {
      console.error(`Manual recalculation Cathlab error:`, error);
      throw new Error(`Gagal melakukan rekalkulasi: ${error.message}`);
    }

    if (data && !data.success) {
      throw new Error(data.error || 'Rekalkulasi gagal');
    }

    console.log(`✅ Manual recalculation Cathlab completed successfully`);
    console.log(`📊 Stats: ${data.affected_rows} records updated in ${data.execution_time_seconds}s`);
    return data;
  }, {
    maxRetries: 1,
    timeoutMs: 120000 // 2 minutes for comprehensive recalculation
  });
}

/**
 * Rekalkulasi manual distribusi_biaya_kedua
 * Update biaya_alokasi_i dari distribusi_biaya_pertama (bukan _dengan_jp)
 */
export async function manualRecalculateDistribusiBiayaKedua(
  tahun: number
): Promise<any> {
  return executeWithRetry(async () => {
    console.log(`🔄 Manual recalculation Distribusi Biaya Kedua for year ${tahun}`);
    
    const { data, error } = await supabase.rpc('manual_recalculate_distribusi_biaya_kedua', {
      p_tahun: tahun
    });

    if (error) {
      console.error(`Manual recalculation Distribusi Biaya Kedua error:`, error);
      throw new Error(`Gagal melakukan rekalkulasi: ${error.message}`);
    }

    if (data && !data.success) {
      throw new Error(data.message || 'Rekalkulasi gagal');
    }

    console.log(`✅ Manual recalculation Distribusi Biaya Kedua completed successfully`);
    console.log(`📊 Stats: ${data.updated_count} records updated`);
    return data;
  }, {
    maxRetries: 1,
    timeoutMs: 120000 // 2 minutes
  });
}

/**
 * Batched recalculation untuk Laboratorium, menjalankan RPC per unit kerja
 * Hanya menyentuh kolom computed-by-system di sisi database.
 */
export async function recalculateLaboratoriumBatched(
  tahun: number,
  userId: string,
  onProgress?: (info: { current: number; total: number; unit?: string; message?: string }) => void
): Promise<{ totalUnits: number; succeeded: number; failed: number; failures: { unit: string; error: string }[]; totalAffected: number; totalDbSeconds: number }>{
  return executeWithRetry(async () => {
    console.log(`🔄 Batched recalculation Laboratorium for year ${tahun}`);
    console.log(`📌 Menggunakan data terbaru berdasarkan kombinasi kode dan tahun, tanpa filter user_id`);

    // Ambil daftar unit kerja yang relevan berdasarkan tahun saja (tidak filter berdasarkan user_id)
    // Ini memastikan kita menggunakan data terbaru dari semua user sesuai kombinasi kode dan tahun
    const { data: unitsData, error: unitsError } = await supabase
      .from('kalkulasi_biaya_laboratorium')
      .select('kode_unit_kerja')
      .eq('tahun', tahun);
      // Hapus filter .eq('user_id', userId) untuk menggunakan data terbaru dari semua user

    if (unitsError) {
      throw new Error(`Gagal mengambil daftar unit: ${unitsError.message}`);
    }

    const unitCodes = Array.from(new Set((unitsData || [])
      .map((r: any) => r?.kode_unit_kerja)
      .filter((v: any) => typeof v === 'string' && v.trim().length > 0)));

    const total = unitCodes.length || 0;
    console.log(`📊 Ditemukan ${total} unit kerja untuk tahun ${tahun}`);
    
    if (total === 0) {
      // Jalankan global sebagai fallback bila tidak ada kode unit
      // Kirim null untuk user_id agar fungsi database menggunakan data terbaru berdasarkan kode dan tahun
      console.log(`⚠️ Tidak ada unit kerja ditemukan, menjalankan rekalkulasi global...`);
      const data = await executeRPC('manual_recalculate_laboratorium_batch', { 
        p_tahun: tahun, 
        p_user_id: null, // null agar menggunakan data terbaru tanpa filter user
        p_kode_unit_kerja: null 
      }, { timeoutMs: 600000 });
      return { 
        totalUnits: 0, 
        succeeded: 0, 
        failed: 0, 
        failures: [], 
        totalAffected: Number(data?.affected_rows || 0), 
        totalDbSeconds: Number(data?.execution_time_seconds || 0) 
      };
    }

    let succeeded = 0;
    let failed = 0;
    const failures: { unit: string; error: string }[] = [];
    let totalAffected = 0;
    let totalDbSeconds = 0;

    for (let i = 0; i < unitCodes.length; i++) {
      const unit = unitCodes[i];
      onProgress?.({ current: i + 1, total, unit, message: `Memproses unit ${unit} (${i + 1}/${total})...` });
      try {
        // Kirim null untuk user_id agar fungsi database menggunakan data terbaru berdasarkan kode dan tahun
        // tanpa memperhatikan user yang melakukan input/update
        const data = await executeRPC('manual_recalculate_laboratorium_batch', {
          p_tahun: tahun,
          p_user_id: null, // null agar menggunakan data terbaru tanpa filter user
          p_kode_unit_kerja: unit
        }, { timeoutMs: 600000 });

        totalAffected += Number(data?.affected_rows || 0);
        totalDbSeconds += Number(data?.execution_time_seconds || 0);
        succeeded += 1;
        console.log(`✅ Unit ${unit} berhasil: ${data?.affected_rows || 0} rows diperbarui`);
      } catch (err: any) {
        console.error(`❌ Unit ${unit} gagal:`, err);
        failures.push({ unit, error: err?.message || 'unknown error' });
        failed += 1;
      }
    }

    console.log(`📊 Rekalkulasi batch selesai: ${succeeded} berhasil, ${failed} gagal, ${totalAffected} total rows diperbarui`);
    return { totalUnits: total, succeeded, failed, failures, totalAffected, totalDbSeconds };
  }, {
    maxRetries: 1,
    timeoutMs: 600000
  });
}

/**
 * Batched recalculation untuk Operatif, menjalankan RPC per operator
 * Mirip dengan recalculateLaboratoriumBatched tapi untuk operatif
 */
export async function recalculateOperatifBatched(
  tahun: number,
  datasetUserId: string | null,
  onProgress?: (info: { current: number; total: number; operator?: string; message?: string }) => void
): Promise<{ totalOperators: number; succeeded: number; failed: number; failures: { operator: string; error: string }[]; totalAffected: number; totalDbSeconds: number }>{
  return executeWithRetry(async () => {
    console.log(`🔄 Batched recalculation Operatif for year ${tahun}`);

    // Ambil daftar operator yang relevan
    let operatorQuery = supabase
      .from('kalkulasi_biaya_operatif')
      .select('kode_operator_spesialistik')
      .eq('tahun', tahun)
      .eq('kode_unit_kerja', 'UK074');

    if (datasetUserId) {
      operatorQuery = operatorQuery.eq('user_id', datasetUserId);
    }

    const { data: operatorsData, error: operatorsError } = await operatorQuery;

    if (operatorsError) {
      throw new Error(`Gagal mengambil daftar operator: ${operatorsError.message}`);
    }

    const operatorCodes = Array.from(new Set((operatorsData || [])
      .map((r: any) => r?.kode_operator_spesialistik)
      .filter((v: any) => typeof v === 'string' && v.trim().length > 0)));

    const total = operatorCodes.length || 0;
    if (total === 0) {
      // Jalankan global sebagai fallback bila tidak ada kode operator
      const data = await executeRPC('manual_recalculate_operatif_batch', { p_tahun: tahun, p_user_id: datasetUserId, p_kode_unit_kerja: 'UK074', p_kode_operator_spesialistik: null }, { timeoutMs: 600000 });
      return { totalOperators: 0, succeeded: 0, failed: 0, failures: [], totalAffected: Number(data?.affected_rows || 0), totalDbSeconds: Number(data?.execution_time_seconds || 0) };
    }

    let succeeded = 0;
    let failed = 0;
    const failures: { operator: string; error: string }[] = [];
    let totalAffected = 0;
    let totalDbSeconds = 0;

    for (let i = 0; i < operatorCodes.length; i++) {
      const operator = operatorCodes[i];
      onProgress?.({ current: i + 1, total, operator, message: `Memproses operator ${operator} (${i + 1}/${total})...` });
      try {
        const data = await executeRPC('manual_recalculate_operatif_batch', {
          p_tahun: tahun,
          p_user_id: datasetUserId,
          p_kode_unit_kerja: 'UK074',
          p_kode_operator_spesialistik: operator
        }, { timeoutMs: 600000 });

        totalAffected += Number(data?.affected_rows || 0);
        totalDbSeconds += Number(data?.execution_time_seconds || 0);
        succeeded += 1;
      } catch (err: any) {
        console.error(`Operator ${operator} gagal:`, err);
        failures.push({ operator, error: err?.message || 'unknown error' });
        failed += 1;
      }
    }

    return { totalOperators: total, succeeded, failed, failures, totalAffected, totalDbSeconds };
  }, {
    maxRetries: 1,
    timeoutMs: 600000
  });
}

/**
 * Show appropriate error message based on error type
 */
export function handleDatabaseError(error: any, operation: string = 'operasi') {
  console.error(`Database error during ${operation}:`, error);
  
  if (error.message?.includes('timeout')) {
    toast.error(`⏱️ ${operation.charAt(0).toUpperCase() + operation.slice(1)} memakan waktu terlalu lama. Silakan coba lagi.`);
  } else if (error.message?.includes('network')) {
    toast.error(`🌐 Masalah koneksi internet. Periksa koneksi dan coba lagi.`);
  } else if (error.message?.includes('duplicate')) {
    toast.error(`🔒 Data sudah ada. Silakan gunakan data yang berbeda.`);
  } else {
    toast.error(`❌ Gagal ${operation}: ${error.message || 'Terjadi kesalahan yang tidak diketahui'}`);
  }
}
