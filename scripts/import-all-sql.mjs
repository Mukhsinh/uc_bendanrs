
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

console.log('🚀 Connecting to Supabase...');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const DATA_DIR = join(__dirname, '../public/data 2025');
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

async function main() {
  console.log('📦 Preparing to import data...');

  // Step 1: Create helper functions
  console.log('🔧 Creating helper functions...');
  const setupSql = readFileSync(join(__dirname, '../database/setup-for-import.sql'), 'utf8');
  const setupStatements = setupSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const stmt of setupStatements) {
    try {
      await supabase.rpc('exec_sql', { sql_query: stmt });
    } catch (err) {
      // If function doesn't exist yet, try to create it without rpc (we'll use a different approach)
      console.warn('⚠️ Could not run setup statement:', err.message);
    }
  }

  // Step 2: Get all SQL files
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));

  // Step 3: Import files in order
  for (const targetTable of TABLE_ORDER) {
    const matchingFiles = files.filter(f => {
      const lowerF = f.toLowerCase();
      const normalized = targetTable.toLowerCase().replace(/\s+/g, '_');
      return lowerF.includes(normalized) || lowerF.includes(targetTable.toLowerCase().replace(/\s+/g, ''));
    });

    for (const file of matchingFiles) {
      const filePath = join(DATA_DIR, file);
      console.log(`📄 Importing: ${file}`);
      const sql = readFileSync(filePath, 'utf8');
      try {
        // Split into individual INSERT statements if multiple
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const stmt of statements) {
          if (stmt.toUpperCase().startsWith('INSERT')) {
            try {
              // First try rpc
              const { error: rpcErr } = await supabase.rpc('exec_sql', { sql_query: stmt });
              if (rpcErr) {
                console.warn('⚠️ RPC failed, trying direct upsert...');
                await insertViaSupabase(stmt, targetTable);
              }
            } catch (err) {
              console.warn('⚠️ Failed to run statement:', err.message);
              await insertViaSupabase(stmt, targetTable);
            }
          }
        }
        console.log(`✅ Imported: ${file}`);
      } catch (err) {
        console.error(`❌ Failed to import ${file}:`, err.message);
      }
    }
  }

  console.log('\n🎉 All data import complete!');
}

async function insertViaSupabase(insertSql, tableName) {
  try {
    const parsed = parseInsertSql(insertSql);
    if (parsed) {
      const { records } = parsed;
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error } = await supabase.from(tableName).upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          console.warn(`⚠️ Batch failed:`, error.message);
        } else {
          console.log(`✅ Batch ${i / 100 + 1} done`);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not parse/insert via Supabase:', err.message);
  }
}

function parseInsertSql(insertSql) {
  const match = insertSql.match(/INSERT INTO\s+(?:public\.)?(?:"([^"]+)"|(\w+))\s*\(([^)]+)\)\s*VALUES\s*(.+)/is);
  if (!match) return null;

  const tableName = match[1] || match[2];
  const columnStr = match[3];
  const valuesStr = match[4];

  const columns = columnStr.split(',').map(c => c.trim().replace(/"/g, ''));
  const records = [];
  let pos = 0;
  let currentRow = [];
  let currentVal = '';
  let inQuote = false;
  let inParen = false;

  while (pos < valuesStr.length) {
    const c = valuesStr[pos];

    if (c === '(' && !inQuote) {
      inParen = true;
      pos++;
      continue;
    }
    if (c === ')' && !inQuote) {
      inParen = false;
      if (currentVal.trim()) currentRow.push(currentVal.trim());
      if (currentRow.length > 0) {
        const record = {};
        columns.forEach((col, idx) => {
          let val = currentRow[idx];
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
        records.push(record);
        currentRow = [];
        currentVal = '';
      }
      pos++;
      continue;
    }
    if (c === ',' && !inQuote && inParen) {
      currentRow.push(currentVal.trim());
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

  return { tableName, records };
}

main().catch(console.error);
