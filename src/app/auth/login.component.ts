import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../shared/services/loading.service';
import { StorageService } from '../shared/services/storage.service';
import { LoginRequest } from '../models/auth.model';

// ============================================================================
// Types
// ============================================================================
interface LoginData {
  token: string;
  userId: string;
  email: string;
  role: number | string;
  organizationId: string;
  organizationName: string;
  expiresAt: string;
  approvalStatus?: number;
}

interface HttpError {
  status?: number;
  message?: string;
}

// ============================================================================
// Constants
// ============================================================================
const LOADING_KEY = 'auth-login';
const DEFAULT_TEST_PASSWORD = 'password123';
const TOKEN_EXPIRY_HOURS = 24;
const SYSTEM_ADMIN_EMAIL = 'admin@microsaasbuilders.com';

const ROLE_MAP: Record<number, string> = {
  0: 'Admin',
  1: 'Owner',
  2: 'Consignor',
  3: 'Customer'
};

const ROUTES = {
  ADMIN_DASHBOARD: '/admin/dashboard',
  OWNER_DASHBOARD: '/owner/dashboard',
  CUSTOMER_DASHBOARD: '/customer/dashboard'
} as const;

const APPROVAL_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
} as const;

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  NETWORK_ERROR: 'Unable to connect to server. Please check your connection.',
  GENERIC_ERROR: 'Login failed. Please try again later.',
  PENDING_APPROVAL: 'Your account is pending admin approval. You will receive an email once approved.',
  REJECTED: 'Your account has been rejected. Please contact support for more information.'
} as const;

// ============================================================================
// Component
// ============================================================================
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService);
  private readonly storageService = inject(StorageService);

  // Form state
  credentials = {
    email: '',
    password: ''
  };

  // UI state
  showPassword = signal(false);
  errorMessage = signal('');

  // ============================================================================
  // Public Methods
  // ============================================================================

  isAuthLoading(): boolean {
    return this.loadingService.isLoading(LOADING_KEY);
  }

  togglePassword(): void {
    this.showPassword.update(show => !show);
  }

  useTestAccount(email: string): void {
    this.credentials.email = email;
    this.credentials.password = DEFAULT_TEST_PASSWORD;
    this.errorMessage.set('');
  }

  async onSubmit(): Promise<void> {
    if (!this.isValidCredentials()) {
      return;
    }

    this.loadingService.start(LOADING_KEY);
    this.errorMessage.set('');

    try {
      const loginRequest: LoginRequest = {
        email: this.credentials.email,
        password: this.credentials.password
      };

      const response = await firstValueFrom(this.authService.login(loginRequest));

      if (response?.data) {
        this.handleSuccessfulLogin(response.data);
      }
    } catch (error: unknown) {
      this.handleLoginError(error as HttpError);
    } finally {
      this.loadingService.stop(LOADING_KEY);
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private isValidCredentials(): boolean {
    return Boolean(this.credentials.email && this.credentials.password);
  }

  private handleSuccessfulLogin(loginData: LoginData): void {
    // Check approval status for owners before proceeding
    if (!this.isApproved(loginData)) {
      return;
    }

    // Store authentication data
    this.storeAuthData(loginData);

    // Update AuthService state
    this.authService.loadStoredAuth();

    // Role-based redirection
    this.redirectBasedOnRole(loginData.role.toString(), loginData.email);
  }

  private isApproved(loginData: LoginData): boolean {
    const role = this.normalizeRole(loginData.role);
    
    // Only owners have approval workflow
    if (role !== 'Owner' || loginData.approvalStatus === undefined) {
      return true;
    }

    if (loginData.approvalStatus === APPROVAL_STATUS.PENDING) {
      this.errorMessage.set(ERROR_MESSAGES.PENDING_APPROVAL);
      return false;
    }

    if (loginData.approvalStatus === APPROVAL_STATUS.REJECTED) {
      this.errorMessage.set(ERROR_MESSAGES.REJECTED);
      return false;
    }

    return true;
  }

  private storeAuthData(loginData: LoginData): void {
    // Clear any old auth data first
    this.storageService.clearAuthData();

    // Calculate expiry time
    const expiryTime = loginData.expiresAt ||
      new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    // Store new auth data
    this.storageService.setAuthToken(loginData.token);
    this.storageService.setTokenExpiry(expiryTime);
    this.storageService.setUserData({
      userId: loginData.userId,
      email: loginData.email,
      role: loginData.role,
      organizationId: loginData.organizationId,
      organizationName: loginData.organizationName,
      businessName: loginData.organizationName
    });
  }

  private handleLoginError(error: HttpError): void {
    if (error.status === 401) {
      this.errorMessage.set(ERROR_MESSAGES.INVALID_CREDENTIALS);
    } else if (error.status === 0) {
      this.errorMessage.set(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      this.errorMessage.set(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  private redirectBasedOnRole(role: string, email: string): void {
    const normalizedRole = this.normalizeRole(role);

    // Special case: System admin email always gets admin dashboard
    if (email === SYSTEM_ADMIN_EMAIL) {
      this.router.navigate([ROUTES.ADMIN_DASHBOARD]);
      return;
    }

    switch (normalizedRole) {
      case 'Admin':
        this.router.navigate([ROUTES.ADMIN_DASHBOARD]);
        break;
      case 'Owner':
        this.router.navigate([ROUTES.OWNER_DASHBOARD]);
        break;
      case 'Consignor':
      case 'Customer':
        this.router.navigate([ROUTES.CUSTOMER_DASHBOARD]);
        break;
      default:
        this.router.navigate([ROUTES.OWNER_DASHBOARD]);
    }
  }

  private normalizeRole(role: string | number): string {
    if (typeof role === 'number' || !isNaN(Number(role))) {
      return ROLE_MAP[Number(role)] || 'Owner';
    }
    return String(role);
  }
}
