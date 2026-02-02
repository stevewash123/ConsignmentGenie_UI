import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationMatrixSettings, NotificationCategory, NotificationEvent, NotificationContactInfo, NotificationThresholds } from '../../../models/notification-matrix.models';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
  private http = inject(HttpClient);

  notificationSettings = signal<NotificationMatrixSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  saving = signal(false);

  // Auto-save status computed from settings state
  autoSaveStatus = computed(() => {
    const settings = this.notificationSettings();
    if (this.saving()) return 'Saving...';
    return settings ? 'Saved automatically' : 'Loading...';
  });

  constructor() {}

  ngOnInit(): void {
    this.loadNotificationSettings();
  }

  ngOnDestroy(): void {
    // No subscriptions to clean up in this simplified version
  }

  async loadNotificationSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<NotificationMatrixSettings>(`${environment.apiUrl}/api/owner/settings/notifications`)
      );
      this.notificationSettings.set(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      this.showError('Failed to load notification settings');
    }
  }

  // Contact info change handlers
  onPrimaryEmailChange(value: string): void {
    this.updateContactInfo({ primaryEmailAddress: value });
  }

  onPhoneNumberChange(value: string): void {
    this.updateContactInfo({ phoneNumber: value || undefined });
  }

  // Threshold change handlers
  onHighValueThresholdChange(value: number): void {
    this.updateThresholds({ highValueSaleThreshold: value });
  }

  onLowInventoryThresholdChange(value: number): void {
    this.updateThresholds({ lowInventoryAlertThreshold: value });
  }

  // Matrix preference change handlers
  onNotificationToggle(categoryName: string, eventName: string, notificationType: 'email' | 'sms' | 'system', enabled: boolean): void {
    const settings = this.notificationSettings();
    if (!settings) return;

    const updatedPreferences = settings.notificationPreferences.map(category => {
      if (category.categoryName === categoryName) {
        return {
          ...category,
          events: category.events.map(event => {
            if (event.eventName === eventName) {
              return { ...event, [notificationType]: enabled };
            }
            return event;
          })
        };
      }
      return category;
    });

    this.updateNotificationPreferences(updatedPreferences);
  }

  // Helper methods for template
  getEvent(categoryName: string, eventName: string): NotificationEvent | undefined {
    const settings = this.notificationSettings();
    if (!settings) return undefined;

    const category = settings.notificationPreferences.find(c => c.categoryName === categoryName);
    return category?.events.find(e => e.eventName === eventName);
  }

  isNotificationEnabled(categoryName: string, eventName: string, type: 'email' | 'sms' | 'system'): boolean {
    const event = this.getEvent(categoryName, eventName);
    return event?.[type] || false;
  }

  // Update helper methods
  private async updateContactInfo(changes: Partial<NotificationContactInfo>): Promise<void> {
    const settings = this.notificationSettings();
    if (!settings) return;

    const updated = {
      ...settings,
      contactInfo: { ...settings.contactInfo, ...changes }
    };

    this.notificationSettings.set(updated);
    await this.saveSettings({ contactInfo: updated.contactInfo });
  }

  private async updateThresholds(changes: Partial<NotificationThresholds>): Promise<void> {
    const settings = this.notificationSettings();
    if (!settings) return;

    const updated = {
      ...settings,
      thresholds: { ...settings.thresholds, ...changes }
    };

    this.notificationSettings.set(updated);
    await this.saveSettings({ thresholds: updated.thresholds });
  }

  private async updateNotificationPreferences(preferences: NotificationCategory[]): Promise<void> {
    const settings = this.notificationSettings();
    if (!settings) return;

    const updated = {
      ...settings,
      notificationPreferences: preferences
    };

    this.notificationSettings.set(updated);
    await this.saveSettings({ notificationPreferences: preferences });
  }

  private async saveSettings(changes: any): Promise<void> {
    if (this.saving()) return;

    this.saving.set(true);
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/api/owner/settings/notifications`, changes)
      );
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      this.showError('Failed to save settings');
    } finally {
      this.saving.set(false);
    }
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

  // TrackBy functions for ngFor performance
  trackByCategory(index: number, category: NotificationCategory): string {
    return category.categoryName;
  }

  trackByEvent(index: number, event: NotificationEvent): string {
    return event.eventName;
  }
}