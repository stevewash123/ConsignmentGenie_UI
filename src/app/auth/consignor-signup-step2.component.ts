import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-consignor-signup-step2',
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
              <a routerLink="/signup/consignor" class="back-link">← Back</a>
              <h2>Join as a Consignor</h2>
            </div>

            <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="signup-form">
              <!-- Account Information -->
              <div class="form-section">
                <h3>Account Information</h3>

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
                  <label for="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    formControlName="phone"
                    [class.error]="signupForm.get('phone')?.touched && signupForm.get('phone')?.invalid"
                    placeholder="Enter your phone number"
                  />
                  <div class="error-message" *ngIf="signupForm.get('phone')?.touched && signupForm.get('phone')?.invalid">
                    Phone number is required
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
                  {{ isSubmitting() ? 'Creating Account...' : 'Create Consignor Account' }}
                </button>

                <p class="alternative-links">
                  <a routerLink="/signup">Choose different account type</a> |
                  <a routerLink="/login">Already have an account?</a>
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
      max-width: 500px;
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
      gap: 1.5rem;
    }

    .form-section h3 {
      color: #7c3aed;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1.5rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.95rem;
    }

    .form-group input {
      padding: 0.875rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
      background: white;
    }

    .form-group input:focus {
      outline: none;
      border-color: #7c3aed;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .form-group input.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .info-note {
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
      border: 1px solid #e9d5ff;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .info-icon {
      font-size: 1.5rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .info-content p {
      margin: 0;
      color: #6b46c1;
      line-height: 1.5;
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
      min-width: 220px;
    }

    .btn-primary {
      background: #7c3aed;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #6b21a8;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(124, 58, 237, 0.2);
    }

    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .alternative-links {
      color: #6b7280;
      margin: 0;
      text-align: center;
      font-size: 0.95rem;
    }

    .alternative-links a {
      color: #7c3aed;
      text-decoration: none;
      font-weight: 500;
    }

    .alternative-links a:hover {
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
        min-width: 200px;
      }

      .info-note {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ConsignorSignupStep2Component implements OnInit {
  signupForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  authData: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    // Get the auth data from step 1
    const authDataStr = sessionStorage.getItem('consignorAuthData');
    if (authDataStr) {
      this.authData = JSON.parse(authDataStr);
    } else {
      // If no auth data, redirect back to step 1
      this.router.navigate(['/signup/consignor']);
    }
  }

  onSubmit() {
    if (this.signupForm.valid && !this.isSubmitting() && this.authData) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');

      const formData = {
        storeCode: '', // Will be collected later when joining a shop
        fullName: this.signupForm.value.name,
        email: this.authData.email,
        password: this.authData.password,
        phone: this.signupForm.value.phone
      };

      this.authService.registerProvider(formData).subscribe({
        next: (response) => {
          console.log('Consignor registration successful:', response);
          if (response.success) {
            // Clear the temporary auth data
            sessionStorage.removeItem('consignorAuthData');

            // For now, redirect to login since consignors need to join shops separately
            this.router.navigate(['/login'], {
              queryParams: {
                message: 'Account created successfully! Log in to join consignment shops.'
              }
            });
          } else {
            this.errorMessage.set(response.message || 'Registration failed. Please try again.');
            this.isSubmitting.set(false);
          }
        },
        error: (error) => {
          console.error('Consignor registration failed:', error);
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