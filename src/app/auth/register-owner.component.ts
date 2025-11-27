import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-owner',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="registration-page">
      <div class="container">
        <div class="registration-card">
          <div class="header">
            <a routerLink="/register" class="back-link">← Back</a>
            <h1>Create Your Shop</h1>
            <p class="subtitle">Get started with just the essentials. You can add more details later.</p>
          </div>

          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="fullName">Full Name *</label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                [class.error]="signupForm.get('fullName')?.invalid && signupForm.get('fullName')?.touched"
                placeholder="John Smith">
              <div class="error-message"
                   *ngIf="signupForm.get('fullName')?.invalid && signupForm.get('fullName')?.touched">
                Full name is required
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                [class.error]="signupForm.get('email')?.invalid && signupForm.get('email')?.touched"
                placeholder="john@myshop.com">
              <div class="error-message"
                   *ngIf="signupForm.get('email')?.invalid && signupForm.get('email')?.touched">
                Valid email is required
              </div>
            </div>

            <div class="form-group">
              <label for="shopName">Business/Shop Name *</label>
              <input
                id="shopName"
                type="text"
                formControlName="shopName"
                [class.error]="signupForm.get('shopName')?.invalid && signupForm.get('shopName')?.touched"
                placeholder="Main Street Consignment">
              <div class="error-message"
                   *ngIf="signupForm.get('shopName')?.invalid && signupForm.get('shopName')?.touched">
                Business name is required
              </div>
            </div>

            <div class="form-group">
              <label for="subdomain">Shop URL *</label>
              <div class="subdomain-input-wrapper">
                <input
                  id="subdomain"
                  type="text"
                  formControlName="subdomain"
                  [class.error]="signupForm.get('subdomain')?.invalid && signupForm.get('subdomain')?.touched"
                  placeholder="myshop">
                <span class="subdomain-suffix">.consignmentgenie.com</span>
              </div>
              <div class="form-hint">This will be your shop's web address</div>
              <div class="error-message"
                   *ngIf="signupForm.get('subdomain')?.invalid && signupForm.get('subdomain')?.touched">
                <span *ngIf="signupForm.get('subdomain')?.errors?.['required']">Shop URL is required</span>
                <span *ngIf="signupForm.get('subdomain')?.errors?.['pattern']">Only letters, numbers, and dashes allowed</span>
              </div>
            </div>

            <div class="form-group">
              <label for="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                placeholder="(555) 123-4567">
              <div class="form-hint">Optional - for customer contact and support</div>
            </div>

            <div class="form-group">
              <label for="password">Password *</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                [class.error]="signupForm.get('password')?.invalid && signupForm.get('password')?.touched"
                placeholder="••••••••••••">
              <div class="form-hint">At least 8 characters</div>
              <div class="error-message"
                   *ngIf="signupForm.get('password')?.invalid && signupForm.get('password')?.touched">
                Password must be at least 8 characters
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                [class.error]="signupForm.get('confirmPassword')?.invalid && signupForm.get('confirmPassword')?.touched"
                placeholder="••••••••••••">
              <div class="error-message"
                   *ngIf="signupForm.get('confirmPassword')?.invalid && signupForm.get('confirmPassword')?.touched">
                Passwords must match
              </div>
            </div>

            <div class="info-box">
              <h4>What happens next?</h4>
              <ul>
                <li>Your shop will be created immediately</li>
                <li>You can add address, commission rates, and policies in settings</li>
                <li>Start adding providers and inventory right away</li>
              </ul>
            </div>

            <button
              type="submit"
              class="submit-btn"
              [disabled]="signupForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Creating Shop...' : 'Create Shop' }}
            </button>
          </form>

          <!-- Error Display -->
          <div class="alert error" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .registration-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .container {
      width: 100%;
      max-width: 500px;
    }

    .registration-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
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

    .subtitle {
      color: #6b7280;
      font-size: 1rem;
      margin: 0 0 2rem 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      color: #374151;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }

    input:focus {
      outline: none;
      border-color: #047857;
    }

    input.error {
      border-color: #ef4444;
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
    }

    .subdomain-input-wrapper input {
      border: none !important;
      flex: 1;
      padding: 0.75rem;
      font-size: 1rem;
    }

    .subdomain-suffix {
      background: #f9fafb;
      padding: 0.75rem;
      color: #6b7280;
      border-left: 1px solid #e5e7eb;
      font-size: 1rem;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .info-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }

    .info-box h4 {
      color: #047857;
      font-size: 1rem;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }

    .info-box ul {
      margin: 0;
      padding-left: 1.5rem;
      color: #374151;
    }

    .info-box li {
      margin-bottom: 0.5rem;
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
      transition: background-color 0.2s;
      margin-top: 1rem;
    }

    .submit-btn:hover:not(:disabled) {
      background: #059669;
    }

    .submit-btn:disabled {
      background: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;
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

    @media (max-width: 768px) {
      .registration-card {
        padding: 2rem;
      }

      h1 {
        font-size: 1.75rem;
      }
    }
  `]
})
export class RegisterOwnerComponent {
  signupForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      shopName: ['', [Validators.required]],
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.markAllFieldsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.signupForm.value;
    const request = {
      fullName: formValue.fullName,
      email: formValue.email,
      phone: formValue.phone || '',
      password: formValue.password,
      shopName: formValue.shopName,
      subdomain: formValue.subdomain,
      address: ''
    };

    this.authService.registerOwner(request).subscribe({
      next: (result) => {
        if (result.success) {
          this.router.navigate(['/register/success'], {
            queryParams: {
              type: 'owner',
              shopName: formValue.shopName,
              email: formValue.email
            }
          });
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
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }
}