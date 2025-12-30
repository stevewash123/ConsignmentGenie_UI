import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Integration {
  id: string;
  name: string;
  type: 'accounting' | 'payments' | 'banking' | 'inventory';
  description: string;
  isActive: boolean;
  configurationRequired: boolean;
  lastSyncDate?: Date;
}

interface SubscriptionInfo {
  stripePortalUrl: string;
  isTrialActive: boolean;
  trialDaysRemaining?: number;
}

@Component({
  selector: 'app-subscription-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-settings.component.html',
  styles: [`
    .subscription-settings {
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

    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 0.5rem;
    }

    .trial-notice {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 2rem;
      color: #92400e;
    }

    .trial-notice h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .integration-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .integration-card.active {
      border-color: #10b981;
      background: #ecfdf5;
    }

    .integration-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }

    .integration-info h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .integration-status {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .last-sync {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .integration-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .integration-actions {
      margin-top: auto;
    }

    .active-badge {
      background: #10b981;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-outline {
      background: transparent;
      color: #3b82f6;
      border: 1px solid #3b82f6;
    }

    .btn-outline:hover {
      background: #3b82f6;
      color: white;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-start;
      margin-top: 2rem;
    }

    .billing-portal-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .billing-portal-info p {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .subscription-settings {
        padding: 1rem;
      }

      .integrations-grid {
        grid-template-columns: 1fr;
      }

      .integration-header {
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class SubscriptionSettingsComponent implements OnInit {
  subscriptionInfo = signal<SubscriptionInfo | null>(null);
  isLoading = signal(true);

  availableIntegrations: Integration[] = [
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      type: 'accounting',
      description: 'Sync transactions, items, and payouts with QuickBooks for seamless bookkeeping',
      isActive: true,
      configurationRequired: true,
      lastSyncDate: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      type: 'payments',
      description: 'Accept credit cards and digital payments from customers',
      isActive: true,
      configurationRequired: false
    },
    {
      id: 'square-pos',
      name: 'Square POS',
      type: 'inventory',
      description: 'Sync inventory and sales with Square POS for in-store transactions',
      isActive: false,
      configurationRequired: true
    },
    {
      id: 'dwolla',
      name: 'Dwolla ACH',
      type: 'banking',
      description: 'Automate consignor payouts with bank account integration',
      isActive: false,
      configurationRequired: true
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSubscriptionInfo();
  }

  private loadSubscriptionInfo() {
    // Mock data for now - in real app, load from API
    setTimeout(() => {
      const mockInfo: SubscriptionInfo = {
        stripePortalUrl: 'https://billing.stripe.com/session/test_123', // Would be actual Stripe portal URL
        isTrialActive: false,
        trialDaysRemaining: undefined // Set to number if in trial
      };
      this.subscriptionInfo.set(mockInfo);
      this.isLoading.set(false);
    }, 500);
  }

  getActiveIntegrationsCount(): number {
    return this.availableIntegrations.filter(i => i.isActive).length;
  }

  async configureIntegration(integrationId: string): Promise<void> {
    const integration = this.availableIntegrations.find(i => i.id === integrationId);
    if (!integration) return;

    // Navigate to integration-specific configuration page
    // Integration activation/deactivation now happens through Stripe
    console.log(`Configure ${integration.name} integration`);
    alert(`Configuration for ${integration.name} would open here`);
  }

  openBillingPortal(): void {
    const info = this.subscriptionInfo();
    if (info?.stripePortalUrl) {
      window.open(info.stripePortalUrl, '_blank');
    } else {
      alert('Stripe Customer Portal would open here');
    }
  }

  openIntegrationsSettings(): void {
    // Navigate to specific integrations settings page
    console.log('Navigate to integrations settings');
    alert('Integrations settings page would open here');
  }
}