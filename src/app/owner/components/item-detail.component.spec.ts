import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { ItemDetailComponent } from './item-detail.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ItemStatus, ItemCondition } from '../../models/inventory.model';
import { OwnerLayoutComponent } from './owner-layout.component';
import { InitiatePriceChangeComponent } from './modals/initiate-price-change/initiate-price-change.component';

describe('ItemDetailComponent', () => {
  let component: ItemDetailComponent;
  let fixture: ComponentFixture<ItemDetailComponent>;
  let inventoryService: jasmine.SpyObj<InventoryService>;
  let loadingService: jasmine.SpyObj<LoadingService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockItem = {
    itemId: '123',
    consignorId: 'consignor-1',
    sku: 'SKU-123',
    title: 'Test Item',
    price: 85.00,
    consignorAmount: 51.00,
    shopAmount: 34.00,
    commissionRate: 60,
    consignorName: 'Jane Doe',
    status: ItemStatus.Available,
    condition: ItemCondition.New,
    images: [],
    receivedDate: new Date(),
    listedDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const inventoryServiceSpy = jasmine.createSpyObj('InventoryService', ['getItem']);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['start', 'stop', 'isLoading']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteMock = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('123')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ItemDetailComponent],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    inventoryService = TestBed.inject(InventoryService) as jasmine.SpyObj<InventoryService>;
    loadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);

    loadingService.isLoading.and.returnValue(false);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    inventoryService.getItem.and.returnValue(of({ success: true, data: mockItem }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load item details on init', () => {
    inventoryService.getItem.and.returnValue(of({ success: true, data: mockItem }));

    fixture.detectChanges();

    expect(inventoryService.getItem).toHaveBeenCalledWith('123');
    expect(component.item()).toEqual(mockItem);
  });

  it('should navigate back to inventory list', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/owner/inventory']);
  });

  it('should navigate to edit page', () => {
    component.itemId = '123';
    component.editItem();
    expect(router.navigate).toHaveBeenCalledWith(['/owner/inventory', '123', 'edit']);
  });

  it('should open price change modal', () => {
    component.openPriceChangeModal();
    expect(component.showPriceChangeModal()).toBeTruthy();
  });

  it('should close price change modal', () => {
    component.showPriceChangeModal.set(true);
    component.closePriceChangeModal();
    expect(component.showPriceChangeModal()).toBeFalsy();
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(85.50)).toBe('$85.50');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2023-12-07T12:00:00');
    const formatted = component.formatDate(testDate);
    expect(formatted).toBe('Dec 7, 2023');
  });

  it('should calculate days listed correctly', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    component.item.set({
      ...mockItem,
      listedDate: tenDaysAgo
    });

    const days = component.getDaysListed();
    expect(days).toBeCloseTo(10, 1);
  });

  it('should handle missing listedDate in days calculation', () => {
    component.item.set({
      ...mockItem,
      listedDate: undefined
    });

    const days = component.getDaysListed();
    expect(days).toBe(0);
  });
});