import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';

import { CartService } from '../services/cart.service';
import { PermissionService } from '../services/permission.service';
import { RecordSaleService } from '../services/record-sale.service';
import { InventoryService } from '../services/inventory.service';
import { ItemListDto } from '../models/inventory.model';

export interface SearchResult extends ItemListDto {
  // Additional search-specific properties if needed
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit {
  private cartService = inject(CartService);
  private permissionService = inject(PermissionService);
  private recordSaleService = inject(RecordSaleService);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // Search state
  searchQuery = signal<string>('');
  searchResults = signal<SearchResult[]>([]);
  isSearching = signal<boolean>(false);

  // Payment state
  paymentType = signal<string>('Cash');
  customerEmail = signal<string>('');

  // Sale state
  isCompletingSale = signal<boolean>(false);
  saleCompleted = signal<boolean>(false);
  saleResult = signal<any>(null);
  errorMessage = signal<string>('');

  // PIN verification state
  showPinModal = signal<boolean>(false);
  pinModalAction = signal<string>('');
  pinInput = signal<string>('');
  pinError = signal<string>('');

  // Cart state (from service)
  cartState = computed(() => this.cartService.cartState());
  cartItems = computed(() => this.cartState().items);
  subtotal = computed(() => this.cartState().subtotal);
  tax = computed(() => this.cartState().tax);
  total = computed(() => this.cartState().total);

  // Permission-based computed properties
  canApplyDiscount = computed(() => this.permissionService.canPerformWithoutPin('discount'));
  canVoidTransaction = computed(() => this.permissionService.canPerformWithoutPin('void'));
  canViewConsignorInfo = computed(() => this.permissionService.canViewConsignorInfo());
  canViewCostInfo = computed(() => this.permissionService.canViewCostInfo());
  canUseQuickSell = computed(() => this.permissionService.canUseQuickSell());

  // Payment types
  readonly paymentTypes = ['Cash', 'Card', 'Check', 'Other'];

  ngOnInit() {
    this.loadCustomerEmailFromCart();
  }

  private loadCustomerEmailFromCart() {
    const cartEmail = this.cartState().customerEmail;
    if (cartEmail) {
      this.customerEmail.set(cartEmail);
    }
  }

  onSearchQueryChange(query: string) {
    this.searchQuery.set(query);
    if (query.trim().length >= 2) {
      this.performSearch();
    } else {
      this.searchResults.set([]);
    }
  }

  private performSearch() {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.isSearching.set(true);
    this.inventoryService.searchItems(query).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (items) => {
        // Filter only available items for POS
        const availableItems = items.filter(item => item.status === 'Available');
        this.searchResults.set(availableItems);
        this.isSearching.set(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.toastr.error('Error searching items', 'Search Error');
        this.isSearching.set(false);
      }
    });
  }

  addToCart(item: SearchResult) {
    // Check if item is already in cart
    const existingItem = this.cartItems().find(cartItem => cartItem.id === item.itemId);
    if (existingItem) {
      this.toastr.warning('Item is already in cart', 'Duplicate Item');
      return;
    }

    this.cartService.addItem(item);
    this.toastr.success(`Added "${item.title}" to cart`, 'Item Added');

    // Clear search after adding item
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  removeFromCart(itemId: string) {
    this.cartService.removeItem(itemId);
  }

  updateQuantity(itemId: string, quantity: number) {
    this.cartService.updateQuantity(itemId, quantity);
  }

  onPaymentTypeChanged(paymentType: string) {
    this.paymentType.set(paymentType);
  }

  onCustomerEmailChanged(email: string) {
    this.customerEmail.set(email);
    this.cartService.setCustomerEmail(email);
  }

  // Discount functionality with PIN check
  applyDiscount() {
    if (this.canApplyDiscount()) {
      this.showDiscountModal();
    } else {
      this.requestPin('discount');
    }
  }

  // Void functionality with PIN check
  voidTransaction() {
    if (this.canVoidTransaction()) {
      this.performVoid();
    } else {
      this.requestPin('void');
    }
  }

  private requestPin(action: string) {
    this.pinModalAction.set(action);
    this.pinInput.set('');
    this.pinError.set('');
    this.showPinModal.set(true);
  }

  verifyPin() {
    const pin = this.pinInput();
    // TODO: Implement PIN verification logic
    // For now, simulate owner PIN
    if (pin === '1234') { // Placeholder PIN
      this.showPinModal.set(false);
      const action = this.pinModalAction();

      if (action === 'discount') {
        this.showDiscountModal();
      } else if (action === 'void') {
        this.performVoid();
      }
    } else {
      this.pinError.set('Invalid PIN. Please try again.');
    }
  }

  cancelPinModal() {
    this.showPinModal.set(false);
    this.pinInput.set('');
    this.pinError.set('');
  }

  private showDiscountModal() {
    // TODO: Implement discount modal
    this.toastr.info('Discount functionality coming soon', 'Feature Pending');
  }

  private performVoid() {
    // TODO: Implement void transaction logic
    this.toastr.info('Void transaction functionality coming soon', 'Feature Pending');
  }

  completeSale() {
    if (this.cartService.isEmpty()) {
      this.toastr.warning('Cart is empty', 'No Items');
      return;
    }

    this.isCompletingSale.set(true);
    this.errorMessage.set('');

    const cartState = this.cartState();
    const saleRequest = {
      items: cartState.items.map(item => ({
        item: {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          consignorName: item.consignorName || '',
          status: 'Available',
          category: 'General' // Default category
        },
        quantity: item.quantity,
        salePrice: item.price,
        finalPrice: item.price
      })),
      paymentType: this.paymentType(),
      customerEmail: this.customerEmail() || undefined
    };

    this.recordSaleService.completeSale(saleRequest).subscribe({
      next: (result) => {
        this.saleResult.set(result);
        this.saleCompleted.set(true);
        this.isCompletingSale.set(false);
        this.cartService.clearCart();

        // Show receipt email notification
        if (result.receiptSent && this.customerEmail()) {
          this.toastr.success(`Receipt sent to ${this.customerEmail()}`, 'Email Sent!', {
            timeOut: 5000
          });
        }
      },
      error: (error) => {
        console.error('Sale completion failed:', error);
        this.isCompletingSale.set(false);
        this.errorMessage.set('Failed to complete the sale. Please check your connection and try again.');
        this.toastr.error('Sale failed', 'Error');
      }
    });
  }

  clearCart() {
    this.cartService.clearCart();
    this.customerEmail.set('');
    this.toastr.info('Cart cleared', 'Cart');
  }

  clearError() {
    this.errorMessage.set('');
  }

  recordAnotherSale() {
    this.saleCompleted.set(false);
    this.saleResult.set(null);
  }

  closeSaleModal() {
    this.saleCompleted.set(false);
    this.saleResult.set(null);
  }

  // Navigation helpers
  goToInventory() {
    if (this.permissionService.isOwner()) {
      this.router.navigate(['/owner/inventory']);
    } else if (this.permissionService.canAccessInventory()) {
      this.router.navigate(['/clerk/inventory']);
    }
  }

  goToDashboard() {
    if (this.permissionService.isOwner()) {
      this.router.navigate(['/owner/dashboard']);
    }
    // Clerks don't have dashboard access
  }

  // Utility methods for template
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}