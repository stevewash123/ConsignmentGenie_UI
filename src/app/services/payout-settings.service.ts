import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PayoutSettings, DEFAULT_PAYOUT_SETTINGS } from '../models/payout-settings.model';

@Injectable({
  providedIn: 'root'
})
export class PayoutSettingsService {
  private payoutSettings$ = new BehaviorSubject<PayoutSettings | null>(null);
  private readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly payoutSettings = this.payoutSettings$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load payout settings from API
   */
  async loadPayoutSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<PayoutSettings>(`${environment.apiUrl}/api/owner/settings/payouts/general`)
      );
      this.payoutSettings$.next(settings);
    } catch (error) {
      console.error('Failed to load payout settings:', error);
      // Set default settings on error
      this.payoutSettings$.next(DEFAULT_PAYOUT_SETTINGS as PayoutSettings);
    }
  }

  /**
   * Get payout settings as Observable (for components that need reactive updates)
   */
  getPayoutSettings(): Observable<PayoutSettings | null> {
    return this.payoutSettings$.asObservable();
  }

  /**
   * Get current payout settings synchronously
   */
  getCurrentPayoutSettings(): PayoutSettings | null {
    return this.payoutSettings$.value;
  }

  /**
   * Create payout settings (initialize with defaults + custom values)
   */
  async createPayoutSettings(settings: Partial<PayoutSettings>): Promise<PayoutSettings> {
    // Merge with defaults to ensure all required properties are present
    const fullSettings: PayoutSettings = {
      ...DEFAULT_PAYOUT_SETTINGS,
      ...this.payoutSettings$.value,
      ...settings
    } as PayoutSettings;

    const response = await firstValueFrom(
      this.http.post<{success: boolean, data: PayoutSettings}>(`${environment.apiUrl}/api/owner/settings/payouts/general`, fullSettings)
    );

    this.payoutSettings$.next(response.data);
    return response.data;
  }

  /**
   * Update payout settings (supports partial updates)
   */
  async updatePayoutSettings(settings: Partial<PayoutSettings>): Promise<void> {
    // Get current settings and merge with updates
    const current = this.payoutSettings$.value || DEFAULT_PAYOUT_SETTINGS as PayoutSettings;
    const updated: PayoutSettings = { ...current, ...settings };

    // Optimistic update
    this.payoutSettings$.next(updated);

    try {
      const response = await firstValueFrom(
        this.http.patch<{success: boolean, data: PayoutSettings}>(`${environment.apiUrl}/api/owner/settings/payouts/general`, updated)
      );

      // Update with server response (authoritative)
      this.payoutSettings$.next(response.data);
    } catch (error) {
      // Revert optimistic update on error
      this.payoutSettings$.next(current);
      throw error;
    }
  }

  /**
   * Update a single payout setting with debounced save
   */
  updatePayoutSetting<K extends keyof PayoutSettings>(
    key: K,
    value: PayoutSettings[K]
  ): void {
    const current = this.payoutSettings$.value;
    if (!current) return;

    // Optimistic update
    const updated = { ...current, [key]: value };
    this.payoutSettings$.next(updated);

    // Debounced save (could be implemented similar to SettingsService if needed)
    this.updatePayoutSettings({ [key]: value } as Partial<PayoutSettings>);
  }

  /**
   * Reset payout settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    await this.updatePayoutSettings(DEFAULT_PAYOUT_SETTINGS);
  }

  /**
   * Check if payout settings are properly configured
   */
  isConfigured(): boolean {
    const settings = this.getCurrentPayoutSettings();
    if (!settings) return false;

    // At least one payment method should be enabled
    return settings.payoutMethodCheck ||
           settings.payoutMethodCash ||
           settings.payoutMethodStoreCredit ||
           settings.payoutMethodPayPal ||
           settings.payoutMethodVenmo ||
           settings.payoutMethodACH;
  }
}