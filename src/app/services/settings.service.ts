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

export interface ConsignorOnboardingSettings {
  agreementRequirement: 'none' | 'acknowledge' | 'upload';
  agreementTemplateId: string | null;
  acknowledgeTermsText: string | null;
  approvalMode: 'auto' | 'manual';
}

export interface NotificationThresholds {
  highValueSale: number;
  lowInventory: number;
}

export interface NotificationSettings {
  primaryEmail: string;
  phoneNumber?: string;
  emailPreferences: Record<string, boolean>;
  smsPreferences: Record<string, boolean>;
  thresholds: NotificationThresholds;
}

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

export interface BusinessSettings {
  commission: {
    defaultSplit: string;
    allowCustomSplitsPerConsignor: boolean;
    allowCustomSplitsPerItem: boolean;
  };
  tax: {
    salesTaxRate: number;
    taxIncludedInPrices: boolean;
    chargeTaxOnShipping: boolean;
    taxIdEin: string | null;
  };
  payouts: {
    schedule: string;
    minimumAmount: number;
    holdPeriodDays: number;
    method?: string;
    autoProcessing?: boolean;
    refundPolicy?: string;
    refundWindowDays?: number;
  };
  items: {
    defaultConsignmentPeriodDays: number;
    enableAutoMarkdowns: boolean;
    markdownSchedule: {
      after30Days: number;
      after60Days: number;
      after90DaysAction: string;
    };
    itemSubmissionMode?: string;
    autoApproveItems?: boolean;
  };
}

export interface ConsignorPermissions {
  inventory: {
    canAddItems: boolean;
    canEditOwnItems: boolean;
    canRemoveOwnItems: boolean;
    canEditPrices: boolean;
  };
  isActive: boolean;
  lastUpdated: Date;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings$ = new BehaviorSubject<OrganizationSettings | null>(null);
  private pendingChanges: Partial<OrganizationSettings> = {};
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSaving = false;

  // Profile settings state
  private profile$ = new BehaviorSubject<ShopProfile | null>(null);
  private pendingProfileChanges: Partial<ShopProfile> = {};
  private profileSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isProfileSaving = false;

  // Business settings state
  private businessSettings$ = new BehaviorSubject<BusinessSettings | null>(null);
  private pendingBusinessChanges: Record<string, any> = {};
  private businessSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isBusinessSaving = false;

  // Consignor permissions state
  private consignorPermissions$ = new BehaviorSubject<ConsignorPermissions | null>(null);
  private pendingPermissionsChanges: Record<string, any> = {};
  private permissionsSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isPermissionsSaving = false;

  // Consignor onboarding state
  private consignorOnboarding$ = new BehaviorSubject<ConsignorOnboardingSettings | null>(null);
  private pendingOnboardingChanges: Record<string, any> = {};
  private onboardingSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isOnboardingSaving = false;

  // Notification settings state
  private notificationSettings$ = new BehaviorSubject<NotificationSettings | null>(null);
  private pendingNotificationChanges: Record<string, any> = {};
  private notificationSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isNotificationSaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly settings = this.settings$.asObservable();
  readonly profile = this.profile$.asObservable();
  readonly businessSettings = this.businessSettings$.asObservable();
  readonly consignorPermissions = this.consignorPermissions$.asObservable();
  readonly consignorOnboarding = this.consignorOnboarding$.asObservable();
  readonly notificationSettings = this.notificationSettings$.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Load settings from API (call on app init or settings page load)
   */
  async loadSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<OrganizationSettings>(`${environment.apiUrl}/api/organizations/settings`)
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
      const updatedSettings = await firstValueFrom(
        this.http.patch<OrganizationSettings>(
          `${environment.apiUrl}/api/organizations/settings`,
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

  /**
   * Upload agreement template file
   */
  async uploadAgreementTemplate(file: File): Promise<AgreementTemplate> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await firstValueFrom(
      this.http.post<AgreementTemplate>(`${environment.apiUrl}/api/organizations/agreement-templates`, formData)
    );

    return response;
  }

  /**
   * Download agreement template file
   */
  async downloadAgreementTemplate(templateId: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.http.get(`${environment.apiUrl}/api/organizations/agreement-templates/${templateId}`,
        { responseType: 'blob' })
    );

    return response;
  }

