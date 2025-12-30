import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ConsignorService } from '../../services/consignor.service';
import { Consignor, UpdateConsignorRequest, ConsignorStatus } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-consignor-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './consignor-edit.component.html',
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

    /* Commission Override Styles */
    .checkbox-wrapper {
      margin-bottom: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
      color: #495057;
      margin-bottom: 0;
    }

    .checkbox-label input[type="checkbox"] {
      margin: 0;
    }

    .form-control.readonly {
      background-color: #f8f9fa;
      color: #6c757d;
      cursor: not-allowed;
    }

    .commission-hint {
      display: block;
      margin-top: 0.25rem;
      font-style: italic;
      color: #6c757d;
    }

    .commission-hint.override {
      color: #fd7e14;
      font-weight: 500;
    }
  `]
})
export class ConsignorEditComponent implements OnInit {
  providerId = signal<string>('');
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Commission override functionality
  defaultCommissionRate = 50; // TODO: Get from shop settings
  useDefaultCommissionRate = true;

  editData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    commissionRate: 50,
    preferredPaymentMethod: '',
    paymentDetails: '',
    notes: '',
    isActive: true,
    status: 'active' as ConsignorStatus
  };

  // Status options for dropdown
  statusOptions = [
    { value: 'active', label: 'Active', description: 'Can consign items' },
    { value: 'invited', label: 'Invited', description: 'Invitation sent, awaiting registration' },
    { value: 'pending', label: 'Pending Approval', description: 'Registered, awaiting approval' },
    { value: 'inactive', label: 'Inactive', description: 'Cannot consign items' },
    { value: 'suspended', label: 'Suspended', description: 'Temporarily blocked' }
  ];

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
      this.providerId.set(id);
      this.loadProvider();
    }
  }

  loadProvider(): void {
    this.loadingService.start('consignor-edit');
    this.ConsignorService.getConsignor(this.providerId()).subscribe({
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

  populateEditData(consignor: Consignor): void {
    this.editData = {
      name: consignor.name,
      email: consignor.email,
      phone: consignor.phone || '',
      address: consignor.address || '',
      commissionRate: consignor.commissionRate,
      preferredPaymentMethod: consignor.preferredPaymentMethod || '',
      paymentDetails: consignor.paymentDetails || '',
      notes: consignor.notes || '',
      isActive: consignor.isActive,
      status: consignor.status
    };

    // Determine if using default commission rate
    this.useDefaultCommissionRate = consignor.commissionRate === this.defaultCommissionRate;
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const updateRequest: UpdateConsignorRequest = {
      name: this.editData.name,
      email: this.editData.email,
      phone: this.editData.phone || undefined,
      address: this.editData.address || undefined,
      commissionRate: this.editData.commissionRate,
      preferredPaymentMethod: this.editData.preferredPaymentMethod || undefined,
      paymentDetails: this.editData.paymentDetails || undefined,
      notes: this.editData.notes || undefined,
      isActive: this.editData.isActive,
      status: this.editData.status
    };

    this.ConsignorService.updateConsignor(this.providerId(), updateRequest).subscribe({
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

  // Commission override methods
  onUseDefaultCommissionChange(): void {
    if (this.useDefaultCommissionRate) {
      this.editData.commissionRate = this.defaultCommissionRate;
    }
  }

  isUsingCustomCommissionRate(): boolean {
    return !this.useDefaultCommissionRate;
  }

  getCommissionRateHint(): string {
    if (this.useDefaultCommissionRate) {
      return `Using shop default (${this.defaultCommissionRate}%)`;
    }
    return 'Custom override rate';
  }

  getStatusDescription(): string {
    const selectedOption = this.statusOptions.find(option => option.value === this.editData.status);
    return selectedOption?.description || '';
  }
}