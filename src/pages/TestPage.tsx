import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-teal-700 mb-4">
          🎉 Aplikasi Unit Cost RS
        </h1>
        <p className="text-gray-600 mb-6">
          Aplikasi berhasil di-deploy di Vercel!
        </p>
        <div className="space-y-2 text-sm text-gray-500 mb-6">
          <p>✅ React berjalan dengan baik</p>
          <p>✅ Tailwind CSS berjalan dengan baik</p>
          <p>✅ Vercel deployment berhasil</p>
          <p>✅ Build process selesai</p>
          <p>🌐 Environment: {import.meta.env.MODE}</p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Lanjut ke Login
          </button>
          
          <div className="text-xs text-gray-400">
            <p>Environment Variables Status:</p>
            <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p>Current URL: {window.location.href}</p>
            <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
