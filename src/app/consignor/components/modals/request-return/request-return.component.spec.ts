import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { RequestReturnComponent } from './request-return.component';
import { MockConsignorItemService, ConsignorItemDetailDto } from '../../../services/mock-consignor-item.service';

describe('RequestReturnComponent', () => {
  let component: RequestReturnComponent;
  let fixture: ComponentFixture<RequestReturnComponent>;
  let mockItemService: jasmine.SpyObj<MockConsignorItemService>;

  const mockItem: ConsignorItemDetailDto = {
    id: '1',
    name: 'Test Item',
    primaryImageUrl: 'https://example.com/image.jpg',
    category: 'Test Category',
    status: 'available',
    listedPrice: 100.00,
    consignorEarnings: 60.00,
    splitPercentage: 60,
    listedDate: new Date('2023-01-01'),
    daysListed: 30,
    hasPendingPriceRequest: false,
    requiresResponse: false,
    description: 'Test description',
    brand: 'Test Brand',
    size: 'Medium',
    color: 'Blue',
    condition: 'Good',
    images: [
      { id: '1', url: 'https://example.com/image1.jpg', isPrimary: true, sortOrder: 1 }
    ],
    suggestedPrice: 90.00,
    marketPrice: 95.00,
    ownerNote: 'Test note',
    priceHistory: []
  };

  beforeEach(async () => {
    const itemServiceSpy = jasmine.createSpyObj('MockConsignorItemService', ['requestPriceChange']);

    await TestBed.configureTestingModule({
      imports: [RequestReturnComponent, CommonModule, FormsModule],
      providers: [
        { provide: MockConsignorItemService, useValue: itemServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RequestReturnComponent);
    component = fixture.componentInstance;
    mockItemService = TestBed.inject(MockConsignorItemService) as jasmine.SpyObj<MockConsignorItemService>;

    component.item = mockItem;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.reason).toBe('');
    expect(component.loading).toBe(false);
    expect(component.error).toBeNull();
  });

  it('should track character count correctly', () => {
    component.reason = 'Test reason';
    expect(component.characterCount).toBe(11);
  });

  it('should have correct max characters limit', () => {
    expect(component.maxCharacters).toBe(300);
  });

  it('should disable submit button when loading', () => {
    component.loading = true;
    expect(component.isSubmitDisabled).toBe(true);
  });

  it('should emit null when cancelled', () => {
    spyOn(component.closed, 'emit');
    component.onCancel();
    expect(component.closed.emit).toHaveBeenCalledWith(null);
  });

  it('should handle submit successfully', fakeAsync(() => {
    spyOn(component.closed, 'emit');
    component.reason = 'Test reason for return';

    component.onSubmit();
    expect(component.loading).toBe(true);

    // Fast forward through the setTimeout
    tick(800);

    expect(component.loading).toBe(false);
    expect(component.closed.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      itemId: '1',
      reason: 'Test reason for return',
      status: 'pending'
    }));
  }));

  it('should handle submit with empty reason', fakeAsync(() => {
    spyOn(component.closed, 'emit');
    component.reason = '   '; // whitespace only

    component.onSubmit();
    tick(800);

    expect(component.closed.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      reason: ''
    }));
  }));

  it('should display item information correctly', () => {
    component.show = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h3')?.textContent).toContain('Test Item');
    expect(compiled.querySelector('.meta-value')?.textContent).toContain('$100.00');
  });

  it('should not display modal when show is false', () => {
    component.show = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.modal-backdrop')).toBeFalsy();
  });

  it('should display modal when show is true', () => {
    component.show = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.modal-backdrop')).toBeTruthy();
    expect(compiled.querySelector('.modal-content')).toBeTruthy();
  });

  it('should bind reason textarea correctly', () => {
    component.show = true;
    component.reason = 'Test reason';
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea[name="reason"]') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Test reason');
  });

  it('should update character count display', () => {
    component.show = true;
    component.reason = 'Hello World';
    fixture.detectChanges();

    const characterCount = fixture.nativeElement.querySelector('.character-count');
    expect(characterCount?.textContent?.trim()).toBe('11 / 300');
  });
});