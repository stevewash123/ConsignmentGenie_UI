import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfileService, ShopProfile } from '../../../../services/profile.service';
import { Subscription } from 'rxjs';
import { PhoneFormatter } from '../../../../shared/utils/phone-formatter.util';

@Component({
  selector: 'app-owner-contact-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './owner-contact-info.component.html',
  styleUrls: ['./owner-contact-info.component.scss']
})
export class OwnerContactInfoComponent implements OnInit, OnDestroy {
  profile = signal<ShopProfile | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  private subscriptions = new Subscription();

  // Auto-save status computed from profile state
  autoSaveStatus = computed(() => {
    const profile = this.profile();
    return profile ? 'Saved automatically' : 'Loading...';
  });

  constructor(
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadContactInfo();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions(): void {
    // Subscribe to profile changes from the service
    this.subscriptions.add(
      this.profileService.profile.subscribe(profile => {
        this.profile.set(profile);
      })
    );
  }

  async loadContactInfo(): Promise<void> {
    try {
      await this.profileService.loadProfile();
    } catch (error) {
      console.error('Error loading owner contact info:', error);
      this.showError('Failed to load contact information');
    }
  }

  // Individual field update methods - these trigger debounced saves
  onShopNameChange(value: string): void {
    this.profileService.updateProfileSetting('shopName', value);
  }

  onShopDescriptionChange(value: string): void {
    this.profileService.updateProfileSetting('shopDescription', value || null);
  }

  onShopEmailChange(value: string): void {
    this.profileService.updateProfileSetting('shopEmail', value || null);
  }

  onShopPhoneChange(event: Event): void {
    const formattedPhone = PhoneFormatter.handlePhoneInput(event);
    const rawValue = PhoneFormatter.getRawValue(formattedPhone);
    this.profileService.updateProfileSetting('shopPhone', rawValue || null);
  }

  onShopWebsiteChange(value: string): void {
    this.profileService.updateProfileSetting('shopWebsite', value || null);
  }

  onShopAddress1Change(value: string): void {
    this.profileService.updateProfileSetting('shopAddress1', value || null);
  }

  onShopAddress2Change(value: string): void {
    this.profileService.updateProfileSetting('shopAddress2', value || null);
  }

  onShopCityChange(value: string): void {
    this.profileService.updateProfileSetting('shopCity', value || null);
  }

  onShopStateChange(value: string): void {
    this.profileService.updateProfileSetting('shopState', value || null);
  }

  onShopZipChange(value: string): void {
    this.profileService.updateProfileSetting('shopZip', value || null);
  }

  onShopTimezoneChange(value: string): void {
    this.profileService.updateProfileSetting('shopTimezone', value);
  }

  getFormattedPhone(): string {
    const rawPhone = this.profile()?.shopPhone;
    return rawPhone ? PhoneFormatter.formatPhone(rawPhone) : '';
  }

  resetToDefaults(): void {
    // Reload from server to reset any pending changes
    this.loadContactInfo();
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}