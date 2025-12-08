import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MockConsignorItemService,
  PriceRequestListItemDto,
  ReviewPriceRequestDto
} from '../../../consignor/services/mock-consignor-item.service';

@Component({
  selector: 'app-price-request-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './price-request-review-modal.component.html',
  styleUrls: ['./price-request-review-modal.component.scss']
})
export class PriceRequestReviewModalComponent implements OnInit {
  @Input() request!: PriceRequestListItemDto;
  @Input() show: boolean = false;
  @Output() closed = new EventEmitter<{ action: 'approved' | 'rejected' | null, request?: PriceRequestListItemDto }>();

  decision: 'approve' | 'decline' | null = null;
  ownerNotes: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(private itemService: MockConsignorItemService) {}

  ngOnInit() {
    // Reset form state when modal opens
    this.decision = null;
    this.ownerNotes = '';
    this.error = null;
  }

  get canSubmit(): boolean {
    return this.decision !== null && !this.loading;
  }

  get newConsignorEarnings(): number {
    if (!this.request) return 0;
    return this.request.requestedPrice * (this.request.consignorSplitPercentage / 100);
  }

  get currentConsignorEarnings(): number {
    if (!this.request) return 0;
    return this.request.currentPrice * (this.request.consignorSplitPercentage / 100);
  }

  get earningsChange(): number {
    return this.newConsignorEarnings - this.currentConsignorEarnings;
  }

  get isEarningsIncrease(): boolean {
    return this.earningsChange > 0;
  }

  get isEarningsDecrease(): boolean {
    return this.earningsChange < 0;
  }

  get characterCount(): number {
    return this.ownerNotes.length;
  }

  get maxCharacters(): number {
    return 1000;
  }

  onApprove(): void {
    this.decision = 'approve';
  }

  onDecline(): void {
    this.decision = 'decline';
  }

  onCancel(): void {
    this.closed.emit({ action: null });
  }

  onSubmit(): void {
    if (!this.canSubmit || !this.request) return;

    this.loading = true;
    this.error = null;

    const review: ReviewPriceRequestDto = {
      approved: this.decision === 'approve',
      ownerNotes: this.ownerNotes.trim() || undefined
    };

    this.itemService.reviewPriceRequest(this.request.id, review).subscribe({
      next: (response) => {
        this.loading = false;
        const updatedRequest = {
          ...this.request,
          status: this.decision === 'approve' ? 'approved' as const : 'rejected' as const
        };
        this.closed.emit({
          action: this.decision === 'approve' ? 'approved' : 'rejected',
          request: updatedRequest
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to submit review. Please try again.';
        console.error('Price request review error:', err);
      }
    });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getPriceChangePercentage(): number {
    if (!this.request || this.request.currentPrice === 0) return 0;
    return ((this.request.requestedPrice - this.request.currentPrice) / this.request.currentPrice) * 100;
  }

  isPriceIncrease(): boolean {
    return this.request && this.request.requestedPrice > this.request.currentPrice;
  }

  isPriceDecrease(): boolean {
    return this.request && this.request.requestedPrice < this.request.currentPrice;
  }

  getAbsolutePriceChange(): number {
    if (!this.request) return 0;
    return Math.abs(this.request.requestedPrice - this.request.currentPrice);
  }

  getAbsolutePercentageChange(): string {
    if (!this.request || this.request.currentPrice === 0) return '0.0';
    return Math.abs(this.getPriceChangePercentage()).toFixed(1);
  }

  getAbsoluteEarningsChange(): number {
    return Math.abs(this.earningsChange);
  }
}