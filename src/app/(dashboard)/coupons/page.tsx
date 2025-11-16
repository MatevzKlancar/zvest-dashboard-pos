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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCoupons, useDeleteCoupon } from "@/hooks/useCoupons";
import { CouponFilters, Coupon } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Trash2, Ticket } from "lucide-react";
import { CreateCouponModal } from "@/components/coupons/CreateCouponModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "sonner";

export default function CouponsPage() {
  const [filters, setFilters] = useState<CouponFilters>({
    search: "",
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const { data: coupons, isLoading } = useCoupons(filters);
  const deleteCoupon = useDeleteCoupon();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      await deleteCoupon.mutateAsync(selectedCoupon.id);
      setDeleteConfirmOpen(false);
      setSelectedCoupon(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getCouponTypeColor = (type: string) => {
    switch (type) {
      case "percentage":
        return "bg-blue-100 text-blue-800";
      case "fixed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCouponTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Percentage";
      case "fixed":
        return "Fixed Amount";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Coupons</h2>
          <p className="text-gray-600">
            Manage your loyalty program coupons and discounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search coupons..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Your Coupons
          </CardTitle>
          <CardDescription>
            {coupons ? `${coupons.length} coupons found` : "Loading coupons..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : coupons && coupons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Points Required</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">
                      {coupon.name || "Untitled Coupon"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCouponTypeColor(coupon.type)}>
                        {getCouponTypeLabel(coupon.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.type === "percentage"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </TableCell>
                    <TableCell>{coupon.points_required || 0} points</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {coupon.description || "No description"}
                    </TableCell>
                    <TableCell>
                      {coupon.expires_at
                        ? formatDate(coupon.expires_at)
                        : "No expiry"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCoupon(coupon);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No coupons found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first coupon
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Coupon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Modal */}
      <CreateCouponModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteCoupon}
        title="Delete Coupon"
        description={`Are you sure you want to delete this coupon? This action cannot be undone.`}
        confirmText="Delete Coupon"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteCoupon.isPending}
      />
    </div>
  );
}
