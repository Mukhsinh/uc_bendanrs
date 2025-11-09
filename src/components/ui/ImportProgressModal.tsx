import React from 'react';
import { createPortal } from 'react-dom';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface UploadProgress {
  isVisible: boolean;
  current: number;
  total: number;
  successCount: number;
  errorCount: number;
  missingCount: number;
  status: 'uploading' | 'success' | 'error';
  message: string;
}

interface ImportProgressModalProps {
  progress: UploadProgress;
  onClose?: () => void;
}

export const ImportProgressModal: React.FC<ImportProgressModalProps> = ({ 
  progress, 
  onClose 
}) => {
  const progressPercentage = progress.total > 0 
    ? Math.min(100, Math.max(0, (progress.current / progress.total) * 100))
    : 0;
  
  // Calculate number of segments (20 segments total)
  const totalSegments = 20;
  const filledSegments = Math.floor((progressPercentage / 100) * totalSegments);
  
  // Debug log untuk memastikan progress terlihat
  console.log('[ProgressModal] Rendering:', {
    isVisible: progress.isVisible,
    status: progress.status,
    current: progress.current,
    total: progress.total,
    percentage: progressPercentage,
    message: progress.message
  });

  if (!progress.isVisible) {
    console.log('[ProgressModal] Not visible, returning null');
    return null;
  }

  // Saat uploading, tampilkan progress bar tanpa backdrop yang meredup
  if (progress.status === 'uploading') {
    const progressContent = (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ 
          zIndex: 2147483647, // Maximum z-index value
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          backgroundColor: 'transparent',
          backdropFilter: 'none'
        }}
      >
        <div 
          className="bg-white rounded-lg p-5 shadow-2xl border-2 border-green-500"
          style={{
            width: '400px',
            maxWidth: '90vw',
            position: 'relative',
            zIndex: 2147483647,
            pointerEvents: 'auto',
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '2px solid #22c55e',
            borderRadius: '8px'
          }}
        >
          <div className="text-center">
            {/* Persentase di atas */}
            <div className="mb-3">
              <div 
                className="font-bold"
                style={{ 
                  fontSize: '36px',
                  color: '#111827',
                  lineHeight: '1'
                }}
              >
                {progress.total > 0 ? Math.round(progressPercentage) : 0}%
              </div>
            </div>
            
            {/* Progress bar segmented */}
            <div className="mb-3">
              <div 
                className="flex overflow-hidden"
                style={{
                  width: '100%',
                  height: '32px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #22c55e',
                  borderRadius: '9999px',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                {Array.from({ length: totalSegments }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      flex: '1 1 0%',
                      minWidth: '5%',
                      backgroundColor: index < filledSegments ? '#22c55e' : '#ffffff',
                      borderRight: index < totalSegments - 1 ? '2px solid #16a34a' : 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Status text */}
            <p 
              className="font-medium"
              style={{
                fontSize: '12px',
                color: '#4b5563'
              }}
            >
              {progress.message || `Memproses ${progress.current} dari ${progress.total} data...`}
            </p>
          </div>
        </div>
      </div>
    );

    // Gunakan Portal untuk memastikan modal dirender di document.body
    if (typeof document !== 'undefined') {
      return createPortal(progressContent, document.body);
    }
    return progressContent;
  }

  // Saat selesai (success/error), tampilkan modal dengan backdrop
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
      onClick={onClose}
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div 
        className="bg-white rounded-lg p-8 w-[500px] max-w-[90vw] mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 100000
        }}
      >
        <div className="text-center">
          
          {/* Status saat selesai (success/error) */}
          {(progress.status === 'success' || progress.status === 'error') && (
            <div className="space-y-4">
              <div className="mb-4">
                {progress.status === 'success' && (
                  <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {progress.status === 'error' && (
                  <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-4">{progress.message}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-base">
                  <span className="text-gray-700">Berhasil:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 text-base px-3 py-1">
                    {progress.successCount}
                  </Badge>
                </div>
                {progress.errorCount > 0 && (
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-700">Gagal:</span>
                    <Badge variant="destructive" className="text-base px-3 py-1">
                      {progress.errorCount}
                    </Badge>
                  </div>
                )}
                {progress.missingCount > 0 && (
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-700">Data tidak valid:</span>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {progress.missingCount}
                    </Badge>
                  </div>
                )}
              </div>
              
              {onClose && (
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  className="mt-6"
                >
                  Tutup
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProgressModal;
