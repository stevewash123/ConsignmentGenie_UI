import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { StorefrontSettings } from '../models/storefront.models';

@Injectable({
  providedIn: 'root'
})
export class StorefrontSettingsService {
  // Storefront settings state
  private storefrontSettings$ = new BehaviorSubject<StorefrontSettings | null>(null);
  private pendingStorefrontChanges: Record<string, any> = {};
  private storefrontSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isStorefrontSaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly storefrontSettings = this.storefrontSettings$.asObservable();

  constructor(private http: HttpClient) {}

  // ============================================================================
  // STOREFRONT SETTINGS METHODS
  // ============================================================================

  async loadStorefrontSettings(): Promise<void> {
    console.log('🔄 Loading storefront settings...');
    this.storefrontSettings$.next(null); // This causes loading spinner
    try {
      const settings = await firstValueFrom(
        this.http.get<StorefrontSettings>(`${environment.apiUrl}/api/owner/settings/sales`)
      );
      console.log('✅ Storefront settings loaded:', settings);
      this.storefrontSettings$.next(settings);
    } catch (error) {
      console.error('Failed to load storefront settings:', error);
      // Set default settings on error
      this.storefrontSettings$.next({
        selectedChannel: 'cg-storefront',
        cgStorefront: {
          storeSlug: '',
          bannerImageUrl: '',
          stripeConnected: false,
          paymentSettings: {
            enableCreditCards: true,
            enableBuyNow: true,
            enableLayaway: false,
            layawayDepositPercentage: 25,
            layawayTermsInDays: 30
          },
          shippingSettings: {
            enableShipping: false,
            flatRate: 0,
            freeShippingThreshold: 0,
            shipsFromZipCode: ''
          },
          salesSettings: {
            enableBestOffer: false,
            autoAcceptPercentage: 0,
            minimumOfferPercentage: 0
          }
        }
      });
    }
  }

  updateStorefrontSetting(key: string, value: any): void {
    const current = this.storefrontSettings$.value;
    if (!current) return;

    // Optimistic update
    const updated = JSON.parse(JSON.stringify(current));
    this.setNestedProperty(updated, key, value);
    this.storefrontSettings$.next(updated);

    // Queue for save
    this.pendingStorefrontChanges[key] = value;
    this.scheduleStorefrontSave();
  }

  private scheduleStorefrontSave(): void {
    if (this.storefrontSaveTimeout) {
      clearTimeout(this.storefrontSaveTimeout);
    }

    this.storefrontSaveTimeout = setTimeout(() => {
      this.saveStorefrontSettings();
    }, this.DEBOUNCE_MS);
  }

  private async saveStorefrontSettings(): Promise<void> {
    if (this.isStorefrontSaving || Object.keys(this.pendingStorefrontChanges).length === 0) {
      console.log('🚫 Skipping save - already saving or no changes');
      return;
    }

    console.log('🚀 Starting save, setting isStorefrontSaving = true');
    this.isStorefrontSaving = true;
    const changesToSave = { ...this.pendingStorefrontChanges };
    this.pendingStorefrontChanges = {};

    try {
      console.log('💾 Saving storefront settings:', changesToSave);
      const response = await firstValueFrom(
        this.http.patch<{success: boolean, data: StorefrontSettings}>(`${environment.apiUrl}/api/owner/settings/sales`, changesToSave)
      );

      // Update with server response
      console.log('✅ Save successful, updating settings:', response.data);
      this.storefrontSettings$.next(response.data);
      console.log('Storefront settings saved successfully');
    } catch (error) {
      console.error('❌ Failed to save storefront settings:', error);
      // Revert optimistic updates
      console.log('🔄 Reverting changes due to error...');
      this.revertStorefrontChanges(changesToSave);

      // Retry once
      if (Object.keys(changesToSave).length > 0) {
        Object.assign(this.pendingStorefrontChanges, changesToSave);
        this.scheduleStorefrontSave();
      }
    } finally {
      console.log('🏁 Setting isStorefrontSaving = false');
      this.isStorefrontSaving = false;
    }
  }

  private revertStorefrontChanges(changes: Record<string, any>): void {
    console.log('🔄 Reverting storefront changes:', changes);
    // Re-fetch from server to get correct state
    this.loadStorefrontSettings();
  }

  /**
   * Force immediate storefront settings save
   */
  async flushStorefrontSettings(): Promise<void> {
    if (this.storefrontSaveTimeout) {
      clearTimeout(this.storefrontSaveTimeout);
      this.storefrontSaveTimeout = null;
    }
    await this.saveStorefrontSettings();
  }

  /**
   * Get current storefront settings synchronously
   */
  getCurrentStorefrontSettings(): StorefrontSettings | null {
    return this.storefrontSettings$.value;
  }

  /**
   * Utility method to set nested properties (used by all complex settings)
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}