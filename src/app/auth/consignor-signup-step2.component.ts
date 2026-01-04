import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-consignor-signup-step2',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './consignor-signup-step2.component.html',
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
    const authDataStr = sessionStorage.getItem('providerAuthData');
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
            sessionStorage.removeItem('providerAuthData');

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