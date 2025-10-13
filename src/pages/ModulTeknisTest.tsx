import React from 'react';

const ModulTeknisTest = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-2xl">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">
          🎉 Modul Teknis Test Page
        </h1>
        <p className="text-gray-600 mb-6">
          Halaman test untuk memastikan routing Modul Teknis berjalan dengan baik!
        </p>
        <div className="space-y-2 text-sm text-gray-500 mb-6">
          <p>✅ Routing berjalan dengan baik</p>
          <p>✅ React component ter-render</p>
          <p>✅ Tailwind CSS berfungsi</p>
          <p>✅ Server development aktif</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => window.location.href = '/modul-teknis'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buka Modul Teknis
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModulTeknisTest;
