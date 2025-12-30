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
  canMarkAsSold: boolean;
  canViewAllItems: boolean;
  canManageCategories: boolean;
}

interface AnalyticsPermissions {
  canViewBasicAnalytics: boolean;
  canViewDetailedAnalytics: boolean;
  canViewSalesHistory: boolean;
  canViewPayoutHistory: boolean;
  canExportReports: boolean;
  canViewRevenue: boolean;
}

interface AccountPermissions {
  canUpdateProfile: boolean;
  canChangePaymentPreferences: boolean;
  canCancelAccount: boolean;
  canManageNotifications: boolean;
  canContactSupport: boolean;
}

interface ConsignorPermissions {
  inventory: InventoryPermissions;
  analytics: AnalyticsPermissions;
  account: AccountPermissions;
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
  styles: [`
    .permissions-section {
      padding: 2rem;
      max-width: 1000px;
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .section-description {
      color: #6b7280;
    }

    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .permission-group {
      margin-bottom: 2rem;
    }

    .permission-group h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .permission-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .permission-item {
      display: flex;
      align-items: start;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }

    .permission-item:hover {
      background: #f8fafc;
    }

    .permission-item input[type="checkbox"] {
      margin-top: 0.125rem;
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
    }

    .permission-content {
      flex: 1;
    }

    .permission-label {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .permission-description {
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .template-selector {
      margin-bottom: 1.5rem;
    }

    .template-selector label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .template-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .template-card:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }

    .template-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .template-name {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .template-description {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .btn-primary, .btn-secondary, .btn-success {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-success {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .btn-success:hover {
      background: #059669;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
      margin-top: 1.5rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .message.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .message.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .warning-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .warning-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.5rem;
    }

    .warning-text {
      color: #92400e;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .permissions-section {
        padding: 1rem;
      }

      .permission-list {
        grid-template-columns: 1fr;
      }

      .template-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class PermissionsComponent implements OnInit {
  permissionsForm!: FormGroup;
  defaultPermissions = signal<ConsignorPermissions | null>(null);
  permissionTemplates = signal<PermissionTemplate[]>([]);
  selectedTemplate = signal<string>('');
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
    this.loadPermissionTemplates();
    this.loadDefaultPermissions();
  }

  private initializeForm(): void {
    this.permissionsForm = this.fb.group({
      inventory: this.fb.group({
        canAddItems: [true],
        canEditOwnItems: [true],
        canRemoveOwnItems: [false],
        canEditPrices: [true],
        canMarkAsSold: [false],
        canViewAllItems: [false],
        canManageCategories: [false]
      }),
      analytics: this.fb.group({
        canViewBasicAnalytics: [true],
        canViewDetailedAnalytics: [false],
        canViewSalesHistory: [true],
        canViewPayoutHistory: [true],
        canExportReports: [false],
        canViewRevenue: [false]
      }),
      account: this.fb.group({
        canUpdateProfile: [true],
        canChangePaymentPreferences: [true],
        canCancelAccount: [false],
        canManageNotifications: [true],
        canContactSupport: [true]
      })
    });
  }

  private async loadPermissionTemplates(): Promise<void> {
    try {
      const templates = await this.http.get<PermissionTemplate[]>(`${environment.apiUrl}/api/organization/permission-templates`).toPromise();
      if (templates) {
        this.permissionTemplates.set(templates);
      }
    } catch (error) {
      this.setDefaultTemplates();
    }
  }

  private setDefaultTemplates(): void {
    const defaultTemplates: PermissionTemplate[] = [
      {
        name: 'Basic Consignor',
        description: 'Standard permissions for new consignors',
        permissions: {
          inventory: {
            canAddItems: true,
            canEditOwnItems: true,
            canRemoveOwnItems: false,
            canEditPrices: true,
            canMarkAsSold: false,
            canViewAllItems: false,
            canManageCategories: false
          },
          analytics: {
            canViewBasicAnalytics: true,
            canViewDetailedAnalytics: false,
            canViewSalesHistory: true,
            canViewPayoutHistory: true,
            canExportReports: false,
            canViewRevenue: false
          },
          account: {
            canUpdateProfile: true,
            canChangePaymentPreferences: true,
            canCancelAccount: false,
            canManageNotifications: true,
            canContactSupport: true
          },
          isActive: true,
          lastUpdated: new Date()
        }
      },
      {
        name: 'Trusted Consignor',
        description: 'Enhanced permissions for established consignors',
        permissions: {
          inventory: {
            canAddItems: true,
            canEditOwnItems: true,
            canRemoveOwnItems: true,
            canEditPrices: true,
            canMarkAsSold: true,
            canViewAllItems: false,
            canManageCategories: false
          },
          analytics: {
            canViewBasicAnalytics: true,
            canViewDetailedAnalytics: true,
            canViewSalesHistory: true,
            canViewPayoutHistory: true,
            canExportReports: true,
            canViewRevenue: true
          },
          account: {
            canUpdateProfile: true,
            canChangePaymentPreferences: true,
            canCancelAccount: true,
            canManageNotifications: true,
            canContactSupport: true
          },
          isActive: true,
          lastUpdated: new Date()
        }
      },
      {
        name: 'Restricted',
        description: 'Limited permissions for trial or restricted consignors',
        permissions: {
          inventory: {
            canAddItems: true,
            canEditOwnItems: false,
            canRemoveOwnItems: false,
            canEditPrices: false,
            canMarkAsSold: false,
            canViewAllItems: false,
            canManageCategories: false
          },
          analytics: {
            canViewBasicAnalytics: false,
            canViewDetailedAnalytics: false,
            canViewSalesHistory: false,
            canViewPayoutHistory: true,
            canExportReports: false,
            canViewRevenue: false
          },
          account: {
            canUpdateProfile: true,
            canChangePaymentPreferences: false,
            canCancelAccount: false,
            canManageNotifications: true,
            canContactSupport: true
          },
          isActive: true,
          lastUpdated: new Date()
        }
      }
    ];
    this.permissionTemplates.set(defaultTemplates);
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

  applyTemplate(template: PermissionTemplate): void {
    this.selectedTemplate.set(template.name);
    this.permissionsForm.patchValue(template.permissions);
  }

  resetToDefaults(): void {
    const defaultTemplate = this.permissionTemplates().find(t => t.name === 'Basic Consignor');
    if (defaultTemplate) {
      this.applyTemplate(defaultTemplate);
    } else {
      this.initializeForm();
    }
    this.selectedTemplate.set('');
  }

  async createCustomTemplate(): Promise<void> {
    const name = prompt('Enter a name for this permission template:');
    if (!name) return;

    const description = prompt('Enter a description for this template:') || '';

    const newTemplate: PermissionTemplate = {
      name,
      description,
      permissions: {
        ...this.permissionsForm.value,
        isActive: true,
        lastUpdated: new Date()
      }
    };

    try {
      await this.http.post(`${environment.apiUrl}/api/organization/permission-templates`, newTemplate).toPromise();
      const currentTemplates = this.permissionTemplates();
      this.permissionTemplates.set([...currentTemplates, newTemplate]);
      this.showSuccess(`Template "${name}" created successfully`);
    } catch (error) {
      this.showError('Failed to create template');
    }
  }

  getPermissionCount(): { enabled: number; total: number } {
    const formValue = this.permissionsForm.value;
    let enabled = 0;
    let total = 0;

    Object.values(formValue).forEach((group: any) => {
      Object.values(group).forEach((permission: any) => {
        total++;
        if (permission) enabled++;
      });
    });

    return { enabled, total };
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