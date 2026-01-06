import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayoutService } from '../../services/payout.service';
import { PayoutDetailModalComponent } from '../../shared/components/payout-detail-modal.component';

interface PayoutHistoryItem {
  id: string;
  payoutNumber: string;
  date: Date;
  consignorId: string;
  consignorName: string;
  amount: number;
  method: string;
  status: string;
  notes?: string;
  processedBy: string;
  itemCount: number;
}

interface PayoutFilters {
  consignorId?: string;
  method?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

interface PayoutHistoryResponse {
  payouts: PayoutHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Component({
  selector: 'app-payout-history',
  standalone: true,
  imports: [CommonModule, FormsModule, PayoutDetailModalComponent],
  templateUrl: './payout-history.component.html',
  styleUrl: './payout-history.component.css'
})
export class PayoutHistoryComponent implements OnInit {
  payouts: PayoutHistoryItem[] = [];
  loading = false;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  // Filters
  filters: PayoutFilters = {};
  searchTerm = '';

  // Filter options
  consignors: { id: string, name: string }[] = [];
  paymentMethods = ['Check', 'Cash', 'Venmo', 'PayPal', 'Bank Transfer', 'Other'];

  // Detail modal
  showDetailModal = false;
  selectedPayoutId: string | null = null;

  constructor(private payoutService: PayoutService) {}

  ngOnInit() {
    this.loadPayouts();
    this.loadConsignors();
  }

  async loadPayouts() {
    this.loading = true;
    try {
      const response = await this.payoutService.getPayoutHistory({
        ...this.filters,
        searchTerm: this.searchTerm || undefined,
        page: this.currentPage,
        pageSize: this.pageSize
      });

      this.payouts = response.payouts;
      this.totalCount = response.totalCount;
      this.totalPages = response.totalPages;
      this.currentPage = response.page;
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      this.loading = false;
    }
  }

  loadConsignors() {
    this.payoutService.getConsignorsList().subscribe({
      next: (consignors) => {
        this.consignors = consignors;
      },
      error: (error) => {
        console.error('Error loading consignors:', error);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadPayouts();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadPayouts();
  }

  clearFilters() {
    this.filters = {};
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadPayouts();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPayouts();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  showPayoutDetail(payoutId: string) {
    this.selectedPayoutId = payoutId;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedPayoutId = null;
  }

  onPayoutUpdated() {
    // Refresh the list when a payout is updated
    this.loadPayouts();
    this.closeDetailModal();
  }

  exportToCSV() {
    this.payoutService.exportPayoutHistoryCSV({
      ...this.filters,
      searchTerm: this.searchTerm || undefined
    }).subscribe({
      next: (csv) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payout-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting CSV:', error);
        alert('Failed to export CSV. Please try again.');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Helper methods for template
  Math = Math;

  hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
           Object.keys(this.filters).some(key => this.filters[key as keyof PayoutFilters] !== undefined && this.filters[key as keyof PayoutFilters] !== '');
  }
}