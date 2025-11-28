import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="signup-page">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <h1 class="logo">Consignment Genie</h1>
          <nav class="nav">
            <a routerLink="/login" class="nav-link">Sign In</a>
          </nav>
        </div>
      </header>

      <!-- Signup Form -->
      <main class="signup-main">
        <div class="container">
          <div class="signup-card">
            <div class="signup-header">
              <h2>Create Your Consignment Shop</h2>
              <p>Get started with your new shop in just a few minutes</p>
            </div>

            <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="signup-form">
              <!-- Shop Information Section -->
              <div class="form-section">
                <h3>Shop Information</h3>

                <div class="form-group">
                  <label for="shopName">Business/Shop Name *</label>
                  <input
                    type="text"
                    id="shopName"
                    formControlName="shopName"
                    [class.error]="signupForm.get('shopName')?.touched && signupForm.get('shopName')?.invalid"
                    placeholder="Enter your business or shop name"
                  />
                  <div class="error-message" *ngIf="signupForm.get('shopName')?.touched && signupForm.get('shopName')?.invalid">
                    Business/Shop name is required
                  </div>
                </div>

                <div class="form-group">
                  <label for="subdomain">Shop URL *</label>
                  <div class="subdomain-input" [class.error]="signupForm.get('subdomain')?.touched && signupForm.get('subdomain')?.invalid">
                    <input
                      type="text"
                      id="subdomain"
                      formControlName="subdomain"
                      placeholder="yourshop"
                    />
                    <span class="subdomain-suffix">.consignmentgenie.com</span>
                  </div>
                  <small class="form-hint">This will be your shop's web address</small>
                  <div class="error-message" *ngIf="signupForm.get('subdomain')?.touched && signupForm.get('subdomain')?.invalid">
                    <span *ngIf="signupForm.get('subdomain')?.errors?.['required']">Shop URL is required</span>
                    <span *ngIf="signupForm.get('subdomain')?.errors?.['pattern']">Only letters, numbers, and dashes allowed</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="businessAddress">Business Address *</label>
                  <input
                    type="text"
                    id="businessAddress"
                    formControlName="businessAddress"
                    [class.error]="signupForm.get('businessAddress')?.touched && signupForm.get('businessAddress')?.invalid"
                    placeholder="123 Main Street, City, State 12345"
                  />
                  <div class="error-message" *ngIf="signupForm.get('businessAddress')?.touched && signupForm.get('businessAddress')?.invalid">
                    Business address is required
                  </div>
                </div>

                <div class="form-group">
                  <label for="poBox">PO Box (Optional)</label>
                  <input
                    type="text"
                    id="poBox"
                    formControlName="poBox"
                    placeholder="PO Box 123"
                  />
                </div>
              </div>

              <!-- Contact Information Section -->
              <div class="form-section">
                <h3>Contact Information</h3>

                <div class="form-group">
                  <label for="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    formControlName="name"
                    [class.error]="signupForm.get('name')?.touched && signupForm.get('name')?.invalid"
                    placeholder="Enter your full name"
                  />
                  <div class="error-message" *ngIf="signupForm.get('name')?.touched && signupForm.get('name')?.invalid">
                    Full name is required
                  </div>
                </div>

                <div class="form-group">
                  <label for="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    [class.error]="signupForm.get('email')?.touched && signupForm.get('email')?.invalid"
                    placeholder="Enter your email address"
                    autocomplete="username"
                  />
                  <div class="error-message" *ngIf="signupForm.get('email')?.touched && signupForm.get('email')?.invalid">
                    <span *ngIf="signupForm.get('email')?.errors?.['required']">Email address is required</span>
                    <span *ngIf="signupForm.get('email')?.errors?.['email']">Please enter a valid email address</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    formControlName="phone"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div class="form-group">
                  <label for="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    formControlName="password"
                    [class.error]="signupForm.get('password')?.touched && signupForm.get('password')?.invalid"
                    placeholder="Create a strong password"
                    autocomplete="new-password"
                  />
                  <div class="error-message" *ngIf="signupForm.get('password')?.touched && signupForm.get('password')?.invalid">
                    Password must be at least 8 characters long
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="form-actions">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="signupForm.invalid || isSubmitting()"
                >
                  {{ isSubmitting() ? 'Creating Your Shop...' : 'Create My Shop' }}
                </button>

                <p class="login-link">
                  Already have an account? <a routerLink="/login">Sign in here</a>
                </p>
              </div>

              <!-- Error Display -->
              <div class="api-error" *ngIf="errorMessage()">
                {{ errorMessage() }}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .signup-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .header {
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1rem 0;
    }

    .header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      color: #047857;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
    }

    .nav-link {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-link:hover {
      color: #047857;
    }

    .signup-main {
      padding: 2rem 0 4rem;
    }

    .signup-card {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      padding: 2.5rem;
    }

    .signup-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .signup-header h2 {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .signup-header p {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .signup-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section h3 {
      color: #047857;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.95rem;
    }

    .form-group input,
    .form-group textarea {
      padding: 0.875rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
      background: white;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    .form-group input.error,
    .form-group textarea.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .subdomain-input {
      display: flex;
      align-items: center;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .subdomain-input:focus-within {
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    .subdomain-input.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .subdomain-input input {
      border: none !important;
      box-shadow: none !important;
      flex: 1;
      padding: 0.875rem;
      font-size: 1rem;
    }

    .subdomain-suffix {
      background: #f8fafc;
      padding: 0.875rem;
      color: #6b7280;
      font-size: 1rem;
      border-left: 1px solid #e5e7eb;
    }

    .form-hint {
      color: #6b7280;
      font-size: 0.825rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.125rem;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      min-width: 200px;
    }

    .btn-primary {
      background: #047857;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #065f46;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(4, 120, 87, 0.2);
    }

    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .login-link {
      color: #6b7280;
      margin: 0;
      text-align: center;
    }

    .login-link a {
      color: #047857;
      text-decoration: none;
      font-weight: 500;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    .api-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .signup-main {
        padding: 1rem 0 2rem;
      }

      .signup-card {
        padding: 1.5rem;
        margin: 0 0.5rem;
      }

      .signup-header h2 {
        font-size: 1.5rem;
      }

      .btn {
        padding: 0.875rem 2rem;
        font-size: 1rem;
        min-width: 180px;
      }
    }
  `]
})
export class OwnerSignupComponent {
  signupForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone: [''],
      shopName: ['', [Validators.required, Validators.minLength(2)]],
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      businessAddress: ['', [Validators.required, Validators.minLength(10)]],
      poBox: ['']
    });
  }

  onSubmit() {
    if (this.signupForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');

      const formData = {
        fullName: this.signupForm.value.name,
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
        phone: this.signupForm.value.phone || undefined,
        shopName: this.signupForm.value.shopName,
        subdomain: this.signupForm.value.subdomain,
        address: this.signupForm.value.businessAddress + (this.signupForm.value.poBox ? `\nPO Box: ${this.signupForm.value.poBox}` : '')
      };

      this.authService.registerOwner(formData).subscribe({
        next: (response) => {
          console.log('Registration response:', response);
          if (response.success) {
            console.log('User logged in with role:', response.role);
            this.router.navigate(['/owner/dashboard']);
          } else {
            this.errorMessage.set(response.message || 'Registration failed. Please try again.');
            this.isSubmitting.set(false);
          }
        },
        error: (error) => {
          console.error('Registration failed:', error);
          this.errorMessage.set(error.message || 'Registration failed. Please try again.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }
}