
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
  console.error('❌ Error: Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

console.log('🚀 Initializing Supabase client...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const DATA_DIR = path.join(__dirname, '../public/data 2025');

const TABLES_IN_ORDER = [
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
  'budgeting_bhp_farmasi',
  'budgeting_bhp_farmasi_public',
  'cost_recovery',
  'branding_settings',
  'biaya_preference',
  'audit_trail',
  'api_biaya_endpoints'
];

function parseValue(val) {
  val = val.trim();
  
  if (val.toUpperCase() === 'NULL') {
    return null;
  }
  
  if (val.toUpperCase() === 'TRUE') {
    return true;
  }
  
  if (val.toUpperCase() === 'FALSE') {
    return false;
  }
  
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.substring(1, val.length - 1).replace(/''/g, "'");
    
    if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    
    return val;
  }
  
  const num = Number(val);
  if (!isNaN(num)) {
    return num;
  }
  
  return val;
}

function parseInsert(sql) {
  // Match INSERT INTO "public"."table" (col1, col2) VALUES (val1, val2), (val3, val4);
  const match = sql.match(/INSERT\s+INTO\s+(?:"public"\.)?(?:"([^"]+)"|(\w+))\s*\(([^)]+)\)\s*VALUES\s*(.*)/is);
  if (!match) return null;

  const tableName = match[1] || match[2];
  const columnsStr = match[3];
  const valuesStr = match[4];

  const columns = columnsStr.split(',').map(c => c.trim().replace(/"/g, ''));

  const records = [];
  let i = 0;
  let currentRecord = [];
  let currentVal = '';
  let inQuote = false;
  let inParen = false;

  while (i < valuesStr.length) {
    const char = valuesStr[i];

    if (char === '(' && !inQuote) {
      inParen = true;
      i++;
      continue;
    }

    if (char === ')' && !inQuote) {
      inParen = false;
      if (currentVal.trim()) {
        currentRecord.push(currentVal.trim());
      }
      
      if (currentRecord.length > 0) {
        const record = {};
        columns.forEach((col, idx) => {
          record[col] = parseValue(currentRecord[idx]);
        });
        records.push(record);
      }
      
      currentRecord = [];
      currentVal = '';
      i++;
      continue;
    }

    if (char === ',' && !inQuote) {
      if (inParen) {
        currentRecord.push(currentVal.trim());
        currentVal = '';
      }
      i++;
      continue;
    }

    if (char === "'") {
      if (i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
        currentVal += "'";
        i += 2;
        continue;
      }
      inQuote = !inQuote;
    }

    currentVal += char;
    i++;
  }

  return { tableName, records };
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Split into statements
  const statements = content
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.toUpperCase().startsWith('INSERT'));

  for (const stmt of statements) {
    const parsed = parseInsert(stmt);
    if (parsed && parsed.records.length > 0) {
      console.log(`   Found ${parsed.records.length} records for table: ${parsed.tableName}`);
      
      // Import in batches of 50
      for (let j = 0; j < parsed.records.length; j += 50) {
        const batch = parsed.records.slice(j, j + 50);
        
        try {
          const { error } = await supabase
            .from(parsed.tableName)
            .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
          
          if (error) {
            console.warn(`   ⚠️ Batch ${Math.floor(j/50) + 1} failed:`, error.message);
          } else {
            console.log(`   ✅ Batch ${Math.floor(j/50) + 1} imported`);
          }
        } catch (err) {
          console.warn(`   ⚠️ Batch ${Math.floor(j/50) + 1} failed:`, err.message);
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting simple data import...');
  console.log(`📁 Data directory: ${DATA_DIR}`);
  
  if (!fs.existsSync(DATA_DIR)) {
    console.error('❌ Data directory not found!');
    process.exit(1);
  }
  
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));
  console.log(`📄 Found ${files.length} SQL files`);
  
  // Process tables in order
  for (const targetTable of TABLES_IN_ORDER) {
    const matchingFiles = files.filter(f => {
      const lowerFile = f.toLowerCase();
      const normalized = targetTable.toLowerCase().replace(/\s+/g, '_');
      return lowerFile.includes(normalized) || lowerFile.includes(targetTable.toLowerCase().replace(/\s+/g, ''));
    });
    
    for (const file of matchingFiles) {
      await processFile(path.join(DATA_DIR, file));
    }
  }
  
  console.log('\n🎉 All done!');
}

main().catch(console.error);
