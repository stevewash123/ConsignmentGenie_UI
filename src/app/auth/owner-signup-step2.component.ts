import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-signup-step2',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <div class="container">
        <div class="profile-card">
          <div class="header">
            <a routerLink="/signup/owner" class="back-link">← Back</a>
            <h1>Complete Your Profile</h1>
            <p class="subtitle">Tell us about your business and location</p>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <!-- Business Information Section -->
            <div class="form-section">
              <h3>Business Information</h3>

              <div class="form-group">
                <label for="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  formControlName="fullName"
                  [class.error]="profileForm.get('fullName')?.invalid && profileForm.get('fullName')?.touched"
                  placeholder="John Smith">
                <div class="error-message"
                     *ngIf="profileForm.get('fullName')?.invalid && profileForm.get('fullName')?.touched">
                  Full name is required
                </div>
              </div>

              <div class="form-group">
                <label for="shopName">Business/Shop Name *</label>
                <input
                  id="shopName"
                  type="text"
                  formControlName="shopName"
                  [class.error]="profileForm.get('shopName')?.invalid && profileForm.get('shopName')?.touched"
                  placeholder="Main Street Consignment">
                <div class="error-message"
                     *ngIf="profileForm.get('shopName')?.invalid && profileForm.get('shopName')?.touched">
                  Business name is required
                </div>
              </div>

              <div class="form-group">
                <label for="subdomain">Shop URL *</label>
                <div class="subdomain-input-wrapper">
                  <input
                    id="subdomain"
                    type="text"
                    formControlName="subdomain"
                    [class.error]="profileForm.get('subdomain')?.invalid && profileForm.get('subdomain')?.touched"
                    placeholder="myshop">
                  <span class="subdomain-suffix">.consignmentgenie.com</span>
                </div>
                <div class="form-hint">This will be your shop's web address</div>
                <div class="error-message"
                     *ngIf="profileForm.get('subdomain')?.invalid && profileForm.get('subdomain')?.touched">
                  <span *ngIf="profileForm.get('subdomain')?.errors?.['required']">Shop URL is required</span>
                  <span *ngIf="profileForm.get('subdomain')?.errors?.['pattern']">Only letters, numbers, and dashes allowed</span>
                </div>
              </div>

              <div class="form-group">
                <label for="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  formControlName="phone"
                  placeholder="(555) 123-4567">
                <div class="form-hint">Optional - for customer contact and support</div>
              </div>
            </div>

            <!-- Business Address Section -->
            <div class="form-section">
              <h3>Business Address</h3>

              <div class="form-group">
                <label for="streetAddress">Street Address *</label>
                <input
                  id="streetAddress"
                  type="text"
                  formControlName="streetAddress"
                  [class.error]="profileForm.get('streetAddress')?.invalid && profileForm.get('streetAddress')?.touched"
                  placeholder="123 Main Street">
                <div class="error-message"
                     *ngIf="profileForm.get('streetAddress')?.invalid && profileForm.get('streetAddress')?.touched">
                  Street address is required
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="city">City *</label>
                  <input
                    id="city"
                    type="text"
                    formControlName="city"
                    [class.error]="profileForm.get('city')?.invalid && profileForm.get('city')?.touched"
                    placeholder="Your City">
                  <div class="error-message"
                       *ngIf="profileForm.get('city')?.invalid && profileForm.get('city')?.touched">
                    City is required
                  </div>
                </div>

                <div class="form-group">
                  <label for="state">State *</label>
                  <select
                    id="state"
                    formControlName="state"
                    [class.error]="profileForm.get('state')?.invalid && profileForm.get('state')?.touched">
                    <option value="">Select State</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                  </select>
                  <div class="error-message"
                       *ngIf="profileForm.get('state')?.invalid && profileForm.get('state')?.touched">
                    State is required
                  </div>
                </div>

                <div class="form-group">
                  <label for="zipCode">ZIP Code *</label>
                  <input
                    id="zipCode"
                    type="text"
                    formControlName="zipCode"
                    [class.error]="profileForm.get('zipCode')?.invalid && profileForm.get('zipCode')?.touched"
                    placeholder="12345">
                  <div class="error-message"
                       *ngIf="profileForm.get('zipCode')?.invalid && profileForm.get('zipCode')?.touched">
                    <span *ngIf="profileForm.get('zipCode')?.errors?.['required']">ZIP code is required</span>
                    <span *ngIf="profileForm.get('zipCode')?.errors?.['pattern']">Please enter a valid ZIP code</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-box">
              <h4>What happens next?</h4>
              <ul>
                <li>Your shop will be created immediately</li>
                <li>You can add commission rates and policies in settings</li>
                <li>Start adding providers and inventory right away</li>
              </ul>
            </div>

            <button
              type="submit"
              class="submit-btn"
              [disabled]="profileForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Creating Shop...' : 'Create Shop' }}
            </button>
          </form>

          <!-- Error Display -->
          <div class="alert error" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .container {
      width: 100%;
      max-width: 600px;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .header {
      margin-bottom: 2rem;
    }

    .back-link {
      color: #047857;
      text-decoration: none;
      font-weight: 600;
      margin-bottom: 1rem;
      display: inline-block;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    h1 {
      color: #047857;
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .subtitle {
      color: #6b7280;
      font-size: 1rem;
      margin: 0 0 2rem 0;
    }

    .form-section {
      margin-bottom: 2.5rem;
    }

    .form-section h3 {
      color: #047857;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1.5rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: block;
      color: #374151;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    input, select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    input.error, select.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    select {
      background: white;
      cursor: pointer;
    }

    .form-hint {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .subdomain-input-wrapper {
      display: flex;
      align-items: center;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      transition: border-color 0.2s;
    }

    .subdomain-input-wrapper:focus-within {
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    .subdomain-input-wrapper input {
      border: none !important;
      box-shadow: none !important;
      flex: 1;
      padding: 0.75rem;
      font-size: 1rem;
    }

    .subdomain-suffix {
      background: #f9fafb;
      padding: 0.75rem;
      color: #6b7280;
      border-left: 1px solid #e5e7eb;
      font-size: 1rem;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .info-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }

    .info-box h4 {
      color: #047857;
      font-size: 1rem;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }

    .info-box ul {
      margin: 0;
      padding-left: 1.5rem;
      color: #374151;
    }

    .info-box li {
      margin-bottom: 0.5rem;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: #047857;
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
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(4, 120, 87, 0.2);
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

    @media (max-width: 768px) {
      .profile-card {
        padding: 2rem;
      }

      h1 {
        font-size: 1.75rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OwnerSignupStep2Component implements OnInit {
  profileForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      shopName: ['', [Validators.required]],
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      phone: [''],
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]]
    });
  }

  ngOnInit() {
    // Check if user came from step 1
    const authData = sessionStorage.getItem('ownerAuthData');
    if (!authData) {
      // Redirect back to step 1 if no auth data
      this.router.navigate(['/signup/owner']);
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
      subdomain: formValue.subdomain,
      // Combine address fields into single address string for now
      // (API may need to be updated to accept separate fields)
      address: `${formValue.streetAddress}, ${formValue.city}, ${formValue.state} ${formValue.zipCode}`,
      // Send separate address fields if API supports them
      streetAddress: formValue.streetAddress,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode
    };

    this.authService.registerOwner(request).subscribe({
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