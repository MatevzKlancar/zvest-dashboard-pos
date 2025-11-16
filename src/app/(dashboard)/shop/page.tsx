"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useShop, useUpdateShop } from "@/hooks/useShop";
import { useQueryClient } from "@tanstack/react-query";
import { ShopUpdateData } from "@/lib/types";
import { Loader2, Store, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createClient } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

export default function ShopPage() {
  const { data: shop, isLoading } = useShop();
  const { user } = useAuth();
  const updateShop = useUpdateShop();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ShopUpdateData>({});

  const [hasChanges, setHasChanges] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // DEBUG: Log shop data to see what's returned
  console.log("Shop loading:", isLoading);
  console.log("Shop data:", shop);
  console.log("Shop image_url:", shop?.image_url);
  console.log("User data:", user);

  // DEBUG: Check image display condition
  console.log("Image display condition:", {
    hasShopImageUrl: !!shop?.image_url,
    hasImagePreview: !!imagePreview,
    shouldShowImage: !!(shop?.image_url || imagePreview),
    actualImageUrl: shop?.image_url,
    imagePreviewValue: imagePreview,
  });

  // DEBUG: Check loyalty type
  console.log("Loyalty type debug:", {
    shopLoyaltyType: shop?.loyalty_type,
    formDataLoyaltyType: formData.loyalty_type,
    isLoading,
  });

  // Initialize form data when shop data loads
  useEffect(() => {
    if (shop && !hasChanges) {
      setFormData({
        name: shop.name || "",
        description: shop.description || "",
        tag: shop.tag || "",
        address: shop.address || "",
        phone: shop.phone || "",
        email: shop.email || "",
        website: shop.website || "",
        shop_category: shop.shop_category,
        brand_color: shop.brand_color || "#4A90E2",
        loyalty_type: "points", // Always set to points
        points_per_euro: shop.points_per_euro || 100,
        qr_display_text: shop.qr_display_text || "",
      });
    }
  }, [shop, hasChanges]);

  const handleInputChange = (field: keyof ShopUpdateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNumericInputChange = (
    field: keyof ShopUpdateData,
    value: string
  ) => {
    const numericValue = value === "" ? undefined : Number(value);
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
    setHasChanges(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Please select a valid image file (JPG, PNG, GIF, or WebP)"
        );
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image first");
      return;
    }

    // Get shop ID from shop data or user auth context
    const shopId = shop?.id || user?.shop_id;

    if (!shopId) {
      toast.error("Shop ID not found. Please try refreshing the page.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();

      // Ensure we have a valid session before proceeding
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Authentication required. Please refresh the page and try again."
        );
      }

      // Create unique filename with timestamp
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `shops/${shopId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("shop-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("shop-images").getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Failed to get public URL");
      }

      // Update shop with the image URL directly via Supabase
      const { error: updateError } = await supabase
        .from("shops")
        .update({ image_url: publicUrl })
        .eq("owner_user_id", session.user.id);

      if (updateError) {
        throw new Error(`Failed to update shop: ${updateError.message}`);
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["shop"] });

      toast.success("Shop image updated successfully");
      setImageFile(null);
      setImagePreview(null);

      // Reset file input
      const fileInput = document.getElementById(
        "image-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById(
      "image-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateShop.mutateAsync(formData);
      setHasChanges(false);
    } catch {
      // Error handling is done in the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Shop Profile</h2>
          <p className="text-gray-600">
            Manage your shop information and settings
          </p>
        </div>
        <div className="flex items-center">
          <Store className="h-8 w-8 text-primary" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your shop&apos;s basic details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter shop name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    handleInputChange("email", e.target.value)
                  }
                  placeholder="shop@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    handleInputChange("phone", e.target.value)
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) =>
                    handleInputChange("website", e.target.value)
                  }
                  placeholder="https://www.yourshop.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your shop and what you offer..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">Shop Tag</Label>
              <Input
                id="tag"
                value={formData.tag || ""}
                onChange={(e) =>
                  handleInputChange("tag", e.target.value)
                }
                placeholder="e.g., Free pizza, Free coffee, 20% off first order"
                maxLength={50}
              />
              <p className="text-sm text-gray-500">
                A short promotional tag to highlight what makes your shop
                special (max 50 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) =>
                  handleInputChange("address", e.target.value)
                }
                placeholder="Your shop's full address..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop_category">Shop Category</Label>
                <Select
                  value={formData.shop_category || ""}
                  onValueChange={(value) =>
                    handleInputChange("shop_category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">🍺 Bar</SelectItem>
                    <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                    <SelectItem value="bakery">🥖 Bakery</SelectItem>
                    <SelectItem value="wellness">💆 Wellness</SelectItem>
                    <SelectItem value="pastry">🧁 Pastry</SelectItem>
                    <SelectItem value="cafe">☕ Cafe</SelectItem>
                    <SelectItem value="retail">🛍️ Retail</SelectItem>
                    <SelectItem value="other">📦 Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Select the category that best describes your business
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_color">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brand_color_picker"
                    value={formData.brand_color || "#4A90E2"}
                    onChange={(e) =>
                      handleInputChange("brand_color", e.target.value)
                    }
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    id="brand_color"
                    type="text"
                    placeholder="#4A90E2"
                    value={formData.brand_color || ""}
                    onChange={(e) =>
                      handleInputChange("brand_color", e.target.value)
                    }
                    maxLength={7}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1"
                  />
                  <div
                    className="h-10 w-10 rounded border flex-shrink-0"
                    style={{
                      backgroundColor: formData.brand_color || "#4A90E2",
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Choose your brand color for app customization (hex format)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shop Image</CardTitle>
            <CardDescription>
              Upload your shop logo or image to display in your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              {/* Current Image Display */}
              <div className="flex-shrink-0">
                {shop?.image_url || imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={imagePreview || shop?.image_url || ""}
                      alt="Shop image"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", e);
                        console.error(
                          "Image src was:",
                          imagePreview || shop?.image_url
                        );
                      }}
                      onLoad={() => {
                        console.log(
                          "Image loaded successfully:",
                          imagePreview || shop?.image_url
                        );
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Store className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-4">
                <div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </Label>
                </div>

                {imageFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploading}
                      size="sm"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Recommended size: 400x400px. Max file size: 5MB.
                  <br />
                  Supported formats: JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Program</CardTitle>
            <CardDescription>
              Configure your customer loyalty program settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loyalty_type">Loyalty Program Type</Label>
              <Select value="points" disabled>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Points System" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Customers earn points for purchases that can be redeemed for
                rewards
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_per_euro">Points per Euro *</Label>
              <Input
                id="points_per_euro"
                type="number"
                min="1"
                max="1000"
                value={formData.points_per_euro || 100}
                onChange={(e) =>
                  handleNumericInputChange("points_per_euro", e.target.value)
                }
                placeholder="100"
                required
              />
              <p className="text-sm text-gray-500">
                How many points customers earn per euro spent (1-1000 points).
                Default: 100 points per euro.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr_display_text">QR Code Display Text</Label>
              <Textarea
                id="qr_display_text"
                value={formData.qr_display_text || ""}
                onChange={(e) =>
                  handleInputChange("qr_display_text", e.target.value)
                }
                placeholder="e.g., Scan for rewards!\nInvoice: {invoice_id}"
                className="min-h-[80px]"
              />
              <p className="text-sm text-gray-500">
                Text that appears above the QR code on customer invoices. Use{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                  {"{invoice_id}"}
                </code>{" "}
                to include the invoice number.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: shop?.name || "",
                description: shop?.description || "",
                tag: shop?.tag || "",
                address: shop?.address || "",
                phone: shop?.phone || "",
                email: shop?.email || "",
                website: shop?.website || "",
                shop_category: shop?.shop_category,
                brand_color: shop?.brand_color || "#4A90E2",
                loyalty_type: "points", // Always set to points
                points_per_euro: shop?.points_per_euro || 100,
                qr_display_text: shop?.qr_display_text || "",
              });
              setHasChanges(false);
              setImageFile(null);
              setImagePreview(null);
              const fileInput = document.getElementById(
                "image-upload"
              ) as HTMLInputElement;
              if (fileInput) fileInput.value = "";
            }}
            disabled={!hasChanges}
          >
            Reset Changes
          </Button>
          <Button type="submit" disabled={!hasChanges || updateShop.isPending}>
            {updateShop.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
