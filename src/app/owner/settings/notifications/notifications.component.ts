import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SettingsService, NotificationSettings } from '../../../services/settings.service';
import { Subscription } from 'rxjs';

interface NotificationType {
  key: string;
  name: string;
  description: string;
  category: string;
}


@Component({
  selector: 'app-account-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class AccountNotificationsComponent implements OnInit, OnDestroy {
  notificationSettings = signal<NotificationSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  private subscriptions = new Subscription();

  // Auto-save status computed from settings state
  autoSaveStatus = computed(() => {
    const settings = this.notificationSettings();
    return settings ? 'Saved automatically' : 'Loading...';
  });

  // Notification types organized by category
  businessNotifications: NotificationType[] = [
    { key: 'daily_sales_summary', name: 'Daily Sales Summary', description: 'End-of-day sales report with totals and key metrics', category: 'business' },
    { key: 'weekly_report', name: 'Weekly Business Report', description: 'Weekly overview of sales, inventory, and performance', category: 'business' },
    { key: 'monthly_statement', name: 'Monthly Statement', description: 'Comprehensive monthly business summary and financials', category: 'business' }
  ];

  consignorNotifications: NotificationType[] = [
    { key: 'consignor_signup', name: 'New Consignor Signup', description: 'When a new consignor registers to join your store', category: 'consignor' },
    { key: 'consignor_item_added', name: 'New Items Added', description: 'When consignors add new items to inventory', category: 'consignor' },
    { key: 'pending_approval', name: 'Pending Approvals', description: 'When consignors need approval for account or items', category: 'consignor' },
    { key: 'daily_payout_ready', name: 'Daily Payout Ready Report', description: 'Daily notification when consignor payouts are calculated and ready to send', category: 'consignor' },
    { key: 'weekly_payout_ready', name: 'Weekly Payout Ready Report', description: 'Weekly notification when consignor payouts are calculated and ready to send', category: 'consignor' }
  ];

  salesNotifications: NotificationType[] = [
    { key: 'item_sold', name: 'Item Sold', description: 'Immediate notification when any item is sold', category: 'sales' },
    { key: 'high_value_sale', name: 'High Value Sale', description: 'When a sale exceeds your defined threshold amount', category: 'sales' },
    { key: 'low_inventory', name: 'Low Inventory Alert', description: 'When inventory levels drop below minimum thresholds', category: 'sales' },
    { key: 'pricing_suggestions', name: 'Pricing Suggestions', description: 'AI-powered pricing recommendations for better sales', category: 'sales' }
  ];

  systemNotifications: NotificationType[] = [
    { key: 'system_maintenance', name: 'System Maintenance', description: 'Scheduled maintenance and system updates', category: 'system' },
    { key: 'security_alerts', name: 'Security Alerts', description: 'Important security notifications and login alerts', category: 'system' },
    { key: 'account_changes', name: 'Account Changes', description: 'When important account settings are modified', category: 'system' },
    { key: 'backup_status', name: 'Backup Status', description: 'Data backup completion and status updates', category: 'system' }
  ];

  constructor(
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadNotificationSettings();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions(): void {
    // Subscribe to notification settings changes from the service
    this.subscriptions.add(
      this.settingsService.notificationSettings.subscribe(settings => {
        if (settings) {
          // Set defaults for new properties if they don't exist
          const defaultSystemPreferences = {
            // Business Operations
            daily_sales_summary: true,
            weekly_report: true,
            monthly_statement: true,
            // Consignor Activity
            consignor_signup: true,
            consignor_item_added: true,
            pending_approval: true,
            daily_payout_ready: true,
            weekly_payout_ready: true,
            // Sales & Inventory
            item_sold: true,
            high_value_sale: true,
            low_inventory: true,
            pricing_suggestions: true,
            // System Alerts (always true, can't be disabled)
            system_maintenance: true,
            security_alerts: true,
            account_changes: true,
            backup_status: true
          };

          const updatedSettings = {
            ...settings,
            systemPreferences: { ...defaultSystemPreferences, ...settings.systemPreferences },
            weeklyPayoutDay: settings.weeklyPayoutDay || 'monday',
            emailPreferences: {
              ...settings.emailPreferences,
              // Set defaults for Security Alerts & Account Changes
              security_alerts: settings.emailPreferences?.security_alerts ?? true,
              account_changes: settings.emailPreferences?.account_changes ?? true
            }
          };
          this.notificationSettings.set(updatedSettings);
        } else {
          this.notificationSettings.set(settings);
        }
      })
    );
  }

  async loadNotificationSettings(): Promise<void> {
    try {
      await this.settingsService.loadNotificationSettings();
    } catch (error) {
      console.error('Error loading notification settings:', error);
      this.showError('Failed to load notification settings');
    }
  }

  // Individual change handlers for debounced auto-save
  onPrimaryEmailChange(value: string): void {
    this.settingsService.updateNotificationSetting('primaryEmail', value);
  }

  onPhoneNumberChange(value: string): void {
    this.settingsService.updateNotificationSetting('phoneNumber', value || undefined);
  }

  onHighValueThresholdChange(value: number): void {
    this.settingsService.updateNotificationThreshold('highValueSale', value);
  }

  onLowInventoryThresholdChange(value: number): void {
    this.settingsService.updateNotificationThreshold('lowInventory', value);
  }

  onEmailPreferenceChange(notificationType: string, enabled: boolean): void {
    this.settingsService.updateEmailPreference(notificationType, enabled);
  }

  onSmsPreferenceChange(notificationType: string, enabled: boolean): void {
    this.settingsService.updateSmsPreference(notificationType, enabled);
  }

  onSystemPreferenceChange(notificationType: string, enabled: boolean): void {
    this.settingsService.updateSystemPreference(notificationType, enabled);
  }

  onWeeklyPayoutDayChange(day: string): void {
    this.settingsService.updateNotificationSetting('weeklyPayoutDay', day);
  }

  // Helper methods for template
  isEmailEnabled(notificationType: string): boolean {
    const settings = this.notificationSettings();
    return settings?.emailPreferences[notificationType] || false;
  }

  isSmsEnabled(notificationType: string): boolean {
    const settings = this.notificationSettings();
    return settings?.smsPreferences[notificationType] || false;
  }

  isSystemEnabled(notificationType: string): boolean {
    const settings = this.notificationSettings();
    return settings?.systemPreferences?.[notificationType] || false;
  }

  getWeeklyPayoutDay(): string {
    const settings = this.notificationSettings();
    return settings?.weeklyPayoutDay || 'monday';
  }

  isSystemNotificationDisabled(notificationType: string): boolean {
    // System Alert notifications can't be unchecked for System
    return ['system_maintenance', 'security_alerts', 'account_changes', 'backup_status'].includes(notificationType);
  }


  trackByNotificationKey(index: number, notification: NotificationType): string {
    return notification.key;
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}