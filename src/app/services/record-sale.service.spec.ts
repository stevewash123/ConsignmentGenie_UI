import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecordSaleService, SaleRequest } from './record-sale.service';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';

describe('RecordSaleService Integration', () => {
  let service: RecordSaleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecordSaleService]
    });
    service = TestBed.inject(RecordSaleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call real API for available items', () => {
    const mockResponse = {
      items: [
        {
          id: '1',
          title: 'Test Item',
          sku: 'TEST-001',
          price: 10.00,
          consignorName: 'Test Consignor',
          status: 'Available',
          category: 'Electronics'
        }
      ],
      totalCount: 1,
      page: 1,
      pageSize: 10
    };

    service.getAvailableItems('test').subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Test Item');
      expect(items[0].consignorName).toBe('Test Consignor');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/items?status=Available&search=test`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call real API for completing sale', () => {
    // Mock environment.production to force API calls
    spyOn(service, 'getTaxRate').and.returnValue(of(0.08));

    const mockTransactionResponse = {
      id: 'txn-123',
      transactionDate: '2023-12-06T18:00:00Z',
      paymentType: 'Cash',
      subtotal: 10.00,
      taxAmount: 0.80,
      taxRate: 0.08,
      total: 10.80,
      customerEmail: 'test@example.com',
      items: [],
      createdAt: '2023-12-06T18:00:00Z',
      updatedAt: '2023-12-06T18:00:00Z'
    };

    const saleRequest: SaleRequest = {
      items: [{
        item: {
          id: '1',
          name: 'Test Item',
          sku: 'TEST-001',
          price: 10.00,
          consignorName: 'Test Consignor',
          status: 'Available',
          category: 'Electronics'
        },
        quantity: 1
      }],
      paymentType: 'Cash',
      customerEmail: 'test@example.com'
    };

    service.completeSale(saleRequest).subscribe(response => {
      expect(response.transactionId).toBe('txn-123');
      expect(response.total).toBe(10.80);
      expect(response.receiptSent).toBe(true);
    });

    // Only expect the transaction POST request since getTaxRate is mocked
    const transactionReq = httpMock.expectOne(`${environment.apiUrl}/api/transactions`);
    expect(transactionReq.request.method).toBe('POST');
    expect(transactionReq.request.body.paymentType).toBe('Cash');
    expect(transactionReq.request.body.customerEmail).toBe('test@example.com');
    expect(transactionReq.request.body.items.length).toBe(1);
    transactionReq.flush(mockTransactionResponse);
  });

  it('should set receiptSent to false when no customer email provided', () => {
    // Mock getTaxRate to avoid HTTP call
    spyOn(service, 'getTaxRate').and.returnValue(of(0.08));

    const mockTransactionResponse = {
      id: 'txn-124',
      transactionDate: '2023-12-06T18:00:00Z',
      paymentType: 'Cash',
      subtotal: 10.00,
      taxAmount: 0.80,
      taxRate: 0.08,
      total: 10.80,
      items: [],
      createdAt: '2023-12-06T18:00:00Z',
      updatedAt: '2023-12-06T18:00:00Z'
    };

    const saleRequest: SaleRequest = {
      items: [{
        item: {
          id: '1',
          name: 'Test Item',
          sku: 'TEST-001',
          price: 10.00,
          consignorName: 'Test Consignor',
          status: 'Available',
          category: 'Electronics'
        },
        quantity: 1
      }],
      paymentType: 'Cash'
    };

    service.completeSale(saleRequest).subscribe(response => {
      expect(response.transactionId).toBe('txn-124');
      expect(response.receiptSent).toBe(false);
    });

    // Only expect the transaction POST request since getTaxRate is mocked
    const transactionReq = httpMock.expectOne(`${environment.apiUrl}/api/transactions`);
    expect(transactionReq.request.body.customerEmail).toBeUndefined();
    transactionReq.flush(mockTransactionResponse);
  });

  it('should handle API errors gracefully', () => {
    service.getAvailableItems().subscribe(items => {
      expect(items.length).toBeGreaterThan(0); // Should fallback to mock data
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/items?status=Available`);
    req.error(new ProgressEvent('Network error'));
  });
});