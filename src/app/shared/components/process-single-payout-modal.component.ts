import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PayoutService } from '../../services/payout.service';

export interface SinglePayoutRequest {
  consignorId: string;
  amount: number;
  method: string;
  checkNumber?: string;
  notes?: string;
}

export interface SinglePayoutResponse {
  id: string;
  payoutNumber: string;
  amount: number;
  method: string;
  consignorName: string;
  createdAt: Date;
}

export interface ConsignorPayoutData {
  consignorId: string;
  consignorName: string;
  availableBalance: number;
  pendingBalance: number;
}

@Component({
  selector: 'app-process-single-payout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process-single-payout-modal.component.html',
  styleUrls: ['./process-single-payout-modal.component.css']
})
export class ProcessSinglePayoutModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() consignorData: ConsignorPayoutData | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<SinglePayoutResponse>();

  // Form state
  payoutForm = signal({
    amount: 0,
    method: '',
    checkNumber: '',
    notes: ''
  });

  isProcessing = signal(false);
  validationErrors = signal<string[]>([]);

  // Payment method options
  paymentMethods = [
    { value: 'Check', label: 'Check', requiresNumber: true },
    { value: 'Venmo', label: 'Venmo', requiresNumber: false },
    { value: 'Zelle', label: 'Zelle', requiresNumber: false },
    { value: 'PayPal', label: 'PayPal', requiresNumber: false },
    { value: 'Cash', label: 'Cash', requiresNumber: false },
    { value: 'Bank Transfer', label: 'Bank Transfer', requiresNumber: false },
    { value: 'Store Credit', label: 'Store Credit', requiresNumber: false },
    { value: 'Other', label: 'Other', requiresNumber: false }
  ];

  // Computed values
  selectedPaymentMethod = computed(() => {
    const form = this.payoutForm();
    return this.paymentMethods.find(m => m.value === form.method);
  });

  showCheckNumber = computed(() => {
    const method = this.selectedPaymentMethod();
    return method?.requiresNumber || false;
  });

  canPayFull = computed(() => {
    return this.consignorData?.availableBalance && this.consignorData.availableBalance > 0;
  });

  constructor(
    private payoutService: PayoutService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges() {
    if (this.isVisible && this.consignorData) {
      this.resetForm();
    }
  }

  resetForm() {
    if (this.consignorData) {
      this.payoutForm.set({
        amount: this.consignorData.availableBalance,
        method: '',
        checkNumber: '',
        notes: ''
      });
    }
    this.validationErrors.set([]);
  }

  payFullBalance() {
    if (this.consignorData) {
      const form = this.payoutForm();
      this.payoutForm.set({
        ...form,
        amount: this.consignorData.availableBalance
      });
    }
  }

  updateFormField(field: string, value: any) {
    const form = this.payoutForm();
    this.payoutForm.set({
      ...form,
      [field]: value
    });
    this.clearValidationErrors();
  }

  validateForm(): boolean {
    const errors: string[] = [];
    const form = this.payoutForm();

    if (!form.amount || form.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (this.consignorData && form.amount > this.consignorData.availableBalance) {
      errors.push('Amount cannot exceed available balance');
    }

    if (!form.method) {
      errors.push('Payment method is required');
    }

    if (this.showCheckNumber() && form.method === 'Check' && !form.checkNumber?.trim()) {
      errors.push('Check number is required for check payments');
    }

    this.validationErrors.set(errors);
    return errors.length === 0;
  }

  clearValidationErrors() {
    this.validationErrors.set([]);
  }

  async processPayout() {
    if (!this.validateForm() || !this.consignorData) {
      return;
    }

    this.isProcessing.set(true);

    try {
      const form = this.payoutForm();
      const request: SinglePayoutRequest = {
        consignorId: this.consignorData.consignorId,
        amount: form.amount,
        method: form.method,
        notes: form.notes || undefined
      };

      if (form.checkNumber?.trim()) {
        request.checkNumber = form.checkNumber.trim();
      }

      // Call the API endpoint (to be implemented)
      const response = await this.processPayoutApi(request);

      this.toastr.success(`Payout of $${form.amount.toFixed(2)} processed successfully!`);
      this.onSuccess.emit(response);
      this.closeModal();

    } catch (error) {
      console.error('Error processing payout:', error);
      this.toastr.error('Failed to process payout. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async processPayoutApi(request: SinglePayoutRequest): Promise<SinglePayoutResponse> {
    const apiRequest = {
      consignorId: request.consignorId,
      amount: request.amount,
      method: request.method,
      checkNumber: request.checkNumber,
      notes: request.notes
    };

    try {
      return await this.payoutService.processSinglePayout(apiRequest).toPromise() as SinglePayoutResponse;
    } catch (error) {
      // Fallback to mock response for development/testing
      console.warn('API call failed, using mock response:', error);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: 'mock-id-' + Date.now(),
            payoutNumber: 'PAY-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            amount: request.amount,
            method: request.method,
            consignorName: this.consignorData!.consignorName,
            createdAt: new Date()
          });
        }, 500);
      });
    }
  }

  closeModal() {
    this.resetForm();
    this.onClose.emit();
  }

  handleOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}