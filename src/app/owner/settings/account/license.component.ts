import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { OwnerService, SubscriptionInfo } from '../../../services/owner.service';

@Component({
  selector: 'app-license',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss']
})
export class LicenseComponent implements OnInit {
  subscriptionInfo = signal<SubscriptionInfo | null>(null);
  isLoading = signal(true);
  isProcessing = signal(false);
  errorMessage = signal('');

  constructor(private ownerService: OwnerService) {}

  ngOnInit() {
    this.loadSubscriptionInfo();
  }

  private async loadSubscriptionInfo() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(this.ownerService.getSubscriptionInfo());
      this.subscriptionInfo.set(response);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Failed to load subscription info:', error);
      this.errorMessage.set('Failed to load subscription information. Please try again later.');
      this.isLoading.set(false);
    }
  }

  async openStripePortal() {
    this.isProcessing.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(this.ownerService.openBillingPortal());
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to open Stripe portal:', error);
      this.errorMessage.set('Failed to open subscription portal. Please try again later.');
      this.isProcessing.set(false);
    }
  }

  getStatusLabel(status: SubscriptionInfo['status']): string {
    const labels = {
      active: 'Active',
      cancelled: 'Canceled',
      past_due: 'Past Due',
      trialing: 'Trial Membership'
    };
    return labels[status] || status;
  }
}