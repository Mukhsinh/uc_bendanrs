import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function getKeyRole(token) {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    return payload.role || payload.rol || null;
}

function assertServiceRoleKeyOrExit() {
    if (!SUPABASE_URL) {
        console.error('❌ Missing VITE_SUPABASE_URL');
        process.exit(1);
    }

    if (!SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
        console.error('   Ambil service_role key dari Supabase Dashboard → Settings → API → Project API Keys');
        process.exit(1);
    }

    if (SUPABASE_ANON_KEY && SUPABASE_SERVICE_KEY === SUPABASE_ANON_KEY) {
        console.error('❌ Service role key masih sama dengan anon key');
        console.error('   Ini menyebabkan RLS/permission/schema operations gagal dan data tidak bisa tercopy sempurna.');
        console.error('   Set SUPABASE_SERVICE_ROLE_KEY dengan key role=service_role (jangan pakai VITE_ untuk service key).');
        process.exit(1);
    }

    const role = getKeyRole(SUPABASE_SERVICE_KEY);
    if (role && role !== 'service_role') {
        console.error(`❌ Key yang dipakai bukan service_role (role=${role})`);
        console.error('   Gunakan Project API Key: service_role untuk proses import.');
        process.exit(1);
    }
}

assertServiceRoleKeyOrExit();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const DATA_DIR = path.join(__dirname, '../public/data 2025');
const BATCH_SIZE = 100;

const TABLE_ORDER = [
    'tenants', 'tenant_settings', 'users_with_roles', 'user_roles', 'user_profiles',
    'daftar_tindakan', 'data_barang_farmasi', 'data_master_barang_farmasi',
    'data_barang_gizi', 'data_dokter', 'data_kegiatan', 'data_kegiatan_transpose',
    'Dasar_Alokasi', 'analisa_bahan_pemeriksaan', 'Data_Kamar', 'data_akomodasi_inap',
    'data_diklat', 'data_biaya', 'data_pendapatan', 'Alokasibiaya pertama dengan JP',
    'Alokasi biaya kedua dengan JP', 'Alokasi BTL dengan JP', 'budgeting_bhp_farmasi',
    'budgeting_bhp_farmasi_public', 'cost_recovery', 'branding_settings', 'biaya_preference',
    'audit_trail', 'api_biaya_endpoints'
];

const TABLE_CONFIG = {
    api_biaya_endpoints: { onConflict: 'method,endpoint' },
    biaya_preference: { onConflict: 'user_id,tenant_id' },
    users_with_roles: { onConflict: 'id' },
    user_profiles: { onConflict: 'user_id' }
};

function looksLikeUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const IMPORTED_AUTH_PASSWORD = process.env.IMPORTED_AUTH_PASSWORD;

async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }
    return { ok: res.ok, status: res.status, json, text };
}

