import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TransactionService, SalesMetrics } from './transaction.service';
import { Transaction, CreateTransactionRequest } from '../models/transaction.model';
import { PagedResult } from '../shared/models/api.models';

describe('TransactionService', () => {
  let service: TransactionService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(TransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get transactions successfully', fakeAsync(() => {
    const mockTransactions: Transaction[] = [
      {
        id: 'txn-1',
        salePrice: 100.00,
        salesTaxAmount: 8.50,
        consignorsplitPercentage: 50,
        providerAmount: 45.75,
        shopAmount: 54.25,
        paymentMethod: 'Credit Card',
        saleDate: new Date(),
        item: { id: 'item-1', name: 'Test Item', originalPrice: 100.00 },
        consignor: { id: 'consignor-1', name: 'Test consignor' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    const mockPagedResult: PagedResult<Transaction> = {
      items: mockTransactions,
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      organizationId: 'org-1'
    };

    mockHttpClient.get.and.returnValue(of(mockPagedResult));

    service.getTransactions().subscribe(result => {
      expect(result).toEqual(mockPagedResult);
      expect(result.items.length).toBe(1);
      expect(result.totalCount).toBe(1);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/transactions', { params: jasmine.any(Object) });
  }));

  it('should get transactions with query params successfully', fakeAsync(() => {
    const mockPagedResult: PagedResult<Transaction> = {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      organizationId: 'org-1'
    };

    mockHttpClient.get.and.returnValue(of(mockPagedResult));

    const queryParams = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      providerId: 'consignor-1',
      paymentMethod: 'Cash',
      page: 1,
      pageSize: 20,
      sortBy: 'saleDate',
      sortDirection: 'desc'
    };

    service.getTransactions(queryParams).subscribe(result => {
      expect(result).toEqual(mockPagedResult);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/transactions', { params: jasmine.any(Object) });
  }));

  it('should get transaction by id successfully', fakeAsync(() => {
    const mockTransaction: Transaction = {
      id: 'txn-1',
      salePrice: 100.00,
      salesTaxAmount: 8.50,
      consignorsplitPercentage: 50,
      providerAmount: 45.75,
      shopAmount: 54.25,
      paymentMethod: 'Credit Card',
      saleDate: new Date(),
      item: { id: 'item-1', name: 'Test Item', originalPrice: 100.00 },
      consignor: { id: 'consignor-1', name: 'Test consignor' },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.get.and.returnValue(of(mockTransaction));

    service.getTransaction('txn-1').subscribe(transaction => {
      expect(transaction).toEqual(mockTransaction);
      expect(transaction.id).toBe('txn-1');
      expect(transaction.salePrice).toBe(100.00);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/transactions/txn-1');
  }));

  it('should create transaction successfully', fakeAsync(() => {
    const createRequest: CreateTransactionRequest = {
      itemId: 'item-1',
      salePrice: 50.00,
      salesTaxAmount: 4.25,
      paymentMethod: 'Credit Card',
      notes: 'Test sale'
    };
    const mockTransaction: Transaction = {
      id: 'txn-new',
      salePrice: 50.00,
      salesTaxAmount: 4.25,
      consignorsplitPercentage: 50,
      providerAmount: 22.88,
      shopAmount: 27.12,
      paymentMethod: 'Credit Card',
      saleDate: new Date(),
      item: { id: 'item-1', name: 'Test Item', originalPrice: 50.00 },
      consignor: { id: 'consignor-1', name: 'Test consignor' },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.post.and.returnValue(of(mockTransaction));

    service.createTransaction(createRequest).subscribe(transaction => {
      expect(transaction).toEqual(mockTransaction);
      expect(transaction.id).toBe('txn-new');
      expect(transaction.paymentMethod).toBe('Credit Card');
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/transactions', createRequest);
  }));

  it('should update transaction successfully', fakeAsync(() => {
    const updateRequest = {
      salePrice: 75.00,
      salesTaxAmount: 6.38,
      paymentMethod: 'Cash',
      notes: 'Updated sale'
    };
    const mockTransaction: Transaction = {
      id: 'txn-1',
      salePrice: 75.00,
      salesTaxAmount: 6.38,
      consignorsplitPercentage: 50,
      providerAmount: 34.31,
      shopAmount: 40.69,
      paymentMethod: 'Cash',
      saleDate: new Date(),
      item: { id: 'item-1', name: 'Test Item', originalPrice: 75.00 },
      consignor: { id: 'consignor-1', name: 'Test consignor' },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.put.and.returnValue(of(mockTransaction));

    service.updateTransaction('txn-1', updateRequest).subscribe(transaction => {
      expect(transaction).toEqual(mockTransaction);
      expect(transaction.salePrice).toBe(75.00);
      expect(transaction.paymentMethod).toBe('Cash');
    });

    tick();

    expect(mockHttpClient.put).toHaveBeenCalledWith('http://localhost:5000/api/transactions/txn-1', updateRequest);
  }));

  it('should delete transaction successfully', fakeAsync(() => {
    mockHttpClient.delete.and.returnValue(of(void 0));

    service.deleteTransaction('txn-1').subscribe(() => {
      expect(true).toBe(true);
    });

    tick();

    expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5000/api/transactions/txn-1');
  }));

  it('should get sales metrics successfully', fakeAsync(() => {
    const mockMetrics: SalesMetrics = {
      totalSales: 1000.00,
      totalShopAmount: 500.00,
      totalConsignorAmount: 450.00,
      totalTax: 50.00,
      transactionCount: 10,
      averageTransactionValue: 100.00,
      topConsignors: [
        {
          consignorId: 'consignor-1',
          consignorName: 'consignor 1',
          transactionCount: 5,
          totalSales: 500.00,
          totalProviderAmount: 225.00
        }
      ],
      paymentMethodBreakdown: [
        { paymentMethod: 'Credit Card', count: 6, total: 600.00 },
        { paymentMethod: 'Cash', count: 4, total: 400.00 }
      ],
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31')
    };

    mockHttpClient.get.and.returnValue(of(mockMetrics));

    service.getSalesMetrics().subscribe(metrics => {
      expect(metrics).toEqual(mockMetrics);
      expect(metrics.totalSales).toBe(1000.00);
      expect(metrics.transactionCount).toBe(10);
      expect(metrics.topConsignors.length).toBe(1);
      expect(metrics.paymentMethodBreakdown.length).toBe(2);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/transactions/metrics', { params: jasmine.any(Object) });
  }));

  it('should get sales metrics with query params successfully', fakeAsync(() => {
    const mockMetrics: SalesMetrics = {
      totalSales: 500.00,
      totalShopAmount: 250.00,
      totalConsignorAmount: 225.00,
      totalTax: 25.00,
      transactionCount: 5,
      averageTransactionValue: 100.00,
      topConsignors: [],
      paymentMethodBreakdown: []
    };

    mockHttpClient.get.and.returnValue(of(mockMetrics));

    const queryParams = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      providerId: 'consignor-1'
    };

    service.getSalesMetrics(queryParams).subscribe(metrics => {
      expect(metrics).toEqual(mockMetrics);
      expect(metrics.totalSales).toBe(500.00);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/transactions/metrics', { params: jasmine.any(Object) });
  }));
});