import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
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
  returnTo = signal<string>('dashboard');

  // Computed values
  cartItemIds = computed(() =>
    this.cartItems().map(item => item.item.id)
  );

  ngOnInit() {
    this.loadTaxRate();
    this.handleQueryParams();
  }

  private handleQueryParams() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      // Set return destination
      if (params['returnTo']) {
        this.returnTo.set(params['returnTo']);
      }

      // Pre-select item if provided
      if (params['preselectedItem']) {
        this.loadAndAddPreselectedItem(params['preselectedItem']);
      }
    });
  }

  private loadAndAddPreselectedItem(itemId: string) {
    // Search for the specific item to add it to cart
    this.recordSaleService.getAvailableItems().subscribe({
      next: (items) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
          this.addToCart(item);
        } else {
          this.toastr.warning('Selected item not found or not available', 'Item Not Available');
        }
      },
      error: (err) => {
        console.error('Error loading preselected item:', err);
        this.toastr.error('Error loading selected item', 'Error');
      }
    });
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
      quantity: 1,
      salePrice: item.price // Default to list price
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

  onSalePriceChanged(event: { itemId: string; newPrice: number }) {
    this.cartItems.update(items =>
      items.map(item =>
        item.item.id === event.itemId
          ? { ...item, salePrice: event.newPrice }
          : item
      )
    );
  }

  completeSale() {
    if (this.cartItems().length === 0) return;

    this.isCompletingSale.set(true);
    this.errorMessage.set(''); // Clear any previous errors

    const saleRequest: SaleRequest = {
      items: this.cartItems().map(item => ({
        ...item,
        finalPrice: item.salePrice ?? item.item.price
      })),
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
    this.navigateToOrigin();
  }

  private navigateToOrigin() {
    const returnTo = this.returnTo();
    if (returnTo === 'inventory') {
      this.router.navigate(['/owner/inventory']);
    } else {
      this.router.navigate(['/owner/dashboard']);
    }
  }

  closeSaleModal() {
    this.saleCompleted.set(false);
    this.saleResult.set(null);
  }

  goBack() {
    this.navigateToOrigin();
  }

  private clearSale() {
    this.cartItems.set([]);
    this.paymentType.set('Cash');
    this.customerEmail.set('');
  }
}