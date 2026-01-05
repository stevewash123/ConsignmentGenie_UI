import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesRequest,
  UserRole
} from '../models/notification.models';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.scss']
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
  @Input() role: UserRole = 'consignor';

  private destroy$ = new Subject<void>();

  preferencesForm!: FormGroup;
  originalPreferences: NotificationPreferencesDto | null = null;
  error: string | null = null;
  saveMessage: string | null = null;
  saveSuccess = false;

  loadingKey = 'notification-prefs';
  saveLoadingKey = 'notification-prefs-save';

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadPreferences();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.preferencesForm = this.fb.group({
      emailEnabled: [true],
      emailItemSold: [true],
      emailPayoutProcessed: [true],
      emailPayoutPending: [false],
      emailStatementReady: [true],
      emailAccountUpdate: [true],
      digestMode: ['instant'],
      digestTime: ['09:00'],
      digestDay: [1],
      payoutPendingThreshold: [50.00, [Validators.min(10)]],

      // Owner-specific
      emailNewProviderRequest: [true],
      emailPayoutDueReminder: [true],
      emailSubscriptionReminder: [true],
      emailSyncError: [true],

      // Admin-specific
      emailNewOwnerRequest: [true],
      emailSubscriptionEvents: [true],
      emailSystemErrors: [true]
    });
  }

  loadPreferences() {
    this.loadingService.start(this.loadingKey);
    this.error = null;

    this.notificationService.getPreferences(this.role)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preferences) => {
          this.originalPreferences = preferences;
          this.preferencesForm.patchValue(preferences);
          this.preferencesForm.markAsPristine();
        },
        error: (error) => {
          console.error('Error loading preferences:', error);
          this.error = 'Failed to load notification preferences. Please try again later.';
        },
        complete: () => {
          this.loadingService.stop(this.loadingKey);
        }
      });
  }

  onMasterEmailToggle() {
    const emailEnabled = this.preferencesForm.get('emailEnabled')?.value;

    if (!emailEnabled) {
      // Disable all email notifications when master toggle is off
      const emailFields = [
        'emailItemSold', 'emailPayoutProcessed', 'emailPayoutPending',
        'emailStatementReady', 'emailAccountUpdate',
        'emailNewProviderRequest', 'emailPayoutDueReminder',
        'emailSubscriptionReminder', 'emailSyncError',
        'emailNewOwnerRequest', 'emailSubscriptionEvents', 'emailSystemErrors'
      ];

      const updates: any = {};
      emailFields.forEach(field => {
        if (this.preferencesForm.get(field)) {
          updates[field] = false;
        }
      });

      this.preferencesForm.patchValue(updates);
    }
  }

  savePreferences() {
    if (this.preferencesForm.invalid || this.loadingService.isLoading(this.saveLoadingKey)) {
      return;
    }

    this.loadingService.start(this.saveLoadingKey);
    this.saveMessage = null;

    const formValue = this.preferencesForm.value;
    const request: UpdateNotificationPreferencesRequest = {
      emailEnabled: formValue.emailEnabled,
      digestMode: formValue.digestMode,
      digestTime: formValue.digestTime,
      digestDay: formValue.digestDay,
      payoutPendingThreshold: formValue.payoutPendingThreshold,

      emailItemSold: formValue.emailItemSold,
      emailPayoutProcessed: formValue.emailPayoutProcessed,
      emailPayoutPending: formValue.emailPayoutPending,
      emailStatementReady: formValue.emailStatementReady,
      emailAccountUpdate: formValue.emailAccountUpdate,

      // Owner-specific
      emailNewProviderRequest: formValue.emailNewProviderRequest,
      emailPayoutDueReminder: formValue.emailPayoutDueReminder,
      emailSubscriptionReminder: formValue.emailSubscriptionReminder,
      emailSyncError: formValue.emailSyncError,

      // Admin-specific
      emailNewOwnerRequest: formValue.emailNewOwnerRequest,
      emailSubscriptionEvents: formValue.emailSubscriptionEvents,
      emailSystemErrors: formValue.emailSystemErrors
    };

    this.notificationService.updatePreferences(this.role, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPreferences) => {
          this.originalPreferences = updatedPreferences;
          this.preferencesForm.markAsPristine();
          this.saveMessage = 'Your notification preferences have been saved successfully.';
          this.saveSuccess = true;

          // Clear the success message after 3 seconds
          setTimeout(() => {
            this.saveMessage = null;
          }, 3000);
        },
        error: (error) => {
          console.error('Error saving preferences:', error);
          this.saveMessage = 'Failed to save your preferences. Please try again.';
          this.saveSuccess = false;

          // Clear the error message after 5 seconds
          setTimeout(() => {
            this.saveMessage = null;
          }, 5000);
        },
        complete: () => {
          this.loadingService.stop(this.saveLoadingKey);
        }
      });
  }

  resetForm() {
    if (this.originalPreferences) {
      this.preferencesForm.patchValue(this.originalPreferences);
      this.preferencesForm.markAsPristine();
    }
    this.saveMessage = null;
  }
}