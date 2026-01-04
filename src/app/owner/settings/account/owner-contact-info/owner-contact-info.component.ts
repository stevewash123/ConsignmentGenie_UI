import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OwnerService } from '../../../../services/owner.service';

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
  styleUrls: ['./owner-contact-info.component.scss']
})
export class OwnerContactInfoComponent implements OnInit {
  contactForm!: FormGroup;

  isLoading = signal(true);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private ownerService: OwnerService
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
      // TODO: Replace with actual service call
      // const response = await this.ownerService.getContactInfo().toPromise();

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

      // TODO: Replace with actual service call
      // const response = await this.ownerService.updateContactInfo(contactInfo).toPromise();

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