// Contoh implementasi backend API untuk sistem pilihan biaya tahunan
// File: pages/api/biaya-preference.js

import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Set biaya preference dan update distribusi biaya
    try {
      const { user_id, biaya_type } = req.body;

      // Validasi input
      if (!user_id || !biaya_type) {
        return res.status(400).json({
          success: false,
          message: 'user_id dan biaya_type diperlukan'
        });
      }

      if (!['total_biaya', 'total_biaya_tanpa_jp'].includes(biaya_type)) {
        return res.status(400).json({
          success: false,
          message: 'biaya_type harus berupa "total_biaya" atau "total_biaya_tanpa_jp"'
        });
      }

      // Panggil fungsi database
      const { data, error } = await supabase.rpc('set_biaya_preference_and_update', {
        p_user_id: user_id,
        p_biaya_type: biaya_type
      });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          message: 'Database error: ' + error.message
        });
      }

      return res.status(200).json(data);

    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error: ' + error.message
      });
    }

  } else if (req.method === 'GET') {
    // Get current biaya preference
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id diperlukan'
        });
      }

      // Panggil fungsi database
      const { data, error } = await supabase.rpc('get_biaya_preference', {
        p_user_id: user_id
      });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          message: 'Database error: ' + error.message
        });
      }

      return res.status(200).json(data);

    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error: ' + error.message
      });
    }

  } else {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}

// Contoh implementasi dengan Next.js API Routes
// File: pages/api/biaya-preference/[action].js

import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { action } = req.query;

  switch (action) {
    case 'set':
      return handleSetPreference(req, res);
    case 'get':
      return handleGetPreference(req, res);
    case 'update':
      return handleUpdateBiaya(req, res);
    default:
      return res.status(404).json({
        success: false,
        message: 'Action not found'
      });
  }
}

async function handleSetPreference(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { user_id, biaya_type } = req.body;

    const { data, error } = await supabase.rpc('set_biaya_preference_and_update', {
      p_user_id: user_id,
      p_biaya_type: biaya_type
    });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function handleGetPreference(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { user_id } = req.query;

    const { data, error } = await supabase.rpc('get_biaya_preference', {
      p_user_id: user_id
    });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function handleUpdateBiaya(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { biaya_type } = req.body;

    const { data, error } = await supabase.rpc('update_distribusi_biaya_pertama_biaya_tahunan', {
      biaya_type: biaya_type
    });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Contoh implementasi dengan Express.js
// File: routes/biaya-preference.js

const express = require('express');
const { supabase } = require('../lib/supabase');
const router = express.Router();

// Middleware untuk validasi user
const validateUser = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.body.user_id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User ID diperlukan'
    });
  }
  
  req.userId = userId;
  next();
};

// POST /api/biaya-preference
router.post('/', validateUser, async (req, res) => {
  try {
    const { biaya_type } = req.body;
    const userId = req.userId;

    const { data, error } = await supabase.rpc('set_biaya_preference_and_update', {
      p_user_id: userId,
      p_biaya_type: biaya_type
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/biaya-preference
router.get('/', validateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase.rpc('get_biaya_preference', {
      p_user_id: userId
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/biaya-preference/update
router.post('/update', async (req, res) => {
  try {
    const { biaya_type } = req.body;

    const { data, error } = await supabase.rpc('update_distribusi_biaya_pertama_biaya_tahunan', {
      biaya_type: biaya_type
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

// Contoh implementasi dengan Supabase Edge Functions
// File: supabase/functions/biaya-preference/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (method === 'POST' && action === 'set') {
      const { user_id, biaya_type } = await req.json()

      const { data, error } = await supabaseClient.rpc('set_biaya_preference_and_update', {
        p_user_id: user_id,
        p_biaya_type: biaya_type
      })

      if (error) throw error

      return new Response(
        JSON.stringify(data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    if (method === 'GET' && action === 'get') {
      const user_id = url.searchParams.get('user_id')

      const { data, error } = await supabaseClient.rpc('get_biaya_preference', {
        p_user_id: user_id
      })

      if (error) throw error

      return new Response(
        JSON.stringify(data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Contoh testing dengan Jest
// File: __tests__/biaya-preference.test.js

const request = require('supertest');
const app = require('../app'); // Your Express app

describe('Biaya Preference API', () => {
  const testUserId = 'test-user-id';
  const testBiayaType = 'total_biaya';

  test('POST /api/biaya-preference should set preference and update biaya', async () => {
    const response = await request(app)
      .post('/api/biaya-preference')
      .send({
        user_id: testUserId,
        biaya_type: testBiayaType
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.biaya_type).toBe(testBiayaType);
    expect(response.body.updated_rows).toBeGreaterThan(0);
  });

  test('GET /api/biaya-preference should return current preference', async () => {
    const response = await request(app)
      .get(`/api/biaya-preference?user_id=${testUserId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.current_preference).toBeDefined();
  });

  test('POST /api/biaya-preference should validate biaya_type', async () => {
    const response = await request(app)
      .post('/api/biaya-preference')
      .send({
        user_id: testUserId,
        biaya_type: 'invalid_type'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('biaya_type');
  });
});
