import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { RespondPriceChangeComponent } from './respond-price-change.component';
import { PriceChangeNotificationService } from '../../../../services/price-change-notification.service';
import { PriceChangeNotification } from '../../../../models/price-change-notification.model';

describe('RespondPriceChangeComponent', () => {
  let component: RespondPriceChangeComponent;
  let fixture: ComponentFixture<RespondPriceChangeComponent>;
  let mockNotificationService: jasmine.SpyObj<PriceChangeNotificationService>;

  const mockNotification: PriceChangeNotification = {
    id: 'test-1',
    itemId: '1',
    itemName: 'Test Item',
    itemImageUrl: 'https://example.com/image.jpg',
    consignorId: '1',
    consignorName: 'Test Consignor',
    consignorEmail: 'test@example.com',
    currentPrice: 100.00,
    proposedPrice: 80.00,
    consignorCurrentEarnings: 60.00,
    consignorProposedEarnings: 48.00,
    commissionRate: 60,
    updatedMarketPrice: 85.00,
    ownerNote: 'Test note from owner',
    daysListed: 30,
    status: 'pending',
    createdAt: new Date()
  };

  beforeEach(async () => {
    mockNotificationService = jasmine.createSpyObj('PriceChangeNotificationService', ['submitResponse']);

    await TestBed.configureTestingModule({
      imports: [
        RespondPriceChangeComponent,
        FormsModule
      ],
      providers: [
        { provide: PriceChangeNotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RespondPriceChangeComponent);
    component = fixture.componentInstance;

    // Set up required inputs
    component.isVisible = jasmine.createSpy().and.returnValue(true);
    component.notification = mockNotification;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display notification details', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test Item');
    expect(compiled.textContent).toContain('$100.00');
    expect(compiled.textContent).toContain('$80.00');
    expect(compiled.textContent).toContain('$60.00');
    expect(compiled.textContent).toContain('$48.00');
  });

  it('should disable submit button when no action is selected', () => {
    const submitButton = fixture.nativeElement.querySelector('button[type="button"]:last-child');
    expect(submitButton.disabled).toBeTruthy();
  });

  it('should enable submit button when action is selected', () => {
    component.selectAction('accept');
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="button"]:last-child');
    expect(submitButton.disabled).toBeFalsy();
  });

  it('should select action when radio button is clicked', () => {
    const acceptRadio = fixture.nativeElement.querySelector('input[value="accept"]');
    acceptRadio.click();
    fixture.detectChanges();

    expect(component.selectedAction()).toBe('accept');
  });

  it('should emit close event when cancel is clicked', () => {
    spyOn(component.close, 'emit');

    const cancelButton = fixture.nativeElement.querySelector('button:first-child');
    cancelButton.click();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should submit response when form is valid', () => {
    mockNotificationService.submitResponse.and.returnValue(of({ success: true, message: 'Success' }));
    spyOn(component.responseSubmitted, 'emit');
    spyOn(component.close, 'emit');

    component.selectAction('accept');
    component.consignorNote.set('Test note');
    fixture.detectChanges();

    component.onSubmit();

    expect(mockNotificationService.submitResponse).toHaveBeenCalledWith({
      notificationId: 'test-1',
      action: 'accept',
      consignorNote: 'Test note'
    });
  });

  it('should show error message on submission failure', () => {
    mockNotificationService.submitResponse.and.returnValue(of({ success: false, message: 'Error occurred' }));

    component.selectAction('accept');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Error occurred');
  });

  it('should show confirmation dialog for decline action', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.selectAction('decline_and_retrieve');

    const result = component.showConfirmationDialog();

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to decline and retrieve this item? This action cannot be undone.');
    expect(result).toBeTruthy();
  });

  it('should not submit if confirmation is declined', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component, 'onSubmit');
    component.selectAction('decline_and_retrieve');

    component.handleSubmit();

    expect(component.onSubmit).not.toHaveBeenCalled();
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(100.50)).toBe('$100.50');
    expect(component.formatCurrency(25)).toBe('$25.00');
  });

  it('should calculate earnings difference correctly', () => {
    expect(component.getEarningsDifference()).toBe(-12.00);
  });

  it('should get correct action titles', () => {
    expect(component.getActionTitle('accept')).toBe('Accept new price ($80.00)');
    expect(component.getActionTitle('keep_current')).toBe('Keep current price ($100.00)');
    expect(component.getActionTitle('decline_and_retrieve')).toBe('Decline & retrieve item');
  });

  it('should get correct action descriptions', () => {
    expect(component.getActionDescription('accept')).toBe('Your earnings: $48.00');
    expect(component.getActionDescription('keep_current')).toBe('Continue at current price, item stays listed');
    expect(component.getActionDescription('decline_and_retrieve')).toBe('Item will be removed and ready for pickup');
  });

  it('should reset form on ngOnInit', () => {
    component.selectedAction.set('accept');
    component.consignorNote.set('test note');
    component.errorMessage.set('test error');

    component.ngOnInit();

    expect(component.selectedAction()).toBeNull();
    expect(component.consignorNote()).toBe('');
    expect(component.errorMessage()).toBe('');
  });
});