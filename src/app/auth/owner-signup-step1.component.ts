import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-signup-step1',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './owner-signup-step1.component.html',
})
export class OwnerSignupStep1Component {
  authForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
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
    if (this.authForm.invalid) {
      this.markAllFieldsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.authForm.value;

    // For now, we'll create a minimal user account and redirect to step 2
    // In the future, this could integrate with the backend to create auth-only accounts

    // Store the email/password in session storage temporarily for step 2
    sessionStorage.setItem('ownerAuthData', JSON.stringify({
      email: formValue.email,
      password: formValue.password
    }));

    // Simulate account creation delay
    setTimeout(() => {
      this.isSubmitting.set(false);
      // Navigate to step 2
      this.router.navigate(['/signup/owner/profile']);
    }, 1000);
  }

  // Social authentication methods (placeholder implementations)
  signInWithGoogle() {
    console.log('Google sign in clicked');
    // TODO: Implement Google OAuth
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithFacebook() {
    console.log('Facebook sign in clicked');
    // TODO: Implement Facebook OAuth
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithTwitter() {
    console.log('Twitter sign in clicked');
    // TODO: Implement Twitter OAuth
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithApple() {
    console.log('Apple sign in clicked');
    // TODO: Implement Apple OAuth
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  signInWithLinkedIn() {
    console.log('LinkedIn sign in clicked');
    // TODO: Implement LinkedIn OAuth
    this.errorMessage.set('Social login coming soon! Please use email/password for now.');
  }

  private markAllFieldsTouched() {
    Object.keys(this.authForm.controls).forEach(key => {
      this.authForm.get(key)?.markAsTouched();
    });
  }
}