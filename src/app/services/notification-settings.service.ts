import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NotificationSettings } from '../models/notifications.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationSettingsService {
  // Notification settings state
  private notificationSettings$ = new BehaviorSubject<NotificationSettings | null>(null);
  private pendingNotificationChanges: Record<string, any> = {};
  private notificationSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isNotificationSaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly notificationSettings = this.notificationSettings$.asObservable();

  constructor(private http: HttpClient) {}

  // ===== NOTIFICATION SETTINGS METHODS =====

  /**
   * Load notification settings from API
   */
  async loadNotificationSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<NotificationSettings>(`${environment.apiUrl}/api/settings/notifications/general`)
      );
      this.notificationSettings$.next(settings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      this.notificationSettings$.next(null);
    }
  }

  /**
   * Update a notification setting with automatic debounced save
   */
  updateNotificationSetting(key: string, value: any): void {
    const current = this.notificationSettings$.value;
    if (!current) return;

    // Apply optimistic update with nested property support
    const updated = JSON.parse(JSON.stringify(current));
    this.setNestedProperty(updated, key, value);
    this.notificationSettings$.next(updated);

    // Queue for save
    this.pendingNotificationChanges[key] = value;
    this.scheduleNotificationSave();
  }

  /**
   * Update multiple notification settings at once
   */
  updateNotificationSettings(changes: Record<string, any>): void {
    const current = this.notificationSettings$.value;
    if (!current) return;

    // Apply optimistic updates
    const updated = JSON.parse(JSON.stringify(current));
    Object.entries(changes).forEach(([key, value]) => {
      this.setNestedProperty(updated, key, value);
    });
    this.notificationSettings$.next(updated);

    // Queue changes for save
    Object.assign(this.pendingNotificationChanges, changes);
    this.scheduleNotificationSave();
  }

  /**
   * Set nested property value (e.g. "thresholds.highValueSale" -> 1000)
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  private scheduleNotificationSave(): void {
    if (this.notificationSaveTimeout) {
      clearTimeout(this.notificationSaveTimeout);
    }

    this.notificationSaveTimeout = setTimeout(() => {
      this.saveNotificationSettings();
    }, this.DEBOUNCE_MS);
  }

  private async saveNotificationSettings(): Promise<void> {
    if (this.isNotificationSaving || Object.keys(this.pendingNotificationChanges).length === 0) {
      return;
    }

    this.isNotificationSaving = true;
    const changesToSave = { ...this.pendingNotificationChanges };
    this.pendingNotificationChanges = {};

    try {
      const response = await firstValueFrom(
        this.http.patch<{success: boolean, data: NotificationSettings}>(`${environment.apiUrl}/api/settings/notifications/general`, changesToSave)
      );

      // Update with server response (authoritative)
      this.notificationSettings$.next(response.data);

    } catch (error) {
      console.error('Failed to save notification settings:', error);

      // Revert optimistic changes
      this.revertNotificationChanges(changesToSave);
      this.showError('Failed to save notification settings. Please try again.');

    } finally {
      this.isNotificationSaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingNotificationChanges).length > 0) {
        this.scheduleNotificationSave();
      }
    }
  }

  private revertNotificationChanges(changes: Record<string, any>): void {
    // Re-fetch from server to get correct state
    this.loadNotificationSettings();
  }

  /**
   * Force immediate notification settings save
   */
  async flushNotificationSettings(): Promise<void> {
    if (this.notificationSaveTimeout) {
      clearTimeout(this.notificationSaveTimeout);
      this.notificationSaveTimeout = null;
    }
    await this.saveNotificationSettings();
  }

  /**
   * Get current notification settings synchronously
   */
  getCurrentNotificationSettings(): NotificationSettings | null {
    return this.notificationSettings$.value;
  }

  /**
   * Update notification threshold setting
   */
  updateNotificationThreshold(type: 'highValueSale' | 'lowInventory', value: number): void {
    this.updateNotificationSetting(`thresholds.${type}`, value);
  }

  /**
   * Update email preference setting
   */
  updateEmailPreference(notificationType: string, enabled: boolean): void {
    this.updateNotificationSetting(`emailPreferences.${notificationType}`, enabled);
  }

  /**
   * Update SMS preference setting
   */
  updateSmsPreference(notificationType: string, enabled: boolean): void {
    this.updateNotificationSetting(`smsPreferences.${notificationType}`, enabled);
  }

  /**
   * Update system preference setting
   */
  updateSystemPreference(notificationType: string, enabled: boolean): void {
    this.updateNotificationSetting(`systemPreferences.${notificationType}`, enabled);
  }

  private showError(message: string): void {
    // TODO: Implement error display - could use toast service or similar
    console.error(message);
  }
}