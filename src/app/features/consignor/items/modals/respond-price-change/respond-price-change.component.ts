import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MockConsignorItemService } from '../../services/mock-consignor-item.service';
import {
  ConsignorItemSummary,
  PriceChangeDecisionRequest,
  PriceChangeResponse
} from '../../models/consignor-item.model';

@Component({
  selector: 'app-respond-price-change',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './respond-price-change.component.html',
  styleUrls: ['./respond-price-change.component.scss']
})
export class RespondPriceChangeComponent implements OnInit {
  private destroy$ = new Subject<void>();

  @Input() item!: ConsignorItemSummary;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<string>(); // Success message

  selectedDecision: 'accept' | 'keep_current' | 'decline_retrieve' | null = null;
  consignorNote = '';
  isSubmitting = false;
  error: string | null = null;

  constructor(
    private consignorItemService: MockConsignorItemService
  ) {}

  ngOnInit(): void {
    // Reset form when opened
    if (this.isOpen) {
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resetForm(): void {
    this.selectedDecision = null;
    this.consignorNote = '';
    this.error = null;
    this.isSubmitting = false;
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  onDecisionChange(decision: 'accept' | 'keep_current' | 'decline_retrieve'): void {
    this.selectedDecision = decision;
    this.error = null;
  }

  onSubmit(): void {
    if (!this.selectedDecision) {
      this.error = 'Please select a decision option.';
      return;
    }

    if (!this.item.priceChangeRequest) {
      this.error = 'No price change request found for this item.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const response: PriceChangeResponse = {
      requestId: this.item.priceChangeRequest.requestId,
      decision: this.selectedDecision,
      consignorNote: this.consignorNote.trim() || undefined
    };

    const request: PriceChangeDecisionRequest = {
      itemId: this.item.id,
      response
    };

    this.consignorItemService.respondToPriceChange(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        if (result.success) {
          this.submitted.emit(result.message);
          this.resetForm();
          this.close.emit();
        } else {
          this.error = result.message;
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.error = 'Failed to submit response. Please try again.';
        this.isSubmitting = false;
        console.error('Price change response error:', err);
      }
    });
  }

  getDecisionButtonClass(decision: 'accept' | 'keep_current' | 'decline_retrieve'): string {
    const baseClass = 'decision-option';

    if (this.selectedDecision === decision) {
      switch (decision) {
        case 'accept':
          return `${baseClass} ${baseClass}--accept ${baseClass}--selected`;
        case 'keep_current':
          return `${baseClass} ${baseClass}--keep ${baseClass}--selected`;
        case 'decline_retrieve':
          return `${baseClass} ${baseClass}--decline ${baseClass}--selected`;
      }
    }

    switch (decision) {
      case 'accept':
        return `${baseClass} ${baseClass}--accept`;
      case 'keep_current':
        return `${baseClass} ${baseClass}--keep`;
      case 'decline_retrieve':
        return `${baseClass} ${baseClass}--decline`;
      default:
        return baseClass;
    }
  }

  getEarningsDifference(): number {
    if (!this.item.priceChangeRequest) return 0;
    return this.item.priceChangeRequest.requestedEarnings - this.item.consignorEarnings;
  }

  getPriceDifference(): number {
    if (!this.item.priceChangeRequest) return 0;
    return this.item.priceChangeRequest.requestedPrice - this.item.listedPrice;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  getDaysUntilExpiry(): number {
    if (!this.item.priceChangeRequest) return 0;
    const now = new Date();
    const expires = new Date(this.item.priceChangeRequest.expiresDate);
    const diffTime = expires.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(): boolean {
    return this.getDaysUntilExpiry() <= 2;
  }
}