import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0fdfa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#0d9488',
          marginBottom: '1rem'
        }}>
          🎉 Aplikasi Unit Cost RS
        </h1>
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '1.5rem',
          fontSize: '1.1rem'
        }}>
          Aplikasi berjalan dengan baik! Server development sudah aktif.
        </p>
        <div style={{ 
          textAlign: 'left',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderRadius: '0.375rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#059669', margin: '0.5rem 0' }}>✅ React berjalan dengan baik</p>
          <p style={{ color: '#059669', margin: '0.5rem 0' }}>✅ Vite development server aktif</p>
          <p style={{ color: '#059669', margin: '0.5rem 0' }}>✅ TypeScript berjalan dengan baik</p>
          <p style={{ color: '#059669', margin: '0.5rem 0' }}>✅ Server berjalan di port 8080</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Lanjut ke Login
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;
