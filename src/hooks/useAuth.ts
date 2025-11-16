"use client";

import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface AuthUser extends User {
  user_type?: "admin" | "shop_owner" | "app_user";
  role?: "super_admin" | "platform_admin" | "shop_owner";
  shop_id?: string;
  shop_name?: string;
  first_name?: string;
  last_name?: string;
  permissions?: string[];
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const USER_CACHE_KEY = "auth_user_basic";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 5000)
        );

        const sessionPromise = supabase.auth.getSession();

        const {
          data: { session },
        } = await Promise.race([sessionPromise, timeoutPromise]).catch((error) => {
          console.error("Auth timeout or error:", error);
          return { data: { session: null } };
        });

        if (!mounted) return;

        if (session?.user) {
          const userData = createUserFromSession(session.user);
          setState({ user: userData, loading: false, error: null });
        } else {
          setState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Auth initialization error:", error);
        setState({
          user: null,
          loading: false,
          error: "Authentication failed",
        });
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        localStorage.removeItem(USER_CACHE_KEY);
        setState({ user: null, loading: false, error: null });
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        const userData = createUserFromSession(session.user);
        setState({ user: userData, loading: false, error: null });
        return;
      }

      // For token refresh, don't change state if we already have a user
      if (event === "TOKEN_REFRESHED" && state.user) {
        return;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const createUserFromSession = (authUser: User): AuthUser => {
    // TEMPORARILY CLEAR CACHE - there might be stale data
    localStorage.removeItem(USER_CACHE_KEY);

    // Extract basic info from metadata
    const metadata = authUser.user_metadata || {};
    const appMetadata = authUser.app_metadata || {};

    // DEBUG: Re-enable to see what's happening
    console.log("🔧 FIXED DEBUG - User Email:", authUser.email);
    console.log("🔧 FIXED DEBUG - User Metadata:", metadata);
    console.log("🔧 FIXED DEBUG - metadata.role:", metadata.role);
    console.log("🔧 FIXED DEBUG - metadata.user_type:", metadata.user_type);

    // Determine user type - Start with fallback
    let user_type: "admin" | "shop_owner" | "app_user" = "app_user";
    let role: "super_admin" | "platform_admin" | "shop_owner" = "shop_owner";

    // Check admin first - we'll use an async check later, but for now use a sync approach
    // For immediate admin detection, we'll check common admin patterns and then verify with API
    const isLikelyAdmin =
      authUser.email?.includes("@admin.") ||
      metadata.user_type === "admin" ||
      metadata.role === "super_admin" ||
      metadata.role === "platform_admin";

    if (isLikelyAdmin) {
      user_type = "admin";
      role =
        (metadata.role as "super_admin" | "platform_admin") || "platform_admin";
      console.log("🔧 FIXED DEBUG - Detected as ADMIN via metadata");
    } else if (
      metadata.user_type === "shop_owner" ||
      metadata.role === "shop_owner" ||
      metadata.setup_token ||
      metadata.shop_name ||
      metadata.business_name
    ) {
      user_type = "shop_owner";
      role = "shop_owner";
      console.log("🔧 FIXED DEBUG - Detected as SHOP_OWNER via metadata.role");
    } else {
      // For users that don't match patterns, assume app_user
      // The database check in signIn will update metadata for future logins
      user_type = "app_user";
      console.log("🔧 FIXED DEBUG - Defaulting to APP_USER");
    }

    console.log("🔧 FIXED DEBUG - Final user_type:", user_type);

    const basicUserData = {
      user_type,
      role,
      first_name: metadata.first_name || metadata.basic_info?.first_name,
      last_name: metadata.last_name || metadata.basic_info?.last_name,
      shop_id: metadata.shop_id || metadata.basic_info?.shop_id,
      shop_name: metadata.shop_name || metadata.business_name,
      permissions: getDefaultPermissions(user_type),
    };

    // SKIP CACHING for now
    // setCachedUserData(authUser.id, basicUserData);

    return { ...authUser, ...basicUserData };
  };

  const getCachedUserData = (userId: string) => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, userId: cachedUserId } = JSON.parse(cached);

      if (cachedUserId === userId && Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }

      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  };

  const setCachedUserData = (userId: string, userData: any) => {
    try {
      localStorage.setItem(
        USER_CACHE_KEY,
        JSON.stringify({
          data: userData,
          timestamp: Date.now(),
          userId,
        })
      );
    } catch {
      // Ignore storage errors
    }
  };

  const getDefaultPermissions = (userType: string): string[] => {
    switch (userType) {
      case "admin":
        return ["manage_customers", "view_analytics", "manage_admin_users"];
      case "shop_owner":
        return ["manage_shop", "view_analytics", "manage_coupons"];
      case "app_user":
        return ["view_loyalty", "redeem_rewards"];
      default:
        return [];
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState((prev) => ({ ...prev, error: error.message, loading: false }));
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign in failed";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return { data: null, error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      localStorage.removeItem(USER_CACHE_KEY);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign out failed";
      return { error: new Error(errorMessage) };
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
    clearError,
    isAdmin: state.user?.user_type === "admin",
    isShopOwner: state.user?.user_type === "shop_owner",
    isAppUser: state.user?.user_type === "app_user",
    role: state.user?.role,
    hasPermission: (permission: string) =>
      state.user?.permissions?.includes(permission) || false,
  };
};

// Separate hook for full profile data (only when needed)
export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id, user?.user_type],
    queryFn: async () => {
      if (!user?.user_type) return null;

      // Only fetch full profile when actually needed
      switch (user.user_type) {
        case "admin":
          return await apiClient.getAdminProfile();
        case "shop_owner":
          return await apiClient.getShopOwnerProfile();
        case "app_user":
          return await apiClient.getAppUserProfile();
        default:
          return null;
      }
    },
    enabled: !!user?.id && !!user?.user_type,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
