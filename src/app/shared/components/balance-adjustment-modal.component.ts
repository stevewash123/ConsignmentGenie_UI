import { Component, EventEmitter, Input, Output, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsignorService } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';

export interface ConsignorForAdjustment {
  id: number;
  name: string;
  email?: string;
}
import { AdjustmentType, AdjustmentTypeLabels, CreateBalanceAdjustmentRequest, ConsignorBalance } from '../../models/balance-adjustment.model';

@Component({
  selector: 'app-balance-adjustment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-adjustment-modal.component.html',
  styleUrl: './balance-adjustment-modal.component.css'
})
export class BalanceAdjustmentModalComponent implements OnInit {
  @Input() isVisible!: boolean;
  @Input() consignors: ConsignorForAdjustment[] = [];
  @Input() selectedConsignorId?: string;
  @Output() close = new EventEmitter<void>();
  @Output() adjustmentCreated = new EventEmitter<void>();

  AdjustmentType = AdjustmentType;
  AdjustmentTypeLabels = AdjustmentTypeLabels;
  adjustmentTypes = Object.values(AdjustmentType);

  adjustment = {
    consignorId: '',
    amount: 0,
    type: AdjustmentType.Correction,
    reason: ''
  };

  currentBalance = signal<number | null>(null);
  newBalance = signal<number | null>(null);
  isSubmitting = signal(false);
  isLoadingBalance = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  selectedConsignor = signal<ConsignorForAdjustment | null>(null);

  constructor(private consignorService: ConsignorService) {
    // Update selected consignor when consignorId changes
    effect(() => {
      if (this.adjustment.consignorId && this.consignors.length > 0) {
        const consignor = this.consignors.find(c => c.id.toString() === this.adjustment.consignorId);
        this.selectedConsignor.set(consignor || null);
        if (consignor) {
          this.loadConsignorBalance(this.adjustment.consignorId);
        } else {
          this.currentBalance.set(null);
          this.newBalance.set(null);
        }
      }
    });

    // Update new balance when amount or current balance changes
    effect(() => {
      const current = this.currentBalance();
      const amount = this.adjustment.amount;
      if (current !== null && amount !== null) {
        this.newBalance.set(current + amount);
      } else {
        this.newBalance.set(null);
      }
    });
  }

  ngOnInit(): void {
    if (this.selectedConsignorId) {
      this.adjustment.consignorId = this.selectedConsignorId;
    }
  }

  onOverlayClick(event: Event): void {
    this.close.emit();
  }

  onConsignorChange(): void {
    this.currentBalance.set(null);
    this.newBalance.set(null);
    this.errorMessage.set('');

    if (this.adjustment.consignorId) {
      this.loadConsignorBalance(this.adjustment.consignorId);
    }
  }

  onAmountChange(): void {
    const current = this.currentBalance();
    if (current !== null) {
      this.newBalance.set(current + (this.adjustment.amount || 0));
    }
  }

  private loadConsignorBalance(consignorId: string): void {
    this.isLoadingBalance.set(true);
    this.consignorService.getConsignorBalance(consignorId).subscribe({
      next: (balance: ConsignorBalance) => {
        this.currentBalance.set(balance.currentBalance);
        this.isLoadingBalance.set(false);
      },
      error: (error) => {
        console.error('Error loading balance:', error);
        this.errorMessage.set('Failed to load consignor balance');
        this.currentBalance.set(null);
        this.isLoadingBalance.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.isSubmitting() || !this.isFormValid()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request: CreateBalanceAdjustmentRequest = {
      consignorId: this.adjustment.consignorId,
      amount: this.adjustment.amount,
      type: this.adjustment.type,
      reason: this.adjustment.reason.trim()
    };

    this.consignorService.createBalanceAdjustment(this.adjustment.consignorId, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Balance adjustment created successfully!');
          this.resetForm();
          this.adjustmentCreated.emit();

          // Auto-close after 2 seconds
          setTimeout(() => {
            this.close.emit();
          }, 2000);
        } else {
          this.errorMessage.set(response.message || 'Failed to create adjustment');
        }
      },
      error: (error) => {
        console.error('Error creating balance adjustment:', error);
        let errorMsg = 'Failed to create balance adjustment. Please try again.';

        if (error.status === 400) {
          errorMsg = error.error?.message || 'Invalid adjustment data. Please check your inputs.';
        } else if (error.status === 401) {
          errorMsg = 'You are not authorized to create adjustments. Please log in again.';
        } else if (error.status === 404) {
          errorMsg = 'Consignor not found. Please refresh and try again.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }

        this.errorMessage.set(errorMsg);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.adjustment.consignorId &&
      this.adjustment.amount !== 0 &&
      this.adjustment.reason.trim().length >= 10
    );
  }

  private resetForm(): void {
    this.adjustment = {
      consignorId: this.selectedConsignorId || '',
      amount: 0,
      type: AdjustmentType.Correction,
      reason: ''
    };
    this.currentBalance.set(null);
    this.newBalance.set(null);
    this.selectedConsignor.set(null);
  }

  isNegativeWarning(): boolean {
    const newBalance = this.newBalance();
    return newBalance !== null && newBalance < 0;
  }

  formatCurrency(amount: number | null): string {
    if (amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}