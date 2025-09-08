"use client";

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Database,
  Briefcase,
  Package,
  Activity,
  Wallet,
  Landmark,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ElementType;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Data Master",
    icon: Database,
    subItems: [
      { title: "Data Unit Kerja", href: "/data-master/unit-kerja", icon: Briefcase },
      { title: "Data Barang", href: "/data-master/barang", icon: Package },
      { title: "Data Kegiatan", href: "/data-master/kegiatan", icon: Activity },
      { title: "Data Pendapatan", href: "/data-master/pendapatan", icon: Wallet },
      { title: "Data Biaya", href: "/data-master/biaya", icon: Landmark },
    ],
  },
];

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function SidebarNav({ isMobile = false, onLinkClick, className, ...props }: SidebarNavProps) {
  const location = useLocation();

  const renderLink = (item: NavItem) => (
    <NavLink
      key={item.title}
      to={item.href || "#"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary",
          isMobile && "text-base",
        )
      }
      onClick={onLinkClick}
    >
      {item.icon && <item.icon className="h-4 w-4" />}
      {item.title}
    </NavLink>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {navItems.map((item) => (
        item.subItems ? (
          <Accordion type="single" collapsible key={item.title} defaultValue={location.pathname.startsWith(item.href || "/data-master") ? item.title : undefined}>
            <AccordionItem value={item.title} className="border-none">
              <AccordionTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary [&[data-state=open]>svg]:rotate-180">
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="pl-6 pt-2 pb-0">
                <div className="flex flex-col gap-1">
                  {item.subItems.map((subItem) => renderLink(subItem))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          renderLink(item)
        )
      ))}
    </div>
  );
}