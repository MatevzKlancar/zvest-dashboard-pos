import { getSupabaseToken } from "./auth";
import {
  Shop,
  ShopUpdateData,
  Coupon,
  CreateCouponData,
  CouponFilters,
  Analytics,
  TransactionFilters,
  TransactionsResponse,
  InvitationData,
  Article,
} from "./types";

class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      console.log("🔍 API Client - Making request to:", endpoint);
      const token = await getSupabaseToken();
      console.log("🔍 API Client - Token:", token ? "Present" : "Missing");

      const url = `${this.baseURL}${endpoint}`;
      const requestConfig: RequestInit = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage =
            errorJson.message ||
            `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage =
            errorText || `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  // ===========================
  // AUTHENTICATION ENDPOINTS
  // ===========================

  async getAdminProfile(): Promise<{
    success: boolean;
    data: {
      user_type: "admin";
      user_role: "super_admin" | "platform_admin";
      email: string;
      permissions: string[];
      admin_info: {
        id: string;
        first_name: string;
        last_name: string;
        role: string;
      };
    };
  }> {
    return this.request("/api/admin/profile");
  }

  async getShopOwnerProfile(): Promise<{
    success: boolean;
    data: {
      user_type: "shop_owner";
      user_role: "shop_owner";
      email: string;
      permissions: string[];
      shop_info: {
        id: string;
        name: string;
        status: string;
        description?: string;
        address?: string;
        phone?: string;
        website?: string;
      };
    };
  }> {
    return this.request("/api/shop/profile");
  }

  async getAppUserProfile(): Promise<{
    success: boolean;
    data: {
      user_type: "app_user";
      email: string;
      permissions: string[];
      app_user_info: {
        id: string;
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        loyalty_points: number;
        total_transactions: number;
        preferred_shop_id?: string;
      };
    };
  }> {
    return this.request("/api/app-user/profile");
  }

  // ===========================
  // ADMIN ENDPOINTS
  // ===========================

  async createB2BCustomer(data: {
    business_name: string;
    contact_email: string;
    contact_phone?: string;
    owner_email: string;
    owner_first_name: string;
    owner_last_name: string;
    pos_provider_name: string;
    customer_type?: "platform" | "enterprise";
    subscription_tier?: "basic" | "premium" | "enterprise";
    loyalty_type?: "points" | "coupons";
  }): Promise<{ data: { setup_url: string; customer_id: string } }> {
    return this.request("/api/admin/onboard-simple", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCustomers(params?: {
    limit?: number;
    offset?: number;
    type?: "platform" | "enterprise";
    search?: string;
  }): Promise<{ data: Record<string, unknown>[] }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString());
      });
    }
    return this.request(`/api/admin/customers?${query}`);
  }

  async getPosProviders(): Promise<{ data: Record<string, unknown>[] }> {
    return this.request("/api/admin/pos-providers");
  }

  // ===========================
  // SETUP ENDPOINTS (PUBLIC)
  // ===========================

  async getInvitation(token: string): Promise<InvitationData> {
    return this.request(`/api/admin/invitation/${token}`);
  }

  async completeShopSetup(data: {
    invitation_token: string;
    password: string;
    shop_details?: {
      description?: string;
      address?: string;
      phone?: string;
      website?: string;
      opening_hours?: string;
      loyalty_type?: "points" | "coupons";
    };
  }): Promise<Record<string, unknown>> {
    return this.request("/api/admin/complete-shop-setup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ===========================
  // SHOP ENDPOINTS
  // ===========================

  async getShop(): Promise<Shop> {
    const result = await this.request<{ data: Shop }>("/api/shop-admin/shop");
    console.log("🔍 API Client - Raw shop response:", result);
    console.log(
      "🔍 API Client - Shop image_url from response:",
      result?.data?.image_url
    );
    // Extract the actual shop data from the wrapper
    return result.data;
  }

  async updateShop(data: ShopUpdateData): Promise<Shop> {
    // Filter out empty strings to avoid validation errors on optional URL fields
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    return this.request("/api/shop-admin/shop", {
      method: "PUT",
      body: JSON.stringify(cleanedData),
    });
  }

  async updateShopImage(image_url: string): Promise<Shop> {
    return this.request("/api/shop-admin/shop/image", {
      method: "POST",
      body: JSON.stringify({ image_url }),
    });
  }

  async getAnalytics(): Promise<Analytics> {
    const result = await this.request<{ data: Analytics } | Analytics>("/api/shop-admin/analytics");
    // Extract the actual analytics data from the wrapper
    return 'data' in result ? result.data : result;
  }

  // New Analytics Endpoints
  async getDashboardWidgets(): Promise<Record<string, unknown>> {
    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>("/api/shop-admin/dashboard/widgets");
    return 'data' in result ? result.data : result;
  }

  async getCustomerAnalytics(period: string = "30d"): Promise<Record<string, unknown>> {
    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>(
      `/api/shop-admin/analytics/customers?period=${period}`
    );
    return 'data' in result ? result.data : result;
  }

  async getCouponAnalytics(period: string = "30d"): Promise<Record<string, unknown>> {
    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>(
      `/api/shop-admin/analytics/coupons?period=${period}`
    );
    return 'data' in result ? result.data : result;
  }

  async getBusinessTrends(period: string = "30d"): Promise<Record<string, unknown>> {
    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>(
      `/api/shop-admin/analytics/trends?period=${period}`
    );
    return 'data' in result ? result.data : result;
  }

  async getProductAnalytics(params?: {
    period?: string;
    category?: string;
    sort_by?: "units_sold" | "revenue" | "last_sold";
    limit?: number;
  }): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.category) query.set("category", params.category);
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.limit) query.set("limit", params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>(
      `/api/shop-admin/analytics/products${queryString}`
    );
    return 'data' in result ? result.data : result;
  }

  async getTopCustomers(params?: {
    sort_by?: "total_spent" | "visit_count" | "points_balance";
    limit?: number;
  }): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.limit) query.set("limit", params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>(
      `/api/shop-admin/customers/top${queryString}`
    );
    return 'data' in result ? result.data : result;
  }

  async getCustomerSegments(): Promise<Record<string, unknown>> {
    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>("/api/shop-admin/customers/segments");
    return 'data' in result ? result.data : result;
  }

  async getArticles(params?: {
    active_only?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    if (params?.active_only !== undefined)
      query.set("active_only", params.active_only.toString());
    if (params?.category) query.set("category", params.category);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await this.request<{ data: Record<string, unknown> } | Record<string, unknown>>(
      `/api/shop-admin/articles${queryString}`
    );
    return 'data' in result ? result.data : result;
  }

  async getTransactions(
    params?: TransactionFilters
  ): Promise<TransactionsResponse> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString());
      });
    }
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/api/shop-admin/transactions${queryString}`);
  }

  // ===========================
  // COUPON ENDPOINTS
  // ===========================

  async getCoupons(params?: CouponFilters): Promise<Coupon[]> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
    const result = await this.request<{ data: Coupon[] } | Coupon[]>(
      `/api/shop-admin/coupons${queryString}`
    );
    // Extract the actual coupon data from the wrapper
    return 'data' in result ? result.data : result;
  }

  async getCoupon(id: string): Promise<Coupon> {
    return this.request(`/api/shop-admin/coupons/${id}`);
  }

  async createCoupon(data: CreateCouponData): Promise<Coupon> {
    const result = await this.request<{ data: Coupon } | Coupon>("/api/shop-admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Extract the actual coupon data from the wrapper
    return 'data' in result ? result.data : result;
  }

  async updateCoupon(
    id: string,
    data: Partial<CreateCouponData>
  ): Promise<Coupon> {
    return this.request(`/api/shop-admin/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCoupon(id: string): Promise<void> {
    return this.request(`/api/shop-admin/coupons/${id}`, {
      method: "DELETE",
    });
  }

  // ===========================
  // ARTICLE ENDPOINTS
  // ===========================

  async getArticles(params?: { active_only?: boolean; limit?: number }): Promise<Article[]> {
    // Default to a high limit to get all articles unless specified otherwise
    const queryParams = { limit: 1000, ...params };
    const queryString = `?${new URLSearchParams(queryParams as Record<string, string>)}`;
    const result = await this.request<{ data: Article[] } | Article[]>(
      `/api/shop-admin/articles${queryString}`
    );
    // Extract the actual article data from the wrapper
    return 'data' in result ? result.data : result;
  }
}

export const apiClient = new ApiClient();
