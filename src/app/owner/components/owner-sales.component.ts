import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { OwnerLayoutComponent } from './owner-layout.component';
import { TransactionService, TransactionQueryParams, UpdateTransactionRequest, VoidTransactionResponse } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';
import { LoadingService } from '../../shared/services/loading.service';
import { ColumnFilterComponent, FilterOption } from '../../shared/components/column-filter.component';

// ============================================================================
// Constants
// ============================================================================
const LOADING_KEY = 'owner-sales';
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT_BY = 'saleDate';
const DEFAULT_SORT_DIRECTION = 'desc';

const ERROR_MESSAGES = {
  LOAD_TRANSACTIONS: 'Failed to load transactions',
  UPDATE_TRANSACTION: 'Failed to update transaction',
  VOID_TRANSACTION: 'Failed to void transaction',
  VALIDATION: 'Please fill in all required fields'
} as const;

const SUCCESS_MESSAGES = {
  TRANSACTION_UPDATED: 'Transaction updated successfully',
  TRANSACTION_VOIDED: 'Transaction voided successfully'
} as const;

// ============================================================================
// Component
// ============================================================================
@Component({
  selector: 'app-owner-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, OwnerLayoutComponent, ColumnFilterComponent],
  templateUrl: './owner-sales.component.html',
  styleUrls: ['./owner-sales.component.scss']
})
export class OwnerSalesComponent implements OnInit {
  // Injected services
  private readonly transactionService = inject(TransactionService);
  private readonly toastr = inject(ToastrService);
  private readonly loadingService = inject(LoadingService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // State Signals
  // ============================================================================
  transactions = signal<Transaction[]>([]);
  selectedTransaction = signal<Transaction | null>(null);
  selectedTransactionForDetail = signal<Transaction | null>(null);
  selectedTransactionForEdit = signal<Transaction | null>(null);
  isSubmitting = signal(false);

  // Pagination
  currentPage = 1;
  totalPages = signal(1);
  totalTransactions = signal(0);
  readonly pageSize = DEFAULT_PAGE_SIZE;

  // Filters - object for template binding
  // Note: itemSearch and consignorSearch are UI-only filters (not supported by API)
  filters = {
    startDate: '',
    endDate: '',
    itemSearch: '',        // UI filter only - not sent to API
    consignorSearch: '',   // UI filter only - not sent to API
    paymentMethod: ''
  };

  // Payment method options for select filter
  paymentMethodOptions: FilterOption[] = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Online', label: 'Online' }
  ];

  // Sorting - regular properties for template binding
  sortBy = DEFAULT_SORT_BY;
  sortDirection = DEFAULT_SORT_DIRECTION;

  // Modals - regular properties for template binding
  showDetailModal = false;
  showEditModal = false;
  showConfirmDialog = false;

  // Edit form fields for template binding
  editForm_salePrice = 0;
  editForm_salesTax = 0;
  editForm_paymentMethod = '';
  editForm_notes = '';

