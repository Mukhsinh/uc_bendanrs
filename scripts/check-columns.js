import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Columns ---');

    // There isn't a direct way to get columns via supabase-js without data or rpc
    // But we can try to select 'id' specifically to see if it errors
    console.log('Testing column user_profiles.id...');
    const { error: idError } = await supabase.from('user_profiles').select('id').limit(1);
    if (idError) {
        console.log('❌ user_profiles.id NOT FOUND:', idError.message);
    } else {
        console.log('✅ user_profiles.id FOUND');
    }

    console.log('\nTesting column user_profiles.user_id...');
    const { error: userIdError } = await supabase.from('user_profiles').select('user_id').limit(1);
    if (userIdError) {
        console.log('❌ user_profiles.user_id NOT FOUND:', userIdError.message);
    } else {
        console.log('✅ user_profiles.user_id FOUND');
    }

    console.log('\nTesting column user_profiles.email...');
    const { error: emailError } = await supabase.from('user_profiles').select('email').limit(1);
    if (emailError) {
        console.log('❌ user_profiles.email NOT FOUND:', emailError.message);
    } else {
        console.log('✅ user_profiles.email FOUND');
    }

    console.log('\nChecking users_with_roles table...');
    const { error: uwrError } = await supabase.from('users_with_roles').select('*').limit(1);
    if (uwrError) {
        console.log('❌ users_with_roles NOT FOUND or error:', uwrError.message);
    } else {
        console.log('✅ users_with_roles FOUND');
    }
}

check();
