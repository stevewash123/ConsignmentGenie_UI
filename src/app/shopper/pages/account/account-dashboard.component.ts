import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShopperAuthService, ShopperProfileDto } from '../../services/shopper-auth.service';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './account-dashboard.component.html',
  styleUrls: ['./account-dashboard.component.scss']
})
export class AccountDashboardComponent implements OnInit, OnDestroy {
  storeSlug = '';
  storeInfo: StoreInfoDto | null = null;
  shopperProfile: ShopperProfileDto | null = null;

  // Mock data for Phase 1 - will be replaced with real data in Phase 2
  orderStats = {
    total: 0,
    pending: 0,
    completed: 0
  };

  favoriteCount = 0;

  recentOrders: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private shopperAuthService: ShopperAuthService,
    private storeService: ShopperStoreService
  ) {}

  ngOnInit(): void {
    // Get store slug from route
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
    });

    // Get store info
    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });

    // Get shopper profile
    this.shopperAuthService.currentProfile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(profile => {
      this.shopperProfile = profile;
    });

    // Load profile if not already loaded
    if (!this.shopperProfile && this.storeSlug) {
      this.loadProfile();
    }

    // TODO: Load actual order data and favorites in Phase 2
    this.loadMockData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitials(): string {
    if (!this.shopperProfile?.fullName) {
      return '?';
    }

    const names = this.shopperProfile.fullName.split(' ');
    const initials = names.map(name => name.charAt(0)).join('');
    return initials.substring(0, 2).toUpperCase();
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  contactSupport(event: Event): void {
    event.preventDefault();
    // TODO: Implement contact support functionality
    alert('Contact support functionality will be implemented in a future update.');
  }

  private loadProfile(): void {
    this.shopperAuthService.getProfile(this.storeSlug).subscribe({
      next: (profile) => {
        this.shopperProfile = profile;
      },
      error: (error) => {
        console.error('Failed to load shopper profile:', error);
      }
    });
  }

  private loadMockData(): void {
    // Mock data for demonstration - will be replaced with real API calls in Phase 2
    this.orderStats = {
      total: 0,
      pending: 0,
      completed: 0
    };

    this.favoriteCount = 0;

    this.recentOrders = [];

    // Example of what real orders might look like:
    /*
    this.recentOrders = [
      {
        id: '1234',
        number: '1234',
        date: new Date('2024-01-15'),
        itemCount: 2,
        total: 73.00,
        status: 'ready',
        statusText: 'Ready for Pickup'
      },
      {
        id: '1198',
        number: '1198',
        date: new Date('2024-01-10'),
        itemCount: 1,
        total: 45.00,
        status: 'completed',
        statusText: 'Completed'
      }
    ];
    */
  }
}