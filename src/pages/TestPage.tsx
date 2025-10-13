import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-teal-700 mb-4">
          Aplikasi Unit Cost RS
        </h1>
        <p className="text-gray-600 mb-6">
          Aplikasi berjalan dengan baik! Server development sudah aktif.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>✅ React berjalan dengan baik</p>
          <p>✅ Tailwind CSS berjalan dengan baik</p>
          <p>✅ Vite development server aktif</p>
        </div>
        <button 
          onClick={() => window.location.href = '/login'}
          className="mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Lanjut ke Login
        </button>
      </div>
    </div>
  );
};

export default TestPage;
