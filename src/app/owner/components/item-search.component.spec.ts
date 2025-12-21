import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ItemSearchComponent, Item } from './item-search.component';
import { RecordSaleService } from '../../services/record-sale.service';

describe('ItemSearchComponent', () => {
  let component: ItemSearchComponent;
  let fixture: ComponentFixture<ItemSearchComponent>;
  let mockRecordSaleService: jasmine.SpyObj<RecordSaleService>;

  const mockItems: Item[] = [
    {
      id: '1',
      name: 'Test Item 1',
      sku: 'TEST-001',
      price: 10.00,
      consignorName: 'Test Consignor 1',
      status: 'Available'
    },
    {
      id: '2',
      name: 'Another Item',
      sku: 'TEST-002',
      price: 20.00,
      consignorName: 'Test Consignor 2',
      status: 'Available'
    },
    {
      id: '3',
      name: 'Widget',
      sku: 'WIDGET-001',
      price: 30.00,
      consignorName: 'Widget Maker',
      status: 'Available'
    }
  ];

  beforeEach(async () => {
    const recordSaleServiceSpy = jasmine.createSpyObj('RecordSaleService', ['getAvailableItems']);

    // Set default return value for all calls to getAvailableItems
    recordSaleServiceSpy.getAvailableItems.and.returnValue(of(mockItems));

    await TestBed.configureTestingModule({
      imports: [ItemSearchComponent, CommonModule, FormsModule],
      providers: [
        { provide: RecordSaleService, useValue: recordSaleServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemSearchComponent);
    component = fixture.componentInstance;
    mockRecordSaleService = TestBed.inject(RecordSaleService) as jasmine.SpyObj<RecordSaleService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial items on init', fakeAsync(() => {
    mockRecordSaleService.getAvailableItems.and.returnValue(of(mockItems));

    component.ngOnInit();
    tick(500); // Account for debounce and async operations

    expect(mockRecordSaleService.getAvailableItems).toHaveBeenCalledWith();
    expect(component.allItems()).toEqual(mockItems);
    expect(component.isLoading()).toBe(false);
  }));

  it('should handle initial items loading error', fakeAsync(() => {
    mockRecordSaleService.getAvailableItems.and.returnValue(throwError(() => new Error('Network error')));
    spyOn(console, 'error');

    component.ngOnInit();
    tick(500);

    expect(component.isLoading()).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Failed to load items:', jasmine.any(Error));
  }));

  it('should filter items by name', () => {
    component.allItems.set(mockItems);
    component.searchQuery = 'test';

    const filtered = component.displayedItems();

    expect(filtered.length).toBe(2);
    expect(filtered[0].name).toBe('Test Item 1');
    expect(filtered[1].name).toBe('Another Item');
  });

  it('should filter items by SKU', () => {
    component.allItems.set(mockItems);
    component.searchQuery = 'WIDGET';

    const filtered = component.displayedItems();

    expect(filtered.length).toBe(1);
    expect(filtered[0].sku).toBe('WIDGET-001');
  });

  it('should filter items by consignor name', () => {
    component.allItems.set(mockItems);
    component.searchQuery = 'Widget Maker';

    const filtered = component.displayedItems();

    expect(filtered.length).toBe(1);
    expect(filtered[0].consignorName).toBe('Widget Maker');
  });

  it('should limit displayed items to 20 when no search query', () => {
    const manyItems = Array.from({ length: 30 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      sku: `SKU-${i}`,
      price: 10.00,
      consignorName: `Consignor ${i}`,
      status: 'Available'
    }));

    component.allItems.set(manyItems);
    component.searchQuery = '';

    const filtered = component.displayedItems();

    expect(filtered.length).toBe(20);
  });

  it('should perform search with debouncing', fakeAsync(() => {
    mockRecordSaleService.getAvailableItems.and.returnValue(of(mockItems));
    component.ngOnInit();
    tick(500); // Complete initial load

    // Reset spy call count
    mockRecordSaleService.getAvailableItems.calls.reset();
    mockRecordSaleService.getAvailableItems.and.returnValue(of([mockItems[0]]));

    const inputEvent = new Event('input');
    Object.defineProperty(inputEvent, 'target', {
      value: { value: 'test' }
    });

    component.onSearchInput(inputEvent);

    // Should not call immediately due to debouncing
    expect(mockRecordSaleService.getAvailableItems).not.toHaveBeenCalled();

    // Should call after debounce time
    tick(300);
    expect(mockRecordSaleService.getAvailableItems).toHaveBeenCalledWith('test');

    tick(200); // Complete the observable
    expect(component.allItems()).toEqual([mockItems[0]]);
  }));

  it('should handle search error', fakeAsync(() => {
    mockRecordSaleService.getAvailableItems.and.returnValue(of(mockItems));
    component.ngOnInit();
    tick(500); // Complete initial load

    mockRecordSaleService.getAvailableItems.calls.reset();
    mockRecordSaleService.getAvailableItems.and.returnValue(throwError(() => new Error('Search error')));
    spyOn(console, 'error');

    const inputEvent = new Event('input');
    Object.defineProperty(inputEvent, 'target', {
      value: { value: 'test' }
    });

    component.onSearchInput(inputEvent);
    tick(300);
    tick(200);

    expect(component.isLoading()).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Search failed:', jasmine.any(Error));
  }));

  it('should emit item selected event', () => {
    spyOn(component.itemSelected, 'emit');

    component.selectItem(mockItems[0]);

    expect(component.itemSelected.emit).toHaveBeenCalledWith(mockItems[0]);
  });

  it('should not select disabled items', () => {
    spyOn(component.itemSelected, 'emit');
    fixture.componentRef.setInput('disabledItems', ['1']);
    fixture.detectChanges();

    component.selectItem(mockItems[0]); // Item with id '1'

    expect(component.itemSelected.emit).not.toHaveBeenCalled();
  });

  it('should allow selection of non-disabled items', () => {
    spyOn(component.itemSelected, 'emit');
    fixture.componentRef.setInput('disabledItems', ['1']);
    fixture.detectChanges();

    component.selectItem(mockItems[1]); // Item with id '2'

    expect(component.itemSelected.emit).toHaveBeenCalledWith(mockItems[1]);
  });

  it('should not search when query is empty or whitespace', fakeAsync(() => {
    mockRecordSaleService.getAvailableItems.and.returnValue(of(mockItems));
    component.ngOnInit();
    tick(500); // Complete initial load

    mockRecordSaleService.getAvailableItems.calls.reset();

    const inputEvent = new Event('input');
    Object.defineProperty(inputEvent, 'target', {
      value: { value: '   ' } // Whitespace only
    });

    component.onSearchInput(inputEvent);
    tick(300);

    expect(mockRecordSaleService.getAvailableItems).not.toHaveBeenCalled();
  }));

  it('should update search query from input event', () => {
    const inputEvent = new Event('input');
    Object.defineProperty(inputEvent, 'target', {
      value: { value: 'new search term' }
    });

    component.onSearchInput(inputEvent);

    expect(component.searchQuery).toBe('new search term');
  });

  it('should handle case-insensitive search', () => {
    component.allItems.set(mockItems);
    component.searchQuery = 'TEST'; // Uppercase

    const filtered = component.displayedItems();

    expect(filtered.length).toBe(2); // Should find "Test Item 1" and items with "TEST-" SKUs
  });
});