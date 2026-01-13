import { NotificationType, UserRole, NotificationDto } from '../models/notification.models';

export interface NotificationTypeConfig {
  icon: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange';
  getTitle: (notification: NotificationDto) => string;
  getMessage: (notification: NotificationDto) => string;
  getRoute: (notification: NotificationDto, role: UserRole) => string | null;
  allowedRoles: UserRole[];
}

export const notificationConfig: Record<NotificationType, NotificationTypeConfig> = {
  // consignor types
  item_sold: {
    icon: '🛒',
    color: 'green',
    getTitle: () => 'Item Sold! 🎉',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.transactionId ? `/${role}/sales/${n.transactionId}` : null,
    allowedRoles: ['consignor', 'owner']
  },
  payout_processed: {
    icon: '💰',
    color: 'green',
    getTitle: () => 'Payout Processed',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.payoutId ? `/${role}/payouts/${n.payoutId}` : `/${role}/payouts`,
    allowedRoles: ['consignor']
  },
  item_price_changed: {
    icon: '💲',
    color: 'blue',
    getTitle: () => 'Price Updated',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.itemId ? `/${role}/items/${n.itemId}` : null,
    allowedRoles: ['consignor']
  },
  item_returned: {
    icon: '🔄',
    color: 'yellow',
    getTitle: () => 'Item Returned',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.itemId ? `/${role}/items/${n.itemId}` : null,
    allowedRoles: ['consignor']
  },
  item_expired: {
    icon: '⏰',
    color: 'yellow',
    getTitle: () => 'Item Expired',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.itemId ? `/${role}/items/${n.itemId}` : null,
    allowedRoles: ['consignor']
  },
  statement_ready: {
    icon: '📄',
    color: 'blue',
    getTitle: () => 'Statement Ready',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/statements`,
    allowedRoles: ['consignor']
  },
  welcome: {
    icon: '🎉',
    color: 'green',
    getTitle: () => 'Welcome!',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/dashboard`,
    allowedRoles: ['consignor', 'owner', 'customer']
  },

  // Owner types
  new_provider_request: {
    icon: '👤',
    color: 'blue',
    getTitle: () => 'New consignor Request',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.providerId ? `/${role}/consignors/${n.providerId}` : `/${role}/consignors`,
    allowedRoles: ['owner']
  },
  provider_approved: {
    icon: '✅',
    color: 'green',
    getTitle: () => 'consignor Approved',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.providerId ? `/${role}/consignors/${n.providerId}` : `/${role}/consignors`,
    allowedRoles: ['owner']
  },
  dropoff_manifest: {
    icon: '📦',
    color: 'blue',
    getTitle: () => 'New Drop-off Manifest',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.referenceId ? `/${role}/dropoff-requests/${n.referenceId}` : null,
    allowedRoles: ['owner']
  },
  daily_sales_summary: {
    icon: '📊',
    color: 'blue',
    getTitle: () => 'Daily Sales Summary',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/sales`,
    allowedRoles: ['owner']
  },
  payout_due_reminder: {
    icon: '⚠️',
    color: 'yellow',
    getTitle: () => 'Payout Due',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/payouts`,
    allowedRoles: ['owner']
  },
  low_inventory_alert: {
    icon: '📦',
    color: 'yellow',
    getTitle: () => 'Low Inventory Alert',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/inventory`,
    allowedRoles: ['owner']
  },
  subscription_reminder: {
    icon: '💳',
    color: 'blue',
    getTitle: () => 'Subscription Reminder',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/settings/billing`,
    allowedRoles: ['owner']
  },
  subscription_failed: {
    icon: '🚨',
    color: 'red',
    getTitle: () => 'Subscription Payment Failed',
    getMessage: (n) => n.message,
    getRoute: (n, role) => role === 'admin' ?
      (n.referenceId ? `/${role}/subscriptions/${n.referenceId}` : `/${role}/subscriptions`) :
      `/${role}/settings/billing`,
    allowedRoles: ['owner', 'admin']
  },
  square_sync_error: {
    icon: '❌',
    color: 'red',
    getTitle: () => 'Square Sync Error',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/settings/integrations`,
    allowedRoles: ['owner']
  },
  qb_sync_error: {
    icon: '❌',
    color: 'red',
    getTitle: () => 'QuickBooks Sync Error',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/settings/integrations`,
    allowedRoles: ['owner']
  },
  system_announcement: {
    icon: '📢',
    color: 'blue',
    getTitle: () => 'System Announcement',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['owner', 'consignor']
  },

  // Admin types
  new_owner_request: {
    icon: '🏪',
    color: 'blue',
    getTitle: () => 'New Shop Registration',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.organizationId ? `/${role}/owners/${n.organizationId}` : `/${role}/owners`,
    allowedRoles: ['admin']
  },
  owner_approved: {
    icon: '✅',
    color: 'green',
    getTitle: () => 'Shop Approved',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.organizationId ? `/${role}/owners/${n.organizationId}` : `/${role}/owners`,
    allowedRoles: ['admin']
  },
  subscription_created: {
    icon: '💳',
    color: 'green',
    getTitle: () => 'New Subscription',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.referenceId ? `/${role}/subscriptions/${n.referenceId}` : `/${role}/subscriptions`,
    allowedRoles: ['admin']
  },
  subscription_cancelled: {
    icon: '💔',
    color: 'gray',
    getTitle: () => 'Subscription Cancelled',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.organizationId ? `/${role}/owners/${n.organizationId}` : `/${role}/owners`,
    allowedRoles: ['admin']
  },
  system_error: {
    icon: '🚨',
    color: 'red',
    getTitle: () => 'System Error',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/system/errors`,
    allowedRoles: ['admin']
  },
  daily_platform_summary: {
    icon: '📈',
    color: 'blue',
    getTitle: () => 'Daily Platform Summary',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/analytics`,
    allowedRoles: ['admin']
  },
  new_owner_signup: {
    icon: '🏪',
    color: 'blue',
    getTitle: () => 'New Shop Signup',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.organizationId ? `/${role}/owners/${n.organizationId}` : `/${role}/owners`,
    allowedRoles: ['admin']
  },
  support_ticket_opened: {
    icon: '🎫',
    color: 'yellow',
    getTitle: () => 'Support Ticket Opened',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.referenceId ? `/${role}/support/${n.referenceId}` : `/${role}/support`,
    allowedRoles: ['admin']
  },
  support_ticket_assigned: {
    icon: '🎫',
    color: 'yellow',
    getTitle: () => 'Support Ticket Assigned',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.referenceId ? `/${role}/support/${n.referenceId}` : `/${role}/support`,
    allowedRoles: ['admin']
  },
  trial_expiring: {
    icon: '⏰',
    color: 'orange',
    getTitle: () => 'Trial Expiring',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.organizationId ? `/${role}/owners/${n.organizationId}` : `/${role}/owners`,
    allowedRoles: ['admin']
  },

  // Customer types
  order_confirmed: {
    icon: '✅',
    color: 'green',
    getTitle: () => 'Order Confirmed',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.referenceId ? `/${role}/orders/${n.referenceId}` : `/${role}/orders`,
    allowedRoles: ['customer']
  },
  order_ready_pickup: {
    icon: '📦',
    color: 'blue',
    getTitle: () => 'Ready for Pickup',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.referenceId ? `/${role}/orders/${n.referenceId}` : `/${role}/orders`,
    allowedRoles: ['customer']
  },
  order_shipped: {
    icon: '🚚',
    color: 'blue',
    getTitle: () => 'Order Shipped',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.referenceId ? `/${role}/orders/${n.referenceId}` : `/${role}/orders`,
    allowedRoles: ['customer']
  }
};

export function getNotificationConfig(type: NotificationType): NotificationTypeConfig | undefined {
  return notificationConfig[type];
}

export function getNotificationIcon(type: NotificationType): string {
  return notificationConfig[type]?.icon || '🔔';
}

export function getNotificationIconClass(type: NotificationType): string {
  const color = notificationConfig[type]?.color || 'gray';
  const colorClasses: Record<string, string> = {
    green: 'item-sold',
    blue: 'statement-ready',
    yellow: 'payout-pending',
    red: 'payout-pending',
    orange: 'payout-pending',
    purple: 'default',
    gray: 'default'
  };
  return colorClasses[color] || 'default';
}