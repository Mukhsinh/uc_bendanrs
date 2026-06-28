
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const DATA_DIR = path.join(__dirname, '../public/data 2025');

console.log('🚀 Importing tenants first...');
const tenantsFile = path.join(DATA_DIR, 'tenants_rows.sql');

if (!fs.existsSync(tenantsFile)) {
  console.error('❌ Tenants file not found!');
  process.exit(1);
}

const content = fs.readFileSync(tenantsFile, 'utf8');
console.log('📄 Read tenants file');

const match = content.match(/INSERT\s+INTO\s+"public"\."tenants"\s*\(([^)]+)\)\s*VALUES\s*(.*)/is);
if (match) {
  const columnsStr = match[1];
  const valuesStr = match[2];
  
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
          let val = currentRecord[idx];
          if (!val || val.toUpperCase() === 'NULL') record[col] = null;
          else if (val.toUpperCase() === 'TRUE') record[col] = true;
          else if (val.toUpperCase() === 'FALSE') record[col] = false;
          else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1).replace(/''/g, "'");
            if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
              try { record[col] = JSON.parse(val); } catch { record[col] = val; }
            } else { record[col] = val; }
          } else if (!isNaN(Number(val))) record[col] = Number(val);
          else record[col] = val;
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
  
  console.log('✅ Parsed ' + records.length + ' tenants');
  
  for (const tenant of records) {
    const { error } = await supabase.from('tenants').upsert(tenant, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.warn('⚠️ Error importing tenant:', error.message);
    } else {
      console.log('✅ Imported tenant:', tenant.name);
    }
  }
  
  console.log('\n🎉 Tenants imported successfully! Now you can run the full import!');
}