  // Confirmation dialog
  confirmDialog = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmAction: () => {},
    isDestructive: false
  };

  // Paged result for template
  pagedResult = computed(() => {
    const items = this.transactions();
    return {
      items: items,
      totalPages: this.totalPages(),
      totalCount: this.totalTransactions()
    };
  });

  // ============================================================================
  // Computed Values
  // ============================================================================
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage;
    const pages: number[] = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  // ============================================================================
  // Lifecycle
  // ============================================================================
  ngOnInit(): void {
    this.loadTransactions();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================
  isComponentLoading(): boolean {
    return this.loadingService.isLoading(LOADING_KEY);
  }

  async loadTransactions(): Promise<void> {
    this.loadingService.start(LOADING_KEY);

    try {
      const params = this.buildQueryParams();
      const result = await firstValueFrom(this.transactionService.getTransactions(params));

      if (result) {
        // Apply client-side filtering for itemSearch and consignorSearch
        let filteredItems = result.items || [];

        if (this.filters.itemSearch) {
          const search = this.filters.itemSearch.toLowerCase();
          filteredItems = filteredItems.filter(t =>
            t.items?.some(item =>
              item.item?.title?.toLowerCase().includes(search) ||
              item.item?.sku?.toLowerCase().includes(search) ||
              item.item?.description?.toLowerCase().includes(search)
            )
          );
        }

        if (this.filters.consignorSearch) {
          const search = this.filters.consignorSearch.toLowerCase();
          filteredItems = filteredItems.filter(t =>
            t.items?.some(item =>
              item.consignor?.name?.toLowerCase().includes(search)
            )
          );
        }

        this.transactions.set(filteredItems);
        this.totalPages.set(result.totalPages);
        this.totalTransactions.set(result.totalCount);
      }
    } catch {
      this.toastr.error(ERROR_MESSAGES.LOAD_TRANSACTIONS);
    } finally {
      this.loadingService.stop(LOADING_KEY);
    }
  }

  viewTransaction(transaction: Transaction): void {
    this.selectedTransactionForDetail.set(transaction);
    this.showDetailModal = true;
  }

  editTransaction(transaction: Transaction): void {
    this.selectedTransactionForEdit.set(transaction);
    this.editForm_salePrice = transaction.salePrice || transaction.total;
    this.editForm_salesTax = transaction.salesTaxAmount || transaction.taxAmount || 0;
    this.editForm_paymentMethod = transaction.paymentMethod || transaction.paymentType;
    this.editForm_notes = transaction.notes || '';
    this.showEditModal = true;
  }

  async updateTransaction(): Promise<void> {
    const transaction = this.selectedTransactionForEdit();

    if (!transaction || !this.editForm_paymentMethod || this.editForm_salePrice <= 0) {
      this.toastr.error(ERROR_MESSAGES.VALIDATION);
      return;
    }

    this.isSubmitting.set(true);
    try {
      const request: UpdateTransactionRequest = {
        salePrice: this.editForm_salePrice,
        salesTaxAmount: this.editForm_salesTax || undefined,
        paymentMethod: this.editForm_paymentMethod,
        notes: this.editForm_notes || undefined
      };

      await firstValueFrom(this.transactionService.updateTransaction(transaction.id, request));

      this.toastr.success(SUCCESS_MESSAGES.TRANSACTION_UPDATED);
      this.showEditModal = false;
      this.loadTransactions();
    } catch {
      this.toastr.error(ERROR_MESSAGES.UPDATE_TRANSACTION);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  voidTransaction(transaction: Transaction): void {
    if (!this.canVoidTransaction(transaction)) {
      this.toastr.warning('Only same-day transactions can be voided');
      return;
    }

    this.confirmDialog = {
      title: 'Void Transaction',
      message: `Are you sure you want to void this sale? This action cannot be undone.`,
      confirmText: 'Void Sale',
      cancelText: 'Cancel',
      isDestructive: true,
      confirmAction: () => this.performVoidTransaction(transaction)
    };

    this.showConfirmDialog = true;
  }

  canVoidTransaction(transaction: Transaction): boolean {
    const today = new Date();
    const transactionDate = new Date(transaction.saleDate || transaction.transactionDate);
    return today.toDateString() === transactionDate.toDateString();
  }

  sort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.loadTransactions();
  }

  // Alias for template compatibility
  setSorting(column: string): void {
    this.sort(column);
  }

  getSortClass(column: string): string {
    if (this.sortBy === column) {
      return this.sortDirection;
    }
    return '';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.loadTransactions();
    }
  }

  getPageNumbers(): number[] {
    return this.visiblePages();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  clearAllFilters(): void {
    this.filters = {
      startDate: '',
      endDate: '',
      itemSearch: '',
      consignorSearch: '',
      paymentMethod: ''
    };
    this.applyFilters();
  }

  // Column filter handlers
  onFilterChange(field: string, value: any): void {
    switch (field) {
      case 'startDate':
        this.filters.startDate = value || '';
        break;
      case 'itemSearch':
        this.filters.itemSearch = value || '';
        break;
      case 'consignorSearch':
        this.filters.consignorSearch = value || '';
        break;
      case 'paymentMethod':
        this.filters.paymentMethod = value || '';
        break;
    }
    this.applyFilters();
  }

  onFilterClear(field: string): void {
    switch (field) {
      case 'startDate':
        this.filters.startDate = '';
        break;
      case 'itemSearch':
        this.filters.itemSearch = '';
        break;
      case 'consignorSearch':
        this.filters.consignorSearch = '';
        break;
      case 'paymentMethod':
        this.filters.paymentMethod = '';
        break;
    }
    this.applyFilters();
  }

  closeModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showDetailModal = false;
      this.showEditModal = false;
      this.showConfirmDialog = false;
    }
  }

  closeDetailModal(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showDetailModal = false;
  }

  closeEditModal(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showEditModal = false;
  }

  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
  }

  executeConfirmAction(): void {
    this.confirmDialog.confirmAction();
    this.closeConfirmDialog();
  }

  // Methods called from detail modal
  editTransactionFromDetail(): void {
    const transaction = this.selectedTransactionForDetail();
    if (transaction) {
      this.showDetailModal = false;
      this.editTransaction(transaction);
    }
  }

  voidTransactionFromDetail(): void {
    const transaction = this.selectedTransactionForDetail();
    if (transaction) {
      this.showDetailModal = false;
      this.voidTransaction(transaction);
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';

    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString();
      }
    }

    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number | undefined): string {
    return amount ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount) : '$0.00';
  }

  // Form submission handler
  onSubmitEditTransaction(): void {
    this.updateTransaction();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================
  private buildQueryParams(): TransactionQueryParams {
    // Only include properties that exist on TransactionQueryParams
    const params: TransactionQueryParams = {
      page: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    if (this.filters.startDate) params.startDate = new Date(this.filters.startDate);
    if (this.filters.endDate) params.endDate = new Date(this.filters.endDate);
    if (this.filters.paymentMethod) params.paymentMethod = this.filters.paymentMethod;
    // Note: itemSearch and consignorSearch are handled client-side in loadTransactions()

    return params;
  }

  private async performVoidTransaction(transaction: Transaction): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.transactionService.voidTransaction(transaction.id, 'Voided by shop owner')
      );

      const message = response.message ||
        `${SUCCESS_MESSAGES.TRANSACTION_VOIDED}. ${response.itemsRestored} item(s) restored to inventory.`;

      this.toastr.success(message);
      this.loadTransactions();
    } catch (error: any) {
      let errorMessage = ERROR_MESSAGES.VOID_TRANSACTION;
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Transaction cannot be voided at this time';
      }
      this.toastr.error(errorMessage);
    }
  }
}