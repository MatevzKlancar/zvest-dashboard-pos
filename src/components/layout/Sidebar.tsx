"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Store,
  TestTube,
  Ticket,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";

const getNavigationItems = (userType?: string) => {
  const adminNavItems = [
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Create Customer",
      href: "/admin/onboard",
      icon: Store,
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: Receipt,
    },
    {
      name: "POS Testing",
      href: "/admin/pos-testing",
      icon: TestTube,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const shopOwnerNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Shop Profile",
      href: "/shop",
      icon: Store,
    },
    {
      name: "Coupons",
      href: "/coupons",
      icon: Ticket,
    },
    {
      name: "Products",
      href: "/products",
      icon: Package,
    },
    {
      name: "Customers",
      href: "/customers",
      icon: Users,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: Receipt,
    },
  ];

  const customerNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Rewards",
      href: "/rewards",
      icon: Ticket,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: Settings,
    },
  ];

  switch (userType) {
    case "admin":
      return adminNavItems;
    case "shop_owner":
      return shopOwnerNavItems;
    case "customer":
      return customerNavItems;
    default:
      return shopOwnerNavItems; // fallback
  }
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isShopOwner } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const navigation = getNavigationItems(user?.user_type);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="ml-2 text-xl font-semibold text-gray-900">
            Shop Dashboard
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto"
            >
              <div className="flex items-center">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-sm">
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.email?.split("@")[0] || "User"}
                    </p>
                    {isAdmin && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        Admin
                      </span>
                    )}
                    {isShopOwner && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        Shop Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                  {user?.shop_name && (
                    <p className="text-xs text-gray-400 truncate">
                      {user.shop_name}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signingOut}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {signingOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
