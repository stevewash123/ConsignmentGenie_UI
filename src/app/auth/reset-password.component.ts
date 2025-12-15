import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isValidating = signal(true);
  tokenValid = signal(false);
  resetToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Get the reset token from query parameters
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || null;
      if (this.resetToken) {
        this.validateResetToken(this.resetToken);
      } else {
        this.isValidating.set(false);
        this.errorMessage.set('Invalid reset link. Please request a new password reset.');
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  private validateResetToken(token: string) {
    this.authService.validateResetToken(token).subscribe({
      next: (response) => {
        this.isValidating.set(false);
        if (response.isValid) {
          this.tokenValid.set(true);
        } else {
          this.errorMessage.set(response.message || 'Invalid or expired reset token');
        }
      },
      error: () => {
        this.isValidating.set(false);
        this.errorMessage.set('Unable to validate reset token');
      }
    });
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid || !this.resetToken) {
      this.markAllFieldsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request = {
      token: this.resetToken,
      newPassword: this.resetPasswordForm.get('newPassword')?.value,
      confirmPassword: this.resetPasswordForm.get('confirmPassword')?.value
    };

    this.authService.resetPassword(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.successMessage.set(response.message || 'Password reset successfully');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage.set(response.message || 'Failed to reset password');
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message || 'An unexpected error occurred');
      }
    });
  }

  private markAllFieldsTouched() {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      this.resetPasswordForm.get(key)?.markAsTouched();
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  requestNewReset() {
    this.router.navigate(['/forgot-password']);
  }
}