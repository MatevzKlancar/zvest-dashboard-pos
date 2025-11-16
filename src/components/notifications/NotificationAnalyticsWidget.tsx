"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { useNotificationAnalytics } from "@/hooks/useNotifications";

export function NotificationAnalyticsWidget() {
  const { data: analytics, isLoading } = useNotificationAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const getDeliveryRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Sent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          <div className="p-2 rounded-lg bg-blue-50">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_sent}</div>
          <p className="text-xs text-gray-600 mt-1">All-time notifications</p>
        </CardContent>
      </Card>

      {/* Delivery Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
          <div className="p-2 rounded-lg bg-green-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${getDeliveryRateColor(analytics.delivery_rate)}`}
          >
            {analytics.delivery_rate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-600 mt-1">Success rate</p>
        </CardContent>
      </Card>

      {/* Total Delivered */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          <div className="p-2 rounded-lg bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {analytics.total_delivered}
          </div>
          <p className="text-xs text-gray-600 mt-1">Successfully delivered</p>
        </CardContent>
      </Card>

      {/* Total Failed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <div className="p-2 rounded-lg bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {analytics.total_failed}
          </div>
          <p className="text-xs text-gray-600 mt-1">Failed deliveries</p>
        </CardContent>
      </Card>

      {/* Breakdown by Type */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Notifications by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Manual Broadcasts</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {analytics.by_type.manual}
                </div>
                <Badge variant="secondary">Manual</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Birthday Messages</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {analytics.by_type.birthday}
                </div>
                <Badge variant="secondary">Birthday</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Points Earned</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {analytics.by_type.points_earned}
                </div>
                <Badge variant="secondary">Points</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Coupon Ready</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {analytics.by_type.coupon_ready}
                </div>
                <Badge variant="secondary">Coupon</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
