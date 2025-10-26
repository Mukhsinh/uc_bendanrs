// Test file untuk debugging Supabase connection
import { supabase } from '@/integrations/supabase/client';

export const testSupabaseConnection = async () => {
  console.log('=== TESTING SUPABASE CONNECTION ===');
  
  try {
    // Test 1: Check if Supabase client is initialized
    console.log('1. Supabase client:', supabase);
    console.log('2. Supabase client initialized:', !!supabase);
    console.log('3. Supabase client type:', typeof supabase);
    
    // Test 2: Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('4. Session check result:');
    console.log('   - Session:', session);
    console.log('   - Session error:', sessionError);
    console.log('   - User ID:', session?.user?.id);
    console.log('   - User email:', session?.user?.email);
    
    // Test 3: Try to fetch data_biaya table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('data_biaya')
      .select('id, tahun, user_id')
      .limit(1);
    
    console.log('5. Data biaya table test:');
    console.log('   - Table data:', tableInfo);
    console.log('   - Table error:', tableError);
    
    // Test 4: Check get_data_biaya_for_user RPC function
    let rpcTestResult = null;
    let rpcError = null;
    
    if (session?.user?.id) {
      const { data: rpcData, error: rpcTestError } = await supabase
        .rpc('get_data_biaya_for_user', { input_user_id: session.user.id });
      
      rpcTestResult = rpcData;
      rpcError = rpcTestError;
    }
    
    console.log('6. RPC get_data_biaya_for_user test:');
    console.log('   - RPC data count:', Array.isArray(rpcTestResult) ? rpcTestResult.length : 0);
    console.log('   - RPC error:', rpcError);
    console.log('   - User authenticated:', !!session?.user?.id);
    
    console.log('=== END TEST ===');
    
    return {
      success: true,
      session,
      tableInfo,
      rpcTestResult,
      rpcError
    };
    
  } catch (error) {
    console.error('=== SUPABASE TEST ERROR ===');
    console.error('Error:', error);
    console.log('=== END ERROR ===');
    
    return {
      success: false,
      error: error
    };
  }
};

// Test function untuk check auth status
export const testAuthStatus = async () => {
  console.log('=== TESTING AUTH STATUS ===');
  
  try {
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('User error:', userError);
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', sessionError);
    
    // Check auth state
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
    });
    
    return {
      user,
      session,
      userError,
      sessionError
    };
    
  } catch (error) {
    console.error('Auth test error:', error);
    return { error };
  }
};
