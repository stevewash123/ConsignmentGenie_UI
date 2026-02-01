import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ConsignorPermissions } from '../models/consignor.models';

@Injectable({
  providedIn: 'root'
})
export class ConsignorPermissionsService {
  // Consignor permissions state
  private consignorPermissions$ = new BehaviorSubject<ConsignorPermissions | null>(null);
  private pendingPermissionsChanges: Record<string, any> = {};
  private permissionsSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isPermissionsSaving = false;

  readonly DEBOUNCE_MS = 800;

  // Observable for components to subscribe to
  readonly consignorPermissions = this.consignorPermissions$.asObservable();

  constructor(private http: HttpClient) {}

  // ===== CONSIGNOR PERMISSIONS METHODS =====

  /**
   * Load consignor permissions from API
   */
  async loadConsignorPermissions(): Promise<void> {
    try {
      const permissions = await firstValueFrom(
        this.http.get<ConsignorPermissions>(`${environment.apiUrl}/api/settings/consignors/permissions`)
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

  /**
   * Helper method to set nested property values in permissions object
   */
  private setNestedPermissionProperty(obj: any, key: string, value: any): void {
    // For permissions, we mostly deal with flat keys like 'canAddItems', 'canEditOwnItems', etc.
    obj[key] = value;
  }

  private schedulePermissionsSave(): void {
    if (this.permissionsSaveTimeout) {
      clearTimeout(this.permissionsSaveTimeout);
    }

    this.permissionsSaveTimeout = setTimeout(() => {
      this.savePermissions();
    }, this.DEBOUNCE_MS);
  }

  private async savePermissions(): Promise<void> {
    if (this.isPermissionsSaving || Object.keys(this.pendingPermissionsChanges).length === 0) {
      return;
    }

    this.isPermissionsSaving = true;
    const changesToSave = { ...this.pendingPermissionsChanges };
    this.pendingPermissionsChanges = {};

    try {
      const response = await firstValueFrom(
        this.http.patch<{success: boolean, data: ConsignorPermissions}>(`${environment.apiUrl}/api/settings/consignors/permissions`, changesToSave)
      );

      // Update with server response (authoritative)
      this.consignorPermissions$.next(response.data);

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
   * Force immediate permissions save
   */
  async flushPermissions(): Promise<void> {
    if (this.permissionsSaveTimeout) {
      clearTimeout(this.permissionsSaveTimeout);
      this.permissionsSaveTimeout = null;
    }
    await this.savePermissions();
  }

  /**
   * Get current consignor permissions synchronously
   */
  getCurrentConsignorPermissions(): ConsignorPermissions | null {
    return this.consignorPermissions$.value;
  }

  private showError(message: string): void {
    // TODO: Implement error display - could use toast service or similar
    console.error(message);
  }
}