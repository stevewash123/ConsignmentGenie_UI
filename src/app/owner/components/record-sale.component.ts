import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ItemSearchComponent } from './item-search.component';
import { CartComponent } from './cart.component';
import { RecordSaleService, CartItem, SaleRequest } from '../../services/record-sale.service';

@Component({
  selector: 'app-record-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemSearchComponent, CartComponent],
  templateUrl: './record-sale.component.html',
  styleUrls: ['./record-sale.component.scss']
})
export class RecordSaleComponent implements OnInit {
  private recordSaleService = inject(RecordSaleService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  // State signals
  cartItems = signal<CartItem[]>([]);
  taxRate = signal<number>(0);
  paymentType = signal<string>('Cash');
  customerEmail = signal<string>('');
  isCompletingSale = signal<boolean>(false);
  saleCompleted = signal<boolean>(false);
  saleResult = signal<any>(null);
  errorMessage = signal<string>('');

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
    // Check if item is already in cart (prevent duplicates for consignment items)
    const existingItem = this.cartItems().find(cartItem => cartItem.item.id === item.id);
    if (existingItem) {
      this.toastr.warning('Item is already in cart', 'Duplicate Item');
      return;
    }

    const newCartItem: CartItem = {
      item: item,
      quantity: 1
    };

    this.cartItems.update(items => [...items, newCartItem]);
    this.toastr.success(`Added "${item.name}" to cart`, 'Item Added');
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
    this.errorMessage.set(''); // Clear any previous errors

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

        // Show toast notification if receipt was sent
        if (result.receiptSent && this.customerEmail()) {
          this.toastr.success(`Receipt sent to ${this.customerEmail()}`, 'Email Sent!', {
            timeOut: 5000
          });
        }
      },
      error: (err) => {
        console.error('Sale completion failed:', err);
        this.isCompletingSale.set(false);
        this.errorMessage.set('Failed to complete the sale. Please check your connection and try again.');
      }
    });
  }

  clearError() {
    this.errorMessage.set('');
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