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
  styles: [`
    .sales-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .page-header h1 {
      color: #059669;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }

    .page-header p {
      color: #6b7280;
      margin: 0;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #059669;
      color: white;
    }

    .btn-primary:hover {
      background: #047857;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .filters-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
    }

    .filter-group label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .filter-input, .filter-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .filter-input:focus, .filter-select:focus {
      outline: none;
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
      border-left: 4px solid #059669;
    }

    .summary-card.total { border-left-color: #059669; }
    .summary-card.shop { border-left-color: #0891b2; }
    .summary-card.consignor { border-left-color: #7c3aed; }
    .summary-card.average { border-left-color: #f59e0b; }

    .summary-card h3 {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }

    .summary-value {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .summary-detail {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .transactions-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-header h2 {
      color: #1f2937;
      font-size: 1.25rem;
      margin: 0;
    }

    .page-size-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .table-container {
      overflow-x: auto;
    }

    .transactions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .transactions-table th {
      background: #f9fafb;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .transactions-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .transactions-table th.sortable:hover {
      background: #f3f4f6;
    }

    .sort-indicator {
      opacity: 0.3;
      margin-left: 0.5rem;
    }

    .sort-indicator.active {
      opacity: 1;
      color: #059669;
    }

    .transaction-row {
      border-bottom: 1px solid #e5e7eb;
    }

    .transaction-row:hover {
      background: #f9fafb;
    }

    .transaction-row td {
      padding: 1rem;
      vertical-align: top;
    }

    .item-info, .consignor-info {
      display: flex;
      flex-direction: column;
    }

    .item-name, .consignor-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .item-description, .commission-rate {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .sale-price {
      font-weight: 600;
      color: #1f2937;
    }

    .tax-amount {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .payment-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .payment-cash { background: #dcfce7; color: #166534; }
    .payment-card { background: #dbeafe; color: #1e40af; }
    .payment-online { background: #fdf4ff; color: #7c2d12; }

    .commission-cell, .shop-amount-cell {
      font-weight: 600;
      color: #059669;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .page-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .page-btn.active {
      background: #059669;
      color: white;
      border-color: #059669;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      gap: 0.5rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #6b7280;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #059669;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      color: #1f2937;
      font-size: 1.5rem;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
    }

    .form-control:invalid {
      border-color: #ef4444;
    }

    .consignor-info-display {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 0.75rem;
    }

    .consignor-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .commission-rate {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .commission-split {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .commission-split h4 {
      color: #1f2937;
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }

    .split-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .split-row.total {
      border-top: 1px solid #d1d5db;
      padding-top: 0.5rem;
      margin-top: 0.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .split-row .amount {
      font-weight: 600;
      color: #059669;
    }

    .split-row.total .amount {
      color: #1f2937;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary.loading {
      position: relative;
      color: transparent;
    }

    .btn-primary.loading:after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Detail Modal Styles */
    .detail-modal {
      max-width: 900px;
    }

    .transaction-detail {
      max-height: 80vh;
      overflow-y: auto;
    }

    /* Header section with key info */
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      color: white;
    }

    .header-main h3 {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .header-meta {
      display: flex;
      gap: 1rem;
      opacity: 0.9;
    }

    .transaction-id {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .sale-date {
      font-size: 0.875rem;
    }

    .header-amount {
      text-align: right;
    }

    .sale-total {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.5rem;
    }

    .payment-method .payment-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    /* Two column layout */
    .detail-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .detail-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .detail-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
    }

    .detail-section.full-width {
      grid-column: 1 / -1;
      margin-top: 1rem;
    }

    .detail-section h4 {
      color: #1e293b;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .detail-grid {
      display: grid;
      gap: 0.75rem;
    }

    .detail-grid.compact {
      gap: 0.5rem;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 0.75rem;
      align-items: center;
    }

    .detail-row label {
      font-weight: 600;
      color: #475569;
      font-size: 0.875rem;
    }

    .detail-row span {
      color: #1e293b;
      font-size: 0.875rem;
    }

    .detail-row .amount {
      font-weight: 600;
      color: #059669;
    }

    /* Commission breakdown */
    .commission-breakdown {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1rem;
    }

    .commission-breakdown.compact {
      padding: 0.75rem;
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      color: #475569;
      font-size: 0.875rem;
    }

    .breakdown-row:last-child {
      margin-bottom: 0;
    }

    .breakdown-row .amount {
      font-weight: 600;
    }

    .breakdown-row .consignor-amount {
      color: #7c3aed;
    }

    .breakdown-row .shop-amount {
      color: #0891b2;
    }

    /* Notes section */
    .notes-content {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1rem;
      color: #475569;
      line-height: 1.5;
      font-size: 0.875rem;
    }

    /* Edit Transaction Modal */
    .edit-modal-content {
      max-width: 600px;
      max-height: 90vh;
    }

    .modal-header.compact {
      padding: 1rem 1.5rem;
    }

    .modal-body.compact {
      padding: 0 1.5rem 1.5rem;
    }

    .transaction-summary.compact {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .consignor-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .form-group.compact {
      margin-bottom: 1rem;
    }

    .form-group.compact label {
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
    }

    .form-control.compact {
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .commission-split-inline {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    .split-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .split-item {
      font-size: 0.875rem;
      color: #475569;
    }

    .split-item.total {
      color: #059669;
      font-weight: 600;
    }

    .modal-actions.compact {
      padding-top: 1rem;
      margin-top: 0;
    }

    /* Confirmation Dialog */
    .confirm-dialog {
      max-width: 500px;
    }

    .confirm-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .confirm-header.destructive {
      border-bottom-color: #fecaca;
      background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
    }

    .confirm-icon {
      font-size: 2rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 50%;
    }

    .confirm-header.destructive .confirm-icon {
      background: #fee2e2;
    }

    .confirm-header h3 {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .confirm-body {
      padding: 1rem 1.5rem;
    }

    .confirm-body p {
      color: #475569;
      line-height: 1.5;
      margin: 0;
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem 1.5rem 1.5rem;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
      border: 1px solid #dc2626;
    }

    .btn-danger:hover {
      background: #b91c1c;
      border-color: #b91c1c;
    }

    @media (max-width: 768px) {
      .sales-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filter-row {
        grid-template-columns: 1fr;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .transactions-table {
        font-size: 0.875rem;
      }

      .transactions-table th,
      .transactions-table td {
        padding: 0.75rem 0.5rem;
      }

      .modal-overlay {
        padding: 0.5rem;
      }

      .modal-content {
        max-height: 95vh;
      }

      .modal-actions {
        flex-direction: column;
        gap: 0.75rem;
      }

      .modal-actions button {
        width: 100%;
      }

      .detail-modal {
        max-width: 95vw;
      }

      .detail-header {
        flex-direction: column;
        gap: 1rem;
        text-align: left;
      }

      .header-amount {
        text-align: left !important;
      }

      .sale-total {
        font-size: 1.5rem;
      }

      .header-meta {
        flex-direction: column;
        gap: 0.5rem;
      }

      .detail-columns {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .detail-row {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }

      .detail-row label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
      }

      .breakdown-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.25rem;
      }

      .breakdown-row .amount {
        text-align: right;
        font-size: 1rem;
      }

      /* Mobile styles for compact edit modal */
      .edit-modal-content {
        max-width: 95vw;
        max-height: 95vh;
      }

      .form-row-2 {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .summary-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .split-summary {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .split-item {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .split-item:last-child {
        border-bottom: none;
        padding-top: 0.5rem;
        border-top: 2px solid #059669;
        margin-top: 0.25rem;
      }
    }
  `]
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
      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
      },
      complete: () => {
        this.loadingService.stop('owner-sales');
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
      message: `Are you sure you want to void the sale of "${transaction.item.name}"? This will restore the item to inventory and cannot be undone.`,
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
      message: `Are you sure you want to update this transaction? The sale price will change from $${transaction.salePrice.toFixed(2)} to $${this.editForm_salePrice.toFixed(2)}.`,
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