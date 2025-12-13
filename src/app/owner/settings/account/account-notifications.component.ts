import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';

interface AccountNotificationSettings {
  email: {
    enabled: boolean;
    address: string;
    backupAddress?: string;
    verified: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    format: 'html' | 'text';
  };
  sms: {
    enabled: boolean;
    phoneNumber?: string;
    verified: boolean;
    emergencyOnly: boolean;
  };
  inApp: {
    enabled: boolean;
    pushNotifications: boolean;
    retentionDays: number;
  };
  categories: {
    systemAlerts: boolean;
    businessOperations: boolean;
    accountManagement: boolean;
    securityAlerts: boolean;
  };
  schedule: {
    quietHours: {
      enabled: boolean;
      startTime: string; // "22:00"
      endTime: string;   // "08:00"
    };
    timezone: string;
    weekendNotifications: boolean;
  };
}

@Component({
  selector: 'app-account-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './account-notifications.component.html',
  styleUrls: ['./account-notifications.component.css']
})
export class AccountNotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  notificationForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  allNotificationsEnabled = signal(true);

  // Available timezones for the select dropdown
  timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadNotificationSettings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.notificationForm = this.fb.group({
      email: this.fb.group({
        enabled: [true],
        address: ['', [Validators.required, Validators.email]],
        backupAddress: ['', [Validators.email]],
        verified: [false],
        frequency: ['immediate'],
        format: ['html']
      }),
      sms: this.fb.group({
        enabled: [false],
        phoneNumber: [''],
        verified: [false],
        emergencyOnly: [true]
      }),
      inApp: this.fb.group({
        enabled: [true],
        pushNotifications: [false],
        retentionDays: [30, [Validators.min(1), Validators.max(365)]]
      }),
      categories: this.fb.group({
        systemAlerts: [true],
        businessOperations: [true],
        accountManagement: [true],
        securityAlerts: [true]
      }),
      schedule: this.fb.group({
        quietHours: this.fb.group({
          enabled: [false],
          startTime: ['22:00'],
          endTime: ['08:00']
        }),
        timezone: ['America/New_York'],
        weekendNotifications: [true]
      })
    });

    // Watch for master toggle changes
    this.notificationForm.get('email.enabled')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        this.updateAllNotificationsToggle();
      });
  }

  async loadNotificationSettings() {
    this.isLoading.set(true);
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('User not found');
      }

      // TODO: Replace with actual API call
      // For now, populate with mock data and user's email
      const mockSettings: AccountNotificationSettings = {
        email: {
          enabled: true,
          address: user.email,
          verified: true,
          frequency: 'immediate',
          format: 'html'
        },
        sms: {
          enabled: false,
          verified: false,
          emergencyOnly: true
        },
        inApp: {
          enabled: true,
          pushNotifications: false,
          retentionDays: 30
        },
        categories: {
          systemAlerts: true,
          businessOperations: true,
          accountManagement: true,
          securityAlerts: true
        },
        schedule: {
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00'
          },
          timezone: 'America/New_York',
          weekendNotifications: true
        }
      };

      this.notificationForm.patchValue(mockSettings);
      this.updateAllNotificationsToggle();
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      this.showError('Failed to load notification settings');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveNotificationSettings() {
    if (this.notificationForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    try {
      const formValue = this.notificationForm.value;

      // TODO: Replace with actual API call
      console.log('Saving notification settings:', formValue);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.showSuccess('Notification settings saved successfully');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      this.showError('Failed to save notification settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  onMasterToggleChange() {
    const enabled = this.allNotificationsEnabled();

    // Update all notification categories
    this.notificationForm.get('categories')?.patchValue({
      systemAlerts: enabled,
      businessOperations: enabled,
      accountManagement: enabled,
      securityAlerts: enabled
    });

    // Update email and in-app notifications
    this.notificationForm.get('email.enabled')?.setValue(enabled);
    this.notificationForm.get('inApp.enabled')?.setValue(enabled);

    // Don't auto-enable SMS as it requires phone verification
  }

  private updateAllNotificationsToggle() {
    const emailEnabled = this.notificationForm.get('email.enabled')?.value;
    const inAppEnabled = this.notificationForm.get('inApp.enabled')?.value;
    const categories = this.notificationForm.get('categories')?.value;

    const anyCategoryEnabled = categories && (
      categories.systemAlerts ||
      categories.businessOperations ||
      categories.accountManagement ||
      categories.securityAlerts
    );

    this.allNotificationsEnabled.set(emailEnabled || inAppEnabled || anyCategoryEnabled);
  }

  async verifyEmail() {
    try {
      // TODO: Implement email verification
      this.showSuccess('Verification email sent');
    } catch (error) {
      this.showError('Failed to send verification email');
    }
  }

  async verifyPhone() {
    try {
      // TODO: Implement SMS verification
      this.showSuccess('Verification SMS sent');
    } catch (error) {
      this.showError('Failed to send verification SMS');
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}