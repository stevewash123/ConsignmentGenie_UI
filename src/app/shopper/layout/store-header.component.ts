import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StoreInfoDto } from '../services/shopper-store.service';
import { ShopperAuthService, ShopperProfileDto } from '../services/shopper-auth.service';

@Component({
  selector: 'app-store-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './store-header.component.html',
  styleUrls: ['./store-header.component.scss']
})
export class StoreHeaderComponent implements OnInit, OnDestroy {
  @Input() storeInfo: StoreInfoDto | null = null;
  @Input() storeSlug: string = '';

  searchQuery: string = '';
  showMobileMenu: boolean = false;
  cartItemCount: number = 0;
  isAuthenticated: boolean = false;
  shopperProfile: ShopperProfileDto | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private shopperAuthService: ShopperAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication status
    this.shopperAuthService.authStatus$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuth => {
      this.isAuthenticated = isAuth && this.shopperAuthService.isAuthenticated(this.storeSlug);
    });

    // Subscribe to profile changes
    this.shopperAuthService.currentProfile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(profile => {
      this.shopperProfile = profile;
    });

    // Load stored profile if authenticated
    if (this.isAuthenticated) {
      const storedProfile = this.shopperAuthService.getStoredProfile(this.storeSlug);
      if (storedProfile) {
        this.shopperProfile = storedProfile;
      }
    }

    // TODO: Subscribe to cart changes in Phase 2
    // For now, set a placeholder value
    this.cartItemCount = 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    if (!this.searchQuery?.trim()) {
      return;
    }

    this.router.navigate(['/shop', this.storeSlug, 'search'], {
      queryParams: { q: this.searchQuery.trim() }
    });

    this.searchQuery = '';
    this.closeMobileMenu();
  }

  toggleDropdown(dropdownElement: HTMLElement): void {
    const menu = dropdownElement.querySelector('.dropdown-menu');
    if (menu) {
      menu.classList.toggle('show');
    }

    // Close other dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(el => {
      if (el !== menu) {
        el.classList.remove('show');
      }
    });
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  logout(): void {
    this.shopperAuthService.logout(this.storeSlug);
    this.router.navigate(['/shop', this.storeSlug]);
  }

  // Close dropdowns when clicking outside
  onDocumentClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-dropdown')) {
      document.querySelectorAll('.dropdown-menu.show').forEach(el => {
        el.classList.remove('show');
      });
    }
  };

  ngAfterViewInit(): void {
    document.addEventListener('click', this.onDocumentClick);
  }

  ngOnDestroy2(): void {
    document.removeEventListener('click', this.onDocumentClick);
  }
}