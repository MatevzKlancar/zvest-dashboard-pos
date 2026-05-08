"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  BroadcastNotificationData,
  BirthdayTemplateData,
  NotificationHistoryFilters,
  NotificationCategory,
  ScheduledStatus,
  CreatePlanData,
  UpdatePlanData,
  WeeklyPlanEntry,
} from "@/lib/types";

export const useBroadcastNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BroadcastNotificationData) =>
      apiClient.sendBroadcastNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-history"] });
      queryClient.invalidateQueries({ queryKey: ["notification-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-quota"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications"] });
    },
  });
};

export const useBirthdayTemplate = () => {
  return useQuery({
    queryKey: ["birthday-template"],
    queryFn: () => apiClient.getBirthdayTemplate(),
  });
};

export const useSaveBirthdayTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BirthdayTemplateData) =>
      apiClient.saveBirthdayTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday-template"] });
    },
  });
};

export const useNotificationHistory = (filters?: NotificationHistoryFilters) => {
  return useQuery({
    queryKey: ["notification-history", filters],
    queryFn: () => apiClient.getNotificationHistory(filters),
  });
};

export const useNotificationAnalytics = () => {
  return useQuery({
    queryKey: ["notification-analytics"],
    queryFn: () => apiClient.getNotificationAnalytics(),
  });
};

export const useAudiencePreview = (category: NotificationCategory) => {
  return useQuery({
    queryKey: ["audience-preview", category],
    queryFn: () => apiClient.getAudiencePreview(category),
    staleTime: 60_000,
  });
};

export const useBroadcastQuota = () => {
  return useQuery({
    queryKey: ["broadcast-quota"],
    queryFn: () => apiClient.getBroadcastQuota(),
    staleTime: 30_000,
  });
};

export const useScheduledNotifications = (status: ScheduledStatus = "scheduled") => {
  return useQuery({
    queryKey: ["scheduled-notifications", status],
    queryFn: () => apiClient.getScheduledNotifications(status),
  });
};

export const useCancelScheduled = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.cancelScheduledNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications"] });
    },
  });
};

// Weekly plans

export const usePlans = () => {
  return useQuery({
    queryKey: ["notification-plans"],
    queryFn: () => apiClient.listPlans(),
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanData) => apiClient.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-plans"] });
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanData }) =>
      apiClient.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-plans"] });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan-entries"] });
    },
  });
};

export const usePlanEntries = (planId: string | null) => {
  return useQuery({
    queryKey: ["plan-entries", planId],
    queryFn: () => apiClient.getPlanEntries(planId as string),
    enabled: !!planId,
  });
};

export const useSavePlanEntries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entries }: { id: string; entries: WeeklyPlanEntry[] }) =>
      apiClient.savePlanEntries(id, entries),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["plan-entries", id] });
    },
  });
};
