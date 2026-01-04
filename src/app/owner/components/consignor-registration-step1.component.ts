import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ConsignorService } from '../../services/consignor.service';
import { AuthService } from '../../services/auth.service';
import { AuthMethodSelectorComponent, ProviderAuthEvent, CredentialsEvent } from '../../shared/auth/components/auth-method-selector/auth-method-selector.component';

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
  templateUrl: './consignor-registration-step1.component.html',
})
export class ConsignorRegistrationStep1Component implements OnInit {
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
    private consignorService: ConsignorService,
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
    this.consignorService.validateInvitation(this.invitationToken).subscribe({
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
    this.selectedProvider = event.provider;

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
    return !!(this.credentials?.email &&
              this.credentials?.password &&
              this.credentials?.passwordConfirm &&
              this.credentials.password === this.credentials.passwordConfirm);
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