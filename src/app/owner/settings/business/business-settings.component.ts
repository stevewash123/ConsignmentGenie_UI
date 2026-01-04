import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OwnerService, BusinessSettings } from '../../../services/owner.service';
import { ItemSubmissionMode } from '../../../shared/interfaces/business.interfaces';


@Component({
  selector: 'app-business-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-settings.component.html',
  styleUrls: ['./business-settings.component.scss']
})
export class BusinessSettingsComponent implements OnInit {
  settings = signal<BusinessSettings | null>(null);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  ItemSubmissionMode = ItemSubmissionMode;

  submissionModeOptions = [
    {
      value: ItemSubmissionMode.OwnerOnly,
      label: 'Owner adds all inventory',
      description: 'Consignors cannot submit items.'
    },
    {
      value: ItemSubmissionMode.ApprovalRequired,
      label: 'Consignors submit for approval',
      description: 'You review requests before items appear in inventory.'
    },
    {
      value: ItemSubmissionMode.DirectAdd,
      label: 'Consignors add directly',
      description: 'Items go straight to inventory. No approval required.'
    }
  ];

  constructor(private ownerService: OwnerService) {}

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const response = await this.ownerService.getBusinessSettings().toPromise();
      if (response) {
        // Ensure ConsignorPermissions section exists with default value for backwards compatibility
        if (!response.consignorPermissions) {
          response.consignorPermissions = {
            itemSubmissionMode: ItemSubmissionMode.ApprovalRequired
          };
        }
        this.settings.set(response);
      }
    } catch (error) {
      this.showError('Failed to load business settings');
    }
  }

  async saveSettings() {
    if (!this.settings()) return;

    // Validate payout settings per story requirements
    const settings = this.settings()!;
    const errors: string[] = [];

    // Validation: HoldPeriodDays: ≥ 0, ≤ 90
    if (settings.payouts.holdPeriodDays < 0 || settings.payouts.holdPeriodDays > 90) {
      errors.push('Hold period must be between 0 and 90 days');
    }

    // Validation: MinimumAmount: ≥ 0, ≤ 10000
    if (settings.payouts.minimumAmount < 0 || settings.payouts.minimumAmount > 10000) {
      errors.push('Minimum payout amount must be between $0 and $10,000');
    }

    // Validation: RefundWindowDays: ≥ 1, ≤ 90 (only if RefundPolicy = WithinDays)
    if (settings.payouts.refundPolicy === 'WithinDays') {
      if (!settings.payouts.refundWindowDays || settings.payouts.refundWindowDays < 1 || settings.payouts.refundWindowDays > 90) {
        errors.push('Refund window must be between 1 and 90 days when using "Within Days" policy');
      }
    }

    if (errors.length > 0) {
      this.showError(errors.join('. '));
      return;
    }

    this.isSaving.set(true);
    try {
      const response = await this.ownerService.updateBusinessSettings(this.settings()!).toPromise();
      this.showSuccess('Business settings saved successfully');
    } catch (error) {
      this.showError('Failed to save business settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}