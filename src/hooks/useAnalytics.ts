import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// Dashboard Widgets Hook
export const useDashboardWidgets = () => {
  return useQuery({
    queryKey: ["dashboard-widgets"],
    queryFn: () => apiClient.getDashboardWidgets(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

// Customer Analytics Hook
export const useCustomerAnalytics = (period: string = "30d") => {
  return useQuery({
    queryKey: ["customer-analytics", period],
    queryFn: () => apiClient.getCustomerAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Coupon Analytics Hook
export const useCouponAnalytics = (period: string = "30d") => {
  return useQuery({
    queryKey: ["coupon-analytics", period],
    queryFn: () => apiClient.getCouponAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Business Trends Hook
export const useBusinessTrends = (period: string = "30d") => {
  return useQuery({
    queryKey: ["business-trends", period],
    queryFn: () => apiClient.getBusinessTrends(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Top Customers Hook
export const useTopCustomers = (params?: {
  sort_by?: "total_spent" | "visit_count" | "points_balance";
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["top-customers", params],
    queryFn: () => apiClient.getTopCustomers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Customer Segments Hook
export const useCustomerSegments = () => {
  return useQuery({
    queryKey: ["customer-segments"],
    queryFn: () => apiClient.getCustomerSegments(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Articles Hook
export const useArticles = (params?: {
  active_only?: boolean;
  category?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ["articles", params],
    queryFn: () => apiClient.getArticles(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Product Analytics Hook
export const useProductAnalytics = (params?: {
  period?: string;
  category?: string;
  sort_by?: "units_sold" | "revenue" | "last_sold";
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["product-analytics", params],
    queryFn: () => apiClient.getProductAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};