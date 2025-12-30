import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface StoreBasicInfo {
  ShopName: string;
  ShopDescription?: string;
  ShopPhone: string;
  ShopEmail: string;
  ShopWebsite?: string;
  ShopAddress1: string;
  ShopAddress2?: string;
  ShopCity: string;
  ShopState: string;
  ShopZip: string;
  showAddressPublicly?: boolean;
}

@Component({
  selector: 'app-basic-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './basic-info.component.html',
  styles: [`
    .basic-info-section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #111827;
    }

    .section-description {
      color: #6b7280;
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .form-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
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
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .required::after {
      content: ' *';
      color: #dc2626;
    }

    .form-input, .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border-color: #dc2626;
    }

    .char-count {
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
      margin-top: 0.25rem;
    }

    .error-message {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.25rem;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #374151;
      font-weight: 400;
    }

    .checkbox-label input[type="checkbox"] {
      margin: 0;
      width: 1rem;
      height: 1rem;
    }

    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-left: 1.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
      margin-top: 2rem;
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
      margin-top: 1rem;
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
      }
    }
  `]
})
export class BasicInfoComponent implements OnInit {
  basicInfoForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadBasicInfo();
  }

  private initializeForm(): void {
    this.basicInfoForm = this.fb.group({
      ShopName: ['', [Validators.required, Validators.maxLength(100)]],
      ShopDescription: ['', [Validators.maxLength(500)]],
      ShopPhone: ['', [Validators.required]],
      ShopEmail: ['', [Validators.required, Validators.email]],
      ShopWebsite: [''],
      ShopAddress1: ['', [Validators.required]],
      ShopAddress2: [''],
      ShopCity: ['', [Validators.required]],
      ShopState: ['', [Validators.required]],
      ShopZip: ['', [Validators.required]],
      showAddressPublicly: [true]
    });
  }

  async loadBasicInfo(): Promise<void> {
    this.isLoading.set(true);
    try {
      const profile = await this.http.get<StoreBasicInfo>(`${environment.apiUrl}/api/organization/profile`).toPromise();
      if (profile) {
        this.basicInfoForm.patchValue(profile);
      }
    } catch (error) {
      this.showError('Failed to load store information');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveBasicInfo(): Promise<void> {
    if (!this.basicInfoForm.valid) {
      this.markFormGroupTouched(this.basicInfoForm);
      return;
    }

    this.isSaving.set(true);
    try {
      const formData = this.basicInfoForm.value;
      await this.http.put(`${environment.apiUrl}/api/organization/profile`, formData).toPromise();
      this.showSuccess('Store information saved successfully');
    } catch (error) {
      this.showError('Failed to save store information');
    } finally {
      this.isSaving.set(false);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.basicInfoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.basicInfoForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName.replace('Shop', '')} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
    }
    return '';
  }

  getCharacterCount(fieldName: string): number {
    return this.basicInfoForm.get(fieldName)?.value?.length || 0;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
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