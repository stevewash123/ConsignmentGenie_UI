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
    { key: 'consignor_payout_ready', name: 'Payout Ready', description: 'When consignor payouts are calculated and ready to send', category: 'consignor' }
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
        this.notificationSettings.set(settings);
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

  // Helper methods for template
  isEmailEnabled(notificationType: string): boolean {
    const settings = this.notificationSettings();
    return settings?.emailPreferences[notificationType] || false;
  }

  isSmsEnabled(notificationType: string): boolean {
    const settings = this.notificationSettings();
    return settings?.smsPreferences[notificationType] || false;
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