import { NotificationType } from '../constants/notification-types';

export type UserRole = 'consignor' | 'owner' | 'admin' | 'customer';

// Use the imported NotificationType from constants
export { NotificationType };

export interface NotificationDto {
  notificationId: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  isImportant: boolean;
  markedImportantAt?: string;
  markedImportantByUserId?: string;
  createdAt: string;
  readAt?: string;

  // Related entity IDs for navigation
  itemId?: string;
  transactionId?: string;
  payoutId?: string;
  providerId?: string;
  organizationId?: string;

  // Modern reference properties
  referenceType?: string;
  referenceId?: string;

  // Legacy properties (deprecated - for backward compatibility only)
  relatedEntityType?: string;
  relatedEntityId?: string;

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
  data: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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