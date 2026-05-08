"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Bell,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  useBroadcastNotification,
  useBroadcastQuota,
} from "@/hooks/useNotifications";
import { NotificationCategory, BroadcastResultData } from "@/lib/types";
import { AudiencePreviewChip } from "./AudiencePreviewChip";
import { DryRunBanner } from "./DryRunBanner";
import { markDryRunObserved } from "@/lib/dryRunState";
import { formatRetryAfter } from "@/lib/format";

const broadcastSchema = z
  .object({
    category: z.enum(["manual", "daily_meal", "specials"]),
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be 100 characters or less"),
    body: z
      .string()
      .min(1, "Message is required")
      .max(500, "Message must be 500 characters or less"),
    schedule_mode: z.enum(["now", "later"]),
    scheduled_for_local: z.string().optional(),
  })
  .refine(
    (val) => {
      if (val.schedule_mode === "later") {
        if (!val.scheduled_for_local) return false;
        const t = new Date(val.scheduled_for_local).getTime();
        return Number.isFinite(t) && t > Date.now();
      }
      return true;
    },
    {
      message: "Pick a future date and time",
      path: ["scheduled_for_local"],
    }
  );

type BroadcastFormData = z.infer<typeof broadcastSchema>;

const CATEGORY_OPTIONS: { value: NotificationCategory; label: string; hint: string }[] = [
  { value: "manual", label: "Announcement", hint: "One-off (rate-limited)" },
  { value: "daily_meal", label: "Daily meal", hint: "Menu of the day" },
  { value: "specials", label: "Special / promo", hint: "Limited-time offers" },
];

