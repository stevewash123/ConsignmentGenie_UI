import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { SettingsSummary } from '../models/settings-summary.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsCache$ = new BehaviorSubject<SettingsSummary | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Load all settings. Call once at app init / after login.
   */
  async loadSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<SettingsSummary>(`${environment.apiUrl}/api/settings/summary`)
      );
      this.settingsCache$.next(settings);
    } catch (error) {
      console.error('Failed to load settings summary:', error);
      this.settingsCache$.next(null);
    }
  }

  /**
   * Refresh a specific section after a settings page save.
   */
  async refreshSection(section: string): Promise<void> {
    try {
      const partial = await firstValueFrom(
        this.http.get<SettingsSummary>(`${environment.apiUrl}/api/settings/summary?include=${section}`)
      );
      const current = this.settingsCache$.value;
      if (current && partial) {
        this.settingsCache$.next({ ...current, ...partial });
      }
    } catch (error) {
      console.error(`Failed to refresh ${section} settings:`, error);
    }
  }

  /**
   * Synchronous access for components.
   */
  get settings(): SettingsSummary | null {
    return this.settingsCache$.value;
  }

  /**
   * Observable access for reactive components.
   */
  get settings$(): Observable<SettingsSummary | null> {
    return this.settingsCache$.asObservable();
  }

  /**
   * Convenience methods for accessing commonly used settings
   */

  /**
   * Check if consignors can edit items
   */
  canConsignorEdit(): boolean {
    return this.settingsCache$.value?.consignor?.onboarding?.approvalMode === 'auto' || false;
  }

  /**
   * Get shop commission rate
   */
  getShopCommissionRate(): number {
    return this.settingsCache$.value?.consignor?.defaults?.shopCommissionPercent ?? 50;
  }

  /**
   * Get consignment period in days
   */
  getConsignmentPeriodDays(): number {
    return this.settingsCache$.value?.consignor?.defaults?.consignmentPeriodDays ?? 90;
  }

  /**
   * Get retrieval period in days
   */
  getRetrievalPeriodDays(): number {
    return this.settingsCache$.value?.consignor?.defaults?.retrievalPeriodDays ?? 14;
  }

  /**
   * Get unsold item policy
   */
  getUnsoldItemPolicy(): string {
    return this.settingsCache$.value?.consignor?.defaults?.unsoldItemPolicy ?? 'return-to-consignor';
  }

  /**
   * Check if settings are loaded
   */
  isLoaded(): boolean {
    return this.settingsCache$.value !== null;
  }

  /**
   * Clear the settings cache (e.g., on logout)
   */
  clearCache(): void {
    this.settingsCache$.next(null);
  }
}