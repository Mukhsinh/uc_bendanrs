"use client";

import React, { Suspense } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/SidebarNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { SidebarToggleProvider } from "@/components/SidebarToggleContext";
import { useBrandingSettings } from "@/hooks/useBrandingSettings";
import { useAuth } from "@/contexts/AuthContext";


interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const navigate = useNavigate();
  const { settings: brandingSettings } = useBrandingSettings();
  const { user, signOut, loading } = useAuth();

  const handleLinkClick = () => {
    if (isMobile) {
      // Pastikan menu mobile tertutup dengan satu klik
      setTimeout(() => {
        setIsSheetOpen(false);
      }, 100); // Small delay to ensure click is processed
    }
  };

  const handleLogout = async () => {
    const error = await signOut();
    if (error) {
      toast.error("Gagal logout: " + error.message);
    } else {
      navigate("/login");
      toast.success("Berhasil logout");
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block will-change-transform">
        <div className="sticky top-0 h-screen flex flex-col bg-white border-r border-slate-200 shadow-sm">
          {/* Logo Area */}
          <div className="flex h-[64px] items-center px-5 border-b border-slate-100 flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              {brandingSettings.logo_url ? (
                <img
                  src={brandingSettings.logo_url}
                  alt={brandingSettings.logo_alt_text}
                  className="h-9 w-9 object-contain rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-sm">UC</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="text-slate-800 font-bold text-base leading-tight truncate">
                  {brandingSettings.app_title || "PINTAR UC"}
                </div>
                {brandingSettings.subtitle && (
                  <div className="text-slate-400 text-xs truncate">{brandingSettings.subtitle}</div>
                )}
              </div>
            </Link>
          </div>

          {/* Nav Menu */}
          <div className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <SidebarNav onLinkClick={handleLinkClick} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 transition-colors will-change-transform">

        {/* Mobile Header */}
        <header
          className="flex h-14 items-center gap-4 border-b px-4 md:hidden will-change-transform"
          style={{ background: "linear-gradient(90deg, #0f2d5c 0%, #0d3d4a 100%)" }}
        >
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 border-0 w-[260px] bg-white"
            >
              <div className="flex h-[64px] items-center px-5 border-b border-slate-100 flex-shrink-0">
                <Link to="/" className="flex items-center gap-3" onClick={handleLinkClick}>
                  {brandingSettings.logo_url ? (
                    <img src={brandingSettings.logo_url} alt={brandingSettings.logo_alt_text} className="h-8 w-8 object-contain rounded-lg" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-xs">UC</span>
                    </div>
                  )}
                  <span className="text-slate-800 font-bold text-base">{brandingSettings.app_title || "PINTAR UC"}</span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto py-3 px-2">
                <SidebarNav isMobile onLinkClick={handleLinkClick} />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-white font-bold text-base">{brandingSettings.app_title || "PINTAR UC"}</span>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleLogout} disabled={loading}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Desktop Topbar */}
        <header className="hidden md:flex h-14 items-center justify-between border-b bg-white px-6 shadow-sm will-change-transform">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">
              {brandingSettings.app_title || "PINTAR UC"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Username badge */}
            <div className="flex items-center gap-0 rounded-lg overflow-hidden shadow-sm border border-blue-200">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600">
                <User className="h-3.5 w-3.5 text-white" />
                <span className="text-sm font-medium text-white">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              {/* Logout icon */}
              <button
                onClick={handleLogout}
                disabled={loading}
                title="Keluar Sistem"
                className="flex items-center justify-center px-2.5 py-1.5 bg-white hover:bg-red-50 transition-colors border-l border-blue-200 group"
              >
                <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <SidebarToggleProvider onOpen={() => setIsSheetOpen(true)}>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-transparent overflow-hidden">
            <Suspense fallback={
              <div className="flex flex-1 items-center justify-center text-blue-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>Memuat konten...</span>
              </div>
            }>
              {children || <Outlet />}
            </Suspense>
          </main>
        </SidebarToggleProvider>
      </div>
    </div>
  );
};

export default Layout;