import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { SettingsService, ConsignorPermissions } from '../../../../services/settings.service';
import { Subscription } from 'rxjs';

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
export class PermissionsComponent implements OnInit, OnDestroy {
  permissions = signal<ConsignorPermissions | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  private subscriptions = new Subscription();

  // Auto-save status computed from permissions state
  autoSaveStatus = computed(() => {
    const permissions = this.permissions();
    return permissions ? 'Saved automatically' : 'Loading...';
  });

  constructor(
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadPermissions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions(): void {
    // Subscribe to permissions changes from the service
    this.subscriptions.add(
      this.settingsService.consignorPermissions.subscribe(permissions => {
        this.permissions.set(permissions);
      })
    );
  }

  async loadPermissions(): Promise<void> {
    try {
      await this.settingsService.loadConsignorPermissions();
    } catch (error) {
      console.error('Error loading consignor permissions:', error);
      this.showError('Failed to load permissions');
    }
  }

  // Individual permission update methods - these trigger debounced saves
  onCanAddItemsChange(value: boolean): void {
    this.settingsService.updateConsignorPermission('canAddItems', value);
  }

  onCanEditOwnItemsChange(value: boolean): void {
    this.settingsService.updateConsignorPermission('canEditOwnItems', value);
  }

  onCanRemoveOwnItemsChange(value: boolean): void {
    this.settingsService.updateConsignorPermission('canRemoveOwnItems', value);
  }

  onCanEditPricesChange(value: boolean): void {
    this.settingsService.updateConsignorPermission('canEditPrices', value);
  }

  onIsActiveChange(value: boolean): void {
    this.settingsService.updateConsignorPermission('isActive', value);
  }

  resetToDefaults(): void {
    // Reset to default values with auto-save
    const defaultPermissions = {
      'canAddItems': true,
      'canEditOwnItems': true,
      'canRemoveOwnItems': false,
      'canEditPrices': true,
      'isActive': true
    };

    this.settingsService.updateConsignorPermissions(defaultPermissions);
  }



  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}