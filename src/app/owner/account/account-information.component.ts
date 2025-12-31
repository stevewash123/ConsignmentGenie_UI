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
    integrations: { current: number; limit?: number; };
  };
  billingHistory: BillingHistory[];
}

@Component({
  selector: 'app-account-information',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-information.component.html',
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

    .active-integrations {
      margin-top: 2rem;
    }

    .active-integrations h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .integrations-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .integration-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .integration-info h5 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .integration-type {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .integration-status {
      text-align: right;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #166534;
    }

    .activated-date {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
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
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/api/account/information`).subscribe({
      next: (response) => {
        if (response.success) {
          // Map API response to component interface
          const accountData: AccountInfo = {
            organization: {
              id: response.data.organization.id,
              name: response.data.organization.shopName,
              type: 'consignment_shop', // Default since API doesn't specify
              createdDate: new Date(response.data.organization.createdAt),
              lastLoginDate: new Date(), // Could be enhanced with real last login
              totalLocations: 1, // Default for now
              primaryContact: {
                name: response.data.organization.ownerName,
                email: response.data.organization.ownerEmail,
                phone: undefined // Not provided in current API
              }
            },
            currentPlan: {
              id: response.data.currentPlan.planType,
              name: this.formatPlanName(response.data.currentPlan.planType),
              basePrice: response.data.currentPlan.basePrice,
              billingCycle: 'monthly',
              features: this.getPlanFeatures(response.data.currentPlan.planType),
              isFounder: response.data.currentPlan.isFounder,
              founderTier: response.data.currentPlan.founderTier ?
                (parseInt(response.data.currentPlan.founderTier) === 1 || parseInt(response.data.currentPlan.founderTier) === 2 ?
                  parseInt(response.data.currentPlan.founderTier) as 1 | 2 : undefined) : undefined,
              activeIntegrations: response.data.currentPlan.activeIntegrations || [],
              integrationPrice: response.data.currentPlan.integrationPrice
            },
            nextBillingDate: response.data.currentPlan.nextBillingDate ? new Date(response.data.currentPlan.nextBillingDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            usage: {
              consignors: { current: response.data.usageStats.totalConsignors || 0 },
              items: { current: response.data.usageStats.totalItems || 0 },
              locations: { current: 1 },
              integrations: { current: response.data.currentPlan.activeIntegrations?.length || 0 }
            },
            billingHistory: response.data.billingHistory || []
          };

          this.accountInfo.set(accountData);
        } else {
          console.error('Failed to load account info:', response.message);
          this.loadFallbackData();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading account info:', error);
        this.loadFallbackData();
        this.isLoading.set(false);
      }
    });
  }

  private loadFallbackData() {
    // Fallback mock data if API fails
    const fallbackAccount: AccountInfo = {
      organization: {
        id: 'org_fallback',
        name: 'Your Shop Name',
        type: 'consignment_shop',
        createdDate: new Date('2024-01-01'),
        lastLoginDate: new Date(),
        totalLocations: 1,
        primaryContact: {
          name: 'Shop Owner',
          email: 'owner@yourshop.com'
        }
      },
      currentPlan: {
        id: 'basic',
        name: 'Basic Plan',
        basePrice: 49,
        billingCycle: 'monthly',
        features: ['Basic features'],
        isFounder: false,
        activeIntegrations: [],
        integrationPrice: 20
      },
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usage: {
        consignors: { current: 0 },
        items: { current: 0 },
        locations: { current: 1 },
        integrations: { current: 0 }
      },
      billingHistory: []
    };
    this.accountInfo.set(fallbackAccount);
  }

  private formatPlanName(planType: string): string {
    switch (planType?.toLowerCase()) {
      case 'basic': return 'Basic Plan';
      case 'platform': return 'Platform Plan';
      case 'enterprise': return 'Enterprise Plan';
      default: return 'Standard Plan';
    }
  }

  private getPlanFeatures(planType: string): string[] {
    switch (planType?.toLowerCase()) {
      case 'basic':
        return [
          'Basic consignor management',
          'Item tracking',
          'Simple reporting'
        ];
      case 'platform':
        return [
          'Unlimited consignors',
          'Unlimited items',
          'Advanced reporting',
          'Customer management',
          'Sales tracking',
          'Payout calculations'
        ];
      case 'enterprise':
        return [
          'All Platform features',
          'Multi-location support',
          'Custom integrations',
          'Priority support'
        ];
      default:
        return [
          'Standard features',
          'Basic reporting',
          'Customer support'
        ];
    }
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

  openBillingPortal() {
    alert('Stripe Customer Portal would open here');
  }
}