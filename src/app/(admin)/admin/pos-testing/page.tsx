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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  RefreshCw,
  TestTube,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface TestCustomer {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  supabase_user_id: string;
  jwt_token?: string;
  loyalty_accounts: Array<{
    shop_id: string;
    shop_name: string;
    points_balance: number;
  }>;
}

interface TestCoupon {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  description: string;
  points_required: number;
  articles: Array<{
    article_id: string | null;
    article_name: string;
    discount_value: number;
  }>;
}

interface CouponRedemption {
  redemption_id: string;
  qr_code_data: string;
  coupon: TestCoupon;
  expires_at: string;
  valid_for_minutes: number;
  customer: {
    email: string;
    points_balance_before: number;
    points_balance_after: number;
    points_redeemed: number;
  };
}

interface ValidationResult {
  success: boolean;
  message: string;
  data?: {
    redemption_id: string;
    coupon: TestCoupon;
    shop: {
      id: string;
      name: string;
    };
    valid: boolean;
  };
}

export default function POSTestingPage() {
  const [activeTab, setActiveTab] = useState<
    "customer" | "coupon" | "activate" | "validate"
  >("customer");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Test Customer State
  const [customerForm, setCustomerForm] = useState({
    email: `testcustomer${Date.now()}@example.com`,
    password: "TestPassword123!",
    first_name: "Test",
    last_name: "Customer",
    phone: "+1234567890",
    initial_points: 2000,
  });
  const [testCustomer, setTestCustomer] = useState<TestCustomer | null>(null);

  // Test Coupon State
  const [couponForm, setCouponForm] = useState({
    type: "percentage" as "percentage" | "fixed",
    name: "20% Off Coffee",
    description: "Get 20% off any coffee purchase",
    points_required: 500,
    discount_value: 20,
    article_name: "All items",
  });
  const [testCoupons, setTestCoupons] = useState<TestCoupon[]>([]);

  // Activation State
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [redemption, setRedemption] = useState<CouponRedemption | null>(null);

  // Validation State
  const [posApiKey, setPosApiKey] = useState("test-pos-api-key-123");
  const [shopId, setShopId] = useState("");
  const [redemptionId, setRedemptionId] = useState("");
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const setLoadingState = (key: string, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Initialize shop ID on component mount
  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const token = await getShopAdminToken();
        if (!token) return;

        const baseURL =
          process.env.NEXT_PUBLIC_API_URL || window.location.origin;
        const response = await fetch(`${baseURL}/api/shop-admin/shop`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setShopId(result.data.id);
          }
        }
      } catch (error) {
        console.error("Error fetching shop info:", error);
      }
    };

    fetchShopInfo();
  }, []);

  // Load existing coupons
  const loadExistingCoupons = async () => {
    try {
      const token = await getShopAdminToken();
      if (!token) return;

      const baseURL = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const response = await fetch(`${baseURL}/api/shop-admin/coupons`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTestCoupons(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading coupons:", error);
    }
  };

  // Step 1: Create Test Customer
  const createTestCustomer = async () => {
    if (!customerForm.email) {
      toast.error("Email is required");
      return;
    }

    setLoadingState("customer", true);
    try {
      // This would call your admin API endpoint
      const baseURL = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const response = await fetch(
        `${baseURL}/api/admin/testing/create-test-customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAdminToken()}`, // You'll need to implement this
          },
          body: JSON.stringify(customerForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create test customer");
      }

      const result = await response.json();
      setTestCustomer(result.data);
      toast.success("Test customer created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create test customer"
      );
    } finally {
      setLoadingState("customer", false);
    }
  };

  // Step 2: Create Test Coupon
  const createTestCoupon = async () => {
    if (!couponForm.name) {
      toast.error("Coupon name is required");
      return;
    }

    setLoadingState("coupon", true);
    try {
      const couponData = {
        type: couponForm.type,
        name: couponForm.name,
        description: couponForm.description,
        points_required: couponForm.points_required,
        articles: [
          {
            article_id: null,
            article_name: couponForm.article_name,
            discount_value: couponForm.discount_value,
          },
        ],
        is_active: true,
      };

      // This would call your shop-admin API endpoint
      const baseURL = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const response = await fetch(`${baseURL}/api/shop-admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getShopAdminToken()}`, // You'll need to implement this
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        throw new Error("Failed to create test coupon");
      }

      const result = await response.json();
      setTestCoupons((prev) => [...prev, result.data]);
      toast.success("Test coupon created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create test coupon"
      );
    } finally {
      setLoadingState("coupon", false);
    }
  };

  // Step 3: Activate Coupon
  const activateCoupon = async () => {
    if (!selectedCouponId || !jwtToken) {
      toast.error("Please select a coupon and provide JWT token");
      return;
    }

    setLoadingState("activate", true);
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const response = await fetch(
        `${baseURL}/api/app/coupons/${selectedCouponId}/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to activate coupon");
      }

      const result = await response.json();
      setRedemption(result.data);
      setRedemptionId(result.data.redemption_id); // Auto-fill for validation step
      toast.success("Coupon activated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to activate coupon"
      );
    } finally {
      setLoadingState("activate", false);
    }
  };

  // Step 4: Validate POS Coupon
  const validateCoupon = async () => {
    if (!posApiKey || !shopId || !redemptionId) {
      toast.error("Please fill in all POS validation fields");
      return;
    }

    setLoadingState("validate", true);
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const response = await fetch(`${baseURL}/api/pos/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": posApiKey,
        },
        body: JSON.stringify({
          shop_id: shopId,
          redemption_id: redemptionId,
        }),
      });

      const result = await response.json();
      setValidationResult(result);

      if (result.success) {
        toast.success("Coupon validated successfully!");
      } else {
        toast.error(result.message || "Validation failed");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to validate coupon"
      );
    } finally {
      setLoadingState("validate", false);
    }
  };

  // Helper functions
  const getAdminToken = async () => {
    // Get token from the existing auth client
    const { getSupabaseToken } = await import("@/lib/auth");
    const token = await getSupabaseToken();
    console.log("🔍 TOKEN DEBUG - Token:", token ? "Present" : "Missing");
    return token;
  };

  const getShopAdminToken = async () => {
    // For testing, we'll use the admin token
    // In production, this would be a separate shop admin token
    return await getAdminToken();
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (diffMs <= 0) return "Expired";
    return `${diffMinutes}:${diffSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            POS Integration Testing
          </h2>
          <p className="text-gray-600">
            Test the complete coupon flow for POS engineers - from customer
            creation to validation
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          <TestTube className="h-4 w-4 mr-1" />
          Testing Environment
        </Badge>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "customer", label: "1. Create Customer", icon: User },
          { id: "coupon", label: "2. Create Coupon", icon: Zap },
          { id: "activate", label: "3. Activate Coupon", icon: QrCode },
          { id: "validate", label: "4. POS Validation", icon: CheckCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Step 1: Create Test Customer */}
      {activeTab === "customer" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Step 1: Create Test Customer
            </CardTitle>
            <CardDescription>
              Create an authenticated test customer with loyalty points for
              coupon testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="testcustomer@example.com"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={customerForm.password}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={customerForm.first_name}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={customerForm.last_name}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="points">Initial Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={customerForm.initial_points}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      initial_points: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <Button
              onClick={createTestCustomer}
              disabled={loading.customer || !customerForm.email}
              className="w-full"
            >
              {loading.customer ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Test Customer...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Create Test Customer
                </>
              )}
            </Button>

            {testCustomer && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800">
                      ✅ Test Customer Created
                    </h4>
                    <Badge className="bg-green-100 text-green-800">
                      Ready for Testing
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="flex items-center">
                        {testCustomer.email}
                        <button
                          onClick={() =>
                            copyToClipboard(testCustomer.email, "Email")
                          }
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Password:</span>
                      <span className="flex items-center">
                        {customerForm.password}
                        <button
                          onClick={() =>
                            copyToClipboard(customerForm.password, "Password")
                          }
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Customer ID:</span>
                      <span className="font-mono text-xs">
                        {testCustomer.id}
                      </span>
                    </div>
                    {testCustomer.loyalty_accounts.map((account, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium">
                          Points ({account.shop_name}):
                        </span>
                        <span className="font-semibold text-green-700">
                          {account.points_balance}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Next:</strong> Use these credentials with Supabase
                      client to get JWT token, then proceed to activate coupons.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create Test Coupon */}
      {activeTab === "coupon" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Step 2: Create Test Coupon
            </CardTitle>
            <CardDescription>
              Create different types of coupons to test various discount
              scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-type">Coupon Type</Label>
                <Select
                  value={couponForm.type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setCouponForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      Percentage Discount
                    </SelectItem>
                    <SelectItem value="fixed">Fixed Amount Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="coupon-name">Coupon Name</Label>
                <Input
                  id="coupon-name"
                  placeholder="20% Off Coffee"
                  value={couponForm.name}
                  onChange={(e) =>
                    setCouponForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="points-required">Points Required</Label>
                <Input
                  id="points-required"
                  type="number"
                  min="0"
                  value={couponForm.points_required}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      points_required: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="discount-value">
                  Discount Value ({couponForm.type === "percentage" ? "%" : "€"}
                  )
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  min="0"
                  max={couponForm.type === "percentage" ? "100" : undefined}
                  value={couponForm.discount_value}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      discount_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="coupon-description">Description</Label>
              <Textarea
                id="coupon-description"
                placeholder="Get 20% off any coffee purchase"
                value={couponForm.description}
                onChange={(e) =>
                  setCouponForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={createTestCoupon}
                disabled={loading.coupon || !couponForm.name}
                className="flex-1"
              >
                {loading.coupon ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Test Coupon...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Test Coupon
                  </>
                )}
              </Button>
              <Button
                onClick={loadExistingCoupons}
                variant="outline"
                disabled={loading.coupon}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Existing
              </Button>
            </div>

            {testCoupons.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-yellow-800 mb-3">
                    ✅ Test Coupons Created
                  </h4>
                  <div className="space-y-2">
                    {testCoupons.map((coupon, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div>
                          <span className="font-medium">{coupon.name}</span>
                          <Badge
                            className="ml-2"
                            variant={
                              coupon.type === "percentage"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {coupon.type === "percentage"
                              ? `${coupon.articles[0]?.discount_value}%`
                              : `€${coupon.articles[0]?.discount_value}`}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {coupon.points_required} points
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Activate Coupon */}
      {activeTab === "activate" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2 text-purple-600" />
              Step 3: Activate Coupon (Customer)
            </CardTitle>
            <CardDescription>
              Simulate customer activating a coupon with JWT authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Authentication Required</p>
                  <p>
                    You need to sign in with the test customer credentials using
                    Supabase client to get a JWT token.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="jwt-token">Customer JWT Token</Label>
              <Textarea
                id="jwt-token"
                placeholder="Paste JWT token from Supabase auth sign-in..."
                value={jwtToken}
                onChange={(e) => setJwtToken(e.target.value)}
                className="min-h-20"
              />
            </div>

            <div>
              <Label htmlFor="coupon-select">Select Coupon to Activate</Label>
              <Select
                value={selectedCouponId}
                onValueChange={setSelectedCouponId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a coupon..." />
                </SelectTrigger>
                <SelectContent>
                  {testCoupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {coupon.name} ({coupon.points_required} points)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={activateCoupon}
              disabled={loading.activate || !selectedCouponId || !jwtToken}
              className="w-full"
            >
              {loading.activate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activating Coupon...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Activate Coupon
                </>
              )}
            </Button>

            {redemption && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800">
                      ✅ Coupon Activated
                    </h4>
                    <Badge className="bg-purple-100 text-purple-800">
                      Expires in {formatTimeRemaining(redemption.expires_at)}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded border-2 border-dashed border-purple-300">
                      <div className="text-center">
                        <QrCode className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold font-mono text-purple-800">
                          {redemption.qr_code_data}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          QR Code / Redemption ID
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              redemption.qr_code_data,
                              "Redemption ID"
                            )
                          }
                          className="mt-2 text-purple-600 hover:text-purple-800 text-sm"
                        >
                          <Copy className="h-3 w-3 inline mr-1" />
                          Copy Code
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Coupon:</span>
                        <p className="text-gray-700">
                          {redemption.coupon.name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Customer:</span>
                        <p className="text-gray-700">
                          {redemption.customer.email}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Points Before:</span>
                        <p className="text-gray-700">
                          {redemption.customer.points_balance_before}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Points After:</span>
                        <p className="text-gray-700">
                          {redemption.customer.points_balance_after}
                        </p>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-md">
                      <p className="text-xs text-orange-700">
                        <strong>⚠️ Important:</strong> This redemption code
                        expires in {redemption.valid_for_minutes} minutes.
                        Proceed quickly to POS validation!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: POS Validation */}
      {activeTab === "validate" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Step 4: POS Validation
            </CardTitle>
            <CardDescription>
              Test POS system validation of the coupon redemption code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pos-api-key">POS API Key</Label>
                <Input
                  id="pos-api-key"
                  type="password"
                  placeholder="Your POS provider API key"
                  value={posApiKey}
                  onChange={(e) => setPosApiKey(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shop-id">Shop ID</Label>
                <Input
                  id="shop-id"
                  placeholder="Shop UUID"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="redemption-id">
                Redemption ID (from QR code)
              </Label>
              <Input
                id="redemption-id"
                placeholder="A12-345"
                value={redemptionId}
                onChange={(e) => setRedemptionId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: [A-Z]\d{"{2}"}-\d{"{3}"} (e.g., A12-345)
              </p>
            </div>

            <Button
              onClick={validateCoupon}
              disabled={
                loading.validate || !posApiKey || !shopId || !redemptionId
              }
              className="w-full"
            >
              {loading.validate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating Coupon...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate Coupon (POS)
                </>
              )}
            </Button>

            {validationResult && (
              <Card
                className={
                  validationResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4
                      className={`font-semibold ${
                        validationResult.success
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {validationResult.success
                        ? "✅ Validation Successful"
                        : "❌ Validation Failed"}
                    </h4>
                    <Badge
                      className={
                        validationResult.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {validationResult.success ? "Valid" : "Invalid"}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-2">
                    <p
                      className={
                        validationResult.success
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      <strong>Message:</strong> {validationResult.message}
                    </p>

                    {validationResult.success && validationResult.data && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <h5 className="font-semibold mb-2">
                          Discount Instructions for POS:
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Coupon:</span>
                            <p>{validationResult.data.coupon.name}</p>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>
                            <p>{validationResult.data.coupon.type}</p>
                          </div>
                          <div>
                            <span className="font-medium">Shop:</span>
                            <p>{validationResult.data.shop.name}</p>
                          </div>
                          <div>
                            <span className="font-medium">Redemption ID:</span>
                            <p className="font-mono">
                              {validationResult.data.redemption_id}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Apply Discount:</strong>{" "}
                            {validationResult.data.coupon.type === "percentage"
                              ? `${validationResult.data.coupon.articles[0]?.discount_value}% off`
                              : `€${validationResult.data.coupon.articles[0]?.discount_value} off`}{" "}
                            {
                              validationResult.data.coupon.articles[0]
                                ?.article_name
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Testing Tips */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Testing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Authentication Flow:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Create test customer with credentials</li>
                <li>• Use Supabase client to sign in</li>
                <li>• Copy JWT token for API calls</li>
                <li>• Customer identified from token</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Error Scenarios to Test:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Insufficient points</li>
                <li>• Expired redemption codes</li>
                <li>• Invalid API keys</li>
                <li>• Already used codes</li>
              </ul>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-blue-800">
              <strong>Security Note:</strong> This secure flow prevents customer
              impersonation attacks. Only authenticated customers can activate
              their own coupons.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
