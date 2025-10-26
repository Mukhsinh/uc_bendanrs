// Script untuk membuat tabel menggunakan Supabase client
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const supabaseUrl = 'https://koepzicdtovtknsqlnac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDg1NzgsImV4cCI6MjA3Mjg4NDU3OH0.QUpuIaPDlDVp2LKSJYkBj4z3IY0aJwyCNhOXyVC2Ui0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createKalkulasiDiklatTable() {
    console.log('🚀 Creating kalkulasi_diklat table...');
    
    try {
        // Step 1: Create the table
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS kalkulasi_diklat (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            tahun INTEGER NOT NULL,
            jenis_diklat VARCHAR(50) NOT NULL CHECK (jenis_diklat IN ('basis_dokter', 'basis_perawat', 'basis_penunjang', 'basis_administrasi')),
            lama_hari_diklat INTEGER NOT NULL DEFAULT 0,
            biaya_unit_diklat DECIMAL(15,2) DEFAULT 0,
            biaya_distribusi_kedua DECIMAL(15,2) DEFAULT 0,
            total_biaya_unit_diklat DECIMAL(15,2) DEFAULT 0,
            total_diklat INTEGER DEFAULT 0,
            biaya_diklat_per_hari DECIMAL(15,2) DEFAULT 0,
            unit_cost_per_jenis_layanan DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        `;
        
        console.log('📋 Executing table creation...');
        const { data: tableResult, error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (tableError) {
            console.error('❌ Error creating table:', tableError);
            return false;
        }
        
        console.log('✅ Table created successfully!');
        
        // Step 2: Create indexes
        const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_user_tahun ON kalkulasi_diklat(user_id, tahun);
        CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_jenis ON kalkulasi_diklat(jenis_diklat);
        `;
        
        console.log('📋 Creating indexes...');
        const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexSQL });
        
        if (indexError) {
            console.error('⚠️ Warning creating indexes:', indexError);
        } else {
            console.log('✅ Indexes created successfully!');
        }
        
        // Step 3: Create triggers and functions
        const createTriggersSQL = `
        CREATE OR REPLACE FUNCTION update_kalkulasi_diklat_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_update_kalkulasi_diklat_updated_at
            BEFORE UPDATE ON kalkulasi_diklat
            FOR EACH ROW
            EXECUTE FUNCTION update_kalkulasi_diklat_updated_at();
        `;
        
        console.log('📋 Creating triggers...');
        const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggersSQL });
        
        if (triggerError) {
            console.error('⚠️ Warning creating triggers:', triggerError);
        } else {
            console.log('✅ Triggers created successfully!');
        }
        
        // Step 4: Enable RLS and create policies
        const createRLSSQL = `
        ALTER TABLE kalkulasi_diklat ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own kalkulasi_diklat" ON kalkulasi_diklat
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own kalkulasi_diklat" ON kalkulasi_diklat
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own kalkulasi_diklat" ON kalkulasi_diklat
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own kalkulasi_diklat" ON kalkulasi_diklat
            FOR DELETE USING (auth.uid() = user_id);
        `;
        
        console.log('📋 Creating RLS policies...');
        const { error: rlsError } = await supabase.rpc('exec_sql', { sql: createRLSSQL });
        
        if (rlsError) {
            console.error('⚠️ Warning creating RLS policies:', rlsError);
        } else {
            console.log('✅ RLS policies created successfully!');
        }
        
        // Step 5: Insert sample data
        const insertSampleSQL = `
        INSERT INTO kalkulasi_diklat (
            user_id, 
            tahun, 
            jenis_diklat, 
            lama_hari_diklat, 
            biaya_unit_diklat, 
            biaya_distribusi_kedua, 
            total_diklat
        ) VALUES 
        (
            (SELECT id FROM auth.users LIMIT 1), 
            2025, 
            'basis_dokter', 
            5, 
            1000000, 
            200000, 
            10
        ),
        (
            (SELECT id FROM auth.users LIMIT 1), 
            2025, 
            'basis_perawat', 
            3, 
            750000, 
            150000, 
            15
        )
        ON CONFLICT DO NOTHING;
        `;
        
        console.log('📋 Inserting sample data...');
        const { error: insertError } = await supabase.rpc('exec_sql', { sql: insertSampleSQL });
        
        if (insertError) {
            console.error('⚠️ Warning inserting sample data:', insertError);
        } else {
            console.log('✅ Sample data inserted successfully!');
        }
        
        console.log('🎉 kalkulasi_diklat table setup completed!');
        console.log('🔄 Please refresh your application at http://localhost:8080');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// Run the function
createKalkulasiDiklatTable().then(success => {
    if (success) {
        console.log('✅ Table creation completed successfully!');
        process.exit(0);
    } else {
        console.log('❌ Table creation failed!');
        process.exit(1);
    }
});
