"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertTriangle } from "lucide-react";
import { useAudiencePreview } from "@/hooks/useNotifications";
import { NotificationCategory } from "@/lib/types";

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  manual: "Announcements",
  daily_meal: "Daily meal",
  specials: "Special / promo",
};

export function AudiencePreviewChip({
  category,
  compact = false,
}: {
  category: NotificationCategory;
  compact?: boolean;
}) {
  const { data, isLoading } = useAudiencePreview(category);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 italic">Loading audience…</div>
    );
  }

  if (!data) return null;

  const { subscribed_count, total_subscribers, total_with_loyalty } = data;
  const label = CATEGORY_LABEL[category];

  if (subscribed_count === 0) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-sm text-yellow-900">
          <span className="font-semibold">No subscribers yet.</span> Customers
          need to favorite your shop in the app to receive notifications.
          Sending now will succeed but reach 0 people.
        </AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-600">
        <Users className="h-3.5 w-3.5" />
        <span>
          <span className="font-semibold">{subscribed_count}</span> subscribed
          to {label.toLowerCase()}
        </span>
      </div>
    );
  }

  return (
    <Alert>
      <Users className="h-4 w-4" />
      <AlertDescription>
        <div className="text-sm">
          <span className="font-semibold">Reach:</span> This will be sent to{" "}
          <span className="font-semibold">{subscribed_count} customers</span>{" "}
          who follow you and have <span className="font-semibold">{label}</span>{" "}
          notifications enabled.
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {total_subscribers} customers follow your shop · {total_with_loyalty}{" "}
          have a loyalty account
        </div>
      </AlertDescription>
    </Alert>
  );
}
