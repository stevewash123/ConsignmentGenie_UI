import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';

import { CartComponent, CartItem } from './cart.component';
import { ItemReservationService, CartItemReservation } from '../../services/item-reservation.service';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let mockReservationService: jasmine.SpyObj<ItemReservationService>;

  // ============================================================================
  // Test Data Factories
  // ============================================================================
  const defaultItem: CartItem['item'] = {
    id: 'item-1',
    name: 'Vintage Jacket',
    sku: 'SKU-001',
    price: 49.99,
    consignorName: 'Jane Smith',
    status: 'available',
    isFromSquare: false
  };

  const createCartItem = (overrides: {
    item?: Partial<CartItem['item']>;
    quantity?: number;
    reservation?: CartItemReservation;
    timeRemaining?: number;
  } = {}): CartItem => ({
    item: {
      ...defaultItem,
      ...(overrides.item || {})
    },
    quantity: overrides.quantity ?? 1,
    reservation: overrides.reservation,
    timeRemaining: overrides.timeRemaining
  });

  const createReservation = (overrides: Partial<CartItemReservation> = {}): CartItemReservation => ({
    itemId: 'item-1',
    isActive: true,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    reservedAt: new Date(),
    ...overrides
  });

  const createCartItemWithReservation = (
    itemOverrides: Partial<CartItem['item']> = {},
    reservationOverrides: Partial<CartItemReservation> = {}
  ): CartItem => {
    const reservation = createReservation(reservationOverrides);
    return {
      ...createCartItem({ item: itemOverrides }),
      reservation
    };
  };

  // ============================================================================
  // Setup
  // ============================================================================
  beforeEach(async () => {
    mockReservationService = jasmine.createSpyObj('ItemReservationService', [
      'calculateRemainingTime',
      'isExpiringWarning',
      'formatTime',
      'releaseReservation'
    ]);

    // Default return values
    mockReservationService.calculateRemainingTime.and.returnValue(300000); // 5 minutes
    mockReservationService.isExpiringWarning.and.returnValue(false);
    mockReservationService.formatTime.and.callFake((ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });
    mockReservationService.releaseReservation.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [FormsModule, CartComponent, HttpClientTestingModule],
      providers: [
        { provide: ItemReservationService, useValue: mockReservationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    // Don't call fixture.detectChanges() here - let individual tests control when ngOnInit runs
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================
  describe('initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize with empty cart', () => {
      fixture.detectChanges();
      expect(component.cartItems()).toEqual([]);
    });

    it('should initialize with default payment type', () => {
      fixture.detectChanges();
      expect(component.selectedPaymentType()).toBe('Cash');
    });

    it('should initialize with empty customer email', () => {
      fixture.detectChanges();
      expect(component.customerEmail()).toBe('');
    });

    it('should initialize with empty expired items', () => {
      fixture.detectChanges();
      expect(component.expiredItems()).toEqual([]);
    });

    it('should initialize with empty item timers', () => {
      fixture.detectChanges();
      expect(component.itemTimers().size).toBe(0);
    });

    it('should expose warning threshold constant', () => {
      fixture.detectChanges();
      expect(component.warningThresholdMs).toBe(2 * 60 * 1000);
    });
  });

  // ============================================================================
  // Computed Values Tests
  // ============================================================================
  describe('computed values', () => {
    describe('subtotal', () => {
      it('should return 0 for empty cart', () => {
        fixture.detectChanges();
        expect(component.subtotal()).toBe(0);
      });

      it('should calculate subtotal for single item', () => {
        fixture.componentRef.setInput('cartItems', [createCartItem()]);
        fixture.detectChanges();

        expect(component.subtotal()).toBe(49.99);
      });

      it('should calculate subtotal for multiple items', () => {
        const items = [
          createCartItem({ item: { id: '1', price: 25.00 } }),
          createCartItem({ item: { id: '2', price: 35.50 } }),
          createCartItem({ item: { id: '3', price: 10.00 } })
        ];
        fixture.componentRef.setInput('cartItems', items);
        fixture.detectChanges();

        expect(component.subtotal()).toBe(70.50);
      });

      it('should account for quantity', () => {
        const item = createCartItem();
        item.quantity = 3;
        fixture.componentRef.setInput('cartItems', [item]);
        fixture.detectChanges();

        expect(component.subtotal()).toBeCloseTo(149.97, 2);
      });
    });

    describe('taxAmount', () => {
      it('should return 0 when tax rate is 0', () => {
        fixture.componentRef.setInput('cartItems', [createCartItem()]);
        fixture.componentRef.setInput('taxRate', 0);
        fixture.detectChanges();

        expect(component.taxAmount()).toBe(0);
      });

      it('should calculate tax correctly', () => {
        fixture.componentRef.setInput('cartItems', [createCartItem({ item: { price: 100 } })]);
        fixture.componentRef.setInput('taxRate', 0.08);
        fixture.detectChanges();

        expect(component.taxAmount()).toBe(8);
      });
    });

    describe('total', () => {
      it('should equal subtotal when no tax', () => {
        fixture.componentRef.setInput('cartItems', [createCartItem()]);
        fixture.componentRef.setInput('taxRate', 0);
        fixture.detectChanges();

        expect(component.total()).toBe(component.subtotal());
      });

      it('should equal subtotal plus tax', () => {
        fixture.componentRef.setInput('cartItems', [createCartItem({ item: { price: 100 } })]);
        fixture.componentRef.setInput('taxRate', 0.10);
        fixture.detectChanges();

        expect(component.total()).toBe(110);
      });
    });
  });

  // ============================================================================
  // Timer Management Tests
  // ============================================================================
  describe('timer management', () => {
    describe('getTimeRemaining', () => {
      it('should return undefined for non-existent item', () => {
        expect(component.getTimeRemaining('non-existent')).toBeUndefined();
      });

      it('should return time from itemTimers map', () => {
        const timers = new Map<string, number>();
        timers.set('item-1', 180000);
        component.itemTimers.set(timers);

        expect(component.getTimeRemaining('item-1')).toBe(180000);
      });
    });

    describe('isTimerWarning', () => {
      it('should return false for non-existent item', () => {
        expect(component.isTimerWarning('non-existent')).toBeFalse();
      });

      it('should return false when time remaining is above threshold', () => {
        const timers = new Map<string, number>();
        timers.set('item-1', 3 * 60 * 1000); // 3 minutes
        component.itemTimers.set(timers);

        expect(component.isTimerWarning('item-1')).toBeFalse();
      });

      it('should return true when time remaining is below threshold', () => {
        const timers = new Map<string, number>();
        timers.set('item-1', 1 * 60 * 1000); // 1 minute
        component.itemTimers.set(timers);

        expect(component.isTimerWarning('item-1')).toBeTrue();
      });
    });

    describe('formatTime', () => {
      it('should delegate to reservation service', () => {
        component.formatTime(180000);

        expect(mockReservationService.formatTime).toHaveBeenCalledWith(180000);
      });

      it('should return formatted time string', () => {
        const result = component.formatTime(180000);

        expect(result).toBe('3:00');
      });
    });
  });

  // ============================================================================
  // Timer Update Tests (fakeAsync)
  // ============================================================================
  describe('reservation timer', () => {
    it('should update timers periodically', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      tick(1000); // Advance 1 second
      fixture.detectChanges();

      expect(mockReservationService.calculateRemainingTime).toHaveBeenCalled();
    }));

    it('should check for expirations on each tick', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      // Set timer to expired
      mockReservationService.calculateRemainingTime.and.returnValue(0);

      tick(1000);
      fixture.detectChanges();

      expect(mockReservationService.releaseReservation).toHaveBeenCalled();
    }));

    it('should emit warning when timer approaches threshold', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      const warningSpy = spyOn(component.showExpirationWarning, 'emit');

      // Set timer below warning threshold
      mockReservationService.calculateRemainingTime.and.returnValue(90000); // 1.5 minutes
      mockReservationService.isExpiringWarning.and.returnValue(true);

      tick(1000);
      fixture.detectChanges();

      expect(warningSpy).toHaveBeenCalled();
    }));

    it('should not emit multiple warnings for same item', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      const warningSpy = spyOn(component.showExpirationWarning, 'emit');
      mockReservationService.calculateRemainingTime.and.returnValue(90000);
      mockReservationService.isExpiringWarning.and.returnValue(true);

      // First tick - should emit warning
      tick(1000);
      fixture.detectChanges();

      // Add to expired items to simulate warning already shown
      component.expiredItems.update(list => [...list, 'item-1']);

      // Second tick - should not emit again
      tick(1000);
      fixture.detectChanges();

      expect(warningSpy).toHaveBeenCalledTimes(1);
    }));
  });

  // ============================================================================
  // Remove Item Tests
  // ============================================================================
  describe('removeItem', () => {
    it('should emit itemRemoved event', async () => {
      const item = createCartItem();
      fixture.componentRef.setInput('cartItems', [item]);
      fixture.detectChanges();

      const emitSpy = spyOn(component.itemRemoved, 'emit');

      await component.removeItem('item-1');

      expect(emitSpy).toHaveBeenCalledWith('item-1');
    });

    it('should release reservation if active', async () => {
      const itemWithReservation = createCartItemWithReservation();
      fixture.componentRef.setInput('cartItems', [itemWithReservation]);
      fixture.detectChanges();

      await component.removeItem('item-1');

      expect(mockReservationService.releaseReservation).toHaveBeenCalledWith('item-1');
    });

    it('should not release reservation if not active', async () => {
      const item = createCartItem();
      item.reservation = { ...createReservation(), isActive: false };
      fixture.componentRef.setInput('cartItems', [item]);
      fixture.detectChanges();

      await component.removeItem('item-1');

      expect(mockReservationService.releaseReservation).not.toHaveBeenCalled();
    });

    it('should emit itemRemoved even if release fails', async () => {
      const itemWithReservation = createCartItemWithReservation();
      fixture.componentRef.setInput('cartItems', [itemWithReservation]);
      fixture.detectChanges();

      mockReservationService.releaseReservation.and.returnValue(Promise.reject('Error'));

      const emitSpy = spyOn(component.itemRemoved, 'emit');

      await component.removeItem('item-1');

      expect(emitSpy).toHaveBeenCalledWith('item-1');
    });

    it('should handle item not found gracefully', async () => {
      const emitSpy = spyOn(component.itemRemoved, 'emit');

      await component.removeItem('non-existent');

      expect(emitSpy).toHaveBeenCalledWith('non-existent');
    });
  });

  // ============================================================================
  // Payment Type Tests
  // ============================================================================
  describe('onPaymentTypeChange', () => {
    it('should update selectedPaymentType signal', () => {
      component.onPaymentTypeChange('Card');

      expect(component.selectedPaymentType()).toBe('Card');
    });

    it('should emit paymentTypeChanged event', () => {
      const emitSpy = spyOn(component.paymentTypeChanged, 'emit');

      component.onPaymentTypeChange('Check');

      expect(emitSpy).toHaveBeenCalledWith('Check');
    });

    it('should handle all payment types', () => {
      const paymentTypes = ['Cash', 'Card', 'Check', 'Other'];

      paymentTypes.forEach(type => {
        component.onPaymentTypeChange(type);
        expect(component.selectedPaymentType()).toBe(type);
      });
    });
  });

  // ============================================================================
  // Customer Email Tests
  // ============================================================================
  describe('onCustomerEmailChange', () => {
    it('should update customerEmail signal', () => {
      component.onCustomerEmailChange('test@example.com');

      expect(component.customerEmail()).toBe('test@example.com');
    });

    it('should emit customerEmailChanged event', () => {
      const emitSpy = spyOn(component.customerEmailChanged, 'emit');

      component.onCustomerEmailChange('customer@test.com');

      expect(emitSpy).toHaveBeenCalledWith('customer@test.com');
    });

    it('should handle empty email', () => {
      component.customerEmail.set('test@example.com');

      component.onCustomerEmailChange('');

      expect(component.customerEmail()).toBe('');
    });
  });

  // ============================================================================
  // Complete Sale Tests
  // ============================================================================
  describe('onCompleteSale', () => {
    it('should emit completeSale when cart has items', () => {
      fixture.componentRef.setInput('cartItems', [createCartItem()]);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const emitSpy = spyOn(component.completeSale, 'emit');

      component.onCompleteSale();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit completeSale when cart is empty', () => {
      fixture.componentRef.setInput('cartItems', []);
      fixture.detectChanges();

      const emitSpy = spyOn(component.completeSale, 'emit');

      component.onCompleteSale();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit completeSale when loading', () => {
      fixture.componentRef.setInput('cartItems', [createCartItem()]);
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const emitSpy = spyOn(component.completeSale, 'emit');

      component.onCompleteSale();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Expired Reservation Handling Tests
  // ============================================================================
  describe('expired reservation handling', () => {
    it('should add item to expired list', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      mockReservationService.calculateRemainingTime.and.returnValue(0);

      tick(1000);
      fixture.detectChanges();

      expect(component.expiredItems()).toContain('item-1');
    }));

    it('should release reservation on expiration', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      mockReservationService.calculateRemainingTime.and.returnValue(0);

      tick(1000);
      fixture.detectChanges();

      expect(mockReservationService.releaseReservation).toHaveBeenCalledWith('item-1');
    }));

    it('should remove item from cart on expiration', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      // Set up spy after component is initialized
      const removeSpy = spyOn(component.itemRemoved, 'emit');

      // Set timer to expired
      mockReservationService.calculateRemainingTime.and.returnValue(0);

      // Advance time to trigger timer
      tick(1000);
      fixture.detectChanges();

      expect(removeSpy).toHaveBeenCalledWith('item-1');
    }));

    it('should handle release failure gracefully', fakeAsync(() => {
      // Set up cart items before initializing component
      fixture.componentRef.setInput('cartItems', [createCartItemWithReservation()]);

      // Initialize component and start timers
      fixture.detectChanges(); // This calls ngOnInit and starts the timer

      mockReservationService.releaseReservation.and.returnValue(Promise.reject('Error'));
      mockReservationService.calculateRemainingTime.and.returnValue(0);

      const removeSpy = spyOn(component.itemRemoved, 'emit');

      tick(1000);
      fixture.detectChanges();

      // Should still remove from cart
      expect(removeSpy).toHaveBeenCalledWith('item-1');
    }));
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle cart with Square items', () => {
      const squareItem = createCartItem({
        item: { isFromSquare: true, squareVariationId: 'var-123' }
      });
      fixture.componentRef.setInput('cartItems', [squareItem]);
      fixture.detectChanges();

      expect(component.cartItems()[0].item.isFromSquare).toBeTrue();
    });

    it('should handle items without reservation', () => {
      const item = createCartItem();
      item.reservation = undefined;
      fixture.componentRef.setInput('cartItems', [item]);
      fixture.detectChanges();

      expect(component.getTimeRemaining(item.item.id)).toBeUndefined();
    });

    it('should handle inactive reservations', () => {
      const item = createCartItem();
      item.reservation = { ...createReservation(), isActive: false };
      fixture.componentRef.setInput('cartItems', [item]);
      fixture.detectChanges();

      // Timer should not be set for inactive reservations
      expect(component.itemTimers().has(item.item.id)).toBeFalse();
    });

    it('should handle multiple items with mixed reservation states', fakeAsync(() => {
      const items = [
        createCartItem({ item: { id: 'item-1' } }),
        createCartItemWithReservation({ id: 'item-2' }),
        createCartItem({ item: { id: 'item-3' } })
      ];
      fixture.componentRef.setInput('cartItems', items);
      fixture.detectChanges();

      tick(1000);
      fixture.detectChanges();

      // Only item-2 should have timer set
      expect(component.itemTimers().has('item-2')).toBeTrue();
      expect(component.itemTimers().has('item-1')).toBeFalse();
      expect(component.itemTimers().has('item-3')).toBeFalse();
    }));
  });

  // ============================================================================
  // Input Tests
  // ============================================================================
  describe('inputs', () => {
    it('should accept cartItems input', () => {
      const items = [createCartItem(), createCartItem({ item: { id: '2' } })];
      fixture.componentRef.setInput('cartItems', items);
      fixture.detectChanges();

      expect(component.cartItems().length).toBe(2);
    });

    it('should accept taxRate input', () => {
      fixture.componentRef.setInput('taxRate', 0.0825);
      fixture.detectChanges();

      expect(component.taxRate()).toBe(0.0825);
    });

    it('should accept isLoading input', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      expect(component.isLoading()).toBeTrue();
    });
  });
});