import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Table Introspection ---');

    const { data: branding } = await supabase.from('branding_settings').select('*').limit(1);
    if (branding && branding.length > 0) console.log('branding_settings columns:', Object.keys(branding[0]).join(', '));
    else console.log('branding_settings is empty');

    const { data: profiles } = await supabase.from('user_profiles').select('*').limit(1);
    if (profiles && profiles.length > 0) console.log('user_profiles columns:', Object.keys(profiles[0]).join(', '));

    // Check if there is a 'roles' table or view
    const { data: roleTest, error: roleError } = await supabase.from('roles').select('*').limit(1);
    if (roleError) console.log('roles table check error:', roleError.message);
    else console.log('roles table exists!');
}

check();
