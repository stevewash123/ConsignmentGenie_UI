/**
 * Notification type constants that match the backend enum values
 * These are the actual string values sent over the API
 *
 * IMPORTANT: Keep these in sync with the backend NotificationType enum
 * Backend file: ConsignmentGenie.Core/Enums/NotificationType.cs
 */

export const NOTIFICATION_TYPES = {
  // Consignor notifications
  CONSIGNOR_APPROVED: 'consignor_approved',
  CONSIGNOR_REJECTED: 'consignor_rejected',
  ITEM_SOLD: 'item_sold',
  PAYOUT_READY: 'payout_ready',
  PAYOUT_PROCESSED: 'payout_processed',

  // Owner notifications
  NEW_PROVIDER_REQUEST: 'new_provider_request',
  LOW_INVENTORY_ALERT: 'low_inventory_alert',
  DAILY_SALES_SUMMARY: 'daily_sales_summary',
  SUGGESTION_SUBMITTED: 'suggestion_submitted',
  OWNER_INVITATION_SENT: 'owner_invitation_sent',
  DROPOFF_MANIFEST: 'dropoff_manifest',

  // System notifications
  PASSWORD_RESET: 'password_reset',
  WELCOME: 'welcome',
  ACCOUNT_ACTIVATED: 'account_activated',
  ACCOUNT_DEACTIVATED: 'account_deactivated',

  // Payment notifications
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',

  // Integration notifications
  SYNC_ERROR: 'sync_error',
  SYNC_COMPLETED: 'sync_completed',

  // Legacy UI notification types
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  PROMOTION: 'promotion',
  REMINDER: 'reminder',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  PAYMENT: 'payment',
  INVENTORY: 'inventory',
  CONSIGNOR: 'consignor',
  REPORT: 'report'
} as const;

// Create a type from the constant values
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Helper function to get user-friendly labels
export function getNotificationTypeLabel(type: NotificationType): string {
  const labelMap: Record<NotificationType, string> = {
    // Consignor
    'consignor_approved': 'Consignor Approved',
    'consignor_rejected': 'Consignor Rejected',
    'item_sold': 'Item Sold',
    'payout_ready': 'Payout Ready',
    'payout_processed': 'Payout Processed',

    // Owner
    'new_provider_request': 'Consignor Request',
    'low_inventory_alert': 'Low Inventory Alert',
    'daily_sales_summary': 'Daily Sales Summary',
    'suggestion_submitted': 'Suggestion Submitted',
    'owner_invitation_sent': 'Owner Invitation Sent',
    'dropoff_manifest': 'Drop-off Manifests',

    // System
    'password_reset': 'Password Reset',
    'welcome': 'Welcome',
    'account_activated': 'Account Activated',
    'account_deactivated': 'Account Deactivated',

    // Payment
    'payment_received': 'Payment Received',
    'payment_failed': 'Payment Failed',
    'subscription_expiring': 'Subscription Expiring',

    // Integration
    'sync_error': 'Sync Error',
    'sync_completed': 'Sync Completed',

    // Legacy
    'info': 'Information',
    'success': 'Success',
    'warning': 'Warning',
    'error': 'Error',
    'promotion': 'Promotion',
    'reminder': 'Reminder',
    'system_announcement': 'Announcements',
    'payment': 'Payment',
    'inventory': 'Inventory',
    'consignor': 'Consignor',
    'report': 'Report'
  };

  return labelMap[type] || type;
}

// Export individual constants for cleaner imports
export const {
  CONSIGNOR_APPROVED,
  CONSIGNOR_REJECTED,
  ITEM_SOLD,
  PAYOUT_READY,
  PAYOUT_PROCESSED,
  NEW_PROVIDER_REQUEST,
  LOW_INVENTORY_ALERT,
  DAILY_SALES_SUMMARY,
  SUGGESTION_SUBMITTED,
  OWNER_INVITATION_SENT,
  DROPOFF_MANIFEST,
  PASSWORD_RESET,
  WELCOME,
  ACCOUNT_ACTIVATED,
  ACCOUNT_DEACTIVATED,
  PAYMENT_RECEIVED,
  PAYMENT_FAILED,
  SUBSCRIPTION_EXPIRING,
  SYNC_ERROR,
  SYNC_COMPLETED,
  INFO,
  SUCCESS,
  WARNING,
  ERROR,
  PROMOTION,
  REMINDER,
  SYSTEM_ANNOUNCEMENT,
  PAYMENT,
  INVENTORY,
  CONSIGNOR,
  REPORT
} = NOTIFICATION_TYPES;