"use client";

import { useState } from "react";
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
import { Send, CheckCircle2, AlertCircle, Smartphone, Bell } from "lucide-react";
import { useBroadcastNotification } from "@/hooks/useNotifications";

const broadcastSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  body: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message must be 500 characters or less"),
});

type BroadcastFormData = z.infer<typeof broadcastSchema>;

export function BroadcastNotificationForm() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<BroadcastFormData | null>(null);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  const { mutate: sendBroadcast, isPending } = useBroadcastNotification();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const titleLength = watch("title")?.length || 0;
  const bodyLength = watch("body")?.length || 0;

  const onSubmit = (data: BroadcastFormData) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (!pendingData) return;

    sendBroadcast(pendingData, {
      onSuccess: (response) => {
        setLastResult(response.data);
        reset();
        setShowConfirmDialog(false);
        setPendingData(null);
      },
      onError: (error) => {
        console.error("Failed to send notification:", error);
        setShowConfirmDialog(false);
        setPendingData(null);
      },
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Manual Broadcast
            </CardTitle>
            <CardDescription>
              Send an immediate push notification to all your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                {isPending ? "Sending..." : "Send to All Customers"}
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
                        {watch("body") || "Your notification message will appear here..."}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">Just now</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Result */}
          {lastResult && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-green-900">
                    Notification sent successfully!
                  </div>
                  <div className="text-sm text-green-800">
                    <div>Successfully sent: {lastResult.sent} customers</div>
                    {lastResult.failed > 0 && (
                      <div className="text-yellow-700">
                        Failed: {lastResult.failed} customers
                      </div>
                    )}
                    <div>Total attempted: {lastResult.total} customers</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Important Notes:</div>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Notifications are sent immediately</li>
                  <li>Only customers with the mobile app will receive notifications</li>
                  <li>Use sparingly to avoid notification fatigue</li>
                  <li>Best for time-sensitive promotions or announcements</li>
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
            <AlertDialogTitle>Send Notification to All Customers?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately send a push notification to all customers who have
              the mobile app installed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <div className="text-sm font-semibold text-gray-700">Title:</div>
              <div className="text-sm text-gray-900">{pendingData?.title}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">Message:</div>
              <div className="text-sm text-gray-900">{pendingData?.body}</div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Sending..." : "Send Notification"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
