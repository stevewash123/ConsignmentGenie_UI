import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface ShopInfo {
  shopSlug: string;
  shopName: string;
  ownerName: string;
  description?: string;
  logo?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop-layout.component.html',
  styles: [`
    .shop-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .shop-header {
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border-bottom: 3px solid var(--shop-accent, #047857);
    }

    .shop-header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
    }

    .shop-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .shop-logo img {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
    }

    .shop-logo-placeholder {
      width: 60px;
      height: 60px;
      background: var(--shop-accent, #047857);
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .shop-name {
      color: var(--shop-primary, #1f2937);
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
    }

    .shop-description {
      color: #6b7280;
      margin: 0.25rem 0 0 0;
      font-size: 0.95rem;
    }

    .shop-nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-link {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .nav-link:hover,
    .nav-link.active {
      color: var(--shop-accent, #047857);
      border-bottom-color: var(--shop-accent, #047857);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .welcome-text {
      color: #374151;
      font-weight: 500;
    }

    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      text-align: center;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
    }

    .btn-primary {
      background: var(--shop-accent, #047857);
      color: white;
    }

    .btn-primary:hover {
      background: var(--shop-accent-hover, #065f46);
    }

    .btn-outline {
      background: transparent;
      color: var(--shop-accent, #047857);
      border: 1px solid var(--shop-accent, #047857);
    }

    .btn-outline:hover {
      background: var(--shop-accent, #047857);
      color: white;
    }

    .btn-link {
      background: none;
      color: #6b7280;
      border: none;
      padding: 0.25rem 0.5rem;
      text-decoration: underline;
    }

    .btn-link:hover {
      color: #374151;
    }

    .shop-content {
      flex: 1;
      padding: 2rem 0;
    }

    .shop-footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 1.5rem 0;
      margin-top: auto;
    }

    .shop-footer p {
      color: #6b7280;
      text-align: center;
      margin: 0;
      font-size: 0.875rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #047857;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-container p {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .shop-not-found {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }

    .shop-not-found h1 {
      color: #1f2937;
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .shop-not-found p {
      color: #6b7280;
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .shop-header .container {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .shop-brand {
        align-self: flex-start;
      }

      .shop-nav {
        align-self: stretch;
        justify-content: space-between;
      }

      .nav-link {
        font-size: 0.9rem;
      }
    }
  `]
})
export class ShopLayoutComponent implements OnInit {
  shopInfo = signal<ShopInfo | null>(null);
  shopNotFound = signal(false);
  currentUser = signal<any>(null);
  currentYear = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get shop slug from route
    this.route.params.subscribe(params => {
      const shopSlug = params['shopSlug'];
      if (shopSlug) {
        this.loadShopInfo(shopSlug);
      }
    });

    // Load current user
    this.currentUser.set(this.authService.getCurrentUser());

    // Subscribe to auth changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  private loadShopInfo(shopSlug: string) {
    // TODO: Replace with actual API call
    // For now, simulate loading shop info
    setTimeout(() => {
      // Mock shop data - this would come from an API
      const mockShop: ShopInfo = {
        shopSlug: shopSlug,
        shopName: shopSlug.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        ownerName: 'Shop Owner',
        description: 'Quality consignment items at great prices',
        isActive: true
      };

      this.shopInfo.set(mockShop);
    }, 500);
  }

  getShopInitials(): string {
    const shopName = this.shopInfo()?.shopName || '';
    return shopName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  logout() {
    this.authService.logout();
    // Stay on current shop page after logout
    this.router.navigate(['/shop', this.shopInfo()?.shopSlug]);
  }
}