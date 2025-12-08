import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ShopperAuthService } from '../../services/shopper-auth.service';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-settings.component.html',
  styles: [`
    .settings-container {
      min-height: 80vh;
      padding: 2rem 0;
      background-color: #f8f9fa;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: bold;
      color: #343a40;
      margin-bottom: 0.5rem;
    }

    .store-name {
      font-size: 1.1rem;
      color: #007bff;
      margin: 0;
    }

    .settings-content {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .settings-nav {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      height: fit-content;
    }

    .nav-pills {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-item {
      background: none;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      text-align: left;
      color: #6c757d;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background-color: #e9ecef;
      color: #343a40;
    }

    .nav-item.active {
      background-color: #007bff;
      color: white;
    }

    .settings-panel {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .tab-content {
      padding: 2rem;
    }

    .tab-header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #dee2e6;
    }

    .tab-header h2 {
      color: #343a40;
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
    }

    .tab-header p {
      color: #6c757d;
      margin: 0;
    }

    .settings-form {
      max-width: 600px;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #343a40;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #ced4da;
      border-radius: 0.375rem;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .password-input {
      position: relative;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      color: #6c757d;
    }

    .invalid-feedback {
      display: block;
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-text {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: #6c757d;
    }

    .text-muted {
      color: #6c757d !important;
    }

    .preference-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #dee2e6;
    }

    .preference-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .preference-section h3 {
      color: #343a40;
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .form-check {
      display: flex;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 0.75rem;
    }

    .form-check-input {
      margin-top: 0.125rem;
      flex-shrink: 0;
    }

    .form-check-label {
      font-weight: 500;
      color: #343a40;
      cursor: pointer;
    }

    .form-check .form-text {
      margin-top: 0.25rem;
      margin-left: 0;
    }

    .form-actions {
      padding-top: 1.5rem;
      border-top: 1px solid #dee2e6;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: 1px solid transparent;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background-color: #007bff;
      border-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
      border-color: #004085;
    }

    .btn-danger {
      background-color: #dc3545;
      border-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
      border-color: #bd2130;
    }

    .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
      border-width: 0.125em;
    }

    .danger-zone {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .danger-card {
      padding: 2rem;
      border-left: 4px solid #dc3545;
    }

    .danger-card h3 {
      color: #dc3545;
      margin-bottom: 1rem;
    }

    .danger-card p {
      color: #6c757d;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 968px) {
      .settings-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .nav-pills {
        flex-direction: row;
        overflow-x: auto;
        gap: 0.25rem;
      }

      .nav-item {
        white-space: nowrap;
        flex-shrink: 0;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .tab-content {
        padding: 1.5rem;
      }

      .settings-form {
        max-width: none;
      }

      .danger-card {
        padding: 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .page-header h1 {
        font-size: 2rem;
      }

      .tab-content {
        padding: 1rem;
      }

      .nav-pills {
        flex-direction: column;
      }
    }
  `]
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug = '';
  activeTab: 'profile' | 'shipping' | 'password' | 'preferences' = 'profile';

  profileForm: FormGroup;
  shippingForm: FormGroup;
  passwordForm: FormGroup;
  preferencesForm: FormGroup;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  isUpdatingProfile = false;
  isUpdatingShipping = false;
  isChangingPassword = false;
  isUpdatingPreferences = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: ShopperAuthService,
    private storeService: ShopperStoreService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.shippingForm = this.fb.group({
      address: ['', [Validators.required]],
      apartment: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.preferencesForm = this.fb.group({
      orderUpdates: [true],
      promotions: [false],
      newArrivals: [false],
      priceDrops: [true],
      profilePublic: [false],
      shareData: [true]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
    });

    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });

    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'profile' | 'shipping' | 'password' | 'preferences'): void {
    this.activeTab = tab;
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isUpdatingProfile = true;

    // TODO: Call API to update profile
    setTimeout(() => {
      this.isUpdatingProfile = false;
      alert('Profile updated successfully!');
    }, 1500);
  }

  updateShipping(): void {
    if (this.shippingForm.invalid) {
      this.markFormGroupTouched(this.shippingForm);
      return;
    }

    this.isUpdatingShipping = true;

    // TODO: Call API to update shipping address
    setTimeout(() => {
      this.isUpdatingShipping = false;
      alert('Shipping address updated successfully!');
    }, 1500);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isChangingPassword = true;

    // TODO: Call API to change password
    setTimeout(() => {
      this.isChangingPassword = false;
      this.passwordForm.reset();
      alert('Password changed successfully!');
    }, 1500);
  }

  updatePreferences(): void {
    this.isUpdatingPreferences = true;

    // TODO: Call API to update preferences
    setTimeout(() => {
      this.isUpdatingPreferences = false;
      alert('Preferences updated successfully!');
    }, 1500);
  }

  requestAccountDeletion(): void {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.'
    );

    if (confirmed) {
      const finalConfirm = confirm(
        'This is your final warning. Deleting your account will remove all orders, favorites, and personal information. Are you absolutely sure?'
      );

      if (finalConfirm) {
        // TODO: Implement account deletion
        alert('Account deletion request submitted. You will receive a confirmation email shortly.');
      }
    }
  }

  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private loadUserProfile(): void {
    // TODO: Load user profile data from API
    // For now, we'll set some sample data
    this.profileForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567'
    });

    this.shippingForm.patchValue({
      address: '123 Main St',
      apartment: 'Apt 2B',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701'
    });
  }
}