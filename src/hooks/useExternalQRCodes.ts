"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ExternalQRCodeFilters } from "@/lib/types";
import { toast } from "sonner";

/**
 * Hook to fetch external QR codes for a specific article
 * @param articleId - Article ID to fetch QR codes for
 * @param filters - Optional filters (status, limit, offset, search)
 */
export const useExternalQRCodes = (
  articleId: string | null,
  filters?: ExternalQRCodeFilters
) => {
  return useQuery({
    queryKey: ["external-qr-codes", articleId, filters],
    queryFn: async () => {
      if (!articleId) {
        return { success: true, data: [], meta: { total: 0, limit: 50, offset: 0 } };
      }
      const response = await apiClient.getExternalQRCodes(articleId, filters);
      return response;
    },
    enabled: !!articleId,
  });
};

/**
 * Mutation hook to bulk import QR codes for an article
 */
export const useImportQRCodes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, qrCodes }: { articleId: string; qrCodes: string[] }) =>
      apiClient.importQRCodes(articleId, qrCodes),
    onSuccess: (response, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ["external-qr-codes", articleId] });

      const { imported_count, duplicate_count, error_count } = response.data;

      if (error_count > 0) {
        toast.error(
          `Import completed with errors: ${imported_count} imported, ${error_count} failed`
        );
      } else if (duplicate_count > 0) {
        toast.success(
          `${imported_count} QR codes imported successfully (${duplicate_count} duplicates skipped)`
        );
      } else {
        toast.success(`${imported_count} QR codes imported successfully`);
      }
    },
    onError: (error) => {
      toast.error("Failed to import QR codes");
      console.error("Error importing QR codes:", error);
    },
  });
};

/**
 * Mutation hook to delete a single QR code
 */
export const useDeleteQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (qrCodeId: string) => apiClient.deleteQRCode(qrCodeId),
    onSuccess: () => {
      // Invalidate all QR code queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["external-qr-codes"] });
      toast.success("QR code deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete QR code");
      console.error("Error deleting QR code:", error);
    },
  });
};
