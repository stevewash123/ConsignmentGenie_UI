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
  payout_ready: {
    icon: '💰',
    color: 'blue',
    getTitle: () => 'Payout Ready',
    getMessage: (n) => n.message,
    getRoute: (n, role) => n.payoutId ? `/${role}/payouts/${n.payoutId}` : `/${role}/payouts`,
    allowedRoles: ['consignor']
  },
  consignor_approved: {
    icon: '✅',
    color: 'green',
    getTitle: () => 'Consignor Approved',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/dashboard`,
    allowedRoles: ['consignor']
  },
  consignor_rejected: {
    icon: '❌',
    color: 'red',
    getTitle: () => 'Consignor Rejected',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/dashboard`,
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
  low_inventory_alert: {
    icon: '📦',
    color: 'yellow',
    getTitle: () => 'Low Inventory Alert',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/inventory`,
    allowedRoles: ['owner']
  },
  suggestion_submitted: {
    icon: '💡',
    color: 'blue',
    getTitle: () => 'Suggestion Submitted',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/suggestions`,
    allowedRoles: ['owner']
  },
  owner_invitation_sent: {
    icon: '📧',
    color: 'blue',
    getTitle: () => 'Owner Invitation Sent',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/settings`,
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

  // System notifications
  password_reset: {
    icon: '🔒',
    color: 'blue',
    getTitle: () => 'Password Reset',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner', 'admin']
  },
  account_activated: {
    icon: '✅',
    color: 'green',
    getTitle: () => 'Account Activated',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/dashboard`,
    allowedRoles: ['consignor', 'owner']
  },
  account_deactivated: {
    icon: '❌',
    color: 'red',
    getTitle: () => 'Account Deactivated',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner']
  },

  // Payment notifications
  payment_received: {
    icon: '💰',
    color: 'green',
    getTitle: () => 'Payment Received',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/payments`,
    allowedRoles: ['owner']
  },
  payment_failed: {
    icon: '❌',
    color: 'red',
    getTitle: () => 'Payment Failed',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/payments`,
    allowedRoles: ['owner']
  },
  subscription_expiring: {
    icon: '⏰',
    color: 'yellow',
    getTitle: () => 'Subscription Expiring',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/settings/billing`,
    allowedRoles: ['owner']
  },

  // Integration notifications
  sync_error: {
    icon: '❌',
    color: 'red',
    getTitle: () => 'Sync Error',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/settings/integrations`,
    allowedRoles: ['owner']
  },
  sync_completed: {
    icon: '✅',
    color: 'green',
    getTitle: () => 'Sync Completed',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/settings/integrations`,
    allowedRoles: ['owner']
  },

  // Legacy types
  info: {
    icon: 'ℹ️',
    color: 'blue',
    getTitle: () => 'Information',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner', 'admin', 'customer']
  },
  success: {
    icon: '✅',
    color: 'green',
    getTitle: () => 'Success',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner', 'admin', 'customer']
  },
  warning: {
    icon: '⚠️',
    color: 'yellow',
    getTitle: () => 'Warning',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner', 'admin', 'customer']
  },
  error: {
    icon: '❌',
    color: 'red',
    getTitle: () => 'Error',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner', 'admin', 'customer']
  },
  promotion: {
    icon: '🎉',
    color: 'purple',
    getTitle: () => 'Promotion',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner', 'customer']
  },
  reminder: {
    icon: '🔔',
    color: 'blue',
    getTitle: () => 'Reminder',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['consignor', 'owner', 'admin', 'customer']
  },
  payment: {
    icon: '💳',
    color: 'blue',
    getTitle: () => 'Payment',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/payments`,
    allowedRoles: ['consignor', 'owner']
  },
  inventory: {
    icon: '📦',
    color: 'blue',
    getTitle: () => 'Inventory',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/inventory`,
    allowedRoles: ['owner']
  },
  consignor: {
    icon: '👤',
    color: 'blue',
    getTitle: () => 'Consignor',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/consignors`,
    allowedRoles: ['owner']
  },
  report: {
    icon: '📊',
    color: 'blue',
    getTitle: () => 'Report',
    getMessage: (n) => n.message,
    getRoute: (n, role) => `/${role}/reports`,
    allowedRoles: ['owner', 'admin']
  },
  system_announcement: {
    icon: '📢',
    color: 'blue',
    getTitle: () => 'System Announcement',
    getMessage: (n) => n.message,
    getRoute: () => null,
    allowedRoles: ['owner', 'consignor']
  },

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