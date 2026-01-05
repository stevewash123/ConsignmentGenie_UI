import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { OwnerLayoutComponent } from './owner-layout.component';
import { PayoutService, PayoutStatus } from '../../services/payout.service';
import {
  PayoutListDto,
  PayoutDto,
  PayoutSearchRequest,
  CreatePayoutRequest,
  PendingPayoutData
} from '../../models/payout.model';
import { ConsignorService } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';
import { DownloadService } from '../../shared/services/download.service';
import { ConsignorStatementModalComponent, ConsignorOption } from '../../shared/components/consignor-statement-modal.component';

// ============================================================================
// Constants
// ============================================================================
const LOADING_KEY = 'owner-payouts';
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_BY = 'payoutDate';
const DEFAULT_SORT_DIRECTION = 'desc';

const ERROR_MESSAGES = {
  LOAD_CONSIGNORS: 'Failed to load consignors',
  LOAD_PENDING: 'Failed to load pending payouts',
  LOAD_PAYOUTS: 'Failed to load payouts',
  CREATE_PAYOUT: 'Failed to create payout',
  VIEW_PAYOUT: 'Failed to load payout details',
  EXPORT_PAYOUT: (format: string) => `Failed to export payout as ${format.toUpperCase()}`,
  VALIDATION: 'Please fill in all required fields'
} as const;

const SUCCESS_MESSAGES = {
  PAYOUT_CREATED: 'Payout created successfully',
  EXPORT_SUCCESS: (format: string) => `Payout exported as ${format.toUpperCase()}`
} as const;

// ============================================================================
// Component
// ============================================================================
@Component({
  selector: 'app-owner-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent, ConsignorStatementModalComponent],
  templateUrl: './owner-payouts.component.html',
  styleUrls: ['./owner-payouts.component.scss']
})
export class OwnerPayoutsComponent implements OnInit {
  // Injected services
  private readonly payoutService = inject(PayoutService);
  private readonly consignorService = inject(ConsignorService);
  private readonly toastr = inject(ToastrService);
  private readonly loadingService = inject(LoadingService);
  private readonly downloadService = inject(DownloadService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // State Signals
  // ============================================================================
  payouts = signal<PayoutListDto[]>([]);
  pendingPayouts = signal<PendingPayoutData[]>([]);
  consignors = signal<Consignor[]>([]);
  selectedPayout = signal<PayoutDto | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalPayouts = signal(0);
  readonly pageSize = DEFAULT_PAGE_SIZE;

  // Filters
  selectedConsignorId = signal('');
  selectedStatus = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  sortBy = signal(DEFAULT_SORT_BY);
  sortDirection = signal(DEFAULT_SORT_DIRECTION);

  // Modals
  showCreatePayoutModal = signal(false);
  showViewModal = signal(false);
  showStatementModal = signal(false);

  // View toggle
  pendingPayoutsViewMode = signal<'cards' | 'table'>('cards');

  // Form data
  newPayout = signal<Partial<CreatePayoutRequest>>({
    consignorId: '',
    payoutDate: new Date(),
    paymentMethod: '',
    paymentReference: '',
    notes: '',
    transactionIds: []
  });

  // ============================================================================
  // Computed Values
  // ============================================================================
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

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

  // ============================================================================
  // Lifecycle
  // ============================================================================
  ngOnInit(): void {
    this.loadConsignors();
    this.loadPendingPayouts();
    this.loadPayouts();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================
  isComponentLoading(): boolean {
    return this.loadingService.isLoading(LOADING_KEY);
  }

  async loadConsignors(): Promise<void> {
    try {
      const consignors = await firstValueFrom(this.consignorService.getConsignors());
      this.consignors.set(consignors || []);
    } catch {
      this.toastr.error(ERROR_MESSAGES.LOAD_CONSIGNORS);
    }
  }

  async loadPendingPayouts(): Promise<void> {
    try {
      const pending = await firstValueFrom(this.payoutService.getPendingPayouts());
      this.pendingPayouts.set(pending || []);
    } catch {
      this.toastr.error(ERROR_MESSAGES.LOAD_PENDING);
    }
  }

  async loadPayouts(): Promise<void> {
    this.loadingService.start(LOADING_KEY);

    try {
      const request = this.buildPayoutSearchRequest();
      const response = await firstValueFrom(this.payoutService.getPayouts(request));

      if (response) {
        this.payouts.set(response.data);
        this.totalPages.set(response.totalPages);
        this.totalPayouts.set(response.totalCount);
      }
    } catch {
      this.toastr.error(ERROR_MESSAGES.LOAD_PAYOUTS);
    } finally {
      this.loadingService.stop(LOADING_KEY);
    }
  }

  createPayoutForConsignor(pending: PendingPayoutData): void {
    this.newPayout.set({
      consignorId: pending.consignorId,
      payoutDate: new Date(),
      paymentMethod: '',
      paymentReference: '',
      periodStart: pending.earliestSale,
      periodEnd: pending.latestSale,
      notes: '',
      transactionIds: pending.transactions.map(t => t.transactionId)
    });
    this.showCreatePayoutModal.set(true);
  }

  async createPayout(): Promise<void> {
    const payout = this.newPayout();

    if (!this.isValidPayout(payout)) {
      this.toastr.error(ERROR_MESSAGES.VALIDATION);
      return;
    }

    try {
      const request: CreatePayoutRequest = {
        consignorId: payout.consignorId!,
        payoutDate: payout.payoutDate!,
        paymentMethod: payout.paymentMethod!,
        paymentReference: payout.paymentReference,
        periodStart: payout.periodStart!,
        periodEnd: payout.periodEnd!,
        notes: payout.notes,
        transactionIds: payout.transactionIds!
      };

      await firstValueFrom(this.payoutService.createPayout(request));

      this.toastr.success(SUCCESS_MESSAGES.PAYOUT_CREATED);
      this.showCreatePayoutModal.set(false);
      this.refreshData();
    } catch {
      this.toastr.error(ERROR_MESSAGES.CREATE_PAYOUT);
    }
  }

  async viewPayout(id: string): Promise<void> {
    try {
      const payout = await firstValueFrom(this.payoutService.getPayoutById(id));
      if (payout) {
        this.selectedPayout.set(payout);
        this.showViewModal.set(true);
      }
    } catch {
      this.toastr.error(ERROR_MESSAGES.VIEW_PAYOUT);
    }
  }

  editPayout(payout: PayoutListDto): void {
    // TODO: Implement edit functionality
    this.toastr.info('Edit functionality coming soon');
  }

  async exportPayout(id: string, format: 'csv' | 'pdf'): Promise<void> {
    try {
      const blob = format === 'csv'
        ? await firstValueFrom(this.payoutService.exportPayoutToCsv(id))
        : await firstValueFrom(this.payoutService.exportPayoutToPdf(id));

      if (blob) {
        this.downloadService.downloadBlob(blob, `payout-${id}.${format}`);
        this.toastr.success(SUCCESS_MESSAGES.EXPORT_SUCCESS(format));
      }
    } catch {
      this.toastr.error(ERROR_MESSAGES.EXPORT_PAYOUT(format));
    }
  }

  refreshData(): void {
    this.loadPendingPayouts();
    this.loadPayouts();
  }

  sort(column: string): void {
    if (this.sortBy() === column) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('asc');
    }
    this.loadPayouts();
  }

  getSortClass(column: string): string {
    if (this.sortBy() === column) {
      return this.sortDirection();
    }
    return '';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayouts();
    }
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadPayouts();
  }

  closeModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showCreatePayoutModal.set(false);
      this.showViewModal.set(false);
      this.showStatementModal.set(false);
    }
  }

  closeCreateModal(): void {
    this.showCreatePayoutModal.set(false);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
  }

  closeStatementModal(): void {
    this.showStatementModal.set(false);
  }

  openCreateModal(): void {
    this.showCreatePayoutModal.set(true);
  }

  openStatementModal(): void {
    this.showStatementModal.set(true);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';

    // Handle date strings to avoid timezone issues
    if (typeof date === 'string') {
      // If it's a date-only string (YYYY-MM-DD), parse it as local date
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString();
      }
    }

    return new Date(date).toLocaleDateString();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================
  private buildPayoutSearchRequest(): PayoutSearchRequest {
    const request: PayoutSearchRequest = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection()
    };

    const consignorId = this.selectedConsignorId();
    const status = this.selectedStatus();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (consignorId) request.consignorId = consignorId;
    if (status) request.status = status as PayoutStatus;
    if (from) request.payoutDateFrom = new Date(from);
    if (to) request.payoutDateTo = new Date(to);

    return request;
  }

  private isValidPayout(payout: Partial<CreatePayoutRequest>): boolean {
    return Boolean(
      payout.consignorId &&
      payout.paymentMethod &&
      payout.transactionIds?.length
    );
  }

  // Template helper methods for form binding
  updateConsignorId(consignorId: string): void {
    this.newPayout.update(p => ({ ...p, consignorId }));
  }

  updatePayoutDate(payoutDate: string): void {
    this.newPayout.update(p => ({ ...p, payoutDate: new Date(payoutDate) }));
  }

  updatePaymentMethod(paymentMethod: string): void {
    this.newPayout.update(p => ({ ...p, paymentMethod }));
  }

  updatePaymentReference(paymentReference: string): void {
    this.newPayout.update(p => ({ ...p, paymentReference }));
  }

  updateNotes(notes: string): void {
    this.newPayout.update(p => ({ ...p, notes }));
  }
}
