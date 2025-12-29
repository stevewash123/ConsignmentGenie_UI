import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';
import { ConsignorBalance, ConsignorPayoutSummary, PayoutListQuery, PagedResult, PayoutRequestStatus, PayoutRequest } from '../models/consignor.models';
import { MockConsignorBalanceService } from '../services/mock-consignor-balance.service';
import { MockConsignorPayoutService } from '../services/mock-consignor-payout.service';
import { BalanceCardComponent } from './balance-card.component';
import { RequestPayoutModalComponent } from './request-payout-modal.component';
import { RequestSuccessModalComponent } from './request-success-modal.component';

@Component({
  selector: 'app-consignor-payouts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BalanceCardComponent, RequestPayoutModalComponent, RequestSuccessModalComponent],
  templateUrl: './consignor-payouts.component.html',
  styles: [`
    .balance-overview {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .refresh-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh-button:hover:not(:disabled) {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .refresh-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .refresh-button span {
      font-size: 1rem;
    }

    .balance-cards-section {
      margin-bottom: 2rem;
    }

    .balance-cards-container {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .balance-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .balance-explanations {
      border-top: 1px solid #e5e7eb;
      padding-top: 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.6;
    }

    .explanation-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .explanation-list li {
      margin-bottom: 0.5rem;
    }

    .explanation-list li strong {
      color: #374151;
    }

    .payout-schedule-section {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      text-align: center;
    }

    .schedule-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .schedule-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .schedule-date {
      font-size: 1.25rem;
      font-weight: 700;
      color: #059669;
      margin-bottom: 0.5rem;
    }

    .schedule-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .request-payout-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .request-payout-button:hover {
      background: #2563eb;
    }

    .request-payout-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .request-button-message {
      font-size: 0.875rem;
      color: #dc2626;
      text-align: center;
      margin-top: 0.75rem;
      font-weight: 500;
    }

    .lifetime-earnings-section {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .lifetime-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .lifetime-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      text-align: center;
    }

    .stat-item {
      padding: 1rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #059669;
    }

    .empty-state {
      background: white;
      border-radius: 1rem;
      padding: 3rem 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #374151;
      margin-bottom: 1rem;
    }

    .empty-state-description {
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .empty-state-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: background-color 0.2s ease;
    }

    .empty-state-button:hover {
      background: #2563eb;
    }

    .loading, .error {
      text-align: center;
      padding: 3rem 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .error button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      margin-top: 1rem;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .balance-overview {
        padding: 1rem;
      }

      .balance-cards-container,
      .payout-schedule-section,
      .lifetime-earnings-section,
      .empty-state {
        padding: 1.5rem;
      }

      .balance-cards {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .lifetime-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .page-header h1 {
        font-size: 1.5rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .refresh-button {
        align-self: stretch;
        justify-content: center;
      }
    }

    /* Tab Navigation Styles */
    .tab-navigation {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 2rem;
      gap: 0;
    }

    .tab-button {
      background: none;
      border: none;
      padding: 1rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
      position: relative;
    }

    .tab-button.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-button:hover:not(.active) {
      color: #374151;
    }

    /* Payout History Styles */
    .payout-history-section {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .payout-history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem 2rem 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .payout-history-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .export-dropdown {
      position: relative;
    }

    .export-button {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .export-button:hover {
      background: #e5e7eb;
    }

    .filters-section {
      padding: 1rem 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .date-range-filter {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .filter-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      color: #374151;
      background: white;
    }

    .filter-select:focus {
      outline: none;
      ring: 2px;
      ring-color: #3b82f6;
      border-color: #3b82f6;
    }

    .custom-date-inputs {
      display: flex;
      gap: 1rem;
      margin-left: 1rem;
    }

    .date-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      color: #374151;
    }

    .date-input:focus {
      outline: none;
      ring: 2px;
      ring-color: #3b82f6;
      border-color: #3b82f6;
    }

    .payout-list {
      padding: 0;
    }

    .payout-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s ease;
      cursor: pointer;
    }

    .payout-row:hover {
      background: #f9fafb;
    }

    .payout-row:last-child {
      border-bottom: none;
    }

    .payout-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .payout-date {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
    }

    .payout-number {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .payout-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .payout-amount {
      font-size: 1.125rem;
      font-weight: 700;
      color: #059669;
    }

    .payout-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-received {
      color: #059669;
    }

    .status-sent {
      color: #f59e0b;
    }

    .view-details-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .view-details-button:hover {
      background: #2563eb;
    }

    .pagination {
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e5e7eb;
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .pagination-controls {
      display: flex;
      gap: 0.5rem;
    }

    .pagination-button {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pagination-button:hover:not(.disabled) {
      background: #e5e7eb;
    }

    .pagination-button.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .pagination-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-payouts {
      text-align: center;
      padding: 3rem 2rem;
      color: #6b7280;
    }

    .empty-payouts-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .tab-button {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
      }

      .payout-history-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .date-range-filter {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .custom-date-inputs {
        margin-left: 0;
        flex-direction: column;
      }

      .payout-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
    }
  `]
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
    private balanceService: MockConsignorBalanceService,
    private payoutService: MockConsignorPayoutService,
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

    // For demo purposes, randomly choose between normal balance and empty balance
    const useEmptyState = Math.random() < 0.2; // 20% chance of empty state

    const balanceObservable = useEmptyState ?
      this.balanceService.getEmptyBalance() :
      this.balanceService.getConsignorBalance();

    balanceObservable.subscribe({
      next: (balance) => {
        this.consignorBalance = balance;
      },
      error: (err) => {
        this.error = 'Failed to load balance information. Please try again.';
        console.error('Balance error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.PAYOUTS_LIST);
      }
    });
  }

  refreshBalance() {
    // Silent refresh without showing loading spinner
    const useEmptyState = Math.random() < 0.2;

    const balanceObservable = useEmptyState ?
      this.balanceService.getEmptyBalance() :
      this.balanceService.getConsignorBalance();

    balanceObservable.subscribe({
      next: (balance) => {
        this.consignorBalance = balance;
      },
      error: (err) => {
        console.error('Silent balance refresh error:', err);
        // Don't show error for silent refresh - user can manually refresh
      }
    });
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
    this.balanceService.confirmPayoutReceived(payoutId).subscribe({
      next: () => {
        // In a real app, you'd refresh the balance or update the UI
        console.log('Payout confirmed as received');
        this.loadBalance(); // Reload to get updated balance
      },
      error: (err) => {
        console.error('Error confirming payout:', err);
        // Show error message to user
      }
    });
  }

  onRequestPayout() {
    this.showRequestModal = true;
  }

  loadRequestStatus() {
    this.balanceService.getPayoutRequestStatus().subscribe({
      next: (status) => {
        this.requestStatus = status;
      },
      error: (err) => {
        console.error('Error loading request status:', err);
      }
    });
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

    this.payoutService.getPayoutHistory(query).subscribe({
      next: (result) => {
        this.payoutHistory = result;
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