import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface OwnerContactInfo {
  businessName: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

@Component({
  selector: 'app-owner-contact-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-contact-info.component.html',
  styles: [`
    .owner-contact-info {
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

    .form-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input, .form-textarea {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error, .form-textarea.error {
      border-color: #dc2626;
    }

    .form-error {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
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

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      margin-bottom: 1.5rem;
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

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .owner-contact-info {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class OwnerContactInfoComponent implements OnInit {
  contactForm!: FormGroup;

  isLoading = signal(true);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadContactInfo();
  }

  private initializeForm() {
    this.contactForm = this.fb.group({
      businessName: ['', [Validators.required]],
      ownerName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]]
    });
  }

  async loadContactInfo() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // TODO: Replace with actual API call
      // const response = await this.http.get<OwnerContactInfo>(`${environment.apiUrl}/api/owner/contact-info`).toPromise();

      // Mock data for now
      setTimeout(() => {
        const mockContactInfo: OwnerContactInfo = {
          businessName: "Sarah's Consignment Gallery",
          ownerName: "Sarah Johnson",
          email: "sarah@example.com",
          phoneNumber: "(555) 123-4567",
          address: {
            street: "123 Main Street",
            city: "Portland",
            state: "OR",
            zipCode: "97201"
          }
        };

        this.contactForm.patchValue({
          businessName: mockContactInfo.businessName,
          ownerName: mockContactInfo.ownerName,
          email: mockContactInfo.email,
          phoneNumber: mockContactInfo.phoneNumber,
          street: mockContactInfo.address.street,
          city: mockContactInfo.address.city,
          state: mockContactInfo.address.state,
          zipCode: mockContactInfo.address.zipCode
        });

        this.isLoading.set(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load contact info:', error);
      this.errorMessage.set('Failed to load contact information. Please try again.');
      this.isLoading.set(false);
    }
  }

  async saveContactInfo() {
    if (!this.contactForm.valid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      const formData = this.contactForm.value;
      const contactInfo: OwnerContactInfo = {
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      };

      // TODO: Replace with actual API call
      // const response = await this.http.put<OwnerContactInfo>(`${environment.apiUrl}/api/owner/contact-info`, contactInfo).toPromise();

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.showSuccess('Contact information updated successfully');
    } catch (error) {
      console.error('Failed to save contact info:', error);
      this.showError('Failed to update contact information. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  resetForm() {
    this.loadContactInfo();
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.contactForm.controls).forEach(key => {
      this.contactForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      businessName: 'Business name',
      ownerName: 'Owner name',
      email: 'Email',
      phoneNumber: 'Phone number',
      street: 'Street address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP code'
    };
    return labels[fieldName] || fieldName;
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