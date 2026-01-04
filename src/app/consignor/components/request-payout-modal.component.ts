import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsignorBalance, SubmitPayoutRequest, PayoutRequest } from '../models/consignor.models';
import { MockConsignorBalanceService } from '../services/mock-consignor-balance.service';

@Component({
  selector: 'app-request-payout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-payout-modal.component.html',
})
export class RequestPayoutModalComponent implements OnInit {
  @Input() balance: ConsignorBalance | null = null;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() requestSubmitted = new EventEmitter<PayoutRequest>();

  note = '';
  isSubmitting = false;
  error: string | null = null;

  constructor(private balanceService: MockConsignorBalanceService) {}

  ngOnInit() {
    // Focus the note field when modal opens
    if (this.show) {
      setTimeout(() => {
        const textarea = document.querySelector('.form-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }
  }

  onClose() {
    if (this.isSubmitting) return;
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onSubmit() {
    if (this.isSubmitting || !this.balance) return;

    this.isSubmitting = true;
    this.error = null;

    const request: SubmitPayoutRequest = {
      note: this.note.trim() || undefined
    };

    this.balanceService.submitPayoutRequest(request).subscribe({
      next: (payoutRequest) => {
        this.isSubmitting = false;
        this.requestSubmitted.emit(payoutRequest);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = 'Failed to submit payout request. Please try again.';
        console.error('Payout request error:', err);
      }
    });
  }

  get canSubmit(): boolean {
    return !this.isSubmitting && this.balance !== null;
  }
}