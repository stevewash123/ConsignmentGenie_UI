import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemReservationService } from '../../services/item-reservation.service';

export interface ConflictModalData {
  item: {
    id: string;
    name: string;
    sku: string;
    price: number;
  };
  errorMessage: string;
  conflictType: 'already_sold' | 'reserved_elsewhere' | 'api_error';
}

@Component({
  selector: 'app-reservation-conflict-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-conflict-modal.component.html',
  styleUrls: ['./reservation-conflict-modal.component.scss']
})
export class ReservationConflictModalComponent {
  private reservationService = inject(ItemReservationService);

  // Inputs
  conflictData = input.required<ConflictModalData>();

  // Outputs
  dismissed = output<void>();
  retryRequested = output<string>(); // Emits item ID

  // State
  isRetrying = signal(false);

  get conflictTypeIcon(): string {
    switch (this.conflictData().conflictType) {
      case 'already_sold':
        return 'fas fa-shopping-cart';
      case 'reserved_elsewhere':
        return 'fas fa-clock';
      case 'api_error':
      default:
        return 'fas fa-exclamation-triangle';
    }
  }

  get conflictTypeMessage(): string {
    switch (this.conflictData().conflictType) {
      case 'already_sold':
        return 'This item was just purchased online and is no longer available.';
      case 'reserved_elsewhere':
        return 'This item is currently being processed at another terminal.';
      case 'api_error':
      default:
        return 'Unable to reserve this item due to a system error.';
    }
  }

  dismiss(): void {
    this.dismissed.emit();
  }

  async retry(): Promise<void> {
    this.isRetrying.set(true);

    try {
      const result = await this.reservationService.reserveItem(this.conflictData().item.id);

      if (result.success) {
        // Success - emit retry with success
        this.retryRequested.emit(this.conflictData().item.id);
        this.dismissed.emit();
      } else {
        // Still conflicts - this will trigger a new modal
        // For now, just dismiss this one
        this.dismissed.emit();
      }
    } catch (error) {
      console.error('Retry reservation failed:', error);
      // Keep modal open on error
    } finally {
      this.isRetrying.set(false);
    }
  }

  // Handle backdrop click
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dismiss();
    }
  }
}