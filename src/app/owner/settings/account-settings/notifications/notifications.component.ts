import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface NotificationType {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface NotificationSettings {
  primaryEmail: string;
  phoneNumber?: string;
  emailPreferences: { [key: string]: boolean };
  smsPreferences: { [key: string]: boolean };
}

@Component({
  selector: 'app-account-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notifications.component.html',
  styles: [`
    .notifications-section {
      padding: 2rem;
      max-width: 1200px;
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .section-description {
      color: #6b7280;
    }

    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: start;
    }

    .form-group {
      flex: 1;
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border-color: #dc2626;
    }

    .error-message {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.25rem;
    }

    .notification-grid {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .grid-header {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .notification-type-header {
      padding-left: 0;
    }

    .channel-header {
      text-align: center;
    }

    .notification-category {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr;
      background: #f1f5f9;
      border-bottom: 1px solid #e5e7eb;
      padding: 0.5rem 1rem;
    }

    .category-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .notification-row {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr;
      border-bottom: 1px solid #f3f4f6;
      padding: 1rem;
      align-items: center;
      transition: background-color 0.2s ease;
    }

    .notification-row:hover {
      background: #f8fafc;
    }

    .notification-row:last-child {
      border-bottom: none;
    }

    .notification-type {
      padding-right: 1rem;
    }

    .notification-name {
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .notification-description {
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .notification-channel {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .notification-channel input[type="checkbox"] {
      width: 1.125rem;
      height: 1.125rem;
      cursor: pointer;
    }

    .notification-channel input[type="checkbox"]:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .message.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .message.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    @media (max-width: 768px) {
      .notifications-section {
        padding: 1rem;
      }

      .form-row {
        flex-direction: column;
      }

      .grid-header, .notification-category, .notification-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .channel-header {
        text-align: left;
      }

      .notification-channel {
        justify-content: flex-start;
      }
    }
  `]
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
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadNotificationSettings();
  }

  private initializeForm(): void {
    const formControls: any = {
      primaryEmail: ['', [Validators.required, Validators.email]],
      phoneNumber: ['']
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
      const settings = await this.http.get<NotificationSettings>(`${environment.apiUrl}/api/user/notification-settings`).toPromise();
      if (settings) {
        this.notificationSettings.set(settings);

        // Patch form with settings
        const formValue: any = {
          primaryEmail: settings.primaryEmail,
          phoneNumber: settings.phoneNumber || ''
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
        smsPreferences
      };

      await this.http.put(`${environment.apiUrl}/api/user/notification-settings`, settings).toPromise();
      this.notificationSettings.set(settings);
      this.showSuccess('Notification settings saved successfully');
    } catch (error) {
      this.showError('Failed to save notification settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  enableAllEmail(): void {
    const allNotifications = [
      ...this.businessNotifications,
      ...this.consignorNotifications,
      ...this.salesNotifications,
      ...this.systemNotifications
    ];

    const updates: any = {};
    allNotifications.forEach(notification => {
      updates[`email_${notification.key}`] = true;
    });

    this.notificationsForm.patchValue(updates);
  }

  disableAllEmail(): void {
    const allNotifications = [
      ...this.businessNotifications,
      ...this.consignorNotifications,
      ...this.salesNotifications,
      ...this.systemNotifications
    ];

    const updates: any = {};
    allNotifications.forEach(notification => {
      updates[`email_${notification.key}`] = false;
    });

    this.notificationsForm.patchValue(updates);
  }

  enableAllSms(): void {
    if (!this.notificationsForm.get('phoneNumber')?.value) {
      this.showError('Please enter a phone number first');
      return;
    }

    const allNotifications = [
      ...this.businessNotifications,
      ...this.consignorNotifications,
      ...this.salesNotifications,
      ...this.systemNotifications
    ];

    const updates: any = {};
    allNotifications.forEach(notification => {
      updates[`sms_${notification.key}`] = true;
    });

    this.notificationsForm.patchValue(updates);
  }

  disableAllSms(): void {
    const allNotifications = [
      ...this.businessNotifications,
      ...this.consignorNotifications,
      ...this.salesNotifications,
      ...this.systemNotifications
    ];

    const updates: any = {};
    allNotifications.forEach(notification => {
      updates[`sms_${notification.key}`] = false;
    });

    this.notificationsForm.patchValue(updates);
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