"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, X } from "lucide-react";
import { toast } from "sonner";
import {
  useCancelScheduled,
  useScheduledNotifications,
} from "@/hooks/useNotifications";

const TYPE_LABEL: Record<string, string> = {
  manual: "Announcement",
  daily_meal: "Daily meal",
  specials: "Special",
  birthday: "Birthday",
};

export function ScheduledQueueList() {
  const { data: scheduled, isLoading } = useScheduledNotifications("scheduled");
  const cancel = useCancelScheduled();

  const handleCancel = async (id: string) => {
    try {
      await cancel.mutateAsync(id);
      toast.success("Scheduled notification cancelled");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to cancel");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Scheduled queue
        </CardTitle>
        <CardDescription>
          Upcoming one-off and weekly-plan notifications. Cancel before they
          fire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : !scheduled || scheduled.length === 0 ? (
          <div className="text-sm text-gray-500 py-6 text-center">
            No scheduled notifications.
          </div>
        ) : (
          <ul className="space-y-2">
            {scheduled.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {TYPE_LABEL[s.notification_type] ?? s.notification_type}
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(s.scheduled_for).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-xs text-gray-600 truncate">{s.body}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(s.id)}
                  disabled={cancel.isPending}
                  className="text-red-600 hover:text-red-700 shrink-0"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
