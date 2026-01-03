import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ConsignorPayoutDetailComponent } from './consignor-payout-detail.component';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ConsignorPayoutDetail } from '../models/consignor.models';
import { LOADING_KEYS } from '../constants/loading-keys';

describe('ConsignorPayoutDetailComponent', () => {
  let component: ConsignorPayoutDetailComponent;
  let fixture: ComponentFixture<ConsignorPayoutDetailComponent>;
  let mockConsignorService: jasmine.SpyObj<ConsignorPortalService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockActivatedRoute: any;

  const mockPayoutDetail: ConsignorPayoutDetail = {
    payoutId: 'payout-123',
    payoutNumber: 2024001,
    paymentDate: new Date('2024-12-15'),
    amount: 285.50,
    paymentMethod: 'Bank Transfer',
    paymentReference: 'TXN-ABC123',
    status: 'sent',
    grossSales: 325.00,
    consignorSplitPercent: 88,
    consignorShare: 286.00,
    fees: 0.50,
    feeDescription: 'ACH fee (0.5%)',
    netPayout: 285.50,
    items: [
      {
        itemId: 'item-1',
        itemName: 'Vintage Leather Jacket',
        soldDate: new Date('2024-11-15'),
        salePrice: 125.00,
        consignorEarnings: 110.00
      },
      {
        itemId: 'item-2',
        itemName: 'Designer Handbag',
        soldDate: new Date('2024-11-20'),
        salePrice: 200.00,
        consignorEarnings: 175.50
      }
    ]
  };

  beforeEach(async () => {
    const consignorServiceSpy = jasmine.createSpyObj('ConsignorPortalService', [
      'getMyPayout'
    ]);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [
      'start',
      'stop',
      'isLoading'
    ]);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('payout-123')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ConsignorPayoutDetailComponent,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: ConsignorPortalService, useValue: consignorServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorPayoutDetailComponent);
    component = fixture.componentInstance;
    mockConsignorService = TestBed.inject(ConsignorPortalService) as jasmine.SpyObj<ConsignorPortalService>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;

    // Setup default mocks
    mockLoadingService.isLoading.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract payout ID from route parameters', () => {
    expect(component.payoutId).toBe('payout-123');
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
  });

  it('should load payout detail on init', () => {
    mockConsignorService.getMyPayout.and.returnValue(of({
      success: true,
      data: mockPayoutDetail
    }));

    component.ngOnInit();

    expect(mockConsignorService.getMyPayout).toHaveBeenCalledWith('payout-123');
    expect(mockLoadingService.start).toHaveBeenCalledWith(LOADING_KEYS.PAYOUT_DETAIL);
    expect(component.payoutDetail).toEqual(mockPayoutDetail);
    expect(component.error).toBeNull();
  });

  it('should handle direct response format', () => {
    mockConsignorService.getMyPayout.and.returnValue(of(mockPayoutDetail));

    component.ngOnInit();

    expect(component.payoutDetail).toEqual(mockPayoutDetail);
  });

  it('should handle error when loading payout detail fails', () => {
    mockConsignorService.getMyPayout.and.returnValue(throwError(() => new Error('Network error')));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load payout details. Please try again.');
    expect(mockLoadingService.stop).toHaveBeenCalledWith(LOADING_KEYS.PAYOUT_DETAIL);
    expect(component.payoutDetail).toBeNull();
  });

  it('should not load payout detail if no payout ID', () => {
    component.payoutId = '';

    component.ngOnInit();

    expect(mockConsignorService.getMyPayout).not.toHaveBeenCalled();
  });

  it('should reload payout detail when loadPayoutDetail is called', () => {
    mockConsignorService.getMyPayout.and.returnValue(of({
      success: true,
      data: mockPayoutDetail
    }));

    component.loadPayoutDetail();

    expect(mockConsignorService.getMyPayout).toHaveBeenCalledWith('payout-123');
    expect(mockLoadingService.start).toHaveBeenCalledWith(LOADING_KEYS.PAYOUT_DETAIL);
    expect(component.error).toBeNull();
  });

  it('should calculate total sale price correctly', () => {
    component.payoutDetail = mockPayoutDetail;

    const totalSalePrice = component.getTotalSalePrice();

    expect(totalSalePrice).toBe(325.00); // 125.00 + 200.00
  });

  it('should return 0 for total sale price when no payout detail', () => {
    component.payoutDetail = null;

    const totalSalePrice = component.getTotalSalePrice();

    expect(totalSalePrice).toBe(0);
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-12-15T10:00:00');
    const formattedDate = component.formatDate(testDate);

    expect(formattedDate).toBe('Dec 15');
  });

  it('should format full date correctly', () => {
    const testDate = new Date('2024-12-15T10:00:00');
    const formattedDate = component.formatFullDate(testDate);

    expect(formattedDate).toBe('December 15, 2024');
  });

  it('should trigger print when printPayout is called', () => {
    spyOn(window, 'print');

    component.printPayout();

    expect(window.print).toHaveBeenCalled();
  });

  it('should call printPayout when downloadReceipt is called', () => {
    component.payoutDetail = mockPayoutDetail;
    spyOn(component, 'printPayout');

    component.downloadReceipt();

    expect(component.printPayout).toHaveBeenCalled();
  });

  it('should not call printPayout when downloadReceipt is called without payout detail', () => {
    component.payoutDetail = null;
    spyOn(component, 'printPayout');

    component.downloadReceipt();

    expect(component.printPayout).not.toHaveBeenCalled();
  });

  it('should display loading state', () => {
    mockLoadingService.isLoading.and.returnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const loadingElement = compiled.querySelector('.loading');

    expect(loadingElement).toBeTruthy();
  });

  it('should display error state', () => {
    component.error = 'Failed to load payout details. Please try again.';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const errorElement = compiled.querySelector('.error');

    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Failed to load payout details. Please try again.');
  });

  it('should display payout detail content when loaded', () => {
    component.payoutDetail = mockPayoutDetail;
    mockLoadingService.isLoading.and.returnValue(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('2024001');
    expect(compiled.textContent).toContain('$285.50');
    expect(compiled.textContent).toContain('TXN-ABC123');
    expect(compiled.textContent).toContain('Vintage Leather Jacket');
    expect(compiled.textContent).toContain('Designer Handbag');
  });

  it('should show correct breakdown values', () => {
    component.payoutDetail = mockPayoutDetail;
    mockLoadingService.isLoading.and.returnValue(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('$325.00'); // gross sales
    expect(compiled.textContent).toContain('$0.50'); // fees
    expect(compiled.textContent).toContain('$285.50'); // net payout
  });

  it('should display items with correct details', () => {
    component.payoutDetail = mockPayoutDetail;
    mockLoadingService.isLoading.and.returnValue(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;

    // Check first item
    expect(compiled.textContent).toContain('Vintage Leather Jacket');
    expect(compiled.textContent).toContain('$125.00');

    // Check second item
    expect(compiled.textContent).toContain('Designer Handbag');
    expect(compiled.textContent).toContain('$200.00');
  });

  it('should handle retry button click in error state', () => {
    component.error = 'Failed to load payout details. Please try again.';
    spyOn(component, 'loadPayoutDetail');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const retryButton = compiled.querySelector('.error button');

    retryButton?.click();

    expect(component.loadPayoutDetail).toHaveBeenCalled();
  });

  it('should expose KEYS for template use', () => {
    expect(component.KEYS).toEqual(LOADING_KEYS);
  });
});