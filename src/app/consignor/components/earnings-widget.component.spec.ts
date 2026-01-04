import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { EarningsWidgetComponent } from './earnings-widget.component';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { EarningsSummary } from '../models/consignor.models';

describe('EarningsWidgetComponent', () => {
  let component: EarningsWidgetComponent;
  let fixture: ComponentFixture<EarningsWidgetComponent>;
  let mockConsignorPortalService: jasmine.SpyObj<ConsignorPortalService>;

  const mockEarningsSummary: EarningsSummary = {
    pending: 127.50,
    pendingTooltip: 'Expected payout date 1/2/2025',
    paidThisMonth: 485.00,
    payoutCountThisMonth: 2,
    nextPayoutDate: new Date('2025-01-02T12:00:00')
  };

  beforeEach(async () => {
    const consignorPortalServiceSpy = jasmine.createSpyObj('ConsignorPortalService', [
      'getEarningsSummary'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        EarningsWidgetComponent,
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule
      ],
      providers: [
        { provide: ConsignorPortalService, useValue: consignorPortalServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EarningsWidgetComponent);
    component = fixture.componentInstance;
    mockConsignorPortalService = TestBed.inject(ConsignorPortalService) as jasmine.SpyObj<ConsignorPortalService>;

    // Set up default mock return value for getEarningsSummary
    mockConsignorPortalService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load earnings summary successfully on init', () => {
    mockConsignorPortalService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));

    component.ngOnInit();

    expect(mockConsignorPortalService.getEarningsSummary).toHaveBeenCalled();
    expect(component.earningsSummary).toEqual(mockEarningsSummary);
    expect(component.loading).toBe(false);
    expect(component.error).toBeNull();
  });

  it('should handle direct response format', () => {
    mockConsignorPortalService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));

    component.ngOnInit();

    expect(component.earningsSummary).toEqual(mockEarningsSummary);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading earnings fails', () => {
    const errorMessage = 'Network error';
    mockConsignorPortalService.getEarningsSummary.and.returnValue(throwError(() => new Error(errorMessage)));

    component.ngOnInit();

    expect(component.error).toBe('Unable to load earnings. Please try again.');
    expect(component.loading).toBe(false);
    expect(component.earningsSummary).toBeNull();
  });

  it('should retry loading earnings when retry is called', () => {
    // First call fails
    mockConsignorPortalService.getEarningsSummary.and.returnValue(throwError(() => new Error('Network error')));
    component.ngOnInit();
    expect(component.error).toBe('Unable to load earnings. Please try again.');

    // Second call succeeds
    mockConsignorPortalService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));

    component.loadEarnings();

    expect(mockConsignorPortalService.getEarningsSummary).toHaveBeenCalledTimes(2);
    expect(component.earningsSummary).toEqual(mockEarningsSummary);
    expect(component.error).toBeNull();
    expect(component.loading).toBe(false);
  });

  it('should format current month name correctly', () => {
    const monthName = component.getCurrentMonthName();
    const currentDate = new Date();
    const expectedMonth = currentDate.toLocaleDateString('en-US', { month: 'short' });

    expect(monthName).toBe(expectedMonth);
  });

  it('should format payout date correctly', () => {
    const testDate = new Date('2025-01-02T12:00:00');
    const formattedDate = component.formatPayoutDate(testDate);

    expect(formattedDate).toBe('Jan 2');
  });

  it('should display loading state initially', () => {
    component.loading = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const loadingElement = compiled.querySelector('.loading-state');

    expect(loadingElement).toBeTruthy();
    expect(loadingElement.textContent).toContain('Loading earnings...');
  });

  it('should display error state when error occurs', () => {
    component.error = 'Unable to load earnings. Please try again.';
    component.loading = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const errorElement = compiled.querySelector('.error-state');

    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Unable to load earnings. Please try again.');
  });

  it('should display earnings data when loaded successfully', () => {
    component.earningsSummary = mockEarningsSummary;
    component.loading = false;
    component.error = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const widgetContent = compiled.querySelector('.widget-content');

    expect(widgetContent).toBeTruthy();
    expect(compiled.textContent).toContain('$127.50');
    expect(compiled.textContent).toContain('$485.00');
    expect(compiled.textContent).toContain('2 payouts');
  });

  it('should show no earnings message when both pending and paid are zero', () => {
    const zeroEarnings: EarningsSummary = {
      pending: 0,
      pendingTooltip: '',
      paidThisMonth: 0,
      payoutCountThisMonth: 0,
      nextPayoutDate: null
    };

    component.earningsSummary = zeroEarnings;
    component.loading = false;
    component.error = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('No earnings yet');
  });

  it('should show next payout date when available', () => {
    component.earningsSummary = mockEarningsSummary;
    component.loading = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Next payout: Jan 2');
  });

  it('should have router link to payouts page', () => {
    component.earningsSummary = mockEarningsSummary;
    component.loading = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const linkElement = compiled.querySelector('a[routerLink="/consignor/payouts"]');

    expect(linkElement).toBeTruthy();
    expect(linkElement.textContent).toContain('View History');
  });
});