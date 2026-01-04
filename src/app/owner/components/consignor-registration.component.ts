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