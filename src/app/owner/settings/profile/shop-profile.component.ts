import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ShopProfile {
  ShopName: string;
  ShopDescription?: string;
  ShopLogoUrl?: string;
  ShopBannerUrl?: string;
  ShopPhone?: string;
  ShopEmail?: string;
  ShopWebsite?: string;
  ShopAddress1?: string;
  ShopAddress2?: string;
  ShopCity?: string;
  ShopState?: string;
  ShopZip?: string;
  ShopCountry: string;
  ShopTimezone: string;
}

@Component({
  selector: 'app-shop-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shop-profile">
      <div class="settings-header">
        <h2>Shop Profile</h2>
        <p>Configure your shop's public information and contact details</p>
      </div>

      <form (ngSubmit)="saveProfile()" class="profile-form" *ngIf="profile()">
        <!-- Shop Logo -->
        <div class="form-section">
          <h3>Shop Logo</h3>
          <div class="logo-upload">
            <div class="logo-preview">
              <img *ngIf="profile()?.ShopLogoUrl" [src]="profile()?.ShopLogoUrl" alt="Shop Logo" />
              <div *ngIf="!profile()?.ShopLogoUrl" class="logo-placeholder">
                <span>LOGO</span>
              </div>
            </div>
            <div class="logo-actions">
              <input
                type="file"
                #logoInput
                (change)="onLogoSelect($event)"
                accept="image/png,image/jpeg,image/jpg"
                style="display: none;">
              <button type="button" class="btn-secondary" (click)="logoInput.click()">Upload Logo</button>
              <button
                *ngIf="profile()?.ShopLogoUrl"
                type="button"
                class="btn-danger-outline"
                (click)="removeLogo()">
                Remove
              </button>
              <div class="upload-hint">Recommended: 200x200px, PNG/JPG</div>
            </div>
          </div>
        </div>

        <!-- Shop Name & Description -->
        <div class="form-section">
          <div class="form-group">
            <label for="shopName">Shop Name *</label>
            <input
              type="text"
              id="shopName"
              [(ngModel)]="profile()!.ShopName"
              name="shopName"
              class="form-input"
              placeholder="Your shop name"
              required>
          </div>

          <div class="form-group">
            <label for="shopDescription">Shop Description</label>
            <textarea
              id="shopDescription"
              [(ngModel)]="profile()!.ShopDescription"
              name="shopDescription"
              class="form-textarea"
              placeholder="A brief description of your shop..."
              rows="3"></textarea>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="form-section">
          <h3>Contact Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                [(ngModel)]="profile()!.ShopPhone"
                name="phone"
                class="form-input"
                placeholder="(555) 123-4567">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="profile()!.ShopEmail"
                name="email"
                class="form-input"
                placeholder="info@yourshop.com">
            </div>
          </div>

          <div class="form-group">
            <label for="website">Website</label>
            <input
              type="url"
              id="website"
              [(ngModel)]="profile()!.ShopWebsite"
              name="website"
              class="form-input"
              placeholder="https://yourshop.com">
          </div>
        </div>

        <!-- Address -->
        <div class="form-section">
          <h3>Address</h3>
          <div class="form-group">
            <label for="street">Street Address *</label>
            <input
              type="text"
              id="street"
              [(ngModel)]="profile()!.ShopAddress1"
              name="street"
              class="form-input"
              placeholder="123 Main Street"
              required>
          </div>

          <div class="form-group">
            <label for="street2">Address Line 2</label>
            <input
              type="text"
              id="street2"
              [(ngModel)]="profile()!.ShopAddress2"
              name="street2"
              class="form-input"
              placeholder="Suite 100, Building A, etc.">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="city">City *</label>
              <input
                type="text"
                id="city"
                [(ngModel)]="profile()!.ShopCity"
                name="city"
                class="form-input"
                placeholder="Austin"
                required>
            </div>
            <div class="form-group">
              <label for="state">State *</label>
              <select
                id="state"
                [(ngModel)]="profile()!.ShopState"
                name="state"
                class="form-select"
                required>
                <option value="">Select State</option>
                <option *ngFor="let state of states" [value]="state.code">{{ state.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="zip">ZIP *</label>
              <input
                type="text"
                id="zip"
                [(ngModel)]="profile()!.ShopZip"
                name="zip"
                class="form-input"
                placeholder="78701"
                required>
            </div>
          </div>
        </div>

        <!-- Timezone -->
        <div class="form-section">
          <div class="form-group">
            <label for="timezone">Timezone *</label>
            <select
              id="timezone"
              [(ngModel)]="profile()!.ShopTimezone"
              name="timezone"
              class="form-select"
              required>
              <option value="">Select Timezone</option>
              <option *ngFor="let tz of timezones" [value]="tz.value">{{ tz.label }}</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="loadProfile()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="isSaving()">
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
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
    .shop-profile {
      padding: 2rem;
      max-width: 800px;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .settings-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .settings-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .profile-form {
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

    /* Logo Upload */
    .logo-upload {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .logo-preview {
      width: 120px;
      height: 120px;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #f9fafb;
    }

    .logo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-placeholder {
      color: #9ca3af;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .logo-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .upload-hint {
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
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

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-danger-outline {
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

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger-outline {
      background: white;
      color: #dc2626;
      border-color: #dc2626;
    }

    .btn-danger-outline:hover {
      background: #fef2f2;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Messages */
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
      .shop-profile {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .logo-upload {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .form-actions {
        flex-direction: column;
      }
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ShopProfileComponent implements OnInit {
  profile = signal<ShopProfile | null>(null);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

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

  timezones = [
    { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
    { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
    { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
    { value: 'America/Anchorage', label: 'America/Anchorage (Alaska Time)' },
    { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu (Hawaii Time)' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      const response = await this.http.get<ShopProfile>(`${environment.apiUrl}/api/organization/profile`).toPromise();
      if (response) {
        this.profile.set(response);
      }
    } catch (error) {
      console.error('Error loading shop profile:', error);
      this.showError('Failed to load shop profile');
    }
  }

  async saveProfile() {
    if (!this.profile()) return;

    this.isSaving.set(true);
    try {
      const response = await this.http.put(`${environment.apiUrl}/api/organization/profile`, this.profile()).toPromise();
      this.showSuccess('Shop profile saved successfully');
    } catch (error) {
      console.error('Error saving shop profile:', error);
      this.showError('Failed to save shop profile');
    } finally {
      this.isSaving.set(false);
    }
  }

  onLogoSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // TODO: Implement file upload
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.profile()) {
          this.profile.set({
            ...this.profile()!,
            ShopLogoUrl: e.target?.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    if (this.profile()) {
      this.profile.set({
        ...this.profile()!,
        ShopLogoUrl: undefined
      });
    }
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