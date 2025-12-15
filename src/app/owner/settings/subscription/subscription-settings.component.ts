import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxConsignors?: number;
    maxItems?: number;
    maxLocations?: number;
    supportLevel: 'basic' | 'priority' | 'premium';
  };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface BillingInfo {
  currentPlan: SubscriptionPlan;
  nextBillingDate: Date;
  paymentMethod: PaymentMethod;
  billingHistory: {
    id: string;
    date: Date;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    description: string;
    downloadUrl?: string;
  }[];
  usage: {
    consignors: { current: number; limit?: number; };
    items: { current: number; limit?: number; };
    locations: { current: number; limit?: number; };
  };
}

@Component({
  selector: 'app-subscription-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-settings.component.html',
  styles: [`
    .subscription-settings {
      padding: 2rem;
      max-width: 1000px;
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

    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .form-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 0.5rem;
    }

    .current-plan {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1.5rem;
    }

    .plan-info h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .plan-price {
      font-size: 1.5rem;
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

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 0.5rem;
    }

    .features-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #374151;
    }

    .feature-check {
      color: #10b981;
      font-weight: bold;
    }

    .usage-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .usage-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .usage-label {
      min-width: 100px;
      font-weight: 500;
      color: #374151;
    }

    .usage-bar {
      flex: 1;
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

    .usage-text {
      min-width: 120px;
      text-align: right;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .plan-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .plan-card.current {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .plan-card.selected {
      border-color: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    .plan-header h4 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .plan-features-compact {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .plan-features-compact li {
      margin-bottom: 0.25rem;
    }

    .more-features {
      font-style: italic;
    }

    .current-badge {
      background: #3b82f6;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .payment-method {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
    }

    .method-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .method-icon {
      font-size: 1.5rem;
    }

    .method-primary {
      font-weight: 500;
      color: #111827;
    }

    .method-secondary {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .billing-history {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .billing-item {
      display: grid;
      grid-template-columns: 120px 1fr 100px 80px 80px;
      gap: 1rem;
      align-items: center;
      padding: 0.75rem;
      border: 1px solid #f3f4f6;
      border-radius: 6px;
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

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
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

    .btn-link {
      background: none;
      border: none;
      color: #3b82f6;
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-start;
      margin-top: 2rem;
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
      .current-plan {
        flex-direction: column;
        gap: 1rem;
      }

      .usage-item {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .usage-text {
        text-align: left;
      }

      .payment-method {
        flex-direction: column;
        gap: 1rem;
      }

      .billing-item {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class SubscriptionSettingsComponent implements OnInit {
  billingInfo = signal<BillingInfo | null>(null);
  isLoading = signal(true);
  showPlanOptions = false;
  selectedPlanId: string | null = null;

  availablePlans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      billingCycle: 'monthly',
      features: [
        'Up to 50 consignors',
        'Up to 1,000 items',
        '1 location',
        'Basic reporting',
        'Email support'
      ],
      limits: {
        maxConsignors: 50,
        maxItems: 1000,
        maxLocations: 1,
        supportLevel: 'basic'
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 79,
      billingCycle: 'monthly',
      features: [
        'Up to 200 consignors',
        'Up to 5,000 items',
        'Up to 3 locations',
        'Advanced reporting',
        'QuickBooks integration',
        'Priority support'
      ],
      limits: {
        maxConsignors: 200,
        maxItems: 5000,
        maxLocations: 3,
        supportLevel: 'priority'
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      billingCycle: 'monthly',
      features: [
        'Unlimited consignors',
        'Unlimited items',
        'Unlimited locations',
        'Custom reporting',
        'All integrations',
        'Premium support',
        'Custom training'
      ],
      limits: {
        supportLevel: 'premium'
      }
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBillingInfo();
  }

  private loadBillingInfo() {
    // Mock data for now - in real app, load from API
    setTimeout(() => {
      const mockBilling: BillingInfo = {
        currentPlan: this.availablePlans[1], // Professional plan
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        paymentMethod: {
          id: 'pm_1',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        },
        billingHistory: [
          {
            id: 'inv_1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            amount: 79,
            status: 'paid',
            description: 'Professional Plan - Monthly',
            downloadUrl: '#'
          },
          {
            id: 'inv_2',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            amount: 79,
            status: 'paid',
            description: 'Professional Plan - Monthly',
            downloadUrl: '#'
          }
        ],
        usage: {
          consignors: { current: 87, limit: 200 },
          items: { current: 2340, limit: 5000 },
          locations: { current: 2, limit: 3 }
        }
      };
      this.billingInfo.set(mockBilling);
      this.isLoading.set(false);
    }, 500);
  }

  getUsagePercentage(type: 'consignors' | 'items' | 'locations'): number {
    const usage = this.billingInfo()?.usage[type];
    if (!usage || !usage.limit) return 0;
    return Math.min((usage.current / usage.limit) * 100, 100);
  }

  getUpgradeText(plan: SubscriptionPlan): string {
    const currentPlan = this.billingInfo()?.currentPlan;
    if (!currentPlan) return 'Select Plan';

    if (plan.price > currentPlan.price) return 'Upgrade';
    if (plan.price < currentPlan.price) return 'Downgrade';
    return 'Select Plan';
  }

  selectPlan(planId: string) {
    this.selectedPlanId = planId;
  }

  confirmPlanChange() {
    if (!this.selectedPlanId) return;

    const selectedPlan = this.availablePlans.find(p => p.id === this.selectedPlanId);
    if (selectedPlan) {
      console.log('Changing to plan:', selectedPlan.name);
      alert(`Plan change to ${selectedPlan.name} would be processed here`);
    }
  }

  updatePaymentMethod() {
    console.log('Update payment method clicked');
    alert('Payment method update flow would open here');
  }

  downloadInvoice(invoiceId: string) {
    console.log('Downloading invoice:', invoiceId);
    alert('Invoice download would start here');
  }

  cancelSubscription() {
    if (confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      console.log('Subscription cancellation requested');
      alert('Subscription cancellation would be processed here');
    }
  }
}