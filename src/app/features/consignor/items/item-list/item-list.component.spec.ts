import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ItemListComponent } from './item-list.component';
import { MockConsignorItemService } from '../services/mock-consignor-item.service';
import { ConsignorItemsResponse } from '../models/consignor-item.model';

describe('ItemListComponent', () => {
  let component: ItemListComponent;
  let fixture: ComponentFixture<ItemListComponent>;
  let mockService: jasmine.SpyObj<MockConsignorItemService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockResponse: ConsignorItemsResponse = {
    items: [
      {
        id: '1',
        name: 'Test Item 1',
        thumbnailUrl: 'https://example.com/1.jpg',
        listedPrice: 100,
        consignorEarnings: 60,
        status: 'available',
        listedDate: new Date('2024-01-01'),
        daysListed: 30
      },
      {
        id: '2',
        name: 'Test Item 2',
        thumbnailUrl: 'https://example.com/2.jpg',
        listedPrice: 75,
        consignorEarnings: 45,
        status: 'sold',
        listedDate: new Date('2024-01-15'),
        soldDate: new Date('2024-02-01'),
        daysListed: 17
      }
    ],
    totalCount: 10,
    page: 1,
    pageSize: 12,
    totalPages: 1,
    statusCounts: {
      all: 10,
      available: 5,
      sold: 3,
      returned: 1,
      expired: 1
    }
  };

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('MockConsignorItemService', ['getConsignorItems']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ItemListComponent],
      providers: [
        { provide: MockConsignorItemService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListComponent);
    component = fixture.componentInstance;
    mockService = TestBed.inject(MockConsignorItemService) as jasmine.SpyObj<MockConsignorItemService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    mockService.getConsignorItems.and.returnValue(of(mockResponse));

    component.ngOnInit();

    expect(mockService.getConsignorItems).toHaveBeenCalled();
    expect(component.itemsResponse).toEqual(mockResponse);
    expect(component.loading).toBeFalse();
  });

  it('should handle service error', () => {
    mockService.getConsignorItems.and.returnValue(throwError(() => new Error('Service error')));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load items. Please try again.');
    expect(component.loading).toBeFalse();
  });

  it('should filter by status', () => {
    mockService.getConsignorItems.and.returnValue(of(mockResponse));

    component.onFilterByStatus('available');

    expect(component.selectedStatus).toBe('available');
    expect(component.currentPage).toBe(1);
    expect(mockService.getConsignorItems).toHaveBeenCalledWith(
      jasmine.objectContaining({
        filter: { status: 'available' },
        page: 1
      })
    );
  });

  it('should handle search input with debounce', () => {
    mockService.getConsignorItems.and.returnValue(of(mockResponse));
    component.ngOnInit();

    const event = { target: { value: 'test search' } } as any;
    component.onSearchInput(event);

    // Search should be debounced, so it won't immediately call the service
    expect(component.searchText).toBe('');
  });

  it('should change sort direction when clicking same field', () => {
    mockService.getConsignorItems.and.returnValue(of(mockResponse));
    component.sortField = 'price';
    component.sortDirection = 'desc';

    component.onSortChange('price');

    expect(component.sortDirection).toBe('asc');
  });

  it('should set new sort field when clicking different field', () => {
    mockService.getConsignorItems.and.returnValue(of(mockResponse));
    component.sortField = 'price';

    component.onSortChange('name');

    expect(component.sortField).toBe('name');
    expect(component.sortDirection).toBe('asc');
  });

  it('should navigate to item detail on item click', () => {
    const item = mockResponse.items[0];

    component.onItemClick(item);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/consignor/items', '1']);
  });

  it('should change page within valid range', () => {
    mockService.getConsignorItems.and.returnValue(of(mockResponse));
    component.itemsResponse = mockResponse;

    component.onPageChange(1);

    expect(component.currentPage).toBe(1);
    expect(mockService.getConsignorItems).toHaveBeenCalled();
  });

  it('should not change page outside valid range', () => {
    component.itemsResponse = mockResponse;
    const originalPage = component.currentPage;

    component.onPageChange(999);

    expect(component.currentPage).toBe(originalPage);
  });

  it('should load more items', () => {
    mockService.getConsignorItems.and.returnValue(of({ ...mockResponse, totalPages: 2 }));
    component.itemsResponse = { ...mockResponse, totalPages: 2 };
    component.currentPage = 1;

    component.onLoadMore();

    expect(component.currentPage).toBe(2);
  });

  it('should return correct sort icon', () => {
    component.sortField = 'price';
    component.sortDirection = 'desc';

    expect(component.getSortIcon('price')).toBe('↓');
    expect(component.getSortIcon('name')).toBe('↕️');

    component.sortDirection = 'asc';
    expect(component.getSortIcon('price')).toBe('↑');
  });

  it('should return correct sort display text', () => {
    component.sortField = 'listedDate';
    component.sortDirection = 'desc';

    expect(component.getCurrentSortDisplay()).toBe('Newest First');

    component.sortDirection = 'asc';
    expect(component.getCurrentSortDisplay()).toBe('Oldest First');
  });

  it('should check if has items correctly', () => {
    component.itemsResponse = mockResponse;
    expect(component.hasItems()).toBeTrue();

    component.itemsResponse = { ...mockResponse, items: [] };
    expect(component.hasItems()).toBeFalse();

    component.itemsResponse = null;
    expect(component.hasItems()).toBeFalse();
  });

  it('should get active filters text', () => {
    component.selectedStatus = 'available';
    component.searchText = 'test';

    expect(component.getActiveFiltersText()).toContain('Status: available');
    expect(component.getActiveFiltersText()).toContain('Search: "test"');
  });

  it('should clear filters', () => {
    mockService.getConsignorItems.and.returnValue(of(mockResponse));
    component.selectedStatus = 'available';
    component.searchText = 'test';

    component.clearFilters();

    expect(component.selectedStatus).toBeNull();
    expect(component.searchText).toBe('');
    expect(component.currentPage).toBe(1);
  });

  it('should get status counts', () => {
    component.itemsResponse = mockResponse;

    expect(component.getStatusCount('all')).toBe(10);
    expect(component.getStatusCount('available')).toBe(5);
    expect(component.getStatusCount('sold')).toBe(3);
    expect(component.getStatusCount('unknown')).toBe(0);
  });
});