import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

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

interface OwnerContact {
  name: string;
  email: string;
  phone?: string;
}

// Legacy API interface for compatibility
interface ShopProfile {
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
  template: `
    <div class="basic-info-section">
      <header class="section-header">
        <h2>Basic Information</h2>
        <p>Essential details about your store and how customers can reach you</p>
      </header>

      <form [formGroup]="basicInfoForm" (ngSubmit)="onSave()" class="basic-info-form">

        <!-- Store Identity -->
        <section class="form-section">
          <h3>Store Identity</h3>

          <div class="form-group">
            <label for="storeName">Store Name *</label>
            <input
              id="storeName"
              type="text"
              formControlName="storeName"
              class="form-input"
              placeholder="Your Store Name"
              maxlength="100">
            <div class="char-count">{{ getCharacterCount('storeName') }}/100</div>
            <div *ngIf="basicInfoForm.get('storeName')?.invalid && basicInfoForm.get('storeName')?.touched"
                 class="field-error">
              <div *ngIf="basicInfoForm.get('storeName')?.hasError('required')">Store name is required</div>
              <div *ngIf="basicInfoForm.get('storeName')?.hasError('maxlength')">Store name cannot exceed 100 characters</div>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Store Description</label>
            <textarea
              id="description"
              formControlName="description"
              class="form-textarea"
              placeholder="Brief description of your store and what you offer..."
              rows="4"
              maxlength="500"></textarea>
            <div class="char-count">{{ getCharacterCount('description') }}/500</div>
          </div>

          <div class="form-group">
            <label for="website">Website</label>
            <input
              id="website"
              type="url"
              formControlName="website"
              class="form-input"
              placeholder="https://www.yourstore.com">
            <div *ngIf="basicInfoForm.get('website')?.invalid && basicInfoForm.get('website')?.touched"
                 class="field-error">
              <div *ngIf="basicInfoForm.get('website')?.hasError('pattern')">Please enter a valid website URL</div>
            </div>
            <div class="help-text">Include https:// for full website URLs</div>
          </div>
        </section>

        <!-- Store Contact Information & Address -->
        <section class="form-section" formGroupName="contact">
          <h3>Store Contact Information & Address</h3>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="useOwnerContact"
                (change)="onUseOwnerContactChange()"
                [ngModelOptions]="{standalone: true}"
                class="checkbox-input">
              <span class="checkbox-text">Use Owner's Contact Information</span>
            </label>
            <div class="help-text" *ngIf="ownerContact">
              Owner: {{ ownerContact.name }} ({{ ownerContact.email }})
              <span *ngIf="ownerContact.phone"> • {{ ownerContact.phone }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                class="form-input"
                placeholder="(555) 123-4567">
              <div *ngIf="basicInfoForm.get('contact.phone')?.invalid && basicInfoForm.get('contact.phone')?.touched"
                   class="field-error">
                <div *ngIf="basicInfoForm.get('contact.phone')?.hasError('required')">Phone number is required</div>
                <div *ngIf="basicInfoForm.get('contact.phone')?.hasError('pattern')">Please enter a valid phone number</div>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email Address *</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                placeholder="info@yourstore.com">
              <div *ngIf="basicInfoForm.get('contact.email')?.invalid && basicInfoForm.get('contact.email')?.touched"
                   class="field-error">
                <div *ngIf="basicInfoForm.get('contact.email')?.hasError('required')">Email address is required</div>
                <div *ngIf="basicInfoForm.get('contact.email')?.hasError('email')">Please enter a valid email address</div>
              </div>
            </div>
          </div>

        </section>

        <section class="form-section" formGroupName="address">
          <div class="form-group">
            <label for="street1">Street Address *</label>
            <input
              id="street1"
              type="text"
              formControlName="street1"
              class="form-input"
              placeholder="123 Main Street">
            <div *ngIf="basicInfoForm.get('address.street1')?.invalid && basicInfoForm.get('address.street1')?.touched"
                 class="field-error">
              <div *ngIf="basicInfoForm.get('address.street1')?.hasError('required')">Street address is required</div>
            </div>
          </div>

          <div class="form-group">
            <label for="street2">Address Line 2</label>
            <input
              id="street2"
              type="text"
              formControlName="street2"
              class="form-input"
              placeholder="Suite 100">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="city">City *</label>
              <input
                id="city"
                type="text"
                formControlName="city"
                class="form-input"
                placeholder="City">
              <div *ngIf="basicInfoForm.get('address.city')?.invalid && basicInfoForm.get('address.city')?.touched"
                   class="field-error">
                <div *ngIf="basicInfoForm.get('address.city')?.hasError('required')">City is required</div>
              </div>
            </div>

            <div class="form-group">
              <label for="state">State *</label>
              <select
                id="state"
                formControlName="state"
                class="form-select">
                <option value="">Select State</option>
                <option *ngFor="let state of states" [value]="state.code">{{ state.name }}</option>
              </select>
              <div *ngIf="basicInfoForm.get('address.state')?.invalid && basicInfoForm.get('address.state')?.touched"
                   class="field-error">
                <div *ngIf="basicInfoForm.get('address.state')?.hasError('required')">State is required</div>
              </div>
            </div>

            <div class="form-group">
              <label for="zipCode">ZIP Code *</label>
              <input
                id="zipCode"
                type="text"
                formControlName="zipCode"
                class="form-input"
                placeholder="12345">
              <div *ngIf="basicInfoForm.get('address.zipCode')?.invalid && basicInfoForm.get('address.zipCode')?.touched"
                   class="field-error">
                <div *ngIf="basicInfoForm.get('address.zipCode')?.hasError('required')">ZIP code is required</div>
                <div *ngIf="basicInfoForm.get('address.zipCode')?.hasError('pattern')">Please enter a valid ZIP code</div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                formControlName="showPublicly"
                class="checkbox-input">
              <span class="checkbox-text">Show address to customers publicly</span>
            </label>
            <div class="help-text">Uncheck if you operate from home or prefer privacy</div>
          </div>
        </section>

        <div class="form-actions">
          <button
            type="button"
            (click)="onPreview()"
            class="btn-secondary"
            [disabled]="saving()">
            Preview Customer View
          </button>
          <button
            type="submit"
            [disabled]="!basicInfoForm.valid || saving()"
            class="btn-primary">
            {{ saving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>

      <!-- Messages -->
      <div class="messages" *ngIf="successMessage() || errorMessage()">
        <div *ngIf="successMessage()" class="message success">{{ successMessage() }}</div>
        <div *ngIf="errorMessage()" class="message error">{{ errorMessage() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .basic-info-section {
      padding: 2rem;
      max-width: 800px;
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .section-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .basic-info-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .form-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-row.three-col {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font-weight: 500;
      color: #374151;
    }

    .checkbox-input {
      margin: 0;
    }

    .char-count {
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
      margin-top: 0.25rem;
    }

    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .field-error {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .form-input, .form-textarea, .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.ng-invalid.ng-touched, .form-textarea.ng-invalid.ng-touched, .form-select.ng-invalid.ng-touched {
      border-color: #dc2626;
    }

    .form-input:disabled, .form-textarea:disabled, .form-select:disabled {
      background-color: #f9fafb;
      color: #6b7280;
      border-color: #d1d5db;
      cursor: not-allowed;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .messages {
      margin-top: 1rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .message.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .message.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .basic-info-section {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
    }
  `]
})
export class StoreProfileBasicInfoComponent implements OnInit {
  basicInfoForm!: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  ownerContact: OwnerContact | null = null;
  useOwnerContact = true;

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
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadProfile();
    this.loadOwnerContact();
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