async function upsertAuthUserById({ id, email, user_metadata, password }) {
    const baseUrl = SUPABASE_URL.replace(/\/$/, '');
    const createUrl = `${baseUrl}/auth/v1/admin/users`;
    const updateUrl = `${baseUrl}/auth/v1/admin/users/${encodeURIComponent(id)}`;

    const headers = {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        id,
        email,
        password,
        email_confirm: true,
        user_metadata: user_metadata || {}
    };

    const created = await fetchJson(createUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (created.ok) return { ok: true, created: true };

    const updated = await fetchJson(updateUrl, { method: 'PUT', headers, body: JSON.stringify(payload) });
    if (updated.ok) return { ok: true, created: false };

    return { ok: false, message: created.json?.msg || created.json?.message || created.text || `HTTP ${created.status}` };
}

async function ensureAuthUsersFromUsersWithRoles(records) {
    if (!IMPORTED_AUTH_PASSWORD) {
        console.warn('⚠️  IMPORTED_AUTH_PASSWORD belum diset. Lewati pembuatan user di Supabase Auth (login tetap akan gagal).');
        return;
    }

    let okCount = 0;
    let failCount = 0;

    for (const r of records) {
        const id = r.id;
        const email = r.email;
        if (!looksLikeUuid(id) || !email) continue;
        const result = await upsertAuthUserById({
            id,
            email,
            user_metadata: r.raw_user_meta_data || {},
            password: IMPORTED_AUTH_PASSWORD
        });
        if (result.ok) okCount++;
        else failCount++;
    }

    console.log(`   🔐 Supabase Auth users synced: ${okCount} ok, ${failCount} failed`);
}

function parseSqlInsert(sql) {
    // Match INSERT INTO "public"."table" (cols) VALUES (vals), (vals), ...
    const match = sql.match(/INSERT\s+INTO\s+(?:"public"\.)?(?:"([^"]+)"|(\w+))\s*\(([^)]+)\)\s*VALUES\s*(.+)/is);
    if (!match) return null;

    const tableName = match[1] || match[2];
    const columnStr = match[3];
    const valuesStr = match[4];

    const columns = columnStr.split(',').map(c => c.trim().replace(/"/g, ''));

    // Parse values - more robust handling
    const records = [];
    let pos = 0;

    while (pos < valuesStr.length) {
        // Skip whitespace and commas
        while (pos < valuesStr.length && /\s|,/.test(valuesStr[pos])) pos++;

        if (pos >= valuesStr.length) break;

        // Expecting '('
        if (valuesStr[pos] !== '(') { pos++; continue; }
        pos++;

        // Parse row
        const row = [];
        let currentVal = '';
        let inQuote = false;

        while (pos < valuesStr.length) {
            const c = valuesStr[pos];

            if (c === ')' && !inQuote) {
                pos++;
                if (currentVal.trim()) row.push(currentVal.trim());
                break;
            }

            if (c === ',' && !inQuote) {
                row.push(currentVal.trim());
                currentVal = '';
                pos++;
                continue;
            }

            if (c === "'") {
                // Check if it's an escaped quote
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

        // Convert row to record
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
                    try { record[col] = JSON.parse(val); }
                    catch { record[col] = val; }
                } else {
                    record[col] = val;
                }
            } else if (!isNaN(Number(val))) {
                record[col] = Number(val);
            } else {
                record[col] = val;
            }
        });
        if (Object.keys(record).length > 0) records.push(record);
    }

    return { tableName, records };
}

const context = {
    unitKerjaByKode: new Map()
};

function transformRecords(tableName, records) {
    for (const r of records) {
        // Generic fix for numeric strings in potentially bigint columns
        // Especially for tarif, harga, etc.
        for (const k in r) {
            if (typeof r[k] === 'string' && /^-?\d+\.\d+$/.test(r[k])) {
                // If it looks like a float but might be expected as bigint
                // We'll round it to integer for now if it's causing errors
                if (k.includes('harga') || k.includes('tarif') || k.includes('biaya') || k.includes('nilai')) {
                    r[k] = Math.round(parseFloat(r[k]));
                } else if (!isNaN(Number(r[k]))) {
                    // Try to convert to number if it's a valid number string
                    r[k] = Number(r[k]);
                }
            }
        }

        if (tableName === 'data_kegiatan') {
            const kode = r.Kode_UK ?? r.kode_uk ?? r.kode_unit_kerja;
            const nama = r.Nama_Unit_Kerja ?? r.nama_unit_kerja;
            if (kode && nama) context.unitKerjaByKode.set(String(kode).trim(), String(nama).trim());
        }

        if (tableName === 'Dasar_Alokasi') {
            if (r.Nama_Unit_Kerja == null && r.Kode_UK != null) {
                const nama = context.unitKerjaByKode.get(String(r.Kode_UK).trim());
                if (nama) r.Nama_Unit_Kerja = nama;
            }
        }

        if (tableName === 'biaya_preference') {
            if (typeof r.id === 'number' || (typeof r.id === 'string' && !looksLikeUuid(r.id))) {
                delete r.id;
            }
        }

        if (tableName === 'daftar_tindakan' || tableName === 'data_pendapatan' || tableName === 'data_biaya') {
            // Check for stringified JSON in bahan_tindakan or other similar columns
            for (const key of ['bahan_tindakan', 'rincian', 'details', 'metadata']) {
                if (typeof r[key] === 'string' && (r[key].startsWith('[') || r[key].startsWith('{'))) {
                    try {
                        r[key] = JSON.parse(r[key]);
                    } catch (e) {
                        console.warn(`      ⚠️  Failed to parse JSON for ${key} in ${tableName}: ${e.message}`);
                        // If it's malformed JSON (like truncated string), maybe try to fix or just set to null/empty
                        if (r[key].length > 1000) {
                            r[key] = null; // Safety for extremely large malformed strings
                        }
                    }
                }
            }
        }

        if (tableName === 'user_profiles') {
            // Check if DB has 'id' but we have 'user_id' or vice versa
            // We'll let the auto-stripping handle extra columns, 
            // but we ensure we provide the correct one.
        }

        if (tableName === 'tenant_settings') {
            if (r.setting_key == null) {
                r.setting_key = 'general'; // Default setting key
            }
        }
    }
    return records;
}


function stripColumn(records, columnName) {
    for (const r of records) {
        if (Object.prototype.hasOwnProperty.call(r, columnName)) {
            delete r[columnName];
        }
    }
}

function parseMissingColumnFromSchemaCacheError(message) {
    let m = message.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/i);
    if (m) return { column: m[1], table: m[2] };

    m = message.match(/column \"([^\"]+)\" of relation \"([^\"]+)\" does not exist/i);
    if (m) return { column: m[1], table: m[2] };

    m = message.match(/column \"([^\"]+)\" does not exist/i);
    if (m) return { column: m[1], table: null };

    return null;
}

function parseNonDefaultColumnError(message) {
    const m = message.match(/cannot insert a non-DEFAULT value into column \"([^\"]+)\"/i);
    if (!m) return null;
    return m[1];
}

async function ensureRolesExist(records) {
    if (!records || records.length === 0) return;

    // Standard roles if we can't find them in records
    // Note: Database uses 'role_name' instead of 'name'
    const rolesToEnsure = [
        { id: 'a9158cdd-f138-4964-b832-8cf1b69c4e21', role_name: 'Super Admin', description: 'Administrator' },
        { id: '787669af-f671-41cb-8659-f45202a9a1ab', role_name: 'Admin', description: 'Admin' },
        { id: 'a69f2b97-05e9-4ddb-b13e-13b628f35583', role_name: 'Operator', description: 'Operator' }
    ];

    // Also extract unique role_ids from records if they are not in the standard list
    const roleIdsFromRecords = [...new Set(records.map(r => r.role_id).filter(Boolean))];
    for (const rid of roleIdsFromRecords) {
        if (!rolesToEnsure.find(r => r.id === rid)) {
            rolesToEnsure.push({
                id: rid,
                role_name: `Role_${rid.substring(0, 8)}`,
                description: 'Imported role'
            });
        }
    }

    console.log(`   🛠 Ensuring ${rolesToEnsure.length} roles exist in role_akses_aplikasi...`);
    const { error } = await supabase.from('role_akses_aplikasi').upsert(rolesToEnsure, { onConflict: 'id' });
    if (error) console.warn(`   ⚠️  Failed to ensure roles in role_akses_aplikasi: ${error.message}`);
    else console.log(`   ✅ Roles ensured in role_akses_aplikasi`);
}

async function upsertBatch(tableName, batch) {
    let targetTable = tableName;
    if (tableName === 'roles') targetTable = 'role_akses_aplikasi';

    const config = TABLE_CONFIG[targetTable] || TABLE_CONFIG[tableName] || {};
    const onConflict = config.onConflict || 'id';
    const maxAttempts = 6;

    let workingBatch = batch.map(r => {
        const nr = { ...r };
        // Map 'name' to 'role_name' for roles table
        if (tableName === 'roles' && nr.name && !nr.role_name) {
            nr.role_name = nr.name;
            delete nr.name;
        }
        return nr;
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const { error } = await supabase
            .from(targetTable)
            .upsert(workingBatch, { onConflict, ignoreDuplicates: false });

        if (!error) return { ok: true, fixed: false };

        const msg = error.message || String(error);

        const missing = parseMissingColumnFromSchemaCacheError(msg);
        if (missing && (missing.table === targetTable || missing.table.endsWith(`.${targetTable}`))) {
            // SPECIAL CASE: mapping id and user_id for user_profiles
            if (targetTable === 'user_profiles') {
                if (missing.column === 'user_id') {
                    for (const r of workingBatch) { r.id = r.user_id; }
                } else if (missing.column === 'id') {
                    for (const r of workingBatch) { r.user_id = r.id; }
                }
            }
            stripColumn(workingBatch, missing.column);
            continue;
        }

        const nonDefaultCol = parseNonDefaultColumnError(msg);
        if (nonDefaultCol) {
            stripColumn(workingBatch, nonDefaultCol);
            continue;
        }

        if (/invalid input syntax for type uuid/i.test(msg)) {
            stripColumn(workingBatch, 'id');
            if (TABLE_CONFIG[tableName]?.onConflict === onConflict) {
                continue;
            }
        }

        if (/there is no unique constraint matching the ON CONFLICT specification/i.test(msg)) {
            const { error: insertError } = await supabase
                .from(tableName)
                .insert(workingBatch);
            if (!insertError) return { ok: true, fixed: true };
            return { ok: false, message: insertError.message };
        }

        return { ok: false, message: msg };
    }

    return { ok: false, message: 'Retry attempts exhausted' };
}

const ENSURED_USERS = new Set();

async function ensureUsersExistForBatch(batch) {
    if (!IMPORTED_AUTH_PASSWORD) return;

    const userIds = new Set();
    const columnsToCheck = ['user_id', 'created_by', 'assigned_by', 'updated_by'];
    for (const r of batch) {
        for (const col of columnsToCheck) {
            if (r[col] && looksLikeUuid(r[col]) && !ENSURED_USERS.has(r[col])) {
                userIds.add(r[col]);
            }
        }
        // For user_profiles, 'id' is the auth user ID after transformation
        if (looksLikeUuid(r.id) && !ENSURED_USERS.has(r.id)) {
            userIds.add(r.id);
        }
    }

    if (userIds.size === 0) return;

    const ids = Array.from(userIds);
    console.log(`   🛠 Ensuring ${ids.length} NEW potential users in auth.users...`);

    for (const id of ids) {
        // Skip check and just try to create with a dummy email if it doesn't exist
        // upsertAuthUserById already handles both create and update
        const email = `user_${id.substring(0, 8)}@imported.local`;
        const res = await upsertAuthUserById({
            id,
            email,
            password: IMPORTED_AUTH_PASSWORD,
            user_metadata: { imported: true }
        });
        if (res.ok) ENSURED_USERS.add(id);
    }
}





async function importFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`📄 Processing ${fileName}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseSqlInsert(content);

    if (!parsed) {
        console.log('   ⚠️  No INSERT statements found');
        return;
    }

    const { tableName, records } = parsed;
    transformRecords(tableName, records);
    console.log(`   Table: ${tableName}, Records: ${records.length}`);

    if (records.length === 0) return;

    if (tableName === 'user_roles') {
        await ensureRolesExist(records);
    }

    if (tableName === 'users_with_roles') {
        await ensureAuthUsersFromUsersWithRoles(records);
    }

    // Process in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // Ensure users exist for ANY table that might have a user_id foreign key
        await ensureUsersExistForBatch(batch);

        try {
            const result = await upsertBatch(tableName, batch);
            if (!result.ok) {
                console.warn(`   ⚠️  Batch ${i / BATCH_SIZE + 1} failed: ${result.message}. Trying individual records...`);
                for (let j = 0; j < batch.length; j++) {
                    const singleResult = await upsertBatch(tableName, [batch[j]]);
                    if (!singleResult.ok) {
                        console.error(`      ❌ Record ${i + j + 1} failed: ${singleResult.message}`);
                        console.log('         Data:', JSON.stringify(batch[j]).substring(0, 500));
                    }
                }
            } else {
                console.log(`   ✅ Batch ${i / BATCH_SIZE + 1} done`);
            }
        } catch (e) {
            console.warn(`   ⚠️  Batch ${i / BATCH_SIZE + 1} failed (Exception): ${e.message}. Trying individual records...`);
            for (let j = 0; j < batch.length; j++) {
                try {
                    const singleResult = await upsertBatch(tableName, [batch[j]]);
                    if (!singleResult.ok) {
                        console.error(`      ❌ Record ${i + j + 1} failed: ${singleResult.message}`);
                    }
                } catch (innerE) {
                    console.error(`      ❌ Record ${i + j + 1} threw error: ${innerE.message}`);
                }
            }
        }


    }
}

async function main() {
    console.log('🚀 Starting data import...');

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));

    for (const tableName of TABLE_ORDER) {
        const matchingFiles = files.filter(f => {
            const lowerF = f.toLowerCase();
            const normalized = tableName.toLowerCase().replace(/\s+/g, '_');
            return lowerF.includes(normalized) || lowerF.includes(tableName.toLowerCase().replace(/\s+/g, ''));
        });

        for (const file of matchingFiles) {
            await importFile(path.join(DATA_DIR, file));
        }
    }

    console.log('\n🎉 Import complete!');
}

main().catch(console.error);
