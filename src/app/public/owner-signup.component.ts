import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './owner-signup.component.html',
  styleUrls: ['./owner-signup.component.scss']
})
export class OwnerSignupComponent {
  signupForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone: [''],
      shopName: ['', [Validators.required, Validators.minLength(2)]],
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      businessAddress: ['', [Validators.required, Validators.minLength(10)]],
      poBox: ['']
    });
  }

  onSubmit() {
    if (this.signupForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');

      const formData = {
        fullName: this.signupForm.value.name,
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
        phone: this.signupForm.value.phone || undefined,
        shopName: this.signupForm.value.shopName,
        subdomain: this.signupForm.value.subdomain,
        address: this.signupForm.value.businessAddress + (this.signupForm.value.poBox ? `\nPO Box: ${this.signupForm.value.poBox}` : '')
      };

      this.authService.registerOwner(formData).subscribe({
        next: (response) => {
          console.log('Registration response:', response);
          if (response.success) {
            console.log('User logged in with role:', response.role);
            this.router.navigate(['/owner/dashboard']);
          } else {
            this.errorMessage.set(response.message || 'Registration failed. Please try again.');
            this.isSubmitting.set(false);
          }
        },
        error: (error) => {
          console.error('Registration failed:', error);
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