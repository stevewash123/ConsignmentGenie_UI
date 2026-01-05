import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';
import { ConsignorBalance, ConsignorPayoutSummary, PayoutListQuery, PagedResult, PayoutRequestStatus, PayoutRequest } from '../models/consignor.models';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { BalanceCardComponent } from './balance-card.component';
import { RequestPayoutModalComponent } from './request-payout-modal.component';
import { RequestSuccessModalComponent } from './request-success-modal.component';

@Component({
  selector: 'app-consignor-payouts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BalanceCardComponent, RequestPayoutModalComponent, RequestSuccessModalComponent],
  templateUrl: './consignor-payouts.component.html',
  styleUrls: ['./consignor-payouts.component.scss']
}) 
export class ConsignorPayoutsComponent implements OnInit {
  consignorBalance: ConsignorBalance | null = null;
  error: string | null = null;
  expandedInTransit = false;

  // Tab management
  activeTab: 'balance' | 'history' = 'balance';

  // Payout history data
  payoutHistory: PagedResult<ConsignorPayoutSummary> | null = null;
  payoutError: string | null = null;

  // Filtering
  dateRange: 'all' | 'thisYear' | 'last6Months' | 'custom' = 'all';
  customDateFrom: string = '';
  customDateTo: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Payout request modals
  showRequestModal = false;
  showSuccessModal = false;
  requestResult: PayoutRequest | null = null;
  requestStatus: PayoutRequestStatus | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  constructor(
    private consignorService: ConsignorPortalService,
    public loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBalance();
    this.loadRequestStatus();

    // Auto-refresh balance every 2 minutes to keep data current
    setInterval(() => {
      if (!this.loadingService.isLoading(LOADING_KEYS.PAYOUTS_LIST)) {
        this.refreshBalance();
      }
    }, 120000); // 2 minutes
  }

  get hasAnyBalance(): boolean {
    if (!this.consignorBalance) return false;

    return this.consignorBalance.pending.amount > 0 ||
           this.consignorBalance.available.amount > 0 ||
           (this.consignorBalance.inTransit?.amount || 0) > 0;
  }

  get canRequestPayout(): boolean {
    return this.requestStatus?.canRequest === true;
  }

  get requestButtonText(): string {
    if (!this.requestStatus) return 'Request Payout Now';

    if (this.requestStatus.reason === 'pending_request') {
      return 'Request Pending...';
    } else if (this.requestStatus.reason === 'below_minimum') {
      return 'Request Payout Now';
    }

    return 'Request Payout Now';
  }

  get requestButtonDisabledMessage(): string | null {
    if (!this.requestStatus || this.requestStatus.canRequest) return null;

    switch (this.requestStatus.reason) {
      case 'below_minimum':
        return `Minimum payout amount is ${this.requestStatus.minimumAmount?.toFixed(2) || '0.00'}`;
      case 'pending_request':
        const date = this.requestStatus.pendingRequestDate ? this.formatDate(this.requestStatus.pendingRequestDate) : 'recently';
        return `You have a pending request from ${date}`;
      case 'not_allowed':
        return 'On-demand payouts are not available';
      default:
        return 'Request not available';
    }
  }

