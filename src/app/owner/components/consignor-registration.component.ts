import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConsignorService, ConsignorRegistrationRequest } from '../../services/consignor.service';

export interface ProviderRegistrationData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-consignor-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consignor-registration.component.html',
  styles: [`
    .registration-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 2rem 1rem;
    }

    .registration-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      width: 100%;
      padding: 2rem;
    }

    .registration-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .registration-header h1 {
      color: #212529;
      margin-bottom: 1rem;
    }

    .shop-info {
      color: #6c757d;
      font-size: 1.1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #212529;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    .form-control:focus {
      border-color: #007bff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .form-control[readonly] {
      background-color: #e9ecef;
      opacity: 1;
    }

    .form-actions {
      margin-top: 2rem;
      text-align: center;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.15s ease-in-out;
      min-width: 200px;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .success-state, .error-state {
      text-align: center;
      padding: 2rem;
    }

    .success-icon {
      font-size: 4rem;
      color: #28a745;
      margin-bottom: 1rem;
    }

    .error-icon {
      font-size: 4rem;
      color: #dc3545;
      margin-bottom: 1rem;
    }

    .success-state h2, .error-state h2 {
      color: #212529;
      margin-bottom: 1rem;
    }

    .success-state p, .error-state p {
      color: #6c757d;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
  `]
})
export class ConsignorRegistrationComponent implements OnInit {
  registration: ProviderRegistrationData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  };

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  isInvalidToken = signal(false);
  errorMessage = signal('');
  shopName = signal('');
  invitationToken = '';

  constructor(
    private ConsignorService: ConsignorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get invitation token from URL
    this.invitationToken = this.route.snapshot.queryParams['token'] || '';

    if (!this.invitationToken) {
      this.isInvalidToken.set(true);
      return;
    }

    // Validate token and get invitation details
    this.validateInvitation();
  }

  passwordMismatch(): boolean {
    return this.registration.password !== this.registration.confirmPassword &&
           this.registration.confirmPassword.length > 0;
  }

  validateInvitation(): void {
    this.ConsignorService.validateInvitation(this.invitationToken).subscribe({
      next: (response) => {
        if (response.isValid) {
          this.registration.name = response.invitedName || '';
          this.registration.email = response.invitedEmail || '';
          this.shopName.set(response.shopName || '');
        } else {
          this.isInvalidToken.set(true);
          this.errorMessage.set(response.message || 'Invalid invitation');
        }
      },
      error: (error) => {
        console.error('Error validating invitation:', error);
        this.isInvalidToken.set(true);
        this.errorMessage.set('Unable to validate invitation');
      }
    });
  }

  onSubmit(): void {
    if (this.isSubmitting() || this.passwordMismatch()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const nameParts = this.registration.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const request: ConsignorRegistrationRequest = {
      invitationToken: this.invitationToken,
      firstName: firstName,
      lastName: lastName,
      email: this.registration.email,
      password: this.registration.password,
      phone: this.registration.phone,
      address: this.registration.address
      // Note: This component doesn't collect city/state/zip yet
    };

    this.ConsignorService.registerFromInvitation(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.isSubmitted.set(true);
        } else {
          this.errorMessage.set(response.message);
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
    this.router.navigate(['/auth/login']);
  }
}