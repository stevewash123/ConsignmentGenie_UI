import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ShopperCatalogService } from './shopper-catalog.service';

describe('ShopperCatalogService', () => {
  let service: ShopperCatalogService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  const mockStoreSlug = 'test-store';

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ShopperCatalogService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(ShopperCatalogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get catalog items with default parameters', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: {
        items: [
          {
            itemId: 'item-1',
            title: 'Test Item',
            price: 50.00,
            category: 'Electronics',
            condition: 'Good'
          }
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      }
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getCatalogItems(mockStoreSlug).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data.items.length).toBe(1);
      expect(response.data.items[0].itemId).toBe('item-1');
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should get catalog items with custom parameters', fakeAsync(() => {
    const request = {
      category: 'Electronics',
      minPrice: 10,
      maxPrice: 100,
      condition: 'Good',
      sortBy: 'price',
      sortDirection: 'desc' as const,
      page: 2,
      pageSize: 10
    };

    const mockResponse = { success: true, data: { items: [], totalCount: 0 } };
    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getCatalogItems(mockStoreSlug, request).subscribe();

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should get item detail', fakeAsync(() => {
    const itemId = 'item-1';
    const mockResponse = {
      success: true,
      data: {
        itemId: 'item-1',
        title: 'Test Item',
        description: 'Test Description',
        price: 50.00,
        category: 'Electronics',
        condition: 'Good',
        images: [
          {
            imageId: 'img-1',
            url: 'test-image.jpg',
            isPrimary: true,
            sortOrder: 1
          }
        ]
      }
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getItemDetail(mockStoreSlug, itemId).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data.itemId).toBe('item-1');
      expect(response.data.images.length).toBe(1);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should get categories', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: [
        { name: 'Electronics', itemCount: 10 },
        { name: 'Clothing', itemCount: 15 },
        { name: 'Books', itemCount: 8 }
      ]
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getCategories(mockStoreSlug).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data!.length).toBe(3);
      expect(response.data![0].name).toBe('Electronics');
      expect(response.data![0].itemCount).toBe(10);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should search items', fakeAsync(() => {
    const searchRequest = { searchQuery: 'test search' };
    const mockResponse = {
      success: true,
      data: {
        items: [
          {
            itemId: 'item-1',
            title: 'Test Item',
            price: 50.00,
            category: 'Electronics',
            condition: 'Good',
            images: []
          }
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        searchQuery: 'test search',
        filters: {}
      }
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.searchItems(mockStoreSlug, searchRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data!.searchQuery).toBe('test search');
      expect(response.data!.items.length).toBe(1);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should search items with page size', fakeAsync(() => {
    const searchRequest = { searchQuery: 'test', pageSize: 5 };
    const mockResponse = {
      success: true,
      data: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 5,
        totalPages: 0,
        searchQuery: 'test',
        filters: {}
      }
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.searchItems(mockStoreSlug, searchRequest).subscribe();

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should handle HTTP errors gracefully', fakeAsync(() => {
    mockHttpClient.get.and.returnValue(
      throwError(() => ({ status: 500, statusText: 'Internal Server Error' }))
    );

    service.getCatalogItems(mockStoreSlug).subscribe({
      next: () => fail('Expected error'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    tick();
  }));

  it('should handle network errors', fakeAsync(() => {
    mockHttpClient.get.and.returnValue(
      throwError(() => ({ status: 0 }))
    );

    service.getItemDetail(mockStoreSlug, 'item-1').subscribe({
      next: () => fail('Expected error'),
      error: (error) => {
        expect(error.status).toBe(0);
      }
    });

    tick();
  }));
});