import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  template: `
    <div class="license-settings">
      <div class="settings-header">
        <h2>Billing & Subscription Management</h2>
        <p>Manage your ConsignmentGenie subscription through Stripe's secure portal</p>
      </div>

      <div *ngIf="!isLoading()" class="subscription-content">
        <!-- Current Subscription Info -->
        <div class="subscription-card">
          <div class="subscription-info">
            <h3>Current Subscription</h3>
            <div class="plan-details" *ngIf="subscriptionInfo()">
              <div class="plan-name">{{ subscriptionInfo()!.planName }}</div>
              <div class="plan-status" [class]="'status-' + subscriptionInfo()!.status">
                {{ getStatusLabel(subscriptionInfo()!.status) }}
              </div>
              <div *ngIf="subscriptionInfo()!.nextBillingDate && !subscriptionInfo()!.cancelAtPeriodEnd" class="billing-info">
                Next billing date: {{ subscriptionInfo()!.nextBillingDate | date:'mediumDate' }}
              </div>
              <div *ngIf="subscriptionInfo()!.cancelAtPeriodEnd" class="cancellation-notice">
                Your subscription will end on {{ subscriptionInfo()!.nextBillingDate | date:'mediumDate' }}
              </div>
            </div>
          </div>

          <div class="subscription-actions">
            <button
              type="button"
              class="btn-primary"
              (click)="openStripePortal()"
              [disabled]="isProcessing()">
              {{ isProcessing() ? 'Opening...' : 'Manage Subscription' }}
            </button>
          </div>
        </div>

        <!-- Information Section -->
        <div class="info-section">
          <h3>What you can do in the Stripe portal:</h3>
          <ul class="portal-features">
            <li>✓ View and download invoices</li>
            <li>✓ Update payment methods</li>
            <li>✓ Change subscription plans</li>
            <li>✓ Cancel your subscription</li>
            <li>✓ Update billing address</li>
          </ul>
        </div>
      </div>

      <div *ngIf="isLoading()" class="loading-state">
        <p>Loading subscription information...</p>
      </div>

      <div *ngIf="errorMessage()" class="error-message">
        {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .license-settings {
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

    .subscription-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .subscription-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
    }

    .subscription-info h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .plan-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .plan-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .plan-status {
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      display: inline-block;
      width: fit-content;
    }

    .status-active {
      background: #ecfdf5;
      color: #059669;
    }

    .status-canceled {
      background: #fef2f2;
      color: #dc2626;
    }

    .status-past_due {
      background: #fefce8;
      color: #d97706;
    }

    .status-incomplete {
      background: #f1f5f9;
      color: #64748b;
    }

    .billing-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .cancellation-notice {
      color: #dc2626;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .info-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .info-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .portal-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 0.5rem;
    }

    .portal-features li {
      color: #374151;
      font-size: 0.875rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .error-message {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .license-settings {
        padding: 1rem;
      }

      .subscription-card {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
      }

      .portal-features {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LicenseComponent implements OnInit {
  subscriptionInfo = signal<SubscriptionInfo | null>(null);
  isLoading = signal(true);
  isProcessing = signal(false);
  errorMessage = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSubscriptionInfo();
  }

  private async loadSubscriptionInfo() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // TODO: Replace with actual API call to get subscription info
      // const response = await this.http.get<SubscriptionInfo>(`${environment.apiUrl}/api/subscription`).toPromise();

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
      // TODO: Replace with actual API call to create Stripe portal session
      // const response = await this.http.post<{ url: string }>(`${environment.apiUrl}/api/subscription/portal`, {}).toPromise();
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