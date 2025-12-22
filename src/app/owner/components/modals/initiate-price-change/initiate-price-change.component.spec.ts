import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { InitiatePriceChangeComponent } from './initiate-price-change.component';
import { PriceChangeService } from '../../../../services/price-change.service';
import { ItemDetailDto } from '../../../../models/inventory.model';

describe('InitiatePriceChangeComponent', () => {
  let component: InitiatePriceChangeComponent;
  let fixture: ComponentFixture<InitiatePriceChangeComponent>;
  let priceChangeService: jasmine.SpyObj<PriceChangeService>;

  const mockItem: ItemDetailDto = {
    itemId: '1',
    consignorId: '1',
    consignorName: 'Jane Doe',
    commissionRate: 60,
    sku: 'TEST-001',
    title: 'Test Item',
    description: 'Test description',
    condition: 'New' as any,
    price: 85.00,
    shopAmount: 34.00,
    consignorAmount: 51.00,
    status: 'Available' as any,
    receivedDate: new Date(),
    listedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    images: [
      {
        itemImageId: '1',
        imageUrl: 'https://example.com/image.jpg',
        displayOrder: 1,
        isPrimary: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const priceChangeSpy = jasmine.createSpyObj('PriceChangeService', ['submitPriceChange']);

    await TestBed.configureTestingModule({
      imports: [FormsModule, InitiatePriceChangeComponent],
      providers: [
        { provide: PriceChangeService, useValue: priceChangeSpy }
      ]
    }).compileComponents();

    priceChangeService = TestBed.inject(PriceChangeService) as jasmine.SpyObj<PriceChangeService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InitiatePriceChangeComponent);
    component = fixture.componentInstance;

    // Set up required inputs
    component.isVisible = () => true;
    component.item = mockItem;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current item price', () => {
    component.ngOnInit();
    expect(component.newPrice()).toBe(mockItem.price);
  });

  it('should detect price increase correctly', () => {
    component.newPrice.set(100);
    expect(component.isIncrease()).toBeTruthy();
    expect(component.isDecrease()).toBeFalsy();
  });

  it('should detect price decrease correctly', () => {
    component.newPrice.set(65);
    expect(component.isDecrease()).toBeTruthy();
    expect(component.isIncrease()).toBeFalsy();
  });

  it('should calculate new consignor amount correctly', () => {
    component.newPrice.set(100);
    expect(component.newConsignorAmount()).toBe(60); // 100 * 60%
  });

  it('should require note for price decreases', () => {
    component.newPrice.set(65);
    component.noteToConsignor.set('');

    const isValid = component.validateForm();

    expect(isValid).toBeFalsy();
    expect(component.validationErrors()['note']).toBeDefined();
  });

  it('should not require note for price increases', () => {
    component.newPrice.set(100);
    component.noteToConsignor.set('');

    const isValid = component.validateForm();

    expect(isValid).toBeTruthy();
  });

  it('should submit price change request', () => {
    component.newPrice.set(100);
    priceChangeService.submitPriceChange.and.returnValue(of({
      success: true,
      message: 'Price updated',
      immediateUpdate: true
    }));

    spyOn(component.priceChangeSubmitted, 'emit');
    spyOn(component.close, 'emit');

    component.onSubmit();

    expect(priceChangeService.submitPriceChange).toHaveBeenCalledWith({
      itemId: mockItem.itemId,
      currentPrice: mockItem.price,
      newPrice: 100,
      updatedMarketPrice: undefined,
      noteToConsignor: undefined
    });
    expect(component.priceChangeSubmitted.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(85.50)).toBe('$85.50');
  });

  it('should calculate days listed correctly', () => {
    const days = component.getDaysListed();
    expect(days).toBeCloseTo(60, 1); // Should be around 60 days
  });
});