import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SettingsService, ShopProfile, OwnerContact, OwnerAddress } from '../../../../services/settings.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

interface StoreBasicInfo {
  storeName: string;
  description?: string;
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    showPublicly: boolean;
  };
  lastUpdated: Date;
}


// Legacy API interface for compatibility
interface LegacyShopProfile {
  ShopName: string;
  ShopDescription?: string;
  ShopPhone?: string;
  ShopEmail?: string;
  ShopWebsite?: string;
  ShopAddress1?: string;
  ShopAddress2?: string;
  ShopCity?: string;
  ShopState?: string;
  ShopZip?: string;
  ShopCountry?: string;
  ShopTimezone?: string;
}

@Component({
  selector: 'app-store-profile-basic-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './store-profile-basic-info-template.component.html',
  styleUrls: ['./store-profile-basic-info.component.scss']
})
export class StoreProfileBasicInfoComponent implements OnInit, OnDestroy {
  basicInfoForm!: FormGroup;
  successMessage = signal('');
  errorMessage = signal('');
  ownerContact: OwnerContact | null = null;
  useOwnerContact = false;
  ownerAddress: OwnerAddress | null = null;
  useOwnerAddress = false;
  private subscriptions = new Subscription();

  // Profile signal - initialized in ngOnInit
  profile = signal<ShopProfile | null>(null);

  // Auto-save status computed from form state
  autoSaveStatus = computed(() => {
    const profile = this.profile();
    return profile ? 'Saved automatically' : 'Loading...';
  });

  states = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.setupProfileSubscription();
    this.loadProfile();
    this.loadOwnerContact();
    this.loadOwnerAddress();
    this.setupFormChangeListeners();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private setupProfileSubscription() {
    // Subscribe to profile changes from settings service
    this.subscriptions.add(
      this.settingsService.profile.subscribe(profile => {
        this.profile.set(profile);
        if (profile) {
          this.updateFormFromProfile(profile);
        }
      })
    );
  }

  private initializeForm() {
    this.basicInfoForm = this.fb.group({
      storeName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      website: ['', [this.urlValidator]],
      contact: this.fb.group({
        phone: ['', [Validators.required, this.phoneValidator]],
        email: ['', [Validators.required, Validators.email]]
      }),
      address: this.fb.group({
        street1: ['', [Validators.required]],
        street2: [''],
        city: ['', [Validators.required]],
        state: ['', [Validators.required]],
        zipCode: ['', [Validators.required, this.zipCodeValidator]],
        showPublicly: [true]
      })
    });
  }

  private phoneValidator(control: any) {
    if (!control.value) return null;
    // Simple US phone number pattern
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(control.value) ? null : { pattern: true };
  }

  private urlValidator(control: any) {
    if (!control.value) return null;
    try {
      new URL(control.value);
      return null;
    } catch {
      return { pattern: true };
    }
  }

  private zipCodeValidator(control: any) {
    if (!control.value) return null;
    // US ZIP code pattern (5 digits or 5+4)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(control.value) ? null : { pattern: true };
  }

  getCharacterCount(fieldName: string): number {
    const value = this.basicInfoForm.get(fieldName)?.value || '';
    return value.length;
  }

