import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { ItemFormModalComponent } from './item-form-modal.component';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';
import { ConditionService, ConditionOption } from '../../services/condition.service';
import { LoadingService } from '../../shared/services/loading.service';
import { CategoryDto, CreateItemRequest } from '../../models/inventory.model';
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
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', consignorNumber: 'C001' } as Consignor
  ];

  const mockCategories: CategoryDto[] = [
    { CategoryId: '1', Name: 'Clothing' },
    { CategoryId: '2', Name: 'Accessories' }
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
      ItemId: '1',
      Title: 'Test Item',
      Sku: 'TEST-001',
      Price: 25.99,
      Condition: 'LikeNew',
      ConsignorId: '1'
    } as any;

    component.isOpen = true;
    component.editingItem = mockItem;

    fixture.detectChanges();
    component.ngOnChanges();

    expect(component.formData.condition).toBe('LikeNew');
  });

  it('should include condition in form submission for new item', () => {
    component.formData = {
      title: 'Test Item',
      description: 'Test description',
      sku: 'TEST-001',
      price: 25.99,
      consignorId: '1',
      categoryId: '1',
      condition: 'LikeNew'
    };

    const mockResponse = {
      data: {
        ItemId: '1',
        Title: 'Test Item',
        Condition: 'LikeNew'
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

  it('should display loading state while conditions are loading', () => {
    component.isLoadingConditions = true;
    fixture.detectChanges();

    const conditionSelect = fixture.nativeElement.querySelector('#condition');
    expect(conditionSelect.disabled).toBe(true);

    const placeholder = conditionSelect.querySelector('option[value=""]');
    expect(placeholder.textContent.trim()).toBe('Loading conditions...');
  });

  it('should validate that condition is selected', () => {
    component.formData.condition = '';

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