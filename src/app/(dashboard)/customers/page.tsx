"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useCustomerAnalytics,
  useTopCustomers,
  useCustomerSegments,
} from "@/hooks/useAnalytics";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Award,
  Activity,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  Star,
  AlertTriangle,
  Heart,
  Crown,
  Sparkles,
} from "lucide-react";

interface Customer {
  customer_id: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  phone_number: string;
  total_spent: number;
  visit_count: number;
  first_visit: string;
  days_since_visit: number;
  days_since_last_visit: number;
  points_balance: number;
  avg_transaction: number;
  percentile: number;
  customer_rank: number;
  loyalty_score: number;
}

// Helper to get customer tier based on percentile
const getCustomerTier = (percentile: number) => {
  if (percentile >= 95) return { name: "Diamond", color: "text-purple-600", bg: "bg-purple-50", icon: Crown };
  if (percentile >= 80) return { name: "Gold", color: "text-yellow-600", bg: "bg-yellow-50", icon: Star };
  if (percentile >= 60) return { name: "Silver", color: "text-gray-600", bg: "bg-gray-50", icon: Award };
  return { name: "Bronze", color: "text-orange-600", bg: "bg-orange-50", icon: Heart };
};

// Helper to format retention rate
const formatRetention = (rate: number) => {
  const color = rate >= 70 ? "text-green-600" : rate >= 40 ? "text-yellow-600" : "text-red-600";
  return { value: `${rate.toFixed(1)}%`, color };
};

