export type ShopCategory =
  | "bar"
  | "restaurant"
  | "bakery"
  | "wellness"
  | "pastry"
  | "cafe"
  | "retail"
  | "other";

export type CustomerType = "platform" | "enterprise" | "external-qr-codes";

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
  customers?: {
    id: string;
    name: string;
    type: CustomerType;
  };
  feature_tags?: string[];
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

export interface ArticleFilters {
  active_only?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface ExternalQRCode {
  id: string;
  shop_id: string;
  article_id: string;
  qr_code: string;
  status: "active" | "used";
  used_at: string | null;
  created_at: string;
  article?: {
    id: string;
    name: string;
  };
}

export interface ExternalQRCodeFilters {
  status?: "active" | "used" | "all";
  limit?: number;
  offset?: number;
  search?: string;
}

export interface BulkImportQRCodeData {
  article_id: string;
  qr_codes: string[];
}

export interface BulkImportResponse {
  success: boolean;
  message: string;
  data: {
    imported_count: number;
    duplicate_count: number;
    error_count: number;
    duplicates: string[];
    errors: Array<{ qr_code: string; error: string }>;
  };
}

export interface ExternalQRCodesResponse {
  success: boolean;
  data: ExternalQRCode[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
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
  is_birthday_only?: boolean;
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
  is_birthday_only?: boolean;
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

export type NotificationCategory = "manual" | "daily_meal" | "specials";

export type NotificationType =
  | "manual"
  | "birthday"
  | "points_earned"
  | "coupon_ready"
  | "daily_meal"
  | "specials";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "error"
  | "dry_run";

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
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  scheduled_for?: string; // ISO 8601
}

export interface BroadcastResultData {
  scheduled: boolean;
  scheduled_id: string | null;
  audience_size: number;
  sent?: number;
  failed?: number;
  dry_run?: number;
  daily_quota_remaining?: number;
  retry_after_seconds?: number;
}

export interface BroadcastNotificationResponse {
  status: number;
  message: string;
  data: BroadcastResultData;
}

export interface AudiencePreview {
  category: NotificationCategory;
  subscribed_count: number;
  total_with_loyalty: number;
  total_subscribers: number;
}

export interface BroadcastQuota {
  daily_limit: number;
  daily_remaining: number;
  hourly_limit: number;
  can_send_now: boolean;
  retry_after_seconds: number;
}

export interface BirthdayCouponSummary {
  id: string;
  name: string;
  type: string;
  is_birthday_only: boolean;
}

export interface BirthdayTemplate {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_active: boolean;
  coupon_id?: string | null;
  coupon?: BirthdayCouponSummary | null;
}

export interface BirthdayTemplateData {
  title: string;
  body: string;
  is_active: boolean;
  data?: Record<string, unknown>;
  coupon_id?: string | null;
}

export interface BirthdayTemplateResponse {
  status?: number;
  success?: boolean;
  message: string;
  data: BirthdayTemplate | null;
}

export interface NotificationAnalytics {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_dry_run?: number;
  delivery_rate: number;
  by_type: Record<string, number>;
  delivery_rate_by_type?: Record<string, number>;
  subscriber_count?: number;
  subscriber_count_by_category?: Record<string, number>;
}

// Scheduled notifications queue
export type ScheduledStatus = "scheduled" | "sent" | "cancelled" | "failed";

export interface ScheduledNotification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  scheduled_for: string;
  status: ScheduledStatus;
  recipient_count: number | null;
  sent_at: string | null;
  created_at: string;
}

export interface ScheduledNotificationsResponse {
  scheduled: ScheduledNotification[];
}

// Weekly plans
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun..6=Sat

export interface WeeklyPlan {
  id: string;
  name: string;
  is_active: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlanEntry {
  id?: string;
  day_of_week: DayOfWeek;
  send_time_local: string; // HH:MM:SS or HH:MM
  notification_type: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_active?: boolean;
}

export interface CreatePlanData {
  name: string;
  timezone?: string;
  is_active?: boolean;
}

export interface UpdatePlanData {
  name?: string;
  timezone?: string;
  is_active?: boolean;
}
