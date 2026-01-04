import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-consignor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-consignor.component.html',
  styleUrls: ['./register-consignor.component.scss']
})
export class RegisterConsignorComponent implements OnInit {
  storeCodeForm: FormGroup;
  registrationForm: FormGroup;

  storeCodeValidated = false;
  isValidatingStoreCode = false;
  isSubmitting = false;

  shopName = '';
  storeCodeError = '';
  registrationError = '';
  registrationErrors: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.storeCodeForm = this.fb.group({
      storeCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });

    this.registrationForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      preferredPaymentMethod: [''],
      paymentDetails: ['']
    });
  }

  ngOnInit(): void {}

  validateStoreCode(): void {
    if (this.storeCodeForm.invalid) return;

    this.isValidatingStoreCode = true;
    this.storeCodeError = '';

    const storeCode = this.storeCodeForm.get('storeCode')?.value;
    this.authService.validateStoreCode(storeCode).subscribe({
      next: (validation) => {
        if (validation.isValid && validation.shopName) {
          this.storeCodeValidated = true;
          this.shopName = validation.shopName;
        } else {
          this.storeCodeError = validation.errorMessage || 'Invalid store code';
        }
        this.isValidatingStoreCode = false;
      },
      error: () => {
        this.storeCodeError = 'Unable to validate store code. Please try again.';
        this.isValidatingStoreCode = false;
      }
    });
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) return;

    this.isSubmitting = true;
    this.registrationError = '';
    this.registrationErrors = [];

    const formData = this.registrationForm.value;
    const request = {
      storeCode: this.storeCodeForm.get('storeCode')?.value,
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
      preferredPaymentMethod: formData.preferredPaymentMethod || undefined,
      paymentDetails: formData.paymentDetails || undefined
    };

    this.authService.registerProvider(request).subscribe({
      next: (result) => {
        if (result.success) {
          this.router.navigate(['/register/success'], {
            queryParams: {
              type: 'consignor',
              shopName: this.shopName,
              email: formData.email,
              fullName: formData.fullName
            }
          });
        } else {
          this.registrationError = result.message || 'Registration failed';
          this.registrationErrors = result.errors || [];
        }
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.registrationError = error.message || 'An unexpected error occurred';
        this.isSubmitting = false;
      }
    });
  }

  resetStoreCode(): void {
    this.storeCodeValidated = false;
    this.shopName = '';
    this.storeCodeError = '';
    this.registrationError = '';
    this.registrationErrors = [];
    this.storeCodeForm.reset();
    this.registrationForm.reset();
  }

  getPaymentPlaceholder(): string {
    const method = this.registrationForm.get('preferredPaymentMethod')?.value;
    switch (method) {
      case 'Venmo': return '@username';
      case 'PayPal': return 'email@example.com';
      case 'Zelle': return 'email@example.com or phone number';
      case 'Bank Transfer': return 'Account details';
      case 'Check': return 'Mailing address';
      default: return 'Payment details';
    }
  }

  getPaymentHelpText(): string {
    const method = this.registrationForm.get('preferredPaymentMethod')?.value;
    switch (method) {
      case 'Venmo': return 'Enter your Venmo username (e.g., @john-doe)';
      case 'PayPal': return 'Enter the email address associated with your PayPal account';
      case 'Zelle': return 'Enter email or phone number registered with Zelle';
      case 'Bank Transfer': return 'Bank account information will be collected securely later';
      case 'Check': return 'Enter your mailing address for check delivery';
      case 'Cash': return 'No additional details needed for cash pickup';
      default: return 'Enter relevant payment information';
    }
  }
}