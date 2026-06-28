import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Set SUPABASE_URL dan SUPABASE_ANON_KEY (atau VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) sebelum menjalankan script ini.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function walkFiles(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function extractSupabaseTablesFromSource(srcRoot: string): string[] {
  const files = walkFiles(srcRoot).filter(p => /\.(ts|tsx|js|jsx)$/.test(p));
  const tables = new Set<string>();
  const fromRegex = /\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = fromRegex.exec(content)) !== null) {
      const table = match[1]?.trim();
      if (table) tables.add(table);
    }
  }

  return Array.from(tables).sort((a, b) => a.localeCompare(b));
}

async function listTables() {
  try {
    console.log('Fetching table information from Supabase...');
    
    const srcTables = extractSupabaseTablesFromSource(path.resolve(process.cwd(), 'src'));
    console.log(`\nDetected ${srcTables.length} tables referenced by supabase.from() in src/:`);
    console.log(srcTables.join(', '));

    console.log('\nChecking table availability (may show access restrictions when RLS blocks anon):');
    for (const tableName of srcTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error && error.message.includes('Could not find the table')) {
          console.log(`✗ ${tableName} MISSING`);
        } else if (error) {
          console.log(`✓ ${tableName} EXISTS (restricted)`);
        } else {
          console.log(`✓ ${tableName} EXISTS (count: ${count})`);
        }
      } catch {
        console.log(`? ${tableName} UNKNOWN (connection test failed)`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

listTables();
