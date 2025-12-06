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
  template: `
    <div class="business-settings">
      <div class="settings-header">
        <h2>Business Settings</h2>
        <p>Configure commission structure, tax settings, payout schedule, and item policies</p>
      </div>

      <form (ngSubmit)="saveSettings()" class="settings-form" *ngIf="settings()">
        <!-- Commission Structure -->
        <div class="form-section">
          <h3>Commission Structure</h3>

          <div class="form-group">
            <label for="defaultSplit">Default Split (Shop/Consignor)</label>
            <select
              id="defaultSplit"
              [(ngModel)]="settings()!.Commission.DefaultSplit"
              name="defaultSplit"
              class="form-select">
              <option value="70/30">70 / 30 - Shop keeps 70%, Consignor gets 30%</option>
              <option value="60/40">60 / 40 - Shop keeps 60%, Consignor gets 40%</option>
              <option value="50/50">50 / 50 - Shop keeps 50%, Consignor gets 50%</option>
              <option value="40/60">40 / 60 - Shop keeps 40%, Consignor gets 60%</option>
            </select>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="settings()!.Commission.AllowCustomSplitsPerConsignor"
                name="allowCustomConsignor">
              <span class="checkmark"></span>
              Allow custom splits per consignor
            </label>

            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="settings()!.Commission.AllowCustomSplitsPerItem"
                name="allowCustomItem">
              <span class="checkmark"></span>
              Allow custom splits per item
            </label>
          </div>
        </div>

        <!-- Tax Settings -->
        <div class="form-section">
          <h3>Tax Settings</h3>

          <div class="form-group">
            <label for="salesTaxRate">Sales Tax Rate (%)</label>
            <div class="input-with-suffix">
              <input
                type="number"
                id="salesTaxRate"
                [(ngModel)]="settings()!.Tax.SalesTaxRate"
                name="salesTaxRate"
                class="form-input"
                placeholder="8.25"
                min="0"
                max="20"
                step="0.01">
              <span class="input-suffix">%</span>
            </div>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="settings()!.Tax.TaxIncludedInPrices"
                name="taxIncluded">
              <span class="checkmark"></span>
              Tax is included in listed prices
            </label>

            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="settings()!.Tax.ChargeTaxOnShipping"
                name="taxOnShipping">
              <span class="checkmark"></span>
              Charge tax on shipping
            </label>
          </div>

          <div class="form-group">
            <label for="taxIdEin">Tax ID / EIN (optional)</label>
            <input
              type="text"
              id="taxIdEin"
              [(ngModel)]="settings()!.Tax.TaxIdEin"
              name="taxIdEin"
              class="form-input"
              placeholder="12-3456789">
          </div>
        </div>

        <!-- Payout Settings -->
        <div class="form-section">
          <h3>Payout Settings</h3>

          <div class="form-group">
            <label for="holdPeriod">Payout Hold Period (Days)</label>
            <input
              type="number"
              id="holdPeriod"
              [(ngModel)]="settings()!.Payouts.HoldPeriodDays"
              name="holdPeriod"
              class="form-input"
              placeholder="7"
              min="0"
              max="90">
            <div class="form-hint">
              Funds become available this many days after the sale.<br>
              This is your refund window — once paid, no refunds allowed.
            </div>
          </div>

          <div class="form-group">
            <label for="minimumPayout">Minimum Payout Amount</label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input
                type="number"
                id="minimumPayout"
                [(ngModel)]="settings()!.Payouts.MinimumAmount"
                name="minimumPayout"
                class="form-input"
                placeholder="25.00"
                min="0"
                max="10000"
                step="0.01">
            </div>
            <div class="form-hint">
              Consignors won't appear in "Ready to Pay" until they reach this threshold.
            </div>
          </div>

          <div class="payout-divider"></div>

          <h4>Refund Policy</h4>
          <div class="form-group">
            <label>When are refunds allowed?</label>
            <div class="radio-group vertical">
              <label class="radio-label">
                <input
                  type="radio"
                  value="NoRefunds"
                  [(ngModel)]="settings()!.Payouts.RefundPolicy"
                  name="refundPolicy">
                <span class="radio-mark"></span>
                No refunds
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  value="WithinDays"
                  [(ngModel)]="settings()!.Payouts.RefundPolicy"
                  name="refundPolicy">
                <span class="radio-mark"></span>
                Within <input
                  type="number"
                  [(ngModel)]="settings()!.Payouts.RefundWindowDays"
                  name="refundWindowDays"
                  class="inline-input"
                  placeholder="7"
                  min="1"
                  max="90"
                  [disabled]="settings()!.Payouts.RefundPolicy !== 'WithinDays'"> days of sale
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  value="UntilPayout"
                  [(ngModel)]="settings()!.Payouts.RefundPolicy"
                  name="refundPolicy">
                <span class="radio-mark"></span>
                Until consignor is paid (recommended)
              </label>
            </div>
            <div class="form-hint info-box">
              ⓘ Once a consignor has been paid for an item, that item cannot be refunded.
              The hold period above gives customers time to return items before consignors are paid.
            </div>
          </div>

          <div class="payout-divider"></div>

          <div class="form-group">
            <label for="defaultPayoutMethod">Default Payout Method</label>
            <select
              id="defaultPayoutMethod"
              [(ngModel)]="settings()!.Payouts.DefaultPayoutMethod"
              name="defaultPayoutMethod"
              class="form-select">
              <option value="Check">Check</option>
              <option value="Cash">Cash</option>
              <option value="DirectDeposit">Direct Deposit</option>
              <option value="PayPal">PayPal</option>
              <option value="Venmo">Venmo</option>
              <option value="StoreCredit">Store Credit</option>
            </select>
          </div>
        </div>

        <!-- Item Policies -->
        <div class="form-section">
          <h3>Item Policies</h3>

          <div class="form-group">
            <label for="consignmentPeriod">Default Consignment Period</label>
            <select
              id="consignmentPeriod"
              [(ngModel)]="settings()!.Items.DefaultConsignmentPeriodDays"
              name="consignmentPeriod"
              class="form-select">
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="120">120 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </select>
          </div>

          <div class="markdown-settings">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="settings()!.Items.EnableAutoMarkdowns"
                name="enableMarkdowns">
              <span class="checkmark"></span>
              Enable automatic markdowns
            </label>

            <div class="markdown-schedule" *ngIf="settings()?.Items.EnableAutoMarkdowns">
              <div class="markdown-item">
                <span class="markdown-label">After 30 days:</span>
                <div class="input-with-suffix">
                  <input
                    type="number"
                    [(ngModel)]="settings()!.Items.MarkdownSchedule.After30Days"
                    name="markdown30"
                    class="form-input markdown-input"
                    min="0"
                    max="100"
                    step="5">
                  <span class="input-suffix">% off</span>
                </div>
              </div>

              <div class="markdown-item">
                <span class="markdown-label">After 60 days:</span>
                <div class="input-with-suffix">
                  <input
                    type="number"
                    [(ngModel)]="settings()!.Items.MarkdownSchedule.After60Days"
                    name="markdown60"
                    class="form-input markdown-input"
                    min="0"
                    max="100"
                    step="5">
                  <span class="input-suffix">% off</span>
                </div>
              </div>

              <div class="markdown-item">
                <span class="markdown-label">After 90 days:</span>
                <div class="radio-group">
                  <label class="radio-label">
                    <input
                      type="radio"
                      value="donate"
                      [(ngModel)]="settings()!.Items.MarkdownSchedule.After90DaysAction"
                      name="after90Action">
                    <span class="radio-mark"></span>
                    Donate
                  </label>
                  <label class="radio-label">
                    <input
                      type="radio"
                      value="return"
                      [(ngModel)]="settings()!.Items.MarkdownSchedule.After90DaysAction"
                      name="after90Action">
                    <span class="radio-mark"></span>
                    Return to consignor
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="loadSettings()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="isSaving()">
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>

      <!-- Messages -->
      <div class="messages" *ngIf="successMessage() || errorMessage()">
        <div *ngIf="successMessage()" class="message success">{{ successMessage() }}</div>
        <div *ngIf="errorMessage()" class="message error">{{ errorMessage() }}</div>
      </div>
    </div>
  `,
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