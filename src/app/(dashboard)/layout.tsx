"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute shopOwnerOnly={true}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
