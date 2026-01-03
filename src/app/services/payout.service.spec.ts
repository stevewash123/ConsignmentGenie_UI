import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { PayoutService } from './payout.service';
import { PayoutStatus, PayoutSearchResponse } from '../models/payout.model';

describe('PayoutService', () => {
  let service: PayoutService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        PayoutService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(PayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get payouts successfully', () => {
    const mockResponse: PayoutSearchResponse = {
      success: true,
      data: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getPayouts().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.success).toBe(true);
      expect(response.totalCount).toBe(0);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts', { params: jasmine.any(Object) });
  });

  it('should get payout by id successfully', () => {
    const mockPayout = {
      id: 'payout-1',
      payoutNumber: 'PO-001',
      payoutDate: new Date(),
      amount: 250.00,
      status: PayoutStatus.Paid,
      paymentMethod: 'Bank Transfer',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      transactionCount: 5,
      syncedToQuickBooks: false,
      createdAt: new Date(),
      consignor: { id: 'consignor-1', name: 'Test consignor' },
      transactions: []
    };
    const mockResponse = { success: true, data: mockPayout };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getPayoutById('payout-1').subscribe(payout => {
      expect(payout).toEqual(mockPayout);
      expect(payout.amount).toBe(250.00);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts/payout-1');
  });

  it('should get pending payouts successfully', () => {
    const mockPendingPayouts = [
      {
        consignorId: 'consignor-1',
        consignorName: 'Test Consignor',
        pendingAmount: 150.00,
        transactionCount: 3,
        earliestSale: new Date('2024-01-01'),
        latestSale: new Date('2024-01-15'),
        transactions: []
      }
    ];
    const mockResponse = { success: true, data: mockPendingPayouts };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getPendingPayouts().subscribe(payouts => {
      expect(payouts).toEqual(mockPendingPayouts);
      expect(payouts.length).toBe(1);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts/pending', { params: jasmine.any(Object) });
  });

  it('should create payout successfully', () => {
    const createRequest = {
      consignorId: 'consignor-1',
      payoutDate: new Date(),
      paymentMethod: 'Bank Transfer',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      transactionIds: ['txn-1', 'txn-2'],
      paymentReference: undefined,
      notes: undefined
    };
    const mockPayout = {
      id: 'payout-new',
      payoutNumber: 'PO-002',
      payoutDate: new Date(),
      amount: 300.00,
      status: PayoutStatus.Pending,
      paymentMethod: 'Bank Transfer',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      transactionCount: 6,
      syncedToQuickBooks: false,
      createdAt: new Date(),
      consignor: { id: 'consignor-1', name: 'Test consignor' },
      transactions: []
    };
    const mockResponse = { success: true, data: mockPayout };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.createPayout(createRequest).subscribe(payout => {
      expect(payout).toEqual(mockPayout);
      expect(payout.amount).toBe(300.00);
    });

    // The service transforms consignorId to ConsignorId for the API
    const expectedApiRequest = {
      ConsignorId: 'consignor-1',
      payoutDate: createRequest.payoutDate,
      paymentMethod: 'Bank Transfer',
      paymentReference: createRequest.paymentReference,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      notes: createRequest.notes,
      transactionIds: ['txn-1', 'txn-2']
    };

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/payouts', expectedApiRequest);
  });

  it('should export payout to CSV successfully', () => {
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });

    mockHttpClient.get.and.returnValue(of(mockBlob));

    service.exportPayoutToCsv('payout-1').subscribe(blob => {
      expect(blob).toEqual(mockBlob);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts/payout-1/export', jasmine.any(Object));
  });

  it('should handle search parameters correctly', () => {
    const searchRequest = {
      consignorId: 'consignor-123',
      payoutDateFrom: new Date('2024-01-01'),
      payoutDateTo: new Date('2024-01-31'),
      status: PayoutStatus.Paid,
      page: 2,
      pageSize: 20,
      sortBy: 'amount',
      sortDirection: 'asc'
    };

    const mockResponse: PayoutSearchResponse = {
      success: true,
      data: [],
      totalCount: 5,
      page: 2,
      pageSize: 20,
      totalPages: 1
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getPayouts(searchRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.page).toBe(2);
      expect(response.pageSize).toBe(20);
    });

    // Verify the correct parameters are sent - consignorId should be mapped to ConsignorId
    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts', {
      params: jasmine.objectContaining({
        // The service should transform consignorId to ConsignorId for the API
        keys: jasmine.arrayContaining(['ConsignorId', 'payoutDateFrom', 'payoutDateTo', 'status', 'page', 'pageSize', 'sortBy', 'sortDirection'])
      })
    });
  });

  it('should handle pending payouts with filters', () => {
    const request = {
      consignorId: 'consignor-456',
      periodEndBefore: new Date('2024-01-15'),
      minimumAmount: 100
    };

    const mockPendingPayouts = [
      {
        consignorId: 'consignor-456',
        consignorName: 'Jane Smith',
        pendingAmount: 250.00,
        transactionCount: 5,
        earliestSale: new Date('2024-01-01'),
        latestSale: new Date('2024-01-10'),
        transactions: []
      }
    ];

    const mockResponse = { success: true, data: mockPendingPayouts };
    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getPendingPayouts(request).subscribe(payouts => {
      expect(payouts).toEqual(mockPendingPayouts);
      expect(payouts[0].consignorName).toBe('Jane Smith');
      expect(payouts[0].pendingAmount).toBe(250.00);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts/pending', {
      params: jasmine.objectContaining({
        keys: jasmine.arrayContaining(['ConsignorId', 'periodEndBefore', 'minimumAmount'])
      })
    });
  });

  it('should update payout successfully', () => {
    const updateRequest = {
      payoutDate: new Date('2024-02-01'),
      status: PayoutStatus.Paid,
      paymentMethod: 'Check',
      notes: 'Updated notes'
    };

    const mockResponse = { success: true, message: 'Payout updated successfully' };
    mockHttpClient.put.and.returnValue(of(mockResponse));

    service.updatePayoutObservable('payout-123', updateRequest).subscribe(result => {
      expect(result).toBeUndefined(); // Method returns void
    });

    expect(mockHttpClient.put).toHaveBeenCalledWith('http://localhost:5000/api/payouts/payout-123', updateRequest);
  });

  it('should delete payout successfully', () => {
    const mockResponse = { success: true, message: 'Payout deleted successfully' };
    mockHttpClient.delete.and.returnValue(of(mockResponse));

    service.deletePayout('payout-123').subscribe(result => {
      expect(result).toBeUndefined(); // Method returns void
    });

    expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5000/api/payouts/payout-123');
  });

  it('should export payout to PDF successfully', () => {
    const mockBlob = new Blob(['pdf,data'], { type: 'application/pdf' });
    mockHttpClient.get.and.returnValue(of(mockBlob));

    service.exportPayoutToPdf('payout-456').subscribe(blob => {
      expect(blob).toEqual(mockBlob);
      expect(blob.type).toBe('application/pdf');
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts/payout-456/pdf', jasmine.any(Object));
  });
});