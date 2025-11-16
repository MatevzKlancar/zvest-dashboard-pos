/**
 * Utility functions for exporting data to various formats
 */

import { Transaction, Analytics } from "./types";

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (!data || data.length === 0) {
    return "";
  }

  // If columns not specified, use all keys from first object
  const headers = columns
    ? columns.map(col => col.label)
    : Object.keys(data[0]);

  const keys = columns
    ? columns.map(col => col.key)
    : Object.keys(data[0]);

  // Create CSV header
  const csv = [headers.join(",")];

  // Add data rows
  data.forEach(row => {
    const values = keys.map(key => {
      const value = row[key as keyof T];
      // Handle different types and escape special characters
      if (value === null || value === undefined) {
        return "";
      }
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csv.push(values.join(","));
  });

  return csv.join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(transactions: Transaction[]) {
  const columns = [
    { key: "id" as keyof Transaction, label: "Transaction ID" },
    { key: "pos_invoice_id" as keyof Transaction, label: "Invoice ID" },
    { key: "created_at" as keyof Transaction, label: "Date" },
    { key: "total_amount" as keyof Transaction, label: "Amount" },
    { key: "tax_amount" as keyof Transaction, label: "Tax" },
    { key: "status" as keyof Transaction, label: "Status" },
    { key: "loyalty_points_awarded" as keyof Transaction, label: "Points Awarded" },
  ];

  // Add customer info if available
  const enrichedTransactions = transactions.map(t => ({
    ...t,
    customer_name: t.app_users
      ? `${t.app_users.first_name || ""} ${t.app_users.last_name || ""}`.trim()
      : "",
    customer_phone: t.app_users?.phone_number || "",
  }));

  const extendedColumns = [
    ...columns,
    { key: "customer_name" as keyof typeof enrichedTransactions[0], label: "Customer Name" },
    { key: "customer_phone" as keyof typeof enrichedTransactions[0], label: "Customer Phone" },
  ];

  const csv = arrayToCSV(enrichedTransactions, extendedColumns);
  const filename = `transactions_${new Date().toISOString().split("T")[0]}.csv`;

  downloadCSV(csv, filename);
}

/**
 * Export analytics summary to CSV
 */
export function exportAnalyticsToCSV(analytics: Analytics) {
  const data = [
    { metric: "Total Revenue", value: analytics.total_revenue, period: "All Time" },
    { metric: "Revenue Last 30 Days", value: analytics.revenue_last_30_days, period: "30 Days" },
    { metric: "Revenue Last 7 Days", value: analytics.revenue_last_7_days, period: "7 Days" },
    { metric: "Total Transactions", value: analytics.total_transactions, period: "All Time" },
    { metric: "Transactions Last 30 Days", value: analytics.transactions_last_30_days, period: "30 Days" },
    { metric: "Transactions Last 7 Days", value: analytics.transactions_last_7_days, period: "7 Days" },
    { metric: "Average Transaction Amount", value: analytics.avg_transaction_amount, period: "All Time" },
    { metric: "Unique Customers", value: analytics.unique_customers, period: "All Time" },
    { metric: "Total Coupons", value: analytics.total_coupons, period: "All Time" },
    { metric: "Active Coupons", value: analytics.active_coupons, period: "Current" },
    { metric: "Total Coupon Redemptions", value: analytics.total_coupon_redemptions, period: "All Time" },
    { metric: "Scanned Transactions", value: analytics.scanned_transactions, period: "All Time" },
    { metric: "Scanned Revenue", value: analytics.scanned_revenue, period: "All Time" },
  ];

  const columns = [
    { key: "metric" as keyof typeof data[0], label: "Metric" },
    { key: "value" as keyof typeof data[0], label: "Value" },
    { key: "period" as keyof typeof data[0], label: "Period" },
  ];

  const csv = arrayToCSV(data, columns);
  const filename = `analytics_summary_${new Date().toISOString().split("T")[0]}.csv`;

  downloadCSV(csv, filename);
}

/**
 * Export chart data to CSV
 */
export function exportChartDataToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[]
) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const csv = arrayToCSV(data, columns);
  downloadCSV(csv, `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
}