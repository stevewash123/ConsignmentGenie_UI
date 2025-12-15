import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  emailSent = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.markAllFieldsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request = {
      email: this.forgotPasswordForm.get('email')?.value
    };

    this.authService.forgotPassword(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.emailSent.set(true);
          this.successMessage.set(response.message || 'Password reset email sent successfully');
        } else {
          this.errorMessage.set(response.message || 'Failed to send password reset email');
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message || 'An unexpected error occurred');
      }
    });
  }

  private markAllFieldsTouched() {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      this.forgotPasswordForm.get(key)?.markAsTouched();
    });
  }

  resendEmail() {
    this.emailSent.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}