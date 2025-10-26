import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const SupabaseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Collect debug information
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setDebugInfo({
      environmentUrl: envUrl || 'Not found',
      environmentKey: envKey ? 'Present' : 'Not found',
      supabaseClient: !!supabase,
      supabaseUrl: supabase?.supabaseUrl || 'Not available',
      supabaseKey: supabase?.supabaseKey ? 'Present' : 'Not available',
      timestamp: new Date().toISOString()
    });
  }, []);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Basic connection
      results.test1 = {
        name: 'Basic Connection Test',
        status: 'running'
      };
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      results.test1.status = sessionError ? 'failed' : 'passed';
      results.test1.details = sessionError ? sessionError.message : 'Session check passed';
      
      // Test 2: Database query
      results.test2 = {
        name: 'Database Query Test',
        status: 'running'
      };
      
      const { data, error } = await supabase
        .from('data_biaya')
        .select('id')
        .limit(1);
        
      results.test2.status = error ? 'failed' : 'passed';
      results.test2.details = error ? error.message : 'Database query successful';
      
      // Test 3: Auth test
      results.test3 = {
        name: 'Authentication Test',
        status: 'running'
      };
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      results.test3.status = userError ? 'failed' : 'passed';
      results.test3.details = userError ? userError.message : `User: ${user?.email || 'Not authenticated'}`;
      
    } catch (error: any) {
      results.error = {
        message: error.message,
        stack: error.stack
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Supabase Debug Information</CardTitle>
          <CardDescription>
            Debug information for Supabase configuration and connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Environment Variables:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          
          <Button onClick={runTests} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Connection Tests'}
          </Button>
          
          {Object.keys(testResults).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-2">
                {Object.entries(testResults).map(([key, result]: [string, any]) => (
                  <div key={key} className="p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.status === 'passed' ? 'bg-green-100 text-green-800' :
                        result.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {result.details && (
                      <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseDebug;
