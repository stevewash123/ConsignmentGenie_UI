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
  styleUrls: ['./account-settings.component.scss']
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