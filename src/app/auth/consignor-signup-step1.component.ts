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
  templateUrl: './consignor-signup-step1.component.html',
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