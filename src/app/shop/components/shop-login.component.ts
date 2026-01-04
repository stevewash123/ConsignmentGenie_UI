import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-shop-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shop-login.component.html',
})
export class ShopLoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = signal('');
  shopSlug = signal<string>('');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    // Get shop slug from parent route
    this.route.parent?.params.subscribe(params => {
      if (params['shopSlug']) {
        this.shopSlug.set(params['shopSlug']);
      }
    });
  }

  isShopLoading(): boolean {
    return this.loadingService.isLoading('shop-login');
  }

  getShopDisplayName(): string {
    const slug = this.shopSlug();
    if (!slug) return '';

    // Convert slug to display name (e.g., "vintage-treasures" -> "Vintage Treasures")
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter both email and password');
      return;
    }

    this.loadingService.start('shop-login');
    this.errorMessage.set('');

    const loginRequest = { email: this.email, password: this.password };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Shop login successful:', response);
        const userData = this.extractUserData(response);
        this.redirectBasedOnUserAndContext(userData);
      },
      error: (error) => {
        console.error('Shop login error:', error);

        if (error.status === 401) {
          this.errorMessage.set('Invalid email or password');
        } else if (error.status === 0) {
          this.errorMessage.set('Cannot connect to server');
        } else {
          this.errorMessage.set('Login failed. Please try again.');
        }
        this.loadingService.stop('shop-login');
      },
      complete: () => {
        this.loadingService.stop('shop-login');
      }
    });
  }

  private extractUserData(response: any): any {
    if (response.data?.user) return response.data.user;
    if (response.data && !response.user) return response.data;
    if (response.user) return response.user;
    return response;
  }

  private redirectBasedOnUserAndContext(userData: any) {
    const role = this.normalizeRole(userData?.role);
    const email = userData?.email || '';
    const shopSlug = this.shopSlug();

    console.log('Shop context redirect:', { email, role, shopSlug, rawRole: userData?.role });

    // Admin always goes to admin dashboard regardless of context
    if (email === 'admin@microsaasbuilders.com' || role === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    // Shop context-aware redirects
    if (shopSlug) {
      switch (role) {
        case 'Customer':
          // Customer: Logs in, stays on current shop
          this.router.navigate(['/shop', shopSlug]);
          break;

        case 'consignor':
          // consignor: Logs in, sees their dashboard for this shop
          // TODO: Implement shop-specific consignor dashboard
          // For now, redirect to general consignor dashboard
          this.router.navigate(['/consignor/dashboard']);
          break;

        case 'Owner':
          // Check if this is the owner of the current shop
          // TODO: Implement shop ownership check
          // For now, redirect to owner dashboard
          this.router.navigate(['/owner/dashboard']);
          break;

        default:
          // Unknown role: treat as customer and stay on shop
          this.router.navigate(['/shop', shopSlug]);
      }
    } else {
      // No shop context: use standard role-based routing
      this.redirectToStandardDashboard(role);
    }
  }

  private redirectToStandardDashboard(role: string) {
    switch (role) {
      case 'Admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'Owner':
        this.router.navigate(['/owner/dashboard']);
        break;
      case 'consignor':
        this.router.navigate(['/consignor/dashboard']);
        break;
      case 'Customer':
        this.router.navigate(['/customer/dashboard']);
        break;
      default:
        console.warn('Unknown role:', role);
        this.router.navigate(['/owner/dashboard']);
    }
  }

  private normalizeRole(role: string | number): string {
    if (role === null || role === undefined) {
      throw new Error('Role cannot be null or undefined');
    }

    // Handle numeric role values (enum from API)
    if (typeof role === 'number' || !isNaN(Number(role))) {
      const roleMap: { [key: number]: string } = {
        0: 'Admin',
        1: 'Owner',
        2: 'consignor',
        3: 'Customer'
      };
      return roleMap[Number(role)] || 'Customer';
    }

    return String(role);
  }
}