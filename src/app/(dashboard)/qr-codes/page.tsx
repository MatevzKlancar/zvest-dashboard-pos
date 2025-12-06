"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeStats } from "@/components/qr-codes/QRCodeStats";
import { QRCodeTable } from "@/components/qr-codes/QRCodeTable";
import { BulkImportModal } from "@/components/qr-codes/BulkImportModal";
import { useExternalQRCodes } from "@/hooks/useExternalQRCodes";
import { useArticles } from "@/hooks/useArticles";
import { useCustomerType } from "@/hooks/useCustomerType";
import { Upload, Search, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "used";

export default function QRCodesPage() {
  const router = useRouter();
  const { isExternalQRCustomer, isLoading: customerTypeLoading } = useCustomerType();
  const { data: articles, isLoading: articlesLoading } = useArticles();

  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { data: qrCodesResponse, isLoading: qrCodesLoading } = useExternalQRCodes(
    selectedArticleId || null,
    {
      status: statusFilter,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      search: searchQuery || undefined,
    }
  );

  // Redirect non-external-qr customers
  if (!customerTypeLoading && !isExternalQRCustomer) {
    toast.error("This feature is only available for external QR code customers");
    router.push("/dashboard");
    return null;
  }

  const qrCodes = qrCodesResponse?.data || [];
  const totalCodes = qrCodesResponse?.meta?.total || 0;
  const totalPages = Math.ceil(totalCodes / itemsPerPage);

  // Calculate stats from all QR codes (not just current page)
  const stats = useMemo(() => {
    if (!qrCodesResponse) {
      return { total: 0, active: 0, used: 0 };
    }

    // Note: These stats should ideally come from a separate API endpoint
    // For now, we'll use the meta total and estimate based on current page
    const activeCodes = qrCodes.filter((code) => code.status === "active").length;
    const usedCodes = qrCodes.filter((code) => code.status === "used").length;

    return {
      total: totalCodes,
      active: statusFilter === "active" ? totalCodes : activeCodes,
      used: statusFilter === "used" ? totalCodes : usedCodes,
    };
  }, [qrCodesResponse, qrCodes, totalCodes, statusFilter]);

  const selectedArticle = articles?.find((a) => a.id === selectedArticleId);

  if (customerTypeLoading || articlesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">QR Code Management</h2>
          <p className="text-gray-600">
            Import and manage external QR codes for article redemptions
          </p>
        </div>
        <Button onClick={() => setImportModalOpen(true)} disabled={!articles || articles.length === 0}>
          <Upload className="h-4 w-4 mr-2" />
          Import QR Codes
        </Button>
      </div>

      {/* Article Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Article</CardTitle>
          <CardDescription>
            Choose an article to view its associated QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles && articles.length > 0 ? (
            <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Select an article..." />
              </SelectTrigger>
              <SelectContent>
                {articles.map((article) => (
                  <SelectItem key={article.id} value={article.id}>
                    {article.name} - {(article.price || 0).toFixed(2)}€
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No articles found. Contact support to add articles.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Only show the rest if an article is selected */}
      {selectedArticleId && selectedArticle && (
        <>
          {/* Statistics */}
          <QRCodeStats
            totalCodes={stats.total}
            activeCodes={stats.active}
            usedCodes={stats.used}
            isLoading={qrCodesLoading}
          />

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="used">Used</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search QR codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* QR Codes Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                QR Codes for {selectedArticle.name}
              </CardTitle>
              <CardDescription>
                {totalCodes} code{totalCodes !== 1 ? "s" : ""} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRCodeTable qrCodes={qrCodes} isLoading={qrCodesLoading} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, totalCodes)} of {totalCodes} codes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && <span className="px-2">...</span>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Import Modal */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        articles={articles || []}
      />
    </div>
  );
}
