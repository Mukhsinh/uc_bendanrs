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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden bg-sidebar md:block will-change-transform">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
              <div className="flex items-center gap-2">
                {brandingSettings.logo_url && (
                  <img
                    src={brandingSettings.logo_url}
                    alt={brandingSettings.logo_alt_text}
                    className="h-8 w-8 object-contain"
                  />
                )}
                <span className="text-2xl font-bold">{brandingSettings.app_title}</span>
              </div>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <SidebarNav onLinkClick={handleLinkClick} />
            </nav>
          </div>
          <div className="p-4">
            <Button
              variant="outline" 
              className="w-full justify-start bg-teal-600 text-white border-teal-600 hover:bg-teal-500 hover:text-white"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 transition-colors will-change-transform">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-sidebar px-4 lg:h-[60px] lg:px-6 md:hidden will-change-transform">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-sidebar">
              <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground">
                <div className="flex items-center gap-2">
                  {brandingSettings.logo_url && (
                    <img
                      src={brandingSettings.logo_url}
                      alt={brandingSettings.logo_alt_text}
                      className="h-7 w-7 object-contain"
                    />
                  )}
                  <span className="font-bold text-xl">{brandingSettings.app_title}</span>
                </div>
              </Link>
              <nav className="grid gap-2 text-lg font-medium mt-4">
                <SidebarNav isMobile onLinkClick={handleLinkClick} />
              </nav>
              <div className="mt-auto pt-4">
                <Button
                  variant="outline" 
                  className="w-full justify-start bg-teal-600 text-white border-teal-600 hover:bg-teal-500 hover:text-white"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground">
            <span className="font-bold">PINTAR UC</span>
          </Link>
          <Button
            variant="ghost" 
            size="icon"
            className="ml-auto text-white hover:bg-white/20"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Header dengan nama user */}
        <header className="hidden md:flex h-14 items-center justify-between border-b bg-sidebar px-6 shadow-sm will-change-transform">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSheetOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-auto px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg border border-teal-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-teal-100/80">
                        {user?.email?.split('@')[1] || ''}
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-teal-600 to-teal-700">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-teal-900">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-teal-600">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <SidebarToggleProvider onOpen={() => setIsSheetOpen(true)}>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-transparent">
            <Suspense fallback={<div className="flex flex-1 items-center justify-center text-teal-800"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div><span>Memuat konten...</span></div>}>
              {children || <Outlet />}
            </Suspense>
          </main>
        </SidebarToggleProvider>
      </div>
    </div>
  );
};

export default Layout;