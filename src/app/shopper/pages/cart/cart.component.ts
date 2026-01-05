import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShopperAuthService } from '../../services/shopper-auth.service';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';
import { ShopperCartService, Cart, CartItem } from '../../services/shopper-cart.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { LOADING_KEYS } from '../../constants/loading-keys';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug = '';
  isAuthenticated = false;
  cart: Cart | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: ShopperAuthService,
    private storeService: ShopperStoreService,
    private cartService: ShopperCartService,
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
      this.isAuthenticated = this.authService.isAuthenticated(this.storeSlug);

      if (this.storeSlug) {
        this.initializeCart();
      }
    });

    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCart(): void {
    this.loadingService.start(LOADING_KEYS.CART_LOAD);
    this.cartService.setCurrentStore(this.storeSlug);

    this.cartService.getCurrentCart$().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: cart => {
        this.cart = cart;
      },
      error: error => {
        console.error('Error loading cart:', error);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.CART_LOAD);
      }
    });
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.itemId;
  }

  updateQuantity(itemId: string, newQuantity: number): void {
    this.loadingService.start(LOADING_KEYS.CART_UPDATE);
    this.cartService.updateItemQuantity(itemId, newQuantity);
    // Note: This completes immediately since updateItemQuantity is synchronous
    this.loadingService.stop(LOADING_KEYS.CART_UPDATE);
  }

  removeItem(itemId: string): void {
    this.loadingService.start(LOADING_KEYS.CART_REMOVE);
    this.cartService.removeItem(itemId);
    // Note: This completes immediately since removeItem is synchronous
    this.loadingService.stop(LOADING_KEYS.CART_REMOVE);
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      this.loadingService.start(LOADING_KEYS.CART_CLEAR);
      this.cartService.clearCart();
      // Note: This completes immediately since clearCart is synchronous
      this.loadingService.stop(LOADING_KEYS.CART_CLEAR);
    }
  }

  proceedToCheckout(): void {
    if (!this.cart || this.cart.items.length === 0) return;

    this.router.navigate(['/shop', this.storeSlug, 'checkout']);
  }

  onImageError(event: any): void {
    event.target.src = '/assets/placeholder-item.jpg';
  }
}