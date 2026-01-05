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
  styleUrls: ['./consignor-signup-step1.component.scss']
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
    sessionStorage.setItem('consignorAuthData', JSON.stringify({
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