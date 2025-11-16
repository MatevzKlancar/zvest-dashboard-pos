"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  X,
} from "lucide-react";
import { useNotificationHistory } from "@/hooks/useNotifications";
import { formatDate } from "@/lib/utils";
import type {
  Notification,
  NotificationType,
  NotificationStatus,
} from "@/lib/types";

const getTypeColor = (type: NotificationType) => {
  switch (type) {
    case "manual":
      return "bg-blue-100 text-blue-800";
    case "birthday":
      return "bg-purple-100 text-purple-800";
    case "points_earned":
      return "bg-green-100 text-green-800";
    case "coupon_ready":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: NotificationStatus) => {
  switch (status) {
    case "sent":
    case "delivered":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
    case "error":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatNotificationType = (type: NotificationType) => {
  switch (type) {
    case "manual":
      return "Manual Broadcast";
    case "birthday":
      return "Birthday";
    case "points_earned":
      return "Points Earned";
    case "coupon_ready":
      return "Coupon Ready";
    default:
      return type;
  }
};

export function NotificationHistoryTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "all">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(
    null
  );

  const filters = {
    page,
    limit,
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  };

  const { data, isLoading } = useNotificationHistory(filters);

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (data && page * limit < data.total) {
      setPage((prev) => prev + 1);
    }
  };

  const hasFilters = typeFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Notification History
              </CardTitle>
              <CardDescription>
                View all notifications sent to your customers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as NotificationType | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual Broadcast</SelectItem>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="points_earned">Points Earned</SelectItem>
                <SelectItem value="coupon_ready">Coupon Ready</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as NotificationStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Table */}
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No notifications found</p>
              <p className="text-sm mt-1">
                {hasFilters
                  ? "Try adjusting your filters"
                  : "Send your first notification to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getTypeColor(notification.notification_type)}
                          >
                            {formatNotificationType(notification.notification_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(notification.status)}
                          >
                            {notification.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(notification.sent_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedNotification(notification)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex} to {endIndex} of {total} notifications
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm text-gray-600">Page {page}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page * limit >= total}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              Full details of the selected notification
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Type</div>
                  <Badge
                    variant="secondary"
                    className={getTypeColor(selectedNotification.notification_type)}
                  >
                    {formatNotificationType(selectedNotification.notification_type)}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(selectedNotification.status)}
                  >
                    {selectedNotification.status}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Title</div>
                <div className="text-base font-semibold">
                  {selectedNotification.title}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Message</div>
                <div className="text-base bg-gray-50 p-4 rounded-lg">
                  {selectedNotification.body}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Sent At</div>
                  <div className="text-sm">
                    {formatDate(selectedNotification.sent_at)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Created At</div>
                  <div className="text-sm">
                    {formatDate(selectedNotification.created_at)}
                  </div>
                </div>
              </div>

              {selectedNotification.data &&
                Object.keys(selectedNotification.data).length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Additional Data
                    </div>
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
