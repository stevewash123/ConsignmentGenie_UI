import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface InventoryPermissions {
  canAddItems: boolean;
  canEditOwnItems: boolean;
  canRemoveOwnItems: boolean;
  canEditPrices: boolean;
}



interface ConsignorPermissions {
  inventory: InventoryPermissions;
  isActive: boolean;
  lastUpdated: Date;
}

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
  permissionsForm!: FormGroup;
  defaultPermissions = signal<ConsignorPermissions | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDefaultPermissions();
  }

  private initializeForm(): void {
    this.permissionsForm = this.fb.group({
      inventory: this.fb.group({
        canAddItems: [true],
        canEditOwnItems: [true],
        canRemoveOwnItems: [false],
        canEditPrices: [true]
      })
    });
  }



  private async loadDefaultPermissions(): Promise<void> {
    try {
      this.isLoading.set(true);
      const permissions = await this.http.get<ConsignorPermissions>(`${environment.apiUrl}/api/organization/default-consignor-permissions`).toPromise();
      if (permissions) {
        this.defaultPermissions.set(permissions);
        this.permissionsForm.patchValue(permissions);
      }
    } catch (error) {
      this.showError('Failed to load default permissions');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveDefaultPermissions(): Promise<void> {
    if (!this.permissionsForm.valid) {
      return;
    }

    this.isSaving.set(true);
    try {
      const formData = {
        ...this.permissionsForm.value,
        isActive: true,
        lastUpdated: new Date()
      };

      await this.http.put(`${environment.apiUrl}/api/organization/default-consignor-permissions`, formData).toPromise();
      this.defaultPermissions.set(formData);
      this.showSuccess('Default permissions saved successfully');
    } catch (error) {
      this.showError('Failed to save default permissions');
    } finally {
      this.isSaving.set(false);
    }
  }


  resetToDefaults(): void {
    this.initializeForm();
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