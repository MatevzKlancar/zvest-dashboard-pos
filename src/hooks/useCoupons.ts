"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { CouponFilters, CreateCouponData } from "@/lib/types";
import { toast } from "sonner";

export const useCoupons = (filters?: CouponFilters) => {
  return useQuery({
    queryKey: ["coupons", filters],
    queryFn: async () => {
      console.log("🔍 Fetching coupons with filters:", filters);
      const coupons = await apiClient.getCoupons(filters);
      console.log("📋 Coupons fetched:", coupons);
      return coupons;
    },
  });
};

export const useCoupon = (id: string) => {
  return useQuery({
    queryKey: ["coupon", id],
    queryFn: () => apiClient.getCoupon(id),
    enabled: !!id,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCouponData) => apiClient.createCoupon(data),
    onSuccess: (newCoupon) => {
      console.log("🎉 Coupon created successfully:", newCoupon);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create coupon");
      console.error("Error creating coupon:", error);
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCouponData>;
    }) => apiClient.updateCoupon(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      queryClient.invalidateQueries({ queryKey: ["coupon", id] });
      toast.success("Coupon updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update coupon");
      console.error("Error updating coupon:", error);
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete coupon");
      console.error("Error deleting coupon:", error);
    },
  });
};
