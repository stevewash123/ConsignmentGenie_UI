import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../shared/services/loading.service';
import { ConsignorPortalService } from '../consignor/services/consignor-portal.service';

@Component({
  selector: 'app-login-simple',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-simple.component.html',
  styleUrls: ['./login-simple.component.scss']
})
export class LoginSimpleComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = signal('');
  returnUrl = signal<string>('');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private loadingService: LoadingService,
    private consignorService: ConsignorPortalService
  ) {}

  ngOnInit() {
    // Check for return URL parameter
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
      }
    });
  }

  isAuthLoading(): boolean {
    return this.loadingService.isLoading('auth-login');
  }

  quickLogin(email: string) {
    this.email = email;
    // Use correct passwords for each account type
    if (email === 'admin@microsaasbuilders.com') {
      this.password = 'admin123';  // Admin password from AdminController
    } else if (email === 'owner1@microsaasbuilders.com') {
      this.password = 'oldCity2220';  // Owner password
    } else {
      this.password = 'password123';  // Default for other accounts
    }
    this.errorMessage.set('');
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter both email and password');
      return;
    }

    this.loadingService.start('auth-login');
    this.errorMessage.set('');

    const loginRequest = { email: this.email, password: this.password };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        // Handle different API response formats
        const userData = this.extractUserData(response);
        this.redirectBasedOnUser(userData);
      },
      error: (error) => {
        console.error('Login error:', error);

        if (error.status === 401) {
          this.errorMessage.set('Invalid email or password');
        } else if (error.status === 0) {
          this.errorMessage.set('Cannot connect to server');
        } else {
          this.errorMessage.set('Login failed. Please try again.');
        }
        this.loadingService.stop('auth-login');
      },
      complete: () => {
        this.loadingService.stop('auth-login');
      }
    });
  }

  private extractUserData(response: any): any {
    // Type guard for wrapped response with nested user
    if (response.data?.user) {
      return response.data.user;
    }
    // Type guard for wrapped response with direct user data
    if (response.data && !response.user) {
      return response.data;
    }
    // Direct user response
    if (response.user) {
      return response.user;
    }
    // Fallback to response itself
    return response;
  }

  private redirectBasedOnUser(userData: any) {
    const email = userData?.email || '';
    const role = this.normalizeRole(userData?.role);
    const returnUrl = this.returnUrl();

    console.log('Redirecting user:', { email, role, returnUrl, rawRole: userData?.role });

    // Admin always goes to admin dashboard (unless specific return URL)
    if (email === 'admin@microsaasbuilders.com' || role === 'Admin') {
      if (returnUrl && returnUrl.startsWith('/admin/')) {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.router.navigate(['/admin/dashboard']);
      }
      return;
    }

    // Check for return URL from shop context
    if (returnUrl && this.isShopUrl(returnUrl)) {
      this.redirectShopContextUser(role, returnUrl);
      return;
    }

    // Standard role-based routing
    switch (role) {
      case 'Admin':
        console.log('Navigating to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']).then(
          success => console.log('Admin navigation success:', success),
          error => console.error('Admin navigation failed:', error)
        );
        break;
      case 'Owner':
        console.log('Navigating to /owner/dashboard');
        this.router.navigate(['/owner/dashboard']).then(
          success => console.log('Owner navigation success:', success),
          error => console.error('Owner navigation failed:', error)
        );
        break;
      case 'consignor':
      case 'Consignor':
        console.log('Checking consignor agreement status before redirect...');
        this.redirectConsignorBasedOnAgreement();
        break;
      case 'Customer':
        console.log('Navigating to /customer/dashboard');
        this.router.navigate(['/customer/dashboard']).then(
          success => console.log('Customer navigation success:', success),
          error => console.error('Customer navigation failed:', error)
        );
        break;
      default:
        console.warn('Unknown role:', role);
        console.log('Navigating to /owner/dashboard (default)');
        this.router.navigate(['/owner/dashboard']).then(
          success => console.log('Default navigation success:', success),
          error => console.error('Default navigation failed:', error)
        );
    }
  }

  private isShopUrl(url: string): boolean {
    return url.startsWith('/shop/');
  }

  private redirectShopContextUser(role: string, returnUrl: string) {
    // Extract shop slug from return URL
    const shopSlugMatch = returnUrl.match(/^\/shop\/([^\/]+)/);
    const shopSlug = shopSlugMatch?.[1];

    if (!shopSlug) {
      // Invalid shop URL, fallback to standard redirect
      this.redirectToStandardDashboard(role);
      return;
    }

    switch (role) {
      case 'Customer':
        // Customer: return to the shop they were viewing
        this.router.navigateByUrl(returnUrl);
        break;

      case 'consignor':
        // consignor: go to their dashboard (TODO: shop-specific consignor view)
        this.router.navigate(['/consignor/dashboard']);
        break;

      case 'Owner':
        // Owner: check if they own this shop (TODO: implement ownership check)
        // For now, redirect to owner dashboard
        this.router.navigate(['/owner/dashboard']);
        break;

      default:
        // Unknown role: treat as customer and return to shop
        this.router.navigate(['/shop', shopSlug]);
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
        this.router.navigate(['/owner/dashboard']);
    }
  }

  private normalizeRole(role: string | number): string {
    // Validate input - null and undefined should throw
    if (role === null) {
      throw new Error('Role cannot be null');
    }
    if (role === undefined) {
      throw new Error('Role cannot be undefined');
    }

    // Handle numeric role values (enum numbers from API)
    if (typeof role === 'number' || !isNaN(Number(role))) {
      const roleMap: { [key: number]: string } = {
        0: 'Admin',
        1: 'Owner',
        // 2: 'Manager', // Planned feature - commented out for now
        2: 'Consignor',
        3: 'Customer'
      };
      return roleMap[Number(role)] || 'Owner';
    }

    // Return string role as-is
    return String(role);
  }

  private redirectConsignorBasedOnAgreement(): void {
    console.log('=== LOGIN AGREEMENT CHECK ===');

    this.consignorService.getAgreementStatus().subscribe({
      next: (agreementStatus) => {
        console.log('Agreement status for redirect decision:', agreementStatus);

        const isRequired = agreementStatus?.requiresAgreement;
        const status = agreementStatus?.agreementStatus;
        const hasCompleted = ['uploaded', 'approved', 'completed'].includes(status);

        console.log('Redirect decision factors:', {
          isRequired,
          status,
          hasCompleted,
          shouldGoToDashboard: !isRequired || hasCompleted
        });

        if (!isRequired || hasCompleted) {
          console.log('🚀 Consignor redirect: Going to DASHBOARD (agreement not required or completed)');
          this.router.navigate(['/consignor/dashboard']).then(
            success => console.log('Consignor dashboard navigation success:', success),
            error => console.error('Consignor dashboard navigation failed:', error)
          );
        } else {
          console.log('📝 Consignor redirect: Going to AGREEMENT PAGE (agreement required and not completed)');
          this.router.navigate(['/consignor/agreement']).then(
            success => console.log('Consignor agreement navigation success:', success),
            error => console.error('Consignor agreement navigation failed:', error)
          );
        }
      },
      error: (error) => {
        console.error('Error checking agreement status, defaulting to agreement page:', error);
        // On error, default to agreement page (safer)
        this.router.navigate(['/consignor/agreement']).then(
          success => console.log('Consignor agreement navigation (error fallback) success:', success),
          error => console.error('Consignor agreement navigation (error fallback) failed:', error)
        );
      }
    });
  }
}