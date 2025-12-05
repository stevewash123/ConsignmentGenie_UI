import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ConsignorService } from '../services/consignor.service';
import { AuthService } from '../services/auth.service';
import { AuthMethodSelectorComponent, ProviderAuthEvent, CredentialsEvent } from '../shared/auth/components/auth-method-selector/auth-method-selector.component';

interface InvitationDetails {
  isValid: boolean;
  invitedName?: string;
  invitedEmail?: string;
  shopName?: string;
  message?: string;
}

@Component({
  selector: 'app-consignor-registration-step1',
  standalone: true,
  imports: [CommonModule, AuthMethodSelectorComponent],
  template: `
    <div class="registration-container">
      <div class="registration-card">
        <!-- Header -->
        <div class="registration-header">
          <h1>Join {{ shopName() }}</h1>
          <p class="shop-info" *ngIf="shopName()">
            You've been invited to become a consignor at <strong>{{ shopName() }}</strong>
          </p>
          <p class="step-info">Step 1 of 2: Choose how you'd like to sign in</p>
        </div>

        <!-- Auth Method Selector -->
        <div class="auth-section" *ngIf="!isInvalidToken() && invitationDetails()">
          <app-auth-method-selector
            [enabledProviders]="['google', 'facebook']"
            [showEmailPassword]="true"
            [isLoading]="isProcessing"
            (onProviderAuth)="handleProviderAuth($event)"
            (onCredentials)="handleCredentials($event)">
          </app-auth-method-selector>

          <div class="auth-actions" *ngIf="credentials">
            <button
              class="btn-primary"
              (click)="proceedToStep2()"
              [disabled]="isProcessing() || !hasValidCredentials()">
              {{ isProcessing() ? 'Verifying...' : 'Continue' }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isValidating()">
          <div class="loading-spinner"></div>
          <p>Verifying invitation...</p>
        </div>

        <!-- Invalid/Expired Token State -->
        <div class="error-state" *ngIf="isInvalidToken()">
          <div class="error-icon">⚠️</div>
          <h2>Invalid or Expired Invitation</h2>
          <p>
            This invitation link is either invalid or has expired.
            Please contact the shop owner for a new invitation.
          </p>
        </div>

        <!-- Error Messages -->
        <div class="error-message" *ngIf="errorMessage()">
          {{ errorMessage() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .registration-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .registration-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      max-width: 450px;
      width: 100%;
      padding: 2.5rem;
    }

    .registration-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .registration-header h1 {
      color: #1f2937;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .shop-info {
      color: #6b7280;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .step-info {
      color: #9ca3af;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .auth-section {
      margin-bottom: 1rem;
    }

    .auth-actions {
      margin-top: 1.5rem;
    }

    .btn-primary {
      width: 100%;
      padding: 0.875rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 2rem 0;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #6b7280;
      margin: 0;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-state h2 {
      color: #1f2937;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .error-state p {
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      border: 1px solid #fecaca;
      font-weight: 500;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .registration-card {
        padding: 2rem;
        margin: 1rem;
      }

      .registration-header h1 {
        font-size: 1.75rem;
      }
    }
  `]
})
export class ProviderRegistrationStep1Component implements OnInit {
  invitationDetails = signal<InvitationDetails | null>(null);
  isValidating = signal(true);
  isInvalidToken = signal(false);
  isProcessing = signal(false);
  errorMessage = signal('');
  shopName = signal('');
  invitationToken = '';

  credentials: CredentialsEvent | null = null;
  selectedProvider: string | null = null;

  constructor(
    private ConsignorService: ConsignorService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get invitation token from URL
    this.invitationToken = this.route.snapshot.queryParams['token'] || '';

    if (!this.invitationToken) {
      this.isInvalidToken.set(true);
      this.isValidating.set(false);
      return;
    }

    // Validate token and get invitation details
    this.validateInvitation();
  }

  validateInvitation(): void {
    this.ConsignorService.validateInvitation(this.invitationToken).subscribe({
      next: (response) => {
        this.isValidating.set(false);

        if (response.isValid) {
          this.invitationDetails.set(response);
          this.shopName.set(response.shopName || '');
        } else {
          this.isInvalidToken.set(true);
          this.errorMessage.set(response.message || 'Invalid invitation');
        }
      },
      error: (error) => {
        console.error('Error validating invitation:', error);
        this.isValidating.set(false);
        this.isInvalidToken.set(true);
        this.errorMessage.set('Unable to validate invitation');
      }
    });
  }

  handleProviderAuth(event: ProviderAuthEvent): void {
    this.isProcessing.set(true);
    this.selectedProvider = event.consignor;

    // TODO: Implement OAuth flow
    setTimeout(() => {
      this.isProcessing.set(false);
      this.errorMessage.set('OAuth sign-in coming soon! Please use email/password for now.');
    }, 1000);
  }

  handleCredentials(event: CredentialsEvent): void {
    this.credentials = event;
    this.selectedProvider = null;
    this.errorMessage.set('');
  }

  hasValidCredentials(): boolean {
    return !!(this.credentials?.email && this.credentials?.password);
  }

  proceedToStep2(): void {
    if (!this.hasValidCredentials()) return;

    this.isProcessing.set(true);

    // Store auth data and invitation details for step 2
    const registrationData = {
      invitationToken: this.invitationToken,
      authMethod: 'email_password',
      credentials: this.credentials,
      invitationDetails: this.invitationDetails()
    };

    sessionStorage.setItem('provider_registration_data', JSON.stringify(registrationData));

    // Navigate to step 2
    setTimeout(() => {
      this.isProcessing.set(false);
      this.router.navigate(['/register/consignor/details'], {
        queryParams: { token: this.invitationToken }
      });
    }, 500);
  }
}