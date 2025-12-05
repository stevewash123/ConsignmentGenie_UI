/**
 * Centralized loading keys for the consignor module
 * Using constants prevents typos and enables autocomplete
 */
export const LOADING_KEYS = {
  // Statement Detail
  STATEMENT: 'consignor:statement',
  STATEMENT_PDF: 'consignor:statement-pdf',
  STATEMENT_REGENERATE: 'consignor:statement-regenerate',

  // Statements List
  STATEMENTS_LIST: 'consignor:statements-list',

  // Notifications
  NOTIFICATIONS: 'consignor:notifications',
  NOTIFICATION_MARK_READ: 'consignor:notification-mark-read',
  NOTIFICATION_DELETE: 'consignor:notification-delete',

  // Notification Preferences
  NOTIFICATION_PREFS: 'consignor:notification-prefs',
  NOTIFICATION_PREFS_SAVE: 'consignor:notification-prefs-save',

  // Items
  ITEMS_LIST: 'consignor:items-list',
  ITEM_DETAIL: 'consignor:item-detail',
  ITEM_UPDATE: 'consignor:item-update',
  ITEM_DELETE: 'consignor:item-delete',

  // Payouts
  PAYOUTS_LIST: 'consignor:payouts-list',
  PAYOUT_DETAIL: 'consignor:payout-detail',

  // Sales
  SALES_LIST: 'consignor:sales-list',

  // Profile
  PROFILE: 'consignor:profile',
  PROFILE_UPDATE: 'consignor:profile-update',
} as const;

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS];