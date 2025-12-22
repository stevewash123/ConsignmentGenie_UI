import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CartComponent, CartItem } from './cart.component';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  const mockCartItems: CartItem[] = [
    {
      item: {
        id: '1',
        name: 'Test Item 1',
        sku: 'TEST-001',
        price: 10.00,
        consignorName: 'Test Consignor 1',
        status: 'Available'
      },
      quantity: 1
    },
    {
      item: {
        id: '2',
        name: 'Test Item 2',
        sku: 'TEST-002',
        price: 20.00,
        consignorName: 'Test Consignor 2',
        status: 'Available'
      },
      quantity: 2
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent, CommonModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate subtotal correctly', () => {
    fixture.componentRef.setInput('cartItems', mockCartItems);
    fixture.detectChanges();

    // 10.00 * 1 + 20.00 * 2 = 50.00
    expect(component.subtotal()).toBe(50.00);
  });

  it('should calculate tax amount correctly', () => {
    fixture.componentRef.setInput('cartItems', mockCartItems);
    fixture.componentRef.setInput('taxRate', 0.08);
    fixture.detectChanges();

    // 50.00 * 0.08 = 4.00
    expect(component.taxAmount()).toBe(4.00);
  });

  it('should calculate total correctly', () => {
    fixture.componentRef.setInput('cartItems', mockCartItems);
    fixture.componentRef.setInput('taxRate', 0.08);
    fixture.detectChanges();

    // 50.00 + 4.00 = 54.00
    expect(component.total()).toBe(54.00);
  });

  it('should emit item removed event', () => {
    spyOn(component.itemRemoved, 'emit');

    component.removeItem('1');

    expect(component.itemRemoved.emit).toHaveBeenCalledWith('1');
  });

  it('should update payment type and emit event', () => {
    spyOn(component.paymentTypeChanged, 'emit');

    component.onPaymentTypeChange('Card');

    expect(component.selectedPaymentType).toBe('Card');
    expect(component.paymentTypeChanged.emit).toHaveBeenCalledWith('Card');
  });

  it('should update customer email and emit event', () => {
    spyOn(component.customerEmailChanged, 'emit');

    component.onCustomerEmailChange('test@example.com');

    expect(component.customerEmail).toBe('test@example.com');
    expect(component.customerEmailChanged.emit).toHaveBeenCalledWith('test@example.com');
  });

  it('should emit complete sale event when cart has items and not loading', () => {
    spyOn(component.completeSale, 'emit');
    fixture.componentRef.setInput('cartItems', mockCartItems);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    component.onCompleteSale();

    expect(component.completeSale.emit).toHaveBeenCalled();
  });

  it('should not emit complete sale event when cart is empty', () => {
    spyOn(component.completeSale, 'emit');
    fixture.componentRef.setInput('cartItems', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    component.onCompleteSale();

    expect(component.completeSale.emit).not.toHaveBeenCalled();
  });

  it('should not emit complete sale event when loading', () => {
    spyOn(component.completeSale, 'emit');
    fixture.componentRef.setInput('cartItems', mockCartItems);
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    component.onCompleteSale();

    expect(component.completeSale.emit).not.toHaveBeenCalled();
  });

  it('should handle zero tax rate', () => {
    fixture.componentRef.setInput('cartItems', mockCartItems);
    fixture.componentRef.setInput('taxRate', 0);
    fixture.detectChanges();

    expect(component.taxAmount()).toBe(0);
    expect(component.total()).toBe(50.00);
  });

  it('should handle empty cart calculations', () => {
    fixture.componentRef.setInput('cartItems', []);
    fixture.componentRef.setInput('taxRate', 0.08);
    fixture.detectChanges();

    expect(component.subtotal()).toBe(0);
    expect(component.taxAmount()).toBe(0);
    expect(component.total()).toBe(0);
  });

  it('should initialize with default values', () => {
    expect(component.selectedPaymentType).toBe('Cash');
    expect(component.customerEmail).toBe('');
  });
});