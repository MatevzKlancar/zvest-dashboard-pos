"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateCoupon } from "@/hooks/useCoupons";
import { useArticles } from "@/hooks/useArticles";
import { CreateCouponData, CouponArticle } from "@/lib/types";
import { Loader2, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface CreateCouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCouponModal({
  open,
  onOpenChange,
}: CreateCouponModalProps) {
  const [formData, setFormData] = useState<CreateCouponData>({
    type: "percentage",
    articles: [
      {
        article_id: null,
        article_name: null,
        discount_value: 0.01,
      },
    ],
    points_required: 1,
    name: "",
    description: "",
    expires_at: "",
    image_url: "",
    is_active: true,
  });

  const [couponScope, setCouponScope] = useState<"global" | "article">(
    "global"
  );

  const createCoupon = useCreateCoupon();
  const { data: articles, isLoading: articlesLoading } = useArticles({
    active_only: true,
  });

  const handleInputChange = (field: keyof CreateCouponData, value: any) => {
    setFormData((prev: CreateCouponData) => ({ ...prev, [field]: value }));
  };

  const handleArticleChange = (
    index: number,
    field: keyof CouponArticle,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      articles: prev.articles.map((article, i) =>
        i === index ? { ...article, [field]: value } : article
      ),
    }));
  };

  const addArticle = () => {
    setFormData((prev) => ({
      ...prev,
      articles: [
        ...prev.articles,
        {
          article_id: null,
          article_name: null,
          discount_value: formData.type === "fixed" ? 0.01 : 1,
        },
      ],
    }));
  };

  const removeArticle = (index: number) => {
    if (formData.articles.length > 1) {
      setFormData((prev) => ({
        ...prev,
        articles: prev.articles.filter((_, i) => i !== index),
      }));
    }
  };

  const handleArticleSelection = (index: number, articleId: string) => {
    const selectedArticle = articles?.find((a) => a.id === articleId);
    if (selectedArticle) {
      handleArticleChange(index, "article_id", articleId);
      handleArticleChange(index, "article_name", selectedArticle.name);
    } else {
      // Global coupon
      handleArticleChange(index, "article_id", null);
      handleArticleChange(index, "article_name", null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Coupon name is required");
      return;
    }

    if (formData.points_required <= 0) {
      toast.error("Points required must be greater than 0");
      return;
    }

    // Validate articles
    for (let i = 0; i < formData.articles.length; i++) {
      const article = formData.articles[i];
      const minValue = formData.type === "fixed" ? 0.01 : 1;
      if (article.discount_value < minValue) {
        toast.error(
          formData.type === "fixed"
            ? `Discount amount for article ${i + 1} must be at least 0.01€`
            : `Discount value for article ${i + 1} must be at least 1`
        );
        return;
      }
      if (formData.type === "percentage" && article.discount_value > 100) {
        toast.error(
          `Percentage discount for article ${i + 1} cannot exceed 100%`
        );
        return;
      }
    }

    // Prepare data for submission
    const submitData: CreateCouponData = {
      type: formData.type,
      articles: formData.articles,
      points_required: formData.points_required,
      name: formData.name,
      description: formData.description,
      is_active: formData.is_active,
    };

    // Add expires_at only if provided (convert to ISO format)
    if (formData.expires_at) {
      submitData.expires_at = `${formData.expires_at}:00.000Z`;
    }

    // Add image_url only if provided
    if (formData.image_url && formData.image_url.trim()) {
      submitData.image_url = formData.image_url.trim();
    }

    try {
      await createCoupon.mutateAsync(submitData);
      onOpenChange(false);
      // Reset form
      setFormData({
        type: "percentage",
        articles: [
          {
            article_id: null,
            article_name: null,
            discount_value: 0.01,
          },
        ],
        points_required: 1,
        name: "",
        description: "",
        expires_at: "",
        image_url: "",
        is_active: true,
      });
      setCouponScope("global");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Coupon</DialogTitle>
          <DialogDescription>
            Create a simple coupon for your loyalty program
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Coupon Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "percentage" | "fixed") =>
                handleInputChange("type", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage Discount</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Coupon Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Summer Discount, Welcome Bonus"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points_required">Points Required *</Label>
            <Input
              id="points_required"
              type="number"
              min="1"
              value={formData.points_required}
              onChange={(e) =>
                handleInputChange("points_required", Number(e.target.value))
              }
              placeholder="100"
              required
            />
          </div>

          {/* Articles Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Articles & Discounts *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addArticle}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Article
              </Button>
            </div>

            <div className="space-y-3">
              {formData.articles.map((article, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Article {index + 1}
                    </span>
                    {formData.articles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArticle(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Article</Label>
                      <Select
                        value={article.article_id || "global"}
                        onValueChange={(value) =>
                          handleArticleSelection(
                            index,
                            value === "global" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select article or global" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">
                            Global (applies to any purchase)
                          </SelectItem>
                          {articlesLoading ? (
                            <SelectItem value="" disabled>
                              Loading articles...
                            </SelectItem>
                          ) : articles && articles.length > 0 ? (
                            articles.map((availableArticle) => (
                              <SelectItem
                                key={availableArticle.id}
                                value={availableArticle.id}
                              >
                                {availableArticle.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No articles available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {formData.type === "percentage"
                          ? "Discount %"
                          : "Discount Amount"}{" "}
                        *
                      </Label>
                      <Input
                        type="number"
                        min={formData.type === "fixed" ? "0.01" : "1"}
                        step={formData.type === "fixed" ? "0.01" : "1"}
                        max={formData.type === "percentage" ? "100" : undefined}
                        value={article.discount_value}
                        onChange={(e) =>
                          handleArticleChange(
                            index,
                            "discount_value",
                            Number(e.target.value)
                          )
                        }
                        placeholder={
                          formData.type === "percentage" ? "10" : "0.05"
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what this coupon offers..."
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiry Date</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => handleInputChange("expires_at", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange("image_url", e.target.value)}
              placeholder="https://example.com/coupon-image.jpg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) =>
                handleInputChange("is_active", checked)
              }
            />
            <Label htmlFor="is_active">Active (visible to customers)</Label>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCoupon.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCoupon.isPending}>
              {createCoupon.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Coupon
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
