import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

import { OwnerPayoutsComponent } from './owner-payouts.component';
import { PayoutService, PayoutStatus } from '../../services/payout.service';
import { ConsignorService } from '../../services/consignor.service';
import { LoadingService } from '../../shared/services/loading.service';
import { DownloadService } from '../../shared/services/download.service';
import {
  PayoutListDto,
  PayoutDto,
  PendingPayoutData,
  PayoutSearchResponse
} from '../../models/payout.model';
import { Consignor } from '../../models/consignor.model';

describe('OwnerPayoutsComponent', () => {
  let component: OwnerPayoutsComponent;
  let fixture: ComponentFixture<OwnerPayoutsComponent>;
  let mockPayoutService: jasmine.SpyObj<PayoutService>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockDownloadService: jasmine.SpyObj<DownloadService>;

  // ============================================================================
  // Test Data Factories
  // ============================================================================
  const createConsignor = (overrides: Partial<Consignor> = {}): Consignor => ({
    id: '1',
    name: 'Jane Smith',
    email: 'jane@test.com',
    phone: '123-456-7890',
    status: 'active',
    commissionRate: 50,
    isActive: true,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const createPendingPayout = (overrides: Partial<PendingPayoutData> = {}): PendingPayoutData => ({
    consignorId: '1',
    consignorName: 'Jane Smith',
    consignorEmail: 'jane@test.com',
    pendingAmount: 250.50,
    transactionCount: 5,
    earliestSale: new Date('2024-01-01'),
    latestSale: new Date('2024-01-15'),
    transactions: [
      {
        transactionId: 'txn-1',
        itemName: 'Vintage Jacket',
        saleDate: new Date('2024-01-05'),
        salePrice: 100.00,
        consignorAmount: 70.00,
        shopAmount: 30.00
      }
    ],
    ...overrides
  });

  const createPayoutListDto = (overrides: Partial<PayoutListDto> = {}): PayoutListDto => ({
    id: 'payout-1',
    payoutNumber: 'PO20240101001',
    payoutDate: new Date('2024-01-15'),
    amount: 250.50,
    status: PayoutStatus.Paid,
    paymentMethod: 'Bank Transfer',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-15'),
    transactionCount: 5,
    consignor: { id: '1', name: 'Jane Smith', email: 'jane@test.com' },
    ...overrides
  });

  const createPayoutDto = (overrides: Partial<PayoutDto> = {}): PayoutDto => ({
    id: 'payout-1',
    payoutNumber: 'PO20240101001',
    payoutDate: new Date('2024-01-15'),
    amount: 250.50,
    status: PayoutStatus.Paid,
    paymentMethod: 'Bank Transfer',
    paymentReference: 'REF123',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-15'),
    transactionCount: 5,
    notes: 'Test payout',
    syncedToQuickBooks: false,
    createdAt: new Date(),
    consignor: { id: '1', name: 'Jane Smith', email: 'jane@test.com' },
    transactions: [],
    ...overrides
  });

  const createSearchResponse = (overrides: Partial<PayoutSearchResponse> = {}): PayoutSearchResponse => ({
    success: true,
    data: [createPayoutListDto()],
    totalCount: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    ...overrides
  });

  // ============================================================================
  // Setup
  // ============================================================================
  beforeEach(async () => {
    mockPayoutService = jasmine.createSpyObj('PayoutService', [
      'getPayouts',
      'getPendingPayouts',
      'getPayoutById',
      'createPayout',
      'exportPayoutToCsv',
      'exportPayoutToPdf'
    ]);

    mockConsignorService = jasmine.createSpyObj('ConsignorService', ['getConsignors']);
    mockToastrService = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info']);
    mockLoadingService = jasmine.createSpyObj('LoadingService', ['start', 'stop', 'isLoading']);
    mockDownloadService = jasmine.createSpyObj('DownloadService', ['downloadBlob']);

    // Default return values
    mockPayoutService.getPayouts.and.returnValue(of(createSearchResponse()));
    mockPayoutService.getPendingPayouts.and.returnValue(of([createPendingPayout()]));
    mockConsignorService.getConsignors.and.returnValue(of([createConsignor()]));
    mockLoadingService.isLoading.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [FormsModule, OwnerPayoutsComponent],
      providers: [
        { provide: PayoutService, useValue: mockPayoutService },
        { provide: ConsignorService, useValue: mockConsignorService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: DownloadService, useValue: mockDownloadService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerPayoutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================
  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load all initial data on init', () => {
      expect(mockConsignorService.getConsignors).toHaveBeenCalled();
      expect(mockPayoutService.getPendingPayouts).toHaveBeenCalled();
      expect(mockPayoutService.getPayouts).toHaveBeenCalled();
    });

    it('should set consignors from service response', () => {
      expect(component.consignors().length).toBe(1);
      expect(component.consignors()[0].name).toBe('Jane Smith');
    });

    it('should set pending payouts from service response', () => {
      expect(component.pendingPayouts().length).toBe(1);
      expect(component.pendingPayouts()[0].pendingAmount).toBe(250.50);
    });

    it('should set payouts from service response', () => {
      expect(component.payouts().length).toBe(1);
      expect(component.payouts()[0].payoutNumber).toBe('PO20240101001');
    });

    it('should initialize with default pagination values', () => {
      expect(component.currentPage()).toBe(1);
      expect(component.pageSize).toBe(10);
    });

    it('should initialize with cards view mode', () => {
      expect(component.pendingPayoutsViewMode()).toBe('cards');
    });

    it('should initialize with all modals closed', () => {
      expect(component.showCreatePayoutModal()).toBeFalse();
      expect(component.showViewModal()).toBeFalse();
      expect(component.showStatementModal()).toBeFalse();
    });
  });

  // ============================================================================
  // Happy Path Tests - Loading Data
  // ============================================================================
  describe('loadConsignors', () => {
    it('should update consignors signal on success', async () => {
      const consignors = [createConsignor(), createConsignor({ id: '2', name: 'Bob' })];
      mockConsignorService.getConsignors.and.returnValue(of(consignors));

      await component.loadConsignors();

      expect(component.consignors().length).toBe(2);
    });

    it('should handle null response gracefully', async () => {
      mockConsignorService.getConsignors.and.returnValue(of(null as any));

      await component.loadConsignors();

      expect(component.consignors()).toEqual([]);
    });
  });

  describe('loadPendingPayouts', () => {
    it('should update pendingPayouts signal on success', async () => {
      const pending = [createPendingPayout(), createPendingPayout({ consignorId: '2' })];
      mockPayoutService.getPendingPayouts.and.returnValue(of(pending));

      await component.loadPendingPayouts();

      expect(component.pendingPayouts().length).toBe(2);
    });

    it('should handle null response gracefully', async () => {
      mockPayoutService.getPendingPayouts.and.returnValue(of(null as any));

      await component.loadPendingPayouts();

      expect(component.pendingPayouts()).toEqual([]);
    });
  });

  describe('loadPayouts', () => {
    it('should start and stop loading indicator', async () => {
      await component.loadPayouts();

      expect(mockLoadingService.start).toHaveBeenCalledWith('owner-payouts');
      expect(mockLoadingService.stop).toHaveBeenCalledWith('owner-payouts');
    });

    it('should update pagination state from response', async () => {
      mockPayoutService.getPayouts.and.returnValue(of(createSearchResponse({
        totalCount: 50,
        totalPages: 5,
        page: 2
      })));

      await component.loadPayouts();

      expect(component.totalPayouts()).toBe(50);
      expect(component.totalPages()).toBe(5);
    });

    it('should include filters in search request', async () => {
      component.selectedConsignorId.set('123');
      component.selectedStatus.set('Paid');
      component.dateFrom.set('2024-01-01');
      component.dateTo.set('2024-01-31');

      await component.loadPayouts();

      expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          consignorId: '123',
          status: 'Paid',
          payoutDateFrom: jasmine.any(Date),
          payoutDateTo: jasmine.any(Date)
        })
      );
    });

    it('should include sort parameters in request', async () => {
      component.sortBy.set('amount');
      component.sortDirection.set('desc');

      await component.loadPayouts();

      expect(mockPayoutService.getPayouts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortBy: 'amount',
          sortDirection: 'desc'
        })
      );
    });
  });

  // ============================================================================
  // Happy Path Tests - Payout Creation
  // ============================================================================
  describe('createPayoutForConsignor', () => {
    it('should populate newPayout with pending data', () => {
      const pending = createPendingPayout();

      component.createPayoutForConsignor(pending);

      const newPayout = component.newPayout();
      expect(newPayout.consignorId).toBe('1');
      expect(newPayout.transactionIds).toEqual(['txn-1']);
      expect(newPayout.periodStart).toEqual(pending.earliestSale);
      expect(newPayout.periodEnd).toEqual(pending.latestSale);
    });

    it('should open create modal', () => {
      component.createPayoutForConsignor(createPendingPayout());

      expect(component.showCreatePayoutModal()).toBeTrue();
    });
  });

  describe('createPayout', () => {
    beforeEach(() => {
      component.newPayout.set({
        consignorId: '1',
        payoutDate: new Date(),
        paymentMethod: 'Bank Transfer',
        paymentReference: 'REF123',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-15'),
        notes: 'Test',
        transactionIds: ['txn-1']
      });
      mockPayoutService.createPayout.and.returnValue(of(createPayoutDto()));
    });

    it('should create payout successfully', async () => {
      await component.createPayout();

      expect(mockPayoutService.createPayout).toHaveBeenCalled();
      expect(mockToastrService.success).toHaveBeenCalledWith('Payout created successfully');
    });

    it('should close modal after successful creation', async () => {
      component.showCreatePayoutModal.set(true);

      await component.createPayout();

      expect(component.showCreatePayoutModal()).toBeFalse();
    });

    it('should refresh data after creation', async () => {
      const refreshSpy = spyOn(component, 'refreshData');

      await component.createPayout();

      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Happy Path Tests - View & Export
  // ============================================================================
  describe('viewPayout', () => {
    it('should load payout details and open modal', async () => {
      const payout = createPayoutDto();
      mockPayoutService.getPayoutById.and.returnValue(of(payout));

      await component.viewPayout('payout-1');

      expect(mockPayoutService.getPayoutById).toHaveBeenCalledWith('payout-1');
      expect(component.selectedPayout()).toEqual(payout);
      expect(component.showViewModal()).toBeTrue();
    });
  });

  describe('exportPayout', () => {
    it('should export to CSV successfully', async () => {
      const blob = new Blob(['csv,data'], { type: 'text/csv' });
      mockPayoutService.exportPayoutToCsv.and.returnValue(of(blob));

      await component.exportPayout('payout-1', 'csv');

      expect(mockPayoutService.exportPayoutToCsv).toHaveBeenCalledWith('payout-1');
      expect(mockDownloadService.downloadBlob).toHaveBeenCalledWith(blob, 'payout-payout-1.csv');
      expect(mockToastrService.success).toHaveBeenCalledWith('Payout exported as CSV');
    });

    it('should export to PDF successfully', async () => {
      const blob = new Blob(['pdf,data'], { type: 'application/pdf' });
      mockPayoutService.exportPayoutToPdf.and.returnValue(of(blob));

      await component.exportPayout('payout-1', 'pdf');

      expect(mockPayoutService.exportPayoutToPdf).toHaveBeenCalledWith('payout-1');
      expect(mockDownloadService.downloadBlob).toHaveBeenCalledWith(blob, 'payout-payout-1.pdf');
      expect(mockToastrService.success).toHaveBeenCalledWith('Payout exported as PDF');
    });
  });

  // ============================================================================
  // Happy Path Tests - Sorting & Pagination
  // ============================================================================
  describe('sort', () => {
    it('should set sort column and direction asc on first click', () => {
      component.sortBy.set('payoutDate');
      component.sortDirection.set('desc');

      component.sort('amount');

      expect(component.sortBy()).toBe('amount');
      expect(component.sortDirection()).toBe('asc');
    });

    it('should toggle direction on same column click', () => {
      component.sortBy.set('amount');
      component.sortDirection.set('asc');

      component.sort('amount');

      expect(component.sortDirection()).toBe('desc');
    });

    it('should reload payouts after sort change', () => {
      component.sort('amount');

      expect(mockPayoutService.getPayouts).toHaveBeenCalled();
    });
  });

  describe('getSortClass', () => {
    it('should return direction for active column', () => {
      component.sortBy.set('amount');
      component.sortDirection.set('asc');

      expect(component.getSortClass('amount')).toBe('asc');
    });

    it('should return empty string for inactive column', () => {
      component.sortBy.set('amount');

      expect(component.getSortClass('payoutDate')).toBe('');
    });
  });

  describe('goToPage', () => {
    beforeEach(() => {
      component.totalPages.set(5);
      component.currentPage.set(3);
    });

    it('should navigate to valid page', () => {
      component.goToPage(2);

      expect(component.currentPage()).toBe(2);
      expect(mockPayoutService.getPayouts).toHaveBeenCalled();
    });

    it('should not navigate to page 0', () => {
      component.goToPage(0);

      expect(component.currentPage()).toBe(3);
    });

    it('should not navigate beyond total pages', () => {
      component.goToPage(6);

      expect(component.currentPage()).toBe(3);
    });
  });

  describe('visiblePages computed', () => {
    it('should calculate visible pages around current page', () => {
      component.totalPages.set(10);
      component.currentPage.set(5);

      const visible = component.visiblePages();

      expect(visible).toEqual([3, 4, 5, 6, 7]);
    });

    it('should handle first page correctly', () => {
      component.totalPages.set(10);
      component.currentPage.set(1);

      const visible = component.visiblePages();

      expect(visible).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle last page correctly', () => {
      component.totalPages.set(10);
      component.currentPage.set(10);

      const visible = component.visiblePages();

      expect(visible[visible.length - 1]).toBe(10);
    });

    it('should handle small total pages', () => {
      component.totalPages.set(3);
      component.currentPage.set(2);

      const visible = component.visiblePages();

      expect(visible).toEqual([1, 2, 3]);
    });
  });

  // ============================================================================
  // Happy Path Tests - Modal Management
  // ============================================================================
  describe('modal management', () => {
    it('should close all modals on overlay click', () => {
      component.showCreatePayoutModal.set(true);
      component.showViewModal.set(true);
      component.showStatementModal.set(true);

      const event = { target: {}, currentTarget: {} } as Event;
      Object.defineProperty(event, 'target', { value: event.currentTarget });

      component.closeModal(event);

      expect(component.showCreatePayoutModal()).toBeFalse();
      expect(component.showViewModal()).toBeFalse();
      expect(component.showStatementModal()).toBeFalse();
    });

    it('should not close modal when clicking inside content', () => {
      component.showCreatePayoutModal.set(true);

      const event = {
        target: { id: 'modal-content' },
        currentTarget: { id: 'modal-overlay' }
      } as unknown as Event;

      component.closeModal(event);

      expect(component.showCreatePayoutModal()).toBeTrue();
    });

    it('should open create modal', () => {
      component.openCreateModal();
      expect(component.showCreatePayoutModal()).toBeTrue();
    });

    it('should close create modal', () => {
      component.showCreatePayoutModal.set(true);
      component.closeCreateModal();
      expect(component.showCreatePayoutModal()).toBeFalse();
    });

    it('should open statement modal', () => {
      component.openStatementModal();
      expect(component.showStatementModal()).toBeTrue();
    });

    it('should close statement modal', () => {
      component.showStatementModal.set(true);
      component.closeStatementModal();
      expect(component.showStatementModal()).toBeFalse();
    });
  });

  // ============================================================================
  // Happy Path Tests - Computed Values
  // ============================================================================
  describe('availableConsignorOptions computed', () => {
    it('should transform consignors to options format', () => {
      component.consignors.set([
        createConsignor({ id: '1', name: 'Jane', email: 'jane@test.com' }),
        createConsignor({ id: '2', name: 'Bob', email: 'bob@test.com' })
      ]);

      const options = component.availableConsignorOptions();

      expect(options).toEqual([
        { id: '1', name: 'Jane', email: 'jane@test.com' },
        { id: '2', name: 'Bob', email: 'bob@test.com' }
      ]);
    });
  });

  // ============================================================================
  // Happy Path Tests - Utility Functions
  // ============================================================================
  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = component.formatDate(date);

      expect(formatted).toMatch(/1\/15\/2024/);
    });

    it('should format date string', () => {
      const formatted = component.formatDate('2024-01-15');

      expect(formatted).toMatch(/1\/15\/2024/);
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });
  });

  describe('isComponentLoading', () => {
    it('should return true when loading', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      expect(component.isComponentLoading()).toBeTrue();
    });

    it('should return false when not loading', () => {
      mockLoadingService.isLoading.and.returnValue(false);
      expect(component.isComponentLoading()).toBeFalse();
    });

    it('should check with correct loading key', () => {
      component.isComponentLoading();
      expect(mockLoadingService.isLoading).toHaveBeenCalledWith('owner-payouts');
    });
  });

  describe('refreshData', () => {
    it('should reload both pending and payouts', () => {
      const pendingSpy = spyOn(component, 'loadPendingPayouts');
      const payoutsSpy = spyOn(component, 'loadPayouts');

      component.refreshData();

      expect(pendingSpy).toHaveBeenCalled();
      expect(payoutsSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================
  describe('error handling - loadConsignors', () => {
    it('should show error toast on failure', async () => {
      mockConsignorService.getConsignors.and.returnValue(throwError(() => new Error('Failed')));

      await component.loadConsignors();

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to load consignors');
    });
  });

  describe('error handling - loadPendingPayouts', () => {
    it('should show error toast on failure', async () => {
      mockPayoutService.getPendingPayouts.and.returnValue(throwError(() => new Error('Failed')));

      await component.loadPendingPayouts();

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to load pending payouts');
    });
  });

  describe('error handling - loadPayouts', () => {
    it('should show error toast on failure', async () => {
      mockPayoutService.getPayouts.and.returnValue(throwError(() => new Error('Failed')));

      await component.loadPayouts();

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to load payouts');
    });

    it('should always stop loading even on error', async () => {
      mockPayoutService.getPayouts.and.returnValue(throwError(() => new Error('Failed')));

      await component.loadPayouts();

      expect(mockLoadingService.stop).toHaveBeenCalledWith('owner-payouts');
    });
  });

  describe('error handling - createPayout', () => {
    it('should show validation error for missing consignorId', async () => {
      component.newPayout.set({
        consignorId: '',
        paymentMethod: 'Cash',
        transactionIds: ['txn-1']
      });

      await component.createPayout();

      expect(mockToastrService.error).toHaveBeenCalledWith('Please fill in all required fields');
      expect(mockPayoutService.createPayout).not.toHaveBeenCalled();
    });

    it('should show validation error for missing paymentMethod', async () => {
      component.newPayout.set({
        consignorId: '1',
        paymentMethod: '',
        transactionIds: ['txn-1']
      });

      await component.createPayout();

      expect(mockToastrService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should show validation error for empty transactionIds', async () => {
      component.newPayout.set({
        consignorId: '1',
        paymentMethod: 'Cash',
        transactionIds: []
      });

      await component.createPayout();

      expect(mockToastrService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should show error toast on API failure', async () => {
      component.newPayout.set({
        consignorId: '1',
        payoutDate: new Date(),
        paymentMethod: 'Cash',
        periodStart: new Date(),
        periodEnd: new Date(),
        transactionIds: ['txn-1']
      });
      mockPayoutService.createPayout.and.returnValue(throwError(() => new Error('Failed')));

      await component.createPayout();

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to create payout');
    });
  });

  describe('error handling - viewPayout', () => {
    it('should show error toast on failure', async () => {
      mockPayoutService.getPayoutById.and.returnValue(throwError(() => new Error('Failed')));

      await component.viewPayout('payout-1');

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to load payout details');
    });

    it('should not open modal if payout is null', async () => {
      mockPayoutService.getPayoutById.and.returnValue(of(null as any));

      await component.viewPayout('payout-1');

      expect(component.showViewModal()).toBeFalse();
    });
  });

  describe('error handling - exportPayout', () => {
    it('should show error toast on CSV export failure', async () => {
      mockPayoutService.exportPayoutToCsv.and.returnValue(throwError(() => new Error('Failed')));

      await component.exportPayout('payout-1', 'csv');

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to export payout as CSV');
    });

    it('should show error toast on PDF export failure', async () => {
      mockPayoutService.exportPayoutToPdf.and.returnValue(throwError(() => new Error('Failed')));

      await component.exportPayout('payout-1', 'pdf');

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to export payout as PDF');
    });

    it('should not call download service if blob is null', async () => {
      mockPayoutService.exportPayoutToCsv.and.returnValue(of(null as any));

      await component.exportPayout('payout-1', 'csv');

      expect(mockDownloadService.downloadBlob).not.toHaveBeenCalled();
    });
  });

  describe('editPayout', () => {
    it('should show info toast for unimplemented feature', () => {
      component.editPayout(createPayoutListDto());

      expect(mockToastrService.info).toHaveBeenCalledWith('Edit functionality coming soon');
    });
  });

  describe('applyFilters', () => {
    it('should reset to page 1 and reload', () => {
      component.currentPage.set(5);
      const loadSpy = spyOn(component, 'loadPayouts');

      component.applyFilters();

      expect(component.currentPage()).toBe(1);
      expect(loadSpy).toHaveBeenCalled();
    });
  });
});
