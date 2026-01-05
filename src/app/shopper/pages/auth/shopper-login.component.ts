import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ShopperAuthService, ShopperLoginRequest } from '../../services/shopper-auth.service';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';
import { LoadingService } from '../../../shared/services/loading.service';

@Component({
  selector: 'app-shopper-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shopper-login.component.html',
  styleUrls: ['./shopper-login.component.scss']
})
export class ShopperLoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage = '';
  showPassword = false;
  storeSlug = '';
  storeInfo: StoreInfoDto | null = null;
  returnUrl = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shopperAuthService: ShopperAuthService,
    private storeService: ShopperStoreService,
    private loadingService: LoadingService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Get store slug and return URL from route
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';

      // Check if already authenticated for this store
      if (this.shopperAuthService.isAuthenticated(this.storeSlug)) {
        this.redirectAfterLogin();
        return;
      }
    });

    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.returnUrl = params['returnUrl'] || `/shop/${this.storeSlug}`;
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

  isShopperLoading(): boolean {
    return this.loadingService.isLoading('shopper-login');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.loadingService.start('shopper-login');
    this.errorMessage = '';

    const loginRequest: ShopperLoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe
    };

    this.shopperAuthService.login(this.storeSlug, loginRequest).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingService.stop('shopper-login');
      })
    ).subscribe({
      next: (result) => {
        if (result.success) {
          this.redirectAfterLogin();
        } else {
          this.errorMessage = result.errorMessage || 'Login failed. Please try again.';
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'An error occurred during login. Please try again.';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    // TODO: Implement forgot password flow in future
    alert('Forgot password functionality will be implemented in a future update.');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  private redirectAfterLogin(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}