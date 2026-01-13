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
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
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
          consignorsArray.filter((p: any) => p?.status === 'active').length : 0;
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
          date: new Date(t.saleDate || t.transactionDate),
          itemName: t.items?.[0]?.item?.title || 'N/A',
          consignor: t.items?.[0]?.consignor?.name || 'N/A',
          amount: t.salePrice || t.total,
          commission: t.items?.[0]?.storeAmount || 0
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