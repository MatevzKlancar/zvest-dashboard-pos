"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDashboardWidgets } from "@/hooks/useAnalytics";
import { useTransactions } from "@/hooks/useShop";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle,
  Target,
  Activity,
  Clock,
  Sparkles,
  UserCheck,
  UserPlus,
  Zap,
  Award,
  RefreshCw,
  ShoppingCart,
  Settings,
  Gift,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Alert {
  type: string;
  title: string;
  message: string;
  action?: string;
}

interface Coupon {
  coupon_id: string;
  name: string;
  redemptions_today: number;
  redemptions_total: number;
}


// Helper functions for formatting
const formatPercentage = (value: number) => {
  const formatted = `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  return {
    text: formatted,
    color: value >= 0 ? "text-green-600" : "text-red-600",
    bgColor: value >= 0 ? "bg-green-50" : "bg-red-50",
    icon: value >= 0 ? TrendingUp : TrendingDown,
  };
};

const getAlertStyle = (type: string) => {
  switch (type) {
    case "warning":
      return {
        icon: AlertTriangle,
        className: "border-yellow-200 bg-yellow-50",
        iconColor: "text-yellow-600",
      };
    case "success":
      return {
        icon: CheckCircle,
        className: "border-green-200 bg-green-50",
        iconColor: "text-green-600",
      };
    default:
      return {
        icon: Info,
        className: "border-blue-200 bg-blue-50",
        iconColor: "text-blue-600",
      };
  }
};

export default function DashboardPage() {
  const { data: widgets, isLoading: widgetsLoading, refetch } = useDashboardWidgets();
  const { data: transactionsResponse } =
    useTransactions({ limit: 5 });

  const transactions = transactionsResponse?.data || [];

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const {
    revenue_today,
    active_customers_today,
    popular_coupons_today,
    quick_stats,
    alerts,
    goals,
  } = widgets || {};

  // Show loading state
  if (widgetsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">
            Real-time overview of your business performance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Business Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert: Alert, index: number) => {
            const alertStyle = getAlertStyle(alert.type);
            const Icon = alertStyle.icon;

            return (
              <Alert key={index} className={alertStyle.className}>
                <Icon className={`h-4 w-4 ${alertStyle.iconColor}`} />
                <AlertTitle className="font-semibold">
                  {alert.title}
                </AlertTitle>
                <AlertDescription className="mt-1">
                  <div className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    {alert.action && (
                      <span className="text-sm font-medium ml-4">
                        {alert.action}
                      </span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue_today ? formatCurrency(revenue_today.amount) : "$0"}
            </div>
            {revenue_today && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center text-xs">
                  {revenue_today.vs_yesterday !== 0 && (
                    <>
                      {revenue_today.vs_yesterday > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          revenue_today.vs_yesterday > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatPercentage(revenue_today.vs_yesterday).text}
                      </span>
                      <span className="text-gray-500 ml-1">vs yesterday</span>
                    </>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {revenue_today.transaction_count} orders
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {active_customers_today?.count || 0}
            </div>
            {active_customers_today && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Badge variant="secondary" className="gap-1">
                  <UserPlus className="h-3 w-3" />
                  {active_customers_today.new_customers} new
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  {active_customers_today.returning_customers} returning
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Transaction
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50">
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quick_stats
                ? formatCurrency(quick_stats.avg_transaction_today)
                : "$0"}
            </div>
            {quick_stats && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                <span>Points awarded: {quick_stats.points_awarded_today}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              QR Scan Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-50">
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quick_stats?.conversion_rate || 0}%
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Customer engagement rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {goals && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Revenue Goal
              </CardTitle>
              <CardDescription>
                Track your progress towards today&apos;s target
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatCurrency(revenue_today?.amount || 0)}
                </span>
                <span className="text-sm text-gray-600">
                  of {formatCurrency(goals.daily_revenue_goal)}
                </span>
              </div>
              <Progress
                value={goals.daily_revenue_progress}
                className="h-3"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {goals.daily_revenue_progress}% achieved
                </span>
                {goals.daily_revenue_progress >= 100 ? (
                  <Badge className="bg-green-600">Goal Met!</Badge>
                ) : (
                  <span className="text-gray-500">
                    {formatCurrency(
                      goals.daily_revenue_goal - (revenue_today?.amount || 0)
                    )}{" "}
                    to go
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Monthly Revenue Goal
              </CardTitle>
              <CardDescription>
                Your progress this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {goals.monthly_revenue_progress}%
                </span>
                <span className="text-sm text-gray-600">
                  Target: {formatCurrency(goals.monthly_revenue_goal)}
                </span>
              </div>
              <Progress
                value={goals.monthly_revenue_progress}
                className="h-3"
              />
              <div className="text-sm text-gray-600">
                Keep up the great work! You&apos;re on track to meet your monthly goal.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Coupons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Today&apos;s Top Coupons
            </CardTitle>
            <CardDescription>Most redeemed coupons today</CardDescription>
          </CardHeader>
          <CardContent>
            {popular_coupons_today && popular_coupons_today.length > 0 ? (
              <div className="space-y-4">
                {popular_coupons_today.map((coupon: Coupon, index: number) => (
                  <div
                    key={coupon.coupon_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{coupon.name}</div>
                        <div className="text-xs text-gray-500">
                          Total: {coupon.redemptions_total} redemptions
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {coupon.redemptions_today} today
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No coupon redemptions today yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Points Awarded Today
              </span>
              <Badge variant="outline">
                {quick_stats?.points_awarded_today || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Active Coupons
              </span>
              <Badge variant="outline">
                {quick_stats?.coupons_active || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Peak Hour
              </span>
              <Badge variant="secondary">12:00 - 14:00</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Avg Daily Customers
              </span>
              <Badge variant="secondary">
                {Math.round(
                  (active_customers_today?.count || 0) * 0.8
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest customer purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {formatCurrency(transaction.total_amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
                <Link href="/transactions">
                  <Button variant="ghost" className="w-full mt-2" size="sm">
                    View All Transactions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No transactions yet today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/analytics">
          <Button variant="outline" className="w-full justify-start">
            <Activity className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </Link>
        <Link href="/coupons/new">
          <Button variant="outline" className="w-full justify-start">
            <Gift className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </Link>
        <Link href="/customers">
          <Button variant="outline" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Customer Insights
          </Button>
        </Link>
        <Link href="/shop">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Shop Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
