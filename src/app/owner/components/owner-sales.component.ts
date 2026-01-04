import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { OwnerLayoutComponent } from './owner-layout.component';
import { TransactionService, TransactionQueryParams, PagedResult, UpdateTransactionRequest, VoidTransactionResponse } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-owner-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, OwnerLayoutComponent],
  templateUrl: './owner-sales.component.html',
  styleUrls: ['./owner-sales.component.scss']
})
export class OwnerSalesComponent implements OnInit {
  pagedResult = signal<PagedResult<Transaction> | null>(null);
  summary = signal<any>(null);

  // Filters
  filters = {
    startDate: '',
    endDate: '',
    paymentMethod: ''
  };

  // Pagination
  currentPage = 1;
  pageSize = 20;

  // Sorting
  sortBy = 'saleDate';
  sortDirection = 'desc';

  // Modal state
  showDetailModal = false;
  showEditModal = false;
  showConfirmDialog = false;
  isSubmitting = signal(false);
  selectedTransactionForDetail = signal<Transaction | null>(null);
  selectedTransactionForEdit = signal<Transaction | null>(null);

  // Confirmation dialog state
  confirmDialog = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmAction: () => {},
    isDestructive: false
  };


  // Edit form data
  editForm_salePrice: number | null = null;
  editForm_salesTax: number | null = null;
  editForm_paymentMethod: string = '';
  editForm_notes: string = '';


  private toastr = inject(ToastrService);
  private loadingService = inject(LoadingService);

  isComponentLoading(): boolean {
    return this.loadingService.isLoading('owner-sales');
  }

  constructor(
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadSummary();
  }

  private buildQueryParams(): TransactionQueryParams {
    return {
      startDate: this.filters.startDate ? new Date(this.filters.startDate) : undefined,
      endDate: this.filters.endDate ? new Date(this.filters.endDate) : undefined,
      paymentMethod: this.filters.paymentMethod || undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };
  }

  loadTransactions() {
    this.loadingService.start('owner-sales');

    this.transactionService.getTransactions(this.buildQueryParams()).subscribe({
      next: (result) => {
        this.pagedResult.set(result);
        this.loadingService.stop('owner-sales');
      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
        this.loadingService.stop('owner-sales');
        this.showNotification('Failed to load transactions. Please try again.', 'error', 'Error Loading Data');
      }
    });
  }

  loadSummary() {
    const queryParams = {
      startDate: this.filters.startDate ? new Date(this.filters.startDate) : undefined,
      endDate: this.filters.endDate ? new Date(this.filters.endDate) : undefined
    };

    this.transactionService.getSalesMetrics(queryParams).subscribe({
      next: (metrics) => {
        this.summary.set(metrics);
      },
      error: (error) => {
        console.error('Failed to load sales metrics:', error);
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadTransactions();
    this.loadSummary();
  }

  clearFilters() {
    this.filters = {
      startDate: '',
      endDate: '',
      paymentMethod: ''
    };
    this.applyFilters();
  }

  setSorting(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'desc';
    }
    this.loadTransactions();
  }

  updatePageSize() {
    this.currentPage = 1;
    this.loadTransactions();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= (this.pagedResult()?.totalPages || 1)) {
      this.currentPage = page;
      this.loadTransactions();
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.pagedResult()?.totalPages || 1;
    const pages: number[] = [];
    const maxPages = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  viewTransaction(transaction: Transaction) {
    this.selectedTransactionForDetail.set(transaction);
    this.showDetailModal = true;
  }

  editTransaction(transaction: Transaction) {
    this.selectedTransactionForEdit.set(transaction);
    this.initializeEditForm(transaction);
    this.showEditModal = true;
  }

  canVoidTransaction(transaction: Transaction): boolean {
    // Can only void transactions from the current day
    const today = new Date();
    const transactionDate = new Date(transaction.saleDate);

    return today.toDateString() === transactionDate.toDateString();
  }

  voidTransaction(transaction: Transaction) {
    if (!this.canVoidTransaction(transaction)) {
      this.showNotification('Only same-day transactions can be voided.', 'warning', 'Cannot Void');
      return;
    }

    this.showConfirmDialog = true;
    this.confirmDialog = {
      title: 'Void Sale',
      message: `Are you sure you want to void the sale of "${transaction.items?.[0]?.item?.title || 'this item'}"? This will restore the item to inventory and cannot be undone.`,
      confirmText: 'Void Sale',
      cancelText: 'Cancel',
      isDestructive: true,
      confirmAction: () => {
        this.performVoidTransaction(transaction);
      }
    };
  }

  voidTransactionFromDetail() {
    const transaction = this.selectedTransactionForDetail();
    if (transaction) {
      this.closeDetailModal();
      this.voidTransaction(transaction);
    }
  }

  private performVoidTransaction(transaction: Transaction) {
    this.transactionService.voidTransaction(transaction.id, 'Voided by shop owner').subscribe({
      next: (response: VoidTransactionResponse) => {
        this.loadTransactions();
        this.loadSummary();

        const message = response.message ||
          `Sale voided successfully. ${response.itemsRestored} item(s) restored to inventory.`;

        this.showNotification(message, 'success', 'Transaction Voided');
      },
      error: (error) => {
        console.error('Failed to void transaction:', error);

        let errorMessage = 'Failed to void the sale. Please try again.';
        if (error.status === 400) {
          errorMessage = error.error?.message || 'Transaction cannot be voided at this time.';
        }

        this.showNotification(errorMessage, 'error', 'Void Failed');
      }
    });
  }

  // Modal and Form Management

  closeDetailModal(event?: Event) {
    this.showDetailModal = false;
    this.selectedTransactionForDetail.set(null);
  }

  editTransactionFromDetail() {
    const transaction = this.selectedTransactionForDetail();
    if (transaction) {
      this.closeDetailModal();
      this.editTransaction(transaction);
    }
  }


  // Edit Transaction Methods
  initializeEditForm(transaction: Transaction) {
    this.editForm_salePrice = transaction.salePrice;
    this.editForm_salesTax = transaction.salesTaxAmount || null;
    this.editForm_paymentMethod = transaction.paymentMethod;
    this.editForm_notes = transaction.notes || '';
  }

  closeEditModal(event?: Event) {
    this.showEditModal = false;
    this.selectedTransactionForEdit.set(null);
    this.clearEditForm();
  }

  clearEditForm() {
    this.editForm_salePrice = null;
    this.editForm_salesTax = null;
    this.editForm_paymentMethod = '';
    this.editForm_notes = '';
  }

  onSubmitEditTransaction() {
    const transaction = this.selectedTransactionForEdit();
    if (!transaction || !this.editForm_salePrice || !this.editForm_paymentMethod) {
      this.showNotification('Please fill in all required fields.', 'error', 'Validation Error');
      return;
    }

    this.showConfirmDialog = true;
    this.confirmDialog = {
      title: 'Update Transaction',
      message: `Are you sure you want to update this transaction? The sale price will change from ${transaction.salePrice.toFixed(2)} to ${this.editForm_salePrice.toFixed(2)}.`,
      confirmText: 'Update Transaction',
      cancelText: 'Cancel',
      isDestructive: false,
      confirmAction: () => {
        this.submitEditTransaction();
      }
    };
  }

  submitEditTransaction() {
    const transaction = this.selectedTransactionForEdit();
    if (!transaction) return;

    this.isSubmitting.set(true);

    const updateRequest = {
      salePrice: this.editForm_salePrice!,
      salesTaxAmount: this.editForm_salesTax || undefined,
      paymentMethod: this.editForm_paymentMethod,
      notes: this.editForm_notes || undefined
    };

    this.transactionService.updateTransaction(transaction.id, updateRequest).subscribe({
      next: (updatedTransaction) => {
        this.isSubmitting.set(false);
        this.showEditModal = false;
        this.clearEditForm();

        // Reload data to reflect the updated transaction
        this.loadTransactions();
        this.loadSummary();

        this.showNotification(`Transaction updated successfully!`, 'success', 'Update Complete');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Failed to update transaction:', error);
        this.showNotification('Failed to update the transaction. Please try again.', 'error', 'Update Failed');
      }
    });
  }

  // Confirmation Dialog Methods
  closeConfirmDialog() {
    this.showConfirmDialog = false;
  }

  executeConfirmAction() {
    this.confirmDialog.confirmAction();
    this.closeConfirmDialog();
  }

  // Notification helper using toastr
  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) {
    const options = {
      timeOut: 4000,
      positionClass: 'toast-top-right',
      progressBar: true
    };

    switch (type) {
      case 'success':
        this.toastr.success(message, title || 'Success', options);
        break;
      case 'error':
        this.toastr.error(message, title || 'Error', { ...options, timeOut: 6000 });
        break;
      case 'info':
        this.toastr.info(message, title || 'Info', options);
        break;
      case 'warning':
        this.toastr.warning(message, title || 'Warning', options);
        break;
    }
  }
}