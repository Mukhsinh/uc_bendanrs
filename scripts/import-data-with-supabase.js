
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

console.log('🚀 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const DATA_DIR = path.join(__dirname, '../public/data 2025');

const TABLE_ORDER = [
  'tenants',
  'tenant_settings',
  'user_roles',
  'user_profiles',
  'users_with_roles',
  'daftar_tindakan',
  'data_barang_farmasi',
  'data_master_barang_farmasi',
  'data_barang_gizi',
  'data_dokter',
  'data_kegiatan',
  'data_kegiatan_transpose',
  'Dasar_Alokasi',
  'analisa_bahan_pemeriksaan',
  'Data_Kamar',
  'data_akomodasi_inap',
  'data_diklat',
  'data_biaya',
  'data_pendapatan',
  'Alokasibiaya pertama dengan JP',
  'Alokasi biaya kedua dengan JP',
  'Alokasi BTL dengan JP',
  'budgeting_bhp_farmasi',
  'budgeting_bhp_farmasi_public',
  'cost_recovery',
  'branding_settings',
  'biaya_preference',
  'audit_trail',
  'api_biaya_endpoints'
];

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.warn('⚠️ RPC failed, trying direct insert...', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ Error executing SQL:', err.message);
    return false;
  }
}

async function createHelperFunctions() {
  console.log('🔧 Creating helper functions...');
  
  const functionsSql = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.disable_all_rls()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', r.tablename);
      END LOOP;
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.enable_all_rls()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', r.tablename);
      END LOOP;
    END;
    $$;
  `;

  // Since we don't have exec_sql yet, we need to create it using another approach
  // Let's try to create the functions one by one using a different method
  console.log('⚠️ Note: First, you need to run the setup SQL in Supabase SQL Editor to create helper functions!');
  console.log('   File: database/import-all-data-2025.sql (first part)');
}

async function setupDatabase() {
  console.log('🛠️ Setting up database...');
  
  const alterSql = `
    ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
    ALTER TABLE IF EXISTS public.data_dokter ADD COLUMN IF NOT EXISTS jenis_spesialistik text;
    ALTER TABLE IF EXISTS public.data_kegiatan ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
    ALTER TABLE IF EXISTS public.data_biaya ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
    ALTER TABLE IF EXISTS public.data_pendapatan ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
    ALTER TABLE IF EXISTS public."Data_Kamar" ADD COLUMN IF NOT EXISTS "Kelas_I" text;
    ALTER TABLE IF EXISTS public.data_akomodasi_inap ADD COLUMN IF NOT EXISTS total_gizi numeric;
    ALTER TABLE IF EXISTS public.data_diklat ADD COLUMN IF NOT EXISTS biaya_bahan numeric;
    ALTER TABLE IF EXISTS public.budgeting_bhp_farmasi ADD COLUMN IF NOT EXISTS biaya_bahan numeric;
    ALTER TABLE IF EXISTS public.cost_recovery ADD COLUMN IF NOT EXISTS pendapatan_apbd numeric;
    ALTER TABLE IF EXISTS public.branding_settings ADD COLUMN IF NOT EXISTS app_title text;
    ALTER TABLE IF EXISTS public.biaya_preference ADD COLUMN IF NOT EXISTS biaya_type text;
  `;
  
  console.log('   Disabling RLS...');
  await executeSql('SELECT public.disable_all_rls();');
  
  console.log('   Adding missing columns...');
  for (const sql of alterSql.split(';').filter(s => s.trim())) {
    await executeSql(sql);
  }
}

function parseInsertStatement(sql) {
  const match = sql.match(/INSERT\s+INTO\s+(?:"public"\.)?(?:"([^"]+)"|(\w+))\s*\(([^)]+)\)\s*VALUES\s*(.*)/is);
  if (!match) return null;

  const tableName = match[1] || match[2];
  const columnsStr = match[3];
  const valuesStr = match[4];

  const columns = columnsStr.split(',').map(c => c.trim().replace(/"/g, ''));

  const records = [];
  let pos = 0;
  while (pos < valuesStr.length) {
    // Skip whitespace and commas
    while (pos < valuesStr.length && /\s|,/.test(valuesStr[pos])) pos++;

    if (pos >= valuesStr.length) break;

    // Expect '('
    if (valuesStr[pos] !== '(') {
      pos++;
      continue;
    }
    pos++;

    const row = [];
    let currentVal = '';
    let inQuote = false;

    while (pos < valuesStr.length) {
      const c = valuesStr[pos];

      if (c === ')' && !inQuote) {
        pos++;
        if (currentVal.trim()) {
          row.push(currentVal.trim());
        }
        break;
      }

      if (c === ',' && !inQuote) {
        row.push(currentVal.trim());
        currentVal = '';
        pos++;
        continue;
      }

      if (c === "'") {
        if (pos + 1 < valuesStr.length && valuesStr[pos + 1] === "'") {
          currentVal += "'";
          pos += 2;
          continue;
        }
        inQuote = !inQuote;
      }

      currentVal += c;
      pos++;
    }

    const record = {};
    columns.forEach((col, idx) => {
      let val = row[idx];
      if (!val || val.toUpperCase() === 'NULL') {
        record[col] = null;
      } else if (val.toUpperCase() === 'TRUE') {
        record[col] = true;
      } else if (val.toUpperCase() === 'FALSE') {
        record[col] = false;
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1).replace(/''/g, "'");
        if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
          try {
            record[col] = JSON.parse(val);
          } catch {
            record[col] = val;
          }
        } else {
          record[col] = val;
        }
      } else if (!isNaN(Number(val))) {
        record[col] = Number(val);
      } else {
        record[col] = val;
      }
    });

    if (Object.keys(record).length > 0) {
      records.push(record);
    }
  }

  return { tableName, columns, records };
}

async function importFile(filePath, tableName) {
  console.log(`📄 Processing: ${path.basename(filePath)}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Split into statements
  const statements = content.split(';').map(s => s.trim()).filter(s => s);

  for (const stmt of statements) {
    if (stmt.toUpperCase().startsWith('INSERT')) {
      // Try to execute via RPC first
      const rpcSuccess = await executeSql(stmt + ';');
      
      if (!rpcSuccess) {
        // Fallback to parsing and inserting via Supabase client
        const parsed = parseInsertStatement(stmt);
        if (parsed && parsed.records.length > 0) {
          console.log(`   Parsed ${parsed.records.length} records for ${parsed.tableName}`);
          
          // Insert in batches of 100
          for (let i = 0; i < parsed.records.length; i += 100) {
            const batch = parsed.records.slice(i, i + 100);
            try {
              const { error } = await supabase
                .from(parsed.tableName)
                .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
              
              if (error) {
                console.warn(`   ⚠️ Batch ${i/100 +1} failed:`, error.message);
              } else {
                console.log(`   ✅ Batch ${i/100 +1} imported`);
              }
            } catch (err) {
              console.warn(`   ⚠️ Batch ${i/100 +1} failed:`, err.message);
            }
          }
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting data import process...\n');
  
  // Step 1: Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Error: Data directory not found at ${DATA_DIR}`);
    process.exit(1);
  }
  
  // Step 2: List all SQL files
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));
  console.log(`📁 Found ${files.length} SQL files\n`);
  
  // Step 3: Create helper functions (needs manual setup first)
  await createHelperFunctions();
  
  // Step 4: Show instructions to user
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/iryiykkzapmjioazjcwf/sql/new');
  console.log('2. Paste the content of database/import-all-data-2025.sql (just the first part - helper functions and setup)');
  console.log('3. Click "Run"');
  console.log('4. Then run this script again!');
  console.log('\n💡 Alternatively, you can run the full database/import-all-data-2025.sql in SQL Editor directly!');
}

main().catch(console.error);
