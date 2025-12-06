"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

interface QRCodeStatsProps {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  isLoading?: boolean;
}

export function QRCodeStats({
  totalCodes,
  activeCodes,
  usedCodes,
  isLoading = false,
}: QRCodeStatsProps) {
  const redemptionRate =
    totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0;

  const stats = [
    {
      title: "Total QR Codes",
      value: totalCodes.toLocaleString(),
      icon: QrCode,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Codes",
      value: activeCodes.toLocaleString(),
      icon: CheckCircle2,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Used Codes",
      value: usedCodes.toLocaleString(),
      icon: XCircle,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-600",
    },
    {
      title: "Redemption Rate",
      value: `${redemptionRate}%`,
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