  /**
   * Generate PDF from text content
   */
  async generatePdfFromText(textContent: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/organizations/generate-pdf`,
        { content: textContent, contentType: 'text' },
        { responseType: 'blob' })
    );

    return response;
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePdfFromHtml(htmlContent: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/organizations/generate-pdf`,
        { content: htmlContent, contentType: 'html' },
        { responseType: 'blob' })
    );

    return response;
  }

  /**
   * Send sample agreement as notification to owner
   */
  async sendSampleAgreement(templateContent: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/organizations/send-sample-agreement`,
        { templateContent })
    );
  }

  /**
   * Get consignor onboarding settings
   */
  async getConsignorOnboardingSettings(): Promise<ConsignorOnboardingSettings> {
    return await firstValueFrom(
      this.http.get<ConsignorOnboardingSettings>(`${environment.apiUrl}/api/owner/settings/consignor-onboarding`)
    );
  }


  // ===== PROFILE SETTINGS METHODS =====

  /**
   * Load profile from API
   */
  async loadProfile(): Promise<void> {
    try {
      const profile = await firstValueFrom(
        this.http.get<ShopProfile>(`${environment.apiUrl}/api/organizations/profile`)
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
      const updatedProfile = await firstValueFrom(
        this.http.patch<ShopProfile>(`${environment.apiUrl}/api/organizations/profile`, changesToSave)
      );

      // Update with server response (authoritative)
      this.profile$.next(updatedProfile);

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

  // ===== BUSINESS SETTINGS METHODS =====

  /**
   * Load business settings from API
   */
  async loadBusinessSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<BusinessSettings>(`${environment.apiUrl}/api/organizations/business-settings`)
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

    // Apply optimistic update to the nested structure
    const updated = JSON.parse(JSON.stringify(current));
    this.setNestedProperty(updated, key, value);
    this.businessSettings$.next(updated);

    // Queue flat key-value for PATCH API
    this.pendingBusinessChanges[key] = value;
    this.scheduleBusinessSave();
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

  private setNestedProperty(obj: any, path: string, value: any): void {
    // Convert flat keys to nested object paths
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

    const nestedPath = keyMappings[path] || path;
    const keys = nestedPath.split('.');

    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
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
      const updatedSettings = await firstValueFrom(
        this.http.patch<BusinessSettings>(`${environment.apiUrl}/api/organizations/business-settings`, changesToSave)
      );

      // Update with server response (authoritative)
      this.businessSettings$.next(updatedSettings);

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

  // ===== CONSIGNOR PERMISSIONS METHODS =====

  /**
   * Load consignor permissions from API
   */
  async loadConsignorPermissions(): Promise<void> {
    try {
      const permissions = await firstValueFrom(
        this.http.get<ConsignorPermissions>(`${environment.apiUrl}/api/organizations/default-consignor-permissions`)
      );
      this.consignorPermissions$.next(permissions);
    } catch (error) {
      console.error('Failed to load consignor permissions:', error);
      this.consignorPermissions$.next(null);
    }
  }

  /**
   * Update a consignor permission with automatic debounced save
   */
  updateConsignorPermission(key: string, value: any): void {
    const current = this.consignorPermissions$.value;
    if (!current) return;

    // Apply optimistic update
    const updated = JSON.parse(JSON.stringify(current));
    this.setNestedPermissionProperty(updated, key, value);
    this.consignorPermissions$.next(updated);

    // Queue for save
    this.pendingPermissionsChanges[key] = value;
    this.schedulePermissionsSave();
  }

  /**
   * Update multiple consignor permissions at once
   */
  updateConsignorPermissions(changes: Record<string, any>): void {
    const current = this.consignorPermissions$.value;
    if (!current) return;

    // Apply optimistic updates
    const updated = JSON.parse(JSON.stringify(current));
    Object.entries(changes).forEach(([key, value]) => {
      this.setNestedPermissionProperty(updated, key, value);
    });
    this.consignorPermissions$.next(updated);

    // Queue changes for save
    Object.assign(this.pendingPermissionsChanges, changes);
    this.schedulePermissionsSave();
  }

  private setNestedPermissionProperty(obj: any, path: string, value: any): void {
    // Convert flat keys to nested object paths for permissions
    const keyMappings: Record<string, string> = {
      // Inventory permissions
      'canAddItems': 'inventory.canAddItems',
      'canEditOwnItems': 'inventory.canEditOwnItems',
      'canRemoveOwnItems': 'inventory.canRemoveOwnItems',
      'canEditPrices': 'inventory.canEditPrices',

      // General permissions
      'isActive': 'isActive'
    };

    const nestedPath = keyMappings[path] || path;
    const keys = nestedPath.split('.');

    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  private schedulePermissionsSave(): void {
    if (this.permissionsSaveTimeout) {
      clearTimeout(this.permissionsSaveTimeout);
    }

    this.permissionsSaveTimeout = setTimeout(() => {
      this.saveConsignorPermissions();
    }, this.DEBOUNCE_MS);
  }

  private async saveConsignorPermissions(): Promise<void> {
    if (this.isPermissionsSaving || Object.keys(this.pendingPermissionsChanges).length === 0) {
      return;
    }

    this.isPermissionsSaving = true;
    const changesToSave = { ...this.pendingPermissionsChanges };
    this.pendingPermissionsChanges = {};

    try {
      const updatedPermissions = await firstValueFrom(
        this.http.patch<ConsignorPermissions>(`${environment.apiUrl}/api/organizations/default-consignor-permissions`, changesToSave)
      );

      // Update with server response (authoritative)
      this.consignorPermissions$.next(updatedPermissions);

    } catch (error) {
      console.error('Failed to save consignor permissions:', error);

      // Revert optimistic changes
      this.revertPermissionsChanges(changesToSave);
      this.showError('Failed to save consignor permissions. Please try again.');

    } finally {
      this.isPermissionsSaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingPermissionsChanges).length > 0) {
        this.schedulePermissionsSave();
      }
    }
  }

  private revertPermissionsChanges(changes: Record<string, any>): void {
    // Re-fetch from server to get correct state
    this.loadConsignorPermissions();
  }

  /**
   * Force immediate consignor permissions save
   */
  async flushConsignorPermissions(): Promise<void> {
    if (this.permissionsSaveTimeout) {
      clearTimeout(this.permissionsSaveTimeout);
      this.permissionsSaveTimeout = null;
    }
    await this.saveConsignorPermissions();
  }

  /**
   * Get current consignor permissions synchronously
   */
  getCurrentConsignorPermissions(): ConsignorPermissions | null {
    return this.consignorPermissions$.value;
  }

  // ===== CONSIGNOR ONBOARDING METHODS =====

  /**
   * Load consignor onboarding settings from API
   */
  async loadConsignorOnboarding(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<ConsignorOnboardingSettings>(`${environment.apiUrl}/api/owner/settings/consignor-onboarding`)
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
  updateConsignorOnboardingSettings(changes: Partial<ConsignorOnboardingSettings>): void {
    const current = this.consignorOnboarding$.value;
    if (!current) return;

    // Optimistic update
    const updated = { ...current, ...changes };
    this.consignorOnboarding$.next(updated);

    // Queue for save
    Object.assign(this.pendingOnboardingChanges, changes);
    this.scheduleOnboardingSave();
  }

  private scheduleOnboardingSave(): void {
    if (this.onboardingSaveTimeout) {
      clearTimeout(this.onboardingSaveTimeout);
    }

    this.onboardingSaveTimeout = setTimeout(() => {
      this.saveConsignorOnboarding();
    }, this.DEBOUNCE_MS);
  }

  private async saveConsignorOnboarding(): Promise<void> {
    if (this.isOnboardingSaving || Object.keys(this.pendingOnboardingChanges).length === 0) {
      return;
    }

    this.isOnboardingSaving = true;
    const changesToSave = { ...this.pendingOnboardingChanges };
    this.pendingOnboardingChanges = {};

    try {
      const updatedSettings = await firstValueFrom(
        this.http.put<ConsignorOnboardingSettings>(
          `${environment.apiUrl}/api/owner/settings/consignor-onboarding`,
          { ...this.consignorOnboarding$.value, ...changesToSave }
        )
      );

      // Update with server response (authoritative)
      this.consignorOnboarding$.next(updatedSettings);

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
    await this.saveConsignorOnboarding();
  }

  /**
   * Get current consignor onboarding settings synchronously
   */
  getCurrentConsignorOnboarding(): ConsignorOnboardingSettings | null {
    return this.consignorOnboarding$.value;
  }

  // ===== NOTIFICATION SETTINGS METHODS =====

  /**
   * Load notification settings from API
   */
  async loadNotificationSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<NotificationSettings>(`${environment.apiUrl}/api/organizations/notification-settings`)
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
  updateNotificationSetting<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]): void {
    const current = this.notificationSettings$.value;
    if (!current) return;

    // Optimistic update
    const updated = { ...current, [key]: value };
    this.notificationSettings$.next(updated);

    // Queue for save
    this.pendingNotificationChanges[key] = value;
    this.scheduleNotificationSave();
  }

  /**
   * Update email preference for a specific notification type
   */
  updateEmailPreference(notificationType: string, enabled: boolean): void {
    const current = this.notificationSettings$.value;
    if (!current) return;

    // Optimistic update
    const updated = {
      ...current,
      emailPreferences: { ...current.emailPreferences, [notificationType]: enabled }
    };
    this.notificationSettings$.next(updated);

    // Queue for save with flat key structure
    this.pendingNotificationChanges[`Email_${notificationType}`] = enabled;
    this.scheduleNotificationSave();
  }

  /**
   * Update SMS preference for a specific notification type
   */
  updateSmsPreference(notificationType: string, enabled: boolean): void {
    const current = this.notificationSettings$.value;
    if (!current) return;

    // Optimistic update
    const updated = {
      ...current,
      smsPreferences: { ...current.smsPreferences, [notificationType]: enabled }
    };
    this.notificationSettings$.next(updated);

    // Queue for save with flat key structure
    this.pendingNotificationChanges[`Sms_${notificationType}`] = enabled;
    this.scheduleNotificationSave();
  }

  /**
   * Update notification threshold
   */
  updateNotificationThreshold(thresholdType: keyof NotificationThresholds, value: number): void {
    const current = this.notificationSettings$.value;
    if (!current) return;

    // Optimistic update
    const updated = {
      ...current,
      thresholds: { ...current.thresholds, [thresholdType]: value }
    };
    this.notificationSettings$.next(updated);

    // Queue for save
    this.pendingNotificationChanges[`${thresholdType}Threshold`] = value;
    this.scheduleNotificationSave();
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
      const updatedSettings = await firstValueFrom(
        this.http.patch<NotificationSettings>(`${environment.apiUrl}/api/organizations/notification-settings`, changesToSave)
      );

      // Update with server response (authoritative)
      this.notificationSettings$.next(updatedSettings);

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
}

export interface AgreementTemplate {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  contentType: string;
}