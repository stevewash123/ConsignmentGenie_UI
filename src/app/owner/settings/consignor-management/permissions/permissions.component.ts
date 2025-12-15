import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permissions.component.html'
})
export class PermissionsComponent {
  permissionsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.permissionsForm = this.fb.group({
      inventory: this.fb.group({
        canAddItems: [true],
        canEditOwnItems: [true],
        canRemoveOwnItems: [false],
        canEditPrices: [true],
        canMarkAsSold: [false]
      }),
      analytics: this.fb.group({
        canViewBasicAnalytics: [true],
        canViewDetailedAnalytics: [false],
        canViewSalesHistory: [true],
        canViewPayoutHistory: [true]
      }),
      account: this.fb.group({
        canUpdateProfile: [true],
        canChangePaymentPreferences: [true],
        canCancelAccount: [false]
      })
    });
  }

  onSave(): void {
    if (this.permissionsForm.valid) {
      // TODO: Save default permissions settings
      console.log('Saving permissions settings:', this.permissionsForm.value);
    }
  }

  resetToDefaults(): void {
    this.permissionsForm.patchValue({
      inventory: {
        canAddItems: true,
        canEditOwnItems: true,
        canRemoveOwnItems: false,
        canEditPrices: true,
        canMarkAsSold: false
      },
      analytics: {
        canViewBasicAnalytics: true,
        canViewDetailedAnalytics: false,
        canViewSalesHistory: true,
        canViewPayoutHistory: true
      },
      account: {
        canUpdateProfile: true,
        canChangePaymentPreferences: true,
        canCancelAccount: false
      }
    });
  }
}