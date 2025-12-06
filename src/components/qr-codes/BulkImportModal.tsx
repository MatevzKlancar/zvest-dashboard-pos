"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useImportQRCodes } from "@/hooks/useExternalQRCodes";
import { Article } from "@/lib/types";
import { Upload, X, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
}

export function BulkImportModal({
  isOpen,
  onClose,
  articles,
}: BulkImportModalProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [importResults, setImportResults] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportQRCodes();

  const qrCodes = qrCodeInput
    .split("\n")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Parse CSV - assume single column with QR codes
      const codes = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      setQrCodeInput(codes.join("\n"));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedArticleId) {
      toast.error("Please select an article");
      return;
    }

    if (qrCodes.length === 0) {
      toast.error("Please add QR codes to import");
      return;
    }

    if (qrCodes.length > 10000) {
      toast.error("Maximum 10,000 QR codes per import");
      return;
    }

    try {
      const result = await importMutation.mutateAsync({
        articleId: selectedArticleId,
        qrCodes,
      });

      setImportResults({
        imported: result.data.imported_count,
        duplicates: result.data.duplicate_count,
        errors: result.data.error_count,
      });
    } catch (error) {
      console.error("Import error:", error);
    }
  };

  const handleClose = () => {
    setSelectedArticleId("");
    setQrCodeInput("");
    setImportResults(null);
    onClose();
  };

  const selectedArticle = articles.find((a) => a.id === selectedArticleId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import QR Codes</DialogTitle>
          <DialogDescription>
            Import QR codes and link them to an article for redemption
          </DialogDescription>
        </DialogHeader>

        {!importResults ? (
          <div className="space-y-6">
            {/* Article Selection */}
            <div className="space-y-2">
              <Label htmlFor="article">Select Article *</Label>
              <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
                <SelectTrigger id="article">
                  <SelectValue placeholder="Choose an article..." />
                </SelectTrigger>
                <SelectContent>
                  {articles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.name} - {(article.price || 0).toFixed(2)}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedArticle && (
                <p className="text-sm text-gray-600">
                  Selected: <strong>{selectedArticle.name}</strong>
                </p>
              )}
            </div>

            {/* QR Code Input */}
            <div className="space-y-2">
              <Label htmlFor="qr-codes">QR Codes</Label>
              <div className="space-y-3">
                <textarea
                  id="qr-codes"
                  className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                  placeholder="Paste QR codes here (one per line)&#10;Example:&#10;SKI-TICKET-001&#10;SKI-TICKET-002&#10;SKI-TICKET-003"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </Button>
                  {qrCodes.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setQrCodeInput("")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Preview */}
            {qrCodes.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>
                      Ready to import <strong>{qrCodes.length}</strong> QR code
                      {qrCodes.length !== 1 ? "s" : ""}
                    </p>
                    {qrCodes.length > 10000 && (
                      <p className="text-red-600 font-medium">
                        Maximum 10,000 codes allowed per import
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm hover:underline">
                        Preview first 5 codes
                      </summary>
                      <ul className="mt-2 space-y-1 font-mono text-xs">
                        {qrCodes.slice(0, 5).map((code, i) => (
                          <li key={i} className="text-gray-600">
                            {code}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Import Results */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Import Complete!</h3>
                <p className="text-gray-600">
                  Your QR codes have been processed
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {importResults.imported}
                  </div>
                  <div className="text-sm text-gray-600">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {importResults.duplicates}
                  </div>
                  <div className="text-sm text-gray-600">Duplicates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {importResults.errors}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              {importResults.duplicates > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {importResults.duplicates} duplicate code
                    {importResults.duplicates !== 1 ? "s were" : " was"} skipped
                  </AlertDescription>
                </Alert>
              )}

              {importResults.errors > 0 && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {importResults.errors} code{importResults.errors !== 1 ? "s" : ""}{" "}
                    failed to import
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!importResults ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  !selectedArticleId ||
                  qrCodes.length === 0 ||
                  qrCodes.length > 10000 ||
                  importMutation.isPending
                }
              >
                {importMutation.isPending ? "Importing..." : "Import QR Codes"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
