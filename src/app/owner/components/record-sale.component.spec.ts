import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { RecordSaleComponent } from './record-sale.component';
import { RecordSaleService, CartItem, SaleRequest } from '../../services/record-sale.service';

describe('RecordSaleComponent', () => {
  let component: RecordSaleComponent;
  let fixture: ComponentFixture<RecordSaleComponent>;
  let mockRecordSaleService: jasmine.SpyObj<RecordSaleService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;

  const mockCartItem: CartItem = {
    item: {
      id: '1',
      name: 'Test Item',
      sku: 'TEST-001',
      price: 10.00,
      consignorName: 'Test Consignor',
      status: 'Available'
    },
    quantity: 1
  };

  const mockSaleResult = {
    transactionId: 'txn-123',
    total: 10.80,
    receiptSent: true
  };

  beforeEach(async () => {
    const recordSaleServiceSpy = jasmine.createSpyObj('RecordSaleService', ['getTaxRate', 'completeSale']);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [RecordSaleComponent, RouterTestingModule],
      providers: [
        { provide: RecordSaleService, useValue: recordSaleServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecordSaleComponent);
    component = fixture.componentInstance;
    mockRecordSaleService = TestBed.inject(RecordSaleService) as jasmine.SpyObj<RecordSaleService>;
    mockToastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tax rate on init', () => {
    mockRecordSaleService.getTaxRate.and.returnValue(of(0.08));

    component.ngOnInit();

    expect(mockRecordSaleService.getTaxRate).toHaveBeenCalled();
    expect(component.taxRate()).toBe(0.08);
  });

  it('should add item to cart', () => {
    component.addToCart(mockCartItem.item);

    expect(component.cartItems().length).toBe(1);
    expect(component.cartItems()[0].item.id).toBe('1');
    expect(component.cartItems()[0].quantity).toBe(1);
  });

  it('should remove item from cart', () => {
    component.cartItems.set([mockCartItem]);

    component.removeFromCart('1');

    expect(component.cartItems().length).toBe(0);
  });

  it('should update payment type', () => {
    component.onPaymentTypeChanged('Card');

    expect(component.paymentType()).toBe('Card');
  });

  it('should update customer email', () => {
    component.onCustomerEmailChanged('test@example.com');

    expect(component.customerEmail()).toBe('test@example.com');
  });

  it('should not complete sale if cart is empty', () => {
    component.cartItems.set([]);

    component.completeSale();

    expect(mockRecordSaleService.completeSale).not.toHaveBeenCalled();
  });

  it('should complete sale successfully', () => {
    mockRecordSaleService.completeSale.and.returnValue(of(mockSaleResult));
    component.cartItems.set([mockCartItem]);
    component.customerEmail.set('test@example.com');

    component.completeSale();

    const expectedSaleRequest: SaleRequest = {
      items: [mockCartItem],
      paymentType: 'Cash',
      customerEmail: 'test@example.com'
    };

    expect(mockRecordSaleService.completeSale).toHaveBeenCalledWith(expectedSaleRequest);
    expect(component.saleResult()).toEqual(mockSaleResult);
    expect(component.saleCompleted()).toBe(true);
    expect(component.isCompletingSale()).toBe(false);
    expect(mockToastrService.success).toHaveBeenCalledWith('Receipt sent to test@example.com', 'Email Sent!', { timeOut: 5000 });
  });

  it('should complete sale without email', () => {
    const saleResultWithoutEmail = { ...mockSaleResult, receiptSent: false };
    mockRecordSaleService.completeSale.and.returnValue(of(saleResultWithoutEmail));
    component.cartItems.set([mockCartItem]);
    component.customerEmail.set('');

    component.completeSale();

    const expectedSaleRequest: SaleRequest = {
      items: [mockCartItem],
      paymentType: 'Cash',
      customerEmail: undefined
    };

    expect(mockRecordSaleService.completeSale).toHaveBeenCalledWith(expectedSaleRequest);
    expect(component.saleResult()).toEqual(saleResultWithoutEmail);
    expect(mockToastrService.success).not.toHaveBeenCalled();
  });

  it('should handle sale completion error', () => {
    mockRecordSaleService.completeSale.and.returnValue(throwError(() => new Error('Network error')));
    component.cartItems.set([mockCartItem]);

    component.completeSale();

    expect(component.isCompletingSale()).toBe(false);
    expect(component.errorMessage()).toBe('Failed to complete the sale. Please check your connection and try again.');
  });

  it('should clear error message', () => {
    component.errorMessage.set('Test error');

    component.clearError();

    expect(component.errorMessage()).toBe('');
  });

  it('should record another sale', () => {
    component.cartItems.set([mockCartItem]);
    component.paymentType.set('Card');
    component.customerEmail.set('test@example.com');
    component.saleCompleted.set(true);
    component.saleResult.set(mockSaleResult);

    component.recordAnotherSale();

    expect(component.cartItems().length).toBe(0);
    expect(component.paymentType()).toBe('Cash');
    expect(component.customerEmail()).toBe('');
    expect(component.saleCompleted()).toBe(false);
    expect(component.saleResult()).toBe(null);
  });

  it('should close sale modal', () => {
    component.saleCompleted.set(true);
    component.saleResult.set(mockSaleResult);

    component.closeSaleModal();

    expect(component.saleCompleted()).toBe(false);
    expect(component.saleResult()).toBe(null);
  });

  it('should compute cart item IDs', () => {
    component.cartItems.set([mockCartItem, { ...mockCartItem, item: { ...mockCartItem.item, id: '2' } }]);

    expect(component.cartItemIds()).toEqual(['1', '2']);
  });
});