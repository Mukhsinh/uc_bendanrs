import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
  if (!progress.isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] mx-4">
        <div className="text-center">
          <div className="mb-4">
            {progress.status === 'uploading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            )}
            {progress.status === 'success' && (
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {progress.status === 'error' && (
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2">{progress.message}</h3>
          
          {progress.status === 'uploading' && (
            <div className="mb-4">
              <Progress value={(progress.current / progress.total) * 100} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">
                {progress.current} dari {progress.total} data
              </p>
            </div>
          )}
          
          {(progress.status === 'success' || progress.status === 'error') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Berhasil:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {progress.successCount}
                </Badge>
              </div>
              {progress.errorCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Gagal:</span>
                  <Badge variant="destructive">
                    {progress.errorCount}
                  </Badge>
                </div>
              )}
              {progress.missingCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Data tidak valid:</span>
                  <Badge variant="secondary">
                    {progress.missingCount}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold">
                <span>Status:</span>
                <Badge variant={progress.status === 'success' ? 'default' : 'destructive'}>
                  {progress.status === 'success' ? 'SUKSES' : 'ERROR'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProgressModal;
