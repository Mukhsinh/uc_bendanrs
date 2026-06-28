import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditSchema() {
    console.log('--- Schema Audit ---');

    // Check tables
    const tablesToCheck = [
        'tenants', 'tenant_settings', 'user_roles', 'user_profiles',
        'users_with_roles', 'unit_kerja', 'daftar_tindakan',
        'data_master_barang_farmasi', 'data_barang_farmasi',
        'data_barang_gizi', 'data_dokter', 'data_kegiatan',
        'Dasar_Alokasi', 'analisa_bahan_pemeriksaan'
    ];

    for (const table of tablesToCheck) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(0);

        if (error) {
            console.log(`❌ Table [${table}]: ${error.message}`);
        } else {
            console.log(`✅ Table [${table}]: Exists`);
        }
    }

    console.log('\n--- Column Audit ---');
    const columnsToCheck = [
        { table: 'tenants', column: 'status' },
        { table: 'tenant_settings', column: 'calculation_method' },
        { table: 'user_roles', column: 'assigned_at' },
        { table: 'user_profiles', column: 'avatar_url' },
        { table: 'data_barang_farmasi', column: 'gudang' },
        { table: 'data_dokter', column: 'jenis_spesialistik' },
        { table: 'data_kegiatan', column: 'is_dummy' }
    ];

    for (const item of columnsToCheck) {
        const { data, error } = await supabase
            .rpc('check_column_exists', { t_name: item.table, c_name: item.column });

        // If RPC doesn't exist, we can try to select the column
        const { error: colError } = await supabase
            .from(item.table)
            .select(item.column)
            .limit(0);

        if (colError) {
            console.log(`❌ Column [${item.table}.${item.column}]: ${colError.message}`);
        } else {
            console.log(`✅ Column [${item.table}.${item.column}]: Exists`);
        }
    }
}

auditSchema();
