import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';

import { CatalogComponent } from './catalog.component';
import { ShopperCatalogService } from '../../services/shopper-catalog.service';
import { ShopperCartService } from '../../services/shopper-cart.service';
import { ShopperStoreService } from '../../services/shopper-store.service';

describe('CatalogComponent', () => {
  let component: CatalogComponent;
  let fixture: ComponentFixture<CatalogComponent>;
  let mockCatalogService: jasmine.SpyObj<ShopperCatalogService>;
  let mockCartService: jasmine.SpyObj<ShopperCartService>;
  let mockStoreService: jasmine.SpyObj<ShopperStoreService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockCatalogService = jasmine.createSpyObj('ShopperCatalogService', ['getCatalogItems', 'getCategories']);
    mockCartService = jasmine.createSpyObj('ShopperCartService', ['addItem', 'setCurrentStore']);
    mockStoreService = jasmine.createSpyObj('ShopperStoreService', [], {
      currentStore$: new BehaviorSubject(null)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    const mockActivatedRoute = {
      paramMap: new BehaviorSubject(new Map([['storeSlug', 'test-store']])),
      queryParams: new BehaviorSubject({})
    };

    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [
        { provide: ShopperCatalogService, useValue: mockCatalogService },
        { provide: ShopperCartService, useValue: mockCartService },
        { provide: ShopperStoreService, useValue: mockStoreService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load catalog items', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: {
        items: [{ itemId: '1', title: 'Test Item', price: 50 }],
        totalCount: 1
      }
    };

    mockCatalogService.getCatalogItems.and.returnValue(of(mockResponse));

    fixture.detectChanges();
    tick();

    expect(mockCatalogService.getCatalogItems).toHaveBeenCalled();
  }));

  it('should load categories', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: [{ name: 'Electronics', itemCount: 10 }]
    };

    mockCatalogService.getCategories.and.returnValue(of(mockResponse));
    mockCatalogService.getCatalogItems.and.returnValue(of({ success: true, data: { items: [], totalCount: 0 } }));

    fixture.detectChanges();
    tick();

    expect(mockCatalogService.getCategories).toHaveBeenCalled();
  }));
});