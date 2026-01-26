import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SettingsService, ConsignorPermissions } from '../../../../services/settings.service';

interface PermissionTemplate {
  name: string;
  description: string;
  permissions: ConsignorPermissions;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss']
})
export class PermissionsComponent implements OnInit {
  permissions = signal<ConsignorPermissions>({
    canAddItems: true,
    canEditOwnItems: true,
    canRemoveOwnItems: false,
    canEditPrices: true,
    isActive: true
  });

  successMessage = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  async loadPermissions(): Promise<void> {
    this.isLoading.set(true);
    try {
      // For now, use the existing endpoint, but clean up the data structure
      await this.settingsService.loadConsignorPermissions();
      // Get the current permissions and flatten them
      const currentPermissions = this.settingsService.getCurrentConsignorPermissions();
      if (currentPermissions) {
        // Handle both old nested and new flat structure
        if ('inventory' in currentPermissions) {
          // Old structure - extract from nested object
          const nested = currentPermissions as any;
          this.permissions.set({
            canAddItems: nested.inventory?.canAddItems || true,
            canEditOwnItems: nested.inventory?.canEditOwnItems || true,
            canRemoveOwnItems: nested.inventory?.canRemoveOwnItems || false,
            canEditPrices: nested.inventory?.canEditPrices || true,
            isActive: nested.isActive || true
          });
        } else {
          // New flat structure
          this.permissions.set(currentPermissions as ConsignorPermissions);
        }
      }
    } catch (error) {
      console.error('Error loading consignor permissions:', error);
      this.showError('Failed to load permissions');
    } finally {
      this.isLoading.set(false);
    }
  }

  async updatePermission(key: keyof ConsignorPermissions, value: boolean): Promise<void> {
    // Optimistic update
    const current = this.permissions();
    const updated = { ...current, [key]: value };
    this.permissions.set(updated);

    // Save to server with debounce-like behavior
    this.isSaving.set(true);
    try {
      // Use the old service method for now, but with fixed structure
      this.settingsService.updateConsignorPermission(key, value);
      this.showSuccess('Permission updated');
    } catch (error) {
      // Revert on error
      this.permissions.set(current);
      console.error('Error updating permission:', error);
      this.showError('Failed to update permission');
    } finally {
      // Delay clearing saving state to show user feedback
      setTimeout(() => this.isSaving.set(false), 1000);
    }
  }

  // Individual permission update methods
  onCanAddItemsChange(value: boolean): void {
    this.updatePermission('canAddItems', value);
  }

  onCanEditOwnItemsChange(value: boolean): void {
    this.updatePermission('canEditOwnItems', value);
  }

  onCanRemoveOwnItemsChange(value: boolean): void {
    this.updatePermission('canRemoveOwnItems', value);
  }

  onCanEditPricesChange(value: boolean): void {
    this.updatePermission('canEditPrices', value);
  }

  onIsActiveChange(value: boolean): void {
    this.updatePermission('isActive', value);
  }


  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}