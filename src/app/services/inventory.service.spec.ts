import { TestBed } from '@angular/core/testing';
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

  it('should get items successfully', () => {
    const mockResponse = {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      organizationId: 'org-1'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getItems().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/items', { params: jasmine.any(Object) });
  });

  it('should get categories successfully', () => {
    const mockResponse = {
      success: true,
      data: [],
      message: 'Categories retrieved successfully'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getCategories().subscribe(response => {
      expect(response.success).toBe(true);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/categories');
  });

  it('should get inventory metrics successfully', () => {
    const mockResponse = {
      success: true,
      data: { totalItems: 100 },
      message: 'Metrics retrieved successfully'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.getInventoryMetrics().subscribe(response => {
      expect(response.success).toBe(true);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/items/metrics');
  });
});