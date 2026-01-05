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
  styleUrls: ['./shop-layout.component.scss']
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