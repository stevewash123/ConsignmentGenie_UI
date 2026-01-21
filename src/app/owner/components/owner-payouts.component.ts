import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { ColumnFilterComponent, FilterOption } from '../../shared/components/column-filter.component';
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
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';

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
  imports: [CommonModule, FormsModule, ColumnFilterComponent, ConsignorStatementModalComponent],
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
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly destroyRef = inject(DestroyRef);

  // Expose enum for template use
  readonly PayoutStatus = PayoutStatus;

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
  pageSize = signal(DEFAULT_PAGE_SIZE);

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
  showTransactionModal = signal(false);

  // Current pending payout for transaction selection
  selectedPendingPayout = signal<PendingPayoutData | null>(null);
  selectedTransactionIds = signal<Set<string>>(new Set());

  // Expandable rows for transaction details
  expandedRows = signal<Set<string>>(new Set());

  // View toggle
  pendingPayoutsViewMode = signal<'cards' | 'table'>('cards');
  viewMode = signal<'pending' | 'history'>('pending');
  preSelectedConsignorId = signal<string | null>(null);

  // Additional filters for history tab
  // Note: paymentMethod filtering removed - not supported by backend API

  // Pending payouts filters (client-side)
  pendingConsignorFilter = signal('');
  pendingSortBy = signal('amount');
  pendingSortDirection = signal<'asc' | 'desc'>('desc');

  // Form data
  newPayout = signal<Partial<CreatePayoutRequest>>({
    consignorId: '',
    payoutDate: new Date(),
    paymentMethod: '',
    paymentReference: '',
    notes: '',
    transactionIds: []
  });

  // Helper to format date for HTML date input
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

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

  // Computed date range for filter component
  dateRangeFilter = computed(() => ({
    from: this.dateFrom() || null,
    to: this.dateTo() || null
  }));

  // ============================================================================
  // Filter Options
  // ============================================================================

  // Static filter options
  readonly statusOptions: FilterOption[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Pending', label: 'Pending' }
  ];

  // paymentMethodOptions removed - backend API doesn't support payment method filtering

  // Dynamic filter options from data
  consignorOptions = computed<FilterOption[]>(() => {
    return this.consignors().map(c => ({
      value: c.id.toString(),
      label: c.name
    }));
  });

  pendingConsignorOptions = computed<FilterOption[]>(() => {
    return this.pendingPayouts().map(p => ({
      value: p.consignorId,
      label: p.consignorName
    }));
  });

  // Filtered and sorted pending payouts (client-side filtering)
  filteredPendingPayouts = computed(() => {
    let result = [...this.pendingPayouts()];

    // Apply consignor filter
    const consignorFilter = this.pendingConsignorFilter();
    if (consignorFilter) {
      result = result.filter(p => p.consignorId === consignorFilter);
    }

    // Apply sorting
    const sortBy = this.pendingSortBy();
    const sortDir = this.pendingSortDirection();

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'amount') {
        comparison = a.pendingAmount - b.pendingAmount;
      } else if (sortBy === 'consignor') {
        comparison = a.consignorName.localeCompare(b.consignorName);
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
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
    console.log('  -> loadPendingPayouts: Starting...');
    try {
      const pending = await firstValueFrom(this.payoutService.getPendingPayouts());
      console.log('  -> loadPendingPayouts: API returned', pending?.length || 0, 'items');
      this.pendingPayouts.set(pending || []);
      console.log('  -> loadPendingPayouts: Set signal successfully');
    } catch (error) {
      console.error('  -> loadPendingPayouts: ERROR', error);
      this.toastr.error(ERROR_MESSAGES.LOAD_PENDING);
      throw error; // Re-throw so refreshData can catch it
    }
  }

  async loadPayouts(): Promise<void> {
    console.log('  -> loadPayouts: Starting...');
    this.loadingService.start(LOADING_KEY);

    try {
      const request = this.buildPayoutSearchRequest();
      console.log('  -> loadPayouts: Built request', request);
      const response = await firstValueFrom(this.payoutService.getPayouts(request));
      console.log('  -> loadPayouts: API returned', response);

      if (response) {
        this.payouts.set(response.data);
        this.totalPages.set(response.totalPages);
        this.totalPayouts.set(response.totalCount);
        console.log('  -> loadPayouts: Set signals successfully - payouts:', response.data?.length, 'totalPages:', response.totalPages, 'totalCount:', response.totalCount);
      }
    } catch (error) {
      console.error('  -> loadPayouts: ERROR', error);
      this.toastr.error(ERROR_MESSAGES.LOAD_PAYOUTS);
      throw error; // Re-throw so refreshData can catch it
    } finally {
      this.loadingService.stop(LOADING_KEY);
      console.log('  -> loadPayouts: Loading stopped');
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

  /**
   * Create Payout Flow
   *
   * This creates a new payout record and updates the system state:
   *
   * Database Updates:
   * - Creates new Payout record with status 'Paid'
   * - Updates all selected Transactions:
   *   * Sets PayoutId to link to the new payout
   *   * Sets PayoutStatus to 'Paid'
   *   * Sets ConsignorPaidOut to true
   *   * Sets ConsignorPaidOutDate to payout date
   *   * Sets PayoutMethod to selected method
   * - Generates unique payout number (PO{YYYYMMDD}{sequence})
   *
   * Business Logic:
   * - Validates consignor exists and has permission
   * - Ensures all transactions are unpaid and belong to consignor
   * - Calculates total payout amount from transaction items
   * - Records payment method and reference for tracking
   * - Updates cached PayoutSummary data (via refresh)
   *
   * Notifications:
   * - Success toaster notification to owner
   * - TODO: Email notification to consignor (when notification service is ready)
   * - Backend logs payout creation for audit trail
   */
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

  async updatePayoutStatus(payoutId: string, newStatus: PayoutStatus): Promise<void> {
    try {
      await firstValueFrom(this.payoutService.updatePayoutStatus(payoutId, newStatus));

      // Update the payout in our state
      const currentPayout = this.selectedPayout();
      if (currentPayout && currentPayout.id === payoutId) {
        this.selectedPayout.set({
          ...currentPayout,
          status: newStatus
        });
      }

      // Update the payout in the payouts list
      this.payouts.update(payouts =>
        payouts.map(p => p.id === payoutId ? { ...p, status: newStatus } : p)
      );

      // Show success message
      const statusText = newStatus === PayoutStatus.Paid ? 'paid' :
                        newStatus === PayoutStatus.Pending ? 'pending' : 'cancelled';
      this.toastr.success(`Payout status updated to ${statusText}`);

      // Reload pending payouts if status changed
      if (this.viewMode() === 'pending') {
        await this.loadPendingPayouts();
      }

    } catch (error: any) {
      this.toastr.error(error.message || 'Failed to update payout status');
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

  async refreshData(): Promise<void> {
    console.log('=== REFRESH DATA STARTED ===');
    try {
      this.loadingService.start(LOADING_KEY);
      this.toastr.info('Updating payout summaries...', 'Processing', { timeOut: 2000 });

      console.log('Calling refreshSummaries API...');
      await firstValueFrom(this.payoutService.refreshSummaries());
      console.log('✅ refreshSummaries API completed successfully');

      this.toastr.success('Payout summaries updated successfully', 'Success');

      // Refresh the displayed data after successful computation
      console.log('Loading pending payouts...');
      await this.loadPendingPayouts();
      console.log('✅ loadPendingPayouts completed');

      console.log('Loading payouts...');
      await this.loadPayouts();
      console.log('✅ loadPayouts completed');

      console.log('=== REFRESH DATA COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      console.error('❌ ERROR in refreshData:', error);
      this.toastr.error('Failed to update payout summaries', 'Error');
    } finally {
      this.loadingService.stop(LOADING_KEY);
      console.log('=== REFRESH DATA FINISHED (loading stopped) ===');
    }
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
      this.showTransactionModal.set(false);
      this.selectedPendingPayout.set(null);
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
    this.preSelectedConsignorId.set(null);
  }

  openCreateModal(): void {
    // Reset form to defaults
    this.newPayout.set({
      consignorId: '',
      payoutDate: new Date(),
      paymentMethod: '',
      paymentReference: '',
      notes: '',
      transactionIds: [],
      periodStart: new Date(),
      periodEnd: new Date()
    });
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
      pageSize: this.pageSize(),
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
    if (!consignorId) {
      // Clear everything if no consignor selected
      this.newPayout.update(p => ({
        ...p,
        consignorId,
        transactionIds: [],
        periodStart: new Date(),
        periodEnd: new Date()
      }));
      return;
    }

    // Find the pending payout data for this consignor
    const pending = this.pendingPayouts().find(p => p.consignorId === consignorId);
    if (pending) {
      // Get all transactions for this consignor (both cleared and uncleared)
      const allTransactionIds = pending.transactions.map(t => t.transactionId);

      // Calculate period dates from all transactions
      const transactionDates = pending.transactions.map(t => new Date(t.saleDate));
      const earliestDate = transactionDates.length > 0 ? new Date(Math.min(...transactionDates.map(d => d.getTime()))) : new Date();
      const latestDate = transactionDates.length > 0 ? new Date(Math.max(...transactionDates.map(d => d.getTime()))) : new Date();

      this.newPayout.update(p => ({
        ...p,
        consignorId,
        transactionIds: allTransactionIds,
        periodStart: earliestDate,
        periodEnd: latestDate
      }));
    } else {
      // Fallback if no pending data found
      this.newPayout.update(p => ({
        ...p,
        consignorId,
        transactionIds: [],
        periodStart: new Date(),
        periodEnd: new Date()
      }));
    }
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

  // ============================================================================
  // Filter Handler Methods
  // ============================================================================

  // History tab filter handlers
  onFilterChange(field: string, value: any) {
    switch (field) {
      case 'consignor':
        this.selectedConsignorId.set(value || '');
        break;
      case 'status':
        this.selectedStatus.set(value || '');
        break;
      // paymentMethod filter removed - not supported by backend API
      case 'dateRange':
        this.dateFrom.set(value?.from || '');
        this.dateTo.set(value?.to || '');
        break;
    }
    this.applyFilters();
  }

  onFilterClear(field: string) {
    if (field === 'dateRange') {
      this.onFilterChange(field, { from: null, to: null });
    } else {
      this.onFilterChange(field, '');
    }
  }

  // Pending tab filter handlers
  onPendingFilterChange(field: string, value: any) {
    if (field === 'consignor') {
      this.pendingConsignorFilter.set(value || '');
    }
  }

  onPendingFilterClear(field: string) {
    this.onPendingFilterChange(field, '');
  }

  // Pending payouts sorting
  sortPending(column: string) {
    if (this.pendingSortBy() === column) {
      this.pendingSortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.pendingSortBy.set(column);
      this.pendingSortDirection.set('desc');
    }
  }

  // Page size change handler
  onPageSizeChange() {
    this.currentPage.set(1);
    this.loadPayouts();
  }

  // Status badge helper
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warn';
      case 'cancelled':
      case 'voided':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  }

  // Generate statement for a specific consignor (opens modal pre-filled)
  generateStatementForConsignor(consignorId: string) {
    this.preSelectedConsignorId.set(consignorId);
    this.showStatementModal.set(true);
  }

  viewTransactionDetails(pending: PendingPayoutData): void {
    // Toggle expanded row instead of modal
    this.toggleRowExpansion(pending.consignorId);
  }

  // Row expansion methods
  toggleRowExpansion(consignorId: string): void {
    const currentExpanded = this.expandedRows();
    const newExpanded = new Set(currentExpanded);

    if (newExpanded.has(consignorId)) {
      newExpanded.delete(consignorId);
    } else {
      newExpanded.add(consignorId);
      // Set the selected payout data when expanding
      const pending = this.filteredPendingPayouts().find(p => p.consignorId === consignorId);
      if (pending) {
        this.selectedPendingPayout.set(pending);
        // Pre-select cleared transactions
        this.preselectClearedTransactions(pending);
      }
    }

    this.expandedRows.set(newExpanded);
  }

  isRowExpanded(consignorId: string): boolean {
    return this.expandedRows().has(consignorId);
  }

  preselectClearedTransactions(pending: PendingPayoutData): void {
    const clearedTransactionIds = pending.transactions
      ?.filter(t => t.isCleared)
      .map(t => t.transactionId) || [];

    this.selectedTransactionIds.set(new Set(clearedTransactionIds));
  }

  areAllClearedTransactionsSelected(pending: PendingPayoutData): boolean {
    const clearedTransactionIds = pending.transactions
      ?.filter(t => t.isCleared)
      .map(t => t.transactionId) || [];

    return clearedTransactionIds.length > 0 &&
           clearedTransactionIds.every(id => this.selectedTransactionIds().has(id));
  }

  toggleSelectAllCleared(pending: PendingPayoutData, event: Event): void {
    const target = event.target as HTMLInputElement;
    const clearedTransactionIds = pending.transactions
      ?.filter(t => t.isCleared)
      .map(t => t.transactionId) || [];

    const currentSet = new Set(this.selectedTransactionIds());

    if (target.checked) {
      // Add all cleared transactions
      clearedTransactionIds.forEach(id => currentSet.add(id));
    } else {
      // Remove all cleared transactions
      clearedTransactionIds.forEach(id => currentSet.delete(id));
    }

    this.selectedTransactionIds.set(currentSet);
  }

  closeTransactionModal(): void {
    this.showTransactionModal.set(false);
    this.selectedPendingPayout.set(null);
    this.selectedTransactionIds.set(new Set());
  }

  // Transaction selection methods
  isTransactionSelected(transactionId: string): boolean {
    return this.selectedTransactionIds().has(transactionId);
  }

  toggleTransaction(transactionId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentSet = this.selectedTransactionIds();
    const newSet = new Set(currentSet);

    if (target.checked) {
      newSet.add(transactionId);
    } else {
      newSet.delete(transactionId);
    }

    this.selectedTransactionIds.set(newSet);
  }

  toggleSelectAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    const pending = this.selectedPendingPayout();
    if (!pending) return;

    if (target.checked) {
      // Select all cleared transactions by default
      const clearedTransactionIds = pending.transactions
        .filter(t => t.isCleared)
        .map(t => t.transactionId);
      this.selectedTransactionIds.set(new Set(clearedTransactionIds));
    } else {
      this.selectedTransactionIds.set(new Set());
    }
  }

  getSelectedTransactionCount(): number {
    return this.selectedTransactionIds().size;
  }

  getSelectedAmount(): number {
    const pending = this.selectedPendingPayout();
    if (!pending) return 0;

    const selectedIds = this.selectedTransactionIds();
    return pending.transactions
      .filter(t => selectedIds.has(t.transactionId))
      .reduce((sum, t) => sum + t.consignorAmount, 0);
  }

  async proceedWithSelectedTransactions(): Promise<void> {
    const pending = this.selectedPendingPayout();
    if (!pending) return;

    const selectedIds = Array.from(this.selectedTransactionIds());
    const selectedTransactions = pending.transactions.filter(t =>
      selectedIds.includes(t.transactionId)
    );

    // Check for uncleared transactions and warn
    const unclearedCount = selectedTransactions.filter(t => !t.isCleared).length;
    if (unclearedCount > 0) {
      try {
        const result = await firstValueFrom(
          this.confirmationService.confirmAction(
            'Uncleared Transactions Warning',
            `⚠️ Warning: You have selected ${unclearedCount} uncleared transactions. ` +
            'These funds may not be available yet. Proceed anyway?',
            'Proceed'
          )
        );
        if (!result.confirmed) return;
      } catch (error) {
        return; // User cancelled or error occurred
      }
    }

    // Close transaction modal and open create payout modal with selected transactions
    this.closeTransactionModal();

    // Pre-populate the create modal with selected transactions
    this.newPayout.set({
      consignorId: pending.consignorId,
      payoutDate: new Date(),
      paymentMethod: '',
      paymentReference: '',
      periodStart: pending.earliestSale || new Date(),
      periodEnd: pending.latestSale || new Date(),
      notes: '',
      transactionIds: selectedIds
    });

    this.showCreatePayoutModal.set(true);
  }
}