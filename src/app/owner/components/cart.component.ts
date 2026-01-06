import {
  Component,
  input,
  output,
  computed,
  signal,
  inject,
  DestroyRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { ItemReservationService, CartItemReservation } from '../../services/item-reservation.service';

// =============================================================================
// Constants
// =============================================================================
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const TIMER_INTERVAL_MS = 1000; // 1 second

const PAYMENT_TYPES = {
  CASH: 'Cash',
  CARD: 'Card',
  CHECK: 'Check',
  OTHER: 'Other'
} as const;

// =============================================================================
// Interfaces
// =============================================================================
export interface CartItem {
  item: {
    id: string;
    name: string;
    sku: string;
    price: number;
    consignorName: string;
    status: string;
    isFromSquare?: boolean;
    squareVariationId?: string;
  };
  quantity: number;
  reservation?: CartItemReservation;
  timeRemaining?: number;
}

export interface CartItemWithTimer extends CartItem {
  displayTimeRemaining: number;
}

// =============================================================================
// Component
// =============================================================================
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  private readonly reservationService = inject(ItemReservationService);
  private readonly destroyRef = inject(DestroyRef);

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------
  cartItems = input<CartItem[]>([]);
  taxRate = input<number>(0);
  isLoading = input<boolean>(false);

  // -------------------------------------------------------------------------
  // Outputs
  // -------------------------------------------------------------------------
  itemRemoved = output<string>();
  paymentTypeChanged = output<string>();
  customerEmailChanged = output<string>();
  completeSale = output<void>();
  showConflictDialog = output<{ item: CartItem; errorMessage: string; conflictType: string }>();
  showExpirationWarning = output<{ item: CartItem; timeRemaining: number }>();

  // -------------------------------------------------------------------------
  // Local State (Signals)
  // -------------------------------------------------------------------------
  selectedPaymentType = signal<string>(PAYMENT_TYPES.CASH);
  customerEmail = signal<string>('');
  expiredItems = signal<string[]>([]);
  itemTimers = signal<Map<string, number>>(new Map());

  // -------------------------------------------------------------------------
  // Computed Values
  // -------------------------------------------------------------------------
  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.item.price * item.quantity, 0)
  );

  taxAmount = computed(() => this.subtotal() * this.taxRate());

  total = computed(() => this.subtotal() + this.taxAmount());

  /**
   * Expose warning threshold for template use
   */
  readonly warningThresholdMs = WARNING_THRESHOLD_MS;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  ngOnInit(): void {
    this.startReservationTimer();
  }

  // -------------------------------------------------------------------------
  // Timer Management
  // -------------------------------------------------------------------------
  private startReservationTimer(): void {
    interval(TIMER_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateTimers();
        this.checkForExpirations();
        this.checkForWarnings();
      });
  }

  private updateTimers(): void {
    const newTimers = new Map<string, number>();

    this.cartItems().forEach(item => {
      if (item.reservation?.isActive && item.reservation.expiresAt) {
        const remaining = this.reservationService.calculateRemainingTime(
          item.reservation.expiresAt
        );
        newTimers.set(item.item.id, remaining);
      }
    });

    this.itemTimers.set(newTimers);
  }

  private checkForExpirations(): void {
    const timers = this.itemTimers();

    const expiredCartItems = this.cartItems().filter(item => {
      const remaining = timers.get(item.item.id);
      return (
        item.reservation?.isActive &&
        remaining !== undefined &&
        remaining <= 0
      );
    });

    expiredCartItems.forEach(item => {
      // Fire and forget - errors are already handled within handleExpiredReservation
      this.handleExpiredReservation(item);
    });
  }

  private checkForWarnings(): void {
    const timers = this.itemTimers();
    const expired = this.expiredItems();

    const warningItem = this.cartItems().find(item => {
      const remaining = timers.get(item.item.id);
      return (
        item.reservation?.isActive &&
        remaining !== undefined &&
        this.reservationService.isExpiringWarning(remaining, WARNING_THRESHOLD_MS) &&
        !expired.includes(item.item.id)
      );
    });

    if (warningItem) {
      const timeRemaining = timers.get(warningItem.item.id)!;
      this.showExpirationWarning.emit({
        item: warningItem,
        timeRemaining
      });
    }
  }

  private handleExpiredReservation(item: CartItem): void {
    // Add to expired list to prevent multiple notifications
    this.expiredItems.update(list => [...list, item.item.id]);

    // Release reservation (cleanup)
    this.reservationService.releaseReservation(item.item.id).subscribe({
      next: () => {
        // Remove from cart after successful release
        this.removeItem(item.item.id);
      },
      error: () => {
        // Silently handle - still remove from cart
        this.removeItem(item.item.id);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------
  /**
   * Get time remaining for a specific item
   */
  getTimeRemaining(itemId: string): number | undefined {
    return this.itemTimers().get(itemId);
  }

  /**
   * Check if item timer is in warning state
   */
  isTimerWarning(itemId: string): boolean {
    const remaining = this.itemTimers().get(itemId);
    return remaining !== undefined && remaining < WARNING_THRESHOLD_MS;
  }

  /**
   * Format milliseconds to display time
   */
  formatTime(milliseconds: number): string {
    return this.reservationService.formatTime(milliseconds);
  }

  /**
   * Remove item from cart and release reservation if active
   */
  removeItem(itemId: string): void {
    const item = this.cartItems().find(i => i.item.id === itemId);

    // Release reservation if active
    if (item?.reservation?.isActive) {
      this.reservationService.releaseReservation(itemId).subscribe({
        next: () => {
          this.itemRemoved.emit(itemId);
        },
        error: () => {
          // Silently handle - still emit removal
          this.itemRemoved.emit(itemId);
        }
      });
    } else {
      this.itemRemoved.emit(itemId);
    }
  }

  /**
   * Handle payment type selection change
   */
  onPaymentTypeChange(paymentType: string): void {
    this.selectedPaymentType.set(paymentType);
    this.paymentTypeChanged.emit(paymentType);
  }

  /**
   * Handle customer email change
   */
  onCustomerEmailChange(email: string): void {
    this.customerEmail.set(email);
    this.customerEmailChanged.emit(email);
  }

  /**
   * Handle complete sale action
   */
  onCompleteSale(): void {
    if (this.cartItems().length === 0 || this.isLoading()) {
      return;
    }
    this.completeSale.emit();
  }
}
