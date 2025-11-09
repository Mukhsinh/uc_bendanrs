import { useState, useCallback } from 'react';
import { UploadProgress } from '@/components/ui/ImportProgressModal';

export const useUploadProgress = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isVisible: false,
    current: 0,
    total: 0,
    successCount: 0,
    errorCount: 0,
    missingCount: 0,
    status: 'uploading',
    message: ''
  });

  const startUpload = useCallback((total: number, message: string = 'Sedang mengimpor data...') => {
    console.log('startUpload called with:', { total, message });
    const newProgress = {
      isVisible: true,
      current: 0,
      total,
      successCount: 0,
      errorCount: 0,
      missingCount: 0,
      status: 'uploading' as const,
      message
    };
    console.log('Setting progress state to:', newProgress);
    setUploadProgress(newProgress);
    console.log('Progress state set to visible');
  }, []);

  const updateProgress = useCallback((current: number, successCount: number, errorCount: number, message?: string) => {
    setUploadProgress(prev => ({
      ...prev,
      current,
      successCount,
      errorCount,
      message: message || prev.message
    }));
  }, []);

  const completeUpload = useCallback((successCount: number, errorCount: number, missingCount: number = 0) => {
    const status = errorCount === 0 ? 'success' : 'error';
    const message = errorCount === 0 ? 'Impor berhasil!' : 'Impor selesai dengan beberapa error';
    
    setUploadProgress(prev => ({
      ...prev,
      status,
      message,
      successCount,
      errorCount,
      missingCount
    }));

    // Auto-hide after 5 seconds (lebih lama agar user bisa melihat hasil)
    setTimeout(() => {
      setUploadProgress(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  }, []);

  const showError = useCallback((message: string = 'Gagal memproses file') => {
    setUploadProgress(prev => ({
      ...prev,
      isVisible: true, // Pastikan modal tetap visible
      status: 'error',
      message,
      current: prev.total || 0, // Set current ke total jika ada
      errorCount: prev.total || 1 // Set error count
    }));

    // Auto-hide setelah 5 detik (lebih lama dari sebelumnya)
    setTimeout(() => {
      setUploadProgress(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  }, []);

  const hideProgress = useCallback(() => {
    setUploadProgress(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    uploadProgress,
    startUpload,
    updateProgress,
    completeUpload,
    showError,
    hideProgress
  };
};
