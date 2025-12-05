import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ConsignorService } from '../services/consignor.service';

@Component({
  selector: 'app-consignor-signup-step1',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="container">
        <div class="auth-card">
          <div class="header">
            <a routerLink="/signup" class="back-link">← Back</a>
            <h1>LOGIN</h1>
            <p class="subtitle">Choose your method to log in as a consignor</p>
          </div>

          <!-- Social Authentication Options -->
          <div class="social-auth-section">
            <div class="social-buttons">
              <button type="button" class="social-btn google-btn" (click)="signInWithGoogle()">
                <svg class="social-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button type="button" class="social-btn facebook-btn" (click)="signInWithFacebook()">
                <svg class="social-icon" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>

              <button type="button" class="social-btn twitter-btn" (click)="signInWithTwitter()">
                <svg class="social-icon" viewBox="0 0 24 24">
                  <path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Continue with X
              </button>

              <button type="button" class="social-btn apple-btn" (click)="signInWithApple()">
                <svg class="social-icon" viewBox="0 0 24 24">
                  <path fill="#000000" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.17zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>

              <button type="button" class="social-btn linkedin-btn" (click)="signInWithLinkedIn()">
                <svg class="social-icon" viewBox="0 0 24 24">
                  <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Continue with LinkedIn
              </button>
            </div>

            <div class="divider">
              <span class="divider-text">or</span>
            </div>
          </div>

          <!-- Email/Password Form -->
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                [class.error]="authForm.get('email')?.invalid && authForm.get('email')?.touched"
                placeholder="Enter your email address"
                autocomplete="username">
              <div class="error-message"
                   *ngIf="authForm.get('email')?.invalid && authForm.get('email')?.touched">
                <span *ngIf="authForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="authForm.get('email')?.errors?.['email']">Please enter a valid email address</span>
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password *</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                [class.error]="authForm.get('password')?.invalid && authForm.get('password')?.touched"
                placeholder="Create a password"
                autocomplete="new-password">
              <div class="form-hint">At least 8 characters</div>
              <div class="error-message"
                   *ngIf="authForm.get('password')?.invalid && authForm.get('password')?.touched">
                Password must be at least 8 characters
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                [class.error]="authForm.get('confirmPassword')?.invalid && authForm.get('confirmPassword')?.touched"
                placeholder="Confirm your password"
                autocomplete="new-password">
              <div class="error-message"
                   *ngIf="authForm.get('confirmPassword')?.invalid && authForm.get('confirmPassword')?.touched">
                Passwords must match
              </div>
            </div>

            <button
              type="submit"
              class="submit-btn"
              [disabled]="authForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Creating Account...' : 'Continue to consignor Details' }}
            </button>
          </form>

          <!-- Error Display -->
          <div class="alert error" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>

          <!-- Login Link -->
          <div class="login-link">
            Already have an account? <a routerLink="/login">Sign in here</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .container {
      width: 100%;
      max-width: 480px;
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .back-link {
      color: #7c3aed;
      text-decoration: none;
      font-weight: 600;
      margin-bottom: 1rem;
      display: inline-block;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    h1 {
      color: #7c3aed;
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .subtitle {
      color: #6b7280;
      font-size: 1.1rem;
      margin: 0 0 2rem 0;
    }

    .social-auth-section {
      margin-bottom: 2rem;
    }

    .social-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      color: #374151;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }

    .social-btn:hover {
      border-color: #d1d5db;
      background: #f9fafb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .social-btn:active {
      transform: translateY(0);
    }

    .social-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .divider {
      margin: 2rem 0;
      text-align: center;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e5e7eb;
    }

    .divider-text {
      background: white;
      padding: 0 1rem;
      color: #6b7280;
      font-weight: 500;
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
      padding: 0.875rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }

    input:focus {
      outline: none;
      border-color: #7c3aed;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    input.error {
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
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: #7c3aed;
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
      background: #6b21a8;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    }

    .submit-btn:disabled {
      background: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
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

    .login-link {
      text-align: center;
      margin-top: 2rem;
      color: #6b7280;
    }

    .login-link a {
      color: #7c3aed;
      text-decoration: none;
      font-weight: 600;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .auth-card {
        padding: 2rem;
      }

      h1 {
        font-size: 2rem;
      }

      .social-btn {
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }

      .social-icon {
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class ConsignorSignupStep1Component implements OnInit {
  authForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private ConsignorService: ConsignorService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Check if this is an invitation link
    const token = this.route.snapshot.queryParams['token'];
    const storeCode = this.route.snapshot.queryParams['storeCode'];

    if (token && storeCode) {
      // This is an invitation link - redirect to proper invitation registration
      this.router.navigate(['/register/consignor/invitation'], {
        queryParams: { token }
      });
    }
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
    if (this.authForm.invalid) {
      this.markAllFieldsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.authForm.value;

    // Store the email/password in session storage temporarily for step 2
    sessionStorage.setItem('providerAuthData', JSON.stringify({
      email: formValue.email,
      password: formValue.password
    }));

    // Simulate account creation delay
    setTimeout(() => {
      this.isSubmitting.set(false);
      // Navigate to step 2
      this.router.navigate(['/signup/consignor/details']);
    }, 1000);
  }

  // Social authentication methods (placeholder implementations)
  signInWithGoogle() {
    console.log('Google sign in clicked');
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithFacebook() {
    console.log('Facebook sign in clicked');
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithTwitter() {
    console.log('Twitter sign in clicked');
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithApple() {
    console.log('Apple sign in clicked');
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithLinkedIn() {
    console.log('LinkedIn sign in clicked');
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  private markAllFieldsTouched() {
    Object.keys(this.authForm.controls).forEach(key => {
      this.authForm.get(key)?.markAsTouched();
    });
  }
}