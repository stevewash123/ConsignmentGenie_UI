import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';
import { ItemSearchComponent } from './item-search.component';
import { CartComponent } from './cart.component';
import { RecordSaleService, CartItem, SaleRequest } from '../../services/record-sale.service';

@Component({
  selector: 'app-record-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent, ItemSearchComponent, CartComponent],
  template: `
    <app-owner-layout>
      <div class="record-sale-container">
        <!-- Header -->
        <div class="record-sale-header">
          <button class="btn btn-outline-secondary back-button" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <h1>Record Sale</h1>
        </div>

        <!-- Two Panel Layout -->
        <div class="sale-panels">
          <!-- Left Panel: Item Search -->
          <div class="item-search-panel">
            <app-item-search
              (itemSelected)="addToCart($event)"
              [disabledItems]="cartItemIds()"
            ></app-item-search>
          </div>

          <!-- Right Panel: Cart -->
          <div class="cart-panel">
            <app-cart
              [cartItems]="cartItems()"
              [taxRate]="taxRate()"
              [isLoading]="isCompletingSale()"
              (itemRemoved)="removeFromCart($event)"
              (paymentTypeChanged)="onPaymentTypeChanged($event)"
              (customerEmailChanged)="onCustomerEmailChanged($event)"
              (completeSale)="completeSale()"
            ></app-cart>
          </div>
        </div>

        <!-- Success Modal -->
        @if (saleCompleted()) {
          <div class="modal-overlay" (click)="closeSaleModal()">
            <div class="success-modal" (click)="$event.stopPropagation()">
              <div class="modal-content">
                <div class="success-icon">
                  <i class="fas fa-check-circle"></i>
                </div>
                <h2>✓ Sale Complete!</h2>
                <div class="transaction-details">
                  <p><strong>Transaction #{{ saleResult()?.transactionId }}</strong></p>
                  <p><strong>Total: {{ saleResult()?.total | currency }}</strong></p>
                  @if (saleResult()?.receiptSent) {
                    <p class="receipt-sent">[Receipt emailed to {{ customerEmail() }}]</p>
                  }
                </div>
                <div class="modal-actions">
                  <button class="btn btn-primary" (click)="recordAnotherSale()">
                    Record Another Sale
                  </button>
                  <button class="btn btn-outline-secondary" (click)="backToDashboard()">
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </app-owner-layout>
  `,
  styles: [`
    .record-sale-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .record-sale-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .record-sale-header h1 {
      margin: 0;
      color: #333;
      font-size: 2rem;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sale-panels {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 30px;
      min-height: 600px;
    }

    .item-search-panel {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .cart-panel {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Success Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .success-modal {
      background: white;
      border-radius: 12px;
      padding: 0;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .modal-content {
      padding: 40px;
      text-align: center;
    }

    .success-icon {
      font-size: 4rem;
      color: #28a745;
      margin-bottom: 20px;
    }

    .modal-content h2 {
      margin: 0 0 30px 0;
      color: #333;
      font-size: 1.8rem;
    }

    .transaction-details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .transaction-details p {
      margin: 8px 0;
      font-size: 1.1rem;
    }

    .receipt-sent {
      color: #28a745;
      font-style: italic;
    }

    .modal-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    /* Button Styles */
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
      transform: translateY(-1px);
    }

    .btn-outline-secondary {
      border: 1px solid #6c757d;
      color: #6c757d;
      background: white;
    }

    .btn-outline-secondary:hover {
      background-color: #6c757d;
      color: white;
      transform: translateY(-1px);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .sale-panels {
        grid-template-columns: 1fr 350px;
      }
    }

    @media (max-width: 992px) {
      .sale-panels {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .cart-panel {
        order: -1;
      }
    }

    @media (max-width: 768px) {
      .record-sale-container {
        padding: 15px;
      }

      .record-sale-header {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }

      .modal-content {
        padding: 30px 20px;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class RecordSaleComponent implements OnInit {
  private recordSaleService = inject(RecordSaleService);
  private router = inject(Router);

  // State signals
  cartItems = signal<CartItem[]>([]);
  taxRate = signal<number>(0);
  paymentType = signal<string>('Cash');
  customerEmail = signal<string>('');
  isCompletingSale = signal<boolean>(false);
  saleCompleted = signal<boolean>(false);
  saleResult = signal<any>(null);

  // Computed values
  cartItemIds = computed(() =>
    this.cartItems().map(item => item.item.id)
  );

  ngOnInit() {
    this.loadTaxRate();
  }

  private loadTaxRate() {
    this.recordSaleService.getTaxRate().subscribe({
      next: (rate) => this.taxRate.set(rate),
      error: (err) => console.error('Failed to load tax rate:', err)
    });
  }

  addToCart(item: any) {
    const newCartItem: CartItem = {
      item: item,
      quantity: 1
    };

    this.cartItems.update(items => [...items, newCartItem]);
  }

  removeFromCart(itemId: string) {
    this.cartItems.update(items =>
      items.filter(item => item.item.id !== itemId)
    );
  }

  onPaymentTypeChanged(paymentType: string) {
    this.paymentType.set(paymentType);
  }

  onCustomerEmailChanged(email: string) {
    this.customerEmail.set(email);
  }

  completeSale() {
    if (this.cartItems().length === 0) return;

    this.isCompletingSale.set(true);

    const saleRequest: SaleRequest = {
      items: this.cartItems(),
      paymentType: this.paymentType(),
      customerEmail: this.customerEmail() || undefined
    };

    this.recordSaleService.completeSale(saleRequest).subscribe({
      next: (result) => {
        this.saleResult.set(result);
        this.saleCompleted.set(true);
        this.isCompletingSale.set(false);
      },
      error: (err) => {
        console.error('Sale completion failed:', err);
        this.isCompletingSale.set(false);
        // TODO: Show error toast/notification
      }
    });
  }

  recordAnotherSale() {
    this.clearSale();
    this.closeSaleModal();
  }

  backToDashboard() {
    this.router.navigate(['/owner/dashboard']);
  }

  closeSaleModal() {
    this.saleCompleted.set(false);
    this.saleResult.set(null);
  }

  goBack() {
    this.router.navigate(['/owner/dashboard']);
  }

  private clearSale() {
    this.cartItems.set([]);
    this.paymentType.set('Cash');
    this.customerEmail.set('');
  }
}