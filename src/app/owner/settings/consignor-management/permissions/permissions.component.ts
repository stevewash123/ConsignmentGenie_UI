import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ConsignorPermissionsService } from '../../../../services/consignor-permissions.service';
import { ConsignorPermissions } from '../../../../models/consignor.models';

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

  constructor(private consignorPermissionsService: ConsignorPermissionsService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  async loadPermissions(): Promise<void> {
    this.isLoading.set(true);
    try {
      // For now, use the existing endpoint, but clean up the data structure
      await this.consignorPermissionsService.loadConsignorPermissions();
      // Get the current permissions and flatten them
      const currentPermissions = this.consignorPermissionsService.getCurrentConsignorPermissions();
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
      this.consignorPermissionsService.updateConsignorPermission(key, value);
      // No success message for checkbox saves - they're immediate and obvious
    } catch (error) {
      // Revert on error
      this.permissions.set(current);
      console.error('Error updating permission:', error);
      this.showError('Failed to update permission');
    } finally {
      // Quick clear since no success message to show
      setTimeout(() => this.isSaving.set(false), 300);
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


  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}