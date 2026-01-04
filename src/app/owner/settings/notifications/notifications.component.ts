import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OwnerService, NotificationSettings } from '../../../services/owner.service';

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
export class AccountNotificationsComponent implements OnInit {
  notificationsForm!: FormGroup;
  notificationSettings = signal<NotificationSettings | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

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
    private fb: FormBuilder,
    private ownerService: OwnerService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadNotificationSettings();
  }

  private initializeForm(): void {
    const formControls: any = {
      primaryEmail: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      highValueSaleThreshold: [500, [Validators.min(0)]],
      lowInventoryThreshold: [10, [Validators.min(0)]]
    };

    // Add form controls for each notification type
    const allNotifications = [
      ...this.businessNotifications,
      ...this.consignorNotifications,
      ...this.salesNotifications,
      ...this.systemNotifications
    ];

    allNotifications.forEach(notification => {
      formControls[`email_${notification.key}`] = [false];
      formControls[`sms_${notification.key}`] = [false];
    });

    this.notificationsForm = this.fb.group(formControls);
  }

  async loadNotificationSettings(): Promise<void> {
    try {
      this.isLoading.set(true);
      const settings = await this.ownerService.getNotificationSettings().toPromise();
      if (settings) {
        this.notificationSettings.set(settings);

        // Patch form with settings
        const formValue: any = {
          primaryEmail: settings.primaryEmail,
          phoneNumber: settings.phoneNumber || '',
          highValueSaleThreshold: settings.thresholds?.highValueSale || 500,
          lowInventoryThreshold: settings.thresholds?.lowInventory || 10
        };

        // Set email preferences
        Object.keys(settings.emailPreferences).forEach(key => {
          formValue[`email_${key}`] = settings.emailPreferences[key];
        });

        // Set SMS preferences
        Object.keys(settings.smsPreferences).forEach(key => {
          formValue[`sms_${key}`] = settings.smsPreferences[key];
        });

        this.notificationsForm.patchValue(formValue);
      }
    } catch (error) {
      this.showError('Failed to load notification settings');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveNotificationSettings(): Promise<void> {
    if (!this.notificationsForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const formData = this.notificationsForm.value;

      // Extract email and SMS preferences
      const emailPreferences: { [key: string]: boolean } = {};
      const smsPreferences: { [key: string]: boolean } = {};

      Object.keys(formData).forEach(key => {
        if (key.startsWith('email_')) {
          const notificationKey = key.replace('email_', '');
          emailPreferences[notificationKey] = formData[key];
        } else if (key.startsWith('sms_')) {
          const notificationKey = key.replace('sms_', '');
          smsPreferences[notificationKey] = formData[key];
        }
      });

      const settings: NotificationSettings = {
        primaryEmail: formData.primaryEmail,
        phoneNumber: formData.phoneNumber || undefined,
        emailPreferences,
        smsPreferences,
        thresholds: {
          highValueSale: formData.highValueSaleThreshold,
          lowInventory: formData.lowInventoryThreshold
        },
        emailNotifications: {
          newSales: formData.emailNewSales || false,
          newConsignors: formData.emailNewConsignors || false,
          lowInventory: formData.emailLowInventory || false,
          payoutReady: formData.emailPayoutReady || false,
        },
        smsNotifications: {
          newSales: formData.smsNewSales || false,
          emergencyAlerts: formData.smsEmergencyAlerts || false,
        },
        pushNotifications: {
          newSales: formData.pushNewSales || false,
          consignorActivity: formData.pushConsignorActivity || false,
        }
      };

      await this.ownerService.updateNotificationSettings(settings).toPromise();
      this.notificationSettings.set(settings);
      this.showSuccess('Notification settings saved successfully');
    } catch (error) {
      this.showError('Failed to save notification settings');
    } finally {
      this.isSaving.set(false);
    }
  }


  trackByNotificationKey(index: number, notification: NotificationType): string {
    return notification.key;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.notificationsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.notificationsForm.controls).forEach(key => {
      const control = this.notificationsForm.get(key);
      control?.markAsTouched();
    });
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