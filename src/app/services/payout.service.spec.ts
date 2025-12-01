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
      provider: { id: 'provider-1', name: 'Test Provider' },
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
        providerId: 'provider-1',
        providerName: 'Test Provider',
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
      providerId: 'provider-1',
      payoutDate: new Date(),
      paymentMethod: 'Bank Transfer',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      transactionIds: ['txn-1', 'txn-2']
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
      provider: { id: 'provider-1', name: 'Test Provider' },
      transactions: []
    };
    const mockResponse = { success: true, data: mockPayout };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.createPayout(createRequest).subscribe(payout => {
      expect(payout).toEqual(mockPayout);
      expect(payout.amount).toBe(300.00);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/payouts', createRequest);
  });

  it('should export payout to CSV successfully', () => {
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });

    mockHttpClient.get.and.returnValue(of(mockBlob));

    service.exportPayoutToCsv('payout-1').subscribe(blob => {
      expect(blob).toEqual(mockBlob);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/payouts/payout-1/export', jasmine.any(Object));
  });
});