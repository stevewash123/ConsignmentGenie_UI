import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface OrganizationInfo {
  id: string;
  name: string;
  type: 'consignment_shop' | 'marketplace' | 'retail';
  createdDate: Date;
  lastLoginDate: Date;
  totalLocations: number;
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  basePrice: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isFounder: boolean;
  founderTier?: 1 | 2;
  activeIntegrations: Integration[];
  integrationPrice: number;
}

interface Integration {
  id: string;
  name: string;
  type: 'accounting' | 'payments' | 'banking' | 'inventory';
  isActive: boolean;
  activatedDate?: Date;
}

interface BillingHistory {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl?: string;
}

interface AccountInfo {
  organization: OrganizationInfo;
  currentPlan: SubscriptionPlan;
  nextBillingDate: Date;
  usage: {
    consignors: { current: number; limit?: number; };
    items: { current: number; limit?: number; };
    locations: { current: number; limit?: number; };
  };
  billingHistory: BillingHistory[];
}

@Component({
  selector: 'app-account-information',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="account-info-page">
      <header class="page-header">
        <h1>Account Information</h1>
        <p>View your organization details, subscription plan, and usage statistics</p>
      </header>

      <div *ngIf="isLoading()" class="loading-state">
        <p>Loading account information...</p>
      </div>

      <div *ngIf="accountInfo()" class="account-content">
        <!-- Organization Details -->
        <section class="info-section">
          <h2>Organization</h2>

          <div class="info-grid">
            <div class="info-item">
              <label>Organization Name</label>
              <div class="info-value">{{ accountInfo()!.organization.name }}</div>
            </div>

            <div class="info-item">
              <label>Business Type</label>
              <div class="info-value">{{ getBusinessTypeLabel(accountInfo()!.organization.type) }}</div>
            </div>

            <div class="info-item">
              <label>Account Created</label>
              <div class="info-value">{{ accountInfo()!.organization.createdDate | date:'mediumDate' }}</div>
            </div>

            <div class="info-item">
              <label>Last Login</label>
              <div class="info-value">{{ accountInfo()!.organization.lastLoginDate | date:'short' }}</div>
            </div>

            <div class="info-item">
              <label>Primary Contact</label>
              <div class="info-value">
                {{ accountInfo()!.organization.primaryContact.name }}<br>
                <span class="text-secondary">{{ accountInfo()!.organization.primaryContact.email }}</span>
                <span *ngIf="accountInfo()!.organization.primaryContact.phone" class="text-secondary"><br>{{ accountInfo()!.organization.primaryContact.phone }}</span>
              </div>
            </div>

            <div class="info-item">
              <label>Total Locations</label>
              <div class="info-value">{{ accountInfo()!.organization.totalLocations }}</div>
            </div>
          </div>
        </section>

        <!-- Current Plan -->
        <section class="info-section">
          <h2>Current Subscription</h2>

          <div class="plan-overview">
            <div class="plan-info">
              <h3>{{ accountInfo()!.currentPlan.name }}</h3>
              <div class="plan-price">
                ${{ getTotalMonthlyPrice() }}
                <span class="billing-cycle">/ {{ accountInfo()!.currentPlan.billingCycle }}</span>
              </div>
              <div class="pricing-breakdown">
                <div class="breakdown-line">
                  Base Platform: ${{ accountInfo()!.currentPlan.basePrice }}
                </div>
                <div class="breakdown-line" *ngIf="accountInfo()!.currentPlan.activeIntegrations.length > 0">
                  {{ accountInfo()!.currentPlan.activeIntegrations.length }} Integration(s): ${{ accountInfo()!.currentPlan.activeIntegrations.length * accountInfo()!.currentPlan.integrationPrice }}
                </div>
                <div class="founder-badge" *ngIf="accountInfo()!.currentPlan.isFounder">
                  🎉 Founder {{ accountInfo()!.currentPlan.founderTier }} Pricing (Locked Forever)
                </div>
              </div>
              <div class="next-billing">
                Next billing: {{ accountInfo()!.nextBillingDate | date:'mediumDate' }}
              </div>
            </div>

            <div class="plan-features">
              <h4>Plan Features</h4>
              <ul class="features-list">
                <li *ngFor="let feature of accountInfo()!.currentPlan.features">
                  <span class="feature-check">✓</span>
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Usage Statistics -->
        <section class="info-section">
          <h2>Current Usage</h2>

          <div class="usage-grid">
            <div class="usage-item" *ngFor="let type of getUsageTypes()">
              <div class="usage-header">
                <span class="usage-label">{{ type.label }}</span>
                <span class="usage-numbers">
                  {{ accountInfo()!.usage[type.key].current }}
                  <span *ngIf="accountInfo()!.usage[type.key].limit"> / {{ accountInfo()!.usage[type.key].limit }}</span>
                  <span *ngIf="!accountInfo()!.usage[type.key].limit"> / Unlimited</span>
                </span>
              </div>
              <div class="usage-bar">
                <div class="usage-progress"
                     [style.width.%]="getUsagePercentage(type.key)"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Billing History -->
        <section class="info-section">
          <h2>Billing History</h2>

          <div *ngIf="accountInfo()!.billingHistory.length === 0" class="no-history">
            <p>No billing history available yet.</p>
          </div>

          <div *ngIf="accountInfo()!.billingHistory.length > 0" class="billing-table">
            <div class="table-header">
              <div>Date</div>
              <div>Description</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            <div class="table-row" *ngFor="let invoice of accountInfo()!.billingHistory">
              <div class="billing-date">{{ invoice.date | date:'shortDate' }}</div>
              <div class="billing-description">{{ invoice.description }}</div>
              <div class="billing-amount">\${{ invoice.amount }}</div>
              <div class="billing-status" [class]="'status-' + invoice.status">{{ invoice.status }}</div>
              <div class="billing-actions">
                <button *ngIf="invoice.downloadUrl"
                        class="btn-link"
                        (click)="downloadInvoice(invoice.id)">
                  Download
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .account-info-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .page-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .account-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .info-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .info-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 0.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-item label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 1rem;
      color: #111827;
      line-height: 1.5;
    }

    .text-secondary {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .plan-overview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .plan-info h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .plan-price {
      font-size: 1.75rem;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 0.5rem;
    }

    .billing-cycle {
      font-size: 1rem;
      font-weight: normal;
      color: #6b7280;
    }

    .next-billing {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .pricing-breakdown {
      margin: 0.75rem 0;
      font-size: 0.875rem;
    }

    .breakdown-line {
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .founder-badge {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.5rem;
      text-align: center;
    }

    .plan-features h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .features-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .feature-check {
      color: #10b981;
      font-weight: bold;
    }

    .usage-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .usage-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .usage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .usage-label {
      font-weight: 500;
      color: #374151;
    }

    .usage-numbers {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .usage-bar {
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .usage-progress {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s ease;
    }

    .billing-table {
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 120px 1fr 100px 80px 80px;
      gap: 1rem;
      background: #f9fafb;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .table-row {
      display: grid;
      grid-template-columns: 120px 1fr 100px 80px 80px;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f3f4f6;
      align-items: center;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .billing-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .billing-description {
      color: #374151;
    }

    .billing-amount {
      font-weight: 600;
      text-align: right;
    }

    .billing-status {
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-paid {
      color: #10b981;
    }

    .status-pending {
      color: #f59e0b;
    }

    .status-failed {
      color: #dc2626;
    }

    .btn-link {
      background: none;
      border: none;
      color: #3b82f6;
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .btn-link:hover {
      color: #2563eb;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .no-history {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .account-info-page {
        padding: 1rem;
      }

      .plan-overview {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .table-header {
        display: none;
      }

      .table-row {
        display: block;
        padding: 1rem;
      }

      .table-row > div {
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class AccountInformationComponent implements OnInit {
  accountInfo = signal<AccountInfo | null>(null);
  isLoading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAccountInfo();
  }

  private loadAccountInfo() {
    // Mock data for now - in real app, load from API
    setTimeout(() => {
      const mockAccount: AccountInfo = {
        organization: {
          id: 'org_123',
          name: 'Vintage Treasures Consignment',
          type: 'consignment_shop',
          createdDate: new Date('2024-01-15'),
          lastLoginDate: new Date(),
          totalLocations: 2,
          primaryContact: {
            name: 'Sarah Johnson',
            email: 'sarah@vintagetreasures.com',
            phone: '+1 (555) 123-4567'
          }
        },
        currentPlan: {
          id: 'base-platform',
          name: 'Base Platform',
          basePrice: 29,
          billingCycle: 'monthly',
          features: [
            'Unlimited consignors',
            'Unlimited items',
            'Advanced reporting',
            'Customer management',
            'Sales tracking',
            'Payout calculations'
          ],
          isFounder: true,
          founderTier: 1,
          activeIntegrations: [
            {
              id: 'quickbooks',
              name: 'QuickBooks Online',
              type: 'accounting',
              isActive: true,
              activatedDate: new Date('2024-02-15')
            },
            {
              id: 'stripe',
              name: 'Stripe Payments',
              type: 'payments',
              isActive: true,
              activatedDate: new Date('2024-03-01')
            }
          ],
          integrationPrice: 15
        },
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        usage: {
          consignors: { current: 87 },
          items: { current: 2340 },
          integrations: { current: 2 }
        },
        billingHistory: [
          {
            id: 'inv_1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            amount: 59,
            status: 'paid',
            description: 'Base Platform ($29) + 2 Integrations ($30) - Founder 1 Pricing',
            downloadUrl: '#'
          },
          {
            id: 'inv_2',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            amount: 59,
            status: 'paid',
            description: 'Base Platform ($29) + 2 Integrations ($30) - Founder 1 Pricing',
            downloadUrl: '#'
          }
        ]
      };

      this.accountInfo.set(mockAccount);
      this.isLoading.set(false);
    }, 500);
  }

  getBusinessTypeLabel(type: string): string {
    switch (type) {
      case 'consignment_shop': return 'Consignment Shop';
      case 'marketplace': return 'Marketplace';
      case 'retail': return 'Retail Store';
      default: return type;
    }
  }

  getTotalMonthlyPrice(): number {
    const plan = this.accountInfo()?.currentPlan;
    if (!plan) return 0;
    const integrationsCost = plan.activeIntegrations.length * plan.integrationPrice;
    return plan.basePrice + integrationsCost;
  }

  getUsageTypes() {
    return [
      { key: 'consignors' as const, label: 'Consignors' },
      { key: 'items' as const, label: 'Items' },
      { key: 'integrations' as const, label: 'Active Integrations' }
    ];
  }

  getUsagePercentage(type: 'consignors' | 'items' | 'integrations'): number {
    const usage = this.accountInfo()?.usage[type];
    if (!usage) return 0;

    // For integrations, show percentage based on available integrations (out of 4: Square POS, Square Online, QuickBooks, Dwolla)
    if (type === 'integrations') {
      const maxIntegrations = 4;
      return Math.min((usage.current / maxIntegrations) * 100, 100);
    }

    // For consignors and items, no limits in new model, so just show a placeholder
    return 0;
  }

  downloadInvoice(invoiceId: string) {
    console.log('Downloading invoice:', invoiceId);
    alert('Invoice download would start here');
  }
}