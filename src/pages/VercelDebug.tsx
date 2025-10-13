import React from 'react';

const VercelDebug = () => {
  const checkEnvironment = () => {
    const env = {
      mode: import.meta.env.MODE,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      baseUrl: import.meta.env.BASE_URL,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
    };

    return env;
  };

  const env = checkEnvironment();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-red-700 mb-6">🔧 Vercel Debug Page</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-bold text-lg mb-2">Environment Variables</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Mode:</strong> {env.mode}</p>
              <p><strong>Base URL:</strong> {env.baseUrl}</p>
              <p><strong>Dev:</strong> {env.dev ? 'Yes' : 'No'}</p>
              <p><strong>Prod:</strong> {env.prod ? 'Yes' : 'No'}</p>
              <p><strong>Supabase URL:</strong> {env.supabaseUrl ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Supabase Key:</strong> {env.supabaseKey ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="font-bold text-lg mb-2">Browser Information</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Current URL:</strong> {window.location.href}</p>
              <p><strong>Protocol:</strong> {window.location.protocol}</p>
              <p><strong>Host:</strong> {window.location.host}</p>
              <p><strong>Pathname:</strong> {window.location.pathname}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h2 className="font-bold text-lg mb-2">Quick Tests</h2>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.href = '/health'}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test Health Check
              </button>
              <button 
                onClick={() => window.location.href = '/test-supabase'}
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Test Supabase Connection
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Login
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h2 className="font-bold text-lg mb-2">Troubleshooting</h2>
            <div className="text-sm space-y-1">
              <p>• Jika Supabase variables missing, cek Vercel environment variables</p>
              <p>• Jika halaman blank, cek browser console (F12)</p>
              <p>• Jika routing tidak bekerja, cek vercel.json configuration</p>
              <p>• Jika build gagal, cek Vercel build logs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VercelDebug;
