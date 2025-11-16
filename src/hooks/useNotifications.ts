"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  BroadcastNotificationData,
  BirthdayTemplateData,
  NotificationHistoryFilters,
} from "@/lib/types";

export const useBroadcastNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BroadcastNotificationData) =>
      apiClient.sendBroadcastNotification(data),
    onSuccess: () => {
      // Invalidate history and analytics to refresh data
      queryClient.invalidateQueries({ queryKey: ["notification-history"] });
      queryClient.invalidateQueries({ queryKey: ["notification-analytics"] });
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
