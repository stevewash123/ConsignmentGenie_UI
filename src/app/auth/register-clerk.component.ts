import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-clerk',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-clerk.component.html',
  styleUrls: ['./register-clerk.component.scss']
})
export class RegisterClerkComponent implements OnInit {
  registrationForm: FormGroup;

  isValidatingToken = false;
  isSubmitting = false;
  tokenValid = false;

  shopName = '';
  invitedEmail = '';
  tokenError = '';
  registrationError = '';

  private token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registrationForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get token from URL route parameter
    this.token = this.route.snapshot.params['token'];

    if (!this.token) {
      this.tokenError = 'Invalid invitation link';
      return;
    }

    this.validateInvitation();
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
  }

  validateInvitation(): void {
    this.isValidatingToken = true;
    this.tokenError = '';

    this.authService.validateClerkInvitation(this.token).subscribe({
      next: (response) => {
        this.isValidatingToken = false;

        if (response.isValid) {
          this.tokenValid = true;
          this.shopName = response.shopName || '';
          this.invitedEmail = response.invitedEmail || '';

          // Pre-fill form with invitation data
          if (response.invitedFirstName) {
            this.registrationForm.patchValue({
              firstName: response.invitedFirstName
            });
          }
          if (response.invitedLastName) {
            this.registrationForm.patchValue({
              lastName: response.invitedLastName
            });
          }
        } else {
          this.tokenError = response.message || 'Invalid invitation';
        }
      },
      error: (error) => {
        this.isValidatingToken = false;
        this.tokenError = 'Unable to validate invitation. Please try again.';
        console.error('Token validation error:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.registrationError = '';

    const formData = this.registrationForm.value;

    const registrationRequest = {
      token: this.token,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || null,
      password: formData.password
    };

    this.authService.registerClerkFromInvitation(registrationRequest).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (response.success) {
          // Auto-login with the returned token
          this.authService.setToken(response.token!);
          this.authService.setCurrentUser(response.user!);

          // Redirect to clerk home (POS)
          this.router.navigate(['/pos']);
        } else {
          this.registrationError = response.message;
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.registrationError = 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return `Please enter a valid ${fieldName.toLowerCase()}`;
      }
      if (field.errors['mismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    switch (fieldName) {
      case 'firstName': return 'First name';
      case 'lastName': return 'Last name';
      case 'phone': return 'Phone number';
      case 'password': return 'Password';
      case 'confirmPassword': return 'Confirm password';
      default: return fieldName;
    }
  }
}