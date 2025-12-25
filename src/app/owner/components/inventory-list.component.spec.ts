import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InventoryListComponent } from './inventory-list.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import {
  ItemListDto,
  PagedResult,
  CategoryDto,
  ItemCondition,
  ItemStatus,
  ApiResponse
} from '../../models/inventory.model';

describe('InventoryListComponent', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;
  let mockInventoryService: jasmine.SpyObj<InventoryService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  const mockCategories: CategoryDto[] = [
    { id: 'cat1', name: 'Electronics', displayOrder: 1, isActive: true, createdAt: new Date() },
    { id: 'cat2', name: 'Clothing', displayOrder: 2, isActive: true, createdAt: new Date() }
  ];

  const mockItems: ItemListDto[] = [
    {
      itemId: 'item1',
      sku: 'SKU001',
      title: 'Test Item 1',
      description: 'This is a test item description',
      price: 99.99,
      category: 'Electronics',
      condition: ItemCondition.New,
      status: ItemStatus.Available,
      primaryImageUrl: 'https://example.com/image1.jpg',
      receivedDate: new Date('2023-01-01'),
      soldDate: undefined,
      consignorId: 'consignor1',
      consignorName: 'John Doe',
      commissionRate: 0.4
    },
    {
      itemId: 'item2',
      sku: 'SKU002',
      title: 'Test Item 2',
      description: 'Another test item',
      price: 149.99,
      category: 'Clothing',
      condition: ItemCondition.LikeNew,
      status: ItemStatus.Available,
      primaryImageUrl: undefined,
      receivedDate: new Date('2023-01-02'),
      soldDate: undefined,
      consignorId: 'consignor2',
      consignorName: 'Jane Smith',
      commissionRate: 0.5
    }
  ];

  const mockPagedResult: PagedResult<ItemListDto> = {
    items: mockItems,
    totalCount: 2,
    page: 1,
    pageSize: 25,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    organizationId: 'org1'
  };

  const emptyPagedResult: PagedResult<ItemListDto> = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    organizationId: 'org1'
  };

  beforeEach(async () => {
    const inventoryServiceSpy = jasmine.createSpyObj('InventoryService', [
      'getItems',
      'getCategories',
      'updateItemStatus',
      'deleteItem'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'isActive'], {
      events: of(),  // RouterLinkActive subscribes to router.events
      url: '/owner/inventory'
    });
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [
      'start',
      'stop',
      'isLoading'
    ]);

    await TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { 
          provide: ActivatedRoute, 
          useValue: { queryParams: of({}), params: of({}) }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    mockInventoryService = TestBed.inject(InventoryService) as jasmine.SpyObj<InventoryService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;

    // Setup default mock returns
    mockInventoryService.getItems.and.returnValue(of(mockPagedResult));
    mockInventoryService.getCategories.and.returnValue(of({
      success: true,
      data: mockCategories
    } as ApiResponse<CategoryDto[]>));
    mockLoadingService.isLoading.and.returnValue(false);
  });

  /**
   * Helper to initialize component - triggers ngOnInit and waits for observables
   */
  function initializeComponent(options: { loading?: boolean; items?: PagedResult<ItemListDto> | null } = {}) {
    const { loading = false, items = mockPagedResult } = options;
    
    mockLoadingService.isLoading.and.returnValue(loading);
    
    if (items) {
      mockInventoryService.getItems.and.returnValue(of(items));
    }
    
    fixture.detectChanges(); // triggers ngOnInit -> loadCategories() + loadItems()
  }

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have initial signal values', () => {
      expect(component.itemsResult()).toBeNull();
      expect(component.categories()).toEqual([]);
      expect(component.error()).toBeNull();
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('Initialization', () => {
    it('should load categories on init', () => {
      initializeComponent();

      expect(mockInventoryService.getCategories).toHaveBeenCalled();
      expect(component.categories()).toEqual(mockCategories);
    });

    it('should load items on init', () => {
      initializeComponent();

      expect(mockInventoryService.getItems).toHaveBeenCalled();
      expect(component.itemsResult()).toEqual(mockPagedResult);
    });

    it('should call loading service start and stop', () => {
      initializeComponent();

      expect(mockLoadingService.start).toHaveBeenCalledWith('inventory-list');
      expect(mockLoadingService.stop).toHaveBeenCalledWith('inventory-list');
    });
  });

  describe('Loading State', () => {
    it('should return loading state from loading service', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      expect(component.isInventoryLoading()).toBe(true);

      mockLoadingService.isLoading.and.returnValue(false);
      expect(component.isInventoryLoading()).toBe(false);
    });

    xit('should call isLoading with correct key', () => {
      component.isInventoryLoading();
      expect(mockLoadingService.isLoading).toHaveBeenCalledWith('inventory-list');
    });

    xit('should show loading state in template when loading', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      fixture.detectChanges();

      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();
    });

    xit('should hide table when loading', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      fixture.detectChanges();

      const tableContainer = fixture.nativeElement.querySelector('.table-container');
      expect(tableContainer).toBeFalsy();
    });
  });

  xdescribe('Table View Rendering', () => {
    beforeEach(() => {
      initializeComponent();
    });

    it('should display table container when not loading', () => {
      const tableContainer = fixture.nativeElement.querySelector('.table-container');
      expect(tableContainer).toBeTruthy();
    });

    it('should display inventory table', () => {
      const inventoryTable = fixture.nativeElement.querySelector('.inventory-table');
      expect(inventoryTable).toBeTruthy();
    });

    it('should render table with correct headers', () => {
      const tableHeaders = fixture.nativeElement.querySelectorAll('th');
      expect(tableHeaders.length).toBe(10);
    });

    it('should render table rows for items', () => {
      const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(tableRows.length).toBe(2);
    });

    it('should display SKU in table cells', () => {
      const skuCells = fixture.nativeElement.querySelectorAll('.sku-cell');
      expect(skuCells.length).toBe(2);
      expect(skuCells[0].textContent.trim()).toBe('SKU001');
      expect(skuCells[1].textContent.trim()).toBe('SKU002');
    });

    it('should display condition badges', () => {
      const conditionBadges = fixture.nativeElement.querySelectorAll('.condition-badge');
      expect(conditionBadges.length).toBeGreaterThan(0);
    });

    it('should display status badges', () => {
      const statusBadges = fixture.nativeElement.querySelectorAll('.status-badge');
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('should display action buttons with icons', () => {
      const actionButtons = fixture.nativeElement.querySelectorAll('.action-buttons .btn-icon');
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  xdescribe('Table Controls', () => {
    beforeEach(() => {
      initializeComponent();
    });

    it('should display section header', () => {
      const sectionHeader = fixture.nativeElement.querySelector('.section-header');
      expect(sectionHeader).toBeTruthy();
    });

    it('should display page size selector', () => {
      const pageSizeSelector = fixture.nativeElement.querySelector('.page-size-select');
      expect(pageSizeSelector).toBeTruthy();
    });

    it('should not display view toggle buttons (table-only design)', () => {
      const viewToggle = fixture.nativeElement.querySelector('.view-toggle');
      expect(viewToggle).toBeFalsy();
    });

    it('should not have cards view elements (table-only design)', () => {
      const cardsContainer = fixture.nativeElement.querySelector('.items-cards-container');
      expect(cardsContainer).toBeFalsy();
    });
  });

  describe('Empty State', () => {
    it('should handle empty data gracefully', () => {
      initializeComponent({ items: emptyPagedResult });

      expect(component.itemsResult()).toEqual(emptyPagedResult);
      expect(component.itemsResult()?.items.length).toBe(0);
    });

    it('should show empty state when no items', () => {
      initializeComponent({ items: emptyPagedResult });

      // Component should display empty state UI - no item rows
      const tableRows = fixture.nativeElement.querySelectorAll('tbody tr.item-row');
      expect(tableRows.length).toBe(0);
    });
  });

  describe('Error State', () => {
    it('should set error state on API failure', () => {
      mockInventoryService.getItems.and.returnValue(throwError(() => new Error('API Error')));

      component.loadItems();

      expect(component.error()).toBe('Failed to load inventory items. Please try again.');
    });

    it('should clear error before loading', () => {
      component.error.set('Previous error');
      
      mockInventoryService.getItems.and.returnValue(of(mockPagedResult));
      component.loadItems();

      expect(component.error()).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate to create new item', () => {
      component.createNewItem();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/inventory/new']);
    });

    it('should navigate to view item', () => {
      component.viewItem('item1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/inventory', 'item1']);
    });

    it('should navigate to edit item', () => {
      component.editItem('item1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/inventory', 'item1', 'edit']);
    });
  });

  xdescribe('Filtering', () => {
    beforeEach(() => {
      initializeComponent();
      mockInventoryService.getItems.calls.reset();
    });

    it('should apply filters and reset to page 1', () => {
      component.currentPage.set(3);
      component.searchQuery = 'test';
      
      component.applyFilters();

      expect(component.currentPage()).toBe(1);
      expect(mockInventoryService.getItems).toHaveBeenCalled();
    });

    it('should include search query in params', () => {
      component.searchQuery = 'test search';
      component.applyFilters();

      expect(mockInventoryService.getItems).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'test search' })
      );
    });

    it('should include status filter in params', () => {
      component.selectedStatus = 'Available';
      component.applyFilters();

      expect(mockInventoryService.getItems).toHaveBeenCalledWith(
        jasmine.objectContaining({ status: 'Available' })
      );
    });

    it('should include condition filter in params', () => {
      component.selectedCondition = 'New';
      component.applyFilters();

      expect(mockInventoryService.getItems).toHaveBeenCalledWith(
        jasmine.objectContaining({ condition: 'New' })
      );
    });

    it('should include category filter in params', () => {
      component.selectedCategory = 'Electronics';
      component.applyFilters();

      expect(mockInventoryService.getItems).toHaveBeenCalledWith(
        jasmine.objectContaining({ category: 'Electronics' })
      );
    });

    it('should include price range in params', () => {
      component.priceMin = 10;
      component.priceMax = 100;
      component.applyFilters();

      expect(mockInventoryService.getItems).toHaveBeenCalledWith(
        jasmine.objectContaining({ priceMin: 10, priceMax: 100 })
      );
    });

    it('should clear all filters', () => {
      component.searchQuery = 'test';
      component.selectedStatus = 'Available';
      component.selectedCondition = 'New';
      component.selectedCategory = 'Electronics';
      component.priceMin = 10;
      component.priceMax = 100;
      component.sortBy = 'Price';
      component.sortDirection = 'asc';

      component.clearFilters();

      expect(component.searchQuery).toBe('');
      expect(component.selectedStatus).toBe('');
      expect(component.selectedCondition).toBe('');
      expect(component.selectedCategory).toBe('');
      expect(component.priceMin).toBeNull();
      expect(component.priceMax).toBeNull();
      expect(component.sortBy).toBe('CreatedAt');
      expect(component.sortDirection).toBe('desc');
    });
  });

  xdescribe('Sorting', () => {
    beforeEach(() => {
      initializeComponent();
      mockInventoryService.getItems.calls.reset();
    });

    it('should toggle sort direction when clicking same column', () => {
      component.sortBy = 'Price';
      component.sortDirection = 'desc';

      component.setSorting('Price');

      expect(component.sortDirection).toBe('asc');
    });

    it('should set new column and default to desc', () => {
      component.sortBy = 'CreatedAt';
      component.sortDirection = 'asc';

      component.setSorting('Price');

      expect(component.sortBy).toBe('Price');
      expect(component.sortDirection).toBe('desc');
    });

    it('should reload items after sorting', () => {
      component.setSorting('Title');

      expect(mockInventoryService.getItems).toHaveBeenCalled();
    });
  });

  xdescribe('Pagination', () => {
    beforeEach(() => {
      initializeComponent();
      mockInventoryService.getItems.calls.reset();
    });

    it('should go to specified page', () => {
      component.goToPage(3);

      expect(component.currentPage()).toBe(3);
      expect(mockInventoryService.getItems).toHaveBeenCalled();
    });

    it('should reset to page 1 when changing page size', () => {
      component.currentPage.set(5);
      component.pageSize = 50;

      component.changePageSize();

      expect(component.currentPage()).toBe(1);
      expect(mockInventoryService.getItems).toHaveBeenCalled();
    });

    it('should compute visible pages correctly', () => {
      const multiPageResult: PagedResult<ItemListDto> = {
        ...mockPagedResult,
        totalPages: 10,
        page: 5
      };
      component.itemsResult.set(multiPageResult);
      component.currentPage.set(5);

      const pages = component.visiblePages();

      expect(pages).toContain(3);
      expect(pages).toContain(4);
      expect(pages).toContain(5);
      expect(pages).toContain(6);
      expect(pages).toContain(7);
    });

    it('should return empty array when no result', () => {
      component.itemsResult.set(null);

      expect(component.visiblePages()).toEqual([]);
    });
  });

  xdescribe('Item Actions', () => {
    beforeEach(() => {
      initializeComponent();
    });

    it('should mark item as removed with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockInventoryService.updateItemStatus.and.returnValue(of({ success: true, data: null }));

      component.markAsRemoved(mockItems[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockInventoryService.updateItemStatus).toHaveBeenCalledWith(
        'item1',
        jasmine.objectContaining({ status: 'Removed' })
      );
    });

    it('should not mark item as removed when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.markAsRemoved(mockItems[0]);

      expect(mockInventoryService.updateItemStatus).not.toHaveBeenCalled();
    });

    it('should delete item with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockInventoryService.deleteItem.and.returnValue(of({ success: true, data: null }));

      component.deleteItem(mockItems[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockInventoryService.deleteItem).toHaveBeenCalledWith('item1');
    });

    it('should not delete item when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteItem(mockItems[0]);

      expect(mockInventoryService.deleteItem).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockInventoryService.deleteItem.and.returnValue(throwError(() => new Error('Delete failed')));

      component.deleteItem(mockItems[0]);

      expect(component.error()).toBe('Failed to delete item.');
    });

    it('should set error on status update failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockInventoryService.updateItemStatus.and.returnValue(throwError(() => new Error('Update failed')));

      component.markAsRemoved(mockItems[0]);

      expect(component.error()).toBe('Failed to update item status.');
    });
  });

  describe('Helper Methods', () => {
    it('should get condition class', () => {
      expect(component.getConditionClass(ItemCondition.New)).toBe('condition-new');
      expect(component.getConditionClass(ItemCondition.LikeNew)).toBe('condition-like-new');
      expect(component.getConditionClass(ItemCondition.Good)).toBe('condition-good');
    });

    it('should get condition label', () => {
      expect(component.getConditionLabel(ItemCondition.LikeNew)).toBe('Like New');
      expect(component.getConditionLabel(ItemCondition.New)).toBe('New');
    });

    it('should get status class', () => {
      expect(component.getStatusClass(ItemStatus.Available)).toBe('status-available');
      expect(component.getStatusClass(ItemStatus.Sold)).toBe('status-sold');
    });

    it('should return paged result', () => {
      initializeComponent();
      expect(component.pagedResult()).toEqual(mockPagedResult);
    });
  });

  describe('Responsive Design', () => {
    it('should handle window resize gracefully', () => {
      initializeComponent();

      // Simulate window resize
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      // Component should remain functional
      expect(component.itemsResult()).toBe(mockPagedResult);
    });
  });
});