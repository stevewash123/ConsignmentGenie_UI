import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface BusinessSettings {
  Commission: {
    DefaultSplit: string;
    AllowCustomSplitsPerConsignor: boolean;
    AllowCustomSplitsPerItem: boolean;
  };
  Tax: {
    SalesTaxRate: number;
    TaxIncludedInPrices: boolean;
    ChargeTaxOnShipping: boolean;
    TaxIdEin?: string;
  };
  Payouts: {
    Schedule: string;
    MinimumAmount: number;
    HoldPeriodDays: number;
    RefundPolicy: 'NoRefunds' | 'WithinDays' | 'UntilPayout';
    RefundWindowDays?: number;
    DefaultPayoutMethod: 'Check' | 'Cash' | 'DirectDeposit' | 'PayPal' | 'Venmo' | 'StoreCredit';
  };
  Items: {
    DefaultConsignmentPeriodDays: number;
    EnableAutoMarkdowns: boolean;
    MarkdownSchedule: {
      After30Days: number;
      After60Days: number;
      After90DaysAction: 'donate' | 'return';
    };
  };
}

@Component({
  selector: 'app-business-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-settings.component.html',
  styles: [`
    .business-settings {
      padding: 2rem;
      max-width: 800px;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .settings-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .settings-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .form-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    .form-hint {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    /* Input with prefix/suffix */
    .input-with-prefix, .input-with-suffix {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-prefix {
      position: absolute;
      left: 0.75rem;
      color: #6b7280;
      font-weight: 500;
      z-index: 1;
    }

    .input-suffix {
      position: absolute;
      right: 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    .input-with-prefix .form-input {
      padding-left: 2rem;
    }

    .input-with-suffix .form-input {
      padding-right: 2.5rem;
    }

    /* Checkboxes */
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #374151;
      font-weight: 400;
    }

    .checkbox-label input[type="checkbox"] {
      margin: 0;
      width: 1rem;
      height: 1rem;
    }

    /* Radio buttons */
    .radio-group {
      display: flex;
      gap: 1rem;
    }

    .radio-group.vertical {
      flex-direction: column;
      gap: 1rem;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #374151;
      font-weight: 400;
    }

    .radio-label input[type="radio"] {
      margin: 0;
    }

    .inline-input {
      width: 60px;
      padding: 0.25rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
      margin: 0 0.25rem;
      display: inline-block;
    }

    .inline-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    /* Markdown Settings */
    .markdown-settings {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .markdown-schedule {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .markdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .markdown-label {
      font-weight: 500;
      color: #374151;
      min-width: 120px;
    }

    .markdown-input {
      width: 80px;
    }

    /* Buttons */
    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
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

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Messages */
    .messages {
      margin-top: 2rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      margin-bottom: 0.5rem;
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

    /* Responsive */
    @media (max-width: 768px) {
      .business-settings {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .markdown-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .radio-group {
        flex-direction: column;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class BusinessSettingsComponent implements OnInit {
  settings = signal<BusinessSettings | null>(null);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const response = await this.http.get<BusinessSettings>(`${environment.apiUrl}/api/organization/business-settings`).toPromise();
      if (response) {
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
    if (settings.Payouts.HoldPeriodDays < 0 || settings.Payouts.HoldPeriodDays > 90) {
      errors.push('Hold period must be between 0 and 90 days');
    }

    // Validation: MinimumAmount: ≥ 0, ≤ 10000
    if (settings.Payouts.MinimumAmount < 0 || settings.Payouts.MinimumAmount > 10000) {
      errors.push('Minimum payout amount must be between $0 and $10,000');
    }

    // Validation: RefundWindowDays: ≥ 1, ≤ 90 (only if RefundPolicy = WithinDays)
    if (settings.Payouts.RefundPolicy === 'WithinDays') {
      if (!settings.Payouts.RefundWindowDays || settings.Payouts.RefundWindowDays < 1 || settings.Payouts.RefundWindowDays > 90) {
        errors.push('Refund window must be between 1 and 90 days when using "Within Days" policy');
      }
    }

    if (errors.length > 0) {
      this.showError(errors.join('. '));
      return;
    }

    this.isSaving.set(true);
    try {
      const response = await this.http.put(`${environment.apiUrl}/api/organization/business-settings`, this.settings()).toPromise();
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