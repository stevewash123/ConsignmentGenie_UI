import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { EarningsWidgetComponent } from './earnings-widget.component';
import { MockEarningsService } from '../services/mock-earnings.service';
import { EarningsSummary } from '../models/consignor.models';

describe('EarningsWidgetComponent', () => {
  let component: EarningsWidgetComponent;
  let fixture: ComponentFixture<EarningsWidgetComponent>;
  let mockEarningsService: jasmine.SpyObj<MockEarningsService>;

  const mockEarningsSummary: EarningsSummary = {
    pending: 127.50,
    pendingTooltip: 'Expected payout date 1/2/2025',
    paidThisMonth: 485.00,
    payoutCountThisMonth: 2,
    nextPayoutDate: new Date('2025-01-02T12:00:00')
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('MockEarningsService', ['getEarningsSummary']);

    await TestBed.configureTestingModule({
      imports: [EarningsWidgetComponent, RouterTestingModule],
      providers: [
        { provide: MockEarningsService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EarningsWidgetComponent);
    component = fixture.componentInstance;
    mockEarningsService = TestBed.inject(MockEarningsService) as jasmine.SpyObj<MockEarningsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load earnings data on init', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));

    component.ngOnInit();

    expect(mockEarningsService.getEarningsSummary).toHaveBeenCalled();
    expect(component.earningsSummary).toEqual(mockEarningsSummary);
    expect(component.loading).toBeFalse();
  });

  it('should display pending amount with info icon', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));
    fixture.detectChanges();

    const pendingAmount = fixture.nativeElement.querySelector('.earning-amount');
    const infoIcon = fixture.nativeElement.querySelector('.info-icon');

    expect(pendingAmount.textContent).toContain('$127.50');
    expect(infoIcon).toBeTruthy();
    expect(infoIcon.getAttribute('title')).toBe('Expected payout date 1/2/2025');
  });

  it('should display paid this month with payout count', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));
    fixture.detectChanges();

    const earningColumns = fixture.nativeElement.querySelectorAll('.earning-column');
    const paidColumn = earningColumns[1];
    const paidAmount = paidColumn.querySelector('.earning-amount');
    const payoutDetail = paidColumn.querySelector('.earning-detail');

    expect(paidAmount.textContent).toContain('$485.00');
    expect(payoutDetail.textContent).toContain('(2 payouts)');
  });

  it('should show current month name dynamically', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));
    fixture.detectChanges();

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
    const monthLabel = fixture.nativeElement.querySelector('.earning-label');

    expect(monthLabel.textContent).toContain(`Paid (${currentMonth})`);
  });

  it('should display next payout date', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));
    fixture.detectChanges();

    const nextPayout = fixture.nativeElement.querySelector('.next-payout');
    expect(nextPayout.textContent).toContain('Next payout: Jan 2');
  });

  it('should display view history link', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));
    fixture.detectChanges();

    const viewHistoryLink = fixture.nativeElement.querySelector('.view-history-link');
    expect(viewHistoryLink.textContent).toContain('View History →');
    expect(viewHistoryLink.getAttribute('routerLink')).toBe('/consignor/payouts');
  });

  it('should handle $0.00 states gracefully', () => {
    const emptyEarnings: EarningsSummary = {
      pending: 0,
      pendingTooltip: 'No pending earnings',
      paidThisMonth: 0,
      payoutCountThisMonth: 0,
      nextPayoutDate: null
    };

    mockEarningsService.getEarningsSummary.and.returnValue(of(emptyEarnings));
    fixture.detectChanges();

    const earningAmounts = fixture.nativeElement.querySelectorAll('.earning-amount');
    expect(earningAmounts[0].textContent).toContain('$0.00'); // Pending
    expect(earningAmounts[1].textContent).toContain('$0.00'); // Paid this month

    const noEarningsMessage = fixture.nativeElement.querySelector('.next-payout');
    expect(noEarningsMessage.textContent).toContain('No earnings yet');
  });

  it('should handle single payout correctly', () => {
    const singlePayoutEarnings: EarningsSummary = {
      pending: 50.00,
      pendingTooltip: 'Expected payout date 2/1/2025',
      paidThisMonth: 100.00,
      payoutCountThisMonth: 1,
      nextPayoutDate: new Date('2025-02-01T12:00:00')
    };

    mockEarningsService.getEarningsSummary.and.returnValue(of(singlePayoutEarnings));
    fixture.detectChanges();

    const payoutDetail = fixture.nativeElement.querySelector('.earning-detail');
    expect(payoutDetail.textContent).toContain('(1 payout)');
  });

  it('should show loading state', () => {
    component.earningsSummary = null;
    component.loading = true;
    fixture.detectChanges();

    const loadingState = fixture.nativeElement.querySelector('.loading-state');
    expect(loadingState).toBeTruthy();
    expect(loadingState.textContent).toContain('Loading earnings...');
  });

  it('should show error state and allow retry', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(throwError('Network error'));
    fixture.detectChanges();

    const errorState = fixture.nativeElement.querySelector('.error-state');
    const retryButton = fixture.nativeElement.querySelector('.retry-button');

    expect(errorState).toBeTruthy();
    expect(errorState.textContent).toContain('Failed to load earnings data');
    expect(retryButton).toBeTruthy();
  });

  it('should retry loading on button click', () => {
    mockEarningsService.getEarningsSummary.and.returnValue(throwError('Network error'));
    fixture.detectChanges();

    // Reset spy to return success on retry
    mockEarningsService.getEarningsSummary.and.returnValue(of(mockEarningsSummary));

    const retryButton = fixture.nativeElement.querySelector('.retry-button');
    retryButton.click();

    expect(mockEarningsService.getEarningsSummary).toHaveBeenCalledTimes(2);
  });

  it('should format payout dates correctly', () => {
    const testDate = new Date('2025-03-15T12:00:00');
    const formatted = component.formatPayoutDate(testDate);
    expect(formatted).toBe('Mar 15');
  });

  it('should get current month name correctly', () => {
    const currentMonth = component.getCurrentMonthName();
    const expectedMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
    expect(currentMonth).toBe(expectedMonth);
  });

  it('should show minimum payout tooltip when below threshold', () => {
    const belowMinimumEarnings: EarningsSummary = {
      pending: 12.50,
      pendingTooltip: 'Minimum payout amount is $25.00',
      paidThisMonth: 0,
      payoutCountThisMonth: 0,
      nextPayoutDate: null
    };

    mockEarningsService.getEarningsSummary.and.returnValue(of(belowMinimumEarnings));
    fixture.detectChanges();

    const infoIcon = fixture.nativeElement.querySelector('.info-icon');
    expect(infoIcon.getAttribute('title')).toBe('Minimum payout amount is $25.00');
  });

  it('should show "Payout Date TBD" tooltip when date is undetermined', () => {
    const undeterminedEarnings: EarningsSummary = {
      pending: 89.50,
      pendingTooltip: 'Payout Date TBD',
      paidThisMonth: 0,
      payoutCountThisMonth: 0,
      nextPayoutDate: null
    };

    mockEarningsService.getEarningsSummary.and.returnValue(of(undeterminedEarnings));
    fixture.detectChanges();

    const infoIcon = fixture.nativeElement.querySelector('.info-icon');
    expect(infoIcon.getAttribute('title')).toBe('Payout Date TBD');
  });
});