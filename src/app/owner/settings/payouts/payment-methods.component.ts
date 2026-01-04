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
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.scss']
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