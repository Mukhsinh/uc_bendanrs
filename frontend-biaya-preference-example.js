// Contoh implementasi frontend untuk sistem pilihan biaya tahunan
// File: components/BiayaPreferenceSelector.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BiayaPreferenceSelector = ({ userId }) => {
  const [currentPreference, setCurrentPreference] = useState('total_biaya');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load current preference saat component mount
  useEffect(() => {
    loadCurrentPreference();
  }, [userId]);

  const loadCurrentPreference = async () => {
    try {
      const { data, error } = await supabase.rpc('get_biaya_preference', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data.success) {
        setCurrentPreference(data.current_preference);
      }
    } catch (error) {
      console.error('Error loading preference:', error);
      setMessage('Error loading current preference');
    }
  };

  const handleBiayaTypeChange = async (biayaType) => {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.rpc('set_biaya_preference_and_update', {
        p_user_id: userId,
        p_biaya_type: biayaType
      });

      if (error) throw error;

      if (data.success) {
        setCurrentPreference(biayaType);
        setMessage(`Biaya tahunan berhasil diupdate menggunakan ${biayaType}. ${data.updated_rows} baris diupdate.`);
        
        // Optional: Refresh data atau trigger re-render
        if (window.refreshDistribusiBiaya) {
          window.refreshDistribusiBiaya();
        }
      } else {
        setMessage(data.message || 'Error updating biaya preference');
      }
    } catch (error) {
      console.error('Error updating biaya preference:', error);
      setMessage('Error updating biaya preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="biaya-preference-selector">
      <h3>Pilihan Jenis Biaya Tahunan</h3>
      
      <div className="preference-buttons">
        <button
          className={`preference-btn ${currentPreference === 'total_biaya' ? 'active' : ''}`}
          onClick={() => handleBiayaTypeChange('total_biaya')}
          disabled={loading}
        >
          {loading && currentPreference === 'total_biaya' ? 'Updating...' : 'Total Biaya'}
        </button>
        
        <button
          className={`preference-btn ${currentPreference === 'total_biaya_tanpa_jp' ? 'active' : ''}`}
          onClick={() => handleBiayaTypeChange('total_biaya_tanpa_jp')}
          disabled={loading}
        >
          {loading && currentPreference === 'total_biaya_tanpa_jp' ? 'Updating...' : 'Total Biaya Tanpa JP'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="preference-info">
        <p><strong>Pilihan Saat Ini:</strong> {currentPreference === 'total_biaya' ? 'Total Biaya' : 'Total Biaya Tanpa JP'}</p>
        <p><em>Pilihan ini akan mempengaruhi nilai biaya tahunan di tabel distribusi biaya pertama.</em></p>
      </div>

      <style jsx>{`
        .biaya-preference-selector {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 20px 0;
        }

        .preference-buttons {
          display: flex;
          gap: 10px;
          margin: 15px 0;
        }

        .preference-btn {
          padding: 10px 20px;
          border: 2px solid #007bff;
          background: white;
          color: #007bff;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .preference-btn:hover {
          background: #007bff;
          color: white;
        }

        .preference-btn.active {
          background: #007bff;
          color: white;
        }

        .preference-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .preference-info {
          margin-top: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};

export default BiayaPreferenceSelector;

// Contoh penggunaan di halaman manajemen data biaya
// File: pages/DataBiayaManagement.jsx

import React from 'react';
import BiayaPreferenceSelector from '../components/BiayaPreferenceSelector';
import { useAuth } from '../hooks/useAuth';

const DataBiayaManagement = () => {
  const { user } = useAuth();

  return (
    <div className="data-biaya-management">
      <h1>Manajemen Data Biaya</h1>
      
      {/* Pilihan jenis biaya tahunan */}
      <BiayaPreferenceSelector userId={user?.id} />
      
      {/* Konten lainnya untuk manajemen data biaya */}
      <div className="biaya-content">
        {/* Form input data biaya, tabel, dll */}
      </div>
    </div>
  );
};

export default DataBiayaManagement;

// Hook untuk mengelola state biaya preference
// File: hooks/useBiayaPreference.js

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useBiayaPreference = (userId) => {
  const [preference, setPreference] = useState('total_biaya');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadPreference();
    }
  }, [userId]);

  const loadPreference = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_biaya_preference', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data.success) {
        setPreference(data.current_preference);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (newPreference) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('set_biaya_preference_and_update', {
        p_user_id: userId,
        p_biaya_type: newPreference
      });

      if (error) throw error;

      if (data.success) {
        setPreference(newPreference);
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    preference,
    loading,
    error,
    updatePreference,
    loadPreference
  };
};

// Contoh penggunaan hook
// File: components/QuickBiayaToggle.jsx

import React from 'react';
import { useBiayaPreference } from '../hooks/useBiayaPreference';

const QuickBiayaToggle = ({ userId }) => {
  const { preference, loading, error, updatePreference } = useBiayaPreference(userId);

  const handleToggle = async () => {
    const newPreference = preference === 'total_biaya' ? 'total_biaya_tanpa_jp' : 'total_biaya';
    
    try {
      await updatePreference(newPreference);
      // Optional: Show success message
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="quick-toggle">
      <button 
        onClick={handleToggle}
        disabled={loading}
        className={`toggle-btn ${preference === 'total_biaya_tanpa_jp' ? 'active' : ''}`}
      >
        {loading ? 'Switching...' : 
         preference === 'total_biaya' ? 'Switch to Tanpa JP' : 'Switch to Total Biaya'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default QuickBiayaToggle;
