import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConsignorService, ConsignorRegistrationRequest } from '../../services/consignor.service';

interface RegistrationData {
  invitationToken: string;
  authMethod: string;
  credentials: {
    email: string;
    password: string;
    passwordConfirm: string;
  };
  invitationDetails: {
    invitedName?: string;
    invitedEmail?: string;
    shopName?: string;
  };
}

interface ProviderDetails {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

@Component({
  selector: 'app-consignor-registration-step2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consignor-registration-step2.component.html',
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
      max-width: 500px;
      width: 100%;
      padding: 2.5rem;
    }

    .registration-header {
      margin-bottom: 2rem;
    }

    .back-button {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 1rem;
      padding: 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.2s ease;
    }

    .back-button:hover {
      color: #2563eb;
    }

    .registration-header h1 {
      color: #1f2937;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .shop-info {
      color: #6b7280;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .step-info {
      color: #9ca3af;
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .form-control {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .form-hint {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .registration-summary {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }

    .registration-summary h3 {
      color: #1f2937;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .summary-item:last-child {
      margin-bottom: 0;
    }

    .summary-label {
      color: #6b7280;
      font-weight: 500;
    }

    .summary-value {
      color: #1f2937;
      font-weight: 600;
    }

    .form-actions {
      margin-top: 2rem;
    }

    .btn-primary, .btn-secondary {
      width: 100%;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
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

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .success-state, .error-state {
      text-align: center;
      padding: 2rem 0;
    }

    .success-icon, .error-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }

    .error-icon {
      color: #ef4444;
    }

    .success-state h2, .error-state h2 {
      color: #1f2937;
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .success-state p, .error-state p {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .registration-card {
        padding: 2rem;
        margin: 1rem;
      }

      .registration-header h1 {
        font-size: 1.75rem;
      }

      .summary-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }
  `]
})
export class ConsignorRegistrationStep2Component implements OnInit {
  registrationData = signal<RegistrationData | null>(null);
  details: ProviderDetails = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  };

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  isInvalidRegistration = signal(false);
  errorMessage = signal('');
  shopName = signal('');

  constructor(
    private consignorService: ConsignorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if we have registration data from step 1
    const storedData = sessionStorage.getItem('provider_registration_data');

    if (!storedData) {
      this.isInvalidRegistration.set(true);
      return;
    }

    try {
      const parsedData: RegistrationData = JSON.parse(storedData);
      this.registrationData.set(parsedData);
      this.shopName.set(parsedData.invitationDetails.shopName || '');

      // Pre-fill name if available from invitation
      if (parsedData.invitationDetails.invitedName) {
        const nameParts = parsedData.invitationDetails.invitedName.trim().split(' ');
        this.details.firstName = nameParts[0] || '';
        this.details.lastName = nameParts.slice(1).join(' ') || '';
      }
    } catch (error) {
      console.error('Error parsing registration data:', error);
      this.isInvalidRegistration.set(true);
    }
  }

  goBack(): void {
    this.router.navigate(['/register/consignor/invitation'], {
      queryParams: { token: this.registrationData()?.invitationToken }
    });
  }

  onSubmit(): void {
    if (this.isSubmitting() || !this.registrationData()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const regData = this.registrationData()!;

    const request: ConsignorRegistrationRequest = {
      invitationToken: regData.invitationToken,
      fullName: `${this.details.firstName} ${this.details.lastName}`.trim(),
      email: regData.credentials.email,
      password: regData.credentials.password,
      phone: this.details.phone
      // Note: Address fields not yet wired up to API
    };

    this.consignorService.registerFromInvitation(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.isSubmitted.set(true);
          // Clear session storage
          sessionStorage.removeItem('provider_registration_data');
        } else {
          this.errorMessage.set(response.message || 'Registration failed');
        }
      },
      error: (error) => {
        console.error('Error during registration:', error);
        const errorMsg = error.error?.message || 'Registration failed. Please try again.';
        this.errorMessage.set(errorMsg);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}