    // Set initial disabled state for contact fields since useOwnerContact defaults to true
    this.basicInfoForm.get('contact.phone')?.disable();
    this.basicInfoForm.get('contact.email')?.disable();
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

  async loadProfile() {
    try {
      const response = await this.http.get<ShopProfile>(`${environment.apiUrl}/api/organization/profile`).toPromise();
      if (response) {
        this.populateForm(response);
      }
    } catch (error) {
      console.error('Error loading shop profile:', error);
      this.showError('Failed to load shop profile');
    }
  }

  private populateForm(profile: ShopProfile) {
    this.basicInfoForm.patchValue({
      storeName: profile.ShopName || '',
      description: profile.ShopDescription || '',
      website: profile.ShopWebsite || '',
      contact: {
        phone: profile.ShopPhone || '',
        email: profile.ShopEmail || ''
      },
      address: {
        street1: profile.ShopAddress1 || '',
        street2: profile.ShopAddress2 || '',
        city: profile.ShopCity || '',
        state: profile.ShopState || '',
        zipCode: profile.ShopZip || '',
        showPublicly: true // Default to true as this field doesn't exist in legacy API
      }
    });
  }

  async onSave() {
    if (!this.basicInfoForm.valid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const formValue = this.basicInfoForm.value;

      // Convert to legacy API format
      const profileData: Partial<ShopProfile> = {
        ShopName: formValue.storeName,
        ShopDescription: formValue.description,
        ShopWebsite: formValue.website,
        ShopPhone: formValue.contact.phone,
        ShopEmail: formValue.contact.email,
        ShopAddress1: formValue.address.street1,
        ShopAddress2: formValue.address.street2,
        ShopCity: formValue.address.city,
        ShopState: formValue.address.state,
        ShopZip: formValue.address.zipCode
      };

      await this.http.put(`${environment.apiUrl}/api/organization/profile`, profileData).toPromise();
      this.showSuccess('Basic information saved successfully');
    } catch (error) {
      console.error('Error saving basic info:', error);
      this.showError('Failed to save basic information');
    } finally {
      this.saving.set(false);
    }
  }

  async loadOwnerContact() {
    try {
      const response = await this.http.get<any>(`${environment.apiUrl}/api/account/information`).toPromise();
      if (response?.organization?.primaryContact) {
        this.ownerContact = {
          name: response.organization.primaryContact.name,
          email: response.organization.primaryContact.email,
          phone: response.organization.primaryContact.phone
        };

        // Since useOwnerContact defaults to true, populate contact fields
        if (this.useOwnerContact) {
          this.onUseOwnerContactChange();
        }
      }
    } catch (error) {
      console.error('Error loading owner contact:', error);
    }
  }

  onUseOwnerContactChange() {
    const phoneControl = this.basicInfoForm.get('contact.phone');
    const emailControl = this.basicInfoForm.get('contact.email');

    if (this.useOwnerContact) {
      // Disable fields and populate with owner contact info
      phoneControl?.disable();
      emailControl?.disable();

      if (this.ownerContact) {
        this.basicInfoForm.patchValue({
          contact: {
            phone: this.ownerContact.phone || '',
            email: this.ownerContact.email
          }
        });
      }
    } else {
      // Enable fields for user input
      phoneControl?.enable();
      emailControl?.enable();
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