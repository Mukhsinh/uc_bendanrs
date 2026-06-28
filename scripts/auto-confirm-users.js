import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

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

async function confirmUser(user) {
    const baseUrl = SUPABASE_URL.replace(/\/$/, '');
    const updateUrl = `${baseUrl}/auth/v1/admin/users/${encodeURIComponent(user.id)}`;

    const headers = {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        email_confirm: true
    };

    const result = await fetchJson(updateUrl, { method: 'PUT', headers, body: JSON.stringify(payload) });
    return result;
}

async function main() {
    console.log('🚀 Starting auto-confirmation of users...');

    // Get all users from auth.users (via admin API)
    const baseUrl = SUPABASE_URL.replace(/\/$/, '');
    const listUrl = `${baseUrl}/auth/v1/admin/users`;
    const headers = {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
    };

    const res = await fetchJson(listUrl, { method: 'GET', headers });
    if (!res.ok) {
        console.error('❌ Failed to fetch users:', res.message || res.text);
        return;
    }

    const users = res.json?.users || [];
    console.log(`📊 Found ${users.length} users`);

    let okCount = 0;
    let failCount = 0;

    for (const user of users) {
        if (user.email_confirmed_at) {
            console.log(`✅ User ${user.email} already confirmed`);
            continue;
        }

        console.log(`⏳ Confirming user ${user.email}...`);
        const result = await confirmUser(user);
        if (result.ok) {
            console.log(`   ✅ User ${user.email} confirmed successfully`);
            okCount++;
        } else {
            console.error(`   ❌ Failed to confirm user ${user.email}:`, result.json?.msg || result.text);
            failCount++;
        }
    }

    console.log(`\n🎉 Process complete: ${okCount} confirmed, ${failCount} failed`);
}

main().catch(console.error);
