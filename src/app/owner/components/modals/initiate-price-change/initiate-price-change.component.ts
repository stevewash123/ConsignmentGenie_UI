import { Component, EventEmitter, Input, Output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemDetailDto } from '../../../../models/inventory.model';
import { PriceChangeRequest, PriceChangeResponse } from '../../../../models/price-change.model';
import { PriceChangeService } from '../../../../services/price-change.service';

@Component({
  selector: 'app-initiate-price-change',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './initiate-price-change.component.html',
  styleUrls: ['./initiate-price-change.component.scss']
})
export class InitiatePriceChangeComponent implements OnInit {
  @Input() isVisible!: () => boolean;
  @Input() item!: ItemDetailDto;
  @Output() close = new EventEmitter<void>();
  @Output() priceChangeSubmitted = new EventEmitter<void>();

  newPrice = signal(0);
  updatedMarketPrice = signal<number | null>(null);
  noteToConsignor = signal('');

  isSubmitting = signal(false);
  errorMessage = signal('');
  validationErrors = signal<{[key: string]: string}>({});

  constructor(private priceChangeService: PriceChangeService) {}

  ngOnInit() {
    // Initialize with current price
    this.newPrice.set(this.item.price);
  }

  // Computed properties
  priceDirection = computed(() => {
    const current = this.item.price;
    const newVal = this.newPrice();
    if (newVal > current) return 'increase';
    if (newVal < current) return 'decrease';
    return 'same';
  });

  isIncrease = computed(() => this.priceDirection() === 'increase');
  isDecrease = computed(() => this.priceDirection() === 'decrease');
  isSamePrice = computed(() => this.priceDirection() === 'same');

  newConsignorAmount = computed(() => {
    const newPrice = this.newPrice();
    const commissionRate = this.item.commissionRate;
    return newPrice * (commissionRate / 100);
  });

  newShopAmount = computed(() => {
    const newPrice = this.newPrice();
    const consignorAmount = this.newConsignorAmount();
    return newPrice - consignorAmount;
  });

  earningsDifference = computed(() => {
    return this.newConsignorAmount() - this.item.consignorAmount;
  });

  buttonText = computed(() => {
    return this.isIncrease() ? 'Update Price' : 'Send to Consignor';
  });

  modalTitle = computed(() => {
    return 'Change Price';
  });

  getDaysListed(): number {
    if (!this.item.listedDate) return 0;

    const listedDate = new Date(this.item.listedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - listedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  onOverlayClick(event: Event): void {
    this.close.emit();
  }

  validateForm(): boolean {
    const errors: {[key: string]: string} = {};

    // Price validation
    const newPrice = this.newPrice();
    if (!newPrice || newPrice <= 0) {
      errors['price'] = 'Price must be greater than 0';
    } else if (newPrice === this.item.price) {
      errors['price'] = 'New price must be different from current price';
    }

    // Note validation for decreases
    if (this.isDecrease() && !this.noteToConsignor().trim()) {
      errors['note'] = 'A note to the consignor is required for price decreases';
    }

    this.validationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const request: PriceChangeRequest = {
      itemId: this.item.itemId,
      currentPrice: this.item.price,
      newPrice: this.newPrice(),
      updatedMarketPrice: this.updatedMarketPrice() || undefined,
      noteToConsignor: this.noteToConsignor().trim() || undefined
    };

    this.priceChangeService.submitPriceChange(request).subscribe({
      next: (response: PriceChangeResponse) => {
        if (response.success) {
          // Show success toast
          const message = this.isIncrease()
            ? 'Price updated immediately!'
            : 'Sent to consignor for approval';

          // You might want to use a proper toast service here
          alert(message);

          this.priceChangeSubmitted.emit();
          this.close.emit();
        } else {
          this.errorMessage.set(response.message || 'Failed to submit price change');
        }
      },
      error: (error) => {
        console.error('Error submitting price change:', error);
        let errorMsg = 'Failed to submit price change. Please try again.';

        if (error.status === 400) {
          errorMsg = error.error?.message || 'Invalid request data';
        } else if (error.status === 404) {
          errorMsg = 'Item not found';
        } else if (error.status === 401) {
          errorMsg = 'You are not authorized to change this price';
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Expose Math for template use
  protected readonly Math = Math;
}