"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

// B2B Customer Creation
export function useCreateB2BCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createB2BCustomer.bind(apiClient),
    onSuccess: () => {
      toast.success("B2B Customer created successfully!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });
}

// Get Customers List
export function useCustomers(params?: {
  limit?: number;
  offset?: number;
  type?: "platform" | "enterprise";
  search?: string;
}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => apiClient.getCustomers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get POS Providers
export function usePosProviders() {
  return useQuery({
    queryKey: ["pos-providers"],
    queryFn: () => apiClient.getPosProviders(),
    staleTime: 30 * 60 * 1000, // 30 minutes (rarely changes)
  });
}

// Get Invitation Details (for setup page)
export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: () => apiClient.getInvitation(token),
    enabled: !!token,
    retry: false, // Don't retry on invalid tokens
  });
}

// Complete Shop Setup
export function useCompleteShopSetup() {
  return useMutation({
    mutationFn: apiClient.completeShopSetup.bind(apiClient),
    onSuccess: () => {
      toast.success("Shop setup completed successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Setup failed: ${error.message}`);
    },
  });
}
