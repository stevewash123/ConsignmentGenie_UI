import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ItemFormModalComponent } from './item-form-modal.component';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';
import { ConditionService, ConditionOption } from '../../services/condition.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ItemCategoryDto, CreateItemRequest, ItemCondition } from '../../models/inventory.model';
import { Consignor } from '../../models/consignor.model';

describe('ItemFormModalComponent', () => {
  let component: ItemFormModalComponent;
  let fixture: ComponentFixture<ItemFormModalComponent>;
  let mockInventoryService: jasmine.SpyObj<InventoryService>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;
  let mockConditionService: jasmine.SpyObj<ConditionService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  const mockConditions: ConditionOption[] = [
    { value: 'New', label: 'New' },
    { value: 'LikeNew', label: 'Like New' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Poor', label: 'Poor' }
  ];

  const mockConsignors: Consignor[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      consignorNumber: 'C001',
      commissionRate: 0.6,
      isActive: true,
      status: 'active',
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Consignor
  ];

  const mockCategories: ItemCategoryDto[] = [
    {
      id: '1',
      name: 'Clothing',
      sortOrder: 1,
      isActive: true,
      subCategoryCount: 0,
      itemCount: 5,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Accessories',
      sortOrder: 2,
      isActive: true,
      subCategoryCount: 0,
      itemCount: 3,
      createdAt: new Date()
    }
  ];

  beforeEach(async () => {
    const inventorySpy = jasmine.createSpyObj('InventoryService', ['getCategories', 'createItem', 'updateItem']);
    const consignorSpy = jasmine.createSpyObj('ConsignorService', ['getConsignors']);
    const conditionSpy = jasmine.createSpyObj('ConditionService', ['getAll']);
    const loadingSpy = jasmine.createSpyObj('LoadingService', ['start', 'stop']);

    await TestBed.configureTestingModule({
      imports: [FormsModule, ItemFormModalComponent],
      providers: [
        { provide: InventoryService, useValue: inventorySpy },
        { provide: ConsignorService, useValue: consignorSpy },
        { provide: ConditionService, useValue: conditionSpy },
        { provide: LoadingService, useValue: loadingSpy }
      ]
    }).compileComponents();

    mockInventoryService = TestBed.inject(InventoryService) as jasmine.SpyObj<InventoryService>;
    mockConsignorService = TestBed.inject(ConsignorService) as jasmine.SpyObj<ConsignorService>;
    mockConditionService = TestBed.inject(ConditionService) as jasmine.SpyObj<ConditionService>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;

    // Setup default mock returns
    mockInventoryService.getCategories.and.returnValue(of({ success: true, data: mockCategories }));
    mockConsignorService.getConsignors.and.returnValue(of(mockConsignors));
    mockConditionService.getAll.and.returnValue(of(mockConditions));

    fixture = TestBed.createComponent(ItemFormModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load conditions on init when modal is open', () => {
    component.isOpen = true;

    fixture.detectChanges();
    component.ngOnInit();

    expect(mockConditionService.getAll).toHaveBeenCalled();
    expect(component.conditionOptions().length).toBe(5);
    expect(component.conditionOptions()[2].label).toBe('Good');
  });

  it('should set default condition to Good for new items', () => {
    component.isOpen = true;
    component.editingItem = null;

    fixture.detectChanges();
    component.ngOnChanges();

    expect(component.formData.condition).toBe('Good');
  });

  it('should populate condition field when editing an item', () => {
    const mockItem = {
      itemId: '1',
      title: 'Test Item',
      sku: 'TEST-001',
      price: 25.99,
      condition: ItemCondition.LikeNew,
      consignorId: '1'
    } as any;

    component.isOpen = true;
    component.editingItem = mockItem;

    fixture.detectChanges();
    component.ngOnChanges();

    expect(component.formData.condition).toBe(ItemCondition.LikeNew);
  });

  it('should include condition in form submission for new item', () => {
    component.formData = {
      title: 'Test Item',
      description: 'Test description',
      sku: 'TEST-001',
      price: 25.99,
      consignorId: '1',
      categoryId: '1',
      condition: ItemCondition.LikeNew,
      receivedDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date().toISOString().split('T')[0]
    };

    const mockResponse = {
      data: {
        itemId: '1',
        title: 'Test Item',
        condition: 'LikeNew'
      }
    } as any;

    mockInventoryService.createItem.and.returnValue(of(mockResponse));
    spyOn(component.itemSaved, 'emit');

    component.onSubmit();

    expect(mockInventoryService.createItem).toHaveBeenCalledWith(
      jasmine.objectContaining({
        condition: 'LikeNew'
      })
    );
  });

  it('should set loading state for conditions', () => {
    component.isLoadingConditions = true;
    expect(component.isLoadingConditions).toBeTrue();
  });

  it('should validate that condition is selected', () => {
    component.formData.condition = ItemCondition.Good;

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
  });

  it('should handle condition service errors gracefully', () => {
    mockConditionService.getAll.and.returnValue(of([]));
    spyOn(console, 'error');

    component.isOpen = true;
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.conditionOptions().length).toBe(0);
  });
});