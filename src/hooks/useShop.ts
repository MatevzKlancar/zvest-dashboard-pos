"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ShopUpdateData, TransactionFilters } from "@/lib/types";
import { toast } from "sonner";

export const useShop = () => {
  return useQuery({
    queryKey: ["shop"],
    queryFn: () => apiClient.getShop(),
  });
};

export const useUpdateShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShopUpdateData) => apiClient.updateShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      toast.success("Shop updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update shop");
      console.error("Error updating shop:", error);
    },
  });
};

export const useUpdateShopImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (image_url: string) => apiClient.updateShopImage(image_url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      toast.success("Shop image updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update shop image");
      console.error("Error updating shop image:", error);
    },
  });
};

export const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => apiClient.getAnalytics(),
  });
};

export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => apiClient.getTransactions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
