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
    setUploadProgress({
      isVisible: true,
      current: 0,
      total,
      successCount: 0,
      errorCount: 0,
      missingCount: 0,
      status: 'uploading',
      message
    });
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

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setUploadProgress(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  const showError = useCallback((message: string = 'Gagal memproses file') => {
    setUploadProgress(prev => ({
      ...prev,
      status: 'error',
      message
    }));

    setTimeout(() => {
      setUploadProgress(prev => ({ ...prev, isVisible: false }));
    }, 3000);
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
