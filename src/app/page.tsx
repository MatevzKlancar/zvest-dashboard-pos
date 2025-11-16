"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // No user - redirect to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // User exists - redirect based on type
    switch (user.user_type) {
      case "admin":
        router.replace("/admin");
        break;
      case "shop_owner":
        router.replace("/dashboard");
        break;
      case "app_user":
        router.replace("/dashboard");
        break;
      default:
        router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-lg font-medium">Loading...</p>
    </div>
  );
}
