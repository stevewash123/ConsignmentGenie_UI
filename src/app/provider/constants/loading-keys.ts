/**
 * Centralized loading keys for the provider module
 * Using constants prevents typos and enables autocomplete
 */
export const LOADING_KEYS = {
  // Statement Detail
  STATEMENT: 'provider:statement',
  STATEMENT_PDF: 'provider:statement-pdf',
  STATEMENT_REGENERATE: 'provider:statement-regenerate',

  // Statements List
  STATEMENTS_LIST: 'provider:statements-list',

  // Notifications
  NOTIFICATIONS: 'provider:notifications',
  NOTIFICATION_MARK_READ: 'provider:notification-mark-read',
  NOTIFICATION_DELETE: 'provider:notification-delete',

  // Notification Preferences
  NOTIFICATION_PREFS: 'provider:notification-prefs',
  NOTIFICATION_PREFS_SAVE: 'provider:notification-prefs-save',

  // Items
  ITEMS_LIST: 'provider:items-list',
  ITEM_DETAIL: 'provider:item-detail',
  ITEM_UPDATE: 'provider:item-update',
  ITEM_DELETE: 'provider:item-delete',

  // Payouts
  PAYOUTS_LIST: 'provider:payouts-list',
  PAYOUT_DETAIL: 'provider:payout-detail',

  // Sales
  SALES_LIST: 'provider:sales-list',

  // Profile
  PROFILE: 'provider:profile',
  PROFILE_UPDATE: 'provider:profile-update',
} as const;

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS];