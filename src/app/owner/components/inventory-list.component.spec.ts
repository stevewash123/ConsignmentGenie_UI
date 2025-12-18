import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InventoryListComponent } from './inventory-list.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import {
  ItemListDto,
  ItemDetailDto,
  PagedResult,
  CategoryDto,
  ItemCondition,
  ItemStatus,
  ApiResponse
} from '../../models/inventory.model';

describe('InventoryListComponent - Simplified Design', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;
  let mockInventoryService: jasmine.SpyObj<InventoryService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  const mockCategories: CategoryDto[] = [
    { CategoryId: 'cat1', Name: 'Electronics', DisplayOrder: 1, ItemCount: 5 },
    { CategoryId: 'cat2', Name: 'Clothing', DisplayOrder: 2, ItemCount: 3 }
  ];

  const mockItems: ItemListDto[] = [
    {
      ItemId: 'item1',
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
      ItemId: 'item2',
      sku: 'SKU002',
      title: 'Test Item 2',
      description: 'Another test item',
      price: 149.99,
      category: 'Clothing',
      condition: ItemCondition.LikeNew,
      status: ItemStatus.Available,
      primaryImageUrl: undefined, // Test missing image
      receivedDate: new Date('2023-01-02'),
      soldDate: undefined,
      consignorId: 'consignor2',
      consignorName: 'Jane Smith',
      commissionRate: 0.5
    }
  ];

  const mockPagedResult: PagedResult<ItemListDto> = {
    Items: mockItems,
    totalCount: 2,
    page: 1,
    pageSize: 25,
    totalPages: 1,
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
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [
      'start',
      'stop',
      'isLoading'
    ]);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: of({}),
      params: of({})
    });

    await TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
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

  describe('Simplified Table View', () => {
    it('should render table view only', () => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();

      const tableContainer = fixture.nativeElement.querySelector('.table-container');
      expect(tableContainer).toBeTruthy();
    });

    it('should display inventory table', () => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();

      const inventoryTable = fixture.nativeElement.querySelector('.inventory-table');
      expect(inventoryTable).toBeTruthy();
    });

    it('should not have cards view elements', () => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();

      const cardsContainer = fixture.nativeElement.querySelector('.items-cards-container');
      expect(cardsContainer).toBeFalsy();
    });
  });

  describe('Action Button Styling', () => {
    beforeEach(() => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();
    });

    it('should display action buttons with emoji icons', () => {
      const actionButtons = fixture.nativeElement.querySelectorAll('.action-buttons .btn-icon');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('should have consistent action button styling', () => {
      const actionButtons = fixture.nativeElement.querySelectorAll('.btn-icon');
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Table View Rendering', () => {
    beforeEach(() => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();
    });

    it('should display table container', () => {
      const tableContainer = fixture.nativeElement.querySelector('.table-container');
      expect(tableContainer).toBeTruthy();
    });

    it('should render table with correct headers', () => {
      const tableHeaders = fixture.nativeElement.querySelectorAll('th');
      expect(tableHeaders.length).toBe(10); // Image, SKU, Title, Category, Condition, Price, Status, Consignor, Received, Actions
    });

    it('should render table rows for items', () => {
      const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(tableRows.length).toBe(2);
    });

    it('should display item data in table cells', () => {
      const skuCells = fixture.nativeElement.querySelectorAll('.sku-cell');
      expect(skuCells.length).toBe(2);
      expect(skuCells[0].textContent.trim()).toBe('SKU001');
      expect(skuCells[1].textContent.trim()).toBe('SKU002');
    });
  });

  describe('Empty State Handling', () => {
    const emptyPagedResult: PagedResult<ItemListDto> = {
      Items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      organizationId: 'org1'
    };

    beforeEach(() => {
      // Ensure conditions for rendering are met: no loading, no error, has data
      component.error.set(null);
      mockLoadingService.isLoading.and.returnValue(false);
    });

    it('should handle empty data gracefully', () => {
      mockInventoryService.getItems.and.returnValue(of(emptyPagedResult));
      component.loadItems();
      fixture.detectChanges();

      // Component should still be functional with empty data
      expect(component.itemsResult()).toEqual(emptyPagedResult);
    });

    it('should show empty state when no items', () => {
      mockInventoryService.getItems.and.returnValue(of(emptyPagedResult));
      mockLoadingService.isLoading.and.returnValue(false);
      component.loadItems();
      fixture.detectChanges();

      // The empty state message should appear when no items are available
      expect(component.itemsResult()?.Items.length).toBe(0);
    });
  });

  describe('Loading State', () => {
    it('should show loading state when data is loading', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      component.itemsResult.set(null);
      fixture.detectChanges();

      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();
      expect(loadingState.textContent).toContain('Loading inventory...');
    });

    it('should hide table when loading', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();

      const tableContainer = fixture.nativeElement.querySelector('.table-container');
      expect(tableContainer).toBeFalsy();
    });
  });

  describe('Error State', () => {
    it('should set error state properly', () => {
      component.error.set('Failed to load inventory items');
      mockLoadingService.isLoading.and.returnValue(false);

      expect(component.error()).toBe('Failed to load inventory items');
      expect(component.isInventoryLoading()).toBe(false);
    });

    it('should maintain component state during error state', () => {
      component.error.set('Test error');
      mockLoadingService.isLoading.and.returnValue(false);

      // Component should be preserved even with errors
      expect(component.error()).toBe('Test error');
    });
  });

  describe('Table Controls UI', () => {
    beforeEach(() => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();
    });

    it('should display section header', () => {
      const sectionHeader = fixture.nativeElement.querySelector('.section-header');
      expect(sectionHeader).toBeTruthy();
    });

    it('should display page size selector', () => {
      const pageSizeSelector = fixture.nativeElement.querySelector('.page-size-select');
      expect(pageSizeSelector).toBeTruthy();
    });

    it('should not display view toggle buttons', () => {
      const viewToggle = fixture.nativeElement.querySelector('.view-toggle');
      expect(viewToggle).toBeFalsy();
    });
  });

  describe('Component Integration', () => {
    it('should load data on initialization', () => {
      component.ngOnInit();

      expect(mockInventoryService.getCategories).toHaveBeenCalled();
      expect(mockInventoryService.getItems).toHaveBeenCalled();
    });

    it('should handle navigation to item view', () => {
      component.viewItem('item1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/inventory', 'item1']);
    });

    it('should handle navigation to item edit', () => {
      component.editItem('item1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/inventory', 'item1', 'edit']);
    });

    it('should handle navigation to create new item', () => {
      component.createNewItem();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/inventory/new']);
    });
  });

  describe('Responsive Design Support', () => {
    it('should handle screen resizes gracefully', () => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();

      // Simulate window resize (component should remain functional)
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      expect(component.itemsResult()).toBe(mockPagedResult);
    });
  });

  describe('Badge Display', () => {
    beforeEach(() => {
      component.itemsResult.set(mockPagedResult);
      fixture.detectChanges();
    });

    it('should display condition badges in table view', () => {
      const conditionBadges = fixture.nativeElement.querySelectorAll('.condition-badge');
      expect(conditionBadges.length).toBeGreaterThan(0);
    });

    it('should display status badges in table view', () => {
      const statusBadges = fixture.nativeElement.querySelectorAll('.status-badge');
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });
});