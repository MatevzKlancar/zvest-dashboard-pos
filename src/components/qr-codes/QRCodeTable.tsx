"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { ExternalQRCode } from "@/lib/types";
import { useDeleteQRCode } from "@/hooks/useExternalQRCodes";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface QRCodeTableProps {
  qrCodes: ExternalQRCode[];
  isLoading?: boolean;
}

export function QRCodeTable({ qrCodes, isLoading = false }: QRCodeTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<ExternalQRCode | null>(null);

  const deleteMutation = useDeleteQRCode();

  const handleDeleteClick = (qrCode: ExternalQRCode) => {
    setSelectedQRCode(qrCode);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQRCode) return;

    await deleteMutation.mutateAsync(selectedQRCode.id);
    setDeleteDialogOpen(false);
    setSelectedQRCode(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No QR codes found</p>
        <p className="text-gray-500 text-sm mt-1">
          Import QR codes to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QR Code</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Used At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.map((qrCode) => (
              <TableRow key={qrCode.id}>
                <TableCell className="font-mono text-sm">
                  {qrCode.qr_code}
                </TableCell>
                <TableCell>
                  {qrCode.article ? (
                    <div>
                      <div className="font-medium">{qrCode.article.name}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {qrCode.status === "active" ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Used
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {qrCode.used_at ? (
                    formatDate(qrCode.used_at)
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(qrCode)}
                    disabled={qrCode.status === "used"}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete QR Code"
        message={`Are you sure you want to delete the QR code "${selectedQRCode?.qr_code}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
