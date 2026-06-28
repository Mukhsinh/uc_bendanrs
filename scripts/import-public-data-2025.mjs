import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Set SUPABASE_URL/VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY (atau VITE_SUPABASE_SERVICE_ROLE_KEY) sebelum menjalankan import.'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const DATA_DIR = path.resolve(process.cwd(), 'public', 'data 2025');
const FILES = [
  'Data_Kamar.sql',
  'klinik.sql',
  'menu_gizi.sql',
  'tindakan_laboratorium.sql',
  'tindakan_radiologi.sql',
  'tindakan_operatif.sql',
  'tindakan_bdrs.sql',
  'tindakan_cathlab.sql',
  'daftar_tindakan.sql',
];

const JSON_COLUMNS = new Set(['bahan_tindakan']);
const DROP_ID_TABLES = new Set(['Data_Kamar', 'menu_gizi']);

const args = process.argv.slice(2);
const argMap = Object.fromEntries(
  args
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => {
      const [k, ...rest] = a.split('=');
      const key = (k || '').replace(/^--/, '').trim();
      const value = rest.join('=').trim();
      return [key, value];
    })
    .filter(([k, v]) => k && v)
);

const ONLY_TABLES_RAW = (process.env.ONLY_TABLES || argMap.only || '').trim();
const ONLY_TABLES = new Set(
  ONLY_TABLES_RAW
    ? ONLY_TABLES_RAW.split(',').map((s) => s.trim()).filter(Boolean)
    : []
);

function shouldProcessTable(tableName) {
  if (ONLY_TABLES.size === 0) return true;
  return ONLY_TABLES.has(tableName);
}

function parseSqlStringLiteral(raw) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("'") || !trimmed.endsWith("'")) return null;
  const inner = trimmed.slice(1, -1);
  return inner.replace(/''/g, "'");
}

function parseScalar(raw, columnName) {
  const v = raw.trim();
  if (!v) return null;
  if (v.toUpperCase() === 'NULL') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;

  const asString = parseSqlStringLiteral(v);
  if (asString !== null) {
    if (JSON_COLUMNS.has(columnName)) {
      try {
        return JSON.parse(asString);
      } catch {
        return asString;
      }
    }
    return asString;
  }

  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function extractInsert(sqlText) {
  const sql = sqlText.trim().replace(/\s+$/g, '');
  const insertIdx = sql.toUpperCase().indexOf('INSERT INTO');
  if (insertIdx === -1) throw new Error('SQL tidak mengandung INSERT INTO');

  const tableMatch = sql.match(/INSERT\s+INTO\s+"public"\."([^"]+)"/i);
  if (!tableMatch) throw new Error('Gagal membaca nama tabel dari SQL');
  const table = tableMatch[1];

  const colsStart = sql.indexOf('(', tableMatch.index);
  if (colsStart === -1) throw new Error('Gagal menemukan daftar kolom');

  const colsEnd = sql.indexOf(')', colsStart);
  if (colsEnd === -1) throw new Error('Gagal menemukan penutup daftar kolom');

  const colsRaw = sql.slice(colsStart + 1, colsEnd);
  const columns = colsRaw
    .split(',')
    .map((c) => c.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);

  const valuesIdx = sql.toUpperCase().indexOf('VALUES', colsEnd);
  if (valuesIdx === -1) throw new Error('Gagal menemukan VALUES');

  const valuesSection = sql.slice(valuesIdx + 6).trim();
  const tuples = [];

  let i = 0;
  while (i < valuesSection.length) {
    while (i < valuesSection.length && /\s|,/.test(valuesSection[i])) i += 1;
    if (i >= valuesSection.length) break;
    if (valuesSection[i] === ';') break;
    if (valuesSection[i] !== '(') throw new Error(`Format VALUES tidak valid pada posisi ${i}`);

    i += 1;
    let inString = false;
    let tuple = '';
    while (i < valuesSection.length) {
      const ch = valuesSection[i];
      const next = valuesSection[i + 1];

      if (inString) {
        if (ch === "'" && next === "'") {
          tuple += "''";
          i += 2;
          continue;
        }
        if (ch === "'") {
          inString = false;
          tuple += ch;
          i += 1;
          continue;
        }
        tuple += ch;
        i += 1;
        continue;
      }

      if (ch === "'") {
        inString = true;
        tuple += ch;
        i += 1;
        continue;
      }

      if (ch === ')') {
        i += 1;
        break;
      }

      tuple += ch;
      i += 1;
    }

    tuples.push(tuple);
    while (i < valuesSection.length && /\s/.test(valuesSection[i])) i += 1;
    if (valuesSection[i] === ',') i += 1;
    if (valuesSection[i] === ';') break;
  }

  const rows = tuples.map((tupleText) => {
    const fields = [];
    let inString = false;
    let token = '';

    for (let j = 0; j < tupleText.length; j += 1) {
      const ch = tupleText[j];
      const next = tupleText[j + 1];

      if (inString) {
        if (ch === "'" && next === "'") {
          token += "''";
          j += 1;
          continue;
        }
        if (ch === "'") {
          inString = false;
          token += ch;
          continue;
        }
        token += ch;
        continue;
      }

      if (ch === "'") {
        inString = true;
        token += ch;
        continue;
      }

      if (ch === ',') {
        fields.push(token.trim());
        token = '';
        continue;
      }

      token += ch;
    }

    if (token.length > 0) fields.push(token.trim());
    if (fields.length !== columns.length) {
      throw new Error(`Jumlah kolom (${columns.length}) tidak sama dengan jumlah nilai (${fields.length}) untuk tabel ${table}`);
    }
    return fields;
  });

  return { table, columns, rows };
}

