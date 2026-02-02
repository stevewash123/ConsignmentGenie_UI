import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BusinessSettings } from '../models/business.models';

@Injectable({
  providedIn: 'root'
})
export class BusinessSettingsService {
  // Tax settings state
  private businessSettings$ = new BehaviorSubject<BusinessSettings | null>(null);
  private pendingBusinessChanges: Record<string, any> = {};
  private businessSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isBusinessSaving = false;

  // Shop policies state
  private shopPolicies$ = new BehaviorSubject<any | null>(null);
  private pendingPolicyChanges: Record<string, any> = {};
  private policySaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isPolicySaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observables for components to subscribe to
  readonly businessSettings = this.businessSettings$.asObservable();
  readonly shopPolicies = this.shopPolicies$.asObservable();

  constructor(private http: HttpClient) {}

  // ===== BUSINESS SETTINGS METHODS =====

  /**
   * Load business settings from API
   */
  async loadBusinessSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<BusinessSettings>(`${environment.apiUrl}/api/owner/settings/business/tax-settings`)
      );
      this.businessSettings$.next(settings);
    } catch (error) {
      console.error('Failed to load business settings:', error);
      this.businessSettings$.next(null);
    }
  }

  /**
   * Update a business setting with automatic debounced save
   * Uses flat key-value structure for PATCH API compatibility
   */
  updateBusinessSetting(key: string, value: any): void {
    const current = this.businessSettings$.value;
    if (!current) return;

    // Convert flat keys to nested object paths for optimistic updates
    const nestedPath = this.getBusinessSettingPath(key);

    // Apply optimistic update to the nested structure
    const updated = JSON.parse(JSON.stringify(current));
    this.setNestedProperty(updated, nestedPath, value);
    this.businessSettings$.next(updated);

    // Queue flat key-value for PATCH API
    this.pendingBusinessChanges[key] = value;
    this.scheduleBusinessSave();
  }

  private getBusinessSettingPath(key: string): string {
    const keyMappings: Record<string, string> = {
      // Commission settings
      'defaultSplit': 'commission.defaultSplit',
      'allowCustomSplitsPerConsignor': 'commission.allowCustomSplitsPerConsignor',
      'allowCustomSplitsPerItem': 'commission.allowCustomSplitsPerItem',

      // Tax settings
      'salesTaxRate': 'tax.salesTaxRate',
      'taxIncludedInPrices': 'tax.taxIncludedInPrices',
      'chargeTaxOnShipping': 'tax.chargeTaxOnShipping',
      'taxIdEin': 'tax.taxIdEin',

      // Payout settings
      'holdPeriodDays': 'payouts.holdPeriodDays',
      'minimumAmount': 'payouts.minimumAmount',
      'payoutMethod': 'payouts.method',
      'payoutSchedule': 'payouts.schedule',
      'autoProcessing': 'payouts.autoProcessing',
      'refundPolicy': 'payouts.refundPolicy',
      'refundWindowDays': 'payouts.refundWindowDays',

      // Item settings
      'defaultConsignmentPeriodDays': 'items.defaultConsignmentPeriodDays',
      'enableAutoMarkdowns': 'items.enableAutoMarkdowns',
      'itemSubmissionMode': 'items.itemSubmissionMode',
      'autoApproveItems': 'items.autoApproveItems'
    };

    return keyMappings[key] || key;
  }

  /**
   * Utility method to set nested property values
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

  /**
   * Update multiple business settings at once
   */
  updateBusinessSettings(changes: Record<string, any>): void {
    const current = this.businessSettings$.value;
    if (!current) return;

    // Apply optimistic updates
    const updated = JSON.parse(JSON.stringify(current));
    Object.entries(changes).forEach(([key, value]) => {
      this.setNestedProperty(updated, key, value);
    });
    this.businessSettings$.next(updated);

    // Queue changes for save
    Object.assign(this.pendingBusinessChanges, changes);
    this.scheduleBusinessSave();
  }

  private scheduleBusinessSave(): void {
    if (this.businessSaveTimeout) {
      clearTimeout(this.businessSaveTimeout);
    }

    this.businessSaveTimeout = setTimeout(() => {
      this.saveBusinessSettings();
    }, this.DEBOUNCE_MS);
  }

  private async saveBusinessSettings(): Promise<void> {
    if (this.isBusinessSaving || Object.keys(this.pendingBusinessChanges).length === 0) {
      return;
    }

    this.isBusinessSaving = true;
    const changesToSave = { ...this.pendingBusinessChanges };
    this.pendingBusinessChanges = {};

    try {
      const response = await firstValueFrom(
        this.http.patch<{success: boolean, data: BusinessSettings}>(`${environment.apiUrl}/api/owner/settings/business/tax-settings`, changesToSave)
      );

      // Update with server response (authoritative)
      this.businessSettings$.next(response.data);

    } catch (error) {
      console.error('Failed to save business settings:', error);

      // Revert optimistic changes
      this.revertBusinessChanges(changesToSave);
      this.showError('Failed to save business settings. Please try again.');

    } finally {
      this.isBusinessSaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingBusinessChanges).length > 0) {
        this.scheduleBusinessSave();
      }
    }
  }

  private revertBusinessChanges(changes: Record<string, any>): void {
    // Re-fetch from server to get correct state
    this.loadBusinessSettings();
  }

  /**
   * Force immediate business settings save
   */
  async flushBusinessSettings(): Promise<void> {
    if (this.businessSaveTimeout) {
      clearTimeout(this.businessSaveTimeout);
      this.businessSaveTimeout = null;
    }
    await this.saveBusinessSettings();
  }

  /**
   * Get current business settings synchronously
   */
  getCurrentBusinessSettings(): BusinessSettings | null {
    return this.businessSettings$.value;
  }

  private showError(message: string): void {
    // TODO: Implement error display - could use toast service or similar
    console.error(message);
  }

  // ===== SHOP POLICIES METHODS =====

  /**
   * Load shop policies from API
   */
  async loadShopPolicies(): Promise<void> {
    try {
      const policies = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/api/owner/settings/business/shop-policies`)
      );
      this.shopPolicies$.next(policies);
    } catch (error) {
      console.error('Failed to load shop policies:', error);
      this.shopPolicies$.next(null);
    }
  }

  /**
   * Update a shop policy setting with automatic debounced save
   */
  updateShopPolicySetting(key: string, value: any): void {
    const current = this.shopPolicies$.value;
    if (!current) return;

    // Apply optimistic update
    const updated = JSON.parse(JSON.stringify(current));
    this.setNestedProperty(updated, key, value);
    this.shopPolicies$.next(updated);

    // Queue for save
    this.pendingPolicyChanges[key] = value;
    this.schedulePolicySave();
  }

  private schedulePolicySave(): void {
    if (this.policySaveTimeout) {
      clearTimeout(this.policySaveTimeout);
    }

    this.policySaveTimeout = setTimeout(() => {
      this.saveShopPolicies();
    }, this.DEBOUNCE_MS);
  }

  private async saveShopPolicies(): Promise<void> {
    if (this.isPolicySaving || Object.keys(this.pendingPolicyChanges).length === 0) {
      return;
    }

    this.isPolicySaving = true;
    const changesToSave = { ...this.pendingPolicyChanges };
    this.pendingPolicyChanges = {};

    try {
      const response = await firstValueFrom(
        this.http.patch<{success: boolean, data: any}>(`${environment.apiUrl}/api/owner/settings/business/shop-policies`, changesToSave)
      );

      // Update with server response (authoritative)
      this.shopPolicies$.next(response.data);

    } catch (error) {
      console.error('Failed to save shop policies:', error);

      // Revert optimistic changes
      this.revertPolicyChanges(changesToSave);
      this.showError('Failed to save shop policies. Please try again.');

    } finally {
      this.isPolicySaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingPolicyChanges).length > 0) {
        this.schedulePolicySave();
      }
    }
  }

  private revertPolicyChanges(changes: Record<string, any>): void {
    // Re-fetch from server to get correct state
    this.loadShopPolicies();
  }

  /**
   * Force immediate shop policies save
   */
  async flushShopPolicies(): Promise<void> {
    if (this.policySaveTimeout) {
      clearTimeout(this.policySaveTimeout);
      this.policySaveTimeout = null;
    }
    await this.saveShopPolicies();
  }

  /**
   * Get current shop policies synchronously
   */
  getCurrentShopPolicies(): any | null {
    return this.shopPolicies$.value;
  }
}