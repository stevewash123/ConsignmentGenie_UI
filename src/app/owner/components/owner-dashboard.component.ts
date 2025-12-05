import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OwnerLayoutComponent } from './owner-layout.component';
import { OwnerWelcomeModalComponent } from './owner-welcome-modal.component';
import { ConsignorService } from '../../services/consignor.service';
import { TransactionService, SalesMetrics, MetricsQueryParams, TransactionQueryParams } from '../../services/transaction.service';
import { PayoutService, PayoutStatus } from '../../services/payout.service';
import { InventoryService } from '../../services/inventory.service';
import { Transaction } from '../../models/transaction.model';
import { PendingPayoutData } from '../../models/payout.model';
import { AuthService } from '../../services/auth.service';
import { OnboardingService } from '../../shared/services/onboarding.service';
import { OnboardingStatus, OnboardingStep } from '../../shared/models/onboarding.models';

interface ShopSummary {
  activeConsignors: number;
  inventoryValue: number;
  totalItems: number;
  recentSales: number;
  recentSalesCount: number;
  pendingPayouts: number;
  pendingPayoutCount: number;
  recentTransactions: DashboardTransaction[];
}

interface DashboardTransaction {
  id: string;
  date: Date;
  itemName: string;
  consignor: string;
  amount: number;
  commission: number;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OwnerLayoutComponent, OwnerWelcomeModalComponent],
  template: `
    <app-owner-layout>
      <div class="owner-dashboard">
        <div class="dashboard-header">
          <h1>{{ getCurrentUser()?.organizationName || 'Shop' }} Dashboard</h1>
          <p>Welcome back, {{ getCurrentUser()?.email?.split('@')[0] || 'Owner' }}! Here's what's happening in your consignment shop.</p>
        </div>

        <!-- Key Metrics -->
        <div class="metrics-grid" *ngIf="summary(); else loadingMetrics">
          <div class="metric-card">
            <div class="metric-content">
              <h3>Inventory Value</h3>
              <div class="metric-value">\${{ summary()!.inventoryValue | number:'1.2-2' }}</div>
            </div>
          </div>

          <a routerLink="/owner/payouts" class="metric-card pending-payouts"
             [ngClass]="{ 'has-pending': summary()!.pendingPayoutCount > 0 }">
            <div class="metric-content">
              <h3>Pending Payouts</h3>
              <div class="metric-value">\${{ summary()!.pendingPayouts | number:'1.2-2' }}</div>
              <span *ngIf="summary()!.pendingPayoutCount > 0" class="action-hint">→ Click to process</span>
            </div>
          </a>
        </div>

        <ng-template #loadingMetrics>
          <div class="loading" data-cy="loading-indicator">Loading dashboard data...</div>
        </ng-template>

        <!-- Quick Actions -->
        <div class="actions-section">
          <h2>Quick Actions</h2>
          <div class="action-grid">
            <a routerLink="/owner/sales" class="action-card">
              <h3>Process Sale</h3>
              <p>Record a new transaction and automatically calculate splits</p>
            </a>

            <a routerLink="/owner/consignors" class="action-card">
              <h3>Manage Consignors</h3>
              <p>View consignors, update commission rates, and track performance</p>
            </a>

            <a routerLink="/owner/payouts" class="action-card">
              <h3>Generate Payouts</h3>
              <p>Create payout reports and process consignor payments</p>
            </a>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section" *ngIf="summary()?.recentTransactions?.length">
          <h2>Recent Transactions</h2>
          <div class="transactions-table">
            <div class="table-header">
              <div class="col-date">Date</div>
              <div class="col-item">Item</div>
              <div class="col-consignor">Consignor</div>
              <div class="col-amount">Sale Amount</div>
              <div class="col-commission">Commission</div>
            </div>
            <div class="table-body">
              <div class="transaction-row" *ngFor="let transaction of summary()!.recentTransactions">
                <div class="col-date">{{ transaction.date | date:'short' }}</div>
                <div class="col-item">{{ transaction.itemName }}</div>
                <div class="col-consignor">{{ transaction.consignor }}</div>
                <div class="col-amount">\${{ transaction.amount | number:'1.2-2' }}</div>
                <div class="col-commission">\${{ transaction.commission | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onboarding Welcome Modal -->
      <app-owner-welcome-modal
        [isVisible]="showWelcomeModal()"
        [shopName]="getCurrentUser()?.organizationName || 'Your Shop'"
        [onboardingStatus]="onboardingStatus()"
        (closed)="closeWelcomeModal()"
        (dismissed)="dismissWelcomeModal()"
        (stepClicked)="navigateToStep($event)">
      </app-owner-welcome-modal>
    </app-owner-layout>
  `,
  styles: [`
    .owner-dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 3rem;
      text-align: center;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      color: #047857;
      margin-bottom: 0.5rem;
    }

    .dashboard-header p {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-card.sales { border-left-color: #059669; }
    .metric-card.profit { border-left-color: #fbbf24; }
    .metric-card.consignors { border-left-color: #3b82f6; }
    .metric-card.inventory { border-left-color: #8b5cf6; }
    .metric-card.pending-payouts {
      border-left-color: #f59e0b;
      text-decoration: none;
      color: inherit;
    }

    .metric-card.pending-payouts.has-pending {
      border-left-color: #ef4444;
      background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
      cursor: pointer;
    }

    .metric-card.pending-payouts.has-pending:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.15);
    }

    .metric-icon {
      font-size: 3rem;
      opacity: 0.8;
    }

    .metric-content h3 {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .metric-change {
      font-size: 0.875rem;
      color: #059669;
      font-weight: 600;
    }

    .action-hint {
      color: #ef4444;
      font-weight: 700;
      margin-left: 0.5rem;
      opacity: 0.8;
    }

    .loading {
      text-align: center;
      color: #6b7280;
      font-size: 1.1rem;
      padding: 3rem;
    }

    .actions-section, .activity-section {
      margin-bottom: 3rem;
    }

    .actions-section h2, .activity-section h2 {
      font-size: 1.75rem;
      color: #047857;
      margin-bottom: 1.5rem;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
      display: block;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
      border-color: #059669;
    }

    .action-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .action-card h3 {
      color: #047857;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .action-card p {
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    .transactions-table {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .table-header, .transaction-row {
      display: grid;
      grid-template-columns: 140px 1fr 150px 120px 120px;
      gap: 1rem;
      padding: 1rem;
      align-items: center;
    }

    .table-header {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .transaction-row {
      border-bottom: 1px solid #e5e7eb;
    }

    .transaction-row:last-child {
      border-bottom: none;
    }

    .col-amount, .col-commission {
      font-weight: 600;
      color: #047857;
    }

    @media (max-width: 768px) {
      .owner-dashboard {
        padding: 1rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .action-grid {
        grid-template-columns: 1fr;
      }

      .table-header, .transaction-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .table-header {
        display: none;
      }

      .transaction-row {
        display: block;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .col-date, .col-item, .col-consignor, .col-amount, .col-commission {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;
      }

      .col-date::before { content: "Date: "; font-weight: 600; }
      .col-item::before { content: "Item: "; font-weight: 600; }
      .col-consignor::before { content: "Consignor: "; font-weight: 600; }
      .col-amount::before { content: "Amount: "; font-weight: 600; }
      .col-commission::before { content: "Commission: "; font-weight: 600; }
    }
  `]
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  summary = signal<ShopSummary | null>(null);
  activeConsignorCount = signal<number>(0);
  onboardingStatus = signal<OnboardingStatus | null>(null);
  showWelcomeModal = signal<boolean>(false);

  constructor(
    private consignorService: ConsignorService,
    private transactionService: TransactionService,
    private payoutService: PayoutService,
    private authService: AuthService,
    private onboardingService: OnboardingService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit() {
    console.log('🔍 DASHBOARD: Component initialized');
    this.loadDashboardData();
    this.loadOnboardingStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  private loadDashboardData() {
    // Load real consignor count, sales metrics, inventory metrics, and recent transactions
    const consignorsPromise = this.consignorService.getConsignors().toPromise();

    // Get last 30 days sales metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metricsParams: MetricsQueryParams = {
      startDate: thirtyDaysAgo,
      endDate: new Date()
    };

    // Get recent transactions (last 10)
    const transactionParams: TransactionQueryParams = {
      page: 1,
      pageSize: 10,
      sortBy: 'saleDate',
      sortDirection: 'desc'
    };

    const salesPromise = this.transactionService.getSalesMetrics(metricsParams).toPromise();
    const pendingPayoutsPromise = this.payoutService.getPendingPayouts().toPromise();
    const inventoryMetricsPromise = this.inventoryService.getInventoryMetrics().toPromise();
    const recentTransactionsPromise = this.transactionService.getTransactions(transactionParams).toPromise();

    Promise.all([consignorsPromise, salesPromise, pendingPayoutsPromise, inventoryMetricsPromise, recentTransactionsPromise])
      .then(([consignors, salesMetrics, pendingPayouts, inventoryMetrics, recentTransactions]) => {
        console.log('Dashboard data loaded:', { consignors, salesMetrics, pendingPayouts, inventoryMetrics, recentTransactions });

        // Handle consignors response - might be wrapped in API response object
        let consignorsArray = consignors;
        if (consignors && typeof consignors === 'object' && !Array.isArray(consignors)) {
          // Check if it's wrapped in a response object with proper type casting
          const response = consignors as any;
          consignorsArray = response.data || response.consignors || consignors;
        }

        const activeConsignorCount = Array.isArray(consignorsArray) ?
          consignorsArray.filter((p: any) => p?.isActive).length : 0;
        this.activeConsignorCount.set(activeConsignorCount);

        // Calculate real pending payout totals from new API
        const totalPendingAmount = pendingPayouts?.reduce((total, pending) => total + pending.pendingAmount, 0) || 0;
        const pendingConsignorCount = pendingPayouts?.length || 0;

        // Extract inventory metrics
        const inventoryValue = inventoryMetrics?.data?.totalValue || 0;
        const totalItems = inventoryMetrics?.data?.totalItems || 0;

        // Transform recent transactions to dashboard format
        const dashboardTransactions: DashboardTransaction[] = recentTransactions?.items?.map((t: Transaction) => ({
          id: t.id,
          date: new Date(t.saleDate),
          itemName: t.item.name,
          consignor: t.consignor.name,
          amount: t.salePrice,
          commission: t.shopAmount
        })) || [];

        const realSummary: ShopSummary = {
          activeConsignors: activeConsignorCount,
          inventoryValue: inventoryValue,
          totalItems: totalItems,
          recentSales: salesMetrics?.totalSales || 0,
          recentSalesCount: salesMetrics?.transactionCount || 0,
          pendingPayouts: totalPendingAmount,
          pendingPayoutCount: pendingConsignorCount,
          recentTransactions: dashboardTransactions
        };

        this.summary.set(realSummary);
      })
      .catch((error) => {
        console.error('Failed to load dashboard data:', error);
        this.activeConsignorCount.set(0);

        // Fallback to basic data if API fails
        const fallbackSummary: ShopSummary = {
          activeConsignors: 0,
          inventoryValue: 0,
          totalItems: 0,
          recentSales: 0,
          recentSalesCount: 0,
          pendingPayouts: 0,
          pendingPayoutCount: 0,
          recentTransactions: []
        };
        this.summary.set(fallbackSummary);
      });
  }

  private loadOnboardingStatus() {
    console.log('🔍 DASHBOARD: Loading onboarding status...');
    this.onboardingService.getOnboardingStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          console.log('🔍 DASHBOARD: Onboarding status received:', status);
          this.onboardingStatus.set(status);
          // Show modal if onboarding should be shown
          const shouldShow = this.onboardingService.shouldShowOnboarding(status);
          console.log('🔍 DASHBOARD: Should show modal:', shouldShow);
          if (shouldShow) {
            console.log('🔍 DASHBOARD: Setting modal visible to TRUE');
            this.showWelcomeModal.set(true);
          } else {
            console.log('🔍 DASHBOARD: NOT showing modal. Current modal state:', this.showWelcomeModal());
          }
        },
        error: (error) => {
          console.error('🚨 DASHBOARD: Failed to load onboarding status:', error);
        }
      });
  }

  closeWelcomeModal() {
    this.showWelcomeModal.set(false);
  }

  dismissWelcomeModal() {
    this.showWelcomeModal.set(false);
    // Refresh status to update the local state
    this.loadOnboardingStatus();
  }

  navigateToStep(step: OnboardingStep) {
    this.closeWelcomeModal();
    // The router navigation will happen automatically via the routerLink in the modal
  }
}