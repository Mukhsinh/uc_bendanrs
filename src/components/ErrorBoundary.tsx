import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  /** Child components yang akan di-wrap dengan error boundary */
  children: ReactNode;
  /** Custom fallback UI jika terjadi error (optional) */
  fallback?: ReactNode;
  /** Callback function yang dipanggil saat error terjadi (optional) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  /** Flag untuk menandakan apakah ada error */
  hasError: boolean;
  /** Error object yang tertangkap */
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * 
 * React Error Boundary untuk menangkap JavaScript errors di component tree,
 * log errors, dan menampilkan fallback UI yang user-friendly.
 * 
 * Fitur:
 * - Menangkap errors dari child components
 * - Menampilkan fallback UI dengan error message
 * - Menyediakan tombol "Coba Lagi" dan "Muat Ulang Halaman"
 * - Optional custom fallback UI
 * - Optional error callback untuk logging
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 * 
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error ke console untuk debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Terjadi Kesalahan</CardTitle>
              </div>
              <CardDescription>
                Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba Lagi
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Muat Ulang Halaman
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Jika masalah berlanjut, silakan hubungi administrator sistem.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
