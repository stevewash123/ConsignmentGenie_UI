import { Component, EventEmitter, Input, Output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PriceChangeNotification, PriceChangeResponse } from '../../../../models/price-change-notification.model';
import { PriceChangeNotificationService } from '../../../../services/price-change-notification.service';

@Component({
  selector: 'app-respond-price-change',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './respond-price-change.component.html',
  styleUrls: ['./respond-price-change.component.scss']
})
export class RespondPriceChangeComponent implements OnInit {
  @Input() isVisible!: () => boolean;
  @Input() notification!: PriceChangeNotification;
  @Output() close = new EventEmitter<void>();
  @Output() responseSubmitted = new EventEmitter<void>();

  selectedAction = signal<'accept' | 'keep_current' | 'decline_and_retrieve' | null>(null);
  consignorNote = signal('');

  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(private notificationService: PriceChangeNotificationService) {}

  ngOnInit() {
    // Reset form when modal opens
    this.selectedAction.set(null);
    this.consignorNote.set('');
    this.errorMessage.set('');
  }

  // Computed properties
  isFormValid = computed(() => {
    return this.selectedAction() !== null;
  });

  buttonText = computed(() => {
    if (this.isSubmitting()) return 'Submitting...';
    return 'Confirm Decision';
  });

  getEarningsDifference(): number {
    return this.notification.consignorProposedEarnings - this.notification.consignorCurrentEarnings;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  selectAction(action: 'accept' | 'keep_current' | 'decline_and_retrieve') {
    this.selectedAction.set(action);
    this.errorMessage.set('');
  }

  getActionTitle(action: string): string {
    switch (action) {
      case 'accept':
        return `Accept new price (${this.formatCurrency(this.notification.proposedPrice)})`;
      case 'keep_current':
        return `Keep current price (${this.formatCurrency(this.notification.currentPrice)})`;
      case 'decline_and_retrieve':
        return 'Decline & retrieve item';
      default:
        return '';
    }
  }

  getActionDescription(action: string): string {
    switch (action) {
      case 'accept':
        return `Your earnings: ${this.formatCurrency(this.notification.consignorProposedEarnings)}`;
      case 'keep_current':
        return 'Continue at current price, item stays listed';
      case 'decline_and_retrieve':
        return 'Item will be removed and ready for pickup';
      default:
        return '';
    }
  }

  onOverlayClick(event: Event): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.isSubmitting() || !this.isFormValid()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const response: PriceChangeResponse = {
      notificationId: this.notification.id,
      action: this.selectedAction()!,
      consignorNote: this.consignorNote().trim() || undefined
    };

    this.notificationService.submitResponse(response).subscribe({
      next: (result) => {
        if (result.success) {
          // Show success message (could use a toast service here)
          alert(result.message);

          this.responseSubmitted.emit();
          this.close.emit();
        } else {
          this.errorMessage.set(result.message || 'Failed to submit response');
        }
      },
      error: (error) => {
        console.error('Error submitting response:', error);
        this.errorMessage.set('An error occurred while submitting your response. Please try again.');
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  needsConfirmation(): boolean {
    return this.selectedAction() === 'decline_and_retrieve';
  }

  showConfirmationDialog(): boolean {
    if (this.selectedAction() === 'decline_and_retrieve') {
      return confirm('Are you sure you want to decline and retrieve this item? This action cannot be undone.');
    }
    return true;
  }

  handleSubmit(): void {
    if (this.needsConfirmation() && !this.showConfirmationDialog()) {
      return;
    }
    this.onSubmit();
  }
}