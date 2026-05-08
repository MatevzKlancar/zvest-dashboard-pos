"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  FlaskConical,
} from "lucide-react";
import { useNotificationAnalytics } from "@/hooks/useNotifications";

const CATEGORY_LABEL: Record<string, string> = {
  manual: "Announcements",
  daily_meal: "Daily meal",
  specials: "Specials",
  birthday: "Birthday",
  points_earned: "Points",
  coupon_ready: "Coupon",
};

function getDeliveryRateColor(rate: number) {
  if (rate >= 90) return "text-green-600";
  if (rate >= 70) return "text-yellow-600";
  return "text-red-600";
}

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

  if (!analytics) return null;

  const subscriberCount = analytics.subscriber_count ?? 0;
  const subsByCat = analytics.subscriber_count_by_category ?? {};
  const drByCat = analytics.delivery_rate_by_type ?? {};
  const byType = analytics.by_type ?? {};
  const totalDryRun = analytics.total_dry_run ?? 0;

  // Compute max for bar widths
  const maxSubs = Math.max(
    1,
    ...Object.values(subsByCat).map((v) => (typeof v === "number" ? v : 0))
  );

  return (
    <div className="space-y-6">
      {totalDryRun > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <FlaskConical className="h-4 w-4 text-yellow-700" />
          <AlertDescription className="text-yellow-900">
            {totalDryRun} notifications were recorded in test mode and not
            delivered. These are excluded from the delivery rate.
          </AlertDescription>
        </Alert>
      )}

      {/* Subscribers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
          <div className="p-2 rounded-lg bg-purple-50">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-bold">{subscriberCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              customers follow your shop
            </p>
          </div>

          {Object.keys(subsByCat).length > 0 && (
            <div className="space-y-2">
              {Object.entries(subsByCat).map(([cat, count]) => {
                const numCount = typeof count === "number" ? count : 0;
                const pct = (numCount / maxSubs) * 100;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-700">
                      <span>{CATEGORY_LABEL[cat] ?? cat}</span>
                      <span className="font-mono">{numCount}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top-line stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getDeliveryRateColor(
                analytics.delivery_rate
              )}`}
            >
              {analytics.delivery_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Success rate</p>
          </CardContent>
        </Card>

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
      </div>

      {/* By Type */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(byType).map(([cat, count]) => (
              <div key={cat} className="space-y-2">
                <div className="text-sm text-gray-600">
                  {CATEGORY_LABEL[cat] ?? cat}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{count}</div>
                  <Badge variant="secondary">{cat}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-category delivery rate */}
      {Object.keys(drByCat).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-category delivery rate</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Category</th>
                  <th className="py-2 text-right">Sent</th>
                  <th className="py-2 text-right">Delivery rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(drByCat).map(([cat, rate]) => (
                  <tr key={cat} className="border-t">
                    <td className="py-2">{CATEGORY_LABEL[cat] ?? cat}</td>
                    <td className="py-2 text-right">{byType[cat] ?? 0}</td>
                    <td
                      className={`py-2 text-right font-medium ${getDeliveryRateColor(
                        rate
                      )}`}
                    >
                      {rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
