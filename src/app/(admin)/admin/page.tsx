"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import {
  Store,
  Users,
  PlusCircle,
  Settings,
  BarChart3,
  TestTube,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: customersData, isLoading } = useCustomers({ limit: 10 });

  const totalCustomers = customersData?.data?.length || 0;
  const activeCustomers =
    customersData?.data?.filter((c: any) => c.is_active)?.length || 0;

  const quickActions = [
    {
      title: "Create B2B Customer",
      description: "Onboard a new business customer",
      href: "/admin/onboard",
      icon: PlusCircle,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Manage Customers",
      description: "View and manage all customers",
      href: "/admin/customers",
      icon: Users,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "POS Testing",
      description: "Test coupon integration for POS engineers",
      href: "/admin/pos-testing",
      icon: TestTube,
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      title: "Platform Settings",
      description: "Configure platform settings",
      href: "/admin/settings",
      icon: Settings,
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  const stats = [
    {
      title: "Total Customers",
      value: isLoading ? "..." : totalCustomers.toString(),
      description: "All B2B customers",
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Customers",
      value: isLoading ? "..." : activeCustomers.toString(),
      description: "Currently active",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Platform Health",
      value: "98.5%",
      description: "System uptime",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">
            Welcome back, {user?.first_name || "Admin"}! Manage your B2B
            platform.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group cursor-pointer">
                  <div
                    className={`${action.color} text-white p-6 rounded-lg transition-colors`}
                  >
                    <action.icon className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold text-lg mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Customers</CardTitle>
            <CardDescription>Latest B2B customer registrations</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/customers">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : customersData?.data && customersData.data.length > 0 ? (
            <div className="space-y-4">
              {customersData.data.slice(0, 5).map((customer: any) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Store className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {customer.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {customer.type} • {customer.subscription_tier}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {customer.is_active ? "Active" : "Inactive"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No customers yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start by creating your first B2B customer
              </p>
              <Button asChild>
                <Link href="/admin/onboard">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Customer
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