  private setupFormChangeListeners() {
    // Listen to form changes and update settings service
    this.subscriptions.add(
      this.basicInfoForm.get('storeName')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopName) {
          this.settingsService.updateProfileSetting('shopName', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('description')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopDescription) {
          this.settingsService.updateProfileSetting('shopDescription', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('website')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopWebsite) {
          this.settingsService.updateProfileSetting('shopWebsite', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('contact.phone')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopPhone) {
          this.settingsService.updateProfileSetting('shopPhone', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('contact.email')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopEmail) {
          this.settingsService.updateProfileSetting('shopEmail', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('address.street1')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopAddress1) {
          this.settingsService.updateProfileSetting('shopAddress1', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('address.street2')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopAddress2) {
          this.settingsService.updateProfileSetting('shopAddress2', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('address.city')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopCity) {
          this.settingsService.updateProfileSetting('shopCity', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('address.state')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopState) {
          this.settingsService.updateProfileSetting('shopState', value);
        }
      })
    );

    this.subscriptions.add(
      this.basicInfoForm.get('address.zipCode')?.valueChanges.subscribe(value => {
        if (value !== this.profile()?.shopZip) {
          this.settingsService.updateProfileSetting('shopZip', value);
        }
      })
    );

    // Profile changes are handled in setupProfileSubscription
  }

  private updateFormFromProfile(profile: ShopProfile) {
    // Update form without triggering change events
    this.basicInfoForm.patchValue({
      storeName: profile.shopName,
      description: profile.shopDescription,
      website: profile.shopWebsite,
      contact: {
        phone: profile.shopPhone,
        email: profile.shopEmail
      },
      address: {
        street1: profile.shopAddress1,
        street2: profile.shopAddress2,
        city: profile.shopCity,
        state: profile.shopState,
        zipCode: profile.shopZip,
        showPublicly: true // Default since not in API
      }
    }, { emitEvent: false }); // Don't emit events to prevent loops
  }

  async loadProfile() {
    try {
      // Load profile through settings service
      await this.settingsService.loadProfile();
    } catch (error) {
      console.error('Error loading profile:', error);
      this.showError('Failed to load profile information');
    }
  }


  async loadOwnerContact() {
    try {
      this.ownerContact = await this.settingsService.loadOwnerContact();
      console.log('Loaded owner contact:', this.ownerContact);
    } catch (error) {
      console.error('Error loading owner contact:', error);
      this.showError('Failed to load owner contact information');
    }
  }

  async loadOwnerAddress() {
    try {
      this.ownerAddress = await this.settingsService.loadOwnerAddress();
      console.log('Loaded owner address:', this.ownerAddress);

      // If useOwnerAddress is true by default, populate the form immediately
      if (this.useOwnerAddress && this.ownerAddress) {
        this.populateAddressFields();
      }
    } catch (error) {
      console.error('Error loading owner address:', error);
      this.showError('Failed to load owner address information');
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX if it's a 10-digit US number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Return original if not a standard 10-digit format
    return phone;
  }

  private populateContactFields() {
    if (this.ownerContact) {
      this.basicInfoForm.patchValue({
        contact: {
          phone: this.formatPhoneNumber(this.ownerContact.phone || ''),
          email: this.ownerContact.email
        }
      }); // Keep emitEvent: true so the data gets saved to settings
    }
  }

  onUseOwnerContactChange() {
    const phoneControl = this.basicInfoForm.get('contact.phone');
    const emailControl = this.basicInfoForm.get('contact.email');

    if (this.useOwnerContact) {
      // Disable fields and populate with owner contact info
      phoneControl?.disable();
      emailControl?.disable();
      this.populateContactFields(); // This will trigger save to settings
    } else {
      // Enable fields for user input
      phoneControl?.enable();
      emailControl?.enable();
    }
  }

  private populateAddressFields() {
    if (this.ownerAddress) {
      this.basicInfoForm.patchValue({
        address: {
          street1: this.ownerAddress.shopAddress1 || '',
          street2: this.ownerAddress.shopAddress2 || '',
          city: this.ownerAddress.shopCity || '',
          state: this.ownerAddress.shopState || '',
          zipCode: this.ownerAddress.shopZip || ''
        }
      }, { emitEvent: false }); // Don't emit events to prevent unnecessary API calls
    }
  }

  onUseOwnerAddressChange() {
    const address1Control = this.basicInfoForm.get('address.street1');
    const address2Control = this.basicInfoForm.get('address.street2');
    const cityControl = this.basicInfoForm.get('address.city');
    const stateControl = this.basicInfoForm.get('address.state');
    const zipControl = this.basicInfoForm.get('address.zipCode');

    if (this.useOwnerAddress) {
      // Disable fields and populate with owner address info
      address1Control?.disable();
      address2Control?.disable();
      cityControl?.disable();
      stateControl?.disable();
      zipControl?.disable();
      this.populateAddressFields();
    } else {
      // Enable fields for user input
      address1Control?.enable();
      address2Control?.enable();
      cityControl?.enable();
      stateControl?.enable();
      zipControl?.enable();
    }
  }

  onPreview() {
    // TODO: Implement preview functionality
    this.showSuccess('Preview functionality will be implemented in a future update');
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}