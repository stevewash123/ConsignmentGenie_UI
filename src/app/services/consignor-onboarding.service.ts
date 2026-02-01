import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ConsignorOnboardingSettings } from '../models/consignor.models';

@Injectable({
  providedIn: 'root'
})
export class ConsignorOnboardingService {
  // Consignor onboarding state
  private consignorOnboarding$ = new BehaviorSubject<ConsignorOnboardingSettings | null>(null);
  private pendingOnboardingChanges: Record<string, any> = {};
  private onboardingSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isOnboardingSaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly consignorOnboarding = this.consignorOnboarding$.asObservable();

  constructor(private http: HttpClient) {}

  // ===== CONSIGNOR ONBOARDING METHODS =====

  /**
   * Load consignor onboarding settings from API
   */
  async loadConsignorOnboarding(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<ConsignorOnboardingSettings>(`${environment.apiUrl}/api/settings/consignors/onboarding`)
      );

      this.consignorOnboarding$.next(settings);
    } catch (error) {
      console.error('Failed to load consignor onboarding settings:', error);
      this.consignorOnboarding$.next(null);
    }
  }

  /**
   * Update a consignor onboarding setting with automatic debounced save
   */
  updateConsignorOnboardingSetting<K extends keyof ConsignorOnboardingSettings>(key: K, value: ConsignorOnboardingSettings[K]): void {
    const current = this.consignorOnboarding$.value;
    if (!current) return;

    // Optimistic update
    const updated = { ...current, [key]: value };
    this.consignorOnboarding$.next(updated);

    // Queue for save
    this.pendingOnboardingChanges[key] = value;
    this.scheduleOnboardingSave();
  }

  /**
   * Update multiple consignor onboarding settings at once
   */
  updateConsignorOnboardingSettings(changes: Record<string, any>): void {
    const current = this.consignorOnboarding$.value;
    if (!current) return;

    // Apply optimistic updates
    const updated = { ...current, ...changes };
    this.consignorOnboarding$.next(updated);

    // Queue changes for save
    Object.assign(this.pendingOnboardingChanges, changes);
    this.scheduleOnboardingSave();
  }

  private scheduleOnboardingSave(): void {
    if (this.onboardingSaveTimeout) {
      clearTimeout(this.onboardingSaveTimeout);
    }

    this.onboardingSaveTimeout = setTimeout(() => {
      this.saveOnboarding();
    }, this.DEBOUNCE_MS);
  }

  private async saveOnboarding(): Promise<void> {
    if (this.isOnboardingSaving || Object.keys(this.pendingOnboardingChanges).length === 0) {
      return;
    }

    this.isOnboardingSaving = true;
    const changesToSave = { ...this.pendingOnboardingChanges };
    this.pendingOnboardingChanges = {};

    try {
      // Send the full object with changes for PUT request
      const requestData = { ...this.consignorOnboarding$.value, ...changesToSave };

      const response = await firstValueFrom(
        this.http.put<{success: boolean, data: ConsignorOnboardingSettings}>(
          `${environment.apiUrl}/api/settings/consignors/onboarding`,
          requestData
        )
      );

      // Update with server response (authoritative)
      this.consignorOnboarding$.next(response.data);

    } catch (error) {
      console.error('Failed to save consignor onboarding settings:', error);

      // Revert optimistic changes
      this.revertOnboardingChanges(changesToSave);
      this.showError('Failed to save consignor onboarding settings. Please try again.');

    } finally {
      this.isOnboardingSaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingOnboardingChanges).length > 0) {
        this.scheduleOnboardingSave();
      }
    }
  }

  private revertOnboardingChanges(changes: Record<string, any>): void {
    // Re-fetch from server to get correct state
    this.loadConsignorOnboarding();
  }

  /**
   * Force immediate consignor onboarding save
   */
  async flushConsignorOnboarding(): Promise<void> {
    if (this.onboardingSaveTimeout) {
      clearTimeout(this.onboardingSaveTimeout);
      this.onboardingSaveTimeout = null;
    }
    await this.saveOnboarding();
  }

  /**
   * Get current consignor onboarding settings synchronously
   */
  getCurrentConsignorOnboarding(): ConsignorOnboardingSettings | null {
    return this.consignorOnboarding$.value;
  }

  private showError(message: string): void {
    // TODO: Implement error display - could use toast service or similar
    console.error(message);
  }
}