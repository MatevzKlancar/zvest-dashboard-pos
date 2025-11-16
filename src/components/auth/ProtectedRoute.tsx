"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "shop_owner" | "customer")[];
  adminOnly?: boolean;
  shopOwnerOnly?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  adminOnly = false,
  shopOwnerOnly = false,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isShopOwner } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Admin only access
      if (adminOnly && !isAdmin) {
        router.push("/dashboard");
        return;
      }

      // Shop owner only access
      if (shopOwnerOnly && !isShopOwner) {
        if (isAdmin) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      // Role-based access control
      if (allowedRoles && !allowedRoles.includes(user.user_type!)) {
        // Redirect based on user type
        if (isAdmin) {
          router.push("/admin");
        } else if (isShopOwner) {
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    }
  }, [
    user,
    loading,
    adminOnly,
    shopOwnerOnly,
    allowedRoles,
    isAdmin,
    isShopOwner,
    router,
    redirectTo,
  ]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) return null;

  // Don't render if access denied (will redirect)
  if (adminOnly && !isAdmin) return null;
  if (shopOwnerOnly && !isShopOwner) return null;
  if (allowedRoles && !allowedRoles.includes(user.user_type!)) return null;

  return <>{children}</>;
}
