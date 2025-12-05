import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ConsignorService } from '../services/consignor.service';
import { consignor, UpdateProviderRequest } from '../models/consignor.model';
import { LoadingService } from '../shared/services/loading.service';

@Component({
  selector: 'app-consignor-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  template: `
    <div class="consignor-edit-container">
      <div class="edit-header">
        <div class="breadcrumb">
          <a [routerLink]="['/owner/consignors', providerId()]">← Back to consignor</a>
        </div>
        <h1>Edit consignor</h1>
      </div>

      <div class="edit-card" *ngIf="!isProviderLoading(); else loading">
        <form (ngSubmit)="onSubmit()" #providerForm="ngForm">
          <div class="form-section">
            <h3>Basic Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="name">consignor Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  [(ngModel)]="editData.name"
                  required
                  #nameField="ngModel"
                  class="form-control"
                  [class.error]="nameField.invalid && nameField.touched"
                  placeholder="Enter consignor name"
                >
                <div class="error-message" *ngIf="nameField.invalid && nameField.touched">
                  consignor name is required
                </div>
              </div>

              <div class="form-group">
                <label for="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  [(ngModel)]="editData.email"
                  required
                  email
                  #emailField="ngModel"
                  class="form-control"
                  [class.error]="emailField.invalid && emailField.touched"
                  placeholder="Enter email address"
                >
                <div class="error-message" *ngIf="emailField.invalid && emailField.touched">
                  <span *ngIf="emailField.errors?.['required']">Email is required</span>
                  <span *ngIf="emailField.errors?.['email']">Please enter a valid email</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  [(ngModel)]="editData.phone"
                  class="form-control"
                  placeholder="(555) 123-4567"
                >
              </div>

              <div class="form-group">
                <label for="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  [(ngModel)]="editData.address"
                  class="form-control"
                  placeholder="Enter address"
                >
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Business Settings</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="commissionRate">Commission Rate (%) *</label>
                <input
                  type="number"
                  id="commissionRate"
                  name="commissionRate"
                  [(ngModel)]="editData.commissionRate"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  #commissionField="ngModel"
                  class="form-control"
                  [class.error]="commissionField.invalid && commissionField.touched"
                  placeholder="50.0"
                >
                <div class="error-message" *ngIf="commissionField.invalid && commissionField.touched">
                  <span *ngIf="commissionField.errors?.['required']">Commission rate is required</span>
                  <span *ngIf="commissionField.errors?.['min']">Rate must be 0 or higher</span>
                  <span *ngIf="commissionField.errors?.['max']">Rate must be 100 or lower</span>
                </div>
              </div>

              <div class="form-group">
                <label for="preferredPaymentMethod">Preferred Payment Method</label>
                <select
                  id="preferredPaymentMethod"
                  name="preferredPaymentMethod"
                  [(ngModel)]="editData.preferredPaymentMethod"
                  class="form-control"
                >
                  <option value="">Select payment method</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="paymentDetails">Payment Details</label>
              <textarea
                id="paymentDetails"
                name="paymentDetails"
                [(ngModel)]="editData.paymentDetails"
                class="form-control"
                rows="3"
                placeholder="Enter payment details (e.g., PayPal email, bank account info, mailing address)"
              ></textarea>
              <small class="form-text">This information is used for processing payouts</small>
            </div>
          </div>

          <div class="form-section">
            <h3>Additional Information</h3>
            <div class="form-group">
              <label for="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                [(ngModel)]="editData.notes"
                class="form-control"
                rows="4"
                placeholder="Add any additional notes about this consignor..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [(ngModel)]="editData.isActive"
                  name="isActive"
                >
                Active consignor
              </label>
              <small class="form-text">Inactive consignors cannot add new items or receive payouts</small>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" [routerLink]="['/owner/consignors', providerId()]">
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="providerForm.invalid || isSubmitting()"
            >
              {{ isSubmitting() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>

          <div class="success-message" *ngIf="successMessage()">
            {{ successMessage() }}
          </div>

          <div class="error-message" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>
        </form>
      </div>

      <ng-template #loading>
        <div class="loading">Loading consignor...</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .consignor-edit-container {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .edit-header {
      margin-bottom: 2rem;
    }

    .breadcrumb a {
      color: #007bff;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .edit-header h1 {
      margin: 0.5rem 0 0 0;
      color: #212529;
    }

    .edit-card {
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

    label input[type="checkbox"] {
      margin-right: 0.5rem;
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

    .btn-primary, .btn-secondary {
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

    .loading {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }
  `]
})
export class ProviderEditComponent implements OnInit {
  providerId = signal<number>(0);
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  editData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    commissionRate: 50,
    preferredPaymentMethod: '',
    paymentDetails: '',
    notes: '',
    isActive: true
  };

  isProviderLoading(): boolean {
    return this.loadingService.isLoading('consignor-edit');
  }

  constructor(
    private ConsignorService: ConsignorService,
    private route: ActivatedRoute,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.providerId.set(parseInt(id));
      this.loadProvider();
    }
  }

  loadProvider(): void {
    this.loadingService.start('consignor-edit');
    this.ConsignorService.getProvider(this.providerId()).subscribe({
      next: (consignor) => {
        this.populateEditData(consignor);
      },
      error: (error) => {
        console.error('Error loading consignor:', error);
        this.errorMessage.set('Failed to load consignor details');
      },
      complete: () => {
        this.loadingService.stop('consignor-edit');
      }
    });
  }

  populateEditData(consignor: consignor): void {
    this.editData = {
      name: consignor.name,
      email: consignor.email,
      phone: consignor.phone || '',
      address: consignor.address || '',
      commissionRate: consignor.commissionRate,
      preferredPaymentMethod: consignor.preferredPaymentMethod || '',
      paymentDetails: consignor.paymentDetails || '',
      notes: consignor.notes || '',
      isActive: consignor.isActive
    };
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const updateRequest: UpdateProviderRequest = {
      name: this.editData.name,
      email: this.editData.email,
      phone: this.editData.phone || undefined,
      address: this.editData.address || undefined,
      commissionRate: this.editData.commissionRate,
      preferredPaymentMethod: this.editData.preferredPaymentMethod || undefined,
      paymentDetails: this.editData.paymentDetails || undefined,
      notes: this.editData.notes || undefined,
      isActive: this.editData.isActive
    };

    this.ConsignorService.updateProvider(this.providerId(), updateRequest).subscribe({
      next: (updated) => {
        this.successMessage.set('consignor updated successfully!');
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/owner/consignors', this.providerId()]);
        }, 2000);
      },
      error: (error) => {
        console.error('Error updating consignor:', error);
        const errorMsg = error.error?.message || 'Failed to update consignor. Please try again.';
        this.errorMessage.set(errorMsg);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}