import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { testSupabaseConnection, testAuthStatus } from '@/test-supabase';

const TestSupabase: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      setLoading(true);
      
      const results = await testSupabaseConnection();
      const authResults = await testAuthStatus();
      
      setTestResults({
        connection: results,
        auth: authResults
      });
      
      setLoading(false);
    };

    runTests();
  }, []);

  const handleLogin = async () => {
    try {
      // Create a test user or use existing credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
      } else {
        console.log('Login success:', data);
        alert('Login successful! Refresh the page.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error: ' + error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
      } else {
        console.log('Logout success');
        alert('Logout successful! Refresh the page.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout error: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection</h1>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Running tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test Login
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Test Logout
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Connection Test Results</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResults?.connection, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth Test Results</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResults?.auth, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check the console (F12) for detailed logs</li>
          <li>If connection fails, check environment variables</li>
          <li>If auth fails, try creating a user account first</li>
          <li>After successful login, navigate to /data-master/biaya</li>
        </ol>
      </div>
    </div>
  );
};

export default TestSupabase;
