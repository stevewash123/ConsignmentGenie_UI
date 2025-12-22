import {
  notificationConfig,
  getNotificationConfig,
  getNotificationIcon,
  getNotificationIconClass
} from './notification.config';
import { NotificationType, UserRole, NotificationDto } from '../models/notification.models';

describe('NotificationConfig', () => {
  const mockNotification: NotificationDto = {
    notificationId: '1',
    role: 'consignor',
    type: 'item_sold',
    title: 'Item Sold',
    message: 'Test notification message',
    isRead: false,
    createdAt: '2024-01-01T00:00:00Z',
    timeAgo: '1 hour ago',
    itemId: 'item-1',
    transactionId: 'txn-1',
    providerId: 'consignor-1',
    organizationId: 'org-1',
    referenceId: 'ref-1'
  };

  describe('notificationConfig object', () => {
    it('should contain all required notification types', () => {
      const requiredTypes: NotificationType[] = [
        'item_sold',
        'payout_processed',
        'welcome',
        'new_provider_request',
        'daily_sales_summary',
        'new_owner_request',
        'system_error',
        'order_confirmed'
      ];

      requiredTypes.forEach(type => {
        expect(notificationConfig[type]).toBeDefined();
        expect(typeof notificationConfig[type]).toBe('object');
      });
    });

    it('should have valid config structure for each notification type', () => {
      Object.keys(notificationConfig).forEach(key => {
        const config = notificationConfig[key as NotificationType];
        expect(config.icon).toBeDefined();
        expect(typeof config.icon).toBe('string');
        expect(config.color).toBeDefined();
        expect(['green', 'blue', 'yellow', 'red', 'purple', 'gray', 'orange']).toContain(config.color);
        expect(typeof config.getTitle).toBe('function');
        expect(typeof config.getMessage).toBe('function');
        expect(typeof config.getRoute).toBe('function');
        expect(Array.isArray(config.allowedRoles)).toBe(true);
      });
    });
  });

  describe('consignor notification types', () => {
    it('should configure item_sold correctly', () => {
      const config = notificationConfig.item_sold;
      expect(config.icon).toBe('🛒');
      expect(config.color).toBe('green');
      expect(config.getTitle(mockNotification)).toBe('Item Sold! 🎉');
      expect(config.getMessage(mockNotification)).toBe(mockNotification.message);
      expect(config.getRoute(mockNotification, 'consignor')).toBe('/consignor/sales/txn-1');
      expect(config.allowedRoles).toContain('consignor');
      expect(config.allowedRoles).toContain('owner');
    });

    it('should configure payout_processed correctly', () => {
      const config = notificationConfig.payout_processed;
      expect(config.icon).toBe('💰');
      expect(config.color).toBe('green');
      expect(config.getTitle(mockNotification)).toBe('Payout Processed');
      expect(config.allowedRoles).toEqual(['consignor']);
    });

    it('should configure welcome correctly', () => {
      const config = notificationConfig.welcome;
      expect(config.icon).toBe('🎉');
      expect(config.color).toBe('green');
      expect(config.getTitle(mockNotification)).toBe('Welcome!');
      expect(config.getRoute(mockNotification, 'consignor')).toBe('/consignor/dashboard');
      expect(config.allowedRoles).toContain('consignor');
      expect(config.allowedRoles).toContain('owner');
      expect(config.allowedRoles).toContain('customer');
    });
  });

  describe('owner notification types', () => {
    it('should configure new_provider_request correctly', () => {
      const config = notificationConfig.new_provider_request;
      expect(config.icon).toBe('👤');
      expect(config.color).toBe('blue');
      expect(config.getTitle(mockNotification)).toBe('New consignor Request');
      expect(config.getRoute(mockNotification, 'owner')).toBe('/owner/consignors/consignor-1');
      expect(config.allowedRoles).toEqual(['owner']);
    });

    it('should configure daily_sales_summary correctly', () => {
      const config = notificationConfig.daily_sales_summary;
      expect(config.icon).toBe('📊');
      expect(config.color).toBe('blue');
      expect(config.getTitle(mockNotification)).toBe('Daily Sales Summary');
      expect(config.getRoute(mockNotification, 'owner')).toBe('/owner/sales');
      expect(config.allowedRoles).toEqual(['owner']);
    });
  });

  describe('utility functions', () => {
    it('should get notification config by type', () => {
      const config = getNotificationConfig('item_sold');
      expect(config).toEqual(notificationConfig.item_sold);
      expect(config.icon).toBe('🛒');
    });

    it('should get notification icon by type', () => {
      expect(getNotificationIcon('item_sold')).toBe('🛒');
      expect(getNotificationIcon('payout_processed')).toBe('💰');
      expect(getNotificationIcon('system_error')).toBe('🚨');
    });

    it('should return default icon for invalid type', () => {
      expect(getNotificationIcon('invalid_type' as NotificationType)).toBe('🔔');
    });

    it('should get notification icon class by type', () => {
      expect(getNotificationIconClass('item_sold')).toBe('item-sold'); // green
      expect(getNotificationIconClass('daily_sales_summary')).toBe('statement-ready'); // blue
      expect(getNotificationIconClass('payout_due_reminder')).toBe('payout-pending'); // yellow
      expect(getNotificationIconClass('system_error')).toBe('payout-pending'); // red
    });

    it('should return default class for invalid type', () => {
      expect(getNotificationIconClass('invalid_type' as NotificationType)).toBe('default');
    });
  });

  describe('admin notification types', () => {
    it('should configure new_owner_signup correctly', () => {
      const config = notificationConfig.new_owner_signup;
      expect(config.icon).toBe('🏪');
      expect(config.color).toBe('blue');
      expect(config.getTitle(mockNotification)).toBe('New Shop Signup');
      expect(config.getRoute(mockNotification, 'admin')).toBe('/admin/owners/org-1');
      expect(config.allowedRoles).toEqual(['admin']);
    });

    it('should configure support_ticket_opened correctly', () => {
      const config = notificationConfig.support_ticket_opened;
      expect(config.icon).toBe('🎫');
      expect(config.color).toBe('yellow');
      expect(config.getTitle(mockNotification)).toBe('Support Ticket Opened');
      expect(config.getRoute(mockNotification, 'admin')).toBe('/admin/support/ref-1');
      expect(config.allowedRoles).toEqual(['admin']);
    });

    it('should configure support_ticket_assigned correctly', () => {
      const config = notificationConfig.support_ticket_assigned;
      expect(config.icon).toBe('🎫');
      expect(config.color).toBe('yellow');
      expect(config.getTitle(mockNotification)).toBe('Support Ticket Assigned');
      expect(config.getRoute(mockNotification, 'admin')).toBe('/admin/support/ref-1');
      expect(config.allowedRoles).toEqual(['admin']);
    });

    it('should configure subscription_failed correctly for admin', () => {
      const config = notificationConfig.subscription_failed;
      expect(config.icon).toBe('🚨');
      expect(config.color).toBe('red');
      expect(config.getTitle(mockNotification)).toBe('Subscription Payment Failed');
      expect(config.getRoute(mockNotification, 'admin')).toBe('/admin/subscriptions/ref-1');
      expect(config.allowedRoles).toContain('admin');
      expect(config.allowedRoles).toContain('owner');
    });

    it('should configure subscription_cancelled correctly', () => {
      const config = notificationConfig.subscription_cancelled;
      expect(config.icon).toBe('💔');
      expect(config.color).toBe('gray');
      expect(config.getTitle(mockNotification)).toBe('Subscription Cancelled');
      expect(config.getRoute(mockNotification, 'admin')).toBe('/admin/owners/org-1');
      expect(config.allowedRoles).toEqual(['admin']);
    });

    it('should configure trial_expiring correctly', () => {
      const config = notificationConfig.trial_expiring;
      expect(config.icon).toBe('⏰');
      expect(config.color).toBe('orange');
      expect(config.getTitle(mockNotification)).toBe('Trial Expiring');
      expect(config.getRoute(mockNotification, 'admin')).toBe('/admin/owners/org-1');
      expect(config.allowedRoles).toEqual(['admin']);
    });
  });

  describe('route generation', () => {
    it('should handle notifications without required IDs', () => {
      const notificationWithoutIds: NotificationDto = {
        ...mockNotification,
        transactionId: undefined,
        providerId: undefined
      };

      expect(notificationConfig.item_sold.getRoute(notificationWithoutIds, 'consignor')).toBeNull();
      expect(notificationConfig.new_provider_request.getRoute(notificationWithoutIds, 'owner')).toBe('/owner/consignors');
    });

    it('should generate correct routes for different roles', () => {
      expect(notificationConfig.item_sold.getRoute(mockNotification, 'owner')).toBe('/owner/sales/txn-1');
      expect(notificationConfig.item_sold.getRoute(mockNotification, 'consignor')).toBe('/consignor/sales/txn-1');
    });

    it('should return null for system announcement', () => {
      expect(notificationConfig.system_announcement.getRoute(mockNotification, 'owner')).toBeNull();
    });
  });
});