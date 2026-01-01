import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { OwnerLayoutComponent } from './owner-layout.component';
import { PayoutService, PayoutStatus } from '../../services/payout.service';
import {
  PayoutListDto,
  PayoutDto,
  PayoutSearchRequest,
  CreatePayoutRequest,
  PendingPayoutData,
  UpdatePayoutRequest
} from '../../models/payout.model';
import { ConsignorService } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';
import { ConsignorStatementModalComponent, ConsignorOption } from '../../shared/components/consignor-statement-modal.component';

@Component({
  selector: 'app-owner-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent, ConsignorStatementModalComponent],
  templateUrl: './owner-payouts.component.html',
  styles: [`
    .page-container {
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

    .page-title {
      font-size: 2rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .filter-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 1rem;
    }

    .pending-section {
      margin-bottom: 2rem;
    }

    .pending-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .pending-section h2 {
      color: #1f2937;
      margin: 0;
    }

    .view-toggle {
      display: flex;
      gap: 0.5rem;
    }

    .toggle-btn {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background: #f9fafb;
    }

    .toggle-btn.active {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .toggle-btn svg {
      width: 16px;
      height: 16px;
    }

    .pending-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .pending-card {
      background: #f0fdf4;
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 1rem;
    }

    .pending-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .pending-table th,
    .pending-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .pending-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    .pending-table tbody tr:hover {
      background: #f9fafb;
    }

    .pending-table .amount-cell {
      font-weight: 600;
      color: #047857;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #047857;
    }

    .card-header .amount {
      font-weight: bold;
      color: #047857;
      font-size: 1.2rem;
    }

    .table-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-header h2 {
      margin: 0;
      color: #1f2937;
    }

    .table-info {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .payouts-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payouts-table th {
      background: #f9fafb;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .payouts-table th.sortable {
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    .payouts-table th.sortable:hover {
      background: #f3f4f6;
    }

    .sort-indicator {
      position: absolute;
      right: 5px;
      opacity: 0.5;
    }

    .sort-indicator.asc::after {
      content: '▲';
    }

    .sort-indicator.desc::after {
      content: '▼';
    }

    .payouts-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .payouts-table tr:hover {
      background: #f9fafb;
    }

    .payout-number {
      font-weight: 600;
      color: #1f2937;
    }

    .consignor-name {
      font-weight: 500;
    }

    .amount {
      font-weight: 600;
      color: #059669;
    }

    .period {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .text-center {
      text-align: center;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .pagination-section {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-controls {
      display: flex;
      gap: 0.5rem;
    }

    .page-btn.active {
      background: #3b82f6;
      color: white;
    }

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
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.large {
      max-width: 800px;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #1f2937;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
    }

    .close-btn:hover {
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.25rem;
      font-weight: 500;
      color: #374151;
    }

    .form-control, .form-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .detail-item {
      margin-bottom: 1rem;
    }

    .detail-item label {
      font-weight: 600;
      color: #374151;
      display: block;
      margin-bottom: 0.25rem;
    }

    .transactions-section h4 {
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .transactions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .transactions-table th,
    .transactions-table td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .transactions-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      text-decoration: none;
      display: inline-block;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
      border-color: #6b7280;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn-success {
      background: #059669;
      color: white;
      border-color: #059669;
    }

    .btn-success:hover:not(:disabled) {
      background: #047857;
    }

    .btn-outline-primary {
      background: transparent;
      color: #3b82f6;
      border-color: #3b82f6;
    }

    .btn-outline-primary:hover {
      background: #3b82f6;
      color: white;
    }

    .btn-outline-secondary {
      background: transparent;
      color: #6b7280;
      border-color: #6b7280;
    }

    .btn-outline-secondary:hover {
      background: #6b7280;
      color: white;
    }

    .btn-outline-success {
      background: transparent;
      color: #059669;
      border-color: #059669;
    }

    .btn-outline-success:hover {
      background: #059669;
      color: white;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 1rem;
      }

      .filter-row {
        grid-template-columns: 1fr;
      }

      .pending-grid {
        grid-template-columns: 1fr;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .payouts-table {
        font-size: 0.8rem;
      }

      .actions {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `]
})
export class OwnerPayoutsComponent implements OnInit {
  // State signals
  payouts = signal<PayoutListDto[]>([]);
  pendingPayouts = signal<PendingPayoutData[]>([]);
  consignors = signal<Consignor[]>([]);
  selectedPayout = signal<PayoutDto | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalPayouts = signal(0);
  pageSize = 10;

  // Filters
  selectedConsignorId = '';
  selectedStatus = '';
  dateFrom = '';
  dateTo = '';
  sortBy = 'payoutDate';
  sortDirection = 'desc';

  // Modals
  showCreatePayoutModal = false;
  showViewModal = false;
  showStatementModal = false;

  // View toggle
  pendingPayoutsViewMode: 'cards' | 'table' = 'cards';