  loadBalance() {
    this.loadingService.start(LOADING_KEYS.PAYOUTS_LIST);
    this.error = null;

    // For now, get earnings summary which includes balance info
    this.consignorService.getEarningsSummary().subscribe({
      next: (response: any) => {
        const summary = response.success ? response.data : response;
        this.consignorBalance = {
          pending: { amount: summary.pending || 0, itemCount: 0 },
          available: { amount: summary.paidThisMonth || 0, itemCount: 0 },
          inTransit: null,
          lifetimeEarned: summary.pending + summary.paidThisMonth || 0,
          lifetimeReceived: summary.paidThisMonth || 0,
          nextPayoutDate: summary.nextPayoutDate || null,
          payoutScheduleDescription: 'Monthly',
          canRequestPayout: (summary.pending || 0) > 0,
          minimumPayoutAmount: 25,
          pendingRequest: null
        };
      },
      error: (err) => {
        this.error = 'Failed to load balance information.';
        console.error('Balance error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.PAYOUTS_LIST);
      }
    });
  }

  refreshBalance() {
    // Silent refresh without showing loading spinner
    this.loadBalance();
  }

  manualRefresh() {
    this.loadBalance();
    this.loadRequestStatus();
    if (this.activeTab === 'history' && this.payoutHistory) {
      this.loadPayoutHistory();
    }
  }

  onTransitCardClick() {
    this.expandedInTransit = !this.expandedInTransit;
  }

  onConfirmReceived(payoutId: string) {
    // Placeholder functionality - in the real implementation,
    // this would call an API to confirm receipt
    console.log('Payout confirmed as received:', payoutId);
    this.loadBalance(); // Reload to get updated balance
  }

  onRequestPayout() {
    this.showRequestModal = true;
  }

  loadRequestStatus() {
    // For now, set empty request status since we don't have this endpoint
    this.requestStatus = null;
  }

  onRequestModalClose() {
    this.showRequestModal = false;
  }

  onRequestSubmitted(request: PayoutRequest) {
    this.requestResult = request;
    this.showRequestModal = false;
    this.showSuccessModal = true;

    // Reload balance and status to reflect the new request
    this.loadBalance();
    this.loadRequestStatus();
  }

  onSuccessModalClose() {
    this.showSuccessModal = false;
    this.requestResult = null;
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Tab management
  switchTab(tab: 'balance' | 'history') {
    this.activeTab = tab;
    if (tab === 'history' && !this.payoutHistory) {
      this.loadPayoutHistory();
    }
  }

  // Payout history loading
  loadPayoutHistory() {
    this.loadingService.start(LOADING_KEYS.PAYOUTS_LIST);
    this.payoutError = null;

    const query = this.buildPayoutQuery();
    const year = this.getYearFromDateRange();

    this.consignorService.getMyPayouts(this.currentPage, this.pageSize, year).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.payoutHistory = {
            items: response.data.items || [],
            totalCount: response.data.totalCount || 0,
            page: response.data.page || 1,
            pageSize: response.data.pageSize || this.pageSize,
            totalPages: Math.ceil((response.data.totalCount || 0) / (response.data.pageSize || this.pageSize)),
            hasNext: response.data.hasNext || false,
            hasPrevious: response.data.hasPrevious || false
          };
        }
      },
      error: (err) => {
        this.payoutError = 'Failed to load payout history. Please try again.';
        console.error('Payout history error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.PAYOUTS_LIST);
      }
    });
  }

  private getYearFromDateRange(): number | undefined {
    const now = new Date();

    switch (this.dateRange) {
      case 'thisYear':
        return now.getFullYear();
      case 'custom':
        if (this.customDateFrom) {
          return new Date(this.customDateFrom).getFullYear();
        }
        break;
    }

    return undefined;
  }

  buildPayoutQuery(): PayoutListQuery {
    const query: PayoutListQuery = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    const now = new Date();

    switch (this.dateRange) {
      case 'thisYear':
        query.dateFrom = new Date(now.getFullYear(), 0, 1);
        query.dateTo = now;
        break;
      case 'last6Months':
        query.dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        query.dateTo = now;
        break;
      case 'custom':
        if (this.customDateFrom) {
          query.dateFrom = new Date(this.customDateFrom);
        }
        if (this.customDateTo) {
          query.dateTo = new Date(this.customDateTo);
        }
        break;
    }

    return query;
  }

  // Event handlers
  onDateRangeChange() {
    this.currentPage = 1;
    this.loadPayoutHistory();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadPayoutHistory();
  }

  onCustomDateChange() {
    if (this.dateRange === 'custom') {
      this.onDateRangeChange();
    }
  }

  onViewPayoutDetail(payoutId: string) {
    this.router.navigate(['/consignor/payouts', payoutId]);
  }

  onExportPayouts(format: 'csv' | 'pdf') {
    // Placeholder for export functionality
    console.log('Export payouts as:', format);
  }

  get totalPages(): number[] {
    if (!this.payoutHistory) return [];

    const pages = Array.from({ length: this.payoutHistory.totalPages }, (_, i) => i + 1);
    return pages;
  }

  // Helper method for template
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}