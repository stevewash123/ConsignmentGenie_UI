import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { RespondPriceChangeComponent } from './respond-price-change.component';
import { MockConsignorItemService } from '../../services/mock-consignor-item.service';
import { ConsignorItemSummary } from '../../models/consignor-item.model';

describe('RespondPriceChangeComponent', () => {
  let component: RespondPriceChangeComponent;
  let fixture: ComponentFixture<RespondPriceChangeComponent>;
  let mockService: jasmine.SpyObj<MockConsignorItemService>;

  const mockItem: ConsignorItemSummary = {
    id: '1',
    name: 'Test Item',
    thumbnailUrl: 'https://example.com/image.jpg',
    listedPrice: 100.00,
    consignorEarnings: 60.00,
    status: 'available',
    listedDate: new Date('2024-01-01'),
    daysListed: 30,
    priceChangeRequest: {
      requestId: 'pcr-001',
      requestedPrice: 80.00,
      requestedEarnings: 48.00,
      ownerNote: 'Would you like to try a lower price?',
      updatedMarketPrice: 75.00,
      requestDate: new Date('2024-12-01'),
      expiresDate: new Date('2024-12-15')
    }
  };

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('MockConsignorItemService', ['respondToPriceChange']);

    await TestBed.configureTestingModule({
      imports: [RespondPriceChangeComponent],
      providers: [
        { provide: MockConsignorItemService, useValue: serviceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RespondPriceChangeComponent);
    component = fixture.componentInstance;
    mockService = TestBed.inject(MockConsignorItemService) as jasmine.SpyObj<MockConsignorItemService>;

    component.item = mockItem;
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display item information', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test Item');
    expect(compiled.textContent).toContain('$100.00');
    expect(compiled.textContent).toContain('$60.00');
    expect(compiled.textContent).toContain('30');
  });

  it('should display price change request details', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('$80.00');
    expect(compiled.textContent).toContain('$48.00');
    expect(compiled.textContent).toContain('$75.00');
    expect(compiled.textContent).toContain('Would you like to try a lower price?');
  });

  it('should enable submit button when decision is selected', () => {
    const submitBtn = fixture.nativeElement.querySelector('.confirm-button');
    expect(submitBtn.disabled).toBeTruthy();

    component.onDecisionChange('accept');
    fixture.detectChanges();

    expect(submitBtn.disabled).toBeFalsy();
  });

  it('should show error when submitting without decision', () => {
    component.onSubmit();
    expect(component.error).toBe('Please select a decision option.');
  });

  it('should emit close event on cancel', () => {
    spyOn(component.close, 'emit');
    component.onCancel();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close event on backdrop click', () => {
    spyOn(component.close, 'emit');
    const event = { target: fixture.nativeElement.querySelector('.modal-overlay'), currentTarget: fixture.nativeElement.querySelector('.modal-overlay') };
    component.onBackdropClick(event as any);
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not emit close on modal container click', () => {
    spyOn(component.close, 'emit');
    const event = { target: fixture.nativeElement.querySelector('.modal-container'), currentTarget: fixture.nativeElement.querySelector('.modal-overlay') };
    component.onBackdropClick(event as any);
    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it('should successfully submit accept decision', () => {
    mockService.respondToPriceChange.and.returnValue(of({
      success: true,
      message: 'Price updated successfully'
    }));

    spyOn(component.submitted, 'emit');
    spyOn(component.close, 'emit');

    component.selectedDecision = 'accept';
    component.onSubmit();

    expect(mockService.respondToPriceChange).toHaveBeenCalledWith({
      itemId: '1',
      response: {
        requestId: 'pcr-001',
        decision: 'accept',
        consignorNote: undefined
      }
    });

    expect(component.submitted.emit).toHaveBeenCalledWith('Price updated successfully');
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should successfully submit keep current decision', () => {
    mockService.respondToPriceChange.and.returnValue(of({
      success: true,
      message: 'Item will continue at current price'
    }));

    spyOn(component.submitted, 'emit');

    component.selectedDecision = 'keep_current';
    component.onSubmit();

    expect(mockService.respondToPriceChange).toHaveBeenCalledWith({
      itemId: '1',
      response: {
        requestId: 'pcr-001',
        decision: 'keep_current',
        consignorNote: undefined
      }
    });

    expect(component.submitted.emit).toHaveBeenCalledWith('Item will continue at current price');
  });

  it('should successfully submit decline decision with note', () => {
    mockService.respondToPriceChange.and.returnValue(of({
      success: true,
      message: 'Item marked for retrieval'
    }));

    component.selectedDecision = 'decline_retrieve';
    component.consignorNote = 'Thanks for trying';
    component.onSubmit();

    expect(mockService.respondToPriceChange).toHaveBeenCalledWith({
      itemId: '1',
      response: {
        requestId: 'pcr-001',
        decision: 'decline_retrieve',
        consignorNote: 'Thanks for trying'
      }
    });
  });

  it('should handle service error', () => {
    mockService.respondToPriceChange.and.returnValue(throwError(() => new Error('Service error')));

    component.selectedDecision = 'accept';
    component.onSubmit();

    expect(component.error).toBe('Failed to submit response. Please try again.');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should handle service failure response', () => {
    mockService.respondToPriceChange.and.returnValue(of({
      success: false,
      message: 'Request not found'
    }));

    component.selectedDecision = 'accept';
    component.onSubmit();

    expect(component.error).toBe('Request not found');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should get correct decision button classes', () => {
    component.selectedDecision = 'accept';

    expect(component.getDecisionButtonClass('accept')).toContain('decision-option--accept decision-option--selected');
    expect(component.getDecisionButtonClass('keep_current')).toContain('decision-option--keep');
    expect(component.getDecisionButtonClass('decline_retrieve')).toContain('decision-option--decline');

    component.selectedDecision = 'decline_retrieve';
    expect(component.getDecisionButtonClass('decline_retrieve')).toContain('decision-option--decline decision-option--selected');
  });

  it('should calculate price and earnings differences correctly', () => {
    expect(component.getPriceDifference()).toBe(-20.00); // 80 - 100
    expect(component.getEarningsDifference()).toBe(-12.00); // 48 - 60
  });

  it('should format dates correctly', () => {
    const testDate = new Date('2024-12-01');
    expect(component.formatDate(testDate)).toBe('Dec 1, 2024');
  });

  it('should calculate days until expiry correctly', () => {
    const futureDays = component.getDaysUntilExpiry();
    expect(futureDays).toBeGreaterThan(0);
  });

  it('should identify expiring soon correctly', () => {
    // Mock a request expiring in 1 day
    component.item = {
      ...mockItem,
      priceChangeRequest: {
        ...mockItem.priceChangeRequest!,
        expiresDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
      }
    };

    expect(component.isExpiringSoon()).toBeTruthy();
  });

  it('should reset form correctly', () => {
    component.selectedDecision = 'accept';
    component.consignorNote = 'test note';
    component.error = 'test error';
    component.isSubmitting = true;

    component.resetForm();

    expect(component.selectedDecision).toBeNull();
    expect(component.consignorNote).toBe('');
    expect(component.error).toBeNull();
    expect(component.isSubmitting).toBeFalse();
  });
});