async function resolveTenantId() {
  const explicitId = process.env.TARGET_TENANT_ID;
  if (explicitId) return explicitId;

  const slug = process.env.TARGET_TENANT_SLUG;
  if (slug) {
    const { data, error } = await supabase.from('tenants').select('id, slug').eq('slug', slug).single();
    if (error || !data) throw new Error(`Tenant dengan slug '${slug}' tidak ditemukan`);
    return data.id;
  }

  const { data, error } = await supabase.from('tenants').select('id, created_at').order('created_at', { ascending: true }).limit(1);
  if (error || !data?.length) throw new Error('Tidak menemukan tenant. Pastikan tabel tenants sudah terisi.');
  return data[0].id;
}

async function importTableFromSqlFile(fileName, tenantId) {
  const fullPath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File tidak ditemukan: ${fullPath}`);
  }

  const sqlText = fs.readFileSync(fullPath, 'utf8');
  const { table, columns, rows } = extractInsert(sqlText);

  const dropId = DROP_ID_TABLES.has(table);
  const objects = rows.map((row) => {
    const obj = {};
    for (let i = 0; i < columns.length; i += 1) {
      const col = columns[i];
      if (col === 'tenant_id') continue;
      if (dropId && col === 'id') continue;
      obj[col] = parseScalar(row[i], col);
    }
    obj.tenant_id = tenantId;
    return obj;
  });

  const { error: delError } = await supabase.from(table).delete().eq('tenant_id', tenantId);
  if (delError) throw new Error(`Gagal menghapus data lama (${table}): ${delError.message}`);

  const chunkSize = Number(process.env.IMPORT_CHUNK_SIZE || 250);
  for (let i = 0; i < objects.length; i += chunkSize) {
    const chunk = objects.slice(i, i + chunkSize);
    const { error: insError } = await supabase.from(table).insert(chunk);
    if (insError) {
      throw new Error(`Gagal insert ${table} (chunk ${i}-${i + chunk.length - 1}): ${insError.message}`);
    }
  }

  return { table, count: objects.length };
}

async function canAccessTable(tableName) {
  const { error } = await supabase.from(tableName).select('*', { head: true, count: 'exact' }).limit(1);
  if (!error) return true;
  if ((error.message || '').includes('Could not find the table')) return false;
  return true;
}

async function seedEksternalTablesIfAvailable(tenantId) {
  const tahun = Number(process.env.TARGET_YEAR || 2025);
  const enabled = (process.env.SEED_EKSTERNAL || 'true').toLowerCase() === 'true';
  if (!enabled) return;

  if (!(await canAccessTable('user_profiles'))) return;
  const { data: profiles, error: profErr } = await supabase
    .from('user_profiles')
    .select('user_id, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (profErr || !profiles?.length) {
    process.stdout.write('! Lewati seed eksternal: tidak menemukan user_profiles untuk tenant\n');
    return;
  }

  const userId = profiles[0].user_id;
  const chunkSize = Number(process.env.IMPORT_CHUNK_SIZE || 250);

  if (await canAccessTable('daftar_laboratorium_eksternal')) {
    await supabase.from('daftar_laboratorium_eksternal').delete().eq('tenant_id', tenantId).eq('tahun', tahun);
    const { data: lab, error: labErr } = await supabase
      .from('tindakan_laboratorium')
      .select('kode, nama')
      .eq('tenant_id', tenantId);
    if (!labErr && lab?.length) {
      const rows = lab.map((r) => ({
        tenant_id: tenantId,
        user_id: userId,
        tahun,
        kode_pemeriksaan: r.kode,
        nama_pemeriksaan: r.nama,
        jasa_sarana: 0,
        jp_medis: 0,
        jp_non_medis: 0,
        tarif: 0,
      }));
      for (let i = 0; i < rows.length; i += chunkSize) {
        const { error } = await supabase.from('daftar_laboratorium_eksternal').insert(rows.slice(i, i + chunkSize));
        if (error) throw new Error(`Gagal seed daftar_laboratorium_eksternal: ${error.message}`);
      }
      process.stdout.write(`✓ daftar_laboratorium_eksternal: ${rows.length} baris (tahun ${tahun})\n`);
    }
  }

  if (await canAccessTable('daftar_radiologi_eksternal')) {
    await supabase.from('daftar_radiologi_eksternal').delete().eq('tenant_id', tenantId).eq('tahun', tahun);
    const { data: rad, error: radErr } = await supabase
      .from('tindakan_radiologi')
      .select('kode_tindakan, nama_tindakan')
      .eq('tenant_id', tenantId);
    if (!radErr && rad?.length) {
      const rows = rad.map((r) => ({
        tenant_id: tenantId,
        user_id: userId,
        tahun,
        kode_pemeriksaan: r.kode_tindakan,
        nama_pemeriksaan: r.nama_tindakan,
        jasa_sarana: 0,
        jp_medis: 0,
        jp_non_medis: 0,
        tarif: 0,
      }));
      for (let i = 0; i < rows.length; i += chunkSize) {
        const { error } = await supabase.from('daftar_radiologi_eksternal').insert(rows.slice(i, i + chunkSize));
        if (error) throw new Error(`Gagal seed daftar_radiologi_eksternal: ${error.message}`);
      }
      process.stdout.write(`✓ daftar_radiologi_eksternal: ${rows.length} baris (tahun ${tahun})\n`);
    }
  }
}

async function main() {
  const tenantId = await resolveTenantId();
  const results = [];

  for (const file of FILES) {
    const sqlText = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    const { table } = extractInsert(sqlText);
    if (!shouldProcessTable(table)) continue;
    const { table: importedTable, count } = await importTableFromSqlFile(file, tenantId);
    results.push({ table: importedTable, count });
    process.stdout.write(`✓ ${importedTable}: ${count} baris\n`);
  }

  await seedEksternalTablesIfAvailable(tenantId);
  process.stdout.write(`\nSelesai. Tenant: ${tenantId}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.message || String(err)}\n`);
  process.exit(1);
});