export default function CustomersPage() {
  const [period, setPeriod] = useState("30d");
  const [sortBy, setSortBy] = useState<"total_spent" | "visit_count" | "points_balance">("total_spent");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: analytics } = useCustomerAnalytics(period);
  const { data: topCustomers, isLoading: topCustomersLoading } = useTopCustomers({
    sort_by: sortBy,
    limit: 20,
  });
  const { data: segments } = useCustomerSegments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600">
            Understand your customers and boost retention
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Summary Cards */}
      {analytics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.summary.total_customers.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <UserPlus className="h-3 w-3" />
                  {analytics.summary.new_customers} new
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <UserCheck className="h-3 w-3" />
                  {analytics.summary.returning_customers} returning
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Retention Rate
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={formatRetention(analytics.summary.retention_rate).color}>
                  {formatRetention(analytics.summary.retention_rate).value}
                </span>
              </div>
              <Progress
                value={analytics.summary.retention_rate}
                className="h-2 mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                of customers are still active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Lifetime Value
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.summary.avg_lifetime_value)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Avg: {analytics.summary.avg_purchases_per_customer.toFixed(1)} purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Purchase Frequency
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Every {analytics.summary.avg_time_between_purchases_days} days
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Average time between purchases
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Segments Distribution */}
            {analytics?.segments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Segments
                  </CardTitle>
                  <CardDescription>
                    Distribution of customers by engagement level
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">VIP Customers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{analytics.segments.vip_customers}</span>
                        <Badge variant="secondary">Top 20%</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Regular Customers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{analytics.segments.regular_customers}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">At Risk</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{analytics.segments.at_risk_customers}</span>
                        <Badge variant="outline" className="text-yellow-600">
                          30-60 days inactive
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Lost Customers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{analytics.segments.lost_customers}</span>
                        <Badge variant="outline" className="text-red-600">
                          60+ days inactive
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Purchase Frequency */}
            {analytics?.purchase_frequency && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Customer Activity
                  </CardTitle>
                  <CardDescription>
                    How often customers visit your shop
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Daily Active</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {analytics.purchase_frequency.daily_active}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Weekly Active</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {analytics.purchase_frequency.weekly_active}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Monthly Active</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {analytics.purchase_frequency.monthly_active}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      <strong>Tip:</strong> Engage inactive customers with targeted promotions
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          {segments && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VIP Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    VIP Customers
                  </CardTitle>
                  <CardDescription>
                    Your top 20% customers by spend
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {segments.vip_customers && segments.vip_customers.length > 0 ? (
                    <div className="space-y-3">
                      {segments.vip_customers.slice(0, 5).map((customer: Customer) => (
                        <div
                          key={customer.customer_id}
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-600">{customer.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(customer.total_spent)}</div>
                            <div className="text-xs text-gray-600">{customer.visit_count} visits</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No VIP customers yet</p>
                  )}
                </CardContent>
              </Card>

              {/* At Risk Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    At Risk Customers
                  </CardTitle>
                  <CardDescription>
                    Haven&apos;t visited in 30-60 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {segments.at_risk_customers && segments.at_risk_customers.length > 0 ? (
                    <div className="space-y-3">
                      {segments.at_risk_customers.slice(0, 5).map((customer: Customer) => (
                        <div
                          key={customer.customer_id}
                          className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-600">{customer.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-yellow-600">
                              {customer.days_since_visit} days ago
                            </div>
                            <div className="text-xs text-gray-600">
                              LTV: {formatCurrency(customer.total_spent)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Win-Back Campaign
                      </Button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No at-risk customers</p>
                  )}
                </CardContent>
              </Card>

              {/* New Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    New Customers
                  </CardTitle>
                  <CardDescription>
                    Joined in the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {segments.new_customers && segments.new_customers.length > 0 ? (
                    <div className="space-y-3">
                      {segments.new_customers.slice(0, 5).map((customer: Customer) => (
                        <div
                          key={customer.customer_id}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-600">{customer.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-600">
                              {formatDate(customer.first_visit)}
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatCurrency(customer.total_spent)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No new customers this week</p>
                  )}
                </CardContent>
              </Card>

              {/* Loyal Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Loyal Customers
                  </CardTitle>
                  <CardDescription>
                    Your most frequent visitors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {segments.loyal_customers && segments.loyal_customers.length > 0 ? (
                    <div className="space-y-3">
                      {segments.loyal_customers.slice(0, 5).map((customer: Customer) => (
                        <div
                          key={customer.customer_id}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-600">{customer.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold">{customer.visit_count}</span>
                              <span className="text-xs text-gray-600">visits</span>
                            </div>
                            <Progress
                              value={customer.loyalty_score}
                              className="h-1 mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Building loyalty...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="top-customers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Customers Leaderboard</CardTitle>
                  <CardDescription>
                    Your highest value customers ranked by performance
                  </CardDescription>
                </div>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as "total_spent" | "visit_count" | "points_balance")}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_spent">Total Spent</SelectItem>
                    <SelectItem value="visit_count">Visit Count</SelectItem>
                    <SelectItem value="points_balance">Points Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {topCustomersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : topCustomers && topCustomers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Avg Order</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Tier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer: Customer) => {
                      const tier = getCustomerTier(customer.percentile);
                      const TierIcon = tier.icon;

                      return (
                        <TableRow key={customer.customer_id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {customer.customer_rank <= 3 ? (
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  customer.customer_rank === 1 ? "bg-yellow-100" :
                                  customer.customer_rank === 2 ? "bg-gray-100" :
                                  "bg-orange-100"
                                }`}>
                                  <span className="font-bold text-sm">
                                    {customer.customer_rank}
                                  </span>
                                </div>
                              ) : (
                                <span className="ml-2 text-gray-600">
                                  {customer.customer_rank}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {customer.first_name} {customer.last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {customer.phone_number}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">
                              {formatCurrency(customer.total_spent)}
                            </div>
                          </TableCell>
                          <TableCell>{customer.visit_count}</TableCell>
                          <TableCell>
                            {formatCurrency(customer.avg_transaction)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {customer.points_balance.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {customer.days_since_last_visit === 0
                                ? "Today"
                                : customer.days_since_last_visit === 1
                                ? "Yesterday"
                                : `${customer.days_since_last_visit}d ago`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 p-1 px-2 rounded-lg ${tier.bg} w-fit`}>
                              <TierIcon className={`h-3 w-3 ${tier.color}`} />
                              <span className={`text-xs font-medium ${tier.color}`}>
                                {tier.name}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No customer data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}