import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';

import { ItemDetailComponent } from './item-detail.component';
import { ShopperCatalogService } from '../../services/shopper-catalog.service';
import { ShopperCartService } from '../../services/shopper-cart.service';
import { ShopperStoreService } from '../../services/shopper-store.service';

describe('ItemDetailComponent', () => {
  let component: ItemDetailComponent;
  let fixture: ComponentFixture<ItemDetailComponent>;
  let mockCatalogService: jasmine.SpyObj<ShopperCatalogService>;
  let mockCartService: jasmine.SpyObj<ShopperCartService>;
  let mockStoreService: jasmine.SpyObj<ShopperStoreService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockCatalogService = jasmine.createSpyObj('ShopperCatalogService', ['getItemDetail']);
    mockCartService = jasmine.createSpyObj('ShopperCartService', ['addItem']);
    mockStoreService = jasmine.createSpyObj('ShopperStoreService', [], {
      currentStore$: new BehaviorSubject(null)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    const mockActivatedRoute = {
      paramMap: new BehaviorSubject(new Map([['storeSlug', 'test-store'], ['itemId', 'item-1']]))
    };

    await TestBed.configureTestingModule({
      imports: [ItemDetailComponent],
      providers: [
        { provide: ShopperCatalogService, useValue: mockCatalogService },
        { provide: ShopperCartService, useValue: mockCartService },
        { provide: ShopperStoreService, useValue: mockStoreService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load item detail', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: {
        itemId: 'item-1',
        title: 'Test Item',
        price: 50,
        description: 'Test Description'
      }
    };

    mockCatalogService.getItemDetail.and.returnValue(of(mockResponse));

    fixture.detectChanges();
    tick();

    expect(mockCatalogService.getItemDetail).toHaveBeenCalledWith('test-store', 'item-1');
  }));

  it('should add item to cart', fakeAsync(() => {
    const mockItem = {
      itemId: 'item-1',
      title: 'Test Item',
      price: 50
    };

    mockCartService.addItem.and.returnValue(true);

    component.addToCart(mockItem, 1);
    tick();

    expect(mockCartService.addItem).toHaveBeenCalledWith(mockItem, 1);
  }));
});