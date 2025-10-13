"use client";

import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/SidebarNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarToggleProvider } from "@/components/SidebarToggleContext";
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
  const [user, setUser] = React.useState<any>(null);
  const navigate = useNavigate();

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
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
      <div className="hidden border-r bg-sidebar md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
              <span className="text-lg font-bold">Aplikasi Unit Cost RS</span>
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
              className="w-full justify-start bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <div className="mt-3 text-center">
              <p className="text-xs text-white/60">
                Copyright © 2024 Mukhsin Hadi.<br />Hak Cipta Dilindungi Undang-Undang
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-sidebar px-4 lg:h-[60px] lg:px-6 md:hidden">
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
                <span className="font-bold">Aplikasi Unit Cost RS</span>
              </Link>
              <nav className="grid gap-2 text-lg font-medium mt-4">
                <SidebarNav isMobile onLinkClick={handleLinkClick} />
              </nav>
              <div className="mt-auto pt-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <div className="mt-3 text-center">
                  <p className="text-xs text-white/60">
                    Copyright © 2024 Mukhsin Hadi.<br />Hak Cipta Dilindungi Undang-Undang
                  </p>
                </div>
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
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Header dengan nama user */}
        <header className="hidden md:flex h-14 items-center justify-between border-b bg-sidebar px-6 shadow-sm">
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
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children || <Outlet />}
          </main>
        </SidebarToggleProvider>
      </div>
    </div>
  );
};

export default Layout;