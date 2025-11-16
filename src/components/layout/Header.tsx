"use client";

import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

interface HeaderProps {
  onMenuClick: () => void;
}

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/shop": "Shop Profile",
  "/coupons": "Coupons",
  "/analytics": "Analytics",
  "/transactions": "Transactions",
  "/settings": "Settings",
};

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const pageName = pageNames[pathname] || "Dashboard";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">{pageName}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
