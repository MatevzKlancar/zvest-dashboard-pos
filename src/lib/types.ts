export type ShopCategory =
  | "bar"
  | "restaurant"
  | "bakery"
  | "wellness"
  | "pastry"
  | "cafe"
  | "retail"
  | "other";

export interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  tag?: string;
  shop_category?: ShopCategory;
  brand_color?: string;
  loyalty_type: "points" | "coupons";
  points_per_euro?: number;
  qr_display_text?: string;
  opening_hours?: string;
  social_media?: Record<string, string>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponArticle {
  article_id: string | null;
  article_name: string | null;
  discount_value: number;
}

export interface Coupon {
  id: string;
  shop_id: string;
  code: string;
  type: "percentage" | "fixed" | "free_item" | "points_multiplier";
  articles: CouponArticle[];
  points_required?: number;
  discount_percentage?: number;
  name?: string;
  description?: string;
  terms_conditions?: string;
  category: string;
  min_purchase_amount: number;
  max_discount_amount?: number;
  expires_at?: string;
  usage_limit?: number;
  used_count: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  shop_id: string;
  shop_name: string;
  total_transactions: number;
  transactions_last_30_days: number;
  transactions_last_7_days: number;
  total_revenue: number;
  revenue_last_30_days: number;
  revenue_last_7_days: number;
  avg_transaction_amount: number;
  scanned_transactions: number;
  scanned_transactions_last_30_days: number;
  scanned_transactions_last_7_days: number;
  scanned_revenue: number;
  scanned_revenue_last_30_days: number;
  scanned_revenue_last_7_days: number;
  unique_customers: number;
  total_coupons: number;
  active_coupons: number;
  total_coupon_redemptions: number;
}

export interface Transaction {
  id: string;
  pos_invoice_id: string;
  total_amount: number;
  tax_amount: number;
  status: string;
  loyalty_points_awarded: number;
  created_at: string;
  app_users: {
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
  } | null;
}

export interface TransactionsResponse {
  success: boolean;
  message: string;
  data: Transaction[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface InvitationData {
  shop_name: string;
  customer_name: string;
  customer_email: string;
  owner_name: string;
  owner_email: string;
  token: string;
  is_expired: boolean;
  expires_at?: string;
  created_at: string;
}

export interface ShopUpdateData {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  tag?: string;
  shop_category?: ShopCategory;
  brand_color?: string;
  loyalty_type?: "points" | "coupons";
  points_per_euro?: number;
  qr_display_text?: string;
  opening_hours?: string;
  social_media?: Record<string, string>;
}

export interface CreateCouponData {
  type: "percentage" | "fixed";
  articles: CouponArticle[];
  points_required: number;
  name: string;
  description: string;
  expires_at?: string;
  image_url?: string;
  is_active: boolean;
}

export interface CouponFilters {
  status?: "active" | "inactive";
  type?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionFilters {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface SetupFormData {
  password: string;
  confirmPassword: string;
  shop_name?: string;
  shop_description?: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  loyalty_type?: "points" | "coupons";
}

// ===========================
// NOTIFICATION TYPES
// ===========================

export type NotificationType = "manual" | "birthday" | "points_earned" | "coupon_ready";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed" | "error";

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  status: NotificationStatus;
  sent_at: string;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface NotificationHistory {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationHistoryFilters {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationStatus;
}

export interface BroadcastNotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface BroadcastNotificationResponse {
  success: boolean;
  message: string;
  data: {
    sent: number;
    failed: number;
    total: number;
  };
}

export interface BirthdayTemplate {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_active: boolean;
}

export interface BirthdayTemplateData {
  title: string;
  body: string;
  is_active: boolean;
  data?: Record<string, unknown>;
}

export interface BirthdayTemplateResponse {
  success: boolean;
  message: string;
  data: BirthdayTemplate | null;
}

export interface NotificationAnalytics {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  by_type: {
    manual: number;
    birthday: number;
    points_earned: number;
    coupon_ready: number;
  };
}
