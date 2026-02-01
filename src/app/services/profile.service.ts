import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ShopProfile {
  shopName: string;
  shopDescription: string | null;
  shopLogoUrl: string | null;
  shopBannerUrl: string | null;
  shopAddress1: string | null;
  shopAddress2: string | null;
  shopCity: string | null;
  shopState: string | null;
  shopZip: string | null;
  shopCountry: string;
  shopPhone: string | null;
  shopEmail: string | null;
  shopWebsite: string | null;
  shopTimezone: string;
  taxRate: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // Profile state
  private profile$ = new BehaviorSubject<ShopProfile | null>(null);
  private pendingProfileChanges: Partial<ShopProfile> = {};
  private profileSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isProfileSaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly profile = this.profile$.asObservable();

  constructor(private http: HttpClient) {}

  // ===== PROFILE SETTINGS METHODS =====

  /**
   * Load profile from API
   */
  async loadProfile(): Promise<void> {
    try {
      const profile = await firstValueFrom(
        this.http.get<ShopProfile>(`${environment.apiUrl}/api/settings/profile/basic`)
      );
      this.profile$.next(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.profile$.next(null);
    }
  }

  /**
   * Update a profile setting with automatic debounced save
   */
  updateProfileSetting<K extends keyof ShopProfile>(key: K, value: ShopProfile[K]): void {
    const current = this.profile$.value;
    if (!current) return;

    // Optimistic update
    const updated = { ...current, [key]: value };
    this.profile$.next(updated);

    // Queue for save
    this.pendingProfileChanges[key] = value;
    this.scheduleProfileSave();
  }

  private scheduleProfileSave(): void {
    if (this.profileSaveTimeout) {
      clearTimeout(this.profileSaveTimeout);
    }

    this.profileSaveTimeout = setTimeout(() => {
      this.saveProfile();
    }, this.DEBOUNCE_MS);
  }

  private async saveProfile(): Promise<void> {
    if (this.isProfileSaving || Object.keys(this.pendingProfileChanges).length === 0) {
      return;
    }

    this.isProfileSaving = true;
    const changesToSave = { ...this.pendingProfileChanges };
    this.pendingProfileChanges = {};

    try {
      const response = await firstValueFrom(
        this.http.patch<{success: boolean, data: ShopProfile}>(`${environment.apiUrl}/api/settings/profile/basic`, changesToSave)
      );

      // Update with server response (authoritative)
      this.profile$.next(response.data);

    } catch (error) {
      console.error('Failed to save profile:', error);

      // Revert optimistic changes
      this.revertProfileChanges(changesToSave);
      this.showError('Failed to save profile. Please try again.');

    } finally {
      this.isProfileSaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingProfileChanges).length > 0) {
        this.scheduleProfileSave();
      }
    }
  }

  private revertProfileChanges(changes: Partial<ShopProfile>): void {
    // Re-fetch from server to get correct state
    this.loadProfile();
  }

  /**
   * Force immediate profile save
   */
  async flushProfile(): Promise<void> {
    if (this.profileSaveTimeout) {
      clearTimeout(this.profileSaveTimeout);
      this.profileSaveTimeout = null;
    }
    await this.saveProfile();
  }

  /**
   * Get current profile synchronously
   */
  getCurrentProfile(): ShopProfile | null {
    return this.profile$.value;
  }

  private showError(message: string): void {
    // TODO: Implement error display - could use toast service or similar
    console.error(message);
  }
}