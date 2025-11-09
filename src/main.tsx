import { createRoot } from "react-dom/client";
import React, { Component, ReactNode } from "react";
import App from "./App.tsx";
import "./globals.css";

class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Minimal console log to aid production debugging without external tooling
    // eslint-disable-next-line no-console
    console.error("RootErrorBoundary caught: ", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-6">
          <div className="bg-white rounded-lg shadow p-6 max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-red-700 mb-2">Terjadi kesalahan saat memuat aplikasi</h1>
            <p className="text-sm text-gray-600 mb-4">{this.state.message}</p>
            <div className="space-y-2">
              <a href="/debug" className="block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Buka Halaman Debug</a>
              <a href="/login" className="block px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">Buka Halaman Login</a>
              <button onClick={() => location.reload()} className="block w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Muat Ulang</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element with id 'root' not found");
}

createRoot(container).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
