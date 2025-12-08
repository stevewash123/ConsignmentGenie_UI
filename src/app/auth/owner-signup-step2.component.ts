import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-owner-signup-step2',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './owner-signup-step2.component.html',
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .container {
      width: 100%;
      max-width: 45%;
      min-width: 600px;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .header {
      margin-bottom: 2rem;
    }

    .back-link {
      color: #047857;
      text-decoration: none;
      font-weight: 600;
      margin-bottom: 1rem;
      display: inline-block;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    h1 {
      color: #047857;
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .email-display {
      color: #6b7280;
      font-size: 0.95rem;
      margin: 0.75rem 0 1rem 0;
      font-weight: 500;
    }


    .form-section {
      margin-bottom: 2rem;
    }

    .form-section h3 {
      color: #047857;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1.25rem 0;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-row {
      display: grid;
      gap: 1rem;
    }

    /* Business Information section - 2 column layout */
    .form-section .form-row {
      grid-template-columns: 1fr 1fr;
    }

    /* Business Address section - 3 column layout for city/state/zip */
    .form-section:last-of-type .form-row {
      grid-template-columns: 2fr 1fr 1fr;
    }

    label {
      display: block;
      color: #374151;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    input, select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    input.error, select.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    select {
      background: white;
      cursor: pointer;
    }

    .form-hint {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .subdomain-input-wrapper {
      display: flex;
      align-items: center;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      transition: border-color 0.2s;
    }

    .subdomain-input-wrapper:focus-within {
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    .subdomain-input-wrapper input {
      border: none !important;
      box-shadow: none !important;
      flex: 1;
      min-width: 0;
      padding: 0.75rem;
      font-size: 1rem;
    }

    .subdomain-suffix {
      background: #f9fafb;
      padding: 0.75rem;
      color: #6b7280;
      border-left: 1px solid #e5e7eb;
      font-size: 0.875rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .validation-message {
      font-size: 0.875rem;
      margin-top: 0.25rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .validation-message.success {
      color: #10b981;
    }

    .validation-message.error {
      color: #ef4444;
    }

    .validation-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #6b7280;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
    }


    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: #047857;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 1rem;
    }

    .submit-btn:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(4, 120, 87, 0.2);
    }

    .submit-btn:disabled {
      background: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
    }

    .alert.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .readonly-input {
      background-color: #f9fafb !important;
      color: #6b7280;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .container {
        max-width: 90%;
        min-width: unset;
      }

      .profile-card {
        padding: 2rem;
      }

      h1 {
        font-size: 1.75rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OwnerSignupStep2Component implements OnInit {
  profileForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  userEmail = '';
  subdomainValidationMessage = signal('');
  isValidatingSubdomain = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      shopName: ['', [Validators.required]],
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      phone: [''],
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]]
    });
  }

  ngOnInit() {
    // Scroll to top of page
    window.scrollTo(0, 0);

    // Check if user came from step 1
    const authDataString = sessionStorage.getItem('ownerAuthData');
    if (!authDataString) {
      // Redirect back to step 1 if no auth data
      this.router.navigate(['/signup/owner']);
    } else {
      // Set user email from session data
      const authData = JSON.parse(authDataString);
      this.userEmail = authData.email;
    }

    // Setup real-time subdomain validation
    this.setupSubdomainValidation();
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.markAllFieldsTouched();
      return;
    }

    // Get auth data from step 1
    const authDataString = sessionStorage.getItem('ownerAuthData');
    if (!authDataString) {
      this.errorMessage.set('Session expired. Please start over.');
      this.router.navigate(['/signup/owner']);
      return;
    }

    const authData = JSON.parse(authDataString);
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.profileForm.value;

    // Combine auth data from step 1 with profile data from step 2
    const request = {
      fullName: formValue.fullName,
      email: authData.email,
      phone: formValue.phone || '',
      password: authData.password,
      shopName: formValue.shopName,
      subdomain: formValue.subdomain,
      // Combine address fields into single address string for now
      // (API may need to be updated to accept separate fields)
      address: `${formValue.streetAddress}, ${formValue.city}, ${formValue.state} ${formValue.zipCode}`,
      // Send separate address fields if API supports them
      streetAddress: formValue.streetAddress,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode
    };

    this.authService.registerOwnerFrictionless(request).subscribe({
      next: (result) => {
        console.log('Owner registration response:', result);
        if (result.success) {
          console.log('User logged in with role:', result.role);
          // Clear the temporary auth data
          sessionStorage.removeItem('ownerAuthData');

          // If we have a token, user was auto-logged in - redirect to dashboard
          if (result.token) {
            console.log('Auto-login successful, redirecting to owner dashboard');
            this.router.navigate(['/owner/dashboard']);
          } else {
            // No token means approval required - show success page
            this.router.navigate(['/register/success'], {
              queryParams: {
                type: 'owner',
                shopName: formValue.shopName,
                email: authData.email
              }
            });
          }
        } else {
          this.errorMessage.set(result.message || 'Registration failed');
        }
        this.isSubmitting.set(false);
      },
      error: (error: any) => {
        this.errorMessage.set(error.message || 'An unexpected error occurred');
        this.isSubmitting.set(false);
      }
    });
  }

  private markAllFieldsTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  private setupSubdomainValidation() {
    const subdomainControl = this.profileForm.get('subdomain');
    if (subdomainControl) {
      subdomainControl.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          filter(value => value && value.length >= 3)
        )
        .subscribe(subdomain => {
          this.validateSubdomain(subdomain);
        });
    }
  }

  private validateSubdomain(subdomain: string) {
    this.isValidatingSubdomain.set(true);
    this.subdomainValidationMessage.set('');

    this.authService.validateSubdomain(subdomain).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data.isAvailable) {
            this.subdomainValidationMessage.set('✓ Subdomain is available');
          } else {
            this.subdomainValidationMessage.set('✗ This subdomain is already taken');
          }
        }
        this.isValidatingSubdomain.set(false);
      },
      error: (error) => {
        console.error('Error validating subdomain:', error);
        this.subdomainValidationMessage.set('Error checking subdomain availability');
        this.isValidatingSubdomain.set(false);
      }
    });
  }
}