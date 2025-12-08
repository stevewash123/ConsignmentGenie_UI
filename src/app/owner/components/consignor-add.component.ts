import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ConsignorService } from '../../services/consignor.service';
import { CreateConsignorRequest } from '../../models/consignor.model';

@Component({
  selector: 'app-consignor-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './consignor-add.component.html',
  styles: [`
    .consignor-add-container {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .add-header {
      margin-bottom: 2rem;
    }

    .breadcrumb a {
      color: #007bff;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .add-header h1 {
      margin: 0.5rem 0;
      color: #212529;
    }

    .subtitle {
      color: #6c757d;
      margin-bottom: 0;
    }

    .add-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e9ecef;
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    .form-section h3 {
      margin-bottom: 1.5rem;
      color: #212529;
      font-size: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #212529;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    .form-control:focus {
      border-color: #007bff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .form-text {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e9ecef;
    }

    .btn-primary, .btn-secondary, .btn-outline {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      font-size: 1rem;
      transition: all 0.15s ease-in-out;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn-outline {
      background: transparent;
      color: #007bff;
      border: 1px solid #007bff;
    }

    .btn-outline:hover {
      background: #007bff;
      color: white;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .success-message {
      color: #28a745;
      font-size: 0.875rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
    }

    .alternative-note {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #e7f3ff;
      border: 1px solid #b8daff;
      border-radius: 4px;
    }

    .alternative-note h4 {
      margin-bottom: 0.5rem;
      color: #004085;
    }

    .alternative-note p {
      margin-bottom: 1rem;
      color: #004085;
    }
  `]
})
export class ConsignorAddComponent {
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  providerData: CreateConsignorRequest = {
    name: '',
    email: '',
    phone: '',
    address: '',
    commissionRate: 50,
    preferredPaymentMethod: '',
    paymentDetails: '',
    notes: ''
  };

  constructor(
    private ConsignorService: ConsignorService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Clean up undefined values
    const request: CreateConsignorRequest = {
      name: this.providerData.name,
      email: this.providerData.email,
      phone: this.providerData.phone || undefined,
      address: this.providerData.address || undefined,
      commissionRate: this.providerData.commissionRate,
      preferredPaymentMethod: this.providerData.preferredPaymentMethod || undefined,
      paymentDetails: this.providerData.paymentDetails || undefined,
      notes: this.providerData.notes || undefined
    };

    this.ConsignorService.createConsignor(request).subscribe({
      next: (created) => {
        this.successMessage.set('consignor created successfully!');
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/owner/consignors', created.id]);
        }, 2000);
      },
      error: (error) => {
        console.error('Error creating consignor:', error);
        const errorMsg = error.error?.message || 'Failed to create consignor. Please try again.';
        this.errorMessage.set(errorMsg);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}