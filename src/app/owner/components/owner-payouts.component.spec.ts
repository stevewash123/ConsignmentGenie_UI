import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

import { OwnerPayoutsComponent } from './owner-payouts.component';
import { PayoutService } from '../../services/payout.service';
import { ConsignorService } from '../../services/consignor.service';
import { LoadingService } from '../../shared/services/loading.service';
import { OwnerLayoutComponent } from './owner-layout.component';
import { ConsignorStatementModalComponent } from '../../shared/components/consignor-statement-modal.component';
import {
  PayoutListDto,
  PayoutDto,
  PayoutStatus,
  CreatePayoutRequest,
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

  const mockConsignors: Consignor[] = [
    {
      id: '1',
      name: 'Jane Smith',
      email: 'jane@test.com',
      phone: '123-456-7890',
      status: 'active',
      commissionRate: 50,
      isActive: true,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Bob Johnson',
      email: 'bob@test.com',
      phone: '098-765-4321',
      status: 'active',
      commissionRate: 50,
      isActive: true,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockPendingPayouts: PendingPayoutData[] = [
    {
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
      ]
    }
  ];

  const mockPayouts: PayoutListDto[] = [
    {
      id: 'payout-1',
      payoutNumber: 'PO20240101001',
      payoutDate: new Date('2024-01-15'),
      amount: 250.50,
      status: PayoutStatus.Paid,
      paymentMethod: 'Bank Transfer',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-15'),
      transactionCount: 5,
      consignor: { id: '1', name: 'Jane Smith', email: 'jane@test.com' }
    }
  ];

  const mockPayoutSearchResponse: PayoutSearchResponse = {
    success: true,
    data: mockPayouts,
    totalCount: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };

  beforeEach(async () => {
    mockPayoutService = jasmine.createSpyObj('PayoutService', [
      'getPayouts',
      'getPendingPayouts',
      'getPayoutById',
      'createPayout',
      'exportPayoutToCsv',
      'exportPayoutToPdf'
    ]);

    mockConsignorService = jasmine.createSpyObj('ConsignorService', [
      'getConsignors'
    ]);

    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'info'
    ]);

    mockLoadingService = jasmine.createSpyObj('LoadingService', [
      'start',
      'stop',
      'isLoading'
    ]);

    // Setup default return values
    mockPayoutService.getPayouts.and.returnValue(of(mockPayoutSearchResponse));
    mockPayoutService.getPendingPayouts.and.returnValue(of(mockPendingPayouts));
    mockConsignorService.getConsignors.and.returnValue(of(mockConsignors));
    mockLoadingService.isLoading.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        OwnerPayoutsComponent,
        OwnerLayoutComponent,
        ConsignorStatementModalComponent
      ],
      providers: [
        { provide: PayoutService, useValue: mockPayoutService },
        { provide: ConsignorService, useValue: mockConsignorService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: LoadingService, useValue: mockLoadingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerPayoutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial data on component initialization', () => {
    expect(mockConsignorService.getConsignors).toHaveBeenCalled();
    expect(mockPayoutService.getPendingPayouts).toHaveBeenCalled();
    expect(mockPayoutService.getPayouts).toHaveBeenCalled();
    expect(component.payouts().length).toBe(1);
    expect(component.pendingPayouts().length).toBe(1);
    expect(component.consignors().length).toBe(2);
  });

  describe('Pending Payouts', () => {
    it('should display pending payouts correctly', () => {
      component.pendingPayouts.set(mockPendingPayouts);
      fixture.detectChanges();

      const pendingCards = fixture.nativeElement.querySelectorAll('.pending-card');
      expect(pendingCards.length).toBe(1);

      const firstCard = pendingCards[0];
      expect(firstCard.textContent).toContain('Jane Smith');
      expect(firstCard.textContent).toContain('$250.50');
      expect(firstCard.textContent).toContain('5');
    });

    it('should create payout for consignor', async () => {
      const mockCreatedPayout: PayoutDto = {
        id: 'new-payout',
        payoutNumber: 'PO20240201001',
        payoutDate: new Date(),
        amount: 250.50,
        status: PayoutStatus.Paid,
        paymentMethod: 'Bank Transfer',
        paymentReference: '',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-15'),
        transactionCount: 5,
        notes: '',
        syncedToQuickBooks: false,
        createdAt: new Date(),
        consignor: { id: '1', name: 'Jane Smith', email: 'jane@test.com' },
        transactions: []
      };

      mockPayoutService.createPayout.and.returnValue(of(mockCreatedPayout));

      component.createPayoutForConsignor(mockPendingPayouts[0]);

      expect(component.newPayout.consignorId).toBe('1');
      expect(component.newPayout.transactionIds).toEqual(['txn-1']);
      expect(component.showCreatePayoutModal).toBe(true);
    });
  });

  describe('Payout Creation', () => {
    beforeEach(() => {
      component.newPayout = {
        consignorId: '1',
        payoutDate: new Date(),
        paymentMethod: 'Bank Transfer',
        paymentReference: 'REF123',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-15'),
        notes: 'Test payout',
        transactionIds: ['txn-1']
      };
    });

    it('should create payout successfully', async () => {
      const mockCreatedPayout: PayoutDto = {
        id: 'new-payout',
        payoutNumber: 'PO20240201001',
        payoutDate: new Date(),
        amount: 250.50,
        status: PayoutStatus.Paid,
        paymentMethod: 'Bank Transfer',
        paymentReference: 'REF123',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-15'),
        transactionCount: 1,
        notes: 'Test payout',
        syncedToQuickBooks: false,
        createdAt: new Date(),
        consignor: { id: '1', name: 'Jane Smith', email: 'jane@test.com' },
        transactions: []
      };

      mockPayoutService.createPayout.and.returnValue(of(mockCreatedPayout));

      await component.createPayout();

      expect(mockPayoutService.createPayout).toHaveBeenCalledWith({
        consignorId: '1',
        payoutDate: jasmine.any(Date),
        paymentMethod: 'Bank Transfer',
        paymentReference: 'REF123',
        periodStart: jasmine.any(Date),
        periodEnd: jasmine.any(Date),
        notes: 'Test payout',
        transactionIds: ['txn-1']
      });

      expect(mockToastrService.success).toHaveBeenCalledWith('Payout created successfully');
      expect(component.showCreatePayoutModal).toBe(false);
    });

    it('should show validation error for missing required fields', async () => {
      component.newPayout.consignorId = '';

      await component.createPayout();

      expect(mockPayoutService.createPayout).not.toHaveBeenCalled();
      expect(mockToastrService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should handle payout creation error', async () => {
      const error = new Error('Creation failed');
      mockPayoutService.createPayout.and.returnValue(throwError(() => error));

      await component.createPayout();

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to create payout');
    });
  });

  describe('Payout List Management', () => {
    it('should load payouts with correct parameters', async () => {
      component.selectedConsignorId = '1';
      component.selectedStatus = 'Paid';
      component.dateFrom = '2024-01-01';
      component.dateTo = '2024-01-31';
      component.sortBy = 'amount';
      component.sortDirection = 'asc';

      await component.loadPayouts();

      expect(mockPayoutService.getPayouts).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'amount',
        sortDirection: 'asc',
        consignorId: '1',
        status: PayoutStatus.Paid,
        payoutDateFrom: jasmine.any(Date),
        payoutDateTo: jasmine.any(Date)
      });

      expect(mockLoadingService.start).toHaveBeenCalledWith('owner-payouts');
      expect(mockLoadingService.stop).toHaveBeenCalledWith('owner-payouts');
    });

    it('should handle loading error', async () => {
      const error = new Error('Loading failed');
      mockPayoutService.getPayouts.and.returnValue(throwError(() => error));

      await component.loadPayouts();

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to load payouts');
      expect(mockLoadingService.stop).toHaveBeenCalledWith('owner-payouts');
    });

    it('should sort payouts correctly', () => {
      const sortSpy = spyOn(component, 'loadPayouts');

      component.sort('amount');

      expect(component.sortBy).toBe('amount');
      expect(component.sortDirection).toBe('asc');
      expect(sortSpy).toHaveBeenCalled();

      // Test direction toggle
      component.sort('amount');

      expect(component.sortDirection).toBe('desc');
      expect(sortSpy).toHaveBeenCalledTimes(2);
    });

    it('should get correct sort class', () => {
      component.sortBy = 'amount';
      component.sortDirection = 'asc';

      expect(component.getSortClass('amount')).toBe('asc');
      expect(component.getSortClass('payoutDate')).toBe('');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.totalPages.set(5);
      component.currentPage.set(3);
    });

    it('should calculate visible pages correctly', () => {
      const visiblePages = component.visiblePages();
      expect(visiblePages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should go to page successfully', () => {
      const loadSpy = spyOn(component, 'loadPayouts');

      component.goToPage(2);

      expect(component.currentPage()).toBe(2);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not go to invalid page', () => {
      const loadSpy = spyOn(component, 'loadPayouts');

      component.goToPage(0); // Invalid page
      expect(component.currentPage()).toBe(3); // Should remain unchanged
      expect(loadSpy).not.toHaveBeenCalled();

      component.goToPage(6); // Page beyond total
      expect(component.currentPage()).toBe(3); // Should remain unchanged
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe('Payout Details and Actions', () => {
    it('should view payout details', async () => {
      const mockDetailedPayout: PayoutDto = {
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
        transactions: []
      };

      mockPayoutService.getPayoutById.and.returnValue(of(mockDetailedPayout));

      await component.viewPayout('payout-1');

      expect(mockPayoutService.getPayoutById).toHaveBeenCalledWith('payout-1');
      expect(component.selectedPayout()).toEqual(mockDetailedPayout);
      expect(component.showViewModal).toBe(true);
    });

    it('should handle view payout error', async () => {
      const error = new Error('View failed');
      mockPayoutService.getPayoutById.and.returnValue(throwError(() => error));

      await component.viewPayout('payout-1');

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to load payout details');
    });

    it('should export payout to CSV', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      mockPayoutService.exportPayoutToCsv.and.returnValue(of(mockBlob));

      // Mock URL and document methods
      const mockUrl = 'blob:mock-url';
      spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
      spyOn(window.URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);

      await component.exportPayout('payout-1', 'csv');

      expect(mockPayoutService.exportPayoutToCsv).toHaveBeenCalledWith('payout-1');
      expect(mockToastrService.success).toHaveBeenCalledWith('Payout exported as CSV');
    });

    it('should export payout to PDF', async () => {
      const mockBlob = new Blob(['pdf,data'], { type: 'application/pdf' });
      mockPayoutService.exportPayoutToPdf.and.returnValue(of(mockBlob));

      // Mock URL and document methods
      const mockUrl = 'blob:mock-url';
      spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
      spyOn(window.URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);

      await component.exportPayout('payout-1', 'pdf');

      expect(mockPayoutService.exportPayoutToPdf).toHaveBeenCalledWith('payout-1');
      expect(mockToastrService.success).toHaveBeenCalledWith('Payout exported as PDF');
    });

    it('should handle export error', async () => {
      const error = new Error('Export failed');
      mockPayoutService.exportPayoutToCsv.and.returnValue(throwError(() => error));

      await component.exportPayout('payout-1', 'csv');

      expect(mockToastrService.error).toHaveBeenCalledWith('Failed to export payout as CSV');
    });

    it('should show edit info message', () => {
      component.editPayout(mockPayouts[0]);
      expect(mockToastrService.info).toHaveBeenCalledWith('Edit functionality coming soon');
    });
  });

  describe('Data Refresh', () => {
    it('should refresh all data', () => {
      const pendingSpy = spyOn(component, 'loadPendingPayouts').and.callThrough();
      const payoutsSpy = spyOn(component, 'loadPayouts').and.callThrough();

      component.refreshData();

      expect(pendingSpy).toHaveBeenCalled();
      expect(payoutsSpy).toHaveBeenCalled();
    });
  });

  describe('Modal Management', () => {
    it('should close modals correctly', () => {
      component.showCreatePayoutModal = true;
      component.showViewModal = true;
      component.showStatementModal = true;

      const event = { target: { } as any, currentTarget: { } as any } as Event;
      Object.defineProperty(event, 'target', { value: event.currentTarget, writable: false }); // Simulate clicking on modal overlay

      component.closeModal(event);

      expect(component.showCreatePayoutModal).toBe(false);
      expect(component.showViewModal).toBe(false);
      expect(component.showStatementModal).toBe(false);
    });

    it('should not close modal when clicking inside content', () => {
      component.showCreatePayoutModal = true;

      const event = {
        target: { id: 'modal-content' } as any,
        currentTarget: { id: 'modal-overlay' } as any
      } as Event;

      component.closeModal(event);

      expect(component.showCreatePayoutModal).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should format dates correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      const formatted = component.formatDate(testDate);

      expect(formatted).toMatch(/^1\/15\/2024$/); // US locale format
    });

    it('should handle undefined date', () => {
      const formatted = component.formatDate(undefined);
      expect(formatted).toBe('');
    });

    it('should check if component is loading', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      expect(component.isComponentLoading()).toBe(true);

      mockLoadingService.isLoading.and.returnValue(false);
      expect(component.isComponentLoading()).toBe(false);
    });

    it('should create consignor options correctly', () => {
      component.consignors.set(mockConsignors);
      const options = component.availableConsignorOptions();

      expect(options).toEqual([
        { id: '1', name: 'Jane Smith', email: 'jane@test.com' },
        { id: '2', name: 'Bob Johnson', email: 'bob@test.com' }
      ]);
    });
  });
});