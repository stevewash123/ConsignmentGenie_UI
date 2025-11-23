import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        InventoryService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(InventoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get items with pagination', fakeAsync(() => {
    const mockResponse = {
      items: [
        {
          id: 'item-1',
          sku: 'TEST001',
          title: 'Test Item',
          description: 'Test Description',
          category: 'Clothing',
          condition: 'Good',
          price: 50.00,
          status: 'Available',
          primaryImageUrl: 'test.jpg',
          providerId: 'prov-1',
          providerName: 'Test Provider',
          commissionRate: 50,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      organizationId: 'org-1'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getItems({ page: 1, pageSize: 10 }).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.items.length).toBe(1);
      expect(response.items[0].title).toBe('Test Item');
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should get single item', fakeAsync(() => {
    const itemId = 'item-1';
    const mockResponse = {
      success: true,
      data: {
        id: itemId,
        sku: 'TEST001',
        title: 'Test Item',
        category: 'Clothing'
      }
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getItem(itemId).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data.id).toBe(itemId);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should generate SKU', fakeAsync(() => {
    const prefix = 'TEST';
    const mockResponse = {
      success: true,
      data: 'TEST001'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.generateSku(prefix).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data).toBe('TEST001');
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));
});