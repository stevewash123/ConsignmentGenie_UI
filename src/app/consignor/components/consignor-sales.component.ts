import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { consignorsale, PagedResult, consignorsaleQuery } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-sales',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consignor-sales.component.html',
  styles: [`
    .consignor-sales {
      min-height: 100vh;
      background: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nav-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
    }

    .nav-links a:hover,
    .nav-links a.active {
      color: #3b82f6;
      background: #f3f4f6;
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 2rem 0;
    }

    .filters {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .filter-group select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      color: #374151;
      min-width: 160px;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }

    .sales-table {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .table-header {
      display: grid;
      grid-template-columns: 120px 2fr 120px 120px 100px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .table-row {
      display: grid;
      grid-template-columns: 120px 2fr 120px 120px 100px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .table-row:hover {
      background: #f9fafb;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .col {
      display: flex;
      align-items: center;
    }

    .item-info {
      min-width: 0;
    }

    .item-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-sku {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .payout-status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .payout-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .payout-paid {
      background: #dcfce7;
      color: #166534;
    }

    .no-sales {
      padding: 3rem;
      text-align: center;
      color: #6b7280;
      font-style: italic;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .pagination-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
    }

    .pagination-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .pagination-info {
      font-weight: 500;
      color: #374151;
    }

    .summary {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .summary-card {
      padding: 1.5rem;
    }

    .summary-card h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .amount {
      font-weight: 600;
      color: #111827;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
    }

    .error button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .nav-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .nav-links {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .content {
        padding: 1rem;
      }

      .filters {
        flex-direction: column;
        gap: 1rem;
      }

      .table-header {
        display: none;
      }

      .table-row {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
      }

      .col {
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .col:last-child {
        border-bottom: none;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class ConsignorSalesComponent implements OnInit {
  salesResult: PagedResult<consignorsale> | null = null;
  error: string | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  selectedDateRange = 'all';
  selectedPayoutStatus = 'all';
  currentPage = 1;
  pageSize = 20;

  // Summary calculations
  pendingEarnings = 0;
  pendingItemCount = 0;
  totalShownEarnings = 0;

  constructor(
    private ConsignorService: ConsignorPortalService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadSales();
  }

  loadSales() {
    this.loadingService.start(LOADING_KEYS.SALES_LIST);
    this.error = null;

    const query: consignorsaleQuery = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    // Apply date range filter
    const { dateFrom, dateTo } = this.getDateRange();
    if (dateFrom) query.dateFrom = dateFrom;
    if (dateTo) query.dateTo = dateTo;

    // Apply payout status filter
    if (this.selectedPayoutStatus !== 'all') {
      query.payoutStatus = this.selectedPayoutStatus;
    }

    this.ConsignorService.getMySales(query).subscribe({
      next: (result) => {
        this.salesResult = result;
        this.calculateSummary();
      },
      error: (err) => {
        this.error = 'Failed to load sales. Please try again.';
        console.error('Sales error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.SALES_LIST);
      }
    });
  }

  getDateRange(): { dateFrom: Date | null; dateTo: Date | null } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (this.selectedDateRange) {
      case 'thisMonth':
        return {
          dateFrom: new Date(now.getFullYear(), now.getMonth(), 1),
          dateTo: null
        };
      case 'lastMonth':
        return {
          dateFrom: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          dateTo: new Date(now.getFullYear(), now.getMonth(), 0)
        };
      case 'last3Months':
        return {
          dateFrom: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          dateTo: null
        };
      case 'thisYear':
        return {
          dateFrom: new Date(now.getFullYear(), 0, 1),
          dateTo: null
        };
      default:
        return { dateFrom: null, dateTo: null };
    }
  }

  calculateSummary() {
    if (!this.salesResult) return;

    this.pendingEarnings = this.salesResult.items
      .filter(sale => sale.payoutStatus.toLowerCase() === 'pending')
      .reduce((sum, sale) => sum + sale.myEarnings, 0);

    this.pendingItemCount = this.salesResult.items
      .filter(sale => sale.payoutStatus.toLowerCase() === 'pending').length;

    this.totalShownEarnings = this.salesResult.items
      .reduce((sum, sale) => sum + sale.myEarnings, 0);
  }

  onDateRangeChange() {
    this.currentPage = 1;
    this.loadSales();
  }

  onPayoutStatusChange() {
    this.currentPage = 1;
    this.loadSales();
  }

  goToPage(page: number) {
    if (page >= 1 && this.salesResult && page <= this.salesResult.totalPages) {
      this.currentPage = page;
      this.loadSales();
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  getPayoutStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'payout-pending';
      case 'paid': return 'payout-paid';
      default: return 'payout-pending';
    }
  }

  getPayoutStatusDisplay(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'paid': return 'Paid ✓';
      default: return status;
    }
  }
}