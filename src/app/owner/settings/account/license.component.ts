import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OwnerService } from '../../../services/owner.service';

interface SubscriptionInfo {
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  nextBillingDate?: Date;
  cancelAtPeriodEnd: boolean;
}

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
      // TODO: Replace with actual service call to get subscription info
      // const response = await this.ownerService.getSubscriptionInfo().toPromise();

      // Mock data for now
      setTimeout(() => {
        const mockSubscription: SubscriptionInfo = {
          planName: 'Professional Plan',
          status: 'active',
          nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          cancelAtPeriodEnd: false
        };
        this.subscriptionInfo.set(mockSubscription);
        this.isLoading.set(false);
      }, 500);
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
      // TODO: Replace with actual service call to create Stripe portal session
      // const response = await this.ownerService.createStripePortalSession().toPromise();
      // window.location.href = response.url;

      // Mock implementation - in real app, this would redirect to Stripe
      console.log('Opening Stripe portal...');
      alert('This would redirect to the Stripe customer portal where you can manage your subscription, payment methods, and billing history.');

      this.isProcessing.set(false);
    } catch (error) {
      console.error('Failed to open Stripe portal:', error);
      this.errorMessage.set('Failed to open subscription portal. Please try again later.');
      this.isProcessing.set(false);
    }
  }

  getStatusLabel(status: SubscriptionInfo['status']): string {
    const labels = {
      active: 'Active',
      canceled: 'Canceled',
      past_due: 'Past Due',
      incomplete: 'Incomplete'
    };
    return labels[status] || status;
  }
}