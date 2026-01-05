import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-signup-step2',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './owner-signup-step2.component.html',
  styleUrls: ['./owner-signup-step2.component.scss']
})
export class OwnerSignupStep2Component implements OnInit {
  profileForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      shopName: ['', [Validators.required]],
      phone: [''],
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]]
    });
  }

  ngOnInit() {
    // Scroll to top of page
    window.scrollTo(0, 0);

    // Check if user came from step 1
    const authDataString = sessionStorage.getItem('ownerAuthData');
    if (!authDataString) {
      // Redirect back to step 1 if no auth data
      this.router.navigate(['/signup/owner']);
    } else {
      // Set user email from session data
      const authData = JSON.parse(authDataString);
      this.userEmail = authData.email;
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.markAllFieldsTouched();
      return;
    }

    // Get auth data from step 1
    const authDataString = sessionStorage.getItem('ownerAuthData');
    if (!authDataString) {
      this.errorMessage.set('Session expired. Please start over.');
      this.router.navigate(['/signup/owner']);
      return;
    }

    const authData = JSON.parse(authDataString);
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.profileForm.value;

    // Combine auth data from step 1 with profile data from step 2
    const request = {
      fullName: formValue.fullName,
      email: authData.email,
      phone: formValue.phone || '',
      password: authData.password,
      shopName: formValue.shopName,
      // Combine address fields into single address string for now
      // (API may need to be updated to accept separate fields)
      address: `${formValue.streetAddress}, ${formValue.city}, ${formValue.state} ${formValue.zipCode}`,
      // Send separate address fields if API supports them
      streetAddress: formValue.streetAddress,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode
    };

    this.authService.registerOwnerFrictionless(request).subscribe({
      next: (result) => {
        console.log('Owner registration response:', result);
        if (result.success) {
          console.log('User logged in with role:', result.role);
          // Clear the temporary auth data
          sessionStorage.removeItem('ownerAuthData');

          // If we have a token, user was auto-logged in - redirect to dashboard
          if (result.token) {
            console.log('Auto-login successful, redirecting to owner dashboard');
            this.router.navigate(['/owner/dashboard']);
          } else {
            // No token means approval required - show success page
            this.router.navigate(['/register/success'], {
              queryParams: {
                type: 'owner',
                shopName: formValue.shopName,
                email: authData.email
              }
            });
          }
        } else {
          this.errorMessage.set(result.message || 'Registration failed');
        }
        this.isSubmitting.set(false);
      },
      error: (error: any) => {
        this.errorMessage.set(error.message || 'An unexpected error occurred');
        this.isSubmitting.set(false);
      }
    });
  }

  private markAllFieldsTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

}