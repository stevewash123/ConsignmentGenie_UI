import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { consignorsale, consignorsaleQuery } from '../models/consignor.models';
import { PagedResult } from '../../shared/models/api.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-sales',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consignor-sales.component.html',
  styleUrls: ['./consignor-sales.component.scss']
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