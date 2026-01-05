import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ShopperAuthService, ShopperRegisterRequest } from '../../services/shopper-auth.service';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';
import { LoadingService } from '../../../shared/services/loading.service';

@Component({
  selector: 'app-shopper-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shopper-register.component.html',
  styleUrls: ['./shopper-register.component.scss']
})
export class ShopperRegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  storeSlug = '';
  storeInfo: StoreInfoDto | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shopperAuthService: ShopperAuthService,
    private storeService: ShopperStoreService,
    private loadingService: LoadingService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      phone: ['', [Validators.maxLength(20), this.phoneValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      emailNotifications: [true]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Get store slug from route
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';

      // Check if already authenticated for this store
      if (this.shopperAuthService.isAuthenticated(this.storeSlug)) {
        this.router.navigate(['/shop', this.storeSlug]);
        return;
      }
    });

    // Get store info for branding
    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isShopperRegisterLoading(): boolean {
    return this.loadingService.isLoading('shopper-register');
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.loadingService.start('shopper-register');
    this.errorMessage = '';

    const registerRequest: ShopperRegisterRequest = {
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      phone: this.registerForm.value.phone || undefined,
      emailNotifications: this.registerForm.value.emailNotifications
    };

    this.shopperAuthService.register(this.storeSlug, registerRequest).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingService.stop('shopper-register');
      })
    ).subscribe({
      next: (result) => {
        if (result.success) {
          // Registration successful, redirect to catalog
          this.router.navigate(['/shop', this.storeSlug]);
        } else {
          this.errorMessage = result.errorMessage || 'Registration failed. Please try again.';
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'An error occurred during registration. Please try again.';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    // Clear mismatch error if passwords match
    if (confirmPassword.errors?.['mismatch']) {
      delete confirmPassword.errors['mismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  private phoneValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (!control.value) {
      return null; // Phone is optional
    }

    // Simple phone validation - allows various formats
    const phonePattern = /^[\+]?[\d\s\(\)\-\.]{7,20}$/;
    if (!phonePattern.test(control.value)) {
      return { pattern: true };
    }

    return null;
  }
}