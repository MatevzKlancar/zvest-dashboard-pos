"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface ArticleFilters {
  active_only?: boolean;
  limit?: number;
}

export const useArticles = (filters?: ArticleFilters) => {
  return useQuery({
    queryKey: ["articles", filters],
    queryFn: async () => {
      console.log("🔍 Fetching articles with filters:", filters);
      const articles = await apiClient.getArticles(filters);
      console.log("📋 Articles fetched:", articles);
      return articles;
    },
  });
};
