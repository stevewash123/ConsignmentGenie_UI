import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface PayoutMethodOption {
  method: string;
  enabled: boolean;
  displayName: string;
  description: string;
}

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="payment-methods-section">
      <header class="settings-header">
        <h2>Payment Methods & Processing Fees</h2>
        <p>Configure available payment options and fee structure</p>
      </header>

      <form [formGroup]="paymentForm" (ngSubmit)="onSave()">
        <!-- Payment Methods -->
        <section class="form-section" formGroupName="paymentMethods">
          <h3>Payment Methods</h3>

          <div class="form-group">
            <label for="defaultMethod">Default payment method</label>
            <select id="defaultMethod" formControlName="defaultMethod" class="form-select">
              <option value="check">Check (by mail)</option>
              <option value="cash">Cash (pickup)</option>
              <option value="store_credit">Store credit</option>
              <option value="ach">Bank transfer (ACH)</option>
            </select>
            <span class="help-text">This will be pre-selected for new consignors</span>
          </div>

          <div class="form-group">
            <label>Available payment methods for consignors</label>
            <div class="payment-methods-grid">
              <div *ngFor="let method of paymentMethodsArray.controls; let i = index"
                   class="payment-method-option">
                <label class="checkbox-label">
                  <input type="checkbox"
                         [checked]="method.get('enabled')?.value"
                         (change)="onPaymentMethodToggle(i, $any($event.target).checked)">
                  <span class="checkmark"></span>
                  <div class="method-info">
                    <span class="method-name">{{ method.get('displayName')?.value }}</span>
                    <span class="method-description">{{ method.get('description')?.value }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Fee Structure -->
        <section class="form-section" formGroupName="fees">
          <h3>Processing Fees</h3>

          <div class="form-group">
            <label>Who pays processing fees?</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" value="shop" formControlName="processingFeePaidBy">
                <span class="radio-mark"></span>
                Shop pays all fees
              </label>
              <label class="radio-label">
                <input type="radio" value="consignor" formControlName="processingFeePaidBy">
                <span class="radio-mark"></span>
                Deduct fees from consignor payouts
              </label>
            </div>
          </div>

          <div class="form-group" formGroupName="feesByMethod">
            <label>Fee structure by payment method</label>
            <div class="fees-grid">
              <div class="fee-item">
                <label>Check processing fee</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">$</span>
                  <input type="number" formControlName="check" class="form-input" min="0" step="0.01">
                </div>
              </div>
              <div class="fee-item">
                <label>ACH/Bank transfer fee</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">$</span>
                  <input type="number" formControlName="ach" class="form-input" min="0" step="0.01">
                </div>
              </div>
              <div class="fee-item">
                <label>Cash processing fee</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">$</span>
                  <input type="number" formControlName="cash" class="form-input" min="0" step="0.01">
                </div>
              </div>
              <div class="fee-item">
                <label>Store credit fee</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">$</span>
                  <input type="number" formControlName="store_credit" class="form-input" min="0" step="0.01">
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="feeDisclosureEnabled">
              <span class="checkmark"></span>
              Disclose fees to consignors in payout statements
            </label>
          </div>
        </section>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" [disabled]="!paymentForm.valid || saving()" class="btn-primary">
            {{ saving() ? 'Saving...' : 'Save Payment Settings' }}
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
    .payment-methods-section {
      padding: 2rem;
      max-width: 1200px;
    }
    .settings-header {
      margin-bottom: 2rem;
    }
    .settings-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .settings-header p {
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
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-select, .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }
    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .payment-method-option {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
    }
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
    }
    .checkmark {
      width: 1.125rem;
      height: 1.125rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
    .method-info {
      flex: 1;
    }
    .method-name {
      font-weight: 500;
      color: #374151;
      display: block;
      margin-bottom: 0.25rem;
    }
    .method-description {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .radio-mark {
      width: 1rem;
      height: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 50%;
    }
    .fees-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .fee-item label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      display: block;
    }
    .input-with-prefix {
      display: flex;
    }
    .input-prefix {
      background: #f9fafb;
      border: 1px solid #d1d5db;
      border-right: none;
      padding: 0.75rem;
      border-radius: 6px 0 0 6px;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .input-with-prefix input {
      border-radius: 0 6px 6px 0;
    }
    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
      display: block;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .messages {
      margin-top: 1rem;
    }
    .message {
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .message.success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .message.error {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
  `]
})
export class PaymentMethodsComponent implements OnInit {
  paymentForm!: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Available payment methods
  allPaymentMethods: PayoutMethodOption[] = [
    {
      method: 'check',
      enabled: true,
      displayName: 'Check (by mail)',
      description: 'Physical checks mailed to consignor address'
    },
    {
      method: 'cash',
      enabled: true,
      displayName: 'Cash (pickup)',
      description: 'Cash payment for pickup at store'
    },
    {
      method: 'store_credit',
      enabled: true,
      displayName: 'Store Credit',
      description: 'Credit applied to consignor account for future purchases'
    },
    {
      method: 'ach',
      enabled: false,
      displayName: 'Bank Transfer (ACH)',
      description: 'Direct deposit to consignor bank account (requires integration)'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadSettings();
  }

  private initForm() {
    this.paymentForm = this.fb.group({
      paymentMethods: this.fb.group({
        defaultMethod: ['check', [Validators.required]],
        availableMethods: this.fb.array([])
      }),
      fees: this.fb.group({
        processingFeePaidBy: ['shop', [Validators.required]],
        feesByMethod: this.fb.group({
          check: [0.00, [Validators.min(0)]],
          ach: [0.50, [Validators.min(0)]],
          cash: [0.00, [Validators.min(0)]],
          store_credit: [0.00, [Validators.min(0)]]
        }),
        feeDisclosureEnabled: [true]
      })
    });

    this.initPaymentMethodsArray();
  }

  private initPaymentMethodsArray() {
    const methodsArray = this.paymentForm.get('paymentMethods.availableMethods') as FormArray;
    methodsArray.clear();

    this.allPaymentMethods.forEach(method => {
      methodsArray.push(this.fb.group({
        method: [method.method],
        enabled: [method.enabled],
        displayName: [method.displayName],
        description: [method.description]
      }));
    });
  }

  get paymentMethodsArray(): FormArray {
    return this.paymentForm.get('paymentMethods.availableMethods') as FormArray;
  }

  onPaymentMethodToggle(index: number, enabled: boolean) {
    const methodControl = this.paymentMethodsArray.at(index);
    methodControl.get('enabled')?.setValue(enabled);
  }

  async loadSettings() {
    try {
      // TODO: Load from API
      // const response = await this.http.get<any>(`${environment.apiUrl}/api/organizations/payment-settings`).toPromise();
      // if (response) {
      //   this.paymentForm.patchValue(response);
      // }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    }
  }

  async onSave() {
    if (this.paymentForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      this.successMessage.set('Payment method settings saved successfully');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      this.errorMessage.set('Failed to save payment settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}