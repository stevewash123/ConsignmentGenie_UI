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
  styles: [`
    .shop-login-container {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      border-top: 4px solid var(--shop-accent, #047857);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .login-header p {
      color: #6b7280;
      margin: 0;
      font-size: 0.95rem;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      text-align: center;
    }

    .login-form {
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .form-input {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--shop-accent, #047857);
      box-shadow: 0 0 0 3px rgba(var(--shop-accent-rgb, 4, 120, 87), 0.1);
    }

    .form-input:disabled {
      background: #f9fafb;
      color: #6b7280;
    }

    .login-btn {
      width: 100%;
      background: var(--shop-accent, #047857);
      color: white;
      border: none;
      padding: 0.875rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .login-btn:hover:not(:disabled) {
      background: var(--shop-accent-hover, #065f46);
      transform: translateY(-1px);
    }

    .login-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }

    .login-links {
      border-top: 1px solid #e5e7eb;
      padding-top: 1.5rem;
      text-align: center;
    }

    .signup-links,
    .general-links {
      margin-bottom: 1.5rem;
    }

    .signup-links p,
    .general-links p {
      color: #6b7280;
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
    }

    .link {
      color: var(--shop-accent, #047857);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .link:hover {
      text-decoration: underline;
    }

    .divider {
      color: #9ca3af;
      margin: 0 0.5rem;
    }

    .back-link {
      margin-bottom: 1rem;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }

    .back-btn:hover {
      color: var(--shop-accent, #047857);
    }

    .global-link {
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    .global-link .link {
      font-size: 0.85rem;
      color: #9ca3af;
    }

    .global-link .link:hover {
      color: #6b7280;
    }

    @media (max-width: 480px) {
      .shop-login-container {
        padding: 1rem 0.5rem;
      }

      .login-card {
        padding: 1.5rem;
      }

      .login-header h2 {
        font-size: 1.5rem;
      }
    }
  `]
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