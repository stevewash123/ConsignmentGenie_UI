import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CartItem {
  item: {
    id: string;
    name: string;
    sku: string;
    price: number;
    consignorName: string;
    status: string;
  };
  quantity: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cart-container">
      <!-- Header -->
      <div class="cart-header">
        <h3>Cart</h3>
        @if (cartItems().length > 0) {
          <span class="item-count">{{ cartItems().length }} item{{ cartItems().length > 1 ? 's' : '' }}</span>
        }
      </div>

      <!-- Cart Items -->
      <div class="cart-items">
        @if (cartItems().length === 0) {
          <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <p>Your cart is empty</p>
            <small>Add items from the search panel</small>
          </div>
        } @else {
          @for (cartItem of cartItems(); track cartItem.item.id) {
            <div class="cart-item">
              <div class="item-info">
                <div class="item-name">{{ cartItem.item.name }}</div>
                <div class="item-sku">{{ cartItem.item.sku }}</div>
                <div class="item-consignor">{{ cartItem.item.consignorName }}</div>
              </div>
              <div class="item-actions">
                <div class="item-price">\${{ cartItem.item.price | number:'1.2-2' }}</div>
                <button
                  class="remove-button"
                  (click)="removeItem(cartItem.item.id)"
                  title="Remove from cart">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Totals Section -->
      @if (cartItems().length > 0) {
        <div class="totals-section">
          <div class="totals-line">
            <span>Subtotal:</span>
            <span class="amount">\${{ subtotal() | number:'1.2-2' }}</span>
          </div>
          <div class="totals-line">
            <span>Tax ({{ (taxRate() * 100) | number:'1.1-1' }}%):</span>
            <span class="amount">\${{ taxAmount() | number:'1.2-2' }}</span>
          </div>
          <div class="totals-line total-line">
            <span>TOTAL:</span>
            <span class="amount total-amount">\${{ total() | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- Payment Section -->
        <div class="payment-section">
          <div class="payment-type">
            <label for="paymentType">Payment Type:</label>
            <select
              id="paymentType"
              [ngModel]="selectedPaymentType"
              (ngModelChange)="onPaymentTypeChange($event)"
              class="payment-select">
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Check">Check</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="customer-email">
            <label for="customerEmail">Customer Email (optional):</label>
            <input
              type="email"
              id="customerEmail"
              [ngModel]="customerEmail"
              (ngModelChange)="onCustomerEmailChange($event)"
              placeholder="customer@email.com"
              class="email-input">
          </div>
        </div>

        <!-- Complete Sale Button -->
        <div class="complete-section">
          <button
            class="complete-button"
            [disabled]="isLoading()"
            (click)="onCompleteSale()">
            @if (isLoading()) {
              <i class="fas fa-spinner fa-spin"></i>
              Processing...
            } @else {
              <i class="fas fa-check"></i>
              Complete Sale
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    .cart-header {
      padding: 20px 20px 15px 20px;
      background: white;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cart-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.4rem;
      font-weight: 600;
    }

    .item-count {
      background: #007bff;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      min-height: 200px;
    }

    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6c757d;
      text-align: center;
      padding: 40px 20px;
    }

    .empty-cart i {
      font-size: 3rem;
      margin-bottom: 20px;
      color: #adb5bd;
    }

    .empty-cart p {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      color: #495057;
    }

    .empty-cart small {
      color: #6c757d;
    }

    .cart-item {
      background: white;
      border-bottom: 1px solid #e9ecef;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s ease;
    }

    .cart-item:hover {
      background: #f8f9fa;
    }

    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
      word-break: break-word;
    }

    .item-sku {
      font-family: monospace;
      font-size: 0.85rem;
      color: #6c757d;
      margin-bottom: 2px;
    }

    .item-consignor {
      font-size: 0.85rem;
      color: #6c757d;
      font-style: italic;
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .item-price {
      font-size: 1.1rem;
      font-weight: 700;
      color: #28a745;
      min-width: 70px;
      text-align: right;
    }

    .remove-button {
      width: 32px;
      height: 32px;
      border: 2px solid #dc3545;
      border-radius: 50%;
      background: white;
      color: #dc3545;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .remove-button:hover {
      background: #dc3545;
      color: white;
      transform: scale(1.05);
    }

    .totals-section {
      background: white;
      border-top: 2px solid #e9ecef;
      padding: 20px;
    }

    .totals-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 1rem;
    }

    .totals-line.total-line {
      border-top: 2px solid #e9ecef;
      padding-top: 12px;
      margin-bottom: 0;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .amount {
      font-weight: 600;
      color: #28a745;
    }

    .total-amount {
      font-size: 1.3rem;
      color: #333;
    }

    .payment-section {
      background: white;
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    .payment-type {
      margin-bottom: 16px;
    }

    .payment-type label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
    }

    .payment-select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 1rem;
      background: white;
    }

    .payment-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .customer-email {
      margin-bottom: 0;
    }

    .customer-email label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
    }

    .email-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 1rem;
    }

    .email-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .complete-section {
      background: white;
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    .complete-button {
      width: 100%;
      padding: 16px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s ease;
    }

    .complete-button:hover:not(:disabled) {
      background: #218838;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
    }

    .complete-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Scrollbar styling */
    .cart-items::-webkit-scrollbar {
      width: 6px;
    }

    .cart-items::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .cart-items::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .cart-items::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .cart-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .item-actions {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class CartComponent {
  // Inputs
  cartItems = input<CartItem[]>([]);
  taxRate = input<number>(0);
  isLoading = input<boolean>(false);

  // Outputs
  itemRemoved = output<string>();
  paymentTypeChanged = output<string>();
  customerEmailChanged = output<string>();
  completeSale = output<void>();

  // Local state
  selectedPaymentType = 'Cash';
  customerEmail = '';

  // Computed values
  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + (item.item.price * item.quantity), 0)
  );

  taxAmount = computed(() =>
    this.subtotal() * this.taxRate()
  );

  total = computed(() =>
    this.subtotal() + this.taxAmount()
  );

  removeItem(itemId: string) {
    this.itemRemoved.emit(itemId);
  }

  onPaymentTypeChange(paymentType: string) {
    this.selectedPaymentType = paymentType;
    this.paymentTypeChanged.emit(paymentType);
  }

  onCustomerEmailChange(email: string) {
    this.customerEmail = email;
    this.customerEmailChanged.emit(email);
  }

  onCompleteSale() {
    if (this.cartItems().length === 0 || this.isLoading()) {
      return;
    }
    this.completeSale.emit();
  }
}