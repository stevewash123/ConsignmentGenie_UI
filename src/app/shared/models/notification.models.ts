export type UserRole = 'consignor' | 'owner' | 'admin' | 'customer';

export type NotificationType =
  // consignor types
  | 'item_sold' | 'payout_processed' | 'item_price_changed' | 'item_returned'
  | 'item_expired' | 'statement_ready' | 'welcome'
  // Owner types
  | 'new_provider_request' | 'provider_approved' | 'daily_sales_summary'
  | 'payout_due_reminder' | 'low_inventory_alert' | 'subscription_reminder'
  | 'subscription_failed' | 'square_sync_error' | 'qb_sync_error' | 'system_announcement'
  // Admin types
  | 'new_owner_request' | 'owner_approved' | 'subscription_created'
  | 'subscription_cancelled' | 'system_error' | 'daily_platform_summary'
  // Customer types
  | 'order_confirmed' | 'order_ready_pickup' | 'order_shipped';

export interface NotificationDto {
  notificationId: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;

  // Related entity IDs for navigation
  itemId?: string;
  transactionId?: string;
  payoutId?: string;
  providerId?: string;
  organizationId?: string;
  referenceType?: string;
  referenceId?: string;

  // Computed properties
  timeAgo: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationQueryParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  type?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface NotificationPreferencesDto {
  emailEnabled: boolean;
  digestMode: 'instant' | 'daily' | 'weekly';
  digestTime?: string;
  digestDay?: number;
  payoutPendingThreshold?: number;

  // Per-type preferences
  emailItemSold: boolean;
  emailPayoutProcessed: boolean;
  emailPayoutPending: boolean;
  emailStatementReady: boolean;
  emailAccountUpdate: boolean;
  emailItemExpired?: boolean;
  emailItemPriceChanged?: boolean;
  emailItemReturned?: boolean;

  // Owner-specific
  emailNewProviderRequest?: boolean;
  emailDailySalesSummary?: boolean;
  emailPayoutDueReminder?: boolean;
  emailSubscriptionReminder?: boolean;
  emailSyncError?: boolean;

  // Admin-specific
  emailNewOwnerRequest?: boolean;
  emailSubscriptionEvents?: boolean;
  emailSystemErrors?: boolean;
  emailDailyPlatformSummary?: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  emailEnabled: boolean;
  digestMode: 'instant' | 'daily' | 'weekly';
  digestTime?: string;
  digestDay?: number;
  payoutPendingThreshold?: number;

  emailItemSold?: boolean;
  emailPayoutProcessed?: boolean;
  emailPayoutPending?: boolean;
  emailStatementReady?: boolean;
  emailAccountUpdate?: boolean;
  emailItemExpired?: boolean;
  emailItemPriceChanged?: boolean;
  emailItemReturned?: boolean;

  emailNewProviderRequest?: boolean;
  emailDailySalesSummary?: boolean;
  emailPayoutDueReminder?: boolean;
  emailSubscriptionReminder?: boolean;
  emailSyncError?: boolean;

  emailNewOwnerRequest?: boolean;
  emailSubscriptionEvents?: boolean;
  emailSystemErrors?: boolean;
  emailDailyPlatformSummary?: boolean;
}