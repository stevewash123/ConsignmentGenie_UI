import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicStoreService } from '../../services/public-store.service';
import { ShoppingCartService } from '../../../customer/services/shopping-cart.service';
import { CustomerAuthService } from '../../../customer/services/customer-auth.service';
import { PublicStoreInfo } from '../../../shared/models/api.models';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FormsModule],
  templateUrl: './store-layout.component.html',
  styleUrls: ['./store-layout.component.scss']
})
export class StoreLayoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly storeService = inject(PublicStoreService);
  protected readonly cartService = inject(ShoppingCartService);
  protected readonly authService = inject(CustomerAuthService);

  // Signals
  protected orgSlug = signal<string>('');
  protected storeInfo = signal<PublicStoreInfo | null>(null);
  protected categories = signal<any[]>([]);
  protected searchQuery = '';

  // UI state
  protected showCartSidebar = signal(false);
  protected showUserMenu = signal(false);
  protected showMobileMenu = signal(false);

  // Computed values
  protected cartItemCount = this.cartService.itemCount;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const orgSlug = params['orgSlug'];
      if (orgSlug) {
        this.orgSlug.set(orgSlug);
        this.loadStoreData(orgSlug);
      }
    });
  }

  private loadStoreData(orgSlug: string): void {
    this.storeService.getStoreInfo(orgSlug).subscribe({
      next: (storeInfo) => {
        if (storeInfo) {
          this.storeInfo.set(storeInfo);
          document.title = storeInfo.storeName;
        }
      },
      error: (error) => {
        console.error('Error loading store info:', error);
        // Redirect to 404 or error page
      }
    });

    this.storeService.getCategories(orgSlug).subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  protected performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/store', this.orgSlug(), 'search'], {
        queryParams: { q: this.searchQuery.trim() }
      });
    }
  }

  protected toggleCart(): void {
    this.showCartSidebar.set(!this.showCartSidebar());
  }

  protected closeCart(): void {
    this.showCartSidebar.set(false);
  }

  protected toggleUserMenu(): void {
    this.showUserMenu.set(!this.showUserMenu());
  }

  protected toggleMobileMenu(): void {
    this.showMobileMenu.set(!this.showMobileMenu());
  }

  protected closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }

  protected logout(): void {
    this.authService.logout();
    this.showUserMenu.set(false);
  }

  protected updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
    } else {
      this.cartService.updateCartItem(itemId, quantity).subscribe();
    }
  }

  protected removeFromCart(itemId: string): void {
    this.cartService.removeFromCart(itemId).subscribe();
  }
}