import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface OrganizationSettings {
  // Consignment Agreements
  autoSendAgreementOnRegister: boolean;
  requireSignedAgreement: boolean;
  agreementTemplateId: string | null;

  // Notifications
  emailOnNewConsignor: boolean;
  emailOnItemSold: boolean;

  // Add other settings as needed...
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings$ = new BehaviorSubject<OrganizationSettings | null>(null);
  private pendingChanges: Partial<OrganizationSettings> = {};
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly settings = this.settings$.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Load settings from API (call on app init or settings page load)
   */
  async loadSettings(): Promise<void> {
    try {
      const orgId = this.getOrgId();
      const settings = await firstValueFrom(
        this.http.get<OrganizationSettings>(`${environment.apiUrl}/api/organizations/${orgId}/settings`)
      );
      this.settings$.next(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set default settings on error
      this.settings$.next({
        autoSendAgreementOnRegister: false,
        requireSignedAgreement: true,
        agreementTemplateId: null,
        emailOnNewConsignor: true,
        emailOnItemSold: false
      });
    }
  }

  /**
   * Update a single setting - optimistic with debounced save
   */
  updateSetting<K extends keyof OrganizationSettings>(
    key: K,
    value: OrganizationSettings[K]
  ): void {
    const current = this.settings$.value;
    if (!current) return;

    // 1. Optimistic update - UI sees change immediately
    this.settings$.next({ ...current, [key]: value });

    // 2. Track pending change
    this.pendingChanges[key] = value;

    // 3. Debounce the save
    this.scheduleSave();
  }

  /**
   * Update multiple settings at once
   */
  updateSettings(changes: Partial<OrganizationSettings>): void {
    const current = this.settings$.value;
    if (!current) return;

    // 1. Optimistic update
    this.settings$.next({ ...current, ...changes });

    // 2. Track pending changes
    Object.assign(this.pendingChanges, changes);

    // 3. Debounce the save
    this.scheduleSave();
  }

  private scheduleSave(): void {
    // Clear existing timer
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timer
    this.saveTimeout = setTimeout(() => this.save(), this.DEBOUNCE_MS);
  }

  private async save(): Promise<void> {
    if (this.isSaving || Object.keys(this.pendingChanges).length === 0) {
      return;
    }

    this.isSaving = true;
    const changesToSave = { ...this.pendingChanges };
    this.pendingChanges = {};

    try {
      const orgId = this.getOrgId();
      const updatedSettings = await firstValueFrom(
        this.http.patch<OrganizationSettings>(
          `${environment.apiUrl}/api/organizations/${orgId}/settings`,
          changesToSave
        )
      );

      // Update with server response to ensure consistency
      this.settings$.next(updatedSettings);

    } catch (error) {
      console.error('Failed to save settings:', error);

      // Revert optimistic changes
      this.revertChanges(changesToSave);
      this.showError('Failed to save settings. Please try again.');

    } finally {
      this.isSaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingChanges).length > 0) {
        this.scheduleSave();
      }
    }
  }

  private revertChanges(changes: Partial<OrganizationSettings>): void {
    // Re-fetch from server to get correct state
    // This is simpler than tracking previous values
    this.loadSettings();
  }

  private getOrgId(): string {
    // Get from auth service
    const user = this.authService.getCurrentUser();
    return user?.organizationId?.toString() || '1'; // Fallback to 1 for now
  }

  private showError(message: string): void {
    // TODO: Integrate with toast service when available
    console.error(message);
  }

  /**
   * Force immediate save (call before critical navigation if needed)
   */
  async flush(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.save();
  }

  /**
   * Get current settings synchronously
   */
  getCurrentSettings(): OrganizationSettings | null {
    return this.settings$.value;
  }
}