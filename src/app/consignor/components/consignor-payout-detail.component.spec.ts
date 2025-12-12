import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ConsignorPayoutDetailComponent } from './consignor-payout-detail.component';
import { MockConsignorPayoutService } from '../services/mock-consignor-payout.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ConsignorPayoutDetail } from '../models/consignor.models';
import { LOADING_KEYS } from '../constants/loading-keys';

describe('ConsignorPayoutDetailComponent', () => {
  let component: ConsignorPayoutDetailComponent;
  let fixture: ComponentFixture<ConsignorPayoutDetailComponent>;
  let mockPayoutService: jasmine.SpyObj<MockConsignorPayoutService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockActivatedRoute: any;

  const mockPayoutDetail: ConsignorPayoutDetail = {
    payoutId: 'test-payout-1',
    payoutNumber: 1042,
    paymentDate: new Date('2024-12-15T12:00:00.000Z'),
    amount: 187.50,
    paymentMethod: 'Check',
    paymentReference: 'Check #4521',
    status: 'received',
    // Summary breakdown fields
    grossSales: 313.00,
    consignorSplitPercent: 60,
    consignorShare: 187.80,
    fees: 0.30,
    feeDescription: 'Check processing fee',
    netPayout: 187.50,
    items: [
      {
        itemId: '1',
        itemName: 'Vintage Coach Handbag',
        soldDate: new Date('2024-11-25T12:00:00.000Z'),
        salePrice: 65.00,
        consignorEarnings: 39.00
      },
      {
        itemId: '2',
        itemName: 'Mid-Century Table Lamp',
        soldDate: new Date('2024-11-28T12:00:00.000Z'),
        salePrice: 75.00,
        consignorEarnings: 45.00
      },
      {
        itemId: '3',
        itemName: 'Wool Scarf',
        soldDate: new Date('2024-12-01T12:00:00.000Z'),
        salePrice: 30.00,
        consignorEarnings: 18.00
      }
    ]
  };

  beforeEach(async () => {
    const payoutServiceSpy = jasmine.createSpyObj('MockConsignorPayoutService', ['getPayoutDetail', 'downloadPayoutReceipt']);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['start', 'stop', 'isLoading']);

    // Mock ActivatedRoute with paramMap
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('test-payout-1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ConsignorPayoutDetailComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: MockConsignorPayoutService, useValue: payoutServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorPayoutDetailComponent);
    component = fixture.componentInstance;
    mockPayoutService = TestBed.inject(MockConsignorPayoutService) as jasmine.SpyObj<MockConsignorPayoutService>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;

    // Setup default service responses
    mockPayoutService.getPayoutDetail.and.returnValue(of(mockPayoutDetail));
    mockPayoutService.downloadPayoutReceipt.and.returnValue(of(new Blob(['fake pdf'], { type: 'application/pdf' })));
    mockLoadingService.isLoading.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load payout detail on init when payoutId is provided', () => {
    component.ngOnInit();

    expect(mockLoadingService.start).toHaveBeenCalledWith(LOADING_KEYS.PAYOUT_DETAIL);
    expect(mockPayoutService.getPayoutDetail).toHaveBeenCalledWith('test-payout-1');
    expect(component.payoutDetail).toEqual(mockPayoutDetail);
    expect(mockLoadingService.stop).toHaveBeenCalledWith(LOADING_KEYS.PAYOUT_DETAIL);
  });

  it('should handle error when loading payout detail fails', () => {
    const errorMessage = 'Failed to load payout details';
    mockPayoutService.getPayoutDetail.and.returnValue(throwError(() => new Error(errorMessage)));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load payout details. Please try again.');
    expect(mockLoadingService.stop).toHaveBeenCalledWith(LOADING_KEYS.PAYOUT_DETAIL);
  });

  it('should calculate total sale price correctly', () => {
    component.payoutDetail = mockPayoutDetail;

    const totalSalePrice = component.getTotalSalePrice();

    expect(totalSalePrice).toBe(170.00); // 65 + 75 + 30
  });

  it('should return 0 for total sale price when no payout detail', () => {
    component.payoutDetail = null;

    const totalSalePrice = component.getTotalSalePrice();

    expect(totalSalePrice).toBe(0);
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-12-25T12:00:00.000Z');

    const formattedDate = component.formatDate(testDate);

    expect(formattedDate).toBe('Dec 25');
  });

  it('should format full date correctly', () => {
    const testDate = new Date('2024-12-25T12:00:00.000Z');

    const formattedFullDate = component.formatFullDate(testDate);

    expect(formattedFullDate).toBe('December 25, 2024');
  });

  it('should call window.print when printPayout is called', () => {
    spyOn(window, 'print');

    component.printPayout();

    expect(window.print).toHaveBeenCalled();
  });

  it('should download receipt when downloadReceipt is called', () => {
    const mockBlob = new Blob(['fake pdf content'], { type: 'application/pdf' });
    mockPayoutService.downloadPayoutReceipt.and.returnValue(of(mockBlob));
    component.payoutDetail = mockPayoutDetail;

    spyOn(window.URL, 'createObjectURL').and.returnValue('mock-url');
    spyOn(window.URL, 'revokeObjectURL');
    const linkElement = jasmine.createSpyObj('a', ['click']);
    spyOn(document, 'createElement').and.returnValue(linkElement);

    component.downloadReceipt();

    expect(mockPayoutService.downloadPayoutReceipt).toHaveBeenCalledWith('test-payout-1');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(linkElement.download).toBe('payout_1042_receipt.pdf');
    expect(linkElement.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  it('should handle download error gracefully', () => {
    const consoleSpy = spyOn(console, 'error');
    mockPayoutService.downloadPayoutReceipt.and.returnValue(throwError(() => new Error('Download failed')));
    component.payoutDetail = mockPayoutDetail;

    component.downloadReceipt();

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should not attempt download when no payout detail', () => {
    component.payoutDetail = null;

    component.downloadReceipt();

    expect(mockPayoutService.downloadPayoutReceipt).not.toHaveBeenCalled();
  });

  it('should display payout details in template', () => {
    component.payoutDetail = mockPayoutDetail;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('1042');
    expect(compiled.textContent).toContain('December 15, 2024');
    expect(compiled.textContent).toContain('$187.50');
    expect(compiled.textContent).toContain('Check');
    expect(compiled.textContent).toContain('Check #4521');
    expect(compiled.textContent).toContain('Received');
    expect(compiled.textContent).toContain('3 items');
  });

  it('should display items in template', () => {
    component.payoutDetail = mockPayoutDetail;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('Vintage Coach Handbag');
    expect(compiled.textContent).toContain('Mid-Century Table Lamp');
    expect(compiled.textContent).toContain('Wool Scarf');
    expect(compiled.textContent).toContain('$65.00');
    expect(compiled.textContent).toContain('$39.00');
  });

  it('should show loading state when loading', () => {
    mockLoadingService.isLoading.and.returnValue(true);
    component.payoutDetail = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Loading payout details...');
  });

  it('should show error state when error occurs', () => {
    component.error = 'Test error message';
    component.payoutDetail = null;
    mockLoadingService.isLoading.and.returnValue(false);

    // Ensure no ngOnInit is called by preventing the service call
    spyOn(component, 'loadPayoutDetail');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test error message');
    expect(compiled.querySelector('.error button')).toBeTruthy();
  });

  it('should reload payout detail when retry button is clicked', () => {
    component.error = 'Test error';
    fixture.detectChanges();

    const retryButton = fixture.nativeElement.querySelector('button');
    retryButton.click();

    expect(mockPayoutService.getPayoutDetail).toHaveBeenCalledWith('test-payout-1');
  });

  it('should get payoutId from route params', () => {
    expect(component.payoutId).toBe('test-payout-1');
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
  });
});