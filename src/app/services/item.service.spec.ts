import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ItemService } from './item.service';
import { ItemStatus } from '../models/item.model';

describe('ItemService', () => {
  let service: ItemService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete', 'patch']);

    TestBed.configureTestingModule({
      providers: [
        ItemService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(ItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get items successfully', () => {
    const mockItems = [
      {
        id: 1,
        name: 'Test Item 1',
        price: 29.99,
        status: ItemStatus.Available,
        providerId: 1,
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockHttpClient.get.and.returnValue(of(mockItems));

    service.getItems().subscribe(items => {
      expect(items).toEqual(mockItems);
      expect(items.length).toBe(1);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/items', { params: jasmine.any(Object) });
  });

  it('should get item by id successfully', () => {
    const mockItem = {
      id: 1,
      name: 'Test Item',
      price: 29.99,
      status: ItemStatus.Available,
      providerId: 1,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.get.and.returnValue(of(mockItem));

    service.getItem(1).subscribe(item => {
      expect(item).toEqual(mockItem);
      expect(item.name).toBe('Test Item');
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/items/1');
  });

  it('should create item successfully', () => {
    const createRequest = {
      name: 'New Item',
      price: 39.99,
      providerId: 1
    };
    const mockItem = {
      id: 3,
      name: 'New Item',
      price: 39.99,
      status: ItemStatus.Available,
      providerId: 1,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.post.and.returnValue(of(mockItem));

    service.createItem(createRequest).subscribe(item => {
      expect(item).toEqual(mockItem);
      expect(item.name).toBe('New Item');
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/items', createRequest);
  });

  it('should update item status successfully', () => {
    const mockItem = {
      id: 1,
      name: 'Test Item',
      price: 29.99,
      status: ItemStatus.Sold,
      providerId: 1,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.patch.and.returnValue(of(mockItem));

    service.updateItemStatus(1, ItemStatus.Sold).subscribe(item => {
      expect(item).toEqual(mockItem);
      expect(item.status).toBe(ItemStatus.Sold);
    });

    expect(mockHttpClient.patch).toHaveBeenCalledWith('http://localhost:5000/api/items/1/status', { status: ItemStatus.Sold });
  });

  it('should search items successfully', () => {
    const mockItems = [
      {
        id: 1,
        name: 'Searched Item',
        price: 29.99,
        status: ItemStatus.Available,
        providerId: 1,
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockHttpClient.get.and.returnValue(of(mockItems));

    service.searchItems('searched').subscribe(items => {
      expect(items).toEqual(mockItems);
      expect(items.length).toBe(1);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/items/search', { params: jasmine.any(Object) });
  });
});