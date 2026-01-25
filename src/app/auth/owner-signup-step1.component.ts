import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SocialAuthService, SocialAuthResult } from '../services/social-auth.service';
import { GoogleAuthRequest, AppleAuthRequest, TwitterAuthRequest } from '../models/auth.model';

@Component({
  selector: 'app-owner-signup-step1',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './owner-signup-step1.component.html',
  styleUrls: ['./owner-signup-step1.component.scss']
})
export class OwnerSignupStep1Component {
  authForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
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

  // Social authentication methods
  signInWithGoogle() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.socialAuthService.signInWithGoogle().subscribe({
      next: (result: SocialAuthResult) => {
        this.handleSocialAuthResult(result);
      },
      error: (error) => {
        console.error('Google sign-in error:', error);
        this.errorMessage.set('Google sign-in failed. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  signInWithTwitter() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.socialAuthService.signInWithTwitter().subscribe({
      next: (result: SocialAuthResult) => {
        this.handleSocialAuthResult(result);
      },
      error: (error) => {
        console.error('Twitter sign-in error:', error);
        this.errorMessage.set('Twitter sign-in failed. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  signInWithApple() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.socialAuthService.signInWithApple().subscribe({
      next: (result: SocialAuthResult) => {
        this.handleSocialAuthResult(result);
      },
      error: (error) => {
        console.error('Apple sign-in error:', error);
        this.errorMessage.set('Apple sign-in failed. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  private handleSocialAuthResult(result: SocialAuthResult) {
    console.log('Social auth result:', result);

    switch (result.provider) {
      case 'google':
        const googleAuthRequest: GoogleAuthRequest = {
          idToken: result.token,
          mode: 'signup',
          email: result.email,
          name: result.name,
          providerId: result.providerId
        };

        this.authService.googleAuth(googleAuthRequest).subscribe({
          next: (response) => this.handleAuthResponse(response),
          error: (error) => this.handleAuthError(error)
        });
        break;

      case 'apple':
        const appleAuthRequest: AppleAuthRequest = {
          idToken: result.token,
          authorizationCode: result.additionalData?.authorizationCode || '',
          mode: 'signup',
          email: result.email,
          name: result.name,
          providerId: result.providerId
        };

        this.authService.appleAuth(appleAuthRequest).subscribe({
          next: (response) => this.handleAuthResponse(response),
          error: (error) => this.handleAuthError(error)
        });
        break;

      case 'twitter':
        const twitterAuthRequest: TwitterAuthRequest = {
          accessToken: result.token,
          accessTokenSecret: result.additionalData?.accessTokenSecret || '',
          mode: 'signup',
          email: result.email,
          name: result.name,
          providerId: result.providerId,
          username: result.additionalData?.username || ''
        };

        this.authService.twitterAuth(twitterAuthRequest).subscribe({
          next: (response) => this.handleAuthResponse(response),
          error: (error) => this.handleAuthError(error)
        });
        break;
    }
  }

  private handleAuthResponse(response: any) {
    console.log('Auth response:', response);
    this.isSubmitting.set(false);

    if (response.needsProfileCompletion) {
      // Store social auth data for profile completion
      sessionStorage.setItem('socialAuthData', JSON.stringify(response));
      this.router.navigate(['/signup/owner/profile']);
    } else {
      // User is fully registered, redirect to dashboard
      this.router.navigate(['/owner/dashboard']);
    }
  }

  private handleAuthError(error: any) {
    console.error('Auth error:', error);
    this.isSubmitting.set(false);
    this.errorMessage.set(error.error?.message || 'Authentication failed. Please try again.');
  }

  private markAllFieldsTouched() {
    Object.keys(this.authForm.controls).forEach(key => {
      this.authForm.get(key)?.markAsTouched();
    });
  }
}