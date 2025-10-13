"use client";

import React from "react";

type SidebarToggleContextType = {
  openSidebar: () => void;
};

export const SidebarToggleContext = React.createContext<SidebarToggleContextType | null>(null);

export const useSidebarToggle = () => {
  const ctx = React.useContext(SidebarToggleContext);
  if (!ctx) {
    throw new Error("useSidebarToggle must be used within SidebarToggleProvider");
  }
  return ctx;
};

export const SidebarToggleProvider = ({ children, onOpen }: { children: React.ReactNode; onOpen: () => void }) => {
  const openSidebar = React.useCallback(() => {
    onOpen();
  }, [onOpen]);

  return (
    <SidebarToggleContext.Provider value={{ openSidebar }}>
      {children}
    </SidebarToggleContext.Provider>
  );
};


