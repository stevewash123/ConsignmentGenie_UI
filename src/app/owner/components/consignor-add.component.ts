import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ConsignorService } from '../../services/consignor.service';
import { CreateConsignorRequest } from '../../models/consignor.model';

@Component({
  selector: 'app-consignor-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consignor-add.component.html',
  styleUrls: ['./consignor-add.component.scss']
})
export class ConsignorAddComponent {
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  providerData: CreateConsignorRequest = {
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
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
      addressLine1: this.providerData.addressLine1 || undefined,
      addressLine2: this.providerData.addressLine2 || undefined,
      city: this.providerData.city || undefined,
      state: this.providerData.state || undefined,
      postalCode: this.providerData.postalCode || undefined,
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