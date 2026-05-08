"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, Cake, History, BarChart3 } from "lucide-react";
import { NotificationAnalyticsWidget } from "@/components/notifications/NotificationAnalyticsWidget";
import { BroadcastNotificationForm } from "@/components/notifications/BroadcastNotificationForm";
import { WeeklyPlanSection } from "@/components/notifications/WeeklyPlanSection";
import { BirthdayTemplateForm } from "@/components/notifications/BirthdayTemplateForm";
import { NotificationHistoryTable } from "@/components/notifications/NotificationHistoryTable";
import { useCustomerType } from "@/hooks/useCustomerType";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NotificationsPage() {
  const router = useRouter();
  const { isExternalQRCustomer, isLoading: customerTypeLoading } = useCustomerType();
  const [activeTab, setActiveTab] = useState("analytics");

  // Redirect external-qr customers
  if (!customerTypeLoading && isExternalQRCustomer) {
    toast.error("This feature is not available for your account type");
    router.push("/qr-codes");
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Push Notifications
          </h2>
          <p className="text-gray-600 mt-1">
            Send notifications and manage automated birthday messages
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Send Notification
          </TabsTrigger>
          <TabsTrigger value="birthday" className="gap-2">
            <Cake className="h-4 w-4" />
            Birthday Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <NotificationAnalyticsWidget />
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <BroadcastNotificationForm />
          <WeeklyPlanSection />
        </TabsContent>

        <TabsContent value="birthday" className="space-y-6">
          <BirthdayTemplateForm />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <NotificationHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