  // Form data
  newPayout: Partial<CreatePayoutRequest> = {
    consignorId: '',
    payoutDate: new Date(),
    paymentMethod: '',
    paymentReference: '',
    notes: '',
    transactionIds: []
  };

  // Computed values
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  availableConsignorOptions = computed((): ConsignorOption[] => {
    return this.consignors().map(consignor => ({
      id: consignor.id.toString(),
      name: consignor.name,
      email: consignor.email
    }));
  });

  private loadingService = inject(LoadingService);

  isComponentLoading(): boolean {
    return this.loadingService.isLoading('owner-payouts');
  }

  constructor(
    private payoutService: PayoutService,
    private ConsignorService: ConsignorService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadconsignors();
    this.loadPendingPayouts();
    this.loadPayouts();
  }

  async loadconsignors() {
    try {
      const consignors = await this.ConsignorService.getConsignors().toPromise();
      this.consignors.set(consignors || []);
    } catch (error) {
      console.error('Error loading consignors:', error);
      this.toastr.error('Failed to load consignors');
    }
  }

  async loadPendingPayouts() {
    try {
      const pending = await this.payoutService.getPendingPayouts().toPromise();
      this.pendingPayouts.set(pending || []);
    } catch (error) {
      console.error('Error loading pending payouts:', error);
      this.toastr.error('Failed to load pending payouts');
    }
  }

  async loadPayouts() {
    this.loadingService.start('owner-payouts');

    try {
      const request: PayoutSearchRequest = {
        page: this.currentPage(),
        pageSize: this.pageSize,
        sortBy: this.sortBy,
        sortDirection: this.sortDirection
      };

      if (this.selectedConsignorId) request.consignorId = this.selectedConsignorId;
      if (this.selectedStatus) request.status = this.selectedStatus as PayoutStatus;
      if (this.dateFrom) request.payoutDateFrom = new Date(this.dateFrom);
      if (this.dateTo) request.payoutDateTo = new Date(this.dateTo);

      const response = await this.payoutService.getPayouts(request).toPromise();

      if (response) {
        this.payouts.set(response.data);
        this.totalPages.set(response.totalPages);
        this.totalPayouts.set(response.totalCount);
      }
    } catch (error) {
      console.error('Error loading payouts:', error);
      this.toastr.error('Failed to load payouts');
    } finally {
      this.loadingService.stop('owner-payouts');
    }
  }

  createPayoutForConsignor(pending: PendingPayoutData) {
    this.newPayout = {
      consignorId: pending.consignorId,
      payoutDate: new Date(),
      paymentMethod: '',
      paymentReference: '',
      periodStart: pending.earliestSale,
      periodEnd: pending.latestSale,
      notes: '',
      transactionIds: pending.transactions.map(t => t.transactionId)
    };
    this.showCreatePayoutModal = true;
  }

  async createPayout() {
    try {
      if (!this.newPayout.consignorId || !this.newPayout.paymentMethod || !this.newPayout.transactionIds?.length) {
        this.toastr.error('Please fill in all required fields');
        return;
      }

      const request: CreatePayoutRequest = {
        consignorId: this.newPayout.consignorId!,
        payoutDate: this.newPayout.payoutDate!,
        paymentMethod: this.newPayout.paymentMethod!,
        paymentReference: this.newPayout.paymentReference,
        periodStart: this.newPayout.periodStart!,
        periodEnd: this.newPayout.periodEnd!,
        notes: this.newPayout.notes,
        transactionIds: this.newPayout.transactionIds!
      };

      await this.payoutService.createPayout(request).toPromise();

      this.toastr.success('Payout created successfully');
      this.showCreatePayoutModal = false;
      this.refreshData();
    } catch (error) {
      console.error('Error creating payout:', error);
      this.toastr.error('Failed to create payout');
    }
  }

  async viewPayout(id: string) {
    try {
      const payout = await this.payoutService.getPayoutById(id).toPromise();
      this.selectedPayout.set(payout!);
      this.showViewModal = true;
    } catch (error) {
      console.error('Error loading payout details:', error);
      this.toastr.error('Failed to load payout details');
    }
  }

  editPayout(payout: PayoutListDto) {
    // TODO: Implement edit functionality
    this.toastr.info('Edit functionality coming soon');
  }

  async exportPayout(id: string, format: 'csv' | 'pdf') {
    try {
      const blob = format === 'csv'
        ? await this.payoutService.exportPayoutToCsv(id).toPromise()
        : await this.payoutService.exportPayoutToPdf(id).toPromise();

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payout-${id}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.toastr.success(`Payout exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error(`Error exporting payout as ${format}:`, error);
      this.toastr.error(`Failed to export payout as ${format.toUpperCase()}`);
    }
  }

  refreshData() {
    this.loadPendingPayouts();
    this.loadPayouts();
  }

  sort(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.loadPayouts();
  }

  getSortClass(column: string): string {
    if (this.sortBy === column) {
      return this.sortDirection;
    }
    return '';
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayouts();
    }
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showCreatePayoutModal = false;
      this.showViewModal = false;
      this.showStatementModal = false;
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  }
}