export function BroadcastNotificationForm() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<BroadcastFormData | null>(null);
  const [lastResult, setLastResult] = useState<BroadcastResultData | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const { mutate: sendBroadcast, isPending } = useBroadcastNotification();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      category: "manual",
      title: "",
      body: "",
      schedule_mode: "now",
      scheduled_for_local: "",
    },
  });

  const category = watch("category") as NotificationCategory;
  const scheduleMode = watch("schedule_mode");
  const titleLength = watch("title")?.length || 0;
  const bodyLength = watch("body")?.length || 0;

  // Quota only relevant for manual
  const { data: quota } = useBroadcastQuota();
  const showQuota = category === "manual";
  const quotaBlocked = showQuota && quota && !quota.can_send_now;

  const onSubmit = (data: BroadcastFormData) => {
    setQuotaError(null);
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (!pendingData) return;

    const body: {
      category: NotificationCategory;
      title: string;
      body: string;
      scheduled_for?: string;
    } = {
      category: pendingData.category,
      title: pendingData.title,
      body: pendingData.body,
    };

    if (pendingData.schedule_mode === "later" && pendingData.scheduled_for_local) {
      body.scheduled_for = new Date(pendingData.scheduled_for_local).toISOString();
    }

    sendBroadcast(body, {
      onSuccess: (response) => {
        const data = response.data;
        setLastResult(data);

        if (data?.dry_run && data.dry_run > 0) {
          markDryRunObserved();
        }

        if (data?.scheduled) {
          toast.success(
            `Scheduled for ${new Date(
              pendingData.scheduled_for_local!
            ).toLocaleString()}. You can cancel from the History tab.`
          );
        } else if (data?.dry_run && data.dry_run > 0) {
          toast.warning(
            `Test mode: notification recorded but not delivered to ${data.dry_run} devices.`
          );
        } else {
          toast.success(
            `Sent to ${data?.sent ?? 0} customers. ${data?.failed ?? 0} failed.`
          );
        }

        reset({
          category: pendingData.category,
          title: "",
          body: "",
          schedule_mode: "now",
          scheduled_for_local: "",
        });
        setShowConfirmDialog(false);
        setPendingData(null);
      },
      onError: (error: Error) => {
        const msg = error?.message ?? "Failed to send notification";
        // 429 quota errors come through with a structured message; surface inline
        if (/quota/i.test(msg) || /429/.test(msg)) {
          setQuotaError(msg);
        } else {
          toast.error(msg);
        }
        console.error("Failed to send notification:", error);
        setShowConfirmDialog(false);
        setPendingData(null);
      },
    });
  };

  const minDateTime = useMemo(() => {
    const d = new Date(Date.now() + 60_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }, []);

  return (
    <>
      <DryRunBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Notification
            </CardTitle>
            <CardDescription>
              Send now or schedule for later. Reaches customers who follow your
              shop and have opted in for the chosen category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value: NotificationCategory) =>
                    setValue("category", value, { shouldValidate: true })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          <span className="text-xs text-gray-500">{opt.hint}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AudiencePreviewChip category={category} />

              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  placeholder="Daily Lunch Special"
                  {...register("title")}
                  disabled={isPending}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
                <p className="text-sm text-gray-500">{titleLength}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Try our new pasta dish today! Available until 3 PM."
                  rows={5}
                  {...register("body")}
                  disabled={isPending}
                />
                {errors.body && (
                  <p className="text-sm text-red-600">{errors.body.message}</p>
                )}
                <p className="text-sm text-gray-500">{bodyLength}/500 characters</p>
              </div>

              {/* Schedule toggle */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="schedule_mode" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule for later
                  </Label>
                  <Switch
                    id="schedule_mode"
                    checked={scheduleMode === "later"}
                    onCheckedChange={(checked) =>
                      setValue("schedule_mode", checked ? "later" : "now", {
                        shouldValidate: true,
                      })
                    }
                    disabled={isPending}
                  />
                </div>
                {scheduleMode === "later" && (
                  <div className="space-y-1">
                    <Input
                      type="datetime-local"
                      min={minDateTime}
                      {...register("scheduled_for_local")}
                      disabled={isPending}
                    />
                    <p className="text-xs text-gray-500">
                      Time is in your browser&apos;s local timezone. Backend stores
                      UTC.
                    </p>
                    {errors.scheduled_for_local && (
                      <p className="text-sm text-red-600">
                        {errors.scheduled_for_local.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Quota indicator */}
              {showQuota && quota && (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {quota.can_send_now ? (
                    <span>
                      {quota.daily_limit - quota.daily_remaining} of{" "}
                      {quota.daily_limit} announcements used today
                    </span>
                  ) : (
                    <span className="text-yellow-700">
                      Quota reached. You can send another announcement in{" "}
                      {formatRetryAfter(quota.retry_after_seconds)}.
                    </span>
                  )}
                </div>
              )}

              {quotaError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    {quotaError}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isPending || !!quotaBlocked}
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                {isPending
                  ? scheduleMode === "later"
                    ? "Scheduling…"
                    : "Sending…"
                  : scheduleMode === "later"
                  ? "Schedule Notification"
                  : "Send Now"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Preview
              </CardTitle>
              <CardDescription>
                How your notification will appear on customer devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
                <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <Bell className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">
                        {watch("title") || "Notification Title"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {watch("body") ||
                          "Your notification message will appear here..."}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">Just now</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {lastResult && !lastResult.scheduled && (
            <Alert
              className={
                lastResult.dry_run && lastResult.dry_run > 0
                  ? "border-yellow-300 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-gray-900">
                    {lastResult.dry_run && lastResult.dry_run > 0
                      ? "Recorded in test mode"
                      : "Notification sent successfully!"}
                  </div>
                  <div className="text-sm text-gray-800">
                    <div>Audience size: {lastResult.audience_size}</div>
                    {typeof lastResult.sent === "number" && (
                      <div>Successfully sent: {lastResult.sent}</div>
                    )}
                    {typeof lastResult.failed === "number" &&
                      lastResult.failed > 0 && (
                        <div className="text-yellow-700">
                          Failed: {lastResult.failed}
                        </div>
                      )}
                    {lastResult.dry_run && lastResult.dry_run > 0 && (
                      <div className="text-yellow-700">
                        Dry-run (not delivered): {lastResult.dry_run}
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Important Notes:</div>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>
                    Notifications reach customers who favorited your shop and
                    have the chosen category enabled.
                  </li>
                  <li>
                    Announcements are rate-limited (1/hour, 2/day). Daily meal
                    and specials are not.
                  </li>
                  <li>Use sparingly to avoid notification fatigue.</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingData?.schedule_mode === "later"
                ? "Schedule Notification?"
                : "Send Notification Now?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingData?.schedule_mode === "later"
                ? "This will be queued and delivered at the scheduled time. You can cancel it from the History tab."
                : "This will immediately send a push notification to subscribed customers. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <div className="text-sm font-semibold text-gray-700">Category:</div>
              <div className="text-sm text-gray-900">
                {
                  CATEGORY_OPTIONS.find((c) => c.value === pendingData?.category)
                    ?.label
                }
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">Title:</div>
              <div className="text-sm text-gray-900">{pendingData?.title}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">Message:</div>
              <div className="text-sm text-gray-900">{pendingData?.body}</div>
            </div>
            {pendingData?.schedule_mode === "later" &&
              pendingData?.scheduled_for_local && (
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Scheduled for:
                  </div>
                  <div className="text-sm text-gray-900">
                    {new Date(pendingData.scheduled_for_local).toLocaleString()}
                  </div>
                </div>
              )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending
                ? "Working…"
                : pendingData?.schedule_mode === "later"
                ? "Schedule"
                : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
