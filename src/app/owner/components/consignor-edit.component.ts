import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConsignorService } from '../../services/consignor.service';
import { Consignor, UpdateConsignorRequest, ConsignorStatus } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-consignor-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consignor-edit.component.html',
  styleUrls: ['./consignor-edit.component.scss']
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